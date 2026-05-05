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
const Lock = () => <svg className="w-3.5 h-3.5 text-[#c19a49]" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>;
const CheckCircle2 = () => <svg className="w-4 h-4 text-[#c19a49]" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z"/><path d="m9 12 2 2 4-4"/></svg>;
const ChevronRight = () => <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>;
const ChevronLeft = () => <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>;
const Trophy = () => <svg className="w-12 h-12 text-[#c19a49]" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2Z"/></svg>;
const Star = () => <svg className="w-4 h-4 fill-current text-[#c19a49]" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const XCircle = () => <svg className="w-12 h-12 text-red-500" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>;
const Sparkles = () => <svg className="w-4 h-4 text-[#c19a49]" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>;

// ─── 8 CATEGORY COURSE ICONS ──────────────────────────────────────────────
const ChapterIcon = ({ id }) => {
  const base = "w-10 h-10 stroke-[#c19a49] text-[#c19a49] stroke-[1.5] flex-shrink-0 mb-4";
  switch (id) {
    case 'ch1':
      return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/><circle cx="12" cy="12" r="10" strokeWidth="2" opacity="0.2"/></svg>;
    case 'ch2':
      return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M12 20V10M18 20V4M6 20v-4"/><path d="M3 20h18" strokeWidth="2"/></svg>;
    case 'ch3':
      return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M2 20h20M7 8h10M7 12h4"/></svg>;
    case 'ch4':
      return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M19 3v12M5 11v10M12 7v14M3 3l18 18"/></svg>;
    case 'ch5':
      return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8"/></svg>;
    case 'ch6':
      return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="8" r="4"/><path d="M6 21v-2a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v2"/><circle cx="18" cy="4" r="2"/></svg>;
    case 'ch7':
      return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 21h18M3 10h18M5 6h14M4 10v11M20 10v11"/><path d="M9 14h2v3H9zm4 0h2v3h-2z"/></svg>;
    case 'ch8':
      return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="9"/><path d="M9.5 8h4a2.5 2.5 0 0 1 0 5h-4 4a2.5 2.5 0 0 1 0 5h-4M9.5 6v12"/></svg>;
    default:
      return <svg className={base} viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/></svg>;
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
      id: 'ch1',
      title: 'Financial Foundations',
      description: 'Intro to Accounting & Budgeting',
      lessons: [
        {
          id: 'ch1-l1',
          title: 'The Psychological Foundation',
          content: `Wealth is not about how much money you earn; it is about how much money you keep.
          
**Key Concepts:**
- **Income vs. Net Worth:** Income is temporary cash flow. Net worth is real equity.
- **Delayed Gratification:** Sacrifice lifestyle creep today to buy back your personal time tomorrow.`
        }
      ],
      quiz: [
        { q: 'What is the true measure of economic power?', options: ['Monthly income', 'Gross revenue', 'Net worth (Assets minus Liabilities)', 'Total spending power'], answer: 2 }
      ]
    },
    {
      id: 'ch2',
      title: 'Investing Basics',
      description: 'Equities, Bonds & Diversification',
      lessons: [
        {
          id: 'ch2-l1',
          title: 'Market Allocation',
          content: `Deploying capital intelligently across diversified assets removes human emotional error from long-term wealth building.`
        }
      ],
      quiz: [
        { q: 'What does an index fund offer?', options: ['Fixed Returns', 'Broad market diversification', 'Tax elimination', 'Zero risk'], answer: 1 }
      ]
    },
    {
      id: 'ch3',
      title: 'Wealth Management',
      description: 'Planning, Asset Allocation & Goals',
      lessons: [
        {
          id: 'ch3-l1',
          title: 'Managing High-Value Assets',
          content: `Structuring portfolios correctly using tax-advantaged buckets and asset correlation avoids massive capital drawdowns during market corrections.`
        }
      ],
      quiz: [
        { q: 'What is asset allocation?', options: ['Picking one high-growth stock', 'Spreading investments across asset classes', 'Paying off all your debt', 'Leaving money in savings'], answer: 1 }
      ]
    },
    {
      id: 'ch4',
      title: 'Advanced Trading',
      description: 'Technical Analysis & Risk Management',
      lessons: [
        {
          id: 'ch4-l1',
          title: 'Advanced Concepts',
          content: `Analyze market cycles using technical metrics while strictly enforcing 1% to 2% max portfolio risk on individual market entries.`
        }
      ],
      quiz: [
        { q: 'What is technical analysis primarily based on?', options: ['Corporate earnings reports', 'Market price action and volume history', 'Macroeconomic tax levels', 'Company executive statements'], answer: 1 }
      ]
    },
    {
      id: 'ch5',
      title: 'Tax & Estate Planning',
      description: 'Structuring Assets & Compliance',
      lessons: [
        {
          id: 'ch5-l1',
          title: 'Legal Tax Frameworks',
          content: `Leverage trusts, family limited partnerships, and optimal legal entity filings to reduce estate tax exposure and preserve assets for your family.`
        }
      ],
      quiz: [
        { q: 'Which legal structure helps avoid direct probate delays?', options: ['A traditional bank checking account', 'A revocable living trust', 'An unsecured personal loan', 'A retail credit card file'], answer: 1 }
      ]
    },
    {
      id: 'ch6',
      title: 'Retirement Planning',
      description: 'Building Wealth for Your Future',
      lessons: [
        {
          id: 'ch6-l1',
          title: 'Long-term Growth Vehicles',
          content: `Retirement is a mathematical milestone. Work becomes completely optional once your investments generate passive cash flow that exceeds your living expenses.`
        }
      ],
      quiz: [
        { q: 'What is the 4% Rule target?', options: ['Having 25x your annual expenses in your portfolio', 'Retiring at age 40', 'Saving 4% of your paycheck', 'Using 4 credit cards at a time'], answer: 0 }
      ]
    },
    {
      id: 'ch7',
      title: 'Corporate Finance',
      description: 'Valuations & Capital Budgeting',
      lessons: [
        {
          id: 'ch7-l1',
          title: 'Optimizing Enterprise Value',
          content: `Learn to calculate Discounted Cash Flow (DCF), analyze corporate capital structures, and optimize debt-to-equity ratios for growth.`
        }
      ],
      quiz: [
        { q: 'What does WACC represent in enterprise finance?', options: ['Weekly Asset Cost Comparison', 'Weighted Average Cost of Capital', 'Wealth Allocation & Cash Control', 'Workplace Asset Credit Ceiling'], answer: 1 }
      ]
    },
    {
      id: 'ch8',
      title: 'Crypto & Digital Assets',
      description: 'Fundamentals & Web3 Investments',
      lessons: [
        {
          id: 'ch8-l1',
          title: 'Decentralized Finance',
          content: `Evaluate core blockchain network parameters, explore smart contract functionality, and integrate crypto as a volatile, non-correlated asset class.`
        }
      ],
      quiz: [
        { q: 'What makes a public blockchain secure?', options: ['A centralized legal trust', 'Decentralized cryptographic consensus', 'Corporate management protocols', 'Government oversight'], answer: 1 }
      ]
    }
  ]
};

export default function CourseApp() {
  const [activeTab, setActiveTab] = useState('curriculum');
  const [selectedChapter, setSelectedChapter] = useState(null);
  const [activeLesson, setActiveLesson] = useState(null);
  const [quizState, setQuizState] = useState(null);
  const [completedChapters, setCompletedChapters] = useState({});

  // Navigation handlers
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
    setQuizState({
      currentIndex: 0,
      answers: {},
      isFinished: false,
      score: 0
    });
  };

  const handleAnswerSelect = (optionIndex) => {
    if (!quizState || quizState.isFinished) return;
    setQuizState(prev => ({
      ...prev,
      answers: { ...prev.answers, [prev.currentIndex]: optionIndex }
    }));
  };

  const nextQuizQuestion = () => {
    const isLast = quizState.currentIndex === selectedChapter.quiz.length - 1;
    if (isLast) {
      let finalScore = 0;
      selectedChapter.quiz.forEach((q, idx) => {
        if (quizState.answers[idx] === q.answer) finalScore++;
      });
      const passed = finalScore >= selectedChapter.quiz.length * 0.7;

      setQuizState(prev => ({ ...prev, isFinished: true, score: finalScore }));

      if (passed) {
        setCompletedChapters(prev => ({ ...prev, [selectedChapter.id]: true }));
      }
    } else {
      setQuizState(prev => ({ ...prev, currentIndex: prev.currentIndex + 1 }));
    }
  };

  const restartQuiz = () => {
    triggerQuiz();
  };

  return (
    <div className="min-h-screen bg-[#050b14] text-slate-100 font-sans antialiased pb-16 selection:bg-[#c19a49] selection:text-black">
      
      {/* ─── HERO HEADER SECTION (DARK THEMED) ─── */}
      {!selectedChapter ? (
        <>
          <div className="relative border-b border-slate-800 bg-[#070e1a] bg-opacity-60 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-transparent to-transparent opacity-60 z-0"></div>
            <div className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center relative z-10">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight text-white mb-2 max-w-4xl mx-auto leading-tight uppercase font-serif">
                {COURSE.title}
              </h1>
              <p className="text-xl md:text-2xl font-light tracking-wide text-slate-300 max-w-2xl mx-auto mb-6">
                {COURSE.subtitle}
              </p>
              <p className="text-xs md:text-sm uppercase tracking-widest text-[#c19a49] font-bold">
                {COURSE.meta}
              </p>
            </div>
          </div>

          {/* ─── FEATURES TOP BAR ─── */}
          <div className="bg-[#0b1320] border-b border-slate-800">
            <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 text-center text-xs md:text-sm font-semibold tracking-wider uppercase text-slate-300">
              <div className="py-4 border-b md:border-b-0 md:border-r border-slate-800 flex items-center justify-center gap-2">
                <span className="text-[#c19a49]">★</span> 0% - Start Your Journey
              </div>
              <div className="py-4 flex items-center justify-center gap-2">
                <span className="text-[#c19a49]">★</span> Over 50 Hours of Content | 120+ Lessons | Certified Instructors
              </div>
            </div>
          </div>
        </>
      ) : null}

      {/* ─── MAIN APP WORKSPACE ─── */}
      <main className="max-w-6xl mx-auto px-4 mt-12">
        {selectedChapter ? (
          /* ─── ACTIVE CHAPTER WORKSPACE ─── */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fadeIn">
            {/* LEFT LESSON MENU / RETREAT PANEL */}
            <div className="lg:col-span-4 flex flex-col gap-4">
              <Button onClick={closeChapter} variant="ghost" className="self-start gap-2 text-slate-300 hover:text-white flex items-center mb-2">
                <ChevronLeft /> Back to Chapters
              </Button>

              <Card className="p-4 bg-[#0b1320] border border-slate-800">
                <h2 className="text-xs uppercase tracking-widest font-bold text-[#c19a49] mb-1">Current Chapter</h2>
                <h3 className="text-xl font-bold text-white leading-tight mb-4">{selectedChapter.title}</h3>
                
                <div className="space-y-1 mb-4">
                  {selectedChapter.lessons.map((lesson) => {
                    const isActive = activeLesson?.id === lesson.id && !quizState;
                    return (
                      <button
                        key={lesson.id}
                        onClick={() => { setActiveLesson(lesson); setQuizState(null); }}
                        className={`w-full flex items-center gap-3 p-3 text-left rounded-md transition-all text-sm ${isActive ? 'bg-[#1a365d] text-[#c19a49] font-bold border-l-4 border-[#c19a49]' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                      >
                        <BookOpen />
                        <span className="truncate">{lesson.title}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-3 border-t border-slate-800">
                  <Button onClick={triggerQuiz} className="w-full gap-2" variant={quizState ? "outline" : "default"}>
                    <Sparkles /> {quizState ? "Active Evaluation" : "Review & Take Quiz"}
                  </Button>
                </div>
              </Card>
            </div>

            {/* MAIN LESSON/QUIZ CONTENT DISPLAY */}
            <div className="lg:col-span-8">
              <Card className="min-h-[480px] flex flex-col p-8 bg-[#0b1320] border-slate-800 shadow-2xl relative">
                {quizState ? (
                  /* QUIZ SECTION */
                  <div className="flex flex-col flex-1">
                    {!quizState.isFinished ? (
                      <>
                        <div className="flex justify-between items-center mb-6">
                          <Badge variant="outline">Evaluation Mode</Badge>
                          <span className="text-xs font-mono font-bold tracking-wider text-slate-400">
                            Question {quizState.currentIndex + 1} of {selectedChapter.quiz.length}
                          </span>
                        </div>

                        <Progress value={((quizState.currentIndex + 1) / selectedChapter.quiz.length) * 100} className="mb-8" />

                        <div className="flex-1">
                          <h3 className="text-xl font-bold text-white mb-6 leading-snug">
                            {selectedChapter.quiz[quizState.currentIndex].q}
                          </h3>

                          <div className="grid grid-cols-1 gap-3">
                            {selectedChapter.quiz[quizState.currentIndex].options.map((opt, oIdx) => {
                              const isSelected = quizState.answers[quizState.currentIndex] === oIdx;
                              return (
                                <button
                                  key={oIdx}
                                  onClick={() => handleAnswerSelect(oIdx)}
                                  className={`p-4 rounded-md text-left text-sm border transition-all ${
                                    isSelected
                                      ? 'bg-[#1a365d] border-[#c19a49] text-white font-semibold ring-1 ring-[#c19a49]'
                                      : 'bg-[#0e1726] border-slate-800 text-slate-300 hover:border-slate-600 hover:text-white'
                                  }`}
                                >
                                  {opt}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        <div className="flex justify-end pt-6">
                          <Button
                            onClick={nextQuizQuestion}
                            disabled={quizState.answers[quizState.currentIndex] === undefined}
                            className="gap-2"
                          >
                            {quizState.currentIndex === selectedChapter.quiz.length - 1 ? "Submit Exam" : "Proceed"}
                            <ChevronRight />
                          </Button>
                        </div>
                      </>
                    ) : (
                      /* QUIZ SUMMARY & SCORE SCREEN */
                      <div className="flex flex-col items-center justify-center flex-1 text-center py-6 animate-fadeIn">
                        {quizState.score >= selectedChapter.quiz.length * 0.7 ? (
                          <>
                            <Trophy />
                            <h3 className="text-2xl font-bold text-white mt-4 mb-2">Evaluation Passed!</h3>
                            <p className="text-slate-400 mb-6 max-w-sm text-sm">
                              Congratulations! You scored {quizState.score}/{selectedChapter.quiz.length}. You have proven mastery over this chapter.
                            </p>
                          </>
                        ) : (
                          <>
                            <XCircle />
                            <h3 className="text-2xl font-bold text-white mt-4 mb-2">Try Again</h3>
                            <p className="text-slate-400 mb-6 max-w-sm text-sm">
                              You scored {quizState.score}/{selectedChapter.quiz.length}. A minimum score of 70% is required to secure the chapter credits.
                            </p>
                          </>
                        )}
                        <div className="flex gap-4">
                          <Button onClick={restartQuiz} variant="outline" size="sm">Retake Evaluation</Button>
                          <Button onClick={closeChapter} size="sm">Return to Grid</Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : activeLesson ? (
                  /* STANDARD LESSON CONTENT VIEW */
                  <div className="flex flex-col flex-1 animate-fadeIn">
                    <div className="flex justify-between items-center mb-6">
                      <Badge variant="outline" className="tracking-wide text-[#c19a49] uppercase font-bold text-[10px]">Financial Academy module</Badge>
                    </div>

                    <h2 className="text-3xl font-extrabold text-white mb-6 leading-tight border-b border-slate-800 pb-4">
                      {activeLesson.title}
                    </h2>
                    
                    <div className="flex-1 text-slate-300 leading-relaxed text-base space-y-4 max-w-none">
                      {activeLesson.content.split('\n').map((para, i) => {
                        if (para.startsWith('**Key Concepts:**')) {
                          return <h4 key={i} className="text-lg font-bold text-[#c19a49] pt-4 mb-2">{para.replace(/\*\*/g, '')}</h4>;
                        }
                        if (para.startsWith('- **')) {
                          const boldPart = para.match(/\*\*([^*]+)\*\*/)?.[1];
                          const normalPart = para.split('**')[2];
                          return (
                            <li key={i} className="ml-5 list-disc text-slate-300">
                              <span className="font-bold text-white">{boldPart}</span>
                              {normalPart}
                            </li>
                          );
                        }
                        return para.trim() ? <p key={i} className="text-slate-300 text-sm leading-relaxed mb-4">{para}</p> : null;
                      })}
                    </div>

                    <div className="flex justify-end mt-8 border-t border-slate-800 pt-6">
                      <Button onClick={triggerQuiz} className="gap-2">
                        Module Evaluation <ChevronRight />
                      </Button>
                    </div>
                  </div>
                ) : null}
              </Card>
            </div>
          </div>
        ) : (
          /* ─── PREMIUM CHAPTER GRID (SCREENSHOT EXACT DUPLICATE DESIGN) ─── */
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
                      {/* Chapter custom icon */}
                      <ChapterIcon id={chapter.id} />
                      
                      {/* Numbering & Titles */}
                      <span className="text-xs font-extrabold text-slate-400 uppercase tracking-widest mb-1">
                        {idx + 1}. {chapter.title}
                      </span>
                      <p className="text-sm text-slate-400 font-medium leading-normal mb-6 flex-grow">
                        {chapter.description}
                      </p>

                      {/* Explore Anchor Action */}
                      <button 
                        onClick={() => openChapter(chapter)}
                        className="text-xs uppercase tracking-widest font-extrabold text-white flex items-center justify-between mt-auto group-hover:text-[#c19a49] transition-all border-t border-slate-800/80 pt-4"
                      >
                        <span className="flex items-center gap-2">
                          {isComplete ? (
                            <>Completed <CheckCircle2 /></>
                          ) : (
                            <>Explore <ChevronRight /></>
                          )}
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