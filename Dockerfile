# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and install dependencies
COPY package.json package-lock.json* ./
RUN npm ci

# Copy the rest of the source code
COPY . .

# Build the TypeScript project
RUN npm run build

# Stage 2: Create the final production image
FROM node:20-alpine

# Set up a non-root user for security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

WORKDIR /app

# Copy only the built application and necessary dependencies from the builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json .

# Set the entrypoint to run the built application
ENTRYPOINT ["node", "dist/index.js"]

# Default command to display help
CMD ["--help"]