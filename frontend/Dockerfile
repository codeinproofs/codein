# Build from the monorepo root so both `frontend/` and `shared/` are in
# context, e.g.:
#   docker build -f frontend/Dockerfile -t codein-frontend .
#
# ---------- Build stage ----------
FROM node:20-alpine AS build

WORKDIR /app

# Shared types live one level above `frontend/` in the monorepo — mirror
# that layout inside the image so `@shared/*` imports resolve correctly.
COPY shared /app/shared

WORKDIR /app/frontend
COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci || npm install

COPY frontend/ ./

ARG VITE_API_URL=http://localhost:8000
ARG VITE_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
ARG VITE_SOLANA_NETWORK=mainnet-beta
ENV VITE_API_URL=$VITE_API_URL \
    VITE_SOLANA_RPC_URL=$VITE_SOLANA_RPC_URL \
    VITE_SOLANA_NETWORK=$VITE_SOLANA_NETWORK

RUN npm run build

# ---------- Runtime stage ----------
FROM nginx:1.27-alpine AS runtime

COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
