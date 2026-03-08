import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Home } from './pages/Home';
import { Editor } from './pages/Editor';
import { Admin } from './pages/Admin';
import { Image as ImageIcon, Menu, X } from 'lucide-react';

function Nav() {
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="bg-[#1E3A8A] text-white sticky top-0 z-50 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight shrink-0">
          <img src="/234172861.png" alt="SmartStageAgent.com" className="h-10 w-auto" />
          <span className="hidden sm:inline">SmartStageAgent</span>
          <span className="text-orange-400">.com</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden sm:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className={`hover:text-orange-300 transition-colors ${location.pathname === '/' ? 'text-orange-300' : ''}`}>Home</Link>
          <Link to="/editor" className={`hover:text-orange-300 transition-colors flex items-center gap-1 ${location.pathname === '/editor' ? 'text-orange-300' : ''}`}>
            <ImageIcon className="w-4 h-4" /> Enhance Photos
          </Link>
        </nav>

        {/* Mobile hamburger */}
        <button
          className="sm:hidden p-2 rounded hover:bg-blue-800 transition-colors"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div className="sm:hidden bg-[#162f7a] border-t border-blue-700 px-4 py-3 flex flex-col gap-3 text-sm font-medium">
          <Link to="/" onClick={() => setMenuOpen(false)} className={`hover:text-orange-300 transition-colors ${location.pathname === '/' ? 'text-orange-300' : ''}`}>Home</Link>
          <Link to="/editor" onClick={() => setMenuOpen(false)} className={`hover:text-orange-300 transition-colors flex items-center gap-1 ${location.pathname === '/editor' ? 'text-orange-300' : ''}`}>
            <ImageIcon className="w-4 h-4" /> Enhance Photos
          </Link>
        </div>
      )}
    </header>
  );
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
      <Nav />
      <main className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/editor" element={<Editor />} />
          <Route path="/enhance" element={<Navigate to="/editor" replace />} />
        </Routes>
      </main>
      <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <img src="/234172861.png" alt="SmartStageAgent.com" className="h-8 w-auto opacity-70" />
          <div className="text-sm text-center">
            Â© 2026 SmartStageAgent.com. All rights reserved.
            <span className="mx-2 text-slate-600">|</span>
            <span className="text-slate-500">AI-enhanced photos are deleted within 24 hours. Disclose AI enhancements as required by your MLS.</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<Admin />} />
        <Route path="*" element={<AppLayout />} />
      </Routes>
    </BrowserRouter>
  );
}
