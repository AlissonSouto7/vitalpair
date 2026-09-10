# ---- build ----
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /app

# The pom alone first: dependencies change far less often than source, so this layer is
# reused across builds and a code change does not re-download the internet.
COPY pom.xml .
RUN --mount=type=cache,target=/root/.m2 mvn -B -ntp dependency:go-offline

COPY src ./src
# Tests run in CI against real containers; repeating them here would need Docker inside
# Docker and would double the build time for no extra proof.
RUN --mount=type=cache,target=/root/.m2 mvn -B -ntp -DskipTests clean package

# The jar is split into a small application jar plus a lib/ directory of dependencies.
# Copying the two as separate layers means a code-only deploy ships the ~750 kB that
# changed rather than the whole ninety-megabyte jar, because the dependency layer is
# unchanged and already on the machine.
RUN java -Djarmode=tools -jar target/vitalpair-*.jar extract --destination extracted  && mv extracted/vitalpair-*.jar extracted/app.jar

# ---- runtime ----
# Jammy rather than Alpine: Temurin publishes the Alpine JRE for amd64 only, and the server
# is ARM. Found on the first real build ("no match for platform in manifest"), which the
# amd64 build in CI never noticed; CI now asks the registry about every base image.
FROM eclipse-temurin:17-jre-jammy
WORKDIR /app

# curl for the healthcheck below. The image ships none, and a healthcheck that cannot run is
# a container that never reports unhealthy.
RUN apt-get update \
  && apt-get install -y --no-install-recommends curl \
  && rm -rf /var/lib/apt/lists/*

# Never root: a process that is compromised should not be able to write outside its own
# directory, let alone alter the image.
RUN groupadd --system app \
  && useradd --system --gid app --no-create-home --shell /usr/sbin/nologin app

# Dependencies first: they change only when the pom does, so this layer is reused by
# every build that only touched source.
COPY --from=build --chown=app:app /app/extracted/lib/ ./lib/
COPY --from=build --chown=app:app /app/extracted/app.jar ./app.jar

USER app

# The API and the management port from phase 8. Only the first is ever mapped by the proxy.
EXPOSE 8080 9090

# Asks the application itself whether it is ready, not merely whether the process exists.
# A Java process stays alive for a long time after its database connection is gone.
HEALTHCHECK --interval=15s --timeout=5s --start-period=60s --retries=3 \
  # 127.0.0.1, not localhost: localhost resolves to ::1 first inside the container.
  CMD curl -fsS http://127.0.0.1:9090/actuator/health/readiness || exit 1

# MaxRAMPercentage rather than a fixed -Xmx: the heap then follows the container's limit,
# so changing the limit in compose is enough. Without it the JVM sizes the heap from the
# host's total memory and the kernel kills the container under load.
#
# Not verified on Linux. Measured on Docker Desktop for Windows, where the JVM reports a
# 2846 MB heap inside a container limited to 768 MB: the same happens with --memory passed
# directly, so it is that platform not exposing the cgroup limit to the JVM rather than a
# mistake here. On a Linux host, which is where this deploys, the flag is honoured. Check
# it there with:
#   docker exec <container> java -XX:+PrintFlagsFinal -version | grep MaxHeapSize
#
# ExitOnOutOfMemoryError makes the container die and be restarted instead of limping along
# in a state where every request fails.
ENV JAVA_TOOL_OPTIONS="-XX:MaxRAMPercentage=75 -XX:+ExitOnOutOfMemoryError -Djava.security.egd=file:/dev/./urandom"

# The extracted jar keeps a Class-Path pointing at lib/, so plain -jar is enough. The
# loader class is deliberately not named here: which one exists depends on the Boot
# version, and getting it wrong fails only at runtime.
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
