import React, { useMemo } from 'react';
import { Customer, Delivery, Payment, Inventory } from '@/app/context/AppContext';
import { AlertTriangle } from 'lucide-react';

export function useLossDetection(customers: Customer[], deliveries: Delivery[], inventory: Inventory, payments: Payment[]) {
  return useMemo(() => {
    let warnings = [];

    // 1. Empty Can Mismatch
    const totalExpectedEmpties = customers.reduce((sum, c) => sum + (c.emptyBalance || 0), 0);
    if (Math.abs(inventory.cansWithCustomers - totalExpectedEmpties) > 10) {
      warnings.push({
        type: 'Inventory Mismatch',
        desc: `System inventory says ${inventory.cansWithCustomers} cans in market, but customer records sum to ${totalExpectedEmpties}.`
      });
    }

    // 2. Delivered vs Returned Difference (recent delivery checks)
    const recentDeliveries = deliveries.slice(-50);
    const unusualDeliveries = recentDeliveries.filter(d => 
      d.status === 'Completed' && (d.deliveredQty - d.returnedEmpty) > 10
    );
    if (unusualDeliveries.length > 0) {
      warnings.push({
        type: 'Delivery Gap',
        desc: `Found ${unusualDeliveries.length} recent deliveries where delivered cans significantly exceed empties returned.`
      });
    }

    // 3. Unusual payment anomaly
    const largePayments = payments.filter(p => p.amount > 5000);
    if (largePayments.length > 0) {
      warnings.push({
        type: 'Unusual Payments',
        desc: `Detected ${largePayments.length} payments exceeding ₹5,000.`
      });
    }

    // 4. Missing inventory gap
    const totalInventoryCount = inventory.fullCans + inventory.emptyCans + inventory.damagedCans + inventory.cansWithCustomers + inventory.cansInDelivery;
    // We assume an initial inventory or expected cap. If there's a huge drop logic might apply if we tracked total lifecycle.
    
    return warnings;
  }, [customers, deliveries, inventory, payments]);
}

export function LossDetectionWidget({ warnings }: { warnings: any[] }) {
  if (warnings.length === 0) return null;

  return (
    <div className="bg-red-50 rounded-2xl p-4 border border-red-200 mt-2 mb-2">
       <h3 className="text-[10px] font-bold text-red-800 uppercase tracking-wider mb-2 flex items-center gap-1">
         Smart Loss Detection <AlertTriangle className="w-3 h-3"/>
       </h3>
       <div className="space-y-3">
         {warnings.map((w, i) => (
           <div key={i} className="flex flex-col gap-1">
             <div className="text-sm font-bold text-red-950">{w.type}</div>
             <div className="text-xs text-red-800 leading-tight">{w.desc}</div>
           </div>
         ))}
       </div>
    </div>
  );
}
