# E2E Test: Full Regression Suite

Complete end-to-end test suite executing all tests in proper dependency order. Use this for full regression testing before releases.

## Prerequisites
- Dev server running at http://localhost:3000
- Fresh browser state (clear cookies/session)
- ~15-20 minutes to complete

## Execution Order

Tests must run in this sequence due to dependencies:

```
Phase 1: Homepage (Unauthenticated) → No dependencies
Phase 2: Import + Registration → Creates User A
Phase 3: Homepage (Authenticated) → Requires User A
Phase 4: Own Profile → Requires User A
Phase 5: Create Second User → Creates User B
Phase 6: Other User Profile → View User B as User A
Phase 7: Responsive Design → Uses User A profile
Phase 8: Navigation Tests → General
Phase 9: Console Error Summary → Aggregate
```

---

## Phase 1: Homepage (Unauthenticated)

### 1.1 Fresh Start
```
mcp__playwright__browser_tabs: action="new"
mcp__playwright__browser_navigate: http://localhost:3000
mcp__playwright__browser_snapshot
```

### 1.2 Verify Layout
- [ ] HP-01: Logo "vibetracking" visible
- [ ] HP-02: Headline visible
- [ ] HP-03: CTA box visible
- [ ] HP-07: NO "My Profile" button

### 1.3 Test Copy Button
```
mcp__playwright__browser_click: element="copy button", ref="[ref]"
mcp__playwright__browser_snapshot
```
- [ ] HP-04: "Copied!" appears, then reverts

### 1.4 Verify Leaderboard
- [ ] HP-05: Table with columns visible
- [ ] HP-06: Medal emojis on top 3

### 1.5 Screenshot
```
mcp__playwright__browser_take_screenshot: filename="1-homepage-unauth.png"
```

---

## Phase 2: Import + Create User A

### 2.1 Generate User A Data
```javascript
// "Power User" profile - high usage
const userA = {
  timestamp: Date.now(),
  version: 1,
  tools: {
    claude_code: {
      tool: "claude_code",
      dailyActivity: [
        { date: "2024-10-01", tool: "claude_code", messageCount: 200, sessionCount: 20, totalTokens: 1500000 },
        { date: "2024-10-02", tool: "claude_code", messageCount: 180, sessionCount: 18, totalTokens: 1300000 },
        { date: "2024-10-03", tool: "claude_code", messageCount: 150, sessionCount: 15, totalTokens: 1100000 },
        // ... 60+ days of activity
      ],
      modelUsage: [
        { model: "claude-sonnet-4-20250514", inputTokens: 5000000, outputTokens: 2000000, cacheReadTokens: 4000000 },
        { model: "claude-3-5-haiku-20241022", inputTokens: 800000, outputTokens: 200000 }
      ],
      stats: {
        totalTokens: 12000000,
        totalSessions: 300,
        totalMessages: 6000,
        longestSessionMs: 10800000,
        firstActivityDate: "2024-10-01",
        lastActivityDate: "2024-12-20"
      }
    }
  }
};
```

### 2.2 Navigate to Import
```
mcp__playwright__browser_navigate: http://localhost:3000/import#[ENCODED_USER_A_DATA]
mcp__playwright__browser_snapshot
```

### 2.3 Verify Stats Preview
- [ ] IMP-01: Shows ~12M tokens, 300 sessions
- [ ] IMP-02: GitHub button visible
- [ ] IMP-03: Anonymous option visible

### 2.4 Complete Registration
```
mcp__playwright__browser_click: element="Continue without login", ref="[ref]"
mcp__playwright__browser_type: element="Display Name", ref="[ref]", text="Power Coder Alice"
mcp__playwright__browser_type: element="Company", ref="[ref]", text="Anthropic Labs"
mcp__playwright__browser_click: element="Save Profile", ref="[ref]"
mcp__playwright__browser_wait_for: text="Power Coder Alice"
mcp__playwright__browser_snapshot
```

### 2.5 Capture User A ID
**USER_A_ID:** [note from URL: /u/XXXXX]

### 2.6 Verify Redirect
- [ ] IMP-06: Redirected to /u/[USER_A_ID]
- [ ] Profile shows "Power Coder Alice"

### 2.7 Screenshot
```
mcp__playwright__browser_take_screenshot: filename="2-user-a-created.png"
```

---

## Phase 3: Homepage (Authenticated)

### 3.1 Navigate to Homepage
```
mcp__playwright__browser_navigate: http://localhost:3000
mcp__playwright__browser_snapshot
```

### 3.2 Verify Authenticated State
- [ ] HPA-01: "My Profile" button IS visible
- [ ] HPA-02: User A highlighted in leaderboard

### 3.3 Test Profile Navigation
```
mcp__playwright__browser_click: element="My Profile button", ref="[ref]"
mcp__playwright__browser_snapshot
```
- [ ] HPA-03: Navigated to /u/[USER_A_ID]

### 3.4 Screenshot
```
mcp__playwright__browser_navigate_back
mcp__playwright__browser_take_screenshot: filename="3-homepage-auth.png"
```

---

## Phase 4: Own Profile (User A)

### 4.1 Navigate to Profile
```
mcp__playwright__browser_navigate: http://localhost:3000/u/[USER_A_ID]
mcp__playwright__browser_snapshot
```

### 4.2 Verify All Sections
- [ ] PRF-01: Header - "Power Coder Alice", "Anthropic Labs", "Anonymous #..."
- [ ] PRF-02: Stats - ~12M tokens, 300 sessions, streak, active days
- [ ] PRF-03: Highlights - claude-sonnet-4, claude_code, ~3h session
- [ ] PRF-04: Timeline - Oct 1 to Dec 20, 2024
- [ ] PRF-05: Heatmap renders with activity
- [ ] PRF-07: Fun comparison box (tokens > 10K)

### 4.3 Test Share Button
```
mcp__playwright__browser_click: element="Share button", ref="[ref]"
mcp__playwright__browser_snapshot
```
- [ ] PRF-08: Dropdown opens

```
mcp__playwright__browser_click: element="Copy link", ref="[ref]"
mcp__playwright__browser_snapshot
```
- [ ] PRF-09: "Copied!" confirmation

### 4.4 Screenshot
```
mcp__playwright__browser_take_screenshot: filename="4-own-profile.png"
```

---

## Phase 5: Create User B

### 5.1 Open New Tab
```
mcp__playwright__browser_tabs: action="new"
```

### 5.2 Generate User B Data
```javascript
// "Casual User" profile - lower usage
const userB = {
  timestamp: Date.now(),
  version: 1,
  tools: {
    claude_code: {
      tool: "claude_code",
      dailyActivity: [
        { date: "2024-11-15", tool: "claude_code", messageCount: 50, sessionCount: 5, totalTokens: 300000 },
        { date: "2024-11-20", tool: "claude_code", messageCount: 40, sessionCount: 4, totalTokens: 250000 }
      ],
      modelUsage: [
        { model: "claude-3-5-haiku-20241022", inputTokens: 400000, outputTokens: 150000 }
      ],
      stats: {
        totalTokens: 550000,
        totalSessions: 9,
        totalMessages: 90,
        longestSessionMs: 3600000,
        firstActivityDate: "2024-11-15",
        lastActivityDate: "2024-11-20"
      }
    }
  }
};
```

### 5.3 Import and Register
```
mcp__playwright__browser_navigate: http://localhost:3000/import#[ENCODED_USER_B_DATA]
mcp__playwright__browser_click: element="Continue without login", ref="[ref]"
mcp__playwright__browser_type: element="Display Name", ref="[ref]", text="Casual Coder Bob"
mcp__playwright__browser_type: element="Company", ref="[ref]", text="Indie Dev"
mcp__playwright__browser_click: element="Save Profile", ref="[ref]"
mcp__playwright__browser_wait_for: text="Casual Coder Bob"
```

### 5.4 Capture User B ID
**USER_B_ID:** [note from URL]

### 5.5 Close Tab (Return to User A)
```
mcp__playwright__browser_tabs: action="close"
```

---

## Phase 6: Other User Profile (View B as A)

### 6.1 Navigate to User B
```
mcp__playwright__browser_navigate: http://localhost:3000/u/[USER_B_ID]
mcp__playwright__browser_snapshot
```

### 6.2 Verify Profile Display
- [ ] Shows "Casual Coder Bob"
- [ ] Shows "Indie Dev"
- [ ] Stats show ~550K tokens

### 6.3 Verify No Edit
- [ ] PRF-10: No edit buttons visible
- [ ] Share button available

### 6.4 Screenshot
```
mcp__playwright__browser_take_screenshot: filename="6-other-profile.png"
```

---

## Phase 7: Responsive Design

### 7.1 Mobile
```
mcp__playwright__browser_resize: width=375, height=667
mcp__playwright__browser_navigate: http://localhost:3000/u/[USER_A_ID]
mcp__playwright__browser_snapshot
```
- [ ] RSP-01: No horizontal scroll
- [ ] RSP-02: Text readable

```
mcp__playwright__browser_take_screenshot: filename="7a-mobile.png"
```

### 7.2 Tablet
```
mcp__playwright__browser_resize: width=768, height=1024
mcp__playwright__browser_snapshot
```
- [ ] RSP-03: Layout adapts

```
mcp__playwright__browser_take_screenshot: filename="7b-tablet.png"
```

### 7.3 Desktop
```
mcp__playwright__browser_resize: width=1280, height=800
mcp__playwright__browser_snapshot
```
- [ ] RSP-04: Full layout

```
mcp__playwright__browser_take_screenshot: filename="7c-desktop.png"
```

---

## Phase 8: Navigation Tests

### 8.1 Logo Navigation
```
mcp__playwright__browser_click: element="logo", ref="[ref]"
mcp__playwright__browser_snapshot
```
- [ ] NAV-01: Returns to homepage

### 8.2 Reserved Paths
```
mcp__playwright__browser_navigate: http://localhost:3000/api
mcp__playwright__browser_snapshot
```
- [ ] NAV-03: NOT rewritten as username

---

## Phase 9: Console Error Summary

```
mcp__playwright__browser_console_messages: level="error"
```

- [ ] CON-01: No homepage errors
- [ ] CON-02: No import page errors
- [ ] CON-03: No profile page errors

---

## Final Report

```markdown
# Full E2E Regression Results

## Execution
- Date: [timestamp]
- Duration: [X minutes]
- Browser: Chromium (Playwright MCP)

## Users Created
| User | ID | Display Name | Company | Tokens |
|------|----|--------------|---------|--------|
| A | [USER_A_ID] | Power Coder Alice | Anthropic Labs | 12M |
| B | [USER_B_ID] | Casual Coder Bob | Indie Dev | 550K |

## Summary
- Total Tests: 35
- Passed: X
- Failed: Y

## Phase Results

### Phase 1: Homepage (Unauth)
| ID | Status |
|----|--------|
| HP-01 to HP-07 | |

### Phase 2: Import
| ID | Status |
|----|--------|
| IMP-01 to IMP-06 | |

### Phase 3: Homepage (Auth)
| ID | Status |
|----|--------|
| HPA-01 to HPA-03 | |

### Phase 4: Own Profile
| ID | Status |
|----|--------|
| PRF-01 to PRF-09 | |

### Phase 5-6: Other Profile
| ID | Status |
|----|--------|
| PRF-10 | |

### Phase 7: Responsive
| ID | Status |
|----|--------|
| RSP-01 to RSP-04 | |

### Phase 8: Navigation
| ID | Status |
|----|--------|
| NAV-01, NAV-03 | |

### Phase 9: Console
| ID | Status |
|----|--------|
| CON-01 to CON-03 | |

## Screenshots
1. 1-homepage-unauth.png
2. 2-user-a-created.png
3. 3-homepage-auth.png
4. 4-own-profile.png
5. 6-other-profile.png
6. 7a-mobile.png
7. 7b-tablet.png
8. 7c-desktop.png

## Console Errors
[List all or "None"]

## Overall: PASS / FAIL
```
