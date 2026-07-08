# ---------- Build stage ----------
FROM node:20-alpine AS builder

WORKDIR /app

# Install client deps and build the React app
COPY client/package.json client/package-lock.json* ./client/
RUN cd client && npm install --no-audit --no-fund

COPY client/ ./client/
RUN cd client && npx vite build

# Install server deps (production only)
COPY server/package.json server/package-lock.json* ./server/
RUN cd server && npm install --omit=dev --no-audit --no-fund

COPY server/ ./server/

# ---------- Runtime stage ----------
FROM node:20-alpine AS runtime

ENV NODE_ENV=production \
    PORT=5000 \
    DATABASE_URL=/data/database.sqlite \
    UPLOADS_DIR=/data/uploads

WORKDIR /app

# Runtime tools + native build deps to compile sqlite3 against musl
RUN apk add --no-cache curl python3 py3-setuptools make g++ \
    && addgroup -S app && adduser -S app -G app

# Copy server with deps and rebuild sqlite3 for this Node ABI / musl libc
COPY --from=builder /app/server ./server
RUN cd /app/server && npm rebuild sqlite3 --build-from-source
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