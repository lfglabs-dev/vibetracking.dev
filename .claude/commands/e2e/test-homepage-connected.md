# E2E Test: Homepage (Connected)

Test the homepage experience for users who ARE logged in (anonymous user).

## Prerequisites
- Dev server must be running at http://localhost:3000
- Must complete onboarding flow first to create an anonymous user

## Test Procedure

### Step 1: Create Anonymous User (Setup)
Generate test import data and complete onboarding:

1. **Generate encoded test data inline:**
   - Create data with 60-90 days of daily activity
   - Include model usage for claude-sonnet-4, claude-3-5-haiku
   - Total tokens: 5-20 million
   - Sessions: 100-500
   - Compress with pako.gzip and encode as base64url

2. **Navigate to import page:**
   Use `mcp__playwright__browser_navigate` to:
   ```
   http://localhost:3000/import#[encoded-data]
   ```

3. **Complete anonymous registration:**
   - Use `mcp__playwright__browser_snapshot` to find "Continue without login"
   - Use `mcp__playwright__browser_click` to expand anonymous form
   - Use `mcp__playwright__browser_fill_form` with:
     - Display Name: "E2E Connected Test"
     - Company: "Test Corp"
   - Click "Save Profile" button
   - Wait for redirect to /u/[anonymousId]

4. **Capture anonymousId from URL:**
   - Note the anonymousId from the profile URL for later tests

### Step 2: Navigate to Homepage
Use `mcp__playwright__browser_navigate` to go to:
```
http://localhost:3000
```

### Step 3: Verify Connected State
Use `mcp__playwright__browser_snapshot` and verify:

**TC2.2 - Homepage After Login:**
- [ ] "My Profile" button/link IS visible in header
- [ ] Button links to /u/[anonymousId]

### Step 4: Verify Leaderboard Highlight
**TC2.3 - Current User Highlight:**
Use `mcp__playwright__browser_snapshot` and verify:
- [ ] Current user's row has distinct highlighting (light green bg)
- [ ] User's display name "E2E Connected Test" appears in leaderboard
- [ ] Other rows have hover effect but not highlight

### Step 5: Test Profile Button Navigation
**TC2.4 - Profile Button Click:**
1. Use `mcp__playwright__browser_click` on "My Profile" button
2. Use `mcp__playwright__browser_snapshot` to verify:
   - [ ] Navigated to /u/[anonymousId]
   - [ ] Profile page shows "E2E Connected Test"
   - [ ] Stats are displayed

### Step 6: Navigate Back to Homepage
Use `mcp__playwright__browser_navigate` to:
```
http://localhost:3000
```

### Step 7: Test Leaderboard Click on Own Entry
1. Use `mcp__playwright__browser_snapshot` to find own entry in leaderboard
2. Use `mcp__playwright__browser_click` on own entry row
3. Verify navigation to profile page

### Step 8: Check Console Errors
Use `mcp__playwright__browser_console_messages` with level="error":
- [ ] No JavaScript errors during connected flow

### Step 9: Take Screenshot
Use `mcp__playwright__browser_take_screenshot` with filename="e2e-homepage-connected.png"

---

## Test Data Template

```javascript
const testData = {
  timestamp: Date.now(),
  version: 1,
  tools: {
    claude_code: {
      tool: "claude_code",
      dailyActivity: [
        // Generate 60-90 days with random activity
        { date: "2024-XX-XX", messageCount: N, sessionCount: N, totalTokens: N }
      ],
      modelUsage: [
        {
          model: "claude-sonnet-4-20250514",
          inputTokens: 4000000,
          outputTokens: 1500000,
          cacheReadTokens: 3000000,
          cacheCreationTokens: 500000
        },
        {
          model: "claude-3-5-haiku-20241022",
          inputTokens: 700000,
          outputTokens: 300000
        }
      ],
      stats: {
        totalTokens: 10000000,
        totalSessions: 250,
        totalMessages: 5000,
        longestSessionMs: 7200000,
        firstActivityDate: "2024-10-01",
        lastActivityDate: "2024-12-20"
      }
    }
  }
};
```

---

## Report Results

```markdown
## E2E Test Results: Homepage (Connected)

### Environment
- Anonymous User ID: [captured from setup]
- Display Name: E2E Connected Test

### Summary
- Total: 5 test cases
- Passed: X
- Failed: Y

### Results
| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| TC2.1 | Anonymous User Setup | | |
| TC2.2 | Profile Button Visible | | |
| TC2.3 | Leaderboard Highlight | | |
| TC2.4 | Profile Button Navigation | | |
| TC8.1 | Console Errors | | |

### Screenshots
- e2e-homepage-connected.png

### Console Errors
[List any errors found or "None"]

### Status: PASS/FAIL
```

---

## Notes
- The anonymousId created in this test should be passed to subsequent tests
- This test creates state that persists (user in database)
- Use this user for "Own Profile" and "Another User Profile" tests
