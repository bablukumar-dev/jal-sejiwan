import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/src/lib/firebase-admin';
import { countAndCheckLimit } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    // Get IP address for rate limit tracking
    const ip = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
    
    // Rate limit: 10 requests per 15 minutes for the cron endpoint
    const limitStatus = countAndCheckLimit(`api_reminders_cron_${ip}`, 10, 15 * 60 * 1000);
    if (limitStatus.limited) {
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        { status: 429 }
      );
    }

    // Cron security check
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      console.error('CRON_SECRET environment variable is not defined!');
      return NextResponse.json({ error: 'Unauthorized: Security configuration missing' }, { status: 401 });
    }

    const authHeader = req.headers.get('Authorization');
    const urlSecret = req.nextUrl.searchParams.get('secret');
    const token = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

    if (token !== cronSecret && urlSecret !== cronSecret) {
      return NextResponse.json({ error: 'Unauthorized: Invalid cron secret' }, { status: 401 });
    }

    const db = getAdminDb();
    
    const today = new Date();
    // Support testing and evaluation using a manual override parameter
    const isManual = req.nextUrl.searchParams.get('manual') === 'true';

    if (today.getDate() !== 5 && !isManual) {
      return NextResponse.json({
        success: true,
        message: 'Cron skipped. Monthly auto-reminders run on the 5th of every month. Call with ?manual=true to force-trigger.'
      });
    }

    const workspacesSnap = await db.collection('workspaces').get();
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
        await db.collection('activities').doc(logId).set(activityData);
        // Write specifically to workspace nested activity logs as well
        await db.collection('workspaces').doc(workspaceId).collection('activity_logs').doc(logId).set(activityData);

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
