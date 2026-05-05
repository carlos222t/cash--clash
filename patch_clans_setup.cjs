const fs = require('fs');

// ── 1. App.jsx — add Clans route ─────────────────────────────────────
let app = fs.readFileSync('src/App.jsx', 'utf8');
if (!app.includes("import Clans")) {
  app = app.replace(
    "import Goals from './pages/Goals';",
    "import Goals from './pages/Goals';\nimport Clans from './pages/Clans';"
  );
  app = app.replace(
    "<Route path=\"/Goals\" element={<Goals />} />",
    "<Route path=\"/Goals\" element={<Goals />} />\n          <Route path=\"/Clans\" element={<Clans />} />"
  );
  fs.writeFileSync('src/App.jsx', app, 'utf8');
  console.log('✅ App.jsx — Clans route added');
} else {
  console.log('⏭  App.jsx — Clans route already present');
}

// ── 2. Sidebar.jsx — add Clans nav item ──────────────────────────────
let sidebar = fs.readFileSync('src/components/layout/Sidebar.jsx', 'utf8');
if (!sidebar.includes("'/Clans'")) {
  sidebar = sidebar.replace(
    "import { LayoutDashboard, Wallet, Swords, Trophy, FileText, Settings, ChevronLeft, ChevronRight, LogOut, Zap, Users, Bell, Star, BookOpen, Target } from 'lucide-react';",
    "import { LayoutDashboard, Wallet, Swords, Trophy, FileText, Settings, ChevronLeft, ChevronRight, LogOut, Zap, Users, Bell, Star, BookOpen, Target, Shield } from 'lucide-react';"
  );
  sidebar = sidebar.replace(
    "  { path: '/Goals',     icon: Target,   label: 'Goals',     tutorialId: null },",
    "  { path: '/Goals',     icon: Target,   label: 'Goals',     tutorialId: null },\n  { path: '/Clans',     icon: Shield,   label: 'Clans',     tutorialId: null },"
  );
  fs.writeFileSync('src/components/layout/Sidebar.jsx', sidebar, 'utf8');
  console.log('✅ Sidebar.jsx — Clans nav item added');
} else {
  console.log('⏭  Sidebar.jsx — Clans already present');
}

// ── 3. MobileNav.jsx — add Clans tab ─────────────────────────────────
let mobile = fs.readFileSync('src/components/layout/MobileNav.jsx', 'utf8');
if (!mobile.includes("'/Clans'")) {
  mobile = mobile.replace(
    "import { LayoutDashboard, Wallet, Swords, Trophy, Settings, Bell, Users, Target } from 'lucide-react';",
    "import { LayoutDashboard, Wallet, Swords, Trophy, Settings, Bell, Users, Target, Shield } from 'lucide-react';"
  );
  mobile = mobile.replace(
    "  { path: '/Goals',      icon: Target,          label: 'Goals' },",
    "  { path: '/Goals',      icon: Target,          label: 'Goals' },\n  { path: '/Clans',      icon: Shield,          label: 'Clans' },"
  );
  fs.writeFileSync('src/components/layout/MobileNav.jsx', mobile, 'utf8');
  console.log('✅ MobileNav.jsx — Clans tab added');
} else {
  console.log('⏭  MobileNav.jsx — Clans already present');
}

// ── 4. Reverse the 1M XP from Rush win ───────────────────────────────
let utils = fs.readFileSync('src/components/game/GameUtils.jsx', 'utf8');
utils = utils.replace(
  `  WIN_RUSH:      1000000,   // Challenge Rush win = 1,000,000 XP\n`,
  ''
);
fs.writeFileSync('src/components/game/GameUtils.jsx', utils, 'utf8');
console.log('✅ GameUtils.jsx — WIN_RUSH 1,000,000 XP removed');

let challenges = fs.readFileSync('src/pages/Challenges.jsx', 'utf8');
challenges = challenges.replace(
  `          const newXP     = (profile.xp || 0) + XP_ACTIONS.WIN_RUSH;`,
  `          const newXP     = (profile.xp || 0) + XP_ACTIONS.WIN_CHALLENGE;`
);
challenges = challenges.replace(
  `      toast.success('🏆 GODLY! You finished all 10 tasks — 1,000,000 XP awarded!');`,
  `      toast.success('🏆 You finished all 10 tasks — you win the Rush! +' + XP_ACTIONS.WIN_CHALLENGE + ' XP');`
);
fs.writeFileSync('src/pages/Challenges.jsx', challenges, 'utf8');
console.log('✅ Challenges.jsx — Rush win now awards WIN_CHALLENGE XP (100)');

// ── 5. Leaderboard.jsx — add Clans tab ───────────────────────────────
let lb = fs.readFileSync('src/pages/Leaderboard.jsx', 'utf8');
if (!lb.includes('clans-leaderboard')) {
  // Add clan leaderboard query
  lb = lb.replace(
    `  const { data: byTournament = [] } = useQuery({ queryKey: ['leaderboard', 'tournament_wins'],  queryFn: () => profilesApi.leaderboard('tournament_wins', 50) });`,
    `  const { data: byTournament = [] } = useQuery({ queryKey: ['leaderboard', 'tournament_wins'],  queryFn: () => profilesApi.leaderboard('tournament_wins', 50) });

  const { data: clanLB = [] } = useQuery({
    queryKey: ['clans-leaderboard'],
    queryFn: async () => {
      const { data } = await supabase.from('clans').select('*').order('total_wins', { ascending: false }).limit(25);
      return data || [];
    },
  });`
  );

  // Add supabase import if not present
  if (!lb.includes("import { supabase }")) {
    lb = lb.replace(
      `import { profilesApi } from '@/api/supabaseClient';`,
      `import { profilesApi, supabase } from '@/api/supabaseClient';`
    );
  }

  // Add Shield import
  lb = lb.replace(
    `import { Trophy, Swords, Star, Crown, Medal } from 'lucide-react';`,
    `import { Trophy, Swords, Star, Crown, Medal, Shield, Users } from 'lucide-react';`
  );

  // Add Clans tab trigger
  lb = lb.replace(
    `        <TabsTrigger value="tournaments" className="flex-1 gap-1.5"><Trophy className="w-3.5 h-3.5" /> Tournament Wins</TabsTrigger>`,
    `        <TabsTrigger value="tournaments" className="flex-1 gap-1.5"><Trophy className="w-3.5 h-3.5" /> Tournaments</TabsTrigger>
        <TabsTrigger value="clans" className="flex-1 gap-1.5"><Shield className="w-3.5 h-3.5" /> Clans</TabsTrigger>`
  );

  // Add Clans tab content before closing Tabs
  lb = lb.replace(
    `        <TabsContent value="tournaments" className="mt-4">{renderList(byTournament, 'tournament_wins', 'wins', Trophy)}</TabsContent>`,
    `        <TabsContent value="tournaments" className="mt-4">{renderList(byTournament, 'tournament_wins', 'wins', Trophy)}</TabsContent>
        <TabsContent value="clans" className="mt-4">
          {clanLB.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Shield className="w-10 h-10 mx-auto mb-3 opacity-20" />
              <p className="text-sm">No clans yet. Be the first to create one!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {clanLB.map((clan, idx) => (
                <motion.div key={clan.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}>
                  <div className={[
                    'flex items-center gap-3 p-3 rounded-xl border',
                    idx === 0 ? 'bg-yellow-500/10 border-yellow-500/30' :
                    idx === 1 ? 'bg-slate-400/10 border-slate-400/30' :
                    idx === 2 ? 'bg-amber-700/10 border-amber-700/30' : 'bg-card border-border'
                  ].join(' ')}>
                    <div className={[
                      'w-8 text-center font-heading font-bold text-sm flex-shrink-0',
                      idx === 0 ? 'text-yellow-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700' : 'text-muted-foreground'
                    ].join(' ')}>
                      {idx === 0 ? <Crown className="w-5 h-5 mx-auto text-yellow-500" /> : \`#\${idx + 1}\`}
                    </div>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 border border-primary/20 flex items-center justify-center text-xl flex-shrink-0">
                      {clan.avatar_url ? <img src={clan.avatar_url} className="w-full h-full object-cover rounded-xl" alt="clan" /> : clan.avatar_emoji || '🛡️'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{clan.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2">
                        <span className="flex items-center gap-0.5"><Users className="w-3 h-3" />{clan.member_count || 0} members</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Trophy className="w-3.5 h-3.5 text-primary" />
                      <span className="text-sm font-bold font-heading">{clan.total_wins || 0}</span>
                      <span className="text-[10px] text-muted-foreground">wins</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>`
  );

  fs.writeFileSync('src/pages/Leaderboard.jsx', lb, 'utf8');
  console.log('✅ Leaderboard.jsx — Clans leaderboard tab added');
} else {
  console.log('⏭  Leaderboard.jsx — Clans tab already present');
}

console.log('\n🎉 All patches applied! Now copy Clans.jsx then run: npm run dev');
