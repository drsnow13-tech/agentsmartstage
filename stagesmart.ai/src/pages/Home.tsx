import React from 'react';
import { Link } from 'react-router-dom';
import { Wand2, Clock, Download, Shield } from 'lucide-react';

export function Home() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#1E3A8A] to-[#1e2d6b] text-white py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 rounded-full px-4 py-1.5 text-orange-300 text-sm font-medium mb-6">
            <Wand2 className="w-4 h-4" /> AI-Powered Real Estate Photo Enhancement
          </div>
          <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
            Transform Listing Photos<br />
            <span className="text-orange-400">in Seconds</span>
          </h1>
          <p className="text-xl text-blue-200 mb-8 max-w-2xl mx-auto">
            Virtual twilight, green grass, staging, sky swaps and more. Save $35 per photo vs traditional editing. Download in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/editor" className="px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-lg rounded-xl flex items-center justify-center gap-2 transition-colors">
              <Wand2 className="w-5 h-5" /> Start Editing
            </Link>
          </div>
          <p className="text-blue-300 text-sm mt-4">No login required · Photos not stored after 24 hours · MLS-ready results</p>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-4 bg-slate-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-black text-slate-900 text-center mb-12">Everything Agents Need</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: '🌅', title: 'Virtual Twilight', desc: 'Golden hour sky and warm glowing windows — proven to get 3x more saves on Zillow' },
              { icon: '🌿', title: 'Green the Grass', desc: 'Lush vibrant lawn year-round. No more brown Texas summers killing your curb appeal' },
              { icon: '🛋️', title: 'Virtual Staging', desc: 'Fill empty rooms with warm, inviting furniture — living room, bedroom, game room, office and more' },
              { icon: '☀️', title: 'Sky Swap', desc: 'Replace overcast skies with bright blue — every day looks like a perfect day' },
              { icon: '✨', title: 'Declutter & Clean', desc: 'Remove furniture, personal items, and clutter for clean MLS-ready photos' },
              { icon: '💡', title: 'Interior Lights', desc: 'Add warm glowing light through windows for an inviting, lived-in look' },
            ].map(f => (
              <div key={f.title} className="bg-white rounded-2xl p-6 border border-slate-200">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 px-4 bg-white">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-black text-slate-900 mb-4">Simple Pricing</h2>
          <p className="text-slate-500 mb-10">One credit = one photo batch. Select as many enhancements as you want per photo — all for one credit.</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: '1 Photo', price: '$5', credits: '1 credit', popular: false },
              { label: '5 Photos', price: '$20', credits: '5 credits', popular: true },
              { label: '10 Photos', price: '$30', credits: '10 credits', popular: false },
              { label: '25 Photos', price: '$50', credits: '25 credits', popular: false },
            ].map(pkg => (
              <div key={pkg.label} className={`rounded-2xl p-5 border-2 ${pkg.popular ? 'border-orange-500 bg-orange-50' : 'border-slate-200'}`}>
                {pkg.popular && <div className="text-xs font-bold text-orange-500 uppercase mb-2">Best Value</div>}
                <div className="text-2xl font-black text-slate-900">{pkg.price}</div>
                <div className="font-medium text-slate-700">{pkg.label}</div>
                <div className="text-xs text-slate-400 mt-1">{pkg.credits}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="py-12 px-4 bg-slate-50 border-t border-slate-200">
        <div className="max-w-3xl mx-auto">
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div className="flex flex-col items-center gap-2">
              <Clock className="w-6 h-6 text-orange-500" />
              <p className="font-bold text-slate-900">Photos Not Stored</p>
              <p className="text-sm text-slate-500">All photos are automatically deleted after 24 hours. Download yours immediately.</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Shield className="w-6 h-6 text-orange-500" />
              <p className="font-bold text-slate-900">MLS Compliant</p>
              <p className="text-sm text-slate-500">AI-enhanced disclosure included on every download. Your clients are protected.</p>
            </div>
            <div className="flex flex-col items-center gap-2">
              <Download className="w-6 h-6 text-orange-500" />
              <p className="font-bold text-slate-900">Instant Download</p>
              <p className="text-sm text-slate-500">HD photos ready in under 60 seconds. No waiting, no emails, no back and forth.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 px-4 bg-[#1E3A8A] text-white text-center">
        <h2 className="text-3xl font-black mb-4">Ready to Upgrade Your Listings?</h2>
        <p className="text-blue-200 mb-8">No login required. Upload a photo and see results in seconds.</p>
        <Link to="/editor" className="inline-flex items-center gap-2 px-8 py-4 bg-orange-500 hover:bg-orange-600 text-white font-black text-lg rounded-xl transition-colors">
          <Wand2 className="w-5 h-5" /> Start Enhancing Photos
        </Link>
      </section>
    </div>
  );
}
