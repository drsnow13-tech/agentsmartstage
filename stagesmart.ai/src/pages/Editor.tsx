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
    { id: 'twilight', label: 'Virtual Twilight', description: 'Golden hour sky, warm glowing windows', emoji: '🌅', prompt: 'Transform this exterior photo into a professional real estate twilight shot. Sky: deep blue-to-violet gradient at top fading to warm peach and amber near horizon — rich and dramatic but NOT black or silhouetted. The home facade must remain brightly lit and clearly visible, not dark. All windows: warm golden-amber glow from interior lights. All exterior sconces, porch lights, and landscape lighting: on and glowing warm. Driveway and entry path well illuminated. Lawn retains green color. No part of the house should be silhouetted or underexposed. Result looks like a professional twilight photograph shot at 7:30pm — cinematic but MLS-ready. Keep ALL architectural details, landscaping, and structures exactly identical.' },
    { id: 'grass', label: 'Green the Grass', description: 'Lush vibrant lawn that pops online', emoji: '🌿', prompt: 'Replace all dead, brown, dry, or patchy grass with lush, thick, vibrant deep green grass that looks professionally maintained — uniform thickness, healthy and full. Keep every other element exactly identical: house, driveway, landscaping beds, trees, shrubs, sky, fencing, all structures. Do not alter the color of any non-grass elements. Professional real estate photography.' },
    { id: 'lights', label: 'Turn On Interior Lights', description: 'Warm inviting glow from inside', emoji: '💡', prompt: 'Add realistic warm amber interior lighting glowing through every window as if all interior lights are on. Warm 2700K color temperature, soft and inviting glow visible from outside with light spilling slightly onto the exterior near windows. Do NOT make it overexposed or cartoon-like. Keep all architecture, landscaping, sky, and all other elements exactly identical. Professional real estate photography.' },
    { id: 'sky', label: 'Blue Sky Swap', description: 'Replace overcast sky with bright blue', emoji: '☀️', prompt: 'Replace the existing sky with a vivid sunny-day sky: bright blue with natural white cumulus clouds scattered naturally. Lighting on the house and landscaping must match the new sky — bright directional sunlight with natural shadows. Remove any grey, overcast, or dull sky completely. Keep ALL architectural details, landscaping, driveway, trees, and structures exactly identical. Professional MLS real estate photography.' },
    { id: 'declutter', label: 'Remove Clutter', description: 'Clean up bins, cars, debris', emoji: '🧹', prompt: 'Remove ALL of the following from this exterior: trash cans, recycling bins, vehicles, cars parked in driveway, hoses, yard tools, debris, personal items, sports equipment, and any other clutter. Fill removed areas with seamlessly matching background — driveway, grass, or landscaping. Keep ALL architectural features, landscaping plants, trees, the home itself, and sky exactly identical. Clean professional MLS real estate photography.' },
  ],
  Backyard: [
    { id: 'twilight', label: 'Virtual Twilight', description: 'Stunning evening ambiance', emoji: '🌅', prompt: 'Transform this backyard into a professional real estate twilight shot. Sky: rich blue-violet gradient. String lights or patio lights glowing warm amber. Pool or water features illuminated from within if present. Lawn retains green color, slightly shadowed but not dark. The scene should feel warm, inviting, aspirational — like a lifestyle photo. All structures clearly visible, NOT silhouetted. Ambient warm light fills the space. Keep ALL existing structures, pool, landscaping, fencing, and hardscape exactly identical. Professional real estate photography.' },
    { id: 'grass', label: 'Green the Grass', description: 'Perfect lawn all year round', emoji: '🌿', prompt: 'Replace all dead, brown, or patchy lawn with lush, thick, vibrant deep green grass — professionally maintained, uniform, full coverage. Keep every other element exactly identical: patio, pool, fencing, trees, shrubs, landscaping beds, home exterior, sky, and furniture. Do not change color of any non-grass elements. Professional real estate photography.' },
    { id: 'furniture', label: 'Add Outdoor Furniture', description: 'Stage with patio set and lounge area', emoji: '🪑', prompt: 'Add high-end aspirational outdoor furniture to create a lifestyle staging scene. On any patio or hardscape: a 6-person teak or powder-coated aluminum dining table with cushioned chairs and large market umbrella. In lawn or open area: a deep-seated outdoor sectional or 2 lounge chairs with colorful throw pillows and a low outdoor coffee table with lanterns. Near a pool if present: 2-4 chaise lounge chairs with cushions and side tables. Add large potted tropical plants in ceramic planters to define spaces. All furniture should look expensive, cohesive, and real. Keep ALL existing structures, landscaping, fencing, and architecture exactly identical. Professional real estate photography.' },
  ],
  'Living Room': [
    { id: 'stage-warm', label: 'Warm & Inviting', description: 'Cozy, styled, ready to sell', emoji: '🛋️', prompt: 'Photoreal warm and inviting living room virtual staging. CRITICAL RULES: (1) If there is a fireplace, it must remain 100% visible and unobstructed — position seating to face or flank it, never in front of it. The fireplace must have a warm, glowing fire burning in it. (2) The room must feel full and complete — no bare walls, no empty corners, no large empty floor areas. (3) Never cluttered — thoughtful and curated. FURNITURE: A large plush sofa (cream, warm linen, or camel) and one accent chair (complementary warm tone) arranged to face the fireplace or main focal point. Wood coffee table centered on rug, styled with a lacquered tray holding two candles, a small succulent, and a coffee table book. Two matching end tables each with a table lamp giving warm 2700K amber glow. A large soft area rug (at least 9x12 or larger) centered under ALL seating with front legs of all furniture on the rug. PLANTS: One tall fiddle leaf fig or olive tree (6 feet) in a ceramic pot in one corner. One medium monstera or pothos on a side console or shelf. WALLS: One large statement artwork above the sofa (horizontal, warm-toned landscape, abstract, or botanical). Two smaller framed pieces on the adjacent wall. If fireplace mantle exists: styled with two candlesticks, a small mirror or art, and greenery. TEXTILES: Cozy throw blanket draped casually over one sofa arm. Three decorative pillows in coordinating warm tones and textures. SURFACES: If any wall space remains bare, add a styled console table or bookshelf with books, small plants, and decorative objects. Keep ALL walls, floors, windows, baseboards, ceiling, fireplace, and every architectural detail exactly identical. Warm natural lighting from windows plus warm lamp glow. Wide-angle professional MLS real estate photography.' },
    { id: 'stage-traditional', label: 'Traditional Staging', description: 'Classic, warm, polished', emoji: '🏡', prompt: 'Photoreal warm traditional living room virtual staging. CRITICAL: Fireplace must remain fully visible if present — never blocked. Fire must be burning warmly in any fireplace. Room must feel full with no bare walls or empty corners. FURNITURE: Classic sofa and loveseat in warm cream or sage green, arranged facing the fireplace or focal point. Wood coffee table with fresh floral centerpiece, candles, and decorative box. Two matching table lamps on end tables with warm amber light. Large patterned area rug (classic botanical, Persian-inspired, or subtle geometric in warm tones) centered under all seating. PLANTS: Tall potted plant (fiddle leaf fig or large fern) in one corner. Small potted plant or fresh flowers in a vase on one end table. WALLS: Large framed botanical print or landscape painting above sofa or over fireplace mantle. Framed art gallery arrangement on side wall (2-3 coordinating frames). Fireplace mantle if present: styled with tall candlesticks, a clock or mirror, symmetrical greenery. TEXTILES: Decorative throw pillows in warm coordinating florals or stripes. Throw blanket folded neatly over loveseat arm. Keep ALL walls, floors, windows, and architecture exactly identical. Warm inviting lighting, MLS-ready real estate photography.' },
    { id: 'stage-modern', label: 'Modern Staging', description: 'Clean lines, still warm', emoji: '✨', prompt: 'Photoreal modern warm living room virtual staging. CRITICAL: Fireplace fully visible if present. Room must feel thoughtfully full — no bare walls or empty corners — but clean and uncluttered. FURNITURE: Low-profile sectional sofa in warm light grey or ivory with tight upholstery. Sleek rectangular coffee table in light oak or marble top with a small ceramic vase of greenery and one art book. Large solid-color area rug in warm oatmeal or sage, front legs of all furniture on rug. Minimalist floor lamp with warm light. PLANTS: Medium monstera or snake plant in a modern ceramic pot in one corner. Small trailing pothos on a floating shelf or side table. WALLS: One very large abstract canvas (warm neutral tones) above sofa. Clean floating shelves on adjacent wall styled with small sculptures, books, and a small plant. If fireplace: simple clean mantle with one large ceramic vase and minimal decor. SURFACES: Low media console or credenza against any bare wall. Keep ALL walls, floors, windows, and architecture exactly identical. Bright warm natural lighting, MLS-ready real estate photography.' },
    { id: 'declutter', label: 'Declutter & Clean', description: 'Remove furniture, personal items', emoji: '🧹', prompt: 'Remove ALL existing furniture, personal items, decor, rugs, and clutter from this room. Keep walls, floors, baseboards, windows, doors, ceiling, fireplace, built-in shelving, and every architectural feature exactly identical. Result: completely empty, bright, clean room. Improve overall brightness. Professional real estate photography.' },
    { id: 'brighten', label: 'Brighten & Enhance', description: 'More light, better colors', emoji: '💫', prompt: 'Dramatically brighten this living room. Maximize the appearance of natural light coming through every window — make windows look bright and airy. Improve white balance to warm and inviting (not blue/cool). Boost vibrancy and contrast. Reduce shadows and dark corners. Keep every piece of furniture, every decor item, every architectural element exactly identical in position and appearance — only improve brightness, warmth, and color quality. Professional real estate photography.' },
  ],
  'Dining Room': [
    { id: 'stage-warm', label: 'Warm & Inviting', description: 'Styled dining, ready to entertain', emoji: '🍽️', prompt: 'Photoreal warm and inviting dining room virtual staging. CRITICAL RULES: (1) Room must feel full — no bare walls or empty corners. (2) Area rug MUST extend at least 24 inches beyond all sides of the table to accommodate pulled-out chairs. FURNITURE: Rectangular dining table in warm walnut or white oak (seats 6). Six fully upholstered dining chairs in cream, warm taupe, or sage — two at each end, two on each side. A LARGE area rug in a warm-toned subtle pattern, centered under the entire table and extending 24+ inches on ALL sides. Statement chandelier or cluster pendant above table center with warm amber light. CENTERPIECE: Fresh flowers in a low vase (white peonies or greenery), two tall taper candles in candlesticks, small decorative object. WALLS: One large landscape, abstract, or floral artwork on the primary wall. Mirror or art arrangement on secondary wall. STORAGE: Sideboard or buffet against one wall, styled with a large mirror above it, two table lamps or candlesticks on top, and a small plant. CORNERS: Tall potted plant (fiddle leaf fig or bird of paradise) in at least one corner. Keep ALL walls, floors, windows, and architecture exactly identical. Warm inviting lighting, MLS-ready real estate photography.' },
    { id: 'stage-traditional', label: 'Traditional Staging', description: 'Classic, elegant dining room', emoji: '🏡', prompt: 'Photoreal warm traditional dining room virtual staging. Room must feel full and elegant — no bare walls or empty corners. RUG RULE: Must extend 24+ inches beyond all sides of table. FURNITURE: Dark mahogany or walnut rectangular dining table. Six classic upholstered chairs in cream or soft sage with nail-head trim. Large classic patterned area rug (Oriental or floral-inspired) centered under full table extending 24+ inches all sides. Crystal or antler chandelier with warm light above. CENTERPIECE: Tall elegant floral arrangement, silver candelabra with white tapers. STORAGE: Dark wood sideboard against one wall with a large ornate mirror above. Silver or crystal accent pieces and a small plant on sideboard top. WALLS: Large traditional landscape or oil-style painting on main wall. Gallery wall of framed botanical prints on secondary wall. CORNERS: Large potted plant or decorative tall vase with branches. Keep ALL walls, floors, windows, architecture exactly identical. Warm elegant lighting, MLS-ready real estate photography.' },
    { id: 'stage-modern', label: 'Modern Staging', description: 'Clean, warm dining', emoji: '✨', prompt: 'Photoreal modern warm dining room virtual staging. Room must feel intentionally full — not sparse. RUG RULE: Must extend 24+ inches beyond all sides of the table. FURNITURE: Light oak or white rectangular table. Six Wishbone-style or minimalist upholstered chairs in warm grey or natural rattan. Large solid-color rug in warm oatmeal or soft terracotta extending 24+ inches all sides. Sculptural geometric pendant light in matte black or brass above table. CENTERPIECE: Simple low ceramic vase with eucalyptus or greenery. STORAGE: Low credenza or sideboard against one wall in light wood. WALLS: One very large abstract painting on main wall. Simple floating shelves with ceramics and small plants on secondary wall. CORNERS: One tall plant in a modern ceramic pot. Keep ALL walls, floors, windows, architecture exactly identical. Bright warm lighting, MLS-ready real estate photography.' },
    { id: 'declutter', label: 'Declutter & Clean', description: 'Remove furniture, personal items', emoji: '🧹', prompt: 'Remove ALL existing furniture, personal items, and clutter. Keep walls, floors, windows, and all architectural features exactly identical. Brighten the room. Result: bright clean empty room. Professional real estate photography.' },
  ],
  'Kitchen': [
    { id: 'stage-warm', label: 'Warm & Styled', description: 'Curated, cozy kitchen', emoji: '🛋️', prompt: 'Photoreal warm and inviting kitchen staging. First, remove ALL clutter from every countertop — small appliances, dishes, papers, mail, everything. Then add a curated, intentional lifestyle styling that feels like a real home, not a showroom: Near the window or brightest spot: a small terracotta pot with fresh herbs (basil, rosemary). On the main counter run: a wooden end-grain cutting board leaned against the backsplash, a ceramic crock with wooden spoons, a bowl of fresh lemons or green apples. Near the sink: a small glass vase with 3-5 stems of fresh flowers (white tulips or small greenery). On any open shelving: neatly stacked plates, small plants, a few cookbooks. Folded linen dish towel draped over oven handle. If there is space above cabinets: add large ceramic urns or woven baskets. Keep ALL cabinets, appliances (fridge, stove, microwave, dishwasher), countertops, backsplash, sink, hardware, and every architectural detail exactly identical. Warm bright professional real estate photography.' },
    { id: 'brighten', label: 'Brighten & Enhance', description: 'More light, better colors', emoji: '💫', prompt: 'Dramatically brighten this kitchen. Make it look as light and airy as possible. Enhance natural light through windows — windows should look bright white-bright, not dark. Improve white balance to warm and clean (not yellow or blue). Make white cabinets look crisp white, marble or quartz countertops look bright and clean, stainless steel look polished. Boost overall vibrancy. Reduce all shadows especially under upper cabinets. Keep ALL cabinets, appliances, countertops, backsplash, sink, and every architectural element exactly identical in position and style — only improve brightness and color. Professional real estate photography.' },
    { id: 'declutter', label: 'Declutter Countertops', description: 'Clean minimal counters', emoji: '🧹', prompt: 'Remove ALL items from countertops — every small appliance (toaster, coffee maker, knife block, etc.), dishes, food items, papers, mail, personal items, everything. Keep all built-in appliances (refrigerator, stove/oven, dishwasher, built-in microwave), all cabinets, countertops, backsplash, sink, faucet, and all architectural features exactly identical. Add only minimal warm styling: one small potted herb in a simple pot, one small bowl of fresh fruit. Result: clean, spacious, minimally styled countertops. Professional real estate photography.' },
  ],
  'Bedroom': [
    { id: 'stage-warm', label: 'Warm & Inviting', description: 'Luxurious, cozy, beautifully styled', emoji: '🛋️', prompt: 'Photoreal warm and inviting master bedroom virtual staging. CRITICAL: Room must feel full, cozy, and complete — no bare walls, no empty corners, no large empty floor areas. BED: King or queen upholstered headboard bed (cream, warm grey, or camel velvet) positioned against main wall. Hotel-quality layered bedding: crisp white duvet, white fitted sheet visible at corners, topped with a warm-toned linen coverlet folded back 1/3 of the way down. Styling: Three Euro shams stacked against headboard, two standard shams in front, two to three decorative throw pillows in varying sizes and coordinating warm textures. Cozy chunky-knit or linen throw blanket folded neatly across foot of bed. NIGHTSTANDS: Two matching wood or upholstered nightstands (one each side). Each with: a table lamp with warm amber shade giving 2700K glow, a small stack of 2 books, a small potted plant or fresh flowers in a bud vase on one side. RUG: Large soft area rug (at minimum 9x12) centered under bed and extending at least 24 inches beyond foot and 18 inches beyond both sides. PLANTS: Tall fiddle leaf fig or olive tree (5-6 feet) in one corner in a woven or ceramic pot. WALLS: One large framed art piece centered above headboard (landscape, abstract, or botanical in warm tones). One or two smaller coordinating framed pieces on adjacent wall. ADDITIONAL FURNITURE: Upholstered bench or folded blanket at foot of bed if space allows. Dresser or accent chair in another corner. Keep ALL walls, floors, windows, and every architectural detail exactly identical. Warm natural window light plus warm lamp glow. Wide-angle professional MLS real estate photography.' },
    { id: 'stage-traditional', label: 'Traditional Staging', description: 'Classic, polished, elegant', emoji: '🏡', prompt: 'Photoreal warm traditional master bedroom virtual staging. Room must feel full and elegant — no empty corners or bare walls. BED: Classic wood or upholstered headboard bed with layered white and cream bedding — white duvet, cream coverlet folded at foot, multiple Euro shams and decorative pillows in soft florals or stripes. Folded quilt across foot of bed. NIGHTSTANDS: Two matching wood nightstands with traditional table lamps, small potted plant or flowers on one, stack of books on both. RUG: Large soft patterned area rug (botanical or subtle Persian) extending well under and beyond bed on all sides. PLANTS: Tall fern or potted plant in corner. Fresh flowers in a vase on one nightstand. WALLS: Framed botanical print or landscape painting above headboard. Small framed art on side walls. ADDITIONAL: Upholstered bench at foot of bed. A small armchair or ottoman in corner if space. Keep ALL walls, floors, windows, architecture exactly identical. Warm elegant lighting, MLS-ready real estate photography.' },
    { id: 'brighten', label: 'Brighten & Enhance', description: 'More light, better colors', emoji: '💫', prompt: 'Dramatically brighten this bedroom. Make windows look as light and airy as possible. Warm up the white balance to feel inviting, not cold. Make white bedding look crisp bright white. Boost vibrancy. Reduce shadows in corners. Keep every piece of furniture, every decor item, and every architectural element exactly identical — only improve brightness, warmth, and color quality. Professional real estate photography.' },
    { id: 'declutter', label: 'Declutter & Clean', description: 'Remove clutter, personal items', emoji: '🧹', prompt: 'Remove ALL personal items, clutter, clothes, laundry, items on nightstands (except lamps), items on dressers, and anything personal from this bedroom. Keep all furniture (bed frame, headboard, nightstands, dressers, mirrors) exactly identical in position. Result: clean, tidy, depersonalized bedroom. Improve brightness. Professional real estate photography.' },
  ],
  'Bathroom': [
    { id: 'stage-warm', label: 'Spa-Like Styling', description: 'Luxurious, clean, resort feel', emoji: '🛁', prompt: 'Photoreal warm and inviting bathroom virtual staging. Transform this bathroom into a spa-like, resort-quality space. TOWELS: Fluffy white towels neatly arranged — two bath towels folded and stacked on towel bar or ladder rack, hand towels folded precisely over towel rings. VANITY: Completely clear all clutter. Add: a small glass or ceramic tray holding a diffuser, a small plant (pothos or air plant in small pot), a designer hand soap dispenser. BATHTUB if present: Clean and sparkling. Add a wooden tub tray across the tub with a white candle, a small plant, and a folded washcloth. SHOWER: Clean glass, bright interior. PLANTS: Small pothos or fern on vanity edge or window sill. Snake plant or peace lily in corner if floor space allows. LIGHTING: Maximize brightness — vanity lights fully on, bright and flattering. WALLS: If any bare wall space: one small framed botanical print or simple artwork. Keep ALL tile, fixtures, vanity cabinets, tub, shower, mirror, and all architectural elements exactly identical. Bright warm professional real estate photography.' },
    { id: 'brighten', label: 'Brighten & Enhance', description: 'Clean, bright, fresh', emoji: '💫', prompt: 'Dramatically brighten this bathroom. Make tile grout look clean and white. Make fixtures look polished and sparkling. Make mirror look crystal clear. Enhance the quality of light from vanity fixtures. Make the overall space feel clean, fresh, and well-maintained. Keep ALL tile, fixtures, vanity, tub, shower, mirror, and all architectural elements exactly identical. Professional real estate photography.' },
    { id: 'declutter', label: 'Declutter & Clean', description: 'Remove personal items', emoji: '🧹', prompt: 'Remove ALL personal items from this bathroom — toiletries, shampoo bottles, razors, makeup, towels used and messy, items on vanity counter, items in shower. Keep all fixtures, tile, vanity cabinets, tub, shower, mirror, toilet, and architectural features exactly identical. Add only: neatly folded white towels on towel bar, a small plant on vanity. Result: clean, depersonalized, spa-like bathroom. Professional real estate photography.' },
  ],
  default: [
    { id: 'stage-warm', label: 'Warm & Inviting', description: 'Cozy, styled, ready to sell', emoji: '🛋️', prompt: 'Photoreal warm and inviting virtual staging. CRITICAL RULES: (1) If there is a fireplace, keep it 100% visible — never block with furniture. The fireplace must have a warm, crackling fire burning in it. (2) Room must feel full and complete — no bare walls, no empty corners, no large empty floor areas — but never cluttered. FURNITURE: Add appropriate furniture for this room type in warm cream, camel, sage, and wood tones. Include a large area rug under any seating or dining furniture. PLANTS: Tall potted plant (fiddle leaf fig or olive tree) in one corner. Medium plant on a surface or shelf. WALLS: Art on every wall — one large statement piece and one or two smaller accent pieces. LIGHTING: Table lamps or pendant lights with warm 2700K amber glow. SURFACES: Styled coffee tables, consoles, or sideboards with trays, books, candles, and small decorative objects. Keep ALL walls, floors, windows, and architecture exactly identical. Warm inviting lighting, MLS-ready real estate photography.' },
    { id: 'stage-traditional', label: 'Traditional Staging', description: 'Classic, warm, polished', emoji: '🏡', prompt: 'Photoreal warm traditional virtual staging. Fireplace fully visible if present. No empty corners or bare walls. Add classic furniture in warm cream and mahogany wood tones, large patterned area rug under seating, matching table lamps with warm light, tall and small potted plants, framed botanical or landscape art on all walls, styled surfaces. Keep ALL walls, floors, windows, and architecture exactly identical. Warm elegant lighting, MLS-ready real estate photography.' },
    { id: 'stage-modern', label: 'Modern Staging', description: 'Clean lines, still warm', emoji: '✨', prompt: 'Photoreal modern yet warm virtual staging. Fireplace fully visible if present. Room feels thoughtfully full — no bare walls or empty corners. Add contemporary furniture in warm light grey and ivory, a large solid-color area rug, one very large abstract artwork, plants in modern ceramic pots in corners, and styled surfaces against any bare wall. Keep ALL walls, floors, windows, and architecture exactly identical. Bright warm lighting, MLS-ready real estate photography.' },
    { id: 'declutter', label: 'Declutter & Clean', description: 'Remove furniture, personal items', emoji: '🧹', prompt: 'Remove ALL existing furniture, personal items, decor, and clutter. Keep walls, floors, windows, doors, ceiling, fireplace (with fire burning if present), and all architectural features exactly identical. Brighten the room. Result: completely empty, bright, clean room. Professional real estate photography.' },
    { id: 'brighten', label: 'Brighten & Enhance', description: 'More light, better colors', emoji: '💫', prompt: 'Dramatically brighten this room. Maximize natural light from all windows. Warm up the white balance. Boost vibrancy and reduce shadows. Keep all furniture, decor, and architectural elements exactly identical — only improve the lighting and color quality. Professional real estate photography.' },
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
