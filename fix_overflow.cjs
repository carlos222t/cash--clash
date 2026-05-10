const fs = require('fs');
const path = 'src/pages/CryptoPackOpener.jsx';
let src = fs.readFileSync(path, 'utf8');

src = src.replace(
  `background: "linear-gradient(160deg, #1c1800, #0c0c10)", overflow: "hidden", boxShadow: "0 0 50px "+meta.glow+", inset 0 0 35px "+meta.glow }}>`,
  `background: "linear-gradient(160deg, #1c1800, #0c0c10)", boxShadow: "0 0 50px "+meta.glow+", inset 0 0 35px "+meta.glow }}>`,
);

fs.writeFileSync(path, src, 'utf8');
console.log('✓ Fixed');
