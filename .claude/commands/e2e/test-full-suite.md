# E2E Test: Full Test Suite

Execute the complete E2E test suite for vibetracking in the correct order.

## Prerequisites
- Dev server must be running at http://localhost:3000
- If not running, inform the user to start it with `npm run dev`
- Fresh browser state (no existing sessions)

## Execution Order

The tests must run in this specific order due to dependencies:

```
1. Homepage (Not Connected) → Baseline, no auth required
2. Import + Onboarding → Creates User A
3. Homepage (Connected) → Tests with User A session
4. Own Profile → Tests User A's profile
5. Create Second User → Creates User B
6. Another User Profile → View User B while logged as User A
7. Responsive Tests → All viewports
8. Navigation Tests → URL rewriting, logo links
9. Console Error Summary → Aggregate all errors
```

---

## Phase 1: Homepage Not Connected

### Step 1.1: Fresh Start
1. Use `mcp__playwright__browser_tabs` action="new" to ensure fresh tab
2. Use `mcp__playwright__browser_navigate` to http://localhost:3000

### Step 1.2: Verify Not Connected State
Use `mcp__playwright__browser_snapshot`:
- [ ] Logo visible
- [ ] "Are you a good vibe Coder?" headline
- [ ] CTA box with "bunx vibetracking"
- [ ] Leaderboard visible
- [ ] NO "My Profile" button

### Step 1.3: Test Copy Button
1. Click copy button
2. Verify "Copied!" appears
3. Wait 2s, verify reverts

### Step 1.4: Screenshot
`mcp__playwright__browser_take_screenshot` filename="1-homepage-not-connected.png"

---

## Phase 2: Onboarding - Create User A

### Step 2.1: Generate Test Data for User A
Generate inline with these approximate values:
```javascript
// User A - "Power User" persona
{
  timestamp: Date.now(),
  version: 1,
  tools: {
    claude_code: {
      tool: "claude_code",
      dailyActivity: generateDays(75), // 75 days of activity
      modelUsage: [
        { model: "claude-sonnet-4-20250514", inputTokens: 5000000, outputTokens: 2000000, cacheReadTokens: 4000000 },
        { model: "claude-3-5-haiku-20241022", inputTokens: 800000, outputTokens: 200000 }
      ],
      stats: {
        totalTokens: 12000000,
        totalSessions: 300,
        totalMessages: 6000,
        longestSessionMs: 10800000, // 3 hours
        firstActivityDate: "2024-10-01",
        lastActivityDate: "2024-12-20"
      }
    }
  }
}
```

### Step 2.2: Navigate to Import
`mcp__playwright__browser_navigate` to http://localhost:3000/import#[encoded-data-A]

### Step 2.3: Verify Stats Preview
Use `mcp__playwright__browser_snapshot`:
- [ ] Total Tokens: ~12M
- [ ] Sessions: ~300
- [ ] Tools: claude_code

### Step 2.4: Complete Anonymous Registration
1. Click "Continue without login"
2. Fill form:
   - Display Name: "Power Coder Alice"
   - Company: "Anthropic Labs"
3. Click "Save Profile"
4. **CAPTURE**: Note the anonymousId from redirect URL → `USER_A_ID`

### Step 2.5: Verify Redirect
Use `mcp__playwright__browser_snapshot`:
- [ ] URL is /u/[USER_A_ID]
- [ ] Profile shows "Power Coder Alice"

### Step 2.6: Screenshot
`mcp__playwright__browser_take_screenshot` filename="2-user-a-created.png"

---

## Phase 3: Homepage Connected (As User A)

### Step 3.1: Navigate to Homepage
`mcp__playwright__browser_navigate` to http://localhost:3000

### Step 3.2: Verify Connected State
Use `mcp__playwright__browser_snapshot`:
- [ ] "My Profile" button IS visible
- [ ] User A highlighted in leaderboard

### Step 3.3: Test Profile Button
1. Click "My Profile"
2. Verify navigation to /u/[USER_A_ID]

### Step 3.4: Return to Homepage
`mcp__playwright__browser_navigate_back`

### Step 3.5: Screenshot
`mcp__playwright__browser_take_screenshot` filename="3-homepage-connected.png"

---

## Phase 4: Own Profile (User A)

### Step 4.1: Navigate to Own Profile
`mcp__playwright__browser_navigate` to http://localhost:3000/u/[USER_A_ID]

### Step 4.2: Verify All Sections
Use `mcp__playwright__browser_snapshot`:

**Header:**
- [ ] "Power Coder Alice"
- [ ] "Anthropic Labs"
- [ ] "Anonymous #[USER_A_ID]"

**Stats Grid:**
- [ ] Total Tokens (~12M)
- [ ] Sessions (~300)
- [ ] Streak
- [ ] Active Days

**Highlights:**
- [ ] Favorite Model: claude-sonnet-4-20250514
- [ ] Favorite Tool: claude_code
- [ ] Longest Session: ~3h
- [ ] Best Streak

**Timeline:**
- [ ] First: Oct 1, 2024
- [ ] Last: Dec 20, 2024

**Heatmap:**
- [ ] Grid visible
- [ ] Month labels
- [ ] Color variation

### Step 4.3: Test Share Button
1. Click Share
2. Verify dropdown
3. Click "Copy link"
4. Verify "Copied!"

### Step 4.4: Screenshot
`mcp__playwright__browser_take_screenshot` filename="4-own-profile.png"

---

## Phase 5: Create User B (Second User)

### Step 5.1: Open New Tab
`mcp__playwright__browser_tabs` action="new"

### Step 5.2: Generate Test Data for User B
```javascript
// User B - "Casual User" persona
{
  timestamp: Date.now(),
  version: 1,
  tools: {
    claude_code: {
      tool: "claude_code",
      dailyActivity: generateDays(30), // 30 days of activity
      modelUsage: [
        { model: "claude-3-5-haiku-20241022", inputTokens: 1500000, outputTokens: 500000 }
      ],
      stats: {
        totalTokens: 2000000,
        totalSessions: 50,
        totalMessages: 800,
        longestSessionMs: 3600000, // 1 hour
        firstActivityDate: "2024-11-15",
        lastActivityDate: "2024-12-18"
      }
    }
  }
}
```

### Step 5.3: Complete Onboarding for User B
1. Navigate to http://localhost:3000/import#[encoded-data-B]
2. Click "Continue without login"
3. Fill:
   - Display Name: "Casual Coder Bob"
   - Company: "Indie Dev"
4. Click "Save Profile"
5. **CAPTURE**: Note anonymousId → `USER_B_ID`

### Step 5.4: Screenshot
`mcp__playwright__browser_take_screenshot` filename="5-user-b-created.png"

### Step 5.5: Close Tab, Return to User A Tab
`mcp__playwright__browser_tabs` action="close"
(Returns to previous tab with User A context)

---

## Phase 6: Another User Profile (View User B as User A)

### Step 6.1: Navigate to Homepage
`mcp__playwright__browser_navigate` to http://localhost:3000

### Step 6.2: Find User B in Leaderboard
Use `mcp__playwright__browser_snapshot`:
- Find "Casual Coder Bob" in leaderboard

### Step 6.3: Click on User B
1. Click on User B's row
2. Verify navigation to /u/[USER_B_ID]

### Step 6.4: Verify User B's Profile
Use `mcp__playwright__browser_snapshot`:
- [ ] "Casual Coder Bob"
- [ ] "Indie Dev"
- [ ] Stats show ~2M tokens, 50 sessions

### Step 6.5: Verify No Edit Capability
- [ ] No edit buttons visible
- [ ] Share button available

### Step 6.6: Test Logo Navigation
1. Click logo
2. Verify return to homepage
3. Verify still logged in as User A

### Step 6.7: Screenshot
`mcp__playwright__browser_take_screenshot` filename="6-another-user-profile.png"

---

## Phase 7: Responsive Testing

### Step 7.1: Mobile (375x667)
1. `mcp__playwright__browser_resize` width=375 height=667
2. Navigate to http://localhost:3000
3. Snapshot - verify layout
4. Navigate to /u/[USER_A_ID]
5. Snapshot - verify profile layout
6. Screenshot: "7a-mobile.png"

### Step 7.2: Tablet (768x1024)
1. `mcp__playwright__browser_resize` width=768 height=1024
2. Navigate to homepage, snapshot
3. Navigate to profile, snapshot
4. Screenshot: "7b-tablet.png"

### Step 7.3: Desktop (1280x800)
1. `mcp__playwright__browser_resize` width=1280 height=800
2. Navigate to homepage, snapshot
3. Navigate to profile, snapshot
4. Screenshot: "7c-desktop.png"

---

## Phase 8: Navigation Tests

### Step 8.1: URL Rewriting (if applicable with real usernames)
Test with mock user if available:
1. Navigate to /@sarah_codes
2. Verify page loads or appropriate error
3. Navigate to /sarah_codes
4. Verify same behavior

### Step 8.2: Reserved Paths
1. Navigate to /api - should NOT be username
2. Navigate to /import - should show import page
3. Navigate to /auth/callback - should handle gracefully

---

## Phase 9: Console Error Summary

### Step 9.1: Collect All Console Messages
`mcp__playwright__browser_console_messages` level="error"

### Step 9.2: Document Any Errors
List all JavaScript errors encountered across all phases.

---

## Final Report Template

```markdown
# E2E Full Test Suite Results

## Execution Date
[timestamp]

## Environment
- URL: http://localhost:3000
- Browser: Chromium via Playwright MCP

## Users Created
| User | Anonymous ID | Display Name | Company | Tokens |
|------|--------------|--------------|---------|--------|
| A | [USER_A_ID] | Power Coder Alice | Anthropic Labs | 12M |
| B | [USER_B_ID] | Casual Coder Bob | Indie Dev | 2M |

## Summary
- Total Test Cases: 40+
- Passed: X
- Failed: Y
- Skipped: Z

## Phase Results

### Phase 1: Homepage Not Connected
| Test | Status | Notes |
|------|--------|-------|
| Page Load | | |
| No Profile Button | | |
| CTA Copy | | |
| Leaderboard | | |

### Phase 2: Onboarding User A
| Test | Status | Notes |
|------|--------|-------|
| Import Page Load | | |
| Stats Preview | | |
| Anonymous Form | | |
| Redirect | | |

### Phase 3: Homepage Connected
| Test | Status | Notes |
|------|--------|-------|
| Profile Button Visible | | |
| User Highlighted | | |
| Navigation Works | | |

### Phase 4: Own Profile
| Test | Status | Notes |
|------|--------|-------|
| Header | | |
| Stats Grid | | |
| Highlights | | |
| Timeline | | |
| Heatmap | | |
| Share Button | | |

### Phase 5: Create User B
| Test | Status | Notes |
|------|--------|-------|
| Import | | |
| Registration | | |
| Profile Created | | |

### Phase 6: Another User Profile
| Test | Status | Notes |
|------|--------|-------|
| Navigation | | |
| Profile Display | | |
| No Edit | | |
| Logo Navigation | | |

### Phase 7: Responsive
| Viewport | Homepage | Profile | Notes |
|----------|----------|---------|-------|
| Mobile | | | |
| Tablet | | | |
| Desktop | | | |

### Phase 8: Navigation
| Test | Status | Notes |
|------|--------|-------|
| URL Rewriting | | |
| Reserved Paths | | |

## Console Errors
[List all errors or "None found"]

## Screenshots Taken
1. 1-homepage-not-connected.png
2. 2-user-a-created.png
3. 3-homepage-connected.png
4. 4-own-profile.png
5. 5-user-b-created.png
6. 6-another-user-profile.png
7. 7a-mobile.png
8. 7b-tablet.png
9. 7c-desktop.png

## Recommendations
[List any issues found and suggested fixes]

## Overall Status: PASS / FAIL
```

---

## Notes

- This suite creates 2 test users in the database
- Tests should be run in sequence (dependencies between phases)
- Screenshots are stored in .playwright-mcp/ directory
- If any phase fails, document and continue with remaining phases
- Can be re-run by starting with a new browser session
