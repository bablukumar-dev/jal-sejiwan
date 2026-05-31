'use client';
import { useState } from 'react';
import TopAppBar from '@/components/TopAppBar';
import BottomNav from '@/components/BottomNav';
import { Calendar, Download, FileText, BarChart3, AlertTriangle, Package, Users, Truck, Wallet } from 'lucide-react';
import { useAppContext } from '@/app/context/AppContext';
import { wrapRoute } from '@/lib/permissionGuard';

function Reports() {
  const { customers, deliveries, payments, businessInfo } = useAppContext();
  const [userRole, setUserRole] = useState<'owner' | 'manager' | 'staff'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('userRole');
      if (stored === 'owner' || stored === 'manager' || stored === 'staff') return stored;
    }
    return 'owner';
  });

  const pendingTasks = customers.filter(c => c.due > 0).length;

  const handleExport = (reportName: string) => {
    alert(`Exporting ${reportName}...`);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <TopAppBar title="Jal Sejiwan" showBack={true} />

      <main className="max-w-md mx-auto px-4 py-6">
        {/* Header */}
        <div className="bg-blue-600 rounded-3xl p-6 text-white mb-6 relative overflow-hidden">
          <div className="absolute right-0 top-0 opacity-10">
            <BarChart3 className="w-48 h-48 -mr-10 -mt-10" />
          </div>
          <h1 className="text-2xl font-bold mb-2 relative z-10">Operational Reports</h1>
          <p className="text-blue-100 text-sm mb-6 relative z-10">Access detailed insights into your water delivery network. Download high-precision data for inventory, collections, and staff productivity.</p>
          
          <div className="flex gap-3 relative z-10">
            <div className="bg-blue-500/50 rounded-xl p-3 flex-1 border border-blue-400/30">
              <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wider mb-1">Last Updated</div>
              <div className="font-bold">Today, 06:45 AM</div>
            </div>
            <div className="bg-blue-500/50 rounded-xl p-3 flex-1 border border-blue-400/30">
              <div className="text-[10px] font-bold text-blue-200 uppercase tracking-wider mb-1">Pending Tasks</div>
              <div className="font-bold">{pendingTasks} Dues</div>
            </div>
          </div>
        </div>

        {/* Report Cards */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Truck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-1">Daily Delivery</h3>
            <p className="text-sm text-slate-500 mb-4">Complete breakdown of all bottles dispatched and successfully delivered across all routes for today.</p>
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PDF • 1.2 MB</span>
              <button onClick={() => handleExport('Daily Delivery')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 active:scale-95 transition-transform">
                <Download className="w-4 h-4" /> EXPORT
              </button>
            </div>
          </div>

          {userRole === 'owner' && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Wallet className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">Daily Collection</h3>
              <p className="text-sm text-slate-500 mb-4">Summary of all cash and digital payments received during the current operational shift.</p>
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">XLSX • 840 KB</span>
                <button onClick={() => handleExport('Daily Collection')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 active:scale-95 transition-transform">
                  <Download className="w-4 h-4" /> EXPORT
                </button>
              </div>
            </div>
          )}

          {userRole === 'owner' && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-red-50 text-red-600 text-[10px] font-bold px-2 py-1 rounded uppercase tracking-wider">Action Required</div>
              <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center mb-3">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">Due Report</h3>
              <p className="text-sm text-slate-500 mb-4">List of all customers with outstanding balances, sorted by age and amount for collection priority.</p>
              <div className="flex flex-col gap-2 border-t border-slate-100 pt-4 mt-2">
                <button 
                   onClick={async () => {
                      if (!confirm(`Generate PDF bills for all ${customers.filter(c => c.due > 0).length} customers?`)) return;
                       try {
                        const { generateInvoicePDF } = await import('@/lib/pdfGenerator');
                        const dueCustomers = customers.filter(c => c.due > 0);
                        for (const cust of dueCustomers) {
                           const custDeliveries = deliveries.filter(d => d.customerId === cust.id);
                           const custPayments = payments.filter(p => p.customerId === cust.id);
                           const { doc } = generateInvoicePDF(cust, custDeliveries, custPayments, businessInfo);
                           doc.save(`Invoice_${cust.name}_${new Date().toLocaleDateString('en-GB')}.pdf`);
                        }
                        alert('Bulk PDFs generated successfully!');
                      } catch (e) {
                        console.error(e);
                        alert('Failed to generate bulk PDFs');
                      }
                   }}
                   className="w-full bg-slate-100 text-slate-700 px-4 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <FileText className="w-4 h-4" /> BATCH EXPORT DUE INVOICES
                </button>
                
                <div className="flex items-center justify-between mt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PDF • 2.1 MB</span>
                  <button onClick={() => handleExport('Due Report')} className="bg-red-700 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 active:scale-95 transition-transform">
                    <Download className="w-4 h-4" /> REPORT
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center mb-3">
              <Package className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-1">Empty Can Report</h3>
            <p className="text-sm text-slate-500 mb-4">Track empty bottle inventory at customer sites versus returns to the warehouse for cleaning.</p>
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">CSV • 450 KB</span>
              <button onClick={() => handleExport('Empty Can Report')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 active:scale-95 transition-transform">
                <Download className="w-4 h-4" /> EXPORT
              </button>
            </div>
          </div>

          {userRole === 'owner' && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
              <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <BarChart3 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">Monthly Sales</h3>
              <p className="text-sm text-slate-500 mb-4">Comprehensive monthly growth analysis, comparing sales volume and revenue targets for the current period.</p>
              <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PDF • Auto-generated</span>
                <button 
                  onClick={async () => {
                     try {
                       const { jsPDF } = await import('jspdf');
                       await import('jspdf-autotable');
                       const doc = new jsPDF();
                       doc.setFontSize(20);
                       doc.text("Monthly Sales Report", 14, 22);
                       doc.setFontSize(12);
                       doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 30);
                       
                       let totalCans = deliveries.reduce((sum, d) => sum + d.deliveredQty, 0);
                       let totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0);
                       let currentDue = customers.reduce((sum, c) => sum + c.due, 0);

                       const tableData = [
                          ['Total Deliveries (Cans)', totalCans.toString()],
                          ['Total Revenue Collected', `Rs ${totalRevenue}`],
                          ['Total Outstanding Due', `Rs ${currentDue}`],
                       ];

                       // @ts-ignore
                       doc.autoTable({
                         startY: 40,
                         head: [['Metric', 'Value']],
                         body: tableData,
                         theme: 'grid',
                         headStyles: { fillColor: [41, 128, 185] }
                       });

                       doc.save(`Monthly_Report_${new Date().toLocaleDateString('en-GB')}.pdf`);
                       alert('PDF Generated Successfully');
                     } catch (e) {
                       console.error(e);
                       alert('Failed to generate PDF');
                     }
                  }} 
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 active:scale-95 transition-transform"
                >
                  <FileText className="w-4 h-4" /> GENERATE PDF
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
            <div className="w-10 h-10 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg mb-1">Staff Performance</h3>
            <p className="text-sm text-slate-500 mb-4">Evaluation of delivery speed, collection accuracy, and customer feedback for all route staff members.</p>
            <div className="flex items-center justify-between border-t border-slate-100 pt-4 mt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">PDF • 1.8 MB</span>
              <button onClick={() => handleExport('Staff Performance')} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 active:scale-95 transition-transform">
                <Download className="w-4 h-4" /> EXPORT
              </button>
            </div>
          </div>
        </div>

        {/* Custom Data Query */}
        <div className="bg-slate-100 rounded-3xl p-6 mt-8 border border-slate-200">
          <h3 className="font-bold text-slate-900 text-lg mb-2">Custom Data Query</h3>
          <p className="text-sm text-slate-500 mb-6">Need a specific date range or filtered customer list? Generate a custom report instantly using our operational filters.</p>
          
          <div className="space-y-4 mb-6">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">From Date</label>
              <div className="bg-white rounded-xl px-4 py-3 flex items-center justify-between border border-slate-200">
                <input type="date" className="w-full bg-transparent outline-none font-medium text-slate-700" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">To Date</label>
              <div className="bg-white rounded-xl px-4 py-3 flex items-center justify-between border border-slate-200">
                <input type="date" className="w-full bg-transparent outline-none font-medium text-slate-700" />
              </div>
            </div>
          </div>

          <button onClick={() => handleExport('Custom Report')} className="w-full bg-slate-600 text-white rounded-xl py-4 font-bold flex items-center justify-center gap-2 active:scale-95 transition-transform">
            <FileText className="w-5 h-5" /> GENERATE CUSTOM REPORT
          </button>
        </div>

      </main>

      {/* FAB */}
      <button onClick={() => handleExport('All Reports')} className="fixed bottom-24 right-6 bg-blue-600 text-white w-14 h-14 rounded-2xl shadow-lg shadow-blue-600/30 z-40 active:scale-90 duration-200 flex items-center justify-center">
        <Download className="w-6 h-6" />
      </button>

      <BottomNav role={userRole} activeTab="reports" />
    </div>
  );
}

export default wrapRoute(Reports, { requiredRole: 'manager' });
