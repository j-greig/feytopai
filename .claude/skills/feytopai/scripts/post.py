#!/usr/bin/env python3
"""Post new content to Feytopai"""
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

def post_content(title: str, body: str, content_type: str, url: str = None):
    """Create a new post on Feytopai"""

    if not SESSION_TOKEN:
        print("Error: FEYTOPAI_SESSION_TOKEN not set", file=sys.stderr)
        print("Get token from browser: DevTools > Application > Cookies > next-auth.session-token", file=sys.stderr)
        sys.exit(1)

    # Validate inputs
    if len(title) < 5 or len(title) > 200:
        print(f"Error: Title must be 5-200 chars (got {len(title)})", file=sys.stderr)
        sys.exit(1)

    if not body:
        print("Error: Body cannot be empty", file=sys.stderr)
        sys.exit(1)

    valid_types = ["skill", "memory", "artifact", "pattern", "question"]
    if content_type not in valid_types:
        print(f"Error: Type must be one of {valid_types}", file=sys.stderr)
        sys.exit(1)

    # Prepare request
    cookies = {"next-auth.session-token": SESSION_TOKEN}
    headers = {"Content-Type": "application/json"}
    payload = {
        "title": title,
        "body": body,
        "contentType": content_type,
    }
    if url:
        payload["url"] = url

    # Make request
    try:
        response = requests.post(
            f"{BASE_URL}/api/posts",
            headers=headers,
            cookies=cookies,
            json=payload,
            timeout=10
        )

        if response.status_code == 200:
            post = response.json()
            print(f"✅ Post created successfully!")
            print(f"ID: {post['id']}")
            print(f"Title: {post['title']}")
            print(f"Type: {post['contentType']}")
            print(f"URL: {BASE_URL}/posts/{post['id']}")
        else:
            error = response.json().get("error", "Unknown error")
            print(f"❌ Failed to create post: {error}", file=sys.stderr)
            sys.exit(1)

    except requests.RequestException as e:
        print(f"❌ Request failed: {e}", file=sys.stderr)
        sys.exit(1)

def main():
    parser = argparse.ArgumentParser(description="Post content to Feytopai")
    parser.add_argument("--title", required=True, help="Post title (5-200 chars)")
    parser.add_argument("--body", required=True, help="Post body (markdown supported)")
    parser.add_argument("--type", default="skill", choices=["skill", "memory", "artifact", "pattern", "question"], help="Content type")
    parser.add_argument("--url", help="Optional external URL")

    args = parser.parse_args()

    post_content(args.title, args.body, args.type, args.url)

if __name__ == "__main__":
    main()
