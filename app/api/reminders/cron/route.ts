import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/src/supabaseClient';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const today = new Date();
    // Support testing and evaluation using a manual override parameter
    const isManual = req.nextUrl.searchParams.get('manual') === 'true';

    if (today.getDate() !== 5 && !isManual) {
      return NextResponse.json({
        success: true,
        message: 'Cron skipped. Monthly auto-reminders run on the 5th of every month. Call with ?manual=true to force-trigger.'
      });
    }

    const workspacesSnap = await getDocs(collection(db, 'workspaces'));
    const results: any[] = [];
    const todayStr = today.toISOString().split('T')[0];

    for (const wsDoc of workspacesSnap.docs) {
      const workspaceId = wsDoc.id;
      const workspaceData = wsDoc.data();
      const customers = workspaceData.customers || [];
      const businessInfo = workspaceData.businessInfo || {};

      const dueCustomers = customers.filter((c: any) => c.due > 0);

      if (dueCustomers.length > 0) {
        // Send / Log reminders
        const logId = `cron_auto_reminder_${workspaceId}_${todayStr}`;
        const activityData = {
          id: logId,
          log_id: logId,
          timestamp: new Date(),
          userId: 'cron-job',
          user_name: 'Monthly Cron',
          userRole: 'owner',
          user_role: 'owner',
          actionType: 'monthly_auto_reminder',
          action_type: 'monthly_auto_reminder',
          description: `Server-side Cron: Dispatched auto-reminders to ${dueCustomers.length} due customers.`,
          metadata: { 
            count: dueCustomers.length, 
            customerNames: dueCustomers.map((c: any) => c.name) 
          },
          workspaceId: workspaceId,
          businessId: workspaceId,
          role: 'owner',
          action: `Server-side Cron: Dispatched auto-reminders to ${dueCustomers.length} due customers.`
        };

        // Write activity details directly to root activities collection
        await setDoc(doc(db, 'activities', logId), activityData);
        // Write specifically to workspace nested activity logs as well
        await setDoc(doc(db, 'workspaces', workspaceId, 'activity_logs', logId), activityData);

        results.push({ workspaceId, sentCount: dueCustomers.length });
      }
    }

    return NextResponse.json({
      success: true,
      executionDate: today.toISOString(),
      triggeredBy: isManual ? 'manual_override' : 'cron_scheduler',
      workspacesProcessed: results
    });
  } catch (error: any) {
    console.error('Monthly auto-reminder cron error:', error);
    return NextResponse.json({
      success: false,
      error: error.message || 'Internal Server Error'
    }, { status: 500 });
  }
}
