import React, { useState, useRef } from 'react';
import { Upload, Loader2, Wand2 } from 'lucide-react';

// Simple side-by-side comparison to pick your winner engine
export function EngineTest() {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('Photoreal modern virtual staging real estate Living Room, add furniture keeping architecture exact, MLS photo.');
  const [geminiResult, setGeminiResult] = useState<string | null>(null);
  const [replicateResult, setReplicateResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ gemini?: string; replicate?: string }>({});
  const [timings, setTimings] = useState<{ gemini?: number; replicate?: number }>({});
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const runTest = async () => {
    if (!image) return;
    setLoading(true);
    setGeminiResult(null);
    setReplicateResult(null);
    setErrors({});
    setTimings({});

    const start = Date.now();

    const [geminiRes, replicateRes] = await Promise.allSettled([
      (async () => {
        const t = Date.now();
        const res = await fetch('/api/stage-gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image, prompt })
        });
        const data = await res.json();
        setTimings(prev => ({ ...prev, gemini: Math.round((Date.now() - t) / 1000) }));
        return data;
      })(),
      (async () => {
        const t = Date.now();
        const res = await fetch('/api/stage-replicate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image, prompt })
        });
        const data = await res.json();
        setTimings(prev => ({ ...prev, replicate: Math.round((Date.now() - t) / 1000) }));
        return data;
      })()
    ]);

    if (geminiRes.status === 'fulfilled') {
      const d = geminiRes.value;
      if (d.generatedImage) setGeminiResult(d.generatedImage);
      else setErrors(prev => ({ ...prev, gemini: d.error || 'Failed' }));
    } else {
      setErrors(prev => ({ ...prev, gemini: geminiRes.reason?.message || 'Failed' }));
    }

    if (replicateRes.status === 'fulfilled') {
      const d = replicateRes.value;
      if (d.generatedImage) setReplicateResult(d.generatedImage);
      else setErrors(prev => ({ ...prev, replicate: d.error || 'Failed' }));
    } else {
      setErrors(prev => ({ ...prev, replicate: replicateRes.reason?.message || 'Failed' }));
    }

    setLoading(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Engine Comparison Test</h1>
        <p className="text-slate-500">Upload a real listing photo and run both engines. Pick your winner.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Upload Photo</label>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center cursor-pointer hover:border-orange-400 transition-colors aspect-video flex flex-col items-center justify-center bg-slate-50"
          >
            {image ? (
              <img src={image} alt="Upload preview" className="max-h-full max-w-full object-contain rounded" />
            ) : (
              <>
                <Upload className="w-8 h-8 text-slate-400 mb-2" />
                <span className="text-slate-500 font-medium">Click to upload</span>
              </>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-slate-700 mb-2">Staging Prompt</label>
          <textarea
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-4 text-sm min-h-[120px] focus:ring-orange-500 focus:border-orange-500 resize-none"
          />
          <button
            onClick={runTest}
            disabled={!image || loading}
            className="mt-4 w-full py-3 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-colors"
          >
            {loading ? <><Loader2 className="w-5 h-5 animate-spin" /> Running both engines...</> : <><Wand2 className="w-5 h-5" /> Run Comparison Test</>}
          </button>
        </div>
      </div>

      {/* Results */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Gemini */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Google Gemini</h2>
              <p className="text-xs text-slate-500">gemini-2.5-flash • ~$0.02/image</p>
            </div>
            {timings.gemini && <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-1 rounded-full">{timings.gemini}s</span>}
          </div>
          <div className="aspect-video bg-slate-50 flex items-center justify-center">
            {loading && !geminiResult ? (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm">Generating...</span>
              </div>
            ) : geminiResult ? (
              <img src={geminiResult} alt="Gemini result" className="w-full h-full object-contain" />
            ) : errors.gemini ? (
              <div className="text-red-500 text-sm px-4 text-center">{errors.gemini}</div>
            ) : (
              <span className="text-slate-400 text-sm">Result will appear here</span>
            )}
          </div>
          {geminiResult && (
            <div className="p-4 border-t border-slate-100">
              <a href={geminiResult} download="gemini-result.png" className="text-sm text-orange-600 font-medium hover:text-orange-700">
                Download →
              </a>
            </div>
          )}
        </div>

        {/* Replicate */}
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Replicate Flux Kontext</h2>
              <p className="text-xs text-slate-500">flux-kontext-pro • ~$0.04/image</p>
            </div>
            {timings.replicate && <span className="text-xs font-medium bg-purple-100 text-purple-700 px-2 py-1 rounded-full">{timings.replicate}s</span>}
          </div>
          <div className="aspect-video bg-slate-50 flex items-center justify-center">
            {loading && !replicateResult ? (
              <div className="flex flex-col items-center gap-2 text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm">Generating...</span>
              </div>
            ) : replicateResult ? (
              <img src={replicateResult} alt="Replicate result" className="w-full h-full object-contain" />
            ) : errors.replicate ? (
              <div className="text-red-500 text-sm px-4 text-center">{errors.replicate}</div>
            ) : (
              <span className="text-slate-400 text-sm">Result will appear here</span>
            )}
          </div>
          {replicateResult && (
            <div className="p-4 border-t border-slate-100">
              <a href={replicateResult} download="replicate-result.png" className="text-sm text-orange-600 font-medium hover:text-orange-700">
                Download →
              </a>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 p-6 bg-orange-50 border border-orange-200 rounded-2xl">
        <h3 className="font-bold text-slate-900 mb-2">After testing, set your winner</h3>
        <p className="text-sm text-slate-600">Go to <strong>Vercel → agentsmartstage → Settings → Environment Variables</strong> and add:</p>
        <code className="block mt-2 text-sm bg-white border border-orange-200 rounded px-3 py-2">ACTIVE_ENGINE = gemini &nbsp;|&nbsp; replicate</code>
        <p className="text-xs text-slate-500 mt-2">Then redeploy. The main /api/stage endpoint will use only that engine going forward.</p>
      </div>
    </div>
  );
}
