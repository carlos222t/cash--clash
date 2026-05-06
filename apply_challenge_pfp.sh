#!/bin/bash
# Apply pfp fix to challenge friend picker
# Run from your project root: bash apply_challenge_pfp.sh

python3 - << 'PYEOF'
with open("src/pages/Challenges.jsx", "r", encoding="utf-8") as f:
    content = f.read()

# Find and show the actual line so we can debug
import re
matches = [(i, line) for i, line in enumerate(content.split('\n')) if 'AVATAR_PRESETS' in line and 'span' in line]
if not matches:
    matches = [(i, line) for i, line in enumerate(content.split('\n')) if 'avatar_id' in line]
if not matches:
    matches = [(i, line) for i, line in enumerate(content.split('\n')) if 'friendProfiles.map' in line]

print(f"Found {len(matches)} candidate lines:")
for i, line in matches:
    print(f"  Line {i+1}: {repr(line)}")
PYEOF