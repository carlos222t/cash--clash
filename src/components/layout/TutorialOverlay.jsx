import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useTutorial } from '@/lib/TutorialContext';
import { ChevronRight, ChevronLeft, X } from 'lucide-react';

function useElementRect(targetId, active) {
  const [rect, setRect] = useState(null);
  const rafRef = useRef(null);

  const measure = useCallback(() => {
    if (!targetId || !active) { setRect(null); return; }
    const el = document.querySelector(`[data-tutorial="${targetId}"]`);
    if (el) {
      const r = el.getBoundingClientRect();
      setRect({ top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right });
    } else {
      setRect(null);
    }
  }, [targetId, active]);

  useEffect(() => {
    if (!active) { setRect(null); return; }
    // Poll until the element appears (handles page navigation delay)
    let tries = 0;
    const poll = () => {
      tries++;
      const el = document.querySelector(`[data-tutorial="${targetId}"]`);
      if (el) {
        const r = el.getBoundingClientRect();
        setRect({ top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right });
      } else if (tries < 30) {
        rafRef.current = setTimeout(poll, 100);
      }
    };
    poll();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, true);
    return () => {
      clearTimeout(rafRef.current);
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure, true);
    };
  }, [targetId, active, measure]);

  return rect;
}

const PAD = 8; // spotlight padding

function getTooltipStyle(rect, side, vw, vh, anchor) {
  if (!rect) return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };

  const TW = 300; // tooltip width
  const TH = 160; // approx tooltip height
  const margin = 20;

  switch (side) {
    case 'right': {
      let top;
      if (anchor === 'top') {
        // Pin tooltip near top of viewport, regardless of target position
        top = Math.min(rect.top, vh * 0.25);
        top = Math.max(margin, top);
      } else {
        top = rect.top + rect.height / 2 - TH / 2;
        top = Math.max(margin, Math.min(vh - TH - margin, top));
      }
      let left = rect.right + PAD + 16;
      if (left + TW > vw - margin) left = rect.left - TW - PAD - 16;
      return { top, left };
    }
    case 'bottom': {
      let top = rect.bottom + PAD + 16;
      if (top + TH > vh - margin) top = rect.top - TH - PAD - 16;
      let left = rect.left + rect.width / 2 - TW / 2;
      left = Math.max(margin, Math.min(vw - TW - margin, left));
      return { top, left };
    }
    case 'left': {
      let top = rect.top + rect.height / 2 - TH / 2;
      top = Math.max(margin, Math.min(vh - TH - margin, top));
      let left = rect.left - TW - PAD - 16;
      if (left < margin) left = rect.right + PAD + 16;
      return { top, left };
    }
    case 'top': {
      let top = rect.top - TH - PAD - 16;
      if (top < margin) top = rect.bottom + PAD + 16;
      let left = rect.left + rect.width / 2 - TW / 2;
      left = Math.max(margin, Math.min(vw - TW - margin, left));
      return { top, left };
    }
    default:
      return { top: '50%', left: '50%', transform: 'translate(-50%,-50%)' };
  }
}

function ArrowSVG({ rect, tooltipPos, side }) {
  if (!rect || !tooltipPos || typeof tooltipPos.top !== 'number') return null;

  const TW = 300;
  const TH = 160;

  // Arrow from tooltip edge to spotlight edge
  let x1, y1, x2, y2;
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  const tx = tooltipPos.left + TW / 2;
  const ty = tooltipPos.top + TH / 2;

  switch (side) {
    case 'right':
      x1 = tooltipPos.left;
      y1 = ty;
      x2 = rect.right + PAD;
      y2 = cy;
      break;
    case 'bottom':
      x1 = tx;
      y1 = tooltipPos.top;
      x2 = cx;
      y2 = rect.bottom + PAD;
      break;
    case 'left':
      x1 = tooltipPos.left + TW;
      y1 = ty;
      x2 = rect.left - PAD;
      y2 = cy;
      break;
    case 'top':
      x1 = tx;
      y1 = tooltipPos.top + TH;
      x2 = cx;
      y2 = rect.top - PAD;
      break;
    default:
      return null;
  }

  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const path = `M ${x1} ${y1} Q ${mx} ${y1} ${x2} ${y2}`;

  // arrowhead
  const angle = Math.atan2(y2 - my, x2 - mx);
  const al = 10;
  const ax1 = x2 - al * Math.cos(angle - 0.4);
  const ay1 = y2 - al * Math.sin(angle - 0.4);
  const ax2 = x2 - al * Math.cos(angle + 0.4);
  const ay2 = y2 - al * Math.sin(angle + 0.4);

  return (
    <svg
      style={{ position: 'fixed', inset: 0, width: '100vw', height: '100vh', pointerEvents: 'none', zIndex: 9998 }}
    >
      <defs>
        <filter id="glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <motion.path
        d={path}
        stroke="hsl(var(--primary))"
        strokeWidth="2.5"
        fill="none"
        strokeDasharray="6 4"
        filter="url(#glow)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      />
      <motion.polygon
        points={`${x2},${y2} ${ax1},${ay1} ${ax2},${ay2}`}
        fill="hsl(var(--primary))"
        filter="url(#glow)"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      />
    </svg>
  );
}

export default function TutorialOverlay() {
  const { active, stop, next, prev, stepIdx, currentStep, totalSteps } = useTutorial();
  const navigate = useNavigate();
  const [vw, setVw] = useState(window.innerWidth);
  const [vh, setVh] = useState(window.innerHeight);

  useEffect(() => {
    const onResize = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Navigate to the right route when step changes
  useEffect(() => {
    if (active && currentStep?.route) {
      navigate(currentStep.route);
    }
  }, [active, stepIdx, currentStep?.route]);

  const rect = useElementRect(active ? currentStep?.target : null, active);
  const tooltipPos = rect ? getTooltipStyle(rect, currentStep?.tooltipSide, vw, vh, currentStep?.tooltipAnchor) : null;

  if (!active) return null;

  const spotTop = rect ? rect.top - PAD : -9999;
  const spotLeft = rect ? rect.left - PAD : -9999;
  const spotW = rect ? rect.width + PAD * 2 : 0;
  const spotH = rect ? rect.height + PAD * 2 : 0;

  return (
    <>
      {/* Dark overlay with cutout */}
      <div
        style={{
          position: 'fixed', inset: 0, zIndex: 9990, pointerEvents: 'none',
          background: 'rgba(0,0,0,0.65)',
        }}
      >
        {/* SVG cutout spotlight */}
        {rect && (
          <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
            <defs>
              <mask id="spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={spotLeft} y={spotTop}
                  width={spotW} height={spotH}
                  rx="10" ry="10"
                  fill="black"
                />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.65)" mask="url(#spotlight-mask)" />
          </svg>
        )}
      </div>

      {/* Glow ring around target */}
      {rect && (
        <motion.div
          key={currentStep?.id + '-glow'}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            position: 'fixed',
            top: spotTop - 3,
            left: spotLeft - 3,
            width: spotW + 6,
            height: spotH + 6,
            borderRadius: 13,
            zIndex: 9991,
            pointerEvents: 'none',
            boxShadow: '0 0 0 3px hsl(var(--primary)), 0 0 24px 6px hsl(var(--primary) / 0.5)',
            animation: 'tutorialPulse 1.8s ease-in-out infinite',
          }}
        />
      )}

      {/* Arrow */}
      {rect && tooltipPos && (
        <ArrowSVG rect={rect} tooltipPos={tooltipPos} side={currentStep?.tooltipSide} />
      )}

      {/* Tooltip card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep?.id}
          initial={{ opacity: 0, scale: 0.92, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 8 }}
          transition={{ duration: 0.25 }}
          style={{
            position: 'fixed',
            top: tooltipPos?.top ?? '50%',
            left: tooltipPos?.left ?? '50%',
            transform: tooltipPos?.transform,
            width: 300,
            zIndex: 9999,
          }}
          className="bg-sidebar border border-primary/40 rounded-2xl shadow-2xl shadow-primary/20 p-5 select-none"
        >
          {/* Progress bar */}
          <div className="h-1 bg-sidebar-accent rounded-full mb-4 overflow-hidden">
            <motion.div
              className="h-full bg-primary rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((stepIdx + 1) / totalSteps) * 100}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>

          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1">
              <p className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">
                Step {stepIdx + 1} of {totalSteps}
              </p>
              <h3 className="font-heading font-bold text-sidebar-foreground text-sm leading-tight">
                {currentStep?.title}
              </h3>
            </div>
            <button
              onClick={stop}
              className="text-sidebar-foreground/30 hover:text-sidebar-foreground transition-colors flex-shrink-0 mt-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-sidebar-foreground/70 leading-relaxed mb-4">
            {currentStep?.desc}
          </p>

          {/* Step dots */}
          <div className="flex items-center gap-1 mb-4">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === stepIdx ? 16 : 6,
                  height: 6,
                  background: i <= stepIdx ? 'hsl(var(--primary))' : 'hsl(var(--sidebar-accent))',
                }}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex gap-2">
            {stepIdx > 0 && (
              <button
                onClick={prev}
                className="flex items-center gap-1 text-xs text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors px-3 py-1.5 rounded-lg hover:bg-sidebar-accent"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Back
              </button>
            )}
            <button
              onClick={next}
              className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold bg-primary text-primary-foreground px-4 py-2 rounded-xl hover:bg-primary/90 transition-colors"
              style={{ boxShadow: '0 0 16px hsl(var(--primary) / 0.4)' }}
            >
              {currentStep?.final ? '🎉 Done!' : (<>Next <ChevronRight className="w-3.5 h-3.5" /></>)}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Pulse keyframe injected once */}
      <style>{`
        @keyframes tutorialPulse {
          0%, 100% { box-shadow: 0 0 0 3px hsl(var(--primary)), 0 0 20px 4px hsl(var(--primary) / 0.4); }
          50%       { box-shadow: 0 0 0 4px hsl(var(--primary)), 0 0 32px 10px hsl(var(--primary) / 0.6); }
        }
      `}</style>
    </>
  );
}