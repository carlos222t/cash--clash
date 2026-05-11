import React, { useState } from 'react';
import { supabase } from '@/api/supabaseClient';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, Loader2, AtSign, Globe, Lock, AlertCircle, CheckCircle } from 'lucide-react';
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
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) { navigate('/Dashboard'); return null; }

  const validateUsername = (u) => /^[a-zA-Z0-9_]{3,20}$/.test(u);

  const showError = (msg) => { setErrorMsg(msg); setSuccessMsg(''); };
  const showSuccess = (msg) => { setSuccessMsg(msg); setErrorMsg(''); };

  const handleSubmit = async () => {
    setErrorMsg('');
    setSuccessMsg('');
    if (!email || !password) { showError('Please enter both email and password.'); return; }
    if (isSignUp && !validateUsername(username)) {
      showError('Username must be 3–20 characters: letters, numbers, underscores only.');
      return;
    }
    setLoading(true);
    try {
      if (isSignUp) {
        const { data: existing } = await supabase
          .from('user_profiles').select('id').eq('username', username.toLowerCase()).maybeSingle();
        if (existing) { showError('Username already taken. Choose another.'); setLoading(false); return; }

        const { data: authData, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;

        if (authData.user) {
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
        showSuccess('Account created! You can now sign in.');
        setIsSignUp(false);
      } else {
        const { data: preBan } = await supabase.from('banned_users').select('reason').eq('email', email.toLowerCase()).maybeSingle();
        if (preBan) {
          showError(`This account was removed. Reason: ${preBan.reason}.`);
          setLoading(false);
          setIsSignUp(true);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        const { data: { user: me } } = await supabase.auth.getUser();
        if (me) {
          const { data: ban } = await supabase.from('banned_users').select('reason').eq('user_id', me.id).maybeSingle();
          if (ban) {
            await supabase.auth.signOut();
            showError(`This account was removed. Reason: ${ban.reason}.`);
            setIsSignUp(true);
            return;
          }
        }
        navigate('/Dashboard');
      }
    } catch (err) {
      const msg = err.message || '';
      if (msg.toLowerCase().includes('invalid login') || msg.toLowerCase().includes('invalid credentials')) {
        showError('Incorrect email or password. Please try again.');
      } else if (msg.toLowerCase().includes('email not confirmed')) {
        showError('Please confirm your email before signing in.');
      } else if (msg.toLowerCase().includes('too many requests')) {
        showError('Too many attempts. Please wait a moment and try again.');
      } else {
        showError(msg || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0A0A0A] p-4 relative overflow-hidden font-serif">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#D4A017] rounded-full blur-[120px] opacity-[0.08]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[400px] h-[400px] bg-[#C17F24] rounded-full blur-[100px] opacity-[0.06]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(212,160,23,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(212,160,23,0.03)_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_20%,transparent_100%)]" />
      </div>

      <div className="w-full max-w-sm space-y-8 relative z-10">
        <div className="text-center space-y-4">
          <div className="relative inline-block group">
            <div className="absolute inset-0 bg-[#D4A017] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" />
            <img
              src="/logocash.png"
              alt="Cash Clash Logo"
              className="w-20 h-20 relative z-10 drop-shadow-[0_0_15px_rgba(212,160,23,0.5)]"
            />
          </div>
          <div>
            <h1 className="text-4xl font-bold tracking-[0.1em] text-[#E8E0D0] uppercase font-['Cinzel_Decorative']">
              Cash <span className="text-[#D4A017] drop-shadow-[0_0_10px_rgba(212,160,23,0.4)]">Clash</span>
            </h1>
            <p className="text-xs uppercase tracking-[0.3em] text-[#8A7D6A] mt-2 font-mono">Compete • Save • Win</p>
          </div>
        </div>

        <Card className="bg-[#111111] border-[#D4A017]/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <CardHeader className="pb-4 space-y-1">
            <CardTitle className="text-xl text-[#E8E0D0] font-['Cinzel_Decorative']">
              {isSignUp ? 'Enroll for Battle' : 'Enter the Arena'}
            </CardTitle>
            <CardDescription className="text-[#8A7D6A] italic">
              {isSignUp ? 'Establish your credentials, recruit.' : 'Welcome back, commander.'}
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">

            {/* Error banner */}
            {errorMsg && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.4)',
                borderRadius: 8, padding: '10px 14px',
              }}>
                <AlertCircle style={{ width: 16, height: 16, color: '#f87171', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, color: '#f87171', margin: 0, lineHeight: 1.4 }}>{errorMsg}</p>
              </div>
            )}

            {/* Success banner */}
            {successMsg && (
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.4)',
                borderRadius: 8, padding: '10px 14px',
              }}>
                <CheckCircle style={{ width: 16, height: 16, color: '#4ade80', flexShrink: 0, marginTop: 1 }} />
                <p style={{ fontSize: 13, color: '#4ade80', margin: 0, lineHeight: 1.4 }}>{successMsg}</p>
              </div>
            )}

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="username" className="text-[#E8E0D0]/80 text-xs uppercase tracking-widest">Username</Label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4A017]/60" />
                  <Input
                    id="username"
                    placeholder="your_handle"
                    value={username}
                    onChange={e => setUsername(e.target.value.replace(/\s/g, ''))}
                    className="pl-9 bg-[#1A1A1A] border-[#D4A017]/10 text-[#E8E0D0] focus-visible:ring-[#D4A017]/30 placeholder:text-[#8A7D6A]/40"
                    maxLength={20}
                  />
                </div>
                <p style={{ fontSize: 11, color: 'rgba(212,160,23,0.6)', marginTop: 4 }}>
                  Usernames must be appropriate. Offensive usernames may result in account removal.
                </p>
              </div>
            )}

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="region" className="flex items-center gap-1.5 text-[#E8E0D0]/80 text-xs uppercase tracking-widest">
                  <Globe className="w-3.5 h-3.5 text-[#D4A017]" /> Region
                </Label>
                <select
                  id="region"
                  value={region}
                  onChange={e => setRegion(e.target.value)}
                  className="w-full h-10 rounded-md border border-[#D4A017]/10 bg-[#1A1A1A] px-3 text-sm text-[#E8E0D0] focus:outline-none focus:ring-1 focus:ring-[#D4A017]/30"
                >
                  {REGIONS.map(r => <option key={r.value} value={r.value} className="bg-[#111111]">{r.label} — {r.currency}</option>)}
                </select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-[#E8E0D0]/80 text-xs uppercase tracking-widest">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4A017]/60" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@domain.com"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setErrorMsg(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="pl-9 bg-[#1A1A1A] border-[#D4A017]/10 text-[#E8E0D0] focus-visible:ring-[#D4A017]/30 placeholder:text-[#8A7D6A]/40"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-[#E8E0D0]/80 text-xs uppercase tracking-widest">Passkey</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#D4A017]/60" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setErrorMsg(''); }}
                  onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                  className="pl-9 bg-[#1A1A1A] border-[#D4A017]/10 text-[#E8E0D0] focus-visible:ring-[#D4A017]/30 placeholder:text-[#8A7D6A]/40"
                />
              </div>
            </div>

            <Button
              onClick={handleSubmit}
              className="w-full h-11 bg-gradient-to-r from-[#C17F24] via-[#D4A017] to-[#C17F24] hover:scale-[1.02] transition-transform text-[#0A0A0A] font-bold tracking-[0.15em] font-['Cinzel_Decorative'] shadow-[0_0_20px_rgba(212,160,23,0.3)] border-none"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isSignUp ? 'ENLIST' : 'DEPLOY')}
            </Button>

            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-[#D4A017]/10" /></div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-widest text-[#8A7D6A]">
                <span className="bg-[#111111] px-2">Decision</span>
              </div>
            </div>

            <p className="text-center text-sm text-[#8A7D6A]">
              {isSignUp ? 'Already a veteran?' : "New to the battle?"}{' '}
              <button
                onClick={() => { setIsSignUp(!isSignUp); setErrorMsg(''); setSuccessMsg(''); }}
                className="text-[#D4A017] hover:text-[#F2C94C] transition-colors font-semibold underline underline-offset-4 decoration-[#D4A017]/30"
              >
                {isSignUp ? 'Sign in' : 'Create Account'}
              </button>
            </p>
          </CardContent>
        </Card>

        <footer className="text-center">
          <p className="text-[10px] uppercase tracking-[0.4em] text-[#8A7D6A]/40 font-mono">
            © 2026 CASH CLASH • FOR THE BOLD
          </p>
        </footer>
      </div>
    </div>
  );
}