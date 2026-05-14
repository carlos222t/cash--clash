import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi, supabase } from '@/api/supabaseClient';
import { useTutorial } from '@/lib/TutorialContext';
import {
  LayoutDashboard, Wallet, Swords, Trophy, Settings,
  ChevronLeft, ChevronRight, LogOut, Zap, Users, Bell,
  Star, BookOpen, Target, Shield, TrendingUp, GraduationCap,
  Paintbrush, CreditCard, BarChart2, NotebookPen, ChevronDown,
  Lock, Crown,
} from 'lucide-react';

const PRIMARY_NAV = [
  { path: '/Dashboard',  icon: LayoutDashboard, label: 'Dashboard', description: 'Your hub',       tutorialId: 'nav-dashboard' },
  { path: '/Budget',     icon: Wallet,          label: 'Budget',    description: 'Track money',    tutorialId: 'nav-budget' },
  { path: '/Challenges', icon: Swords,          label: 'Clash',     description: 'Battle friends', accent: true, tutorialId: 'nav-clash' },
  { path: '/Packs',      icon: CreditCard,      label: 'Store',     description: 'Get packs',      tutorialId: null },
];

const COMMUNITY_NAV = [
  { path: '/Leaderboard', icon: Trophy,  label: 'Leaderboard', tutorialId: 'nav-leaderboard' },
  { path: '/Clans',       icon: Shield,  label: 'Clans',       tutorialId: null },
  { path: '/Friends',     icon: Users,   label: 'Friends',     tutorialId: 'nav-friends' },
  { path: '/Badges',      icon: Star,    label: 'Badges',      tutorialId: 'nav-badges' },
  { path: '/Customize',   icon: Paintbrush,  label: 'Customize',   tutorialId: null },
];

const EXPLORE_NAV = [
  { path: '/GoalGuide',   icon: Target,      label: 'Goal Guide',  tutorialId: null },
  { path: '/daytrade',    icon: TrendingUp,  label: 'Day Trading', tutorialId: null },
  { path: '/Investments', icon: BarChart2,   label: 'Investments', tutorialId: null },
  { path: '/Diary',       icon: NotebookPen, label: 'Diary',       tutorialId: null },
];

/* ── Design tokens ── */
const T = {
  bg:           '#0E0E11',
  surface:      '#111114',
  surfaceHover: '#1A1A1F',
  gold:         '#B8973A',
  goldLight:    '#D4AF5A',
  goldDim:      'rgba(184,151,58,0.12)',
  goldBorder:   'rgba(184,151,58,0.28)',
  border:       'rgba(255,255,255,0.06)',
  text:         '#F0EDE6',
  textMuted:    'rgba(240,237,230,0.4)',
  textDim:      'rgba(240,237,230,0.22)',
  vip:          '#A78BFA',
  vipDim:       'rgba(167,139,250,0.12)',
  vipBorder:    'rgba(167,139,250,0.28)',
};

export default function Sidebar({ collapsed, setCollapsed, isVip = false }) {
  const location = useLocation();
  const { logout, user } = useAuth();
  const { start: startTutorial } = useTutorial();

  const [communityOpen, setCommunityOpen] = useState(
    COMMUNITY_NAV.some(i => i.path === location.pathname)
  );
  const [exploreOpen, setExploreOpen] = useState(
    isVip && EXPLORE_NAV.some(i => i.path === location.pathname)
  );
  const [showVipNudge, setShowVipNudge] = useState(false);

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notif-count', user?.id],
    queryFn: () => notificationsApi.getUnreadCount(user.id),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const { data: coinBalance = 0 } = useQuery({
    queryKey: ['sidebar-coins', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('coins')
        .eq('created_by', user.id)
        .single();
      if (error) throw error;
      return data?.coins ?? 0;
    },
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  const handleExploreToggle = () => {
    if (!isVip) {
      setShowVipNudge(true);
      setTimeout(() => setShowVipNudge(false), 3000);
      return;
    }
    setExploreOpen(o => !o);
  };

  /* ── Individual nav link ── */
  const NavItem = ({ item, size = 'normal', indent = false }) => {
    const isActive = location.pathname === item.path;
    const isLarge  = size === 'large';
    const isAccent = item.accent;

    let bg, color, shadow;
    if (isActive && isAccent) { bg = T.goldDim; color = T.gold; shadow = `0 0 16px ${T.goldDim}`; }
    else if (isActive)        { bg = 'rgba(184,151,58,0.1)'; color = T.gold; shadow = 'none'; }
    else if (isAccent)        { bg = 'transparent'; color = T.gold; shadow = 'none'; }
    else                      { bg = 'transparent'; color = T.textMuted; shadow = 'none'; }

    return (
      <Link to={item.path} style={{ textDecoration: 'none' }}>
        <div
          data-tutorial={item.tutorialId || undefined}
          style={{
            display: 'flex', alignItems: 'center',
            gap: 10,
            padding: isLarge ? '10px 12px' : '8px 12px',
            paddingLeft: indent && !collapsed ? 20 : 12,
            borderRadius: 10,
            background: bg, color, boxShadow: shadow,
            border: isActive
              ? `1px solid ${isAccent ? T.goldBorder : 'rgba(184,151,58,0.18)'}`
              : '1px solid transparent',
            transition: 'all 0.15s',
            cursor: 'pointer', position: 'relative',
          }}
          onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = T.surfaceHover; e.currentTarget.style.color = T.text; } }}
          onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = bg; e.currentTarget.style.color = color; } }}
        >
          <item.icon style={{ width: isLarge ? 20 : 17, height: isLarge ? 20 : 17, flexShrink: 0 }} />
          {!collapsed && (
            <div>
              <span style={{ fontWeight: 500, fontSize: isLarge ? 14 : 13 }}>{item.label}</span>
              {item.description && (
                <p style={{ fontSize: 10, opacity: 0.5, lineHeight: 1, marginTop: 2 }}>{item.description}</p>
              )}
            </div>
          )}
          {isActive && (
            <div style={{
              position: 'absolute', left: 0, top: '20%', bottom: '20%',
              width: 2, borderRadius: 99,
              background: `linear-gradient(180deg, ${T.gold}, ${T.goldLight})`,
            }} />
          )}
        </div>
      </Link>
    );
  };

  /* ── Collapsible section header ── */
  const SectionHeader = ({ label, isOpen, onToggle, hasActiveChild }) => {
    if (collapsed) {
      return <div style={{ margin: '8px 0', height: 1, background: T.border }} />;
    }
    return (
      <button
        onClick={onToggle}
        style={{
          width: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 12px 4px',
          background: 'transparent', border: 'none', cursor: 'pointer',
          transition: 'all 0.15s',
        }}
      >
        <span style={{
          fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
          textTransform: 'uppercase',
          color: hasActiveChild ? T.gold : T.textDim,
          transition: 'color 0.15s',
        }}>
          {label}
        </span>
        <ChevronDown style={{
          width: 12, height: 12,
          color: hasActiveChild ? T.gold : T.textDim,
          transform: isOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
          transition: 'transform 0.2s ease, color 0.15s',
        }} />
      </button>
    );
  };

  /* ── VIP-locked Explore header ── */
  const ExploreHeader = () => {
    const hasActiveChild = EXPLORE_NAV.some(i => i.path === location.pathname);

    if (collapsed) {
      return <div style={{ margin: '8px 0', height: 1, background: T.border }} />;
    }

    return (
      <div style={{ position: 'relative' }}>
        <button
          onClick={handleExploreToggle}
          style={{
            width: '100%',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 12px 4px',
            background: 'transparent', border: 'none', cursor: isVip ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{
              fontSize: 9, fontWeight: 700, letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: !isVip ? T.textDim : hasActiveChild ? T.gold : T.textDim,
              transition: 'color 0.15s',
              opacity: isVip ? 1 : 0.5,
            }}>
              Explore
            </span>
            {!isVip ? (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 3,
                background: T.vipDim, border: `1px solid ${T.vipBorder}`,
                borderRadius: 99, padding: '1px 6px',
              }}>
                <Crown style={{ width: 8, height: 8, color: T.vip }} />
                <span style={{ fontSize: 8, fontWeight: 700, color: T.vip, letterSpacing: '0.08em' }}>VIP</span>
              </div>
            ) : (
              <ChevronDown style={{
                width: 12, height: 12,
                color: hasActiveChild ? T.gold : T.textDim,
                transform: exploreOpen ? 'rotate(0deg)' : 'rotate(-90deg)',
                transition: 'transform 0.2s ease, color 0.15s',
              }} />
            )}
          </div>
          {!isVip && (
            <Lock style={{ width: 10, height: 10, color: T.vip, opacity: 0.6 }} />
          )}
        </button>

        {/* VIP nudge toast */}
        <AnimatePresence>
          {showVipNudge && (
            <motion.div
              initial={{ opacity: 0, y: -6, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              style={{
                position: 'absolute', left: 8, right: 8,
                top: '100%', marginTop: 4, zIndex: 100,
                background: '#1A1525',
                border: `1px solid ${T.vipBorder}`,
                borderRadius: 10, padding: '10px 12px',
                boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Crown style={{ width: 13, height: 13, color: T.vip, flexShrink: 0 }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: T.vip }}>VIP Required</span>
              </div>
              <p style={{ fontSize: 10, color: T.textMuted, lineHeight: 1.4, margin: 0 }}>
                Upgrade to VIP to unlock Goal Guide, Day Trading, Investments, Customize & Diary.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const communityHasActive = COMMUNITY_NAV.some(i => i.path === location.pathname);

  const footerItem = (path, Icon, label, tutorialId, extraContent) => {
    const isActive = location.pathname === path;
    return (
      <Link to={path} style={{ textDecoration: 'none' }}>
        <div
          data-tutorial={tutorialId}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 12px', borderRadius: 10,
            background: isActive ? T.goldDim : 'transparent',
            color: isActive ? T.gold : T.textMuted,
            border: isActive ? `1px solid ${T.goldBorder}` : '1px solid transparent',
            transition: 'all 0.15s', cursor: 'pointer', position: 'relative',
          }}
          onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = T.surfaceHover; e.currentTarget.style.color = T.text; } }}
          onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textMuted; } }}
        >
          <Icon style={{ width: 17, height: 17, flexShrink: 0 }} />
          {!collapsed && <span style={{ fontSize: 13 }}>{label}</span>}
          {extraContent}
        </div>
      </Link>
    );
  };

  return (
    <aside style={{
      position: 'fixed', left: 0, top: 0, height: '100vh',
      width: collapsed ? 72 : 240,
      background: T.bg,
      borderRight: `1px solid ${T.border}`,
      display: 'flex', flexDirection: 'column',
      overflowY: 'auto',
      overflowX: 'hidden',
      zIndex: 50,
      transition: 'width 0.3s',
      fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif",
    }}>

      {/* ── LOGO ── */}
      <div style={{
        padding: collapsed ? '12px 8px' : '20px 16px',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        borderBottom: `1px solid ${T.border}`,
      }}>
        <div style={{ width: '100%', aspectRatio: '1 / 0.4', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <img src="/cash.clash.png" alt="Cash Clash Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          gap: 6, padding: collapsed ? '6px' : '6px 14px', borderRadius: 99,
          background: T.goldDim, border: '1px solid ' + T.goldBorder,
          width: '100%', boxSizing: 'border-box',
          animation: 'coinPulse 3s ease-in-out infinite',
        }}>
          <span style={{
            fontSize: 13, fontWeight: 800, color: T.gold,
            display: 'inline-block',
            animation: 'coinSpin 4s ease-in-out infinite',
          }}>◈</span>
          {collapsed ? null : (
            <span style={{ fontSize: 12, fontWeight: 700, color: T.goldLight, letterSpacing: '0.03em' }}>
              {coinBalance.toLocaleString()}
            </span>
          )}
        </div>
      </div>

      {/* ── TUTORIAL BUTTON ── */}
      <div style={{ padding: collapsed ? '10px 8px 0' : '10px 10px 0' }}>
        <button
          data-tutorial="btn-tutorial"
          onClick={startTutorial}
          title="Tutorial"
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 7, padding: collapsed ? '8px' : '8px 12px', borderRadius: 9,
            background: T.goldDim, border: `1px solid ${T.goldBorder}`,
            color: T.gold, fontSize: 11, fontWeight: 700,
            cursor: 'pointer', transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(184,151,58,0.2)'}
          onMouseLeave={e => e.currentTarget.style.background = T.goldDim}
        >
          <BookOpen style={{ width: 14, height: 14, flexShrink: 0 }} />
          {!collapsed && 'How to use Cash Clash'}
        </button>
      </div>

      {/* ── NAV ── */}
      <nav style={{ padding: '8px 8px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* Primary: always visible — includes Packs/Store */}
        {PRIMARY_NAV.map(item => <NavItem key={item.path} item={item} size="large" />)}

        {/* ── COMMUNITY section ── */}
        <SectionHeader
          label="Community"
          isOpen={communityOpen}
          onToggle={() => setCommunityOpen(o => !o)}
          hasActiveChild={communityHasActive}
        />

        <AnimatePresence initial={false}>
          {(communityOpen || collapsed) && (
            <motion.div
              key="community"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              {COMMUNITY_NAV.map(item => (
                <NavItem key={item.path} item={item} indent={!collapsed} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── EXPLORE section (VIP-locked) ── */}
        <ExploreHeader />

        <AnimatePresence initial={false}>
          {isVip && (exploreOpen || collapsed) && (
            <motion.div
              key="explore"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeInOut' }}
              style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', gap: 2 }}
            >
              {EXPLORE_NAV.map(item => (
                <NavItem key={item.path} item={item} indent={!collapsed} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Locked preview for non-VIP (collapsed mode: just divider; expanded: ghost items) */}
        {!isVip && !collapsed && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, opacity: 0.35, pointerEvents: 'none' }}>
            {EXPLORE_NAV.map(item => (
              <div
                key={item.path}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', paddingLeft: 20,
                  borderRadius: 10, color: T.textDim,
                  filter: 'blur(0.5px)',
                }}
              >
                <item.icon style={{ width: 17, height: 17, flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 500 }}>{item.label}</span>
                <Lock style={{ width: 10, height: 10, marginLeft: 'auto', flexShrink: 0 }} />
              </div>
            ))}
          </div>
        )}

      </nav>

      {/* ── FOOTER ── */}
      <div style={{ padding: '8px', borderTop: `1px solid ${T.border}`, display: 'flex', flexDirection: 'column', gap: 2 }}>

        {/* Inbox with unread badge */}
        <Link to="/Inbox" style={{ textDecoration: 'none' }}>
          <div
            data-tutorial="nav-inbox"
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 10, position: 'relative',
              background: location.pathname === '/Inbox' ? T.goldDim : 'transparent',
              color: location.pathname === '/Inbox' ? T.gold : T.textMuted,
              border: location.pathname === '/Inbox' ? `1px solid ${T.goldBorder}` : '1px solid transparent',
              transition: 'all 0.15s', cursor: 'pointer',
            }}
            onMouseEnter={e => { if (location.pathname !== '/Inbox') { e.currentTarget.style.background = T.surfaceHover; e.currentTarget.style.color = T.text; } }}
            onMouseLeave={e => { if (location.pathname !== '/Inbox') { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textMuted; } }}
          >
            <Bell style={{ width: 17, height: 17, flexShrink: 0 }} />
            {!collapsed && <span style={{ fontSize: 13 }}>Inbox</span>}
            {unreadCount > 0 && (
              <span style={{
                position: 'absolute',
                top: collapsed ? 4 : '50%', right: collapsed ? 4 : 10,
                transform: collapsed ? 'none' : 'translateY(-50%)',
                minWidth: 17, height: 17, padding: '0 4px', borderRadius: 99,
                background: T.gold, color: '#0C0C0E',
                fontSize: 9, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
        </Link>

        {footerItem('/Settings', Settings, 'Settings', 'nav-settings', null)}

        {/* Logout */}
        <button
          onClick={() => logout()}
          style={{
            width: '100%', display: 'flex', alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'flex-start',
            gap: 10, padding: '8px 12px', borderRadius: 10,
            background: 'transparent', border: '1px solid transparent',
            color: T.textMuted, fontSize: 13, cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = T.surfaceHover; e.currentTarget.style.color = T.text; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textMuted; }}
        >
          <LogOut style={{ width: 17, height: 17, flexShrink: 0 }} />
          {!collapsed && <span>Logout</span>}
        </button>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '7px', borderRadius: 10,
            background: 'transparent', border: '1px solid transparent',
            color: T.textDim, cursor: 'pointer', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = T.surfaceHover; e.currentTarget.style.color = T.text; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = T.textDim; }}
        >
          {collapsed
            ? <ChevronRight style={{ width: 14, height: 14 }} />
            : <ChevronLeft style={{ width: 14, height: 14 }} />}
        </button>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&family=Cormorant+Garamond:wght@600;700&display=swap');
        aside::-webkit-scrollbar { width: 3px; }
        aside::-webkit-scrollbar-track { background: transparent; }
        aside::-webkit-scrollbar-thumb { background: rgba(184,151,58,0.25); border-radius: 99px; }
        aside::-webkit-scrollbar-thumb:hover { background: rgba(184,151,58,0.5); }
      `}</style>
    </aside>
  );
}