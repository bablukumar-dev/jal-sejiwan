'use client';
/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { useState, useEffect, useMemo, memo } from 'react';
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
  ArrowUpRight,
  Download,
  AlertCircle,
  ShieldCheck,
  Server,
  Settings
} from 'lucide-react';
import { ActivityLog } from '@/lib/activityLogger';
import { GroupedVirtuoso } from 'react-virtuoso';
import { getFirebase } from '@/src/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  startAfter, 
  getDocs,
  Timestamp 
} from 'firebase/firestore';

export default function ActivityLogDashboard() {
  const { staff, currentUser } = useAppContext();
  
  const userRole = currentUser?.role || 'owner';
  const currentUserId = currentUser?.uid || 'unknown';
  const workspaceId = currentUser?.businessId || null;

  const [refreshKey, setRefreshKey] = useState(0);

  // DB States
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [hasMore, setHasMore] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState<Record<string, boolean>>({});

  const toggleExpand = (logId: string) => {
    setExpandedLogs(prev => ({
      ...prev,
      [logId]: !prev[logId]
    }));
  };
  
  // Filtering & Search
  const [selectedModule, setSelectedModule] = useState<string>('ALL');
  const [selectedUserFilter, setSelectedUserFilter] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // Load real activity logs with real-time updates
  useEffect(() => {
    const { db } = getFirebase();
    if (!db || !workspaceId) return;

    setIsLoading(true);

    let logsQuery = query(
      collection(db, 'activity_logs'),
      orderBy('timestamp', 'desc'),
      limit(50)
    );

    // Apply RBAC filters at query level for security and performance
    if (userRole === 'manager') {
      logsQuery = query(logsQuery, where('businessId', '==', workspaceId));
    } else if (userRole === 'staff') {
      logsQuery = query(logsQuery, where('userId', '==', currentUserId));
    } else if (userRole === 'owner') {
      // Owner can see all, but usually we filter by businessId anyway in this app
      // if (workspaceId) logsQuery = query(logsQuery, where('businessId', '==', workspaceId));
    }

    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const newLogs = snapshot.docs.map(doc => ({
        ...doc.data(),
        log_id: doc.id
      })) as ActivityLog[];
      
      setLogs(newLogs);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 50);
      setIsLoading(false);
    }, (error) => {
      console.error("Firestore onSnapshot error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [workspaceId, userRole, currentUserId, refreshKey]);

  const loadMore = async () => {
    if (!hasMore || isLoading || !lastDoc) return;

    setIsLoading(true);
    const { db } = getFirebase();
    if (!db) return;

    let logsQuery = query(
      collection(db, 'activity_logs'),
      orderBy('timestamp', 'desc'),
      startAfter(lastDoc),
      limit(50)
    );

    if (userRole === 'manager') {
      logsQuery = query(logsQuery, where('businessId', '==', workspaceId));
    } else if (userRole === 'staff') {
      logsQuery = query(logsQuery, where('userId', '==', currentUserId));
    }

    try {
      const snapshot = await getDocs(logsQuery);
      const moreLogs = snapshot.docs.map(doc => ({
        ...doc.data(),
        log_id: doc.id
      })) as ActivityLog[];

      setLogs(prev => [...prev, ...moreLogs]);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1]);
      setHasMore(snapshot.docs.length === 50);
    } catch (error) {
      console.error("Error loading more logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Interactive Page Filters Analysis
  const finalLogs = useMemo(() => {
    return logs.filter(log => {
      // Module filter
      if (selectedModule !== 'ALL' && log.module !== selectedModule) return false;

      // Status filter
      if (selectedStatus !== 'ALL' && log.status !== selectedStatus) return false;

      // User Performer filter
      if (selectedUserFilter !== 'ALL') {
        if (selectedUserFilter === 'ME' && String(log.userId) !== String(currentUserId)) return false;
        if (selectedUserFilter !== 'ME' && String(log.userId) !== selectedUserFilter) return false;
      }

      // Live search input query
      if (searchQuery) {
        const queryStr = searchQuery.toLowerCase();
        const matchName = log.userName.toLowerCase().includes(queryStr);
        const matchDesc = log.description.toLowerCase().includes(queryStr);
        const matchAction = log.action.toLowerCase().includes(queryStr);
        const matchModule = log.module.toLowerCase().includes(queryStr);
        return matchName || matchDesc || matchAction || matchModule;
      }

      return true;
    });
  }, [logs, selectedModule, selectedUserFilter, selectedStatus, searchQuery, currentUserId]);

  const { groupedLogs, groupCounts, flattenedLogs } = useMemo(() => {
    const groups: Record<string, ActivityLog[]> = {};
    
    // Sort just in case to be 100% compliant with DESC order
    const sorted = [...finalLogs].sort((a, b) => {
      const timeA = (() => {
        if (!a.timestamp) return 0;
        if (typeof a.timestamp.toDate === 'function') return a.timestamp.toDate().getTime();
        const t = new Date(a.timestamp).getTime();
        return isNaN(t) ? 0 : t;
      })();
      const timeB = (() => {
        if (!b.timestamp) return 0;
        if (typeof b.timestamp.toDate === 'function') return b.timestamp.toDate().getTime();
        const t = new Date(b.timestamp).getTime();
        return isNaN(t) ? 0 : t;
      })();
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

    const parsedGroups = Object.keys(groups)
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

    return { 
      groupedLogs: parsedGroups, 
      groupCounts: parsedGroups.map(g => g.logs.length), 
      flattenedLogs: parsedGroups.flatMap(g => g.logs) 
    };
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
    const errorCount = finalLogs.filter(l => l.status === 'error').length;
    const warningCount = finalLogs.filter(l => l.status === 'warning').length;
    
    // Total payment value recorded in logs
    const totalPaymentsValue = logs
      .filter(l => l.module === 'Payments' && l.success)
      .reduce((sum, l) => {
        const amt = Number(l.newValue?.amount || l.metadata?.amount || 0);
        return sum + amt;
      }, 0);

    return {
      totalCount,
      errorCount,
      warningCount,
      totalPaymentsValue
    };
  }, [finalLogs, logs]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return 'Just now';
    try {
      let d: Date;
      if (typeof timestamp.toDate === 'function') {
        d = timestamp.toDate();
      } else if (timestamp instanceof Date) {
        d = timestamp;
      } else if (timestamp.seconds) {
        d = new Date(timestamp.seconds * 1000);
      } else {
        d = new Date(timestamp);
      }
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', ' + d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch (e) {
      return 'Unknown time';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="Audit Trail" subtitle="System Transparency" showBack={true} />

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Real-time Status Badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isLive ? 'bg-emerald-400' : 'bg-blue-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isLive ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
            </span>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-widest">
              {isLive ? 'Live Audit Stream' : 'Archive View'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button 
              onClick={() => {
                const csvHeaders = "Timestamp,User,Role,Module,Action,Status,Description\n";
                const csvRows = flattenedLogs.map(log => {
                  return `"${formatTime(log.timestamp)}","${log.userName}","${log.role}","${log.module}","${log.action}","${log.status}","${log.description.replace(/"/g, '""')}"`;
                }).join("\n");
                const blob = new Blob([csvHeaders + csvRows], { type: 'text/csv' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.setAttribute('href', url);
                a.setAttribute('download', `jalsejiwan_audit_${new Date().toISOString().split('T')[0]}.csv`);
                a.click();
              }}
              className="text-slate-400 hover:text-emerald-700 p-2 bg-white hover:bg-emerald-50 border border-slate-200 rounded-xl transition-all"
              title="Export to CSV"
            >
              <Download className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setRefreshKey(prev => prev + 1)}
              className="text-slate-400 hover:text-blue-700 p-2 bg-white hover:bg-blue-50 border border-slate-200 rounded-xl transition-all"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Dynamic KPI Stats Row */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-900 text-white rounded-3xl p-5 shadow-lg shadow-slate-900/10 relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10">
              <ShieldCheck className="w-24 h-24 -mb-4 -mr-4" />
            </div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Events</div>
            <div className="text-4xl font-extrabold mb-2">{stats.totalCount}</div>
            <p className="text-[10px] text-slate-500">Immutable records indexed</p>
          </div>

          <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm relative overflow-hidden">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Anomalies</div>
            <div className="flex items-end gap-2 mb-2">
              <div className="text-4xl font-extrabold text-rose-600">{stats.errorCount}</div>
              {stats.warningCount > 0 && (
                <div className="text-lg font-bold text-amber-500 mb-1">+{stats.warningCount}</div>
              )}
            </div>
            <p className="text-[10px] text-slate-400">Errors & Warnings</p>
          </div>
        </div>

        {/* Search Input Box */}
        <div className="mb-4 flex gap-2">
          <div className="relative flex-1 flex items-center">
            <Search className="absolute left-4 text-slate-400 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Search audit trail..." 
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-2 focus:ring-blue-600 text-slate-900 placeholder:text-slate-400 text-sm font-medium transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            type="button"
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`px-4 bg-white border rounded-2xl flex items-center justify-center transition-all ${
              showFilterPanel || selectedModule !== 'ALL' || selectedUserFilter !== 'ALL' || selectedStatus !== 'ALL'
                ? 'border-blue-600 text-blue-700 bg-blue-50' 
                : 'border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-5 h-5" />
          </button>
        </div>

        {/* Interactive Filter Panel */}
        {showFilterPanel && (
          <div className="bg-white rounded-3xl p-6 shadow-xl shadow-slate-200/50 border border-slate-200 mb-6 space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-blue-600" /> Audit Filters
              </span>
              <button 
                onClick={() => {
                  setSelectedModule('ALL');
                  setSelectedUserFilter('ALL');
                  setSelectedStatus('ALL');
                }}
                className="text-[10px] text-blue-700 font-bold hover:underline"
              >
                Clear All
              </button>
            </div>

            {/* Module Chips */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3 block">Module Source</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'ALL', label: 'All Modules' },
                  { value: 'Authentication', label: 'Auth' },
                  { value: 'Customer', label: 'Customers' },
                  { value: 'Payments', label: 'Payments' },
                  { value: 'Water Management', label: 'Water' },
                  { value: 'Organization', label: 'Org' },
                  { value: 'Security', label: 'Security' }
                ].map((chip) => (
                  <button 
                    key={chip.value}
                    onClick={() => setSelectedModule(chip.value)}
                    className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all ${
                      selectedModule === chip.value 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Status Filter */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Status</label>
                <select 
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="w-full bg-slate-100 px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 text-xs font-bold text-slate-900 appearance-none"
                >
                  <option value="ALL">All Status</option>
                  <option value="success">Success</option>
                  <option value="warning">Warning</option>
                  <option value="error">Error</option>
                </select>
              </div>

              {/* Performer User Dropdown */}
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Performer</label>
                <select 
                  value={selectedUserFilter}
                  onChange={(e) => setSelectedUserFilter(e.target.value)}
                  className="w-full bg-slate-100 px-3 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-blue-600 text-xs font-bold text-slate-900 appearance-none"
                >
                  <option value="ALL">All Users</option>
                  <option value="ME">Just Me</option>
                  {staff.map((u) => (
                    <option key={u.id} value={String(u.id)}>{u.name}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* List Title */}
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Database className="w-3.5 h-3.5" /> Immutable Event Log
          </h3>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            {finalLogs.length} matches
          </span>
        </div>

        {/* Streams Container */}
        <div className="space-y-4">
          {isLoading && logs.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100 flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm font-medium text-slate-500">Retrieving audit chain...</p>
            </div>
          ) : finalLogs.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center border border-slate-100">
              <Activity className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="font-bold text-slate-700 text-base mb-1">Clear Audit Trail</p>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">No system activities recorded for the selected parameters.</p>
            </div>
          ) : (
            <>
              <GroupedVirtuoso
                useWindowScroll
                groupCounts={groupCounts}
                groupContent={index => (
                  <div className="bg-slate-50 flex items-center gap-2.5 pt-4 pb-1">
                    <span className="text-[9px] font-extrabold text-slate-400 bg-white border border-slate-200 rounded-lg px-2.5 py-1 tracking-widest uppercase">
                      {groupedLogs[index].formattedDate}
                    </span>
                    <div className="flex-1 h-[1px] bg-slate-200" />
                  </div>
                )}
                itemContent={index => {
                  const log = flattenedLogs[index];
                  return (
                    <div className="py-2">
                      <MemoizedLogEntry
                        log={log}
                        isExpanded={!!expandedLogs[log.log_id!]}
                        onToggleExpand={toggleExpand}
                        onFormatTime={formatTime}
                      />
                    </div>
                  );
                }}
              />
              
              {hasMore && (
                <button
                  onClick={loadMore}
                  disabled={isLoading}
                  className="w-full py-4 mt-4 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  {isLoading ? 'Loading older records...' : 'Load older records'}
                </button>
              )}
            </>
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
  onFormatTime: (timestamp: any) => string;
}

const getModuleIcon = (module: string) => {
  switch (module) {
    case 'Authentication': return <ShieldCheck className="w-4 h-4" />;
    case 'Customer': return <UserPlus className="w-4 h-4" />;
    case 'Payments': return <Coins className="w-4 h-4" />;
    case 'Water Management': return <Server className="w-4 h-4" />;
    case 'Organization': return <Settings className="w-4 h-4" />;
    case 'Security': return <AlertCircle className="w-4 h-4 text-rose-600" />;
    default: return <Activity className="w-4 h-4" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'success': return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    case 'error': return 'bg-rose-50 text-rose-700 border-rose-100';
    case 'warning': return 'bg-amber-50 text-amber-700 border-amber-100';
    case 'info': return 'bg-blue-50 text-blue-700 border-blue-100';
    default: return 'bg-slate-50 text-slate-700 border-slate-100';
  }
};

const MemoizedLogEntry = memo(function MemoizedLogEntry({
  log,
  isExpanded,
  onToggleExpand,
  onFormatTime,
}: MemoizedLogEntryProps) {
  const moduleIcon = getModuleIcon(log.module);
  const statusBadge = getStatusBadge(log.status);

  return (
    <div className={`bg-white rounded-2xl p-4 shadow-sm border transition-all ${log.status === 'error' ? 'border-rose-100' : 'border-slate-100'} hover:border-slate-200`}>
      <div className="flex gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
          log.status === 'error' ? 'bg-rose-50 text-rose-600 border-rose-100' : 'bg-slate-50 text-slate-600 border-slate-100'
        }`}>
          {moduleIcon}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-sm truncate">{log.userName}</span>
              <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider ${
                log.role === 'owner' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'
              }`}>
                {log.role}
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded-lg border text-[8px] font-bold uppercase tracking-wider ${statusBadge}`}>
              {log.status}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{log.module}</span>
            <ChevronRight className="w-2.5 h-2.5 text-slate-300" />
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">{log.action}</span>
          </div>

          <p className="text-slate-700 text-sm leading-relaxed mb-3">
            {log.description}
          </p>

          <div className="flex items-center justify-between pt-3 border-t border-slate-50">
            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              <Calendar className="w-3 h-3" />
              <span>{onFormatTime(log.timestamp)}</span>
            </div>
            
            <button 
              onClick={() => onToggleExpand(log.log_id!)}
              className="text-[10px] text-blue-600 hover:text-blue-800 font-bold uppercase tracking-wider"
            >
              {isExpanded ? 'Hide Details' : 'View Details'}
            </button>
          </div>

          {isExpanded && (
            <div className="mt-4 bg-slate-50 rounded-xl p-4 border border-slate-100 font-mono text-[11px] overflow-auto">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between gap-4 py-1 border-b border-slate-200/50">
                  <span className="text-slate-400 uppercase font-sans font-bold text-[9px]">Log ID</span>
                  <span className="text-slate-800 break-all text-right">{log.activityId}</span>
                </div>
                <div className="flex justify-between gap-4 py-1 border-b border-slate-200/50">
                  <span className="text-slate-400 uppercase font-sans font-bold text-[9px]">Resource</span>
                  <span className="text-slate-800 text-right">{log.resourceType || 'N/A'} {log.resourceName ? `(${log.resourceName})` : ''}</span>
                </div>
                {log.previousValue && (
                  <div className="py-2 border-b border-slate-200/50">
                    <span className="text-slate-400 uppercase font-sans font-bold text-[9px] block mb-1">Previous State</span>
                    <pre className="text-slate-600 whitespace-pre-wrap">{JSON.stringify(log.previousValue, null, 2)}</pre>
                  </div>
                )}
                {log.newValue && (
                  <div className="py-2 border-b border-slate-200/50">
                    <span className="text-slate-400 uppercase font-sans font-bold text-[9px] block mb-1">New State</span>
                    <pre className="text-slate-600 whitespace-pre-wrap">{JSON.stringify(log.newValue, null, 2)}</pre>
                  </div>
                )}
                <div className="flex justify-between gap-4 py-1">
                  <span className="text-slate-400 uppercase font-sans font-bold text-[9px]">Metadata</span>
                  <span className="text-slate-800 text-right">{log.device?.split(' ')[0] || 'Unknown'} / {log.browser || 'Unknown'}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});
