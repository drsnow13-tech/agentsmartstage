import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { code, email } = req.body;
  if (!code || !email) return res.status(400).json({ error: 'Code and email required' });

  const codeUpper = code.toUpperCase().trim();
  const emailLower = email.toLowerCase().trim();
  const sql = neon(process.env.DATABASE_URL!);

  try {
    const promos = await sql`SELECT * FROM promo_codes WHERE code = ${codeUpper} AND active = true`;
    if (promos.length === 0) return res.status(404).json({ error: 'Invalid or expired promo code' });

    const promo = promos[0];

    // If it's a paid promo, tell the frontend to use checkout instead
    if (promo.price_cents && promo.price_cents > 0) {
      return res.status(402).json({
        error: 'paid',
        message: `${promo.credits} credits for $${(promo.price_cents / 100).toFixed(2)}`,
        credits: promo.credits,
        priceCents: promo.price_cents,
        code: promo.code,
      });
    }

    if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
      return res.status(410).json({ error: 'This promo code has expired' });
    }
    if (promo.max_uses && promo.times_used >= promo.max_uses) {
      return res.status(410).json({ error: 'This promo code has reached its limit' });
    }
    const existing = await sql`SELECT * FROM promo_redemptions WHERE code = ${codeUpper} AND email = ${emailLower}`;
    if (existing.length > 0) {
      return res.status(409).json({ error: 'You have already used this promo code' });
    }

    const result = await sql`
      INSERT INTO users (email, credits) VALUES (${emailLower}, ${promo.credits})
      ON CONFLICT (email) DO UPDATE SET credits = users.credits + ${promo.credits}
      RETURNING credits`;

    await sql`INSERT INTO promo_redemptions (code, email, credits_granted) VALUES (${codeUpper}, ${emailLower}, ${promo.credits})`;
    await sql`UPDATE promo_codes SET times_used = times_used + 1 WHERE code = ${codeUpper}`;

    return res.json({ success: true, credits: result[0].credits, creditsAdded: promo.credits, message: `${promo.credits} credits added to your account!` });
  } catch (error: any) {
    console.error('Promo redemption error:', error);
    return res.status(500).json({ error: 'Failed to redeem code' });
  }
}
