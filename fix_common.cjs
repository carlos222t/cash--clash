const fs = require('fs');
const path = 'src/pages/CryptoPackOpener.jsx';
let src = fs.readFileSync(path, 'utf8');

src = src.replace(
  `    <div className={\`cpo-vignette-in\${isFancy ? " cpo-screen-shake" : ""}\`}
      style={{ position: "fixed", inset: 0, zIndex: 9999, display: "flex",
        alignItems: "center", justifyContent: "center", padding: 16, background: bgColor }}>`,
  `    <div className={\`cpo-vignette-in\${isFancy ? " cpo-screen-shake" : ""}\`}
      style={{ display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", padding: 16,
        background: "transparent", width: "100%" }}>`
);

fs.writeFileSync(path, src, 'utf8');
console.log('✓ Done');
