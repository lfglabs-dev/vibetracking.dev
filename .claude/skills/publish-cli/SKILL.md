---
name: publish-cli
description: >
  CLI publishing workflow for npm releases via GitHub Actions.
  Trigger terms: publish, release, npm, cli, version, tag, github actions,
  vibetracking-core, package, deploy cli.
---

## When to Use

- Publishing a new version of the CLI to npm
- Checking which packages are published
- Understanding the release workflow

## Published Packages

| Package | Description |
|---------|-------------|
| `vibetracking` | Main CLI package |
| `@starknetid/vibetracking-core` | Native Rust core (auto-selects platform) |
| `@starknetid/vibetracking-core-darwin-x64` | macOS Intel |
| `@starknetid/vibetracking-core-darwin-arm64` | macOS Apple Silicon |
| `@starknetid/vibetracking-core-darwin-universal` | macOS Universal |
| `@starknetid/vibetracking-core-linux-x64-gnu` | Linux x64 (glibc) |
| `@starknetid/vibetracking-core-linux-arm64-gnu` | Linux ARM64 (glibc) |
| `@starknetid/vibetracking-core-win32-x64-msvc` | Windows x64 |
| `@starknetid/vibetracking-core-win32-arm64-msvc` | Windows ARM64 |

## Procedure: Publish a New Version

### Step 1: Update Version Numbers

Update versions in **both** package.json files:
- `packages/cli/package.json`
- `packages/core/package.json`

Also update `optionalDependencies` versions in core's package.json.

### Step 2: Commit and Push

```bash
git add packages/cli/package.json packages/core/package.json
git commit -m "chore: bump CLI version to X.Y.Z"
git push origin main
```

### Step 3: Create and Push Tag

```bash
git tag cli-vX.Y.Z
git push origin cli-vX.Y.Z
```

### Step 4: Verify Release

GitHub Actions will automatically:
1. Build native binaries for all 6 platforms
2. Create universal macOS binary
3. Publish `@starknetid/vibetracking-core` and all platform packages
4. Publish `vibetracking` CLI

Monitor progress at: Actions > Release CLI

## Workflow Configuration

- **File**: `.github/workflows/release.yml`
- **Trigger**: Push tags matching `cli-v*`
- **Authentication**: OIDC Trusted Publishing (no tokens required)

### Setting Up Trusted Publishers

Each package must be configured on npmjs.com to trust this workflow:

1. Go to `https://www.npmjs.com/package/<package-name>/access`
2. Scroll to **"Trusted Publisher"** section
3. Click **"GitHub Actions"**
4. Configure:
   - **Organization/User**: `lfglabs-dev`
   - **Repository**: `louisville`
   - **Workflow filename**: `release.yml`
   - **Environment**: *(leave blank)*

Packages requiring trusted publisher setup:
- `vibetracking`
- `@starknetid/vibetracking-core`
- `@starknetid/vibetracking-core-darwin-x64`
- `@starknetid/vibetracking-core-darwin-arm64`
- `@starknetid/vibetracking-core-darwin-universal`
- `@starknetid/vibetracking-core-linux-x64-gnu`
- `@starknetid/vibetracking-core-linux-arm64-gnu`
- `@starknetid/vibetracking-core-win32-x64-msvc`
- `@starknetid/vibetracking-core-win32-arm64-msvc`

## Manual Trigger (Dry Run)

Test the workflow without publishing:
1. Go to Actions > Release CLI
2. Click "Run workflow"
3. Check "Dry run" option

## User Installation

After publishing, users can install with:
```bash
bunx vibetracking          # One-off execution
bun add -g vibetracking    # Global install
```
