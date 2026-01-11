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
- GitHub test account credentials (from Bitwarden)

## Test Flow

### Step 1: Generate Test Data
Generate encoded test data inline (gzip + base64url):

```javascript
const data = {
  timestamp: Date.now(),
  version: 1,
  summary: {
    totalTokens: 900000,
    totalCost: 15.50,
    sources: ["claude_code"]
  },
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
// Encode: gzip(JSON.stringify(data)) -> base64url
```

### Step 2: Navigate to Import Page
```
mcp__playwright__browser_navigate: http://localhost:3000/import#[ENCODED_DATA]
mcp__playwright__browser_snapshot
```

**Verify:**
- [ ] Stats preview shows token data
- [ ] "Continue with GitHub" button visible
- [ ] Stickers animate in around the card

### Step 3: GitHub Authentication
```
mcp__playwright__browser_click: element="Continue with GitHub", ref="[ref]"
```

**Note:** This will redirect to GitHub OAuth. You'll need test credentials:
1. Get credentials from Bitwarden (vibetracking test account)
2. Complete GitHub login
3. Authorize the app
4. Wait for redirect back to import page

```
mcp__playwright__browser_wait_for: text="Save your profile"
mcp__playwright__browser_snapshot
```

### Step 4: Complete Profile (First Time Users)
If this is a first-time user, you'll see a company prompt:

```
mcp__playwright__browser_type: element="Company", ref="[ref]", text="Test Corp"
mcp__playwright__browser_click: element="Continue", ref="[ref]"
```

Or skip the company:
```
mcp__playwright__browser_click: element="Skip", ref="[ref]"
```

**Verify:**
- [ ] Redirected to profile page
- [ ] Username displayed correctly
- [ ] Stats visible on profile

### Step 5: Verify Profile Page
```
mcp__playwright__browser_wait_for: text loaded
mcp__playwright__browser_snapshot
```

**Verify:**
- [ ] Profile header shows user info
- [ ] Token statistics displayed
- [ ] Activity heatmap visible (if data exists)

### Step 6: Check Console
```
mcp__playwright__browser_console_messages: level="error"
```

**Verify:**
- [ ] No JavaScript errors

### Step 7: Screenshot
```
mcp__playwright__browser_take_screenshot: filename="onboarding-test.png"
```

---

## Challenge Flow Test (Optional)

Test the inviter/challenge feature:

### Navigate with Inviter Parameter
```
mcp__playwright__browser_navigate: http://localhost:3000/import?inviter=fricoben#[ENCODED_DATA]
mcp__playwright__browser_snapshot
```

**Verify:**
- [ ] Challenge banner visible: "@fricoben challenged your vibe coding skills!"
- [ ] Banner has gradient styling

### Complete Auth and Check Redirect
After GitHub auth, verify redirect to battle page:
```
mcp__playwright__browser_wait_for: text="vs"
```

**Verify:**
- [ ] Redirected to `/battle/@newuser-vs-@fricoben`

---

## Report

```markdown
## Onboarding Test Results

- Date: [timestamp]

| Step | Status |
|------|--------|
| Import page loads | |
| Stickers animate | |
| GitHub button visible | |
| GitHub OAuth works | |
| Profile redirect | |
| Stats displayed | |
| No console errors | |

**Status: PASS / FAIL**
```
