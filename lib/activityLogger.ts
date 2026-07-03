import { supabase } from '@/src/supabaseClient';

export interface ActivityLog {
  id: string; // Standarized ID
  log_id: string;
  timestamp: any;
  userId: string; // Standardized performer ID
  user_id: string;
  user_name: string;
  userRole: string; // Standardized role
  user_role: string;
  managed_by: string | null;
  actionType: string; // Standardized action type
  action_type: string;
  description: string;
  metadata: any | null;
  workspaceId: string;
  businessId: string; // Standardized business/tenant ID
  role?: string;
  action?: string;
}

/**
 * Silently logs an action in the background.
 * It will not throw errors or disrupt the main app execution.
 */
export async function logActivity(
  actionType: string,
  description: string,
  metadata: any = null
): Promise<void> {
  // Run asynchronously in background
  setTimeout(async () => {
    try {
      if (typeof window === 'undefined') return;

      const workspaceId = localStorage.getItem('businessId') || localStorage.getItem('ownerId');
      if (!workspaceId) {
        console.warn('Activity Logging: No active workspace found in localStorage.');
        return;
      }

      const userRoleRaw = localStorage.getItem('userRole') || 'owner';
      // Map roles neatly: owner, manager, staff
      let userRole: 'owner' | 'manager' | 'staff' = 'owner';
      if (userRoleRaw.toLowerCase() === 'manager') {
        userRole = 'manager';
      } else if (userRoleRaw.toLowerCase() === 'staff' || userRoleRaw.toLowerCase().includes('partner')) {
        userRole = 'staff';
      }

      let userId = 'owner';
      let userName = 'Owner';

      if (userRole !== 'owner') {
        userId = localStorage.getItem('staffUserId') || 'unknown';
        userName = localStorage.getItem('staffUserName') || 'Staff Member';
      }

      // Determine managed_by if performer is staff, or if they have a manager creator
      let managedBy: string | null = null;
      if (userRole === 'staff' && userId !== 'unknown') {
        try {
          const staffCached = localStorage.getItem('staff');
          if (staffCached) {
            const staffList = JSON.parse(staffCached);
            const currentStaff = staffList.find((s: any) => String(s.id) === String(userId));
            if (currentStaff && currentStaff.createdBy && currentStaff.createdBy !== 'owner') {
              managedBy = String(currentStaff.createdBy);
            }
          }
        } catch (e) {
          console.error('Failed to parse cached staff list in activity logger:', e);
        }
      }

      const activityData = {
        log_id: Date.now().toString() + Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString(),
        userId: userId,
        user_id: userId,
        user_name: userName,
        userRole: userRole,
        user_role: userRole,
        managed_by: managedBy,
        actionType: actionType,
        action_type: actionType,
        description: description,
        metadata: metadata,
        workspaceId: workspaceId,
        businessId: workspaceId,
        role: userRole,
        action: description,
      };

      await supabase.from('activities').insert(activityData);

      console.log(`Activity logged successfully in workspace ${workspaceId}: ${actionType}`);
    } catch (error) {
      // Ensure we fail silently so user flows are never blocked
      console.error('Silent activity logging failed:', error);
    }
  }, 0);
}
