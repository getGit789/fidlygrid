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

# Build the application
RUN npm run build

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist

# Set environment variables
ENV NODE_ENV=production
ENV PORT=8080

# Expose the port
EXPOSE 8080

# Start the application
CMD ["node", "dist/index.js"]