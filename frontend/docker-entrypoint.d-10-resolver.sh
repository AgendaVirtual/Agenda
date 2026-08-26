#!/bin/sh
set -eu

servidores=$(awk '/^nameserver/ { printf "%s ", $2 }' /etc/resolv.conf)

if [ -z "$servidores" ]; then
  echo "10-resolver: sem nameserver em /etc/resolv.conf, seguindo sem resolver" >&2
  exit 0
fi

echo "resolver ${servidores}valid=30s;" > /etc/nginx/conf.d/resolver.conf
echo "10-resolver: usando ${servidores}"
