import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';

const STANDARD_PACKAGES: Record<string, { amount: number; credits: number; name: string }> = {
  '1pack':  { amount: 500,   credits: 1,  name: '1 Photo Credit' },
  '5pack':  { amount: 2000,  credits: 5,  name: '5 Photo Credits' },
  '10pack': { amount: 3000,  credits: 10, name: '10 Photo Credits' },
  '25pack': { amount: 5000,  credits: 25, name: '25 Photo Credits' },
};

const ORCHARD_PACKAGES: Record<string, { amount: number; credits: number; name: string }> = {
  '1pack':  { amount: 500,   credits: 1,  name: '1 Photo Credit' },
  '5pack':  { amount: 2000,  credits: 5,  name: '5 Photo Credits' },
  'orchard20': { amount: 2000,  credits: 20, name: '20 Photo Credits (Orchard Rate)' },
  'orchard50': { amount: 5000,  credits: 50, name: '50 Photo Credits (Orchard Rate)' },
};

// Promo code pricing — keyed by promo code, each has its own package list
const PROMO_PACKAGES: Record<string, Record<string, { amount: number; credits: number; name: string }>> = {
  'LAUNCH20': {
    '1pack':     { amount: 500,   credits: 1,  name: '1 Photo Credit' },
    '5pack':     { amount: 2000,  credits: 5,  name: '5 Photo Credits' },
    'promo20':   { amount: 2000,  credits: 20, name: '20 Photo Credits (Launch Deal)' },
    'promo50':   { amount: 5000,  credits: 50, name: '50 Photo Credits (Launch Deal)' },
  },
  'HARES2026': {
    '1pack':     { amount: 500,   credits: 1,  name: '1 Photo Credit' },
    '5pack':     { amount: 2000,  credits: 5,  name: '5 Photo Credits' },
    'promo20':   { amount: 2000,  credits: 20, name: '20 Photo Credits (Special)' },
    'promo50':   { amount: 5000,  credits: 50, name: '50 Photo Credits (Special)' },
  },
};

function isOrchardEmail(email: string): boolean {
  return email.toLowerCase().trim().endsWith('@orchard.com');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { packageId, email, promoCode, addOnCredits } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const emailLower = email.toLowerCase().trim();
  const orchard = isOrchardEmail(emailLower);

  // Determine which package list to use
  let packages = STANDARD_PACKAGES;
  let appliedPromo: string | null = null;

  if (orchard) {
    packages = ORCHARD_PACKAGES;
  } else if (promoCode) {
    const code = promoCode.toUpperCase().trim();
    // Check promo code in database
    try {
      const sql = neon(process.env.DATABASE_URL!);
      const promos = await sql`SELECT * FROM promo_codes WHERE code = ${code} AND active = true`;
      if (promos.length > 0) {
        const promo = promos[0];
        const valid = (!promo.expires_at || new Date(promo.expires_at) > new Date()) &&
                      (!promo.max_uses || promo.times_used < promo.max_uses);
        if (valid && PROMO_PACKAGES[code]) {
          // Check if this user already used this discount code
          const existing = await sql`SELECT * FROM promo_redemptions WHERE code = ${code} AND email = ${emailLower}`;
          if (existing.length > 0) {
            return res.status(409).json({ error: 'You have already used this promo code' });
          }
          packages = PROMO_PACKAGES[code];
          appliedPromo = code;
        }
      }
    } catch (e) {
      console.error('Promo lookup error:', e);
    }
  }

  const pkg = packages[packageId];
  if (!pkg) return res.status(400).json({ error: 'Invalid package' });

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.json({ url: '/editor?success=true' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const appUrl = process.env.APP_URL || 'https://www.smartstageagent.com';

    // Validate add-on credits: max is same as pack size
    const validAddOn = addOnCredits ? Math.min(Math.max(0, Math.floor(addOnCredits)), pkg.credits) : 0;
    const totalCredits = pkg.credits + validAddOn;

    const line_items: any[] = [{
      price_data: {
        currency: 'usd',
        product_data: { name: pkg.name },
        unit_amount: pkg.amount,
      },
      quantity: 1,
    }];

    if (validAddOn > 0) {
      line_items.push({
        price_data: {
          currency: 'usd',
          product_data: { name: `${validAddOn} Bonus Credits ($1 each)` },
          unit_amount: 100, // $1 per credit
        },
        quantity: validAddOn,
      });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: emailLower,
      line_items,
      mode: 'payment',
      success_url: `${appUrl}/editor?success=true&pkg=${packageId}`,
      cancel_url: `${appUrl}/editor?canceled=true`,
      metadata: {
        credits: totalCredits.toString(),
        packageId,
        email: emailLower,
        promoCode: appliedPromo || '',
        addOnCredits: validAddOn.toString(),
      }
    });

    res.json({ url: session.url });

    // Record promo usage so one-per-user check works
    if (appliedPromo) {
      try {
        const sql2 = neon(process.env.DATABASE_URL!);
        await sql2`INSERT INTO promo_redemptions (code, email, credits_granted) VALUES (${appliedPromo}, ${emailLower}, ${totalCredits}) ON CONFLICT (code, email) DO NOTHING`;
        await sql2`UPDATE promo_codes SET times_used = times_used + 1 WHERE code = ${appliedPromo}`;
      } catch (e) { console.error('Promo recording error:', e); }
    }
  } catch (error: any) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
