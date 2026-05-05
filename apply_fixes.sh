#!/bin/bash
# Run this from the ROOT of your cash--clash project folder
# e.g.  bash apply_fixes.sh

set -e
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

copy() {
  local src="$SCRIPT_DIR/$1"
  local dst="$2"
  mkdir -p "$(dirname "$dst")"
  cp "$src" "$dst"
  echo "  ✔  $dst"
}

echo ""
echo "Applying Cash Clash fixes..."
echo ""

copy "src/components/game/GameUtils.jsx"      "src/components/game/GameUtils.jsx"
copy "src/components/game/XPBar.jsx"          "src/components/game/XPBar.jsx"
copy "src/pages/Challenges.jsx"               "src/pages/Challenges.jsx"
copy "src/pages/Clan.jsx"                     "src/pages/Clan.jsx"
copy "src/pages/Leaderboard.jsx"              "src/pages/Leaderboard.jsx"
copy "src/api/supabaseClient.js"              "src/api/supabaseClient.js"
copy "src/components/layout/Sidebar.jsx"      "src/components/layout/Sidebar.jsx"
copy "src/components/layout/MobileNav.jsx"    "src/components/layout/MobileNav.jsx"
copy "src/App.jsx"                            "src/App.jsx"

echo ""
echo "All files applied."
echo ""
echo "Next step — run the SQL:"
echo "  1. Open your Supabase project → SQL Editor"
echo "  2. Paste and run the contents of: clans.sql"
echo ""
echo "Then restart your dev server:  npm run dev"
echo ""
