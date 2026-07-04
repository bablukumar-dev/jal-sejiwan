import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const { userId, password } = await req.json();
    
    // Update password in Clerk
    await clerkClient.users.updateUser(userId, {
      password: password,
    });

    return NextResponse.json({ message: 'User updated successfully' });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
