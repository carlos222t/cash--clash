import { Analytics } from "@vercel/analytics/react"
import { Toaster } from "@/components/ui/toaster"
import CryptoPackOpener from './pages/CryptoPackOpener';
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { TutorialProvider } from '@/lib/TutorialContext';
import GoalGuide from './pages/GoalGuide'; 
import StockSense from './pages/StockSense';
import AppLayout from './components/layout/AppLayout';
import TutorialOverlay from './components/layout/TutorialOverlay';
import Dashboard from './pages/Dashboard';
import Budget from './pages/Budget';
import Challenges from './pages/Challenges';
import Badges from './pages/Badges';
import Settings from './pages/Settings';
import Login from './pages/Login';
import Friends from './pages/Friends';
import Inbox from './pages/Inbox';
import Leaderboard from './pages/Leaderboard';
import Goals from './pages/Goals';
import Clans from './pages/Clans';
import StockMarket from './pages/StockMarket';
import Learn from './pages/Learn';
import Customize from './pages/Customize';
import Study from './pages/Study';
import Diary from './pages/Diary';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated } = useAuth();

  if (isLoadingAuth) {
    return (
      <div style={{
        position: 'fixed', inset: 0, background: '#0A0A0A',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        fontFamily: 'ui-sans-serif, system-ui, sans-serif',
      }}>
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: '30%', left: '50%', transform: 'translate(-50%, -50%)',
          width: 400, height: 400, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(212,160,23,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <div style={{ position: 'relative', marginBottom: 32 }}>
          <div style={{
            position: 'absolute', inset: -16, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(212,160,23,0.25) 0%, transparent 70%)',
            animation: 'cc-pulse 2s ease-in-out infinite',
          }} />
          <img
            src="/logocash.png"
            alt="Cash Clash"
            style={{ width: 80, height: 80, position: 'relative', zIndex: 1,
              filter: 'drop-shadow(0 0 20px rgba(212,160,23,0.5))' }}
          />
        </div>

        {/* Title */}
        <h1 style={{
          fontSize: 28, fontWeight: 800, letterSpacing: '0.15em',
          textTransform: 'uppercase', color: '#E8E0D0', margin: '0 0 4px 0',
        }}>
          Cash <span style={{ color: '#D4A017' }}>Clash</span>
        </h1>
        <p style={{ fontSize: 10, letterSpacing: '0.35em', textTransform: 'uppercase',
          color: 'rgba(138,125,106,0.7)', margin: '0 0 40px 0' }}>
          Compete • Save • Win
        </p>

        {/* Loading bar */}
        <div style={{
          width: 180, height: 2, background: 'rgba(212,160,23,0.15)',
          borderRadius: 99, overflow: 'hidden',
        }}>
          <div style={{
            height: '100%', width: '40%', borderRadius: 99,
            background: 'linear-gradient(90deg, #7a5e18, #D4A017, #7a5e18)',
            backgroundSize: '200% 100%',
            animation: 'cc-shimmer 1.4s ease-in-out infinite',
          }} />
        </div>

        <style>{`
          @keyframes cc-pulse {
            0%, 100% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.08); }
          }
          @keyframes cc-shimmer {
            0% { background-position: 200% 0; transform: translateX(-100%); }
            100% { background-position: -200% 0; transform: translateX(350%); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <>
      <TutorialOverlay />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={isAuthenticated ? <Navigate to="/Dashboard" replace /> : <Navigate to="/login" replace />} />
        <Route element={isAuthenticated ? <AppLayout /> : <Navigate to="/login" replace />}>
          <Route path="/Dashboard"   element={<Dashboard />} />
          <Route path="/Packs" element={<CryptoPackOpener />} />
          <Route path="/Budget"      element={<Budget />} />
          <Route path="/Challenges"  element={<Challenges />} />
          <Route path="/Badges"      element={<Badges />} />
          <Route path="/Settings"    element={<Settings />} />
          <Route path="/Friends"     element={<Friends />} />
          <Route path="/Inbox"       element={<Inbox />} />
          <Route path="/Leaderboard" element={<Leaderboard />} />
          <Route path="/Goals" element={<Goals />} />
          <Route path="/Clans" element={<Clans />} />
          <Route path="/StockMarket" element={<StockMarket />} />
          <Route path="/Learn" element={<Learn />} />
          <Route path="/GoalGuide" element={<GoalGuide />} />
          <Route path="/Customize" element={<Customize />} />
          <Route path="/StockSense" element={<StockSense />} />
          <Route path="/Study" element={<Study />} />
          <Route path="/Diary" element={<Diary />} />
        </Route>
    
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <TutorialProvider>
            <AuthenticatedApp />
          </TutorialProvider>
        </Router>
        <Toaster />
      <Analytics />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
