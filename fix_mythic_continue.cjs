const fs = require('fs');
const path = 'src/pages/CryptoPackOpener.jsx';
let src = fs.readFileSync(path, 'utf8');

// Remove the continue trading button entirely from mythic
src = src.replace(
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
          )}
        </div>
      )}
    </div>
  );
}`,
  `        </div>
      )}
    </div>
  );
}`
);

// Center the card container
src = src.replace(
  `        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 28 }}>`,
  `        <div style={{ position: "relative", zIndex: 10, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 28, minHeight: "100vh" }}>`
);

fs.writeFileSync(path, src, 'utf8');
console.log('✓ Done');
