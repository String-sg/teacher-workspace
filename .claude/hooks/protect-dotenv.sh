#!/bin/bash

INPUT=$(cat)

# Check file_path (Read, Edit) and path (Grep).
FILE_PATH=$(echo "$INPUT" | jq -r '.tool_input.file_path // .tool_input.path // empty')
if [[ -n "$FILE_PATH" ]]; then
  BASENAME=$(basename "$FILE_PATH")

  # Allow '.env.example' through.
  if [[ "$BASENAME" == ".env.example" ]]; then
    exit 0
  fi

  # Unquoted RHS in [[ ]] is glob pattern matching, not regex.
  if [[ "$BASENAME" == ".env" || "$BASENAME" == .env.* ]]; then
    echo "Blocked: '$FILE_PATH' is a protected dotenv file" >&2
    exit 2
  fi
fi

# Check command (Bash) — match '.env' or '.env.*' anywhere in the command, excluding '.env.example'.
COMMAND=$(echo "$INPUT" | jq -r '.tool_input.command // empty')
if [[ -n "$COMMAND" ]]; then
  # Strip '.env.example' references so they don't trigger the block.
  SANITIZED=$(echo "$COMMAND" | sed 's/\.env\.example//g')
  
  if [[ "$SANITIZED" =~ (^|[[:space:]/])\.env($|[[:space:]]) || "$SANITIZED" =~ (^|[[:space:]/])\.env\.[^[:space:]]+ ]]; then
    echo "Blocked: command references a protected dotenv file" >&2
    exit 2
  fi
fi

exit 0
