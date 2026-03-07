import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, roomType, enhancementId, enhancementLabel, tileIndex, issueType, remedyRequested, notes } = req.body;
    if (!email) return res.status(400).json({ error: 'Email required' });

    if (!process.env.RESEND_API_KEY) {
      console.error('RESEND_API_KEY is not set');
      return res.status(500).json({ error: 'Email service not configured' });
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    // Send report to admin
    const adminResult = await resend.emails.send({
      from: 'StageSmart.ai <noreply@smartstageagent.com>',
      to: 'support@smartstageagent.com',
      replyTo: email,
      subject: `Bad Result: ${issueType || 'Unknown'} — ${roomType || 'Unknown'} / ${enhancementLabel || enhancementId || 'Unknown'}`,
      html: `<div style="font-family:sans-serif;">
        <h2 style="color:#dc2626;">Bad Result Report</h2>
        <p><strong>Agent:</strong> ${email}</p>
        <p><strong>Issue:</strong> ${issueType || 'Not specified'}</p>
        <p><strong>Remedy:</strong> ${remedyRequested || 'Not specified'}</p>
        <p><strong>Room:</strong> ${roomType || 'Unknown'}</p>
        <p><strong>Enhancement:</strong> ${enhancementLabel || enhancementId || 'Unknown'}</p>
        <p><strong>Version:</strong> ${(tileIndex ?? 0) + 1}</p>
        ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
      </div>`,
    });
    console.log('Admin email result:', JSON.stringify(adminResult));

    // Send confirmation to agent
    const agentResult = await resend.emails.send({
      from: 'StageSmart.ai <noreply@smartstageagent.com>',
      to: email,
      subject: "We received your report — we'll make it right",
      html: `<div style="font-family:sans-serif;max-width:420px;margin:0 auto;">
        <h2 style="color:#1E3A8A;text-align:center;">StageSmart.ai</h2>
        <p>We received your report about a <strong>${roomType || ''} ${enhancementLabel || 'enhancement'}</strong> result.</p>
        <p><strong>Issue:</strong> ${issueType || 'Bad result'}</p>
        <p><strong>Your request:</strong> ${remedyRequested || 'Review needed'}</p>
        <p>We will review and make it right within 24 hours.</p>
      </div>`,
    });
    console.log('Agent email result:', JSON.stringify(agentResult));

    return res.json({ success: true });
  } catch (err: any) {
    console.error('Report error:', err?.message || err);
    return res.status(500).json({ error: err?.message || 'Failed to send report' });
  }
}
