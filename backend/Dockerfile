# syntax=docker/dockerfile:1.7

# ── deps: install all dependencies (cached unless lockfile changes) ──────────
FROM node:22-alpine AS deps
RUN apk add --no-cache openssl
WORKDIR /app
COPY package.json package-lock.json ./
COPY prisma ./prisma
RUN npm ci --no-audit --no-fund

# ── build: compile the app and the seed script ───────────────────────────────
FROM deps AS build
COPY . .
RUN npx prisma generate \
 && npm run build \
 && npx tsc prisma/seed.ts --outDir dist-seed --module commonjs --target ES2022 --esModuleInterop --skipLibCheck \
 && npm prune --omit=dev

# ── runtime: minimal image, non-root user ────────────────────────────────────
FROM node:22-alpine AS runtime
RUN apk add --no-cache openssl tini
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --from=build --chown=node:node /app/dist-seed ./dist-seed
COPY --from=build --chown=node:node /app/prisma ./prisma
COPY --chown=node:node package.json docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

USER node
EXPOSE 4000
HEALTHCHECK --interval=10s --timeout=3s --start-period=20s --retries=5 \
  CMD wget -qO- http://127.0.0.1:${PORT:-4000}/api/health || exit 1

ENTRYPOINT ["/sbin/tini", "--", "./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]
