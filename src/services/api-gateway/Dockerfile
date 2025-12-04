# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Create directories for common and api-gateway
RUN mkdir -p common api-gateway

# Copy package.json and package-lock.json for common
COPY src/services/common/package*.json ./common/

# Install dependencies and build common module
WORKDIR /app/common
RUN npm install
COPY src/services/common/src ./src
COPY src/services/common/tsconfig.json ./tsconfig.json
RUN npm run build

# Copy package.json and package-lock.json for api-gateway
WORKDIR /app/api-gateway
COPY src/services/api-gateway/package*.json ./package.json

# Install dependencies for api-gateway
RUN npm install

# Copy the rest of the api-gateway module source code and tsconfig
COPY src/services/api-gateway/src ./src
COPY src/services/api-gateway/tsconfig.json ./tsconfig.json

# Build the api-gateway TypeScript code
RUN npm run build

# Expose the port the service runs on
EXPOSE 4000

# Define the command to run the application
CMD ["npm", "start"]
