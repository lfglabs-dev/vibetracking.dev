# Vibetracking E2E Test Plan

## Overview
Comprehensive end-to-end testing for the vibetracking application covering all user flows, authentication states, and page interactions.

## Prerequisites
- Dev server running at http://localhost:3000
- Playwright MCP tools available
- Test data generation capability (pako + base64url encoding)

---

## Test Suite 1: Homepage (Not Connected)

### TC1.1: Page Load and Layout
- Navigate to http://localhost:3000
- Verify logo displays "vibetracking" (pink "vibe" + green "tracking")
- Verify headline "Are you a good vibe Coder?" is visible
- Verify animated arrow pointing to CTA box
- Verify decorative stickers are positioned correctly

### TC1.2: CTA Box
- Verify command box shows `bunx vibetracking`
- Click copy button
- Verify "Copied!" confirmation appears
- Verify text changes back after ~2 seconds

### TC1.3: Leaderboard Display (Not Connected)
- Verify leaderboard table is visible
- Verify columns: Rank, Vibe Coder, Company, Est. API Spend, Sessions, Streak
- Verify top 3 have medal emojis (🥇🥈🥉)
- Verify at least mock data displays if no real users

### TC1.4: No Profile Button When Not Connected
- Verify "My Profile" button is NOT visible in header
- Verify no authenticated UI elements

### TC1.5: Leaderboard Row Navigation
- Click on any leaderboard row
- Verify navigation to that user's profile page
- Verify URL changes to /user/[username] or /u/[id]

---

## Test Suite 2: Homepage (Connected)

### TC2.1: Setup - Create Anonymous User
- Generate test import data
- Navigate to /import#[encoded-data]
- Complete anonymous registration
- Store anonymousId for later tests

### TC2.2: Homepage After Login
- Navigate to http://localhost:3000
- Verify "My Profile" button is visible in header
- Verify button links to /u/[anonymousId]

### TC2.3: Current User Highlight in Leaderboard
- Verify current user's row has highlighted background (light green)
- Verify hover effect on other rows

### TC2.4: Profile Button Click
- Click "My Profile" button
- Verify navigation to /u/[anonymousId]
- Verify profile page loads correctly

---

## Test Suite 3: Own Profile Page (Connected)

### TC3.1: Profile Header
- Navigate to /u/[anonymousId]
- Verify display name shows correctly
- Verify company shows if set
- Verify username shows as "Anonymous #[id]"
- Verify avatar/initials circle displays

### TC3.2: Stats Grid
- Verify 4-column stats grid on desktop:
  - Total Tokens (formatted number)
  - Sessions (formatted number)
  - Current Streak (X days)
  - Active Days (calculated)

### TC3.3: Highlights Card
- Verify Favorite Model displays with tag
- Verify Favorite Tool displays
- Verify Longest Session formatted as hours/minutes
- Verify Best Streak in days

### TC3.4: Timeline Card
- Verify First Activity date
- Verify Last Activity date

### TC3.5: Activity Heatmap
- Verify 365-day heatmap renders
- Verify month labels (Jan-Dec)
- Verify day labels (Mon, Wed, Fri)
- Verify color intensity varies with activity
- Verify tooltip on hover shows date and tokens

### TC3.6: Fun Comparison (if totalTokens > 10,000)
- Verify fun comparison box displays
- Verify random comparison text (novels, tweets, marathons, etc.)

### TC3.7: Share Button
- Click share button
- Verify dropdown opens with 2 options:
  - Copy link
  - Share to X
- Click "Copy link"
- Verify "Copied!" confirmation
- Verify dropdown closes

---

## Test Suite 4: Another User's Profile

### TC4.1: Navigate to Different User
- From homepage leaderboard, click on a different user
- Verify navigation to their profile

### TC4.2: Profile Data Display
- Verify all profile sections display:
  - Header with name/username
  - Stats grid
  - Highlights
  - Timeline
  - Activity heatmap

### TC4.3: No Edit Capabilities
- Verify no edit buttons or forms on another user's profile
- Verify share button still available

### TC4.4: URL Rewriting Test
- Navigate to /@username format
- Verify page loads correctly
- Verify URL rewritten to /user/username

---

## Test Suite 5: Import Page Flow

### TC5.1: Import Page with Valid Data
- Generate test import data
- Navigate to /import#[encoded-data]
- Verify stats preview displays:
  - Tools found (claude_code icon)
  - Total Tokens
  - Sessions
  - Messages
  - Longest Session
  - Favorite Model

### TC5.2: Auth Options Display
- Verify "Continue with GitHub" button
- Verify "Continue without login" option

### TC5.3: Anonymous Registration Form
- Click "Continue without login"
- Verify form expands with:
  - Display Name input (required)
  - Company input (optional)
- Fill Display Name
- Fill Company
- Click "Save Profile"
- Verify redirect to /u/[anonymousId]

### TC5.4: Import Error Handling
- Navigate to /import (no hash)
- Verify error message: "No data found. Please run `bunx vibetracking` first."
- Verify "Go Home" button available

---

## Test Suite 6: Responsive Design

### TC6.1: Mobile (375x667)
- Resize browser to 375x667
- Test homepage layout
- Test profile page layout
- Verify no horizontal scroll
- Verify text readable
- Verify leaderboard scrollable

### TC6.2: Tablet (768x1024)
- Resize browser to 768x1024
- Test all pages
- Verify stats grid adjusts columns

### TC6.3: Desktop (1280x800)
- Resize browser to 1280x800
- Test all pages
- Verify full layout with stickers

---

## Test Suite 7: Navigation & Links

### TC7.1: Logo Navigation
- From any page, click logo
- Verify navigation to homepage

### TC7.2: Reserved Paths
- Navigate to /api/test - should NOT rewrite
- Navigate to /import - should NOT rewrite
- Navigate to /auth/callback - should NOT rewrite

### TC7.3: Clean URL Support
- Navigate to /[username] (without @)
- Verify rewrite to /user/[username]
- Verify page loads correctly

---

## Test Suite 8: Console Errors Check

### TC8.1: Homepage Console
- Navigate to homepage
- Check console messages
- Report any errors/warnings

### TC8.2: Profile Console
- Navigate to profile page
- Check console messages
- Report any errors/warnings

### TC8.3: Import Console
- Navigate to import page
- Check console messages
- Report any errors/warnings

---

## Execution Order

1. **Test Suite 1** - Homepage Not Connected (baseline)
2. **Test Suite 5** - Import Page (creates test user)
3. **Test Suite 2** - Homepage Connected
4. **Test Suite 3** - Own Profile
5. **Test Suite 4** - Another User Profile
6. **Test Suite 6** - Responsive Design
7. **Test Suite 7** - Navigation
8. **Test Suite 8** - Console Errors

---

## Test Data Generation

```typescript
// Generate import data inline
const data = {
  timestamp: Date.now(),
  version: 1,
  tools: {
    claude_code: {
      tool: "claude_code",
      dailyActivity: [...], // 60-90 days
      modelUsage: [
        { model: "claude-sonnet-4-20250514", inputTokens: X, outputTokens: Y },
        { model: "claude-3-5-haiku-20241022", inputTokens: A, outputTokens: B }
      ],
      stats: {
        totalTokens: N,
        totalSessions: M,
        totalMessages: P,
        longestSessionMs: T,
        firstActivityDate: "YYYY-MM-DD",
        lastActivityDate: "YYYY-MM-DD"
      }
    }
  }
};

// Encode: gzip + base64url
const encoded = base64url(gzip(JSON.stringify(data)));
```

---

## Report Template

```markdown
## E2E Test Results: [Suite Name]

### Environment
- Date: [timestamp]
- URL: http://localhost:3000
- Browser: Chromium (Playwright)

### Summary
- Total: X tests
- Passed: Y
- Failed: Z

### Results
| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| TC1.1   | Page Load   | PASS   |       |

### Screenshots
- [List any screenshots taken]

### Console Errors
- [List any JS errors found]

### Recommendations
- [Actionable fixes if any]
```
