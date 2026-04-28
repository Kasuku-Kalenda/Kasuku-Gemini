# ─── Kasuku Frontend — Multi-stage Dockerfile ────────────────────────────────
#
# Stage 1 (builder): installe les dépendances et construit le bundle Vite
# Stage 2 (runner):  Nginx Alpine serve les fichiers statiques
#
# Usage:
#   docker build --build-arg VITE_API_URL=https://api.kasuku.app/v1 -t kasuku-frontend .

# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copier les manifestes en premier (cache layer efficace)
COPY package.json package-lock.json ./

RUN npm ci --frozen-lockfile

# Copier le reste du code source
COPY . .

# Variables passées au build Vite (doivent commencer par VITE_)
ARG VITE_API_URL=http://localhost/api/v1
ARG VITE_GEMINI_API_KEY=""
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GEMINI_API_KEY=$VITE_GEMINI_API_KEY

RUN npm run build

# ── Stage 2: Serve ────────────────────────────────────────────────────────────
FROM nginx:1.27-alpine AS runner

# Config Nginx optimisée pour SPA React (gestion du routing côté client)
COPY docker/nginx/spa.conf /etc/nginx/conf.d/default.conf

# Copier le build Vite
COPY --from=builder /app/dist /usr/share/nginx/html

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
