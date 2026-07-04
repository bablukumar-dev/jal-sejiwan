
import '@/lib/clerkEnvFix';

export const debugClerkConfig = () => {
  if (typeof window === 'undefined') return;

  const config = {
    "Clerk Publishable Key": process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ? "✅ Present" : "❌ Missing",
    "Sign In URL": process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || "Not set",
    "Sign Up URL": process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || "Not set",
    "After Sign In Redirect": process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL || "Not set",
    "After Sign Up Redirect": process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL || "Not set",
    "Current Origin": window.location.origin,
  };

  console.group("🔐 Auth Configuration Diagnostic");
  console.table(config);
  
  // Verification for social strategies mentioned in requirements
  const strategies = ["oauth_google", "oauth_facebook", "oauth_apple"];
  console.log("Targeted OAuth Strategies:", strategies.join(", "));
  
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    console.error("CRITICAL: NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY is missing from environment variables.");
  }
  
  if (process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL !== "/owner/dashboard") {
    console.warn("ADVISORY: NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL should be set to /owner/dashboard for proper role-based redirection logic.");
  }

  console.groupEnd();
};
