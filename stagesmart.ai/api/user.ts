import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCredits } from './_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const email = req.query.email as string;
  if (!email) return res.json({ credits: 0 });

  try {
    const credits = await getCredits(email);
    res.json({ email, credits });
  } catch {
    res.json({ credits: 0 });
  }
}
