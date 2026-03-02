import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, Wand2, Loader2, Download, ChevronRight, RotateCcw, Sparkles, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ImageComparison } from '../components/ImageComparison';
import { cn } from '../lib/utils';

type RoomType = 'Living Room' | 'Kitchen' | 'Bedroom' | 'Bathroom' | 'Dining Room' | 'Exterior' | 'Backyard' | 'Other';
type Step = 'upload' | 'options' | 'result';

interface EditOption {
  id: string;
  label: string;
  description: string;
  emoji: string;
  prompt: string;
}

const ROOM_OPTIONS: Record<string, EditOption[]> = {
  Exterior: [
    { id: 'twilight', label: 'Virtual Twilight', description: 'Golden hour magic — proven to get more clicks', emoji: '🌅', prompt: 'Convert to realistic twilight exterior photo, warm glowing windows, dramatic sky gradient from orange to deep blue, professional real estate photography' },
    { id: 'grass', label: 'Green the Grass', description: 'Lush, vibrant lawn that pops online', emoji: '🌿', prompt: 'Make the lawn lush green and vibrant, healthy thick grass, professional real estate photography, keep everything else identical' },
    { id: 'lights', label: 'Turn On Interior Lights', description: 'Warm, inviting glow from inside', emoji: '💡', prompt: 'Add warm glowing light visible through all windows as if lights are on inside, welcoming atmosphere, professional real estate photography' },
    { id: 'sky', label: 'Blue Sky Swap', description: 'Replace overcast sky with bright blue', emoji: '☀️', prompt: 'Replace sky with beautiful bright blue sky and white clouds, keep all other elements identical, professional real estate photography' },
    { id: 'declutter', label: 'Remove Clutter', description: 'Clean up bins, cars, debris', emoji: '🧹', prompt: 'Remove any trash cans, debris, vehicles, or clutter from the scene, keep architecture identical, clean professional real estate photography' },
  ],
  Backyard: [
    { id: 'twilight', label: 'Virtual Twilight', description: 'Stunning evening ambiance', emoji: '🌅', prompt: 'Convert backyard to realistic twilight photo, warm ambient lighting, dramatic sky, professional real estate photography' },
    { id: 'grass', label: 'Green the Grass', description: 'Perfect lawn all year round', emoji: '🌿', prompt: 'Make lawn lush green and vibrant, healthy thick grass, professional real estate photography, keep everything else identical' },
    { id: 'stage', label: 'Add Outdoor Furniture', description: 'Stage with patio set, fire pit', emoji: '🪑', prompt: 'Add tasteful modern outdoor furniture — patio dining set, lounge chairs — keep existing architecture identical, professional real estate photography' },
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
    'Exterior': "I can see this is the front of the home. What would you like to improve?",
    'Backyard': "Nice backyard shot! What would you like to enhance?",
    'Living Room': "Got it — living room detected. How would you like to stage it?",
    'Kitchen': "Kitchen photo detected. What transformation are you going for?",
    'Bedroom': "Bedroom ready for staging. Pick your style:",
    'Bathroom': "Bathroom detected. What would you like to improve?",
    'Dining Room': "Dining room detected. How would you like to stage it?",
    'Other': "Photo uploaded. What would you like to do with it?",
  };
  return roomType ? (greetings[roomType] || greetings['Other']) : "What would you like to do with this photo?";
}

export function Editor() {
  const [step, setStep] = useState<Step>('upload');
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [roomType, setRoomType] = useState<RoomType | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedOption, setSelectedOption] = useState<EditOption | null>(null);
  const [credits, setCredits] = useState(3);
  const [showCreditWarning, setShowCreditWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setOriginalImage(previewUrl);
    setCurrentFile(file);
    setGeneratedImage(null);
    setSelectedOption(null);
    setError(null);
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
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop, accept: { 'image/*': [] }, maxFiles: 1
  } as any);

  const handleGenerate = async (option: EditOption) => {
    if (!originalImage || !currentFile) return;
    if (credits < 1) { setShowCreditWarning(true); return; }
    setSelectedOption(option);
    setIsGenerating(true);
    setError(null);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(currentFile);
      reader.onload = async () => {
        const base64Image = reader.result as string;
        const res = await fetch('/api/stage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image, prompt: option.prompt })
        });
        const data = await res.json();
        if (!res.ok || data.error) {
          setError(data.error || 'Generation failed. Please try again.');
          setIsGenerating(false);
          return;
        }
        setGeneratedImage(data.generatedImage);
        setCredits(prev => Math.max(0, prev - 1));
        setStep('result');
        setIsGenerating(false);
      };
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
      setIsGenerating(false);
    }
  };

  const handleReset = () => {
    setStep('upload'); setOriginalImage(null); setGeneratedImage(null);
    setRoomType(null); setSelectedOption(null); setError(null); setCurrentFile(null);
  };

  const handleTryAnother = () => {
    setStep('options'); setGeneratedImage(null); setSelectedOption(null); setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-64px)] bg-slate-50">
      <div className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span>Each enhancement uses <strong>1 credit</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-900">{credits} credits remaining</span>
          {credits < 2 && (
            <button className="text-xs bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded-full font-medium transition-colors">
              Buy More
            </button>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <AnimatePresence mode="wait">

          {step === 'upload' && (
            <motion.div key="upload" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-slate-900 mb-2">Upload a Listing Photo</h1>
                <p className="text-slate-500">Drop any room or exterior — AI detects what it is and suggests the right enhancements.</p>
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
              <p className="text-center text-xs text-slate-400 mt-4">No credit charged for uploading. Credits only used when you generate an enhancement.</p>
            </motion.div>
          )}

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
                        <p className="text-sm text-slate-500">Detecting room type and best options</p>
                      </div>
                    </div>
                  ) : (
                    <div className="mb-6 bg-[#1E3A8A] rounded-xl p-4 text-white">
                      <div className="flex items-center gap-2 mb-1">
                        <Sparkles className="w-4 h-4 text-orange-400" />
                        <span className="text-xs font-medium text-blue-300 uppercase tracking-wide">{roomType ? `Detected: ${roomType}` : 'Ready'}</span>
                      </div>
                      <p className="font-semibold">{getGreeting(roomType)}</p>
                    </div>
                  )}
                  {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4 shrink-0" />{error}
                    </div>
                  )}
                  <div className="space-y-2">
                    {getOptions(roomType).map(option => (
                      <button key={option.id} onClick={() => handleGenerate(option)} disabled={isGenerating || isAnalyzing}
                        className={cn("w-full flex items-center gap-4 p-4 bg-white hover:bg-orange-50 border-2 border-slate-200 hover:border-orange-400 rounded-xl text-left transition-all group",
                          isGenerating && selectedOption?.id === option.id && "border-orange-500 bg-orange-50",
                          (isGenerating || isAnalyzing) && selectedOption?.id !== option.id && "opacity-50 cursor-not-allowed"
                        )}>
                        <span className="text-2xl shrink-0">{option.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            {option.label}
                            {isGenerating && selectedOption?.id === option.id && <Loader2 className="w-4 h-4 animate-spin text-orange-500" />}
                          </div>
                          <div className="text-sm text-slate-500 truncate">{option.description}</div>
                        </div>
                        <div className="shrink-0 flex items-center gap-1 text-xs font-medium text-slate-400 group-hover:text-orange-500">
                          1 credit <ChevronRight className="w-4 h-4" />
                        </div>
                      </button>
                    ))}
                  </div>
                  {isGenerating && <p className="text-center text-sm text-slate-500 mt-4 animate-pulse">Generating your enhanced photo... ~15 seconds</p>}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'result' && originalImage && generatedImage && (
            <motion.div key="result" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-4 py-2 rounded-full text-sm font-bold mb-4">
                  ✓ Enhancement complete — {selectedOption?.label}
                </div>
                <h2 className="text-2xl font-black text-slate-900">Drag the handle to compare</h2>
              </div>
              <div className="rounded-2xl overflow-hidden shadow-xl border border-slate-200 aspect-[16/9] mb-6 bg-slate-900">
                <ImageComparison beforeImage={originalImage} afterImage={generatedImage} objectFit="contain" />
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a href={generatedImage} download={`stagesmart-${selectedOption?.id || 'enhanced'}.jpg`}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-[#1E3A8A] hover:bg-blue-900 text-white font-bold rounded-xl transition-colors">
                  <Download className="w-5 h-5" /> Download HD Photo
                </a>
                <button onClick={handleTryAnother}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border-2 border-slate-200 transition-colors">
                  <Wand2 className="w-5 h-5 text-orange-500" /> Try Another Enhancement
                </button>
                <button onClick={handleReset}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 text-slate-500 font-medium rounded-xl border border-slate-200 transition-colors">
                  <Upload className="w-4 h-4" /> New Photo
                </button>
              </div>
              <p className="text-center text-xs text-slate-400 mt-4">Download is free. No charges to share or text this photo.</p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showCreditWarning && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6">
              <h3 className="text-xl font-bold text-slate-900 mb-2">Out of credits</h3>
              <p className="text-slate-600 text-sm mb-6">Purchase more to keep enhancing your listing photos.</p>
              <div className="space-y-2 mb-4">
                {[
                  { id: '1pack', label: '1 Photo', price: '$5', popular: false },
                  { id: '5pack', label: '5 Photos', price: '$20', popular: true },
                  { id: '10pack', label: '10 Photos', price: '$40', popular: false },
                ].map(pkg => (
                  <button key={pkg.id} onClick={async () => {
                    const res = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ packageId: pkg.id }) });
                    const data = await res.json();
                    if (data.url) window.location.href = data.url;
                  }} className={cn("w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all text-left",
                    pkg.popular ? "border-orange-500 bg-orange-50" : "border-slate-200 hover:border-orange-300")}>
                    <span className="font-bold text-slate-900">{pkg.label}{pkg.popular && <span className="ml-2 text-[10px] bg-orange-500 text-white px-2 py-0.5 rounded-full uppercase">Popular</span>}</span>
                    <span className="font-bold text-[#1E3A8A]">{pkg.price}</span>
                  </button>
                ))}
              </div>
              <button onClick={() => setShowCreditWarning(false)} className="w-full text-sm text-slate-500 hover:text-slate-700">Cancel</button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
