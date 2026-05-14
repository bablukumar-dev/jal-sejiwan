'use client';

import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { Route, BadgeIndianRupee, Users, Bell, Languages, HelpCircle, LogOut, BadgeCheck, ChevronRight, Edit2, X, Camera, MessageCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAppContext } from '@/app/context/AppContext';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';

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
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  useEffect(() => {
    const storedImage = localStorage.getItem('profileImage');
    if (storedImage) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProfileImage(storedImage);
    }
    const notifs = localStorage.getItem('notificationsEnabled');
    if (notifs !== null) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setNotificationsEnabled(notifs === 'true');
    }
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setProfileImage(base64String);
        localStorage.setItem('profileImage', base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleNotifications = () => {
    const newVal = !notificationsEnabled;
    setNotificationsEnabled(newVal);
    localStorage.setItem('notificationsEnabled', newVal.toString());
  };

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
        {/* Profile Header (Instagram/FB Style) */}
        <div className="flex flex-col items-center mt-2 mb-8 relative">
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-slate-200 overflow-hidden border-[5px] border-white shadow-xl flex items-center justify-center relative bg-gradient-to-tr from-blue-100 to-indigo-50">
              {profileImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-blue-400">{businessInfo.ownerName.charAt(0).toUpperCase()}</span>
              )}
            </div>
            <label className="absolute bottom-0 right-0 bg-blue-600 outline outline-4 outline-white text-white p-2.5 rounded-full shadow-lg cursor-pointer active:scale-95 transition-transform hover:bg-blue-700">
              <Camera className="w-4 h-4" />
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 leading-none tracking-tight">{businessInfo.ownerName}</h1>
            <button 
              onClick={() => { setNewName(businessInfo.ownerName); setIsEditingProfile(true); }}
              className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700 transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-sm font-medium text-slate-500 mt-1.5">{businessInfo.name} • Admin</p>
        </div>

        <div className="flex justify-between bg-white p-5 rounded-3xl border border-slate-100 mb-8 shadow-sm px-6">
          <div className="text-center flex-1">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">14</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Routes</div>
          </div>
          <div className="w-px bg-slate-100 mx-2"></div>
          <div className="text-center flex-1">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">{staff.filter(s => s.active).length}</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Staff</div>
          </div>
          <div className="w-px bg-slate-100 mx-2"></div>
          <div className="text-center flex-1">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">12k</div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Orders</div>
          </div>
        </div>

        {/* Premium Banner */}
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-3xl p-6 text-white mb-8 text-center relative overflow-hidden shadow-lg shadow-blue-900/20">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-10 -mt-10 opacity-10 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full -ml-8 -mb-8 opacity-10 blur-xl"></div>
          <div className="relative z-10">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 backdrop-blur-md">
              <BadgeCheck className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-lg font-bold mb-1">Premium Partner</h2>
            <p className="text-blue-100 text-sm mb-4">Status active until Oct 2025</p>
            <button className="bg-white text-blue-700 font-bold px-6 py-2.5 rounded-full text-sm active:scale-95 transition-transform hover:bg-slate-50">
              RENEW NOW
            </button>
          </div>
        </div>

        {/* Operational Control */}
        <div className="mb-8">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Operational Control</h3>
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <button onClick={() => alert("Route Management is coming soon in the next update!")} className="w-full flex items-center justify-between p-4 border-b border-slate-50 active:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <Route className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-900">Route Management</h4>
                  <p className="text-xs text-slate-500">Manage delivery sectors and timing</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>
            <button onClick={() => alert("Price Settings is coming soon in the next update!")} className="w-full flex items-center justify-between p-4 border-b border-slate-50 active:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                  <BadgeIndianRupee className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-900">Price Settings</h4>
                  <p className="text-xs text-slate-500">Update bottle rates and discounts</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </button>
            <Link href="/owner/staff" className="w-full flex items-center justify-between p-4 active:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                  <Users className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-900">Staff Accounts</h4>
                  <p className="text-xs text-slate-500">{staff.length} Active delivery partners</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </Link>
          </div>
        </div>

        {/* App Configuration */}
        <div className="mb-8">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">App Configuration</h3>
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="w-full flex items-center justify-between p-4 border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center">
                  <Bell className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-900">Notifications</h4>
                  <p className="text-xs text-slate-500">Alerts, Dues, and Delivery updates</p>
                </div>
              </div>
              <button 
                onClick={toggleNotifications}
                className={`w-12 h-6 rounded-full relative transition-colors duration-300 ease-in-out ${notificationsEnabled ? 'bg-blue-600' : 'bg-slate-200'}`}
              >
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all duration-300 ease-in-out ${notificationsEnabled ? 'right-1' : 'left-1'}`}></div>
              </button>
            </div>
            <button 
              onClick={() => setIsLangModalOpen(true)}
              className="w-full flex items-center justify-between p-4 active:bg-slate-50 transition-colors group"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
                  <Languages className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-900">Language Selection</h4>
                  <p className="text-xs text-slate-500">Choose your preferred interface</p>
                </div>
              </div>
              <div className="flex bg-slate-50 border border-slate-100 rounded-xl p-1 items-center">
                <span className="text-slate-700 text-[10px] font-bold px-3 py-1">{selectedLanguage.split(' ')[0]}</span>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 mr-1" />
              </div>
            </button>
          </div>
        </div>

        {/* Support */}
        <div className="mb-8">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 px-1">Support</h3>
          <div className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm">
            <a href="https://wa.me/917542018086" target="_blank" rel="noopener noreferrer" className="w-full flex items-center justify-between p-4 active:bg-slate-50 transition-colors group border-b border-slate-50">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-green-50 text-green-600 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-900">WhatsApp Support</h4>
                  <p className="text-xs text-slate-500">+91 7542018086</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
            </a>
            <button onClick={() => alert("FAQs section is coming soon!")} className="w-full flex items-center justify-between p-4 active:bg-slate-50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-2xl bg-slate-50 text-slate-600 flex items-center justify-center group-hover:bg-slate-100 transition-colors">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <h4 className="font-bold text-slate-900">Help & FAQs</h4>
                  <p className="text-xs text-slate-500">Read our guides and tips</p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300" />
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
