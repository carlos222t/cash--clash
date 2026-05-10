const fs = require('fs');
const path = 'src/pages/CryptoPackOpener.jsx';
let src = fs.readFileSync(path, 'utf8');

src = src.replace(
  `    xl: { width: 380, height: 506 },`,
  `    xl: { width: 288, height: 384 },`
);

fs.writeFileSync(path, src, 'utf8');
console.log('✓ Reverted');
