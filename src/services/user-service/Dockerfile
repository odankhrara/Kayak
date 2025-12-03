# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Create directories for common and user-service
RUN mkdir -p common user-service

# Copy package.json and package-lock.json for common
COPY src/services/common/package*.json ./common/

# Install dependencies and build common module
WORKDIR /app/common
RUN npm install
COPY src/services/common/src ./src
COPY src/services/common/tsconfig.json ./
RUN npm run build

# Copy package.json and package-lock.json for user-service
WORKDIR /app/user-service
COPY src/services/user-service/package*.json ./

# Install dependencies for user-service
# This will link the built common module from /app/common/dist as per package.json "file:../common"
RUN npm install

# Copy the rest of the user-service module source code and tsconfig
COPY src/services/user-service/src ./src
COPY src/services/user-service/tsconfig.json ./

# Build the user-service TypeScript code
RUN npm run build

# Expose the port the service runs on
EXPOSE 8001

# Define the command to run the application
CMD ["npm", "start"]
