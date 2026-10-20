#!/usr/bin/env bash
set -euo pipefail

m1_root="$(cd "$(dirname "$0")/.." && pwd)"
m1_tmp="$(mktemp -d /tmp/xiangjiang-m1.XXXXXX)"
m1_cluster="$m1_tmp/postgres"
m1_pg_log="$m1_tmp/postgres.log"
m1_app_log="$m1_tmp/next.log"
m1_pg_port="$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1]); s.close()')"
m1_app_port="$(python3 -c 'import socket; s=socket.socket(); s.bind(("127.0.0.1", 0)); print(s.getsockname()[1]); s.close()')"
m1_app_pid=""

cleanup() {
  if [[ -n "$m1_app_pid" ]]; then
    kill "$m1_app_pid" >/dev/null 2>&1 || true
    wait "$m1_app_pid" >/dev/null 2>&1 || true
  fi
  if [[ -f "$m1_cluster/PG_VERSION" ]]; then
    pg_ctl -D "$m1_cluster" -w stop >/dev/null 2>&1 || true
  fi
  if [[ "$m1_tmp" == /tmp/xiangjiang-m1.* ]]; then
    rm -rf "$m1_tmp"
  fi
}
trap cleanup EXIT

cd "$m1_root"
initdb -D "$m1_cluster" --auth=trust --username=postgres --no-locale --encoding=UTF8 >/dev/null
pg_ctl -D "$m1_cluster" -l "$m1_pg_log" -o "-p $m1_pg_port" -w start >/dev/null
createdb -h localhost -p "$m1_pg_port" -U postgres xiangjiang2035_fresh

export DATABASE_URL="postgresql://postgres@localhost:$m1_pg_port/xiangjiang2035_fresh"
export TEST_DATABASE_URL="$DATABASE_URL"
export ALLOW_DEMO_SEED="true"
export ALLOW_DEV_AUTH="true"
export DEV_AUTH_USER_EMAIL="student.owner@example.test"
export STORAGE_ADAPTER="local-development"
export LOCAL_STORAGE_ROOT="$m1_tmp/uploads"

pnpm db:migrate
pnpm db:seed
RUN_DB_TESTS=1 pnpm exec vitest run tests/m1.integration.test.ts tests/m2.integration.test.ts
pnpm build

pnpm exec next dev --hostname 127.0.0.1 --port "$m1_app_port" >"$m1_app_log" 2>&1 &
m1_app_pid="$!"

for _ in $(seq 1 80); do
  if curl -fsS "http://127.0.0.1:$m1_app_port/places" >/dev/null 2>&1; then
    break
  fi
  sleep 0.25
done

m1_places_json="$(curl -fsS "http://127.0.0.1:$m1_app_port/places")"
node -e 'const b=JSON.parse(process.argv[1]); if (!b.data?.some((p)=>p.name==="鹅洲")) process.exit(1)' "$m1_places_json"

m1_create_json="$(curl -fsS -X POST "http://127.0.0.1:$m1_app_port/research-sessions" \
  -H 'content-type: application/json' \
  --data "{\"placeId\":\"30000000-0000-4000-8000-000000000001\",\"ownerTeamId\":\"20000000-0000-4000-8000-000000000001\",\"name\":\"Fresh DB API 验证调研\",\"researchQuestion\":\"真实 API 能否创建调研？\",\"objective\":\"验证 M1 持久化链路\",\"methods\":[\"行为观察\"],\"scopeText\":\"鹅洲北岸\",\"sourceResearchGapRefs\":[\"40000000-0000-4000-8000-000000000001\"]}")"
m1_session_id="$(node -e 'const b=JSON.parse(process.argv[1]); if (!b.data?.id) process.exit(1); process.stdout.write(b.data.id)' "$m1_create_json")"

m1_session_json="$(curl -fsS "http://127.0.0.1:$m1_app_port/research-sessions/$m1_session_id")"
node -e 'const b=JSON.parse(process.argv[1]); if (b.data?.name!=="Fresh DB API 验证调研") process.exit(1)' "$m1_session_json"

m1_started_json="$(curl -fsS -X POST "http://127.0.0.1:$m1_app_port/research-sessions/$m1_session_id/start-field-collection")"
node -e 'const b=JSON.parse(process.argv[1]); if (b.data?.currentPrimaryPhase!=="FieldCollection") process.exit(1)' "$m1_started_json"

m2_record_json="$(curl -fsS -X POST "http://127.0.0.1:$m1_app_port/research-sessions/$m1_session_id/field-records" \
  -F 'payload={"observation":"Fresh DB 真实图片田野记录","evidenceType":"Observation","location":{"latitude":28.0574,"longitude":112.8742,"accuracyMeters":18},"locationStatus":"Approximate","contentTags":["Behavior","Ecology"],"sensitive":false}' \
  -F "media=@$m1_root/.audit/visual-reset/node-23793.png;type=image/png")"
m2_record_id="$(node -e 'const b=JSON.parse(process.argv[1]); if (!b.data?.id || b.data?.media?.[0]?.uploadStatus!=="Success") process.exit(1); process.stdout.write(b.data.id)' "$m2_record_json")"
m2_media_id="$(node -e 'const b=JSON.parse(process.argv[1]); process.stdout.write(b.data.media[0].id)' "$m2_record_json")"

m2_list_json="$(curl -fsS "http://127.0.0.1:$m1_app_port/research-sessions/$m1_session_id/field-records")"
node -e 'const b=JSON.parse(process.argv[1]); const id=process.argv[2]; if (!b.data?.some((r)=>r.id===id)) process.exit(1)' "$m2_list_json" "$m2_record_id"

m2_detail_json="$(curl -fsS "http://127.0.0.1:$m1_app_port/field-records/$m2_record_id")"
node -e 'const b=JSON.parse(process.argv[1]); const sid=process.argv[2]; if (b.data?.researchSessionId!==sid || b.data?.observation!=="Fresh DB 真实图片田野记录") process.exit(1)' "$m2_detail_json" "$m1_session_id"

curl -fsS "http://127.0.0.1:$m1_app_port/field-records/$m2_record_id/media/$m2_media_id/content" >/dev/null

echo "{\"event\":\"m2.fresh_database_verified\",\"status\":\"PASS\",\"sessionId\":\"$m1_session_id\",\"fieldRecordId\":\"$m2_record_id\"}"
