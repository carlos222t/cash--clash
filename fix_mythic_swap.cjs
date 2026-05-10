const fs = require('fs');
const path = 'src/pages/CryptoPackOpener.jsx';
let src = fs.readFileSync(path, 'utf8');

// Add showTWC state and update handleCardClick to set it after 1s
src = src.replace(
  `  const [mythicPhase, setMythicPhase] = useState('idle'); // idle | zooming | crashed

  const handleCardClick = () => {
    if (!showOpenMe || flipped || mythicPhase !== 'idle') return;
    setMythicPhase('zooming');
    setTimeout(() => {
      setMythicPhase('crashed');
      setFlipped(true);
      setTimeout(() => setShowContinue(true), 1000);
    }, 900);
  };`,
  `  const [mythicPhase, setMythicPhase] = useState('idle');
  const [showTWC, setShowTWC] = useState(false);

  const handleCardClick = () => {
    if (!showOpenMe || flipped || mythicPhase !== 'idle') return;
    setMythicPhase('zooming');
    setTimeout(() => setShowTWC(true), 1000);
    setTimeout(() => {
      setMythicPhase('crashed');
      setFlipped(true);
      setTimeout(() => setShowContinue(true), 1000);
    }, 900);
  };`
);

// Use showTWC to swap the back face image
src = src.replace(
  `                <img src="/mythiccard.png" alt="Mythic" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", borderRadius: 10 }} />`,
  `                <img src={showTWC ? "/cards/TotalWorldControl.png" : "/mythiccard.png"} alt="Mythic" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", borderRadius: 10, transition: "opacity 0.3s" }} />`
);

fs.writeFileSync(path, src, 'utf8');
console.log('✓ Done');
