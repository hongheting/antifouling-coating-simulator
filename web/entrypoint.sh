#!/bin/sh
# Substitute only PORT into nginx config, then start nginx in foreground.
set -e
export PORT="${PORT:-8080}"

TEMPLATE="${NGINX_TEMPLATE:-/etc/nginx/templates/default.conf.template}"
OUT="${NGINX_CONF_OUT:-/etc/nginx/conf.d/default.conf}"

# Drop stock default if present so only our server block listens
rm -f /etc/nginx/conf.d/default.conf 2>/dev/null || true

# Restrict envsubst to PORT so nginx vars ($uri, $host, …) stay intact
envsubst '${PORT}' < "$TEMPLATE" > "$OUT"

# Quick syntax check before exec
nginx -t

exec nginx -g 'daemon off;'
