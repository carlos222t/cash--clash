const fs = require('fs');

let goals = fs.readFileSync('src/pages/Goals.jsx', 'utf8');

// Fix the fetch call to include the API key from env
goals = goals.replace(
  `const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },`,
  `const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
      if (!apiKey) {
        toast.error('Missing API key. Add VITE_ANTHROPIC_API_KEY to your .env file.');
        setLoading(false);
        return;
      }

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },`
);

fs.writeFileSync('src/pages/Goals.jsx', goals, 'utf8');
console.log('✅ Goals.jsx patched with API key fix');
console.log('\nMake sure your .env has: VITE_ANTHROPIC_API_KEY=sk-ant-...');
console.log('Then restart: npm run dev');
