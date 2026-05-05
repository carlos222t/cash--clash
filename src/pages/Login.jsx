import React, { useState } from 'react';
import { supabase, entities } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Swords, Mail, Loader2, AtSign, Globe } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

const REGIONS = [
  { value: 'us',  label: '🇺🇸 United States',    currency: 'USD', symbol: '$'  },
  { value: 'gb',  label: '🇬🇧 United Kingdom',    currency: 'GBP', symbol: '£'  },
  { value: 'eu',  label: '🇪🇺 European Union',     currency: 'EUR', symbol: '€'  },
  { value: 'ca',  label: '🇨🇦 Canada',             currency: 'CAD', symbol: 'CA$'},
  { value: 'au',  label: '🇦🇺 Australia',          currency: 'AUD', symbol: 'A$' },
  { value: 'mx',  label: '🇲🇽 Mexico',             currency: 'MXN', symbol: 'MX$'},
  { value: 'br',  label: '🇧🇷 Brazil',             currency: 'BRL', symbol: 'R$' },
  { value: 'in',  label: '🇮🇳 India',              currency: 'INR', symbol: '₹'  },
  { value: 'jp',  label: '🇯🇵 Japan',              currency: 'JPY', symbol: '¥'  },
  { value: 'cn',  label: '🇨🇳 China',              currency: 'CNY', symbol: '¥'  },
  { value: 'za',  label: '🇿🇦 South Africa',       currency: 'ZAR', symbol: 'R'  },
  { value: 'ng',  label: '🇳🇬 Nigeria',            currency: 'NGN', symbol: '₦'  },
  { value: 'other', label: '🌍 Other',             currency: 'USD', symbol: '$'  },
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [region, setRegion] = useState('us');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) { navigate('/Dashboard'); return null; }

  const validateUsername = (u) => /^[a-zA-Z0-9_]{3,20}$/.test(u);

  const handleSubmit = async () => {
    if (!email || !password) { toast.error('Please enter both email and password'); return; }
    if (isSignUp && !validateUsername(username)) {
      toast.error('Username must be 3–20 characters: letters, numbers, underscores only');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        // Check username uniqueness
        const { data: existing } = await supabase
          .from('user_profiles').select('id').eq('username', username.toLowerCase()).maybeSingle();
        if (existing) { toast.error('Username already taken. Choose another.'); setLoading(false); return; }

        const { data: authData, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (authData.user) {
          // Create profile immediately
          await supabase.from('user_profiles').insert([{
            created_by: authData.user.id,
            email: email,
            username: username.toLowerCase(),
            display_name: username,
            region: region,
            currency: REGIONS.find(r => r.value === region)?.currency || 'USD',
            currency_symbol: REGIONS.find(r => r.value === region)?.symbol || '$',
            level: 1, xp: 0, total_saved: 0, monthly_budget: 0,
            monthly_income: 0, badges: [], streak_days: 0,
            battles_won: 0, tournament_wins: 0,
          }]);
        }
        toast.success('Account created! You can now sign in.');
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate('/Dashboard');
      }
    } catch (err) {
      toast.error(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Swords className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-heading font-bold">Cash Clash</h1>
          <p className="text-sm text-muted-foreground mt-1">Compete. Save. Win.</p>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{isSignUp ? 'Create Account' : 'Sign In'}</CardTitle>
            <CardDescription>
              {isSignUp ? 'Choose your username and start clashing' : 'Welcome back, player'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="username"
                    placeholder="your_username"
                    value={username}
                    onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
                    className="pl-9"
                    maxLength={20}
                  />
                </div>
                <p className="text-xs text-muted-foreground">3–20 chars, letters/numbers/underscores. Used to send clash invites.</p>
              </div>
            )}
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="region" className="flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> Region</Label>
                <select
                  id="region"
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                >
                  {REGIONS.map(r => <option key={r.value} value={r.value}>{r.label} — {r.currency}</option>)}
                </select>
                <p className="text-xs text-muted-foreground">Sets your default currency for budgets and challenges.</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" value={email}
                onChange={e => setEmail(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password}
                onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
            </div>
            <Button onClick={handleSubmit} className="w-full gap-2" disabled={loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {isSignUp ? 'Create Account' : 'Sign In'}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button onClick={() => setIsSignUp(!isSignUp)} className="text-primary hover:underline font-medium">
                {isSignUp ? 'Sign in' : 'Sign up'}
              </button>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
