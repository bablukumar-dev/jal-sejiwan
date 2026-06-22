'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  Package, 
  BarChart3,
  LifeBuoy,
  Activity
} from 'lucide-react';

interface BottomNavProps {
  role?: 'owner' | 'staff' | 'manager' | string | null;
  activeTab: string;
}

export default function BottomNav({ role: propRole, activeTab }: BottomNavProps) {
  const router = useRouter();
  let role = propRole || (typeof window !== 'undefined' ? localStorage.getItem('userRole') : 'staff');
  if (role) {
    role = role.toLowerCase();
  }
  if (role !== 'owner' && role !== 'manager' && role !== 'staff') {
    role = 'staff';
  }
  let links: Array<{ id: string, label: string, icon: any, href: string }> = [];

  if (role === 'owner' || role === 'manager') {
    links = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/owner/dashboard' },
      { id: 'customers', label: 'Customers', icon: Users, href: '/owner/customers' },
      { id: 'deliveries', label: 'Deliveries', icon: Truck, href: '/owner/deliveries' },
      { id: 'activity_logs', label: 'Live Log', icon: Activity, href: '/owner/activity' },
    ];
  } else if (role === 'staff') {
    links = [
      { id: 'dashboard', label: 'Dash', icon: LayoutDashboard, href: '/staff/dashboard' },
      { id: 'customers', label: 'Customers', icon: Users, href: '/staff/customers' },
      { id: 'service', label: 'Service', icon: LifeBuoy, href: '/staff/service' },
    ];
  }

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[480px] z-50 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe md:rounded-b-3xl">
      <div className="flex justify-around items-center px-2 py-2 max-w-[480px] mx-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = activeTab === link.id;
          return (
            <button 
              key={link.id} 
              onClick={() => router.push(link.href)}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-colors w-full ${
                isActive 
                  ? 'text-blue-700 bg-blue-50' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-blue-100' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-bold uppercase mt-1 tracking-wide ${isActive ? 'text-blue-800' : ''}`}>
                {link.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
