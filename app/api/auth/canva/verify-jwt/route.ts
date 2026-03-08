import { NextResponse } from 'next/server';
import { createRemoteJWKSet, jwtVerify } from 'jose';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const jwt = searchParams.get('correlation_jwt');
  const clientId = process.env.NEXT_PUBLIC_CANVA_CLIENT_ID;

  if (!jwt || !clientId) {
    return NextResponse.json({ error: 'Missing JWT or Client ID' }, { status: 400 });
  }

  try {
    // 1. Fetch Canva's public keys (JWKS)
    const JWKS = createRemoteJWKSet(new URL(`https://api.canva.com/rest/v1/apps/${clientId}/jwks`));

    // 2. Verify the JWT
    const { payload } = await jwtVerify(jwt, JWKS, {
      issuer: 'canva',
      audience: clientId,
    });

    // 3. If valid, return success and payload
    return NextResponse.json({ success: true, payload });
  } catch (err) {
    console.error('Canva JWT Verification Error:', err);
    return NextResponse.json({ error: 'Invalid JWT' }, { status: 401 });
  }
}
