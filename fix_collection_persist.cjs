const fs = require('fs');

// ─── Patch 1: Add updateByUserId to profilesApi ──────────────
const apiPath = 'src/api/supabaseClient.js';
if (!fs.existsSync(apiPath)) {
  console.error('✗ Could not find', apiPath);
  process.exit(1);
}

let api = fs.readFileSync(apiPath, 'utf8');

if (api.includes('updateByUserId')) {
  console.log('⚠ supabaseClient.js already has updateByUserId — skipping API patch.');
} else {
  const profilesApiClose = api.indexOf('\n};\n\nexport const friendsApi');
  if (profilesApiClose === -1) {
    console.error('✗ Could not find end of profilesApi block.');
    process.exit(1);
  }

  const newMethod = `
  updateByUserId: async (userId, patch) => {
    const { data, error } = await supabase
      .from('user_profiles')
      .update(patch)
      .eq('created_by', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },`;

  api = api.slice(0, profilesApiClose) + newMethod + '\n' + api.slice(profilesApiClose);
  fs.writeFileSync(apiPath, api, 'utf8');
  console.log('✓ Added updateByUserId to profilesApi in supabaseClient.js');
}

// ─── Patch 2: Fix CryptoPackOpener save + parse ──────────────
const pagePath = 'src/pages/CryptoPackOpener.jsx';
if (!fs.existsSync(pagePath)) {
  console.error('✗ Could not find', pagePath);
  process.exit(1);
}

let src = fs.readFileSync(pagePath, 'utf8');

// Fix parse: guard against bad data coming back
const oldParse = `        if (profile.card_collection) {
          try {
            const parsed = typeof profile.card_collection === "string"
              ? JSON.parse(profile.card_collection)
              : profile.card_collection;
            setOwned(parsed);
          } catch (_) {}
        }`;
const newParse = `        if (profile.card_collection) {
          try {
            const parsed = typeof profile.card_collection === "string"
              ? JSON.parse(profile.card_collection)
              : profile.card_collection;
            if (parsed && typeof parsed === "object") setOwned(parsed);
          } catch (e) { console.error("Failed to parse card_collection:", e); }
        }`;

if (src.includes(oldParse)) {
  src = src.replace(oldParse, newParse);
  console.log('✓ Fixed card_collection parsing in CryptoPackOpener.jsx');
} else {
  console.log('⚠ Parse block not found — may already be patched, skipping.');
}

// Fix save: store as JSONB object not JSON string
const oldSave = `await profilesApi.updateByUserId(user.id, { card_collection: JSON.stringify(owned) });`;
const newSave = `await profilesApi.updateByUserId(user.id, { card_collection: owned });`;

if (src.includes(oldSave)) {
  src = src.replace(oldSave, newSave);
  console.log('✓ Fixed card_collection save — stores as JSONB, not a string.');
} else if (src.includes(newSave)) {
  console.log('⚠ Save already uses JSONB — skipping.');
} else {
  console.warn('⚠ Could not find save line — check CryptoPackOpener.jsx manually.');
}

fs.writeFileSync(pagePath, src, 'utf8');

console.log('\n✅ Done. Now:');
console.log('  1. Run this SQL in Supabase:');
console.log("     ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS card_collection JSONB DEFAULT '{}'::jsonb;");
console.log('  2. npm run dev');
