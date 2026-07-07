/**
 * Silently logs an action in the background.
 * It will not throw errors or disrupt the main app execution.
 */
export async function logActivity(
  actionType: string,
  description: string,
  metadata: any = null
): Promise<void> {
  // Auth system removed - logging disabled
  console.log("Auth System Removed: Activity logging disabled.");
}
