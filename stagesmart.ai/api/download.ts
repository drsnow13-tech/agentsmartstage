import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getGeneration, markDownloaded, deductCredit } from './_db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { generationId, email } = req.body;
  if (!generationId || !email) return res.status(400).json({ error: 'generationId and email required' });

  const gen = await getGeneration(generationId);
  if (!gen) return res.status(404).json({ error: 'Generation expired or not found. Photos are purged after 24 hours.' });
  if (gen.email !== email.toLowerCase()) return res.status(403).json({ error: 'Not authorized' });

  // Deduct credit
  const success = await deductCredit(email);
  if (!success) return res.status(402).json({ error: 'No credits remaining', needsPurchase: true });

  await markDownloaded(generationId);

  res.json({
    success: true,
    cleanImage: gen.clean_image,
    message: 'Photo available for 24 hours from generation time.'
  });
}
