# E2E Quick Smoke Test

Fast smoke test (~2 minutes) to verify the app is working. Run this first before deeper testing.

## Prerequisites
- Dev server running at http://localhost:3000
- If not running: `pnpm dev`

## Test Procedure

### Step 1: Homepage Load
```
mcp__playwright__browser_navigate: http://localhost:3000
mcp__playwright__browser_snapshot
```

**Verify:**
- [ ] Page loads without error
- [ ] Logo "vibetracking" visible
- [ ] Leaderboard has at least one entry

### Step 2: Import Page (Error State)
```
mcp__playwright__browser_navigate: http://localhost:3000/import
mcp__playwright__browser_snapshot
```

**Verify:**
- [ ] Shows "No data found" error message
- [ ] "Go Home" button visible

### Step 3: Generate & Import Test Data
Generate test data inline (gzip + base64url):

```javascript
// Minimal test data
const data = {
  timestamp: Date.now(),
  version: 1,
  tools: {
    claude_code: {
      tool: "claude_code",
      dailyActivity: [{ date: "2024-12-15", tool: "claude_code", messageCount: 50, sessionCount: 5, totalTokens: 100000 }],
      modelUsage: [{ model: "claude-sonnet-4-20250514", inputTokens: 50000, outputTokens: 50000 }],
      stats: { totalTokens: 100000, totalSessions: 5, totalMessages: 50, longestSessionMs: 3600000, firstActivityDate: "2024-12-15", lastActivityDate: "2024-12-15" }
    }
  }
};
// Encode: gzip(JSON.stringify(data)) → base64url
```

Navigate to import page with encoded data:
```
mcp__playwright__browser_navigate: http://localhost:3000/import#[ENCODED_DATA]
mcp__playwright__browser_snapshot
```

**Verify:**
- [ ] Stats preview shows ~100K tokens
- [ ] Auth buttons visible

### Step 4: Anonymous Registration
```
mcp__playwright__browser_click: "Continue without login" button
mcp__playwright__browser_snapshot
mcp__playwright__browser_type: Display Name field → "Smoke Test User"
mcp__playwright__browser_click: "Save Profile" button
mcp__playwright__browser_wait_for: text="Smoke Test User"
mcp__playwright__browser_snapshot
```

**Verify:**
- [ ] Redirected to profile page (/u/...)
- [ ] "Smoke Test User" displayed
- [ ] Stats grid visible

### Step 5: Console Errors Check
```
mcp__playwright__browser_console_messages: level="error"
```

**Verify:**
- [ ] No JavaScript errors

### Step 6: Screenshot
```
mcp__playwright__browser_take_screenshot: filename="smoke-test-result.png"
```

## Quick Report

```markdown
## Smoke Test Results

- Date: [timestamp]
- Duration: ~2 min

| Check | Status |
|-------|--------|
| Homepage loads | |
| Import error state | |
| Import with data | |
| Anonymous registration | |
| Profile displays | |
| No console errors | |

**Overall: PASS / FAIL**
```
