import { Link } from "react-router-dom";
import { useEffect, useRef, useState, useCallback } from "react";
import {
  OBJECTIVES,
  loadObjectivesProgress,
  saveObjectivesProgress,
  markObjectiveComplete,
  setObjectiveCooldown,
  isObjectiveOnCooldown,
  cooldownRemainingMs,
} from "@/data/objectives";
import {
  CheckCircle2,
  XCircle,
  Upload,
  Clock,
  ExternalLink,
  BookOpen,
  RotateCcw,
  ChevronRight,
  ArrowLeft,
  AlertTriangle,
  Calculator,
} from "lucide-react";



// ─── Main Page ───────────────────────────────────────────────────────────────

function ObjectivesPage() {
  const [progress, setProgress] = useState({});
  const [activeId, setActiveId] = useState(null);
  const [, setTick] = useState(0);

  useEffect(() => {
    setProgress(loadObjectivesProgress());
    // Refresh every minute so cooldown timers update
    const id = setInterval(() => setTick((t) => t + 1), 60_000);
    return () => clearInterval(id);
  }, []);

  const refresh = useCallback(() => {
    setProgress(loadObjectivesProgress());
  }, []);

  const completedCount = OBJECTIVES.filter((o) => progress[o.id]?.completed).length;

  if (activeId) {
    const obj = OBJECTIVES.find((o) => o.id === activeId);
    return (
      <ObjectiveDetail
        objective={obj}
        status={progress[obj.id]}
        onBack={() => { setActiveId(null); refresh(); }}
        onComplete={(proofDataUrl) => {
          markObjectiveComplete(obj.id, proofDataUrl);
          refresh();
          setActiveId(null);
        }}
        onCooldown={() => {
          setObjectiveCooldown(obj.id);
          refresh();
          setActiveId(null);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-4">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Course Home
          </Link>
          <div className="text-sm text-muted-foreground">
            {completedCount}/{OBJECTIVES.length} complete
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-serif text-4xl tracking-tight text-foreground md:text-5xl">
          Weekly Objectives
        </h1>
        <p className="mt-3 text-muted-foreground">
          Real-world financial tasks that turn knowledge into action.
        </p>

        {/* Progress bar */}
        <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-secondary">
          <div
            className="h-full rounded-full bg-gradient-accent transition-all"
            style={{ width: `${(completedCount / OBJECTIVES.length) * 100}%` }}
          />
        </div>

        {/* Grid */}
        <div className="mt-8 grid gap-4 md:grid-cols-2">
          {OBJECTIVES.map((obj) => {
            const status = progress[obj.id];
            const done = status?.completed;
            const onCooldown = isObjectiveOnCooldown(obj.id);
            const msLeft = cooldownRemainingMs(obj.id);
            const hoursLeft = Math.ceil(msLeft / (1000 * 60 * 60));

            return (
              <button
                key={obj.id}
                onClick={() => !done && setActiveId(obj.id)}
                className={`group rounded-2xl border bg-card p-6 text-left transition ${
                  done
                    ? "border-accent/60 bg-accent/5 cursor-default"
                    : onCooldown
                    ? "border-border opacity-60 cursor-not-allowed"
                    : "border-border hover:-translate-y-1 hover:border-primary/50 hover:shadow-elev cursor-pointer"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium text-foreground leading-snug">{obj.title}</p>
                  {done ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-accent" />
                  ) : onCooldown ? (
                    <Clock className="h-5 w-5 shrink-0 text-muted-foreground" />
                  ) : (
                    <ChevronRight className="h-5 w-5 shrink-0 text-muted-foreground group-hover:text-primary transition" />
                  )}
                </div>
                <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{obj.description}</p>
                {onCooldown && (
                  <p className="mt-3 text-xs text-amber-500 font-medium">
                    Retry available in ~{hoursLeft}h
                  </p>
                )}
                {done && (
                  <p className="mt-3 text-xs text-accent font-semibold">Completed</p>
                )}
                {!done && !onCooldown && obj.link && (
                  <span className="mt-3 inline-flex items-center gap-1 text-xs text-primary">
                    <BookOpen className="h-3 w-3" /> Includes study resource
                  </span>
                )}
                {!done && !onCooldown && obj.proofRequired && (
                  <span className="mt-3 inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Upload className="h-3 w-3" /> Proof required
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </main>
    </div>
  );
}

// ─── Objective Detail / Flow ─────────────────────────────────────────────────

function ObjectiveDetail({ objective, onBack, onComplete, onCooldown }) {
  const rule = objective.completionRule;

  function getInitialPhase() {
    if (rule.type === "direct") return "intro";
    if (rule.type === "proof_only") return "intro";
    if (rule.type === "fi_calculator") return "fi_calculator";
    if (rule.type === "quiz_pass_threshold" || rule.type === "quiz_pass_all") {
      return objective.link ? "study" : "quiz";
    }
    if (rule.type === "hysa_quiz") return "study";
    return "intro";
  }

  const [phase, setPhase] = useState(getInitialPhase);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [proofDataUrl, setProofDataUrl] = useState(undefined);

  // HYSA-specific state
  const [hysaApyAnswer, setHysaApyAnswer] = useState(undefined);
  const [hysaApySubmitted, setHysaApySubmitted] = useState(false);
  const [hysaPickedIndex, setHysaPickedIndex] = useState(undefined);
  const [hysaAccountAnswer, setHysaAccountAnswer] = useState(undefined);
  const [hysaAccountSubmitted, setHysaAccountSubmitted] = useState(false);
  const [hysaBothCorrectFirstTry, setHysaBothCorrectFirstTry] = useState(null);

  // FI Calculator
  const [annualExpenses, setAnnualExpenses] = useState("");

  const questions =
    (rule.type === "quiz_pass_threshold" || rule.type === "quiz_pass_all")
      ? rule.questions
      : [];

  const threshold =
    rule.type === "quiz_pass_threshold" ? rule.threshold : questions.length;

  function handleQuizSubmit() {
    setQuizSubmitted(true);
    const correct = questions.filter((q, i) => quizAnswers[i] === q.answer).length;
    if (correct >= threshold) {
      if (objective.proofRequired) {
        setPhase("proof_upload");
      } else {
        setPhase("result_pass");
      }
    } else {
      setPhase("result_fail");
    }
  }

  function handleHysaApySubmit() {
    setHysaApySubmitted(true);
    if (rule.type !== "hysa_quiz") return;
    const correct = hysaApyAnswer === rule.apyQuestion.answer;
    if (correct) {
      setTimeout(() => setPhase("hysa_pick_account"), 800);
    }
  }

  function handleHysaAccountSubmit() {
    setHysaAccountSubmitted(true);
    if (rule.type !== "hysa_quiz" || hysaPickedIndex === undefined) return;
    const acct = rule.accountQuestions[hysaPickedIndex];
    const apyCorrect = hysaApyAnswer === rule.apyQuestion.answer;
    const acctCorrect = hysaAccountAnswer === acct.answer;
    const bothFirstTry = apyCorrect && acctCorrect;
    setHysaBothCorrectFirstTry(bothFirstTry);
    if (bothFirstTry) {
      setPhase("result_pass");
    } else {
      setPhase("result_fail");
    }
  }

  function handleProofUploaded(dataUrl) {
    setProofDataUrl(dataUrl);
    setPhase("result_pass");
  }

  function handleComplete() {
    onComplete(proofDataUrl);
  }

  // ── Study Phase ──
  if (phase === "study" && objective.link) {
    return (
      <PageShell onBack={onBack} title={objective.title}>
        <div className="rounded-3xl border border-border bg-card p-10 text-center shadow-elev">
          <BookOpen className="mx-auto h-12 w-12 text-primary" />
          <h2 className="mt-4 text-2xl font-bold">Step 1: Study the Resource</h2>
          <p className="mt-3 text-muted-foreground max-w-md mx-auto">
            Open the resource below, read it thoroughly, then come back to take the quiz.
          </p>
          <a
            href={objective.link}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-elev hover:scale-[1.02] transition"
          >
            Open Study Resource <ExternalLink className="h-4 w-4" />
          </a>
          <div className="mt-8">
            <button
              onClick={() => {
                if (rule.type === "hysa_quiz") setPhase("hysa_apy");
                else setPhase("quiz");
              }}
              className="rounded-full border border-border px-6 py-2.5 text-sm font-medium hover:border-primary/50 transition"
            >
              I've read it — Take the Quiz →
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  // ── Proof Only Intro ──
  if (phase === "intro" && rule.type === "proof_only") {
    return (
      <PageShell onBack={onBack} title={objective.title}>
        <div className="rounded-3xl border border-border bg-card p-10 shadow-elev">
          <p className="text-lg text-muted-foreground leading-relaxed">{objective.description}</p>
          <div className="mt-8">
            <button
              onClick={() => setPhase("proof_upload")}
              className="rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-elev hover:scale-[1.02] transition"
            >
              Upload Proof to Complete →
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  // ── Direct Complete Intro ──
  if (phase === "intro" && rule.type === "direct") {
    return (
      <PageShell onBack={onBack} title={objective.title}>
        <div className="rounded-3xl border border-border bg-card p-10 shadow-elev">
          <p className="text-lg text-muted-foreground leading-relaxed">{objective.description}</p>
          <div className="mt-8">
            <button
              onClick={handleComplete}
              className="rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-elev hover:scale-[1.02] transition"
            >
              Mark Complete
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  // ── Standard Quiz ──
  if (phase === "quiz" && (rule.type === "quiz_pass_threshold" || rule.type === "quiz_pass_all")) {
    const allAnswered = questions.every((_, i) => quizAnswers[i] !== undefined);
    const correctCount = questions.filter((q, i) => quizAnswers[i] === q.answer).length;

    return (
      <PageShell onBack={onBack} title={objective.title}>
        <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Quiz — answer {threshold}/{questions.length} correctly to complete
        </div>

        <div className="space-y-5">
          {questions.map((q, i) => (
            <QuestionCard
              key={i}
              index={i}
              question={q}
              selected={quizAnswers[i]}
              submitted={quizSubmitted}
              onChange={(oi) => {
                if (quizSubmitted) return;
                const next = [...quizAnswers];
                next[i] = oi;
                setQuizAnswers(next);
              }}
            />
          ))}
        </div>

        <div className="sticky bottom-4 mt-8">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 p-4 shadow-elev backdrop-blur">
            <span className="text-sm text-muted-foreground">
              {quizSubmitted
                ? `${correctCount}/${questions.length} correct`
                : `${quizAnswers.filter((a) => a !== undefined).length}/${questions.length} answered`}
            </span>
            {!quizSubmitted && (
              <button
                onClick={handleQuizSubmit}
                disabled={!allAnswered}
                className="rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-elev disabled:opacity-40"
              >
                Submit Quiz
              </button>
            )}
          </div>
        </div>
      </PageShell>
    );
  }

  // ── HYSA Step 1: APY Question ──
  if (phase === "hysa_apy" && rule.type === "hysa_quiz") {
    const q = rule.apyQuestion;
    const correct = hysaApyAnswer === q.answer;
    return (
      <PageShell onBack={onBack} title={objective.title}>
        <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Step 1 of 3 — APY Knowledge Check
        </div>
        <QuestionCard
          index={0}
          question={q}
          selected={hysaApyAnswer}
          submitted={hysaApySubmitted}
          onChange={(oi) => !hysaApySubmitted && setHysaApyAnswer(oi)}
        />
        {!hysaApySubmitted && (
          <button
            onClick={handleHysaApySubmit}
            disabled={hysaApyAnswer === undefined}
            className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-elev disabled:opacity-40"
          >
            Submit
          </button>
        )}
        {hysaApySubmitted && !correct && (
          <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-5">
            <p className="text-sm font-medium text-destructive">
              Incorrect. Please review the resource and try again tomorrow.
            </p>
            <button
              onClick={onCooldown}
              className="mt-3 rounded-full bg-destructive/80 px-5 py-2 text-sm text-white font-medium"
            >
              OK — Set 24h Cooldown
            </button>
          </div>
        )}
      </PageShell>
    );
  }

  // ── HYSA Step 2: Pick Account ──
  if (phase === "hysa_pick_account" && rule.type === "hysa_quiz") {
    return (
      <PageShell onBack={onBack} title={objective.title}>
        <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Step 2 of 3 — Choose Which Account You Focused On
        </div>
        <div className="space-y-3">
          {rule.accountQuestions.map((acct, i) => (
            <button
              key={i}
              onClick={() => setHysaPickedIndex(i)}
              className={`w-full rounded-xl border px-5 py-3 text-left text-sm transition ${
                hysaPickedIndex === i
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/40"
              }`}
            >
              {acct.accountName}
            </button>
          ))}
        </div>
        <button
          onClick={() => setPhase("hysa_account_quiz")}
          disabled={hysaPickedIndex === undefined}
          className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-elev disabled:opacity-40"
        >
          Next →
        </button>
      </PageShell>
    );
  }

  // ── HYSA Step 3: Account-Specific Question ──
  if (phase === "hysa_account_quiz" && rule.type === "hysa_quiz" && hysaPickedIndex !== undefined) {
    const acct = rule.accountQuestions[hysaPickedIndex];
    const correct = hysaAccountAnswer === acct.answer;
    return (
      <PageShell onBack={onBack} title={objective.title}>
        <div className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Step 3 of 3 — {acct.accountName}
        </div>
        <QuestionCard
          index={0}
          question={{ q: acct.question, options: acct.options, answer: acct.answer }}
          selected={hysaAccountAnswer}
          submitted={hysaAccountSubmitted}
          onChange={(oi) => !hysaAccountSubmitted && setHysaAccountAnswer(oi)}
        />
        {!hysaAccountSubmitted && (
          <button
            onClick={handleHysaAccountSubmit}
            disabled={hysaAccountAnswer === undefined}
            className="mt-6 rounded-full bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground shadow-elev disabled:opacity-40"
          >
            Submit
          </button>
        )}
        {hysaAccountSubmitted && !correct && (
          <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/10 p-5">
            <p className="text-sm font-medium text-destructive">
              Incorrect. You must get both questions right on the first try. A 24h cooldown will apply.
            </p>
            <button
              onClick={onCooldown}
              className="mt-3 rounded-full bg-destructive/80 px-5 py-2 text-sm text-white font-medium"
            >
              OK — Set 24h Cooldown
            </button>
          </div>
        )}
      </PageShell>
    );
  }

  // ── FI Number Calculator ──
  if (phase === "fi_calculator") {
    const expenses = parseFloat(annualExpenses.replace(/,/g, ""));
    const fiNumber = isNaN(expenses) ? null : expenses * 25;
    return (
      <PageShell onBack={onBack} title={objective.title}>
        <div className="rounded-3xl border border-border bg-card p-10 shadow-elev">
          <div className="flex items-center gap-3 mb-6">
            <Calculator className="h-8 w-8 text-primary" />
            <h2 className="text-2xl font-bold">Your FI Number</h2>
          </div>
          <p className="text-muted-foreground mb-6">
            Enter your <strong>annual expenses</strong> and we'll calculate your Financial
            Independence target using the 25× rule.
          </p>
          <label className="block text-sm font-medium text-foreground mb-2">
            Annual Expenses ($)
          </label>
          <input
            type="number"
            placeholder="e.g. 40000"
            value={annualExpenses}
            onChange={(e) => setAnnualExpenses(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-lg outline-none focus:border-primary transition"
          />
          {fiNumber !== null && (
            <div className="mt-6 rounded-2xl border border-accent/40 bg-accent/10 p-6">
              <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                Your Retirement Target
              </div>
              <div className="text-4xl font-bold text-foreground">
                ${fiNumber.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                ${expenses.toLocaleString()} × 25 = ${fiNumber.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                At this amount, withdrawing 4% per year covers your annual expenses indefinitely.
              </p>
            </div>
          )}
          {fiNumber !== null && (
            <button
              onClick={handleComplete}
              className="mt-6 rounded-full bg-primary px-7 py-3 text-sm font-semibold text-primary-foreground shadow-elev hover:scale-[1.02] transition"
            >
              Save & Complete Objective
            </button>
          )}
        </div>
      </PageShell>
    );
  }

  // ── Proof Upload ──
  if (phase === "proof_upload") {
    return (
      <PageShell onBack={onBack} title={objective.title}>
        <ProofUpload
          label={objective.proofLabel ?? "Upload Proof"}
          onUploaded={handleProofUploaded}
        />
      </PageShell>
    );
  }

  // ── Result: Pass ──
  if (phase === "result_pass") {
    return (
      <PageShell onBack={onBack} title={objective.title}>
        <div className="rounded-3xl border border-accent/40 bg-accent/5 p-12 text-center shadow-elev">
          <CheckCircle2 className="mx-auto h-16 w-16 text-accent" />
          <h2 className="mt-4 text-3xl font-bold">Objective Complete!</h2>
          <p className="mt-2 text-muted-foreground">
            {hysaBothCorrectFirstTry === true
              ? "Both answers correct on the first try — great work!"
              : "You passed. Well done!"}
          </p>
          <button
            onClick={handleComplete}
            className="mt-8 rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-elev hover:scale-[1.02] transition"
          >
            Return to Objectives
          </button>
        </div>
      </PageShell>
    );
  }

  // ── Result: Fail ──
  if (phase === "result_fail") {
    const rule_ = objective.completionRule;
    const isThreshold = rule_.type === "quiz_pass_threshold";
    const correctCount = isThreshold
      ? questions.filter((q, i) => quizAnswers[i] === q.answer).length
      : 0;

    return (
      <PageShell onBack={onBack} title={objective.title}>
        <div className="rounded-3xl border border-destructive/40 bg-destructive/5 p-12 text-center shadow-elev">
          <XCircle className="mx-auto h-16 w-16 text-destructive" />
          <h2 className="mt-4 text-3xl font-bold">Not Quite</h2>
          {isThreshold && (
            <p className="mt-2 text-muted-foreground">
              You got {correctCount}/{questions.length}. You need {threshold} to pass.
            </p>
          )}
          <p className="mt-3 text-sm text-muted-foreground">
            A 24-hour cooldown will be applied. Come back tomorrow and try again.
          </p>
          <button
            onClick={onCooldown}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-destructive/80 px-7 py-3 text-sm font-semibold text-white shadow-elev"
          >
            <Clock className="h-4 w-4" /> OK — Set Cooldown & Go Back
          </button>
        </div>
      </PageShell>
    );
  }

  return null;
}

// ─── Shared Sub-components ───────────────────────────────────────────────────

function PageShell({ onBack, title, children }) {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-4 px-6 py-4">
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </button>
          <span className="text-sm font-medium truncate text-foreground">{title}</span>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-6 py-10">{children}</main>
    </div>
  );
}

function QuestionCard({ index, question, selected, submitted, onChange }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start gap-3">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold">
          {index + 1}
        </div>
        <div className="font-medium">{question.q}</div>
      </div>
      <div className="mt-4 grid gap-2">
        {question.options.map((opt, oi) => {
          const isSelected = selected === oi;
          const isCorrect = question.answer === oi;
          let style = "border-border bg-background hover:border-primary/50";
          if (submitted) {
            if (isCorrect) style = "border-accent bg-accent/10";
            else if (isSelected && !isCorrect) style = "border-destructive bg-destructive/10";
            else style = "border-border bg-background opacity-70";
          } else if (isSelected) {
            style = "border-primary bg-primary/5";
          }
          return (
            <button
              key={oi}
              disabled={submitted}
              onClick={() => onChange(oi)}
              className={`flex items-center justify-between rounded-xl border px-4 py-3 text-left text-sm transition ${style}`}
            >
              <span>{opt}</span>
              {submitted && isCorrect && <CheckCircle2 className="h-4 w-4 text-accent shrink-0" />}
              {submitted && isSelected && !isCorrect && <XCircle className="h-4 w-4 text-destructive shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProofUpload({ label, onUploaded }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState(null);

  function handleFile(file) {
    if (!file.type.startsWith("image/")) {
      setError("Please upload an image file (JPG, PNG, etc.).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("File too large. Please upload an image under 10MB.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      setPreview(result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="rounded-3xl border border-border bg-card p-10 shadow-elev">
      <div className="flex items-center gap-3 mb-4">
        <Upload className="h-7 w-7 text-primary" />
        <h2 className="text-xl font-bold">{label}</h2>
      </div>

      {/* Privacy disclaimer */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-400/40 bg-amber-400/10 p-4">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
        <p className="text-sm text-amber-700 dark:text-amber-300">
          <strong>Privacy reminder:</strong> Before uploading, please blur or remove any personal
          information (account numbers, names, addresses) visible in the image.
        </p>
      </div>

      {/* Drop zone */}
      <div
        className={`relative rounded-2xl border-2 border-dashed p-10 text-center transition ${
          preview ? "border-accent bg-accent/5" : "border-border hover:border-primary/40"
        }`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) handleFile(file);
        }}
      >
        {preview ? (
          <img
            src={preview}
            alt="Proof preview"
            className="mx-auto max-h-64 rounded-xl object-contain"
          />
        ) : (
          <>
            <Upload className="mx-auto h-10 w-10 text-muted-foreground" />
            <p className="mt-3 text-sm text-muted-foreground">
              Drag & drop an image here, or click to browse
            </p>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="absolute inset-0 opacity-0 cursor-pointer"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>

      {error && <p className="mt-3 text-sm text-destructive">{error}</p>}

      <div className="mt-6 flex gap-3">
        <button
          onClick={() => fileRef.current?.click()}
          className="rounded-full border border-border px-6 py-2.5 text-sm font-medium hover:border-primary/50 transition"
        >
          Browse Files
        </button>
        {preview && (
          <button
            onClick={() => onUploaded(preview)}
            className="rounded-full bg-primary px-7 py-2.5 text-sm font-semibold text-primary-foreground shadow-elev hover:scale-[1.02] transition"
          >
            Submit Proof & Complete
          </button>
        )}
      </div>
    </div>
  );
}
export default ObjectivesPage;