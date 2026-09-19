#!/usr/bin/env bash
# Usage: ./push-docker-images.sh 1.0.0
set -euo pipefail

VERSION="${1:?Usage: $0 <version>}"
HOST="${DEPLOY_HOST:-user@your-server}"
REGISTRY="${CONTAINER_REGISTRY:-registry.example.com/cricket-sports-management/}"
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

ARCHIVES=(./ltcl-server.tar.gz ./ltcl-client.tar.gz ./ltcl-admin.tar.gz)

cleanup() {
  rm -f "${ARCHIVES[@]}"
}
trap cleanup EXIT

echo "Build: $VERSION"
echo "Saving compressed images..."

save_gz() {
  local name="$1"
  local image="${REGISTRY}${name}:${VERSION}"
  local out="./ltcl-${name}.tar.gz"
  echo "docker save ${image} | gzip > ${out}"
  docker save "$image" | gzip -1 >"$out"
  ls -lh "$out"
}

save_gz server
save_gz client
save_gz admin

echo
echo "Uploading to ${HOST}..."
scp "${ARCHIVES[@]}" "${HOST}:~/"

echo "Done. On server run: ./load-docker-images.sh"
