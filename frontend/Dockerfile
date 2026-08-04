# ── Frontend Multi-stage Dockerfile ──
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Nginx production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
# Copy legacy JS files that are not bundled by Vite (no type="module")
COPY --from=build /app/src/js /usr/share/nginx/html/src/js
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
