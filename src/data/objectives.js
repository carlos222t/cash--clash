// ─── objectives.js ───────────────────────────────────────────────────────────
// Place this file at: src/data/objectives.js

const STORAGE_KEY = "cc_objectives_progress";

// ─── Data ────────────────────────────────────────────────────────────────────

export const OBJECTIVES = [
  // 1
  {
    id: "budgeting-basics",
    title: "Budgeting Basics",
    description:
      "Learn how to create a simple monthly budget by allocating your income across essential categories.",
    link: "https://www.investopedia.com/terms/b/budget.asp",
    proofRequired: false,
    completionRule: {
      type: "quiz_pass_threshold",
      threshold: 3,
      questions: [
        {
          q: "What is the primary purpose of a personal budget?",
          options: [
            "To restrict all spending",
            "To plan and track income and expenses",
            "To invest in the stock market",
            "To apply for a loan",
          ],
          answer: 1,
        },
        {
          q: "The 50/30/20 rule allocates 20% of income to:",
          options: ["Entertainment", "Housing", "Savings and debt repayment", "Food"],
          answer: 2,
        },
        {
          q: "Which of these is a fixed expense?",
          options: ["Groceries", "Monthly rent", "Movie tickets", "Dining out"],
          answer: 1,
        },
        {
          q: "What should you do first when building a budget?",
          options: [
            "Cut all discretionary spending",
            "Calculate your net monthly income",
            "Open a savings account",
            "List your wants",
          ],
          answer: 1,
        },
      ],
    },
  },

  // 2
  {
    id: "emergency-fund",
    title: "Build an Emergency Fund",
    description:
      "Understand why an emergency fund is essential and how much you should save before investing.",
    link: "https://www.nerdwallet.com/article/banking/emergency-fund-why-it-matters",
    proofRequired: false,
    completionRule: {
      type: "quiz_pass_threshold",
      threshold: 3,
      questions: [
        {
          q: "How many months of expenses is a fully-funded emergency fund typically?",
          options: ["1–2 months", "3–6 months", "10–12 months", "24 months"],
          answer: 1,
        },
        {
          q: "Where should you keep your emergency fund?",
          options: [
            "Invested in stocks for growth",
            "In a liquid, easily accessible savings account",
            "In a 5-year CD",
            "In cryptocurrency",
          ],
          answer: 1,
        },
        {
          q: "Which situation is a valid use of an emergency fund?",
          options: [
            "Buying a new phone",
            "A surprise medical bill",
            "A concert ticket",
            "A vacation",
          ],
          answer: 1,
        },
        {
          q: "What is the biggest risk of NOT having an emergency fund?",
          options: [
            "Missing out on investment returns",
            "Going into high-interest debt during a crisis",
            "Paying too much in taxes",
            "Losing your credit score",
          ],
          answer: 1,
        },
      ],
    },
  },

  // 3
  {
    id: "hysa",
    title: "Open a High-Yield Savings Account",
    description:
      "Research a real HYSA, understand APY, and prove you've taken a step toward opening one.",
    link: "https://www.nerdwallet.com/best/banking/high-yield-online-savings-accounts",
    proofRequired: true,
    proofLabel: "Upload a screenshot showing you visited or started the application (blur sensitive info)",
    completionRule: {
      type: "hysa_quiz",
      apyQuestion: {
        q: "What does APY stand for and what does it measure?",
        options: [
          "Annual Payment Yield — how much you owe annually",
          "Annual Percentage Yield — the real rate of return including compound interest",
          "Average Profit per Year — your investment gains",
          "Automated Payment Year — scheduled payments",
        ],
        answer: 1,
      },
      accountQuestions: [
        {
          accountName: "Marcus by Goldman Sachs",
          question: "What is a key feature of the Marcus HYSA?",
          options: [
            "Requires a $10,000 minimum deposit",
            "No minimum deposit and no fees",
            "Only available to Goldman Sachs employees",
            "Charges a monthly maintenance fee",
          ],
          answer: 1,
        },
        {
          accountName: "Ally Bank",
          question: "What makes Ally Bank's savings account notable?",
          options: [
            "It has physical branches in every state",
            "It offers buckets to organize savings goals within one account",
            "It requires a $500 minimum balance",
            "It only allows one withdrawal per year",
          ],
          answer: 1,
        },
        {
          accountName: "SoFi",
          question: "What benefit does SoFi offer members who set up direct deposit?",
          options: [
            "Free stock trades",
            "A higher APY rate than the standard rate",
            "No federal insurance",
            "Cashback on all purchases",
          ],
          answer: 1,
        },
      ],
    },
  },

  // 4
  {
    id: "understanding-credit",
    title: "Understanding Credit Scores",
    description:
      "Learn what makes up your credit score and how to build or protect it as a student.",
    link: "https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores/",
    proofRequired: false,
    completionRule: {
      type: "quiz_pass_threshold",
      threshold: 3,
      questions: [
        {
          q: "What is the most important factor in your FICO credit score?",
          options: [
            "Credit mix",
            "Payment history",
            "New credit inquiries",
            "Length of credit history",
          ],
          answer: 1,
        },
        {
          q: "What credit utilization ratio is generally recommended to maintain a good score?",
          options: ["Below 90%", "Below 50%", "Below 30%", "It doesn't matter"],
          answer: 2,
        },
        {
          q: "How often can you get a free credit report from each bureau?",
          options: ["Every month", "Once a year", "Once every 5 years", "Never for free"],
          answer: 1,
        },
        {
          q: "Which action HURTS your credit score?",
          options: [
            "Paying your bill on time",
            "Keeping old accounts open",
            "Missing a payment",
            "Checking your own credit report",
          ],
          answer: 2,
        },
      ],
    },
  },

  // 5
  {
    id: "compound-interest",
    title: "The Power of Compound Interest",
    description:
      "Understand how compound interest works and why starting to save early makes a massive difference.",
    link: "https://www.investopedia.com/terms/c/compoundinterest.asp",
    proofRequired: false,
    completionRule: {
      type: "quiz_pass_threshold",
      threshold: 3,
      questions: [
        {
          q: "What is compound interest?",
          options: [
            "Interest paid only on the original principal",
            "Interest calculated on both the principal and previously earned interest",
            "A fixed fee charged by banks",
            "Interest that decreases over time",
          ],
          answer: 1,
        },
        {
          q: "If you invest $1,000 at 7% annual compound interest, approximately how much do you have after 10 years?",
          options: ["$1,700", "$1,967", "$2,500", "$3,000"],
          answer: 1,
        },
        {
          q: "What is the 'Rule of 72' used for?",
          options: [
            "Calculating tax owed",
            "Estimating how long it takes to double money at a given interest rate",
            "Determining your credit score",
            "Setting a savings goal",
          ],
          answer: 1,
        },
        {
          q: "Why does starting to invest earlier matter so much?",
          options: [
            "You get more tax deductions",
            "You have more time for compound growth to multiply your money",
            "Interest rates are always higher when you're young",
            "Banks offer better terms to young investors",
          ],
          answer: 1,
        },
      ],
    },
  },

  // 6
  {
    id: "needs-vs-wants",
    title: "Needs vs. Wants",
    description:
      "Practice identifying needs versus wants in your own spending and adjust your budget accordingly.",
    link: "https://www.ramseysolutions.com/budgeting/needs-vs-wants",
    proofRequired: false,
    completionRule: {
      type: "quiz_pass_all",
      questions: [
        {
          q: "Which of these is a NEED?",
          options: ["Netflix subscription", "Rent payment", "New sneakers", "Coffee shop visits"],
          answer: 1,
        },
        {
          q: "Which of these is a WANT?",
          options: [
            "Electricity bill",
            "Grocery staples",
            "Streaming service subscription",
            "Health insurance",
          ],
          answer: 2,
        },
        {
          q: "Why is distinguishing needs from wants important when budgeting?",
          options: [
            "It helps you earn more income",
            "It ensures essentials are funded before discretionary spending",
            "It improves your credit score",
            "It reduces your tax bill",
          ],
          answer: 1,
        },
      ],
    },
  },

  // 7
  {
    id: "fi-number",
    title: "Calculate Your FI Number",
    description:
      "Use the 25× rule to calculate your Financial Independence number — the amount you need invested to retire.",
    proofRequired: false,
    completionRule: {
      type: "fi_calculator",
    },
  },

  // 8
  {
    id: "track-spending-week",
    title: "Track Every Expense for a Week",
    description:
      "Log all of your transactions in Cash Clash for 7 consecutive days. Screenshot your transaction list as proof.",
    proofRequired: true,
    proofLabel: "Upload a screenshot of your Cash Clash transaction list showing at least 7 days of entries",
    completionRule: {
      type: "proof_only",
    },
  },

  // 9
  {
    id: "debt-avalanche",
    title: "Debt Repayment Strategies",
    description:
      "Learn the difference between the debt avalanche and debt snowball methods and when to use each.",
    link: "https://www.nerdwallet.com/article/finance/what-is-a-debt-avalanche",
    proofRequired: false,
    completionRule: {
      type: "quiz_pass_threshold",
      threshold: 3,
      questions: [
        {
          q: "The debt avalanche method prioritizes paying off:",
          options: [
            "The smallest balance first",
            "The oldest debt first",
            "The highest interest rate debt first",
            "Debts to friends and family first",
          ],
          answer: 2,
        },
        {
          q: "What is the main advantage of the debt snowball method?",
          options: [
            "Saves the most money on interest",
            "Provides psychological wins by eliminating small balances quickly",
            "Works best for large mortgages",
            "It's required by law",
          ],
          answer: 1,
        },
        {
          q: "Which method saves the most money in total interest paid?",
          options: [
            "Debt snowball",
            "Minimum payments only",
            "Debt avalanche",
            "They save exactly the same",
          ],
          answer: 2,
        },
        {
          q: "If someone struggles with motivation, which method is often recommended?",
          options: [
            "Debt avalanche",
            "Debt snowball",
            "Balance transfer only",
            "Consolidation loan",
          ],
          answer: 1,
        },
      ],
    },
  },

  // 10
  {
    id: "investing-intro",
    title: "Introduction to Investing",
    description:
      "Learn the basics of stocks, bonds, index funds, and why diversification matters.",
    link: "https://www.investopedia.com/articles/basics/06/invest1000.asp",
    proofRequired: false,
    completionRule: {
      type: "quiz_pass_threshold",
      threshold: 3,
      questions: [
        {
          q: "What is an index fund?",
          options: [
            "A fund managed by a single expert stock picker",
            "A fund that tracks a market index like the S&P 500",
            "A government savings bond",
            "A type of savings account",
          ],
          answer: 1,
        },
        {
          q: "What does diversification help reduce?",
          options: ["Investment returns", "Risk by spreading money across assets", "Tax liability", "Compound interest"],
          answer: 1,
        },
        {
          q: "Compared to stocks, bonds are generally:",
          options: [
            "Higher risk and higher return",
            "Lower risk and lower return",
            "The same risk as stocks",
            "Only available to institutions",
          ],
          answer: 1,
        },
        {
          q: "What is the expense ratio of a fund?",
          options: [
            "The minimum investment amount",
            "The annual fee charged as a percentage of your investment",
            "The fund's total assets",
            "The number of stocks in the fund",
          ],
          answer: 1,
        },
      ],
    },
  },
];

// ─── Storage Helpers ──────────────────────────────────────────────────────────

export function loadObjectivesProgress() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveObjectivesProgress(progress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // storage unavailable
  }
}

export function markObjectiveComplete(id, proofDataUrl) {
  const progress = loadObjectivesProgress();
  progress[id] = {
    completed: true,
    completedAt: new Date().toISOString(),
    proofDataUrl: proofDataUrl ?? null,
    cooldownUntil: null,
  };
  saveObjectivesProgress(progress);
}

export function setObjectiveCooldown(id) {
  const progress = loadObjectivesProgress();
  const cooldownUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  progress[id] = {
    ...progress[id],
    completed: false,
    cooldownUntil,
  };
  saveObjectivesProgress(progress);
}

export function isObjectiveOnCooldown(id) {
  const progress = loadObjectivesProgress();
  const entry = progress[id];
  if (!entry || !entry.cooldownUntil) return false;
  return new Date(entry.cooldownUntil) > new Date();
}

export function cooldownRemainingMs(id) {
  const progress = loadObjectivesProgress();
  const entry = progress[id];
  if (!entry || !entry.cooldownUntil) return 0;
  return Math.max(0, new Date(entry.cooldownUntil) - Date.now());
}
