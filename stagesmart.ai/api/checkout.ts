import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const STANDARD_PACKAGES: Record<string, { amount: number; credits: number; name: string }> = {
  '1pack':  { amount: 500,   credits: 1,  name: '1 Photo Credit' },
  '5pack':  { amount: 2000,  credits: 5,  name: '5 Photo Credits' },
  '10pack': { amount: 3000,  credits: 10, name: '10 Photo Credits' },
  '25pack': { amount: 5000,  credits: 25, name: '25 Photo Credits' },
};

// Orchard agents get $1/credit when buying 20+
const ORCHARD_PACKAGES: Record<string, { amount: number; credits: number; name: string }> = {
  '1pack':  { amount: 500,   credits: 1,  name: '1 Photo Credit' },
  '5pack':  { amount: 2000,  credits: 5,  name: '5 Photo Credits' },
  '10pack': { amount: 3000,  credits: 10, name: '10 Photo Credits' },
  '25pack': { amount: 5000,  credits: 25, name: '25 Photo Credits' },
  '20pack': { amount: 2000,  credits: 20, name: '20 Photo Credits (Orchard Rate)' },
  '50pack': { amount: 5000,  credits: 50, name: '50 Photo Credits (Orchard Rate)' },
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

  const { packageId, email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });

  const orchard = isOrchardEmail(email);
  const packages = orchard ? ORCHARD_PACKAGES : STANDARD_PACKAGES;
  const pkg = packages[packageId];

  if (!pkg) return res.status(400).json({ error: 'Invalid package' });

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.json({ url: '/editor?success=true' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const appUrl = process.env.APP_URL || 'https://www.smartstageagent.com';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: { name: pkg.name },
          unit_amount: pkg.amount,
        },
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${appUrl}/editor?success=true&pkg=${packageId}`,
      cancel_url: `${appUrl}/editor?canceled=true`,
      metadata: {
        credits: pkg.credits.toString(),
        packageId,
        email: email.toLowerCase().trim()
      }
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}
