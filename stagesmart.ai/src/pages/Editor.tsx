import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Wand2, Loader2, Download, RotateCcw, Sparkles, AlertCircle, Mail, CheckSquare, Square } from 'lucide-react';
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

const ROOM_OPTIONS: Record<string, EditOption[]> = {
  Exterior: [
    { id: 'twilight', label: 'Virtual Twilight', description: 'Golden hour sky, warm glowing windows', emoji: '🌅', prompt: 'Convert to realistic twilight exterior photo, warm glowing windows, dramatic sky gradient from orange to deep blue, professional real estate photography, keep all architecture identical' },
    { id: 'grass', label: 'Green the Grass', description: 'Lush vibrant lawn that pops online', emoji: '🌿', prompt: 'Make the lawn lush green and vibrant, healthy thick grass, professional real estate photography, keep everything else identical' },
    { id: 'lights', label: 'Turn On Interior Lights', description: 'Warm inviting glow from inside', emoji: '💡', prompt: 'Add warm glowing light visible through all windows as if lights are on inside, welcoming atmosphere, professional real estate photography, keep architecture identical' },
    { id: 'sky', label: 'Blue Sky Swap', description: 'Replace overcast sky with bright blue', emoji: '☀️', prompt: 'Replace sky with beautiful bright blue sky and white clouds, keep all other elements identical, professional real estate photography' },
    { id: 'declutter', label: 'Remove Clutter', description: 'Clean up bins, cars, debris', emoji: '🧹', prompt: 'Remove any trash cans, debris, vehicles, or clutter from the scene, keep architecture identical, clean professional real estate photography' },
  ],
  Backyard: [
    { id: 'twilight', label: 'Virtual Twilight', description: 'Stunning evening ambiance', emoji: '🌅', prompt: 'Convert backyard to realistic twilight photo, warm ambient lighting, dramatic sky, professional real estate photography' },
    { id: 'grass', label: 'Green the Grass', description: 'Perfect lawn all year round', emoji: '🌿', prompt: 'Make lawn lush green and vibrant, healthy thick grass, professional real estate photography, keep everything else identical' },
    { id: 'furniture', label: 'Add Outdoor Furniture', description: 'Stage with patio set, fire pit', emoji: '🪑', prompt: 'Add tasteful modern outdoor furniture — patio dining set, lounge chairs — keep existing architecture identical, professional real estate photography' },
  ],
  default: [
    { id: 'stage-modern', label: 'Modern Staging', description: 'Clean lines, neutral tones', emoji: '🛋️', prompt: 'Photoreal modern virtual staging, add contemporary furniture with neutral tones, clean lines, keeping all architecture exact, MLS-ready real estate photography' },
    { id: 'stage-traditional', label: 'Traditional Staging', description: 'Warm, classic, inviting', emoji: '🏡', prompt: 'Photoreal traditional virtual staging, add classic furniture with warm colors, keeping all architecture exact, MLS-ready real estate photography' },
    { id: 'stage-farmhouse', label: 'Farmhouse Staging', description: 'Rustic charm, shiplap vibes', emoji: '🌾', prompt: 'Photoreal farmhouse style virtual staging, add rustic furniture with warm wood tones, keeping all architecture exact, MLS-ready real estate photography' },
    { id: 'declutter', label: 'Declutter & Clean', description: 'Remove furniture, personal items', emoji: '✨', prompt: 'Remove all furniture, personal items, and clutter. Keep walls, floors, windows and architectural features identical. Bright clean empty room, professional real estate photography' },
    { id: 'brighten', label: 'Brighten & Enhance', description: 'More light, better colors', emoji: '💫', prompt: 'Brighten the room, enhance natural light, improve color balance and warmth, professional real estate photography, keep all elements identical' },
  ]
};

function getOptions(roomType: RoomType | null): EditOption[] {
  if (!roomType) return ROOM_OPTIONS.default;
  return ROOM_OPTIONS[roomType] || ROOM_OPTIONS.default;
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

export function Editor() {
  const [step, setStep] = useState<Step>('upload');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
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

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setOriginalImage(previewUrl);
    setCurrentFile(file);
    setSelectedOptions(new Set());
    setResults([]);
    setError(null);

    if (!email) {
      setStep('email');
      return;
    }

    setIsAnalyzing(true);
    setStep('options');
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await fetch('/api/analyze', { method: 'POST', body: formData });
      const data = await res.json();
      setRoomType(data.roomType as RoomType);
    } catch {
      setRoomType('Other');
    } finally {
      setIsAnalyzing(false);
    }
  }, [email]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1
  } as any);

  const handleEmailSubmit = async () => {
    if (!emailInput.includes('@')) return;
    setEmail(emailInput);
    // Check credits
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
    } catch {
      setRoomType('Other');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const toggleOption = (id: string) => {
    setSelectedOptions(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleGenerateAll = async () => {
    if (!originalImage || !currentFile || selectedOptions.size === 0) return;
    if (credits < 1) { setShowCreditWarning(true); return; }

    setStep('generating');
    setIsGenerating(true);
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
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image, prompt: option.prompt, email })
          });
          const data = await res.json();
          if (data.previewImage) {
            newResults.push({ option, image: data.previewImage, generationId: data.generationId });
          }
        } catch (err) {
          console.error(`Failed to generate ${option.label}:`, err);
        }
        setGeneratingProgress(Math.round(((i + 1) / options.length) * 100));
      }

      // Deduct one credit for the whole batch
      setCredits(prev => Math.max(0, prev - 1));
      setResults(newResults);
      setActiveResult(newResults[0] || null);
      setIsGenerating(false);
      setStep('result');
    };
  };

  const handleReset = () => {
    setStep('upload'); setOriginalImage(null); setResults([]);
    setRoomType(null); setSelectedOptions(new Set()); setError(null); setCurrentFile(null); setActiveResult(null);
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
          <span>Select multiple enhancements — <strong>1 credit for all</strong></span>
        </div>
        <div className="flex items-center gap-2">
          {email && <span className="text-xs text-slate-400">{email}</span>}
          <span className="text-sm font-bold text-slate-900">{credits} credits</span>
          <button onClick={() => setShowCreditWarning(true)} className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-full font-medium transition-colors">
            Buy Credits
          </button>
        </div>
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
              <p className="text-center text-xs text-slate-400 mt-4">Free to upload and preview. 1 credit charged per generation batch. Photos purged after 24 hours.</p>
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
                  type="email"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleEmailSubmit()}
                  placeholder="you@brokerage.com"
                  className="w-full border-2 border-slate-200 focus:border-orange-400 rounded-xl px-4 py-3 text-slate-900 placeholder-slate-400 outline-none transition-colors mb-4"
                  autoFocus
                />
                <button
                  onClick={handleEmailSubmit}
                  disabled={!emailInput.includes('@')}
                  className="w-full py-3 bg-[#1E3A8A] hover:bg-blue-900 disabled:bg-slate-300 text-white font-bold rounded-xl transition-colors"
                >
                  Continue →
                </button>
                <p className="text-center text-xs text-slate-400 mt-3">No password needed. We use your email to store credits.</p>
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
                        <button
                          key={option.id}
                          onClick={() => toggleOption(option.id)}
                          className={cn(
                            "w-full flex items-center gap-4 p-4 border-2 rounded-xl text-left transition-all",
                            selected ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white hover:border-orange-300 hover:bg-slate-50"
                          )}
                        >
                          {selected
                            ? <CheckSquare className="w-5 h-5 text-orange-500 shrink-0" />
                            : <Square className="w-5 h-5 text-slate-300 shrink-0" />
                          }
                          <span className="text-xl shrink-0">{option.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-slate-900">{option.label}</div>
                            <div className="text-sm text-slate-500">{option.description}</div>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={handleGenerateAll}
                    disabled={selectedOptions.size === 0 || isAnalyzing}
                    className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-black text-lg rounded-xl flex items-center justify-center gap-2 transition-colors"
                  >
                    <Wand2 className="w-5 h-5" />
                    {selectedOptions.size === 0
                      ? 'Select enhancements above'
                      : `Generate ${selectedOptions.size} Enhancement${selectedOptions.size > 1 ? 's' : ''} — 1 Credit`
                    }
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
              <div className="max-w-sm mx-auto bg-slate-200 rounded-full h-3 overflow-hidden">
                <motion.div
                  className="h-full bg-orange-500 rounded-full"
                  initial={{ width: '0%' }}
                  animate={{ width: `${generatingProgress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              <p className="text-sm text-slate-400 mt-3">{generatingProgress}% complete</p>
              <p className="text-xs text-slate-400 mt-6 italic">Did you know? Twilight photos get 3x more saves on Zillow.</p>
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

              {/* Tab selector if multiple results */}
              {results.length > 1 && (
                <div className="flex gap-2 mb-4 flex-wrap justify-center">
                  {results.map(r => (
                    <button
                      key={r.option.id}
                      onClick={() => setActiveResult(r)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-bold transition-all",
                        activeResult?.option.id === r.option.id
                          ? "bg-orange-500 text-white"
                          : "bg-white border-2 border-slate-200 text-slate-700 hover:border-orange-300"
                      )}
                    >
                      {r.option.emoji} {r.option.label}
                    </button>
                  ))}
                </div>
              )}

              {activeResult && (
                <>
                  <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 aspect-[16/9] mb-6 bg-slate-900">
                    <ImageComparison beforeImage={originalImage} afterImage={activeResult.image} objectFit="contain" />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <a
                      href={activeResult.image}
                      download={`stagesmart-${activeResult.option.id}.jpg`}
                      className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold rounded-xl transition-colors"
                    >
                      <Download className="w-5 h-5" /> Download {activeResult.option.label}
                    </a>
                    <button onClick={handleTryAnother} className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border-2 border-slate-200 transition-colors">
                      <Wand2 className="w-5 h-5 text-orange-500" /> New Enhancements
                    </button>
                    <button onClick={handleReset} className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-500 font-medium rounded-xl border border-slate-200 transition-colors">
                      <Upload className="w-4 h-4" /> New Photo
                    </button>
                  </div>
                  <p className="text-center text-xs text-slate-400 mt-4">
                    Download is free. Photos available for 24 hours — we don't store your images long term. AI-enhanced — disclose as required by your MLS.
                  </p>
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
              <p className="text-slate-500 text-sm mb-6">Each credit = unlimited enhancements on one photo batch.</p>
              <div className="space-y-2 mb-4">
                {[
                  { id: '1pack', label: '1 Photo Batch', price: '$5', credits: 1, popular: false },
                  { id: '5pack', label: '5 Photo Batches', price: '$20', credits: 5, popular: true },
                  { id: '10pack', label: '10 Photo Batches', price: '$30', credits: 10, popular: false },
                  { id: '25pack', label: '25 Photo Batches', price: '$50', credits: 25, popular: false },
                ].map(pkg => (
                  <button key={pkg.id} onClick={async () => {
                    if (!email) { setShowCreditWarning(false); setStep('email'); return; }
                    const res = await fetch('/api/checkout', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ packageId: pkg.id, email })
                    });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  }}
                    className={cn("w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left",
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
