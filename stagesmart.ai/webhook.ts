import type { VercelRequest, VercelResponse } from '@vercel/node';
import Stripe from 'stripe';
import { neon } from '@neondatabase/serverless';

// CRITICAL: Disable Vercel's default body parser — Stripe needs raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });

async function getRawBody(req: VercelRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const sig = req.headers['stripe-signature'];
  if (!sig) {
    console.error('Webhook: Missing stripe-signature header');
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await getRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  console.log(`Webhook received: ${event.type}`);

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;

    // Read email from metadata first, fall back to customer_email
    const email = session.metadata?.email || session.customer_email;
    const credits = parseInt(session.metadata?.credits || '0', 10);

    console.log('Webhook session data:', {
      metadata: session.metadata,
      customer_email: session.customer_email,
      email,
      credits,
    });

    if (!email || credits <= 0) {
      console.error('Webhook: Missing email or credits in session', {
        metadata: session.metadata,
        customer_email: session.customer_email,
      });
      return res.status(400).json({ error: 'Missing email or credits' });
    }

    const normalizedEmail = email.toLowerCase().trim();

    try {
      const sql = neon(process.env.DATABASE_URL!);

      // Upsert user and add credits atomically
      const result = await sql`
        INSERT INTO users (email, credits) VALUES (${normalizedEmail}, ${credits})
        ON CONFLICT (email) DO UPDATE SET credits = users.credits + ${credits}
        RETURNING credits
      `;

      console.log(`Webhook: Added ${credits} credits to ${normalizedEmail}. New total: ${result[0]?.credits}`);
    } catch (dbErr) {
      console.error('Webhook DB error:', dbErr);
      return res.status(500).json({ error: 'Database error adding credits' });
    }
  }

  // Always return 200 to acknowledge receipt
  return res.json({ received: true });
}
