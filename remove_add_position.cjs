const fs = require('fs');
const path = './src/pages/Investments.jsx';
let code = fs.readFileSync(path, 'utf8');

// Remove the Add Position button
code = code.replace(
  `<button className=\\"btn btn-gold\\" onClick={() => setShowAdd(!showAdd)}>\\n            <span style={{ fontSize:16, lineHeight:1 }}>+</span> Add Position\\n          </button>`,
  ''
);

// Remove the showAdd form block
code = code.replace(
  `{showAdd && (\\n          <div className=\\"card\\" style={{ marginTop:14, padding:'16px 18px', display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>\\n            <input placeholder=\\"Symbol (e.g. AAPL)\\" style={{ flex:1, minWidth:100, background:'#0c0c0e', border:'1px solid rgba(255,255,255,0.09)', borderRadius:8, padding:'8px 12px', color:T.text, fontSize:13, outline:'none' }} />\\n            <input placeholder=\\"Shares\\" type=\\"number\\" style={{ width:90, background:'#0c0c0e', border:'1px solid rgba(255,255,255,0.09)', borderRadius:8, padding:'8px 12px', color:T.text, fontSize:13, outline:'none' }} />\\n            <input placeholder=\\"Avg cost ($)\\" type=\\"number\\" style={{ width:110, background:'#0c0c0e', border:'1px solid rgba(255,255,255,0.09)', borderRadius:8, padding:'8px 12px', color:T.text, fontSize:13, outline:'none' }} />\\n            <button className=\\"btn btn-gold\\">Save</button>\\n            <button className=\\"btn btn-ghost\\" onClick={() => setShowAdd(false)}>Cancel</button>\\n          </div>\\n        )}`,
  ''
);

// Remove the showAdd state since it's no longer needed
code = code.replace(
  `const [showAdd, setShowAdd] = useState(false);\\n`,
  ''
);

fs.writeFileSync(path, code);
console.log('Done!');
