import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Swords, Crown, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, differenceInDays } from 'date-fns';

export default function ChallengePreview({ challenges, userEmail }) {
  const active = (challenges || []).filter(c =>
    (c.challenger_email === userEmail || c.opponent_email === userEmail) && c.status === 'active'
  );
  const pending = (challenges || []).filter(c =>
    c.opponent_email === userEmail && c.status === 'pending'
  );

  if (!active.length && !pending.length) {
    return (
      <Card className="border-dashed border-2 border-border">
        <CardContent className="p-6 text-center">
          <Swords className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
          <p className="font-heading font-semibold text-sm">No active clashes</p>
          <p className="text-xs text-muted-foreground mt-1 mb-4">Challenge a friend to a weekly savings battle</p>
          <Link to="/Challenges">
            <Button size="sm" variant="outline" className="gap-2"><Swords className="w-3 h-3" /> Start a Clash</Button>
          </Link>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {pending.length > 0 && (
        <Card className="border-chart-3/30 bg-chart-3/5">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-chart-3/20 flex items-center justify-center">
                <Clock className="w-4 h-4 text-chart-3" />
              </div>
              <div>
                <p className="text-xs font-bold text-chart-3 uppercase tracking-wider">Challenge Pending</p>
                <p className="text-sm font-semibold">{pending[0].title}</p>
              </div>
            </div>
            <Link to="/Challenges">
              <Button size="sm" className="bg-chart-3 text-white hover:bg-chart-3/90">Accept</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {active.map(ch => {
        const isChallenger = ch.challenger_email === userEmail;
        const myScore = isChallenger ? ch.challenger_savings : ch.opponent_savings;
        const opScore = isChallenger ? ch.opponent_savings : ch.challenger_savings;
        const opName = isChallenger ? ch.opponent_name : ch.challenger_name;
        const winning = (myScore || 0) >= (opScore || 0);
        const daysLeft = ch.week_end ? differenceInDays(new Date(ch.week_end), new Date()) : 0;

        return (
          <Card key={ch.id} className={`overflow-hidden border-2 ${winning ? 'border-primary/30' : 'border-destructive/20'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{ch.title}</p>
                <span className="text-xs text-muted-foreground">{daysLeft}d left</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">You</p>
                  <p className={`text-2xl font-heading font-bold ${winning ? 'text-primary' : ''}`}>${myScore || 0}</p>
                </div>
                <div className="flex flex-col items-center">
                  {winning && <Crown className="w-4 h-4 text-chart-3 mb-1" />}
                  <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">VS</span>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">{opName}</p>
                  <p className={`text-2xl font-heading font-bold ${!winning ? 'text-destructive' : ''}`}>${opScore || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}