# ── Node.js Backend Dockerfile ──
FROM node:20-alpine AS base

WORKDIR /app

# Copy dependency definitions
COPY package*.json ./

# Install production dependencies
RUN npm ci --only=production

# Copy application source code
COPY . .

EXPOSE 5000

ENV PORT=5000
ENV NODE_ENV=production

CMD ["npm", "start"]
