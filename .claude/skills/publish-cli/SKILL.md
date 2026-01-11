---
name: publish-cli
description: >
  CLI publishing workflow using npm optional dependencies for native binaries.
  CI builds binaries, you publish locally via npm.
  Trigger terms: publish, release, npm, cli, version, tag, vibetracking, package, deploy cli.
---

## When to Use

- Publishing a new version of the CLI to npm
- Understanding the npm optional dependencies publishing model
- Checking the build workflow

## Architecture: npm Optional Dependencies

The CLI uses the npm optional dependencies pattern (same as esbuild, swc, prisma):

| Component | Location | Description |
|-----------|----------|-------------|
| `vibetracking` | npm | CLI JavaScript package |
| `@starknetid/vibetracking-core` | npm | Main core package with optional deps |
| `@starknetid/vibetracking-core-*` | npm | 7 platform-specific binary packages |

**How it works**: When a user runs `npm install vibetracking`, npm automatically installs only the platform-specific binary package that matches their OS/arch.

## Existing npm Packages

These packages already exist on npm - we publish new versions to them:

- `@starknetid/vibetracking-core` - Main package
- `@starknetid/vibetracking-core-darwin-arm64` - macOS ARM64
- `@starknetid/vibetracking-core-darwin-x64` - macOS Intel
- `@starknetid/vibetracking-core-darwin-universal` - macOS Universal
- `@starknetid/vibetracking-core-linux-x64-gnu` - Linux x64
- `@starknetid/vibetracking-core-linux-arm64-gnu` - Linux ARM64
- `@starknetid/vibetracking-core-win32-x64-msvc` - Windows x64
- `@starknetid/vibetracking-core-win32-arm64-msvc` - Windows ARM64

## Procedure: Publish a New Version

### Step 1: Update Version Numbers

Use the napi version command to sync all package versions:

```bash
cd packages/core
pnpm napi version -p X.Y.Z
```

This updates:
- `packages/core/package.json`
- All `packages/core/npm/*/package.json` files

Also update CLI version manually:
```bash
# Edit packages/cli/package.json
# Change "version": "X.Y.Z"
```

### Step 2: Commit and Push Tag

```bash
git add .
git commit -m "chore: bump version to X.Y.Z"
git push origin main

# Create and push tag to trigger CI build
git tag cli-vX.Y.Z
git push origin cli-vX.Y.Z
```

### Step 3: Wait for CI Build

GitHub Actions will build native binaries for all 7 platforms (~10-15 minutes).

Monitor progress:
```bash
gh run watch --exit-status
```

### Step 4: Download Artifacts

Once CI completes, download the built binaries:

```bash
# Get the run ID from the CLI or GitHub UI
gh run download <RUN_ID> -D ./artifacts
```

### Step 5: Publish All Packages

Run the publish script:

```bash
./scripts/publish-all.sh
```

This script:
1. Copies binaries to their package directories
2. Publishes all 7 platform packages
3. Publishes the main core package
4. Builds and publishes the CLI package

**Note**: You'll be prompted for npm OTP if 2FA is enabled on your account.

### Step 6: Verify

```bash
# Check npm registry
npm view vibetracking versions

# Test fresh install
bunx vibetracking@X.Y.Z --version
```

## Workflow Configuration

- **File**: `.github/workflows/release.yml`
- **Trigger**: Push tags matching `cli-v*` or manual dispatch
- **Output**: Build artifacts (downloaded locally for publishing)

## Version Synchronization

All these must match:
- `packages/cli/package.json` version
- `packages/core/package.json` version
- All `packages/core/npm/*/package.json` versions

The `napi version` command syncs the core packages automatically.

## Troubleshooting

### CI Build Failed

Check the GitHub Actions logs. Common issues:
- Rust toolchain version
- Cross-compilation toolchain missing

### npm Publish Failed

If a version already exists on npm:
```bash
npm view @starknetid/vibetracking-core versions
```

Bump to the next version if needed.

### Binary Not Loading

Check that the correct platform package was installed:
```bash
npm ls @starknetid/vibetracking-core
```

Should show the platform-specific package as an optional dependency.
