// api/sentiment/scrape.ts

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sources } = req.body;
  if (!sources || !Array.isArray(sources)) {
    return res.status(400).json({ error: 'sources array required' });
  }

  const allReviews: any[] = [];

  for (const source of sources) {
    if (source.status !== 'verified') continue;

    try {
      if (source.name === 'Play Store' && source.url) {
        const appId = extractPlayStoreId(source.url);
        if (appId) {
          const reviews = await scrapePlayStore(appId);
          allReviews.push(...reviews.map((r: any) => ({ ...r, source: 'play_store' })));
        }
      } else if (source.name === 'App Store' && source.url) {
        const appId = extractAppStoreId(source.url);
        if (appId) {
          const reviews = await scrapeAppStore(appId);
          allReviews.push(...reviews.map((r: any) => ({ ...r, source: 'app_store' })));
        }
      } else if (source.name === 'Trustpilot' && source.url) {
        const domain = extractTrustpilotDomain(source.url);
        if (domain) {
          const reviews = await scrapeTrustpilot(domain);
          allReviews.push(...reviews.map((r: any) => ({ ...r, source: 'trustpilot' })));
        }
      }
    } catch (err: any) {
      console.error(`[Scrape] Failed for ${source.name}:`, err.message);
    }
  }

  const metrics = computeMetrics(allReviews);
  return res.status(200).json({ reviews: allReviews, metrics });
}

// --- ID Extractors ---

function extractPlayStoreId(url: string): string | null {
  const match = url.match(/id=([a-zA-Z0-9._]+)/);
  return match ? match[1] : null;
}

function extractAppStoreId(url: string): string | null {
  const match = url.match(/\/id(\d+)/);  // fixed: was /id(\d+)/ which matched wrong
  return match ? match[1] : null;
}

function extractTrustpilotDomain(url: string): string | null {
  const match = url.match(/trustpilot\.com\/review\/([^/?]+)/);
  return match ? match[1] : null;
}

// --- Scrapers ---

async function scrapePlayStore(appId: string) {
  try {
    const gplay = await import('google-play-scraper');
    const result = await gplay.default.reviews({ appId, num: 100, lang: 'en', country: 'us' });
    return result.data.map((r: any) => ({
      author: r.userName,
      rating: r.score,
      review_text: r.text,
      review_date: r.date?.toISOString().split('T')[0] || '',
    }));
  } catch (err) {
    console.warn('[Scrape] google-play-scraper not available or failed:', err);
    return [];
  }
}

async function scrapeAppStore(appId: string) {
  const res = await fetch(
    `https://itunes.apple.com/rss/customerreviews/id=${appId}/sortBy=mostRecent/json`
  );
  if (!res.ok) return [];
  const data = await res.json();
  const entries = data?.feed?.entry || [];
  return entries.slice(1).map((e: any) => ({
    author: e.author?.name?.label || 'Anonymous',
    rating: parseInt(e['im:rating']?.label || '0', 10),
    review_text: e.content?.label || '',
    review_date: e.updated?.label?.split('T')[0] || '',
  }));
}

async function scrapeTrustpilot(domain: string) {
  try {
    const res = await fetch(
      `https://www.trustpilot.com/api/categoriespages/bydomainname/${domain}`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const bizId = data?.businessUnit?.id;
    if (!bizId) return [];
    const reviewRes = await fetch(
      `https://www.trustpilot.com/api/public/v1/reviews?businessUnitId=${bizId}&perPage=100`,
      { headers: { 'User-Agent': 'Mozilla/5.0' } }
    );
    if (!reviewRes.ok) return [];
    const reviewData = await reviewRes.json();
    return (reviewData?.reviews || []).map((r: any) => ({
      author: r.consumer?.displayName || 'Anonymous',
      rating: r.stars,
      review_text: r.text || '',
      review_date: r.createdAt?.split('T')[0] || '',
    }));
  } catch (err) {
    console.warn('[Scrape] Trustpilot scrape failed:', err);
    return [];
  }
}

// --- Metric Computation ---

function computeMetrics(reviews: any[]) {
  if (reviews.length === 0) return null;

  const total = reviews.length;

  const avgStarRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / total;
  const overallSatisfaction = {
    value: Math.round((avgStarRating / 5) * 100),
    confidence: Math.min(95, 40 + Math.floor(total / 10)),
    dataPoints: total
  };

  const successKeywords = ["easy", "worked", "successful", "simple", "smooth", "great", "love", "perfect"];
  const failKeywords = ["couldn't", "confusing", "gave up", "broken", "failed", "doesn't work", "useless", "terrible"];

  let successCount = 0;
  reviews.forEach(r => {
    const text = (r.review_text || '').toLowerCase();
    if (successKeywords.some(k => text.includes(k))) successCount++;
  });

  const taskCompletionValue = Math.round((successCount / total) * 100);
  const taskCompletion = {
    value: taskCompletionValue,
    confidence: Math.min(90, 35 + Math.floor(total / 10)),
    dataPoints: total
  };

  const abandonment = {
    value: 100 - taskCompletionValue,
    confidence: taskCompletion.confidence,
    dataPoints: total
  };

  const promoters = reviews.filter(r => r.rating === 5).length;
  const detractors = reviews.filter(r => r.rating <= 3).length;
  const npsValue = Math.round(((promoters - detractors) / total) * 100);

  const nps = {
    value: Math.max(-100, Math.min(100, npsValue)),
    confidence: Math.min(95, 40 + Math.floor(total / 10)),
    dataPoints: total
  };

  return { overallSatisfaction, taskCompletion, abandonmentRate: abandonment, nps };
}
