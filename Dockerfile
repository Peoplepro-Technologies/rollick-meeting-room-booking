# ---------- Build stage ----------
# Builder must match runtime's glibc (Bookworm = 2.36). sqlite3@5.1.7 NAPI
# prebuilds on npm are linked against newer glibc (2.38+) and crash on
# container start with `GLIBC_2.38' not found`. We therefore compile
# sqlite3 from source against Bookworm's toolchain so the binary is
# guaranteed to load in the runtime stage. node-gyp only needs python3 +
# make + g++ which we install below, then discard before the runtime stage.
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install client deps and build the React app
COPY client/package.json client/package-lock.json* ./client/
RUN cd client && npm install --no-audit --no-fund

COPY client/ ./client/
RUN cd client && npx vite build

# Install server deps (production only).
# Skip lifecycle scripts so sqlite3's `prebuild-install` does NOT download
# a glibc-2.38 NAPI prebuild (sqlite3@5.1.7 prebuilds crash on Bookworm's
# glibc 2.36). We then build sqlite3 from source against Bookworm's
# toolchain, guaranteeing the binary is linked against glibc 2.36.
COPY server/package.json server/package-lock.json* ./server/
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/* \
    && cd server \
    && rm -rf /tmp/npmc && mkdir -p /tmp/npmc \
    && npm_config_cache=/tmp/npmc \
       npm install --omit=dev --no-audit --no-fund --foreground-scripts --ignore-scripts \
    && npm_config_cache=/tmp/npmc \
       npm rebuild sqlite3 --build-from-source --foreground-scripts \
    && node -e "const s=require('sqlite3'); new s.Database(':memory:').exec('CREATE TABLE t(x INT); INSERT INTO t VALUES(1)'); console.log('sqlite3 ok')"

# Copy the rest of the server source. `.dockerignore` already excludes
# `node_modules` so the freshly-installed deps above are preserved.
COPY server/ ./server/

# ---------- Runtime stage ----------
FROM node:20-bookworm-slim AS runtime

ENV NODE_ENV=production \
    PORT=5000 \
    DATABASE_URL=/data/database.sqlite \
    UPLOADS_DIR=/data/uploads

WORKDIR /app

# Runtime needs only curl (for HEALTHCHECK) and a non-root user.
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl ca-certificates \
    && rm -rf /var/lib/apt/lists/* \
    && addgroup --system app && adduser --system --ingroup app app

# Copy server (with prebuilt sqlite3 binary) and the built client.
COPY --from=builder /app/server ./server
COPY --from=builder /app/client/dist ./client/dist

# Persistent storage directory (created on first run by the entrypoint)
RUN mkdir -p /data && chown -R app:app /data

# Make the app tree readable/writable by the non-root user, then drop privs
RUN chown -R app:app /app
USER app

# Entrypoint: prepares /data, seeds the DB if missing, then execs the server
COPY --chmod=755 docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

EXPOSE 5000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD curl -fsS http://127.0.0.1:5000/api/health || exit 1

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["node", "server/src/app.js"]