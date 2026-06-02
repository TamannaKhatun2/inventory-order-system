# Build Stage
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies (using cache)
COPY package.json package-lock.json* ./
RUN npm install

# Copy source code and build
COPY . .
RUN npm run build

# Production Stage - Nginx
FROM nginx:1.25-alpine

# Copy built static assets from build stage to nginx html folder
COPY --from=build /app/dist /usr/share/nginx/html

# Expose port
EXPOSE 80

# Run Nginx in foreground
CMD ["nginx", "-g", "daemon off;"]
