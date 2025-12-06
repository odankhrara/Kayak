# Use an official Node.js runtime as a parent image
FROM node:20-alpine

# Set the working directory in the container
WORKDIR /app

# Create directories for common and listing-service
RUN mkdir -p common listing-service

# Copy package.json and package-lock.json for common
COPY src/services/common/package*.json ./common/

# Copy package.json and package-lock.json for listing-service
COPY src/services/listing-service/package*.json ./listing-service

# Install dependencies and build common module
WORKDIR /app/common
RUN npm install
COPY src/services/common/src ./src
COPY src/services/common/tsconfig.json ./tsconfig.json
RUN npm run build


# Install dependencies for listing-service
WORKDIR /app/listing-service
RUN npm install

# Copy the rest of the listing-service module source code and tsconfig
COPY src/services/listing-service/src ./src
COPY src/services/listing-service/tsconfig.json ./tsconfig.json

# Build the listing-service TypeScript code
RUN npm run build

# Expose the port the service runs on
EXPOSE 8002

# Define the command to run the application
CMD ["npm", "start"]
