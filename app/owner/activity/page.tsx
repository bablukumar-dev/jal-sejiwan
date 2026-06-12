/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { useState, useEffect, useMemo, memo } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAppContext } from '@/app/context/AppContext';
import { 
  Activity, 
  Truck, 
  Coins, 
  UserPlus, 
  Filter, 
  User, 
  RefreshCw, 
  Search, 
  SlidersHorizontal,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Database,
  Calendar,
  Layers,
  ArrowUpRight
} from 'lucide-react';
import { ActivityLog } from '@/lib/activityLogger';

export default function ActivityLogDashboard() {
  const { staff } = useAppContext();
  
  // Resolve user identity & role
  const [userRole, setUserRole] = useState<'owner' | 'manager' | 'staff'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('userRole');
      if (stored === 'owner' || stored === 'manager' || stored === 'staff') {
        return stored;
      }
    }
    return 'owner';
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('userRole') === 'owner') {
        return localStorage.getItem('ownerId') || 'owner';
      }
      return localStorage.getItem('staffUserId') || 'unknown';
    }
    return 'owner';
  });

  const [workspaceId, setWorkspaceId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('businessId') || localStorage.getItem('ownerId');
    }
    return null;
  });

  const [refreshKey, setRefreshKey] = useState(0);

  const currentUser = useMemo(() => {
    return {
      businessId: workspaceId || ''
    };
  }, [workspaceId]);

  // DB States
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(false);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

  const toggleExpand = (logId: string) => {
    setExpandedLogs(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };
  
  // Filtering & Search
  const [selectedActionType, setSelectedActionType] = useState<string>('ALL');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Load live activity logs from Firestore
  useEffect(() => {
    if (!currentUser.businessId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const logsRef = collection(db, 'workspaces', currentUser.businessId, 'activity_logs');
      const q = query(logsRef, where("businessId", "==", currentUser.businessId));

      const unsubscribe = onSnapshot(q, (snapshot) => {
        // Prevent empty false state by wrapping exists check
        const exists = typeof (snapshot as any).exists === 'function' ? (snapshot as any).exists() : !snapshot.empty;
        if (!exists) {
          setLogs([]);
          setIsLoading(false);
          setIsLive(true);
          return;
        }

        const fetchedLogs: ActivityLog[] = [];
        snapshot.forEach((doc) => {
          fetchedLogs.push(doc.data() as ActivityLog);
        });

        // Sort latest first safely handling both String dates and Firestore Timestamps
        fetchedLogs.sort((a, b) => {
          const timeA = a.timestamp && typeof a.timestamp.toDate === 'function' ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
          const timeB = b.timestamp && typeof b.timestamp.toDate === 'function' ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
          return timeB - timeA;
        });
        
        setLogs(fetchedLogs);
        setIsLoading(false);
        setIsLive(true);
      }, (error) => {
        console.error("Firestore listening error: ", error);
        setIsLoading(false);
      });

      return () => unsubscribe();
    } catch (e) {
      console.error("Failed to setup real-time activity log subscription:", e);
      setIsLoading(false);
    }
  }, [currentUser.businessId, refreshKey]);

  // Seeding mock fallback logs if database is empty - ensures pristine UI immediately
  const fallbackLogs: ActivityLog[] = useMemo(() => {
    return [];
  }, []);

  const activeLogs = logs.length > 0 ? logs : fallbackLogs;

  // 1. RBAC Gating on Data: Filter logs list based on who is logged in!
  const scopeFilteredLogs = useMemo(() => {
    return activeLogs.filter(log => {
      // Owner, Manager, and Staff all see full organization activities of their own business.
      // Cross-business isolation is strictly enforced via query-side "businessId" filtering.
      return true;
    });
  }, [activeLogs]);

  // 2. Interactive Page Filters Analysis (Action Type & Performer search)
  const finalLogs = useMemo(() => {
    return scopeFilteredLogs.filter(log => {
      // Action Type filter
      if (selectedActionType !== 'ALL') {
        if (selectedActionType === 'DELIVERY' && log.action_type !== 'delivery_completed') return false;
        if (selectedActionType === 'PAYMENT' && log.action_type !== 'payment_collected') return false;
        if (selectedActionType === 'STAFF' && log.action_type !== 'staff_created') return false;
        if (selectedActionType === 'OTHER' && ['delivery_completed', 'payment_collected', 'staff_created'].includes(log.action_type)) return false;
      }

      // User Performer filter
      if (selectedUserFilter !== 'ALL') {
        if (selectedUserFilter === 'ME' && String(log.user_id) !== String(currentUserId)) return false;
        if (selectedUserFilter !== 'ME' && String(log.user_id) !== selectedUserFilter) return false;
      }

      // Live search input query
      if (searchQuery) {
        const queryStr = searchQuery.toLowerCase();
        const matchName = log.user_name.toLowerCase().includes(queryStr);
        const matchDesc = log.description.toLowerCase().includes(queryStr);
        const matchType = log.action_type.toLowerCase().includes(queryStr);
        return matchName || matchDesc || matchType;
      }

      return true;
    });
  }, [scopeFilteredLogs, selectedActionType, selectedUserFilter, searchQuery, currentUserId]);

  const groupedLogs = useMemo(() => {
    const groups: Record<string, ActivityLog[]> = {};
    
    // Sort just in case to be 100% compliant with DESC order
    const sorted = [...finalLogs].sort((a, b) => {
      const timeA = a.timestamp && typeof a.timestamp.toDate === 'function' ? a.timestamp.toDate().getTime() : new Date(a.timestamp).getTime();
      const timeB = b.timestamp && typeof b.timestamp.toDate === 'function' ? b.timestamp.toDate().getTime() : new Date(b.timestamp).getTime();
      return timeB - timeA;
    });

    sorted.forEach((log) => {
      let dObj = new Date();
      try {
        if (log.timestamp && typeof log.timestamp.toDate === 'function') {
          dObj = log.timestamp.toDate();
        } else if (log.timestamp) {
          dObj = new Date(log.timestamp);
        }
      } catch (e) {
        // Fallback
      }
      
      const year = dObj.getFullYear();
      const month = String(dObj.getMonth() + 1).padStart(2, '0');
      const day = String(dObj.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${day}`;
      
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(log);
    });

    return Object.keys(groups)
      .sort((a, b) => b.localeCompare(a))
      .map(key => {
        let formattedDate = key;
        try {
          const parts = key.split('-');
          const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
          formattedDate = d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        } catch (e) {
          // fallback
        }
        return {
          dateKey: key,
          formattedDate,
          logs: groups[key]
        };
      });
  }, [finalLogs]);

  // 3. User Dropdown list based on RBAC scope
  const availableUsers = useMemo(() => {
    if (userRole === 'owner') {
      // Owner sees all staff in organization
      return staff;
    }
    if (userRole === 'manager') {
      // Manager only sees staff created by them / under them
      return staff.filter(s => String(s.createdBy) === String(currentUserId));
    }
    return [];
  }, [staff, userRole, currentUserId]);

  // Metrics Analytics Calculations
  const stats = useMemo(() => {
    const totalCount = finalLogs.length;
    const deliveriesCount = finalLogs.filter(l => l.action_type === 'delivery_completed').length;
    const paymentsCount = finalLogs.filter(l => l.action_type === 'payment_collected').length;
    const staffCount = finalLogs.filter(l => l.action_type === 'staff_created').length;

    // Total payment value in Firestore logs (which is filtered by business ID in onSnapshot)
    const totalPaymentsValue = logs
      .filter(l => {
        const actionType = String(l.action_type || (l as any).type || '').toLowerCase();
        return actionType === 'payment_collected' || actionType === 'payment';
      })
      .reduce((sum, l) => {
        const amt = Number(
          l.metadata?.amount || 
          l.metadata?.payment_amount || 
          (l as any).amount || 
          (l as any).payment?.amount || 
          0
        );
        return sum + amt;
      }, 0);

    return {
      totalCount,
      deliveriesCount,
      paymentsCount,
      staffCount,
      totalPaymentsValue
    };
  }, [finalLogs, logs]);

  const formatTime = (isoString: any) => {
    try {
      if (isoString && typeof isoString.toDate === 'function') {
        const d = isoString.toDate();
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
      }
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return String(isoString);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Pristine Header matching Jal Sejiwan design language */}
      <TopAppBar title="Live Command Center" subtitle="Activity Logs" showBack={true} />

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Real-time Status Badge & Sync Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLive ? 'bg-emerald-400' : 'bg-blue-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isLive ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
            </span>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">
              {isLive ? 'Live Real-time Feed' : 'Local Cached Logs'}
            </span>
          </div>

          <button 
            onClick={() => {
              setIsLive(false);
              setIsLoading(true);
              // Safely manual re-attach trigger + fallback window reload
              setRefreshKey(prev => prev + 1);
            }}
            className="text-slate-400 hover:text-blue-700 p-1 bg-white hover:bg-blue-50 border border-slate-200 rounded-xl transition-all"
            title="Refresh feeds"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Dynamic KPI Stats Row */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-700 text-white rounded-3xl p-5 shadow-md shadow-blue-700/10 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10">
              <Activity className="w-24 h-24 -mb-4 -mr-4" />
            </div>
            <div className="text-[10px] font-bold text-blue-100 uppercase tracking-wider mb-1">Total Signals</div>
            <div className="text-4xl font-extrabold mb-2">{stats.totalCount}</div>
            <p className="text-[10px] text-blue-200">Across active filters</p>
          </div>

          <div className="bg-emerald-600 text-white rounded-3xl p-5 shadow-md shadow-emerald-500/10 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10">
              <Coins className="w-24 h-24 -mb-4 -mr-4" />
            </div>
            <div className="text-[10px] font-bold text-emerald-100 uppercase tracking-wider mb-1">Receipt Flows</div>
            <div className="text-4xl font-extrabold mb-1">₹{stats.totalPaymentsValue}</div>
            <p className="text-[10px] text-emerald-100/80">From logging session</p>
          </div>
        </div>

        {/* Secondary metric details */}
        <div className="grid grid-cols-3 gap-3 mb-6 bg-white p-3 rounded-2xl border border-slate-100">
          <div className="text-center py-2">
            <div className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Deliveries</div>
            <div className="text-lg font-bold text-slate-900">{stats.deliveriesCount}</div>
          </div>
          <div className="text-center py-2 border-x border-slate-100">
            <div className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Payments</div>
            <div className="text-lg font-bold text-slate-900">{stats.paymentsCount}</div>
          </div>
          <div className="text-center py-2">
            <div className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Staff Adds</div>
            <div className="text-lg font-bold text-slate-900">{stats.staffCount}</div>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-4 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search by action, name..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 text-slate-900 placeholder:text-slate-500 text-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            type="button"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`px-4 bg-white border rounded-2xl flex items-center justify-center transition-all ${
              showFilterPanel || selectedActionType !== 'ALL' || selectedUserFilter !== 'ALL'
                ? 'border-blue-600 text-blue-700 bg-blue-50/50' 
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Filter Panel */}
        {showFilterPanel && (
          <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 mb-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-blue-600" /> Refined Filters
              </span>
              <button 
                onClick={() => {
                  setSelectedActionType('ALL');
                  setSelectedUserFilter('ALL');
                }}
                className="text-[10px] text-blue-700 font-bold hover:underline"
              >
                Reset All
              </button>
            </div>

            {/* Action Type Chips */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Action Type</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'ALL', label: 'All Operations' },
                  { value: 'DELIVERY', label: 'Deliveries' },
                  { value: 'PAYMENT', label: 'Payments' },
                  { value: 'STAFF', label: 'Staff Adds' },
                  { value: 'OTHER', label: 'Other' }
                ].map((chip) => (
                  <button 
                    key={chip.value}
                    onClick={() => setSelectedActionType(chip.value)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                      selectedActionType === chip.value 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/10' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Performer User Dropdown */}
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Performer</label>
              <select 
                value={selectedUserFilter}
                onChange={(e) => setSelectedUserFilter(e.target.value)}
                className="w-full bg-slate-100 px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 text-sm font-medium text-slate-900 appearance-none"
              >
                <option value="ALL">All Authorized Users</option>
                <option value="ME">Just Me</option>
                {/* Available users matching role scope */}
                {availableUsers.map((u) => (
                  <option key={u.id} value={String(u.id)}>{u.name} ({u.role})</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Live List Title */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Database className="w-4 h-4 text-slate-400" /> Operational Log
          </h3>
          <span className="text-[10px] font-sans font-bold text-slate-400 uppercase tracking-wider">
            {finalLogs.length} items logged
          </span>
        </div>

        {/* Streams Container */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm font-medium text-slate-500">Connecting to secure real-time feed...</p>
            </div>
          ) : finalLogs.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700 text-base mb-1">No activities recorded</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">No logs matched the selected search or scope filters.</p>
            </div>
          ) : (
            groupedLogs.map((group) => (
              <div key={group.dateKey} className="space-y-4">
                {/* Visual Group Date Header with clean accents */}
                <div className="flex items-center gap-2.5 pt-4 pb-1">
                  <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 border border-blue-100/60 rounded-xl px-3 py-1 tracking-wider uppercase font-sans">
                    {group.formattedDate}
                  </span>
                  <div className="flex-1 h-[1.5px] bg-slate-100" />
                </div>

                {group.logs.map((log) => (
                  <MemoizedLogEntry
                    key={log.log_id}
                    log={log}
                    isExpanded={!!expandedLogs[log.log_id]}
                    onToggleExpand={toggleExpand}
                    onFormatTime={formatTime}
                  />
                ))}
              </div>
            ))
          )}
        </div>
      </main>

      <BottomNav role={userRole === 'manager' ? 'manager' : 'owner'} activeTab="activity_logs" />
    </div>
  );
}

interface MemoizedLogEntryProps {
  log: ActivityLog;
  isExpanded: boolean;
  onToggleExpand: (logId: string) => void;
  onFormatTime: (isoString: any) => string;
}

const MemoizedLogEntry = memo(function MemoizedLogEntry({
  log,
  isExpanded,
  onToggleExpand,
  onFormatTime,
}: MemoizedLogEntryProps) {
  let icon = <Activity className="w-4.5 h-4.5" />;
  let themeColor = 'bg-slate-100 text-slate-600 border-slate-200';
  
  if (log.action_type === 'delivery_completed') {
    icon = <Truck className="w-4.5 h-4.5" />;
    themeColor = 'bg-blue-100 text-blue-700 border-blue-200';
  } else if (log.action_type === 'payment_collected') {
    icon = <Coins className="w-4.5 h-4.5" />;
    themeColor = 'bg-emerald-100 text-emerald-700 border-emerald-200';
  } else if (log.action_type === 'staff_created') {
    icon = <UserPlus className="w-4.5 h-4.5" />;
    themeColor = 'bg-purple-100 text-purple-700 border-purple-200';
  }

  return (
    <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 relative overflow-hidden flex gap-4 transition-all hover:border-slate-200 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Visual Left Accent strip */}
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${themeColor}`}>
        {icon}
      </div>

      {/* Body Content */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
          {/* Name of performer */}
          <span className="font-bold text-slate-900 text-sm truncate">{log.user_name}</span>
          
          {/* Performer role tag */}
          <span className={`px-2 py-0.5 rounded text-[8px] font-sans font-bold uppercase tracking-wider ${
            log.user_role === 'owner' 
              ? 'bg-blue-100 text-blue-700' 
              : log.user_role === 'manager' 
                ? 'bg-purple-100 text-purple-700' 
                : 'bg-amber-100 text-amber-700'
          }`}>
            {log.user_role}
          </span>
        </div>

        {/* Description Text */}
        <p className="text-slate-700 text-sm leading-relaxed mb-2 break-words">
          {log.description}
        </p>

        {/* Metadata chips or expansion if present */}
        {log.metadata && Object.keys(log.metadata).length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-2.5">
            {log.metadata.delivered_qty !== undefined && (
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-slate-200">
                 Delivered: {log.metadata.delivered_qty} Cans
              </span>
            )}
            {log.metadata.returned_empty_qty !== undefined && (
              <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-slate-200">
                 Returned: {log.metadata.returned_empty_qty} Empties
              </span>
            )}
            {log.metadata.payment_mode !== undefined && (
              <span className="bg-emerald-50 text-emerald-600 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-emerald-200">
                Mode: {log.metadata.payment_mode}
              </span>
            )}
            {log.metadata.route && (
              <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-0.5 rounded-lg border border-blue-200">
                Route: {log.metadata.route}
              </span>
            )}
          </div>
        )}

        {/* Timestamp & Expand trigger */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{onFormatTime(log.timestamp)}</span>
          </div>
          
          <button 
            onClick={() => onToggleExpand(log.log_id)}
            className="flex items-center gap-1 text-[10px] text-blue-600 hover:text-blue-800 font-bold uppercase tracking-wider transition-colors"
          >
            {isExpanded ? (
              <>
                Hide Params <ChevronUp className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                Expand Raw <ChevronDown className="w-3.5 h-3.5" />
              </>
            )}
          </button>
        </div>

        {/* Raw Metadata panel */}
        {isExpanded && (
          <div className="mt-3 bg-slate-50 rounded-2xl p-3.5 border border-slate-100 font-mono text-[11px] text-slate-600 space-y-1.5">
            <div className="font-bold text-slate-400 text-[9px] uppercase tracking-wider mb-1 border-b border-slate-200/60 pb-1">Raw Database Fields</div>
            <div className="flex justify-between gap-2 border-b border-slate-100/50 pb-0.5">
              <span className="text-slate-400">log_id:</span>
              <span className="text-slate-800 text-right font-semibold break-all">{log.log_id}</span>
            </div>
            <div className="flex justify-between gap-2 border-b border-slate-100/50 pb-0.5">
              <span className="text-slate-400">action_type:</span>
              <span className="text-slate-800 text-right font-semibold break-all">{log.action_type || 'N/A'}</span>
            </div>
            <div className="flex justify-between gap-2 border-b border-slate-100/50 pb-0.5">
              <span className="text-slate-400">user_id:</span>
              <span className="text-slate-800 text-right font-semibold break-all">{log.user_id || 'N/A'}</span>
            </div>
            <div className="flex justify-between gap-2 border-b border-slate-100/50 pb-0.5">
              <span className="text-slate-400">businessId:</span>
              <span className="text-slate-800 text-right font-semibold break-all">{log.businessId || 'N/A'}</span>
            </div>
            {log.metadata && Object.keys(log.metadata).map((key) => (
              <div key={key} className="flex justify-between gap-2 border-b border-slate-100/50 pb-0.5 last:border-0 last:pb-0">
                <span className="text-slate-400">meta.{key}:</span>
                <span className="text-slate-800 text-right font-semibold break-all">
                  {typeof log.metadata[key] === 'object' ? JSON.stringify(log.metadata[key]) : String(log.metadata[key])}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
