---
name: publish-cli
description: >
  CLI publishing workflow using GitHub releases for binaries and local npm publish.
  Trigger terms: publish, release, npm, cli, version, tag, github actions,
  vibetracking, package, deploy cli.
---

## When to Use

- Publishing a new version of the CLI to npm
- Checking the release workflow
- Understanding the hybrid publishing model

## Architecture: Hybrid Publishing

The CLI uses a hybrid publishing approach:

| Component | Host | Description |
|-----------|------|-------------|
| `vibetracking` | npm | CLI JavaScript wrapper (you publish locally) |
| Native binaries | GitHub Releases | `.node` files for each platform |

**Why?** This simplifies publishing to 1 npm package instead of 9, avoiding npm OIDC/auth issues.

**How it works**: On first run, the CLI downloads the correct native binary from GitHub releases to `~/.vibetracking/bin/{version}/`.

## Procedure: Publish a New Version

### Step 1: Update Version Numbers

Update version in `packages/cli/package.json`:
```json
{
  "version": "X.Y.Z"
}
```

Update `BINARY_VERSION` constant in:
- `packages/cli/src/native.ts`
- `packages/cli/src/native-runner.ts`

```typescript
const BINARY_VERSION = "X.Y.Z";
```

### Step 2: Commit and Push

```bash
git add packages/cli/
git commit -m "chore: bump CLI version to X.Y.Z"
git push origin main
```

### Step 3: Create and Push Tag

**IMPORTANT**: Create the tag AFTER pushing the version bump to main. The tag must point to the commit with the updated version and workflow.

```bash
git tag cli-vX.Y.Z
git push origin cli-vX.Y.Z
```

### Step 4: Wait for CI and Verify Release

GitHub Actions will:
1. Build native binaries for all 6 platforms
2. Create universal macOS binary
3. Upload all binaries to GitHub Release

Monitor progress: `gh run watch <RUN_ID> --exit-status`

**Before proceeding**: Verify binaries were uploaded:
```bash
gh release view cli-vX.Y.Z --json assets --jq '.assets[].name'
```

You should see 7 `.node` files (6 platforms + 1 universal macOS).

### Step 5: Publish CLI to npm (Locally)

Once CI completes and binaries are verified, publish from your local machine:

```bash
cd packages/cli
pnpm build
npm publish --access public
```

**Note**: npm will prompt for OTP (one-time password) from your authenticator app.

### Step 6: Verify

```bash
# Check npm
npm view vibetracking versions

# Test fresh install (should download binary)
rm -rf ~/.vibetracking/bin
bunx vibetracking@X.Y.Z --version
```

## Workflow Configuration

- **File**: `.github/workflows/release.yml`
- **Trigger**: Push tags matching `cli-v*`
- **Output**: Native binaries uploaded to GitHub Release

### Manual Trigger (Dry Run)

Test the build without uploading:
1. Go to Actions > Release CLI
2. Click "Run workflow"
3. Check "Dry run" option

## Native Binary Locations

Binaries are downloaded to `~/.vibetracking/bin/{version}/`:

| Platform | Binary Name |
|----------|-------------|
| macOS Intel | `vibetracking-core.darwin-x64.node` |
| macOS ARM | `vibetracking-core.darwin-arm64.node` |
| Linux x64 | `vibetracking-core.linux-x64-gnu.node` |
| Linux ARM64 | `vibetracking-core.linux-arm64-gnu.node` |
| Windows x64 | `vibetracking-core.win32-x64-msvc.node` |
| Windows ARM64 | `vibetracking-core.win32-arm64-msvc.node` |

## User Installation

After publishing, users can install with:
```bash
bunx vibetracking          # One-off execution (downloads binary on first run)
bun add -g vibetracking    # Global install
```

## Troubleshooting

### CI Failed / Tag Points to Old Workflow

If the release workflow fails or you need to recreate a tag:

```bash
# Delete tag locally and remotely
git tag -d cli-vX.Y.Z
git push origin :refs/tags/cli-vX.Y.Z

# Create new tag on current main
git tag cli-vX.Y.Z origin/main
git push origin cli-vX.Y.Z
```

### npm Version Already Exists but Tarball is 404

If `npm view vibetracking versions` shows a version but `bunx vibetracking@X.Y.Z` fails with 404, the version was corrupted. Bump to next patch version (e.g., 0.2.0 → 0.2.1).

### Binary Download Fails

Check that:
1. GitHub release exists: `gh release view cli-vX.Y.Z`
2. Repo is public (private repos require auth for release downloads)
3. `GITHUB_REPO` in `native.ts` matches the actual repo name
