import { useMemo, useState, useEffect, useCallback } from "react";
import {
  Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Search, TrendingUp, TrendingDown, X, RefreshCw } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const TICKERS = [
  "AAPL","MSFT","GOOGL","AMZN","NVDA",
  "META","TSLA","BRK-B","JPM","V",
  "WMT","JNJ","XOM","UNH","MA",
];

const COMPANY_NAMES = {
  AAPL:"Apple Inc.",MSFT:"Microsoft Corp.",GOOGL:"Alphabet Inc.",
  AMZN:"Amazon.com Inc.",NVDA:"NVIDIA Corp.",META:"Meta Platforms",
  TSLA:"Tesla Inc.","BRK-B":"Berkshire Hathaway",JPM:"JPMorgan Chase",
  V:"Visa Inc.",WMT:"Walmart Inc.",JNJ:"Johnson & Johnson",
  XOM:"Exxon Mobil",UNH:"UnitedHealth Group",MA:"Mastercard Inc.",
};

// ─── Yahoo Finance via Vite proxy (fixes CORS) ────────────────────────────────

async function fetchYahoo(symbol, range = "1mo", interval = "1d") {
  const isProd = import.meta.env.PROD;
  const url = isProd
    ? `https://yahoo-finance15.p.rapidapi.com/api/v1/markets/stock/history?symbol=${encodeURIComponent(symbol)}&interval=${interval}&diffandsplits=false`
    : `/yahoo-finance/v8/finance/chart/${encodeURIComponent(symbol)}?range=${range}&interval=${interval}&includePrePost=false`;

  const res = await fetch(url, isProd ? {
    headers: {
      'x-rapidapi-host': 'yahoo-finance15.p.rapidapi.com',
      'x-rapidapi-key': import.meta.env.VITE_YAHOO_API_KEY,
    }
  } : {});

  if (!res.ok) throw new Error(`Yahoo ${symbol} ${res.status}`);
  const json = await res.json();

  // RapidAPI returns different shape — normalize it
  if (isProd) {
    const items = json?.body ?? [];
    const sparkline = items.map(d => ({ t: d.date, c: parseFloat(d.close) })).filter(p => !isNaN(p.c));
    const price = sparkline.at(-1)?.c ?? 0;
    const previousClose = sparkline.at(-2)?.c ?? price;
    return { meta: { regularMarketPrice: price, chartPreviousClose: previousClose, currency: 'USD' }, timestamp: sparkline.map(p => p.t), indicators: { quote: [{ close: sparkline.map(p => p.c) }] } };
  }

  const result = json?.chart?.result?.[0];
  if (!result) throw new Error(`No data for ${symbol}`);
  return result;
}
function computeRating(history, meta) {
  if (history.length < 30) return {
    score: 50, label: "Hold", horizon: "6–12 months",
    reasons: ["Insufficient data for a strong signal."],
    risks: ["Limited history available."],
  };
  const closes = history.map((p) => p.c);
  const last = closes.at(-1), first = closes[0];
  const yearReturn = ((last - first) / first) * 100;
  const sma = (n) => closes.slice(-n).reduce((a,b)=>a+b,0) / Math.min(n, closes.length);
  const sma50 = sma(50), sma200 = sma(200);
  const returns = closes.slice(1).map((c,i) => Math.log(c/closes[i]));
  const mean = returns.reduce((a,b)=>a+b,0)/returns.length;
  const variance = returns.reduce((a,b)=>a+(b-mean)**2,0)/returns.length;
  const volAnnual = Math.sqrt(variance*252)*100;
  const high52 = meta.fiftyTwoWeekHigh ?? Math.max(...closes);
  const low52  = meta.fiftyTwoWeekLow  ?? Math.min(...closes);
  const distFromHigh = ((high52-last)/high52)*100;
  const distFromLow  = ((last-low52)/low52)*100;
  let score=50; const reasons=[], risks=[];
  if (last>sma50)  { score+=8;  reasons.push(`Trading above 50-day avg ($${sma50.toFixed(2)}), short-term uptrend.`); }
  else             { score-=8;  risks.push(`Below 50-day avg ($${sma50.toFixed(2)}), short-term weakness.`); }
  if (last>sma200) { score+=12; reasons.push(`Above 200-day avg ($${sma200.toFixed(2)}), long-term uptrend intact.`); }
  else             { score-=12; risks.push(`Below 200-day avg ($${sma200.toFixed(2)}), long-term trend weak.`); }
  if (yearReturn>15)  { score+=10; reasons.push(`Strong 1-year return of ${yearReturn.toFixed(1)}%.`); }
  else if (yearReturn<-10) { score-=10; risks.push(`Negative 1-year return of ${yearReturn.toFixed(1)}%.`); }
  if (volAnnual<25)   { score+=5; reasons.push(`Low annualized volatility (${volAnnual.toFixed(1)}%).`); }
  else if (volAnnual>45) { score-=8; risks.push(`High annualized volatility (${volAnnual.toFixed(1)}%) — expect swings.`); }
  if (distFromHigh<5)  { score+=4; reasons.push(`Within ${distFromHigh.toFixed(1)}% of 52-week high — strong momentum.`); }
  if (distFromLow<10)  { score-=5; risks.push(`Only ${distFromLow.toFixed(1)}% above 52-week low — fragile floor.`); }
  score = Math.max(0, Math.min(100, score));
  let label, horizon;
  if      (score>=75) { label="Strong Buy";  horizon="12–24 months for compounding gains"; }
  else if (score>=60) { label="Buy";         horizon="6–18 months to capture trend"; }
  else if (score>=40) { label="Hold";        horizon="Reassess in 3–6 months"; }
  else if (score>=25) { label="Sell";        horizon="Trim within 1–3 months"; }
  else                { label="Strong Sell"; horizon="Exit promptly"; }
  return { score, label, horizon, reasons, risks };
}

async function fetchAllStocks() {
  const results = await Promise.all(
    TICKERS.map(async (sym) => {
      try { const r = await fetchYahoo(sym,"1mo","1d"); return buildQuote(sym,r); }
      catch { return null; }
    })
  );
  return results.filter(Boolean);
}

async function fetchStockDetail(symbol) {
  const sym = symbol.toUpperCase();
  const result = await fetchYahoo(sym,"1y","1d");
  const quote = buildQuote(sym, result);
  const rating = computeRating(quote.sparkline, result.meta??{});
  return {
    quote, history: quote.sparkline,
    stats: {
      marketCap: result.meta?.marketCap,
      fiftyTwoWeekHigh: result.meta?.fiftyTwoWeekHigh,
      fiftyTwoWeekLow:  result.meta?.fiftyTwoWeekLow,
      regularMarketDayHigh: result.meta?.regularMarketDayHigh,
      regularMarketDayLow:  result.meta?.regularMarketDayLow,
      regularMarketVolume:  result.meta?.regularMarketVolume,
      averageVolume: result.meta?.averageDailyVolume3Month ?? result.meta?.averageDailyVolume10Day,
      exchangeName:  result.meta?.fullExchangeName ?? result.meta?.exchangeName,
    },
    rating,
  };
}

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmt(n, opts={}) {
  if (n==null||isNaN(n)) return "—";
  return new Intl.NumberFormat("en-US",{maximumFractionDigits:2,...opts}).format(n);
}
function fmtCompact(n) {
  if (!n) return "—";
  return new Intl.NumberFormat("en-US",{notation:"compact",maximumFractionDigits:2}).format(n);
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
  .ss-wrap { background:#0b0e11; min-height:100vh; color:#e2e8f0; font-family:'IBM Plex Mono',ui-monospace,monospace; }
  .ss-ticker-bar { overflow:hidden; background:#111518; border-bottom:1px solid #1e2530; height:38px; }
  .ss-ticker-track { display:flex; width:max-content; gap:28px; padding:9px 16px; font-size:12px; white-space:nowrap; animation:ss-ticker 45s linear infinite; }
  .ss-ticker-track:hover { animation-play-state:paused; }
  @keyframes ss-ticker { from{transform:translateX(0)} to{transform:translateX(-50%)} }
  .ss-header { border-bottom:1px solid #1e2530; background:#0d1117; padding:20px 28px; display:flex; flex-wrap:wrap; align-items:center; justify-content:space-between; gap:14px; }
  .ss-title { font-size:22px; font-weight:700; letter-spacing:.12em; color:#f0b429; }
  .ss-subtitle { font-size:11px; color:#4a5568; margin-top:3px; letter-spacing:.04em; }
  .ss-search-wrap { position:relative; }
  .ss-search-wrap svg { position:absolute; left:10px; top:50%; transform:translateY(-50%); color:#4a5568; pointer-events:none; }
  .ss-input { background:#111518; border:1px solid #1e2530; border-radius:6px; padding:8px 12px 8px 32px; font-size:12px; font-family:inherit; color:#e2e8f0; outline:none; width:240px; transition:border-color .2s; }
  .ss-input:focus { border-color:#f0b42966; }
  .ss-input::placeholder { color:#2d3748; }
  .ss-refresh { background:#111518; border:1px solid #1e2530; border-radius:6px; padding:8px 10px; cursor:pointer; color:#4a5568; display:flex; align-items:center; transition:color .2s,border-color .2s; }
  .ss-refresh:hover { color:#f0b429; border-color:#f0b42966; }
  @keyframes ss-spin { to{transform:rotate(360deg)} }
  .ss-spinning { animation:ss-spin .7s linear infinite; }
  .ss-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(280px,1fr)); gap:14px; padding:24px 28px; }
  .ss-card { background:#0d1117; border:1px solid #1e2530; border-radius:8px; padding:16px; text-align:left; cursor:pointer; transition:border-color .15s,background .15s; width:100%; }
  .ss-card:hover { border-color:#f0b42966; background:#111822; }
  .ss-card-sym { font-size:18px; font-weight:700; color:#f7fafc; letter-spacing:.04em; }
  .ss-card-name { font-size:11px; color:#4a5568; margin-top:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:130px; }
  .ss-card-price { font-size:17px; font-weight:600; color:#f7fafc; }
  .ss-card-change { display:flex; align-items:center; gap:4px; font-size:11px; font-weight:600; margin-top:2px; justify-content:flex-end; }
  .ss-bull { color:#48bb78; }
  .ss-bear { color:#f56565; }
  .ss-skeleton { height:170px; border-radius:8px; border:1px solid #1e2530; background:#0d1117; animation:ss-pulse 1.4s ease-in-out infinite; }
  @keyframes ss-pulse { 0%,100%{opacity:1} 50%{opacity:.3} }
  .ss-error { background:#1a0a0a; border:1px solid #742a2a; border-radius:8px; padding:24px; text-align:center; font-size:13px; color:#fc8181; margin:24px 28px; }
  .ss-empty { background:#0d1117; border:1px solid #1e2530; border-radius:8px; padding:40px; text-align:center; font-size:13px; color:#4a5568; margin:0 28px; }
  .ss-footer { border-top:1px solid #1e2530; padding:14px 28px; text-align:center; font-size:10px; color:#2d3748; letter-spacing:.04em; }
  .ss-overlay { position:fixed; inset:0; z-index:1000; background:rgba(0,0,0,.78); backdrop-filter:blur(4px); display:flex; align-items:center; justify-content:center; padding:16px; }
  .ss-modal { background:#0d1117; border:1px solid #2d3748; border-radius:12px; width:100%; max-width:740px; max-height:90vh; overflow-y:auto; padding:28px; position:relative; }
  .ss-modal-close { position:absolute; top:16px; right:16px; background:#111518; border:1px solid #1e2530; border-radius:6px; width:30px; height:30px; display:flex; align-items:center; justify-content:center; cursor:pointer; color:#4a5568; transition:color .2s; }
  .ss-modal-close:hover { color:#f7fafc; }
  .ss-stats-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:8px; margin:16px 0; }
  .ss-stat { background:#111518; border:1px solid #1e2530; border-radius:6px; padding:8px 10px; }
  .ss-stat-label { font-size:9px; text-transform:uppercase; letter-spacing:.1em; color:#4a5568; }
  .ss-stat-value { font-size:13px; color:#e2e8f0; margin-top:3px; }
  .ss-rating { background:#111518; border:1px solid #1e2530; border-radius:8px; padding:16px; }
  .ss-rating-score { font-size:28px; font-weight:700; font-family:inherit; }
  .ss-horizon-badge { font-size:11px; border:1px solid #2d3748; border-radius:5px; padding:3px 8px; color:#718096; }
  .ss-score-bar-bg { height:4px; border-radius:4px; background:#1e2530; margin-top:12px; overflow:hidden; }
  .ss-score-bar-fill { height:100%; border-radius:4px; transition:width .6s ease; }
  .ss-reasons-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-top:16px; }
  .ss-reasons-title { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:.1em; margin-bottom:8px; }
  .ss-reason-item { display:flex; gap:6px; font-size:12px; color:#a0aec0; line-height:1.5; margin-bottom:6px; }
  .ss-loading-center { height:360px; display:flex; flex-direction:column; align-items:center; justify-content:center; gap:12px; }
  .ss-spinner { width:32px; height:32px; border:3px solid #1e2530; border-top-color:#f0b429; border-radius:50%; animation:ss-spin .8s linear infinite; }
  .ss-loading-text { font-size:12px; color:#4a5568; }
  @media(max-width:600px){ .ss-stats-grid{grid-template-columns:repeat(2,1fr);} .ss-reasons-grid{grid-template-columns:1fr;} .ss-input{width:160px;} }
`;

function InjectCSS() {
  useEffect(() => {
    const el = document.createElement("style");
    el.id = "stocksense-styles";
    el.textContent = CSS;
    if (!document.getElementById("stocksense-styles")) document.head.appendChild(el);
    return () => document.getElementById("stocksense-styles")?.remove();
  }, []);
  return null;
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useStocks() {
  const [data, setData]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const load = useCallback(async () => {
    setLoading(true); setError(null);
    try { setData(await fetchAllStocks()); }
    catch(e) { setError(e.message); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  return { data, loading, error, refetch: load };
}

function useStockDetail(symbol) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);
  useEffect(() => {
    if (!symbol) { setData(null); return; }
    setLoading(true); setError(null);
    fetchStockDetail(symbol)
      .then(setData).catch(e=>setError(e.message)).finally(()=>setLoading(false));
  }, [symbol]);
  return { data, loading, error };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function TickerStrip({ stocks }) {
  if (!stocks.length) return <div className="ss-ticker-bar" />;
  const items = [...stocks, ...stocks];
  return (
    <div className="ss-ticker-bar">
      <div className="ss-ticker-track">
        {items.map((s,i) => {
          const up = s.change >= 0;
          return (
            <span key={i} style={{display:"flex",alignItems:"center",gap:6}}>
              <span style={{fontWeight:700,color:"#e2e8f0"}}>{s.symbol}</span>
              <span style={{color:"#4a5568"}}>${fmt(s.price)}</span>
              <span className={up?"ss-bull":"ss-bear"}>
                {up?"▲":"▼"} {fmt(Math.abs(s.changePercent))}%
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

function StockCard({ stock, onClick }) {
  const up = stock.change >= 0;
  const color = up ? "#48bb78" : "#f56565";
  return (
    <button className="ss-card" onClick={onClick}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
        <div>
          <div className="ss-card-sym">{stock.symbol}</div>
          <div className="ss-card-name">{stock.name}</div>
        </div>
        <div style={{textAlign:"right"}}>
          <div className="ss-card-price">${fmt(stock.price)}</div>
          <div className="ss-card-change" style={{color}}>
            {up ? <TrendingUp size={11}/> : <TrendingDown size={11}/>}
            {up?"+":""}{fmt(stock.change)} ({fmt(stock.changePercent)}%)
          </div>
        </div>
      </div>
      <div style={{marginTop:12,height:72}}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={stock.sparkline}>
            <defs>
              <linearGradient id={`g-${stock.symbol}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.45}/>
                <stop offset="100%" stopColor={color} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <Area type="monotone" dataKey="c" stroke={color} strokeWidth={1.6}
              fill={`url(#g-${stock.symbol})`} isAnimationActive={false} dot={false}/>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </button>
  );
}

function Stat({ label, value }) {
  return (
    <div className="ss-stat">
      <div className="ss-stat-label">{label}</div>
      <div className="ss-stat-value">{value}</div>
    </div>
  );
}

function RatingPanel({ rating }) {
  const color = rating.score>=60?"#48bb78":rating.score<=40?"#f56565":"#f0b429";
  return (
    <div className="ss-rating">
      <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",justifyContent:"space-between",gap:12}}>
        <div>
          <div style={{fontSize:9,textTransform:"uppercase",letterSpacing:".1em",color:"#4a5568"}}>Investment Rating</div>
          <div className="ss-rating-score" style={{color}}>{rating.label}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{textAlign:"right"}}>
            <span className="ss-rating-score" style={{color}}>{rating.score}</span>
            <span style={{fontSize:12,color:"#4a5568"}}>/100</span>
          </div>
          <div className="ss-horizon-badge">{rating.horizon}</div>
        </div>
      </div>
      <div className="ss-score-bar-bg">
        <div className="ss-score-bar-fill" style={{width:`${rating.score}%`,background:color}}/>
      </div>
      <div className="ss-reasons-grid">
        <div>
          <div className="ss-reasons-title ss-bull">Why invest</div>
          {rating.reasons.length
            ? rating.reasons.map((r,i)=>(
                <div key={i} className="ss-reason-item">
                  <span className="ss-bull" style={{flexShrink:0}}>▲</span><span>{r}</span>
                </div>
              ))
            : <div style={{fontSize:12,color:"#4a5568"}}>No strong bullish signals.</div>}
        </div>
        <div>
          <div className="ss-reasons-title ss-bear">Why be cautious</div>
          {rating.risks.length
            ? rating.risks.map((r,i)=>(
                <div key={i} className="ss-reason-item">
                  <span className="ss-bear" style={{flexShrink:0}}>▼</span><span>{r}</span>
                </div>
              ))
            : <div style={{fontSize:12,color:"#4a5568"}}>No major red flags detected.</div>}
        </div>
      </div>
    </div>
  );
}

function DetailModal({ symbol, onClose }) {
  const { data:d, loading, error } = useStockDetail(symbol);
  useEffect(() => {
    const h = (e) => { if(e.key==="Escape") onClose(); };
    window.addEventListener("keydown",h);
    return ()=>window.removeEventListener("keydown",h);
  },[onClose]);

  return (
    <div className="ss-overlay" onClick={e=>{ if(e.target===e.currentTarget) onClose(); }}>
      <div className="ss-modal">
        <button className="ss-modal-close" onClick={onClose}><X size={14}/></button>
        {loading||!d ? (
          <div className="ss-loading-center">
            <div className="ss-spinner"/>
            <div className="ss-loading-text">Loading {symbol}…</div>
          </div>
        ) : error ? (
          <div style={{padding:32,textAlign:"center",color:"#fc8181",fontSize:13}}>
            Failed to load {symbol} data.
          </div>
        ) : (
          <>
            <div style={{marginBottom:16}}>
              <div style={{display:"flex",alignItems:"baseline",flexWrap:"wrap",gap:8}}>
                <span style={{fontFamily:"monospace",fontSize:26,fontWeight:700,color:"#f7fafc",letterSpacing:".06em"}}>{d.quote.symbol}</span>
                <span style={{fontSize:13,color:"#4a5568"}}>{d.quote.name}</span>
              </div>
              <div style={{display:"flex",alignItems:"baseline",gap:10,marginTop:4}}>
                <span style={{fontFamily:"monospace",fontSize:24,fontWeight:600,color:"#f7fafc"}}>${fmt(d.quote.price)}</span>
                <span className={d.quote.change>=0?"ss-bull":"ss-bear"} style={{fontSize:14,fontWeight:600,fontFamily:"monospace"}}>
                  {d.quote.change>=0?"+":""}{fmt(d.quote.change)} ({fmt(d.quote.changePercent)}%)
                </span>
              </div>
            </div>

            <div style={{height:220,marginBottom:4}}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={d.history}>
                  <defs>
                    <linearGradient id="dg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f0b429" stopOpacity={0.3}/>
                      <stop offset="100%" stopColor="#f0b429" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="t"
                    tickFormatter={t=>new Date(t*1000).toLocaleDateString("en-US",{month:"short",day:"numeric"})}
                    stroke="#1e2530" tick={{fill:"#4a5568",fontSize:10,fontFamily:"monospace"}}/>
                  <YAxis domain={["auto","auto"]} stroke="#1e2530"
                    tick={{fill:"#4a5568",fontSize:10,fontFamily:"monospace"}}
                    tickFormatter={v=>`$${v.toFixed(0)}`}/>
                  <Tooltip
                    contentStyle={{background:"#0d1117",border:"1px solid #2d3748",borderRadius:6,fontFamily:"monospace",fontSize:11}}
                    labelFormatter={t=>new Date(t*1000).toLocaleDateString()}
                    formatter={v=>[`$${v.toFixed(2)}`,"Close"]}/>
                  <Area type="monotone" dataKey="c" stroke="#f0b429" strokeWidth={2}
                    fill="url(#dg)" isAnimationActive={false} dot={false}/>
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="ss-stats-grid">
              <Stat label="52W High"  value={`$${fmt(d.stats.fiftyTwoWeekHigh)}`}/>
              <Stat label="52W Low"   value={`$${fmt(d.stats.fiftyTwoWeekLow)}`}/>
              <Stat label="Day High"  value={`$${fmt(d.stats.regularMarketDayHigh)}`}/>
              <Stat label="Day Low"   value={`$${fmt(d.stats.regularMarketDayLow)}`}/>
              <Stat label="Volume"    value={fmtCompact(d.stats.regularMarketVolume)}/>
              <Stat label="Avg Vol"   value={fmtCompact(d.stats.averageVolume)}/>
              <Stat label="Mkt Cap"   value={fmtCompact(d.stats.marketCap)}/>
              <Stat label="Exchange"  value={d.stats.exchangeName??"—"}/>
            </div>

            <RatingPanel rating={d.rating}/>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StockSense() {
  const [query, setQuery]       = useState("");
  const [selected, setSelected] = useState(null);
  const { data:stocks, loading, error, refetch } = useStocks();

  const filtered = useMemo(() => {
    const q = query.trim().toUpperCase();
    if (!q) return stocks;
    return stocks.filter(s =>
      s.symbol.toUpperCase().includes(q) || s.name.toUpperCase().includes(q)
    );
  }, [stocks, query]);

  return (
    <div className="ss-wrap">
      <InjectCSS/>
      <TickerStrip stocks={stocks}/>

      <div className="ss-header">
        <div>
          <div className="ss-title">STOCK MARKET</div>
          <div className="ss-subtitle">LIVE QUOTES · 15 MAJOR US EQUITIES · AUTO-REFRESH</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div className="ss-search-wrap">
            <Search size={13}/>
            <input className="ss-input" value={query}
              onChange={e=>setQuery(e.target.value)}
              placeholder="Search symbol or company…"/>
          </div>
          <button className="ss-refresh" onClick={refetch} disabled={loading} title="Refresh">
            <RefreshCw size={14} className={loading?"ss-spinning":""}/>
          </button>
        </div>
      </div>

      {loading && (
        <div className="ss-grid">
          {Array.from({length:9}).map((_,i)=>(
            <div key={i} className="ss-skeleton"/>
          ))}
        </div>
      )}

      {error && (
        <div className="ss-error">
          Failed to load market data.{" "}
          <button onClick={refetch}
            style={{color:"#f0b429",background:"none",border:"none",cursor:"pointer",fontFamily:"inherit",textDecoration:"underline"}}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filtered.length===0 && (
        <div className="ss-empty">No stocks match "{query}".</div>
      )}

      {!loading && !error && filtered.length>0 && (
        <div className="ss-grid">
          {filtered.map(s=>(
            <StockCard key={s.symbol} stock={s} onClick={()=>setSelected(s.symbol)}/>
          ))}
        </div>
      )}

      <div className="ss-footer">
        DATA VIA YAHOO FINANCE · FOR INFORMATIONAL PURPOSES ONLY · NOT INVESTMENT ADVICE
      </div>

      {selected && <DetailModal symbol={selected} onClose={()=>setSelected(null)}/>}
    </div>
  );
}