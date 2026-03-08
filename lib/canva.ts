import { createClient } from '@supabase/supabase-js';

export async function getValidCanvaToken(userId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, 
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: tokenData, error } = await supabase
    .from('canva_tokens')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error || !tokenData) {
    return null;
  }

  const now = new Date();
  const expiresAt = new Date(tokenData.expires_at);

  // If token is still valid (with 5 minute buffer)
  if (expiresAt.getTime() - now.getTime() > 5 * 60 * 1000) {
    return tokenData.access_token;
  }

  // Otherwise, refresh the token
  const clientId = process.env.NEXT_PUBLIC_CANVA_CLIENT_ID!;
  const clientSecret = process.env.CANVA_CLIENT_SECRET!;
  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const refreshResponse = await fetch('https://api.canva.com/rest/v1/oauth/token', {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: tokenData.refresh_token,
    }),
  });

  if (!refreshResponse.ok) {
    console.error('Canva Token Refresh Error:', await refreshResponse.json());
    return null;
  }

  const newTokens = await refreshResponse.json();
  const newExpiresAt = new Date(Date.now() + newTokens.expires_in * 1000).toISOString();

  await supabase.from('canva_tokens').update({
    access_token: newTokens.access_token,
    refresh_token: newTokens.refresh_token,
    expires_at: newExpiresAt,
    updated_at: new Date().toISOString()
  }).eq('user_id', userId);

  return newTokens.access_token;
}

export async function getCanvaProfile(accessToken: string) {
  const response = await fetch('https://api.canva.com/rest/v1/users/me', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });

  if (!response.ok) {
    return null;
  }

  return await response.json();
}
