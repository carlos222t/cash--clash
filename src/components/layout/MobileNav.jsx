import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, Swords, Bell, Users, Target, Shield, Trophy, TrendingUp, CreditCard, Paintbrush, BarChart2, Settings, GraduationCap, BookOpen, NotebookPen } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/api/supabaseClient';

const NAV_ITEMS = [
  { path: '/Dashboard',   icon: LayoutDashboard, label: 'Home'        },
  { path: '/Budget',      icon: Wallet,          label: 'Budget'      },
  { path: '/Challenges',  icon: Swords,          label: 'Clash'       },
  { path: '/Friends',     icon: Users,           label: 'Friends'     },
  { path: '/Inbox',       icon: Bell,            label: 'Inbox',  badge: true },
  { path: '/Goals',       icon: Target,          label: 'Goals'       },
  { path: '/Clans',       icon: Shield,          label: 'Clans'       },
  { path: '/Leaderboard', icon: Trophy,          label: 'Ranks'       },
  { path: '/StockMarket', icon: BarChart2,        label: 'Markets'     },
  { path: '/Packs',       icon: CreditCard,      label: 'Store'       },
  { path: '/Customize',   icon: Paintbrush,      label: 'Customize'   },
  { path: '/Learn',       icon: GraduationCap,   label: 'Learn'       },
  { path: '/Diary',        icon: NotebookPen,     label: 'Diary'       },
  { path: '/Settings',    icon: Settings,        label: 'Settings'    },
];

export default function MobileNav() {
  const location = useLocation();
  const { user } = useAuth();

  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notif-count', user?.id],
    queryFn: () => notificationsApi.getUnreadCount(user.id),
    enabled: !!user?.id,
    refetchInterval: 30000,
  });

  return (
    <>
      <style>{`
        .mobile-nav-bar {
          position: fixed; bottom: 0; left: 0; right: 0;
          background: #111114;
          border-top: 1px solid rgba(184,151,58,0.18);
          z-index: 50;
          padding: 6px 4px 10px;
          padding-bottom: calc(10px + env(safe-area-inset-bottom));
        }
        .mobile-nav-scroll {
          display: flex;
          overflow-x: auto;
          gap: 2px;
          scrollbar-width: none;
          -ms-overflow-style: none;
          padding: 0 4px;
        }
        .mobile-nav-scroll::-webkit-scrollbar { display: none; }
        .mobile-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 6px 10px;
          border-radius: 10px;
          min-width: 56px;
          flex-shrink: 0;
          text-decoration: none;
          transition: background 0.15s;
          position: relative;
        }
        .mobile-nav-item.active {
          background: rgba(184,151,58,0.12);
        }
        .mobile-nav-item:active { opacity: 0.7; }
        .mobile-nav-label {
          font-size: 9px;
          margin-top: 3px;
          font-weight: 500;
          letter-spacing: 0.01em;
          white-space: nowrap;
        }
      `}</style>
      <nav className="mobile-nav-bar">
        <div className="mobile-nav-scroll">
          {NAV_ITEMS.map(item => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`mobile-nav-item${isActive ? ' active' : ''}`}
              >
                <item.icon
                  style={{
                    width: 18, height: 18,
                    color: isActive ? '#B8973A' : 'rgba(240,237,230,0.4)',
                    transition: 'color 0.15s',
                  }}
                />
                {item.badge && unreadCount > 0 && (
                  <span style={{
                    position: 'absolute', top: 4, right: 8,
                    minWidth: 15, height: 15,
                    padding: '0 3px',
                    borderRadius: 99,
                    background: '#B8973A',
                    color: '#0C0C0E',
                    fontSize: 8,
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}>
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
                <span
                  className="mobile-nav-label"
                  style={{ color: isActive ? '#B8973A' : 'rgba(240,237,230,0.38)', fontWeight: isActive ? 700 : 500 }}
                >
                  {item.label}
                </span>
                {isActive && (
                  <span style={{
                    position: 'absolute', bottom: 2, left: '50%',
                    transform: 'translateX(-50%)',
                    width: 16, height: 2, borderRadius: 99,
                    background: '#B8973A',
                  }} />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
