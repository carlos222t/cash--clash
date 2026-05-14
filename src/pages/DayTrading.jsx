import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/api/supabaseClient';
import { TrendingUp, TrendingDown, RefreshCw, Clock, BarChart2, DollarSign, Activity, ChevronLeft, AlertTriangle, ShieldAlert, Target } from 'lucide-react';

const T = {
  bg: '#0A0A0A', card: '#111111', border: 'rgba(212,160,23,0.15)',
  gold: '#D4A017', goldDim: 'rgba(212,160,23,0.15)',
  text: '#F0EDE6', muted: 'rgba(240,237,230,0.45)',
  green: '#22c55e', greenDim: 'rgba(34,197,94,0.12)',
  red: '#ef4444', redDim: 'rgba(239,68,68,0.12)',
};

const fmt = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtPct = (n) => (n >= 0 ? '+' : '') + n.toFixed(2) + '%';

// Simulated stocks with live-ticking prices
const BASE_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc.',        price: 189.50, color: '#4f8ef7', volatility: 0.8 },
  { symbol: 'TSLA', name: 'Tesla Inc.',         price: 245.00, color: '#ef4444', volatility: 2.2 },
  { symbol: 'NVDA', name: 'NVIDIA Corp.',       price: 875.00, color: '#22c55e', volatility: 2.5 },
  { symbol: 'SPY',  name: 'S&P 500 ETF',        price: 512.00, color: '#a78bfa', volatility: 0.5 },
  { symbol: 'AMZN', name: 'Amazon.com Inc.',    price: 182.00, color: '#f97316', volatility: 1.2 },
  { symbol: 'META', name: 'Meta Platforms',     price: 512.00, color: '#3b82f6', volatility: 1.5 },
  { symbol: 'MSFT', name: 'Microsoft Corp.',    price: 415.00, color: '#06b6d4', volatility: 0.9 },
  { symbol: 'GME',  name: 'GameStop Corp.',     price: 22.50,  color: '#eab308', volatility: 5.0 },
  { symbol: 'BTC',  name: 'Bitcoin ETF',        price: 68000,  color: '#f59e0b', volatility: 3.5 },
  { symbol: 'COIN', name: 'Coinbase Global',    price: 225.00, color: '#8b5cf6', volatility: 3.0 },
];

function useStockPrices() {
  const [prices, setPrices] = useState(() =>
    Object.fromEntries(BASE_STOCKS.map(s => [s.symbol, {
      current: s.price, open: s.price, high: s.price, low: s.price,
      prev: s.price, change: 0, changePct: 0,
      history: Array.from({ length: 30 }, (_, i) => ({
        t: Date.now() - (30 - i) * 2000,
        v: s.price * (1 + (Math.random() - 0.5) * 0.02)
      })),
    }]))
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setPrices(prev => {
        const next = { ...prev };
        BASE_STOCKS.forEach(s => {
          const p = prev[s.symbol];
          const move = (Math.random() - 0.49) * s.volatility * 0.01 * p.current;
          const spike = Math.random() < 0.05 ? (Math.random() - 0.5) * s.volatility * 0.03 * p.current : 0;
          const newPrice = Math.max(0.01, p.current + move + spike);
          next[s.symbol] = {
            current: newPrice,
            open: p.open,
            high: Math.max(p.high, newPrice),
            low: Math.min(p.low, newPrice),
            prev: p.current,
            change: newPrice - p.open,
            changePct: ((newPrice - p.open) / p.open) * 100,
            history: [...p.history.slice(-59), { t: Date.now(), v: newPrice }],
          };
        });
        return next;
      });
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return prices;
}

function MiniChart({ history, color, up }) {
  const w = 80, h = 32;
  if (!history || history.length < 2) return null;
  const vals = history.map(h => h.v);
  const min = Math.min(...vals), max = Math.max(...vals);
  const range = max - min || 1;
  const pts = vals.map((v, i) =>
    `${(i / (vals.length - 1)) * w},${h - ((v - min) / range) * h}`
  ).join(' ');
  return (
    <svg width={w} height={h} style={{ display: 'block' }}>
      <polyline points={pts} fill="none" stroke={up ? T.green : T.red} strokeWidth={1.5} strokeLinejoin="round" />
    </svg>
  );
}

function CandleChart({ history }) {
  const w = 300, h = 120;
  if (!history || history.length < 2) return null;
  const vals = history.map(h => h.v);
  const min = Math.min(...vals) * 0.999;
  const max = Math.max(...vals) * 1.001;
  const range = max - min || 1;
  const toY = v => h - ((v - min) / range) * h;
  const barW = Math.max(2, (w / vals.length) - 1);

  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }}>
      {vals.map((v, i) => {
        const prev = vals[i - 1] ?? v;
        const up = v >= prev;
        const x = (i / vals.length) * w;
        const y1 = toY(Math.max(v, prev));
        const y2 = toY(Math.min(v, prev));
        return (
          <rect key={i} x={x} y={y1} width={barW} height={Math.max(1, y2 - y1)}
            fill={up ? T.green : T.red} opacity={0.85} rx={0.5} />
        );
      })}
    </svg>
  );
}

export default function DayTrading() {
  const prices = useStockPrices();
  const [account, setAccount] = useState(null);
  const [positions, setPositions] = useState([]);
  const [trades, setTrades] = useState([]);
  const [userId, setUserId] = useState(null);
  const [selected, setSelected] = useState(null);
  const [amount, setAmount] = useState(100);
  const [tab, setTab] = useState('market'); // market | positions | history
  const [confirm, setConfirm] = useState(null); // {action, stock, qty, price}
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [triggeredAlerts, setTriggeredAlerts] = useState([]); // [{symbol, type, price, triggeredAt}]

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return;
      setUserId(user.id);

      // Get or create account
      let { data: acc } = await supabase.from('day_trading_accounts').select('*').eq('user_id', user.id).maybeSingle();
      if (!acc) {
        const { data: newAcc } = await supabase.from('day_trading_accounts')
          .insert({ user_id: user.id, balance: 10000, starting_balance: 10000 })
          .select().single();
        acc = newAcc;
      } else {
        // Daily reset
        const today = new Date().toISOString().split('T')[0];
        if (acc.last_reset !== today) {
          const { data: reset } = await supabase.from('day_trading_accounts')
            .update({ balance: 10000, starting_balance: 10000, last_reset: today, total_trades: 0, wins: 0, losses: 0 })
            .eq('user_id', user.id).select().single();
          acc = reset;
          await supabase.from('day_trading_positions').delete().eq('user_id', user.id);
        }
      }
      setAccount(acc);

      // Load positions
      const { data: pos } = await supabase.from('day_trading_positions').select('*').eq('user_id', user.id);
      setPositions(pos || []);

      // Load today's trades
      const today = new Date().toISOString().split('T')[0];
      const { data: trds } = await supabase.from('day_trades').select('*')
        .eq('user_id', user.id).gte('traded_at', today).order('traded_at', { ascending: false });
      setTrades(trds || []);

      setLoading(false);
    });
  }, []);

  const executeTrade = async () => {
    if (!confirm || !userId || !account) return;
    const { action, stock, qty: q, price } = confirm;
    const total = price * q;
    setConfirm(null);

    if (action === 'buy') {
      if (total > account.balance) { showToast('Insufficient funds', 'error'); return; }
      const newBalance = account.balance - total;

      // Upsert position
      const existing = positions.find(p => p.symbol === stock.symbol);
      if (existing) {
        const newQty = existing.qty + q;
        const newAvg = (existing.avg_price * existing.qty + price * q) / newQty;
        await supabase.from('day_trading_positions').update({ qty: newQty, avg_price: newAvg }).eq('id', existing.id);
        setPositions(prev => prev.map(p => p.symbol === stock.symbol ? { ...p, qty: newQty, avg_price: newAvg } : p));
      } else {
        const { data: newPos } = await supabase.from('day_trading_positions')
          .insert({ user_id: userId, symbol: stock.symbol, name: stock.name, qty: q, avg_price: price, stop_loss: confirm.stopLoss || null, take_profit: confirm.takeProfit || null })
          .select().single();
        setPositions(prev => [...prev, newPos]);
      }

      // Log trade
      const { data: trade } = await supabase.from('day_trades')
        .insert({ user_id: userId, symbol: stock.symbol, name: stock.name, action: 'buy', qty: q, price, total })
        .select().single();
      setTrades(prev => [trade, ...prev]);

      // Update account
      await supabase.from('day_trading_accounts')
        .update({ balance: newBalance, total_trades: account.total_trades + 1 })
        .eq('user_id', userId);
      setAccount(prev => ({ ...prev, balance: newBalance, total_trades: prev.total_trades + 1 }));
      showToast(`Bought ${q} ${stock.symbol} @ ${fmt(price)}`);

    } else {
      const pos = positions.find(p => p.symbol === stock.symbol);
      if (!pos || pos.qty < q) { showToast('Not enough shares', 'error'); return; }
      const proceeds = price * q;
      const pnl = (price - pos.avg_price) * q;
      const newBalance = account.balance + proceeds;
      const win = pnl >= 0;

      if (pos.qty - q <= 0) {
        await supabase.from('day_trading_positions').delete().eq('id', pos.id);
        setPositions(prev => prev.filter(p => p.symbol !== stock.symbol));
      } else {
        await supabase.from('day_trading_positions').update({ qty: pos.qty - q }).eq('id', pos.id);
        setPositions(prev => prev.map(p => p.symbol === stock.symbol ? { ...p, qty: p.qty - q } : p));
      }

      const { data: trade } = await supabase.from('day_trades')
        .insert({ user_id: userId, symbol: stock.symbol, name: stock.name, action: 'sell', qty: q, price, total: proceeds, pnl })
        .select().single();
      setTrades(prev => [trade, ...prev]);

      await supabase.from('day_trading_accounts')
        .update({ balance: newBalance, total_trades: account.total_trades + 1, wins: account.wins + (win ? 1 : 0), losses: account.losses + (win ? 0 : 1) })
        .eq('user_id', userId);
      setAccount(prev => ({ ...prev, balance: newBalance, total_trades: prev.total_trades + 1, wins: prev.wins + (win ? 1 : 0), losses: prev.losses + (win ? 0 : 1) }));
      showToast(`Sold ${q} ${stock.symbol} @ ${fmt(price)} · PnL: ${fmt(pnl)}`, win ? 'success' : 'error');
    }
  };

  // Monitor stop loss and take profit triggers
  useEffect(() => {
    if (!positions.length) return;
    positions.forEach(pos => {
      const p = prices[pos.symbol];
      if (!p) return;
      const sl = parseFloat(pos.stop_loss);
      const tp = parseFloat(pos.take_profit);
      if (sl && p.current <= sl) {
        setTriggeredAlerts(prev => {
          if (prev.find(a => a.symbol === pos.symbol && a.type === 'stop_loss')) return prev;
          showToast(`🔴 STOP LOSS hit: ${pos.symbol} @ ${fmt(p.current)}`, 'error');
          return [...prev, { symbol: pos.symbol, type: 'stop_loss', price: p.current, triggeredAt: Date.now() }];
        });
      }
      if (tp && p.current >= tp) {
        setTriggeredAlerts(prev => {
          if (prev.find(a => a.symbol === pos.symbol && a.type === 'take_profit')) return prev;
          showToast(`🟢 TARGET HIT: ${pos.symbol} @ ${fmt(p.current)}`, 'success');
          return [...prev, { symbol: pos.symbol, type: 'take_profit', price: p.current, triggeredAt: Date.now() }];
        });
      }
    });
  }, [prices, positions]);

  const totalPnL = account ? account.balance - account.starting_balance : 0;
  const winRate = account && (account.wins + account.losses) > 0
    ? ((account.wins / (account.wins + account.losses)) * 100).toFixed(0) : 0;

  // Risk/reward prediction
  const calcRisk = (price, sl, tp, qty) => {
    const slNum = parseFloat(sl);
    const tpNum = parseFloat(tp);
    const shares = qty / price;
    const maxLoss   = slNum ? (price - slNum) * shares : null;
    const maxGain   = tpNum ? (tpNum - price) * shares : null;
    const rr        = maxLoss && maxGain ? (maxGain / Math.abs(maxLoss)) : null;
    const slPct     = slNum ? ((slNum - price) / price * 100) : null;
    const tpPct     = tpNum ? ((tpNum - price) / price * 100) : null;
    return { maxLoss, maxGain, rr, slPct, tpPct };
  };

  const selectedStock = selected ? BASE_STOCKS.find(s => s.symbol === selected) : null;
  const selectedPrice = selected ? prices[selected] : null;
  const selectedPos = selected ? positions.find(p => p.symbol === selected) : null;

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: T.muted, fontSize: 14 }}>
      Loading trading desk...
    </div>
  );

  return (
    <div style={{ background: T.bg, minHeight: '100vh', padding: '16px', fontFamily: 'ui-sans-serif, system-ui, sans-serif', maxWidth: 720, margin: '0 auto' }}>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: toast.type === 'error' ? '#1a0000' : '#001a0a', border: `1px solid ${toast.type === 'error' ? T.red : T.green}`, borderRadius: 12, padding: '10px 20px', color: toast.type === 'error' ? T.red : T.green, fontWeight: 600, fontSize: 13, whiteSpace: 'nowrap' }}>
          {toast.msg}
        </div>
      )}

      {/* Confirm dialog */}
      {confirm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: '#141414', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: 28, maxWidth: 320, width: '100%' }}>
            <p style={{ fontSize: 16, fontWeight: 700, color: T.text, margin: '0 0 6px' }}>
              {confirm.action === 'buy' ? 'Confirm Purchase' : 'Confirm Sale'}
            </p>
            <p style={{ fontSize: 13, color: T.muted, margin: '0 0 6px' }}>
              {confirm.action === 'buy' ? 'Buy' : 'Sell'} {fmt(confirm.amount || confirm.qty * confirm.price)} of {confirm.stock.symbol} ({(confirm.qty).toFixed(4)} shares)
            </p>
            <p style={{ fontSize: 20, fontWeight: 800, color: confirm.action === 'buy' ? T.red : T.green, margin: '0 0 24px' }}>
              {confirm.action === 'buy' ? '-' : '+'}{fmt(confirm.price * confirm.qty)}
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setConfirm(null)} style={{ flex: 1, padding: 10, borderRadius: 10, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: T.muted, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
              <button onClick={executeTrade} style={{ flex: 2, padding: 10, borderRadius: 10, border: 'none', background: confirm.action === 'buy' ? '#15803d' : '#b91c1c', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                {confirm.action === 'buy' ? 'Buy' : 'Sell'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <Activity size={18} style={{ color: T.gold }} />
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.text }}>Day Trading</h1>
          <span style={{ fontSize: 10, background: T.goldDim, color: T.gold, border: `1px solid ${T.border}`, borderRadius: 99, padding: '2px 8px', fontWeight: 700, letterSpacing: '0.05em' }}>PAPER</span>
        </div>
        <p style={{ margin: 0, fontSize: 12, color: T.muted }}>Simulated trading · Resets daily · No real money</p>
      </div>

      {/* Account stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 20 }}>
        {[
          { label: 'Balance', value: fmt(account?.balance || 0), sub: 'Available cash', icon: <DollarSign size={14} /> },
          { label: "Today's P&L", value: fmt(totalPnL), sub: fmtPct((totalPnL / 10000) * 100), color: totalPnL >= 0 ? T.green : T.red, icon: totalPnL >= 0 ? <TrendingUp size={14}/> : <TrendingDown size={14}/> },
          { label: 'Trades Today', value: account?.total_trades || 0, sub: `${account?.wins || 0}W / ${account?.losses || 0}L`, icon: <BarChart2 size={14} /> },
          { label: 'Win Rate', value: winRate + '%', sub: 'Closed positions', icon: <Activity size={14} /> },
        ].map((s, i) => (
          <div key={i} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: s.color || T.gold, marginBottom: 6 }}>
              {s.icon}
              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
            </div>
            <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: s.color || T.text }}>{s.value}</p>
            <p style={{ margin: 0, fontSize: 11, color: T.muted }}>{s.sub}</p>
          </div>
        ))}
      </div>

      {/* Stock detail view */}
      {selected && selectedPrice && (
        <div style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 16, padding: 20, marginBottom: 20 }}>
          <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, marginBottom: 16, padding: 0 }}>
            <ChevronLeft size={14} /> Back to market
          </button>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
            <div>
              <p style={{ margin: 0, fontSize: 20, fontWeight: 800, color: T.text }}>{selected}</p>
              <p style={{ margin: 0, fontSize: 12, color: T.muted }}>{selectedStock.name}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 800, color: T.text }}>{fmt(selectedPrice.current)}</p>
              <span style={{ fontSize: 12, fontWeight: 700, color: selectedPrice.changePct >= 0 ? T.green : T.red }}>
                {fmtPct(selectedPrice.changePct)}
              </span>
            </div>
          </div>

          {/* Candle chart */}
          <div style={{ background: '#0d0d0d', borderRadius: 10, padding: '12px 8px', marginBottom: 16 }}>
            <CandleChart history={selectedPrice.history} />
          </div>

          {/* OHLC */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
            {[['Open', selectedPrice.open], ['High', selectedPrice.high], ['Low', selectedPrice.low]].map(([l, v]) => (
              <div key={l} style={{ background: '#0d0d0d', borderRadius: 8, padding: '8px 10px' }}>
                <p style={{ margin: 0, fontSize: 10, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{l}</p>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}>{fmt(v)}</p>
              </div>
            ))}
          </div>

          {/* Position info */}
          {selectedPos && (
            <div style={{ background: T.goldDim, border: `1px solid ${T.border}`, borderRadius: 10, padding: '10px 14px', marginBottom: 16 }}>
              <p style={{ margin: 0, fontSize: 11, color: T.gold, fontWeight: 700, marginBottom: 4 }}>YOUR POSITION</p>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, color: T.text }}>{selectedPos.qty} shares @ {fmt(selectedPos.avg_price)}</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: selectedPrice.current >= selectedPos.avg_price ? T.green : T.red }}>
                  {fmt((selectedPrice.current - selectedPos.avg_price) * selectedPos.qty)}
                </span>
              </div>
            </div>
          )}

          {/* Trade controls */}
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 11, color: T.muted, display: 'block', marginBottom: 4 }}>AMOUNT (USD)</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {[50, 100, 500].map(v => (
                  <button key={v} onClick={() => setAmount(v)} style={{ padding: '5px 10px', borderRadius: 8, border: `1px solid ${amount === v ? T.gold : T.border}`, background: amount === v ? T.goldDim : 'transparent', color: amount === v ? T.gold : T.muted, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>${v}</button>
                ))}
              </div>
              <input type="number" min={1} value={amount} onChange={e => setAmount(Math.max(1, parseFloat(e.target.value) || 1))}
                style={{ marginTop: 8, width: '100%', background: '#0d0d0d', border: `1px solid ${T.border}`, borderRadius: 8, color: T.text, fontSize: 16, fontWeight: 700, padding: '8px 12px', boxSizing: 'border-box' }} />
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ margin: 0, fontSize: 11, color: T.muted }}>Shares</p>
              <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: T.text }}>{(amount / selectedPrice.current).toFixed(4)}</p>
            </div>
          </div>

          {/* Stop Loss & Take Profit */}
          <div style={{ background: '#0d0d0d', borderRadius: 12, padding: '14px', marginBottom: 14 }}>
            <p style={{ margin: '0 0 10px', fontSize: 11, fontWeight: 700, color: T.gold, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Risk Management</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={{ fontSize: 10, color: T.red, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>🔴 Stop Loss ($)</label>
                <input type="number" placeholder={`e.g. ${(selectedPrice.current * 0.97).toFixed(2)}`}
                  value={stopLoss} onChange={e => setStopLoss(e.target.value)}
                  style={{ width: '100%', background: stopLoss && parseFloat(stopLoss) >= selectedPrice.current ? 'rgba(239,68,68,0.08)' : '#111', border: `1px solid ${stopLoss ? 'rgba(239,68,68,0.4)' : T.border}`, borderRadius: 8, color: T.text, fontSize: 13, fontWeight: 700, padding: '8px 10px', boxSizing: 'border-box' }} />
                {stopLoss && <p style={{ margin: '3px 0 0', fontSize: 10, color: T.red }}>{((parseFloat(stopLoss) - selectedPrice.current) / selectedPrice.current * 100).toFixed(2)}% from current</p>}
              </div>
              <div>
                <label style={{ fontSize: 10, color: T.green, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>🟢 Take Profit ($)</label>
                <input type="number" placeholder={`e.g. ${(selectedPrice.current * 1.05).toFixed(2)}`}
                  value={takeProfit} onChange={e => setTakeProfit(e.target.value)}
                  style={{ width: '100%', background: takeProfit && parseFloat(takeProfit) <= selectedPrice.current ? 'rgba(239,68,68,0.08)' : '#111', border: `1px solid ${takeProfit ? 'rgba(34,197,94,0.4)' : T.border}`, borderRadius: 8, color: T.text, fontSize: 13, fontWeight: 700, padding: '8px 10px', boxSizing: 'border-box' }} />
                {takeProfit && <p style={{ margin: '3px 0 0', fontSize: 10, color: T.green }}>{((parseFloat(takeProfit) - selectedPrice.current) / selectedPrice.current * 100).toFixed(2)}% from current</p>}
              </div>
            </div>

            {/* Risk/Reward Preview */}
            {(() => {
              const risk = calcRisk(selectedPrice.current, stopLoss, takeProfit, amount);
              const hasAny = risk.maxLoss !== null || risk.maxGain !== null;
              if (!hasAny) return (
                <p style={{ margin: 0, fontSize: 11, color: T.muted, textAlign: 'center' }}>Enter stop loss or take profit to see prediction</p>
              );
              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                    {risk.maxLoss !== null && (
                      <div style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: 9, color: T.red, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Max Loss</p>
                        <p style={{ margin: '3px 0 0', fontSize: 14, fontWeight: 800, color: T.red }}>-{fmt(Math.abs(risk.maxLoss))}</p>
                      </div>
                    )}
                    {risk.maxGain !== null && (
                      <div style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: 9, color: T.green, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Max Gain</p>
                        <p style={{ margin: '3px 0 0', fontSize: 14, fontWeight: 800, color: T.green }}>+{fmt(risk.maxGain)}</p>
                      </div>
                    )}
                    {risk.rr !== null && (
                      <div style={{ background: 'rgba(212,160,23,0.08)', border: '1px solid rgba(212,160,23,0.2)', borderRadius: 8, padding: '8px 10px', textAlign: 'center' }}>
                        <p style={{ margin: 0, fontSize: 9, color: T.gold, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase' }}>R:R Ratio</p>
                        <p style={{ margin: '3px 0 0', fontSize: 14, fontWeight: 800, color: risk.rr >= 2 ? T.green : risk.rr >= 1 ? T.gold : T.red }}>{risk.rr.toFixed(2)}x</p>
                      </div>
                    )}
                  </div>
                  {/* Visual bar */}
                  {risk.maxLoss !== null && risk.maxGain !== null && (() => {
                    const total = Math.abs(risk.maxLoss) + risk.maxGain;
                    const lossPct = (Math.abs(risk.maxLoss) / total) * 100;
                    const gainPct = (risk.maxGain / total) * 100;
                    return (
                      <div>
                        <div style={{ display: 'flex', height: 6, borderRadius: 99, overflow: 'hidden', gap: 2 }}>
                          <div style={{ width: lossPct + '%', background: T.red, borderRadius: '99px 0 0 99px' }} />
                          <div style={{ width: gainPct + '%', background: T.green, borderRadius: '0 99px 99px 0' }} />
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
                          <span style={{ fontSize: 9, color: T.red }}>Risk {lossPct.toFixed(0)}%</span>
                          <span style={{ fontSize: 9, color: T.green }}>Reward {gainPct.toFixed(0)}%</span>
                        </div>
                      </div>
                    );
                  })()}
                  {risk.rr !== null && risk.rr < 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 8, padding: '7px 10px' }}>
                      <AlertTriangle size={12} color={T.red} />
                      <span style={{ fontSize: 11, color: T.red }}>Poor risk/reward — you risk more than you stand to gain</span>
                    </div>
                  )}
                  {risk.rr !== null && risk.rr >= 2 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 8, padding: '7px 10px' }}>
                      <Target size={12} color={T.green} />
                      <span style={{ fontSize: 11, color: T.green }}>Good setup — reward is {risk.rr.toFixed(1)}x your risk</span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <button
              disabled={amount > account?.balance}
              onClick={() => setConfirm({ action: 'buy', stock: selectedStock, qty: amount / selectedPrice.current, price: selectedPrice.current, amount, stopLoss, takeProfit })}
              style={{ flex: 1, padding: '13px', borderRadius: 12, border: 'none', background: amount > account?.balance ? 'rgba(34,197,94,0.05)' : '#15803d', color: amount > account?.balance ? T.muted : '#fff', fontWeight: 700, fontSize: 14, cursor: amount > account?.balance ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
              Buy
            </button>
            <button
              disabled={!selectedPos || amount > selectedPos.qty * selectedPrice.current}
              onClick={() => setConfirm({ action: 'sell', stock: selectedStock, qty: Math.min(amount / selectedPrice.current, selectedPos?.qty || 0), price: selectedPrice.current, amount })}
              style={{ flex: 1, padding: '13px', borderRadius: 12, border: 'none', background: !selectedPos || amount > selectedPos.qty * selectedPrice.current ? 'rgba(239,68,68,0.05)' : '#b91c1c', color: !selectedPos || amount > selectedPos.qty * selectedPrice.current ? T.muted : '#fff', fontWeight: 700, fontSize: 14, cursor: !selectedPos || amount > selectedPos.qty * selectedPrice.current ? 'not-allowed' : 'pointer', transition: 'all 0.15s' }}>
              Sell
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, marginBottom: 16 }}>
        {[['market', 'Market'], ['positions', 'Positions'], ['history', 'History']].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{ padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: tab === key ? T.gold : T.muted, borderBottom: tab === key ? `2px solid ${T.gold}` : '2px solid transparent', marginBottom: -1, transition: 'all 0.15s' }}>
            {label} {key === 'positions' && positions.length > 0 && `(${positions.length})`}
          </button>
        ))}
      </div>

      {/* Market tab */}
      {tab === 'market' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {BASE_STOCKS.map(stock => {
            const p = prices[stock.symbol];
            const up = p.changePct >= 0;
            return (
              <button key={stock.symbol} onClick={() => { setSelected(stock.symbol); setAmount(100); }}
                style={{ display: 'flex', alignItems: 'center', gap: 14, background: T.card, border: `1px solid ${selected === stock.symbol ? T.gold : T.border}`, borderRadius: 14, padding: '14px 16px', cursor: 'pointer', textAlign: 'left', transition: 'border 0.15s', width: '100%' }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: stock.color + '22', border: '1px solid ' + stock.color + '44', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: 11, fontWeight: 800, color: stock.color }}>{stock.symbol.slice(0, 2)}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: T.text }}>{stock.symbol}</p>
                  <p style={{ margin: 0, fontSize: 11, color: T.muted }}>{stock.name}</p>
                </div>
                <MiniChart history={p.history} up={up} />
                <div style={{ textAlign: 'right', minWidth: 80 }}>
                  <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.text }}>{fmt(p.current)}</p>
                  <span style={{ fontSize: 12, fontWeight: 700, color: up ? T.green : T.red }}>{fmtPct(p.changePct)}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Positions tab */}
      {tab === 'positions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {positions.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: T.muted, fontSize: 13 }}>
              No open positions. Buy stocks from the Market tab.
            </div>
          )}
          {triggeredAlerts.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              {triggeredAlerts.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, background: a.type === 'stop_loss' ? 'rgba(239,68,68,0.08)' : 'rgba(34,197,94,0.08)', border: `1px solid ${a.type === 'stop_loss' ? 'rgba(239,68,68,0.3)' : 'rgba(34,197,94,0.3)'}`, borderRadius: 10, padding: '10px 14px', marginBottom: 8 }}>
                  {a.type === 'stop_loss' ? <ShieldAlert size={14} color={T.red} /> : <Target size={14} color={T.green} />}
                  <div style={{ flex: 1 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: a.type === 'stop_loss' ? T.red : T.green }}>
                      {a.type === 'stop_loss' ? '🔴 Stop Loss Triggered' : '🟢 Take Profit Hit'} — {a.symbol}
                    </p>
                    <p style={{ margin: 0, fontSize: 11, color: T.muted }}>Triggered @ {fmt(a.price)} · Consider closing your position</p>
                  </div>
                  <button onClick={() => setTriggeredAlerts(prev => prev.filter((_,j) => j !== i))} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 16 }}>×</button>
                </div>
              ))}
            </div>
          )}
          {positions.map(pos => {
            const p = prices[pos.symbol];
            const pnl = p ? (p.current - pos.avg_price) * pos.qty : 0;
            const pnlPct = p ? ((p.current - pos.avg_price) / pos.avg_price) * 100 : 0;
            const up = pnl >= 0;
            return (
              <div key={pos.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: T.text }}>{pos.symbol}</p>
                    <p style={{ margin: 0, fontSize: 11, color: T.muted }}>{pos.qty} shares · avg {fmt(pos.avg_price)}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, fontSize: 15, fontWeight: 800, color: up ? T.green : T.red }}>{up ? '+' : ''}{fmt(pnl)}</p>
                    <span style={{ fontSize: 12, fontWeight: 700, color: up ? T.green : T.red }}>{fmtPct(pnlPct)}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10 }}>
                  <span style={{ fontSize: 12, color: T.muted }}>Current: {p ? fmt(p.current) : '—'}</span>
                  <span style={{ fontSize: 12, color: T.muted }}>Value: {p ? fmt(p.current * pos.qty) : '—'}</span>
                </div>
                {(pos.stop_loss || pos.take_profit) && (
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    {pos.stop_loss && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: T.red, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: '3px 8px' }}>
                        🔴 SL {fmt(pos.stop_loss)}
                      </span>
                    )}
                    {pos.take_profit && (
                      <span style={{ fontSize: 10, fontWeight: 700, color: T.green, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 6, padding: '3px 8px' }}>
                        🟢 TP {fmt(pos.take_profit)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* History tab */}
      {tab === 'history' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {trades.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 20px', color: T.muted, fontSize: 13 }}>
              No trades today yet.
            </div>
          )}
          {trades.map(tr => (
            <div key={tr.id} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 12, padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: tr.action === 'buy' ? T.greenDim : T.redDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {tr.action === 'buy' ? <TrendingUp size={14} color={T.green} /> : <TrendingDown size={14} color={T.red} />}
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}>{tr.action.toUpperCase()} {tr.symbol}</p>
                  <p style={{ margin: 0, fontSize: 11, color: T.muted }}>{tr.qty} shares · {fmt(tr.price)}</p>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: tr.action === 'buy' ? T.red : T.green }}>
                  {tr.action === 'buy' ? '-' : '+'}{fmt(tr.total)}
                </p>
                {tr.pnl !== 0 && (
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 700, color: tr.pnl >= 0 ? T.green : T.red }}>
                    P&L: {tr.pnl >= 0 ? '+' : ''}{fmt(tr.pnl)}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Daily reset warning */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 24, padding: '10px 14px', background: 'rgba(212,160,23,0.06)', border: `1px solid ${T.border}`, borderRadius: 10 }}>
        <Clock size={13} style={{ color: T.gold, flexShrink: 0 }} />
        <p style={{ margin: 0, fontSize: 11, color: T.muted }}>Account resets daily at midnight. This is paper trading — no real money involved.</p>
      </div>
    </div>
  );
}
