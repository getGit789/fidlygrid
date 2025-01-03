# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./
COPY vite.config.ts ./

# Install dependencies
RUN npm ci

# Copy source files
COPY client/ ./client/
COPY server/ ./server/
COPY db/ ./db/
COPY drizzle/ ./drizzle/
COPY drizzle.config.ts ./
COPY tailwind.config.ts ./
COPY postcss.config.js ./
COPY theme.json ./

# Build the client and server
RUN npm run build
RUN npx tsc --project tsconfig.json

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built files
COPY --from=builder /app/dist/public ./dist/public
COPY --from=builder /app/dist/server ./dist/server
COPY --from=builder /app/dist/db ./dist/db
COPY drizzle/ ./drizzle/
COPY drizzle.config.ts ./

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose the port
EXPOSE 8080

# Start the application
CMD ["node", "dist/server/index.js"]