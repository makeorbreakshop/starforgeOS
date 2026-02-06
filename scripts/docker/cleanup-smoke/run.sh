#!/usr/bin/env bash
set -euo pipefail

cd /repo

export STARFORGEOS_STATE_DIR="/tmp/starforgeos-test"
export STARFORGEOS_CONFIG_PATH="${STARFORGEOS_STATE_DIR}/starforgeos.json"

echo "==> Build"
pnpm build

echo "==> Seed state"
mkdir -p "${STARFORGEOS_STATE_DIR}/credentials"
mkdir -p "${STARFORGEOS_STATE_DIR}/agents/main/sessions"
echo '{}' >"${STARFORGEOS_CONFIG_PATH}"
echo 'creds' >"${STARFORGEOS_STATE_DIR}/credentials/marker.txt"
echo 'session' >"${STARFORGEOS_STATE_DIR}/agents/main/sessions/sessions.json"

echo "==> Reset (config+creds+sessions)"
pnpm starforge reset --scope config+creds+sessions --yes --non-interactive

test ! -f "${STARFORGEOS_CONFIG_PATH}"
test ! -d "${STARFORGEOS_STATE_DIR}/credentials"
test ! -d "${STARFORGEOS_STATE_DIR}/agents/main/sessions"

echo "==> Recreate minimal config"
mkdir -p "${STARFORGEOS_STATE_DIR}/credentials"
echo '{}' >"${STARFORGEOS_CONFIG_PATH}"

echo "==> Uninstall (state only)"
pnpm starforge uninstall --state --yes --non-interactive

test ! -d "${STARFORGEOS_STATE_DIR}"

echo "OK"
