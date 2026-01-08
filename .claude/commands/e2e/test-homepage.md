# E2E Test: Homepage (All States)

Comprehensive homepage testing covering both authenticated and unauthenticated states.

## Prerequisites
- Dev server running at http://localhost:3000

## Part A: Unauthenticated State

### A1: Fresh Browser Start
```
mcp__playwright__browser_tabs: action="new"
mcp__playwright__browser_navigate: http://localhost:3000
mcp__playwright__browser_snapshot
```

### A2: Layout Verification (HP-01 to HP-03)
**Verify from snapshot:**
- [ ] HP-01: Logo displays "vibetracking" (pink "vibe" + green "tracking")
- [ ] HP-02: Headline "Are you a good vibe Coder?" visible
- [ ] HP-03: CTA box shows `bunx vibetracking` command

### A3: Copy Button Test (HP-04)
1. Find copy button near the command text
2. Click it:
   ```
   mcp__playwright__browser_click: element="copy button", ref="[copy-button-ref]"
   mcp__playwright__browser_snapshot
   ```
3. **Verify:** "Copied!" text appears
4. Wait and check revert:
   ```
   mcp__playwright__browser_wait_for: time=2
   mcp__playwright__browser_snapshot
   ```
5. **Verify:** Text reverted to original

### A4: Leaderboard Display (HP-05, HP-06)
**Verify from snapshot:**
- [ ] HP-05: Leaderboard table visible with columns:
  - Rank / Vibe Coder / Company / Est. API Spend / Sessions / Streak
- [ ] HP-06: Top 3 entries have medal indicators (if data exists)

### A5: No Auth Elements (HP-07)
**Verify from snapshot:**
- [ ] HP-07: "My Profile" button is NOT visible in header

### A6: Leaderboard Navigation (HP-08)
1. Click any leaderboard row:
   ```
   mcp__playwright__browser_click: element="first leaderboard user row", ref="[row-ref]"
   mcp__playwright__browser_snapshot
   ```
2. **Verify:**
   - [ ] HP-08: Navigated to profile page (/user/... or /u/...)
   - [ ] Profile content is visible

### A7: Return to Homepage
```
mcp__playwright__browser_navigate_back
mcp__playwright__browser_snapshot
```

### A8: Screenshot
```
mcp__playwright__browser_take_screenshot: filename="homepage-unauthenticated.png"
```

---

## Part B: Authenticated State

> **Prerequisite:** Must have a test user. Run `/e2e/test-import` first to create one, or continue from Part A test.

### B1: Create Test User (if needed)
If no test user exists, generate and import data:

```javascript
const data = {
  timestamp: Date.now(),
  version: 1,
  tools: {
    claude_code: {
      tool: "claude_code",
      dailyActivity: [
        { date: "2024-12-10", tool: "claude_code", messageCount: 100, sessionCount: 10, totalTokens: 500000 },
        { date: "2024-12-11", tool: "claude_code", messageCount: 80, sessionCount: 8, totalTokens: 400000 }
      ],
      modelUsage: [{ model: "claude-sonnet-4-20250514", inputTokens: 600000, outputTokens: 300000 }],
      stats: { totalTokens: 900000, totalSessions: 18, totalMessages: 180, longestSessionMs: 5400000, firstActivityDate: "2024-12-10", lastActivityDate: "2024-12-11" }
    }
  }
};
```

Navigate and complete registration:
```
mcp__playwright__browser_navigate: http://localhost:3000/import#[ENCODED_DATA]
mcp__playwright__browser_click: "Continue without login"
mcp__playwright__browser_type: Display Name → "Homepage Test User"
mcp__playwright__browser_click: "Save Profile"
mcp__playwright__browser_wait_for: text="Homepage Test User"
```

**Note the user ID from URL:** `/u/[USER_ID]`

### B2: Navigate to Homepage (Authenticated)
```
mcp__playwright__browser_navigate: http://localhost:3000
mcp__playwright__browser_snapshot
```

### B3: Verify Authenticated Elements (HPA-01 to HPA-03)
**Verify from snapshot:**
- [ ] HPA-01: "My Profile" button IS visible in header
- [ ] HPA-02: Current user highlighted in leaderboard (different background color)

### B4: Test Profile Button Navigation (HPA-03)
```
mcp__playwright__browser_click: element="My Profile button", ref="[profile-button-ref]"
mcp__playwright__browser_snapshot
```

**Verify:**
- [ ] HPA-03: Navigated to own profile page (/u/[USER_ID])
- [ ] Profile shows "Homepage Test User"

### B5: Screenshot
```
mcp__playwright__browser_take_screenshot: filename="homepage-authenticated.png"
```

---

## Console Error Check (CON-01)
```
mcp__playwright__browser_console_messages: level="error"
```

**Verify:**
- [ ] CON-01: No JavaScript errors on homepage

---

## Report

```markdown
## E2E Test Results: Homepage

### Environment
- Date: [timestamp]
- URL: http://localhost:3000

### Part A: Unauthenticated
| ID | Description | Status | Notes |
|----|-------------|--------|-------|
| HP-01 | Logo displays | | |
| HP-02 | Headline visible | | |
| HP-03 | CTA box visible | | |
| HP-04 | Copy button works | | |
| HP-05 | Leaderboard visible | | |
| HP-06 | Medal emojis | | |
| HP-07 | No Profile button | | |
| HP-08 | Row navigation | | |

### Part B: Authenticated
| ID | Description | Status | Notes |
|----|-------------|--------|-------|
| HPA-01 | Profile button visible | | |
| HPA-02 | User highlighted | | |
| HPA-03 | Button navigates | | |

### Console Errors
[List or "None"]

### Screenshots
- homepage-unauthenticated.png
- homepage-authenticated.png

**Status: PASS / FAIL**
```
