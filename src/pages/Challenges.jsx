import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { auth, entities, profilesApi, notificationsApi, friendsApi, supabase } from '@/api/supabaseClient';
import { XP_ACTIONS, getLevelFromXP, COIN_ACTIONS } from '@/components/game/GameUtils';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import {
  Swords, Plus, Trophy, Clock, CheckCircle, Target, AtSign, Info, Users, Zap,
  ChevronDown, ChevronUp, CheckCircle2, Circle, Flame, BookOpen, Upload, AlertTriangle,
  ExternalLink, HelpCircle, X, Camera, ShieldCheck, Eye, MessageSquare, ThumbsUp, ThumbsDown,
  Crown, Star, GitBranch,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';

/* ── Design tokens ── */
const T = {
  dark:        '#0C0C0E',
  surface:     '#111114',
  surfaceAlt:  '#16161A',
  surfaceHigh: '#1C1C22',
  gold:        '#B8973A',
  goldLight:   '#D4AF5A',
  goldDim:     'rgba(184,151,58,0.12)',
  goldBorder:  'rgba(184,151,58,0.28)',
  border:      'rgba(255,255,255,0.07)',
  text:        '#F0EDE6',
  textMuted:   'rgba(240,237,230,0.45)',
  textDim:     'rgba(240,237,230,0.25)',
  danger:      '#C0392B',
  dangerDim:   'rgba(192,57,43,0.12)',
  success:     '#7EB88A',
  successDim:  'rgba(126,184,138,0.12)',
  info:        '#5B9BD5',
  infoDim:     'rgba(91,155,213,0.12)',
};

const cardStyle = {
  background: T.surfaceAlt,
  border: `1px solid ${T.border}`,
  borderRadius: 14,
  color: T.text,
};

const mutedBg = { background: T.surfaceHigh, borderRadius: 10 };

// ── QUIZ DATA ─────────────────────────────────────────────────────────────

// APY definition question (always first for HYSA quiz)
const APY_DEFINITION_Q = {
  question: 'What does APY stand for and what does it measure?',
  options: [
    'A) The total amount of money you must deposit to open the account.',
    'B) The fixed monthly fee the bank charges to keep your account open.',
    'C) The real rate of return on a deposit for one year, including the effect of compounding interest.',
    'D) The percentage of your balance that the government takes for taxes each year.',
  ],
  answer: 2, // index of correct option (C)
};

const HYSA_ACCOUNTS = [
  {
    name: 'American Express National Bank',
    question: 'What is the APY for this account and one of its main benefits?',
    options: [
      'A) 3.10% APY and a $400 bonus',
      'B) 3.20% APY and $0 monthly fees',
      'C) 4.00% APY and required AARP membership',
      'D) 3.80% APY and 24/7 physical branches',
    ],
    answer: 1,
  },
  {
    name: 'Centier Bank (via Raisin)',
    question: 'Centier Bank offers a 3.95% APY; what is the minimum deposit required to open it?',
    options: ['A) $0', 'B) $1', 'C) $100', 'D) $500'],
    answer: 1,
  },
  {
    name: 'Select Savings from Barclays',
    question: 'This account offers a 4.00% APY, but what is the "highlight" requirement to open it?',
    options: [
      'A) You must live in Delaware',
      'B) You must have a $10,000 opening deposit',
      'C) You must have a current AARP membership',
      'D) You must link it to QuickBooks',
    ],
    answer: 2,
  },
  {
    name: 'Western Alliance Bank',
    question: 'With a 3.80% APY, what is the highlight regarding your balance after opening the account?',
    options: [
      'A) You must maintain at least $5,000',
      'B) There is no minimum balance to maintain',
      'C) You must deposit $100 every month',
      'D) You must keep the account for 5 years',
    ],
    answer: 1,
  },
  {
    name: 'Synchrony Bank',
    question: 'What is the APY for Synchrony Bank and its fee structure?',
    options: [
      'A) 3.40% APY and no monthly fees',
      'B) 3.20% APY and a $5 monthly fee',
      'C) 4.00% APY and a $1 minimum to earn',
      'D) 3.10% APY and a $25 annual fee',
    ],
    answer: 0,
  },
  {
    name: 'SoFi Checking and Savings',
    question: 'SoFi offers up to 4.00% APY. How is this rate highlighted in the terms?',
    options: [
      'A) It is only for residents of California',
      'B) It includes a 0.70% boost for the first 6 months',
      'C) It requires a 10-year commitment',
      'D) It is only available for business accounts',
    ],
    answer: 1,
  },
  {
    name: 'E*TRADE Premium Savings',
    question: 'E*TRADE offers a 4.00% APY for 6 months. What is a highlight of their FDIC insurance?',
    options: [
      'A) They are not FDIC insured',
      'B) They offer standard $250,000 coverage only',
      'C) They can offer up to $500,000 in coverage under certain conditions',
      'D) Insurance only covers the first $10,000',
    ],
    answer: 2,
  },
  {
    name: 'Capital One',
    question: 'What is the APY for Capital One and its requirement to earn that rate?',
    options: [
      'A) 4.00% APY and a $5,000 minimum',
      'B) 3.10% APY and no minimum balance required to earn',
      'C) 3.80% APY and a monthly maintenance fee',
      'D) 3.40% APY and must be opened in person',
    ],
    answer: 1,
  },
];

const ROTH_IRA_QUESTIONS = [
  {
    question: 'What is the primary tax advantage of a Roth IRA?',
    options: [
      'A) You get a tax deduction for your contributions today.',
      'B) Your contributions grow tax-deferred and you pay taxes when you withdraw.',
      'C) You contribute after-tax dollars now to enjoy tax-free withdrawals in retirement.',
      'D) You do not have to pay capital gains taxes on any investments held for over one year.',
    ],
    answer: 2,
  },
  {
    question: 'Which of these is a requirement for a "qualified" (tax-free) withdrawal of earnings?',
    options: [
      'A) You must have a balance of at least $10,000.',
      'B) You must have contributed every single year for a decade.',
      'C) You must be at least 59½ years old and the account must be at least 5 years old.',
      'D) You must prove that the money is being used for a medical emergency.',
    ],
    answer: 2,
  },
  {
    question: 'What happens if your income (MAGI) exceeds the IRS annual limits?',
    options: [
      'A) You must close your existing Roth IRA immediately.',
      'B) You are required to pay a 10% penalty on your total account balance.',
      'C) You are restricted from making new direct contributions to a Roth IRA for that year.',
      'D) You must convert your Roth IRA into a Traditional IRA.',
    ],
    answer: 2,
  },
  {
    question: 'How do Roth IRA withdrawal rules differ for "contributions" versus "earnings"?',
    options: [
      'A) You can withdraw your original contributions at any time without taxes or penalties.',
      'B) You must wait until age 59½ to withdraw even your original contributions.',
      'C) Earnings can be withdrawn at any time, but contributions are locked until retirement.',
      'D) Both contributions and earnings are subject to a 10% penalty if taken before age 73.',
    ],
    answer: 0,
  },
  {
    question: 'What is the rule regarding Required Minimum Distributions (RMDs) for a Roth IRA owner?',
    options: [
      'A) You must start taking withdrawals at age 70½.',
      'B) You must take withdrawals once you stop working.',
      'C) There are no RMDs; you can keep the money in the account for as long as you live.',
      'D) You must withdraw at least 5% of the balance every year after age 59½.',
    ],
    answer: 2,
  },
];

const TAX_LOSS_QUESTIONS = [
  {
    question: 'What is the primary purpose of tax-loss harvesting?',
    options: [
      'A) To sell investments that are performing well to lock in profits.',
      'B) To sell investments at a loss to offset capital gains and reduce tax liability.',
      'C) To avoid paying any income tax for the rest of your life.',
      'D) To guarantee that your portfolio will never lose value during a market crash.',
    ],
    answer: 1,
  },
  {
    question: 'According to the IRS "wash-sale rule," how long must you wait before or after a sale to buy the same or "substantially identical" investment?',
    options: ['A) 7 days', 'B) 15 days', 'C) 30 days', 'D) 1 year'],
    answer: 2,
  },
  {
    question: 'If your total capital losses exceed your capital gains, what is the maximum amount of net loss you can use to offset your "ordinary income" in a single year?',
    options: ['A) $1,000', 'B) $3,000', 'C) $10,000', 'D) There is no limit.'],
    answer: 1,
  },
  {
    question: 'What happens to capital losses that are not fully used up in the current tax year?',
    options: [
      'A) They expire and can never be used again.',
      'B) They are converted into a tax refund check automatically.',
      'C) They can be "carried forward" to offset gains or income in future years.',
      'D) You must pay a penalty fee to keep them on your record.',
    ],
    answer: 2,
  },
  {
    question: 'Why is it important to reinvest the money from a tax-loss harvesting sale into a "similar" (but not identical) investment?',
    options: [
      'A) To ensure you get the exact same stock back at a lower price.',
      'B) To maintain your desired market exposure while complying with IRS rules.',
      'C) To bypass the $3,000 income offset limit.',
      'D) Because the IRS requires you to only buy bonds after selling stocks.',
    ],
    answer: 1,
  },
];

const INDEX_FUND_QUESTIONS = [
  {
    question: 'What is the primary goal of an index fund?',
    options: [
      'A) To hand-pick the top-performing stocks of the year.',
      'B) To beat the market returns by a significant margin.',
      'C) To match the performance of a specific market benchmark (or index) as closely as possible.',
      'D) To guarantee that investors never lose money during a market downturn.',
    ],
    answer: 2,
  },
  {
    question: 'How do actively managed funds try to achieve their goal of outperforming the market?',
    options: [
      'A) By buying every single stock available on the stock exchange.',
      'B) By using a portfolio manager\'s research and expertise to hand-select specific stocks or bonds.',
      'C) By strictly following a computer algorithm that mirrors the S&P 500.',
      'D) By only investing in government-backed savings bonds.',
    ],
    answer: 1,
  },
  {
    question: 'Which type of fund is generally considered more "tax-efficient" and why?',
    options: [
      'A) Index funds, because the manager trades less frequently, leading to fewer taxable capital gains.',
      'B) Active funds, because the manager can choose to only sell stocks when taxes are low.',
      'C) Index funds, because they are legally exempt from all federal income taxes.',
      'D) Active funds, because they are only available to be held in tax-free accounts like IRAs.',
    ],
    answer: 0,
  },
  {
    question: 'What is a specific risk associated with actively managed funds that is not present in index funds?',
    options: [
      'A) The risk that the entire stock market will go down.',
      'B) The risk that inflation will reduce the value of your money.',
      'C) The risk that the portfolio manager will make poor choices and underperform the benchmark.',
      'D) The risk that the fund will be forced to track an index.',
    ],
    answer: 2,
  },
  {
    question: 'According to the performance history mentioned in the article, what is true about active managers over the past 10 years?',
    options: [
      'A) 100% of active managers have beaten their benchmarks.',
      'B) No active managers were able to beat their benchmarks.',
      'C) Only a portion of active managers (roughly 79% for stocks and 83% for bonds) outperformed their benchmarks.',
      'D) Active managers are required by law to outperform the index funds.',
    ],
    answer: 2,
  },
];

const STRATEGIC_TACTICAL_QUESTIONS = [
  { question: 'What is the core difference between Strategic and Tactical Asset Allocation?', options: ['A) Strategic allocation changes monthly; tactical stays fixed forever.','B) Strategic sets a long-term fixed target mix; tactical actively shifts weights to exploit short-term market conditions.','C) Tactical allocation is only used for retirement accounts.','D) Strategic allocation only invests in stocks; tactical only in bonds.'], answer: 1 },
  { question: 'Which approach requires more frequent trading and monitoring?', options: ['A) Strategic Asset Allocation, because it rebalances every day.','B) Both require identical trading frequency.','C) Tactical Asset Allocation, because it adjusts positions based on short-term opportunities.','D) Neither — both are fully passive strategies.'], answer: 2 },
  { question: 'A long-term investor who sets a 60/40 stock-to-bond portfolio and rebalances annually is most likely using which strategy?', options: ['A) Tactical Asset Allocation','B) Strategic Asset Allocation','C) Arbitrage','D) Dividend Growth Investing'], answer: 1 },
];
const DIVIDEND_GROWTH_QUESTIONS = [
  { question: 'What is the main focus of Dividend Growth Investing?', options: ['A) Buying stocks with the highest current dividend yield, regardless of growth prospects.','B) Owning companies with a consistent history of growing their dividends over time.','C) Avoiding all dividend-paying stocks in favor of pure capital appreciation.','D) Only investing in government bonds that pay fixed interest.'], answer: 1 },
  { question: 'What is a key risk of chasing High Yield dividend stocks?', options: ['A) They always outperform the market over 10 years.','B) A very high yield can signal that the stock price has dropped due to company problems, making the dividend unsustainable.','C) They are exempt from capital gains taxes.','D) High yield stocks are always found in the technology sector.'], answer: 1 },
  { question: 'Which metric best indicates a dividend is sustainable and likely to keep growing?', options: ['A) A payout ratio above 95%.','B) A company with 25+ consecutive years of dividend increases (a "Dividend Aristocrat").','C) A yield that is more than double the market average.','D) The stock being listed on a foreign exchange.'], answer: 1 },
];
const STRATEGIC_GIFTING_QUESTIONS = [
  { question: 'What is the primary financial goal of "strategic gifting"?', options: ['A) To give gifts that maximize your personal income tax refund.','B) To transfer wealth to heirs and reduce the size of your taxable estate during your lifetime.','C) To receive gifts from family members tax-free.','D) To donate to charity and receive a 100% tax credit.'], answer: 1 },
  { question: 'What is the IRS Annual Gift Tax Exclusion designed to allow?', options: ['A) You can give unlimited amounts to any charity tax-free.','B) You can gift up to a set amount per person per year without it counting against your lifetime estate/gift tax exemption.','C) All gifts between family members are automatically exempt from taxes.','D) You can deduct the full value of any gift from your ordinary income.'], answer: 1 },
  { question: 'Which of these is an example of a strategic gifting vehicle that can pay for education tax-free?', options: ['A) A traditional 401(k)','B) A Health Savings Account (HSA)','C) A 529 College Savings Plan','D) A Certificate of Deposit (CD)'], answer: 2 },
];
const TRUST_QUESTIONS = [
  { question: 'What is the fundamental difference between a Revocable and an Irrevocable Trust?', options: ['A) Revocable trusts are only for married couples; irrevocable trusts are for individuals.','B) A revocable trust can be changed or cancelled by the grantor; an irrevocable trust generally cannot be modified once created.','C) Irrevocable trusts are free to set up; revocable trusts cost thousands of dollars.','D) Only irrevocable trusts can hold real estate.'], answer: 1 },
  { question: 'Which type of trust provides stronger protection from creditors and estate taxes?', options: ['A) Revocable Trust, because the grantor retains full control.','B) Both provide identical creditor protection.','C) Irrevocable Trust, because the assets are no longer legally owned by the grantor.','D) Neither trust offers any protection from creditors.'], answer: 2 },
  { question: 'A revocable living trust is often used to avoid what legal process?', options: ['A) Paying income taxes on investment gains.','B) Probate — the court-supervised process of distributing assets after death.','C) Filing annual tax returns.','D) Paying property taxes on real estate held in the trust.'], answer: 1 },
];
const LIFESTYLE_CREEP_QUESTIONS = [
  { question: 'What is "Lifestyle Creep" (also called lifestyle inflation)?', options: ['A) A situation where your investments grow faster than inflation.','B) The gradual increase in spending that occurs when rising income leads to higher personal expenses, leaving savings unchanged.','C) A tax strategy that reduces your taxable income each year.','D) The process of downgrading your lifestyle to save more money.'], answer: 1 },
  { question: 'Which strategy is most effective at preventing lifestyle creep after a raise?', options: ['A) Spending the entire raise immediately to enjoy the reward of your hard work.','B) Waiting to see if the raise is permanent before spending any of it.','C) Automatically directing a portion of every raise into savings or investments before you can spend it.','D) Using the raise to pay for more expensive leisure activities.'], answer: 2 },
  { question: 'Why is lifestyle creep considered dangerous for long-term wealth building?', options: ['A) Because spending more money always leads to debt.','B) Because it quietly erodes your savings rate and makes it very hard to build wealth even with a high income.','C) Because it is illegal in most states to increase spending after a raise.','D) Because it causes your credit score to drop significantly.'], answer: 1 },
];
const DECISION_FRAMEWORK_QUESTIONS = [
  { question: 'What is the primary purpose of using a structured decision framework?', options: ['A) To guarantee that every decision results in the best possible outcome.','B) To remove emotion and bias from the decision-making process by using a repeatable, logical structure.','C) To make decisions faster by skipping the analysis step.','D) To delegate all major decisions to a financial advisor.'], answer: 1 },
  { question: 'In a decision framework, what role does defining the problem clearly play?', options: ['A) It is optional — you can start evaluating options without defining the problem.','B) It is the least important step because the options are what really matter.','C) It is the critical first step, as a poorly defined problem leads to evaluating the wrong solutions.','D) It only matters for financial decisions, not personal ones.'], answer: 2 },
  { question: 'Which of these best describes the "second-order thinking" concept sometimes used in decision frameworks?', options: ['A) Only considering the immediate, obvious outcome of a decision.','B) Asking "and then what?" to consider the downstream consequences of a decision, not just the first result.','C) Making every decision twice to confirm the first choice was correct.','D) Always choosing the second option presented to avoid the anchoring bias of the first.'], answer: 1 },
];
const ARBITRAGE_QUESTIONS = [
  { question: 'What is the core definition of Arbitrage?', options: ['A) Borrowing money at a low interest rate to invest in high-risk assets.','B) Simultaneously buying and selling the same (or equivalent) asset in different markets to profit from a price difference.','C) A long-term investment strategy focused on holding undervalued stocks.','D) Selling all investments when the market is at its peak.'], answer: 1 },
  { question: 'Why do most pure arbitrage opportunities disappear quickly in modern markets?', options: ['A) Regulators make them illegal within 24 hours of being discovered.','B) Institutional investors and algorithmic traders identify and exploit price gaps so rapidly that they close almost immediately.','C) Arbitrage requires physical delivery of goods, which takes weeks.','D) Banks charge fees that make all arbitrage unprofitable.'], answer: 1 },
  { question: 'Which of the following is a real-world, practical form of "retail arbitrage"?', options: ["A) Shorting a company's stock on one exchange while buying it on another.",'B) Buying discounted clearance items from one store and reselling them at a higher price on an online marketplace.','C) Using a credit card with 0% APR to invest in treasury bonds.','D) Exchanging foreign currency at the airport for a better rate.'], answer: 1 },
];
const SBLOC_QUESTIONS = [
  { question: 'What is a Securities-Backed Line of Credit (SBLOC)?', options: ['A) A loan from your broker that requires you to sell your investments to receive funds.','B) A revolving line of credit where your investment portfolio serves as collateral, letting you borrow without selling your assets.','C) A type of mortgage backed by government securities.','D) A savings account offered by brokerage firms with higher interest rates.'], answer: 1 },
  { question: 'What is a major risk of using an SBLOC?', options: ['A) You will lose your brokerage account permanently if you use this feature.','B) Interest rates on SBLOCs are always higher than credit card rates.','C) If your portfolio value drops significantly, the lender can issue a "maintenance call," requiring you to repay part of the loan or pledge more assets.','D) SBLOCs are only available to corporations, not individuals.'], answer: 2 },
  { question: 'Why do wealthy investors sometimes prefer an SBLOC over selling investments to access cash?', options: ['A) Selling investments is illegal for high-net-worth individuals.','B) SBLOCs are always free with no interest charges.','C) Borrowing against a portfolio avoids triggering a taxable capital gains event and allows investments to continue growing.','D) The IRS requires investors with over $1M to use SBLOCs instead of selling.'], answer: 2 },
];

// ── CHALLENGE POOL ─────────────────────────────────────────────────────────
const CHALLENGE_POOL = {
  bank_account: [
    { id: 'ba1', text: 'Commit to at least one "No-Spend" day where you only use what you already have at home.', completionType: 'photo', photoPrompt: 'Upload a photo proving your No-Spend day (e.g., a picture of items you already had at home).' },
    { id: 'ba2', text: 'Only spend cash for a day, and review your spending habits.', completionType: 'direct' },
    { id: 'ba3', text: 'Keep your finances in check — set a low balance notification.', completionType: 'photo', photoPrompt: 'Upload a screenshot of your low balance notification being set (blur any sensitive account info).' },
  ],
  savings_account: [
    { id: 'sa1', text: 'Set up (or add another) weekly automatic transfer of $5 into savings.', completionType: 'photo', photoPrompt: 'Upload a screenshot of your automatic $5 transfer confirmation (blur account numbers and personal info).' },
  ],
  all: [
    { id: 'al1', text: 'Meal prep for 3 days to reduce spending and save time.', completionType: 'photo', photoPrompt: 'Upload a photo of your meal prep containers or prepped food.' },
    { id: 'al2', text: 'Study one of these High-Yield Savings Accounts (HYSAs).', link: 'https://www.bestmoney.com/online-banking/compare-savings-accounts?utm_source=google&kw=hysa&sk=hysa&c=754435351814&t=search&p=&m=e&dev=c&network=g&campaignid=22602285091&devmod=&mobval=0&groupid=183812048567&targetid=kwd-498508174472&interest=&physical=1026339&feedid=&eid=&a=11000&topic=Google_Savings_Desktop&ctype=&camtype=ps&ts=HYSA&niche=&exp=&pq=&dyn=&gad_source=1&gad_campaignid=22602285091&gbraid=0AAAAACvAeKTFuegNdIuobh7k0HQOM8C7I&gclid=EAIaIQobChMIzujvk_SalAMVuVJ_AB3vlQXuEAAYASAAEgJbOfD_BwE', completionType: 'quiz', quizType: 'hysa', passingScore: 'perfect' },
    { id: 'al3', text: 'Learn about what is a Roth IRA.', link: 'https://www.fidelity.com/learning-center/smart-money/what-is-a-roth-ira', completionType: 'quiz', quizType: 'roth_ira', passingScore: 4 },
    { id: 'al4', text: 'Learn about tax-loss harvesting.', link: 'https://investor.vanguard.com/investor-resources-education/taxes/offset-gains-loss-harvesting', completionType: 'quiz', quizType: 'tax_loss', passingScore: 4 },
    { id: 'al5', text: 'While shopping, compare unit prices to make more cost-effective decisions.', completionType: 'direct' },
    { id: 'al6', text: 'Review and refine your "Financial Independence" number as your expenses or goals change.', completionType: 'fi_calculator' },
    { id: 'al7', text: 'Take 30 minutes to reflect on and write down 5 financial anxieties.', completionType: 'photo', photoPrompt: 'Upload a photo of your written financial anxieties (paper or document — no screen required).' },
    { id: 'al8', text: 'Compare investment strategies (index funds vs. active management).', link: 'https://investor.vanguard.com/investor-resources-education/understanding-investment-types/index-funds-vs-actively-managed-funds', completionType: 'quiz', quizType: 'index_funds', passingScore: 4 },
    { id: 'al9', text: 'Expand your skills by learning and trying one new low-cost recipe this week.', completionType: 'photo', photoPrompt: 'Upload a photo of the recipe you made (show the dish or the recipe card).' },
    { id: 'al10', text: 'Add a success or failure entry to your personal diary.', completionType: 'diary' },
    { id: 'al11', text: 'Compare investment strategies: Strategic vs. Tactical Asset Allocation.', link: 'https://cornerstoneportfolioresearch.com/financial-planning/strategic-vs-tactical-asset-allocation-key-differences-explained/', completionType: 'quiz', quizType: 'strategic_tactical', passingScore: 2 },
    { id: 'al12', text: 'Compare investment strategies: Dividend Growth vs. High Yield.', link: 'https://www.youtube.com/watch?v=p-rlUb1PHkg', completionType: 'quiz', quizType: 'dividend_growth', passingScore: 2 },
    { id: 'al13', text: 'Learn about Strategic Gifting.', link: 'https://www.youtube.com/watch?v=dvKpQYSAM_A', completionType: 'quiz', quizType: 'strategic_gifting', passingScore: 2 },
    { id: 'al14', text: 'Study the difference between Revocable and Irrevocable Trusts.', link: 'https://www.youtube.com/watch?v=vgpKyB2DHKw', completionType: 'quiz', quizType: 'trusts', passingScore: 2 },
    { id: 'al15', text: 'Understand Lifestyle Creep Management.', link: 'https://www.youtube.com/watch?v=L4Y-HjQBEyE', completionType: 'quiz', quizType: 'lifestyle_creep', passingScore: 2 },
    { id: 'al16', text: 'Understand Decision Frameworks.', link: 'https://www.youtube.com/watch?v=fo0qfcER3sY', completionType: 'quiz', quizType: 'decision_frameworks', passingScore: 2 },
    { id: 'al17', text: 'Learn about Arbitrage.', link: 'https://www.youtube.com/watch?v=MhwrQpXQq4I', completionType: 'quiz', quizType: 'arbitrage', passingScore: 2 },
    { id: 'al18', text: 'Watch and learn about SBLOCs (Securities-Backed Lines of Credit).', link: 'https://www.youtube.com/watch?v=AOrmfr-vpC0', completionType: 'quiz', quizType: 'sbloc', passingScore: 2 },
  ],
};

const CATEGORY_LABELS = {
  bank_account:    { label: 'Bank Account',    icon: 'B' },
  savings_account: { label: 'Savings Account', icon: 'S' },
  all:             { label: 'All',             icon: 'A' },
};

function pickNFrom(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

function generateRushTasks(hasBank = true, hasSavings = true) {
  const all = Object.entries(CHALLENGE_POOL).flatMap(([cat, tasks]) => {
    if (cat === 'bank_account'    && !hasBank)    return [];
    if (cat === 'savings_account' && !hasSavings) return [];
    return tasks.map(t => ({ ...t, category: cat, completed_by: [], proof_urls: {} }));
  });
  return pickNFrom(all, Math.min(10, all.length));
}

// ── HYSA QUIZ COMPONENT ────────────────────────────────────────────────────
function HYSAQuiz({ onComplete, onFail, cooldownKey }) {
  const [step, setStep] = useState('definition'); // 'definition' | 'pick_account' | 'account_question'
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [definitionAnswer, setDefinitionAnswer] = useState(null);
  const [accountAnswer, setAccountAnswer] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleDefinitionSubmit = () => {
    setSubmitted(true);
    setTimeout(() => {
      if (definitionAnswer === APY_DEFINITION_Q.answer) {
        setStep('pick_account');
        setSubmitted(false);
      } else {
        if (cooldownKey) localStorage.setItem(cooldownKey, new Date(Date.now() + 24*3600*1000).toISOString());
        onFail('Incorrect answer on APY definition. 1-day cooldown applied.');
      }
    }, 800);
  };

  const handleAccountSubmit = () => {
    setSubmitted(true);
    const correctBoth = accountAnswer === selectedAccount.answer;
    setTimeout(() => {
      if (correctBoth) {
        onComplete();
      } else {
        if (cooldownKey) localStorage.setItem(cooldownKey, new Date(Date.now() + 24*3600*1000).toISOString());
        onFail('Incorrect answer. 1-day cooldown applied.');
      }
    }, 800);
  };

  if (step === 'definition') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>
          <strong style={{ color: T.text }}>Step 1 of 2:</strong> Answer this question correctly, then pick an account to study.
        </p>
        <QuestionBlock
          question={APY_DEFINITION_Q.question}
          options={APY_DEFINITION_Q.options}
          answer={APY_DEFINITION_Q.answer}
          selected={definitionAnswer}
          onSelect={setDefinitionAnswer}
          submitted={submitted}
        />
        <button
          disabled={definitionAnswer === null || submitted}
          onClick={handleDefinitionSubmit}
          style={quizBtnStyle(definitionAnswer !== null && !submitted)}
        >
          Submit Answer
        </button>
      </div>
    );
  }

  if (step === 'pick_account') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>
          <strong style={{ color: T.gold }}>✓ Step 1 complete!</strong> Now pick which HYSA account you focused on:
        </p>
        {HYSA_ACCOUNTS.map((acc, i) => (
          <button key={i} onClick={() => { setSelectedAccount(acc); setStep('account_question'); }}
            style={{
              padding: '10px 14px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
              background: T.surfaceHigh, border: `1px solid ${T.border}`,
              color: T.text, fontSize: 12, fontWeight: 500, transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = T.goldBorder}
            onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
          >
            {acc.name}
          </button>
        ))}
      </div>
    );
  }

  if (step === 'account_question') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>
          <strong style={{ color: T.text }}>Step 2 of 2:</strong> {selectedAccount.name}
        </p>
        <QuestionBlock
          question={selectedAccount.question}
          options={selectedAccount.options}
          answer={selectedAccount.answer}
          selected={accountAnswer}
          onSelect={setAccountAnswer}
          submitted={submitted}
        />
        <button
          disabled={accountAnswer === null || submitted}
          onClick={handleAccountSubmit}
          style={quizBtnStyle(accountAnswer !== null && !submitted)}
        >
          Submit Answer
        </button>
      </div>
    );
  }

  return null;
}

// ── STANDARD QUIZ COMPONENT ────────────────────────────────────────────────
function StandardQuiz({ questions, passingScore, onComplete, onFail, cooldownKey }) {
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(null);

  const handleSubmit = () => {
    const correct = answers.reduce((acc, a, i) => acc + (a === questions[i].answer ? 1 : 0), 0);
    setScore(correct);
    setSubmitted(true);
    setTimeout(() => {
      if (correct >= passingScore) {
        onComplete();
      } else {
        // Persist 24-hour cooldown so the modal blocks retakes
        if (cooldownKey) {
          const cooldownEnd = new Date(Date.now() + 24 * 3600 * 1000);
          localStorage.setItem(cooldownKey, cooldownEnd.toISOString());
        }
        onFail(`You scored ${correct}/${questions.length}. Need ${passingScore}/${questions.length} to pass. 1-day cooldown applied.`);
      }
    }, 1200);
  };

  const allAnswered = answers.every(a => a !== null);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>
        Answer {passingScore}/{questions.length} correctly to complete this objective.
      </p>
      {questions.map((q, i) => (
        <QuestionBlock
          key={i}
          question={`${i + 1}. ${q.question}`}
          options={q.options}
          answer={q.answer}
          selected={answers[i]}
          onSelect={val => {
            if (submitted) return;
            const next = [...answers];
            next[i] = val;
            setAnswers(next);
          }}
          submitted={submitted}
        />
      ))}
      {submitted && score !== null && (
        <div style={{
          padding: '10px 14px', borderRadius: 10,
          background: score >= passingScore ? T.successDim : T.dangerDim,
          border: `1px solid ${score >= passingScore ? 'rgba(126,184,138,0.28)' : 'rgba(192,57,43,0.28)'}`,
          fontSize: 12, fontWeight: 600,
          color: score >= passingScore ? T.success : T.danger,
        }}>
          {score >= passingScore
            ? `🎉 Passed! You scored ${score}/${questions.length}.`
            : `❌ Score: ${score}/${questions.length}. Need ${passingScore} to pass.`}
        </div>
      )}
      {!submitted && (
        <button
          disabled={!allAnswered}
          onClick={handleSubmit}
          style={quizBtnStyle(allAnswered)}
        >
          Submit Quiz
        </button>
      )}
    </div>
  );
}

// ── QUESTION BLOCK ─────────────────────────────────────────────────────────
function QuestionBlock({ question, options, answer, selected, onSelect, submitted }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: 0, lineHeight: 1.55 }}>{question}</p>
      {options.map((opt, i) => {
        let bg = T.surfaceHigh;
        let border = T.border;
        let color = T.text;
        if (selected === i) { bg = T.goldDim; border = T.goldBorder; }
        if (submitted) {
          if (i === answer) { bg = T.successDim; border = 'rgba(126,184,138,0.5)'; color = T.success; }
          else if (selected === i && i !== answer) { bg = T.dangerDim; border = 'rgba(192,57,43,0.4)'; color = T.danger; }
        }
        return (
          <button key={i} onClick={() => !submitted && onSelect(i)}
            style={{
              padding: '9px 12px', borderRadius: 9, textAlign: 'left', cursor: submitted ? 'default' : 'pointer',
              background: bg, border: `1px solid ${border}`, color, fontSize: 11.5, lineHeight: 1.45,
              transition: 'all 0.12s',
            }}
          >
            {opt}
          </button>
        );
      })}
    </div>
  );
}

const quizBtnStyle = (enabled) => ({
  padding: '10px 16px', borderRadius: 10, border: 'none', cursor: enabled ? 'pointer' : 'not-allowed',
  background: enabled ? `linear-gradient(135deg, ${T.gold}, ${T.goldLight})` : T.surfaceHigh,
  color: enabled ? '#0C0C0E' : T.textMuted, fontSize: 12, fontWeight: 700,
  opacity: enabled ? 1 : 0.6, transition: 'all 0.15s',
});

// ── FI CALCULATOR ─────────────────────────────────────────────────────────
function FICalculator({ onComplete }) {
  const [annualExpenses, setAnnualExpenses] = useState('');
  const [result, setResult] = useState(null);

  const calculate = () => {
    const val = parseFloat(annualExpenses);
    if (!val || val <= 0) return;
    setResult(val * 25);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <p style={{ fontSize: 12, color: T.textMuted, margin: 0, lineHeight: 1.55 }}>
        Enter your annual expenses to calculate your Financial Independence (FI) number.
        <br />
        <span style={{ fontSize: 11, color: T.textDim }}>Formula: Annual Expenses × 25 = FI Target</span>
      </p>
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, fontSize: 13 }}>$</span>
          <input
            type="number"
            value={annualExpenses}
            onChange={e => { setAnnualExpenses(e.target.value); setResult(null); }}
            placeholder="e.g. 40000"
            style={{
              width: '100%', paddingLeft: 24, paddingRight: 12, paddingTop: 9, paddingBottom: 9,
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9,
              color: T.text, fontSize: 13, outline: 'none', boxSizing: 'border-box',
            }}
          />
        </div>
        <button onClick={calculate} style={{
          padding: '9px 16px', borderRadius: 9, border: 'none', cursor: 'pointer',
          background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
          color: '#0C0C0E', fontSize: 12, fontWeight: 700,
        }}>
          Calculate
        </button>
      </div>
      {result !== null && (
        <div style={{
          padding: '14px 16px', borderRadius: 12, background: T.goldDim,
          border: `1px solid ${T.goldBorder}`,
        }}>
          <p style={{ fontSize: 11, color: T.textMuted, margin: '0 0 4px' }}>Your FI Number</p>
          <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 28, color: T.gold, margin: '0 0 8px' }}>
            ${result.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p style={{ fontSize: 10, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>
            Based on ${parseFloat(annualExpenses).toLocaleString()} annual expenses × 25 (25× rule / 4% withdrawal rate)
          </p>
          <button onClick={onComplete} style={{
            marginTop: 12, padding: '8px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
            background: T.success, color: '#0C0C0E', fontSize: 11, fontWeight: 700,
          }}>
            ✓ Mark Objective Complete
          </button>
        </div>
      )}
    </div>
  );
}

// ── PROOF UPLOAD COMPONENT ─────────────────────────────────────────────────
function ProofUpload({ prompt, onUpload, existingUrl }) {
  const fileRef = useRef(null);
  const [preview, setPreview] = useState(existingUrl || null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file) => {
    if (!file || !file.type.startsWith('image/')) {
      toast.error('Please select an image file.');
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split('.').pop();
      const fileName = `proof_${Date.now()}.${ext}`;
      const { data, error } = await supabase.storage
        .from('challenge-proofs')
        .upload(fileName, file, { upsert: true });

      if (error) throw error;

      const { data: urlData } = supabase.storage.from('challenge-proofs').getPublicUrl(fileName);
      const publicUrl = urlData.publicUrl;
      setPreview(publicUrl);
      onUpload(publicUrl);
      toast.success('Proof uploaded!');
    } catch (err) {
      // Fallback: use a local object URL for environments without the bucket
      const objUrl = URL.createObjectURL(file);
      setPreview(objUrl);
      onUpload(objUrl);
      toast.success('Proof ready for submission.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Disclaimer */}
      <div style={{
        display: 'flex', gap: 8, padding: '10px 12px', borderRadius: 10,
        background: 'rgba(91,155,213,0.1)', border: '1px solid rgba(91,155,213,0.25)',
      }}>
        <AlertTriangle style={{ width: 13, height: 13, color: T.info, flexShrink: 0, marginTop: 1 }} />
        <p style={{ fontSize: 11, color: T.info, margin: 0, lineHeight: 1.5 }}>
          <strong>Privacy reminder:</strong> Before uploading, please blur or remove any personal information, account numbers, or sensitive data from your image.
        </p>
      </div>

      <p style={{ fontSize: 12, color: T.textMuted, margin: 0 }}>{prompt}</p>

      {preview ? (
        <div style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.goldBorder}` }}>
          <img src={preview} alt="Proof" style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }} />
          <button
            onClick={() => { setPreview(null); onUpload(null); }}
            style={{
              position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)',
              border: 'none', borderRadius: '50%', padding: 4, cursor: 'pointer', color: T.text,
              display: 'flex', alignItems: 'center',
            }}
          >
            <X style={{ width: 12, height: 12 }} />
          </button>
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: '6px 10px', background: 'rgba(0,0,0,0.6)',
            display: 'flex', alignItems: 'center', gap: 5,
          }}>
            <CheckCircle2 style={{ width: 11, height: 11, color: T.success }} />
            <span style={{ fontSize: 10, color: T.success, fontWeight: 600 }}>Proof ready</span>
          </div>
        </div>
      ) : (
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            padding: '18px', borderRadius: 12, border: `2px dashed ${T.border}`,
            background: T.surfaceHigh, cursor: 'pointer', textAlign: 'center',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8,
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.borderColor = T.goldBorder}
          onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
        >
          {uploading
            ? <div style={{ width: 18, height: 18, border: `2px solid ${T.textMuted}`, borderTopColor: T.gold, borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            : <Camera style={{ width: 22, height: 22, color: T.textMuted }} />}
          <span style={{ fontSize: 12, color: T.textMuted, fontWeight: 500 }}>
            {uploading ? 'Uploading...' : 'Tap to upload proof image'}
          </span>
          <span style={{ fontSize: 10, color: T.textDim }}>JPG, PNG, WEBP supported</span>
        </button>
      )}

      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
    </div>
  );
}

// ── TASK COMPLETION MODAL ──────────────────────────────────────────────────
function TaskCompletionModal({ task, userId, onComplete, onClose }) {
  const [proofUrl, setProofUrl] = useState(null);
  const [quizPassed, setQuizPassed] = useState(false);
  const type = task.completionType || 'direct';
  const hasLink = !!task.link;
  const quizCooldownKey = type === 'quiz' ? `quiz_cooldown_${task.id}_${userId}` : null;

  const [cooldownMsg, setCooldownMsg] = useState(() => {
    if (type !== 'quiz') return null;
    const key = `quiz_cooldown_${task.id}_${userId}`;
    const stored = localStorage.getItem(key);
    if (!stored) return null;
    const end = new Date(stored);
    if (new Date() < end) {
      const h = Math.ceil((end - new Date()) / 3600000);
      return `You failed this quiz recently. Try again in ${h}h.`;
    }
    localStorage.removeItem(key);
    return null;
  });
  const [fiDone, setFiDone] = useState(false);



  const handleComplete = () => {
    if (type === 'photo' && !proofUrl) {
      toast.error('Please upload proof before marking complete.');
      return;
    }
    onComplete(proofUrl);
  };

  const handleQuizFail = (msg) => {
    setCooldownMsg(msg);
  };

  const handleQuizPass = () => {
    setQuizPassed(true);
    setTimeout(() => onComplete(null), 600);
  };

  const handleFiComplete = () => {
    setFiDone(true);
    setTimeout(() => onComplete(null), 600);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 16,
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        style={{
          background: T.surfaceAlt, border: `1px solid ${T.goldBorder}`,
          borderRadius: 18, padding: 24, maxWidth: 500, width: '100%',
          maxHeight: '85vh', overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16, gap: 12 }}>
          <div style={{ flex: 1 }}>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 18, color: T.text, margin: '0 0 6px' }}>
              Complete Objective
            </h3>
            <p style={{ fontSize: 12, color: T.textMuted, margin: 0, lineHeight: 1.5 }}>{task.text}</p>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, padding: 2 }}>
            <X style={{ width: 16, height: 16 }} />
          </button>
        </div>

        {cooldownMsg ? (
          <div style={{
            padding: '14px 16px', borderRadius: 12,
            background: T.dangerDim, border: '1px solid rgba(192,57,43,0.3)',
          }}>
            <p style={{ fontSize: 12, color: T.danger, margin: '0 0 8px', fontWeight: 600 }}>❌ {cooldownMsg}</p>
            <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>Come back tomorrow to try again.</p>
            <button onClick={onClose} style={{
              marginTop: 12, padding: '8px 14px', borderRadius: 9, border: 'none', cursor: 'pointer',
              background: T.surfaceHigh, color: T.text, fontSize: 11, fontWeight: 600,
            }}>Got it</button>
          </div>
        ) : quizPassed || fiDone ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle2 style={{ width: 36, height: 36, color: T.success, margin: '0 auto 10px' }} />
            <p style={{ fontSize: 14, fontWeight: 700, color: T.success, margin: 0 }}>Objective Completed!</p>
          </div>
        ) : (
          <>
            {/* Study link (always shown if hasLink and type is quiz) */}
            {hasLink && type === 'quiz' && (
              <div style={{ marginBottom: 16, padding: '10px 12px', borderRadius: 10, background: T.goldDim, border: `1px solid ${T.goldBorder}` }}>
                <p style={{ fontSize: 11, color: T.gold, margin: '0 0 6px', fontWeight: 600 }}>
                  Step 1: Study the material first
                </p>
                <a
                  href={task.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    fontSize: 11, color: T.gold, fontWeight: 600, textDecoration: 'none',
                  }}
                >
                  <ExternalLink style={{ width: 11, height: 11 }} /> Open Study Material
                </a>
                <p style={{ fontSize: 10, color: T.textMuted, margin: '6px 0 0' }}>
                  Then come back and take the quiz below (Step 2).
                </p>
              </div>
            )}

            {/* Render by type */}
            {type === 'quiz' && task.quizType === 'hysa' && (
              <HYSAQuiz onComplete={handleQuizPass} onFail={handleQuizFail} cooldownKey={quizCooldownKey} />
            )}

            {type === 'quiz' && task.quizType === 'roth_ira' && (
              <StandardQuiz questions={ROTH_IRA_QUESTIONS} passingScore={task.passingScore} onComplete={handleQuizPass} onFail={handleQuizFail} cooldownKey={quizCooldownKey} />
            )}

            {type === 'quiz' && task.quizType === 'tax_loss' && (
              <StandardQuiz questions={TAX_LOSS_QUESTIONS} passingScore={task.passingScore} onComplete={handleQuizPass} onFail={handleQuizFail} cooldownKey={quizCooldownKey} />
            )}

            {type === 'quiz' && task.quizType === 'index_funds' && (
              <StandardQuiz questions={INDEX_FUND_QUESTIONS} passingScore={task.passingScore} onComplete={handleQuizPass} onFail={handleQuizFail} cooldownKey={quizCooldownKey} />
            )}

            {type === 'photo' && (() => {
              const myPending = task.pending_review?.[userId];
              const myProof   = task.proof_urls?.[userId];
              const isDenied  = task.denied_users?.[userId];

              if (isDenied) return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ padding: '12px 14px', borderRadius: 10, background: T.dangerDim, border: '1px solid rgba(192,57,43,0.3)' }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: T.danger, margin: '0 0 4px' }}>Proof Denied</p>
                    <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>{isDenied.reason}</p>
                  </div>
                  <ProofUpload prompt={task.photoPrompt} onUpload={setProofUrl} existingUrl={null} />
                  <button onClick={handleComplete} disabled={!proofUrl} style={quizBtnStyle(!!proofUrl)}>
                    <Upload style={{ width: 13, height: 13, display: 'inline', marginRight: 6 }} />
                    Resubmit Proof
                  </button>
                </div>
              );

              if (myPending) return (
                <div style={{ padding: '20px', textAlign: 'center', borderRadius: 12, background: 'rgba(91,155,213,0.08)', border: '1px solid rgba(91,155,213,0.25)' }}>
                  <Clock style={{ width: 24, height: 24, color: T.info, margin: '0 auto 10px' }} />
                  <p style={{ fontSize: 13, fontWeight: 700, color: T.info, margin: '0 0 4px' }}>In Review</p>
                  <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>Your proof has been submitted and is waiting for owner approval.</p>
                </div>
              );

              return (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <ProofUpload prompt={task.photoPrompt} onUpload={setProofUrl} existingUrl={null} />
                  <button onClick={handleComplete} disabled={!proofUrl} style={quizBtnStyle(!!proofUrl)}>
                    <Upload style={{ width: 13, height: 13, display: 'inline', marginRight: 6 }} />
                    Submit Proof for Review
                  </button>
                  <p style={{ fontSize: 10, color: T.textMuted, margin: 0, textAlign: 'center' }}>
                    The owner will review and approve your submission.
                  </p>
                </div>
              );
            })()}

            {type === 'fi_calculator' && (
              <FICalculator onComplete={handleFiComplete} />
            )}

            {type === 'diary' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 12, color: T.textMuted, margin: 0, lineHeight: 1.55 }}>
                  Head to your Diary tab, add a success or failure entry, then come back and mark this complete.
                </p>
                <a href="/Diary" target="_blank" rel="noopener noreferrer"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '9px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600, background: T.goldDim, border: `1px solid ${T.goldBorder}`, color: T.gold, textDecoration: 'none' }}>
                  <ExternalLink style={{ width: 12, height: 12 }} /> Open Diary
                </a>
                <button onClick={() => onComplete(null)} style={quizBtnStyle(true)}>
                  <CheckCircle2 style={{ width: 13, height: 13, display: 'inline', marginRight: 6 }} />
                  Mark as Complete
                </button>
              </div>
            )}
            {type === 'quiz' && task.quizType === 'strategic_tactical' && (<StandardQuiz questions={STRATEGIC_TACTICAL_QUESTIONS} passingScore={task.passingScore} onComplete={handleQuizPass} onFail={handleQuizFail} cooldownKey={quizCooldownKey} />)}
            {type === 'quiz' && task.quizType === 'dividend_growth' && (<StandardQuiz questions={DIVIDEND_GROWTH_QUESTIONS} passingScore={task.passingScore} onComplete={handleQuizPass} onFail={handleQuizFail} cooldownKey={quizCooldownKey} />)}
            {type === 'quiz' && task.quizType === 'strategic_gifting' && (<StandardQuiz questions={STRATEGIC_GIFTING_QUESTIONS} passingScore={task.passingScore} onComplete={handleQuizPass} onFail={handleQuizFail} cooldownKey={quizCooldownKey} />)}
            {type === 'quiz' && task.quizType === 'trusts' && (<StandardQuiz questions={TRUST_QUESTIONS} passingScore={task.passingScore} onComplete={handleQuizPass} onFail={handleQuizFail} cooldownKey={quizCooldownKey} />)}
            {type === 'quiz' && task.quizType === 'lifestyle_creep' && (<StandardQuiz questions={LIFESTYLE_CREEP_QUESTIONS} passingScore={task.passingScore} onComplete={handleQuizPass} onFail={handleQuizFail} cooldownKey={quizCooldownKey} />)}
            {type === 'quiz' && task.quizType === 'decision_frameworks' && (<StandardQuiz questions={DECISION_FRAMEWORK_QUESTIONS} passingScore={task.passingScore} onComplete={handleQuizPass} onFail={handleQuizFail} cooldownKey={quizCooldownKey} />)}
            {type === 'quiz' && task.quizType === 'arbitrage' && (<StandardQuiz questions={ARBITRAGE_QUESTIONS} passingScore={task.passingScore} onComplete={handleQuizPass} onFail={handleQuizFail} cooldownKey={quizCooldownKey} />)}
            {type === 'quiz' && task.quizType === 'sbloc' && (<StandardQuiz questions={SBLOC_QUESTIONS} passingScore={task.passingScore} onComplete={handleQuizPass} onFail={handleQuizFail} cooldownKey={quizCooldownKey} />)}

            {type === 'direct' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {hasLink && (
                  <a href={task.link} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      padding: '9px 14px', borderRadius: 9, fontSize: 12, fontWeight: 600,
                      background: T.goldDim, border: `1px solid ${T.goldBorder}`,
                      color: T.gold, textDecoration: 'none',
                    }}>
                    <ExternalLink style={{ width: 12, height: 12 }} /> Open Resource
                  </a>
                )}
                <button onClick={() => onComplete(null)} style={quizBtnStyle(true)}>
                  <CheckCircle2 style={{ width: 13, height: 13, display: 'inline', marginRight: 6 }} />
                  Mark as Complete
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </div>
  );
}

// ── HOW IT WORKS ──────────────────────────────────────────────────────────
function HowItWorks({ open, onClose }) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
          style={{
            background: T.surfaceAlt,
            border: `1px solid ${T.goldBorder}`,
            borderRadius: 16,
            padding: 20,
            marginBottom: 4,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h3 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 600, fontSize: 17,
              color: T.text,
              display: 'flex', alignItems: 'center', gap: 8, margin: 0,
            }}>
              <Swords style={{ width: 15, height: 15, color: T.gold }} /> How Clashes Work
            </h3>
            <button onClick={onClose} style={{ color: T.textMuted, fontSize: 11, background: 'none', border: 'none', cursor: 'pointer' }}>
              Close
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            {[
              { title: 'Savings Battle',   desc: 'Log income & expenses all week. Whoever saves more money wins.' },
              { title: 'Challenge Rush',   desc: '10 random tasks are assigned. Finish all 10 first — or the most by the deadline.' },
              { title: 'Proof Required',   desc: 'Photo tasks require an uploaded image. Quiz tasks require a correct score. No self-reporting.' },
              { title: 'Winner Takes XP',  desc: 'Win a clash to earn +100 XP. Completing any clash gives +50 XP.' },
            ].map((s, i) => (
              <div key={i} style={{ padding: '12px 14px', background: T.surfaceHigh, borderRadius: 10, border: `1px solid ${T.border}` }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: T.text, marginBottom: 4 }}>{s.title}</p>
                <p style={{ fontSize: 11, color: T.textMuted, lineHeight: 1.5 }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div style={{
            background: T.goldDim, border: `1px solid ${T.goldBorder}`,
            borderRadius: 10, padding: '10px 14px',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <Zap style={{ width: 14, height: 14, color: T.gold, flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 11, color: T.gold, fontWeight: 500, lineHeight: 1.5 }}>
              In Challenge Rush, the first player to complete all tasks wins instantly — no need to wait for the deadline.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── SAVINGS PROGRESS BAR ──────────────────────────────────────────────────
function ClashProgressBar({ mySavings, opponentSavings, goal, myUsername, opponentUsername }) {
  const total = (mySavings || 0) + (opponentSavings || 0);
  const myPct = total > 0 ? Math.round(((mySavings || 0) / total) * 100) : 50;
  const oppPct = 100 - myPct;
  const goalPct = goal ? Math.min(100, Math.round(((mySavings || 0) / goal) * 100)) : null;
  const winning = (mySavings || 0) > (opponentSavings || 0);
  const tied    = (mySavings || 0) === (opponentSavings || 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ position: 'relative', height: 6, borderRadius: 99, overflow: 'hidden', background: T.surfaceHigh, display: 'flex' }}>
        <motion.div
          initial={{ width: '50%' }}
          animate={{ width: `${myPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ height: '100%', background: `linear-gradient(90deg, ${T.gold}, ${T.goldLight})`, borderRadius: '99px 0 0 99px' }}
        />
        <motion.div
          initial={{ width: '50%' }}
          animate={{ width: `${oppPct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ height: '100%', background: 'rgba(255,255,255,0.1)', borderRadius: '0 99px 99px 0' }}
        />
        <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: T.surfaceAlt, transform: 'translateX(-50%)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
        <span style={{ fontWeight: 700, color: winning && !tied ? T.gold : T.textMuted }}>
          {winning && !tied ? '+ ' : ''}You ${(mySavings || 0).toFixed(0)}
        </span>
        <span style={{ fontWeight: 700, color: !winning && !tied ? T.text : T.textMuted }}>
          @{opponentUsername} ${(opponentSavings || 0).toFixed(0)}{!winning && !tied ? ' +' : ''}
        </span>
      </div>
      {goal && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: T.textMuted, marginBottom: 4 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Target style={{ width: 10, height: 10 }} /> Your goal progress
            </span>
            <span>{goalPct}% of ${goal}</span>
          </div>
          <div style={{ height: 3, background: T.surfaceHigh, borderRadius: 99, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${goalPct}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              style={{ height: '100%', background: T.gold, borderRadius: 99 }}
            />
          </div>
        </div>
      )}
      <p style={{ fontSize: 10, textAlign: 'center', color: T.textMuted }}>
        {tied ? "Tied — log a transaction to pull ahead." : winning ? `Leading by $${((mySavings || 0) - (opponentSavings || 0)).toFixed(0)}` : `$${((opponentSavings || 0) - (mySavings || 0)).toFixed(0)} behind — catch up!`}
      </p>
    </div>
  );
}

// ── RUSH TASK LIST (proof-based) ───────────────────────────────────────────
function RushTaskList({ tasks, myId, challengeId, isActive, onTaskComplete }) {
  const [activeModal, setActiveModal] = useState(null); // task index
  const myCompleted = tasks.filter(t => (t.completed_by || []).includes(myId)).length;
  const total = tasks.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
        <span style={{ fontSize: 11, color: T.textMuted, fontWeight: 600 }}>Your progress</span>
        <span style={{ fontSize: 11, color: T.gold, fontWeight: 700 }}>{myCompleted}/{total} done</span>
      </div>
      <div style={{ height: 3, background: T.surfaceHigh, borderRadius: 99, overflow: 'hidden', marginBottom: 6 }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(myCompleted / total) * 100}%` }}
          transition={{ duration: 0.5 }}
          style={{ height: '100%', background: `linear-gradient(90deg, ${T.gold}, ${T.goldLight})`, borderRadius: 99 }}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
        {tasks.map((task, i) => {
          const iDoneIt  = (task.completed_by || []).includes(myId);
          const catInfo  = CATEGORY_LABELS[task.category] || { label: task.category, icon: '·' };
          const hasLink  = !!task.link;
          const type     = task.completionType || 'direct';

          return (
            <div key={task.id || i} style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '10px 12px', borderRadius: 10,
              background: iDoneIt ? T.goldDim : T.surfaceHigh,
              border: `1px solid ${iDoneIt ? T.goldBorder : T.border}`,
              transition: 'all 0.15s',
            }}>
              {/* Status icon */}
              <div style={{ flexShrink: 0, marginTop: 1 }}>
                {iDoneIt
                  ? <CheckCircle2 style={{ width: 15, height: 15, color: T.gold }} />
                  : <Circle style={{ width: 15, height: 15, color: T.textMuted }} />}
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{
                  fontSize: 11, lineHeight: 1.55, margin: 0,
                  color: iDoneIt ? T.textMuted : T.text,
                  textDecoration: iDoneIt ? 'line-through' : 'none',
                }}>{task.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 6, gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 9, color: T.textDim, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                    {catInfo.label}
                  </span>
                  <div style={{ display: 'flex', gap: 5 }}>
                    {hasLink && !iDoneIt && (
                      <button
                        style={{
                          background: T.goldDim, border: `1px solid ${T.goldBorder}`, cursor: 'pointer',
                          color: T.gold, padding: '3px 7px', borderRadius: 6,
                          display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600,
                        }}
                        onClick={e => { e.stopPropagation(); window.open(task.link, '_blank'); }}
                      >
                        <BookOpen style={{ width: 10, height: 10 }} /> Study
                      </button>
                    )}
                    {!iDoneIt && isActive && (
                      <button
                        style={{
                          background: type === 'photo' ? 'rgba(91,155,213,0.15)' : T.goldDim,
                          border: `1px solid ${type === 'photo' ? 'rgba(91,155,213,0.3)' : T.goldBorder}`,
                          cursor: 'pointer',
                          color: type === 'photo' ? T.info : T.gold,
                          padding: '3px 7px', borderRadius: 6,
                          display: 'flex', alignItems: 'center', gap: 3, fontSize: 10, fontWeight: 600,
                        }}
                        onClick={e => { e.stopPropagation(); setActiveModal(i); }}
                      >
                        {type === 'photo' && <Upload style={{ width: 10, height: 10 }} />}
                        {type === 'quiz' && <HelpCircle style={{ width: 10, height: 10 }} />}
                        {type === 'direct' || type === 'fi_calculator' ? <CheckCircle2 style={{ width: 10, height: 10 }} /> : null}
                        {type === 'photo' ? 'Upload Proof' : type === 'quiz' ? 'Take Quiz' : 'Complete'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AnimatePresence>
        {activeModal !== null && (
          <TaskCompletionModal
            task={tasks[activeModal]}
            userId={myId}
            onComplete={(proofUrl) => {
              onTaskComplete(tasks[activeModal], activeModal, proofUrl);
              setActiveModal(null);
            }}
            onClose={() => setActiveModal(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── AVATAR MAP ─────────────────────────────────────────────────────────────
const AVATAR_PRESETS = {
  avatar1:'🦁', avatar2:'🐯', avatar3:'🦊', avatar4:'🐺', avatar5:'🦅',
  avatar6:'🐉', avatar7:'🦄', avatar8:'🐻', avatar9:'🦈', avatar10:'🍆',
  avatar11:'🐸', avatar12:'🦉',
};

// ── MAIN PAGE ──────────────────────────────────────────────────────────────

// ── OWNER PROOF REVIEW TAB ─────────────────────────────────────────────────
function OwnerProofReviewTab({ challenges, onAccept, onReject }) {
  const [rejectModal, setRejectModal] = useState(null); // { challenge, taskIndex, userId, username }
  const [rejectReason, setRejectReason] = useState('');

  // Collect all pending proofs across all challenges
  const pendingProofs = [];
  (challenges || []).forEach(ch => {
    (ch.rush_tasks || []).forEach((task, tIdx) => {
      const pending = task.pending_review || {};
      Object.entries(pending).forEach(([uid, info]) => {
        pendingProofs.push({ challenge: ch, task, taskIndex: tIdx, userId: uid, info });
      });
    });
  });

  const handleRejectSubmit = () => {
    if (!rejectReason.trim()) { return; }
    const { challenge, taskIndex, userId } = rejectModal;
    onReject(challenge, taskIndex, userId, rejectReason.trim());
    setRejectModal(null);
    setRejectReason('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header banner */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 10,
        padding: '12px 16px', borderRadius: 12,
        background: 'rgba(184,151,58,0.08)', border: `1px solid ${T.goldBorder}`,
      }}>
        <ShieldCheck style={{ width: 16, height: 16, color: T.gold, flexShrink: 0 }} />
        <div>
          <p style={{ fontSize: 12, fontWeight: 700, color: T.gold, margin: 0 }}>Owner Review Panel</p>
          <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>
            {pendingProofs.length === 0
              ? 'No pending proofs right now.'
              : `${pendingProofs.length} proof${pendingProofs.length > 1 ? 's' : ''} waiting for review`}
          </p>
        </div>
      </div>

      {pendingProofs.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: T.textMuted }}>
          <Eye style={{ width: 36, height: 36, margin: '0 auto 14px', opacity: 0.15 }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: T.text, marginBottom: 4 }}>All clear</p>
          <p style={{ fontSize: 11 }}>No photo proofs waiting for review.</p>
        </div>
      ) : (
        pendingProofs.map(({ challenge, task, taskIndex, userId, info }, i) => (
          <motion.div
            key={`${challenge.id}-${taskIndex}-${userId}`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              background: T.surfaceAlt,
              border: `1px solid ${T.border}`,
              borderRadius: 14,
              overflow: 'hidden',
            }}
          >
            {/* Card header */}
            <div style={{ padding: '14px 16px', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: T.text, margin: '0 0 3px' }}>
                    @{info.username}
                  </p>
                  <p style={{ fontSize: 10, color: T.textMuted, margin: 0 }}>
                    {challenge.title} · Task {taskIndex + 1}
                  </p>
                </div>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                  padding: '3px 8px', borderRadius: 99,
                  background: 'rgba(91,155,213,0.12)', color: T.info,
                  border: '1px solid rgba(91,155,213,0.25)',
                }}>Pending</span>
              </div>
              <p style={{ fontSize: 11, color: T.textMuted, margin: '8px 0 0', lineHeight: 1.5 }}>
                {task.text}
              </p>
              {info.submittedAt && (
                <p style={{ fontSize: 10, color: T.textDim, margin: '4px 0 0' }}>
                  Submitted {new Date(info.submittedAt).toLocaleString()}
                </p>
              )}
            </div>

            {/* Proof image */}
            <div style={{ padding: '14px 16px' }}>
              {info.proofUrl ? (
                <div style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${T.border}`, marginBottom: 14 }}>
                  <img
                    src={info.proofUrl}
                    alt="Submitted proof"
                    style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }}
                  />
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: T.textMuted, fontSize: 11, marginBottom: 14 }}>
                  No image preview available.
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => onAccept(challenge, taskIndex, userId)}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: T.successDim, color: T.success,
                    fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                    border: '1px solid rgba(126,184,138,0.3)',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(126,184,138,0.22)'}
                  onMouseLeave={e => e.currentTarget.style.background = T.successDim}
                >
                  <ThumbsUp style={{ width: 13, height: 13 }} /> Accept
                </button>
                <button
                  onClick={() => { setRejectModal({ challenge, taskIndex, userId, username: info.username }); setRejectReason(''); }}
                  style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    padding: '10px', borderRadius: 10, border: '1px solid rgba(192,57,43,0.3)', cursor: 'pointer',
                    background: T.dangerDim, color: T.danger,
                    fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(192,57,43,0.22)'}
                  onMouseLeave={e => e.currentTarget.style.background = T.dangerDim}
                >
                  <ThumbsDown style={{ width: 13, height: 13 }} /> Reject
                </button>
              </div>
            </div>
          </motion.div>
        ))
      )}

      {/* Reject reason modal */}
      <AnimatePresence>
        {rejectModal && (
          <div style={{
            position: 'fixed', inset: 0, zIndex: 1100,
            background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 20,
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              style={{
                background: T.surfaceAlt, border: `1px solid rgba(192,57,43,0.4)`,
                borderRadius: 18, padding: 24, maxWidth: 440, width: '100%',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 18, color: T.text, margin: 0 }}>
                  Reject Proof
                </h3>
                <button onClick={() => setRejectModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted }}>
                  <X style={{ width: 16, height: 16 }} />
                </button>
              </div>
              <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 14, lineHeight: 1.55 }}>
                Rejecting <strong style={{ color: T.text }}>@{rejectModal.username}</strong>'s proof.
                A message with your reason will be sent to their inbox.
              </p>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: T.textMuted, display: 'block', marginBottom: 6 }}>
                  Reason for rejection
                </label>
                <textarea
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  placeholder="e.g. The photo doesn't clearly show the required proof. Please resubmit with a clearer image."
                  rows={4}
                  style={{
                    width: '100%', padding: '10px 12px',
                    background: T.surface, border: `1px solid ${T.border}`,
                    borderRadius: 10, color: T.text, fontSize: 12, lineHeight: 1.55,
                    resize: 'vertical', outline: 'none', boxSizing: 'border-box',
                    fontFamily: "'DM Sans', sans-serif",
                  }}
                  onFocus={e => e.currentTarget.style.borderColor = T.goldBorder}
                  onBlur={e => e.currentTarget.style.borderColor = T.border}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  onClick={() => setRejectModal(null)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, border: `1px solid ${T.border}`,
                    background: T.surfaceHigh, color: T.textMuted, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  disabled={!rejectReason.trim()}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, border: 'none', cursor: rejectReason.trim() ? 'pointer' : 'not-allowed',
                    background: rejectReason.trim() ? T.danger : T.surfaceHigh,
                    color: rejectReason.trim() ? '#fff' : T.textMuted,
                    fontSize: 12, fontWeight: 700, transition: 'all 0.15s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}
                >
                  <MessageSquare style={{ width: 13, height: 13 }} /> Send Rejection
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}


// ─────────────────────────────────────────────────────────────────────────────
// TOURNAMENT BRACKET DISPLAY
// ─────────────────────────────────────────────────────────────────────────────
function TournamentBracket({ tournament, participants, currentUserId }) {
  const size = tournament.size || 4;
  const rounds = Math.log2(size);
  const bracket = tournament.bracket || [];
  const roundsData = [];
  for (let r = 1; r <= rounds; r++) roundsData.push(bracket.filter(m => m.round === r));

  const getLbl = (r, total) => {
    if (r === total) return 'Final';
    if (r === total - 1 && total >= 3) return 'Semi-Finals';
    if (r === total - 2 && total >= 4) return 'Quarter-Finals';
    return `Round ${r}`;
  };

  const myActiveMatch = bracket.find(m => m.status === 'active' && (m.p1_id === currentUserId || m.p2_id === currentUserId));

  return (
    <div style={{
      background: 'linear-gradient(160deg, #0a0a0f 0%, #111118 60%, #0e0c08 100%)',
      border: `2px solid ${T.goldBorder}`,
      borderRadius: 20,
      marginBottom: 8,
      overflow: 'hidden',
      boxShadow: '0 8px 40px rgba(184,151,58,0.12), 0 2px 8px rgba(0,0,0,0.6)',
    }}>
      {/* Gold top bar */}
      <div style={{ height: 3, background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)` }} />

      {/* Header */}
      <div style={{ padding: '18px 20px 14px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid rgba(184,151,58,0.12)` }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: T.goldDim, border: `1px solid ${T.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Crown style={{ width: 18, height: 18, color: T.gold }} />
        </div>
        <div style={{ flex: 1 }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 20, color: T.text, margin: 0, lineHeight: 1.1 }}>
            {tournament.title}
          </h3>
          <p style={{ fontSize: 10, color: T.textMuted, margin: '2px 0 0', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {size}-Player Bracket · {tournament.status === 'completed' ? 'Finished' : 'In Progress'}
          </p>
        </div>
        {myActiveMatch && (
          <div style={{ padding: '5px 12px', borderRadius: 99, background: 'rgba(184,151,58,0.2)', border: `1px solid ${T.goldBorder}`, fontSize: 10, fontWeight: 800, color: T.gold, letterSpacing: '0.06em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>
            Your Turn
          </div>
        )}
        {tournament.winner_username && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 99, background: T.goldDim, border: `1px solid ${T.goldBorder}` }}>
            <Trophy style={{ width: 11, height: 11, color: T.gold }} />
            <span style={{ fontSize: 11, color: T.gold, fontWeight: 700 }}>@{tournament.winner_username}</span>
          </div>
        )}
      </div>

      {/* Participants row */}
      <div style={{ padding: '10px 20px', display: 'flex', gap: 6, flexWrap: 'wrap', borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
        {(tournament.participants || []).map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 9px', borderRadius: 99, background: p.userId === currentUserId ? T.goldDim : 'rgba(255,255,255,0.04)', border: `1px solid ${p.userId === currentUserId ? T.goldBorder : T.border}` }}>
            <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(184,151,58,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, color: T.gold }}>
              {p.username?.[0]?.toUpperCase() || '?'}
            </div>
            <span style={{ fontSize: 10, fontWeight: p.userId === currentUserId ? 700 : 500, color: p.userId === currentUserId ? T.gold : T.textMuted }}>
              @{p.username}
            </span>
          </div>
        ))}
      </div>

      {/* Bracket grid */}
      <div style={{ padding: '16px 20px 20px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: 10, alignItems: 'stretch', minWidth: rounds * 175 }}>
          {roundsData.map((roundMatches, rIdx) => {
            const r = rIdx + 1;
            const isLast = r === rounds;
            const cellH = 90;
            const gapBetween = rIdx === 0 ? 8 : (cellH + 8) * Math.pow(2, rIdx) - cellH;

            return (
              <div key={r} style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{
                  fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: isLast ? T.gold : T.textMuted,
                  textAlign: 'center', marginBottom: 10, paddingBottom: 6,
                  borderBottom: `1px solid ${isLast ? T.goldBorder : 'rgba(255,255,255,0.05)'}`,
                }}>
                  {getLbl(r, rounds)}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: gapBetween, paddingTop: rIdx === 0 ? 0 : (cellH + 8) * (Math.pow(2, rIdx) - 1) / 2 }}>
                  {Array.from({ length: Math.max(roundMatches.length, size / Math.pow(2, r)) }).map((_, mIdx) => {
                    const match = roundMatches[mIdx] || null;
                    const p1 = match?.p1_username;
                    const p2 = match?.p2_username;
                    const winner = match?.winner_username;
                    const isMyMatch = match && (match.p1_id === currentUserId || match.p2_id === currentUserId);
                    const isActive = match?.status === 'active';

                    return (
                      <div key={mIdx} style={{
                        borderRadius: 11,
                        border: `1.5px solid ${isMyMatch && isActive ? T.goldBorder : isMyMatch ? 'rgba(184,151,58,0.3)' : T.border}`,
                        overflow: 'hidden',
                        background: isMyMatch && isActive ? 'linear-gradient(135deg, rgba(184,151,58,0.08), rgba(184,151,58,0.03))' : '#13131a',
                        boxShadow: isMyMatch && isActive ? '0 0 20px rgba(184,151,58,0.18), inset 0 0 20px rgba(184,151,58,0.03)' : 'none',
                        minWidth: 155,
                        position: 'relative',
                      }}>
                        {isMyMatch && isActive && (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${T.gold}, transparent)` }} />
                        )}
                        {[{ name: p1, id: match?.p1_id }, { name: p2, id: match?.p2_id }].map(({ name, id }, side) => (
                          <div key={side} style={{
                            display: 'flex', alignItems: 'center', gap: 7, padding: '10px 10px',
                            background: winner && winner === name ? 'rgba(184,151,58,0.1)' : 'transparent',
                            borderBottom: side === 0 ? `1px solid rgba(255,255,255,0.05)` : 'none',
                            opacity: !name ? 0.3 : 1,
                          }}>
                            <div style={{
                              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                              background: id === currentUserId ? 'rgba(184,151,58,0.2)' : 'rgba(255,255,255,0.06)',
                              border: `1.5px solid ${winner === name ? T.goldBorder : id === currentUserId ? 'rgba(184,151,58,0.4)' : 'rgba(255,255,255,0.08)'}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: 10, fontWeight: 700, color: id === currentUserId ? T.gold : T.textMuted,
                            }}>
                              {name ? name[0].toUpperCase() : '?'}
                            </div>
                            <span style={{
                              fontSize: 11, fontWeight: winner === name ? 700 : id === currentUserId ? 600 : 400,
                              color: winner === name ? T.gold : id === currentUserId ? T.text : name ? T.textMuted : T.textDim,
                              flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                              {name ? `@${name}` : 'TBD'}
                            </span>
                            {winner === name && <Trophy style={{ width: 10, height: 10, color: T.gold, flexShrink: 0 }} />}
                            {id === currentUserId && !winner && isActive && <Star style={{ width: 9, height: 9, color: T.gold, flexShrink: 0 }} />}
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {tournament.winner_username && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingLeft: 10 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: T.gold, textTransform: 'uppercase', marginBottom: 10 }}>Champion</div>
              <div style={{ padding: '16px 18px', borderRadius: 14, textAlign: 'center', background: T.goldDim, border: `1px solid ${T.goldBorder}`, boxShadow: '0 0 30px rgba(184,151,58,0.22)' }}>
                <Crown style={{ width: 24, height: 24, color: T.gold, margin: '0 auto 8px' }} />
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 16, color: T.gold, margin: 0 }}>@{tournament.winner_username}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── CREATE TOURNAMENT DIALOG ─────────────────────────────────────────────────
function CreateTournamentDialog({ open, onClose, user, myProfile, friendProfiles, onCreated }) {
  const [size, setSize] = useState(4);
  const [title, setTitle] = useState('');
  // selectedPlayers: array of {username, userId, display_name, level, avatar, custom_avatar_url}
  const [selectedPlayers, setSelectedPlayers] = useState([]);
  const [manualInput, setManualInput] = useState('');
  const [creating, setCreating] = useState(false);
  const needed = size - 1;

  useEffect(() => { setSelectedPlayers([]); }, [size]);

  const addFriend = (fp) => {
    if (selectedPlayers.length >= needed) return;
    if (selectedPlayers.find(p => p.username === fp.username)) return;
    setSelectedPlayers(prev => [...prev, {
      username: fp.username,
      userId: fp.created_by,
      display_name: fp.display_name,
      level: fp.level || 1,
      custom_avatar_url: fp.custom_avatar_url,
      fromFriend: true,
    }]);
  };

  const addManual = async () => {
    const u = manualInput.trim().replace('@', '');
    if (!u) return;
    if (selectedPlayers.length >= needed) { toast.error(`Already have ${needed} players selected`); return; }
    if (selectedPlayers.find(p => p.username === u)) { toast.error('Already added'); return; }
    try {
      const p = await profilesApi.getByUsername(u);
      if (!p) { toast.error(`@${u} not found`); return; }
      setSelectedPlayers(prev => [...prev, {
        username: p.username,
        userId: p.created_by,
        display_name: p.display_name,
        level: p.level || 1,
        custom_avatar_url: p.custom_avatar_url,
        fromFriend: false,
      }]);
      setManualInput('');
    } catch(e) { toast.error('User not found'); }
  };

  const removePlayer = (username) => setSelectedPlayers(prev => prev.filter(p => p.username !== username));

  const handleCreate = async () => {
    if (!title.trim()) { toast.error('Add a tournament title'); return; }
    if (selectedPlayers.length < needed) { toast.error(`Select ${needed - selectedPlayers.length} more player(s)`); return; }
    setCreating(true);
    try {
      const allParticipants = [
        { userId: user.id, username: myProfile?.username, level: myProfile?.level || 1, avatar: myProfile?.avatar_preset || null },
        ...selectedPlayers.map(p => ({ userId: p.userId, username: p.username, level: p.level || 1, avatar: null })),
      ];
      const shuffled = [...allParticipants].sort(() => Math.random() - 0.5);
      const bracket = [];
      for (let i = 0; i < size / 2; i++) {
        bracket.push({
          round: 1, match: i + 1,
          p1_id: shuffled[i*2].userId, p1_username: shuffled[i*2].username,
          p2_id: shuffled[i*2+1].userId, p2_username: shuffled[i*2+1].username,
          winner_id: null, winner_username: null,
          challenge_id: null, status: 'active',
          tasks: generateRushTasks(hasBank !== false, hasSavings !== false),
        });
      }
      const tournament = await entities.Tournament.create({
        title: title.trim(), size, status: 'active', bracket,
        participants: allParticipants, created_by: user.id,
        creator_username: myProfile?.username, winner_id: null, winner_username: null,
      });
      for (const p of selectedPlayers) {
        await notificationsApi.send({
          recipient_id: p.userId, sender_id: user.id,
          sender_username: myProfile?.username || 'Someone',
          type: 'clash_invite', title: 'Tournament Invite',
          body: `@${myProfile?.username} has invited you to the "${title.trim()}" tournament (${size}-player bracket). Head to Challenges to compete.`,
          read: false,
        }).catch(() => {});
      }
      toast.success('Tournament created! Invites sent to all players.');
      onCreated(tournament);
    } catch(e) {
      console.error('Tournament creation error:', e);
      toast.error(e.message || e.details || e.hint || 'Failed to create tournament');
    } finally { setCreating(false); }
  };

  if (!open) return null;

  const availableFriends = (friendProfiles || []).filter(fp =>
    fp.username !== myProfile?.username &&
    !selectedPlayers.find(p => p.username === fp.username)
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <motion.div initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
        style={{ background: T.surfaceAlt, border: `1px solid ${T.goldBorder}`, borderRadius: 18, padding: 24, maxWidth: 460, width: '100%', maxHeight: '88vh', overflowY: 'auto' }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 20, color: T.text, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Crown style={{ width: 16, height: 16, color: T.gold }} /> New Tournament
          </h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted }}><X style={{ width: 16, height: 16 }} /></button>
        </div>

        {/* Size picker */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, display: 'block', marginBottom: 8 }}>Tournament Size</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[4, 8].map(s => (
              <button key={s} onClick={() => setSize(s)} type="button" style={{ padding: '14px', borderRadius: 12, border: `1.5px solid ${size === s ? T.goldBorder : T.border}`, background: size === s ? T.goldDim : T.surfaceHigh, cursor: 'pointer', textAlign: 'center', transition: 'all 0.15s' }}>
                <Crown style={{ width: 18, height: 18, color: size === s ? T.gold : T.textMuted, margin: '0 auto 6px' }} />
                <p style={{ fontSize: 16, fontWeight: 800, color: size === s ? T.gold : T.text, margin: 0 }}>{s} Players</p>
                <p style={{ fontSize: 10, color: T.textMuted, margin: '4px 0 0' }}>{Math.log2(s)} rounds</p>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, display: 'block', marginBottom: 6 }}>Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Cash Clash Championship"
            style={{ width: '100%', padding: '10px 12px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9, color: T.text, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.currentTarget.style.borderColor = T.goldBorder}
            onBlur={e => e.currentTarget.style.borderColor = T.border}
          />
        </div>

        {/* Selected players */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted }}>
              Players Selected
            </label>
            <span style={{ fontSize: 10, fontWeight: 700, color: selectedPlayers.length >= needed ? T.success : T.gold }}>
              {selectedPlayers.length + 1}/{size}
            </span>
          </div>

          {/* You (creator) always shown */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 99, background: T.goldDim, border: `1px solid ${T.goldBorder}` }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(184,151,58,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: T.gold }}>
                {myProfile?.username?.[0]?.toUpperCase() || 'Y'}
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: T.gold }}>@{myProfile?.username} (you)</span>
            </div>
            {selectedPlayers.map(p => (
              <div key={p.username} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', borderRadius: 99, background: T.surfaceHigh, border: `1px solid ${T.border}` }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', overflow: 'hidden', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: T.text, flexShrink: 0 }}>
                  {p.custom_avatar_url
                    ? <img src={p.custom_avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (p.username?.[0]?.toUpperCase() || '?')}
                </div>
                <span style={{ fontSize: 11, color: T.text }}>@{p.username}</span>
                <button onClick={() => removePlayer(p.username)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMuted, padding: 0, display: 'flex', lineHeight: 1 }}>
                  <X style={{ width: 11, height: 11 }} />
                </button>
              </div>
            ))}
            {Array.from({ length: needed - selectedPlayers.length }).map((_, i) => (
              <div key={`empty-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 10px', borderRadius: 99, background: T.surface, border: `1px dashed ${T.border}` }}>
                <span style={{ fontSize: 11, color: T.textDim }}>+ player</span>
              </div>
            ))}
          </div>
        </div>

        {/* Friends list */}
        {availableFriends.length > 0 && selectedPlayers.length < needed && (
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, display: 'block', marginBottom: 8 }}>Add from Friends</label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 200, overflowY: 'auto', borderRadius: 10, border: `1px solid ${T.border}`, overflow: 'hidden' }}>
              {availableFriends.map(fp => (
                <button key={fp.id} onClick={() => addFriend(fp)} type="button"
                  style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: 'none', border: 'none', borderBottom: `1px solid ${T.border}`, cursor: 'pointer', textAlign: 'left', transition: 'background 0.1s', width: '100%' }}
                  onMouseEnter={e => e.currentTarget.style.background = T.surfaceHigh}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1.5px solid rgba(184,151,58,0.3)', background: 'rgba(184,151,58,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {fp.custom_avatar_url
                      ? <img src={fp.custom_avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <span style={{ fontSize: 13, fontWeight: 700, color: T.gold }}>{(fp.display_name || fp.username || '?')[0].toUpperCase()}</span>}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: 0 }}>{fp.display_name || fp.username}</p>
                    <p style={{ fontSize: 10, color: T.textMuted, margin: 0 }}>@{fp.username} · Lv.{fp.level || 1}</p>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: T.goldDim, border: `1px solid ${T.goldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Plus style={{ width: 11, height: 11, color: T.gold }} />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Manual username input */}
        {selectedPlayers.length < needed && (
          <div style={{ marginBottom: 18 }}>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, display: 'block', marginBottom: 6 }}>Or Add by Username</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ position: 'relative', flex: 1 }}>
                <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, fontSize: 12 }}>@</span>
                <input value={manualInput} onChange={e => setManualInput(e.target.value.replace('@', ''))}
                  onKeyDown={e => e.key === 'Enter' && addManual()}
                  placeholder="username"
                  style={{ width: '100%', paddingLeft: 26, paddingRight: 12, paddingTop: 9, paddingBottom: 9, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 9, color: T.text, fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
                  onFocus={e => e.currentTarget.style.borderColor = T.goldBorder}
                  onBlur={e => e.currentTarget.style.borderColor = T.border}
                />
              </div>
              <button onClick={addManual} type="button" style={{ padding: '9px 14px', borderRadius: 9, background: T.goldDim, border: `1px solid ${T.goldBorder}`, color: T.gold, fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                Add
              </button>
            </div>
          </div>
        )}

        <div style={{ padding: '10px 14px', borderRadius: 10, background: T.goldDim, border: `1px solid ${T.goldBorder}`, marginBottom: 18, fontSize: 11, color: T.gold, lineHeight: 1.55 }}>
          <strong>How it works:</strong> Players are randomly seeded. Each match is a Challenge Rush — complete all tasks before your opponent. Winners advance until one player remains.
        </div>

        <button onClick={handleCreate} disabled={creating || selectedPlayers.length < needed} style={{
          width: '100%', padding: '12px', borderRadius: 11, border: 'none',
          cursor: (creating || selectedPlayers.length < needed) ? 'not-allowed' : 'pointer',
          background: selectedPlayers.length >= needed ? `linear-gradient(135deg, ${T.gold}, ${T.goldLight})` : T.surfaceHigh,
          color: selectedPlayers.length >= needed ? '#0C0C0E' : T.textMuted,
          fontSize: 13, fontWeight: 800, opacity: creating ? 0.7 : 1,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s',
        }}>
          {creating
            ? <div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#0C0C0E', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
            : <Crown style={{ width: 14, height: 14 }} />}
          {selectedPlayers.length >= needed ? 'Create Tournament' : `Select ${needed - selectedPlayers.length} more player${needed - selectedPlayers.length > 1 ? 's' : ''}`}
        </button>
      </motion.div>
    </div>
  );
}

export default function Challenges() {
  const [user, setUser] = useState(null);
  const [myProfile, setMyProfile] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [howOpen, setHowOpen] = useState(false);
  const [hasBank,       setHasBank]       = useState(null);
  const [hasSavings,    setHasSavings]    = useState(null);
  const [onboardDone,   setOnboardDone]   = useState(true);
  const [gameMode, setGameMode] = useState('savings');
  const [deadlineDays, setDeadlineDays] = useState(7);
  const [form, setForm] = useState({ title: '', opponent_username: '', savings_goal: '' });
  const [searching, setSearching] = useState(false);
  const [showFriendPicker, setShowFriendPicker] = useState(false);
  const [activeTab, setActiveTab] = useState('clashes'); // 'clashes' | 'review' | 'tournaments'
  const [tournamentDialogOpen, setTournamentDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const location = useLocation();

  useEffect(() => {
    auth.me().then(u => {
      setUser(u);
      profilesApi.getByUserId(u.id).then(p => {
        setMyProfile(p);
        if (p && p.has_bank_account !== null && p.has_bank_account !== undefined
              && p.has_savings_account !== null && p.has_savings_account !== undefined) {
          setHasBank(p.has_bank_account);
          setHasSavings(p.has_savings_account);
          setOnboardDone(true);
        } else {
          // prefs not set yet — show the onboarding modal
          setOnboardDone(false);
        }
      }).catch(() => {});
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (location.state?.prefillUsername) {
      setForm(f => ({ ...f, opponent_username: location.state.prefillUsername }));
      setDialogOpen(true);
    }
  }, [location.state]);

  const { data: challenges } = useQuery({
    queryKey: ['challenges'],
    queryFn: () => entities.Challenge.list('-created_date', 50),
    enabled: !!user,
    initialData: [],
  });

  const { data: tournaments = [] } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => entities.Tournament.list('-created_at', 30),
    enabled: !!user,
    initialData: [],
  });

  const myTournaments = tournaments.filter(t =>
    t.created_by === user?.id ||
    (t.participants || []).some(p => p.userId === user?.id)
  );

  const { data: myFriends = [] } = useQuery({
    queryKey: ['friends', user?.id],
    queryFn: () => friendsApi.getMyFriends(user?.id),
    enabled: !!user?.id,
  });

  const { data: friendProfiles = [] } = useQuery({
    queryKey: ['friend-profiles-challenge', myFriends.map(f => f.id)],
    queryFn: async () => {
      if (!myFriends.length) return [];
      const otherIds = myFriends.map(f => f.requester_id === user.id ? f.recipient_id : f.requester_id);
      const { data } = await supabase.from('user_profiles').select('*').in('created_by', otherIds);
      return data || [];
    },
    enabled: myFriends.length > 0,
  });

  const myChallenges = challenges.filter(c => c.challenger_id === user?.id || c.opponent_id === user?.id);
  const active    = myChallenges.filter(c => c.status === 'active');
  const pending   = myChallenges.filter(c => c.status === 'pending');
  const completed = myChallenges.filter(c => c.status === 'completed');

  const handleCreate = async () => {
    if (!form.title || !form.opponent_username) { toast.error('Please fill in all fields'); return; }
    if (gameMode === 'savings' && !form.savings_goal) { toast.error('Please set a savings goal'); return; }
    setSearching(true);
    try {
      const opponent = await profilesApi.getByUsername(form.opponent_username.toLowerCase().replace('@', ''));
      if (!opponent) { toast.error('Username not found.'); return; }
      if (opponent.created_by === user.id) { toast.error("You can't challenge yourself!"); return; }

      const weekStart = new Date();
      const weekEnd   = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + deadlineDays);

      const rushTasks = gameMode === 'rush' ? generateRushTasks(hasBank !== false, hasSavings !== false) : null;

      await entities.Challenge.create({
        title: form.title,
        savings_goal: gameMode === 'savings' ? parseFloat(form.savings_goal) : null,
        game_mode: gameMode,
        rush_tasks: rushTasks,
        challenger_id: user.id,
        challenger_username: myProfile?.username || '',
        challenger_email: user.email,
        challenger_name: myProfile?.display_name || user.email,
        opponent_id: opponent.created_by,
        opponent_username: opponent.username,
        opponent_email: opponent.email || '',
        opponent_name: opponent.display_name,
        week_start: format(weekStart, 'yyyy-MM-dd'),
        week_end:   format(weekEnd,   'yyyy-MM-dd'),
        challenger_savings: 0,
        opponent_savings: 0,
        status: 'pending',
      });

      await notificationsApi.send({
        recipient_id: opponent.created_by,
        sender_id: user.id,
        sender_username: myProfile?.username || 'Someone',
        type: 'clash_invite',
        title: 'Clash Invite',
        body: `@${myProfile?.username || 'Someone'} challenged you to "${form.title}" (${gameMode === 'rush' ? 'Challenge Rush' : 'Savings Battle'})!`,
        read: false,
      });

      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      setDialogOpen(false);
      setForm({ title: '', opponent_username: '', savings_goal: '' });
      setGameMode('savings');
      toast.success(`Clash sent to @${opponent.username}!`);
    } catch (err) {
      toast.error(err.message || 'Failed to create challenge');
    } finally {
      setSearching(false);
    }
  };

  const handleAccept = async (challenge) => {
    await entities.Challenge.update(challenge.id, { status: 'active' });
    await notificationsApi.send({
      recipient_id: challenge.challenger_id,
      sender_id: user.id,
      sender_username: myProfile?.username,
      type: 'clash_invite',
      title: 'Clash Accepted',
      body: `@${myProfile?.username} accepted your clash "${challenge.title}"!`,
      read: false,
    }).catch(() => {});
    queryClient.invalidateQueries({ queryKey: ['challenges'] });
    toast.success('Challenge accepted! Game on!');
  };

  // ── Proof-based task completion ──────────────────────────────────────────
  const CARLOS_USERNAME = 'carlos';
  const isCarlos = myProfile?.username?.toLowerCase() === CARLOS_USERNAME;

  const handleTaskComplete = async (challenge, task, taskIndex, proofUrl) => {
    const tasks = challenge.rush_tasks ? [...challenge.rush_tasks] : [];
    const t = { ...tasks[taskIndex] };

    // Photo tasks go into pending_review instead of immediate completion
    if (task.completionType === 'photo' && proofUrl) {
      t.proof_urls = { ...(t.proof_urls || {}), [user.id]: proofUrl };
      // Store submitter info for owner review
      t.pending_review = { ...(t.pending_review || {}), [user.id]: {
        userId: user.id,
        username: myProfile?.username || user.email,
        challengeId: challenge.id,
        challengeTitle: challenge.title,
        taskIndex,
        proofUrl,
        submittedAt: new Date().toISOString(),
      }};
      // Clear any prior denial so state resets to "in review"
      if (t.denied_users?.[user.id]) {
        const denied = { ...(t.denied_users || {}) };
        delete denied[user.id];
        t.denied_users = denied;
      }
      tasks[taskIndex] = t;
      await entities.Challenge.update(challenge.id, { rush_tasks: tasks });
      queryClient.invalidateQueries({ queryKey: ['challenges'] });
      toast.success('Proof submitted! Waiting for owner review.');
      return;
    }

    t.completed_by = [...(t.completed_by || []), user.id];
    if (proofUrl) {
      t.proof_urls = { ...(t.proof_urls || {}), [user.id]: proofUrl };
    }
    tasks[taskIndex] = t;

    const myDoneCount = tasks.filter(tk => (tk.completed_by || []).includes(user.id)).length;
    const isWinner = myDoneCount === tasks.length;

    const updateObj = { rush_tasks: tasks };
    if (isWinner) {
      updateObj.status       = 'completed';
      updateObj.winner_email = user.email;
    }

    await entities.Challenge.update(challenge.id, updateObj);

    if (isWinner) {
      try {
        const profile = await profilesApi.getByUserId(user.id);
        if (profile) {
          const newXP    = (profile.xp || 0) + XP_ACTIONS.WIN_RUSH;
          const newLevel = getLevelFromXP(newXP);
          const badges   = [...(profile.badges || [])];
          if (!badges.includes('godly'))        badges.push('godly');
          if (!badges.includes('clash_winner')) badges.push('clash_winner');
          await entities.UserProfile.update(profile.id, {
            xp: newXP, level: newLevel,
            battles_won: (profile.battles_won || 0) + 1,
            coins: (profile.coins || 0) + COIN_ACTIONS.WIN_CHALLENGE,
            badges,
          });
          queryClient.invalidateQueries({ queryKey: ['profile'] });
        }
      } catch (e) { console.error('XP award failed', e); }
    }

    queryClient.invalidateQueries({ queryKey: ['challenges'] });

    if (isWinner) {
      toast.success(`All tasks complete — +100 XP & +${COIN_ACTIONS.WIN_CHALLENGE} coins!`);
    } else {
      try {
        const prof = await profilesApi.getByUserId(user.id);
        if (prof) {
          await entities.UserProfile.update(prof.id, {
            coins: (prof.coins || 0) + COIN_ACTIONS.COMPLETE_TASK,
          });
          queryClient.invalidateQueries({ queryKey: ['profile'] });
        }
      } catch (e) { console.error('Coin award failed', e); }
      toast.success(`Objective verified! ${myDoneCount}/${tasks.length} done (+${COIN_ACTIONS.COMPLETE_TASK} coins)`);
    }
  };

  // ── Owner: accept a photo proof ──────────────────────────────────────────
  const handleOwnerAccept = async (challenge, taskIndex, submitterUserId) => {
    const tasks = [...(challenge.rush_tasks || [])];
    const t = { ...tasks[taskIndex] };
    // Mark complete for this user
    t.completed_by = [...new Set([...(t.completed_by || []), submitterUserId])];
    // Remove from pending_review
    const pending = { ...(t.pending_review || {}) };
    delete pending[submitterUserId];
    t.pending_review = pending;
    tasks[taskIndex] = t;

    const updateObj = { rush_tasks: tasks };
    await entities.Challenge.update(challenge.id, updateObj);

    // Notify the submitter
    const submitterInfo = tasks[taskIndex].proof_urls ? challenge : null;
    const submitterUsername = t.proof_urls ? Object.keys(t.proof_urls)[0] : null;
    try {
      // Find submitter profile to get their user id for notification
      await notificationsApi.send({
        recipient_id: submitterUserId,
        sender_id: user.id,
        sender_username: myProfile?.username || 'carlos',
        type: 'clash_invite',
        title: 'Proof Accepted',
        body: `Your proof for "${t.text}" in "${challenge.title}" was approved and marked complete.`,
        read: false,
      });
    } catch(e) { /* silent */ }

    queryClient.invalidateQueries({ queryKey: ['challenges'] });
    toast.success('Proof accepted — task marked complete for that user!');
  };

  // ── Owner: reject a photo proof ──────────────────────────────────────────
  const handleOwnerReject = async (challenge, taskIndex, submitterUserId, reason) => {
    const tasks = [...(challenge.rush_tasks || [])];
    const t = { ...tasks[taskIndex] };
    // Remove from pending_review and clear their proof, mark as denied with reason
    const pending = { ...(t.pending_review || {}) };
    delete pending[submitterUserId];
    t.pending_review = pending;
    const proofUrls = { ...(t.proof_urls || {}) };
    delete proofUrls[submitterUserId];
    t.proof_urls = proofUrls;
    t.denied_users = { ...(t.denied_users || {}), [submitterUserId]: { reason, deniedAt: new Date().toISOString() } };
    tasks[taskIndex] = t;

    await entities.Challenge.update(challenge.id, { rush_tasks: tasks });

    // Send rejection reason to submitter's inbox
    try {
      await notificationsApi.send({
        recipient_id: submitterUserId,
        sender_id: user.id,
        sender_username: myProfile?.username || 'carlos',
        type: 'clash_invite',
        title: 'Proof Rejected',
        body: `Your proof for "${t.text}" in "${challenge.title}" was rejected. Reason: ${reason}`,
        read: false,
      });
    } catch(e) { /* silent */ }

    queryClient.invalidateQueries({ queryKey: ['challenges'] });
    toast.success('Proof rejected — user notified via inbox.');
  };

  // ── Advance tournament bracket after a match is won ──────────────────────
  const handleTournamentMatchWin = async (tournament, matchRef) => {
    const bracket = tournament.bracket ? [...tournament.bracket.map(m => ({ ...m }))] : [];
    const match = bracket.find(m => m.round === matchRef.round && m.match === matchRef.match);
    if (!match || match.winner_id) return;

    match.winner_id = user.id;
    match.winner_username = myProfile?.username;
    match.status = 'completed';

    const rounds = Math.log2(tournament.size);
    const nextRound = match.round + 1;

    if (nextRound > rounds) {
      // Tournament over — this player is champion
      await entities.Tournament.update(tournament.id, {
        bracket,
        status: 'completed',
        winner_id: user.id,
        winner_username: myProfile?.username,
      });
      try {
        const profile = await profilesApi.getByUserId(user.id);
        if (profile) {
          await entities.UserProfile.update(profile.id, {
            xp: (profile.xp || 0) + 250,
            tournament_wins: (profile.tournament_wins || 0) + 1,
            coins: (profile.coins || 0) + COIN_ACTIONS.WIN_TOURNAMENT,
          });
          queryClient.invalidateQueries({ queryKey: ['profile'] });
        }
      } catch(e) {}
      toast.success(`You won the tournament! +250 XP & +${COIN_ACTIONS.WIN_TOURNAMENT} coins!`);
    } else {
      // Seed next round
      const nextMatchIndex = Math.ceil(match.match / 2);
      let nextMatch = bracket.find(m => m.round === nextRound && m.match === nextMatchIndex);
      if (!nextMatch) {
        nextMatch = { round: nextRound, match: nextMatchIndex, p1_id: null, p1_username: null, p2_id: null, p2_username: null, winner_id: null, winner_username: null, status: 'pending', tasks: generateRushTasks(hasBank !== false, hasSavings !== false) };
        bracket.push(nextMatch);
      }
      if (match.match % 2 === 1) {
        nextMatch.p1_id = user.id;
        nextMatch.p1_username = myProfile?.username;
      } else {
        nextMatch.p2_id = user.id;
        nextMatch.p2_username = myProfile?.username;
      }
      // If both slots filled, notify both
      if (nextMatch.p1_id && nextMatch.p2_id) {
        nextMatch.status = 'active';
        for (const pid of [nextMatch.p1_id, nextMatch.p2_id]) {
          if (pid !== user.id) {
            await notificationsApi.send({
              recipient_id: pid,
              sender_id: user.id,
              sender_username: myProfile?.username,
              type: 'clash_invite',
              title: 'Next Tournament Match',
              body: `Your next match in "${tournament.title}" is ready! You vs @${pid === nextMatch.p1_id ? nextMatch.p2_username : nextMatch.p1_username}.`,
              read: false,
            }).catch(() => {});
          }
        }
      }
      await entities.Tournament.update(tournament.id, { bracket });
      toast.success(`Round ${match.round} won! Advancing to Round ${nextRound}.`);
    }
    queryClient.invalidateQueries({ queryKey: ['tournaments'] });
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending:   { background: 'rgba(180,140,40,0.12)', color: T.gold,    border: `1px solid rgba(184,151,58,0.28)` },
      active:    { background: T.goldDim,               color: T.gold,    border: `1px solid ${T.goldBorder}` },
      completed: { background: T.successDim,            color: T.success, border: `1px solid rgba(126,184,138,0.28)` },
    };
    const s = styles[status] || {};
    return (
      <span style={{
        ...s, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
        textTransform: 'uppercase', padding: '3px 8px', borderRadius: 99,
      }}>{status}</span>
    );
  };

  const getDaysLeft = (weekEnd) => {
    if (!weekEnd) return null;
    const days = differenceInDays(new Date(weekEnd), new Date());
    if (days < 0) return 'Ended';
    if (days === 0) return 'Last day';
    return `${days}d left`;
  };

  const ClashCard = ({ challenge, i }) => {
    const isChallenger = challenge.challenger_id === user?.id;
    const opponentUsername = isChallenger ? challenge.opponent_username : challenge.challenger_username;
    const mySavings        = isChallenger ? challenge.challenger_savings : challenge.opponent_savings;
    const opponentSavings  = isChallenger ? challenge.opponent_savings  : challenge.challenger_savings;
    const myUsername       = isChallenger ? challenge.challenger_username : challenge.opponent_username;
    const isPendingForMe   = challenge.status === 'pending' && !isChallenger;
    const daysLeft         = getDaysLeft(challenge.week_end);
    const isRush           = challenge.game_mode === 'rush';
    const tasks            = challenge.rush_tasks || [];
    const myDone           = tasks.filter(t => (t.completed_by || []).includes(user?.id)).length;
    const oppDone          = tasks.filter(t => {
      const oppId = isChallenger ? challenge.opponent_id : challenge.challenger_id;
      return (t.completed_by || []).includes(oppId);
    }).length;

    return (
      <motion.div
        key={challenge.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
      >
        <div style={{
          ...cardStyle,
          transition: 'border-color 0.2s',
        }}
          onMouseEnter={e => e.currentTarget.style.borderColor = T.goldBorder}
          onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
        >
          {/* Card Header */}
          <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${T.border}` }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10, marginBottom: 6 }}>
              <div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600, fontSize: 17, color: T.text, margin: 0, lineHeight: 1.2 }}>
                  {challenge.title}
                </h3>
                <div style={{ marginTop: 6 }}>
                  {isRush
                    ? <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Flame style={{ width: 10, height: 10 }} /> Challenge Rush
                      </span>
                    : <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Swords style={{ width: 10, height: 10 }} /> Savings Battle
                      </span>}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {daysLeft && challenge.status === 'active' && (
                  <span style={{ fontSize: 10, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Clock style={{ width: 10, height: 10 }} /> {daysLeft}
                  </span>
                )}
                {getStatusBadge(challenge.status)}
              </div>
            </div>
            <p style={{ fontSize: 11, color: T.textMuted, margin: 0 }}>
              vs{' '}
              <span style={{ fontWeight: 600, color: T.text }}>@{opponentUsername}</span>
              {challenge.week_start && ` · ${format(new Date(challenge.week_start), 'MMM d')} – ${format(new Date(challenge.week_end), 'MMM d')}`}
            </p>
          </div>

          {/* Card Body */}
          <div style={{ padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {isRush && challenge.status === 'active' && (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    flex: 1, padding: '8px 10px', textAlign: 'center', borderRadius: 10,
                    background: myDone >= oppDone ? T.goldDim : T.surfaceHigh,
                    border: `1px solid ${myDone >= oppDone ? T.goldBorder : T.border}`,
                  }}>
                    <p style={{ fontSize: 9, color: T.textMuted, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>You</p>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 20, color: myDone >= oppDone ? T.gold : T.text, margin: 0 }}>{myDone}/{tasks.length}</p>
                  </div>
                  <Flame style={{ width: 14, height: 14, color: T.gold, flexShrink: 0 }} />
                  <div style={{
                    flex: 1, padding: '8px 10px', textAlign: 'center', borderRadius: 10,
                    background: T.surfaceHigh, border: `1px solid ${T.border}`,
                  }}>
                    <p style={{ fontSize: 9, color: T.textMuted, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>@{opponentUsername}</p>
                    <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 20, color: T.text, margin: 0 }}>{oppDone}/{tasks.length}</p>
                  </div>
                </div>
                <RushTaskList
                  tasks={tasks} myId={user?.id} challengeId={challenge.id}
                  isActive={challenge.status === 'active'}
                  onTaskComplete={(task, idx, proofUrl) => handleTaskComplete(challenge, task, idx, proofUrl)}
                />
              </>
            )}

            {isRush && challenge.status === 'pending' && (
              <div style={{ textAlign: 'center', padding: '20px 0', color: T.textMuted }}>
                <Flame style={{ width: 28, height: 28, margin: '0 auto 8px', opacity: 0.2 }} />
                <p style={{ fontSize: 11 }}>Tasks will appear once the challenge is accepted.</p>
              </div>
            )}

            {isRush && challenge.status === 'completed' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  flex: 1, padding: '10px', textAlign: 'center', borderRadius: 10,
                  background: myDone >= oppDone ? T.goldDim : T.surfaceHigh,
                  border: `1px solid ${myDone >= oppDone ? T.goldBorder : T.border}`,
                }}>
                  <p style={{ fontSize: 9, color: T.textMuted, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>You {myDone >= oppDone ? '— Winner' : ''}</p>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 22, color: myDone >= oppDone ? T.gold : T.text, margin: 0 }}>{myDone}/{tasks.length}</p>
                </div>
                <Trophy style={{ width: 14, height: 14, color: T.gold, flexShrink: 0 }} />
                <div style={{ flex: 1, padding: '10px', textAlign: 'center', borderRadius: 10, background: T.surfaceHigh, border: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: 9, color: T.textMuted, margin: '0 0 3px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>@{opponentUsername} {oppDone > myDone ? '— Winner' : ''}</p>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 22, color: T.text, margin: 0 }}>{oppDone}/{tasks.length}</p>
                </div>
              </div>
            )}

            {!isRush && challenge.status === 'active' && (
              <ClashProgressBar mySavings={mySavings} opponentSavings={opponentSavings} goal={challenge.savings_goal} myUsername={myUsername} opponentUsername={opponentUsername} />
            )}

            {!isRush && challenge.status === 'pending' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, ...mutedBg, padding: '10px', textAlign: 'center', border: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: 10, color: T.textMuted, margin: '0 0 4px' }}>You</p>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 22, color: T.gold, margin: 0 }}>${(mySavings || 0).toFixed(2)}</p>
                </div>
                <Swords style={{ width: 14, height: 14, color: T.textMuted, flexShrink: 0 }} />
                <div style={{ flex: 1, ...mutedBg, padding: '10px', textAlign: 'center', border: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: 10, color: T.textMuted, margin: '0 0 4px' }}>@{opponentUsername}</p>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 22, color: T.text, margin: 0 }}>${(opponentSavings || 0).toFixed(2)}</p>
                </div>
              </div>
            )}

            {!isRush && challenge.status === 'completed' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  flex: 1, padding: '10px', textAlign: 'center', borderRadius: 10,
                  background: (mySavings || 0) >= (opponentSavings || 0) ? T.goldDim : T.surfaceHigh,
                  border: `1px solid ${(mySavings || 0) >= (opponentSavings || 0) ? T.goldBorder : T.border}`,
                }}>
                  <p style={{ fontSize: 9, color: T.textMuted, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    You {(mySavings || 0) >= (opponentSavings || 0) ? '— Winner' : ''}
                  </p>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 22, color: (mySavings || 0) >= (opponentSavings || 0) ? T.gold : T.text, margin: 0 }}>
                    ${(mySavings || 0).toFixed(2)}
                  </p>
                </div>
                <Trophy style={{ width: 14, height: 14, color: T.gold, flexShrink: 0 }} />
                <div style={{ flex: 1, ...mutedBg, padding: '10px', textAlign: 'center', border: `1px solid ${T.border}` }}>
                  <p style={{ fontSize: 9, color: T.textMuted, margin: '0 0 4px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    @{opponentUsername} {(opponentSavings || 0) > (mySavings || 0) ? '— Winner' : ''}
                  </p>
                  <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 22, color: T.text, margin: 0 }}>
                    ${(opponentSavings || 0).toFixed(2)}
                  </p>
                </div>
              </div>
            )}

            {!isRush && challenge.savings_goal && challenge.status !== 'active' && (
              <p style={{ fontSize: 11, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 5, margin: 0 }}>
                <Target style={{ width: 11, height: 11 }} /> Goal: ${challenge.savings_goal}
              </p>
            )}

            {isPendingForMe && (
              <button
                onClick={() => handleAccept(challenge)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '10px', borderRadius: 10,
                  background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
                  border: 'none', color: '#0C0C0E',
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
                  cursor: 'pointer', transition: 'opacity 0.15s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                <CheckCircle style={{ width: 14, height: 14 }} /> Accept Challenge
              </button>
            )}
          </div>
        </div>
      </motion.div>
    );
  };

  const SectionLabel = ({ icon: Icon, label, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
      <Icon style={{ width: 13, height: 13, color: color || T.textMuted }} />
      <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: T.textMuted }}>
        {label}
      </span>
    </div>
  );

  const saveAccountPrefs = async (bank, savings) => {
    setHasBank(bank); setHasSavings(savings); setOnboardDone(true);
    if (user) {
      try {
        const prof = await profilesApi.getByUserId(user.id);
        if (prof) await entities.UserProfile.update(prof.id, {
          has_bank_account: bank, has_savings_account: savings,
        });
      } catch(e) { console.error(e); }
    }
  };

  const OnboardingModal = () => (
    <div style={{ position:'fixed', inset:0, zIndex:2000,
      background:'rgba(0,0,0,0.88)', backdropFilter:'blur(6px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20 }}>
      <div style={{ background:T.surface, border:`1px solid ${T.goldBorder}`,
        borderRadius:20, padding:28, maxWidth:400, width:'100%' }}>
        <p style={{ fontSize:10, fontWeight:700, letterSpacing:'0.12em',
          textTransform:'uppercase', color:T.gold, margin:'0 0 6px' }}>Before Your First Clash</p>
        <h2 style={{ fontSize:22, fontWeight:800, color:T.text, margin:'0 0 8px',
          fontFamily:"'Cormorant Garamond', serif" }}>Tell us about your accounts</h2>
        <p style={{ fontSize:12, color:T.textMuted, margin:'0 0 24px', lineHeight:1.6 }}>
          We'll tailor your clash objectives to match what you actually have.
          You can change this anytime in Settings.
        </p>
        {hasBank === null ? (<>
          <p style={{ fontSize:14, fontWeight:700, color:T.text, margin:'0 0 14px' }}>Do you have a bank account?</p>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setHasBank(true)} style={{ flex:1, padding:'13px', borderRadius:10,
              border:`1px solid ${T.goldBorder}`, background:T.goldDim, color:T.gold,
              fontWeight:700, fontSize:14, cursor:'pointer' }}>✓ Yes</button>
            <button onClick={() => setHasBank(false)} style={{ flex:1, padding:'13px', borderRadius:10,
              border:`1px solid ${T.border}`, background:T.surfaceHigh, color:T.textMuted,
              fontWeight:700, fontSize:14, cursor:'pointer' }}>✗ No</button>
          </div>
        </>) : hasSavings === null ? (<>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:18,
            padding:'8px 12px', borderRadius:9, background:T.surfaceHigh, border:`1px solid ${T.border}` }}>
            <span style={{ fontSize:12, color:T.textMuted }}>Bank account:</span>
            <span style={{ fontSize:12, fontWeight:700, color: hasBank ? T.success : T.danger }}>{hasBank ? '✓ Yes' : '✗ No'}</span>
            <button onClick={() => setHasBank(null)} style={{ marginLeft:'auto', background:'none',
              border:'none', color:T.textDim, fontSize:11, cursor:'pointer', textDecoration:'underline' }}>change</button>
          </div>
          <p style={{ fontSize:14, fontWeight:700, color:T.text, margin:'0 0 14px' }}>Do you have a savings account?</p>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => setHasSavings(true)} style={{ flex:1, padding:'13px', borderRadius:10,
              border:`1px solid ${T.goldBorder}`, background:T.goldDim, color:T.gold,
              fontWeight:700, fontSize:14, cursor:'pointer' }}>✓ Yes</button>
            <button onClick={() => setHasSavings(false)} style={{ flex:1, padding:'13px', borderRadius:10,
              border:`1px solid ${T.border}`, background:T.surfaceHigh, color:T.textMuted,
              fontWeight:700, fontSize:14, cursor:'pointer' }}>✗ No</button>
          </div>
        </>) : (<>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:22 }}>
            {[{label:'Bank account',val:hasBank},{label:'Savings account',val:hasSavings}].map(({label,val})=>(
              <div key={label} style={{ display:'flex', justifyContent:'space-between',
                padding:'10px 12px', borderRadius:9, background:T.surfaceHigh, border:`1px solid ${T.border}` }}>
                <span style={{ fontSize:12, color:T.textMuted }}>{label}</span>
                <span style={{ fontSize:12, fontWeight:700, color: val ? T.success : T.danger }}>{val ? '✓ Yes' : '✗ No'}</span>
              </div>
            ))}
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => { setHasBank(null); setHasSavings(null); }} style={{
              flex:1, padding:'12px', borderRadius:10, background:'transparent',
              border:`1px solid ${T.border}`, color:T.textMuted, fontWeight:600, fontSize:13, cursor:'pointer' }}>← Back</button>
            <button onClick={() => saveAccountPrefs(hasBank, hasSavings)} style={{
              flex:2, padding:'12px', borderRadius:10, border:'none',
              background:`linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
              color:'#0C0C0E', fontWeight:800, fontSize:14, cursor:'pointer' }}>Start Clashing →</button>
          </div>
        </>)}
      </div>
    </div>
  );

  return (
    <div style={{
      minHeight: '100vh',
      background: T.dark,
      color: T.text,
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
      padding: '24px 24px 80px',
    }}>
      {!onboardDone && user && <OnboardingModal />}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Cormorant+Garamond:wght@600;700&display=swap');

        .cc-clash-dialog [class*="DialogContent"],
        .cc-clash-dialog [data-radix-popper-content-wrapper] > * {
          background: #16161A !important;
          border: 1px solid rgba(184,151,58,0.22) !important;
          color: #F0EDE6 !important;
          border-radius: 16px !important;
        }
        .cc-clash-dialog label { color: rgba(240,237,230,0.55) !important; font-size: 11px !important; letter-spacing: 0.06em; text-transform: uppercase; }
        .cc-clash-dialog input, .cc-clash-dialog select {
          background: #111114 !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          color: #F0EDE6 !important;
          border-radius: 8px !important;
        }
        .cc-clash-dialog input::placeholder { color: rgba(240,237,230,0.25) !important; }
        .cc-clash-dialog [class*="DialogTitle"] { color: #F0EDE6 !important; }
        .cc-clash-dialog [class*="DialogClose"] { color: rgba(240,237,230,0.4) !important; }
        .cc-clash-dialog [class*="bg-muted"] { background: #1C1C22 !important; }
        .cc-clash-dialog [class*="border-border"] { border-color: rgba(255,255,255,0.08) !important; }
        .cc-clash-dialog [class*="divide-y"] > * { border-color: rgba(255,255,255,0.06) !important; }
        .cc-clash-dialog [class*="text-muted-foreground"] { color: rgba(240,237,230,0.4) !important; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <div style={{ maxWidth: 1080, margin: '0 auto' }}>

        {/* ── PAGE HEADER ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{
              fontFamily: "'Cormorant Garamond', serif",
              fontWeight: 600, fontSize: 32,
              color: T.text, margin: 0,
              display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <Swords style={{ width: 22, height: 22, color: T.gold }} /> Clash
            </h1>
            <p style={{ fontSize: 12, color: T.textMuted, marginTop: 4 }}>
              Challenge friends to savings battles or challenge rushes
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }} className="cc-clash-dialog">
            <button
              onClick={() => setHowOpen(!howOpen)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 14px', borderRadius: 9,
                background: 'transparent',
                border: `1px solid ${T.border}`,
                color: T.textMuted, fontSize: 12, fontWeight: 500,
                cursor: 'pointer', transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = T.goldBorder; e.currentTarget.style.color = T.text; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
            >
              <Info style={{ width: 13, height: 13 }} /> How it works
            </button>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '8px 16px', borderRadius: 9,
                  background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
                  border: 'none', color: '#0C0C0E',
                  fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
                  cursor: 'pointer', transition: 'opacity 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.opacity = '0.9'}
                  onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                >
                  <Plus style={{ width: 13, height: 13 }} /> New Clash
                </button>
              </DialogTrigger>

              <DialogContent className="max-h-[90vh] overflow-y-auto" style={{ background: T.surfaceAlt }}>
                <DialogHeader>
                  <DialogTitle style={{ display: 'flex', alignItems: 'center', gap: 8, color: T.text }}>
                    <Swords style={{ width: 16, height: 16, color: T.gold }} /> New 1v1 Clash
                  </DialogTitle>
                </DialogHeader>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginTop: 8 }}>
                  {/* Game Mode */}
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, display: 'block', marginBottom: 8 }}>Game Mode</label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {[
                        { mode: 'savings', Icon: Swords,  title: 'Savings Battle',  desc: 'Whoever saves more money by the deadline wins.' },
                        { mode: 'rush',    Icon: Flame,   title: 'Challenge Rush',   desc: 'Random tasks assigned. Complete them all first — proof required.' },
                      ].map(({ mode, Icon, title, desc }) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setGameMode(mode)}
                          style={{
                            padding: '12px', borderRadius: 10, textAlign: 'left', cursor: 'pointer',
                            background: gameMode === mode ? T.goldDim : T.surfaceHigh,
                            border: `1.5px solid ${gameMode === mode ? T.goldBorder : T.border}`,
                            transition: 'all 0.15s',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                            <Icon style={{ width: 13, height: 13, color: T.gold }} />
                            <span style={{ fontSize: 12, fontWeight: 700, color: T.text }}>{title}</span>
                          </div>
                          <p style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.5, margin: 0 }}>{desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Title */}
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, display: 'block', marginBottom: 6 }}>Challenge Title</label>
                    <Input
                      value={form.title}
                      onChange={e => setForm({ ...form, title: e.target.value })}
                      placeholder={gameMode === 'rush' ? 'Who finishes first?' : 'Who saves more this week?'}
                      style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text, borderRadius: 8 }}
                    />
                  </div>

                  {/* Opponent */}
                  <div>
                    <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, display: 'block', marginBottom: 6 }}>
                      Opponent Username
                    </label>
                    {friendProfiles.length > 0 && (
                      <div>
                        <button type="button" onClick={() => setShowFriendPicker(!showFriendPicker)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: T.gold, fontWeight: 600, marginBottom: 8, background: 'none', border: 'none', cursor: 'pointer' }}>
                          <Users style={{ width: 12, height: 12 }} />
                          {showFriendPicker ? 'Hide friends' : 'Pick from friends'}
                          {showFriendPicker ? <ChevronUp style={{ width: 11, height: 11 }} /> : <ChevronDown style={{ width: 11, height: 11 }} />}
                        </button>
                        {showFriendPicker && (
                          <div style={{ border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', maxHeight: 160, overflowY: 'auto', marginBottom: 8 }}>
                            {friendProfiles.map(fp => (
                              <button key={fp.id} type="button"
                                onClick={() => { setForm({ ...form, opponent_username: fp.username }); setShowFriendPicker(false); }}
                                style={{
                                  width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                                  padding: '10px 12px', background: 'none', border: 'none',
                                  borderBottom: `1px solid ${T.border}`, cursor: 'pointer', textAlign: 'left',
                                  transition: 'background 0.1s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = T.surfaceHigh}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                              >
                                <div style={{ width: 32, height: 32, borderRadius: '50%', overflow: 'hidden', flexShrink: 0, border: '1.5px solid rgba(184,151,58,0.35)', background: 'rgba(184,151,58,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  {fp.custom_avatar_url
                                    ? <img src={fp.custom_avatar_url} alt={fp.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    : <span style={{ fontSize: 14, fontWeight: 700, color: '#B8973A' }}>{(fp.display_name || fp.username || '?')[0].toUpperCase()}</span>
                                  }
                                </div>
                                <div>
                                  <p style={{ fontSize: 12, fontWeight: 600, color: T.text, margin: 0 }}>{fp.display_name}</p>
                                  <p style={{ fontSize: 10, color: T.textMuted, margin: 0 }}>@{fp.username}</p>
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: T.textMuted, fontSize: 13 }}>@</span>
                      <Input
                        value={form.opponent_username}
                        onChange={e => setForm({ ...form, opponent_username: e.target.value.replace('@', '') })}
                        placeholder="their_username"
                        style={{ paddingLeft: 28, background: T.surface, border: `1px solid ${T.border}`, color: T.text, borderRadius: 8 }}
                      />
                    </div>
                  </div>

                  {gameMode === 'savings' && (
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, display: 'block', marginBottom: 6 }}>Savings Goal ($)</label>
                      <Input
                        type="number"
                        value={form.savings_goal}
                        onChange={e => setForm({ ...form, savings_goal: e.target.value })}
                        placeholder="100"
                        style={{ background: T.surface, border: `1px solid ${T.border}`, color: T.text, borderRadius: 8 }}
                      />
                      <p style={{ fontSize: 10, color: T.textMuted, marginTop: 5 }}>How much do you each aim to save this week?</p>
                    </div>
                  )}

                  {gameMode === 'savings' && (
                    <div>
                      <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: T.textMuted, display: 'block', marginBottom: 6 }}>
                        Deadline — {deadlineDays} day{deadlineDays !== 1 ? 's' : ''}
                      </label>
                      <input
                        type="range"
                        min={4}
                        max={31}
                        value={deadlineDays}
                        onChange={e => setDeadlineDays(Number(e.target.value))}
                        style={{ width: '100%', accentColor: T.gold, cursor: 'pointer' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                        <span style={{ fontSize: 10, color: T.textMuted }}>4 days</span>
                        <span style={{ fontSize: 10, color: T.textMuted }}>31 days</span>
                      </div>
                    </div>
                  )}

                  <button
                    onClick={handleCreate}
                    disabled={searching}
                    style={{
                      width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      padding: '11px', borderRadius: 10,
                      background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`,
                      border: 'none', color: '#0C0C0E',
                      fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
                      cursor: searching ? 'not-allowed' : 'pointer',
                      opacity: searching ? 0.7 : 1,
                    }}
                  >
                    {searching
                      ? <div style={{ width: 14, height: 14, border: '2px solid rgba(0,0,0,0.3)', borderTopColor: '#0C0C0E', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                      : <Swords style={{ width: 14, height: 14 }} />}
                    Send Clash Invite
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* ── HOW IT WORKS ── */}
        <HowItWorks open={howOpen} onClose={() => setHowOpen(false)} />

        {/* ── TAB SWITCHER ── */}
        {(() => {
          // Count pending proofs for badge
          let pendingCount = 0;
          challenges.forEach(ch => {
            (ch.rush_tasks || []).forEach(task => {
              pendingCount += Object.keys(task.pending_review || {}).length;
            });
          });
          return (
            <div style={{ display: 'flex', gap: 8, marginBottom: 20, borderBottom: `1px solid ${T.border}`, paddingBottom: 0 }}>
              {[
                { key: 'clashes', label: 'My Clashes', Icon: Swords },
                ...(isCarlos ? [{ key: 'review', label: 'Proof Review', Icon: ShieldCheck, badge: pendingCount }] : []),
                { key: 'tournaments', label: 'Tournaments', Icon: Crown, badge: myTournaments.filter(t => t.status !== 'completed').length },
              ].map(({ key, label, Icon, badge }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
                    borderBottom: `2px solid ${activeTab === key ? T.gold : 'transparent'}`,
                    color: activeTab === key ? T.gold : T.textMuted,
                    fontSize: 12, fontWeight: activeTab === key ? 700 : 500,
                    transition: 'all 0.15s', marginBottom: -1,
                    position: 'relative',
                  }}
                >
                  <Icon style={{ width: 13, height: 13 }} />
                  {label}
                  {badge > 0 && (
                    <span style={{
                      position: 'absolute', top: 6, right: 6,
                      width: 16, height: 16, borderRadius: '50%',
                      background: T.danger, color: '#fff',
                      fontSize: 9, fontWeight: 800,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>{badge}</span>
                  )}
                </button>
              ))}
            </div>
          );
        })()}

        {/* ── OWNER REVIEW PANEL ── */}
        {activeTab === 'tournaments' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Active tournament brackets pinned at top */}
            {myTournaments.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: T.textMuted }}>
                <Crown style={{ width: 40, height: 40, margin: '0 auto 16px', opacity: 0.15 }} />
                <p style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 6 }}>No Tournaments Yet</p>
                <p style={{ fontSize: 12, marginBottom: 20 }}>Create a 4 or 8-player tournament to compete in bracket-style Challenge Rush.</p>
                <button onClick={() => setTournamentDialogOpen(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '10px 20px', borderRadius: 10, background: `linear-gradient(135deg, ${T.gold}, ${T.goldLight})`, border: 'none', color: '#0C0C0E', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                  <Crown style={{ width: 13, height: 13 }} /> Create Tournament
                </button>
              </div>
            ) : (
              myTournaments.map(t => {
                const myMatch = (t.bracket || []).find(m =>
                  m.status === 'active' && (m.p1_id === user?.id || m.p2_id === user?.id)
                );
                return (
                  <div key={t.id}>
                    <TournamentBracket tournament={t} participants={t.participants || []} currentUserId={user?.id} />
                    {myMatch && (
                      <div style={{ background: T.goldDim, border: `1px solid ${T.goldBorder}`, borderRadius: 12, padding: '14px 16px', marginTop: -12, marginBottom: 16 }}>
                        <p style={{ fontSize: 12, fontWeight: 700, color: T.gold, margin: '0 0 8px' }}>Your Current Match</p>
                        <p style={{ fontSize: 11, color: T.textMuted, margin: '0 0 10px' }}>
                          vs @{myMatch.p1_id === user?.id ? myMatch.p2_username : myMatch.p1_username}
                        </p>
                        <RushTaskList
                          tasks={myMatch.tasks || []}
                          myId={user?.id}
                          challengeId={`tournament_${t.id}_r${myMatch.round}_m${myMatch.match}`}
                          isActive={true}
                          onTaskComplete={async (task, idx, proofUrl) => {
                            const updatedTasks = [...(myMatch.tasks || [])];
                            const ut = { ...updatedTasks[idx] };
                            if (task.completionType === 'photo' && proofUrl) {
                              ut.proof_urls = { ...(ut.proof_urls || {}), [user.id]: proofUrl };
                              ut.pending_review = { ...(ut.pending_review || {}), [user.id]: { userId: user.id, username: myProfile?.username, proofUrl, submittedAt: new Date().toISOString() } };
                              updatedTasks[idx] = ut;
                            } else {
                              ut.completed_by = [...new Set([...(ut.completed_by || []), user.id])];
                              updatedTasks[idx] = ut;
                            }
                            const allDone = updatedTasks.filter(tk => (tk.completed_by || []).includes(user.id)).length === updatedTasks.length;
                            const newBracket = (t.bracket || []).map(m => m.round === myMatch.round && m.match === myMatch.match ? { ...m, tasks: updatedTasks } : m);
                            await entities.Tournament.update(t.id, { bracket: newBracket });
                            queryClient.invalidateQueries({ queryKey: ['tournaments'] });
                            if (allDone) handleTournamentMatchWin(t, myMatch);
                            else {
                              try {
                                const prof = await profilesApi.getByUserId(user.id);
                                if (prof) {
                                  await entities.UserProfile.update(prof.id, {
                                    coins: (prof.coins || 0) + COIN_ACTIONS.COMPLETE_TASK,
                                  });
                                  queryClient.invalidateQueries({ queryKey: ['profile'] });
                                }
                              } catch (e) {}
                              toast.success(`Task done! ${updatedTasks.filter(tk => (tk.completed_by || []).includes(user.id)).length}/${updatedTasks.length} complete (+${COIN_ACTIONS.COMPLETE_TASK} coins)`);
                            }
                          }}
                        />
                      </div>
                    )}
                  </div>
                );
              })
            )}

          </div>
        )}

        {isCarlos && activeTab === 'review' && (
          <OwnerProofReviewTab
            challenges={challenges}
            onAccept={handleOwnerAccept}
            onReject={handleOwnerReject}
          />
        )}

        {(activeTab === 'review' || activeTab === 'tournaments') ? null : (<>

        {/* ── STATS ROW ── */}
        {myChallenges.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
            {[
              { label: 'Active',    count: active.length,    icon: Swords, color: T.gold },
              { label: 'Pending',   count: pending.length,   icon: Clock,  color: T.textMuted },
              { label: 'Completed', count: completed.length, icon: Trophy, color: T.success },
            ].map(({ label, count, icon: Icon, color }) => (
              <div key={label} style={{ ...cardStyle, padding: '16px', textAlign: 'center' }}>
                <Icon style={{ width: 16, height: 16, margin: '0 auto 8px', color }} />
                <p style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700, fontSize: 28, color: T.text, margin: 0, lineHeight: 1 }}>{count}</p>
                <p style={{ fontSize: 9, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 5 }}>{label}</p>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {pending.length > 0 && (
            <div>
              <SectionLabel icon={Clock} label="Pending Invites" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
                {pending.map((c, i) => <ClashCard key={c.id} challenge={c} i={i} />)}
              </div>
            </div>
          )}

          {active.length > 0 && (
            <div>
              <SectionLabel icon={Swords} label="Active Clashes" color={T.gold} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
                {active.map((c, i) => <ClashCard key={c.id} challenge={c} i={i} />)}
              </div>
            </div>
          )}

          {completed.length > 0 && (
            <div>
              <SectionLabel icon={Trophy} label="Completed" color={T.success} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 14 }}>
                {completed.map((c, i) => <ClashCard key={c.id} challenge={c} i={i} />)}
              </div>
            </div>
          )}

          {myChallenges.length === 0 && (
            <div style={{ textAlign: 'center', padding: '80px 0', color: T.textMuted }}>
              <Swords style={{ width: 40, height: 40, margin: '0 auto 16px', opacity: 0.15 }} />
              <p style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 6 }}>No clashes yet</p>
              <p style={{ fontSize: 12, marginBottom: 20 }}>Pick Savings Battle or Challenge Rush to start a fight.</p>
              <button
                onClick={() => setHowOpen(true)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '9px 18px', borderRadius: 9,
                  background: T.goldDim, border: `1px solid ${T.goldBorder}`,
                  color: T.gold, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                }}
              >
                <Info style={{ width: 12, height: 12 }} /> See how it works
              </button>
            </div>
          )}
        </div>
        </>)}
      </div>

      <CreateTournamentDialog
        open={tournamentDialogOpen}
        onClose={() => setTournamentDialogOpen(false)}
        user={user}
        myProfile={myProfile}
        friendProfiles={friendProfiles}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ['tournaments'] });
          setTournamentDialogOpen(false);
          setActiveTab('tournaments');
        }}
      />
    </div>
  );
}