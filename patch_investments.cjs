const fs = require('fs');
const path = require('path');

const filePath = path.join(process.cwd(), 'Investments.jsx');
let code = fs.readFileSync(filePath, 'utf8');

// 1. More balanced price movement - less drift, more noise
code = code.replace(
  'const noisePct = gaussian * 0.18;',
  'const noisePct = gaussian * 0.22;'
);
code = code.replace(
  'const drift = ((rank - 5.5) / 4.5) * 0.05;',
  'const drift = ((rank - 5.5) / 4.5) * 0.02;'
);
code = code.replace(
  'const totalPct = noisePct * 0.70 + drift + spike;',
  'const totalPct = noisePct * 0.85 + drift * 0.15 + spike;'
);

// 2. Switch from qty state to investAmount state
code = code.replace(
  "const [qty, setQty]       = useState(1);",
  "const [investAmount, setInvestAmount] = useState('');"
);

// 3. Derive qty from money input
code = code.replace(
  "  const totalCost = qty * livePrice;",
  "  const totalCost = parseFloat(investAmount) || 0;\n  const qty = totalCost > 0 ? totalCost / livePrice : 0;"
);

// 4. Fix canBuy check
code = code.replace(
  "  const canBuy  = balance >= totalCost && qty > 0;",
  "  const canBuy  = balance >= totalCost && totalCost > 0;"
);

// 5. Fix canSell (no longer depends on qty matching shares)
code = code.replace(
  "  const canSell = holding && holding.qty >= qty;",
  "  const canSell = holding && holding.qty > 0;"
);

// 6. Replace the stepper UI with a money input field
const oldStepper = `          <div style={{display:'flex',alignItems:'center',gap:8,background:'#0c0c0e',border:'1px solid rgba(255,255,255,0.09)',borderRadius:8,padding:'6px 12px'}}>
            <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{background:'none',border:'none',color:T.muted,fontSize:18,cursor:'pointer',lineHeight:1}}>−</button>
            <input
              type="number" min="1"
              value={qty}
              onChange={e=>{const v=parseInt(e.target.value)||1;setQty(Math.max(1,v));}}
              style={{width:52,textAlign:'center',background:'none',border:'none',color:T.text,fontSize:14,fontWeight:700,outline:'none'}}
            />
            <button onClick={()=>setQty(q=>q+1)} style={{background:'none',border:'none',color:T.muted,fontSize:18,cursor:'pointer',lineHeight:1}}>+</button>
          </div>`;

const newInput = `          <div style={{display:'flex',alignItems:'center',gap:6,background:'#0c0c0e',border:'1px solid rgba(255,255,255,0.09)',borderRadius:8,padding:'6px 12px'}}>
            <span style={{color:'#B8973A',fontSize:14,fontWeight:700}}>◈</span>
            <input
              type="number" min="0"
              value={investAmount}
              placeholder="Amount to invest"
              onChange={e=>setInvestAmount(e.target.value)}
              style={{width:140,textAlign:'left',background:'none',border:'none',color:'#F0EDE6',fontSize:14,fontWeight:700,outline:'none'}}
            />
          </div>`;

if (code.includes(oldStepper)) {
  code = code.replace(oldStepper, newInput);
  console.log('✓ Replaced stepper with money input');
} else {
  console.log('✗ Could not find stepper UI - check manually');
}

// 7. Fix confirm dialog text
code = code.replace(
  "? 'Buy ' + qty + ' share' + (qty !== 1 ? 's' : '') + ' of ' + stock.symbol + ' for ' + fmtMoney(totalCost) + '?'",
  "? 'Invest \\u25C8 ' + Math.floor(totalCost).toLocaleString() + ' coins in ' + stock.symbol + ' (' + qty.toFixed(4) + ' shares)?'"
);

// 8. Fix insufficient funds message
code = code.replace(
  "You need ◈ {Math.ceil(totalCost - balance).toLocaleString()} more coins to buy {qty} share{qty>1?'s':''}.",
  "You need ◈ {Math.ceil(totalCost - balance).toLocaleString()} more coins to make this investment."
);

fs.writeFileSync(filePath, code);
console.log('✓ Patch applied to', filePath);
