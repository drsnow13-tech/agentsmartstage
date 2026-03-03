import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Wand2, Loader2, Download, RotateCcw, Sparkles, AlertCircle, Mail, CheckSquare, Square, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageComparison } from '../components/ImageComparison';
import { cn } from '../lib/utils';

type RoomType = 'Exterior' | 'Backyard' | 'Rooftop Terrace' | 'Balcony' | 'Living Room' | 'Dining Room' | 'Kitchen' | 'Bedroom' | 'Bathroom' | 'Home Office' | 'Other';
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

const REMOVE_FURNITURE: EditOption = {
  id: 'remove-furniture',
  label: 'Remove All Furniture',
  description: 'Strip existing furniture, start fresh',
  emoji: '🗑️',
  prompt: 'Remove ALL existing furniture, rugs, curtains, and decor from this room completely. Keep walls, floors, baseboards, windows, doors, ceiling, fireplace, built-ins, and every architectural feature exactly identical. Result: completely empty room ready for virtual staging. Brighten the room. Professional real estate photography.'
};

const REMOVE_CLUTTER: EditOption = {
  id: 'remove-clutter-outdoor',
  label: 'Remove Clutter',
  description: 'Clean up debris, bins, vehicles',
  emoji: '🧹',
  prompt: 'Remove ALL of the following from this photo: trash cans, recycling bins, vehicles, cars, hoses, yard tools, debris, personal items, sports equipment, construction materials, and any other clutter. Fill removed areas with seamlessly matching background. Keep ALL architectural features, landscaping, structures, and sky exactly identical. Clean professional MLS real estate photography.'
};

const ROOM_OPTIONS: Record<string, EditOption[]> = {
  Exterior: [
    { id: 'twilight', label: 'Virtual Twilight', description: 'Golden hour sky, warm glowing windows', emoji: '🌅', prompt: 'Transform this exterior photo into a professional real estate twilight shot. Sky: deep blue-to-violet gradient at top fading to warm peach and amber near horizon — rich and dramatic but NOT black or silhouetted. Home facade must remain brightly lit and clearly visible. All windows: warm golden-amber glow from interior lights. All exterior sconces, porch lights, and landscape lighting: on and glowing warm. Driveway and entry path well illuminated. Lawn retains green color. No part of the house should be silhouetted or underexposed. Result looks like a professional twilight photograph shot at 7:30pm — cinematic but MLS-ready. Keep ALL architectural details, landscaping, and structures exactly identical.' },
    { id: 'grass', label: 'Green the Grass', description: 'Lush vibrant lawn that pops online', emoji: '🌿', prompt: 'Replace all dead, brown, dry, or patchy grass with lush, thick, vibrant deep green grass that looks professionally maintained — uniform thickness, healthy and full. Keep every other element exactly identical: house, driveway, landscaping beds, trees, shrubs, sky, fencing, all structures. Do not alter the color of any non-grass elements. Professional real estate photography.' },
    { id: 'lights', label: 'Turn On Interior Lights', description: 'Warm inviting glow from inside', emoji: '💡', prompt: 'Add realistic warm amber interior lighting glowing through every window as if all interior lights are on. Warm 2700K color temperature, soft and inviting glow visible from outside with light spilling slightly onto the exterior near windows. Do NOT make it overexposed or cartoon-like. Keep all architecture, landscaping, sky, and all other elements exactly identical. Professional real estate photography.' },
    { id: 'sky', label: 'Blue Sky Swap', description: 'Replace overcast sky with bright blue', emoji: '☀️', prompt: 'Replace the existing sky with a vivid sunny-day sky: bright blue with natural white cumulus clouds scattered naturally. Lighting on the house and landscaping must match the new sky — bright directional sunlight with natural shadows. Remove any grey, overcast, or dull sky completely. Keep ALL architectural details, landscaping, driveway, trees, and structures exactly identical. Professional MLS real estate photography.' },
    REMOVE_CLUTTER,
  ],
  Backyard: [
    { id: 'twilight', label: 'Virtual Twilight', description: 'Stunning evening ambiance', emoji: '🌅', prompt: 'Transform this backyard into a professional real estate twilight shot. First remove any trash, debris, or clutter present. Sky: rich blue-violet gradient. String lights or patio lights glowing warm amber. Pool or water features illuminated from within if present. Lawn retains green color. Scene should feel warm, inviting, aspirational. All structures clearly visible, NOT silhouetted. Keep ALL existing structures, pool, landscaping, fencing, and hardscape exactly identical.' },
    { id: 'grass', label: 'Green the Grass', description: 'Perfect lawn all year round', emoji: '🌿', prompt: 'Replace all dead, brown, or patchy lawn with lush, thick, vibrant deep green grass — professionally maintained, uniform, full coverage. Keep every other element exactly identical: patio, pool, fencing, trees, shrubs, landscaping, home exterior, sky, furniture. Professional real estate photography.' },
    { id: 'furniture', label: 'Add Outdoor Furniture', description: 'Stage with patio set and lounge area', emoji: '🪑', prompt: 'First remove any existing clutter, debris, or unsightly items. Then add high-end aspirational outdoor furniture: On any patio or hardscape: a 6-person teak or powder-coated aluminum dining table with cushioned chairs and large market umbrella. In lawn or open area: a deep-seated outdoor sectional with colorful throw pillows and low coffee table with lanterns. Near pool if present: 2-4 chaise lounge chairs with cushions. Add large potted tropical plants in ceramic planters. All furniture should look expensive, cohesive, and real. Keep ALL existing structures, landscaping, fencing, and architecture exactly identical. Professional real estate photography.' },
    REMOVE_CLUTTER,
  ],
  'Rooftop Terrace': [
    { id: 'twilight', label: 'Virtual Twilight', description: 'Cinematic city skyline at dusk', emoji: '🌅', prompt: 'Transform this rooftop terrace into a stunning real estate twilight shot. First remove any trash, construction debris, or clutter present. Sky: deep blue-violet gradient with warm amber horizon. City lights or suburban skyline glowing in the distance if visible. String lights or Edison bulb strands overhead glowing warm amber. All terrace lighting on. The scene should feel luxurious, aspirational, and cinematic — like a rooftop bar or penthouse. Keep ALL existing structures, railings, HVAC units if architectural, and terrace surfaces exactly identical. Professional real estate photography.' },
    { id: 'turf', label: 'Add Turf', description: 'Lush green turf for the rooftop', emoji: '🌿', prompt: 'Add realistic artificial turf to the rooftop terrace surface. The turf should look high-quality — bright green, uniform, professional installation with clean edges and borders. Keep all railings, walls, mechanical equipment, and perimeter structures exactly identical. Turf covers the main terrace floor area only — not railings or vertical surfaces. Professional real estate photography.' },
    { id: 'furniture', label: 'Add Rooftop Furniture', description: 'Urban outdoor living setup', emoji: '🪑', prompt: 'First remove any existing clutter or debris. Then add aspirational urban rooftop furniture: A modern outdoor sectional sofa in weather-resistant grey or white fabric with colorful throw pillows, arranged to face the best view. A low outdoor coffee table with lanterns and small potted succulents. A separate dining area with a round table and 4 chairs if space allows. String lights or Edison bulb strands overhead. Large container plants — tall ornamental grasses, boxwoods, or tropical plants in modern planters defining the space. A small bar cart or outdoor kitchen island if space allows. Everything should look sleek, modern, and high-end. Keep ALL railings, walls, and architectural elements exactly identical. Professional real estate photography.' },
    REMOVE_CLUTTER,
  ],
  Balcony: [
    { id: 'twilight', label: 'Virtual Twilight', description: 'Evening ambiance with city views', emoji: '🌅', prompt: 'Transform this balcony or courtyard into a beautiful real estate twilight shot. First remove any clutter present. Sky: rich blue-violet with warm amber horizon. Ambient warm lighting glowing on the space. City, suburban, or garden views enhanced in background. Scene feels intimate, romantic, and inviting. Keep ALL railings, walls, floor, and architectural elements exactly identical. Professional real estate photography.' },
    { id: 'furniture', label: 'Add Balcony Furniture', description: 'Cozy outdoor seating setup', emoji: '🪑', prompt: 'First remove any existing clutter or unsightly items. Then add intimate, appropriately scaled outdoor furniture: A small bistro table with 2 chairs in black metal or natural rattan — perfect for morning coffee. One or two small outdoor lounge chairs or a loveseat if space allows. String lights draped along the railing. Potted plants — trailing ivy, small citrus tree, herbs in terracotta pots — arranged along railing and corners. A small lantern or candle on the bistro table. Everything sized appropriately for the space — never overcrowded. Keep ALL railings, walls, floor, and architecture exactly identical. Professional real estate photography.' },
    REMOVE_CLUTTER,
  ],
  'Living Room': [
    { id: 'stage-lr', label: 'Stage as Living Room', description: 'Warm, styled, ready to sell', emoji: '🛋️', prompt: 'Photoreal warm and inviting living room virtual staging. CRITICAL RULES: (1) Keep ALL doorways, stairways, and entry paths 100% clear — never place furniture blocking any door or passage. (2) If fireplace present: fully visible, unobstructed, with a warm crackling fire burning. Place seating to face or flank it. (3) Room must feel full — no bare walls or empty corners — but never cluttered. FURNITURE: Large plush sofa in warm cream or camel leather against back or longest wall. One accent chair in complementary warm tone. Main seating faces the fireplace or focal wall, NOT blocking any door. Wood coffee table centered on rug styled with lacquered tray, two candles, a succulent, and a coffee table book. Two end tables each with a warm amber table lamp. Large area rug (9x12 minimum) under ALL seating with front legs on rug. PLANTS: Tall fiddle leaf fig (6ft) in ceramic pot in one corner. Medium monstera on a console or side table. WALLS: Large warm landscape or abstract painting above sofa. Two smaller framed botanical prints on adjacent wall. Fireplace mantle styled with candlesticks and greenery if present. SURFACES: Styled wood console against any bare wall with books, small plant, and objects. Cozy throw blanket on sofa arm. Decorative pillows in warm tones. Keep ALL walls, floors, windows, baseboards, ceiling, and every architectural detail exactly identical. Warm natural light plus amber lamp glow. Wide-angle professional MLS real estate photography.' },
    { id: 'stage-gr', label: 'Stage as Game Room', description: 'Fun, social, aspirational', emoji: '🎱', prompt: 'Photoreal warm and inviting game room virtual staging. CRITICAL: Keep ALL doorways, stairways, and passages 100% clear — never block any door or staircase. CENTER: Pool table or shuffleboard as hero piece centered in main floor area with hanging pendant lights directly above. WALL AREA: Stylish bar cabinet with backlit shelving, glassware, and bottles against one wall. Bar stools at counter if space. SEATING CORNER: 2-4 leather lounge chairs with small round table arranged in corner away from all pathways. WALLS: Bold framed sports art or large neon-style sign. Two to three smaller framed prints. Plants in dark ceramic pots. Edison bulb or pendant lighting for warm atmosphere. Keep ALL walls, floors, windows, and architectural details exactly identical. Warm inviting lighting, professional real estate photography.' },
    { id: 'stage-mr', label: 'Stage as Media Room', description: 'Theater-style, cozy, cinematic', emoji: '🎬', prompt: 'Photoreal warm and inviting media room virtual staging. CRITICAL: Keep ALL doorways and passages completely clear — never place furniture blocking any door or stairway. MEDIA WALL: Large framed TV or projection screen on primary wall with built-in or freestanding shelving flanking it with books, plants, speakers. PRIMARY SEATING: Large deep-seated sectional in dark grey, navy, or charcoal velvet positioned against back wall facing media wall — clear walking paths on both sides. Recliner chairs flanking sectional if space allows. Large area rug under all seating. LOW OTTOMAN or coffee table with popcorn bowl, remotes, candles. Side tables with warm amber lamps. Throw blankets on every seat. WALLS: Movie or abstract dark art. Sconce lighting on side walls. ATMOSPHERE: Warm dim amber glow, cinematic but inviting. Keep ALL walls, floors, windows, and architectural details exactly identical. Professional real estate photography.' },
    { id: 'stage-ho', label: 'Stage as Home Office', description: 'Professional, warm, productive', emoji: '💼', prompt: 'Photoreal warm and inviting home office virtual staging. CRITICAL: Keep ALL doorways completely clear. Large executive desk in light oak or walnut positioned facing the room or angled toward window for natural light — never blocking a door. High-back upholstered desk chair in warm leather or cream. Built-in or freestanding bookshelves against walls filled with neatly organized books, small plants, framed photos, and decorative objects. One or two accent chairs for meetings in corner with small side table. PLANTS: Tall fiddle leaf fig or olive tree in one corner. Small succulents on desk and shelves. WALLS: Large framed architectural or landscape art above desk. Gallery wall of smaller frames on adjacent wall. LIGHTING: Warm desk lamp on desk. Floor lamp in corner. SURFACES: Desk styled with leather desk pad, pen holder, small plant, books. Keep ALL walls, floors, windows, and architectural details exactly identical. Warm productive atmosphere, professional real estate photography.' },
    REMOVE_FURNITURE,
    { id: 'declutter', label: 'Declutter & Clean', description: 'Remove personal items only', emoji: '✨', prompt: 'Remove ALL personal items, clutter, and loose objects from this room — but keep all furniture in place. Remove: clothes, toys, personal photos, papers, mail, food items, excess decor. Keep all furniture, rugs, built-ins, and architectural features exactly identical. Result: clean, tidy, depersonalized room. Improve brightness. Professional real estate photography.' },
    { id: 'brighten', label: 'Brighten & Enhance', description: 'More light, better colors', emoji: '💫', prompt: 'Dramatically brighten this room. Maximize natural light from all windows. Warm up the white balance. Boost vibrancy and reduce shadows. Keep every piece of furniture, every decor item, and every architectural element exactly identical — only improve brightness, warmth, and color quality. Professional real estate photography.' },
  ],
  'Dining Room': [
    { id: 'stage-dr', label: 'Stage as Dining Room', description: 'Warm, elegant, ready to entertain', emoji: '🍽️', prompt: 'Photoreal warm and inviting dining room virtual staging. CRITICAL: Keep all doorways and passages clear. RUG RULE: Area rug must extend at least 24 inches beyond all sides of the table. FURNITURE: Rectangular dining table in warm walnut or white oak seating 6. Six fully upholstered chairs in cream or warm taupe — two at each end, two per side. Large warm-toned patterned area rug centered under full table extending 24+ inches all sides. Statement chandelier or cluster pendant above table center with warm amber light. CENTERPIECE: Fresh white flowers or greenery in a low vase, two tall taper candles in brass candlesticks. WALLS: Large landscape or floral artwork on primary wall. Mirror or coordinating art on secondary wall. STORAGE: Sideboard or buffet against one wall, large mirror above it, small lamps on top, small plant. CORNERS: Tall fiddle leaf fig or bird of paradise in at least one corner. Keep ALL walls, floors, windows, and architecture exactly identical. Warm inviting lighting, MLS-ready real estate photography.' },
    { id: 'stage-bn', label: 'Stage as Breakfast Nook', description: 'Casual, cozy, morning vibes', emoji: '☕', prompt: 'Photoreal warm and inviting breakfast nook virtual staging. CRITICAL: Keep all doorways clear. Transform this space into a cozy casual dining area. FURNITURE: A round or small rectangular table in light oak or white with 2-4 chairs in rattan, bentwood, or cushioned linen. Simple area rug under table extending beyond all sides. CENTERPIECE: Small vase of fresh wildflowers, a candle, a small plant. WALLS: Simple framed art or chalkboard. Small open shelving with mugs, plants, and decor. WINDOWS: Potted herb garden on windowsill if window nearby. ATMOSPHERE: Bright, airy, casual — like a coffee shop corner. Keep ALL walls, floors, windows, and architecture exactly identical. Bright warm morning light, professional real estate photography.' },
    REMOVE_FURNITURE,
    { id: 'declutter', label: 'Declutter & Clean', description: 'Remove personal items only', emoji: '✨', prompt: 'Remove ALL personal items and clutter from this dining room — but keep all furniture in place. Result: clean, tidy, depersonalized space. Improve brightness. Professional real estate photography.' },
  ],
  Kitchen: [
    { id: 'stage-warm', label: 'Warm & Styled', description: 'Curated, cozy kitchen', emoji: '🍳', prompt: 'Photoreal warm and inviting kitchen staging. First remove ALL clutter from every countertop — appliances, dishes, papers, everything. Then add curated lifestyle styling: Near window: small terracotta pot with fresh herbs. On main counter: wooden end-grain cutting board leaned against backsplash, ceramic crock with wooden spoons, bowl of fresh lemons or green apples. Near sink: small glass vase with fresh flowers or greenery. On any open shelving: neatly stacked plates, small plants, cookbooks. Folded linen dish towel over oven handle. Keep ALL cabinets, appliances, countertops, backsplash, sink, hardware, and every architectural detail exactly identical. Warm bright professional real estate photography.' },
    { id: 'brighten', label: 'Brighten & Enhance', description: 'More light, better colors', emoji: '💫', prompt: 'Dramatically brighten this kitchen. Make it look as light and airy as possible. Enhance natural light through windows. Improve white balance to warm and clean. Make white cabinets look crisp, countertops look bright and clean, stainless steel look polished. Reduce all shadows especially under upper cabinets. Keep ALL cabinets, appliances, countertops, backsplash, sink, and every architectural element exactly identical. Professional real estate photography.' },
    { id: 'declutter', label: 'Declutter Countertops', description: 'Clean minimal counters', emoji: '🧹', prompt: 'Remove ALL items from countertops — every small appliance, dishes, food, papers, personal items, everything. Keep all built-in appliances, cabinets, countertops, backsplash, sink, faucet, and all architectural features exactly identical. Add only: one small potted herb and one small bowl of fresh fruit. Result: clean, spacious, minimally styled countertops. Professional real estate photography.' },
  ],
  Bedroom: [
    { id: 'stage-bed', label: 'Stage as Bedroom', description: 'Luxurious, cozy, beautifully styled', emoji: '🛏️', prompt: 'Photoreal warm and inviting master bedroom virtual staging. CRITICAL: Keep all doorways completely clear — never block any door with furniture. Room must feel full and complete — no bare walls, no empty corners. BED: King or queen upholstered headboard in cream, warm grey, or camel velvet against main wall, never blocking a door or window. Hotel-quality layered bedding: crisp white duvet, warm-toned linen coverlet folded back 1/3. Three Euro shams stacked, two standard shams in front, two to three decorative throw pillows. Chunky-knit throw blanket folded at foot of bed. NIGHTSTANDS: Two matching wood nightstands, each with a warm amber table lamp, small stack of books, small potted plant or fresh flowers on one side. RUG: Large soft area rug (9x12 minimum) centered under bed extending 24 inches beyond foot and 18 inches beyond both sides. PLANTS: Tall fiddle leaf fig (5-6ft) in woven ceramic pot in one corner. WALLS: Large framed art above headboard in warm tones. One or two smaller coordinating frames on adjacent wall. ADDITIONAL: Upholstered bench at foot of bed. Dresser or accent chair in another corner. Keep ALL walls, floors, windows, and every architectural detail exactly identical. Warm natural light plus warm lamp glow. Wide-angle professional MLS real estate photography.' },
    { id: 'stage-nursery', label: 'Stage as Nursery', description: 'Sweet, soft, perfectly styled', emoji: '🍼', prompt: 'Photoreal warm and inviting nursery virtual staging. CRITICAL: Keep all doorways completely clear. FURNITURE: White or natural wood crib with white fitted sheet and soft patterned crib skirt against main wall, never blocking a door. White or light wood dresser/changing table against another wall. Plush upholstered rocking chair or glider in cream or soft grey in one corner with small side table holding a lamp. Large soft area rug in a gentle geometric or animal pattern. WALLS: Sweet framed art — animal prints, alphabet letters, or watercolor botanicals. One large piece above crib, two smaller on side wall. Name sign above crib. PLANTS: Small non-toxic plant on dresser. TEXTILES: Soft mobile above crib. Folded blankets in a basket. Warm ambient lamp light. Keep ALL walls, floors, windows, and architectural details exactly identical. Soft warm gentle lighting, professional real estate photography.' },
    { id: 'stage-ho', label: 'Stage as Home Office', description: 'Professional, warm, productive', emoji: '💼', prompt: 'Photoreal warm and inviting home office virtual staging. CRITICAL: Keep ALL doorways completely clear. Large executive desk in light oak or walnut positioned to face the room or angled toward window — never blocking any door. Upholstered desk chair in warm leather. Bookshelves against walls with books, plants, framed photos. Accent chairs in corner. Tall fiddle leaf fig in corner. Small plants on desk and shelves. Large art above desk, gallery wall on adjacent wall. Warm desk lamp and floor lamp. Keep ALL walls, floors, windows, and architecture exactly identical. Warm productive atmosphere, professional real estate photography.' },
    REMOVE_FURNITURE,
    { id: 'declutter', label: 'Declutter & Clean', description: 'Remove clutter, personal items only', emoji: '✨', prompt: 'Remove ALL personal items, clutter, clothes, laundry, and loose items from this bedroom — but keep all furniture in place. Result: clean, tidy, depersonalized bedroom. Improve brightness. Professional real estate photography.' },
    { id: 'brighten', label: 'Brighten & Enhance', description: 'More light, better colors', emoji: '💫', prompt: 'Dramatically brighten this bedroom. Make windows look light and airy. Warm up white balance. Make white bedding look crisp bright white. Boost vibrancy. Reduce shadows in corners. Keep every piece of furniture, every decor item, and every architectural element exactly identical — only improve brightness and color quality. Professional real estate photography.' },
  ],
  Bathroom: [
    { id: 'stage-spa', label: 'Spa-Like Styling', description: 'Luxurious, clean, resort feel', emoji: '🛁', prompt: 'Photoreal warm and inviting spa-style bathroom virtual staging. TOWELS: Fluffy white towels neatly arranged on towel bar or ladder rack. Hand towels folded precisely over towel rings. VANITY: Clear all clutter completely. Add: small glass tray with a diffuser, small air plant or pothos in simple pot, designer hand soap dispenser. BATHTUB if present: sparkling clean with wooden tub tray holding a white candle, small plant, and folded white washcloth. SHOWER: Clean bright glass. PLANTS: Small pothos or fern on vanity edge or windowsill. Snake plant in corner if space allows. WALLS: One small framed botanical print on bare wall. LIGHTING: Bright flattering vanity lights fully on. Keep ALL tile, fixtures, vanity cabinets, tub, shower, mirror, and all architectural elements exactly identical. Bright warm professional real estate photography.' },
    { id: 'brighten', label: 'Brighten & Enhance', description: 'Clean, bright, fresh', emoji: '💫', prompt: 'Dramatically brighten this bathroom. Make tile grout look clean and white. Make fixtures look polished and sparkling. Make mirror look crystal clear. Enhance vanity lighting. Make the space feel clean, fresh, and well-maintained. Keep ALL tile, fixtures, vanity, tub, shower, mirror, and all architectural elements exactly identical. Professional real estate photography.' },
    { id: 'declutter', label: 'Declutter & Clean', description: 'Remove personal items', emoji: '🧹', prompt: 'Remove ALL personal items — toiletries, shampoo bottles, razors, makeup, used towels, items on vanity counter, items in shower. Keep all fixtures, tile, vanity cabinets, tub, shower, mirror, toilet, and architectural features exactly identical. Add only: neatly folded white towels on towel bar, a small plant on vanity. Clean, depersonalized, spa-like result. Professional real estate photography.' },
  ],
  'Home Office': [
    { id: 'stage-office', label: 'Stage as Home Office', description: 'Professional, warm, productive', emoji: '💼', prompt: 'Photoreal warm and inviting home office virtual staging. CRITICAL: Keep ALL doorways completely clear. LAYOUT: Large executive desk in light oak or walnut positioned facing the room or angled toward window for natural light — never blocking any door. High-back upholstered desk chair in warm leather or cream fabric. Built-in or freestanding bookshelves against one or two walls filled with neatly organized books, small plants, framed photos, and decorative objects. One or two accent chairs for meetings in corner with small side table. PLANTS: Tall fiddle leaf fig or olive tree in corner. Small succulents on desk and shelves. WALLS: Large framed architectural or landscape art above desk. Gallery wall of smaller frames on adjacent wall. LIGHTING: Warm desk lamp on desk. Floor lamp in corner giving warm ambient light. SURFACES: Desk styled with leather desk pad, pen holder, small plant, and books. Keep ALL walls, floors, windows, and architectural details exactly identical. Warm productive atmosphere, professional real estate photography.' },
    { id: 'stage-bed', label: 'Stage as Bedroom', description: 'Convert to guest bedroom', emoji: '🛏️', prompt: 'Photoreal warm and inviting bedroom virtual staging. CRITICAL: Keep all doorways completely clear — never block any door with furniture. BED: Queen upholstered headboard in cream or warm grey against main wall, never blocking a door. Hotel-quality layered white bedding with warm-toned coverlet folded back 1/3. Euro shams, decorative pillows, chunky throw at foot. NIGHTSTANDS: Two matching nightstands with warm amber lamps, books, small plant. RUG: Large soft area rug under bed extending 24 inches beyond foot and 18 inches beyond sides. PLANTS: Fiddle leaf fig in corner. WALLS: Large framed art above headboard. Smaller frames on adjacent wall. ADDITIONAL: Upholstered bench at foot of bed. Keep ALL walls, floors, windows, and architectural details exactly identical. Warm natural light plus lamp glow. Professional MLS real estate photography.' },
    REMOVE_FURNITURE,
    { id: 'brighten', label: 'Brighten & Enhance', description: 'More light, better colors', emoji: '💫', prompt: 'Dramatically brighten this room. Maximize natural light from all windows. Warm up the white balance. Boost vibrancy and reduce shadows. Keep every piece of furniture, every decor item, and every architectural element exactly identical — only improve brightness, warmth, and color quality. Professional real estate photography.' },
  ],
  Other: [
    { id: 'stage-lr', label: 'Stage as Living Room', description: 'Warm, styled, ready to sell', emoji: '🛋️', prompt: 'Photoreal warm and inviting living room virtual staging. CRITICAL: Keep ALL doorways, stairways, and passages 100% clear — never block any door or staircase. If fireplace present: fully visible with warm crackling fire, seating faces it. Room must feel full — no bare walls or empty corners. Large plush sofa in warm cream or camel against back or longest wall. Accent chair in complementary tone. Coffee table with tray, candles, succulent, book. Two end tables with warm amber lamps. Large 9x12 area rug under all seating. Console table against any bare wall styled with books, plant, decor. Tall fiddle leaf fig in corner. Medium monstera on surface. Large warm landscape painting above sofa. Two botanical prints on adjacent wall. Throw blanket and decorative pillows in warm tones. Keep ALL walls, floors, windows, and architecture exactly identical. Warm professional MLS real estate photography.' },
    { id: 'stage-gr', label: 'Stage as Game Room', description: 'Fun, social, aspirational', emoji: '🎱', prompt: 'Photoreal warm and inviting game room virtual staging. CRITICAL: Keep ALL doorways, stairways, and passages 100% clear — never block any door or staircase. Pool table or shuffleboard centered as hero piece with pendant lights above. Bar cabinet with backlit shelving and glassware against one wall. Bar stools at counter. 2-4 leather lounge chairs with small round table in corner away from all pathways. Bold sports art or neon sign on walls. Plants in dark ceramic pots. Edison bulb lighting for warm atmosphere. Keep ALL walls, floors, windows, and architectural details exactly identical. Warm inviting lighting, professional real estate photography.' },
    { id: 'stage-mr', label: 'Stage as Media Room', description: 'Theater-style, cozy, cinematic', emoji: '🎬', prompt: 'Photoreal warm and inviting media room virtual staging. CRITICAL: Keep ALL doorways and stairways completely clear — never block any passage. Large framed TV on primary wall with flanking shelving. Large deep-seated sectional in dark grey or navy against back wall facing TV — clear walking paths on both sides. Large area rug under all seating. Low ottoman with popcorn bowl, remotes, candles. Side tables with warm amber lamps. Throw blankets on every seat. Warm dim amber atmosphere. Keep ALL walls, floors, windows, and architectural details exactly identical. Professional real estate photography.' },
    { id: 'stage-ho', label: 'Stage as Home Office', description: 'Professional, warm, productive', emoji: '💼', prompt: 'Photoreal warm and inviting home office virtual staging. CRITICAL: Keep ALL doorways completely clear. Large executive desk facing room or angled toward window — never blocking any door. Upholstered desk chair in warm leather. Bookshelves against walls. Accent chairs in corner. Tall fiddle leaf fig in corner. Small plants on desk and shelves. Large art above desk, gallery wall on adjacent wall. Warm desk lamp and floor lamp. Keep ALL walls, floors, windows, and architecture exactly identical. Warm productive atmosphere, professional real estate photography.' },
    REMOVE_FURNITURE,
    { id: 'declutter', label: 'Declutter & Clean', description: 'Remove furniture, personal items', emoji: '🧹', prompt: 'Remove ALL existing furniture, personal items, decor, and clutter. Keep walls, floors, windows, doors, ceiling, and all architectural features exactly identical. Brighten the room. Result: completely empty, bright, clean room. Professional real estate photography.' },
  ],
};
function getOptions(roomType: RoomType | null): EditOption[] {
  if (!roomType) return ROOM_OPTIONS.default;
  return (ROOM_OPTIONS as any)[roomType] || ROOM_OPTIONS.default;
}

function getGreeting(roomType: RoomType | null): string {
  const greetings: Record<string, string> = {
    'Exterior': "Exterior detected. Choose your enhancements — one credit for the full set.",
    'Backyard': "Backyard detected. Pick your enhancements — one credit for all selected.",
    'Rooftop Terrace': "Rooftop terrace detected. How do you want to transform this space?",
    'Balcony': "Balcony or courtyard detected. Choose your enhancements — one credit for all.",
    'Living Room': "Living room detected. How do you want to stage this space?",
    'Dining Room': "Dining room detected. How do you want to stage this space?",
    'Kitchen': "Kitchen detected. Select enhancements — one credit for all selected.",
    'Bedroom': "Bedroom detected. How do you want to stage this space?",
    'Bathroom': "Bathroom detected. Select enhancements — one credit for all.",
    'Home Office': "Home office detected. How do you want to stage this space?",
    'Other': "Large or flex space detected. How do you want to stage this space?",
  };
  return roomType ? (greetings[roomType] || greetings['Other']) : "How do you want to stage this space? — one credit for the full set.";
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

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        URL.revokeObjectURL(url);
        const MAX = 2048;
        let { width, height } = img;
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
          else { width = Math.round(width * MAX / height); height = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d')!.drawImage(img, 0, 0, width, height);
        canvas.toBlob(blob => {
          if (blob) resolve(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }));
          else resolve(file);
        }, 'image/jpeg', 0.85);
      };
      img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  };

  const processFile = useCallback(async (file: File) => {
    if (!file) return;
    setError(null);
    setSelectedOptions(new Set());
    setResults([]);
    
    const compressed = await compressImage(file);
    const previewUrl = URL.createObjectURL(compressed);
    setOriginalImage(previewUrl);
    setCurrentFile(compressed);

    if (!email) { setStep('email'); return; }

    setIsAnalyzing(true);
    setStep('options');
    try {
      const formData = new FormData();
      formData.append('image', compressed);
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const data = await res.json();
      setRoomType(data.roomType as RoomType);
    } catch { setRoomType('Other'); }
    finally { setIsAnalyzing(false); }
  }, [email]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles[0]) processFile(acceptedFiles[0]);
  }, [processFile]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'] }, maxFiles: 1
  } as any);

  const mobileInputRef = React.useRef<HTMLInputElement>(null);
  const handleMobileFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const handleEmailSubmit = async () => {
    if (!emailInput.includes('@')) return;
    setEmail(emailInput);
    try {
      const res = await fetch(`/api/user?email=${encodeURIComponent(emailInput)}`);
      const data = await res.json();
      setCredits(data.credits ?? 0);
    } catch { setCredits(0); }

    if (!currentFile) { setStep('upload'); return; }
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
    // iOS Safari requires opening in new tab for data URLs
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (isIOS) {
      const w = window.open('', '_blank');
      if (w) { w.document.write(`<img src="${imageToDownload}" style="max-width:100%"/>`); w.document.title = 'SmartStageAgent'; }
      return;
    }
    try {
      const res = await fetch(imageToDownload);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `smartstageagent-${result.option.id}.jpg`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      const a = document.createElement('a');
      a.href = imageToDownload; a.download = `smartstageagent-${result.option.id}.jpg`;
      a.click();
    }
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
    setStep('options'); setResults([]); setSelectedOptions(new Set()); setError(null); setActiveResult(null);
  };

  const options = getOptions(roomType);

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50">
      {/* Credit bar */}
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span className="hidden sm:inline">Select multiple enhancements — </span><strong>1 credit for all</strong>
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
              <div className="text-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2">Upload a Listing Photo</h1>
                <p className="text-slate-500 text-sm sm:text-base">AI detects the room and suggests enhancements. 1 credit for all selected.</p>
              </div>

              {/* Hidden mobile inputs */}
              <input ref={mobileInputRef} type="file" accept="image/*" className="hidden" onChange={handleMobileFile} />

              {/* Mobile buttons - shown on touch devices */}
              <div className="flex flex-col gap-3 sm:hidden mb-4">
                <button onClick={() => { const i = document.createElement('input'); i.type='file'; i.accept='image/*'; i.capture='environment'; i.onchange=(e:any)=>{ if(e.target.files?.[0]) processFile(e.target.files[0]); }; i.click(); }}
                  className="w-full flex items-center justify-center gap-3 py-5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-2xl text-lg transition-colors shadow-md">
                  📷 Take a Photo
                </button>
                <button onClick={() => { const i = document.createElement('input'); i.type='file'; i.accept='image/*'; i.onchange=(e:any)=>{ if(e.target.files?.[0]) processFile(e.target.files[0]); }; i.click(); }}
                  className="w-full flex items-center justify-center gap-3 py-5 bg-white border-2 border-slate-300 text-slate-700 font-bold rounded-2xl text-lg transition-colors shadow-sm">
                  🖼️ Choose from Library
                </button>
              </div>

              {/* Desktop dropzone - hidden on mobile */}
              <div {...getRootProps()} className={cn("hidden sm:flex border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition-all flex-col items-center gap-4", isDragActive ? "border-orange-500 bg-orange-50" : "border-slate-300 hover:border-orange-400 hover:bg-slate-100 bg-white")}>
                <input {...getInputProps()} />
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <Upload className="w-8 h-8 text-orange-500" />
                </div>
                <div>
                  <p className="text-lg font-bold text-slate-900 mb-1">{isDragActive ? 'Drop it here' : 'Drag & drop your photo here'}</p>
                  <p className="text-slate-500 text-sm">or click to browse — JPG, PNG, WEBP, HEIC up to 10MB</p>
                </div>
                <div className="flex items-center gap-6 text-xs text-slate-400 mt-2">
                  <span>🏠 Exteriors</span><span>🛋️ Living Rooms</span><span>🍳 Kitchens</span><span>🛏️ Bedrooms</span>
                </div>
              </div>

              <p className="text-center text-xs text-slate-400 mt-4">Free to upload. 1 credit charged per generation. Photos deleted after 24 hours.</p>
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
              <div className="flex flex-col md:grid md:grid-cols-2 gap-6">
                <div>
                  <div className="aspect-video sm:aspect-[4/3] rounded-2xl overflow-hidden bg-slate-200 shadow-sm">
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
                    {selectedOptions.size === 0 ? 'Select enhancements above' : `Generate {selectedOptions.size > 1 ? `${selectedOptions.size} Enhancements` : '1 Enhancement'} — 1 Credit`}
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
                <div className="flex gap-2 mb-4 flex-wrap justify-center px-1">
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
                  <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 aspect-[4/3] sm:aspect-[16/9] mb-4 bg-slate-900">
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

                  <div className="flex flex-col gap-3 sm:flex-row sm:justify-center sm:flex-wrap">
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
