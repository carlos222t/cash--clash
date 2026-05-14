import { useEffect, useMemo, useRef, useState, useCallback } from "react";

// ─── Market Data Engine ───────────────────────────────────────────────────────

const TICKERS = [
  { symbol: "NXVA", name: "Nexavault Robotics",    sector: "Industrials", basePrice: 142.30, drift: 0.12, vol: 0.55 },
  { symbol: "ZPHR", name: "Zephyr Aerospace",      sector: "Aerospace",   basePrice: 68.42,  drift: 0.08, vol: 0.42 },
  { symbol: "HLIO", name: "Helios Energy Grid",    sector: "Energy",      basePrice: 27.18,  drift: 0.05, vol: 0.38 },
  { symbol: "QBYT", name: "Quantbyte Systems",     sector: "Tech",        basePrice: 318.55, drift: 0.18, vol: 0.62 },
  { symbol: "VRDN", name: "Verdant Bio",           sector: "Biotech",     basePrice: 49.07,  drift: 0.04, vol: 0.78 },
  { symbol: "ORCA", name: "Orca Maritime",         sector: "Shipping",    basePrice: 14.22,  drift: 0.02, vol: 0.45 },
  { symbol: "STRA", name: "Strato Cloud",          sector: "Tech",        basePrice: 211.90, drift: 0.15, vol: 0.48 },
  { symbol: "FRGE", name: "Forge Metals",          sector: "Materials",   basePrice: 88.66,  drift: 0.06, vol: 0.40 },
  { symbol: "LMNS", name: "Lumens Semiconductor",  sector: "Tech",        basePrice: 432.10, drift: 0.20, vol: 0.65 },
  { symbol: "AURA", name: "Aurora Foods",          sector: "Consumer",    basePrice: 33.45,  drift: 0.03, vol: 0.28 },
];

function gauss() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function generateHistory(ticker, bars, endTs) {
  const dt = 1 / (252 * 390);
  const out = [];
  let price = ticker.basePrice * (0.85 + Math.random() * 0.3);
  for (let i = bars - 1; i >= 0; i--) {
    const t = endTs - i * 60_000;
    const minuteOfDay = ((t / 60_000) % 390 + 390) % 390;
    const volMult = 1 + 0.8 * Math.exp(-Math.pow((minuteOfDay - 0) / 60, 2))
                      + 0.6 * Math.exp(-Math.pow((minuteOfDay - 389) / 60, 2));
    const sigma = ticker.vol * volMult;
    const o = price;
    let hi = o, lo = o, c = o;
    for (let k = 0; k < 4; k++) {
      const shock = (ticker.drift - 0.5 * sigma * sigma) * (dt / 4) + sigma * Math.sqrt(dt / 4) * gauss();
      const jump = Math.random() < 0.002 ? (Math.random() - 0.5) * 0.04 : 0;
      c = c * Math.exp(shock + jump);
      if (c > hi) hi = c;
      if (c < lo) lo = c;
    }
    price = c;
    const v = Math.round((50_000 + Math.random() * 250_000) * volMult);
    out.push({ t, o, h: hi, l: lo, c, v });
  }
  return out;
}

function nextCandle(ticker, prev, t) {
  const dt = 1 / (252 * 390);
  const minuteOfDay = ((t / 60_000) % 390 + 390) % 390;
  const volMult = 1 + 0.8 * Math.exp(-Math.pow((minuteOfDay - 0) / 60, 2))
                    + 0.6 * Math.exp(-Math.pow((minuteOfDay - 389) / 60, 2));
  const sigma = ticker.vol * volMult;
  const o = prev.c;
  let hi = o, lo = o, c = o;
  for (let k = 0; k < 4; k++) {
    const shock = (ticker.drift - 0.5 * sigma * sigma) * (dt / 4) + sigma * Math.sqrt(dt / 4) * gauss();
    const jump = Math.random() < 0.002 ? (Math.random() - 0.5) * 0.04 : 0;
    c = c * Math.exp(shock + jump);
    if (c > hi) hi = c;
    if (c < lo) lo = c;
  }
  const v = Math.round((50_000 + Math.random() * 250_000) * volMult);
  return { t, o, h: hi, l: lo, c, v };
}

function fmtMoney(n) {
  return n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
}
function fmtTime(t) {
  return new Date(t).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false });
}
function fmtDateTime(t) {
  return new Date(t).toLocaleString("en-US", { month: "short", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
}

// ─── Price Chart ─────────────────────────────────────────────────────────────

function PriceChart({ candles, entry, stop, target, entryDraggable = false, onEntryChange, onStopChange, onTargetChange }) {
  const W = 900, H = 400, padL = 8, padR = 68, padT = 12, padB = 28;
  const svgRef = useRef(null);
  const [drag, setDrag] = useState(null);
  const panStart = useRef(null);
  const [viewSize, setViewSize] = useState(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    if (viewSize == null && candles.length > 0) setViewSize(candles.length);
  }, [candles.length, viewSize]);

  const effectiveViewSize = Math.min(viewSize ?? candles.length, candles.length) || 1;
  const maxOffset = Math.max(0, candles.length - effectiveViewSize);
  const clampedOffset = Math.min(Math.max(0, offset), maxOffset);

  const visibleCandles = useMemo(() => {
    const end = candles.length - clampedOffset;
    const start = Math.max(0, end - effectiveViewSize);
    return candles.slice(start, end);
  }, [candles, clampedOffset, effectiveViewSize]);

  const { minP, maxP, scaleY, scaleX, candleW, invertY } = useMemo(() => {
    const innerH = H - padT - padB;
    const innerW = W - padL - padR;
    if (visibleCandles.length === 0) return { minP: 0, maxP: 1, scaleY: () => 0, scaleX: () => 0, candleW: 4, invertY: () => 0 };
    let lo = Infinity, hi = -Infinity;
    for (const c of visibleCandles) { if (c.l < lo) lo = c.l; if (c.h > hi) hi = c.h; }
    if (entry != null) { lo = Math.min(lo, entry); hi = Math.max(hi, entry); }
    if (stop != null) { lo = Math.min(lo, stop); hi = Math.max(hi, stop); }
    if (target != null) { lo = Math.min(lo, target); hi = Math.max(hi, target); }
    const pad = (hi - lo) * 0.08 || 1;
    const minP = lo - pad, maxP = hi + pad;
    const cw = Math.max(2, (innerW / visibleCandles.length) - 1);
    return {
      minP, maxP,
      scaleY: (p) => padT + (1 - (p - minP) / (maxP - minP)) * innerH,
      scaleX: (i) => padL + (i + 0.5) * (innerW / visibleCandles.length),
      candleW: cw,
      invertY: (yViewbox) => maxP - ((yViewbox - padT) / innerH) * (maxP - minP),
    };
  }, [visibleCandles, entry, stop, target]);

  const clientYToPrice = useCallback((clientY) => {
    const svg = svgRef.current;
    if (!svg) return 0;
    const rect = svg.getBoundingClientRect();
    const yViewbox = ((clientY - rect.top) / rect.height) * H;
    return invertY(yViewbox);
  }, [invertY]);

  useEffect(() => {
    if (!drag) return;
    const onMove = (e) => {
      const cx = "touches" in e ? e.touches[0]?.clientX : e.clientX;
      const cy = "touches" in e ? e.touches[0]?.clientY : e.clientY;
      if (cy == null || cx == null) return;
      if (drag === "pan") {
        const svg = svgRef.current;
        if (!svg || !panStart.current) return;
        const rect = svg.getBoundingClientRect();
        const innerW = W - padL - padR;
        const pxPerCandle = (rect.width * (innerW / W)) / effectiveViewSize;
        const dx = cx - panStart.current.x;
        const candlesDelta = Math.round(dx / pxPerCandle);
        setOffset(Math.min(maxOffset, Math.max(0, panStart.current.offset + candlesDelta)));
        e.preventDefault();
        return;
      }
      const p = Math.max(0.01, clientYToPrice(cy));
      const rounded = Math.round(p * 100) / 100;
      if (drag === "entry") onEntryChange?.(rounded);
      if (drag === "stop") onStopChange?.(rounded);
      if (drag === "target") onTargetChange?.(rounded);
      e.preventDefault();
    };
    const onUp = () => { setDrag(null); panStart.current = null; };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove, { passive: false });
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [drag, clientYToPrice, onEntryChange, onStopChange, onTargetChange, effectiveViewSize, maxOffset]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const handler = (e) => {
      e.preventDefault();
      const factor = e.deltaY > 0 ? 1.15 : 1 / 1.15;
      setViewSize((prev) => {
        const cur = prev ?? candles.length;
        return Math.min(candles.length, Math.max(10, Math.round(cur * factor)));
      });
    };
    svg.addEventListener("wheel", handler, { passive: false });
    return () => svg.removeEventListener("wheel", handler);
  }, [candles.length]);

  const startPan = (e) => {
    const cx = "touches" in e ? e.touches[0]?.clientX : e.clientX;
    if (cx == null) return;
    panStart.current = { x: cx, offset: clampedOffset };
    setDrag("pan");
  };

  const ticks = Array.from({ length: 5 }, (_, i) => minP + (i / 4) * (maxP - minP));
  const last = visibleCandles[visibleCandles.length - 1];

  const renderMarker = (kind, price, color, label, textColor, canDrag) => {
    const y = scaleY(price);
    const startDrag = (e) => {
      if (!canDrag) return;
      e.preventDefault();
      e.stopPropagation();
      setDrag(kind);
    };
    return (
      <g key={kind} style={{ cursor: canDrag ? (drag === kind ? "grabbing" : "ns-resize") : "default" }}
        onMouseDown={startDrag} onTouchStart={startDrag}>
        <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="transparent" strokeWidth={canDrag ? 14 : 1}
          style={{ pointerEvents: canDrag ? "stroke" : "none" }} />
        <line x1={padL} x2={W - padR} y1={y} y2={y} stroke={color} strokeWidth={1.5} strokeDasharray="5 3" />
        <rect x={W - padR} y={y - 10} width={padR - 2} height={20} fill={color} rx={3} />
        <text x={W - padR + 5} y={y + 4} fontSize={10} fill={textColor}
          fontFamily="monospace" style={{ pointerEvents: "none", fontWeight: 600 }}>
          {label} {price.toFixed(2)}
        </text>
        {canDrag && (
          <g>
            <rect x={padL + 2} y={y - 7} width={14} height={14} fill={color} rx={2} />
            <line x1={padL + 5} x2={padL + 13} y1={y - 2} y2={y - 2} stroke={textColor} strokeWidth={1.5} />
            <line x1={padL + 5} x2={padL + 13} y1={y + 2} y2={y + 2} stroke={textColor} strokeWidth={1.5} />
          </g>
        )}
      </g>
    );
  };

  return (
    <div style={{ position: "relative", width: "100%", overflow: "hidden", borderRadius: 10,
      border: "1px solid rgba(255,255,255,0.08)", background: "#0d1117", userSelect: "none" }}>
      <div style={{ position: "absolute", right: 8, top: 8, zIndex: 10, display: "flex", gap: 4 }}>
        {[
          { label: "+", action: () => setViewSize(v => Math.max(10, Math.round((v ?? candles.length) / 1.3))) },
          { label: "−", action: () => setViewSize(v => Math.min(candles.length, Math.round((v ?? candles.length) * 1.3))) },
          { label: "⤢", action: () => { setViewSize(candles.length); setOffset(0); } },
        ].map(({ label, action }) => (
          <button key={label} onClick={action} style={{
            background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)",
            color: "#aaa", borderRadius: 5, padding: "2px 8px", fontSize: 12, cursor: "pointer"
          }}>{label}</button>
        ))}
      </div>
      <svg ref={svgRef} viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none" onMouseDown={startPan} onTouchStart={startPan}
        style={{ cursor: drag === "pan" ? "grabbing" : "grab", touchAction: "none", width: "100%", height: 380, display: "block" }}>
        <rect x={0} y={0} width={W} height={H} fill="transparent" />
        {ticks.map((p, i) => (
          <g key={i}>
            <line x1={padL} x2={W - padR} y1={scaleY(p)} y2={scaleY(p)} stroke="rgba(255,255,255,0.05)" strokeWidth={0.5} />
            <text x={W - padR + 6} y={scaleY(p) + 3} fontSize={10} fill="rgba(255,255,255,0.35)" fontFamily="monospace">
              {p.toFixed(2)}
            </text>
          </g>
        ))}
        {visibleCandles.length > 0 && [0, Math.floor(visibleCandles.length / 2), visibleCandles.length - 1].map((i) => (
          <text key={i} x={scaleX(i)} y={H - 8} fontSize={10} fill="rgba(255,255,255,0.3)" textAnchor="middle" fontFamily="monospace">
            {fmtTime(visibleCandles[i].t)}
          </text>
        ))}
        {visibleCandles.map((c, i) => {
          const up = c.c >= c.o;
          const color = up ? "#22c55e" : "#ef4444";
          const x = scaleX(i);
          return (
            <g key={c.t}>
              <line x1={x} x2={x} y1={scaleY(c.h)} y2={scaleY(c.l)} stroke={color} strokeWidth={1} />
              <rect x={x - candleW / 2} y={scaleY(Math.max(c.o, c.c))} width={candleW}
                height={Math.max(1, Math.abs(scaleY(c.o) - scaleY(c.c)))} fill={color} />
            </g>
          );
        })}
        {last && (
          <line x1={padL} x2={W - padR} y1={scaleY(last.c)} y2={scaleY(last.c)}
            stroke="rgba(255,255,255,0.25)" strokeWidth={0.5} strokeDasharray="2 2" />
        )}
        {entry != null && renderMarker("entry", entry, "#6366f1", "ENT", "#fff", entryDraggable && !!onEntryChange)}
        {stop != null && renderMarker("stop", stop, "#ef4444", "STP", "#fff", !!onStopChange)}
        {target != null && renderMarker("target", target, "#22c55e", "TGT", "#0a0a0a", !!onTargetChange)}
      </svg>
    </div>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const css = {
  root: {
    minHeight: "100vh",
    background: "#070b10",
    color: "#e2e8f0",
    fontFamily: "'Inter', system-ui, sans-serif",
    fontSize: 14,
  },
  header: {
    background: "rgba(255,255,255,0.03)",
    borderBottom: "1px solid rgba(255,255,255,0.07)",
    padding: "12px 20px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
  },
  logo: {
    display: "flex",
    alignItems: "center",
    gap: 10,
  },
  logoIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 18,
  },
  statRow: {
    display: "flex",
    alignItems: "center",
    gap: 20,
    flexWrap: "wrap",
  },
  stat: {
    textAlign: "right",
  },
  statLabel: {
    fontSize: 10,
    color: "rgba(255,255,255,0.35)",
    textTransform: "uppercase",
    letterSpacing: "0.07em",
    marginBottom: 1,
  },
  statVal: {
    fontFamily: "monospace",
    fontSize: 14,
    fontWeight: 600,
  },
  main: {
    maxWidth: 1440,
    margin: "0 auto",
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  card: {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.07)",
    borderRadius: 10,
    overflow: "hidden",
  },
  btn: (variant = "default") => ({
    padding: "6px 14px",
    borderRadius: 7,
    border: "1px solid rgba(255,255,255,0.12)",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    transition: "opacity .15s",
    ...(variant === "default" && { background: "rgba(255,255,255,0.07)", color: "#e2e8f0" }),
    ...(variant === "primary" && { background: "#22c55e", color: "#0a0a0a", border: "none" }),
    ...(variant === "danger" && { background: "#ef4444", color: "#fff", border: "none" }),
    ...(variant === "ghost" && { background: "transparent", color: "rgba(255,255,255,0.45)", border: "none" }),
  }),
  input: {
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: 7,
    color: "#e2e8f0",
    padding: "8px 10px",
    fontFamily: "monospace",
    fontSize: 13,
    width: "100%",
    boxSizing: "border-box",
    outline: "none",
  },
  tabList: {
    display: "flex",
    gap: 2,
    background: "rgba(0,0,0,0.3)",
    padding: 4,
    borderRadius: 8,
  },
  tab: (active) => ({
    padding: "6px 14px",
    borderRadius: 6,
    border: "none",
    cursor: "pointer",
    fontSize: 12,
    fontWeight: 500,
    transition: "all .15s",
    background: active ? "rgba(255,255,255,0.1)" : "transparent",
    color: active ? "#e2e8f0" : "rgba(255,255,255,0.4)",
  }),
  badge: (variant = "default") => ({
    fontSize: 10,
    fontWeight: 600,
    padding: "2px 7px",
    borderRadius: 4,
    ...(variant === "default" && { background: "rgba(99,102,241,0.2)", color: "#818cf8" }),
    ...(variant === "success" && { background: "rgba(34,197,94,0.15)", color: "#22c55e" }),
    ...(variant === "danger" && { background: "rgba(239,68,68,0.15)", color: "#ef4444" }),
    ...(variant === "muted" && { background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.5)" }),
  }),
  bull: "#22c55e",
  bear: "#ef4444",
};

// ─── Main Component ───────────────────────────────────────────────────────────

const STARTING_CASH = 100_000;
const HISTORY_BARS = 180;
const TICK_MS = 4000;

export default function PaperTradePlayground() {
  const [candlesBySym, setCandlesBySym] = useState({});
  useEffect(() => {
    if (Object.keys(candlesBySym).length) return;
    const start = Date.now();
    const out = {};
    for (const t of TICKERS) out[t.symbol] = generateHistory(t, HISTORY_BARS, start);
    setCandlesBySym(out);
  }, []);

  const [selected, setSelected] = useState(TICKERS[0].symbol);
  const [cash, setCash] = useState(STARTING_CASH);
  const [positions, setPositions] = useState([]);
  const [history, setHistory] = useState([]);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);

  // Order form
  const [orderMode, setOrderMode] = useState("shares");
  const [orderShares, setOrderShares] = useState("10");
  const [orderAmount, setOrderAmount] = useState("1000");
  const [stopInput, setStopInput] = useState("");
  const [targetInput, setTargetInput] = useState("");

  // Tabs
  const [activeTab, setActiveTab] = useState("positions");

  const positionsRef = useRef(positions);
  positionsRef.current = positions;

  // Simulation tick
  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      setCandlesBySym((prev) => {
        if (!prev[TICKERS[0].symbol]) return prev;
        const next = { ...prev };
        const t = (prev[TICKERS[0].symbol].at(-1)?.t ?? Date.now()) + 60_000;
        for (const tk of TICKERS) {
          const arr = prev[tk.symbol];
          const last = arr[arr.length - 1];
          const c = nextCandle(tk, last, t);
          next[tk.symbol] = arr.length >= 600 ? [...arr.slice(1), c] : [...arr, c];

          for (const p of positionsRef.current) {
            if (p.symbol !== tk.symbol) continue;
            let triggered = null;
            if (p.stop != null && c.l <= p.stop) triggered = { price: p.stop, reason: "stop" };
            if (p.target != null && c.h >= p.target) triggered = { price: p.target, reason: "target" };
            if (triggered) {
              const proceeds = triggered.price * p.shares;
              const pnl = (triggered.price - p.avgPrice) * p.shares;
              setCash((cs) => cs + proceeds);
              setPositions((ps) => ps.filter((x) => x.id !== p.id));
              setHistory((h) => [{
                id: crypto.randomUUID(), symbol: p.symbol, shares: p.shares,
                entry: p.avgPrice, exit: triggered.price, openedAt: p.openedAt,
                closedAt: c.t, pnl, reason: triggered.reason,
              }, ...h]);
            }
          }
        }
        return next;
      });
    }, Math.max(50, TICK_MS / speed));
    return () => clearInterval(id);
  }, [speed, paused]);

  const portfolioValue = useMemo(() => {
    let v = cash;
    for (const p of positions) {
      const arr = candlesBySym[p.symbol];
      if (!arr || arr.length === 0) continue;
      v += arr[arr.length - 1].c * p.shares;
    }
    return v;
  }, [cash, positions, candlesBySym]);

  const candles = candlesBySym[selected];
  const ticker = TICKERS.find((t) => t.symbol === selected);

  if (!candles || candles.length === 0) {
    return (
      <div style={{ ...css.root, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace", fontSize: 13 }}>
          Initializing market data…
        </div>
      </div>
    );
  }

  const last = candles[candles.length - 1];
  const prevClose = candles[candles.length - 2]?.c ?? last.o;
  const dayChange = ((last.c - prevClose) / prevClose) * 100;
  const myPos = positions.find((p) => p.symbol === selected) ?? null;
  const realized = history.reduce((s, t) => s + t.pnl, 0);
  const unrealized = portfolioValue - STARTING_CASH - realized;

  function handleBuy() {
    const price = last.c;
    let shares = orderMode === "shares"
      ? Math.floor(Number(orderShares) || 0)
      : Math.floor((Number(orderAmount) || 0) / price);
    if (shares <= 0) return;
    const cost = shares * price;
    if (cost > cash) return;
    const stop = stopInput ? Number(stopInput) : null;
    const target = targetInput ? Number(targetInput) : null;
    setCash((c) => c - cost);
    setPositions((ps) => {
      const existing = ps.find((p) => p.symbol === selected);
      if (existing) {
        const totalShares = existing.shares + shares;
        const avg = (existing.avgPrice * existing.shares + cost) / totalShares;
        return ps.map((p) => p.id === existing.id
          ? { ...p, shares: totalShares, avgPrice: avg, stop: stop ?? p.stop, target: target ?? p.target } : p);
      }
      return [...ps, { id: crypto.randomUUID(), symbol: selected, shares, avgPrice: price, stop, target, openedAt: last.t }];
    });
  }

  function handleSell(p) {
    const price = candlesBySym[p.symbol].at(-1).c;
    const proceeds = price * p.shares;
    const pnl = (price - p.avgPrice) * p.shares;
    setCash((c) => c + proceeds);
    setPositions((ps) => ps.filter((x) => x.id !== p.id));
    setHistory((h) => [{
      id: crypto.randomUUID(), symbol: p.symbol, shares: p.shares,
      entry: p.avgPrice, exit: price, openedAt: p.openedAt,
      closedAt: candlesBySym[p.symbol].at(-1).t, pnl, reason: "manual",
    }, ...h]);
  }

  function updatePosTargets(p, stop, target) {
    setPositions((ps) => ps.map((x) => (x.id === p.id ? { ...x, stop, target } : x)));
  }

  const totalPnl = portfolioValue - STARTING_CASH;

  return (
    <div style={css.root}>
      {/* Header */}
      <header style={css.header}>
        <div style={css.logo}>
          <div style={css.logoIcon} />
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, letterSpacing: "-0.02em" }}>Paper Trade</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.35)" }}>Simulated Markets · No Real Money</div>
          </div>
        </div>

        <div style={css.statRow}>
          {[
            { label: "Cash", value: fmtMoney(cash) },
            { label: "Equity", value: fmtMoney(portfolioValue) },
            { label: "Total P&L", value: fmtMoney(totalPnl), color: totalPnl >= 0 ? css.bull : css.bear },
            { label: "Realized", value: fmtMoney(realized), color: realized >= 0 ? css.bull : css.bear },
            { label: "Unrealized", value: fmtMoney(unrealized), color: unrealized >= 0 ? css.bull : css.bear },
          ].map(({ label, value, color }) => (
            <div key={label} style={css.stat}>
              <div style={css.statLabel}>{label}</div>
              <div style={{ ...css.statVal, color: color || "#e2e8f0" }}>{value}</div>
            </div>
          ))}

          <div style={{ display: "flex", gap: 6 }}>
            <button style={css.btn("default")} onClick={() => setPaused(p => !p)}>
              {paused ? "Play" : "Pause"}
            </button>
            <button style={css.btn("default")} onClick={() => setSpeed(s => s >= 8 ? 1 : s * 2)}>
              {speed}×
            </button>
            <button style={css.btn("ghost")} onClick={() => { setCash(STARTING_CASH); setPositions([]); setHistory([]); }}>
              Reset
            </button>
          </div>
        </div>
      </header>

      <div style={css.main}>
        {/* Ticker header */}
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontFamily: "monospace", fontSize: 22, fontWeight: 700 }}>{ticker.symbol}</span>
              <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 13 }}>{ticker.name}</span>
              <span style={css.badge("default")}>{ticker.sector}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, marginTop: 4, fontFamily: "monospace" }}>
              <span style={{ fontSize: 28, fontWeight: 700 }}>{last.c.toFixed(2)}</span>
              <span style={{ fontSize: 13, color: dayChange >= 0 ? css.bull : css.bear }}>
                {dayChange >= 0 ? "+" : ""}{(last.c - prevClose).toFixed(2)} ({dayChange >= 0 ? "+" : ""}{dayChange.toFixed(2)}%)
              </span>
              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{fmtDateTime(last.t)}</span>
            </div>
          </div>
          <div style={{ display: "flex", gap: 16, fontFamily: "monospace", fontSize: 12 }}>
            {[["Open", last.o], ["High", last.h], ["Low", last.l], ["Vol", (last.v / 1000).toFixed(1) + "k"]].map(([lbl, val]) => (
              <div key={lbl} style={{ textAlign: "right" }}>
                <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase" }}>{lbl}</div>
                <div style={{ fontWeight: 600 }}>{typeof val === "number" ? val.toFixed(2) : val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Main row: order ticket | chart+tip | watchlist */}
        <div style={{ display: "grid", gridTemplateColumns: "280px 1fr 200px", gap: 12, alignItems: "start" }}>

          {/* Order Ticket */}
          <div style={{ ...css.card, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
            <div>
              <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>
                Order Ticket
              </div>
              <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 17 }}>{ticker.symbol}</div>
              <div style={{ fontFamily: "monospace", fontSize: 24, fontWeight: 800, letterSpacing: "-0.02em" }}>
                {last.c.toFixed(2)}
              </div>
            </div>

            {/* Mode tabs */}
            <div style={css.tabList}>
              <button style={css.tab(orderMode === "shares")} onClick={() => setOrderMode("shares")}>Shares</button>
              <button style={css.tab(orderMode === "amount")} onClick={() => setOrderMode("amount")}>Amount $</button>
            </div>

            {orderMode === "shares" ? (
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4, display: "block" }}>Quantity</label>
                <input type="number" value={orderShares} onChange={(e) => setOrderShares(e.target.value)} style={css.input} />
              </div>
            ) : (
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4, display: "block" }}>Buy-in (USD)</label>
                <input type="number" value={orderAmount} onChange={(e) => setOrderAmount(e.target.value)} style={css.input} />
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
                  approx. {Math.floor((Number(orderAmount) || 0) / last.c)} shares
                </div>
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4, display: "block" }}>Stop Loss</label>
                <input type="number" placeholder={(last.c * 0.97).toFixed(2)}
                  value={stopInput} onChange={(e) => setStopInput(e.target.value)} style={css.input} />
              </div>
              <div>
                <label style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 4, display: "block" }}>Target</label>
                <input type="number" placeholder={(last.c * 1.05).toFixed(2)}
                  value={targetInput} onChange={(e) => setTargetInput(e.target.value)} style={css.input} />
              </div>
            </div>

            <div style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(255,255,255,0.35)", display: "flex", flexDirection: "column", gap: 4 }}>
              {[
                ["Est. cost", fmtMoney((orderMode === "shares" ? Math.floor(Number(orderShares) || 0) : Math.floor((Number(orderAmount) || 0) / last.c)) * last.c)],
                ["Buying power", fmtMoney(cash)],
              ].map(([lbl, val]) => (
                <div key={lbl} style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>{lbl}</span><span style={{ color: "#e2e8f0" }}>{val}</span>
                </div>
              ))}
            </div>

            <button style={{ ...css.btn("primary"), width: "100%", padding: "10px", fontSize: 14, fontWeight: 700 }} onClick={handleBuy}>
              Buy {ticker.symbol}
            </button>

            {myPos && (
              <button style={{ ...css.btn("danger"), width: "100%", padding: "10px", fontSize: 14, fontWeight: 700 }} onClick={() => handleSell(myPos)}>
                Close ({myPos.shares} sh)
              </button>
            )}

            <p style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", lineHeight: 1.6, margin: 0 }}>
              All tickers and prices are simulated. No real markets, no real money.
            </p>
          </div>

          {/* Chart + tip */}
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <PriceChart
              candles={candles.slice(-120)}
              entry={myPos ? myPos.avgPrice : last.c}
              stop={myPos ? myPos.stop : (stopInput ? Number(stopInput) : null)}
              target={myPos ? myPos.target : (targetInput ? Number(targetInput) : null)}
              entryDraggable={false}
              onStopChange={(p) => { if (myPos) updatePosTargets(myPos, p, myPos.target); else setStopInput(p.toFixed(2)); }}
              onTargetChange={(p) => { if (myPos) updatePosTargets(myPos, myPos.stop, p); else setTargetInput(p.toFixed(2)); }}
            />
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
              Tip: drag the <span style={{ color: css.bear }}>STP</span> and <span style={{ color: css.bull }}>TGT</span> handles on the chart to adjust your stop loss and target.
            </div>
          </div>

          {/* Watchlist */}
          <div style={css.card}>
            <div style={{ padding: "10px 12px 6px", fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", color: "rgba(255,255,255,0.35)", fontWeight: 600 }}>
              Watchlist
            </div>
            {TICKERS.map((t) => {
              const arr = candlesBySym[t.symbol];
              if (!arr) return null;
              const c = arr[arr.length - 1].c;
              const prev = arr[arr.length - 2]?.c ?? c;
              const ch = ((c - prev) / prev) * 100;
              const sel = t.symbol === selected;
              return (
                <button key={t.symbol} onClick={() => setSelected(t.symbol)} style={{
                  display: "flex", width: "100%", alignItems: "center", justifyContent: "space-between",
                  padding: "8px 12px", background: sel ? "rgba(99,102,241,0.1)" : "transparent",
                  border: "none", borderTop: "1px solid rgba(255,255,255,0.04)", cursor: "pointer",
                  color: "#e2e8f0", transition: "background .1s",
                }}>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontFamily: "monospace", fontWeight: 700, fontSize: 13 }}>{t.symbol}</div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", maxWidth: 100, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.name}
                    </div>
                  </div>
                  <div style={{ textAlign: "right", fontFamily: "monospace" }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{c.toFixed(2)}</div>
                    <div style={{ fontSize: 10, color: ch >= 0 ? css.bull : css.bear }}>
                      {ch >= 0 ? "+" : ""}{ch.toFixed(2)}%
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

        </div>

        {/* Bottom: positions / history */}
        <div>
          <div style={{ display: "flex", alignItems: "center", marginBottom: 8 }}>
            <div style={css.tabList}>
              <button style={css.tab(activeTab === "positions")} onClick={() => setActiveTab("positions")}>
                Positions ({positions.length})
              </button>
              <button style={css.tab(activeTab === "history")} onClick={() => setActiveTab("history")}>
                History ({history.length})
              </button>
            </div>
          </div>

          <div style={css.card}>
            {activeTab === "positions" && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "monospace" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                    {["Symbol", "Shares", "Avg", "Last", "P&L", "Stop", "Target", ""].map((h) => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: h === "Symbol" ? "left" : "right",
                        color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase",
                        letterSpacing: "0.07em", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {positions.length === 0 && (
                    <tr><td colSpan={8} style={{ padding: "24px 12px", textAlign: "center", color: "rgba(255,255,255,0.25)" }}>
                      No open positions.
                    </td></tr>
                  )}
                  {positions.map((p) => {
                    const lc = candlesBySym[p.symbol].at(-1).c;
                    const pnl = (lc - p.avgPrice) * p.shares;
                    return (
                      <tr key={p.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                        <td style={{ padding: "8px 12px", fontWeight: 700 }}>{p.symbol}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right" }}>{p.shares}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right" }}>{p.avgPrice.toFixed(2)}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right" }}>{lc.toFixed(2)}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", color: pnl >= 0 ? css.bull : css.bear, fontWeight: 600 }}>
                          {pnl >= 0 ? "+" : ""}{fmtMoney(pnl)}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "right" }}>
                          <input type="number" defaultValue={p.stop ?? ""}
                            style={{ ...css.input, width: 80, padding: "3px 6px", fontSize: 11 }}
                            onBlur={(e) => updatePosTargets(p, e.target.value ? Number(e.target.value) : null, p.target)} />
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "right" }}>
                          <input type="number" defaultValue={p.target ?? ""}
                            style={{ ...css.input, width: 80, padding: "3px 6px", fontSize: 11 }}
                            onBlur={(e) => updatePosTargets(p, p.stop, e.target.value ? Number(e.target.value) : null)} />
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "right" }}>
                          <button style={{ ...css.btn("danger"), padding: "4px 10px", fontSize: 11 }} onClick={() => handleSell(p)}>
                            Close
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}

            {activeTab === "history" && (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12, fontFamily: "monospace" }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.04)" }}>
                    {["Closed", "Symbol", "Shares", "Entry", "Exit", "P&L", "Reason"].map((h, idx) => (
                      <th key={h} style={{ padding: "8px 12px", textAlign: idx < 2 ? "left" : "right",
                        color: "rgba(255,255,255,0.35)", fontSize: 10, textTransform: "uppercase",
                        letterSpacing: "0.07em", fontWeight: 600 }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 && (
                    <tr><td colSpan={7} style={{ padding: "24px 12px", textAlign: "center", color: "rgba(255,255,255,0.25)" }}>
                      No closed trades yet.
                    </td></tr>
                  )}
                  {history.map((t) => (
                    <tr key={t.id} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "8px 12px" }}>{fmtTime(t.closedAt)}</td>
                      <td style={{ padding: "8px 12px", fontWeight: 700 }}>{t.symbol}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>{t.shares}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>{t.entry.toFixed(2)}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right" }}>{t.exit.toFixed(2)}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", color: t.pnl >= 0 ? css.bull : css.bear, fontWeight: 600 }}>
                        {t.pnl >= 0 ? "+" : ""}{fmtMoney(t.pnl)}
                      </td>
                      <td style={{ padding: "8px 12px" }}>
                        <span style={css.badge(t.reason === "target" ? "success" : t.reason === "stop" ? "danger" : "muted")}>
                          {t.reason}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}