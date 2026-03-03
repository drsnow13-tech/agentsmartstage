import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.query;
  if (!email || typeof email !== 'string') return res.status(400).json({ error: 'Email required' });

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`SELECT credits FROM users WHERE email = ${email.toLowerCase().trim()}`;
    const credits = rows.length > 0 ? rows[0].credits : 0;
    res.json({ email: email.toLowerCase(), credits });
  } catch (error) {
    console.error('User lookup error:', error);
    res.status(500).json({ error: 'Failed to look up user', credits: 0 });
  }
}
