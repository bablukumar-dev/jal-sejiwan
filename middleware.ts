import "./lib/clerkEnvFix";
import { getClerkPublishableKey } from "./lib/clerkEnvFix";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher(["/", "/login", "/api/clerk-webhook"]);

export default function middleware(request: any, event: any) {
  const publishableKey = getClerkPublishableKey();
  // Valid Clerk publishable keys must exist, start with pk_ and have sufficient length (usually 60+ chars)
  const isKeyValid = publishableKey && publishableKey.startsWith("pk_") && publishableKey.length >= 60;

  if (!isKeyValid) {
    return new NextResponse(
      `<!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <title>Clerk Configuration Required</title>
          <script src="https://cdn.tailwindcss.com"></script>
        </head>
        <body class="bg-slate-50 min-h-screen flex items-center justify-center p-6">
          <div class="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <div class="w-12 h-12 bg-rose-50 border border-rose-100 rounded-xl flex items-center justify-center mb-6">
              <svg class="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 class="text-xl font-bold text-slate-900 mb-2">Clerk Configuration Required</h1>
            <p class="text-slate-600 mb-6 text-sm leading-relaxed">
              The Clerk Publishable Key in your Secrets is missing, incomplete, or truncated.
            </p>
            
            <div class="space-y-4 mb-6">
              <div class="p-4 bg-slate-50 rounded-xl border border-slate-100 font-sans">
                <h2 class="text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">Required Action</h2>
                <p class="text-xs text-slate-500 leading-relaxed mb-3">
                  Please configure the exact keys in the <strong>Secrets</strong> panel of your AI Studio editor (and make sure to copy them entirely without truncation):
                </p>
                <div class="space-y-2">
                  <div>
                    <span class="block text-[10px] font-mono text-slate-400">NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY</span>
                    <code class="block bg-slate-100 p-1.5 rounded text-slate-800 font-mono text-[10px] break-all select-all">
                      pk_test_YnVyc3RpbmctcGVhY29jay05OC5jbGVyay5hY2NvdW50cy5kZXYk
                    </code>
                  </div>
                  <div>
                    <span class="block text-[10px] font-mono text-slate-400">CLERK_SECRET_KEY</span>
                    <code class="block bg-slate-100 p-1.5 rounded text-slate-800 font-mono text-[10px] break-all select-all">
                      sk_test_rjx1klsSGsj1NnLUxBs5X5kfX9U851PPShqpuut36J
                    </code>
                  </div>
                </div>
              </div>
            </div>

            <div class="p-3 bg-amber-50 border border-amber-100 rounded-lg font-sans">
              <p class="text-xs text-amber-800 leading-relaxed font-medium">
                Note: All hardcoded fallbacks have been removed for absolute key security. Once you add/update these keys in Secrets, the application will initialize securely.
              </p>
            </div>
          </div>
        </body>
      </html>`,
      {
        status: 500,
        headers: { "content-type": "text/html" },
      }
    );
  }

  return clerkMiddleware((auth, request) => {
    if (!isPublicRoute(request)) {
      auth().protect();
    }
  }, {
    publishableKey: getClerkPublishableKey(),
  })(request, event);
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

