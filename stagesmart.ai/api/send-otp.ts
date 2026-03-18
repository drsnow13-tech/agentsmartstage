import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email } = req.body;
  if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email required' });

  const code = generateOTP();
  const emailLower = email.toLowerCase().trim();

  try {
    const sql = neon(process.env.DATABASE_URL!);
    await sql`UPDATE otp_codes SET used = TRUE WHERE email = ${emailLower} AND used = FALSE`;
    await sql`INSERT INTO otp_codes (email, code, expires_at) VALUES (${emailLower}, ${code}, NOW() + INTERVAL '10 minutes')`;
    await sql`INSERT INTO users (email, credits) VALUES (${emailLower}, 0) ON CONFLICT (email) DO NOTHING`;

    const resendKey = process.env.RESEND_API_KEY;

    // Dev fallback — no key present
    if (!resendKey) {
      console.log('DEV OTP for ' + emailLower + ': ' + code);
      return res.json({ sent: true });
    }

    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;">
        <h2 style="color:#1E3A8A;">Your verification code</h2>
        <p style="color:#64748b;">Enter this code to access your SmartStageAgent credits. Expires in 10 minutes.</p>
        <div style="background:#f1f5f9;border-radius:12px;padding:24px;text-align:center;margin:24px 0;">
          <span style="font-size:40px;font-weight:900;letter-spacing:12px;color:#1E3A8A;">${code}</span>
        </div>
        <p style="color:#94a3b8;font-size:12px;">If you did not request this, ignore this email.</p>
      </div>
    `;

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + resendKey,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'SmartStageAgent <noreply@smartstageagent.com>',
        to: email,
        subject: 'Your SmartStageAgent code: ' + code,
        html
      })
    });

    // Actually check if Resend accepted the request
    if (!resendRes.ok) {
      const resendError = await resendRes.json();
      console.error('Resend rejected email send:', resendError);
      return res.status(500).json({ error: 'Failed to send verification code' });
    }

    return res.json({ sent: true });

  } catch (error) {
    console.error('Send OTP error:', error);
    return res.status(500).json({ error: 'Failed to send verification code' });
  }
}
