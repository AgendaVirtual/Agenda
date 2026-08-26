#!/bin/sh
set -eu

servidores=$(
  awk '
    /^nameserver/ {
      servidor = $2
      if (index(servidor, ":") > 0) {
        servidor = "[" servidor "]"
      }
      printf "%s%s", separador, servidor
      separador = " "
    }
  ' /etc/resolv.conf
)

if [ -z "$servidores" ]; then
  echo "10-resolver: sem nameserver em /etc/resolv.conf, seguindo sem resolver" >&2
  exit 0
fi

echo "resolver ${servidores} valid=30s;" > /etc/nginx/conf.d/resolver.conf
echo "10-resolver: usando ${servidores}"
