import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/src/supabaseAdmin';
import { auth, clerkClient } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { userId, password } = await req.json();

    // 1. Verify that the requester is an Owner using Clerk session
    const { userId: requesterId } = await auth();
    if (!requesterId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check role from Supabase users table
    const { data: requesterData, error: requesterError } = await supabaseAdmin
      .from('users')
      .select('role')
      .eq('id', requesterId)
      .single();

    if (requesterError || requesterData?.role !== 'owner') {
      return NextResponse.json({ error: 'Only owners can update users' }, { status: 403 });
    }

    // 2. Update the user in Clerk
    const client = await clerkClient();
    const updatedUser = await client.users.updateUser(
      userId,
      { password }
    );

    if (!updatedUser) {
      return NextResponse.json({ error: 'Failed to update user in Clerk' }, { status: 500 });
    }

    return NextResponse.json({ message: 'User updated successfully' });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: err.errors?.[0]?.message || err.message || 'Internal Server Error' }, { status: 500 });
  }
}
