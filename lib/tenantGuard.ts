import { logActivity } from './activityLogger';

export function assertTenantIsolation(requestBusinessId: string | null | undefined, currentUserBusinessId: string | null | undefined, action: string) {
  if (!requestBusinessId || !currentUserBusinessId) {
    logActivity('security_alert', `Missing businessId during ${action}`, { requestBusinessId, currentUserBusinessId });
    throw new Error('Tenant integrity violation: Missing businessId');
  }

  if (requestBusinessId !== currentUserBusinessId) {
    logActivity('security_breach_attempt', `Cross-tenant access blocked during ${action}`, {
      targetTenant: requestBusinessId,
      actorTenant: currentUserBusinessId
    });
    throw new Error('Tenant Isolation Guard: Unauthorized cross-tenant access blocked');
  }
}
