const fs = require('fs');
const path = 'src/pages/CryptoPackOpener.jsx';
let src = fs.readFileSync(path, 'utf8');

// Add fast shake keyframe inside CSS string
src = src.replace(
  '  @keyframes cpo-pack-rip-shake {',
  `  @keyframes cpo-card-want-out {
    0%,100% { transform: rotate(0deg) translateX(0); }
    10%  { transform: rotate(-4deg) translateX(-4px); }
    20%  { transform: rotate(4deg) translateX(4px); }
    30%  { transform: rotate(-5deg) translateX(-5px); }
    40%  { transform: rotate(5deg) translateX(5px); }
    50%  { transform: rotate(-4deg) translateX(-4px); }
    60%  { transform: rotate(4deg) translateX(4px); }
    70%  { transform: rotate(-3deg) translateX(-3px); }
    80%  { transform: rotate(3deg) translateX(3px); }
    90%  { transform: rotate(-2deg) translateX(-2px); }
  }
  @keyframes cpo-pack-rip-shake {`
);

// Replace showQQQ block with fast shake overlay
src = src.replace(
  `                {showQQQ && (
                  <div style={{ position: "absolute", inset: 0, zIndex: 20, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.75)", borderRadius: 12 }}>
                    <span style={{
                      position: "absolute", top: "50%", left: "50%",
                      animation: "cpo-qqq-slam 0.62s cubic-bezier(0.2,0.9,0.3,1.1) both",
                      fontSize: 52, fontWeight: 900, color: "#FF6A2C",
                      textShadow: "0 0 20px #FF6A2C, 0 0 50px #cc3300, 0 0 100px #990000",
                      letterSpacing: "0.25em", fontFamily: "monospace", whiteSpace: "nowrap",
                    }}>???</span>
                  </div>
                )}`,
  `                {showQQQ && (
                  <div style={{
                    position: "absolute", inset: 0, zIndex: 20, borderRadius: 12,
                    animation: "cpo-card-want-out 0.08s ease-in-out infinite",
                    pointerEvents: "none",
                  }} />
                )}`
);

// Also apply the shake to the whole card when showQQQ is true
// Find the back face div and add shake to the outer card wrapper when showQQQ
src = src.replace(
  `              position: "relative", width: 288, height: 384,
              transformStyle: "preserve-3d",
              transition: flipped ? "transform 0.75s cubic-bezier(0.2,0.9,0.3,1.1)" : "none",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              animation: !crashed
                ? "cpo-mythic-crash 0.85s cubic-bezier(0.15,0.8,0.2,1) both"
                : mythicPhase === 'zooming'
                ? "cpo-mythic-zoom-away 0.85s cubic-bezier(0.4,0,0.8,1) forwards"
                : mythicPhase === 'crashed'
                ? "cpo-mythic-crash-in 0.9s cubic-bezier(0.15,0.8,0.2,1) both"
                : undefined,`,
  `              position: "relative", width: 288, height: 384,
              transformStyle: "preserve-3d",
              transition: flipped ? "transform 0.75s cubic-bezier(0.2,0.9,0.3,1.1)" : "none",
              transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
              animation: !crashed
                ? "cpo-mythic-crash 0.85s cubic-bezier(0.15,0.8,0.2,1) both"
                : showQQQ
                ? "cpo-card-want-out 0.08s ease-in-out infinite"
                : mythicPhase === 'zooming'
                ? "cpo-mythic-zoom-away 0.85s cubic-bezier(0.4,0,0.8,1) forwards"
                : mythicPhase === 'crashed'
                ? "cpo-mythic-crash-in 0.9s cubic-bezier(0.15,0.8,0.2,1) both"
                : undefined,`
);

fs.writeFileSync(path, src, 'utf8');
console.log('✓ Done');
