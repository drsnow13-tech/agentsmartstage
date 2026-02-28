import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

const VALID_ROOMS = ['Living Room', 'Kitchen', 'Bedroom', 'Bathroom', 'Dining Room', 'Exterior', 'Backyard', 'Other'];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const form = formidable({ maxFileSize: 10 * 1024 * 1024 });
    const [, files] = await form.parse(req);
    const imageFile = Array.isArray(files.image) ? files.image[0] : files.image;

    if (!imageFile) return res.status(400).json({ error: 'No image provided' });

    const imageBuffer = fs.readFileSync(imageFile.filepath);
    const base64Image = imageBuffer.toString('base64');
    const mimeType = (imageFile.mimetype || 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 20,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: { type: 'base64', media_type: mimeType, data: base64Image }
          },
          {
            type: 'text',
            text: 'What type of room is this? Reply with ONLY ONE of: Living Room, Kitchen, Bedroom, Bathroom, Dining Room, Exterior, Backyard, Other'
          }
        ]
      }]
    });

    const rawText = response.content[0].type === 'text' ? response.content[0].text.trim() : 'Other';
    const roomType = VALID_ROOMS.find(r => rawText.includes(r)) || 'Other';

    res.json({ roomType });
  } catch (error: any) {
    console.error('Analyze error:', error);
    res.status(500).json({ error: 'Failed to analyze image', roomType: 'Other' });
  }
}
