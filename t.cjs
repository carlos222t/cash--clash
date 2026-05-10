const fs = require('fs');
const p = 'src/pages/CryptoPackOpener.jsx';
let s = fs.readFileSync(p, 'utf8');
s = s.replace('setTimeout(() => setShowCardFace(true), 700);', 'setTimeout(() => setShowCardFace(true), 900);');
fs.writeFileSync(p, s, 'utf8');
console.log('✓');
