import { NextRequest, NextResponse } from 'next/server';
import { countAndCheckLimit } from '@/lib/rateLimit';

export async function GET(req: NextRequest) {
  // Get IP address for rate limit tracking
  const ip = req.headers.get('x-forwarded-for') || (req as any).ip || '127.0.0.1';
  
  // Rate limit safe guard: 100 requests per 15 minutes
  const limitStatus = countAndCheckLimit(`api_maps_key_${ip}`, 100, 15 * 60 * 1000);
  
  if (limitStatus.limited) {
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { 
        status: 429,
        headers: {
          'X-RateLimit-Limit': '100',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': Math.ceil(limitStatus.resetTime / 1000).toString(),
        }
      }
    );
  }

  const apiKey = process.env.GOOGLE_MAPS_PLATFORM_KEY || process.env.NEXT_PUBLIC_GOOGLE_MAPS_PLATFORM_KEY || '';
  
  return NextResponse.json(
    { apiKey },
    {
      headers: {
        'X-RateLimit-Limit': '100',
        'X-RateLimit-Remaining': limitStatus.remaining.toString(),
        'X-RateLimit-Reset': Math.ceil(limitStatus.resetTime / 1000).toString(),
      }
    }
  );
}

