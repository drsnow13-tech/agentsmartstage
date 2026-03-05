import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const normalizedEmail = email.toLowerCase().trim();

  try {
    const sql = neon(process.env.DATABASE_URL!);

    // Atomic deduct: only succeeds if credits > 0
    const rows = await sql`
      UPDATE users
      SET credits = credits - 1
      WHERE email = ${normalizedEmail} AND credits > 0
      RETURNING credits
    `;

    if (rows.length === 0) {
      return res.status(402).json({ success: false, error: 'No credits available' });
    }

    return res.json({ success: true, credits: rows[0].credits });
  } catch (err) {
    console.error('deduct-credit error:', err);
    return res.status(500).json({ error: 'Deduction failed' });
  }
}
