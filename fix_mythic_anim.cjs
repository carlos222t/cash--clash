const fs = require('fs');
const path = 'src/pages/CryptoPackOpener.jsx';
let src = fs.readFileSync(path, 'utf8');

// ─── 1. Add mythic zoom/crash CSS inside the CSS string ──────
src = src.replace(
  '  @keyframes cpo-pack-rip-shake {',
  `  @keyframes cpo-mythic-zoom-away {
    0%   { transform: scale(1) translateZ(0) rotate(0deg); opacity: 1; filter: brightness(1); }
    20%  { transform: scale(0.92) rotate(-1deg); opacity: 1; filter: brightness(1.3); }
    50%  { transform: scale(0.5) rotate(2deg); opacity: 0.8; filter: brightness(1.8) drop-shadow(0 0 30px rgba(255,106,44,0.8)); }
    80%  { transform: scale(0.15) rotate(-3deg); opacity: 0.4; filter: brightness(2.5) drop-shadow(0 0 60px rgba(255,106,44,1)); }
    100% { transform: scale(0.02) rotate(5deg); opacity: 0; filter: brightness(3); }
  }
  @keyframes cpo-mythic-crash-in {
    0%   { transform: translateY(-140vh) rotate(-10deg) scale(0.6); opacity: 0; filter: brightness(2); }
    45%  { transform: translateY(22px) rotate(2deg) scale(1.08); opacity: 1; filter: brightness(1.3); }
    60%  { transform: translateY(-14px) rotate(-1.5deg) scale(0.96); filter: brightness(1); }
    73%  { transform: translateY(8px) rotate(0.8deg) scale(1.02); }
    84%  { transform: translateY(-4px) rotate(-0.3deg) scale(0.99); }
    100% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; filter: brightness(1); }
  }
  @keyframes cpo-mythic-zoom-flash {
    0%   { opacity: 0; }
    10%  { opacity: 0.8; }
    40%  { opacity: 0; }
    100% { opacity: 0; }
  }
  @keyframes cpo-pack-rip-shake {`
);

// ─── 2. Replace handleCardClick with zoom-away + crash ───────
src = src.replace(
  `  const handleCardClick = () => {
    if (!showOpenMe || flipped) return;
    setFlipped(true);
    setTimeout(() => setShowContinue(true), 800);
  };`,
  `  const [mythicPhase, setMythicPhase] = useState('idle'); // idle | zooming | crashed

  const handleCardClick = () => {
    if (!showOpenMe || flipped || mythicPhase !== 'idle') return;
    setMythicPhase('zooming');
    setTimeout(() => {
      setMythicPhase('crashed');
      setFlipped(true);
      setTimeout(() => setShowContinue(true), 1000);
    }, 900);
  };`
);

// ─── 3. Update the card flip container animation ─────────────
src = src.replace(
  `              animation: !crashed ? "cpo-mythic-crash 0.85s cubic-bezier(0.15,0.8,0.2,1) both" : undefined,`,
  `              animation: !crashed
                ? "cpo-mythic-crash 0.85s cubic-bezier(0.15,0.8,0.2,1) both"
                : mythicPhase === 'zooming'
                ? "cpo-mythic-zoom-away 0.85s cubic-bezier(0.4,0,0.8,1) forwards"
                : mythicPhase === 'crashed'
                ? "cpo-mythic-crash-in 0.9s cubic-bezier(0.15,0.8,0.2,1) both"
                : undefined,`
);

// ─── 4. Add crash flash + impact rings when crashed phase ────
src = src.replace(
  `          {showOpenMe && !flipped && (`,
  `          {mythicPhase === 'crashed' && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 8, pointerEvents: "none", background: "rgba(255,80,20,0.35)", animation: "cpo-mythic-zoom-flash 0.5s ease-out both" }} />
              <div style={{ position: "fixed", left: "50%", top: "50%", zIndex: 8, width: 320, height: 320, borderRadius: "50%", border: "3px solid rgba(255,106,44,0.95)", animation: "cpo-crash-impact 0.75s ease-out both", pointerEvents: "none" }} />
              <div style={{ position: "fixed", left: "50%", top: "50%", zIndex: 8, width: 320, height: 320, borderRadius: "50%", border: "2px solid rgba(255,60,0,0.5)", animation: "cpo-crash-impact 0.75s ease-out 0.1s both", pointerEvents: "none" }} />
            </>
          )}
          {showOpenMe && !flipped && (`
);

fs.writeFileSync(path, src, 'utf8');
console.log('✓ Done');
