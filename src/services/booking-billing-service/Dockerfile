# Use an official Node.js runtime as a parent image
FROM node:18-alpine

# Set the working directory in the container
WORKDIR /app

# Create directories for common and booking-billing-service
RUN mkdir -p common booking-billing-service

# Copy package.json and package-lock.json for common
COPY src/services/common/package*.json ./common/

# Install dependencies and build common module
WORKDIR /app/common
RUN npm install
COPY src/services/common/src ./src
COPY src/services/common/tsconfig.json ./tsconfig.json
RUN npm run build

# Copy package.json and package-lock.json for booking-billing-service
WORKDIR /app/booking-billing-service
COPY src/services/booking-billing-service/package*.json ./package.json

# Install dependencies for booking-billing-service
RUN npm install

# Copy the rest of the booking-billing-service module source code and tsconfig
COPY src/services/booking-billing-service/src ./src
COPY src/services/booking-billing-service/tsconfig.json ./tsconfig.json

# Build the booking-billing-service TypeScript code
RUN npm run build

# Expose the port the service runs on
EXPOSE 8003

# Define the command to run the application
CMD ["npm", "start"]
