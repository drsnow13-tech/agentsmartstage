import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

// Increase body size limit for base64 images
export const config = {
  api: {
    bodyParser: {
      sizeLimit: '12mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const {
    email,
    roomType,
    enhancementId,
    enhancementLabel,
    tileIndex,
    issueType,
    remedyRequested,
    notes,
    originalImage,
    resultImage,
  } = req.body;

  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Build attachments from base64 images
    const attachments: { filename: string; content: Buffer }[] = [];

    if (originalImage) {
      const base64Data = originalImage.replace(/^data:image\/\w+;base64,/, '');
      attachments.push({
        filename: 'original-photo.jpg',
        content: Buffer.from(base64Data, 'base64'),
      });
    }

    if (resultImage) {
      const base64Data = resultImage.replace(/^data:image\/\w+;base64,/, '');
      attachments.push({
        filename: `result-v${(tileIndex ?? 0) + 1}.jpg`,
        content: Buffer.from(base64Data, 'base64'),
      });
    }

    // Email to Darren with full context and photos attached
    await resend.emails.send({
      from: 'StageSmart.ai <noreply@smartstageagent.com>',
      to: 'drsnow13@gmail.com',
      replyTo: email,
      subject: `🚨 ${issueType || 'Bad Result'} — ${roomType || 'Unknown'} / ${enhancementLabel || 'Unknown'} — ${remedyRequested || 'No remedy selected'}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px;">
          <h2 style="color: #dc2626; margin-bottom: 4px;">Bad Result Report</h2>
          <p style="color: #6b7280; margin-top: 0;">Reply directly to this email to respond to the agent.</p>

          <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
            <tr style="background: #f9fafb;">
              <td style="padding: 10px 12px; font-weight: bold; border: 1px solid #e5e7eb; width: 140px;">Agent Email</td>
              <td style="padding: 10px 12px; border: 1px solid #e5e7eb;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; font-weight: bold; border: 1px solid #e5e7eb;">Issue Type</td>
              <td style="padding: 10px 12px; border: 1px solid #e5e7eb; color: #dc2626; font-weight: bold;">${issueType || 'Not specified'}</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 10px 12px; font-weight: bold; border: 1px solid #e5e7eb;">Remedy Requested</td>
              <td style="padding: 10px 12px; border: 1px solid #e5e7eb; color: #1E3A8A; font-weight: bold;">${remedyRequested || 'Not specified'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; font-weight: bold; border: 1px solid #e5e7eb;">Room Type</td>
              <td style="padding: 10px 12px; border: 1px solid #e5e7eb;">${roomType || 'Not detected'}</td>
            </tr>
            <tr style="background: #f9fafb;">
              <td style="padding: 10px 12px; font-weight: bold; border: 1px solid #e5e7eb;">Enhancement</td>
              <td style="padding: 10px 12px; border: 1px solid #e5e7eb;">${enhancementLabel || enhancementId || 'Unknown'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 12px; font-weight: bold; border: 1px solid #e5e7eb;">Version Reported</td>
              <td style="padding: 10px 12px; border: 1px solid #e5e7eb;">Version ${(tileIndex ?? 0) + 1}</td>
            </tr>
            ${notes ? `
            <tr style="background: #f9fafb;">
              <td style="padding: 10px 12px; font-weight: bold; border: 1px solid #e5e7eb;">Agent Notes</td>
              <td style="padding: 10px 12px; border: 1px solid #e5e7eb;">${notes}</td>
            </tr>
            ` : ''}
          </table>

          <p style="color: #6b7280; font-size: 13px;">
            ${attachments.length > 0 ? `📎 ${attachments.length} photo(s) attached — original and/or result image.` : '⚠️ No photos attached.'}
          </p>
        </div>
      `,
      attachments: attachments.length > 0 ? attachments : undefined,
    });

    // Confirmation email to agent
    await resend.emails.send({
      from: 'StageSmart.ai <noreply@smartstageagent.com>',
      to: email,
      subject: "We received your report — we'll make it right",
      html: `
        <div style="font-family: sans-serif; max-width: 420px; margin: 0 auto;">
          <h2 style="color: #1E3A8A; text-align: center;">StageSmart.ai</h2>
          <p>We received your report about a <strong>${roomType || ''} ${enhancementLabel || 'enhancement'}</strong> result.</p>
          <div style="background: #f0f9ff; border-radius: 12px; padding: 16px; margin: 16px 0;">
            <p style="margin: 0; font-size: 14px;"><strong>Issue:</strong> ${issueType || 'Bad result'}</p>
            <p style="margin: 8px 0 0; font-size: 14px;"><strong>Your request:</strong> ${remedyRequested || 'Review needed'}</p>
          </div>
          <p>${remedyRequested === 'Credit my account'
            ? 'We will review and add a credit to your account within 24 hours.'
            : remedyRequested === 'Have your team edit the photo'
            ? 'Darren will personally review your photo and send back a corrected version within 24 hours.'
            : 'Darren will review this personally and either fix the photo or add a credit to your account within 24 hours.'}
          </p>
          <p style="color: #6b7280; font-size: 13px;">You can reply to this email if you need to add anything.</p>
        </div>
      `,
    });

    return res.json({ success: true });
  } catch (err) {
    console.error('Report error:', err);
    return res.status(500).json({ error: 'Failed to send report' });
  }
}
