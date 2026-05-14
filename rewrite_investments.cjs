const fs = require('fs');

const newFile = `import { useState, useEffect } from 'react';
import { auth, profilesApi } from '@/api/supabaseClient';

export default function Investments() {
  const [coinBalance, setCoinBalance] = useState(0);
  const [loadingCoins, setLoadingCoins] = useState(true);

  useEffect(() => {
    auth.me().then(me => {
      profilesApi.getByUserId(me.id).then(profile => {
        setCoinBalance(profile?.coins ?? 0);
        setLoadingCoins(false);
      });
    }).catch(() => setLoadingCoins(false));
  }, []);

  const html = \`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Investments</title>
  <script src="https://cdn.tailwindcss.com"><\\/script>
  <script src="https://unpkg.com/react@18/umd/react.development.js"><\\/script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"><\\/script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"><\\/script>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0c0c0e;font-family:'DM Sans',sans-serif;color:#F0EDE6;overflow-x:hidden}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:#0c0c0e}::-webkit-scrollbar-thumb{background:#2a2a2e;border-radius:99px}
    @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
    .fade-up{animation:fadeUp 0.35s ease both}
    .card{background:#111114;border:1px solid rgba(255,255,255,0.06);border-radius:14px;transition:border-color 0.2s,transform 0.2s}
    .card:hover{border-color:rgba(184,151,58,0.22);transform:translateY(-1px)}
    .tag{display:inline-flex;align-items:center;padding:3px 9px;border-radius:99px;font-size:11px;font-weight:700}
    .tag-up{background:rgba(0,200,100,0.12);color:#00c864}
    .tag-down{background:rgba(255,60,60,0.12);color:#ff3c3c}
    .btn{display:inline-flex;align-items:center;gap:6px;padding:8px 16px;border-radius:9px;font-size:13px;font-weight:600;cursor:pointer;transition:all 0.15s;border:none}
    .btn-gold{background:rgba(184,151,58,0.12);color:#B8973A;border:1px solid rgba(184,151,58,0.28)}
    .btn-gold:hover{background:rgba(184,151,58,0.22)}
    .btn-ghost{background:transparent;color:rgba(240,237,230,0.45);border:1px solid rgba(255,255,255,0.07)}
    .btn-ghost:hover{background:#1A1A1F;color:#F0EDE6}
    .btn-buy{background:rgba(0,200,100,0.12);color:#00c864;border:1px solid rgba(0,200,100,0.28)}
    .btn-buy:hover{background:rgba(0,200,100,0.22)}
    .btn-buy:disabled{opacity:0.4;cursor:not-allowed}
    input[type=number]{color-scheme:dark}
  </style>
</head>
<body>
<div id="root"></div>
<script type="text/babel">
const { useState } = React;
const COIN_BALANCE = \${coinBalance};

const STOCKS = [
  { id:1,  symbol:'NXQ',  name:'Nexquora Technologies', sector:'Tech',       price:142.50, change:2.14,  color:'#4f8ef7',
    mktCap:'$38.2B', peRatio:'28.4', dividend:'0%', volume:'4.2M', week52Hi:'189.00', week52Lo:'98.20',
    pros:['Dominant in edge-computing infrastructure','Revenue grew 42% YoY','No long-term debt'],
    cons:['Highly dependent on 3 enterprise clients','Thin profit margins at 6%','Faces new EU regulation risk'],
    history:[98,105,112,108,119,131,128,135,139,142] },
  { id:2,  symbol:'VRD',  name:'Verdant Energy Corp',   sector:'Energy',     price:87.30,  change:-1.02, color:'#00c864',
    mktCap:'$14.1B', peRatio:'19.2', dividend:'3.1%', volume:'2.8M', week52Hi:'104.50', week52Lo:'71.00',
    pros:['Stable dividend above market average','Solar grid expansion in 12 new states','Gov subsidies locked in till 2029'],
    cons:['Slow growth — 8% YoY','Weather-dependent revenue','High capex requirements'],
    history:[80,82,79,85,88,91,87,90,88,87] },
  { id:3,  symbol:'PLMX', name:'Palumex Pharma',        sector:'Healthcare', price:214.80, change:0.88,  color:'#ec4899',
    mktCap:'$52.7B', peRatio:'34.1', dividend:'1.2%', volume:'1.1M', week52Hi:'241.00', week52Lo:'155.40',
    pros:['3 drugs in Phase 3 trials','Patent moat through 2031','Strong cash reserves $8.1B'],
    cons:['FDA approval risk on lead drug','CEO departure last quarter','Generic competition rising'],
    history:[160,172,168,185,191,200,198,210,208,214] },
  { id:4,  symbol:'CRBN', name:'Carbonix Materials',    sector:'Industrial', price:56.40,  change:-2.31, color:'#f97316',
    mktCap:'$8.9B',  peRatio:'15.6', dividend:'2.4%', volume:'3.5M', week52Hi:'78.20', week52Lo:'48.10',
    pros:['Monopoly on patented carbon-fiber alloy','Strong aerospace contracts','Low valuation vs peers'],
    cons:['Revenue declined 11% last quarter','Pension liability of $2.3B','Supply chain bottlenecks'],
    history:[72,68,65,60,58,54,57,55,58,56] },
  { id:5,  symbol:'SKYL', name:'Skylane Logistics',     sector:'Transport',  price:193.20, change:1.55,  color:'#a78bfa',
    mktCap:'$29.4B', peRatio:'22.8', dividend:'0.8%', volume:'5.6M', week52Hi:'210.00', week52Lo:'148.30',
    pros:['Last-mile delivery network in 40 countries','AI routing cut costs by 18%','Growing e-commerce tailwind'],
    cons:['Fuel cost exposure','Labor union disputes pending','Margins compressed by competition'],
    history:[150,158,162,170,175,180,178,185,190,193] },
  { id:6,  symbol:'BNKR', name:'Bankora Financial',     sector:'Finance',    price:44.10,  change:-0.44, color:'#fbbf24',
    mktCap:'$11.2B', peRatio:'10.1', dividend:'4.8%', volume:'6.1M', week52Hi:'52.80', week52Lo:'36.50',
    pros:['Highest dividend yield in sector','Strong deposit base','Trading below book value'],
    cons:['Exposed to regional real estate downturn','Rising loan defaults','Regulatory capital requirements tightening'],
    history:[42,44,46,43,45,44,43,44,45,44] },
  { id:7,  symbol:'DRVX', name:'Drivex Autonomous',     sector:'Tech',       price:312.90, change:4.22,  color:'#06b6d4',
    mktCap:'$71.3B', peRatio:'89.2', dividend:'0%', volume:'8.4M', week52Hi:'340.00', week52Lo:'198.00',
    pros:['Market leader in level-4 autonomy','Partnership with 4 major automakers','Massive IP portfolio (2,400 patents)'],
    cons:['Not yet profitable','Heavy R&D burn $1.2B/quarter','Regulatory approval timeline uncertain'],
    history:[200,218,232,245,260,275,268,290,305,312] },
  { id:8,  symbol:'HRBN', name:'Harbon Consumer Goods',  sector:'Consumer',   price:78.60,  change:0.31,  color:'#84cc16',
    mktCap:'$19.8B', peRatio:'18.3', dividend:'2.9%', volume:'2.2M', week52Hi:'88.40', week52Lo:'64.20',
    pros:['50-year brand with loyal customer base','Expanding in Asia-Pacific','Consistent free cash flow'],
    cons:['Mature market, low growth ceiling','Private label competition intensifying','Rising raw material costs'],
    history:[66,68,70,72,71,74,75,77,78,78] },
  { id:9,  symbol:'QNTM', name:'Quantum Vaultech',       sector:'Tech',       price:487.30, change:6.88,  color:'#8b5cf6',
    mktCap:'$112.4B',peRatio:'142.0',dividend:'0%', volume:'3.9M', week52Hi:'510.00', week52Lo:'280.00',
    pros:['Only commercial quantum processor at scale','US DoD $4B contract secured','Exponential revenue growth 180% YoY'],
    cons:['Extremely high valuation','Technology still pre-commercial for most use cases','Key-person risk on founder-CEO'],
    history:[285,310,340,370,390,420,410,445,470,487] },
  { id:10, symbol:'MRVL', name:'Maravel Retail Group',   sector:'Consumer',   price:34.20,  change:-1.88, color:'#f43f5e',
    mktCap:'$6.1B',  peRatio:'11.4', dividend:'3.6%', volume:'4.7M', week52Hi:'48.90', week52Lo:'28.10',
    pros:['Deep discount model thrives in recession','Expanding store count by 200/year','Strong inventory management'],
    cons:['Brick-and-mortar faces e-commerce headwinds','Thin 2.1% net margins','High debt-to-equity ratio 1.8x'],
    history:[44,42,40,38,36,35,34,33,35,34] },
  { id:11, symbol:'HLTH', name:'Healtrix Systems',        sector:'Healthcare', price:156.70, change:1.12,  color:'#10b981',
    mktCap:'$34.5B', peRatio:'26.7', dividend:'1.5%', volume:'1.8M', week52Hi:'172.00', week52Lo:'118.30',
    pros:['AI diagnostics platform adopted by 800 hospitals','Recurring SaaS revenue model','Aging population tailwind'],
    cons:['Data privacy lawsuits pending','Insurance reimbursement uncertainty','High customer acquisition cost'],
    history:[120,128,133,138,142,148,150,153,155,156] },
  { id:12, symbol:'ORZN', name:'Orazon Mining Ltd',       sector:'Materials',  price:22.80,  change:-3.14, color:'#d97706',
    mktCap:'$3.2B',  peRatio:'8.9',  dividend:'5.2%', volume:'9.1M', week52Hi:'38.40', week52Lo:'18.20',
    pros:['Highest dividend in portfolio','Rare-earth minerals in high demand','Low production cost per unit'],
    cons:['Commodity price volatility','Environmental litigation risk','Geopolitical exposure in operations'],
    history:[35,32,30,28,27,25,24,23,24,22] },
  { id:13, symbol:'CLVR', name:'Clevra Software',         sector:'Tech',       price:268.40, change:2.77,  color:'#3b82f6',
    mktCap:'$58.9B', peRatio:'51.3', dividend:'0%', volume:'2.6M', week52Hi:'295.00', week52Lo:'180.00',
    pros:['Enterprise SaaS with 94% retention rate','Expanding into cybersecurity','Net revenue retention 128%'],
    cons:['Growth slowing from 60% to 28% YoY','Stock-based compensation diluting shareholders','Sales cycle getting longer'],
    history:[182,195,208,218,228,238,245,255,262,268] },
  { id:14, symbol:'WNTR', name:'Wintermoor Hospitality',  sector:'Consumer',   price:61.50,  change:0.62,  color:'#e879f9',
    mktCap:'$9.7B',  peRatio:'20.4', dividend:'1.8%', volume:'1.4M', week52Hi:'72.30', week52Lo:'48.00',
    pros:['Post-pandemic travel boom driving occupancy','Loyalty program with 22M members','Asset-light franchise model'],
    cons:['Recession-sensitive business','Rising labor and food costs','Heavily leveraged balance sheet'],
    history:[50,52,54,56,57,59,60,61,62,61] },
  { id:15, symbol:'FRST', name:'Forestra Biotech',         sector:'Healthcare', price:93.10,  change:-0.55, color:'#34d399',
    mktCap:'$16.8B', peRatio:'N/A',  dividend:'0%', volume:'3.3M', week52Hi:'118.00', week52Lo:'61.40',
    pros:['Gene therapy pipeline with 6 candidates','Orphan drug designation grants market exclusivity','Buyout speculation by Big Pharma'],
    cons:['No revenue yet — pre-commercial stage','Cash runway only 18 months','Binary risk on trial outcomes'],
    history:[65,70,75,72,80,85,82,90,92,93] },
];

const T = {
  bg:'#0c0c0e',gold:'#B8973A',goldDim:'rgba(184,151,58,0.12)',goldBorder:'rgba(184,151,58,0.28)',
  text:'#F0EDE6',muted:'rgba(240,237,230,0.4)',border:'rgba(255,255,255,0.06)'
};

function fmt(n,d=2){return n.toLocaleString('en-US',{minimumFractionDigits:d,maximumFractionDigits:d});}
function fmtMoney(n){return '$'+fmt(n);}

function Sparkline({ data, color, width=100, height=36 }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v,i) => {
    const x = (i / (data.length-1)) * (width-4) + 2;
    const y = height - 4 - ((v - min) / range) * (height-8);
    return x+','+y;
  }).join(' ');
  const area = 'M'+data.map((v,i)=>{
    const x=(i/(data.length-1))*(width-4)+2;
    const y=height-4-((v-min)/range)*(height-8);
    return x+' '+y;
  }).join(' L')+' L'+(width-2)+' '+(height-4)+' L2 '+(height-4)+' Z';
  return (
    <svg width={width} height={height} viewBox={'0 0 '+width+' '+height} fill="none">
      <defs>
        <linearGradient id={'g'+color.replace('#','')} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={'url(#g'+color.replace('#','')+')'}/>
      <polyline points={pts} stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
    </svg>
  );
}

function StockDetail({ stock, onBack, coinBalance }) {
  const [qty, setQty] = useState(1);
  const [bought, setBought] = useState(false);
  const [portfolio, setPortfolio] = useState([]);
  const up = stock.change >= 0;
  const totalCost = qty * stock.price;
  const canBuy = coinBalance >= totalCost && qty > 0;

  function handleBuy() {
    if (!canBuy) return;
    setBought(true);
    setTimeout(() => setBought(false), 2000);
  }

  return (
    <div className="fade-up" style={{padding:'24px 20px 80px',maxWidth:720,margin:'0 auto'}}>
      <button className="btn btn-ghost" onClick={onBack} style={{marginBottom:20}}>← Back</button>

      <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:24}}>
        <div style={{width:52,height:52,borderRadius:14,background:stock.color+'22',border:'1px solid '+stock.color+'44',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
          <span style={{fontSize:13,fontWeight:800,color:stock.color}}>{stock.symbol.slice(0,2)}</span>
        </div>
        <div style={{flex:1}}>
          <h2 style={{fontSize:20,fontWeight:700,color:T.text}}>{stock.name}</h2>
          <p style={{fontSize:12,color:T.muted}}>{stock.symbol} · {stock.sector}</p>
        </div>
        <div style={{textAlign:'right'}}>
          <p style={{fontSize:24,fontWeight:800,color:T.text}}>{fmtMoney(stock.price)}</p>
          <span className={'tag '+(up?'tag-up':'tag-down')}>{up?'+':''}{stock.change}%</span>
        </div>
      </div>

      <div className="card" style={{padding:'16px',marginBottom:16}}>
        <Sparkline data={stock.history} color={up?'#00c864':'#ff3c3c'} width={680} height={100}/>
        <div style={{display:'flex',justifyContent:'space-between',marginTop:8}}>
          <span style={{fontSize:11,color:T.muted}}>10-week price history</span>
          <span style={{fontSize:11,color:T.muted}}>52w: {fmtMoney(parseFloat(stock.week52Lo))} – {fmtMoney(parseFloat(stock.week52Hi))}</span>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10,marginBottom:16}}>
        {[
          {label:'Market Cap', value:stock.mktCap},
          {label:'P/E Ratio',  value:stock.peRatio},
          {label:'Dividend',   value:stock.dividend},
          {label:'Volume',     value:stock.volume},
          {label:'52w High',   value:fmtMoney(parseFloat(stock.week52Hi))},
          {label:'52w Low',    value:fmtMoney(parseFloat(stock.week52Lo))},
        ].map((s,i)=>(
          <div key={i} className="card" style={{padding:'12px 14px'}}>
            <p style={{fontSize:10,color:T.muted,textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:4}}>{s.label}</p>
            <p style={{fontSize:14,fontWeight:700,color:T.text}}>{s.value}</p>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:12,marginBottom:16}}>
        <div className="card" style={{padding:'16px'}}>
          <p style={{fontSize:11,fontWeight:700,color:'#00c864',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>✓ Pros</p>
          {stock.pros.map((p,i)=>(
            <div key={i} style={{display:'flex',gap:8,marginBottom:8}}>
              <span style={{color:'#00c864',fontSize:12,flexShrink:0}}>+</span>
              <p style={{fontSize:12,color:T.text,lineHeight:1.5}}>{p}</p>
            </div>
          ))}
        </div>
        <div className="card" style={{padding:'16px'}}>
          <p style={{fontSize:11,fontWeight:700,color:'#ff3c3c',textTransform:'uppercase',letterSpacing:'0.1em',marginBottom:10}}>✗ Cons</p>
          {stock.cons.map((c,i)=>(
            <div key={i} style={{display:'flex',gap:8,marginBottom:8}}>
              <span style={{color:'#ff3c3c',fontSize:12,flexShrink:0}}>−</span>
              <p style={{fontSize:12,color:T.text,lineHeight:1.5}}>{c}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{padding:'20px'}}>
        <p style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:14}}>Buy Shares</p>
        <div style={{display:'flex',alignItems:'center',gap:12,flexWrap:'wrap'}}>
          <div style={{display:'flex',alignItems:'center',gap:8,background:'#0c0c0e',border:'1px solid rgba(255,255,255,0.09)',borderRadius:8,padding:'6px 12px'}}>
            <button onClick={()=>setQty(q=>Math.max(1,q-1))} style={{background:'none',border:'none',color:T.muted,fontSize:18,cursor:'pointer',lineHeight:1}}>−</button>
            <span style={{fontSize:14,fontWeight:700,color:T.text,minWidth:24,textAlign:'center'}}>{qty}</span>
            <button onClick={()=>setQty(q=>q+1)} style={{background:'none',border:'none',color:T.muted,fontSize:18,cursor:'pointer',lineHeight:1}}>+</button>
          </div>
          <div style={{flex:1}}>
            <p style={{fontSize:12,color:T.muted}}>Total cost</p>
            <p style={{fontSize:16,fontWeight:700,color:T.gold}}>{fmtMoney(totalCost)}</p>
          </div>
          <div style={{textAlign:'right'}}>
            <p style={{fontSize:11,color:T.muted,marginBottom:4}}>Your balance: ◈ {coinBalance.toLocaleString()}</p>
            <button className="btn btn-buy" disabled={!canBuy} onClick={handleBuy} style={{opacity:canBuy?1:0.4,cursor:canBuy?'pointer':'not-allowed'}}>
              {bought ? '✓ Bought!' : canBuy ? 'Buy Now' : coinBalance < totalCost ? 'Not enough coins' : 'Enter qty'}
            </button>
          </div>
        </div>
        {!canBuy && coinBalance < totalCost && (
          <p style={{fontSize:11,color:'#ff3c3c',marginTop:10}}>
            You need ◈ {Math.ceil(totalCost - coinBalance).toLocaleString()} more coins to buy {qty} share{qty>1?'s':''}.
          </p>
        )}
      </div>
    </div>
  );
}

function App() {
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('market');

  if (selected) return <StockDetail stock={selected} onBack={()=>setSelected(null)} coinBalance={COIN_BALANCE}/>;

  return (
    <div style={{minHeight:'100vh',background:T.bg,padding:'28px 20px 80px',maxWidth:960,margin:'0 auto'}}>
      <div className="fade-up" style={{marginBottom:24}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:12}}>
          <div>
            <h1 style={{fontSize:22,fontWeight:700,color:T.text}}>Investments</h1>
            <p style={{fontSize:13,color:T.muted,marginTop:3}}>Tap a stock to view details & invest</p>
          </div>
          <div style={{background:'rgba(184,151,58,0.1)',border:'1px solid rgba(184,151,58,0.25)',borderRadius:10,padding:'8px 16px'}}>
            <p style={{fontSize:11,color:T.muted}}>Available Balance</p>
            <p style={{fontSize:16,fontWeight:700,color:T.gold}}>◈ {COIN_BALANCE.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div style={{display:'flex',gap:6,marginBottom:16}}>
        {['market','gainers','losers'].map(t=>(
          <button key={t} onClick={()=>setTab(t)} className="btn" style={{
            background:tab===t?T.goldDim:'transparent',
            color:tab===t?T.gold:T.muted,
            border:tab===t?'1px solid '+T.goldBorder:'1px solid rgba(255,255,255,0.06)',
            textTransform:'capitalize'
          }}>{t==='market'?'All Stocks':t==='gainers'?'Top Gainers':'Top Losers'}</button>
        ))}
      </div>

      <div className="fade-up" style={{display:'flex',flexDirection:'column',gap:8}}>
        {[...STOCKS]
          .filter(s => tab==='gainers' ? s.change>0 : tab==='losers' ? s.change<0 : true)
          .sort((a,b) => tab==='gainers' ? b.change-a.change : tab==='losers' ? a.change-b.change : 0)
          .map(s=>(
          <div key={s.id} className="card" onClick={()=>setSelected(s)}
            style={{padding:'13px 16px',display:'flex',alignItems:'center',gap:12,flexWrap:'wrap',cursor:'pointer'}}>
            <div style={{width:40,height:40,borderRadius:10,background:s.color+'22',border:'1px solid '+s.color+'44',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <span style={{fontSize:11,fontWeight:800,color:s.color}}>{s.symbol.slice(0,3)}</span>
            </div>
            <div style={{flex:1,minWidth:100}}>
              <p style={{fontSize:13,fontWeight:700,color:T.text}}>{s.symbol}</p>
              <p style={{fontSize:11,color:T.muted}}>{s.name}</p>
            </div>
            <Sparkline data={s.history} color={s.change>=0?'#00c864':'#ff3c3c'} width={80} height={32}/>
            <div style={{textAlign:'right',minWidth:90}}>
              <p style={{fontSize:14,fontWeight:700,color:T.text}}>{fmtMoney(s.price)}</p>
              <span className={'tag '+(s.change>=0?'tag-up':'tag-down')}>{s.change>=0?'+':''}{s.change}%</span>
            </div>
            <div style={{textAlign:'right',minWidth:70}}>
              <p style={{fontSize:11,color:T.muted}}>{s.sector}</p>
              <p style={{fontSize:11,color:T.muted}}>Cap {s.mktCap}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
<\\/script>
</body>
</html>\`;

  if (loadingCoins) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0c0c0e',color:'#B8973A',fontSize:16,fontWeight:600}}>
      Loading...
    </div>
  );

  return (
    <iframe
      srcDoc={html}
      style={{width:'100%',height:'100vh',border:'none',display:'block'}}
      title="Investments"
    />
  );
}
`;

fs.writeFileSync('./src/pages/Investments.jsx', newFile);
console.log('Done!');
