import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/src/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { userId, password } = await req.json();
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) throw new Error("Supabase Admin client not configured");
    
    // Update password in Supabase Auth
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: password,
    });

    if (updateError) throw updateError;

    return NextResponse.json({ message: 'User updated successfully' });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal Server Error' }, { status: 500 });
  }
}
