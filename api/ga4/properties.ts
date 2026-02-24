
export default async function handler(req: any, res: any) {
  const { accessToken } = req.body;
  if (!accessToken) return res.status(401).json({ error: 'No token' });
  
  try {
    const response = await fetch('https://analyticsadmin.googleapis.com/v1beta/accountSummaries', {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    const data: any = await response.json();
    const properties: any[] = [];
    
    if (data.accountSummaries) {
      data.accountSummaries.forEach((acc: any) => {
        if (acc.propertySummaries) {
          acc.propertySummaries.forEach((prop: any) => {
            properties.push({
              propertyId: prop.property.split('/').pop(),
              propertyName: prop.displayName,
              accountId: acc.account.split('/').pop(),
              accountName: acc.displayName
            });
          });
        }
      });
    }
    return res.status(200).json({ properties });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
