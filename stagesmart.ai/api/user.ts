import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (req.method === 'OPTIONS') return res.status(200).end();
  const email = req.query.email as string;
  if (!email) return res.json({ credits: 0 });
  try {
    const sql = neon(process.env.DATABASE_URL!);
    const r = await sql`SELECT credits FROM users WHERE email = ${email.toLowerCase()}`;
    res.json({ email, credits: (r[0] as any)?.credits ?? 0 });
  } catch {
    res.json({ credits: 0 });
  }
}
