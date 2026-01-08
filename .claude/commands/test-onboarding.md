# Quick Onboarding Test

Fast test of the complete onboarding flow using Playwright MCP. Takes ~2-3 minutes.

> **Note:** This is equivalent to `/e2e/test-quick`. For comprehensive testing, see:
> - `/e2e/test-full-suite` - Complete regression suite
> - `/e2e/test-homepage` - Homepage (auth + unauth)
> - `/e2e/test-import` - Import page flow
> - `/e2e/test-profile` - Profile page tests
> - `/test-cli` - CLI package manual testing

## Prerequisites
- Dev server running at http://localhost:3000
- If not running: `pnpm dev`

## Test Flow

### Step 1: Generate Test Data
Generate encoded test data inline (gzip + base64url):

```javascript
const data = {
  timestamp: Date.now(),
  version: 1,
  tools: {
    claude_code: {
      tool: "claude_code",
      dailyActivity: [
        { date: "2024-12-10", tool: "claude_code", messageCount: 80, sessionCount: 8, totalTokens: 500000 },
        { date: "2024-12-11", tool: "claude_code", messageCount: 60, sessionCount: 6, totalTokens: 400000 }
      ],
      modelUsage: [
        { model: "claude-sonnet-4-20250514", inputTokens: 600000, outputTokens: 300000 }
      ],
      stats: {
        totalTokens: 900000,
        totalSessions: 14,
        totalMessages: 140,
        longestSessionMs: 5400000,
        firstActivityDate: "2024-12-10",
        lastActivityDate: "2024-12-11"
      }
    }
  }
};
// Encode: gzip(JSON.stringify(data)) → base64url
```

### Step 2: Navigate to Import Page
```
mcp__playwright__browser_navigate: http://localhost:3000/import#[ENCODED_DATA]
mcp__playwright__browser_snapshot
```

**Verify:**
- [ ] Stats preview shows ~900K tokens
- [ ] Auth buttons visible

### Step 3: Complete Anonymous Registration
```
mcp__playwright__browser_click: element="Continue without login", ref="[ref]"
mcp__playwright__browser_type: element="Display Name", ref="[ref]", text="Onboarding Test User"
mcp__playwright__browser_type: element="Company", ref="[ref]", text="Test Corp"
mcp__playwright__browser_click: element="Save Profile", ref="[ref]"
mcp__playwright__browser_wait_for: text="Onboarding Test User"
mcp__playwright__browser_snapshot
```

**Verify:**
- [ ] Redirected to profile page
- [ ] "Onboarding Test User" displayed
- [ ] Stats visible

### Step 4: Check Console
```
mcp__playwright__browser_console_messages: level="error"
```

**Verify:**
- [ ] No JavaScript errors

### Step 5: Screenshot
```
mcp__playwright__browser_take_screenshot: filename="onboarding-test.png"
```

## Report

```markdown
## Onboarding Test Results

- Date: [timestamp]

| Step | Status |
|------|--------|
| Import page loads | |
| Stats preview correct | |
| Anonymous form works | |
| Registration succeeds | |
| Profile displays | |
| No console errors | |

**Status: PASS / FAIL**
```
