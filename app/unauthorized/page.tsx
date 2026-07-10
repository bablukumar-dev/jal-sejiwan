'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldAlert, ArrowLeft, Mail, Loader2 } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';

interface AccessAttempt {
  id: string;
  timestamp: string;
  user: string;
  attemptedPath: string;
  role: string;
}

export default function UnauthorizedPage() {
  const router = useRouter();
  const { currentUser, authLoading } = useAppContext();
  const [timeLeft, setTimeLeft] = useState(10);
  const [showDebug, setShowDebug] = useState(false);
  const [attempts, setAttempts] = useState<AccessAttempt[]>([]);

  useEffect(() => {
    if (authLoading) return;

    if (typeof window !== 'undefined') {
      // Manage Access Attempt Logs
      const stored = localStorage.getItem('unauthorized_attempts');
      let list: AccessAttempt[] = [];
      if (stored) {
        try {
          list = JSON.parse(stored);
        } catch (e) {
          list = [];
        }
      }

      // Add current diagnostic attempt to log
      const logIdentity = currentUser?.uid || 'Anonymous Visitor';
      let logPath = '/owner/dashboard';
      try {
        if (document.referrer) {
          const url = new URL(document.referrer);
          if (url.pathname && url.pathname !== '/unauthorized') {
            logPath = url.pathname;
          }
        }
      } catch {}

      const isDuplicate = list.some(
        (item) =>
          item.user === logIdentity &&
          item.attemptedPath === logPath &&
          Math.abs(Date.now() - new Date(item.timestamp).getTime()) < 10000
      );

      if (!isDuplicate) {
        list.unshift({
          id: `att-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          user: logIdentity,
          attemptedPath: logPath,
          role: currentUser?.role ? currentUser.role.charAt(0).toUpperCase() + currentUser.role.slice(1) : 'Guest',
        });
      }

      localStorage.setItem('unauthorized_attempts', JSON.stringify(list));
      setAttempts(list);
    }
  }, [authLoading, currentUser]);

  useEffect(() => {
    if (authLoading) return;
    
    if (timeLeft <= 0) {
      router.push('/login');
      return;
    }

    const timer = setTimeout(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [timeLeft, router, authLoading]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  // Support pre-populated mail template
  const supportEmail = 'support@jalsejiwan.in';
  const mailtoSubject = encodeURIComponent('Unauthorized Access Attempt Alert');
  const mailtoBody = encodeURIComponent(
    `Dear Support Team,\n\nAn unauthorized access attempt was detected on the Jalsejiwan application:\n\n` +
    `• Timestamp: ${new Date().toLocaleString()}\n` +
    `• User Identity: ${currentUser?.uid || 'Anonymous'}\n` +
    `• Assigned Role: ${currentUser?.role || 'Guest'}\n` +
    `• Business ID: ${currentUser?.businessId || 'N/A'}\n\n` +
    `Please assist in resolving these permission access levels.\n\nRegards,\nSecurity Operations`
  );
  const reportMailto = `mailto:${supportEmail}?subject=${mailtoSubject}&body=${mailtoBody}`;

  return (
    <div id="unauthorized-container" className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div id="unauthorized-card" className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 flex flex-col items-center border border-slate-100">
        <div id="alert-icon-wrapper" className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-6 text-red-500">
          <ShieldAlert className="w-10 h-10" />
        </div>
        
        <h1 id="unauthorized-title" className="text-2xl font-bold text-slate-800 mb-2">Access Denied</h1>
        <p id="unauthorized-description" className="text-slate-500 mb-4 max-w-sm">
          You do not have the required permissions to access this page. Please contact your administrator or switch to an authorized account.
        </p>

        {/* Expandable Debug Info Section */}
        <div id="debug-info-section" className="w-full text-left border-t border-slate-100 pt-3 mt-1 mb-4">
          <button
            id="toggle-debug-btn"
            onClick={() => setShowDebug(!showDebug)}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-1 mx-auto"
          >
            {showDebug ? 'Hide Diagnostic Info ▲' : 'Show Diagnostic Info ▼'}
          </button>
          {showDebug && (
            <div id="debug-info-details" className="mt-3 bg-slate-50 rounded-xl p-4 text-[11px] font-mono text-slate-600 space-y-1.5 border border-slate-100 animate-fadeIn">
              <div className="flex justify-between"><span className="font-semibold text-slate-500">Session Role:</span> <span className="text-slate-800">{currentUser?.role || 'Guest'}</span></div>
              <div className="flex justify-between"><span className="font-semibold text-slate-500">Identity:</span> <span className="text-slate-800 truncate max-w-[150px]">{currentUser?.uid || 'Guest'}</span></div>
              <div className="flex justify-between"><span className="font-semibold text-slate-500">Business ID:</span> <span className="text-slate-800 truncate max-w-[150px]">{currentUser?.businessId || 'N/A'}</span></div>
            </div>
          )}
        </div>

        <p id="countdown-timer" className="text-sm text-slate-400 mb-6">
          Redirecting to login page in <span className="font-semibold text-slate-600">{timeLeft}</span> seconds...
        </p>

        <div className="w-full space-y-3">
          <Link
            id="back-to-login-btn"
            href="/login"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Login
          </Link>

          <a
            id="report-incident-btn"
            href={reportMailto}
            className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-4 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 text-sm border border-slate-200"
          >
            <Mail className="w-4 h-4" />
            Report Incident
          </a>
        </div>
      </div>

      {/* Detailed Access Log Table */}
      <div id="unauthorized-attempts-section" className="w-full max-w-2xl mt-8 bg-white rounded-3xl shadow-lg border border-slate-100 p-6 text-left">
        <h2 id="attempts-table-title" className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
          Recent Unauthorized Access Diagnostic Log
        </h2>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table id="attempts-table" className="min-w-full divide-y divide-slate-100 text-xs">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Timestamp</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">User Identity</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Attempted Path</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">Role</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white font-mono text-[11px]">
              {attempts.slice(0, 5).map((attempt) => (
                <tr key={attempt.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{attempt.timestamp}</td>
                  <td className="px-4 py-3 text-slate-700 font-semibold whitespace-nowrap truncate max-w-[160px]">{attempt.user}</td>
                  <td className="px-4 py-3 text-red-600 whitespace-nowrap">{attempt.attemptedPath}</td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      attempt.role === 'Owner' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                      attempt.role === 'Manager' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                      attempt.role === 'Delivery Partner' || attempt.role === 'Staff' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                      'bg-slate-50 text-slate-600 border border-slate-100'
                    }`}>
                      {attempt.role}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-slate-400 mt-3 text-center">
          * This diagnostic table registers local system attempts for security auditing and compliance.
        </p>
      </div>
    </div>
  );
}
