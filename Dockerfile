# Use official Node.js image
FROM node:18-alpine

WORKDIR /app

# Copy package files and install dependencies
COPY package*.json ./
RUN npm install

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Remove development dependencies and install only production dependencies
RUN npm prune --production

# Expose the app port
EXPOSE 3000

# Start the app
CMD ["npm", "run", "start:prod"]