'use client';

import React from 'react';

/**
 * Base Skeleton component with subtle pulse animation and matching border radius
 */
export function Skeleton({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-slate-200/80 ${className}`}
      {...props}
    />
  );
}

/**
 * Skeleton for Dashboard Stat/KPI Cards
 */
export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 flex flex-col justify-between h-28 animate-pulse">
          <div className="flex items-center justify-between mb-2">
            <Skeleton className="h-3 w-20 bg-slate-200" />
            <Skeleton className="h-5 w-5 rounded-full bg-slate-200" />
          </div>
          <Skeleton className="h-8 w-24 bg-slate-200" />
          <Skeleton className="h-2 w-16 bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for Customer List Items
 */
export function CustomerCardSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-pulse">
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-2 flex-1 pr-4">
              <Skeleton className="h-5 w-36 bg-slate-200" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-3.5 rounded-full bg-slate-200" />
                <Skeleton className="h-3.5 w-48 bg-slate-200" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-9 rounded-full bg-slate-200" />
              <Skeleton className="h-9 w-9 rounded-full bg-slate-200" />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-5 w-20 rounded-full bg-slate-200" />
            <Skeleton className="h-5 w-16 rounded-full bg-slate-200" />
            <Skeleton className="h-5 w-24 rounded-full bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for Delivery List Items
 */
export function DeliveryCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-pulse">
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-2 flex-1 pr-4">
              <Skeleton className="h-5 w-40 bg-slate-200" />
              <div className="flex items-center gap-1">
                <Skeleton className="h-3.5 w-3.5 rounded-full bg-slate-200" />
                <Skeleton className="h-3.5 w-32 bg-slate-200" />
              </div>
            </div>
            <Skeleton className="h-6 w-20 rounded-full bg-slate-200" />
          </div>
          <div className="flex items-center justify-between border-t border-slate-100 pt-3 mt-2">
            <Skeleton className="h-4 w-28 bg-slate-200" />
            <Skeleton className="h-8 w-24 rounded-xl bg-slate-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for Payment Transaction List
 */
export function PaymentCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 animate-pulse flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-5 w-36 bg-slate-200" />
            <div className="flex items-center gap-2">
              <Skeleton className="h-3.5 w-20 bg-slate-200" />
              <Skeleton className="h-3.5 w-16 bg-slate-200" />
            </div>
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-6 w-20 bg-slate-200 ml-auto" />
            <Skeleton className="h-4 w-12 rounded-full bg-slate-200 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for Activity Log Audit Feed
 */
export function ActivityLogSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm animate-pulse space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-8 rounded-full bg-slate-200" />
              <div className="space-y-1">
                <Skeleton className="h-4 w-28 bg-slate-200" />
                <Skeleton className="h-3 w-16 bg-slate-200" />
              </div>
            </div>
            <Skeleton className="h-4 w-20 bg-slate-200" />
          </div>
          <Skeleton className="h-4 w-full bg-slate-200" />
          <Skeleton className="h-3 w-3/4 bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for Table Rows (Inventory & History)
 */
export function TableRowSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i} className="animate-pulse">
          <td className="p-4"><Skeleton className="h-4 w-16 bg-slate-200" /></td>
          <td className="p-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded bg-slate-200" />
              <Skeleton className="h-4 w-24 bg-slate-200" />
            </div>
          </td>
          <td className="p-4"><Skeleton className="h-4 w-16 bg-slate-200" /></td>
        </tr>
      ))}
    </>
  );
}

/**
 * Skeleton for Staff Management Items
 */
export function StaffCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm animate-pulse flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-full bg-slate-200" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-32 bg-slate-200" />
              <Skeleton className="h-3.5 w-24 bg-slate-200" />
            </div>
          </div>
          <Skeleton className="h-8 w-20 rounded-xl bg-slate-200" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for Customer Profile View
 */
export function CustomerProfileSkeleton() {
  return (
    <div className="space-y-6 w-full animate-pulse">
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full bg-slate-200" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-40 bg-slate-200" />
            <Skeleton className="h-4 w-28 bg-slate-200" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 pt-2">
          <Skeleton className="h-16 rounded-2xl bg-slate-100" />
          <Skeleton className="h-16 rounded-2xl bg-slate-100" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="h-12 rounded-2xl bg-slate-200" />
        <Skeleton className="h-20 rounded-2xl bg-slate-200" />
        <Skeleton className="h-20 rounded-2xl bg-slate-200" />
      </div>
    </div>
  );
}
