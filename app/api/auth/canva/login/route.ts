import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cookies } from 'next/headers';

export async function GET() {
  const codeVerifier = crypto.randomBytes(32).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');

  // Simpan verifier di HTTP-only cookie untuk dicocokkan saat callback
  const cookieStore = await cookies();
  cookieStore.set('canva_code_verifier', codeVerifier, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'none', // Needed for cross-origin iframe context
    maxAge: 60 * 10, // 10 menit
  });

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.NEXT_PUBLIC_CANVA_CLIENT_ID!,
    redirect_uri: process.env.CANVA_REDIRECT_URI || `${process.env.APP_URL}/api/auth/canva/callback`,
    scope: process.env.CANVA_SCOPES || 'design:content:read design:content:write asset:read profile:read',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return NextResponse.redirect(`https://www.canva.com/api/oauth/authorize?${params.toString()}`);
}
