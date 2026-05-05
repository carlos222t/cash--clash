import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, Swords, Trophy, Settings, Bell, Users, Target, Shield, TrendingUp, GraduationCap } from 'lucide-react';
import { useAuth } from '@/lib/AuthContext';
import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '@/api/supabaseClient';

const NAV_ITEMS = [
  { path: '/Dashboard',  icon: LayoutDashboard, label: 'Home' },
  { path: '/Budget',     icon: Wallet,          label: 'Budget' },
  { path: '/Challenges', icon: Swords,          label: 'Clash' },
  { path: '/Friends',    icon: Users,           label: 'Friends' },
  { path: '/Inbox',      icon: Bell,            label: 'Inbox', badge: true },
  { path: '/Goals',      icon: Target,          label: 'Goals' },
  { path: '/Clans',      icon: Shield,          label: 'Clans' },
  { path: '/Settings',   icon: Settings,        label: 'Settings' },
  { path: '/StockMarket', icon: TrendingUp,      label: 'Markets' },
  { path: '/Learn',       icon: GraduationCap,  label: 'Learn' },
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
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 px-2 py-1 safe-area-bottom">
      <div className="flex items-center justify-around">
        {NAV_ITEMS.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path} className="flex flex-col items-center py-2 px-2 relative">
              <item.icon className={`w-5 h-5 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />
              {item.badge && unreadCount > 0 && (
                <span className="absolute top-1 right-0 min-w-[16px] h-4 px-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
              <span className={`text-[10px] mt-1 ${isActive ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
