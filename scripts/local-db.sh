#!/usr/bin/env bash
set -euo pipefail

m1_root="$(cd "$(dirname "$0")/.." && pwd)"
m1_data_dir="$m1_root/.data/postgres"
m1_log_file="$m1_root/.data/postgres.log"
m1_port="55432"
m1_database="xiangjiang2035_dev"
m1_test_database="xiangjiang2035_test"
m1_action="${1:-status}"

mkdir -p "$m1_root/.data"

initialize_cluster() {
  if [[ ! -f "$m1_data_dir/PG_VERSION" ]]; then
    initdb -D "$m1_data_dir" --auth=trust --username=postgres --no-locale --encoding=UTF8 >/dev/null
  fi
}

start_database() {
  initialize_cluster
  if ! pg_ctl -D "$m1_data_dir" status >/dev/null 2>&1; then
    pg_ctl -D "$m1_data_dir" -l "$m1_log_file" -o "-p $m1_port" -w start >/dev/null
  fi
  if ! psql "postgresql://postgres@localhost:$m1_port/postgres" -tAc \
    "SELECT 1 FROM pg_database WHERE datname = '$m1_database'" | grep -q 1; then
    createdb -h localhost -p "$m1_port" -U postgres "$m1_database"
  fi
  if ! psql "postgresql://postgres@localhost:$m1_port/postgres" -tAc \
    "SELECT 1 FROM pg_database WHERE datname = '$m1_test_database'" | grep -q 1; then
    createdb -h localhost -p "$m1_port" -U postgres "$m1_test_database"
  fi
  echo "PostgreSQL ready: postgresql://postgres@localhost:$m1_port/$m1_database"
  echo "Test database ready: postgresql://postgres@localhost:$m1_port/$m1_test_database"
}

case "$m1_action" in
  start)
    start_database
    ;;
  stop)
    if [[ -f "$m1_data_dir/PG_VERSION" ]] && pg_ctl -D "$m1_data_dir" status >/dev/null 2>&1; then
      pg_ctl -D "$m1_data_dir" -w stop >/dev/null
    fi
    echo "PostgreSQL stopped"
    ;;
  status)
    if [[ -f "$m1_data_dir/PG_VERSION" ]]; then
      pg_ctl -D "$m1_data_dir" status
    else
      echo "PostgreSQL cluster not initialized"
      exit 1
    fi
    ;;
  *)
    echo "Usage: $0 {start|stop|status}" >&2
    exit 2
    ;;
esac
