const fs = require('fs');
const filePath = 'src/pages/Investments.jsx';
let c = fs.readFileSync(filePath, 'utf8');

// Find PortfolioStockDetail function and remove any investAmount references from it
// The function starts at "function PortfolioStockDetail" and we need to fix the input inside it

// Remove the bad value= attribute if it got added
c = c.replace("value={investAmount===''?'':investAmount}", '');

// Fix onChange that references investAmount back to onInput
c = c.replace(
  /onChange=\{e=>\{const v=e\.target\.value;setInvestAmount\([^}]+\);\}\}/g,
  'onInput={e=>setInvestAmount(e.target.value)}'
);

// If investAmount leaked into PortfolioStockDetail's sell input, fix it
// Find the PortfolioStockDetail sell input and make sure it uses qty not investAmount
const badPattern = /(<input[\s\S]*?onInput=\{e=>setInvestAmount[\s\S]*?\/>)/g;

// Split at function boundary to only fix inside PortfolioStockDetail
const pdStart = c.indexOf('function PortfolioStockDetail');
const sdStart = c.indexOf('function StockDetail');

if (pdStart !== -1 && sdStart !== -1) {
  // PortfolioStockDetail comes after StockDetail in the file
  let before = c.substring(0, pdStart);
  let pdFunc = c.substring(pdStart);

  // In PortfolioStockDetail, replace any investAmount input with proper qty input
  pdFunc = pdFunc.replace(
    /<div style=\{\{display:'flex',alignItems:'center',gap:6,background:'#0c0c0e',border:'1px solid rgba\(255,255,255,0\.09\)',borderRadius:8,padding:'6px 12px'\}\}>\s*<span[^>]*>◈<\/span>\s*<input[\s\S]*?\/>\s*<\/div>/,
    `<div style={{display:'flex',alignItems:'center',gap:8,background:'#0c0c0e',border:'1px solid rgba(255,255,255,0.09)',borderRadius:8,padding:'6px 12px'}}>
            <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{background:'none',border:'none',color:T.muted,fontSize:18,cursor:'pointer',lineHeight:1}}>-</button>
            <input type="number" min="1" max={h.qty} value={qty}
              onChange={e=>{const v=parseInt(e.target.value)||1;setQty(Math.max(1,Math.min(h.qty,v)));}}
              style={{width:52,textAlign:'center',background:'none',border:'none',color:'#F0EDE6',fontSize:14,fontWeight:700,outline:'none'}}
            />
            <button onClick={()=>setQty(q=>Math.min(h.qty,q+1))} style={{background:'none',border:'none',color:T.muted,fontSize:18,cursor:'pointer',lineHeight:1}}>+</button>
          </div>`
  );

  c = before + pdFunc;
  console.log('✓ Fixed PortfolioStockDetail sell input');
} else {
  console.log('Could not find function boundaries - check manually');
}

fs.writeFileSync(filePath, c);
console.log('Done');
