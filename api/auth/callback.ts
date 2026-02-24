export default async function handler(req, res) {
  const code = req.query.code;
  
  if (!code) {
    // Redirect back with error
    return res.redirect('/?error=no_code');
  }
  
  try {
    // Exchange code for tokens
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
      return res.redirect(`/?error=${encodeURIComponent(tokens.error)}`);
    }
    
    // Get user email
    let userEmail = '';
    try {
      const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { 'Authorization': `Bearer ${tokens.access_token}` }
      });
      const userInfo = await userInfoResponse.json();
      userEmail = userInfo.email;
    } catch (e) {
      console.log('Could not fetch user email');
    }
    
    // INSTEAD OF RETURNING JSON, RETURN HTML THAT STORES TOKENS AND REDIRECTS
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Authenticating...</title>
      </head>
      <body>
        <script>
          // Store tokens in sessionStorage
          sessionStorage.setItem('ga4_access_token', ${JSON.stringify(tokens.access_token)});
          ${tokens.refresh_token ? `sessionStorage.setItem('ga4_refresh_token', ${JSON.stringify(tokens.refresh_token)});` : ''}
          ${userEmail ? `sessionStorage.setItem('ga4_user_email', ${JSON.stringify(userEmail)});` : ''}
          
          // Redirect back to app
          window.location.href = '/?oauth_success=true';
        </script>
        <p>Authenticating... Please wait.</p>
      </body>
      </html>
    `;
    
    res.setHeader('Content-Type', 'text/html');
    return res.status(200).send(html);
    
  } catch (error) {
    console.error('Token exchange error:', error);
    return res.redirect(`/?error=${encodeURIComponent(error.message)}`);
  }
}
