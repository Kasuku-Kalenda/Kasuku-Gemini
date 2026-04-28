# ─── Kasuku API — Multi-stage Dockerfile ─────────────────────────────────────
#
# Stage 1 (deps):    installe les dépendances de production
# Stage 2 (builder): compile TypeScript → JavaScript
# Stage 3 (runner):  image minimale avec seulement le nécessaire

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile --only=production

FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Utilisateur non-root pour la sécurité
RUN addgroup --system --gid 1001 nodejs && \
    adduser  --system --uid 1001 fastify

# Copier uniquement ce dont on a besoin
COPY --from=deps    /app/node_modules ./node_modules
COPY --from=builder /app/dist         ./dist
COPY package.json ./

USER fastify

EXPOSE 4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["node", "dist/index.js"]
