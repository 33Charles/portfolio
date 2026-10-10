#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VAULT_DIR="$ROOT_DIR/notes-vault"

echo "==> Building portfolio (Vite)"
(cd "$ROOT_DIR" && npm run build)

echo "==> Building notes vault (Quartz)"
(cd "$VAULT_DIR" && npx quartz build -o public)

echo "==> Merging notes vault into dist/labs-and-notes"
rm -rf "$ROOT_DIR/dist/labs-and-notes"
cp -r "$VAULT_DIR/public" "$ROOT_DIR/dist/labs-and-notes"

echo "==> Done. Deployable output is in $ROOT_DIR/dist"
