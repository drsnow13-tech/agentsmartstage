import type { VercelRequest, VercelResponse } from '@vercel/node';
import Anthropic from '@anthropic-ai/sdk';
import formidable from 'formidable';
import fs from 'fs';

export const config = { api: { bodyParser: false } };

const VALID_ROOMS = [
  'Exterior',
  'Backyard',
  'Rooftop Terrace',
  'Balcony',
  'Living Room',
  'Dining Room',
  'Kitchen',
  'Bedroom',
  'Bathroom',
  'Home Office',
  'Other'
];

const DETECTION_PROMPT = `You are analyzing a real estate listing photo. Identify the room type from EXACTLY this list — pick the single best match and reply with ONLY that label, nothing else:

- Exterior — front or side of a house/building photographed from outside
- Backyard — rear yard, lawn, pool area, ground-level outdoor living space
- Rooftop Terrace — rooftop patio, terrace on top of a building, rooftop deck with elevated or city views
- Balcony — small elevated outdoor space attached to a unit, courtyard, small private patio
- Living Room — main indoor living/sitting area, family room, great room, bonus room, game room, flex space
- Dining Room — dedicated dining space, breakfast nook
- Kitchen — cooking area with appliances and countertops
- Bedroom — sleeping room with or without furniture
- Bathroom — full bath, half bath, ensuite, powder room
- Home Office — dedicated office or study with desk setup
- Other — anything that does not clearly fit the above

Reply with ONLY the room type label, nothing else.`;

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
            text: DETECTION_PROMPT
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
