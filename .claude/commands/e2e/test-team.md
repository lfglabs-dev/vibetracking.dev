# E2E Test: Team Feature

Complete end-to-end testing of team creation and team profile pages.

## Prerequisites
- Dev server running at http://localhost:3000
- GitHub test account with lfglabs-dev org access (via bitwarden-secrets skill)
- Database migration 006_add_team_tables.sql applied
- ~10 minutes to complete

## Execution Order

Tests must run in this sequence:

```
Phase 1: Team Creation Auth States (TM-01 to TM-04)
Phase 2: Team Creation Flow (TM-05 to TM-08)
Phase 3: Team Profile Page (TM-09 to TM-14)
Phase 4: Responsive Design (TM-15 to TM-17)
Phase 5: Error Handling (TM-18 to TM-19)
```

---

## Phase 1: Team Creation Auth States

### 1.1 Get Test Credentials
```
Skill: bitwarden-secrets
# Retrieve GitHub credentials for test account with lfglabs-dev access
```

### 1.2 Navigate to Team Creation
```
mcp__playwright__browser_tabs: action="new"
mcp__playwright__browser_navigate: http://localhost:3000/team/new
mcp__playwright__browser_snapshot
```

### 1.3 Verify Auth State (TM-01 to TM-04)
**If not logged in (TM-01):**
- [ ] TM-01: "Create a Team" heading visible
- [ ] TM-01: "Sign in to continue" message
- [ ] TM-01: "Sign in with GitHub" button visible

**If logged in without org scope (TM-03):**
- [ ] TM-03: "Grant organization access" message visible
- [ ] TM-03: "Grant Organization Access" button visible

**If no orgs (TM-04):**
- [ ] TM-04: "No organizations found" message
- [ ] TM-04: Link to create GitHub org

### 1.4 Complete Auth Flow
```
mcp__playwright__browser_click: element="Sign in with GitHub" OR "Grant Organization Access"
# Complete GitHub OAuth with test credentials
mcp__playwright__browser_wait_for: text="Select an organization"
```

---

## Phase 2: Team Creation

### 2.1 Verify Org Selector (TM-05)
```
mcp__playwright__browser_snapshot
```
- [ ] TM-05: "Select an organization" heading
- [ ] TM-05: lfglabs-dev org listed with avatar
- [ ] TM-05: "Create Team" button disabled

### 2.2 Select Organization (TM-06)
```
mcp__playwright__browser_click: element="lfglabs-dev organization card"
mcp__playwright__browser_snapshot
```
- [ ] TM-06: Selected org has green ring/checkmark
- [ ] TM-06: "Create Team" button enabled

### 2.3 Create Team (TM-07/TM-08)
```
mcp__playwright__browser_click: element="Create Team button"
mcp__playwright__browser_wait_for: text="LFG Labs" OR time=5
mcp__playwright__browser_snapshot
```
- [ ] TM-07: Button shows "Creating team..." (if new)
- [ ] TM-07/08: Redirects to /team/lfglabs-dev
- [ ] TM-08: 409 handled gracefully (if team exists)

### 2.4 Screenshot
```
mcp__playwright__browser_take_screenshot: filename="team-created.png"
```

---

## Phase 3: Team Profile Page

### 3.1 Verify Header (TM-09)
```
mcp__playwright__browser_navigate: http://localhost:3000/team/lfglabs-dev
mcp__playwright__browser_snapshot
```
- [ ] TM-09: Org avatar displayed
- [ ] TM-09: Team name (org name) displayed
- [ ] TM-09: "TEAM" badge visible
- [ ] TM-09: Member count displayed
- [ ] TM-09: Total spend displayed
- [ ] TM-09: Share button visible

### 3.2 Verify Stats Cards (TM-10)
- [ ] TM-10: Total Spend card
- [ ] TM-10: Total Tokens card
- [ ] TM-10: Avg per Member card
- [ ] TM-10: Top Model card

### 3.3 Verify Member Sections (TM-11/TM-12)
- [ ] TM-11: "Top Contributors by Spend" section visible
- [ ] TM-12: "Team Members" section visible
- [ ] TM-12: Active members show "Active" tag
- [ ] TM-12: Inactive members show "Invite" tag

### 3.4 Test Share Button (TM-13)
```
mcp__playwright__browser_click: element="Share button"
mcp__playwright__browser_snapshot
```
- [ ] TM-13: "Copied!" confirmation appears

### 3.5 Test Unit Toggle (TM-14)
```
mcp__playwright__browser_click: element="Tokens button"
mcp__playwright__browser_snapshot
```
- [ ] TM-14: Toggle switches to Tokens view

### 3.6 Screenshot
```
mcp__playwright__browser_take_screenshot: filename="team-profile.png", fullPage=true
```

---

## Phase 4: Responsive Design

### 4.1 Mobile (TM-15)
```
mcp__playwright__browser_resize: width=375, height=667
mcp__playwright__browser_navigate: http://localhost:3000/team/lfglabs-dev
mcp__playwright__browser_snapshot
mcp__playwright__browser_take_screenshot: filename="team-mobile.png", fullPage=true
```
- [ ] TM-15: No horizontal scroll
- [ ] TM-15: Header stacks properly
- [ ] TM-15: Charts resize appropriately

### 4.2 Tablet (TM-16)
```
mcp__playwright__browser_resize: width=768, height=1024
mcp__playwright__browser_take_screenshot: filename="team-tablet.png", fullPage=true
```
- [ ] TM-16: Layout adapts properly
- [ ] TM-16: Stats cards in grid

### 4.3 Desktop (TM-17)
```
mcp__playwright__browser_resize: width=1280, height=800
mcp__playwright__browser_take_screenshot: filename="team-desktop.png", fullPage=true
```
- [ ] TM-17: Full layout displayed
- [ ] TM-17: Charts side by side

---

## Phase 5: Error Handling

### 5.1 Team Not Found (TM-18)
```
mcp__playwright__browser_navigate: http://localhost:3000/team/nonexistent-org-12345
mcp__playwright__browser_snapshot
mcp__playwright__browser_take_screenshot: filename="team-404.png"
```
- [ ] TM-18: 404 page displayed
- [ ] TM-18: No unhandled errors

### 5.2 Console Error Check (TM-19)
```
mcp__playwright__browser_console_messages: level="error"
```
- [ ] TM-19: Only expected errors (404 for nonexistent team)
- [ ] TM-19: No unhandled exceptions

---

## Report Template

```markdown
# E2E Test Results: Team Feature

## Execution
- Date: [timestamp]
- Duration: ~10 minutes
- Browser: Chromium (Playwright MCP)
- Test Org: lfglabs-dev

## Summary
- Total Tests: 19
- Passed: X
- Failed: Y

## Phase Results

### Phase 1: Auth States
| ID | Description | Status |
|----|-------------|--------|
| TM-01 | Unauthenticated state | |
| TM-02 | Sign in flow | |
| TM-03 | Grant org access | |
| TM-04 | No organizations | |

### Phase 2: Team Creation
| ID | Description | Status |
|----|-------------|--------|
| TM-05 | Org list display | |
| TM-06 | Org selection | |
| TM-07 | Create team success | |
| TM-08 | 409 handling | |

### Phase 3: Team Profile
| ID | Description | Status |
|----|-------------|--------|
| TM-09 | Team header | |
| TM-10 | Stats cards | |
| TM-11 | Member leaderboard | |
| TM-12 | Team members list | |
| TM-13 | Share button | |
| TM-14 | Unit toggle | |

### Phase 4: Responsive
| ID | Description | Status |
|----|-------------|--------|
| TM-15 | Mobile (375px) | |
| TM-16 | Tablet (768px) | |
| TM-17 | Desktop (1280px) | |

### Phase 5: Error Handling
| ID | Description | Status |
|----|-------------|--------|
| TM-18 | Team not found | |
| TM-19 | Console errors | |

## Screenshots
- team-created.png
- team-profile.png
- team-mobile.png
- team-tablet.png
- team-desktop.png
- team-404.png

## Console Errors
[List all or "None (except expected 404)"]

## Overall: PASS / FAIL
```
