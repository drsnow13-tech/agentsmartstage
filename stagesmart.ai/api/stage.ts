import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI } from '@google/genai';
import Replicate from 'replicate';

// Change to 'gemini' or 'replicate' once you pick a winner
const ACTIVE_ENGINE = process.env.ACTIVE_ENGINE || 'both';

async function runGemini(image: string, prompt: string): Promise<string> {
  const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
  if (!matches) throw new Error('Invalid image format');
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-preview-05-20',
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

  const { image, prompt } = req.body;
  if (!image || !prompt) return res.status(400).json({ error: 'Image and prompt required' });

  try {
    if (ACTIVE_ENGINE === 'gemini') {
      const generatedImage = await runGemini(image, prompt);
      return res.json({ success: true, generatedImage, engine: 'gemini' });
    }
    if (ACTIVE_ENGINE === 'replicate') {
      const generatedImage = await runReplicate(image, prompt);
      return res.json({ success: true, generatedImage, engine: 'replicate' });
    }

    // 'both' mode - run in parallel
    const [geminiResult, replicateResult] = await Promise.allSettled([
      runGemini(image, prompt),
      runReplicate(image, prompt)
    ]);

    const current = parseInt(req.cookies?.ss_credits ?? '3', 10);
    res.setHeader('Set-Cookie', `ss_credits=${Math.max(0, current - 1)}; Path=/; Max-Age=2592000; SameSite=Lax`);

    res.json({
      success: true,
      engine: 'both',
      gemini: geminiResult.status === 'fulfilled' ? geminiResult.value : null,
      geminiError: geminiResult.status === 'rejected' ? geminiResult.reason?.message : null,
      replicate: replicateResult.status === 'fulfilled' ? replicateResult.value : null,
      replicateError: replicateResult.status === 'rejected' ? replicateResult.reason?.message : null,
      generatedImage: geminiResult.status === 'fulfilled' ? geminiResult.value :
                      replicateResult.status === 'fulfilled' ? replicateResult.value : null,
    });
  } catch (error: any) {
    console.error('Stage error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
}
