const fs = require('fs');

let goals = fs.readFileSync('src/pages/Goals.jsx', 'utf8');

// Replace the entire API call block with OpenAI's API
goals = goals.replace(
  /const apiKey[\s\S]*?const data = await response\.json\(\);/,
  `const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey) {
        toast.error('Missing API key. Add VITE_OPENAI_API_KEY to your .env file.');
        setLoading(false);
        return;
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': \`Bearer \${apiKey}\`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          max_tokens: 1000,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user',   content: userPrompt },
          ],
        }),
      });

      const data = await response.json();`
);

// Replace how we extract the text from the response
// Anthropic: data.content?.find(b => b.type === 'text')?.text
// OpenAI:    data.choices?.[0]?.message?.content
goals = goals.replace(
  `const raw = data.content?.find(b => b.type === 'text')?.text || '';`,
  `const raw = data.choices?.[0]?.message?.content || '';`
);

fs.writeFileSync('src/pages/Goals.jsx', goals, 'utf8');
console.log('✅ Goals.jsx switched to OpenAI (gpt-4o-mini)');
console.log('\nAdd this to your .env file:');
console.log('VITE_OPENAI_API_KEY=sk-xxxxxxxxxxxxxxxx');
console.log('\nThen restart: npm run dev');
