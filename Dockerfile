# Use official Node.js image for builder stage with security updates
FROM node:18-alpine as builder

# Update and install security updates
RUN apk add --no-cache --virtual .build-deps \
    build-base \
    python3 \
    && npm install --global npm@latest \
    && npm audit fix --force \
    && apk del .build-deps

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Use a smaller production image with security updates
FROM node:18-alpine

# Update and install security updates
RUN apk add --no-cache --virtual .build-deps \
    build-base \
    python3 \
    && npm install --global npm@latest \
    && npm audit fix --force \
    && apk del .build-deps

WORKDIR /app

# Install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy built files from builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules

# Expose the app port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start:prod"]
