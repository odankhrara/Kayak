FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --silent

# Set API URL for production build
ENV VITE_API_URL="http://34.207.109.78:4000"

# Copy source and build
COPY . .
RUN npx tsc --noEmit || true
RUN npm run build

FROM nginx:stable-alpine

# Ensure curl is available for runtime healthchecks
RUN apk add --no-cache curl

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx config (we include a simple SPA fallback and proxy for /api)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
