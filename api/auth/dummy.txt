
export default async function handler(req, res) {
  const code = req.query.code;
  
  if (!code) {
    return res.status(400).json({ error: 'Authorization code missing from handshake' });
  }
  
  try {
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
    });
    
    const tokens = await tokenResponse.json();
    
    if (tokens.error) {
      return res.status(400).json({ error: tokens.error_description || tokens.error });
    }
    
    let userEmail = '';
    try {
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` }
      });
      const userInfo = await userInfoResponse.json();
      userEmail = userInfo.email;
    } catch (e) {
      console.error('Identity extraction failure:', e);
    }
    
    return res.status(200).json({
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_in: tokens.expires_in,
      user_email: userEmail
    });
    
  } catch (error) {
    console.error('Handshake exchange error:', error);
    return res.status(500).json({ error: 'Strategic authentication protocol failed' });
  }
}
