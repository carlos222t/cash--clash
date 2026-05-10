const fs = require('fs');
const path = 'src/pages/CryptoPackOpener.jsx';
let src = fs.readFileSync(path, 'utf8');

// ─── 1. Add new CSS keyframes inside the CSS string ──────────
src = src.replace(
  '  @keyframes cpo-pack-rip-shake {',
  `  @keyframes cpo-ufo-lift {
    0%   { transform: translateY(0) rotate(0deg) scale(1); filter: brightness(1); }
    20%  { transform: translateY(-8px) rotate(-1deg) scale(1.02); filter: brightness(1.1); }
    40%  { transform: translateY(-20px) rotate(1.5deg) scale(1.03); filter: brightness(1.2); }
    60%  { transform: translateY(-40px) rotate(-1deg) scale(1.04); filter: brightness(1.4) drop-shadow(0 0 20px rgba(255,255,255,0.4)); }
    80%  { transform: translateY(-80px) rotate(2deg) scale(1.05); filter: brightness(1.6) drop-shadow(0 0 35px rgba(255,255,255,0.6)); }
    100% { transform: translateY(-160vh) rotate(-3deg) scale(0.7); filter: brightness(2) drop-shadow(0 0 60px rgba(255,255,255,0.9)); opacity: 0; }
  }
  @keyframes cpo-crash-down {
    0%   { transform: translateY(-130vh) rotate(8deg) scale(0.7); opacity: 0; }
    50%  { transform: translateY(18px) rotate(-3deg) scale(1.06); opacity: 1; }
    65%  { transform: translateY(-10px) rotate(1.5deg) scale(0.97); }
    78%  { transform: translateY(6px) rotate(-0.5deg) scale(1.02); }
    90%  { transform: translateY(-3px) rotate(0.2deg) scale(1.0); }
    100% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
  }
  @keyframes cpo-crash-impact {
    0%   { transform: translate(-50%,-50%) scale(0.1); opacity: 0.9; }
    100% { transform: translate(-50%,-50%) scale(5); opacity: 0; }
  }
  @keyframes cpo-crash-flash-white {
    0%   { opacity: 0; }
    5%   { opacity: 0.7; }
    35%  { opacity: 0; }
    100% { opacity: 0; }
  }
  @keyframes cpo-ufo-glow {
    0%,100% { box-shadow: 0 0 30px 8px rgba(255,255,255,0.2); }
    50%     { box-shadow: 0 0 80px 24px rgba(255,255,255,0.7), 0 0 160px 48px rgba(200,200,255,0.4); }
  }
  @keyframes cpo-pack-rip-shake {`
);

// ─── 2. New state vars + handleReveal for LEGENDARY ──────────
src = src.replace(
  `  const handleReveal = () => {
    setFlipped(true);
    setFloating(false);
    setTimeout(() => setShowContinue(true), 900);
  };`,
  `  const [revealPhase, setRevealPhase] = useState('idle'); // idle | lifting | crashing | done

  const handleReveal = () => {
    if (revealPhase !== 'idle') return;
    setRevealPhase('lifting');
    setFloating(false);
    setTimeout(() => {
      setRevealPhase('crashing');
      setTimeout(() => {
        setFlipped(true);
        setRevealPhase('done');
        setTimeout(() => setShowContinue(true), 900);
      }, 900);
    }, 1000);
  };`
);

// ─── 3. New state vars + handleReveal for EPIC ───────────────
src = src.replace(
  `  const handleReveal = () => {
    setFlipped(true);
    setDancing(false);
    setTimeout(() => setShowContinue(true), 800);
  };`,
  `  const [revealPhase, setRevealPhase] = useState('idle');

  const handleReveal = () => {
    if (revealPhase !== 'idle') return;
    setRevealPhase('lifting');
    setDancing(false);
    setTimeout(() => {
      setRevealPhase('crashing');
      setTimeout(() => {
        setFlipped(true);
        setRevealPhase('done');
        setTimeout(() => setShowContinue(true), 800);
      }, 900);
    }, 1000);
  };`
);

// ─── 4. Update LEGENDARY card animation to use revealPhase ───
src = src.replace(
  `animation: !crashed ? "leg-star-trail 0.95s cubic-bezier(0.15,0.85,0.2,1) both" : floating ? "leg-float-idle 3.6s ease-in-out infinite, leg-card-glow-pulse 2.4s ease-in-out infinite" : "leg-card-glow-pulse 2.4s ease-in-out infinite" }}>`,
  `animation: !crashed ? "leg-star-trail 0.95s cubic-bezier(0.15,0.85,0.2,1) both" : revealPhase === 'lifting' ? "cpo-ufo-lift 1.0s cubic-bezier(0.4,0,0.6,1) forwards, cpo-ufo-glow 0.5s ease-in-out infinite" : revealPhase === 'crashing' ? "cpo-crash-down 0.85s cubic-bezier(0.15,0.8,0.2,1) both" : floating ? "leg-float-idle 3.6s ease-in-out infinite, leg-card-glow-pulse 2.4s ease-in-out infinite" : "leg-card-glow-pulse 2.4s ease-in-out infinite" }}>`,
);

// ─── 5. Update EPIC card animation to use revealPhase ────────
src = src.replace(
  `animation: !crashed
                ? "cpo-epic-crash 0.75s cubic-bezier(0.15,0.85,0.2,1) both"
                : dancing
                ? "cpo-epic-dance 3.2s ease-in-out infinite, cpo-epic-card-glow 2.4s ease-in-out infinite"
                : "cpo-epic-card-glow 2.4s ease-in-out infinite",`,
  `animation: !crashed
                ? "cpo-epic-crash 0.75s cubic-bezier(0.15,0.85,0.2,1) both"
                : revealPhase === 'lifting'
                ? "cpo-ufo-lift 1.0s cubic-bezier(0.4,0,0.6,1) forwards, cpo-ufo-glow 0.5s ease-in-out infinite"
                : revealPhase === 'crashing'
                ? "cpo-crash-down 0.85s cubic-bezier(0.15,0.8,0.2,1) both"
                : dancing
                ? "cpo-epic-dance 3.2s ease-in-out infinite, cpo-epic-card-glow 2.4s ease-in-out infinite"
                : "cpo-epic-card-glow 2.4s ease-in-out infinite",`
);

// ─── 6. Add crash impact rings after LEGENDARY card div ──────
src = src.replace(
  `          {showReveal && !flipped && (
            <button className="cpo-float-up" onClick={handleReveal}`,
  `          {revealPhase === 'crashing' && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 9, pointerEvents: "none", background: "rgba(255,240,180,0.25)", animation: "cpo-crash-flash-white 0.5s ease-out both" }} />
              <div style={{ position: "fixed", left: "50%", top: "50%", zIndex: 9, width: 300, height: 300, borderRadius: "50%", border: "3px solid rgba(255,220,60,0.9)", animation: "cpo-crash-impact 0.7s ease-out both", pointerEvents: "none" }} />
              <div style={{ position: "fixed", left: "50%", top: "50%", zIndex: 9, width: 300, height: 300, borderRadius: "50%", border: "2px solid rgba(255,180,0,0.5)", animation: "cpo-crash-impact 0.7s ease-out 0.1s both", pointerEvents: "none" }} />
            </>
          )}
          {showReveal && !flipped && revealPhase === 'idle' && (
            <button className="cpo-float-up" onClick={handleReveal}`
);

// ─── 7. Add crash impact rings after EPIC card div ───────────
src = src.replace(
  `          {/* Reveal button — shown once card is dancing */}
          {dancing && !flipped && (`,
  `          {revealPhase === 'crashing' && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 9, pointerEvents: "none", background: "rgba(220,180,255,0.3)", animation: "cpo-crash-flash-white 0.5s ease-out both" }} />
              <div style={{ position: "fixed", left: "50%", top: "50%", zIndex: 9, width: 300, height: 300, borderRadius: "50%", border: "3px solid rgba(199,125,255,0.9)", animation: "cpo-crash-impact 0.7s ease-out both", pointerEvents: "none" }} />
              <div style={{ position: "fixed", left: "50%", top: "50%", zIndex: 9, width: 300, height: 300, borderRadius: "50%", border: "2px solid rgba(150,80,255,0.5)", animation: "cpo-crash-impact 0.7s ease-out 0.1s both", pointerEvents: "none" }} />
            </>
          )}
          {/* Reveal button — shown once card is dancing */}
          {dancing && !flipped && revealPhase === 'idle' && (`
);

fs.writeFileSync(path, src, 'utf8');
console.log('✓ Done');
