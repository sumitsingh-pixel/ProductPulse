
export default async function handler(req, res) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const redirectUri = process.env.GOOGLE_REDIRECT_URI;
  const scope = 'https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/userinfo.email';
  
  if (!clientId || !redirectUri) {
    return res.status(500).json({ error: 'OAuth credentials not configured on strategic cluster' });
  }
  
  const authUrl = 
    `https://accounts.google.com/o/oauth2/v2/auth?` +
    `client_id=${encodeURIComponent(clientId)}&` +
    `redirect_uri=${encodeURIComponent(redirectUri)}&` +
    `response_type=code&` +
    `scope=${encodeURIComponent(scope)}&` +
    `access_type=offline&` +
    `prompt=consent`;
  
  return res.redirect(302, authUrl);
}
