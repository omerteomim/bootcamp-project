
# Stage 1: Build the React application
FROM node:18-alpine as builder

WORKDIR /app

COPY package*.json ./

RUN npm ci --only=production

COPY . .

RUN npm run build

# Stage 2: Serve the React application with Nginx
FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf.template /etc/nginx/nginx.conf.template

# Copy the built React app from the builder stage
COPY --from=builder /app/build /usr/share/nginx/html

EXPOSE 80

CMD ["/bin/sh", "-c", "envsubst '$API_BACKEND' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]
