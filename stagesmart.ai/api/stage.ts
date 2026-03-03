import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { GoogleGenAI } from '@google/genai';

async function runGemini(image: string, prompt: string): Promise<string> {
  const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches) throw new Error('Invalid image format');
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-image-preview',
    contents: {
      parts: [
        { inlineData: { data: matches[2], mimeType: matches[1] } },
        { text: prompt }
      ]
    }
  });
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if ((part as any).inlineData) return `data:image/png;base64,${(part as any).inlineData.data}`;
  }
  throw new Error('No image returned from Gemini');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image, prompt, email, isRetry, isFirstInBatch } = req.body;
  if (!image || !prompt) return res.status(400).json({ error: 'Image and prompt required' });
  if (!email) return res.status(400).json({ error: 'Email required' });

  const emailLower = email.toLowerCase().trim();

  // Check and deduct credits server-side (skip for retries)
  if (!isRetry) {
    try {
      const sql = neon(process.env.DATABASE_URL!);
      const rows = await sql`SELECT credits FROM users WHERE email = ${emailLower}`;
      const credits = rows.length > 0 ? rows[0].credits : 0;

      if (credits < 1) {
        return res.status(402).json({ error: 'Insufficient credits', credits: 0 });
      }

      // Only deduct on the first item in a batch
      if (isFirstInBatch) {
        await sql`UPDATE users SET credits = credits - 1 WHERE email = ${emailLower} AND credits > 0`;
      }
    } catch (dbError) {
      console.error('Credit check error:', dbError);
      return res.status(500).json({ error: 'Failed to verify credits' });
    }
  }

  try {
    const generatedImage = await runGemini(image, prompt);
    return res.json({ success: true, previewImage: generatedImage, engine: 'gemini' });
  } catch (error: any) {
    console.error('Stage error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
}
