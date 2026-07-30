# =============================================
# Stage 1 : build de la SPA Vite
# =============================================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
# --legacy-peer-deps : lucide-react 0.363 déclare React <= 18 alors que le
# projet est en React 19. Retirer ce flag une fois lucide-react mis à jour.
RUN npm ci --legacy-peer-deps

COPY . .

# Vite inline les variables VITE_* au build : l'URL de l'API est donc figée
# dans le bundle et doit être fournie ici, pas au runtime du conteneur.
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN test -n "$VITE_API_URL" || (echo "❌ build-arg VITE_API_URL manquant" && exit 1)
RUN npm run build

# =============================================
# Stage 2 : service des fichiers statiques
# =============================================
FROM nginx:1.27-alpine AS runtime

RUN apk add --no-cache wget

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/dist /usr/share/nginx/html

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget -qO- http://localhost:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
