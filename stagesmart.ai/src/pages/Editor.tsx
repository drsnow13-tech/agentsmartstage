import React, { useState, useCallback, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Wand2, Image as ImageIcon, Settings2, AlertCircle, Loader2, Check, Sparkles, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { ImageComparison } from '../components/ImageComparison';

type RoomType = 'Living Room' | 'Kitchen' | 'Bedroom' | 'Bathroom' | 'Dining Room' | 'Exterior' | 'Backyard' | 'Other';
type StyleType = 'Modern' | 'Traditional' | 'Mid-Century' | 'Farmhouse' | 'Twilight';

interface PhotoState {
  id: string;
  file: File;
  previewUrl: string;
  roomType: RoomType | null;
  style: StyleType;
  updates: {
    paint: string | null;
    counters: string | null;
    floors: string | null;
  };
  promptMode: 'guided' | 'custom';
  customPrompt: string;
  isAnalyzing: boolean;
  generatedUrl: string | null;
  isGenerating: boolean;
}

const STYLES: StyleType[] = ['Modern', 'Traditional', 'Mid-Century', 'Farmhouse', 'Twilight'];
const UPDATES = {
  paint: ['White', 'Gray', 'Beige', 'Navy', 'Sage', 'Taupe'],
  counters: ['Quartz White', 'Marble Gray', 'Granite Black', 'Wood', 'Black', 'Tile'],
  floors: ['Oak', 'LVP Gray', 'Tile', 'Carpet', 'Laminate', 'White Oak']
};

export function Editor() {
  const [photos, setPhotos] = useState<PhotoState[]>([]);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [credits, setCredits] = useState<number>(0);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  useEffect(() => {
    fetch('/api/user')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
      })
      .then(data => {
        if (data && data.credits !== undefined) {
          setCredits(data.credits);
        }
      })
      .catch(console.error);
  }, []);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newPhotos = acceptedFiles.map(file => ({
      id: Math.random().toString(36).substring(7),
      file,
      previewUrl: URL.createObjectURL(file),
      roomType: null,
      style: 'Modern' as StyleType,
      updates: { paint: null, counters: null, floors: null },
      promptMode: 'guided' as const,
      customPrompt: '',
      isAnalyzing: true,
      generatedUrl: null,
      isGenerating: false
    }));

    setPhotos(prev => [...prev, ...newPhotos]);
    if (!activePhotoId && newPhotos.length > 0) {
      setActivePhotoId(newPhotos[0].id);
    }

    // Analyze each new photo
    for (const photo of newPhotos) {
      const formData = new FormData();
      formData.append('image', photo.file);

      try {
        const res = await fetch('/api/analyze', {
          method: 'POST',
          body: formData
        });
        
        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }
        
        const data = await res.json();
        
        setPhotos(prev => prev.map(p => 
          p.id === photo.id 
            ? { ...p, roomType: data.roomType as RoomType, isAnalyzing: false }
            : p
        ));
      } catch (error) {
        console.error('Analysis failed:', error);
        setPhotos(prev => prev.map(p => 
          p.id === photo.id 
            ? { ...p, roomType: 'Other', isAnalyzing: false }
            : p
        ));
      }
    }
  }, [activePhotoId]);

  const loadDemoPhoto = async () => {
    try {
      const res = await fetch('https://picsum.photos/seed/demo/800/600');
      const blob = await res.blob();
      const file = new File([blob], 'demo.jpg', { type: 'image/jpeg' });
      
      const newPhoto = {
        id: 'demo-123',
        file,
        previewUrl: URL.createObjectURL(file),
        roomType: 'Living Room' as RoomType,
        style: 'Modern' as StyleType,
        updates: { paint: null, counters: null, floors: null },
        promptMode: 'guided' as const,
        customPrompt: '',
        isAnalyzing: false,
        generatedUrl: null,
        isGenerating: false
      };
      
      setPhotos(prev => [...prev, newPhoto]);
      setActivePhotoId(newPhoto.id);
    } catch (e) {
      console.error('Failed to load demo photo', e);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 5
  } as any);

  const activePhoto = photos.find(p => p.id === activePhotoId);

  const updateActivePhoto = (updates: Partial<PhotoState>) => {
    setPhotos(prev => prev.map(p => p.id === activePhotoId ? { ...p, ...updates } : p));
  };

  const removePhoto = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotos(prev => prev.filter(p => p.id !== id));
    if (activePhotoId === id) {
      setActivePhotoId(photos.find(p => p.id !== id)?.id || null);
    }
  };

  const generatePrompt = (photo: PhotoState) => {
    if (photo.promptMode === 'custom') return photo.customPrompt;

    let base = `Photoreal ${photo.style.toLowerCase()} virtual staging real estate ${photo.roomType || 'room'}`;
    
    if (photo.style === 'Twilight' && (photo.roomType === 'Exterior' || photo.roomType === 'Backyard')) {
      base = `Day to realistic twilight exterior, green grass, warm lights, MLS photo`;
    } else {
      base += `, add furniture keeping architecture exact, MLS photo.`;
    }

    const updatesList = [];
    if (photo.updates.paint) updatesList.push(`${photo.updates.paint.toLowerCase()} paint`);
    if (photo.updates.counters) updatesList.push(`${photo.updates.counters.toLowerCase()} counters`);
    if (photo.updates.floors) updatesList.push(`${photo.updates.floors.toLowerCase()} floors`);

    if (updatesList.length > 0) {
      base += ` + ${updatesList.join(' + ')}.`;
    }

    return base;
  };

  const handleGenerate = async () => {
    if (!activePhoto) return;
    
    if (credits < 1) {
      setShowDisclaimer(true);
      return;
    }

    updateActivePhoto({ isGenerating: true });

    try {
      const prompt = generatePrompt(activePhoto);
      
      // Convert file to base64
      const reader = new FileReader();
      reader.readAsDataURL(activePhoto.file);
      reader.onload = async () => {
        const base64Image = reader.result as string;
        
        const res = await fetch('/api/stage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64Image, prompt })
        });
        
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || `Server returned ${res.status}`);
        }
        
        const data = await res.json();
        
        if (data.error) {
          alert(data.error);
          updateActivePhoto({ isGenerating: false });
          return;
        }

        updateActivePhoto({ generatedUrl: data.generatedImage, isGenerating: false });
        setCredits(prev => prev - 1);
      };
    } catch (error) {
      console.error('Generation failed:', error);
      updateActivePhoto({ isGenerating: false });
      alert('Failed to generate image. Please try again.');
    }
  };

  const handleCheckout = async (packageId: string) => {
    setIsCheckingOut(true);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId })
      });
      
      if (!res.ok) {
        throw new Error(`Server returned ${res.status}`);
      }
      
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-64px)] overflow-hidden">
      {/* Sidebar - Photos List */}
      <div className="w-full lg:w-80 bg-white border-r border-slate-200 flex flex-col h-full overflow-y-auto">
        <div className="p-4 border-b border-slate-200 bg-slate-50 sticky top-0 z-10 flex justify-between items-center">
          <h2 className="font-bold text-slate-900 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> Photos ({photos.length}/5)
          </h2>
          <div className="text-xs font-semibold bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
            {credits} Credits
          </div>
        </div>
        
        <div className="p-4 space-y-3">
          {photos.map(photo => (
            <div 
              key={photo.id}
              onClick={() => setActivePhotoId(photo.id)}
              className={cn(
                "relative rounded-lg overflow-hidden border-2 cursor-pointer transition-all group aspect-video",
                activePhotoId === photo.id ? "border-orange-500 shadow-md" : "border-transparent hover:border-slate-300"
              )}
            >
              <img src={photo.previewUrl} alt="Preview" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-2">
                <div className="text-white text-xs font-medium truncate">
                  {photo.isAnalyzing ? (
                    <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Analyzing...</span>
                  ) : (
                    photo.roomType || 'Unknown Room'
                  )}
                </div>
              </div>
              <button 
                onClick={(e) => removePhoto(photo.id, e)}
                className="absolute top-2 right-2 w-6 h-6 bg-black/50 hover:bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
              {photo.generatedUrl && (
                <div className="absolute top-2 left-2 w-6 h-6 bg-green-500 rounded-full text-white flex items-center justify-center shadow-sm">
                  <Check className="w-3 h-3" />
                </div>
              )}
            </div>
          ))}

          {photos.length < 5 && (
            <div 
              {...getRootProps()} 
              className={cn(
                "border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors flex flex-col items-center justify-center aspect-video",
                isDragActive ? "border-orange-500 bg-orange-50" : "border-slate-300 hover:border-[#1E3A8A] hover:bg-slate-50"
              )}
            >
              <input {...getInputProps()} />
              <Upload className="w-6 h-6 text-slate-400 mb-2" />
              <span className="text-sm text-slate-500 font-medium">Add Photo</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col bg-slate-100 overflow-y-auto">
        {activePhoto ? (
          <div className="max-w-5xl mx-auto w-full p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
            
            {/* Image Preview */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="aspect-[16/9] relative bg-slate-900 flex items-center justify-center">
                {activePhoto.isGenerating ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 z-10 text-white">
                    <Loader2 className="w-12 h-12 animate-spin text-orange-500 mb-4" />
                    <p className="font-medium text-lg">Staging your room...</p>
                    <p className="text-slate-400 text-sm mt-2">This takes about 10 seconds</p>
                  </div>
                ) : null}
                
                {activePhoto.generatedUrl ? (
                  <ImageComparison 
                    beforeImage={activePhoto.previewUrl} 
                    afterImage={activePhoto.generatedUrl} 
                    objectFit="contain"
                  />
                ) : (
                  <img 
                    src={activePhoto.previewUrl} 
                    alt="Editor View" 
                    className="w-full h-full object-contain"
                  />
                )}
                
                {activePhoto.generatedUrl && (
                  <div className="absolute top-4 right-4 flex gap-2 z-20">
                    <a 
                      href={activePhoto.generatedUrl}
                      download={`staged-${activePhoto.id}.png`}
                      className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg shadow-lg hover:bg-slate-800 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" /> Download HD
                    </a>
                  </div>
                )}
              </div>
            </div>

            {/* Controls */}
            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                      <Settings2 className="w-5 h-5 text-[#1E3A8A]" /> Staging Settings
                    </h3>
                    <div className="flex bg-slate-100 p-1 rounded-lg">
                      <button 
                        onClick={() => updateActivePhoto({ promptMode: 'guided' })}
                        className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-colors", activePhoto.promptMode === 'guided' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                      >
                        Guided
                      </button>
                      <button 
                        onClick={() => updateActivePhoto({ promptMode: 'custom' })}
                        className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-colors", activePhoto.promptMode === 'custom' ? "bg-white shadow-sm text-slate-900" : "text-slate-500 hover:text-slate-700")}
                      >
                        Custom
                      </button>
                    </div>
                  </div>

                  {activePhoto.promptMode === 'guided' ? (
                    <div className="space-y-6">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-3">Style</label>
                        <div className="flex flex-wrap gap-2">
                          {STYLES.map(style => (
                            <button
                              key={style}
                              onClick={() => updateActivePhoto({ style })}
                              className={cn(
                                "px-4 py-2 rounded-xl text-sm font-medium transition-all border",
                                activePhoto.style === style 
                                  ? "bg-orange-50 border-orange-500 text-orange-700" 
                                  : "bg-white border-slate-200 text-slate-600 hover:border-slate-300"
                              )}
                            >
                              {style}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-slate-100">
                        <div>
                          <label htmlFor="paint-select" className="block text-sm font-semibold text-slate-700 mb-2">Paint ($1)</label>
                          <select 
                            id="paint-select"
                            value={activePhoto.updates.paint || ''}
                            onChange={(e) => updateActivePhoto({ updates: { ...activePhoto.updates, paint: e.target.value || null } })}
                            className="w-full rounded-lg border-slate-200 text-sm focus:ring-orange-500 focus:border-orange-500"
                          >
                            <option value="">Keep original</option>
                            {UPDATES.paint.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="counters-select" className="block text-sm font-semibold text-slate-700 mb-2">Counters ($1)</label>
                          <select 
                            id="counters-select"
                            value={activePhoto.updates.counters || ''}
                            onChange={(e) => updateActivePhoto({ updates: { ...activePhoto.updates, counters: e.target.value || null } })}
                            className="w-full rounded-lg border-slate-200 text-sm focus:ring-orange-500 focus:border-orange-500"
                          >
                            <option value="">Keep original</option>
                            {UPDATES.counters.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                        <div>
                          <label htmlFor="floors-select" className="block text-sm font-semibold text-slate-700 mb-2">Floors ($1)</label>
                          <select 
                            id="floors-select"
                            value={activePhoto.updates.floors || ''}
                            onChange={(e) => updateActivePhoto({ updates: { ...activePhoto.updates, floors: e.target.value || null } })}
                            className="w-full rounded-lg border-slate-200 text-sm focus:ring-orange-500 focus:border-orange-500"
                          >
                            <option value="">Keep original</option>
                            {UPDATES.floors.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Custom Prompt</label>
                      <textarea 
                        value={activePhoto.customPrompt}
                        onChange={(e) => updateActivePhoto({ customPrompt: e.target.value })}
                        placeholder="Describe exactly how you want the room staged..."
                        className="w-full rounded-xl border-slate-200 text-sm focus:ring-orange-500 focus:border-orange-500 min-h-[120px] resize-none"
                        maxLength={2000}
                      />
                      <div className="text-xs text-slate-500 mt-2 text-right">
                        {activePhoto.customPrompt.length}/2000
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="lg:col-span-1">
                <div className="bg-[#1E3A8A] rounded-2xl shadow-sm p-6 text-white sticky top-6">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-400" /> Ready to Stage
                  </h3>
                  
                  <div className="bg-white/10 rounded-xl p-4 mb-6 text-sm">
                    <div className="font-medium text-blue-200 mb-1">Generated Prompt:</div>
                    <div className="text-white/90 italic line-clamp-4">
                      "{generatePrompt(activePhoto)}"
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/10">
                    <span className="text-blue-200">Available Credits</span>
                    <span className="font-bold text-xl">{credits}</span>
                  </div>

                  <button 
                    onClick={handleGenerate}
                    disabled={activePhoto.isGenerating || activePhoto.isAnalyzing}
                    className="w-full py-3 px-4 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-500 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2"
                  >
                    {activePhoto.isGenerating ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
                    ) : (
                      <><Wand2 className="w-5 h-5" /> Stage Photo (1 Credit)</>
                    )}
                  </button>
                  
                  {credits < 1 && (
                    <p className="text-orange-300 text-xs text-center mt-3 font-medium">
                      Insufficient credits. Click to purchase.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-8">
            <div className="text-center max-w-md">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-slate-100">
                <ImageIcon className="w-10 h-10 text-slate-300" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">No Photo Selected</h2>
              <p className="text-slate-500 mb-8">Upload photos using the sidebar or drag and drop them anywhere on the screen to get started.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <div 
                  {...getRootProps()} 
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#1E3A8A] text-white font-medium rounded-xl hover:bg-blue-900 transition-colors cursor-pointer"
                >
                  <input {...getInputProps()} />
                  <Upload className="w-5 h-5" /> Upload Photos
                </div>
                <button
                  onClick={loadDemoPhoto}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-slate-700 font-medium rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  <Sparkles className="w-5 h-5 text-orange-500" /> Try Demo Photo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Disclaimer / Purchase Modal */}
      <AnimatePresence>
        {showDisclaimer && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100">
                <div className="flex items-center gap-3 text-orange-600 mb-2">
                  <AlertCircle className="w-6 h-6" />
                  <h3 className="text-xl font-bold text-slate-900">Purchase Credits</h3>
                </div>
                <p className="text-sm text-slate-600">
                  <strong className="text-slate-900">Disclaimer:</strong> Guided prompts are quality guaranteed. Custom prompts are user responsible (disclose 'AI Edited' on MLS). No refunds.
                </p>
              </div>
              
              <div className="p-6 bg-slate-50 space-y-3">
                {[
                  { id: '1pack', name: '1 Photo', price: '$5', credits: 1 },
                  { id: '5pack', name: '5-Pack', price: '$25', credits: 5, popular: true },
                  { id: '10pack', name: '10-Pack', price: '$40', credits: 10 },
                ].map(pkg => (
                  <button
                    key={pkg.id}
                    onClick={() => handleCheckout(pkg.id)}
                    disabled={isCheckingOut}
                    className={cn(
                      "w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left",
                      pkg.popular ? "border-orange-500 bg-orange-50" : "border-slate-200 bg-white hover:border-orange-300"
                    )}
                  >
                    <div>
                      <div className="font-bold text-slate-900 flex items-center gap-2">
                        {pkg.name}
                        {pkg.popular && <span className="text-[10px] uppercase tracking-wider bg-orange-500 text-white px-2 py-0.5 rounded-full">Popular</span>}
                      </div>
                      <div className="text-sm text-slate-500">{pkg.credits} Credit{pkg.credits > 1 ? 's' : ''}</div>
                    </div>
                    <div className="font-bold text-lg text-[#1E3A8A]">{pkg.price}</div>
                  </button>
                ))}
              </div>
              
              <div className="p-4 border-t border-slate-100 flex justify-end">
                <button 
                  onClick={() => setShowDisclaimer(false)}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
