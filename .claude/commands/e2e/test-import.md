# E2E Test: Import Page

Comprehensive testing of the import page flow including error states, data preview, and registration.

## Prerequisites
- Dev server running at http://localhost:3000
- Fresh browser state (no existing session)

---

## Part A: Error States

### A1: No Data (No Hash)
```
mcp__playwright__browser_navigate: http://localhost:3000/import
mcp__playwright__browser_snapshot
```

**Verify (IMP-07):**
- [ ] Error message: "No data found. Please run `bunx vibetracking` first."
- [ ] "Go Home" button visible

### A2: Invalid Data (Bad Hash)
```
mcp__playwright__browser_navigate: http://localhost:3000/import#invalid-data-here
mcp__playwright__browser_snapshot
```

**Verify (IMP-08):**
- [ ] Error message displayed (decompression/parse error)
- [ ] "Go Home" button visible

---

## Part B: Valid Data Import

### B1: Generate Test Data
Create properly encoded test data:

```javascript
const testData = {
  timestamp: Date.now(),
  version: 1,
  tools: {
    claude_code: {
      tool: "claude_code",
      dailyActivity: [
        { date: "2024-11-01", tool: "claude_code", messageCount: 120, sessionCount: 12, totalTokens: 800000 },
        { date: "2024-11-02", tool: "claude_code", messageCount: 100, sessionCount: 10, totalTokens: 650000 },
        { date: "2024-11-03", tool: "claude_code", messageCount: 80, sessionCount: 8, totalTokens: 500000 },
        { date: "2024-11-15", tool: "claude_code", messageCount: 150, sessionCount: 15, totalTokens: 1000000 },
        { date: "2024-11-16", tool: "claude_code", messageCount: 90, sessionCount: 9, totalTokens: 600000 }
      ],
      modelUsage: [
        { model: "claude-sonnet-4-20250514", inputTokens: 2000000, outputTokens: 800000, cacheReadTokens: 1500000 },
        { model: "claude-3-5-haiku-20241022", inputTokens: 250000, outputTokens: 100000 }
      ],
      stats: {
        totalTokens: 4650000,
        totalSessions: 54,
        totalMessages: 540,
        longestSessionMs: 7200000,
        firstActivityDate: "2024-11-01",
        lastActivityDate: "2024-11-16"
      }
    }
  }
};

// Encode: gzip(JSON.stringify(testData)) → base64url
```

### B2: Navigate with Valid Data
```
mcp__playwright__browser_navigate: http://localhost:3000/import#[ENCODED_DATA]
mcp__playwright__browser_snapshot
```

### B3: Verify Stats Preview (IMP-01)
**Verify from snapshot:**
- [ ] IMP-01: Stats preview displays:
  - Tools found: claude_code icon
  - Total Tokens: ~4.6M
  - Sessions: 54
  - Messages: 540
  - Longest Session: 2h
  - Favorite Model: claude-sonnet-4-20250514

### B4: Verify Auth Options (IMP-02, IMP-03)
**Verify from snapshot:**
- [ ] IMP-02: "Continue with GitHub" button visible
- [ ] IMP-03: "Continue without login" option visible

---

## Part C: Anonymous Registration Flow

### C1: Expand Anonymous Form (IMP-04)
```
mcp__playwright__browser_click: element="Continue without login", ref="[button-ref]"
mcp__playwright__browser_snapshot
```

**Verify (IMP-04):**
- [ ] Form expands with fields:
  - Display Name (required)
  - Company (optional)

### C2: Test Form Validation (IMP-05)
Try submitting empty form:
```
mcp__playwright__browser_click: element="Save Profile button", ref="[submit-ref]"
mcp__playwright__browser_snapshot
```

**Verify (IMP-05):**
- [ ] Form shows validation error (Display Name required)
- [ ] Form did NOT submit

### C3: Fill and Submit Form (IMP-06)
```
mcp__playwright__browser_type: element="Display Name input", ref="[name-ref]", text="Import Test User"
mcp__playwright__browser_type: element="Company input", ref="[company-ref]", text="Test Company Inc"
mcp__playwright__browser_click: element="Save Profile button", ref="[submit-ref]"
mcp__playwright__browser_wait_for: text="Import Test User"
mcp__playwright__browser_snapshot
```

**Verify (IMP-06):**
- [ ] Redirected to profile page (/u/[ANONYMOUS_ID])
- [ ] Profile shows "Import Test User"
- [ ] Profile shows "Test Company Inc"
- [ ] Stats match imported data (~4.6M tokens)

**Capture the anonymous ID from URL for later tests.**

### C4: Screenshot
```
mcp__playwright__browser_take_screenshot: filename="import-test-complete.png"
```

---

## Console Error Check (CON-02)
```
mcp__playwright__browser_console_messages: level="error"
```

**Verify:**
- [ ] CON-02: No JavaScript errors on import page

---

## Report

```markdown
## E2E Test Results: Import Page

### Environment
- Date: [timestamp]
- URL: http://localhost:3000

### Part A: Error States
| ID | Description | Status | Notes |
|----|-------------|--------|-------|
| IMP-07 | No hash error | | |
| IMP-08 | Invalid hash error | | |

### Part B: Valid Data
| ID | Description | Status | Notes |
|----|-------------|--------|-------|
| IMP-01 | Stats preview | | |
| IMP-02 | GitHub button | | |
| IMP-03 | Anonymous option | | |

### Part C: Registration
| ID | Description | Status | Notes |
|----|-------------|--------|-------|
| IMP-04 | Form expands | | |
| IMP-05 | Validation works | | |
| IMP-06 | Registration success | | |

### Test User Created
- Anonymous ID: [ID]
- Display Name: Import Test User
- Company: Test Company Inc

### Console Errors
[List or "None"]

### Screenshots
- import-test-complete.png

**Status: PASS / FAIL**
```
