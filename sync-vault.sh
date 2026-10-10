#!/usr/bin/env bash
# One-way sync: Obsidian vault -> notes-vault/content, for committing to the
# portfolio repo and deploying on Vercel.
# Usage:
#   ./sync-vault.sh              # does the sync
#   ./sync-vault.sh --dry-run    # shows what WOULD change, touches nothing

set -euo pipefail

VAULT_DIR="${VAULT_DIR:-$HOME/Documents/CyberSec}"


ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONTENT_DIR="$ROOT_DIR/notes-vault/content"

if [ ! -d "$VAULT_DIR" ]; then
  echo "ERROR: vault not found at $VAULT_DIR" >&2
  echo "Set VAULT_DIR at the top of this script, or run with:" >&2
  echo "  VAULT_DIR=/path/to/vault ./sync-vault.sh" >&2
  exit 1
fi

RSYNC_FLAGS=(-a --delete
  --exclude=".git/"
  --exclude=".obsidian/"
  --exclude="Excalidraw/"
  --exclude="Private/"
  --exclude="Scripts/"
  --exclude="templates/"
  --exclude=".DS_Store"

)

DRY_RUN=false
if [[ "${1:-}" == "--dry-run" ]]; then
  DRY_RUN=true
  RSYNC_FLAGS+=(--dry-run --verbose)
  echo "==> DRY RUN — nothing will actually change"
fi

mkdir -p "$CONTENT_DIR"

echo "==> Syncing $VAULT_DIR -> $CONTENT_DIR"
echo "==> Excluding: .git/, .obsidian/, Excalidraw/, Private/, templates/, Scripts/"
rsync "${RSYNC_FLAGS[@]}" "$VAULT_DIR"/ "$CONTENT_DIR"/

if [ "$DRY_RUN" = true ]; then
  echo "==> Dry run complete. Re-run without --dry-run to apply."
else
  echo "==> Sync complete."
  echo "==> Review before committing:"
  echo "    cd $ROOT_DIR && git status"
  echo "    git diff --stat"
fi
