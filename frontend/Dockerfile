# ---- build ----
FROM node:22-alpine AS build
WORKDIR /app

# The lockfile alone first, so a source change does not reinstall every dependency.
COPY package.json package-lock.json ./
# ci, not install: it installs exactly what the lockfile says and fails if the two
# disagree, which is what makes a build reproducible.
RUN npm ci

COPY . .

# Vite bakes VITE_* variables into the bundle at build time, so anything the browser needs
# has to be here rather than in the container's environment: setting it at run time changes
# nothing, because the JavaScript was already written.
#
# This is the Google sign-in client id, which is public by design (it travels in the page
# to every visitor) and is what the Google console ties to the allowed origins. Empty is a
# valid value: the button then does not render at all, which is the correct behaviour for
# an environment where Google sign-in is not set up.
#
# The API URL is deliberately not here. It is a relative path resolved against whatever
# origin serves the page, so one image is correct for staging and production alike.
ARG VITE_GOOGLE_CLIENT_ID=""
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID

RUN npm run build

# ---- runtime ----
# The unprivileged image runs as an ordinary user and listens on 8080 rather than 80,
# because binding a port below 1024 is what forces the stock nginx image to start as root.
FROM nginxinc/nginx-unprivileged:1.29-alpine
WORKDIR /usr/share/nginx/html

# Only the built assets. The sources, node_modules and the toolchain stay behind: they are
# hundreds of megabytes and every one of them is attack surface in a public image.
COPY --from=build /app/dist ./
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

# Asks nginx for the page it serves. A container whose nginx is alive but whose files are
# missing would otherwise report healthy while serving 404 to everyone.
HEALTHCHECK --interval=15s --timeout=5s --start-period=10s --retries=3 \
  # 127.0.0.1 rather than localhost: inside the container localhost resolves to ::1 first,
  # and nginx binds only IPv4 here, so the check was refused while the server was fine.
  CMD wget -qO- http://127.0.0.1:8080/ > /dev/null || exit 1
