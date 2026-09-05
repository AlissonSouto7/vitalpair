# ---- build ----
FROM maven:3-eclipse-temurin-26 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
# Cache do repositório Maven entre builds (BuildKit). Testes ficam para o CI.
RUN --mount=type=cache,target=/root/.m2 mvn -B -DskipTests clean package

# ---- runtime ----
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
# Usuário não-root
RUN addgroup -S app && adduser -S app -G app
COPY --from=build /app/target/vitalpair-*.jar app.jar
USER app
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
