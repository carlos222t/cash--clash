const fs = require('fs');
const path = 'src/pages/CryptoPackOpener.jsx';
let src = fs.readFileSync(path, 'utf8');

src = src.replace(
`                <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10 }}>
                  <span style={{ fontSize: 80, fontFamily: "Georgia, serif", background: "linear-gradient(135deg, #FFD96B, #7a5e22)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", position: "relative", zIndex: 1 }}>$</span>
                  <span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.4em", color: "#FFD96B88", position: "relative", zIndex: 1 }}>Legendary</span>
                  <div style={{ position: "absolute", inset: 10, borderRadius: 8, border: "1px solid rgba(255,217,107,0.3)", pointerEvents: "none" }} />
                </div>`,
`                <img src="/legendarycard.png" alt="Legendary" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", borderRadius: 10 }} />`
);

fs.writeFileSync(path, src, 'utf8');
console.log('✓ Done');
