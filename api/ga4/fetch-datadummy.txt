
export default async function handler(req, res) {
  const { accessToken, propertyId, startDate, endDate, metrics } = req.body;
  
  if (!accessToken || !propertyId || !metrics) {
    return res.status(400).json({ error: 'Missing strategic parameters for data extraction' });
  }
  
  try {
    const metricsArray = metrics.map(m => ({ name: m }));
    
    const response = await fetch(
      `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          dateRanges: [{
            startDate: startDate || '30daysAgo',
            endDate: endDate || 'today'
          }],
          dimensions: [{ name: 'date' }],
          metrics: metricsArray
        })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Cloud Data Engine failure');
    }
    
    const data = await response.json();
    
    const transformedData = data.rows?.map(row => {
      const date = row.dimensionValues[0].value;
      const kpis = {};
      
      metrics.forEach((metric, index) => {
        const value = parseFloat(row.metricValues[index].value);
        kpis[metric] = isNaN(value) ? 0 : value;
      });
      
      return {
        kpi_date: date,
        kpis: kpis
      };
    }) || [];
    
    // Sort by date ascending
    transformedData.sort((a, b) => a.kpi_date.localeCompare(b.kpi_date));
    
    return res.status(200).json({ data: transformedData });
    
  } catch (error) {
    console.error('Telemetry extraction error:', error);
    return res.status(500).json({ error: error.message });
  }
}
