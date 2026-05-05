import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Lightbulb, RefreshCw } from 'lucide-react';

const TIPS = [
  { tip: "The 50/30/20 rule: spend 50% on needs, 30% on wants, and save 20% of your income.", tag: "Budgeting 101" },
  { tip: "Track every expense for 30 days — most people find at least $200/month they didn't realize they were spending.", tag: "Awareness" },
  { tip: "Automating your savings means you save before you can spend. Set it and forget it!", tag: "Saving" },
  { tip: "Cooking at home just 3 extra times a week can save $150–$300/month for students.", tag: "Food" },
  { tip: "An emergency fund of 3–6 months of expenses is your financial safety net.", tag: "Security" },
  { tip: "Compound interest is the 8th wonder of the world — start saving even $10/week now.", tag: "Investing" },
  { tip: "Cancel subscriptions you haven't used in 30 days. That's instant money back in your pocket.", tag: "Quick Win" },
  { tip: "Before any purchase over $30, wait 24 hours. You'll avoid many impulse buys.", tag: "Discipline" },
  { tip: "Pack a lunch instead of buying it. $8/day × 5 days = $160/month saved.", tag: "Food" },
  { tip: "Negotiate your phone/internet bill annually — most providers will lower your rate to keep you.", tag: "Savings Hack" },
];

export default function DailyTip() {
  const [tipIndex, setTipIndex] = useState(() => new Date().getDate() % TIPS.length);
  const tip = TIPS[tipIndex];

  return (
    <Card className="overflow-hidden border-primary/20">
      <div className="flex gap-4 p-4">
        <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">{tip.tag}</span>
            <button onClick={() => setTipIndex((tipIndex + 1) % TIPS.length)} className="text-muted-foreground hover:text-foreground transition-colors">
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed">{tip.tip}</p>
        </div>
      </div>
    </Card>
  );
}