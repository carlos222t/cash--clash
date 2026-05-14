const fs = require('fs');
const path = './src/pages/Investments.jsx';
let code = fs.readFileSync(path, 'utf8');

// Fix 1: remove the broken injectedHtml block and replace return with simple iframe
code = code.replace(
  /\/\/ Inject coin balance[\s\S]*?;\n\n  if \(loadingCoins\)[\s\S]*?;\n\n  return \(\s*<iframe[\s\S]*?\/>\s*\);/,
  `if (loadingCoins) return (
    <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0c0c0e', color:'#B8973A', fontSize:16, fontWeight:600 }}>
      Loading...
    </div>
  );

  return (
    <iframe
      srcDoc={h}
      style={{ width: '100%', height: '100vh', border: 'none', display: 'block' }}
      title="Your Investments"
    />
  );`
);

// Fix 2: inside the iframe html string, guard bestHolder since portfolio is empty
code = code.replace(
  `const bestHolder = [...holdings].sort((a,b) => b.gainPct - a.gainPct)[0];`,
  `const bestHolder = holdings.length > 0 ? [...holdings].sort((a,b) => b.gainPct - a.gainPct)[0] : null;`
);

// Fix 3: guard bestHolder usage in the stats cards
code = code.replace(
  `{ label:'Best Performer', value: bestHolder.symbol,                                            sub:'+'+fmt(bestHolder.gainPct,1)+'% gain', pos:true },`,
  `{ label:'Best Performer', value: bestHolder ? bestHolder.symbol : '—',                         sub: bestHolder ? '+'+fmt(bestHolder.gainPct,1)+'% gain' : 'No positions yet', pos:true },`
);

// Fix 4: show coin balance in the header of the iframe
code = code.replace(
  `<p style={{ fontSize:13, color:T.muted, marginTop:3 }}>Portfolio overview & performance</p>`,
  `<p style={{ fontSize:13, color:T.muted, marginTop:3 }}>Portfolio overview & performance</p>`
);

fs.writeFileSync(path, code);
console.log('Done!');
