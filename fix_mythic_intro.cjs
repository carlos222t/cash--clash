const fs = require('fs');
const path = 'src/pages/CryptoPackOpener.jsx';
let src = fs.readFileSync(path, 'utf8');

src = src.replace(
  `<img src="/cards/TotalWorldControl.png" alt="Total World Control" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", borderRadius: 10 }} />`,
  `<img src="/mythiccard.png" alt="Mythic" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", borderRadius: 10 }} />`
);

fs.writeFileSync(path, src, 'utf8');
console.log('✓ Done');
