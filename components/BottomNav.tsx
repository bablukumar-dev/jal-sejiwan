import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Truck, 
  Package, 
  BarChart3,
  Settings,
  LifeBuoy,
  Activity
} from 'lucide-react';

interface BottomNavProps {
  role: 'owner' | 'staff' | 'manager';
  activeTab: string;
}

export default function BottomNav({ role, activeTab }: BottomNavProps) {
  let links: Array<{ id: string, label: string, icon: any, href: string }> = [];

  if (role === 'owner') {
    links = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/owner/dashboard' },
      { id: 'customers', label: 'Customers', icon: Users, href: '/owner/customers' },
      { id: 'deliveries', label: 'Deliveries', icon: Truck, href: '/owner/deliveries' },
      { id: 'activity_logs', label: 'Live Log', icon: Activity, href: '/owner/activity' },
      { id: 'inventory', label: 'Inventory', icon: Package, href: '/inventory/dashboard' },
    ];
  } else if (role === 'staff') {
    links = [
      { id: 'dashboard', label: 'Dash', icon: LayoutDashboard, href: '/staff/dashboard' },
      { id: 'customers', label: 'Customers', icon: Users, href: '/staff/customers' },
      { id: 'service', label: 'Service', icon: LifeBuoy, href: '/staff/service' },
      { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
    ];
  } else if (role === 'manager') {
    links = [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, href: '/inventory/dashboard' },
      { id: 'deliveries', label: 'Deliveries', icon: Truck, href: '/owner/deliveries' },
      { id: 'activity_logs', label: 'Live Log', icon: Activity, href: '/owner/activity' },
      { id: 'history', label: 'History', icon: BarChart3, href: '/inventory/history' },
      { id: 'settings', label: 'Settings', icon: Settings, href: '/settings' },
    ];
  }

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 bg-white border-t border-slate-200 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] pb-safe">
      <div className="flex justify-around items-center px-2 py-2 max-w-md mx-auto">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = activeTab === link.id;
          return (
            <Link 
              key={link.id} 
              href={link.href}
              className={`flex flex-col items-center justify-center px-3 py-2 rounded-xl transition-colors ${
                isActive 
                  ? 'text-blue-700 bg-blue-50' 
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Icon className={`w-6 h-6 ${isActive ? 'fill-blue-100' : ''}`} strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-[10px] font-bold uppercase mt-1 tracking-wide ${isActive ? 'text-blue-800' : ''}`}>
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
