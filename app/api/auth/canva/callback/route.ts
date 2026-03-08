import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) return NextResponse.redirect(new URL('/designer?error=' + error, request.url));

  const cookieStore = await cookies();
  const codeVerifier = cookieStore.get('canva_code_verifier')?.value;
  if (!codeVerifier) return NextResponse.redirect(new URL('/designer?error=missing_verifier', request.url));

  // Tukar code dengan token
  const clientId = process.env.NEXT_PUBLIC_CANVA_CLIENT_ID!;
  const clientSecret = process.env.CANVA_CLIENT_SECRET!;
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
  
  try {
    const tokenResponse = await fetch('https://api.canva.com/rest/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code!,
        code_verifier: codeVerifier,
        redirect_uri: process.env.CANVA_REDIRECT_URI || `${process.env.APP_URL}/api/auth/canva/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Canva Token Exchange Error:', errorData);
      return NextResponse.redirect(new URL('/designer?error=token_exchange_failed', request.url));
    }

    const tokens = await tokenResponse.json();

    // Hitung waktu kadaluarsa
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000).toISOString();

    // Inisialisasi Supabase (Gunakan Service Role untuk bypass RLS jika ini di server)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!, 
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Ambil user_id dari sesi aplikasi yang sedang aktif
    // Karena ini di server, kita perlu mengecek session dari cookies
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      request.headers.get('Authorization')?.split(' ')[1] || 
      cookieStore.get('sb-access-token')?.value || ''
    );

    // If we can't find the user via standard means, we might need a different approach 
    // for this specific environment. Let's try to get the user from the session.
    const { data: { session } } = await supabase.auth.getSession();
    const myAppUserId = user?.id || session?.user?.id;

    if (!myAppUserId) {
      console.error('User not authenticated during Canva callback');
      return NextResponse.redirect(new URL('/designer?error=not_authenticated', request.url));
    }

    // Simpan ke Supabase
    const { error: upsertError } = await supabase.from('canva_tokens').upsert({
      user_id: myAppUserId,
      canva_user_id: tokens.user_id || null,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: expiresAt,
      updated_at: new Date().toISOString()
    }, { onConflict: 'user_id' });

    if (upsertError) {
      console.error('Error saving Canva tokens to Supabase:', upsertError);
      return NextResponse.redirect(new URL('/designer?error=database_error', request.url));
    }

    // Hapus cookie verifier
    cookieStore.delete('canva_code_verifier');

    return NextResponse.redirect(new URL('/designer?canva_auth=success', request.url));
  } catch (err) {
    console.error('Unexpected error during Canva callback:', err);
    return NextResponse.redirect(new URL('/designer?error=unexpected_error', request.url));
  }
}
