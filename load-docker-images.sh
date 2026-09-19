#!/usr/bin/env bash
# Run on the deploy host after scp of *.tar.gz
set -euo pipefail

load_gz() {
  local file="$1"
  echo "Loading ${file}..."
  gunzip -c "$file" | docker load
  rm -f "$file"
}

load_gz ~/ltcl-server.tar.gz
load_gz ~/ltcl-client.tar.gz
load_gz ~/ltcl-admin.tar.gz

echo "Loaded images:"
docker images --format 'table {{.Repository}}\t{{.Tag}}\t{{.Size}}' | head -20
