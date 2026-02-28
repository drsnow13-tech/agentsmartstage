import type { VercelRequest, VercelResponse } from '@vercel/node';
import Replicate from 'replicate';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { image, prompt } = req.body;
    if (!image || !prompt) return res.status(400).json({ error: 'Image and prompt required' });

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_KEY });

    const output = await replicate.run(
      'black-forest-labs/flux-kontext-pro',
      {
        input: {
          prompt,
          input_image: image,
          output_format: 'jpg',
          safety_tolerance: 5,
        }
      }
    ) as any;

    // Convert URL output to base64
    const imageUrl = typeof output === 'string' ? output : output?.[0];
    if (!imageUrl) throw new Error('No image returned from Replicate');

    const imgRes = await fetch(imageUrl);
    const buffer = await imgRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const generatedImage = `data:image/jpeg;base64,${base64}`;

    // Deduct credit via cookie
    const current = parseInt(req.cookies?.ss_credits ?? '3', 10);
    res.setHeader('Set-Cookie', `ss_credits=${Math.max(0, current - 1)}; Path=/; Max-Age=2592000; SameSite=Lax`);

    res.json({ success: true, generatedImage, engine: 'replicate' });
  } catch (error: any) {
    console.error('Replicate stage error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate image' });
  }
}
