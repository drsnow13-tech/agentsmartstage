import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Wand2, Loader2, Download, RotateCcw, Sparkles, AlertCircle, Mail, Info, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageComparison } from '../components/ImageComparison';
import { cn } from '../lib/utils';

type RoomType = 'Exterior' | 'Backyard' | 'Rooftop Terrace' | 'Balcony' | 'Living Room' | 'Dining Room' | 'Kitchen' | 'Bedroom' | 'Bathroom' | 'Home Office' | 'Other';
type Step = 'upload' | 'email' | 'options' | 'generating' | 'result';

// ═══ OUTDOOR TOGGLE SYSTEM ═══
interface OutdoorToggle {
  id: string; label: string; emoji: string; description: string;
  promptFragment: string; conflicts?: string[];
}

const EXTERIOR_TOGGLES: OutdoorToggle[] = [
  { id: 'twilight', label: 'Virtual Twilight', emoji: '🌅', description: 'Golden hour sky, warm glowing windows',
    promptFragment: 'Replace the sky with a rich blue-violet gradient fading to warm peach-amber at the horizon. Make all windows glow warm golden-amber from interior lights. Turn on all exterior sconces, porch lights, and landscape lighting. House facade brightly lit — not silhouetted. Lawn stays green.',
    conflicts: ['sky'] },
  { id: 'sky', label: 'Blue Sky', emoji: '☀️', description: 'Bright blue sky with clouds',
    promptFragment: 'Replace the sky with a vivid bright blue sky with natural white cumulus clouds. Adjust lighting on the house to match — bright directional sunlight with natural shadows.',
    conflicts: ['twilight'] },
  { id: 'grass', label: 'Green Grass', emoji: '🌿', description: 'Lush vibrant green lawn',
    promptFragment: 'Replace all dead, brown, dry, or patchy grass with lush, thick, vibrant deep green grass — uniform and full.' },
  { id: 'lights', label: 'Lights On', emoji: '💡', description: 'Warm interior glow through windows',
    promptFragment: 'Add warm amber interior lighting glowing through every window — soft inviting glow with light spilling slightly onto exterior.',
    conflicts: ['twilight'] },
  { id: 'brighten', label: 'Brighten Photo', emoji: '💫', description: 'Boost exposure, warm & vibrant',
    promptFragment: 'Brighten the overall photo — boost exposure, warm white balance, enhance colors, reduce harsh shadows.' },
  { id: 'declutter', label: 'Remove Clutter', emoji: '🧹', description: 'Remove bins, vehicles, debris',
    promptFragment: 'Remove all trash cans, recycling bins, vehicles, hoses, yard tools, debris, and personal items. Fill removed areas with matching background.' },
];

const BACKYARD_TOGGLES: OutdoorToggle[] = [
  { id: 'twilight', label: 'Virtual Twilight', emoji: '🌅', description: 'Twilight sky, warm ambient lighting',
    promptFragment: 'Replace sky with rich blue-violet twilight gradient. Add warm string lights or patio lights glowing amber. Illuminate pool from within if present. Warm inviting scene.',
    conflicts: ['sky'] },
  { id: 'sky', label: 'Blue Sky', emoji: '☀️', description: 'Bright blue sky',
    promptFragment: 'Replace sky with vivid bright blue sky with natural clouds. Match lighting to sunny day.',
    conflicts: ['twilight'] },
  { id: 'grass', label: 'Green Grass', emoji: '🌿', description: 'Lush green lawn',
    promptFragment: 'Replace all dead or patchy lawn with lush vibrant deep green grass — uniform full coverage.' },
  { id: 'furniture', label: 'Add Furniture', emoji: '🪑', description: 'Outdoor dining & lounge set',
    promptFragment: 'Add high-end outdoor furniture: teak dining table with cushioned chairs and umbrella on patio. Deep-seated sectional with throw pillows in lawn area. Chaise lounges near pool if present. Large potted plants.' },
  { id: 'brighten', label: 'Brighten Photo', emoji: '💫', description: 'Boost exposure & vibrancy',
    promptFragment: 'Brighten overall photo — boost exposure, warm white balance, enhance vibrancy.' },
  { id: 'declutter', label: 'Remove Clutter', emoji: '🧹', description: 'Remove debris & personal items',
    promptFragment: 'Remove all trash, debris, toys, hoses, tools, personal items. Fill removed areas with matching background.' },
];

const ROOFTOP_TOGGLES: OutdoorToggle[] = [
  { id: 'twilight', label: 'Virtual Twilight', emoji: '🌅', description: 'Cinematic dusk skyline',
    promptFragment: 'Replace sky with deep blue-violet twilight gradient, warm amber horizon. City lights glowing in background. Add warm Edison bulb string lights overhead.',
    conflicts: ['sky'] },
  { id: 'sky', label: 'Blue Sky', emoji: '☀️', description: 'Bright blue sky',
    promptFragment: 'Replace sky with vivid bright blue sky with natural clouds.',
    conflicts: ['twilight'] },
  { id: 'turf', label: 'Add Turf', emoji: '🌿', description: 'Artificial turf on terrace',
    promptFragment: 'Add realistic bright green artificial turf covering main terrace floor. Professional installation, clean edges.' },
  { id: 'furniture', label: 'Add Furniture', emoji: '🪑', description: 'Lounge & dining set',
    promptFragment: 'Add modern outdoor sectional in grey fabric with throw pillows facing best view. Low coffee table with lanterns. Round dining table with 4 chairs. Tall ornamental grasses in modern planters.' },
  { id: 'brighten', label: 'Brighten Photo', emoji: '💫', description: 'Boost exposure & vibrancy',
    promptFragment: 'Brighten overall photo — boost exposure, warm white balance, enhance vibrancy.' },
  { id: 'declutter', label: 'Remove Clutter', emoji: '🧹', description: 'Remove debris',
    promptFragment: 'Remove all trash, construction debris, clutter. Fill with matching background.' },
];

const BALCONY_TOGGLES: OutdoorToggle[] = [
  { id: 'twilight', label: 'Virtual Twilight', emoji: '🌅', description: 'Twilight sky, warm glow',
    promptFragment: 'Replace sky with rich blue-violet twilight, warm amber horizon. Add warm ambient lighting.',
    conflicts: ['sky'] },
  { id: 'sky', label: 'Blue Sky', emoji: '☀️', description: 'Bright blue sky',
    promptFragment: 'Replace sky with vivid bright blue sky with natural clouds.',
    conflicts: ['twilight'] },
  { id: 'furniture', label: 'Add Furniture', emoji: '🪑', description: 'Bistro set & plants',
    promptFragment: 'Add small bistro table with 2 chairs. String lights along railing. Potted plants — trailing ivy, herbs in terracotta — along railing and corners. Small lantern on table.' },
  { id: 'brighten', label: 'Brighten Photo', emoji: '💫', description: 'Boost exposure & vibrancy',
    promptFragment: 'Brighten overall photo — boost exposure, warm white balance, enhance vibrancy.' },
  { id: 'declutter', label: 'Remove Clutter', emoji: '🧹', description: 'Remove personal items',
    promptFragment: 'Remove all clutter and personal items. Fill with matching background.' },
];

function getToggles(roomType: RoomType | null): OutdoorToggle[] | null {
  const map: Record<string, OutdoorToggle[]> = { 'Exterior': EXTERIOR_TOGGLES, 'Backyard': BACKYARD_TOGGLES, 'Rooftop Terrace': ROOFTOP_TOGGLES, 'Balcony': BALCONY_TOGGLES };
  return map[roomType || ''] || null;
}

function buildTogglePrompt(toggles: OutdoorToggle[], ids: string[]): string {
  const frags = toggles.filter(t => ids.includes(t.id)).map(t => t.promptFragment);
  return `${frags.join(' ')} Keep all architecture, structures, landscaping, and layout identical. Professional MLS real estate photography.`;
}

function isOutdoor(rt: RoomType | null): boolean { return ['Exterior', 'Backyard', 'Rooftop Terrace', 'Balcony'].includes(rt || ''); }

// ═══ INDOOR OPTIONS — single-shot or 4-style variations ═══
interface StyleVariant { name: string; prompt: string; }
interface IndoorOption { id: string; label: string; description: string; emoji: string; type: 'single' | 'styled'; prompt?: string; styles?: StyleVariant[]; }

const CEIL = 'Keep all ceiling fixtures, fans, and lighting as-is.';

const LIVING_ROOM_OPTIONS: IndoorOption[] = [
  { id: 'stage-lr', label: 'Stage as Living Room', emoji: '🛋️', description: '4 design styles to choose from', type: 'styled', styles: [
    { name: 'Modern Minimal', prompt: `Virtual stage as a modern minimalist living room. Low-profile cream linen sofa centered against the longest solid wall. Slim walnut coffee table on a light neutral rug. Accent chair in far corner facing sofa. Large abstract art above sofa. Tall fiddle leaf fig in opposite corner. Simple table lamps. All furniture against walls — center floor open, doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Bright warm light. Professional MLS photo.` },
    { name: 'Warm Traditional', prompt: `Virtual stage as a warm traditional living room. Plush camel leather sofa centered against longest solid wall. Dark wood coffee table with books and candles on large patterned rug. Two upholstered chairs in far corners. Brass table lamps. Gallery of warm landscape paintings. Throw blanket and earth-tone pillows. Tall plant in corner. All furniture against walls — center open, doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Warm ambient light. Professional MLS photo.` },
    { name: 'Coastal Casual', prompt: `Virtual stage as a bright coastal living room. White slipcovered sofa centered against longest solid wall. Driftwood coffee table on jute rug. Rattan accent chair in far corner. Blue-white throw pillows. Woven baskets, coastal art above sofa. Palm in ceramic pot in corner. All furniture against walls — center open, doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Bright airy light. Professional MLS photo.` },
    { name: 'Contemporary Bold', prompt: `Virtual stage as a contemporary living room. Deep charcoal velvet sectional against longest solid wall. White marble coffee table on geometric black-white rug. Mustard accent chair in far corner. Oversized abstract art above sofa. Chrome floor lamp. Bird of paradise in black pot in corner. All furniture against walls — center open, doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Warm directional light. Professional MLS photo.` },
  ]},
  { id: 'stage-gr', label: 'Stage as Game Room', emoji: '🎱', description: 'Pool table, bar, lounge', type: 'styled', styles: [
    { name: 'Classic Pub', prompt: `Virtual stage as a classic game room. Pool table centered. Dark wood bar cabinet with glassware against one wall. Two leather club chairs in far corner. Vintage sports art. Edison pendant lighting. Doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Warm inviting light. Professional MLS photo.` },
    { name: 'Modern Lounge', prompt: `Virtual stage as a modern game room. Shuffleboard centered. Sleek bar cart against one wall. Two velvet chairs in far corner. Bold neon-style art. Mixed metals. Doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Warm ambient light. Professional MLS photo.` },
    { name: 'Sports Den', prompt: `Virtual stage as a sports den. Poker table with 6 chairs centered. Bar shelving against one wall. Two recliners in far corner. Sports memorabilia on walls. Large area rug. Doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Warm light. Professional MLS photo.` },
    { name: 'Entertainment Hub', prompt: `Virtual stage as entertainment room. Foosball table centered. Bar counter against one wall. Two bean bags in far corner. Pop art and gaming posters. Fun accent lighting. Doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Vibrant light. Professional MLS photo.` },
  ]},
  { id: 'stage-mr', label: 'Stage as Media Room', emoji: '🎬', description: 'Theater-style, cinematic', type: 'styled', styles: [
    { name: 'Home Theater', prompt: `Virtual stage as home theater. Large TV on primary wall with flanking shelves. Deep charcoal sectional against back wall facing TV. Dark area rug. Low ottoman with candles. Side tables with amber lamps. Throw blankets. Doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Warm dim amber atmosphere. Professional MLS photo.` },
    { name: 'Cozy Screening', prompt: `Virtual stage as cozy screening room. Large TV on main wall. Two oversized recliners and loveseat in navy facing screen against walls. Plush rug. Side tables with lamps. Movie posters in frames. Doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Soft warm light. Professional MLS photo.` },
    { name: 'Modern Lounge', prompt: `Virtual stage as modern media lounge. Wall-mounted TV on primary wall. L-shaped grey sectional against back and side walls. Minimal coffee table. Bookshelf on side wall. Plants and warm accents. Doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Bright warm atmosphere. Professional MLS photo.` },
    { name: 'Family Room', prompt: `Virtual stage as family media room. Large TV on main wall. Oversized cream sofa against back wall. Two soft blue accent chairs. Coffee table with board games. Warm rug. Doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Bright welcoming light. Professional MLS photo.` },
  ]},
  { id: 'stage-ho', label: 'Stage as Home Office', emoji: '💼', description: 'Desk, shelves, productive', type: 'styled', styles: [
    { name: 'Executive', prompt: `Virtual stage as executive office. Large walnut desk facing room near window. Leather desk chair. Bookshelf against one wall with books and plants. Tall fiddle leaf fig in corner. Landscape art above desk. Warm desk lamp. Doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Warm productive light. Professional MLS photo.` },
    { name: 'Creative Studio', prompt: `Virtual stage as creative office. White standing desk near window. Modern mesh chair. Floating shelves with plants and art books. Accent chair in corner. Monstera plant. Doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Bright airy light. Professional MLS photo.` },
    { name: 'Cozy Study', prompt: `Virtual stage as cozy study. Dark wood writing desk against wall near window. Tufted leather chair. Floor-to-ceiling bookshelves on adjacent wall. Reading chair with ottoman in far corner. Brass desk lamp. Persian rug. Doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Warm amber light. Professional MLS photo.` },
    { name: 'Modern Minimal', prompt: `Virtual stage as minimal office. Slim oak desk along one wall. Ergonomic chair. Single floating shelf above desk. One large abstract art. Small plant on desk. Clean and uncluttered. Doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Bright clean light. Professional MLS photo.` },
  ]},
  { id: 'remove-furniture', label: 'Remove All Furniture', emoji: '🗑️', description: 'Empty room, brightened', type: 'single',
    prompt: `Remove ALL furniture, rugs, curtains, and decor. Keep walls, floors, windows, doors, and architecture identical. ${CEIL} Brighten dramatically. Empty, bright, clean room. Professional real estate photo.` },
  { id: 'declutter', label: 'Declutter & Clean', emoji: '✨', description: 'Remove personal items, brighten', type: 'single',
    prompt: `Remove all personal items, clutter, loose objects — keep furniture in place. Remove clothes, toys, photos, papers. ${CEIL} Brighten dramatically. Clean, depersonalized room. Professional real estate photo.` },
  { id: 'brighten', label: 'Brighten & Enhance', emoji: '💫', description: 'Better lighting & color only', type: 'single',
    prompt: `Brighten this room photo. Maximize natural window light. Warm white balance. Reduce shadows. Keep everything exactly as-is. Only change lighting and color. Professional real estate photo.` },
];

const DINING_ROOM_OPTIONS: IndoorOption[] = [
  { id: 'stage-dr', label: 'Stage as Dining Room', emoji: '🍽️', description: '4 design styles', type: 'styled', styles: [
    { name: 'Classic Elegant', prompt: `Virtual stage as elegant dining room. Rectangular walnut table seating 6 centered on large area rug. Six cream upholstered chairs. Fresh white flowers centerpiece. Sideboard against one wall with mirror above. Tall plant in corner. Doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Warm inviting light. Professional MLS photo.` },
    { name: 'Modern Farmhouse', prompt: `Virtual stage as farmhouse dining room. Reclaimed wood table seating 8 on jute rug. Mix of upholstered end chairs and wooden side chairs. Mason jar wildflowers. Rustic sideboard with greenery. Doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Bright natural light. Professional MLS photo.` },
    { name: 'Contemporary', prompt: `Virtual stage as contemporary dining room. Round white marble table with 4 sculptural chairs on geometric rug. Minimal single-stem centerpiece. Abstract art on main wall. Tall plant in corner. Doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Bright clean light. Professional MLS photo.` },
    { name: 'Breakfast Nook', prompt: `Virtual stage as breakfast nook. Round light oak table with 4 rattan chairs on textured rug. Wildflowers and candle on table. Potted herbs on windowsill. Bright casual atmosphere. Doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Bright morning light. Professional MLS photo.` },
  ]},
  { id: 'remove-furniture', label: 'Remove Furniture', emoji: '🗑️', description: 'Empty, brightened', type: 'single',
    prompt: `Remove ALL furniture, rugs, decor. Keep walls, floors, windows, doors identical. ${CEIL} Brighten dramatically. Professional real estate photo.` },
  { id: 'declutter', label: 'Declutter', emoji: '✨', description: 'Remove personal items', type: 'single',
    prompt: `Remove personal items and clutter — keep furniture. ${CEIL} Brighten. Professional real estate photo.` },
  { id: 'brighten', label: 'Brighten', emoji: '💫', description: 'Better lighting only', type: 'single',
    prompt: `Brighten this dining room. Maximize natural light, warm white balance. Keep everything as-is. Professional real estate photo.` },
];

const KITCHEN_OPTIONS: IndoorOption[] = [
  { id: 'style-kitchen', label: 'Style Countertops', emoji: '🍳', description: '4 different styling looks', type: 'styled', styles: [
    { name: 'Farmhouse Warm', prompt: `On existing countertops add: wooden cutting board against backsplash, ceramic crock with wooden spoons, bowl of green apples. Small herb near window. Linen towel on oven handle. Brighten photo. Keep all cabinets, appliances, layout identical. ${CEIL} Professional real estate photo.` },
    { name: 'Mediterranean', prompt: `On existing countertops add: marble fruit bowl with lemons, two white pots with herbs, glass olive oil bottle. Linen towel on oven handle. Brighten photo. Keep all cabinets, appliances, layout identical. ${CEIL} Professional real estate photo.` },
    { name: 'Rustic Baker', prompt: `On existing countertops add: copper tea kettle on stove, wooden bread board with artisan bread, succulent in terra cotta pot. Brighten photo. Keep all cabinets, appliances, layout identical. ${CEIL} Professional real estate photo.` },
    { name: 'Café Morning', prompt: `On existing countertops add: white cake stand with pastries, French press coffee maker, small glass vase with white flowers, cookbook propped open. Brighten photo. Keep all cabinets, appliances, layout identical. ${CEIL} Professional real estate photo.` },
  ]},
  { id: 'declutter', label: 'Declutter Counters', emoji: '🧹', description: 'Clear counters, add herb & fruit', type: 'single',
    prompt: `Remove all loose items from countertops. Leave counters clear except one small herb and one bowl of fruit. Keep all cabinets, appliances, layout as-is. Brighten photo. ${CEIL} Professional real estate photo.` },
  { id: 'brighten', label: 'Brighten & Enhance', emoji: '💫', description: 'Better lighting, nothing moved', type: 'single',
    prompt: `Brighten this kitchen. Maximize window light, warm whites, reduce shadows under cabinets. Keep every item in place. Only change lighting. ${CEIL} Professional real estate photo.` },
];

const BEDROOM_OPTIONS: IndoorOption[] = [
  { id: 'stage-bed', label: 'Stage as Bedroom', emoji: '🛏️', description: '4 design styles', type: 'styled', styles: [
    { name: 'Hotel Luxury', prompt: `Virtual stage as luxury bedroom. King upholstered cream headboard centered on widest solid wall. Crisp white duvet with warm coverlet. Euro shams and pillows. Matching nightstands with amber lamps. Large rug under bed. Bench at foot. Plant in far corner. Art above headboard. All against walls — doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Warm light plus lamp glow. Professional MLS photo.` },
    { name: 'Warm Bohemian', prompt: `Virtual stage as bohemian bedroom. Queen rattan headboard centered on widest solid wall. Earth-tone textiles — terracotta, cream, sage. Mismatched wood nightstands with eclectic lamps. Woven wall hanging above bed. Plants in macrame hangers. Jute rug. All against walls — doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Warm golden light. Professional MLS photo.` },
    { name: 'Modern Clean', prompt: `Virtual stage as modern bedroom. Queen oak platform bed centered on widest solid wall. White bedding with single accent color. Slim matching nightstands with modern lamps. One large abstract art above bed. Single plant in corner. Minimal. All against walls — doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Bright clean light. Professional MLS photo.` },
    { name: 'Classic Elegant', prompt: `Virtual stage as classic bedroom. King tufted grey headboard centered on widest solid wall. Traditional white bedding with silk pillows. Dark wood nightstands and dresser against walls. Crystal lamps. Landscape art above bed. Plush rug. All against walls — doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Soft warm light. Professional MLS photo.` },
  ]},
  { id: 'stage-nursery', label: 'Stage as Nursery', emoji: '🍼', description: 'Crib, rocker, soft decor', type: 'single',
    prompt: `Virtual stage as nursery. White crib against widest solid wall. Cream glider chair in far corner with side table and lamp. Light wood dresser against another wall. Soft patterned rug. Framed animal art above crib. Small plant on dresser. Doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Soft gentle light. Professional MLS photo.` },
  { id: 'stage-ho', label: 'Stage as Home Office', emoji: '💼', description: 'Desk, chair, productive', type: 'single',
    prompt: `Virtual stage as home office. Oak desk near window. Ergonomic chair. Bookshelf against wall. Large art. Desk lamp. Plants. Doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Warm light. Professional MLS photo.` },
  { id: 'remove-furniture', label: 'Remove Furniture', emoji: '🗑️', description: 'Empty, brightened', type: 'single',
    prompt: `Remove ALL furniture, rugs, decor. Keep walls, floors, windows, doors identical. ${CEIL} Brighten dramatically. Professional real estate photo.` },
  { id: 'declutter', label: 'Declutter', emoji: '✨', description: 'Remove personal items', type: 'single',
    prompt: `Remove personal items, clutter, clothes, laundry — keep furniture. ${CEIL} Brighten. Professional real estate photo.` },
  { id: 'brighten', label: 'Brighten', emoji: '💫', description: 'Better lighting only', type: 'single',
    prompt: `Brighten this bedroom. Maximize natural light, warm whites. Keep everything as-is. Professional real estate photo.` },
];

const BATHROOM_OPTIONS: IndoorOption[] = [
  { id: 'stage-spa', label: 'Spa-Like Styling', emoji: '🛁', description: 'Towels, plants, candles', type: 'single',
    prompt: `Style as spa bathroom. Fluffy white towels on towel bar. Clear vanity clutter — add glass tray with diffuser, air plant, designer soap. If bathtub: wooden tray with candle and plant. Small pothos on vanity. One framed botanical print. Brighten with warm light. Keep all fixtures and architecture identical. ${CEIL} Professional real estate photo.` },
  { id: 'declutter', label: 'Declutter', emoji: '🧹', description: 'Remove toiletries, add towels', type: 'single',
    prompt: `Remove all personal items — toiletries, bottles, razors, makeup. Keep fixtures identical. Add only: folded white towels and small plant. Brighten. ${CEIL} Professional real estate photo.` },
  { id: 'brighten', label: 'Brighten', emoji: '💫', description: 'Sparkling clean look', type: 'single',
    prompt: `Brighten this bathroom. Clean grout, polished fixtures, clear mirror. Enhance lighting. Keep everything identical. ${CEIL} Professional real estate photo.` },
];

const HOME_OFFICE_OPTIONS: IndoorOption[] = [
  { id: 'stage-office', label: 'Stage as Office', emoji: '💼', description: '4 design styles', type: 'styled', styles: LIVING_ROOM_OPTIONS.find(o => o.id === 'stage-ho')!.styles },
  { id: 'stage-bed', label: 'Stage as Bedroom', emoji: '🛏️', description: 'Guest-ready bedroom', type: 'single',
    prompt: `Virtual stage as guest bedroom. Queen cream headboard against widest solid wall. White bedding with warm coverlet. Matching nightstands with lamps. Rug under bed. Art above headboard. Plant in corner. Against walls — doorways clear. Keep walls, floors, windows, doors, ceiling identical. ${CEIL} Warm light. Professional MLS photo.` },
  { id: 'remove-furniture', label: 'Remove Furniture', emoji: '🗑️', description: 'Empty, brightened', type: 'single',
    prompt: `Remove ALL furniture and decor. Keep architecture identical. ${CEIL} Brighten dramatically. Professional real estate photo.` },
  { id: 'brighten', label: 'Brighten', emoji: '💫', description: 'Better lighting only', type: 'single',
    prompt: `Brighten this room. Maximize natural light, warm white balance. Keep everything as-is. Professional real estate photo.` },
];

const OTHER_OPTIONS: IndoorOption[] = [
  ...LIVING_ROOM_OPTIONS.filter(o => ['stage-lr', 'stage-gr', 'stage-mr', 'stage-ho'].includes(o.id)),
  { id: 'remove-furniture', label: 'Remove Furniture', emoji: '🗑️', description: 'Empty, brightened', type: 'single',
    prompt: `Remove ALL furniture and decor. Keep architecture identical. ${CEIL} Brighten dramatically. Professional real estate photo.` },
  { id: 'brighten', label: 'Brighten', emoji: '💫', description: 'Better lighting only', type: 'single',
    prompt: `Brighten this room. Maximize natural light. Keep everything as-is. Professional real estate photo.` },
];

function getIndoorOptions(rt: RoomType | null): IndoorOption[] {
  const m: Record<string, IndoorOption[]> = { 'Living Room': LIVING_ROOM_OPTIONS, 'Dining Room': DINING_ROOM_OPTIONS, 'Kitchen': KITCHEN_OPTIONS, 'Bedroom': BEDROOM_OPTIONS, 'Bathroom': BATHROOM_OPTIONS, 'Home Office': HOME_OFFICE_OPTIONS, 'Other': OTHER_OPTIONS };
  return m[rt || 'Other'] || OTHER_OPTIONS;
}

// ═══ HELPERS ═══
const TIPS = ["Twilight photos get 3x more saves on Zillow", "Virtual staging sells homes 73% faster", "You're saving ~$150+ vs pro photo editing", "AI-enhanced listings get 40% more clicks", "Brighten ALL your listing photos for best results", "Cell phone photos can look professional with AI"];

function getGreeting(rt: RoomType | null): string {
  if (!rt) return "Choose an enhancement.";
  if (isOutdoor(rt)) return `${rt} detected — check the effects you want to combine.`;
  return `${rt} detected — choose an enhancement.`;
}

function addWatermarkToImage(src: string, text: string): Promise<string> {
  return new Promise((resolve) => { const img = new Image(); img.onload = () => {
    const c = document.createElement('canvas'); c.width = img.width; c.height = img.height; const ctx = c.getContext('2d')!; ctx.drawImage(img, 0, 0);
    const fs = Math.max(16, Math.floor(img.width / 40)); ctx.font = `bold ${fs}px Arial`; ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.strokeStyle = 'rgba(0,0,0,0.4)'; ctx.lineWidth = 2; ctx.textAlign = 'right'; ctx.textBaseline = 'bottom';
    const p = Math.floor(img.width * 0.02); ctx.strokeText(text, img.width - p, img.height - p); ctx.fillText(text, img.width - p, img.height - p); resolve(c.toDataURL('image/jpeg', 0.92));
  }; img.src = src; });
}

// ═══ MAIN COMPONENT ═══
export function Editor() {
  const [step, setStep] = useState<Step>('upload');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [activeToggles, setActiveToggles] = useState<string[]>([]);
  const [tileImages, setTileImages] = useState<string[]>([]);
  const [tileLabels, setTileLabels] = useState<string[]>([]);
  const [selectedTile, setSelectedTile] = useState(0);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [credits, setCredits] = useState(0);
  const [email, setEmail] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [showCreditWarning, setShowCreditWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [generatingProgress, setGeneratingProgress] = useState(0);
  const [currentTip, setCurrentTip] = useState(0);
  const [watermarkEnabled, setWatermarkEnabled] = useState(true);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportNotes, setReportNotes] = useState('');
  const [reportIssueType, setReportIssueType] = useState('');
  const [reportRemedy, setReportRemedy] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSent, setReportSent] = useState(false);
  const [promoInput, setPromoInput] = useState('');
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);
  const [promoSuccess, setPromoSuccess] = useState('');
  const [appliedPromo, setAppliedPromo] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('ssa_email');
    if (saved) { setEmail(saved); setEmailInput(saved); fetch('/api/user?email=' + encodeURIComponent(saved)).then(r => r.json()).then(d => setCredits(d.credits ?? 0)).catch(() => {}); }
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') { setShowSuccessToast(true); window.history.replaceState({}, '', '/editor'); setTimeout(() => setShowSuccessToast(false), 5000);
      const e = saved || localStorage.getItem('ssa_email'); if (e) [2000, 5000, 10000].forEach(d => setTimeout(() => fetch('/api/user?email=' + encodeURIComponent(e)).then(r => r.json()).then(d => { if (d.credits !== undefined) setCredits(d.credits); }).catch(() => {}), d)); }
  }, []);

  useEffect(() => { if (step !== 'generating') return; const i = setInterval(() => setCurrentTip(p => (p + 1) % TIPS.length), 4000); return () => clearInterval(i); }, [step]);

  const compressImage = (file: File): Promise<File> => new Promise((resolve) => { const img = new Image(); const url = URL.createObjectURL(file);
    img.onload = () => { URL.revokeObjectURL(url); const M = 2048; let { width: w, height: h } = img;
      if (w > M || h > M) { if (w > h) { h = Math.round(h * M / w); w = M; } else { w = Math.round(w * M / h); h = M; } }
      const c = document.createElement('canvas'); c.width = w; c.height = h; c.getContext('2d')!.drawImage(img, 0, 0, w, h);
      c.toBlob(b => b ? resolve(new File([b], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' })) : resolve(file), 'image/jpeg', 0.85);
    }; img.onerror = () => { URL.revokeObjectURL(url); resolve(file); }; img.src = url; });

  const fileToBase64 = (f: File): Promise<string> => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f); });

  const analyzeRoom = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    try { const fd = new FormData(); fd.append('image', file); const r = await fetch('/api/analyze', { method: 'POST', body: fd }); const d = await r.json(); setRoomType(d.roomType as RoomType); }
    catch { setRoomType('Other'); } finally { setIsAnalyzing(false); }
  }, []);

  const processFile = useCallback(async (file: File) => {
    if (!file) return; setError(null); setSelectedOption(null); setActiveToggles([]); setTileImages([]); setHasDownloaded(false);
    const comp = await compressImage(file); setOriginalImage(URL.createObjectURL(comp)); setCurrentFile(comp);
    const b64 = await fileToBase64(comp); setBase64Image(b64);
    if (!email) { setStep('email'); return; }
    setStep('options'); await analyzeRoom(comp);
  }, [email, analyzeRoom]);

  const onDrop = useCallback((files: File[]) => { if (files[0]) processFile(files[0]); }, [processFile]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'] }, maxFiles: 1 } as any);

  const handleEmailSubmit = async () => {
    if (!emailInput.includes('@')) return; const n = emailInput.toLowerCase().trim(); setEmail(n); localStorage.setItem('ssa_email', n);
    try { const r = await fetch(`/api/user?email=${encodeURIComponent(n)}`); const d = await r.json(); setCredits(d.credits ?? 0); } catch { setCredits(0); }
    if (!currentFile) { setStep('upload'); return; } setStep('options'); await analyzeRoom(currentFile);
  };

  const handleSignOut = () => { localStorage.removeItem('ssa_email'); setEmail(''); setEmailInput(''); setCredits(0); setStep('upload'); setOriginalImage(null); setBase64Image(null); setTileImages([]); setTileLabels([]); setRoomType(null); setSelectedOption(null); setActiveToggles([]); setError(null); setCurrentFile(null); setHasDownloaded(false); setSelectedTile(0); };

  const handleToggle = (id: string) => {
    const toggles = getToggles(roomType); if (!toggles) return; const t = toggles.find(x => x.id === id); if (!t) return;
    setActiveToggles(prev => { if (prev.includes(id)) return prev.filter(x => x !== id); let next = [...prev, id]; if (t.conflicts) next = next.filter(x => x === id || !t.conflicts!.includes(x)); return next; });
  };

  const handleGenerate = async () => {
    if (!base64Image) return;
    setStep('generating'); setGeneratingProgress(0); setCurrentTip(0); setError(null); setHasDownloaded(false); setTileImages([]); setTileLabels([]);
    let prompts: string[] = []; let labels: string[] = [];
    if (isOutdoor(roomType)) {
      const toggles = getToggles(roomType)!;
      if (activeToggles.length === 0) { setError('Select at least one enhancement.'); setStep('options'); return; }
      if (activeToggles.includes('furniture')) {
        const base = buildTogglePrompt(toggles, activeToggles);
        const styles = ['modern contemporary', 'warm rustic', 'coastal resort', 'minimalist elegant'];
        prompts = styles.map(s => base.replace('Professional MLS real estate photography.', `${s} furniture style. Professional MLS real estate photography.`));
        labels = styles.map(s => s.split(' ').map(w => w[0].toUpperCase() + w.slice(1)).join(' '));
      } else { prompts = [buildTogglePrompt(toggles, activeToggles)]; labels = ['Enhanced']; }
    } else {
      const opt = getIndoorOptions(roomType).find(o => o.id === selectedOption);
      if (!opt) { setError('Select an enhancement.'); setStep('options'); return; }
      if (opt.type === 'styled' && opt.styles) { prompts = opt.styles.map(s => s.prompt); labels = opt.styles.map(s => s.name); }
      else if (opt.prompt) { prompts = [opt.prompt]; labels = [opt.label]; }
    }
    const done: (string | null)[] = Array(prompts.length).fill(null); let count = 0;
    const promises = prompts.map((prompt, i) => fetch('/api/stage', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: base64Image, prompt, email }) })
      .then(r => { if (!r.ok) throw new Error('Failed'); return r.json(); })
      .then(d => { count++; setGeneratingProgress(Math.round((count / prompts.length) * 100)); done[i] = d.previewImage || null; })
      .catch(() => { count++; setGeneratingProgress(Math.round((count / prompts.length) * 100)); done[i] = null; })
    );
    await Promise.all(promises);
    const imgs = done.filter(Boolean) as string[]; const lbls = done.map((x, i) => x ? labels[i] : null).filter(Boolean) as string[];
    if (imgs.length === 0) { setError('All generations failed. Please try again.'); setStep('options'); return; }
    setTileImages(imgs); setTileLabels(lbls); setSelectedTile(0); setStep('result');
  };

  const handleDownload = async (img: string) => {
    if (!hasDownloaded) { if (credits < 1) { setShowCreditWarning(true); return; }
      try { const r = await fetch('/api/deduct-credit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) }); const d = await r.json(); if (!d.success) { setShowCreditWarning(true); return; } setCredits(d.credits); setHasDownloaded(true); } catch { setShowCreditWarning(true); return; } }
    let final = img; if (watermarkEnabled) final = await addWatermarkToImage(img, 'SmartStageAgent.com');
    try { const r = await fetch(final); const b = await r.blob(); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = `smartstageagent-v${selectedTile + 1}.jpg`; a.style.display = 'none'; document.body.appendChild(a); a.click(); setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(u); }, 1000);
    } catch { const a = document.createElement('a'); a.href = final; a.target = '_blank'; document.body.appendChild(a); a.click(); document.body.removeChild(a); }
  };

  const handleReport = async () => {
    if (!reportIssueType || !reportRemedy) return; setReportSubmitting(true);
    try { const lbl = isOutdoor(roomType) ? activeToggles.join(', ') : (getIndoorOptions(roomType).find(o => o.id === selectedOption)?.label || selectedOption);
      await fetch('/api/report', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, roomType, enhancementId: selectedOption || activeToggles.join('+'), enhancementLabel: lbl, tileIndex: selectedTile, issueType: reportIssueType, remedyRequested: reportRemedy, notes: reportNotes.trim() || undefined, originalImage: base64Image || undefined, resultImage: tileImages[selectedTile] || undefined }) });
      setReportSent(true); setShowReportModal(false); setReportNotes(''); setReportIssueType(''); setReportRemedy(''); setTimeout(() => setReportSent(false), 8000);
    } catch { setError('Failed to send report.'); } finally { setReportSubmitting(false); }
  };

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return; setPromoLoading(true); setPromoError(''); setPromoSuccess('');
    try { const r = await fetch('/api/redeem-promo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: promoInput, email }) }); const d = await r.json();
      if (r.ok && d.success) { setCredits(d.credits); setPromoSuccess(`${d.creditsAdded} free credits added!`); setPromoInput(''); setTimeout(() => { setPromoSuccess(''); setShowCreditWarning(false); }, 3000); }
      else { const known = ['LAUNCH20', 'HARES2026']; if (known.includes(promoInput.toUpperCase().trim())) { setAppliedPromo(promoInput.toUpperCase().trim()); setPromoSuccess('Special pricing unlocked!'); setPromoInput(''); } else setPromoError(d.error || 'Invalid code'); }
    } catch { setPromoError('Failed to apply code'); } finally { setPromoLoading(false); }
  };

  const handleReset = () => { setStep('upload'); setOriginalImage(null); setBase64Image(null); setTileImages([]); setTileLabels([]); setRoomType(null); setSelectedOption(null); setActiveToggles([]); setError(null); setCurrentFile(null); setHasDownloaded(false); setSelectedTile(0); };
  const handleTryAnother = () => { setStep('options'); setTileImages([]); setTileLabels([]); setSelectedOption(null); setActiveToggles([]); setError(null); setHasDownloaded(false); setSelectedTile(0); };

  const canGenerate = isOutdoor(roomType) ? activeToggles.length > 0 : !!selectedOption;
  const genCount = isOutdoor(roomType) ? (activeToggles.includes('furniture') ? 4 : 1) : (selectedOption ? (getIndoorOptions(roomType).find(o => o.id === selectedOption)?.type === 'styled' ? 4 : 1) : 0);
  const genLabel = !canGenerate ? 'Select an enhancement' : genCount === 4 ? 'Generate 4 Styles — 1 Credit' : 'Generate Enhancement — 1 Credit';

  // ═══ RENDER ═══
  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500"><Sparkles className="w-4 h-4 text-orange-500" /><span className="hidden sm:inline">Preview free —</span><strong>1 credit per download</strong></div>
        <div className="flex items-center gap-2">
          {email && (<><span className="text-xs text-slate-400 hidden sm:block">{email}</span><button onClick={handleSignOut} className="text-xs text-slate-400 hover:text-red-500" title="Sign out"><LogOut className="w-3.5 h-3.5" /></button></>)}
          <span className="text-sm font-bold text-slate-900">{credits} credits</span>
          <button onClick={() => setShowCreditWarning(true)} className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-full font-medium transition-colors">Buy Credits</button>
        </div>
      </div>
      <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 flex items-center justify-center gap-2 text-xs text-blue-600">
        <Info className="w-3 h-3 shrink-0" /><span><strong>Photos NOT stored</strong> — deleted after 24 hours. <strong>Download immediately.</strong></span>
      </div>
      <AnimatePresence>{showSuccessToast && (<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-green-500 text-white px-6 py-3 rounded-xl shadow-lg font-bold">✓ Payment successful — credits added!</motion.div>)}</AnimatePresence>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">

          {step === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-6"><h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Upload a Listing Photo</h1><p className="text-slate-500 text-sm">AI detects the room and suggests enhancements. Preview free — 1 credit to download.</p></div>
              <div className="flex flex-col gap-3 sm:hidden mb-4">
                <button onClick={() => { const i = document.createElement('input'); i.type='file'; i.accept='image/*'; i.capture='environment'; i.onchange=(e:any)=>{ if(e.target.files?.[0]) processFile(e.target.files[0]); }; i.click(); }} className="w-full flex items-center justify-center gap-3 py-5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl text-lg shadow-md">📷 Take a Photo</button>
                <button onClick={() => { const i = document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=(e:any)=>{ if(e.target.files?.[0]) processFile(e.target.files[0]); }; i.click(); }} className="w-full flex items-center justify-center gap-3 py-5 bg-white border-2 border-slate-300 text-slate-700 font-bold rounded-2xl text-lg shadow-sm">🖼️ Choose from Library</button>
              </div>
              <div {...getRootProps()} className={cn("hidden sm:flex border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all flex-col items-center gap-4", isDragActive ? "border-orange-500 bg-orange-50" : "border-slate-300 hover:border-orange-400 hover:bg-slate-100 bg-white")}>
                <input {...getInputProps()} /><div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center"><Upload className="w-8 h-8 text-orange-500" /></div>
                <div><p className="text-lg font-bold text-slate-900 mb-1">{isDragActive ? 'Drop it here' : 'Drag & drop your photo here'}</p><p className="text-slate-500 text-sm">JPG, PNG, WEBP, HEIC up to 10MB</p></div>
              </div>
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <p className="font-bold text-amber-800 text-sm mb-2">💡 Tips for Best Results</p>
                <div className="text-xs text-amber-700 space-y-1"><p>• Use highest resolution originals — don't screenshot from MLS</p><p>• Landscape orientation works best</p><p>• Well-lit starting photos produce the best AI results</p></div>
              </div>
            </motion.div>
          )}

          {step === 'email' && (
            <motion.div key="email" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="max-w-md mx-auto">
              {originalImage && (<div className="aspect-[4/3] rounded-2xl overflow-hidden bg-slate-200 shadow-sm mb-6"><img src={originalImage} alt="Photo" className="w-full h-full object-cover" /></div>)}
              <div className="bg-white rounded-2xl border border-slate-200 p-8">
                <div className="flex items-center gap-3 mb-6"><div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center"><Mail className="w-5 h-5 text-orange-500" /></div><div><h2 className="font-bold text-slate-900">Enter your email</h2><p className="text-sm text-slate-500">To track credits and downloads</p></div></div>
                <input type="email" value={emailInput} onChange={e => setEmailInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()} placeholder="you@brokerage.com" className="w-full border-2 border-slate-200 focus:border-orange-400 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 outline-none mb-4" autoFocus />
                <button onClick={handleEmailSubmit} disabled={!emailInput.includes('@')} className="w-full py-3 bg-[#1E3A8A] hover:bg-blue-900 disabled:bg-slate-300 text-white font-bold rounded-xl transition-colors">Continue →</button>
              </div>
            </motion.div>
          )}

          {step === 'options' && originalImage && (
            <motion.div key="options" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="flex flex-col md:grid md:grid-cols-2 gap-6">
                <div>
                  <div className="aspect-video sm:aspect-[4/3] rounded-2xl overflow-hidden bg-slate-200 shadow-sm"><img src={originalImage} alt="Photo" className="w-full h-full object-cover" /></div>
                  <button onClick={handleReset} className="mt-3 text-sm text-slate-500 hover:text-slate-700 flex items-center gap-1"><RotateCcw className="w-3 h-3" /> Different photo</button>
                </div>
                <div>
                  {isAnalyzing ? (<div className="flex items-center gap-3 mb-6 bg-blue-50 rounded-xl p-4"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /><p className="font-medium text-slate-900">Analyzing...</p></div>
                  ) : (<div className="mb-4 bg-[#1E3A8A] rounded-xl p-4 text-white"><div className="flex items-center gap-2 mb-1"><Sparkles className="w-4 h-4 text-orange-400" /><span className="text-xs font-medium text-blue-300 uppercase tracking-wide">{roomType || 'Ready'}</span></div><p className="font-semibold text-sm">{getGreeting(roomType)}</p></div>)}
                  {error && (<div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>)}

                  {isOutdoor(roomType) && getToggles(roomType) && (
                    <div className="space-y-2 mb-4">
                      <p className="text-xs text-slate-500 font-medium mb-1">Check all that apply — effects combine into one result:</p>
                      {getToggles(roomType)!.map(t => { const on = activeToggles.includes(t.id); const blocked = !on && t.conflicts?.some(c => activeToggles.includes(c));
                        return (<button key={t.id} onClick={() => !blocked && handleToggle(t.id)} className={cn("w-full flex items-center gap-3 p-3 border-2 rounded-xl text-left transition-all", on ? "border-orange-500 bg-orange-50" : blocked ? "border-slate-100 bg-slate-50 opacity-40 cursor-not-allowed" : "border-slate-200 bg-white hover:border-orange-300")}>
                          <div className={cn("w-5 h-5 rounded border-2 flex items-center justify-center shrink-0", on ? "bg-orange-500 border-orange-500" : "border-slate-300")}>{on && <span className="text-white text-xs font-bold">✓</span>}</div>
                          <span className="text-lg shrink-0">{t.emoji}</span>
                          <div className="flex-1 min-w-0"><div className="font-bold text-slate-900 text-sm">{t.label}</div><div className="text-xs text-slate-500">{t.description}</div></div>
                        </button>);
                      })}
                    </div>
                  )}

                  {!isOutdoor(roomType) && (
                    <div className="space-y-2 mb-4">
                      {getIndoorOptions(roomType).map(opt => { const sel = selectedOption === opt.id;
                        return (<button key={opt.id} onClick={() => setSelectedOption(opt.id)} className={cn("w-full flex items-center gap-3 p-3 border-2 rounded-xl text-left transition-all", sel ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white hover:border-orange-300")}>
                          <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0", sel ? "bg-orange-500 border-orange-500" : "border-slate-300")}>{sel && <span className="text-white text-xs">●</span>}</div>
                          <span className="text-lg shrink-0">{opt.emoji}</span>
                          <div className="flex-1 min-w-0"><div className="font-bold text-slate-900 text-sm">{opt.label}{opt.type === 'styled' && <span className="ml-2 text-[10px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">4 Styles</span>}</div><div className="text-xs text-slate-500">{opt.description}</div></div>
                        </button>);
                      })}
                    </div>
                  )}

                  <button onClick={handleGenerate} disabled={!canGenerate || isAnalyzing} className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black text-lg rounded-xl flex items-center justify-center gap-2 transition-colors"><Wand2 className="w-5 h-5" />{genLabel}</button>
                  <p className="text-center text-xs text-slate-400 mt-2">Preview free. Credit charged only at download.</p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'generating' && (
            <motion.div key="generating" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-20">
              <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6"><Wand2 className="w-10 h-10 text-orange-500 animate-pulse" /></div>
              <h2 className="text-2xl font-black text-slate-900 mb-2">Enhancing your photo...</h2>
              <p className="text-sm font-semibold text-orange-500 mb-8">⏱ Usually 15–60 seconds</p>
              <div className="max-w-sm mx-auto bg-slate-200 rounded-full h-3 overflow-hidden mb-3"><motion.div className="h-full bg-orange-500 rounded-full" initial={{ width: '0%' }} animate={{ width: `${generatingProgress}%` }} transition={{ duration: 0.5 }} /></div>
              <p className="text-sm text-slate-400 mb-8">{generatingProgress}%</p>
              <AnimatePresence mode="wait"><motion.div key={currentTip} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="bg-blue-50 border border-blue-100 rounded-xl px-6 py-4 max-w-sm mx-auto"><p className="text-sm font-medium text-blue-700">💡 {TIPS[currentTip]}</p></motion.div></AnimatePresence>
            </motion.div>
          )}

          {step === 'result' && originalImage && tileImages.length > 0 && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-6"><div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold mb-4">✓ {tileImages.length > 1 ? `${tileImages.length} styles generated` : 'Enhancement complete'}{hasDownloaded ? ' — 1 credit used' : ''}</div></div>

              {tileImages.length > 1 && (<div className="grid grid-cols-2 gap-3 mb-6">{tileImages.map((img, i) => (
                <button key={i} onClick={() => setSelectedTile(i)} className={cn("relative rounded-xl overflow-hidden border-3 transition-all", selectedTile === i ? "border-orange-500 ring-2 ring-orange-300 ring-offset-1" : "border-slate-200 hover:border-orange-300")}>
                  <img src={img} alt={tileLabels[i]} className="w-full aspect-[4/3] object-cover" />
                  <div className={cn("absolute bottom-0 left-0 right-0 text-center text-xs py-1.5 font-bold", selectedTile === i ? "bg-orange-500 text-white" : "bg-black/40 text-white/80")}>{tileLabels[i] || `V${i + 1}`} {selectedTile === i && '✓'}</div>
                </button>))}</div>)}

              <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 aspect-[4/3] sm:aspect-[16/9] mb-4 bg-slate-900"><ImageComparison beforeImage={originalImage} afterImage={tileImages[selectedTile]} objectFit="contain" /></div>
              <p className="text-center text-sm text-slate-500 mb-4">↕ Drag to compare</p>

              <div className="flex items-center justify-center gap-3 mb-4 bg-slate-100 rounded-xl p-3 max-w-sm mx-auto">
                <button onClick={() => setWatermarkEnabled(!watermarkEnabled)} className={cn("relative w-10 h-5 rounded-full transition-colors", watermarkEnabled ? "bg-orange-500" : "bg-slate-300")}><div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform", watermarkEnabled ? "translate-x-5" : "translate-x-0.5")} /></button>
                <span className="text-sm text-slate-600">Watermark {watermarkEnabled ? <strong>on</strong> : <strong>off</strong>}</span>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:flex-wrap">
                {(credits > 0 || hasDownloaded) ? (<button onClick={() => handleDownload(tileImages[selectedTile])} className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold rounded-xl"><Download className="w-5 h-5" />{hasDownloaded ? `Download ${tileLabels[selectedTile] || 'Photo'} (Free)` : 'Download — 1 Credit'}</button>
                ) : (<button onClick={() => setShowCreditWarning(true)} className="flex items-center justify-center gap-2 px-6 py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl"><Download className="w-5 h-5" /> Buy Credits to Download</button>)}
                <button onClick={handleGenerate} className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border-2 border-slate-200"><RotateCcw className="w-4 h-4 text-orange-500" /> Regenerate</button>
                <button onClick={handleTryAnother} className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border-2 border-slate-200"><Wand2 className="w-5 h-5 text-orange-500" /> Different Enhancement</button>
                <button onClick={handleReset} className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-500 font-medium rounded-xl border border-slate-200"><Upload className="w-4 h-4" /> New Photo</button>
              </div>
              {hasDownloaded && (<p className="text-center text-xs text-green-600 font-medium mt-3">✓ Credit used — download any version free</p>)}

              {hasDownloaded && (
                <div className="mt-6 bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200 rounded-xl p-5 text-center">
                  <p className="font-black text-amber-900 text-base mb-1">🔥 Upgrade Your Entire Listing</p>
                  <p className="text-sm text-amber-800 mb-3">Brighten & declutter <strong>every photo</strong> in your listing — the single biggest upgrade you can make.</p>
                  <div className="inline-flex items-center gap-2 bg-white rounded-lg px-4 py-2 border border-amber-200 mb-3">
                    <span className="text-amber-900 font-bold">25 photos for $25</span>
                    <span className="text-xs text-amber-600">($1/photo — brighten + declutter)</span>
                  </div>
                  <p className="text-xs text-amber-700">Most agents do 25-40 photos per listing. Coming soon — bulk upload!</p>
                </div>
              )}

              <div className="mt-4">
                {reportSent ? (<div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 text-center"><p className="text-green-700 font-bold">✓ Report sent! We'll review within 24 hours.</p></div>
                ) : (<button onClick={() => setShowReportModal(true)} className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 border-2 border-red-200 hover:border-red-300 text-red-600 font-bold rounded-xl"><AlertCircle className="w-5 h-5" />Not happy? Report this result</button>)}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Credit Purchase Modal */}
      <AnimatePresence>{showCreditWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-bold text-slate-900 mb-1">Get Credits</h3>
            <p className="text-slate-500 text-sm mb-4">1 credit = 1 enhanced photo.</p>
            {email.endsWith('@orchard.com') && (<div className="bg-blue-50 border border-blue-200 rounded-xl px-3 py-2 mb-3 text-xs text-blue-700 font-medium">🏡 Orchard pricing — $1/credit on 20+ packs</div>)}
            {appliedPromo && (<div className="bg-green-50 border border-green-200 rounded-xl px-3 py-2 mb-3 text-xs text-green-700 font-medium flex items-center justify-between">🎉 <strong className="mx-1">{appliedPromo}</strong> applied!<button onClick={() => { setAppliedPromo(''); setPromoSuccess(''); }} className="text-green-400 hover:text-green-600 text-[10px]">✕</button></div>)}
            <div className="space-y-2 mb-4">
              {(email.endsWith('@orchard.com') ? [
                { id: '1pack', label: '1 Photo', price: '$5', note: '', popular: false },
                { id: '5pack', label: '5 Photos', price: '$20', note: '', popular: false },
                { id: 'orchard20', label: '20 Photos', price: '$20', note: '$1/photo', popular: true },
                { id: 'orchard50', label: '50 Photos', price: '$50', note: '$1/photo', popular: false },
              ] : (appliedPromo === 'LAUNCH20' || appliedPromo === 'HARES2026') ? [
                { id: '1pack', label: '1 Photo', price: '$5', note: '', popular: false },
                { id: '5pack', label: '5 Photos', price: '$20', note: '$4/photo', popular: false },
                { id: 'promo20', label: '20 Photos', price: '$20', note: '$1/photo', popular: true },
                { id: 'promo50', label: '50 Photos', price: '$50', note: '$1/photo', popular: false },
              ] : [
                { id: '1pack', label: '1 Photo', price: '$5', note: '', popular: false },
                { id: '5pack', label: '5 Photos', price: '$20', note: '$4/photo', popular: true },
                { id: '10pack', label: '10 Photos', price: '$30', note: '$3/photo', popular: false },
                { id: '25pack', label: '25 Photos', price: '$50', note: '$2/photo', popular: false },
              ]).map(pkg => (
                <button key={pkg.id} onClick={async () => {
                  if (!email) { setShowCreditWarning(false); setStep('email'); return; }
                  const r = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ packageId: pkg.id, email, promoCode: appliedPromo || undefined }) });
                  const d = await r.json(); if (r.status === 409) { setAppliedPromo(''); setPromoError(d.error || 'Promo already used'); return; } if (d.url) window.location.href = d.url;
                }} className={cn("w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left", pkg.popular ? "border-orange-500 bg-orange-50" : "border-slate-200 hover:border-orange-300")}>
                  <span className="font-bold text-slate-900">{pkg.label}{pkg.popular && <span className="ml-2 text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full uppercase">Best Value</span>}{pkg.note && <span className="ml-2 text-[10px] text-slate-400">{pkg.note}</span>}</span>
                  <span className="font-bold text-[#1E3A8A]">{pkg.price}</span>
                </button>))}
            </div>
            <div className="border-t border-slate-200 pt-4 mt-2">
              <p className="text-sm font-bold text-slate-700 mb-2">Have a promo code?</p>
              <div className="flex gap-2">
                <input value={promoInput} onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); setPromoSuccess(''); }} placeholder="Enter code" className="flex-1 border-2 border-slate-200 focus:border-orange-400 rounded-xl px-3 py-2 text-slate-900 text-sm uppercase font-bold outline-none" onKeyDown={e => e.key === 'Enter' && handleApplyPromo()} />
                <button onClick={handleApplyPromo} disabled={promoLoading || !promoInput.trim()} className="px-4 py-2 bg-[#1E3A8A] hover:bg-blue-900 disabled:bg-slate-300 text-white font-bold rounded-xl text-sm whitespace-nowrap">{promoLoading ? '...' : 'Apply'}</button>
              </div>
              {promoError && <p className="text-red-500 text-xs mt-1">{promoError}</p>}
              {promoSuccess && <p className="text-green-600 text-xs mt-1 font-bold">{promoSuccess}</p>}
            </div>
            <button onClick={() => setShowCreditWarning(false)} className="w-full text-sm text-slate-500 hover:text-slate-700 py-2 mt-2">Cancel</button>
          </motion.div>
        </div>
      )}</AnimatePresence>

      {/* Report Modal */}
      <AnimatePresence>{showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 my-8">
            <h3 className="text-xl font-bold text-slate-900 mb-4">Report Bad Result</h3>
            <label className="block text-sm font-bold text-slate-700 mb-1">What went wrong?</label>
            <select value={reportIssueType} onChange={e => setReportIssueType(e.target.value)} className={cn("w-full border-2 rounded-xl px-4 py-3 text-slate-900 outline-none mb-4 bg-white", reportIssueType ? "border-slate-300" : "border-red-300")}>
              <option value="">Select...</option><option value="AI changed layout">AI changed the layout</option><option value="Added fake items">Added items that don't exist</option><option value="Removed items">Removed items that should stay</option><option value="Looks fake">Looks fake</option><option value="Wrong room">Wrong room detected</option><option value="Failed">Generation failed</option><option value="Blocked doorway">Furniture blocking doorway</option><option value="Other">Other</option>
            </select>
            <label className="block text-sm font-bold text-slate-700 mb-1">How should we fix it?</label>
            <select value={reportRemedy} onChange={e => setReportRemedy(e.target.value)} className={cn("w-full border-2 rounded-xl px-4 py-3 text-slate-900 outline-none mb-4 bg-white", reportRemedy ? "border-slate-300" : "border-red-300")}>
              <option value="">Select...</option><option value="Credit account">Credit my account</option><option value="Edit photo">Edit the photo manually</option><option value="Both">Both</option>
            </select>
            <textarea value={reportNotes} onChange={e => setReportNotes(e.target.value)} placeholder="Details (optional)" className="w-full border-2 border-slate-200 focus:border-orange-400 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 outline-none mb-4 text-sm resize-none" rows={2} />
            <button onClick={handleReport} disabled={reportSubmitting || !reportIssueType || !reportRemedy} className="w-full py-3 bg-red-500 hover:bg-red-600 disabled:bg-slate-300 text-white font-bold rounded-xl mb-2">{reportSubmitting ? 'Sending...' : 'Submit Report'}</button>
            <button onClick={() => { setShowReportModal(false); setReportNotes(''); setReportIssueType(''); setReportRemedy(''); }} className="w-full text-sm text-slate-500 hover:text-slate-700 py-2">Cancel</button>
          </motion.div>
        </div>
      )}</AnimatePresence>
    </div>
  );
}
