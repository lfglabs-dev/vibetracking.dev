# E2E Test: Import Page Flow

Test the import page experience including data preview, error handling, and auth options.

## Prerequisites
- Dev server must be running at http://localhost:3000

## Test Procedure

### Test Case 5.1: Import Page with Valid Data

#### Step 1: Generate Test Data
Generate compressed import data inline:
```javascript
{
  timestamp: Date.now(),
  version: 1,
  tools: {
    claude_code: {
      tool: "claude_code",
      dailyActivity: [/* 60+ days */],
      modelUsage: [
        { model: "claude-sonnet-4-20250514", inputTokens: 5000000, outputTokens: 2000000 }
      ],
      stats: {
        totalTokens: 7000000,
        totalSessions: 150,
        totalMessages: 3000,
        longestSessionMs: 7200000,
        firstActivityDate: "2024-10-15",
        lastActivityDate: "2024-12-19"
      }
    }
  }
}
```

#### Step 2: Navigate to Import
Use `mcp__playwright__browser_navigate` to:
```
http://localhost:3000/import#[encoded-data]
```

#### Step 3: Verify Stats Preview
Use `mcp__playwright__browser_snapshot` and verify:
- [ ] "Your Vibe Stats" or similar heading
- [ ] Tools found section shows "claude_code" with icon
- [ ] Stats grid displays:
  - Total Tokens: ~7M
  - Sessions: ~150
  - Messages: ~3,000
  - Longest Session: ~2h
- [ ] Favorite model highlighted: claude-sonnet-4-20250514

#### Step 4: Screenshot
`mcp__playwright__browser_take_screenshot` filename="e2e-import-valid-data.png"

---

### Test Case 5.2: Auth Options Display

#### Step 1: Verify Auth Buttons
Use `mcp__playwright__browser_snapshot` and verify:
- [ ] "Continue with GitHub" button visible
- [ ] "Continue without login" option visible

#### Step 2: Verify GitHub Button Styling
- [ ] GitHub icon/logo present
- [ ] Button is prominent/primary styled

---

### Test Case 5.3: Anonymous Registration Form

#### Step 1: Expand Anonymous Form
Use `mcp__playwright__browser_click` on "Continue without login"

#### Step 2: Verify Form Fields
Use `mcp__playwright__browser_snapshot`:
- [ ] Display Name input field (required)
- [ ] Company input field (optional)
- [ ] Back button
- [ ] Save Profile button

#### Step 3: Test Validation - Empty Submit
1. Click "Save Profile" without filling anything
2. Use `mcp__playwright__browser_snapshot`:
   - [ ] Validation error appears
   - [ ] Display Name field highlighted

#### Step 4: Fill Valid Data
Use `mcp__playwright__browser_fill_form`:
```
fields: [
  { name: "Display Name", type: "textbox", ref: "[ref]", value: "Import Test User" },
  { name: "Company", type: "textbox", ref: "[ref]", value: "Test Company Inc" }
]
```

#### Step 5: Submit Form
1. Click "Save Profile" button
2. Use `mcp__playwright__browser_wait_for` text="/u/"
3. Verify redirect to profile page

#### Step 6: Screenshot
`mcp__playwright__browser_take_screenshot` filename="e2e-import-form-success.png"

---

### Test Case 5.4: Import Error Handling - No Data

#### Step 1: Navigate Without Hash
Use `mcp__playwright__browser_navigate` to:
```
http://localhost:3000/import
```

#### Step 2: Verify Error State
Use `mcp__playwright__browser_snapshot`:
- [ ] Error message displayed
- [ ] Text: "No data found" or similar
- [ ] "Please run `bunx vibetracking` first" instruction
- [ ] "Go Home" or similar button available

#### Step 3: Test Go Home Button
1. Click "Go Home" button
2. Verify navigation to homepage

#### Step 4: Screenshot
`mcp__playwright__browser_take_screenshot` filename="e2e-import-no-data.png"

---

### Test Case 5.5: Import Error Handling - Invalid Data

#### Step 1: Navigate with Invalid Hash
Use `mcp__playwright__browser_navigate` to:
```
http://localhost:3000/import#invalid-not-base64-data
```

#### Step 2: Verify Error Handling
Use `mcp__playwright__browser_snapshot`:
- [ ] Error message displayed
- [ ] "Invalid data format" or similar
- [ ] Recovery option available

#### Step 3: Screenshot
`mcp__playwright__browser_take_screenshot` filename="e2e-import-invalid-data.png"

---

### Test Case 5.6: Back Button in Anonymous Form

#### Step 1: Navigate with Valid Data
`mcp__playwright__browser_navigate` to http://localhost:3000/import#[valid-encoded-data]

#### Step 2: Open Anonymous Form
Click "Continue without login"

#### Step 3: Click Back Button
Use `mcp__playwright__browser_click` on "Back" button

#### Step 4: Verify Return to Auth Options
Use `mcp__playwright__browser_snapshot`:
- [ ] Anonymous form is hidden
- [ ] "Continue with GitHub" visible again
- [ ] "Continue without login" visible again

---

## Console Errors Check

Use `mcp__playwright__browser_console_messages` level="error":
- [ ] No JavaScript errors during import flow

---

## Report Results

```markdown
## E2E Test Results: Import Page

### Summary
- Total: 6 test cases
- Passed: X
- Failed: Y

### Results
| Test ID | Description | Status | Notes |
|---------|-------------|--------|-------|
| TC5.1 | Valid Data Preview | | |
| TC5.2 | Auth Options | | |
| TC5.3 | Anonymous Form | | |
| TC5.4 | No Data Error | | |
| TC5.5 | Invalid Data Error | | |
| TC5.6 | Back Button | | |

### Screenshots
- e2e-import-valid-data.png
- e2e-import-form-success.png
- e2e-import-no-data.png
- e2e-import-invalid-data.png

### Console Errors
[List any errors found or "None"]

### Status: PASS/FAIL
```
