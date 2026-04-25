FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --omit=dev

# Copy source code and seeders
COPY . .

# Expose port
EXPOSE 5000

# Start application
CMD ["node", "server.js"]
