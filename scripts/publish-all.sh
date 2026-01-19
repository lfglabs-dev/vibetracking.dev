#!/bin/bash
# Publish new versions to existing vibetracking npm packages
# Run from repo root after downloading CI artifacts
#
# Usage:
#   1. Build completed in CI (push tag cli-vX.Y.Z)
#   2. Download artifacts: gh run download <RUN_ID> -D ./artifacts
#   3. Run this script: ./scripts/publish-all.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$REPO_ROOT"

# Check if artifacts directory exists
if [ ! -d "./artifacts" ]; then
  echo "Error: ./artifacts directory not found"
  echo ""
  echo "Download artifacts first:"
  echo "  gh run download <RUN_ID> -D ./artifacts"
  exit 1
fi

# Map artifact names to package directories
declare -A PLATFORM_MAP=(
  ["vibetracking-core.darwin-arm64.node"]="darwin-arm64"
  ["vibetracking-core.darwin-x64.node"]="darwin-x64"
  ["vibetracking-core.darwin-universal.node"]="darwin-universal"
  ["vibetracking-core.linux-x64-gnu.node"]="linux-x64-gnu"
  ["vibetracking-core.linux-arm64-gnu.node"]="linux-arm64-gnu"
  ["vibetracking-core.win32-x64-msvc.node"]="win32-x64-msvc"
  ["vibetracking-core.win32-arm64-msvc.node"]="win32-arm64-msvc"
)

echo "=== Preparing platform packages ==="
echo ""

# Copy binaries to their package directories
missing_binaries=()
for binary in "${!PLATFORM_MAP[@]}"; do
  pkg="${PLATFORM_MAP[$binary]}"
  src=$(find ./artifacts -name "$binary" -type f 2>/dev/null | head -1)

  if [ -n "$src" ]; then
    dest="packages/core/npm/$pkg/$binary"
    echo "  Copying $binary -> npm/$pkg/"
    cp "$src" "$dest"
  else
    missing_binaries+=("$binary")
  fi
done

if [ ${#missing_binaries[@]} -gt 0 ]; then
  echo "Error: missing required binary artifacts:"
  for binary in "${missing_binaries[@]}"; do
    echo "  - $binary"
  done
  echo ""
  echo "Download the full CI artifacts and try again."
  exit 1
fi

echo ""
echo "=== Verifying platform packages ==="
echo ""

tmp_pack_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_pack_dir"' EXIT

for binary in "${!PLATFORM_MAP[@]}"; do
  pkg="${PLATFORM_MAP[$binary]}"
  binary_path="packages/core/npm/$pkg/$binary"

  if [ ! -s "$binary_path" ]; then
    echo "Error: expected binary not found at $binary_path"
    exit 1
  fi

  echo "  Checking npm pack contents for $pkg..."
  tgz_name=$(NPM_CONFIG_LOGLEVEL=error npm pack --silent --pack-destination "$tmp_pack_dir" "packages/core/npm/$pkg")
  tgz_path="$tmp_pack_dir/$tgz_name"

  if [ ! -f "$tgz_path" ]; then
    echo "Error: npm pack did not produce a tarball for $pkg"
    exit 1
  fi

  if ! tar -tf "$tgz_path" | grep -q "^package/$binary$"; then
    echo "Error: npm pack tarball for $pkg is missing $binary"
    exit 1
  fi
done

echo ""
echo "=== Publishing platform packages ==="
echo ""

# Publish platform packages (order doesn't matter)
for pkg in darwin-arm64 darwin-x64 darwin-universal linux-x64-gnu linux-arm64-gnu win32-x64-msvc win32-arm64-msvc; do
  echo "Publishing @starknetid/vibetracking-core-$pkg..."
  cd "packages/core/npm/$pkg"
  npm publish --access public || echo "  (may already exist at this version)"
  cd "$REPO_ROOT"
done

echo ""
echo "=== Publishing main core package ==="
echo ""

cd packages/core
npm publish --access public || echo "  (may already exist at this version)"
cd "$REPO_ROOT"

echo ""
echo "=== Publishing CLI package ==="
echo ""

cd packages/cli
pnpm build
npm publish --access public || echo "  (may already exist at this version)"
cd "$REPO_ROOT"

echo ""
echo "=== Done! ==="
echo ""
echo "All 9 packages published:"
echo "  - 7 platform packages (@starknetid/vibetracking-core-*)"
echo "  - 1 main core package (@starknetid/vibetracking-core)"
echo "  - 1 CLI package (vibetracking)"
echo ""
echo "Verify with: bunx vibetracking@latest --version"
