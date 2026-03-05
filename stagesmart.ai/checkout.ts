import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

interface Package {
  id: string;
  credits: number;
  price: number;
  label: string;
}

const STANDARD_PACKAGES: Package[] = [
  { id: '1pack', credits: 1, price: 500, label: '1 Credit — $5' },
  { id: '5pack', credits: 5, price: 2000, label: '5 Credits — $20' },
  { id: '10pack', credits: 10, price: 3000, label: '10 Credits — $30' },
  { id: '25pack', credits: 25, price: 5000, label: '25 Credits — $50' },
];

const ORCHARD_PACKAGES: Package[] = [
  { id: 'orchard20', credits: 20, price: 2000, label: '20 Credits — $20 ($1/credit)' },
  { id: 'orchard50', credits: 50, price: 5000, label: '50 Credits — $50 ($1/credit)' },
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { packageId, email } = req.body;
  if (!packageId || !email) return res.status(400).json({ error: 'Package and email required' });

  const normalizedEmail = email.toLowerCase().trim();
  const isOrchard = normalizedEmail.endsWith('@orchard.com');

  // Orchard agents can also buy standard packages
  const allPackages = [...STANDARD_PACKAGES, ...(isOrchard ? ORCHARD_PACKAGES : [])];
  const pkg = allPackages.find((p) => p.id === packageId);

  if (!pkg) return res.status(400).json({ error: 'Invalid package' });

  const appUrl = process.env.APP_URL || 'https://www.smartstageagent.com';

  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: normalizedEmail,      // Pre-fills Stripe email field
      metadata: {
        email: normalizedEmail,             // CRITICAL: webhook reads this
        credits: pkg.credits.toString(),    // CRITICAL: webhook reads this
        packageId: pkg.id,
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: pkg.price,
            product_data: {
              name: `StageSmart.ai — ${pkg.label}`,
            },
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${appUrl}/editor?success=true&pkg=${pkg.id}`,
      cancel_url: `${appUrl}/editor?canceled=true`,
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error('checkout.ts error:', err);
    return res.status(500).json({ error: 'Checkout session failed' });
  }
}
