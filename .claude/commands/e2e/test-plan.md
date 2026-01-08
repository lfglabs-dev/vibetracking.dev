# E2E Test Plan - Reference Document

This document defines the test suites and test cases for vibetracking.dev. It serves as a **reference only** - use the specific test commands to execute tests.

## Test Command Structure

| Command | Purpose | Prerequisites |
|---------|---------|---------------|
| `/e2e/test-quick` | Fast smoke test (~2 min) | Dev server running |
| `/e2e/test-homepage` | Homepage tests (auth + unauth) | Dev server running |
| `/e2e/test-import` | Import page flow | Dev server running |
| `/e2e/test-profile` | Profile page tests | Dev server + test user created |
| `/e2e/test-full-suite` | Complete regression suite | Dev server running |

## Prerequisites

1. **Dev server running**: `pnpm dev` at http://localhost:3000
2. **Playwright MCP available**: Browser automation tools
3. **For authenticated tests**: Either create test user via `/e2e/test-import` first, or use Bitwarden credentials

## Test Suites Overview

### Suite 1: Homepage (Unauthenticated)
Tests for users who are NOT logged in.

| ID | Test Case | Priority |
|----|-----------|----------|
| HP-01 | Logo displays correctly | High |
| HP-02 | Headline "Are you a good vibe Coder?" visible | High |
| HP-03 | CTA box with `bunx vibetracking` visible | High |
| HP-04 | Copy button works (copies, shows "Copied!", reverts) | Medium |
| HP-05 | Leaderboard table visible with columns | High |
| HP-06 | Top 3 users have medal emojis | Low |
| HP-07 | "My Profile" button is NOT visible | High |
| HP-08 | Clicking leaderboard row navigates to profile | Medium |

### Suite 2: Homepage (Authenticated)
Tests for logged-in users.

| ID | Test Case | Priority |
|----|-----------|----------|
| HPA-01 | "My Profile" button IS visible | High |
| HPA-02 | Current user highlighted in leaderboard | Medium |
| HPA-03 | Profile button navigates to own profile | High |

### Suite 3: Import Page
Tests for the data import flow.

| ID | Test Case | Priority |
|----|-----------|----------|
| IMP-01 | Stats preview displays (tokens, sessions, tools) | High |
| IMP-02 | "Continue with GitHub" button visible | High |
| IMP-03 | "Continue without login" option visible | High |
| IMP-04 | Anonymous form expands on click | Medium |
| IMP-05 | Form validation (Display Name required) | High |
| IMP-06 | Successful registration redirects to profile | High |
| IMP-07 | Error: No hash shows "No data found" | Medium |
| IMP-08 | Error: Invalid hash shows error message | Medium |

### Suite 4: Profile Page
Tests for user profile display.

| ID | Test Case | Priority |
|----|-----------|----------|
| PRF-01 | Header shows display name, company, username | High |
| PRF-02 | Stats grid: Total Tokens, Sessions, Streak, Active Days | High |
| PRF-03 | Highlights: Favorite Model, Tool, Longest Session, Best Streak | High |
| PRF-04 | Timeline: First Activity, Last Activity dates | Medium |
| PRF-05 | Activity heatmap renders (365 days) | High |
| PRF-06 | Heatmap tooltip shows date and tokens on hover | Low |
| PRF-07 | Fun comparison box (if tokens > 10K) | Low |
| PRF-08 | Share button opens dropdown | Medium |
| PRF-09 | "Copy link" copies URL and shows confirmation | Medium |
| PRF-10 | No edit buttons on another user's profile | High |

### Suite 5: Responsive Design
Tests for different viewport sizes.

| ID | Test Case | Priority |
|----|-----------|----------|
| RSP-01 | Mobile (375x667): No horizontal scroll | High |
| RSP-02 | Mobile: Text readable, layout stacked | Medium |
| RSP-03 | Tablet (768x1024): Stats grid adjusts | Medium |
| RSP-04 | Desktop (1280x800): Full layout with stickers | Medium |

### Suite 6: Navigation & URLs
Tests for URL handling and navigation.

| ID | Test Case | Priority |
|----|-----------|----------|
| NAV-01 | Logo click returns to homepage | High |
| NAV-02 | /@username rewrites to /user/username | High |
| NAV-03 | Reserved paths not rewritten (/api, /import, /auth) | High |

### Suite 7: Console Errors
Check for JavaScript errors on all pages.

| ID | Test Case | Priority |
|----|-----------|----------|
| CON-01 | Homepage: No JS errors | High |
| CON-02 | Import page: No JS errors | High |
| CON-03 | Profile page: No JS errors | High |

## Standard Test Data

Use this data structure for all tests requiring import data:

```typescript
const testData = {
  timestamp: Date.now(),
  version: 1,
  tools: {
    claude_code: {
      tool: "claude_code",
      dailyActivity: generateDays(60), // 60 days
      modelUsage: [
        { model: "claude-sonnet-4-20250514", inputTokens: 5000000, outputTokens: 2000000, cacheReadTokens: 3000000 },
        { model: "claude-3-5-haiku-20241022", inputTokens: 800000, outputTokens: 200000 }
      ],
      stats: {
        totalTokens: 11000000,
        totalSessions: 250,
        totalMessages: 5000,
        longestSessionMs: 7200000, // 2 hours
        firstActivityDate: "2024-10-15",
        lastActivityDate: "2024-12-20"
      }
    }
  }
};
```

## Report Template

```markdown
## E2E Test Results: [Suite Name]

### Environment
- Date: [timestamp]
- URL: http://localhost:3000
- Browser: Chromium (Playwright MCP)

### Summary
- Total: X tests
- Passed: Y
- Failed: Z

### Results
| ID | Description | Status | Notes |
|----|-------------|--------|-------|
| XX-01 | Test name | PASS/FAIL | |

### Console Errors
[List any JS errors or "None"]

### Screenshots
[List screenshots taken]
```
