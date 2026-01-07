# E2E Test: Another User's Profile (When Connected)

Test viewing another user's profile while logged in as a different user.

## Prerequisites
- Dev server must be running at http://localhost:3000
- Must have completed "test-homepage-connected" to have an active user session
- Need at least 2 users in the system (current user + another user to view)

## Test Procedure

### Step 1: Ensure Connected State
If not already connected from previous test:
1. Navigate to http://localhost:3000
2. Verify "My Profile" button is visible
3. If not visible, run "test-homepage-connected" first

### Step 2: Navigate to Leaderboard
Use `mcp__playwright__browser_navigate` to:
```
http://localhost:3000
```

### Step 3: Identify Another User
Use `mcp__playwright__browser_snapshot` and:
1. Find the leaderboard entries
2. Identify a user that is NOT the current user (not highlighted)
3. Note their username/display name

### Step 4: Navigate to Another User's Profile
**TC4.1 - Navigate to Different User:**
1. Use `mcp__playwright__browser_click` on that user's row
2. Use `mcp__playwright__browser_snapshot` to verify:
   - [ ] URL is /user/[username] or /u/[id]
   - [ ] NOT the same as current user's profile URL

### Step 5: Verify Profile Content
**TC4.2 - Profile Data Display:**
Use `mcp__playwright__browser_snapshot` and verify all sections:

**Header:**
- [ ] Display name visible
- [ ] Username visible (with @ or "Anonymous #")
- [ ] Company visible (or placeholder if not set)
- [ ] Avatar or initials circle

**Stats Grid:**
- [ ] Total Tokens displayed
- [ ] Sessions displayed
- [ ] Current Streak displayed
- [ ] Active Days displayed

**Highlights Card:**
- [ ] Favorite Model tag visible
- [ ] Favorite Tool visible
- [ ] Longest Session formatted
- [ ] Best Streak visible

**Timeline Card:**
- [ ] First Activity date
- [ ] Last Activity date

**Activity Heatmap:**
- [ ] Heatmap grid visible
- [ ] Month labels visible
- [ ] Color intensity varies

### Step 6: Verify No Edit Capabilities
**TC4.3 - No Edit Capabilities:**
Use `mcp__playwright__browser_snapshot` and verify:
- [ ] No "Edit Profile" button
- [ ] No editable form fields
- [ ] Share button IS available (viewing others' profiles can still share)

### Step 7: Test Share Button on Other Profile
1. Use `mcp__playwright__browser_click` on Share button
2. Use `mcp__playwright__browser_snapshot` to verify:
   - [ ] Dropdown opens with "Copy link" and "Share to X"
3. Click outside or press Escape to close
4. Use `mcp__playwright__browser_snapshot` to verify dropdown closed

### Step 8: Test URL Rewriting
**TC4.4 - URL Rewriting Test:**
If the user has a username (not anonymous):

1. Get the username from the current profile
2. Use `mcp__playwright__browser_navigate` to:
   ```
   http://localhost:3000/@[username]
   ```
3. Use `mcp__playwright__browser_snapshot` to verify:
   - [ ] Page loads correctly
   - [ ] Same profile content displayed

4. Use `mcp__playwright__browser_navigate` to:
   ```
   http://localhost:3000/[username]
   ```
5. Use `mcp__playwright__browser_snapshot` to verify:
   - [ ] Page loads correctly
   - [ ] Same profile content displayed

### Step 9: Verify Logo Navigation Back
1. Use `mcp__playwright__browser_click` on the logo (vibetracking)
2. Use `mcp__playwright__browser_snapshot` to verify:
   - [ ] Returned to homepage
   - [ ] "My Profile" button still visible (still connected)

### Step 10: Check Console Errors
Use `mcp__playwright__browser_console_messages` with level="error":
- [ ] No JavaScript errors on another user's profile

### Step 11: Take Screenshot
Use `mcp__playwright__browser_take_screenshot` with filename="e2e-another-user-profile.png"

---

## Alternative: Create Second Test User

If only one user exists, create another for testing:

1. Open a new browser tab with `mcp__playwright__browser_tabs` action="new"
2. Generate different test data (different stats)
3. Navigate to import page with new encoded data
4. Complete anonymous registration with different name:
   - Display Name: "Second Test User"
   - Company: "Other Corp"
5. Note this user's anonymousId
6. Switch back to original tab
7. Navigate to homepage
8. Find and click on "Second Test User" in leaderboard
9. Continue with verification steps

---

## Report Results

```markdown
## E2E Test Results: Another User's Profile

### Test Context
- Current User: [your anonymousId/name]
- Viewed User: [other user's name/id]

### Summary
- Total: 6 test cases
- Passed: X
- Failed: Y

### Results
| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| TC4.1 | Navigate to Different User | | |
| TC4.2 | Profile Data Display | | |
| TC4.3 | No Edit Capabilities | | |
| TC4.4 | URL Rewriting | | |
| TC7.1 | Logo Navigation | | |
| TC8.2 | Console Errors | | |

### Screenshots
- e2e-another-user-profile.png

### Console Errors
[List any errors found or "None"]

### Status: PASS/FAIL
```
