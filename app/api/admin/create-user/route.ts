import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/src/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { email, password, name, role, business_id } = await req.json();

    // 1. Create user in Supabase Auth
    const { data: userData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true,
      user_metadata: { name: name }
    });
    
    if (signUpError) throw signUpError;
    const newUserId = userData.user.id;

    // 2. Insert into the Supabase users table
    const { error: insertError } = await supabaseAdmin.from('users').insert({
      id: newUserId,
      email,
      name,
      role,
      business_id
    });

    if (insertError) {
      // Rollback: delete user
      await supabaseAdmin.auth.admin.deleteUser(newUserId);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json({ message: 'User created successfully', userId: newUserId });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
