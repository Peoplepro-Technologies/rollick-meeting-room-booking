# ---------- Build stage ----------
# Avoid Alpine (musl libc) because the sqlite3@5.x prebuilt binary targets
# glibc and `npm rebuild --build-from-source` (the only way to recompile for
# musl) requires node-gyp to fetch Node headers from unofficial-builds.nodejs.org
# — frequently unreachable from restricted build networks (original build failure).
# We also pin a clean npm cache so the sqlite3 prebuild is fetched fresh and
# the resulting binary actually loads.
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Install client deps and build the React app
COPY client/package.json client/package-lock.json* ./client/
RUN cd client && npm install --no-audit --no-fund

COPY client/ ./client/
RUN cd client && npx vite build

# Install server deps (production only). Force a fresh, isolated npm cache so
# the sqlite3 NAPI prebuilt download is reproducible and the binary actually
# loads (the builder cache can otherwise return a stale binary for this host).
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm_config_cache=/tmp/npmc \
    && npm install --omit=dev --no-audit --no-fund --foreground-scripts

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