import { clerkMiddleware } from "@clerk/nextjs/server";

const isDevPreview = process.env.APP_URL && !process.env.APP_URL.includes('jalsejiwan.in');
const publishableKey = isDevPreview ? 'pk_test_YnVyc3RpbmctcGVhY29jay05OC5jbGVyay5hY2NvdW50cy5kZXYk' : process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
const secretKey = isDevPreview ? 'sk_test_rjx1klsSGsj1NnLUxBs5X5kfX9U851PPShqpuut36J' : process.env.CLERK_SECRET_KEY;

export default clerkMiddleware({
  publishableKey,
  secretKey
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

