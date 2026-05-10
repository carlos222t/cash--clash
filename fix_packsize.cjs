const fs = require('fs');
const path = 'src/pages/CryptoPackOpener.jsx';
let src = fs.readFileSync(path, 'utf8');

src = src.replace(
  `        width: 220, height: 'auto',`,
  `        width: 340, height: 'auto',`
);

fs.writeFileSync(path, src, 'utf8');
console.log('✓ Done');
