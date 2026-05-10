const fs = require('fs');
const path = 'src/pages/CryptoPackOpener.jsx';
let src = fs.readFileSync(path, 'utf8');

src = src.replace(
`                <div style={{ position: "absolute", inset: 0, opacity: 0.15, pointerEvents: "none", zIndex: 3, background: "linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.35) 50%, transparent 70%)" }} />
                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <div style={{ position: "absolute", inset: 0, opacity: 0.07, backgroundImage: "linear-gradient(rgba(199,125,255,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(199,125,255,0.2) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
                  <span style={{ fontSize: 80, fontFamily: "Georgia, serif", background: "linear-gradient(135deg, #C77DFF, #6a00cc)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", position: "relative", zIndex: 1 }}>$</span>
                  <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.4em", color: "#C77DFF88", position: "relative", zIndex: 1 }}>Epic</span>
                  <div style={{ position: "absolute", inset: 10, borderRadius: 8, border: "1px solid rgba(199,125,255,0.3)", pointerEvents: "none" }} />
                </div>`,
`                <img src="/epiccard.png" alt="Epic" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", borderRadius: 10 }} />`
);

fs.writeFileSync(path, src, 'utf8');
console.log('✓ Done');
