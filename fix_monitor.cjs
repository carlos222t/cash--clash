const fs = require('fs');
let src = fs.readFileSync('src/pages/Dashboard.jsx', 'utf8');

// 1. Add clans state variables after banLoading
src = src.replace(
  `  const [banLoading, setBanLoading] = useState(false);`,
  `  const [banLoading, setBanLoading] = useState(false);
  const [monitorTab, setMonitorTab] = useState('players'); // 'players' | 'clans'
  const [allClans, setAllClans] = useState([]);
  const [clanTarget, setClanTarget] = useState(null);
  const [clanDeleteReason, setClanDeleteReason] = useState('');
  const [clanDeleteStep, setClanDeleteStep] = useState('reason');
  const [clanDeletePassword, setClanDeletePassword] = useState('');
  const [clanDeleteError, setClanDeleteError] = useState('');
  const [clanDeleteLoading, setClanDeleteLoading] = useState(false);`
);

// 2. Add loadClans function after loadPlayers
src = src.replace(
  `  const executeBan = async () => {`,
  `  const loadClans = async () => {
    const { data } = await supabase
      .from('clans')
      .select('id, name, description, image_url, member_count, created_at, owner_id')
      .order('name', { ascending: true });
    setAllClans(data || []);
  };

  const executeClanDelete = async () => {
    if (clanDeletePassword !== 'Tajin282') { setClanDeleteError('Incorrect password.'); return; }
    setClanDeleteLoading(true);
    try {
      await supabase.from('clan_members').delete().eq('clan_id', clanTarget.id);
      await supabase.from('clan_join_requests').delete().eq('clan_id', clanTarget.id);
      await supabase.from('clans').delete().eq('id', clanTarget.id);
      setAllClans(prev => prev.filter(c => c.id !== clanTarget.id));
      setClanTarget(null); setClanDeleteReason(''); setClanDeletePassword(''); setClanDeleteStep('reason'); setClanDeleteError('');
    } catch (e) { setClanDeleteError(e.message); }
    setClanDeleteLoading(false);
  };

  const executeBan = async () => {`
);

// 3. Update the monitor open button to also load clans
src = src.replace(
  `onClick={() => { setShowMonitor(true); loadPlayers(); }}`,
  `onClick={() => { setShowMonitor(true); loadPlayers(); loadClans(); }}`
);

// 4. Update player avatar to show pfp image
src = src.replace(
  `                      <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(184,151,58,0.12)', border: '1px solid rgba(184,151,58,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#B8973A', flexShrink: 0 }}>
                        {(pl.display_name || pl.username || '?')[0].toUpperCase()}
                      </div>`,
  `                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(184,151,58,0.12)', border: '1px solid rgba(184,151,58,0.2)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 13, color: '#B8973A', flexShrink: 0 }}>
                        {pl.custom_avatar_url
                          ? <img src={pl.custom_avatar_url} alt={pl.display_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : (pl.display_name || pl.username || '?')[0].toUpperCase()
                        }
                      </div>`
);

// 5. Update loadPlayers to also fetch custom_avatar_url
src = src.replace(
  `      .select('id, created_by, display_name, username, email, xp, level')`,
  `      .select('id, created_by, display_name, username, email, xp, level, custom_avatar_url')`
);

// 6. Replace the monitor panel header + player list section with tabbed version
src = src.replace(
  `              {/* Player list */}
              {!banTarget && (
                <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
                  {allPlayers.map((pl, i) => (`,
  `              {/* Tabs */}
              {!banTarget && !clanTarget && (
                <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)', padding: '0 24px' }}>
                  {[{ key: 'players', label: 'Players' }, { key: 'clans', label: 'Clans' }].map(t => (
                    <button key={t.key} onClick={() => setMonitorTab(t.key)} style={{
                      padding: '10px 16px', background: 'none', border: 'none', cursor: 'pointer',
                      fontSize: 13, fontWeight: 700,
                      color: monitorTab === t.key ? '#B8973A' : 'rgba(240,237,230,0.35)',
                      borderBottom: monitorTab === t.key ? '2px solid #B8973A' : '2px solid transparent',
                      marginBottom: -1, transition: 'all 0.15s',
                    }}>{t.label}</button>
                  ))}
                </div>
              )}

              {/* Player list */}
              {!banTarget && !clanTarget && monitorTab === 'players' && (
                <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
                  {allPlayers.map((pl, i) => (`
);

// 7. Add clans list after the player list closing tag and before ban flow
src = src.replace(
  `              {/* Ban flow */}
              {banTarget && (`,
  `              {/* Clans list */}
              {!banTarget && !clanTarget && monitorTab === 'clans' && (
                <div style={{ overflowY: 'auto', flex: 1, padding: '8px 0' }}>
                  {allClans.map((clan) => (
                    <div key={clan.id} style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '10px 24px',
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                    }}>
                      <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(184,151,58,0.12)', border: '1px solid rgba(184,151,58,0.2)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 14, color: '#B8973A', flexShrink: 0 }}>
                        {clan.image_url
                          ? <img src={clan.image_url} alt={clan.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : (clan.name || '?')[0].toUpperCase()
                        }
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ margin: 0, fontWeight: 600, fontSize: 14, color: '#F0EDE6' }}>{clan.name}</p>
                        <p style={{ margin: 0, fontSize: 11, color: 'rgba(240,237,230,0.35)' }}>{clan.member_count || 0} members</p>
                      </div>
                      <button
                        onClick={() => { setClanTarget(clan); setClanDeleteStep('reason'); setClanDeleteReason(''); setClanDeletePassword(''); setClanDeleteError(''); }}
                        style={{ background: 'rgba(255,60,60,0.08)', border: '1px solid rgba(255,60,60,0.25)', borderRadius: 8, padding: '5px 12px', color: '#ff4d4d', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                      >Delete</button>
                    </div>
                  ))}
                  {allClans.length === 0 && (
                    <p style={{ textAlign: 'center', padding: 40, color: 'rgba(240,237,230,0.3)', fontSize: 13 }}>No clans found</p>
                  )}
                </div>
              )}

              {/* Clan delete flow */}
              {clanTarget && (
                <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'rgba(255,60,60,0.06)', border: '1px solid rgba(255,60,60,0.2)', borderRadius: 12 }}>
                    <AlertTriangle size={16} style={{ color: '#ff4d4d', flexShrink: 0 }} />
                    <div>
                      <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#ff4d4d' }}>Deleting clan: {clanTarget.name}</p>
                      <p style={{ margin: 0, fontSize: 11, color: 'rgba(240,237,230,0.4)' }}>This will permanently delete the clan and remove all members.</p>
                    </div>
                  </div>

                  {clanDeleteStep === 'reason' && (
                    <>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(240,237,230,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Reason</label>
                        <textarea
                          value={clanDeleteReason}
                          onChange={e => setClanDeleteReason(e.target.value)}
                          placeholder="Enter reason for deletion..."
                          rows={3}
                          style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 12px', color: '#F0EDE6', fontSize: 13, resize: 'none', outline: 'none', boxSizing: 'border-box' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => setClanTarget(null)} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px', color: 'rgba(240,237,230,0.5)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                        <button
                          onClick={() => { if (!clanDeleteReason.trim()) { setClanDeleteError('Reason required.'); return; } setClanDeleteError(''); setClanDeleteStep('password'); }}
                          style={{ flex: 2, background: 'rgba(255,60,60,0.15)', border: '1px solid rgba(255,60,60,0.35)', borderRadius: 10, padding: '10px', color: '#ff4d4d', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                        >Confirm Delete</button>
                      </div>
                      {clanDeleteError && <p style={{ margin: 0, fontSize: 12, color: '#ff4d4d' }}>{clanDeleteError}</p>}
                    </>
                  )}

                  {clanDeleteStep === 'password' && (
                    <>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 700, color: 'rgba(240,237,230,0.5)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 8 }}>Admin Password</label>
                        <input
                          type="password"
                          value={clanDeletePassword}
                          onChange={e => { setClanDeletePassword(e.target.value); setClanDeleteError(''); }}
                          placeholder="Enter password to confirm..."
                          style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: \`1px solid \${clanDeleteError ? 'rgba(255,60,60,0.5)' : 'rgba(255,255,255,0.1)'}\`, borderRadius: 10, padding: '10px 12px', color: '#F0EDE6', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                        />
                        {clanDeleteError && <p style={{ margin: '6px 0 0', fontSize: 12, color: '#ff4d4d' }}>{clanDeleteError}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <button onClick={() => { setClanDeleteStep('reason'); setClanDeleteError(''); }} style={{ flex: 1, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px', color: 'rgba(240,237,230,0.5)', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Back</button>
                        <button
                          onClick={executeClanDelete}
                          disabled={clanDeleteLoading}
                          style={{ flex: 2, background: clanDeleteLoading ? 'rgba(255,60,60,0.05)' : 'rgba(255,60,60,0.2)', border: '1px solid rgba(255,60,60,0.4)', borderRadius: 10, padding: '10px', color: '#ff4d4d', fontWeight: 700, fontSize: 13, cursor: clanDeleteLoading ? 'not-allowed' : 'pointer' }}
                        >{clanDeleteLoading ? 'Deleting...' : 'Delete Clan'}</button>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Ban flow */}
              {banTarget && (`
);

// 8. Update close button to also reset clan state
src = src.replace(
  `onClick={() => { setShowMonitor(false); setBanTarget(null); setBanReason(''); setBanPassword(''); setBanStep('reason'); setBanError(''); }}`,
  `onClick={() => { setShowMonitor(false); setBanTarget(null); setBanReason(''); setBanPassword(''); setBanStep('reason'); setBanError(''); setClanTarget(null); setClanDeleteReason(''); setClanDeletePassword(''); setClanDeleteStep('reason'); setClanDeleteError(''); }}`
);

fs.writeFileSync('src/pages/Dashboard.jsx', src);
console.log('✓ Done');
