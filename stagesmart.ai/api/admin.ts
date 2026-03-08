import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

function checkAuth(req: VercelRequest): boolean {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return false;
  return authHeader.slice(7) === process.env.ADMIN_PASSWORD;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { action } = req.body;

  if (action === 'login') {
    const { password } = req.body;
    if (password === process.env.ADMIN_PASSWORD) return res.json({ success: true, token: password });
    return res.status(401).json({ error: 'Invalid password' });
  }

  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  const sql = neon(process.env.DATABASE_URL!);

  try {
    if (action === 'db-setup') {
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW()`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_active TIMESTAMPTZ DEFAULT NOW()`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS total_spent INTEGER DEFAULT 0`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS total_generations INTEGER DEFAULT 0`;
      await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS opted_in BOOLEAN DEFAULT false`;

      await sql`CREATE TABLE IF NOT EXISTS promo_codes (
        id SERIAL PRIMARY KEY,
        code TEXT UNIQUE NOT NULL,
        credits INTEGER NOT NULL,
        max_uses INTEGER DEFAULT NULL,
        times_used INTEGER DEFAULT 0,
        expires_at TIMESTAMPTZ DEFAULT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        active BOOLEAN DEFAULT true
      )`;

      await sql`CREATE TABLE IF NOT EXISTS promo_redemptions (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL,
        email TEXT NOT NULL,
        credits_granted INTEGER NOT NULL,
        redeemed_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(code, email)
      )`;

      await sql`CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL,
        room_type TEXT,
        enhancement TEXT,
        issue_type TEXT,
        remedy TEXT,
        notes TEXT,
        status TEXT DEFAULT 'pending',
        admin_notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )`;

      return res.json({ success: true, message: 'Database setup complete' });
    }

    if (action === 'list-users') {
      const { search } = req.body;
      let query;
      if (search) {
        const term = `%${search}%`;
        query = await sql`SELECT email, name, phone, credits, total_spent, total_generations, opted_in, created_at, last_active FROM users WHERE email ILIKE ${term} OR name ILIKE ${term} ORDER BY last_active DESC NULLS LAST LIMIT 200`;
      } else {
        query = await sql`SELECT email, name, phone, credits, total_spent, total_generations, opted_in, created_at, last_active FROM users ORDER BY last_active DESC NULLS LAST LIMIT 200`;
      }
      return res.json({ success: true, users: query });
    }

    if (action === 'get-user') {
      const { email } = req.body;
      const rows = await sql`SELECT * FROM users WHERE email = ${email.toLowerCase().trim()}`;
      if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
      return res.json({ success: true, user: rows[0] });
    }

    if (action === 'add-credits') {
      const { email, credits } = req.body;
      if (!email || !credits) return res.status(400).json({ error: 'Email and credits required' });
      const emailLower = email.toLowerCase().trim();
      const result = await sql`INSERT INTO users (email, credits) VALUES (${emailLower}, ${credits}) ON CONFLICT (email) DO UPDATE SET credits = users.credits + ${credits} RETURNING credits`;
      return res.json({ success: true, newBalance: result[0].credits, email: emailLower });
    }

    if (action === 'update-user') {
      const { email, name, phone, opted_in } = req.body;
      if (!email) return res.status(400).json({ error: 'Email required' });
      const emailLower = email.toLowerCase().trim();
      await sql`UPDATE users SET name = COALESCE(${name || null}, name), phone = COALESCE(${phone || null}, phone), opted_in = COALESCE(${opted_in ?? null}, opted_in) WHERE email = ${emailLower}`;
      return res.json({ success: true });
    }

    if (action === 'create-promo') {
      const { code, credits, maxUses, expiresAt } = req.body;
      if (!code || !credits) return res.status(400).json({ error: 'Code and credits required' });
      await sql`INSERT INTO promo_codes (code, credits, max_uses, expires_at) VALUES (${code.toUpperCase().trim()}, ${credits}, ${maxUses || null}, ${expiresAt || null})`;
      return res.json({ success: true });
    }

    if (action === 'list-promos') {
      const promos = await sql`SELECT * FROM promo_codes ORDER BY created_at DESC`;
      return res.json({ success: true, promos });
    }

    if (action === 'toggle-promo') {
      const { code, active } = req.body;
      await sql`UPDATE promo_codes SET active = ${active} WHERE code = ${code}`;
      return res.json({ success: true });
    }

    if (action === 'list-reports') {
      const reports = await sql`SELECT * FROM reports ORDER BY created_at DESC LIMIT 100`;
      return res.json({ success: true, reports });
    }

    if (action === 'update-report') {
      const { id, status, admin_notes } = req.body;
      await sql`UPDATE reports SET status = ${status}, admin_notes = ${admin_notes || null} WHERE id = ${id}`;
      return res.json({ success: true });
    }

    if (action === 'stats') {
      const totalUsers = await sql`SELECT COUNT(*) as count FROM users`;
      const activeToday = await sql`SELECT COUNT(*) as count FROM users WHERE last_active > NOW() - INTERVAL '24 hours'`;
      const activeWeek = await sql`SELECT COUNT(*) as count FROM users WHERE last_active > NOW() - INTERVAL '7 days'`;
      const totalCredits = await sql`SELECT SUM(credits) as total FROM users`;
      const pendingReports = await sql`SELECT COUNT(*) as count FROM reports WHERE status = 'pending'`;
      const recentUsers = await sql`SELECT email, name, credits, created_at FROM users ORDER BY created_at DESC LIMIT 5`;
      return res.json({ success: true, stats: { totalUsers: totalUsers[0].count, activeToday: activeToday[0].count, activeWeek: activeWeek[0].count, totalCreditsHeld: totalCredits[0].total || 0, pendingReports: pendingReports[0].count, recentUsers } });
    }

    return res.status(400).json({ error: `Unknown action: ${action}` });
  } catch (error: any) {
    console.error('Admin API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
