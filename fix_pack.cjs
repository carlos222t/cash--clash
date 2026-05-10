const fs = require('fs');
const path = 'src/pages/CryptoPackOpener.jsx';
let src = fs.readFileSync(path, 'utf8');

// ─── Replace entire PackButton with image-based version ───────
const packStart = src.indexOf('function PackButton(');
const packEnd = src.indexOf('\nfunction RevealOverlay');
src = src.slice(0, packStart) + `function PackButton({ onClick, disabled, shaking }) {
  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={{
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        animation: shaking ? 'cpo-pack-shoot 1.8s cubic-bezier(0.4,0,0.2,1) forwards' : 'none',
        transformOrigin: 'center bottom',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        userSelect: 'none',
      }}
    >
      <img
        src="/pack.png"
        alt="Card Pack"
        draggable={false}
        style={{
          width: 220, height: 'auto',
          filter: !disabled ? 'drop-shadow(0 0 24px rgba(184,151,58,0.55))' : 'none',
          transition: 'filter 0.3s, transform 0.2s',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}` + '\n' + src.slice(packEnd);

// ─── Replace open() with new shake→shoot timing ───────────────
src = src.replace(
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
  };`,
  `  const open = () => {
    if (!canBuy) return;
    setPhase("shaking");
    setTimeout(() => {
      const result = rollCard();
      setCard(result);
      setOwned(prev => ({ ...prev, [result.id]: (prev[result.id] || 0) + 1 }));
      if (result.rarity === "mythic") setMythicJustOpened(true);
    }, 200);
    setTimeout(() => setPhase("reveal"), 2200);
  };`
);

// ─── Fix isOpening and render guard ──────────────────────────
src = src.replace(
  'const isOpening = ["shaking","ripping","rip-top","rip-bottom","card-shoot"].includes(phase);',
  'const isOpening = phase === "shaking";'
);

src = src.replace(
  `          {(phase === "idle" || isOpening) && (
            <>
              <PackButton
                onClick={open}
                disabled={phase !== "idle"}
                shaking={phase === "shaking" || phase === "ripping"}
                ripping={["rip-top","rip-bottom","card-shoot"].includes(phase)}
                ripPhase={phase === "rip-top" ? "top" : phase === "rip-bottom" ? "bottom" : "card-shoot"}
              />`,
  `          {(phase === "idle" || isOpening) && (
            <>
              <PackButton
                onClick={open}
                disabled={phase !== "idle"}
                shaking={phase === "shaking"}
              />`
);

// ─── Add shoot animation to CSS string ───────────────────────
src = src.replace(
  '  @keyframes cpo-pack-rip-shake {',
  `  @keyframes cpo-pack-shoot {
    0%   { transform: translateY(0) rotate(0deg) scale(1); }
    25%  { transform: translateY(-8px) rotate(-2deg) scale(1.04); }
    45%  { transform: translateY(-6px) rotate(2deg) scale(1.03); }
    60%  { transform: translateY(-12px) rotate(-1deg) scale(1.05); }
    75%  { transform: translateY(-200px) rotate(-4deg) scale(0.95); opacity: 1; }
    100% { transform: translateY(-140vh) rotate(-8deg) scale(0.85); opacity: 0; }
  }
  @keyframes cpo-pack-rip-shake {`
);

fs.writeFileSync(path, src, 'utf8');
console.log('✓ Done');
