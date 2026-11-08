# Antifouling Coating Simulator — static web (nginx)
# Build from coating-simulator repo root:
#   docker build --platform linux/amd64 -f web/Dockerfile -t coating-simulator-web:0.6.5 .
#
# Runtime: PORT (default 8080), GET /health → JSON ok
# Copies only UI static assets (no rebuild-snapshot / build-public-feed scripts).

FROM nginx:alpine

LABEL org.opencontainers.image.title="coating-simulator-web" \
      org.opencontainers.image.version="0.6.5" \
      org.opencontainers.image.description="Static evidence panel for antifouling coating simulator"

# envsubst for PORT injection
RUN apk add --no-cache gettext \
 && rm -f /etc/nginx/conf.d/default.conf

COPY web/nginx.conf.template /etc/nginx/templates/default.conf.template
COPY web/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# UI only — do not COPY ui/*.py or data-snapshot.json build helpers
COPY ui/index.html ui/data-snapshot.js ui/world-land.js ui/favicon.svg ui/favicon.ico ui/favicon-32.png ui/favicon-16.png ui/favicon-512.png ui/apple-touch-icon.png /usr/share/nginx/html/

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["/entrypoint.sh"]
