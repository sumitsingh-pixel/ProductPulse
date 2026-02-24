
export default async function handler(req: any, res: any) {
  const { accessToken, propertyId, startDate, endDate, metrics } = req.body;
  if (!accessToken || !propertyId) return res.status(400).json({ error: 'Params missing' });
  
  try {
    const metricsArray = metrics.map((m: string) => ({ name: m }));
    const response = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dateRanges: [{ startDate: startDate || '30daysAgo', endDate: endDate || 'today' }],
        dimensions: [{ name: 'date' }],
        metrics: metricsArray
      })
    });
    
    const data: any = await response.json();
    const transformedData = data.rows?.map((row: any) => {
      const kpis: any = {};
      metrics.forEach((m: string, i: number) => { kpis[m] = parseFloat(row.metricValues[i].value); });
      return { kpi_date: row.dimensionValues[0].value, kpis };
    }) || [];
    
    return res.status(200).json({ data: transformedData });
  } catch (error: any) {
    return res.status(500).json({ error: error.message });
  }
}
