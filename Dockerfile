# Multi-stage Dockerfile for Magic Benchmarking Framework
FROM mcr.microsoft.com/playwright:v1.56.1-jammy AS base

# Set working directory
WORKDIR /app

# Install Node.js dependencies
COPY package*.json ./
COPY dashboard/package*.json ./dashboard/

# Install root dependencies
RUN npm ci --only=production

# Install dashboard dependencies
WORKDIR /app/dashboard
RUN npm ci --only=production

# Go back to root
WORKDIR /app

# Copy source code
COPY . .

# Build the TypeScript project
RUN npm run build

# Build the Next.js dashboard
RUN npm run web:build

# Stage 2: Runtime image for benchmarking
FROM mcr.microsoft.com/playwright:v1.56.1-jammy AS benchmarking

WORKDIR /app

# Copy built application and dependencies
COPY --from=base /app/dist ./dist
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package*.json ./
COPY --from=base /app/src ./src

# Create results directory
RUN mkdir -p ./dashboard/public/results

# Install Playwright browsers
RUN npx playwright install chromium firefox webkit

# Set environment variables
ENV NODE_ENV=production
ENV PLAYWRIGHT_BROWSERS_PATH=/ms-playwright

# Expose port for potential debugging
EXPOSE 3000

# Default command to run benchmarking
CMD ["npm", "start"]

# Stage 3: Production image for dashboard
FROM node:18-alpine AS dashboard

WORKDIR /app

# Copy dashboard build and dependencies
COPY --from=base /app/dashboard/.next ./dashboard/.next
COPY --from=base /app/dashboard/node_modules ./dashboard/node_modules
COPY --from=base /app/dashboard/package*.json ./dashboard/
COPY --from=base /app/dashboard/public ./dashboard/public
COPY --from=base /app/dashboard/next.config.js ./dashboard/

# Set working directory to dashboard
WORKDIR /app/dashboard

# Expose Next.js port
EXPOSE 3000

# Start the dashboard
CMD ["npm", "start"]
