const fs = require('fs');
const path = 'src/pages/CryptoPackOpener.jsx';
let src = fs.readFileSync(path, 'utf8');

// ─── 1. Add new CSS animations ───────────────────────────────
src = src.replace(
  '  @keyframes cpo-pack-rip-shake {',
  `  @keyframes cpo-twc-laser-rise {
    0%   { transform: scaleY(0); opacity: 0; transform-origin: bottom; }
    10%  { opacity: 1; }
    45%  { transform: scaleY(1); opacity: 0.9; transform-origin: bottom; }
    100% { opacity: 0.75; }
  }
  @keyframes cpo-twc-laser-sweep {
    0%   { transform: rotate(var(--ls, 0deg)); }
    50%  { transform: rotate(var(--le, 15deg)); }
    100% { transform: rotate(var(--ls, 0deg)); }
  }
  @keyframes cpo-twc-laser-pulse {
    0%,100% { opacity: 0.6; }
    50%     { opacity: 1; }
  }
  @keyframes cpo-twc-glitch {
    0%,100%  { clip-path: inset(0 0 0 0); transform: translate(0,0); filter: none; }
    10%  { clip-path: inset(12% 0 32% 0); transform: translate(-5px, 2px); filter: hue-rotate(90deg) brightness(2.5) saturate(3); }
    20%  { clip-path: inset(48% 0 6% 0);  transform: translate(7px, -3px); filter: hue-rotate(0deg) brightness(3) saturate(4); }
    30%  { clip-path: inset(6% 0 58% 0);  transform: translate(-4px, 4px); filter: hue-rotate(180deg) brightness(2); }
    40%  { clip-path: inset(0 0 0 0);     transform: translate(0,0); filter: none; }
    55%  { clip-path: inset(22% 0 22% 0); transform: translate(6px, -2px); filter: hue-rotate(45deg) brightness(2.8) saturate(3); }
    65%  { clip-path: inset(8% 0 42% 0);  transform: translate(-6px, 3px); filter: hue-rotate(330deg) brightness(3.2) saturate(4); }
    75%  { clip-path: inset(0 0 0 0);     transform: translate(0,0); filter: none; }
  }
  @keyframes cpo-twc-floor-glow {
    0%,100% { opacity: 0.4; }
    50%     { opacity: 0.7; }
  }
  @keyframes cpo-pack-rip-shake {`
);

// ─── 2. Replace mythic front face with TWC image ─────────────
src = src.replace(
  `                <div style={{ position: "absolute", inset: 0, opacity: 0.15, pointerEvents: "none", zIndex: 3, background: "linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)" }} />
                <div style={{ position: "relative", overflow: "hidden", width: "100%", height: "100%" }}>
                  <img src={card.image} alt={card.name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block", borderRadius: 10 }}
                    onError={e => { e.currentTarget.style.display = "none"; e.currentTarget.parentElement.style.background = \`linear-gradient(160deg, \${meta.color}22, #0c0c10)\`; }}
                  />
                  
                </div>`,
  `                <img src="/cards/TotalWorldControl.png" alt="Total World Control"
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block", borderRadius: 10 }} />`
);

// ─── 3. Replace mythicPhase === 'crashed' block with lasers + glitch ──
src = src.replace(
  `          {mythicPhase === 'crashed' && (
            <>
              <div style={{ position: "fixed", inset: 0, zIndex: 8, pointerEvents: "none", background: "rgba(255,80,20,0.35)", animation: "cpo-mythic-zoom-flash 0.5s ease-out both" }} />
              <div style={{ position: "fixed", left: "50%", top: "50%", zIndex: 8, width: 320, height: 320, borderRadius: "50%", border: "3px solid rgba(255,106,44,0.95)", animation: "cpo-crash-impact 0.75s ease-out both", pointerEvents: "none" }} />
              <div style={{ position: "fixed", left: "50%", top: "50%", zIndex: 8, width: 320, height: 320, borderRadius: "50%", border: "2px solid rgba(255,60,0,0.5)", animation: "cpo-crash-impact 0.75s ease-out 0.1s both", pointerEvents: "none" }} />
            </>
          )}`,
  `          {mythicPhase === 'crashed' && (
            <>
              {/* crash flash */}
              <div style={{ position: "fixed", inset: 0, zIndex: 8, pointerEvents: "none", background: "rgba(255,80,20,0.35)", animation: "cpo-mythic-zoom-flash 0.5s ease-out both" }} />
              <div style={{ position: "fixed", left: "50%", top: "50%", zIndex: 8, width: 320, height: 320, borderRadius: "50%", border: "3px solid rgba(255,106,44,0.95)", animation: "cpo-crash-impact 0.75s ease-out both", pointerEvents: "none" }} />
              <div style={{ position: "fixed", left: "50%", top: "50%", zIndex: 8, width: 320, height: 320, borderRadius: "50%", border: "2px solid rgba(255,60,0,0.5)", animation: "cpo-crash-impact 0.75s ease-out 0.1s both", pointerEvents: "none" }} />
              {/* rave lasers */}
              <div style={{ position: "fixed", inset: 0, zIndex: 3, pointerEvents: "none", overflow: "hidden" }}>
                {[
                  { x:5,  a:-32, h:0,   ls:-32, le:-14, d:2.7, delay:0    },
                  { x:13, a:-20, h:15,  ls:-20, le:0,   d:3.1, delay:0.1  },
                  { x:22, a:-10, h:350, ls:-10, le:8,   d:2.8, delay:0.05 },
                  { x:33, a:0,   h:30,  ls:0,   le:14,  d:3.3, delay:0.18 },
                  { x:44, a:8,   h:0,   ls:8,   le:22,  d:2.6, delay:0.08 },
                  { x:55, a:-5,  h:20,  ls:-5,  le:12,  d:3.0, delay:0.22 },
                  { x:65, a:12,  h:350, ls:12,  le:28,  d:2.9, delay:0.04 },
                  { x:75, a:22,  h:15,  ls:22,  le:8,   d:3.2, delay:0.14 },
                  { x:84, a:32,  h:0,   ls:32,  le:16,  d:2.7, delay:0.2  },
                  { x:92, a:20,  h:30,  ls:20,  le:36,  d:3.4, delay:0.28 },
                ].map((l, i) => (
                  <div key={i} style={{
                    position: "absolute", bottom: 0, left: l.x + "%",
                    width: 3, height: "92vh",
                    transformOrigin: "bottom center",
                    transform: "rotate(" + l.a + "deg)",
                    background: "linear-gradient(to top, hsl(" + l.h + ",100%,60%) 0%, hsl(" + l.h + ",90%,55%) 25%, hsl(" + l.h + ",80%,45%) 60%, transparent 100%)",
                    boxShadow: "0 0 8px 2px hsl(" + l.h + ",100%,60%), 0 0 20px 4px hsl(" + l.h + ",80%,50%)",
                    animation: "cpo-twc-laser-rise 0.6s cubic-bezier(0.2,0.8,0.2,1) " + l.delay + "s both, cpo-twc-laser-sweep " + l.d + "s ease-in-out " + (l.delay+0.6) + "s infinite, cpo-twc-laser-pulse " + (l.d*0.7) + "s ease-in-out " + l.delay + "s infinite",
                    '--ls': l.ls + "deg",
                    '--le': l.le + "deg",
                  }} />
                ))}
                {/* floor glow */}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: 100,
                  background: "linear-gradient(to top, rgba(255,60,0,0.5) 0%, rgba(255,200,0,0.2) 50%, transparent 100%)",
                  animation: "cpo-twc-floor-glow 1.2s ease-in-out infinite",
                }} />
              </div>
              {/* card glitch overlay — every 1.5s */}
              <TWCGlitchOverlay />
            </>
          )}`
);

// ─── 4. Add TWCGlitchOverlay component before MythicRevealSequence ──
src = src.replace(
  '// ─── NEW Mythic Reveal Sequence ───────────────────────────────',
  `// ─── TWC Glitch Overlay ─────────────────────────────────────
function TWCGlitchOverlay() {
  const [glitching, setGlitching] = useState(false);
  useEffect(() => {
    const schedule = () => {
      const id = setTimeout(() => {
        setGlitching(true);
        setTimeout(() => { setGlitching(false); schedule(); }, 400);
      }, 1500 + Math.random() * 500);
      return id;
    };
    const id = schedule();
    return () => clearTimeout(id);
  }, []);
  if (!glitching) return null;
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 15, pointerEvents: "none",
      overflow: "hidden",
    }}>
      <img src="/cards/TotalWorldControl.png" alt=""
        style={{
          position: "absolute", left: "50%", top: "50%",
          transform: "translate(-50%, -50%)",
          width: 288, height: 384, objectFit: "cover", borderRadius: 12,
          animation: "cpo-twc-glitch 0.38s steps(2) both",
        }}
      />
    </div>
  );
}

// ─── NEW Mythic Reveal Sequence ───────────────────────────────`
);

fs.writeFileSync(path, src, 'utf8');
console.log('✓ Done');
