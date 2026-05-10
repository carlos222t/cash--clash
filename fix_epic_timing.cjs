const fs = require('fs');
const path = 'src/pages/CryptoPackOpener.jsx';
let src = fs.readFileSync(path, 'utf8');

src = src.replace(
  'setTimeout(() => setShowCardFace(true), 600);',
  'setTimeout(() => setShowCardFace(true), 550);'
);

fs.writeFileSync(path, src, 'utf8');
console.log('✓ Done');
