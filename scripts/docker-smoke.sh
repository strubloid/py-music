#!/usr/bin/env bash
set -euo pipefail

image="py-music:ci"
container="py-music-ci-${RANDOM}-$$"
volume="py-music-ci-${RANDOM}-$$"
secret_key="$(python3 -c 'import secrets; print(secrets.token_urlsafe(48))')"

cleanup() {
  if docker inspect "$container" >/dev/null 2>&1; then
    docker rm -f "$container" >/dev/null
  fi
  if docker volume inspect "$volume" >/dev/null 2>&1; then
    docker volume rm "$volume" >/dev/null
  fi
}
trap cleanup EXIT

docker build --tag "$image" .
docker volume create "$volume" >/dev/null
docker run --rm \
  --user root \
  --entrypoint sh \
  --volume "$volume:/app/data" \
  "$image" \
  -c 'touch /app/data/ci-smoke.db && chmod 0600 /app/data/ci-smoke.db && chown root:root /app/data/ci-smoke.db'
docker run --detach \
  --name "$container" \
  --env "SECRET_KEY=$secret_key" \
  --env PYMUSIC_DISABLE_BACKGROUND_INIT=1 \
  --env DATABASE_URL=sqlite:////app/data/ci-smoke.db \
  --volume "$volume:/app/data" \
  --publish 127.0.0.1::5000 \
  "$image" >/dev/null

binding="$(docker port "$container" 5000/tcp)"
health_url="http://${binding}/api/health"
healthy=false

for attempt in $(seq 1 30); do
  if curl --fail --silent "$health_url" >/dev/null 2>&1; then
    healthy=true
    break
  fi
  sleep 1
done

if [ "$healthy" != true ]; then
  printf 'Container did not become healthy at %s\n' "$health_url" >&2
  docker logs "$container" >&2
  exit 1
fi

logs="$(docker logs "$container" 2>&1)"
case "$logs" in
  *"PermissionError"*|*"readonly database"*|*"[ERROR]"*)
    printf 'Container emitted a startup error after becoming healthy:\n%s\n' "$logs" >&2
    exit 1
    ;;
esac

printf 'Docker smoke test passed: %s\n' "$health_url"
