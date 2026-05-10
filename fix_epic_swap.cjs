const fs = require('fs');
const path = 'src/pages/CryptoPackOpener.jsx';
let src = fs.readFileSync(path, 'utf8');

// Add showCardFace state and trigger at 0.6s in epic handleReveal
src = src.replace(
  `  const [revealPhase, setRevealPhase] = useState('idle');

  const handleReveal = () => {
    if (revealPhase !== 'idle') return;
    setRevealPhase('lifting');
    setDancing(false);
    setTimeout(() => {
      setRevealPhase('crashing');
      setTimeout(() => {
        setFlipped(true);
        setRevealPhase('done');
        setTimeout(() => setShowContinue(true), 800);
      }, 900);
    }, 1000);
  };`,
  `  const [revealPhase, setRevealPhase] = useState('idle');
  const [showCardFace, setShowCardFace] = useState(false);

  const handleReveal = () => {
    if (revealPhase !== 'idle') return;
    setRevealPhase('lifting');
    setDancing(false);
    setTimeout(() => setShowCardFace(true), 600);
    setTimeout(() => {
      setRevealPhase('crashing');
      setTimeout(() => {
        setFlipped(true);
        setRevealPhase('done');
        setTimeout(() => setShowContinue(true), 800);
      }, 900);
    }, 1000);
  };`
);

// Use showCardFace to swap the epic back face image
src = src.replace(
  `                <img src="/epiccard.png" alt="Epic" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", borderRadius: 10 }} />`,
  `                <img src={showCardFace ? card.image : "/epiccard.png"} alt="Epic" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", borderRadius: 10, transition: "opacity 0.3s" }} />`
);

fs.writeFileSync(path, src, 'utf8');
console.log('✓ Done');
