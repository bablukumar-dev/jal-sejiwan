import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/src/supabaseAdmin';
import { currentUser, auth, clerkClient } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { email, password, name, role, business_id } = await req.json();

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
      return NextResponse.json({ error: 'Only owners can create users' }, { status: 403 });
    }

    // 2. Create the user in Clerk
    const client = await clerkClient();
    const newUser = await client.users.createUser({
      emailAddress: [email],
      password,
      firstName: name.split(' ')[0],
      lastName: name.split(' ').slice(1).join(' '),
      publicMetadata: {
        role,
        business_id
      }
    });

    if (!newUser) {
      return NextResponse.json({ error: 'Failed to create user in Clerk' }, { status: 500 });
    }

    // 3. Insert into the Supabase users table
    const { error: insertError } = await supabaseAdmin.from('users').insert({
      id: newUser.id,
      email,
      name,
      role,
      business_id
    });

    if (insertError) {
      // Cleanup Clerk user if Supabase insert fails
      await client.users.deleteUser(newUser.id);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'User created successfully', userId: newUser.id });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: err.errors?.[0]?.message || err.message || 'Internal Server Error' }, { status: 500 });
  }
}
