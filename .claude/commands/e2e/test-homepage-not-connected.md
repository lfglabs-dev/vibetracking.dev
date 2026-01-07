# E2E Test: Homepage (Not Connected)

Test the homepage experience for users who are NOT logged in.

## Prerequisites
- Dev server must be running at http://localhost:3000
- Browser should NOT have an active session (fresh state)

## Test Procedure

### Step 1: Navigate to Homepage
Use `mcp__playwright__browser_navigate` to go to:
```
http://localhost:3000
```

### Step 2: Take Initial Snapshot
Use `mcp__playwright__browser_snapshot` and verify:

**TC1.1 - Page Load and Layout:**
- [ ] Logo "vibetracking" is visible (should see text "vibe" and "tracking")
- [ ] Headline "Are you a good vibe Coder?" is visible
- [ ] Subtext "Track your AI coding usage across Claude Code, Codex, and Cursor" visible

**TC1.4 - No Profile Button:**
- [ ] "My Profile" button/link is NOT present in header area

### Step 3: Test CTA Box Copy Button
**TC1.2 - CTA Box:**
1. Locate the copy button near "bunx vibetracking" text
2. Use `mcp__playwright__browser_click` on the copy button
3. Use `mcp__playwright__browser_snapshot` to verify:
   - [ ] "Copied!" text appears (or button state changes)
4. Wait 2 seconds with `mcp__playwright__browser_wait_for` time=2
5. Take another snapshot to verify text reverts

### Step 4: Verify Leaderboard
**TC1.3 - Leaderboard Display:**
Use `mcp__playwright__browser_snapshot` and verify:
- [ ] Leaderboard table/list is visible
- [ ] Headers visible: "Vibe Coder", "Company", "Est. API Spend", "Sessions", "Streak"
- [ ] At least one row of data (mock or real)
- [ ] Top entries show medal emojis (🥇🥈🥉) or rank numbers

### Step 5: Test Leaderboard Row Click
**TC1.5 - Leaderboard Row Navigation:**
1. Use `mcp__playwright__browser_snapshot` to identify a clickable row
2. Use `mcp__playwright__browser_click` on a leaderboard entry (user name/row)
3. Use `mcp__playwright__browser_snapshot` to verify:
   - [ ] Navigated to a profile page
   - [ ] URL changed to /user/[username] or /u/[id]
   - [ ] Profile content is visible

### Step 6: Check Console Errors
**TC8.1 - Homepage Console:**
Use `mcp__playwright__browser_console_messages` with level="error":
- [ ] No JavaScript errors

### Step 7: Take Screenshot
Use `mcp__playwright__browser_take_screenshot` with filename="e2e-homepage-not-connected.png"

### Step 8: Navigate Back
Use `mcp__playwright__browser_navigate_back` to return to homepage for next tests

---

## Report Results

```markdown
## E2E Test Results: Homepage (Not Connected)

### Summary
- Total: 6 test cases
- Passed: X
- Failed: Y

### Results
| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| TC1.1 | Page Load and Layout | | |
| TC1.2 | CTA Box Copy | | |
| TC1.3 | Leaderboard Display | | |
| TC1.4 | No Profile Button | | |
| TC1.5 | Leaderboard Navigation | | |
| TC8.1 | Console Errors | | |

### Screenshots
- e2e-homepage-not-connected.png

### Console Errors
[List any errors found or "None"]

### Status: PASS/FAIL
```
