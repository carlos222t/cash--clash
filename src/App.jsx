import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { TutorialProvider } from '@/lib/TutorialContext';

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

const AuthenticatedApp = () => {
  const { isLoadingAuth, isAuthenticated } = useAuth();

  if (isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto"></div>
          <p className="text-sm text-muted-foreground font-heading">Loading Cash Clash...</p>
        </div>
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
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
