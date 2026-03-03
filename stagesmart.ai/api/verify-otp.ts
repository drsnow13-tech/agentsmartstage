import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, code } = req.body;
  if (!email || !code) return res.status(400).json({ error: 'Email and code required' });

  const emailLower = email.toLowerCase().trim();

  try {
    const sql = neon(process.env.DATABASE_URL!);
    const rows = await sql`
      SELECT id FROM otp_codes
      WHERE email = ${emailLower} AND code = ${code.trim()} AND used = FALSE AND expires_at > NOW()
      ORDER BY created_at DESC LIMIT 1
    `;

    if (rows.length === 0) return res.status(401).json({ error: 'Invalid or expired code. Please try again.' });

    await sql`UPDATE otp_codes SET used = TRUE WHERE id = ${rows[0].id}`;

    const users = await sql`SELECT credits FROM users WHERE email = ${emailLower}`;
    const credits = users.length > 0 ? users[0].credits : 0;

    res.json({ verified: true, email: emailLower, credits });
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ error: 'Verification failed. Please try again.' });
  }
}
