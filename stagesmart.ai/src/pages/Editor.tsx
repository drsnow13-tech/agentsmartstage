import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Wand2, Loader2, Download, RotateCcw, Sparkles, AlertCircle, Mail, CheckSquare, Square, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageComparison } from '../components/ImageComparison';
import { cn } from '../lib/utils';

type RoomType = 'Living Room' | 'Kitchen' | 'Bedroom' | 'Bathroom' | 'Dining Room' | 'Exterior' | 'Backyard' | 'Other';
type Step = 'upload' | 'email' | 'options' | 'generating' | 'result';

interface EditOption {
  id: string;
  label: string;
  description: string;
  emoji: string;
  prompt: string;
}

interface GeneratedResult {
  option: EditOption;
  image: string;
  generationId: string;
}

const TIPS = [
  "Twilight photos get 3x more saves on Zillow",
  "Virtual staging sells homes 73% faster on average",
  "You're saving ~$35 vs traditional photo editing",
  "AI-enhanced exteriors increase listing clicks by 40%",
  "Blue sky photos generate 20% more showing requests",
  "Green lawn photos increase perceived home value",
];

const ROOM_OPTIONS: Record<string, EditOption[]> = {
  Exterior: [
    { id: 'twilight', label: 'Virtual Twilight', description: 'Golden hour sky, warm glowing windows', emoji: '🌅', prompt: 'Professional real estate twilight photo, bright blue and purple gradient sky, warm golden light glowing from all windows, exterior lights on, well-lit facade, home clearly visible, vibrant colors, NOT dark or moody, MLS listing quality, keep all architecture identical' },
    { id: 'grass', label: 'Green the Grass', description: 'Lush vibrant lawn that pops online', emoji: '🌿', prompt: 'Make the lawn lush green and vibrant, healthy thick grass, professional real estate photography, keep everything else identical' },
    { id: 'lights', label: 'Turn On Interior Lights', description: 'Warm inviting glow from inside', emoji: '💡', prompt: 'Add warm glowing light visible through all windows as if lights are on inside, welcoming atmosphere, professional real estate photography, keep architecture identical' },
    { id: 'sky', label: 'Blue Sky Swap', description: 'Replace overcast sky with bright blue', emoji: '☀️', prompt: 'Replace sky with beautiful bright blue sky and white clouds, keep all other elements identical, professional real estate photography' },
    { id: 'declutter', label: 'Remove Clutter', description: 'Clean up bins, cars, debris', emoji: '🧹', prompt: 'Remove any trash cans, debris, vehicles, or clutter from the scene, keep architecture identical, clean professional real estate photography' },
  ],
  Backyard: [
    { id: 'twilight', label: 'Virtual Twilight', description: 'Stunning evening ambiance', emoji: '🌅', prompt: 'Professional real estate twilight backyard photo, bright blue and purple gradient sky, warm ambient lighting, home clearly visible, NOT dark or moody, keep all architecture identical' },
    { id: 'grass', label: 'Green the Grass', description: 'Perfect lawn all year round', emoji: '🌿', prompt: 'Make lawn lush green and vibrant, healthy thick grass, professional real estate photography, keep everything else identical' },
    { id: 'furniture', label: 'Add Outdoor Furniture', description: 'Stage with patio set, fire pit', emoji: '🪑', prompt: 'Add tasteful modern outdoor furniture — patio dining set, lounge chairs — keep existing architecture identical, professional real estate photography' },
  ],
  'Living Room': [
    { id: 'stage-warm', label: 'Warm & Inviting', description: 'Cozy, styled, ready to sell', emoji: '🛋️', prompt: 'Photoreal warm and inviting living room virtual staging. IMPORTANT: If there is a fireplace, keep it fully visible and do NOT place any furniture in front of it — position seating to face or flank the fireplace instead. The room should feel full, warm, and livable — not sparse or empty — but never cluttered. Fill all areas of the room intentionally. Add: a large plush sofa and accent chair in warm cream, camel, or sage, a wood coffee table styled with a tray, candles, and a coffee table book, a large soft area rug centered under all seating furniture, two table lamps on end tables with warm amber glow, a tall potted fiddle leaf fig or olive tree in a corner away from the fireplace, a smaller potted plant on a side table or console, a styled bookshelf or console against any bare wall, three pieces of framed art — one large statement piece above the sofa or fireplace mantle, two smaller accent pieces on adjacent walls, a cozy throw blanket draped over the sofa arm, decorative pillows in coordinating warm tones. Keep ALL walls, floors, windows, baseboards, ceiling, and architectural details exactly identical. Warm glowing natural light, MLS-ready real estate photography.' },
    { id: 'stage-traditional', label: 'Traditional Staging', description: 'Classic, warm, polished', emoji: '🏡', prompt: 'Photoreal warm and inviting traditional living room virtual staging. IMPORTANT: If there is a fireplace, keep it fully visible — never block it with furniture. Position sofas and chairs to face or flank it. The room must feel full and lived-in without being cluttered — no large empty floor areas or bare walls. Add: a classic sofa and loveseat in warm cream or sage, a wood coffee table with floral centerpiece and candles, a large patterned area rug centered under all seating, two table lamps on end tables with warm light, a tall potted plant in corner, framed botanical or landscape art above sofa and fireplace mantle if present, two smaller framed pieces on side walls, decorative throw pillows in warm coordinating tones, a styled side console or bookcase against any empty wall. Keep ALL walls, floors, windows, and architecture exactly identical. Warm inviting lighting, MLS-ready real estate photography.' },
    { id: 'stage-modern', label: 'Modern Staging', description: 'Clean lines, still warm', emoji: '✨', prompt: 'Photoreal modern yet warm living room virtual staging. IMPORTANT: If there is a fireplace, keep it completely visible and unobstructed. The room should feel thoughtfully full — no empty corners or bare walls — but clean and uncluttered. Add: a low-profile sectional in light grey or ivory, a sleek wood coffee table with a small succulent and stack of books, a large solid-color area rug under all seating, a floor lamp with warm light in one corner, one large abstract canvas above the sofa, a medium potted monstera or snake plant in another corner, a minimalist console or media unit against a bare wall. Keep ALL walls, floors, windows, and architecture exactly identical. Bright warm lighting, MLS-ready real estate photography.' },
    { id: 'declutter', label: 'Declutter & Clean', description: 'Remove furniture, personal items', emoji: '🧹', prompt: 'Remove ALL existing furniture, personal items, decor, and clutter from this room. Keep walls, floors, baseboards, windows, doors, ceiling, fireplace, and all architectural features exactly identical. Result: a bright, clean, completely empty room. Professional real estate photography.' },
    { id: 'brighten', label: 'Brighten & Enhance', description: 'More light, better colors', emoji: '💫', prompt: 'Brighten this room significantly. Enhance natural light coming through windows, improve white balance, boost warmth and vibrancy, reduce shadows. Keep every piece of furniture, every decor item, and all architectural elements exactly identical — only improve the lighting and color. Professional real estate photography.' },
  ],
  'Dining Room': [
    { id: 'stage-warm', label: 'Warm & Inviting', description: 'Styled dining, ready to entertain', emoji: '🍽️', prompt: 'Photoreal warm and inviting dining room virtual staging. The room should feel full and welcoming — no bare walls or empty corners. Add: a rectangular dining table in warm walnut or oak, 6 upholstered chairs in cream or warm taupe, a LARGE area rug with a subtle warm-toned pattern centered UNDER the full table extending at least 24 inches beyond all sides, a statement chandelier or pendant above the table with warm amber light, a centerpiece of fresh flowers in a vase with candles, a tall potted fiddle leaf fig or plant in one corner, a sideboard or buffet against one wall styled with a mirror above it and a small plant or decor on top, two pieces of framed art — one large landscape or abstract on the main wall, one smaller accent piece. Keep ALL walls, floors, windows, and architecture exactly identical. Warm inviting lighting, MLS-ready real estate photography.' },
    { id: 'stage-traditional', label: 'Traditional Staging', description: 'Classic dining room', emoji: '🏡', prompt: 'Photoreal warm and inviting traditional dining room virtual staging. No bare walls or empty corners — the room should feel full and elegant. Add: a dark wood rectangular dining table, 6 classic upholstered chairs in cream or sage, a large patterned area rug centered UNDER table extending 24 inches beyond all sides, chandelier above table, elegant floral centerpiece with candelabra, a dark wood sideboard against one wall with a mirror above and small plant on top, framed art on remaining walls, potted plant in corner. Keep ALL walls, floors, windows, architecture exactly identical. Warm elegant lighting, MLS-ready real estate photography.' },
    { id: 'stage-modern', label: 'Modern Staging', description: 'Clean, minimal dining', emoji: '✨', prompt: 'Photoreal modern warm dining room virtual staging. The space should feel intentionally full, not sparse. Add: a light wood rectangular table, 6 minimalist upholstered chairs in warm grey, a large solid-color rug centered UNDER the table extending 24 inches beyond all sides, a sculptural pendant light above, simple greenery centerpiece, a low credenza against one wall, one large abstract art piece on the main wall. Keep ALL walls, floors, windows, architecture exactly identical. Bright warm lighting, MLS-ready real estate photography.' },
    { id: 'declutter', label: 'Declutter & Clean', description: 'Remove furniture, personal items', emoji: '🧹', prompt: 'Remove ALL existing furniture, personal items, and clutter. Keep walls, floors, windows, and all architectural features exactly identical. Bright clean empty room. Professional real estate photography.' },
  ],
  'Kitchen': [
    { id: 'stage-warm', label: 'Warm & Styled', description: 'Cozy kitchen styling', emoji: '🛋️', prompt: 'Photoreal warm and inviting kitchen staging. Clear all clutter from countertops completely. Add tasteful warm styling that feels curated, not sparse: a small potted herb garden near the window, a wooden cutting board leaned against the backsplash, a bowl of fresh lemons or fruit on the counter, a folded linen dish towel, a small vase with fresh flowers near the sink, a small plant on top of the refrigerator or open shelf if present. Keep ALL cabinets, appliances, countertops, backsplash, and architectural details exactly identical. Warm bright professional real estate photography.' },
    { id: 'brighten', label: 'Brighten & Enhance', description: 'More light, better colors', emoji: '💫', prompt: 'Brighten this kitchen significantly. Enhance natural light, improve white balance, make countertops and cabinets look cleaner and more vibrant, boost warmth and color. Keep ALL cabinets, appliances, countertops, backsplash, and architectural elements exactly identical. Professional real estate photography.' },
    { id: 'declutter', label: 'Declutter Countertops', description: 'Clean minimal counters', emoji: '🧹', prompt: 'Remove ALL clutter from countertops — small appliances, dishes, papers, personal items, everything. Keep all built-in appliances (fridge, stove, dishwasher, microwave), cabinets, countertops, backsplash exactly identical. Add only minimal warm styling: a small potted herb plant and a simple fruit bowl. Professional real estate photography.' },
  ],
  'Bedroom': [
    { id: 'stage-warm', label: 'Warm & Inviting', description: 'Cozy bedroom, beautifully styled', emoji: '🛋️', prompt: 'Photoreal warm and inviting bedroom virtual staging. The room should feel full, cozy, and complete — no empty corners or bare walls. Add: an upholstered or wood headboard bed with layered white and warm-toned bedding, Euro shams plus decorative throw pillows, a cozy folded blanket draped at the foot of the bed, two nightstands with warm-glowing table lamps, a large soft area rug extending at least 18 inches beyond the sides and foot of the bed, a potted plant or fresh flowers on one nightstand, a tall fiddle leaf fig or plant in one corner of the room, a dresser or accent chair with a small throw in another corner if space allows, one large framed art piece above the headboard, one or two smaller framed pieces on adjacent walls. Keep ALL walls, floors, windows, and architecture exactly identical. Warm inviting lighting, MLS-ready real estate photography.' },
    { id: 'stage-traditional', label: 'Traditional Staging', description: 'Classic, polished bedroom', emoji: '🏡', prompt: 'Photoreal warm and inviting traditional bedroom virtual staging. No empty corners or bare walls. Add: a classic upholstered headboard bed with layered white and cream bedding, decorative Euro pillows, two matching wood nightstands with warm table lamps, a soft patterned area rug extending well beyond the bed on all sides, a small potted plant or fresh flowers on one nightstand, a tall plant in corner, a bench at the foot of the bed, framed botanical or landscape art above headboard and on side walls. Keep ALL walls, floors, windows, architecture exactly identical. Warm elegant lighting, MLS-ready real estate photography.' },
    { id: 'brighten', label: 'Brighten & Enhance', description: 'More light, better colors', emoji: '💫', prompt: 'Brighten this bedroom significantly. Enhance natural light, improve color balance and warmth, reduce shadows. Keep every piece of furniture, every decor item, and all architectural elements exactly identical — only improve lighting and color. Professional real estate photography.' },
    { id: 'declutter', label: 'Declutter & Clean', description: 'Remove clutter, personal items', emoji: '🧹', prompt: 'Remove ALL personal items, clutter, clothes, and loose items from this bedroom. Keep all furniture, beds, dressers, and built-in features exactly identical. Clean, tidy, depersonalized result. Professional real estate photography.' },
  ],
  default: [
    { id: 'stage-warm', label: 'Warm & Inviting', description: 'Cozy, styled, ready to sell', emoji: '🛋️', prompt: 'Photoreal warm and inviting virtual staging. IMPORTANT: If there is a fireplace, keep it fully visible — never block it with furniture. The room must feel full and livable with no bare walls or empty corners, but never cluttered. Add appropriate furniture for this room type in warm cream, camel, and wood tones. Include: a large area rug under any seating or dining furniture, a tall potted plant in one corner, a smaller plant on a surface, framed art on every wall — one large statement piece and smaller accent pieces, warm ambient lighting from table lamps or pendants, styled surfaces with books, trays, and decor. Keep ALL walls, floors, windows, and architecture exactly identical. Warm inviting lighting, MLS-ready real estate photography.' },
    { id: 'stage-traditional', label: 'Traditional Staging', description: 'Classic, warm, polished', emoji: '🏡', prompt: 'Photoreal warm and inviting traditional virtual staging. If there is a fireplace, keep it fully visible. No empty corners or bare walls. Add classic furniture in warm cream and wood tones with an area rug under seating, table lamps with warm light, tall and small potted plants, and framed art on all walls. Keep ALL walls, floors, windows, and architecture exactly identical. Warm elegant lighting, MLS-ready real estate photography.' },
    { id: 'stage-modern', label: 'Modern Staging', description: 'Clean lines, still warm', emoji: '✨', prompt: 'Photoreal modern yet warm virtual staging. If there is a fireplace, keep it fully visible and unobstructed. The room should feel thoughtfully full — no empty corners or bare walls. Add contemporary furniture in light grey and ivory, a large area rug, a large abstract art piece, potted plants in corners, and a styled console against any bare wall. Keep ALL walls, floors, windows, and architecture exactly identical. Bright warm lighting, MLS-ready real estate photography.' },
    { id: 'declutter', label: 'Declutter & Clean', description: 'Remove furniture, personal items', emoji: '🧹', prompt: 'Remove ALL existing furniture, personal items, decor, and clutter. Keep walls, floors, windows, doors, ceiling, fireplace, and all architectural features exactly identical. Bright clean empty room. Professional real estate photography.' },
    { id: 'brighten', label: 'Brighten & Enhance', description: 'More light, better colors', emoji: '💫', prompt: 'Brighten the room, enhance natural light, improve color balance and warmth. Keep all furniture, decor, and architectural elements exactly identical — only improve the lighting and color. Professional real estate photography.' },
  ]
};

function getOptions(roomType: RoomType | null): EditOption[] {
  if (!roomType) return ROOM_OPTIONS.default;
  return (ROOM_OPTIONS as any)[roomType] || ROOM_OPTIONS.default;
}

function getGreeting(roomType: RoomType | null): string {
  const greetings: Record<string, string> = {
    'Exterior': "Front of home detected. Select all enhancements you want — one credit for the set.",
    'Backyard': "Backyard detected. Pick your enhancements — one credit for all selected.",
    'Living Room': "Living room detected. Choose your staging options — one credit for all.",
    'Kitchen': "Kitchen detected. Select enhancements — one credit for all selected.",
    'Bedroom': "Bedroom detected. Choose your staging style — one credit for all.",
    'Bathroom': "Bathroom detected. Select enhancements — one credit for all.",
    'Dining Room': "Dining room detected. Choose staging options — one credit for all.",
    'Other': "Select all enhancements you want — one credit for the whole set.",
  };
  return roomType ? (greetings[roomType] || greetings['Other']) : "Select all enhancements you want — one credit for the whole set.";
}

function addWatermarkToImage(imageDataUrl: string, text: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const fontSize = Math.max(16, Math.floor(img.width / 40));
      ctx.font = `bold ${fontSize}px Arial`;
      ctx.fillStyle = 'rgba(255,255,255,0.7)';
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 2;
      ctx.textAlign = 'right';
      ctx.textBaseline = 'bottom';

      const padding = Math.floor(img.width * 0.02);
      ctx.strokeText(text, img.width - padding, img.height - padding);
      ctx.fillText(text, img.width - padding, img.height - padding);

      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.src = imageDataUrl;
  });
}

export function Editor() {
  const [step, setStep] = useState<Step>('upload');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedOptions, setSelectedOptions] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<GeneratedResult[]>([]);
  const [activeResult, setActiveResult] = useState<GeneratedResult | null>(null);
  const [credits, setCredits] = useState(0);
  const [email, setEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [showCreditWarning, setShowCreditWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);

  // Rotate tips during generation
  useEffect(() => {
    if (step !== 'generating') return;
    const interval = setInterval(() => {
      setCurrentTip(prev => (prev + 1) % TIPS.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [step]);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setOriginalImage(previewUrl);
    setCurrentFile(file);
    setSelectedOptions(new Set());
    setResults([]);
    setError(null);

    if (!email) { setStep('email'); return; }

    setIsAnalyzing(true);
    setStep('options');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const data = await res.json();
      setRoomType(data.roomType as RoomType);
    } catch { setRoomType('Other'); }
    finally { setIsAnalyzing(false); }
  }, [email]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1
  } as any);

  const handleEmailSubmit = async () => {
    if (!emailInput.includes('@')) return;
    setEmail(emailInput);
    try {
      const res = await fetch(`/api/user?email=${encodeURIComponent(emailInput)}`);
      const data = await res.json();
      setCredits(data.credits ?? 0);
    } catch { setCredits(0); }

    if (!originalImage || !currentFile) { setStep('upload'); return; }
    setIsAnalyzing(true);
    setStep('options');
    try {
      const formData = new FormData();
      formData.append('image', currentFile);
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const data = await res.json();
      setRoomType(data.roomType as RoomType);
    } catch { setRoomType('Other'); }
    finally { setIsAnalyzing(false); }
  };

  const toggleOption = (id: string) => {
    setSelectedOptions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const handleGenerateAll = async () => {
    if (!originalImage || !currentFile || selectedOptions.size === 0) return;
    if (credits < 1) { setShowCreditWarning(true); return; }

    setStep('generating');
    setGeneratingProgress(0);
    setCurrentTip(0);
    setError(null);

    const options = getOptions(roomType).filter(o => selectedOptions.has(o.id));
    const newResults: GeneratedResult[] = [];

    const reader = new FileReader();
    reader.readAsDataURL(currentFile);
    reader.onload = async () => {
      const base64Image = reader.result as string;

      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        try {
          const res = await fetch('/api/stage', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image, prompt: option.prompt, email })
          });
          const data = await res.json();
          if (data.previewImage) {
            newResults.push({ option, image: data.previewImage, generationId: data.generationId });
          }
        } catch (err) {
          console.error(`Failed: ${option.label}`, err);
        }
        setGeneratingProgress(Math.round(((i + 1) / options.length) * 100));
      }

      setCredits(prev => Math.max(0, prev - 1));
      setResults(newResults);
      setActiveResult(newResults[0] || null);
      setStep('result');
    };
  };

  const handleDownload = async (result: GeneratedResult) => {
    let imageToDownload = result.image;
    if (watermarkEnabled) {
      imageToDownload = await addWatermarkToImage(result.image, 'SmartStageAgent.com');
    }
    const a = document.createElement('a');
    a.href = imageToDownload;
    a.download = `smartstageagent-${result.option.id}.jpg`;
    a.click();
  };

  const handleReset = () => {
    setStep('upload'); setOriginalImage(null); setResults([]);
    setRoomType(null); setSelectedOptions(new Set()); setError(null);
    setCurrentFile(null); setActiveResult(null);
  };

  const handleRetry = async () => {
    if (!originalImage || !currentFile || selectedOptions.size === 0) return;
    setStep('generating');
    setGeneratingProgress(0);
    setError(null);
    const options = getOptions(roomType).filter(o => selectedOptions.has(o.id));
    const newResults: GeneratedResult[] = [];
    const reader = new FileReader();
    reader.readAsDataURL(currentFile);
    reader.onload = async () => {
      const base64Image = reader.result as string;
      for (let i = 0; i < options.length; i++) {
        const option = options[i];
        try {
          const res = await fetch('/api/stage', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image, prompt: option.prompt, email })
          });
          const data = await res.json();
          if (data.previewImage) newResults.push({ option, image: data.previewImage, generationId: data.generationId });
        } catch (err) { console.error(err); }
        setGeneratingProgress(Math.round(((i + 1) / options.length) * 100));
      }
      // No credit deduction on retry
      setResults(newResults);
      setActiveResult(newResults[0] || null);
      setStep('result');
    };
  };

  const handleTryAnother = () => {
    setStep('options'); setResults([]); setSelectedOptions(new Set());
    setError(null); setActiveResult(null);
  };

  const options = getOptions(roomType);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50">
      {/* Credit bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span>Select multiple enhancements — <strong>1 credit for all</strong></span>
        </div>
        <div className="flex items-center gap-2">
          {email && <span className="text-xs text-slate-400 hidden sm:block">{email}</span>}
          <span className="text-sm font-bold text-slate-900">{credits} credits</span>
          <button onClick={() => setShowCreditWarning(true)} className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-full font-medium transition-colors">
            Buy Credits
          </button>
        </div>
      </div>

      {/* Photo purge notice */}
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 flex items-center justify-center gap-2 text-xs text-blue-600">
        <Info className="w-3 h-3 shrink-0" />
        <span>Your photos are <strong>not stored</strong> — they are automatically deleted after 24 hours. Download immediately after enhancing.</span>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">

          {/* UPLOAD */}
          {step === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-slate-900 mb-2">Upload a Listing Photo</h1>
                <p className="text-slate-500">AI detects the room type and suggests the right enhancements. Select what you want — 1 credit for all.</p>
              </div>
              <div {...getRootProps()} className={cn("border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all", isDragActive ? "border-orange-500 bg-orange-50" : "border-slate-300 hover:border-orange-400 hover:bg-slate-100 bg-white")}>
                <input {...getInputProps()} />
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                    <Upload className="w-8 h-8 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-lg font-bold text-slate-900 mb-1">{isDragActive ? 'Drop it here' : 'Drag & drop your photo here'}</p>
                    <p className="text-slate-500 text-sm">or click to browse — JPG, PNG, WEBP up to 10MB</p>
                  </div>
                  <div className="flex items-center gap-6 text-xs text-slate-400 mt-2">
                    <span>🏠 Exteriors</span><span>🛋️ Living Rooms</span><span>🍳 Kitchens</span><span>🛏️ Bedrooms</span>
                  </div>
                </div>
              </div>
              <p className="text-center text-xs text-slate-400 mt-4">Free to upload. 1 credit charged per generation batch. Photos deleted after 24 hours — download immediately.</p>
            </motion.div>
          )}

          {/* EMAIL */}
          {step === 'email' && (
            <motion.div key="email" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-md mx-auto">
              {originalImage && (
                <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-200 shadow-sm mb-6">
                  <img src={originalImage} alt="Your photo" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="bg-white rounded-2xl border border-slate-200 p-8">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                    <Mail className="w-5 h-5 text-orange-500" />
                  </div>
                  <div>
                    <h2 className="font-bold text-slate-900">Enter your email</h2>
                    <p className="text-sm text-slate-500">To access your credits and download photos</p>
                  </div>
                </div>
                <input
                  type="email" value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
                  placeholder="you@brokerage.com"
                  className="w-full border-2 border-slate-200 focus:border-orange-400 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition-colors mb-4"
                  autoFocus
                />
                <button onClick={handleEmailSubmit} disabled={!emailInput.includes('@')}
                  className="w-full py-3 bg-[#1E3A8A] hover:bg-blue-900 disabled:bg-slate-300 text-white font-bold rounded-xl transition-colors">
                  Continue →
                </button>
                <p className="text-center text-xs text-slate-400 mt-3">No password needed. We use email to store your credits only.</p>
              </div>
            </motion.div>
          )}

          {/* OPTIONS */}
          {step === 'options' && originalImage && (
            <motion.div key="options" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-200 shadow-sm">
                    <img src={originalImage} alt="Your photo" className="w-full h-full object-cover" />
                  </div>
                  <button onClick={handleReset} className="mt-3 text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Upload different photo
                  </button>
                </div>
                <div>
                  {isAnalyzing ? (
                    <div className="flex items-center gap-3 mb-6 bg-blue-50 rounded-xl p-4">
                      <Loader2 className="w-5 h-5 animate-spin text-blue-500 shrink-0" />
                      <div>
                        <p className="font-medium text-slate-900">Analyzing your photo...</p>
                        <p className="text-sm text-slate-500">Detecting room type</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-4 bg-[#1E3A8A] rounded-xl p-4 text-white">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-orange-400" />
                        <span className="text-xs font-medium text-blue-300 uppercase tracking-wide">
                          {roomType ? `Detected: ${roomType}` : 'Ready'}
                        </span>
                      </div>
                      <p className="font-semibold text-sm">{getGreeting(roomType)}</p>
                    </div>
                  )}

                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />{error}
                    </div>
                  )}

                  <div className="space-y-2 mb-4">
                    {options.map(option => {
                      const selected = selectedOptions.has(option.id);
                      return (
                        <button key={option.id} onClick={() => toggleOption(option.id)}
                          className={cn("w-full flex items-center gap-4 p-4 border-2 rounded-xl text-left transition-all",
                            selected ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white hover:border-orange-300 hover:bg-slate-50")}>
                          {selected ? <CheckSquare className="w-5 h-5 text-orange-500 shrink-0" /> : <Square className="w-5 h-5 text-slate-300 shrink-0" />}
                          <span className="text-xl shrink-0">{option.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-900">{option.label}</div>
                            <div className="text-sm text-slate-500">{option.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button onClick={handleGenerateAll} disabled={selectedOptions.size === 0 || isAnalyzing}
                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black text-lg rounded-xl flex items-center justify-center gap-2 transition-colors">
                    <Wand2 className="w-5 h-5" />
                    {selectedOptions.size === 0 ? 'Select enhancements above' : `Generate ${selectedOptions.size} Enhancement${selectedOptions.size > 1 ? 's' : ''} — 1 Credit`}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* GENERATING */}
          {step === 'generating' && (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wand2 className="w-10 h-10 text-orange-500 animate-pulse" />
              </div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Generating your enhancements...</h2>
              <p className="text-slate-500 mb-8">Running {selectedOptions.size} enhancement{selectedOptions.size > 1 ? 's' : ''} — please wait</p>
              <div className="max-w-sm mx-auto bg-slate-200 rounded-full h-3 overflow-hidden mb-3">
                <motion.div className="h-full bg-orange-500 rounded-full" initial={{ width: '0%' }} animate={{ width: `${generatingProgress}%` }} transition={{ duration: 0.5 }} />
              </div>
              <p className="text-sm text-slate-400 mb-8">{generatingProgress}% complete</p>
              <AnimatePresence mode="wait">
                <motion.div key={currentTip} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                  className="bg-blue-50 border border-blue-100 rounded-xl px-6 py-4 max-w-sm mx-auto">
                  <p className="text-sm font-medium text-blue-700">💡 {TIPS[currentTip]}</p>
                </motion.div>
              </AnimatePresence>
              <p className="text-xs text-slate-400 mt-6">⚠️ Download your photos when ready — they are deleted after 24 hours</p>
            </motion.div>
          )}

          {/* RESULT */}
          {step === 'result' && originalImage && results.length > 0 && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
                  ✓ {results.length} enhancement{results.length > 1 ? 's' : ''} complete — 1 credit used
                </div>
                <h2 className="text-2xl font-black text-slate-900">Drag the handle to compare</h2>
              </div>

              {results.length > 1 && (
                <div className="flex gap-2 mb-4 flex-wrap justify-center">
                  {results.map(r => (
                    <button key={r.option.id} onClick={() => setActiveResult(r)}
                      className={cn("px-4 py-2 rounded-full text-sm font-bold transition-all",
                        activeResult?.option.id === r.option.id ? "bg-orange-500 text-white" : "bg-white border-2 border-slate-200 text-slate-700 hover:border-orange-300")}>
                      {r.option.emoji} {r.option.label}
                    </button>
                  ))}
                </div>
              )}

              {activeResult && (
                <>
                  <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 aspect-[16/9] mb-4 bg-slate-900">
                    <ImageComparison beforeImage={originalImage} afterImage={activeResult.image} objectFit="contain" />
                  </div>

                  {/* Watermark toggle */}
                  <div className="flex items-center justify-center gap-3 mb-4 bg-slate-100 rounded-xl p-3 max-w-sm mx-auto">
                    <button onClick={() => setWatermarkEnabled(!watermarkEnabled)}
                      className={cn("relative w-10 h-5 rounded-full transition-colors", watermarkEnabled ? "bg-orange-500" : "bg-slate-300")}>
                      <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", watermarkEnabled ? "translate-x-5" : "translate-x-0.5")} />
                    </button>
                    <span className="text-sm text-slate-600">
                      {watermarkEnabled ? <span>Watermark <strong>on</strong> — <span className="text-slate-400">SmartStageAgent.com</span></span> : <span>Watermark <strong>off</strong></span>}
                    </span>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
                    <button onClick={() => handleDownload(activeResult)}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold rounded-xl transition-colors">
                      <Download className="w-5 h-5" /> Download {activeResult.option.label}
                    </button>
                    <button onClick={handleRetry} className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border-2 border-slate-200 transition-colors">
                      <RotateCcw className="w-4 h-4 text-orange-500" /> Try Again (free)
                    </button>
                    <button onClick={handleTryAnother} className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border-2 border-slate-200 transition-colors">
                      <Wand2 className="w-5 h-5 text-orange-500" /> New Enhancements
                    </button>
                    <button onClick={handleReset} className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-500 font-medium rounded-xl border border-slate-200 transition-colors">
                      <Upload className="w-4 h-4" /> New Photo
                    </button>
                  </div>
                  <p className="text-center text-xs text-slate-400 mt-4">
                    ⚠️ Photos deleted after 24 hours — download now. AI-enhanced — disclose as required by your MLS.
                  </p>
                  <div className="mt-3 text-center">
                    <a href="mailto:darren@smartstageagent.com?subject=Photo Enhancement Issue" className="text-xs text-slate-400 hover:text-orange-500 underline transition-colors">
                      Not happy with your result? Contact us — we'll make it right.
                    </a>
                  </div>
                </>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Credit Purchase Modal */}
      <AnimatePresence>
        {showCreditWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-1">Get Credits</h3>
              <p className="text-slate-500 text-sm mb-6">1 credit = unlimited enhancements on one photo batch.</p>
              <div className="space-y-2 mb-4">
                {[
                  { id: '1pack', label: '1 Photo Batch', price: '$5', popular: false },
                  { id: '5pack', label: '5 Photo Batches', price: '$20', popular: true },
                  { id: '10pack', label: '10 Photo Batches', price: '$30', popular: false },
                  { id: '25pack', label: '25 Photo Batches', price: '$50', popular: false },
                ].map(pkg => (
                  <button key={pkg.id} onClick={async () => {
                    if (!email) { setShowCreditWarning(false); setStep('email'); return; }
                    const res = await fetch('/api/checkout', {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ packageId: pkg.id, email })
                    });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  }} className={cn("w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left",
                    pkg.popular ? "border-orange-500 bg-orange-50" : "border-slate-200 hover:border-orange-300")}>
                    <span className="font-bold text-slate-900">
                      {pkg.label}
                      {pkg.popular && <span className="ml-2 text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full uppercase">Best Value</span>}
                    </span>
                    <span className="font-bold text-[#1E3A8A]">{pkg.price}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowCreditWarning(false)} className="w-full text-sm text-slate-500 hover:text-slate-700 py-2">Cancel</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
