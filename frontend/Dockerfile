FROM nginx:alpine

# Copy custom nginx configuration
COPY nginx.conf.template /etc/nginx/nginx.conf.template

# Copy frontend files
COPY templates/ /usr/share/nginx/html

EXPOSE 80

CMD ["/bin/sh", "-c", "envsubst '$API_BACKEND' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf && nginx -g 'daemon off;'"]
