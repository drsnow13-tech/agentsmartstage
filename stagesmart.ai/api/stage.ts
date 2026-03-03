import type { VercelRequest, VercelResponse } from '@vercel/node';
import { neon } from '@neondatabase/serverless';
import { GoogleGenAI } from '@google/genai';
import Replicate from 'replicate';

const ACTIVE_ENGINE = process.env.ACTIVE_ENGINE || 'replicate';

async function runGemini(image: string, prompt: string): Promise<string> {
  const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches) throw new Error('Invalid image format');
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: model: 'gemini-3.1-flash-image-preview',
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
  throw new Error('No image from Gemini');
}

async function runReplicate(image: string, prompt: string): Promise<string> {
  const replicate = new Replicate({ auth: process.env.REPLICATE_API_KEY });
  const output = await replicate.run(
    'black-forest-labs/flux-kontext-pro',
    { input: { prompt, input_image: image, output_format: 'jpg', safety_tolerance: 5 } }
  ) as any;
  const imageUrl = typeof output === 'string' ? output : output?.[0];
  if (!imageUrl) throw new Error('No image from Replicate');
  const imgRes = await fetch(imageUrl);
  const buffer = await imgRes.arrayBuffer();
  return `data:image/jpeg;base64,${Buffer.from(buffer).toString('base64')}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { image, prompt, email, isRetry } = req.body;
  if (!image || !prompt) return res.status(400).json({ error: 'Image and prompt required' });
  if (!email) return res.status(400).json({ error: 'Email required' });

  const emailLower = email.toLowerCase().trim();

  // Check and deduct credits server-side (skip deduction for retries)
  if (!isRetry) {
    try {
      const sql = neon(process.env.DATABASE_URL!);
      const rows = await sql`SELECT credits FROM users WHERE email = ${emailLower}`;
      const credits = rows.length > 0 ? rows[0].credits : 0;

      if (credits < 1) {
        return res.status(402).json({ error: 'Insufficient credits', credits: 0 });
      }

      // Deduct 1 credit atomically — only deduct on the FIRST item in a batch
      // The client sends isFirstInBatch to signal this
      if (req.body.isFirstInBatch) {
        await sql`UPDATE users SET credits = credits - 1 WHERE email = ${emailLower} AND credits > 0`;
      }
    } catch (dbError) {
      console.error('Credit check error:', dbError);
      return res.status(500).json({ error: 'Failed to verify credits' });
    }
  }

  try {
    let generatedImage: string;

    if (ACTIVE_ENGINE === 'gemini') {
      generatedImage = await runGemini(image, prompt);
      return res.json({ success: true, previewImage: generatedImage, engine: 'gemini' });
    }

    if (ACTIVE_ENGINE === 'replicate') {
      generatedImage = await runReplicate(image, prompt);
      return res.json({ success: true, previewImage: generatedImage, engine: 'replicate' });
    }

    // both mode - try replicate first, fall back to gemini
    try {
      generatedImage = await runReplicate(image, prompt);
      return res.json({ success: true, previewImage: generatedImage, engine: 'replicate' });
    } catch {
      generatedImage = await runGemini(image, prompt);
      return res.json({ success: true, previewImage: generatedImage, engine: 'gemini' });
    }

  } catch (error: any) {
    console.error('Stage error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
}
