# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Create directories for common and admin-service
RUN mkdir -p common admin-service

# Copy package.json and package-lock.json for common
COPY src/services/common/package*.json ./common/

# Install dependencies and build common module
WORKDIR /app/common
RUN npm install
COPY src/services/common/src ./src
COPY src/services/common/tsconfig.json ./tsconfig.json
RUN npm run build

# Copy package.json and package-lock.json for admin-service
WORKDIR /app/admin-service
COPY src/services/admin-service/package*.json ./package.json

# Install dependencies for admin-service
RUN npm install

# Copy the rest of the admin-service module source code and tsconfig
COPY src/services/admin-service/src ./src
COPY src/services/admin-service/tsconfig.json ./tsconfig.json

# Build the admin-service TypeScript code
RUN npm run build

# Expose the port the service runs on
EXPOSE 8006

# Define the command to run the application
CMD ["npm", "start"]
