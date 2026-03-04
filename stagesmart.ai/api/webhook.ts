import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';

export const config = { api: { bodyParser: false } };

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).end();

  const stripeKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  console.log('Webhook received. Stripe key present:', !!stripeKey, 'Webhook secret present:', !!webhookSecret);

  if (!stripeKey || !webhookSecret) {
    console.error('Missing Stripe config');
    return res.status(400).json({ error: 'Stripe not configured' });
  }

  const stripe = new Stripe(stripeKey);
  const rawBody = await getRawBody(req);
  const sig = req.headers['stripe-signature'] as string;

  console.log('Stripe signature present:', !!sig);

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
    console.log('Event type:', event.type);
  } catch (err: any) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send('Webhook Error: ' + err.message);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const credits = parseInt(session.metadata?.credits || '0', 10);
    const email = session.customer_email || session.metadata?.email;

    console.log('Checkout complete. Email:', email, 'Credits:', credits);
    console.log('Session metadata:', JSON.stringify(session.metadata));
    console.log('Customer email:', session.customer_email);

    if (!email) {
      console.error('No email found in session. customer_email:', session.customer_email, 'metadata:', session.metadata);
      return res.json({ received: true, warning: 'No email found' });
    }

    if (credits < 1) {
      console.error('No credits in metadata:', session.metadata);
      return res.json({ received: true, warning: 'No credits in metadata' });
    }

    try {
      const sql = neon(process.env.DATABASE_URL!);
      await sql`
        INSERT INTO users (email, credits) VALUES (${email.toLowerCase()}, ${credits})
        ON CONFLICT (email) DO UPDATE SET credits = users.credits + ${credits}
      `;
      console.log('SUCCESS: Added ' + credits + ' credits to ' + email);
    } catch (err) {
      console.error('DB error adding credits:', err);
      return res.status(500).json({ error: 'DB error' });
    }
  }

  res.json({ received: true });
}
