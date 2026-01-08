# E2E Test: Profile Page

Comprehensive testing of profile pages including own profile, other users, responsive design, and share functionality.

## Prerequisites
- Dev server running at http://localhost:3000
- Test user created (run `/e2e/test-import` first)
- Note the test user's anonymous ID

---

## Part A: Own Profile

### A1: Navigate to Own Profile
```
mcp__playwright__browser_navigate: http://localhost:3000/u/[USER_ID]
mcp__playwright__browser_snapshot
```

### A2: Header Verification (PRF-01)
**Verify from snapshot:**
- [ ] PRF-01: Header displays:
  - Display name (e.g., "Import Test User")
  - Company (e.g., "Test Company Inc")
  - Username format: "Anonymous #[ID]"
  - Avatar circle with initials

### A3: Stats Grid (PRF-02)
**Verify from snapshot:**
- [ ] PRF-02: Stats grid shows 4 columns:
  - Total Tokens (formatted number, e.g., "4.6M")
  - Sessions (e.g., "54")
  - Current Streak (X days)
  - Active Days (calculated from daily activity)

### A4: Highlights Card (PRF-03)
**Verify from snapshot:**
- [ ] PRF-03: Highlights section shows:
  - Favorite Model (e.g., claude-sonnet-4-20250514)
  - Favorite Tool (claude_code)
  - Longest Session (e.g., "2h")
  - Best Streak (X days)

### A5: Timeline Card (PRF-04)
**Verify from snapshot:**
- [ ] PRF-04: Timeline shows:
  - First Activity date
  - Last Activity date

### A6: Activity Heatmap (PRF-05, PRF-06)
**Verify from snapshot:**
- [ ] PRF-05: Heatmap grid renders (365 days)
- [ ] Month labels visible (Jan-Dec)
- [ ] Day labels visible (Mon, Wed, Fri)
- [ ] Color intensity varies with activity

Test tooltip:
```
mcp__playwright__browser_hover: element="heatmap cell with activity", ref="[cell-ref]"
mcp__playwright__browser_snapshot
```

**Verify:**
- [ ] PRF-06: Tooltip shows date and token count

### A7: Fun Comparison (PRF-07)
**Verify from snapshot (if tokens > 10K):**
- [ ] PRF-07: Fun comparison box displays (novels, tweets, etc.)

### A8: Share Button (PRF-08, PRF-09)
```
mcp__playwright__browser_click: element="Share button", ref="[share-ref]"
mcp__playwright__browser_snapshot
```

**Verify (PRF-08):**
- [ ] Dropdown opens with options:
  - Copy link
  - Share to X

Test copy link:
```
mcp__playwright__browser_click: element="Copy link option", ref="[copy-ref]"
mcp__playwright__browser_snapshot
```

**Verify (PRF-09):**
- [ ] "Copied!" confirmation appears
- [ ] Dropdown closes

---

## Part B: Another User's Profile

### B1: Navigate to Different User
Go to homepage and click a different user in leaderboard:
```
mcp__playwright__browser_navigate: http://localhost:3000
mcp__playwright__browser_snapshot
```

Find and click another user (not the test user):
```
mcp__playwright__browser_click: element="different user in leaderboard", ref="[user-ref]"
mcp__playwright__browser_snapshot
```

### B2: Verify Profile Display
**Verify all sections display:**
- [ ] Header with different user's name
- [ ] Stats grid
- [ ] Highlights
- [ ] Timeline
- [ ] Heatmap

### B3: No Edit Capability (PRF-10)
**Verify (PRF-10):**
- [ ] No edit buttons visible
- [ ] No settings/gear icons
- [ ] Share button still available

---

## Part C: Responsive Design

### C1: Mobile View (RSP-01, RSP-02)
```
mcp__playwright__browser_resize: width=375, height=667
mcp__playwright__browser_navigate: http://localhost:3000/u/[USER_ID]
mcp__playwright__browser_snapshot
```

**Verify:**
- [ ] RSP-01: No horizontal scrollbar
- [ ] RSP-02: Text readable, layout stacked vertically

```
mcp__playwright__browser_take_screenshot: filename="profile-mobile.png"
```

### C2: Tablet View (RSP-03)
```
mcp__playwright__browser_resize: width=768, height=1024
mcp__playwright__browser_snapshot
```

**Verify:**
- [ ] RSP-03: Stats grid adjusts (2 columns or responsive)

```
mcp__playwright__browser_take_screenshot: filename="profile-tablet.png"
```

### C3: Desktop View (RSP-04)
```
mcp__playwright__browser_resize: width=1280, height=800
mcp__playwright__browser_snapshot
```

**Verify:**
- [ ] RSP-04: Full layout visible
- [ ] Decorative elements properly positioned

```
mcp__playwright__browser_take_screenshot: filename="profile-desktop.png"
```

---

## Part D: Navigation Tests

### D1: Logo Navigation (NAV-01)
```
mcp__playwright__browser_click: element="logo", ref="[logo-ref]"
mcp__playwright__browser_snapshot
```

**Verify (NAV-01):**
- [ ] Navigated to homepage
- [ ] Still logged in (if authenticated)

### D2: URL Rewriting (NAV-02)
Test /@username format (if mock users exist):
```
mcp__playwright__browser_navigate: http://localhost:3000/@sarah_codes
mcp__playwright__browser_snapshot
```

**Verify (NAV-02):**
- [ ] Page loads or shows appropriate 404
- [ ] URL rewriting works

---

## Console Error Check (CON-03)
```
mcp__playwright__browser_console_messages: level="error"
```

**Verify:**
- [ ] CON-03: No JavaScript errors on profile pages

---

## Report

```markdown
## E2E Test Results: Profile Page

### Environment
- Date: [timestamp]
- URL: http://localhost:3000

### Part A: Own Profile
| ID | Description | Status | Notes |
|----|-------------|--------|-------|
| PRF-01 | Header display | | |
| PRF-02 | Stats grid | | |
| PRF-03 | Highlights | | |
| PRF-04 | Timeline | | |
| PRF-05 | Heatmap render | | |
| PRF-06 | Heatmap tooltip | | |
| PRF-07 | Fun comparison | | |
| PRF-08 | Share dropdown | | |
| PRF-09 | Copy link | | |

### Part B: Other User Profile
| ID | Description | Status | Notes |
|----|-------------|--------|-------|
| PRF-10 | No edit buttons | | |

### Part C: Responsive
| ID | Description | Status | Notes |
|----|-------------|--------|-------|
| RSP-01 | Mobile no scroll | | |
| RSP-02 | Mobile readable | | |
| RSP-03 | Tablet layout | | |
| RSP-04 | Desktop full | | |

### Part D: Navigation
| ID | Description | Status | Notes |
|----|-------------|--------|-------|
| NAV-01 | Logo navigation | | |
| NAV-02 | URL rewriting | | |

### Console Errors
[List or "None"]

### Screenshots
- profile-mobile.png
- profile-tablet.png
- profile-desktop.png

**Status: PASS / FAIL**
```
