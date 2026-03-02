import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import Replicate from 'replicate';
import { neon } from '@neondatabase/serverless';
const uuidv4 = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const ACTIVE_ENGINE = process.env.ACTIVE_ENGINE || 'gemini';

async function saveGeneration(id: string, email: string, clean: string, prompt: string) {
  const sql = neon(process.env.DATABASE_URL!);
  await sql`INSERT INTO generations (id, email, watermarked_image, clean_image, prompt)
    VALUES (${id}, ${email.toLowerCase()}, ${clean}, ${clean}, ${prompt})`;
}

async function runGemini(image: string, prompt: string): Promise<string> {
  const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches) throw new Error('Invalid image format');
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
 const response = await ai.models.generateContent({
  model: 'gemini-3.1-flash-image-preview',
  config: { responseModalities: ['image', 'text'] },
  contents: { parts: [{ inlineData: { data: matches[2], mimeType: matches[1] } }, { text: prompt }] }
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

  const { image, prompt, email } = req.body;
  if (!image || !prompt) return res.status(400).json({ error: 'Image and prompt required' });
  if (!email) return res.status(400).json({ error: 'Email required' });

  try {
    const cleanImage = ACTIVE_ENGINE === 'replicate'
      ? await runReplicate(image, prompt)
      : await runGemini(image, prompt);

    const genId = uuidv4();
    try {
      await saveGeneration(genId, email, cleanImage, prompt);
    } catch (dbErr) {
      console.error('DB save failed (non-fatal):', dbErr);
    }

    res.json({ success: true, generationId: genId, previewImage: cleanImage, engine: ACTIVE_ENGINE });
  } catch (error: any) {
    console.error('Stage error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
}
