
export default async function handler(req, res) {
  const { accessToken } = req.body;
  
  if (!accessToken) {
    return res.status(401).json({ error: 'Unauthorized: Security token missing' });
  }
  
  try {
    const response = await fetch(
      'https://analyticsadmin.googleapis.com/v1beta/accountSummaries',
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloud API error: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    const properties = [];
    
    if (data.accountSummaries) {
      for (const account of data.accountSummaries) {
        if (account.propertySummaries) {
          for (const property of account.propertySummaries) {
            properties.push({
              propertyId: property.property.split('/').pop(),
              propertyName: property.displayName,
              accountId: account.account.split('/').pop(),
              accountName: account.displayName
            });
          }
        }
      }
    }
    
    return res.status(200).json({ properties });
    
  } catch (error) {
    console.error('Inventory fetch error:', error);
    return res.status(500).json({ error: error.message });
  }
}
