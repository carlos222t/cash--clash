const fs = require('fs');
const path = 'src/pages/CryptoPackOpener.jsx';
let src = fs.readFileSync(path, 'utf8');

src = src.replace(
  'setTimeout(() => setShowTWC(true), 1000);',
  'setTimeout(() => setShowTWC(true), 900);'
);

fs.writeFileSync(path, src, 'utf8');
console.log('✓ Done');
