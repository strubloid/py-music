#!/usr/bin/env bash
set -euo pipefail

# Create a compressed, timestamped backup and prune older copies. Configure this
# command in the platform scheduler with BACKUP_DIR on durable encrypted storage.
backup_dir="${BACKUP_DIR:?Set BACKUP_DIR to durable encrypted backup storage}"
database_url="${DATABASE_URL:-sqlite:///${PWD}/strubloid.db}"
retention_days="${BACKUP_RETENTION_DAYS:-30}"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"

mkdir -p "$backup_dir"

if [[ "$database_url" == sqlite:///* ]]; then
  database_path="${database_url#sqlite:///}"
  if [[ ! -f "$database_path" ]]; then
    printf 'SQLite database not found: %s\n' "$database_path" >&2
    exit 1
  fi
  sqlite3 "$database_path" ".backup '$backup_dir/strubloid-$timestamp.sqlite'"
  gzip --force "$backup_dir/strubloid-$timestamp.sqlite"
elif [[ "$database_url" == postgresql://* || "$database_url" == postgres://* ]]; then
  pg_dump --format=custom --no-owner --file="$backup_dir/strubloid-$timestamp.dump" "$database_url"
else
  printf 'Unsupported DATABASE_URL scheme. Use sqlite:/// or postgresql://.\n' >&2
  exit 1
fi

find "$backup_dir" -maxdepth 1 -type f -name 'strubloid-*' -mtime "+$retention_days" -delete
printf 'Backup created in %s\n' "$backup_dir"
