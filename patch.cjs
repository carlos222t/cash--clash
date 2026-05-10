const fs = require('fs');
const path = 'src/pages/CryptoPackOpener.jsx';
let src = fs.readFileSync(path, 'utf8');

// ─── 1. NEW CSS ANIMATIONS ───────────────────────────────────
const newCSS = `
  @keyframes cpo-pack-rip-shake {
    0%   { transform: rotate(0deg) scale(1); }
    15%  { transform: rotate(-4deg) scale(1.03) translateY(-6px); }
    30%  { transform: rotate(4deg) scale(1.05) translateY(-10px); }
    45%  { transform: rotate(-3deg) scale(1.04) translateY(-7px); }
    60%  { transform: rotate(5deg) scale(1.06) translateY(-12px); }
    75%  { transform: rotate(-2deg) scale(1.03) translateY(-5px); }
    100% { transform: rotate(0deg) scale(1); }
  }
  @keyframes cpo-pack-rip-top {
    0%   { transform: translateY(0) rotate(0deg) scaleX(1); opacity: 1; }
    100% { transform: translateY(-130vh) rotate(-18deg) scaleX(0.9); opacity: 0; }
  }
  @keyframes cpo-pack-rip-bottom {
    0%   { transform: translateY(0) rotate(0deg) scaleX(1); opacity: 1; }
    100% { transform: translateY(130vh) rotate(10deg) scaleX(0.9); opacity: 0; }
  }
  @keyframes cpo-card-shoot-up {
    0%   { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
    30%  { opacity: 1; }
    100% { transform: translateY(-140vh) scale(0.8) rotate(-5deg); opacity: 0; }
  }
  @keyframes cpo-rip-flash {
    0%   { opacity: 0; }
    8%   { opacity: 0.55; }
    100% { opacity: 0; }
  }
`;
src = src.replace('let cssInjected = false;', newCSS + '\nlet cssInjected = false;');

// ─── 2. NEW PackButton ───────────────────────────────────────
const oldPackButtonStart = `function PackButton({ onClick, disabled, shaking, bursting }) {`;
const oldPackButtonEnd = `}

function RevealOverlay`;

const oldPackFull = src.slice(src.indexOf(oldPackButtonStart), src.indexOf(oldPackButtonEnd) + 1);

const newPackButton = `function PackButton({ onClick, disabled, shaking, ripping, ripPhase }) {
  const isRipTop = ripping && ripPhase === 'top';
  const isRipBottom = ripping && ripPhase === 'bottom';
  const isCardShoot = ripping && ripPhase === 'card-shoot';

  return (
    <div
      onClick={onClick}
      style={{
        position: 'relative', width: 220, height: 308,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        filter: (!disabled && !shaking && !ripping) ? 'drop-shadow(0 0 22px rgba(184,151,58,0.5))' : 'none',
        transition: 'filter 0.3s',
        animation: shaking ? 'cpo-pack-rip-shake 0.45s ease-in-out infinite' : 'none',
      }}
    >
      {/* Flash on rip */}
      {ripping && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9998, pointerEvents: 'none',
          background: 'rgba(255,240,180,0.45)',
          animation: 'cpo-rip-flash 0.4s ease-out both',
        }} />
      )}

      {/* TOP HALF of pack */}
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '100%', height: '50%',
        overflow: 'hidden',
        animation: isRipTop ? 'cpo-pack-rip-top 0.42s cubic-bezier(0.4,0,0.2,1) forwards' : 'none',
        transformOrigin: 'center bottom',
      }}>
        <svg width="220" height="308" viewBox="0 0 220 308" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="packBodyT" x1="0" y1="0" x2="220" y2="308" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#d4b96a" />
              <stop offset="30%" stopColor="#c9a84c" />
              <stop offset="55%" stopColor="#e8d080" />
              <stop offset="75%" stopColor="#b8922e" />
              <stop offset="100%" stopColor="#9a7820" />
            </linearGradient>
            <linearGradient id="packSheenT" x1="60" y1="40" x2="160" y2="260" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(255,255,220,0)" />
              <stop offset="45%" stopColor="rgba(255,255,200,0.28)" />
              <stop offset="65%" stopColor="rgba(255,255,180,0.4)" />
              <stop offset="100%" stopColor="rgba(255,255,220,0)" />
            </linearGradient>
            <linearGradient id="topSealG" x1="0" y1="0" x2="220" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7a5e18" />
              <stop offset="25%" stopColor="#c9a84c" />
              <stop offset="50%" stopColor="#e8d080" />
              <stop offset="75%" stopColor="#c9a84c" />
              <stop offset="100%" stopColor="#7a5e18" />
            </linearGradient>
          </defs>
          {/* Body */}
          <path d="M16 36 Q18 26 28 24 L192 24 Q202 26 204 36 L212 272 Q212 284 200 284 L20 284 Q8 284 8 272 Z" fill="url(#packBodyT)" />
          {/* Grid lines */}
          <g opacity="0.07" clipPath="url(#clipTop)">
            <line x1="8" y1="50" x2="212" y2="50" stroke="#3a2800" strokeWidth="0.8"/>
            <line x1="8" y1="72" x2="212" y2="72" stroke="#3a2800" strokeWidth="0.8"/>
            <line x1="8" y1="94" x2="212" y2="94" stroke="#3a2800" strokeWidth="0.8"/>
            <line x1="8" y1="116" x2="212" y2="116" stroke="#3a2800" strokeWidth="0.8"/>
            <line x1="8" y1="138" x2="212" y2="138" stroke="#3a2800" strokeWidth="0.8"/>
            <line x1="36" y1="24" x2="36" y2="284" stroke="#3a2800" strokeWidth="0.8"/>
            <line x1="64" y1="24" x2="64" y2="284" stroke="#3a2800" strokeWidth="0.8"/>
            <line x1="92" y1="24" x2="92" y2="284" stroke="#3a2800" strokeWidth="0.8"/>
            <line x1="120" y1="24" x2="120" y2="284" stroke="#3a2800" strokeWidth="0.8"/>
            <line x1="148" y1="24" x2="148" y2="284" stroke="#3a2800" strokeWidth="0.8"/>
            <line x1="176" y1="24" x2="176" y2="284" stroke="#3a2800" strokeWidth="0.8"/>
          </g>
          {/* Sheen */}
          <path d="M16 36 Q18 26 28 24 L192 24 Q202 26 204 36 L212 272 Q212 284 200 284 L20 284 Q8 284 8 272 Z" fill="url(#packSheenT)" />
          {/* Edge shadows */}
          <path d="M16 36 Q18 26 28 24 L28 284 L20 284 Q8 284 8 272 Z" fill="rgba(0,0,0,0.15)" />
          <path d="M192 24 Q202 26 204 36 L212 272 Q212 284 200 284 L192 284 Z" fill="rgba(0,0,0,0.15)" />
          {/* Top zigzag seal */}
          <path d="M8 24 L12 14 L16 24 L20 14 L24 24 L28 14 L32 24 L36 14 L40 24 L44 14 L48 24 L52 14 L56 24 L60 14 L64 24 L68 14 L72 24 L76 14 L80 24 L84 14 L88 24 L92 14 L96 24 L100 14 L104 24 L108 14 L112 24 L116 14 L120 24 L124 14 L128 24 L132 14 L136 24 L140 14 L144 24 L148 14 L152 24 L156 14 L160 24 L164 14 L168 24 L172 14 L176 24 L180 14 L184 24 L188 14 L192 24 L196 14 L200 24 L204 24 L212 24 L212 36 Q202 26 192 24 L28 24 Q18 26 8 36 Z" fill="url(#topSealG)" />
          {/* Logo circle */}
          <circle cx="110" cy="154" r="48" fill="none" stroke="rgba(255,255,220,0.88)" strokeWidth="3.5" />
          <circle cx="110" cy="154" r="41" fill="none" stroke="rgba(255,255,180,0.2)" strokeWidth="1" />
          <text x="110" y="169" textAnchor="middle" fontFamily="Georgia, serif" fontSize="40" fontWeight="700" fill="rgba(255,255,220,0.9)" letterSpacing="-2">CC</text>
          {/* Labels */}
          <text x="110" y="56" textAnchor="middle" fontFamily="Georgia, serif" fontSize="8" fill="rgba(50,25,0,0.65)" letterSpacing="3" fontWeight="700">SERIES I</text>
          <text x="110" y="238" textAnchor="middle" fontFamily="Georgia, serif" fontSize="8" fontStyle="italic" fill="rgba(255,240,180,0.65)" letterSpacing="2">BULL MARKET EDITION</text>
          {/* Bottom zigzag seal */}
          <path d="M8 284 L12 294 L16 284 L20 294 L24 284 L28 294 L32 284 L36 294 L40 284 L44 294 L48 284 L52 294 L56 284 L60 294 L64 284 L68 294 L72 284 L76 294 L80 284 L84 294 L88 284 L92 294 L96 284 L100 294 L104 284 L108 294 L112 284 L116 294 L120 284 L124 294 L128 284 L132 294 L136 284 L140 294 L144 284 L148 294 L152 284 L156 294 L160 284 L164 294 L168 284 L172 294 L176 284 L180 294 L184 284 L188 294 L192 284 L196 294 L200 284 L204 284 L212 284 L212 272 Q212 284 200 284 L20 284 Q8 284 8 272 Z" fill="url(#topSealG)" />
          {/* Notch */}
          <path d="M204 50 L212 46 L212 54 Z" fill="rgba(50,25,0,0.45)" />
        </svg>
      </div>

      {/* BOTTOM HALF of pack */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, width: '100%', height: '50%',
        overflow: 'hidden',
        animation: isRipBottom ? 'cpo-pack-rip-bottom 0.42s cubic-bezier(0.4,0,0.2,1) forwards' : 'none',
        transformOrigin: 'center top',
      }}>
        <svg width="220" height="308" viewBox="0 0 220 308" fill="none" xmlns="http://www.w3.org/2000/svg"
          style={{ position: 'absolute', bottom: 0 }}>
          <defs>
            <linearGradient id="packBodyB" x1="0" y1="0" x2="220" y2="308" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#d4b96a" />
              <stop offset="30%" stopColor="#c9a84c" />
              <stop offset="55%" stopColor="#e8d080" />
              <stop offset="75%" stopColor="#b8922e" />
              <stop offset="100%" stopColor="#9a7820" />
            </linearGradient>
            <linearGradient id="packSheenB" x1="60" y1="40" x2="160" y2="260" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgba(255,255,220,0)" />
              <stop offset="45%" stopColor="rgba(255,255,200,0.28)" />
              <stop offset="65%" stopColor="rgba(255,255,180,0.4)" />
              <stop offset="100%" stopColor="rgba(255,255,220,0)" />
            </linearGradient>
            <linearGradient id="botSealG" x1="0" y1="0" x2="220" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#7a5e18" />
              <stop offset="25%" stopColor="#c9a84c" />
              <stop offset="50%" stopColor="#e8d080" />
              <stop offset="75%" stopColor="#c9a84c" />
              <stop offset="100%" stopColor="#7a5e18" />
            </linearGradient>
          </defs>
          <path d="M16 36 Q18 26 28 24 L192 24 Q202 26 204 36 L212 272 Q212 284 200 284 L20 284 Q8 284 8 272 Z" fill="url(#packBodyB)" />
          <g opacity="0.07">
            <line x1="8" y1="160" x2="212" y2="160" stroke="#3a2800" strokeWidth="0.8"/>
            <line x1="8" y1="182" x2="212" y2="182" stroke="#3a2800" strokeWidth="0.8"/>
            <line x1="8" y1="204" x2="212" y2="204" stroke="#3a2800" strokeWidth="0.8"/>
            <line x1="8" y1="226" x2="212" y2="226" stroke="#3a2800" strokeWidth="0.8"/>
            <line x1="8" y1="248" x2="212" y2="248" stroke="#3a2800" strokeWidth="0.8"/>
            <line x1="36" y1="24" x2="36" y2="284" stroke="#3a2800" strokeWidth="0.8"/>
            <line x1="64" y1="24" x2="64" y2="284" stroke="#3a2800" strokeWidth="0.8"/>
            <line x1="92" y1="24" x2="92" y2="284" stroke="#3a2800" strokeWidth="0.8"/>
            <line x1="120" y1="24" x2="120" y2="284" stroke="#3a2800" strokeWidth="0.8"/>
            <line x1="148" y1="24" x2="148" y2="284" stroke="#3a2800" strokeWidth="0.8"/>
            <line x1="176" y1="24" x2="176" y2="284" stroke="#3a2800" strokeWidth="0.8"/>
          </g>
          <path d="M16 36 Q18 26 28 24 L192 24 Q202 26 204 36 L212 272 Q212 284 200 284 L20 284 Q8 284 8 272 Z" fill="url(#packSheenB)" />
          <path d="M16 36 Q18 26 28 24 L28 284 L20 284 Q8 284 8 272 Z" fill="rgba(0,0,0,0.15)" />
          <path d="M192 24 Q202 26 204 36 L212 272 Q212 284 200 284 L192 284 Z" fill="rgba(0,0,0,0.15)" />
          <path d="M8 284 L12 294 L16 284 L20 294 L24 284 L28 294 L32 284 L36 294 L40 284 L44 294 L48 284 L52 294 L56 284 L60 294 L64 284 L68 294 L72 284 L76 294 L80 284 L84 294 L88 284 L92 294 L96 284 L100 294 L104 284 L108 294 L112 284 L116 294 L120 284 L124 294 L128 284 L132 294 L136 284 L140 294 L144 284 L148 294 L152 284 L156 294 L160 284 L164 294 L168 284 L172 294 L176 284 L180 294 L184 284 L188 294 L192 284 L196 294 L200 284 L204 284 L212 284 L212 272 Q212 284 200 284 L20 284 Q8 284 8 272 Z" fill="url(#botSealG)" />
        </svg>
      </div>

      {/* Card peek — shoots up after rip */}
      {isCardShoot && (
        <div style={{
          position: 'absolute', left: '50%', top: '10%',
          transform: 'translateX(-50%)',
          width: 120, height: 160, borderRadius: 8,
          background: 'linear-gradient(160deg, #1e1e26, #0f0f14)',
          border: '2px solid #b8973a',
          boxShadow: '0 0 30px rgba(184,151,58,0.6)',
          animation: 'cpo-card-shoot-up 0.55s cubic-bezier(0.2,0.8,0.2,1) forwards',
          zIndex: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 36, fontFamily: 'Georgia, serif',
            background: 'linear-gradient(135deg, #c9a84c, #7a5e22)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>$</span>
        </div>
      )}
    </div>
  );
}`;

// Replace old PackButton
const packStart = src.indexOf('function PackButton(');
const packEnd = src.indexOf('\nfunction RevealOverlay');
src = src.slice(0, packStart) + newPackButton + '\n' + src.slice(packEnd);

// ─── 3. Update open() timing ─────────────────────────────────
src = src.replace(
  `  const open = () => {
    if (!canBuy) return;
    setPhase("shaking");
    setTimeout(() => setPhase("bursting"), 900);
    setTimeout(() => {
      const result = rollCard();
      setCard(result);
      setOwned(prev => ({ ...prev, [result.id]: (prev[result.id] || 0) + 1 }));
      if (result.rarity === "mythic") setMythicJustOpened(true);
      setPhase("reveal");
    }, 1500);
  };`,
  `  const open = () => {
    if (!canBuy) return;
    setPhase("shaking");
    setTimeout(() => setPhase("ripping"), 700);
    setTimeout(() => setPhase("rip-top"), 1050);
    setTimeout(() => setPhase("rip-bottom"), 1200);
    setTimeout(() => setPhase("card-shoot"), 1400);
    setTimeout(() => {
      const result = rollCard();
      setCard(result);
      setOwned(prev => ({ ...prev, [result.id]: (prev[result.id] || 0) + 1 }));
      if (result.rarity === "mythic") setMythicJustOpened(true);
      setPhase("reveal");
    }, 2700);
  };`
);

// ─── 4. Add isOpening helper + spacebar hook ─────────────────
src = src.replace(
  '  const packCost = 0;\n  const canBuy = phase === "idle";',
  `  const packCost = 0;
  const canBuy = phase === "idle";
  const isOpening = ["shaking","ripping","rip-top","rip-bottom","card-shoot"].includes(phase);

  useEffect(() => {
    const handler = (e) => {
      if (e.code !== 'Space') return;
      e.preventDefault();
      if (phase === 'idle' && activeTab === 'open') open();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [phase, activeTab]);`
);

// ─── 5. Update render phase guard + PackButton props ─────────
src = src.replace(
  `          {(phase === "idle" || phase === "shaking" || phase === "bursting") && (
            <>
              <PackButton onClick={open} disabled={phase !== "idle"} shaking={phase === "shaking"} bursting={phase === "bursting"} />`,
  `          {(phase === "idle" || isOpening) && (
            <>
              <PackButton
                onClick={open}
                disabled={phase !== "idle"}
                shaking={phase === "shaking" || phase === "ripping"}
                ripping={["rip-top","rip-bottom","card-shoot"].includes(phase)}
                ripPhase={phase === "rip-top" ? "top" : phase === "rip-bottom" ? "bottom" : "card-shoot"}
              />`
);

fs.writeFileSync(path, src, 'utf8');
console.log('✓ Done. Run: npm run dev');
