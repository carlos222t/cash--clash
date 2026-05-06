import { useState } from 'react';

const motion = ({ children, ...props }) => <div {...props}>{children}</div>;
const AnimatePresence = ({ children }) => <>{children}</>;

// ─── SHADCN / UI MOCKS INLINE ─────────────────────────────────────────────
const Card = ({ className, children, ...props }) => (
  <div className={`rounded-xl border border-slate-800 bg-[#0b1320] text-slate-100 shadow-xl transition-all hover:border-[#1a365d] ${className}`} {...props}>{children}</div>
);
const CardHeader = ({ className, children, ...props }) => (
  <div className={`flex flex-col space-y-1.5 p-6 ${className}`} {...props}>{children}</div>
);
const CardTitle = ({ className, children, ...props }) => (
  <h3 className={`text-2xl font-semibold leading-none tracking-tight text-white ${className}`} {...props}>{children}</h3>
);
const CardContent = ({ className, children, ...props }) => (
  <div className={`p-6 pt-0 ${className}`} {...props}>{children}</div>
);
const Button = ({ className, variant, size, children, ...props }) => {
  let baseStyle = "inline-flex items-center justify-center rounded text-sm font-bold tracking-wide uppercase transition-colors focus-visible:outline-none cursor-pointer ";
  let variantStyle = "bg-[#c19a49] text-black hover:bg-[#b08938] shadow ";
  if (variant === "ghost") variantStyle = "hover:bg-slate-800 hover:text-white bg-transparent shadow-none ";
  if (variant === "outline") variantStyle = "border border-[#c19a49] text-[#c19a49] bg-transparent hover:bg-[#c19a49] hover:text-black ";
  if (variant === "destructive") variantStyle = "bg-red-600 text-slate-50 hover:bg-red-600/90 shadow-sm ";
  let sizeStyle = "h-11 px-6 py-2 ";
  if (size === "sm") sizeStyle = "h-9 rounded px-3 text-xs ";
  if (size === "lg") sizeStyle = "h-12 rounded px-8 text-base ";
  return (
    <button className={`${baseStyle} ${variantStyle} ${sizeStyle} ${className}`} {...props}>{children}</button>
  );
};
const Progress = ({ value, className, ...props }) => (
  <div className={`relative h-2.5 w-full overflow-hidden rounded-full bg-slate-800 ${className}`} {...props}>
    <div className="h-full w-full flex-1 bg-[#c19a49] transition-all" style={{ transform: `translateX(-${100 - (value || 0)}%)` }} />
  </div>
);
const Badge = ({ className, variant, children, ...props }) => {
  let variantStyle = "bg-slate-800 text-slate-100 border-slate-700 ";
  if (variant === "outline") variantStyle = "text-slate-200 border border-slate-700 ";
  if (variant === "secondary") variantStyle = "bg-slate-900 text-slate-300 ";
  return (
    <div className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors ${variantStyle} ${className}`} {...props}>{children}</div>
  );
};

// ─── SVG ICONS ───────────────────────────────────────────────────────────
const BookOpen = () => <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>;
const CheckCircle2 = () => <svg className="w-4 h-4 text-[#c19a49]" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>;
const ChevronRight = () => <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
const ChevronLeft = () => <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const Trophy = () => <svg className="w-12 h-12 text-[#c19a49]" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;
const XCircle = () => <svg className="w-12 h-12 text-red-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>;
const Sparkles = () => <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>;

// ─── 8 CATEGORY COURSE ICONS ──────────────────────────────────────────────
const ChapterIcon = ({ id }) => {
  const base = "w-10 h-10 stroke-[#c19a49] text-[#c19a49] stroke-[1.5] flex-shrink-0 mb-4";
  switch (id) {
    case 'ch1': return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/><circle cx="12" cy="12" r="10" strokeWidth="2" opacity="0.2"/></svg>;
    case 'ch2': return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 20V10M18 20V4M6 20v-4"/><path d="M3 20h18" strokeWidth="2"/></svg>;
    case 'ch3': return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20M7 8h10M7 12h4"/></svg>;
    case 'ch4': return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 3v12M5 11v10M12 7v14M3 3l18 18"/></svg>;
    case 'ch5': return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>;
    case 'ch6': return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="8" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><circle cx="18" cy="4" r="2"/></svg>;
    case 'ch7': return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 21h18M3 10h18M5 6h14M4 10v11M20 10v11"/><path d="M9 14h2v3H9zm4 0h2v3h-2z"/></svg>;
    case 'ch8': return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="M9.5 8h4a2.5 2.5 0 0 1 0 5h-4 4a2.5 2.5 0 0 1 0 5h-4M9.5 6v12"/></svg>;
    default: return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/></svg>;
  }
};

// ─── COMPLETE COURSE DATA ────────────────────────────────────────────────
const COURSE = {
  id: 'wealth-mastery-suite',
  title: 'MASTER YOUR MONEY:',
  subtitle: 'A Comprehensive Path to Financial Success',
  meta: 'Professional Finance Course | 8 Core Chapters | Accredited Certification',
  chapters: [
    {
      id: 'ch1', title: 'Financial Foundations', description: 'Intro to Accounting & Budgeting',
      lessons: [{ id: 'ch1-l1', title: 'The Psychological Foundation', content: `Wealth is not about how much money you earn; it is about how much money you keep.\n          \n**Key Concepts:**\n- **Income vs. Net Worth:** Income is temporary cash flow. Net worth is real equity.\n- **Delayed Gratification:** Sacrifice lifestyle creep today to buy back your personal time tomorrow.` }],
      quiz: [{ q: 'What is the true measure of economic power?', options: ['Monthly income', 'Gross revenue', 'Net worth (Assets minus Liabilities)', 'Total spending power'], answer: 2 }]
    },
    {
      id: 'ch2', title: 'Investing Basics', description: 'Equities, Bonds & Diversification',
      lessons: [{ id: 'ch2-l1', title: 'Market Allocation', content: `Deploying capital intelligently across diversified assets removes human emotional error from long-term wealth building.` }],
      quiz: [{ q: 'What does an index fund offer?', options: ['Fixed Returns', 'Broad market diversification', 'Tax elimination', 'Zero risk'], answer: 1 }]
    },
    {
      id: 'ch3', title: 'Wealth Management', description: 'Planning, Asset Allocation & Goals',
      lessons: [{ id: 'ch3-l1', title: 'Managing High-Value Assets', content: `Structuring portfolios correctly using tax-advantaged buckets and asset correlation avoids massive capital drawdowns during market corrections.` }],
      quiz: [{ q: 'What is asset allocation?', options: ['Picking one high-growth stock', 'Spreading investments across asset classes', 'Paying off all your debt', 'Leaving money in savings'], answer: 1 }]
    },
    {
      id: 'ch4', title: 'Advanced Trading', description: 'Technical Analysis & Risk Management',
      lessons: [{ id: 'ch4-l1', title: 'Advanced Concepts', content: `Analyze market cycles using technical metrics while strictly enforcing 1% to 2% max portfolio risk on individual market entries.` }],
      quiz: [{ q: 'What is technical analysis primarily based on?', options: ['Corporate earnings reports', 'Market price action and volume history', 'Macroeconomic tax levels', 'Company executive statements'], answer: 1 }]
    },
    {
      id: 'ch5', title: 'Tax & Estate Planning', description: 'Structuring Assets & Compliance',
      lessons: [{ id: 'ch5-l1', title: 'Legal Tax Frameworks', content: `Leverage trusts, family limited partnerships, and optimal legal entity filings to reduce estate tax exposure and preserve assets for your family.` }],
      quiz: [{ q: 'Which legal structure helps avoid direct probate delays?', options: ['A traditional bank checking account', 'A revocable living trust', 'An unsecured personal loan', 'A retail credit card file'], answer: 1 }]
    },
    {
      id: 'ch6', title: 'Retirement Planning', description: 'Building Wealth for Your Future',
      lessons: [{ id: 'ch6-l1', title: 'Long-term Growth Vehicles', content: `Retirement is a mathematical milestone. Work becomes completely optional once your investments generate passive cash flow that exceeds your living expenses.` }],
      quiz: [{ q: 'What is the 4% Rule target?', options: ['Having 25x your annual expenses in your portfolio', 'Retiring at age 40', 'Saving 4% of your paycheck', 'Using 4 credit cards at a time'], answer: 0 }]
    },
    {
      id: 'ch7', title: 'Corporate Finance', description: 'Valuations & Capital Budgeting',
      lessons: [{ id: 'ch7-l1', title: 'Optimizing Enterprise Value', content: `Learn to calculate Discounted Cash Flow (DCF), analyze corporate capital structures, and optimize debt-to-equity ratios for growth.` }],
      quiz: [{ q: 'What does WACC represent in enterprise finance?', options: ['Weekly Asset Cost Comparison', 'Weighted Average Cost of Capital', 'Wealth Allocation & Cash Control', 'Workplace Asset Credit Ceiling'], answer: 1 }]
    },
    {
      id: 'ch8', title: 'Crypto & Digital Assets', description: 'Fundamentals & Web3 Investments',
      lessons: [{ id: 'ch8-l1', title: 'Decentralized Finance', content: `Evaluate core blockchain network parameters, explore smart contract functionality, and integrate crypto as a volatile, non-correlated asset class.` }],
      quiz: [{ q: 'What makes a public blockchain secure?', options: ['A centralized legal trust', 'Decentralized cryptographic consensus', 'Corporate management protocols', 'Government oversight'], answer: 1 }]
    }
  ]
};

export default function CourseApp() {
  const [activeTab, setActiveTab] = useState('curriculum');
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [quizState, setQuizState] = useState(null);
  const [completedChapters, setCompletedChapters] = useState({});

  const openChapter = (chapter) => {
    setSelectedChapter(chapter);
    setActiveLesson(chapter.lessons[0]);
    setQuizState(null);
    setActiveTab('curriculum');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const closeChapter = () => {
    setSelectedChapter(null);
    setActiveLesson(null);
    setQuizState(null);
  };

  const triggerQuiz = () => {
    setQuizState({ currentIndex: 0, answers: {}, isFinished: false, score: 0 });
  };

  const handleAnswerSelect = (optionIndex) => {
    if (!quizState || quizState.isFinished) return;
    setQuizState(prev => ({ ...prev, answers: { ...prev.answers, [prev.currentIndex]: optionIndex } }));
  };

  const nextQuizQuestion = () => {
    const isLast = quizState.currentIndex === selectedChapter.quiz.length - 1;
    if (isLast) {
      let finalScore = 0;
      selectedChapter.quiz.forEach((q, idx) => { if (quizState.answers[idx] === q.answer) finalScore++; });
      const passed = finalScore >= selectedChapter.quiz.length * 0.7;
      setQuizState(prev => ({ ...prev, isFinished: true, score: finalScore }));
      if (passed) setCompletedChapters(prev => ({ ...prev, [selectedChapter.id]: true }));
    } else {
      setQuizState(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
    }
  };

  const restartQuiz = () => triggerQuiz();

  return (
    <div className="min-h-screen bg-[#050b14] text-slate-100 font-sans antialiased pb-16 selection:bg-[#c19a49] selection:text-black">



      {/* ─── MAIN APP WORKSPACE ─── */}
      <main className="max-w-6xl mx-auto px-4 mt-12">
        {selectedChapter ? (

          /* ═══════════════════════════════════════════════════════════════
             LEARN / CHAPTER VIEW  —  dashboard-style colours, boxes, fonts
             Everything else (layout grid, logic, structure) is untouched
          ═══════════════════════════════════════════════════════════════ */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">

            {/* LEFT LESSON PANEL */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              {/* Back button */}
              <button
                onClick={closeChapter}
                className="self-start flex items-center gap-1.5 text-sm font-medium text-zinc-400 hover:text-white transition-colors mb-2"
              >
                <ChevronLeft /> Back to Chapters
              </button>

              {/* Sidebar panel — dashboard-style box */}
              <div className="rounded-lg border border-zinc-800 bg-zinc-900 overflow-hidden">
                {/* Header strip */}
                <div className="px-4 pt-4 pb-3 border-b border-zinc-800">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold mb-0.5">Current Chapter</p>
                  <h3 className="text-sm font-bold text-white leading-snug">{selectedChapter.title}</h3>
                </div>

                {/* Lesson list */}
                <div className="p-2">
                  <p className="text-[10px] uppercase tracking-widest text-zinc-500 font-semibold px-2 py-1.5">Lessons</p>
                  {selectedChapter.lessons.map((lesson) => {
                    const isActive = activeLesson?.id === lesson.id && !quizState;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => { setActiveLesson(lesson); setQuizState(null); }}
                        className={`w-full flex items-center gap-2.5 p-2.5 text-left rounded-md transition-all text-xs font-medium ${
                          isActive
                            ? 'bg-indigo-600/20 text-indigo-300 border-l-2 border-indigo-500'
                            : 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200'
                        }`}
                      >
                        <BookOpen />
                        <span className="truncate">{lesson.title}</span>
                      </button>
                    );
                  })}

                  {/* Quiz trigger */}
                  <div className="px-2 pt-2 mt-1 border-t border-zinc-800">
                    <button
                      onClick={triggerQuiz}
                      className={`w-full flex items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold tracking-wide uppercase transition-colors ${
                        quizState
                          ? 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                          : 'bg-indigo-600 text-white hover:bg-indigo-500'
                      }`}
                    >
                      <Sparkles /> {quizState ? 'Active Evaluation' : 'Review & Take Quiz'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* MAIN CONTENT PANEL */}
            <div className="lg:col-span-8">
              {/* Dashboard-style content box */}
              <div className="min-h-[480px] flex flex-col rounded-lg border border-zinc-800 bg-zinc-900 shadow-xl p-8 relative">

                {quizState ? (
                  /* ── QUIZ ── */
                  <div className="flex flex-col flex-1">
                    {!quizState.isFinished ? (
                      <>
                        <div className="flex justify-between items-center mb-6">
                          {/* Badge — dashboard rounded-md style */}
                          <span className="inline-flex items-center rounded-md border border-zinc-700 bg-transparent px-2.5 py-0.5 text-xs font-semibold text-zinc-400">
                            Evaluation Mode
                          </span>
                          <span className="text-xs font-mono font-bold tracking-wider text-zinc-500">
                            Question {quizState.currentIndex + 1} of {selectedChapter.quiz.length}
                          </span>
                        </div>

                        {/* Thin indigo progress bar */}
                        <div className="relative h-1.5 w-full overflow-hidden rounded-full bg-zinc-800 mb-8">
                          <div
                            className="h-full bg-indigo-500 transition-all duration-500"
                            style={{ width: `${((quizState.currentIndex + 1) / selectedChapter.quiz.length) * 100}%` }}
                          />
                        </div>

                        <div className="flex-1">
                          <h3 className="text-lg font-semibold text-white mb-6 leading-snug">
                            {selectedChapter.quiz[quizState.currentIndex].q}
                          </h3>

                          <div className="grid grid-cols-1 gap-2.5">
                            {selectedChapter.quiz[quizState.currentIndex].options.map((opt, oIdx) => {
                              const isSelected = quizState.answers[quizState.currentIndex] === oIdx;
                              return (
                                <button
                                  key={oIdx}
                                  onClick={() => handleAnswerSelect(oIdx)}
                                  className={`p-4 rounded-lg text-left text-sm border transition-all ${
                                    isSelected
                                      ? 'bg-indigo-600/20 border-indigo-500 text-white font-medium ring-1 ring-indigo-500/40'
                                      : 'bg-zinc-800/50 border-zinc-700/60 text-zinc-300 hover:border-zinc-600 hover:text-white'
                                  }`}
                                >
                                  {/* Letter label */}
                                  <span className={`inline-flex w-5 h-5 rounded-full border text-xs items-center justify-center mr-3 font-bold ${
                                    isSelected ? 'border-indigo-400 text-indigo-300' : 'border-zinc-600 text-zinc-500'
                                  }`}>
                                    {String.fromCharCode(65 + oIdx)}
                                  </span>
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex justify-end pt-6">
                          <button
                            onClick={nextQuizQuestion}
                            disabled={quizState.answers[quizState.currentIndex] === undefined}
                            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-indigo-500 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {quizState.currentIndex === selectedChapter.quiz.length - 1 ? 'Submit Exam' : 'Proceed'}
                            <ChevronRight />
                          </button>
                        </div>
                      </>
                    ) : (
                      /* RESULT SCREEN */
                      <div className="flex flex-col items-center justify-center flex-1 text-center py-6 animate-fadeIn">
                        {quizState.score >= selectedChapter.quiz.length * 0.7 ? (
                          <>
                            <Trophy />
                            <h3 className="text-2xl font-bold text-white mt-4 mb-2">Evaluation Passed!</h3>
                            <p className="text-zinc-400 mb-1 text-sm">
                              Score: <span className="text-white font-semibold">{quizState.score}/{selectedChapter.quiz.length}</span>
                            </p>
                            <p className="text-zinc-500 text-xs mb-6 max-w-sm">You have proven mastery over this chapter. Progress has been recorded.</p>
                            <span className="inline-flex items-center rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-400 mb-6">
                              ✓ Chapter Complete
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle />
                            <h3 className="text-2xl font-bold text-white mt-4 mb-2">Try Again</h3>
                            <p className="text-zinc-400 mb-1 text-sm">
                              Score: <span className="text-white font-semibold">{quizState.score}/{selectedChapter.quiz.length}</span>
                            </p>
                            <p className="text-zinc-500 text-xs mb-6 max-w-sm">A minimum score of 70% is required to secure the chapter credits.</p>
                          </>
                        )}
                        <div className="flex gap-3">
                          <button
                            onClick={restartQuiz}
                            className="inline-flex items-center rounded-md border border-zinc-700 bg-transparent px-4 py-2 text-xs font-bold uppercase tracking-wide text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                          >
                            Retake Evaluation
                          </button>
                          <button
                            onClick={closeChapter}
                            className="inline-flex items-center rounded-md bg-indigo-600 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-indigo-500 transition-colors"
                          >
                            Return to Grid
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : activeLesson ? (
                  /* ── LESSON CONTENT ── */
                  <div className="flex flex-col flex-1 animate-fadeIn">
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-zinc-800">
                      <span className="inline-flex items-center rounded-md border border-zinc-700 bg-transparent px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                        Financial Academy Module
                      </span>
                      <span className="text-xs text-zinc-500">Lesson 1 of {selectedChapter.lessons.length}</span>
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-6 leading-tight">
                      {activeLesson.title}
                    </h2>

                    <div className="flex-1 text-zinc-300 leading-relaxed text-sm space-y-3 max-w-none">
                      {activeLesson.content.split('\n').map((para, i) => {
                        if (para.startsWith('**Key Concepts:**')) {
                          return <h4 key={i} className="text-sm font-semibold text-indigo-400 pt-4 mb-1">{para.replace(/\*\*/g, '')}</h4>;
                        }
                        if (para.startsWith('- **')) {
                          const boldPart = para.match(/\*\*([^*]+)\*\*/)?.[1];
                          const normalPart = para.split('**')[2];
                          return (
                            <li key={i} className="ml-4 list-disc text-zinc-300 text-sm">
                              <span className="font-semibold text-white">{boldPart}</span>
                              {normalPart}
                            </li>
                          );
                        }
                        return para.trim() ? <p key={i} className="text-zinc-300 text-sm leading-relaxed mb-3">{para}</p> : null;
                      })}
                    </div>

                    <div className="flex justify-end mt-8 pt-5 border-t border-zinc-800">
                      <button
                        onClick={triggerQuiz}
                        className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wide text-white hover:bg-indigo-500 transition-colors"
                      >
                        Module Evaluation <ChevronRight />
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>

        ) : (

          /* ═══════════════════════════════════════════════════════════════
             CHAPTER GRID — completely untouched, original code
          ═══════════════════════════════════════════════════════════════ */
          <div className="space-y-12 pb-16">
            <div className="text-center">
              <h2 className="text-3xl md:text-4xl font-extrabold tracking-wider text-white uppercase mb-2 font-serif">
                Course Chapters
              </h2>
              <div className="w-24 h-1 bg-[#c19a49] mx-auto mb-10"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {COURSE.chapters.map((chapter, idx) => {
                const isComplete = completedChapters[chapter.id];
                return (
                  <Card
                    key={chapter.id}
                    className="flex flex-col justify-between p-6 bg-[#0b1320] border-slate-800 hover:border-[#1a365d] transition-all duration-300 group hover:shadow-2xl relative min-h-[300px]"
                  >
                    <div className="flex flex-col flex-1 h-full">
                      <ChapterIcon id={chapter.id} />
                      <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                        {idx + 1}. {chapter.title}
                      </span>
                      <p className="text-sm text-slate-400 font-medium leading-normal mb-6 flex-grow">
                        {chapter.description}
                      </p>
                      <button
                        onClick={() => openChapter(chapter)}
                        className="text-xs uppercase tracking-widest font-extrabold text-white flex items-center justify-between mt-auto group-hover:text-[#c19a49] transition-all border-t border-slate-800/80 pt-4"
                      >
                        <span className="flex items-center gap-2">
                          {isComplete ? (<>Completed <CheckCircle2 /></>) : (<>Explore <ChevronRight /></>)}
                        </span>
                      </button>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}