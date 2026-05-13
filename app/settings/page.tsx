'use client';

import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { Route, BadgeIndianRupee, Users, Bell, Languages, HelpCircle, LogOut, BadgeCheck, ChevronRight, Edit2, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

const INDIAN_LANGUAGES = [
  'English', 'हिन्दी (Hindi)', 'বাংলা (Bengali)', 'తెలుగు (Telugu)', 
  'मराठी (Marathi)', 'தமிழ் (Tamil)', 'اردو (Urdu)', 
  'ગુજરાતી (Gujarati)', 'ಕನ್ನಡ (Kannada)', 'ଓଡ଼ିଆ (Odia)', 
  'മലയാളം (Malayalam)', 'ਪੰਜਾਬੀ (Punjabi)', 'অসমীয়া (Assamese)'
];

export default function SettingsPage() {
  const router = useRouter();
  const { businessInfo, setBusinessInfo, staff } = useAppContext();
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newName, setNewName] = useState(businessInfo.ownerName);

  const [isLangModalOpen, setIsLangModalOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('English');

  const handleLogout = () => {
    router.push('/login');
  };

  const handleSaveProfile = () => {
    setBusinessInfo({ ...businessInfo, ownerName: newName });
    setIsEditingProfile(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24 relative">
      <TopAppBar title="Profile" showBack={true} showProfile={false} />

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Profile Header */}
        <div className="mb-6 relative">
          <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1">Enterprise Account</div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-slate-900">{businessInfo.ownerName}</h1>
            <button 
              onClick={() => { setNewName(businessInfo.ownerName); setIsEditingProfile(true); }}
              className="p-2 rounded-full bg-slate-200 text-slate-600 hover:bg-slate-300 transition-colors"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm font-medium text-blue-800 mt-1">Owner • {businessInfo.name}</p>
        </div>

        <div className="flex gap-8 mb-6">
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Total Routes</div>
            <div className="text-2xl font-bold text-slate-900">14</div>
          </div>
          <div>
            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Active Staff</div>
            <div className="text-2xl font-bold text-slate-900">{staff.filter(s => s.active).length}</div>
          </div>
        </div>

        {/* Premium Banner */}
        <div className="bg-blue-700 rounded-3xl p-6 text-white mb-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full -mr-10 -mt-10 opacity-50"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mx-auto mb-3">
              <BadgeCheck className="w-6 h-6 text-blue-700" />
            </div>
            <h2 className="text-xl font-bold mb-1">Premium Partner</h2>
            <p className="text-blue-200 text-sm mb-4">Status active until Oct 2025</p>
            <button className="bg-white text-blue-700 font-bold px-6 py-2 rounded-full text-sm active:scale-95 transition-transform">
              RENEW NOW
            </button>
          </div>
        </div>

        {/* Operational Control */}
        <div className="mb-8">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Operational Control</h3>
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 border-b border-slate-100 active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Route className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-900">Route Management</h4>
                  <p className="text-xs text-slate-500">Manage delivery sectors and timing</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
            <button className="w-full flex items-center justify-between p-4 border-b border-slate-100 active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <BadgeIndianRupee className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-900">Price Settings</h4>
                  <p className="text-xs text-slate-500">Update bottle rates and discounts</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
            <button className="w-full flex items-center justify-between p-4 active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-900">Staff Accounts</h4>
                  <p className="text-xs text-slate-500">{staff.length} Active delivery partners</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* App Configuration */}
        <div className="mb-8">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">App Configuration</h3>
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
            <div className="w-full flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-900">Notifications</h4>
                  <p className="text-xs text-slate-500">Alerts, Dues, and Delivery updates</p>
                </div>
              </div>
              <div className="w-12 h-6 bg-blue-600 rounded-full relative">
                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
            <button 
              onClick={() => setIsLangModalOpen(true)}
              className="w-full flex items-center justify-between p-4 active:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <Languages className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-900">Language Selection</h4>
                  <p className="text-xs text-slate-500">Choose your preferred interface</p>
                </div>
              </div>
              <div className="flex bg-slate-100 rounded-lg p-1 items-center">
                <span className="text-slate-900 text-[10px] font-bold px-3 py-1">{selectedLanguage.split(' ')[0]}</span>
                <ChevronRight className="w-4 h-4 text-slate-400 ml-1" />
              </div>
            </button>
          </div>
        </div>

        {/* Support */}
        <div className="mb-8">
          <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-3">Support</h3>
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden">
            <button className="w-full flex items-center justify-between p-4 active:bg-slate-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-700 flex items-center justify-center">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-900">Help & Support</h4>
                  <p className="text-xs text-slate-500">FAQs and Contact Customer Care</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        <button 
          onClick={handleLogout}
          className="w-full bg-red-50 text-red-600 font-bold py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
        >
          <LogOut className="w-5 h-5" /> LOG OUT
        </button>

        <div className="mt-8 text-center">
          <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">Jal Sejiwan Operations V2.4.0-BUILD88</span>
        </div>

      </main>

      <BottomNav role="owner" activeTab="settings" />

      {/* Edit Profile Modal */}
      <AnimatePresence>
        {isEditingProfile && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-xl"
            >
              <div className="flex justify-between items-center mb-5">
                <h2 className="text-xl font-bold text-slate-900">Edit Profile Name</h2>
                <button onClick={() => setIsEditingProfile(false)} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="mb-6">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Full Name</label>
                <input 
                  type="text" 
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600 font-medium text-slate-900"
                  autoFocus
                />
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setIsEditingProfile(false)}
                  className="flex-1 py-3 font-bold text-slate-600 bg-slate-100 rounded-xl active:scale-95 transition-transform"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleSaveProfile}
                  className="flex-1 py-3 font-bold text-white bg-blue-600 rounded-xl active:scale-95 transition-transform"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Language Selection Modal */}
      <AnimatePresence>
        {isLangModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center p-0 sm:p-4 bg-slate-900/40 backdrop-blur-sm"
               onClick={() => setIsLangModalOpen(false)}>
            <motion.div 
              initial={{ opacity: 0, y: "100%" }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-t-3xl sm:rounded-3xl p-6 w-full max-w-sm shadow-xl max-h-[85vh] flex flex-col"
            >
              <div className="flex justify-between items-center mb-2 shrink-0">
                <h2 className="text-xl font-bold text-slate-900">Select Language</h2>
                <button onClick={() => setIsLangModalOpen(false)} className="p-2 bg-slate-100 text-slate-600 rounded-full hover:bg-slate-200">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-4 shrink-0">Choose your preferred language for the app interface.</p>
              
              <div className="overflow-y-auto pr-2 space-y-2 flex-1 overscroll-contain pb-4">
                {INDIAN_LANGUAGES.map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setSelectedLanguage(lang);
                      setIsLangModalOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors ${
                      selectedLanguage === lang 
                        ? 'border-blue-600 bg-blue-50 text-blue-700' 
                        : 'border-slate-100 bg-white hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="font-medium">{lang}</span>
                    {selectedLanguage === lang && (
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-white"></div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
