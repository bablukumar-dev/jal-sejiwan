import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/src/supabaseAdmin';
import { clerkClient } from '@clerk/nextjs';

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { email, password, name, role, business_id } = await req.json();

    // 1. Create user in Clerk
    const clerkUser = await clerkClient.users.createUser({
      emailAddress: [email],
      password: password,
      firstName: name,
    });

    const newUserId = clerkUser.id;

    // 2. Insert into the Supabase users table
    const { error: insertError } = await supabaseAdmin.from('users').insert({
      id: newUserId,
      email,
      name,
      role,
      business_id
    });

    if (insertError) {
      try {
        await clerkClient.users.deleteUser(newUserId);
      } catch (delErr) {
        console.error('Error rolling back Clerk user creation:', delErr);
      }
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'User created successfully', userId: newUserId });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
