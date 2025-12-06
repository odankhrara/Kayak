# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Create directories for common and analytics-service
RUN mkdir -p common analytics-service

# Copy package.json and package-lock.json for common
COPY src/services/common/package*.json ./common/

# Install dependencies and build common module
WORKDIR /app/common
RUN npm install
COPY src/services/common/src ./src
COPY src/services/common/tsconfig.json ./tsconfig.json
RUN npm run build

# Copy package.json and package-lock.json for analytics-service
WORKDIR /app/analytics-service
COPY src/services/analytics-service/package*.json ./package.json

# Install dependencies for analytics-service
RUN npm install

# Copy the rest of the analytics-service module source code and tsconfig
COPY src/services/analytics-service/src ./src
COPY src/services/analytics-service/tsconfig.json ./tsconfig.json

# Build the analytics-service TypeScript code
RUN npm run build

# Expose the port the service runs on
EXPOSE 8004

# Define the command to run the application
CMD ["npm", "start"]
