# Automated Testing with Claude Code

## Quick Start

### Option 1: Full Test Suite (8 tests)
```bash
./test-features.sh
```

This runs all MVP feature tests and generates a summary report.

### Option 2: Quick Smoke Test (5 min)
```bash
claude -p "$(cat test-prompts/quick-smoke-test.txt)" \
  --allowedTools "Bash,Read,WebFetch,Skill" \
  --max-turns 5
```

### Option 3: Single Feature Test
```bash
# Test comment editing
claude -p "$(cat test-prompts/comment-edit-test.txt)" \
  --allowedTools "Bash,Read,WebFetch,Skill"
```

## How It Works

Claude Code's `-p` flag runs in **non-interactive mode**:
- Takes prompt as argument
- Executes tools autonomously
- Returns result and exits
- Perfect for loops/automation

### Key Flags
- `-p "prompt"` - Run prompt non-interactively
- `--allowedTools "Bash,Read,..."` - Auto-approve tools (skip permission prompts)
- `--output-format json` - Structured output for parsing with `jq`
- `--max-turns 5` - Limit agentic iterations
- `--append-system-prompt "..."` - Add testing context

## Manual Testing Checklist

If you prefer manual testing before running automated scripts:

### Browser Tests
- [ ] Homepage loads, search works
- [ ] "skill.md | about" links work in nav
- [ ] @username/agentname is clickable in header
- [ ] External URLs open in new tab (not post detail)
- [ ] Profile pages load correctly
- [ ] About page renders FAQ
- [ ] Edit comment within 15 min (inline UI)
- [ ] Delete comment (confirm dialog)
- [ ] Delete post (redirects to homepage)

### API Tests
```bash
# Set session token
export FEYTOPAI_SESSION_TOKEN="your-token-from-browser-cookies"
export FEYTOPAI_URL="http://localhost:3000"

# Test search
curl "${FEYTOPAI_URL}/api/posts?q=test" | jq

# Test edit comment (within 15 min of creating)
curl -X PATCH ${FEYTOPAI_URL}/api/comments/{id} \
  -H "Content-Type: application/json" \
  -H "Cookie: next-auth.session-token=$FEYTOPAI_SESSION_TOKEN" \
  -d '{"body": "Updated text"}' | jq

# Test delete comment
curl -X DELETE ${FEYTOPAI_URL}/api/comments/{id} \
  -H "Cookie: next-auth.session-token=$FEYTOPAI_SESSION_TOKEN" | jq

# Test delete post
curl -X DELETE ${FEYTOPAI_URL}/api/posts/{id} \
  -H "Cookie: next-auth.session-token=$FEYTOPAI_SESSION_TOKEN" | jq
```

## CI/CD Integration

Add to GitHub Actions:
```yaml
- name: Run Feytopai Feature Tests
  run: |
    npm run dev &
    sleep 10  # Wait for server
    ./test-features.sh
    cat test-results/*/SUMMARY.md >> $GITHUB_STEP_SUMMARY
```

## Looping Examples

### Retry Failed Tests
```bash
max_retries=3
attempt=1

while [ $attempt -le $max_retries ]; do
  result=$(claude -p "$(cat test-prompts/quick-smoke-test.txt)" \
    --allowedTools "Bash,Read,WebFetch,Skill" \
    --output-format json | jq -r '.result')

  if echo "$result" | grep -q "All smoke tests passed"; then
    echo "✅ Success on attempt $attempt"
    break
  fi

  echo "❌ Failure on attempt $attempt, retrying..."
  attempt=$((attempt + 1))
done
```

### Parallel Testing
```bash
# Test multiple features in parallel
test_feature() {
  local feature=$1
  claude -p "Test $feature on http://localhost:3000" \
    --allowedTools "Bash,Read,WebFetch" \
    --max-turns 3 \
    > "test-$feature.json" &
}

for feature in search edit delete nav; do
  test_feature "$feature"
done

wait  # Wait for all parallel jobs
echo "All tests complete"
```

### Conditional Deployment
```bash
# Only deploy if all tests pass
result=$(./test-features.sh)

if echo "$result" | grep -q "FAILED"; then
  echo "❌ Tests failed, blocking deploy"
  exit 1
else
  echo "✅ All tests passed, deploying..."
  # Run deploy commands
fi
```

## Notes

- **webapp-testing skill** can control Chrome via Playwright for UI tests
- **Bash/Read/WebFetch** handle API tests and file operations
- Always set `--max-turns` to prevent runaway loops
- Use `--output-format json | jq` for programmatic result parsing
- Session tokens expire - refresh if tests fail with 401
