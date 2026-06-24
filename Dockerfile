# Stage 1: Build the application
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install all dependencies (including dev/build dependencies)
RUN npm ci

# Copy the rest of the application files
COPY . .

# Build both static frontend and compiled CommonJS server
RUN npm run build

# Stage 2: Production release
FROM node:20-alpine AS runner

WORKDIR /app

# Establish environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Install only essential production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy built output and optional database state
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/galaxy_state.json* ./

# Expose server port
EXPOSE 3000

# Run the compiled production application
CMD ["npm", "start"]
