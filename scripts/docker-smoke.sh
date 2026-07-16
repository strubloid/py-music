#!/usr/bin/env bash
set -euo pipefail

image="py-music:ci"
container="py-music-ci-${RANDOM}-$$"
secret_key="$(python3 -c 'import secrets; print(secrets.token_urlsafe(48))')"

cleanup() {
  if docker inspect "$container" >/dev/null 2>&1; then
    docker rm -f "$container" >/dev/null
  fi
}
trap cleanup EXIT

docker build --tag "$image" .
docker run --detach \
  --name "$container" \
  --env "SECRET_KEY=$secret_key" \
  --env PYMUSIC_DISABLE_BACKGROUND_INIT=1 \
  --env DATABASE_URL=sqlite:////app/data/ci-smoke.db \
  --publish 127.0.0.1::5000 \
  "$image" >/dev/null

binding="$(docker port "$container" 5000/tcp)"
health_url="http://${binding}/api/health"

for attempt in $(seq 1 30); do
  if curl --fail --silent "$health_url" >/dev/null 2>&1; then
    printf 'Docker smoke test passed: %s\n' "$health_url"
    exit 0
  fi
  sleep 1
done

printf 'Container did not become healthy at %s\n' "$health_url" >&2
docker logs "$container" >&2
exit 1
