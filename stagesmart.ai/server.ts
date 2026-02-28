import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import cors from 'cors';
import Stripe from 'stripe';
import { GoogleGenAI } from '@google/genai';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Initialize SQLite DB
const db = new Database('stagesmart.db');
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    credits INTEGER DEFAULT 0
  );
  CREATE TABLE IF NOT EXISTS generations (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    original_image TEXT,
    generated_image TEXT,
    prompt TEXT,
    status TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Setup Multer for file uploads (in-memory for MVP)
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
// Stripe webhook needs raw body
app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '50mb' }));

// API Routes

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Mock user for MVP
const MOCK_USER_ID = 'user_123';
db.prepare('INSERT OR IGNORE INTO users (id, email, credits) VALUES (?, ?, ?)').run(MOCK_USER_ID, 'agent@example.com', 10);

app.get('/api/user', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(MOCK_USER_ID);
  res.json(user);
});

// Upload and analyze image
app.post('/api/analyze', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    const base64Image = req.file.buffer.toString('base64');
    
    // Use Gemini to detect room type
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: req.file.mimetype
          }
        },
        "What type of room is this? Answer with ONLY ONE of the following: Living Room, Kitchen, Bedroom, Bathroom, Dining Room, Exterior, Backyard, or Other."
      ]
    });

    const roomType = response.text?.trim() || 'Other';
    
    // Return a mock URL for the uploaded image (in a real app, upload to S3/GCS)
    // For MVP, we'll just send the base64 back to the client to hold in state
    const imageUrl = `data:${req.file.mimetype};base64,${base64Image}`;

    res.json({ roomType, imageUrl });
  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({ error: 'Failed to analyze image' });
  }
});

// Generate Staged Image
app.post('/api/stage', async (req, res) => {
  try {
    const { image, prompt } = req.body;
    
    if (!image || !prompt) {
      return res.status(400).json({ error: 'Image and prompt are required' });
    }

    // Check credits
    const user = db.prepare('SELECT credits FROM users WHERE id = ?').get(MOCK_USER_ID) as any;
    if (!user || user.credits < 1) {
      return res.status(402).json({ error: 'Insufficient credits' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    // Extract base64 data and mime type
    const matches = image.match(/^data:([A-Za-z-+\\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: 'Invalid image format' });
    }
    const mimeType = matches[1];
    const base64Data = matches[2];

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    let generatedImageUrl = null;
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        generatedImageUrl = `data:image/png;base64,${part.inlineData.data}`;
        break;
      }
    }

    if (!generatedImageUrl) {
      throw new Error('No image generated');
    }

    // Deduct credit
    db.prepare('UPDATE users SET credits = credits - 1 WHERE id = ?').run(MOCK_USER_ID);
    
    // Save generation
    const genId = uuidv4();
    db.prepare('INSERT INTO generations (id, user_id, prompt, status) VALUES (?, ?, ?, ?)').run(genId, MOCK_USER_ID, prompt, 'completed');

    res.json({ success: true, generatedImage: generatedImageUrl, id: genId });
  } catch (error) {
    console.error('Stage error:', error);
    res.status(500).json({ error: 'Failed to generate image' });
  }
});

// Stripe Checkout
app.post('/api/checkout', async (req, res) => {
  try {
    const { packageId } = req.body;
    
    if (!process.env.STRIPE_SECRET_KEY) {
      // Mock successful checkout for preview if no Stripe key
      db.prepare('UPDATE users SET credits = credits + ? WHERE id = ?').run(packageId === '5pack' ? 5 : 1, MOCK_USER_ID);
      return res.json({ url: '/dashboard?success=true' });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    let amount = 500; // $5
    let credits = 1;
    let name = '1 Photo Staging';
    
    if (packageId === '5pack') {
      amount = 2500;
      credits = 5;
      name = '5-Pack Staging';
    } else if (packageId === '10pack') {
      amount = 4000;
      credits = 10;
      name = '10-Pack Credits';
    } else if (packageId === '50pack') {
      amount = 15000;
      credits = 50;
      name = '50-Pack Credits';
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.APP_URL || 'http://localhost:3000'}/dashboard?success=true`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/editor?canceled=true`,
      client_reference_id: MOCK_USER_ID,
      metadata: {
        credits: credits.toString()
      }
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// Stripe Webhook
app.post('/api/webhook', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!endpointSecret || !process.env.STRIPE_SECRET_KEY) {
    return res.status(400).send('Stripe not configured');
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig as string, endpointSecret);
  } catch (err: any) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const userId = session.client_reference_id;
    const credits = parseInt(session.metadata?.credits || '0', 10);

    if (userId && credits > 0) {
      db.prepare('UPDATE users SET credits = credits + ? WHERE id = ?').run(credits, userId);
    }
  }

  res.json({ received: true });
});

app.get('/api/generate-demo', async (req, res) => {
  try {
    console.log('API Key exists:', !!process.env.GEMINI_API_KEY);
    console.log('API Key length:', process.env.GEMINI_API_KEY?.length);
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    
    console.log('Generating empty room...');
    const emptyResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: 'A high quality real estate photograph of an empty modern living room with white walls, light wood floors, large windows, bright natural light, completely empty, no furniture.',
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    let emptyBase64 = '';
    for (const part of emptyResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        emptyBase64 = part.inlineData.data;
        fs.writeFileSync(path.join(__dirname, 'public', 'demo-before.jpg'), Buffer.from(emptyBase64, 'base64'));
        break;
      }
    }

    console.log('Staging the room...');
    const stagedResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { inlineData: { data: emptyBase64, mimeType: 'image/jpeg' } },
          { text: 'Stage this empty living room with beautiful modern furniture, a stylish grey sofa, a wooden coffee table, a textured rug, and some lush indoor plants. Real estate photography.' },
        ],
      },
      config: { imageConfig: { aspectRatio: "16:9" } }
    });

    for (const part of stagedResponse.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const stagedBase64 = part.inlineData.data;
        fs.writeFileSync(path.join(__dirname, 'public', 'demo-after.jpg'), Buffer.from(stagedBase64, 'base64'));
        break;
      }
    }

    res.json({ success: true, message: 'Images generated and saved to public folder.' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: error.message });
  }
});

async function startServer() {
  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
