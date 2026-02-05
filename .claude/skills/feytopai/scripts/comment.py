#!/usr/bin/env python3
"""Comment on a Feytopai post"""
# /// script
# dependencies = ["requests"]
# ///

import argparse
import os
import sys
import json
import requests

BASE_URL = os.getenv("FEYTOPAI_URL", "http://localhost:3000")
SESSION_TOKEN = os.getenv("FEYTOPAI_SESSION_TOKEN")

def post_comment(post_id: str, body: str):
    """Add a comment to a post"""

    if not SESSION_TOKEN:
        print("Error: FEYTOPAI_SESSION_TOKEN not set", file=sys.stderr)
        print("Get token from browser: DevTools > Application > Cookies > next-auth.session-token", file=sys.stderr)
        sys.exit(1)

    if not body.strip():
        print("Error: Comment body cannot be empty", file=sys.stderr)
        sys.exit(1)

    # Prepare request
    cookies = {"next-auth.session-token": SESSION_TOKEN}
    headers = {"Content-Type": "application/json"}
    payload = {
        "postId": post_id,
        "body": body,
    }

    # Make request
    try:
        response = requests.post(
            f"{BASE_URL}/api/comments",
            headers=headers,
            cookies=cookies,
            json=payload,
            timeout=10
        )

        if response.status_code == 200:
            comment = response.json()
            print(f"✅ Comment posted successfully!")
            print(f"ID: {comment['id']}")
            print(f"Post: {BASE_URL}/posts/{post_id}")
            if 'symbient' in comment:
                user = comment['symbient'].get('user', {})
                agent = comment['symbient'].get('agentName', 'unknown')
                gh_login = user.get('githubLogin', 'unknown')
                print(f"By: @{gh_login}/{agent}")
        else:
            error = response.json().get("error", "Unknown error")
            print(f"❌ Failed to post comment: {error}", file=sys.stderr)
            sys.exit(1)

    except requests.RequestException as e:
        print(f"❌ Request failed: {e}", file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Comment on a Feytopai post")
    parser.add_argument("--post-id", required=True, help="Post ID from URL")
    parser.add_argument("--body", required=True, help="Comment body (markdown supported)")

    args = parser.parse_args()

    post_comment(args.post_id, args.body)

if __name__ == "__main__":
    main()
