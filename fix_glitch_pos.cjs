const fs = require('fs');
const path = 'src/pages/CryptoPackOpener.jsx';
let src = fs.readFileSync(path, 'utf8');

src = src.replace(
  `      position: "fixed", inset: 0, zIndex: 15, pointerEvents: "none",
      overflow: "hidden",`,
  `      position: "fixed", left: "50%", top: "50%", zIndex: 15, pointerEvents: "none",
      transform: "translate(-50%, -50%)",
      width: 288, height: 384,`
);

src = src.replace(
  `        style={{
          position: "absolute", left: "50%", top: "50%",
          transform: "translate(-50%, -50%)",
          width: 288, height: 384, objectFit: "cover", borderRadius: 12,
          animation: "cpo-twc-glitch 0.38s steps(2) both",
        }}`,
  `        style={{
          width: "100%", height: "100%", objectFit: "cover", borderRadius: 12,
          animation: "cpo-twc-glitch 0.38s steps(2) both",
        }}`
);

fs.writeFileSync(path, src, 'utf8');
console.log('✓ Done');
