import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const emailLower = email.toLowerCase().trim();

  try {
    const sql = neon(process.env.DATABASE_URL!);

    // Check credits first
    const rows = await sql`SELECT credits FROM users WHERE email = ${emailLower}`;
    const credits = rows.length > 0 ? rows[0].credits : 0;

    if (credits < 1) {
      return res.status(402).json({ success: false, error: 'Insufficient credits', credits: 0 });
    }

    // Deduct atomically
    const updated = await sql`
      UPDATE users SET credits = credits - 1
      WHERE email = ${emailLower} AND credits > 0
      RETURNING credits
    `;

    const newCredits = updated.length > 0 ? updated[0].credits : 0;
    res.json({ success: true, credits: newCredits });
  } catch (error) {
    console.error('Deduct credit error:', error);
    res.status(500).json({ success: false, error: 'Failed to deduct credit' });
  }
}
