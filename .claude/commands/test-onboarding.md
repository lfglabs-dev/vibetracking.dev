# Test Vibe Tracking Onboarding Flow

You are testing the complete vibe tracking onboarding flow end-to-end using Playwright MCP tools.

> **Note:** This is the quick onboarding test. For comprehensive E2E testing, see:
> - `/e2e/test-full-suite` - Complete test suite with all scenarios
> - `/e2e/test-homepage-not-connected` - Homepage without auth
> - `/e2e/test-homepage-connected` - Homepage with auth
> - `/e2e/test-own-profile` - Own profile page tests
> - `/e2e/test-another-user-profile` - Viewing other users' profiles
> - `/e2e/test-import-page` - Import page flow tests

## Prerequisites
- The dev server must be running at http://localhost:3000
- If not running, inform the user to start it with `npm run dev`

## Test Flow

### Step 1: Generate Test Data
Generate encoded test data inline (gzip + base64url) with realistic stats:
- 60-90 days of daily activity
- Multiple models (claude-sonnet-4, claude-3-5-haiku)
- Total tokens: 5-20 million
- Sessions: 100-500
- Use pako for compression, then base64url encode

### Step 2: Navigate to Import Page
Use `mcp__playwright__browser_navigate` to go to:
```
http://localhost:3000/import#<encoded-data>
```

### Step 3: Verify Stats Preview
Use `mcp__playwright__browser_snapshot` to verify:
- Page loaded without errors
- Stats preview shows total tokens
- Stats preview shows sessions count
- Stats preview shows tools found (claude_code)

### Step 4: Fill Anonymous Registration Form
1. Look for "Continue without login" option
2. Use `mcp__playwright__browser_click` to expand anonymous form if needed
3. Use `mcp__playwright__browser_type` or `mcp__playwright__browser_fill_form` to fill:
   - Display Name: "E2E Test User"
   - Company: "Test Company"

### Step 5: Submit and Wait for Redirect
1. Click the submit button for anonymous registration
2. Use `mcp__playwright__browser_wait_for` to wait for navigation to `/u/` profile page
3. Take a snapshot to verify the profile page loaded

### Step 6: Verify Profile Page
Use `mcp__playwright__browser_snapshot` to verify:
- Profile displays the correct display name
- Stats grid shows tokens, sessions, streak, active days
- Activity heatmap is present
- No console errors (check with `mcp__playwright__browser_console_messages`)

### Step 7: Take Screenshot
Use `mcp__playwright__browser_take_screenshot` to capture the final profile page for visual verification.

## Report Results
After completing all steps, provide a summary:
```
## E2E Test Results: Onboarding Flow

### Steps Completed
- [ ] Import page loaded with test data
- [ ] Stats preview displayed correctly
- [ ] Anonymous form filled
- [ ] Form submitted successfully
- [ ] Redirected to profile page
- [ ] Profile displays correct data

### Console Errors
[List any errors found]

### Screenshots
[Reference any screenshots taken]

### Status: PASS/FAIL
```

## Error Handling
- If any step fails, take a screenshot and report the error
- Check console messages for JavaScript errors
- If the server is not running, ask the user to start it

## Important Notes
- Use the anonymous flow (not GitHub OAuth) for automated testing
- Generate a unique test each time with randomized data
- Clean up by closing the browser tab when done
