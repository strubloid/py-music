#!/bin/sh
set -eu

data_dir="${PYMUSIC_DATA_DIR:-/app/data}"

mkdir -p "$data_dir"
chown -R app:app "$data_dir"

export HOME=/home/app
export USER=app
export LOGNAME=app

exec setpriv --reuid=app --regid=app --init-groups "$@"
