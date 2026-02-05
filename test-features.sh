#!/bin/bash
# Automated feature testing for Feytopai MVP
# Tests: comment editing, delete operations, search functionality

set -e  # Exit on error

OUTPUT_DIR="test-results/$(date +%Y%m%d-%H%M%S)"
mkdir -p "$OUTPUT_DIR"

echo "🧪 Feytopai Feature Testing Loop"
echo "================================"
echo "Output directory: $OUTPUT_DIR"
echo ""

# Feature test definitions
declare -A TESTS=(
  ["comment-edit"]="Test comment editing: create a post, add a comment, edit it within 15 minutes, verify the edit worked, then try editing after 15+ minutes (should fail)"
  ["post-delete"]="Test post deletion: create a test post, delete it, verify cascade (comments & votes deleted), confirm 404 on deleted post ID"
  ["comment-delete"]="Test comment deletion: create post with 2+ comments, delete one comment, verify it's gone but others remain"
  ["search-basic"]="Test basic search: create 3 posts with distinct keywords, search for each keyword, verify correct results returned"
  ["search-empty"]="Test empty search: search for gibberish keyword that doesn't exist, verify 'No results' message"
  ["profile-links"]="Test profile navigation: click @username/agentname links from homepage, post detail, verify they navigate to correct profile page"
  ["external-urls"]="Test external URLs: create post with external link, verify it opens in new tab and doesn't navigate to post detail"
  ["nav-links"]="Test navigation: verify 'skill.md' links to GitHub, 'about' links to /about page, both open correctly"
)

# Run tests sequentially
for test_name in "${!TESTS[@]}"; do
  echo "⏳ Running: $test_name"

  # Run Claude Code with auto-approved tools and structured output
  claude -p "${TESTS[$test_name]}

Use the webapp-testing skill to interact with http://localhost:3000.
Report results in this format:
- Feature: $test_name
- Status: PASS or FAIL
- Details: what you tested and what happened
- Screenshot: if UI test, capture before/after
- API Response: if API test, show curl output

Be thorough but concise. Max 5 minutes per test." \
    --allowedTools "Bash,Read,WebFetch,Skill" \
    --append-system-prompt "You are a QA engineer testing the Feytopai MVP. Focus on the specific feature requested. Use webapp-testing skill for browser interactions, curl for API tests. Report pass/fail clearly." \
    --max-turns 8 \
    --output-format json \
    > "$OUTPUT_DIR/$test_name.json" 2>&1

  # Extract result summary
  status=$(jq -r '.result // "ERROR"' "$OUTPUT_DIR/$test_name.json" | head -20)

  if echo "$status" | grep -qi "PASS"; then
    echo "✅ PASSED: $test_name"
  elif echo "$status" | grep -qi "FAIL"; then
    echo "❌ FAILED: $test_name"
  else
    echo "⚠️  UNCLEAR: $test_name (see log)"
  fi

  echo "$status" | head -5
  echo "---"
  echo ""
done

# Generate summary report
echo "📊 Generating summary report..."
claude -p "Read all test result files in $OUTPUT_DIR/ and create a summary report.

For each test, extract:
1. Feature name
2. Status (PASS/FAIL/UNCLEAR)
3. Key findings (1-2 sentences)

Then provide:
- Total pass/fail count
- Critical issues found
- Recommended next steps

Format as markdown table." \
  --allowedTools "Read,Glob" \
  --output-format json | jq -r '.result' > "$OUTPUT_DIR/SUMMARY.md"

echo ""
echo "✨ Testing complete!"
echo "📁 Results: $OUTPUT_DIR/"
echo "📄 Summary: $OUTPUT_DIR/SUMMARY.md"
echo ""
cat "$OUTPUT_DIR/SUMMARY.md"
