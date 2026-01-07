# E2E Test: Own Profile Page (Connected)

Test viewing your own profile page while logged in.

## Prerequisites
- Dev server must be running at http://localhost:3000
- Must have completed onboarding to have an active anonymous user
- Know your anonymousId from the onboarding process

## Test Procedure

### Step 1: Navigate to Own Profile
Use `mcp__playwright__browser_navigate` to:
```
http://localhost:3000/u/[anonymousId]
```

Or from homepage:
1. Navigate to http://localhost:3000
2. Click "My Profile" button

### Step 2: Verify Profile Header
**TC3.1 - Profile Header:**
Use `mcp__playwright__browser_snapshot` and verify:
- [ ] Display name shows correctly (e.g., "E2E Connected Test")
- [ ] Company shows if set (e.g., "Test Corp")
- [ ] Username shows as "Anonymous #[first8chars]"
- [ ] Avatar circle with initials displays

### Step 3: Verify Stats Grid
**TC3.2 - Stats Grid:**
Use `mcp__playwright__browser_snapshot` and verify 4-column stats:
- [ ] **Total Tokens** - Shows formatted number (e.g., "10.0M" or "10,000,000")
- [ ] **Sessions** - Shows session count (e.g., "250")
- [ ] **Current Streak** - Shows "X days"
- [ ] **Active Days** - Shows calculated number

### Step 4: Verify Highlights Card
**TC3.3 - Highlights Card:**
Use `mcp__playwright__browser_snapshot` and verify:
- [ ] **Favorite Model** - Shows model tag (e.g., "claude-sonnet-4-20250514")
- [ ] **Favorite Tool** - Shows tool (e.g., "claude_code")
- [ ] **Longest Session** - Formatted as hours/minutes (e.g., "2h 30m")
- [ ] **Best Streak** - Shows days

### Step 5: Verify Timeline Card
**TC3.4 - Timeline Card:**
Use `mcp__playwright__browser_snapshot` and verify:
- [ ] **First Activity** - Shows date (e.g., "Oct 1, 2024")
- [ ] **Last Activity** - Shows date (e.g., "Dec 20, 2024")

### Step 6: Verify Activity Heatmap
**TC3.5 - Activity Heatmap:**
Use `mcp__playwright__browser_snapshot` and verify:
- [ ] 365-day grid rendered (52-53 columns x 7 rows)
- [ ] Month labels visible (Jan, Feb, Mar... Dec)
- [ ] Day labels visible (Mon, Wed, Fri on left)
- [ ] Color intensity varies based on activity
- [ ] Legend shows "Less" to "More" gradient

**Test Heatmap Tooltip:**
1. Use `mcp__playwright__browser_hover` on a heatmap cell with activity
2. Use `mcp__playwright__browser_snapshot` to verify:
   - [ ] Tooltip shows date
   - [ ] Tooltip shows token count

### Step 7: Verify Fun Comparison (Conditional)
**TC3.6 - Fun Comparison:**
If totalTokens > 10,000 (which our test data has):
Use `mcp__playwright__browser_snapshot` and verify:
- [ ] Fun comparison box is visible
- [ ] Shows one of the random comparisons:
  - "X novels worth of code"
  - "X tweets worth of prompts"
  - "Longer than the movie Inception"
  - "X marathons of coding"

### Step 8: Test Share Button
**TC3.7 - Share Button:**
1. Use `mcp__playwright__browser_click` on Share button
2. Use `mcp__playwright__browser_snapshot` to verify:
   - [ ] Dropdown opens
   - [ ] "Copy link" option visible
   - [ ] "Share to X" option visible

3. **Test Copy Link:**
   - Click "Copy link"
   - Verify "Copied!" confirmation appears
   - Verify dropdown closes

4. **Re-open and test Share to X:**
   - Click Share button again
   - Click "Share to X"
   - Note: This will open a new window/tab to Twitter

### Step 9: Check Console Errors
**TC8.2 - Profile Console:**
Use `mcp__playwright__browser_console_messages` with level="error":
- [ ] No JavaScript errors on own profile

### Step 10: Test Profile Data Accuracy
Compare displayed stats with the test data that was imported:
- [ ] Total Tokens matches import data
- [ ] Sessions matches import data
- [ ] Favorite Model matches most-used model from import
- [ ] Date range matches import data

### Step 11: Take Screenshot
Use `mcp__playwright__browser_take_screenshot` with filename="e2e-own-profile.png"

### Step 12: Take Full Page Screenshot
Use `mcp__playwright__browser_take_screenshot` with:
- filename="e2e-own-profile-full.png"
- fullPage=true

---

## Responsive Profile Tests

### Mobile View (375x667)
1. Use `mcp__playwright__browser_resize` width=375 height=667
2. Use `mcp__playwright__browser_snapshot` to verify:
   - [ ] Stats grid stacks to fewer columns
   - [ ] Content fits without horizontal scroll
   - [ ] Heatmap is scrollable
   - [ ] Text remains readable
3. Use `mcp__playwright__browser_take_screenshot` filename="e2e-own-profile-mobile.png"

### Tablet View (768x1024)
1. Use `mcp__playwright__browser_resize` width=768 height=1024
2. Use `mcp__playwright__browser_snapshot` to verify:
   - [ ] Stats grid shows 2 columns
   - [ ] Layout adapts appropriately
3. Use `mcp__playwright__browser_take_screenshot` filename="e2e-own-profile-tablet.png"

### Desktop View (1280x800)
1. Use `mcp__playwright__browser_resize` width=1280 height=800
2. Use `mcp__playwright__browser_snapshot` to verify:
   - [ ] Full 4-column stats grid
   - [ ] All content visible without scroll
3. Use `mcp__playwright__browser_take_screenshot` filename="e2e-own-profile-desktop.png"

---

## Report Results

```markdown
## E2E Test Results: Own Profile Page

### Test Context
- Anonymous ID: [anonymousId]
- Display Name: [name set during onboarding]
- Import Data Tokens: [totalTokens from import]

### Summary
- Total: 11 test cases
- Passed: X
- Failed: Y

### Results
| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| TC3.1 | Profile Header | | |
| TC3.2 | Stats Grid | | |
| TC3.3 | Highlights Card | | |
| TC3.4 | Timeline Card | | |
| TC3.5 | Activity Heatmap | | |
| TC3.6 | Fun Comparison | | |
| TC3.7 | Share Button | | |
| TC6.1 | Mobile View | | |
| TC6.2 | Tablet View | | |
| TC6.3 | Desktop View | | |
| TC8.2 | Console Errors | | |

### Data Accuracy
| Metric | Expected | Actual | Match |
|--------|----------|--------|-------|
| Total Tokens | | | |
| Sessions | | | |
| Favorite Model | | | |

### Screenshots
- e2e-own-profile.png
- e2e-own-profile-full.png
- e2e-own-profile-mobile.png
- e2e-own-profile-tablet.png
- e2e-own-profile-desktop.png

### Console Errors
[List any errors found or "None"]

### Status: PASS/FAIL
```
