import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const PACKAGES: Record<string, { amount: number; credits: number; name: string }> = {
  '1pack':  { amount: 500,   credits: 1,  name: '1 Photo Staging' },
  '5pack':  { amount: 2500,  credits: 5,  name: '5-Pack Staging' },
  '10pack': { amount: 4000,  credits: 10, name: '10-Pack Credits' },
  '50pack': { amount: 15000, credits: 50, name: '50-Pack Credits' },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { packageId } = req.body;
  const pkg = PACKAGES[packageId];

  if (!pkg) return res.status(400).json({ error: 'Invalid package' });

  // No Stripe key = dev mode, just add credits via cookie
  if (!process.env.STRIPE_SECRET_KEY) {
    const current = parseInt(req.cookies?.ss_credits ?? '0', 10);
    const newCredits = current + pkg.credits;
    res.setHeader('Set-Cookie', `ss_credits=${newCredits}; Path=/; Max-Age=2592000; SameSite=Lax`);
    return res.json({ url: '/dashboard?success=true' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const appUrl = process.env.APP_URL || 'https://agentsmartstage.vercel.app';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: pkg.name },
          unit_amount: pkg.amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${appUrl}/dashboard?success=true&pkg=${packageId}`,
      cancel_url: `${appUrl}/editor?canceled=true`,
      metadata: { credits: pkg.credits.toString(), packageId }
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
