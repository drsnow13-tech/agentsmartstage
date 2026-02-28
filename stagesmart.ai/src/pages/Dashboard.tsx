import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, CreditCard, History, Image as ImageIcon } from 'lucide-react';

export function Dashboard() {
  const [searchParams] = useSearchParams();
  const success = searchParams.get('success');
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    fetch('/api/user')
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch user');
        return res.json();
      })
      .then(data => setUser(data))
      .catch(console.error);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
      {success && (
        <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center gap-3 text-green-800">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
          <div>
            <h3 className="font-bold">Payment Successful!</h3>
            <p className="text-sm">Your credits have been added to your account.</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <CreditCard className="w-5 h-5" />
            <h3 className="font-medium">Available Credits</h3>
          </div>
          <div className="text-4xl font-black text-[#1E3A8A]">{user?.credits || 0}</div>
          <button className="mt-4 text-sm text-orange-600 font-medium hover:text-orange-700">
            Buy more credits &rarr;
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-3 text-slate-500 mb-4">
            <ImageIcon className="w-5 h-5" />
            <h3 className="font-medium">Photos Staged</h3>
          </div>
          <div className="text-4xl font-black text-slate-900">0</div>
          <p className="mt-4 text-sm text-slate-500">Lifetime total</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200 flex items-center gap-2">
          <History className="w-5 h-5 text-slate-500" />
          <h2 className="text-xl font-bold text-slate-900">Recent Generations</h2>
        </div>
        
        <div className="p-12 text-center">
          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <ImageIcon className="w-8 h-8 text-slate-300" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-1">No generations yet</h3>
          <p className="text-slate-500">Your staged photos will appear here.</p>
        </div>
      </div>
    </div>
  );
}
