const fs = require('fs');
const path = 'src/pages/CryptoPackOpener.jsx';
let src = fs.readFileSync(path, 'utf8');

// Replace mythiccard.png back face with TWC
src = src.replace(
  `<img src="/mythiccard.png" alt="Mythic" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", borderRadius: 10 }} />`,
  `<img src="/cards/TotalWorldControl.png" alt="Total World Control" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", borderRadius: 10 }} />`
);

// Remove the duplicate card from showContinue block - keep only the button
src = src.replace(
  `          {showContinue && (
            <div className="cpo-float-up" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 24 }}>
              <div style={{
                position: "relative", width: 288, height: 384, borderRadius: 12, overflow: "hidden",
                boxShadow: "0 0 60px rgba(255,106,44,0.9), 0 0 120px rgba(255,60,0,0.5), inset 0 0 40px rgba(255,106,44,0.3)",
                animation: "cpo-heartbeat 0.75s ease-in-out infinite",
              }}>
                <img src="/cards/TotalWorldControl.png" alt="Total World Control"
                  style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block", borderRadius: 12 }} />
                <div style={{ position: "absolute", inset: 0, borderRadius: 12, background: "linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.12) 50%, transparent 70%)", pointerEvents: "none" }} />
              </div>
              <button
                onClick={onClose}
                style={{
                  background: "transparent", border: "1px solid #FF6A2C", color: "#FF6A2C",
                  fontWeight: 700, fontSize: 14, padding: "12px 40px", borderRadius: 8,
                  cursor: "pointer", letterSpacing: "0.2em", textTransform: "uppercase",
                  transition: "all 0.2s", boxShadow: "0 0 12px rgba(255,106,44,0.3)",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,106,44,0.12)"; e.currentTarget.style.boxShadow = "0 0 24px rgba(255,106,44,0.6)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.boxShadow = "0 0 12px rgba(255,106,44,0.3)"; }}
              >
                Continue Trading
              </button>
            </div>
          )}`,
  `          {showContinue && (
            <button
              className="cpo-float-up"
              onClick={onClose}
              style={{
                background: "transparent", border: "1px solid #FF6A2C", color: "#FF6A2C",
                fontWeight: 700, fontSize: 14, padding: "12px 40px", borderRadius: 8,
                cursor: "pointer", letterSpacing: "0.2em", textTransform: "uppercase",
                transition: "all 0.2s", boxShadow: "0 0 12px rgba(255,106,44,0.3)",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,106,44,0.12)"; e.currentTarget.style.boxShadow = "0 0 24px rgba(255,106,44,0.6)"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.boxShadow = "0 0 12px rgba(255,106,44,0.3)"; }}
            >
              Continue Trading
            </button>
          )}`
);

fs.writeFileSync(path, src, 'utf8');
console.log('✓ Done');
