import { readFileSync, writeFileSync } from 'fs';

const FILE = 'src/components/CryptoPackOpener.jsx';
let src = readFileSync(FILE, 'utf8');

// ── 1. Inject keyframes ──────────────────────────────────────
const keyframes = `
  @keyframes cpo-leg-fade-black {
    0%   { opacity: 0; }
    8%   { opacity: 1; }
    100% { opacity: 1; }
  }
  @keyframes cpo-leg-image-in {
    0%   { opacity: 0; }
    100% { opacity: 1; }
  }
  @keyframes cpo-leg-bg-fade-in {
    0%   { opacity: 1; }
    100% { opacity: 0; }
  }
  @keyframes cpo-leg-card-crash {
    0%   { transform: translateY(-130vh) rotate(-5deg) scale(1.3); opacity: 0; }
    52%  { transform: translateY(16px) rotate(1.5deg) scale(1.04); opacity: 1; }
    66%  { transform: translateY(-10px) rotate(-0.8deg) scale(0.97); }
    78%  { transform: translateY(6px) rotate(0.4deg) scale(1.01); }
    88%  { transform: translateY(-3px) rotate(-0.2deg) scale(1.0); }
    100% { transform: translateY(0) rotate(0deg) scale(1); opacity: 1; }
  }
  @keyframes cpo-leg-glow-pulse {
    0%,100% { box-shadow: 0 0 30px 8px rgba(255,217,107,0.55), 0 0 80px 20px rgba(200,160,40,0.3); }
    50%     { box-shadow: 0 0 60px 18px rgba(255,217,107,0.95), 0 0 140px 40px rgba(200,160,40,0.6); }
  }
  @keyframes cpo-leg-sparkle {
    0%   { transform: translate(-50%,-50%) scale(0) rotate(0deg);     opacity: 1; }
    40%  { transform: translate(-50%,-50%) scale(1.2) rotate(72deg);  opacity: 1; }
    100% { transform: translate(-50%,-50%) scale(0.6) rotate(144deg); opacity: 0; }
  }
  @keyframes cpo-leg-shooting-star {
    0%   { transform: translate(0,0) scale(1);                   opacity: 1; }
    100% { transform: translate(var(--sx),var(--sy)) scale(0.1); opacity: 0; }
  }
  @keyframes cpo-leg-shockwave {
    0%   { transform: translate(-50%,-50%) scale(0.15); opacity: 0.9; }
    100% { transform: translate(-50%,-50%) scale(5);    opacity: 0; }
  }
  @keyframes cpo-leg-crash-flash {
    0%   { opacity: 0; }
    5%   { opacity: 0.75; }
    30%  { opacity: 0; }
    100% { opacity: 0; }
  }
`;

if (!src.includes('cpo-leg-fade-black')) {
  src = src.replace('  .cpo-pack-shake', keyframes + '\n  .cpo-pack-shake');
  console.log('✅ Keyframes injected');
} else {
  console.log('⏭  Keyframes already present');
}

// ── 2. Insert LegendaryRevealSequence before RevealOverlay ───
const legendaryComponent = `
function LegendaryRevealSequence({ card, onClose }) {
  const meta = RARITY_META["legendary"];
  const VIDEO_SRC = "/f_e_d_e_a_ef_cmp_.mp4";
  const BG_IMAGE  = "/Screenshot_2026-05-08_at_6_37_17_PM.png";
  const [phase, setPhase] = useState("black");
  const [showCard, setShowCard] = useState(false);
  const [crashed, setCrashed] = useState(false);
  const [showShockwave, setShowShockwave] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [bgFading, setBgFading] = useState(false);
  const [showContinue, setShowContinue] = useState(false);
  const videoRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setPhase("video"), 600);
    return () => clearTimeout(t);
  }, []);

  const handleVideoEnd = () => {
    setPhase("image");
    setTimeout(() => setShowCard(true), 50);
    setTimeout(() => {
      setShowShockwave(true);
      setTimeout(() => setShowShockwave(false), 900);
    }, 700);
    setTimeout(() => setCrashed(true), 750);
  };

  const handleReveal = () => {
    setFlipped(true);
    setTimeout(() => setBgFading(true), 400);
    setTimeout(() => setShowContinue(true), 900);
  };

  const sparkles = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const angle = (i / 14) * Math.PI * 2;
    const r = 140 + Math.random() * 60;
    return { x: Math.cos(angle) * r, y: Math.sin(angle) * r, delay: Math.random() * 1.2, size: 6 + Math.random() * 10 };
  }), []);

  const shootingStars = useMemo(() => Array.from({ length: 10 }, () => {
    const angle = Math.random() * Math.PI * 2;
    const dist = 280 + Math.random() * 200;
    return { sx: Math.cos(angle) * dist + "px", sy: Math.sin(angle) * dist + "px", delay: 0.1 + Math.random() * 1.5, size: 3 + Math.random() * 4, dur: 0.7 + Math.random() * 0.6 };
  }), []);

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 9999, overflow: "hidden" }}>
      <div style={{ position: "absolute", inset: 0, background: "#000", zIndex: 0 }} />
      {phase === "black" && (
        <div style={{ position: "absolute", inset: 0, zIndex: 10, background: "#000", animation: "cpo-leg-fade-black 0.55s ease-out both" }} />
      )}
      {(phase === "video" || phase === "image") && (
        <video ref={videoRef} src={VIDEO_SRC} autoPlay muted playsInline onEnded={handleVideoEnd}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", zIndex: 1,
            opacity: phase === "image" ? 0 : 1, transition: "opacity 0.05s" }} />
      )}
      {phase === "image" && (
        <div style={{ position: "absolute", inset: 0, zIndex: 2,
          backgroundImage: `url(${BG_IMAGE})`,
          backgroundSize: "cover", backgroundPosition: "center",
          animation: bgFading ? "cpo-leg-bg-fade-in 1.2s ease-out forwards" : "cpo-leg-image-in 0.05s ease-out both",
          opacity: bgFading ? undefined : 1 }} />
      )}
      {showCard && (
        <div style={{ position: "absolute", inset: 0, zIndex: 5, display: "flex", alignItems: "center", justifyContent: "center" }}>
          {showShockwave && (
            <>
              <div style={{ position: "absolute", left: "50%", top: "50%", width: 300, height: 300, borderRadius: "50%",
                border: "3px solid rgba(255,217,107,0.9)", animation: "cpo-leg-shockwave 0.7s ease-out both", pointerEvents: "none" }} />
              <div style={{ position: "absolute", inset: 0, background: "rgba(255,230,100,0.3)",
                animation: "cpo-leg-crash-flash 0.45s ease-out both", pointerEvents: "none" }} />
            </>
          )}
          <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>
            {!flipped && crashed && sparkles.map((s, i) => (
              <div key={i} style={{ position: "absolute", left: "50%", top: "50%", width: s.size, height: s.size,
                pointerEvents: "none", animation: `cpo-leg-sparkle 1.4s ease-out ${s.delay}s infinite` }}>
                <svg width={s.size} height={s.size} viewBox="0 0 10 10" style={{ position: "absolute", top: 0, left: 0 }}>
                  <polygon points="5,0 6,4 10,5 6,6 5,10 4,6 0,5 4,4" fill="white" opacity="0.92" />
                </svg>
              </div>
            ))}
            {!flipped && crashed && shootingStars.map((ss, i) => (
              <div key={i} style={{ position: "absolute", left: "50%", top: "50%",
                width: ss.size, height: ss.size, borderRadius: "50%", background: "white",
                boxShadow: `0 0 ${ss.size * 2}px ${ss.size}px rgba(255,240,180,0.9)`,
                "--sx": ss.sx, "--sy": ss.sy, pointerEvents: "none",
                animation: `cpo-leg-shooting-star ${ss.dur}s ease-out ${ss.delay}s infinite` }} />
            ))}
            <div style={{ perspective: 1200 }}>
              <div style={{ position: "relative", width: 288, height: 384, transformStyle: "preserve-3d",
                transition: flipped ? "transform 0.75s cubic-bezier(0.2,0.9,0.3,1.1)" : "none",
                transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
                animation: !crashed ? "cpo-leg-card-crash 0.85s cubic-bezier(0.15,0.8,0.2,1) both"
                  : !flipped ? "cpo-leg-glow-pulse 2s ease-in-out infinite" : undefined }}>
                <div style={{ position: "absolute", inset: 0, borderRadius: 12, backfaceVisibility: "hidden",
                  border: `2px solid ${meta.color}`, background: "linear-gradient(160deg, #1e1a08, #0c0c10)",
                  overflow: "hidden", boxShadow: `0 0 60px ${meta.glow}, inset 0 0 40px ${meta.glow}` }}>
                  <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 10 }}>
                    <span style={{ fontSize: 80, fontFamily: "Georgia, serif",
                      background: "linear-gradient(135deg, #FFD96B, #7a5e22)",
                      WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>$</span>
                    <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.4em", color: "#FFD96B88" }}>Legendary</span>
                    <div style={{ position: "absolute", inset: 10, borderRadius: 8, border: "1px solid rgba(255,217,107,0.3)", pointerEvents: "none" }} />
                  </div>
                </div>
                <div style={{ position: "absolute", inset: 0, borderRadius: 12, backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)", border: `2px solid ${meta.color}`,
                  background: "linear-gradient(160deg, #1e1a08, #0c0c10)", overflow: "hidden",
                  boxShadow: `0 0 60px ${meta.glow}, inset 0 0 40px ${meta.glow}` }}>
                  <div style={{ position: "relative", zIndex: 4, display: "flex", justifyContent: "space-between",
                    alignItems: "center", padding: "8px 12px 6px", background: "rgba(0,0,0,0.6)",
                    borderBottom: `1px solid ${meta.color}55` }}>
                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.3em", color: meta.color }}>Legendary</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.15em" }}>{card.series}</span>
                  </div>
                  <div style={{ flex: 1, position: "relative", overflow: "hidden", height: 280 }}>
                    <img src={card.image} alt={card.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }}
                      onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement.style.background = `linear-gradient(160deg, ${meta.color}22, #0c0c10)`; }} />
                    <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "45%",
                      background: "linear-gradient(to top, rgba(10,10,14,0.97), transparent)", pointerEvents: "none" }} />
                  </div>
                  <div style={{ position: "relative", zIndex: 4, padding: "10px 14px 12px",
                    background: "rgba(0,0,0,0.75)", borderTop: `1px solid ${meta.color}44` }}>
                    <div style={{ fontFamily: "Georgia, serif", fontSize: 17, fontWeight: 700, color: "#f0ece0", marginBottom: 5 }}>{card.name}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13, fontWeight: 800, color: meta.color, letterSpacing: "0.08em", textTransform: "uppercase" }}>OVR {card.ovr}</span>
                      <span style={{ fontSize: 11, color: "#555", fontStyle: "italic" }}>{card.series}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {crashed && !flipped && (
              <button className="cpo-float-up" onClick={handleReveal}
                style={{ background: "linear-gradient(135deg, #c9a84c, #7a5e22)", color: "#0c0c10",
                  fontWeight: 700, fontSize: 15, padding: "13px 38px", borderRadius: 8, border: "none",
                  cursor: "pointer", letterSpacing: "0.15em", textTransform: "uppercase",
                  boxShadow: "0 0 20px rgba(255,217,107,0.5)", transition: "transform 0.15s" }}
                onMouseEnter={e => e.currentTarget.style.transform = "scale(1.05)"}
                onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}>
                ⚡ Reveal Card
              </button>
            )}
            {showContinue && (
              <button className="cpo-float-up" onClick={onClose}
                style={{ background: "transparent", border: `1px solid ${meta.color}`, color: meta.color,
                  fontWeight: 700, fontSize: 14, padding: "12px 40px", borderRadius: 8, cursor: "pointer",
                  letterSpacing: "0.2em", textTransform: "uppercase", transition: "all 0.2s",
                  boxShadow: "0 0 12px rgba(255,217,107,0.3)" }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,217,107,0.1)"; e.currentTarget.style.boxShadow = "0 0 24px rgba(255,217,107,0.6)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.boxShadow = "0 0 12px rgba(255,217,107,0.3)"; }}>
                Continue Trading
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

`;

if (!src.includes('LegendaryRevealSequence')) {
  src = src.replace('function RevealOverlay({ card, onClose }) {', legendaryComponent + 'function RevealOverlay({ card, onClose }) {');
  console.log('✅ LegendaryRevealSequence inserted');
} else {
  console.log('⏭  LegendaryRevealSequence already present');
}

// ── 3. Route legendary inside RevealOverlay ──────────────────
const oldRoute = `  // Mythic gets its own full sequence
  if (tier === "mythic") {
    return <MythicRevealSequence card={card} onClose={onClose} />;
  }

  // Rare gets the horizontal wave sequence
  if (tier === "rare") {
    return <RareRevealSequence card={card} onClose={onClose} />;
  }

  // Epic gets the rave crash sequence
  if (tier === "epic") {
    return <EpicRevealSequence card={card} onClose={onClose} />;
  }

  const isFancy = tier === "legendary";`;

const newRoute = `  if (tier === "mythic")    return <MythicRevealSequence    card={card} onClose={onClose} />;
  if (tier === "rare")      return <RareRevealSequence      card={card} onClose={onClose} />;
  if (tier === "epic")      return <EpicRevealSequence      card={card} onClose={onClose} />;
  if (tier === "legendary") return <LegendaryRevealSequence card={card} onClose={onClose} />;

  const isFancy = false;`;

if (src.includes(oldRoute)) {
  src = src.replace(oldRoute, newRoute);
  console.log('✅ RevealOverlay routing updated');
} else {
  console.log('⚠️  Routing block not found — may already be patched');
}

writeFileSync(FILE, src);
console.log('✅ Done');
