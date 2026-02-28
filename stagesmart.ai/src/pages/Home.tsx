import React, { useCallback, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDropzone } from 'react-dropzone';
import { Upload, Sparkles, Clock, CheckCircle2, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { ImageComparison } from '../components/ImageComparison';

export function Home() {
  const navigate = useNavigate();
  
  const [demoBefore, setDemoBefore] = useState('/demo-before.jpg');
  const [demoAfter, setDemoAfter] = useState('/demo-after.jpg');
  const beforeInputRef = useRef<HTMLInputElement>(null);
  const afterInputRef = useRef<HTMLInputElement>(null);

  const handleBeforeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setDemoBefore(URL.createObjectURL(e.target.files[0]));
  };

  const handleAfterUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) setDemoAfter(URL.createObjectURL(e.target.files[0]));
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      // In a real app, we'd pass these files to the editor state via context or router state
      // For MVP, we'll just navigate to editor and let them upload there if they drop here
      navigate('/editor');
    }
  }, [navigate]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': [] },
    maxFiles: 5
  } as any);

  return (
    <div className="flex flex-col w-full">
      {/* Hero Section */}
      <section className="relative w-full bg-slate-50 pt-20 pb-16 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-100 text-orange-600 text-sm font-bold mb-8 shadow-sm">
              <Sparkles className="w-4 h-4" />
              <span>AI Virtual Staging in Seconds</span>
            </div>
            <h1 className="text-5xl lg:text-7xl font-extrabold text-slate-900 tracking-tight mb-6 leading-tight">
              Sell Homes <span className="text-orange-500">Faster</span> & For More.
            </h1>
            <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
              Transform empty rooms into stunning, MLS-ready homes. Photorealistic staging designed for top-producing real estate agents.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button 
                onClick={() => navigate('/editor')}
                className="px-8 py-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-lg transition-all shadow-xl shadow-slate-900/20 flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                Stage a Photo Free <ArrowRight className="w-5 h-5" />
              </button>
              <div className="text-sm text-slate-500 font-medium flex items-center gap-4">
                <span className="flex items-center gap-1"><CheckCircle2 className="w-4 h-4 text-green-500" /> MLS-Ready</span>
                <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-green-500" /> 10s Turnaround</span>
              </div>
            </div>
          </motion.div>

          {/* Big Slider Demo */}
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative max-w-5xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-200 aspect-[16/9] bg-slate-200"
          >
             <ImageComparison 
               beforeImage={demoBefore}
               afterImage={demoAfter}
               objectFit="cover"
             />
          </motion.div>

          {/* Custom Demo Upload Buttons */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.4 }}
            className="mt-6 flex flex-wrap justify-center gap-4"
          >
            <input type="file" accept="image/*" className="hidden" ref={beforeInputRef} onChange={handleBeforeUpload} />
            <input type="file" accept="image/*" className="hidden" ref={afterInputRef} onChange={handleAfterUpload} />
            <button 
              onClick={() => beforeInputRef.current?.click()} 
              className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
            >
              <Upload className="w-4 h-4" /> Upload Custom "Before"
            </button>
            <button 
              onClick={() => afterInputRef.current?.click()} 
              className="px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-sm font-medium flex items-center gap-2 shadow-sm transition-colors"
            >
              <Upload className="w-4 h-4" /> Upload Custom "After"
            </button>
          </motion.div>
        </div>
      </section>

      {/* Features/How it works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900 mb-4">How StageSmart Works</h2>
            <p className="text-slate-600 max-w-2xl mx-auto">Upload your raw photos and let our AI do the heavy lifting. Perfect for vacant homes or outdated interiors.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Upload & Auto-Detect', desc: 'Drop your photos. Our AI instantly detects the room type (Living Room, Kitchen, Exterior, etc).' },
              { step: '02', title: 'Customize Style', desc: 'Choose from Modern, Traditional, Mid-Century, or Farmhouse. Add updates like new paint or counters.' },
              { step: '03', title: 'Generate & Download', desc: 'Get photorealistic, MLS-ready staged photos in about 10 seconds. Download and list!' }
            ].map((item, i) => (
              <div key={i} className="relative p-8 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="text-5xl font-black text-slate-200 mb-4">{item.step}</div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
