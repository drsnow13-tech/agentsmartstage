import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../lib/utils';

type Tab = 'dashboard' | 'users' | 'promos' | 'reports';

interface User { email: string; name: string | null; phone: string | null; credits: number; total_spent: number; total_generations: number; opted_in: boolean; created_at: string; last_active: string; }
interface Promo { id: number; code: string; credits: number; price_cents: number; max_uses: number | null; times_used: number; expires_at: string | null; created_at: string; active: boolean; }
interface Report { id: number; email: string; room_type: string; enhancement: string; issue_type: string; remedy: string; notes: string; status: string; admin_notes: string; created_at: string; }
interface Stats { totalUsers: number; activeToday: number; activeWeek: number; totalCreditsHeld: number; pendingReports: number; recentUsers: any[]; }

const API = '/api/admin';

async function api(action: string, token: string, body: any = {}) {
  const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ action, ...body }) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}

export function Admin() {
  const [token, setToken] = useState(localStorage.getItem('ssa_admin_token') || '');
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [tab, setTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [stats, setStats] = useState<Stats | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [creditAmount, setCreditAmount] = useState('');
  const [creditEmail, setCreditEmail] = useState('');
  const [promos, setPromos] = useState<Promo[]>([]);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [newPromoCredits, setNewPromoCredits] = useState('');
  const [newPromoMaxUses, setNewPromoMaxUses] = useState('');
  const [newPromoPrice, setNewPromoPrice] = useState('');
  const [reports, setReports] = useState<Report[]>([]);

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const handleLogin = async () => {
    try {
      const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'login', password }) });
      const data = await res.json();
      if (data.success) { setToken(data.token); localStorage.setItem('ssa_admin_token', data.token); setLoggedIn(true); setLoginError(''); }
      else setLoginError('Invalid password');
    } catch { setLoginError('Connection error'); }
  };

  const handleLogout = () => { setToken(''); setLoggedIn(false); localStorage.removeItem('ssa_admin_token'); };

  useEffect(() => {
    if (token) { api('stats', token).then(() => setLoggedIn(true)).catch(() => { setToken(''); localStorage.removeItem('ssa_admin_token'); }); }
  }, []);

  const loadTab = useCallback(async (t: Tab) => {
    setLoading(true);
    try {
      if (t === 'dashboard') { const d = await api('stats', token); setStats(d.stats); }
      if (t === 'users') { const d = await api('list-users', token, { search: userSearch }); setUsers(d.users); }
      if (t === 'promos') { const d = await api('list-promos', token); setPromos(d.promos); }
      if (t === 'reports') { const d = await api('list-reports', token); setReports(d.reports); }
    } catch (e: any) { showToast(`Error: ${e.message}`); }
    setLoading(false);
  }, [token, userSearch]);

  useEffect(() => { if (loggedIn) loadTab(tab); }, [loggedIn, tab]);

  const handleDbSetup = async () => { try { await api('db-setup', token); showToast('Database tables updated!'); } catch (e: any) { showToast(`Error: ${e.message}`); } };
  const handleAddCredits = async () => {
    if (!creditEmail || !creditAmount) return;
    try { const d = await api('add-credits', token, { email: creditEmail, credits: parseInt(creditAmount) }); showToast(`Added ${creditAmount} credits to ${creditEmail}. New balance: ${d.newBalance}`); setCreditAmount(''); setCreditEmail(''); loadTab('users'); }
    catch (e: any) { showToast(`Error: ${e.message}`); }
  };
  const handleCreatePromo = async () => {
    if (!newPromoCode || !newPromoCredits) return;
    try {
      await api('create-promo', token, { code: newPromoCode, credits: parseInt(newPromoCredits), maxUses: newPromoMaxUses ? parseInt(newPromoMaxUses) : null, priceCents: newPromoPrice ? Math.round(parseFloat(newPromoPrice) * 100) : 0 });
      showToast(`Promo code ${newPromoCode.toUpperCase()} created!`);
      setNewPromoCode(''); setNewPromoCredits(''); setNewPromoMaxUses(''); setNewPromoPrice(''); loadTab('promos');
    } catch (e: any) { showToast(`Error: ${e.message}`); }
  };
  const handleTogglePromo = async (code: string, active: boolean) => { try { await api('toggle-promo', token, { code, active: !active }); loadTab('promos'); } catch (e: any) { showToast(`Error: ${e.message}`); } };
  const handleUpdateReport = async (id: number, status: string) => { try { await api('update-report', token, { id, status }); showToast(`Report #${id} marked as ${status}`); loadTab('reports'); } catch (e: any) { showToast(`Error: ${e.message}`); } };
  const quickCredit = async (email: string, amount: number) => { try { const d = await api('add-credits', token, { email, credits: amount }); showToast(`+${amount} credits to ${email}. Balance: ${d.newBalance}`); loadTab('users'); } catch (e: any) { showToast(`Error: ${e.message}`); } };

  // ─── Login Screen ──────────────────────────────────────────────────
  if (!loggedIn) {
    return (
      <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif' }}>
        <div style={{ background: '#1e293b', borderRadius: 16, padding: 40, width: 360, boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}>
          <h1 style={{ color: '#f8fafc', fontSize: 24, fontWeight: 800, marginBottom: 4, textAlign: 'center' }}>StageSmart Admin</h1>
          <p style={{ color: '#94a3b8', fontSize: 14, textAlign: 'center', marginBottom: 24 }}>Back Office</p>
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleLogin()}
            placeholder="Admin password" style={{ width: '100%', padding: '12px 16px', borderRadius: 10, border: '2px solid #334155', background: '#0f172a', color: '#f8fafc', fontSize: 15, outline: 'none', marginBottom: 12, boxSizing: 'border-box' }} autoFocus />
          {loginError && <p style={{ color: '#ef4444', fontSize: 13, marginBottom: 8 }}>{loginError}</p>}
          <button onClick={handleLogin} style={{ width: '100%', padding: '12px', borderRadius: 10, background: '#f97316', color: 'white', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer' }}>Sign In</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', fontFamily: 'system-ui, sans-serif', color: '#f8fafc' }}>
      {toast && <div style={{ position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 999, background: '#22c55e', color: 'white', padding: '10px 24px', borderRadius: 10, fontWeight: 600, fontSize: 14, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>{toast}</div>}

      <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <h1 style={{ fontSize: 18, fontWeight: 800, color: '#f97316', margin: 0 }}>StageSmart Admin</h1>
          <div style={{ display: 'flex', gap: 4 }}>
            {(['dashboard', 'users', 'promos', 'reports'] as Tab[]).map(t => (
              <button key={t} onClick={() => setTab(t)} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: tab === t ? '#f97316' : 'transparent', color: tab === t ? 'white' : '#94a3b8', textTransform: 'capitalize' }}>{t}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={handleDbSetup} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>Setup DB</button>
          <button onClick={() => loadTab(tab)} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#94a3b8', fontSize: 12, cursor: 'pointer' }}>Refresh</button>
          <button onClick={handleLogout} style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid #334155', background: 'transparent', color: '#ef4444', fontSize: 12, cursor: 'pointer' }}>Sign Out</button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: 24 }}>
        {loading && <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8' }}>Loading...</div>}

        {/* ═══ Dashboard ═══ */}
        {tab === 'dashboard' && stats && !loading && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
              {[
                { label: 'Total Agents', value: stats.totalUsers, color: '#3b82f6' },
                { label: 'Active Today', value: stats.activeToday, color: '#22c55e' },
                { label: 'Active This Week', value: stats.activeWeek, color: '#f97316' },
                { label: 'Credits Held', value: stats.totalCreditsHeld, color: '#a855f7' },
                { label: 'Pending Reports', value: stats.pendingReports, color: '#ef4444' },
              ].map(s => (
                <div key={s.label} style={{ background: '#1e293b', borderRadius: 12, padding: 20, border: '1px solid #334155' }}>
                  <p style={{ color: '#94a3b8', fontSize: 13, margin: '0 0 4px' }}>{s.label}</p>
                  <p style={{ fontSize: 32, fontWeight: 800, margin: 0, color: s.color }}>{s.value}</p>
                </div>
              ))}
            </div>
            <h3 style={{ color: '#94a3b8', fontSize: 14, fontWeight: 600, marginBottom: 12 }}>RECENT SIGNUPS</h3>
            <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'hidden' }}>
              {stats.recentUsers.map((u: any) => (
                <div key={u.email} style={{ padding: '12px 16px', borderBottom: '1px solid #334155', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div><span style={{ fontWeight: 600 }}>{u.name || u.email}</span>{u.name && <span style={{ color: '#64748b', fontSize: 13, marginLeft: 8 }}>{u.email}</span>}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span style={{ color: '#f97316', fontWeight: 700 }}>{u.credits} credits</span>
                    <span style={{ color: '#64748b', fontSize: 12 }}>{new Date(u.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ Users ═══ */}
        {tab === 'users' && !loading && (
          <div>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 200, display: 'flex', gap: 8 }}>
                <input value={userSearch} onChange={e => setUserSearch(e.target.value)} onKeyDown={e => e.key === 'Enter' && loadTab('users')}
                  placeholder="Search by name or email..." style={{ flex: 1, padding: '10px 14px', borderRadius: 10, border: '2px solid #334155', background: '#0f172a', color: '#f8fafc', fontSize: 14, outline: 'none' }} />
                <button onClick={() => loadTab('users')} style={{ padding: '10px 16px', borderRadius: 10, background: '#3b82f6', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: 13 }}>Search</button>
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <input value={creditEmail} onChange={e => setCreditEmail(e.target.value)} placeholder="agent@email.com" style={{ width: 180, padding: '10px 14px', borderRadius: 10, border: '2px solid #334155', background: '#0f172a', color: '#f8fafc', fontSize: 14, outline: 'none' }} />
                <input value={creditAmount} onChange={e => setCreditAmount(e.target.value)} placeholder="Qty" type="number" style={{ width: 70, padding: '10px 14px', borderRadius: 10, border: '2px solid #334155', background: '#0f172a', color: '#f8fafc', fontSize: 14, outline: 'none' }} />
                <button onClick={handleAddCredits} style={{ padding: '10px 16px', borderRadius: 10, background: '#22c55e', color: 'white', fontWeight: 600, border: 'none', cursor: 'pointer', fontSize: 13, whiteSpace: 'nowrap' }}>+ Add</button>
              </div>
            </div>
            <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ borderBottom: '2px solid #334155' }}>
                  {['Email', 'Name', 'Credits', 'Last Active', 'Joined', 'Actions'].map(h => (<th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{h}</th>))}
                </tr></thead>
                <tbody>{users.map(u => (
                  <tr key={u.email} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '10px 14px' }}>{u.email}</td>
                    <td style={{ padding: '10px 14px', color: u.name ? '#f8fafc' : '#475569' }}>{u.name || '—'}</td>
                    <td style={{ padding: '10px 14px' }}><span style={{ color: '#f97316', fontWeight: 700 }}>{u.credits}</span></td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{u.last_active ? new Date(u.last_active).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#94a3b8' }}>{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button onClick={() => quickCredit(u.email, 1)} style={{ padding: '4px 8px', borderRadius: 6, background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>+1</button>
                        <button onClick={() => quickCredit(u.email, 5)} style={{ padding: '4px 8px', borderRadius: 6, background: '#3b82f622', color: '#3b82f6', border: '1px solid #3b82f644', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>+5</button>
                        <button onClick={() => quickCredit(u.email, 20)} style={{ padding: '4px 8px', borderRadius: 6, background: '#a855f722', color: '#a855f7', border: '1px solid #a855f744', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>+20</button>
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
              {users.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No agents found</div>}
            </div>
            <p style={{ color: '#64748b', fontSize: 12, marginTop: 8 }}>{users.length} agent{users.length !== 1 ? 's' : ''}</p>
          </div>
        )}

        {/* ═══ Promos ═══ */}
        {tab === 'promos' && !loading && (
          <div>
            <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', padding: 20, marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 4px', fontSize: 16, fontWeight: 700 }}>Create Promo Code</h3>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: '#94a3b8' }}>Leave price blank for free codes. Set price for paid deals (e.g. LAUNCH20 = 20 credits for $20).</p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input value={newPromoCode} onChange={e => setNewPromoCode(e.target.value)} placeholder="Code (e.g. LAUNCH20)"
                  style={{ flex: 1, minWidth: 140, padding: '10px 14px', borderRadius: 10, border: '2px solid #334155', background: '#0f172a', color: '#f8fafc', fontSize: 14, outline: 'none', textTransform: 'uppercase' }} />
                <input value={newPromoCredits} onChange={e => setNewPromoCredits(e.target.value)} placeholder="Credits" type="number"
                  style={{ width: 80, padding: '10px 14px', borderRadius: 10, border: '2px solid #334155', background: '#0f172a', color: '#f8fafc', fontSize: 14, outline: 'none' }} />
                <input value={newPromoPrice} onChange={e => setNewPromoPrice(e.target.value)} placeholder="Price $ (0=free)" type="number" step="0.01"
                  style={{ width: 120, padding: '10px 14px', borderRadius: 10, border: '2px solid #334155', background: '#0f172a', color: '#f8fafc', fontSize: 14, outline: 'none' }} />
                <input value={newPromoMaxUses} onChange={e => setNewPromoMaxUses(e.target.value)} placeholder="Max uses (∞)" type="number"
                  style={{ width: 110, padding: '10px 14px', borderRadius: 10, border: '2px solid #334155', background: '#0f172a', color: '#f8fafc', fontSize: 14, outline: 'none' }} />
                <button onClick={handleCreatePromo} style={{ padding: '10px 20px', borderRadius: 10, background: '#f97316', color: 'white', fontWeight: 700, border: 'none', cursor: 'pointer', fontSize: 14 }}>Create</button>
              </div>
            </div>
            <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ borderBottom: '2px solid #334155' }}>
                  {['Code', 'Credits', 'Price', 'Used / Max', 'Type', 'Status', 'Actions'].map(h => (<th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{h}</th>))}
                </tr></thead>
                <tbody>{promos.map(p => (
                  <tr key={p.code} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 700, fontFamily: 'monospace', fontSize: 14, color: '#f97316' }}>{p.code}</td>
                    <td style={{ padding: '10px 14px' }}>{p.credits}</td>
                    <td style={{ padding: '10px 14px', color: p.price_cents > 0 ? '#22c55e' : '#94a3b8' }}>{p.price_cents > 0 ? `$${(p.price_cents / 100).toFixed(2)}` : 'Free'}</td>
                    <td style={{ padding: '10px 14px' }}>{p.times_used} / {p.max_uses || '∞'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: p.price_cents > 0 ? '#3b82f622' : '#22c55e22', color: p.price_cents > 0 ? '#3b82f6' : '#22c55e' }}>{p.price_cents > 0 ? 'Paid Deal' : 'Free Credits'}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: p.active ? '#22c55e22' : '#ef444422', color: p.active ? '#22c55e' : '#ef4444' }}>{p.active ? 'Active' : 'Disabled'}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => handleTogglePromo(p.code, p.active)} style={{ padding: '4px 10px', borderRadius: 6, background: p.active ? '#ef444422' : '#22c55e22', color: p.active ? '#ef4444' : '#22c55e', border: `1px solid ${p.active ? '#ef444444' : '#22c55e44'}`, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>{p.active ? 'Disable' : 'Enable'}</button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
              {promos.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No promo codes yet</div>}
            </div>
          </div>
        )}

        {/* ═══ Reports ═══ */}
        {tab === 'reports' && !loading && (
          <div>
            <div style={{ background: '#1e293b', borderRadius: 12, border: '1px solid #334155', overflow: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead><tr style={{ borderBottom: '2px solid #334155' }}>
                  {['#', 'Agent', 'Issue', 'Remedy', 'Status', 'Date', 'Actions'].map(h => (<th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#94a3b8', fontWeight: 600, fontSize: 12, textTransform: 'uppercase' }}>{h}</th>))}
                </tr></thead>
                <tbody>{reports.map(r => (
                  <tr key={r.id} style={{ borderBottom: '1px solid #1e293b' }}>
                    <td style={{ padding: '10px 14px', color: '#64748b' }}>#{r.id}</td>
                    <td style={{ padding: '10px 14px' }}>{r.email}</td>
                    <td style={{ padding: '10px 14px', color: '#ef4444', fontWeight: 600, fontSize: 12 }}>{r.issue_type || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#3b82f6', fontSize: 12 }}>{r.remedy || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: r.status === 'pending' ? '#f9731622' : r.status === 'resolved' ? '#22c55e22' : '#3b82f622', color: r.status === 'pending' ? '#f97316' : r.status === 'resolved' ? '#22c55e' : '#3b82f6' }}>{r.status}</span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#64748b', fontSize: 12 }}>{new Date(r.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {r.status === 'pending' && <><button onClick={() => handleUpdateReport(r.id, 'in-progress')} style={{ padding: '4px 8px', borderRadius: 6, background: '#3b82f622', color: '#3b82f6', border: '1px solid #3b82f644', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Working</button><button onClick={() => handleUpdateReport(r.id, 'resolved')} style={{ padding: '4px 8px', borderRadius: 6, background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Resolve</button></>}
                        {r.status === 'in-progress' && <button onClick={() => handleUpdateReport(r.id, 'resolved')} style={{ padding: '4px 8px', borderRadius: 6, background: '#22c55e22', color: '#22c55e', border: '1px solid #22c55e44', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Resolve</button>}
                        <button onClick={() => quickCredit(r.email, 1)} style={{ padding: '4px 8px', borderRadius: 6, background: '#f9731622', color: '#f97316', border: '1px solid #f9731644', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>+1 Credit</button>
                      </div>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
              {reports.length === 0 && <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>No reports yet</div>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
