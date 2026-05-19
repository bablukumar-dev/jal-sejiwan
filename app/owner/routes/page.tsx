'use client';

import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { useAppContext } from '@/app/context/AppContext';
import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';

export default function RouteManagement() {
  const { routes, setRoutes } = useAppContext();
  const [newRoute, setNewRoute] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    try {
        if (newRoute.trim() && !routes.includes(newRoute.trim())) {
        setRoutes([...routes, newRoute.trim()]);
        setNewRoute('');
        }
    } catch (err) {
        console.error(err);
        alert("Failed to add route.");
    }
  };

  const handleRemove = (route: string) => {
    try {
        setRoutes(routes.filter(r => r !== route));
    } catch (err) {
        console.error(err);
        alert("Failed to remove route.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="Route Management" showBack={true} />
      
      <main className="max-w-md mx-auto px-4 py-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm mb-6">
          <h2 className="font-bold text-slate-900 mb-4">Add New Route</h2>
          <form onSubmit={handleAdd} className="flex gap-2">
            <input 
              type="text" 
              className="flex-1 bg-slate-100 px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900"
              placeholder="e.g. North Sector"
              value={newRoute}
              onChange={(e) => setNewRoute(e.target.value)}
            />
            <button 
              type="submit" 
              className="bg-blue-600 text-white px-4 rounded-xl font-bold active:scale-95 transition-transform flex items-center justify-center shrink-0"
            >
              <Plus className="w-5 h-5" />
            </button>
          </form>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm">
          <h2 className="font-bold text-slate-900 mb-4">Existing Routes</h2>
          
          <div className="space-y-3">
            {routes.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-4">No routes available.</p>
            ) : (
              routes.map(r => (
                <div key={r} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="font-bold text-slate-700">{r}</span>
                  <button 
                    onClick={() => handleRemove(r)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
