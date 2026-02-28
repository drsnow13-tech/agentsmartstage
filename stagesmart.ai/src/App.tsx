import React from 'react';
import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import { Home } from './pages/Home';
import { Editor } from './pages/Editor';
import { Dashboard } from './pages/Dashboard';
import { EngineTest } from './pages/EngineTest';
import { Home as HomeIcon, LayoutDashboard, Image as ImageIcon, FlaskConical } from 'lucide-react';

export default function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-900">
        <header className="bg-[#1E3A8A] text-white sticky top-0 z-50 shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl tracking-tight">
              <div className="w-8 h-8 rounded bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-inner">
                <HomeIcon className="w-5 h-5 text-white" />
              </div>
              StageSmart<span className="text-orange-400">.ai</span>
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium">
              <Link to="/editor" className="hover:text-orange-300 transition-colors flex items-center gap-1">
                <ImageIcon className="w-4 h-4" /> Editor
              </Link>
              <Link to="/dashboard" className="hover:text-orange-300 transition-colors flex items-center gap-1">
                <LayoutDashboard className="w-4 h-4" /> Dashboard
              </Link>
              <Link to="/test" className="hover:text-orange-300 transition-colors flex items-center gap-1 opacity-60 hover:opacity-100">
                <FlaskConical className="w-4 h-4" /> Test
              </Link>
            </nav>
          </div>
        </header>
        <main className="flex-1 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/editor" element={<Editor />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/test" element={<EngineTest />} />
          </Routes>
        </main>
        <footer className="bg-slate-900 text-slate-400 py-8 border-t border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-slate-800 flex items-center justify-center">
                <HomeIcon className="w-3 h-3 text-slate-500" />
              </div>
              <span className="font-semibold text-slate-300">StageSmart.ai</span>
            </div>
            <p className="text-sm">
              © 2026 StageSmart.ai. All rights reserved. <span className="text-slate-500">|</span> MLS-Ready Virtual Staging
            </p>
          </div>
        </footer>
      </div>
    </BrowserRouter>
  );
}
