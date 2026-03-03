import React from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home } from './pages/Home';
import { Editor } from './pages/Editor';
import { EngineTest } from './pages/EngineTest';
import { Image as ImageIcon } from 'lucide-react';

function Nav() {
  const location = useLocation();
  return (
    <header className="bg-[#1E3A8A] text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/">
          <img src="/234172861.png" alt="SmartStageAgent.com" className="h-10 w-auto" />
        </Link>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link to="/" className={`hover:text-orange-300 transition-colors ${location.pathname === '/' ? 'text-orange-300' : ''}`}>
            Home
          </Link>
          <Link to="/editor" className={`hover:text-orange-300 transition-colors flex items-center gap-1 ${location.pathname === '/editor' ? 'text-orange-300' : ''}`}>
            <ImageIcon className="w-4 h-4" /> Enhance Photos
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
        <Nav />
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/test" element={<EngineTest />} />
          </Routes>
        </main>
        <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <img src="/234172861.png" alt="SmartStageAgent.com" className="h-8 w-auto opacity-70" />
            <div className="text-sm text-center">
              © 2026 SmartStageAgent.com. All rights reserved.
              <span className="mx-2 text-slate-600">|</span>
              <span className="text-slate-500">AI-enhanced photos are deleted within 24 hours. Disclose AI enhancements as required by your MLS.</span>
            </div>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
