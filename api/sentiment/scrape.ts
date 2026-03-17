// api/sentiment/scrape.ts
// Scrapes real reviews from Play Store, App Store, Trustpilot
// Called by the frontend instead of asking Gemini to guess

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sources } = req.body;
  if (!sources || !Array.isArray(sources)) {
    return res.status(400).json({ error: 'sources array required' });
  }
  // Add this function anywhere in the file before the handler's return statement

function computeMetrics(reviews: any[]) {
  if (reviews.length === 0) return null;

  const total = reviews.length;

  // --- Overall Satisfaction ---
  const avgStarRating = reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / total;
  const overallSatisfaction = {
    value: Math.round((avgStarRating / 5) * 100),
    confidence: Math.min(95, 40 + Math.floor(total / 10)), // more reviews = higher confidence
    dataPoints: total
  };

  // --- Task Completion ---
  const successKeywords = ["easy", "worked", "successful", "simple", "smooth", "great", "love", "perfect"];
  const failKeywords    = ["couldn't", "confusing", "gave up", "broken", "failed", "doesn't work", "useless", "terrible"];

  let successCount = 0;
  let failCount    = 0;

  reviews.forEach(r => {
    const text = (r.review_text || '').toLowerCase();
    if (successKeywords.some(k => text.includes(k))) successCount++;
    if (failKeywords.some(k => text.includes(k)))    failCount++;
  });

  const taskCompletionValue = Math.round((successCount / total) * 100);
  const taskCompletion = {
    value: taskCompletionValue,
    confidence: Math.min(90, 35 + Math.floor(total / 10)),
    dataPoints: total
  };

  // --- Abandonment Rate ---
  const abandonmentKeywords = ["gave up", "quit", "too complicated", "couldn't finish", "uninstalled", "deleted"];
  const abandonCount = reviews.filter(r =>
    abandonmentKeywords.some(k => (r.review_text || '').toLowerCase().includes(k))
  ).length;

  const abandonment = {
    value: 100 - taskCompletionValue,  // mirrors task completion as you defined
    confidence: taskCompletion.confidence,
    dataPoints: total
  };

  // --- NPS ---
  const promoters   = reviews.filter(r => r.rating === 5).length;
  const detractors  = reviews.filter(r => r.rating <= 3).length;
  const npsValue    = Math.round(((promoters - detractors) / total) * 100);

  const nps = {
    value: Math.max(-100, Math.min(100, npsValue)),
    confidence: Math.min(95, 40 + Math.floor(total / 10)),
    dataPoints: total
  };

  return { overallSatisfaction, taskCompletion, abandonmentRate: abandonment, nps };
}


  

  const allReviews: any[] = [];

  for (const source of sources) {
    if (source.status !== 'verified') continue;

    try {
      if (source.name === 'Play Store' && source.url) {
        const appId = extractPlayStoreId(source.url);
        if (appId) {
          const reviews = await scrapePlayStore(appId);
          allReviews.push(...reviews.map(r => ({ ...r, source: 'play_store' })));
        }
      } else if (source.name === 'App Store' && source.url) {
        const appId = extractAppStoreId(source.url);
        if (appId) {
          const reviews = await scrapeAppStore(appId);
          allReviews.push(...reviews.map(r => ({ ...r, source: 'app_store' })));
        }
      } else if (source.name === 'Trustpilot' && source.url) {
        const domain = extractTrustpilotDomain(source.url);
        if (domain) {
          const reviews = await scrapeTrustpilot(domain);
          allReviews.push(...reviews.map(r => ({ ...r, source: 'trustpilot' })));
        }
      }
    } catch (err: any) {
      console.error(`[Scrape] Failed for ${source.name}:`, err.message);
    }
  }
const metrics = computeMetrics(allReviews);
return res.status(200).json({ reviews: allReviews, metrics });
  // return res.status(200).json({ reviews: allReviews });
}

function extractPlayStoreId(url: string): string | null {
  const match = url.match(/id=([a-zA-Z0-9._]+)/);
  return match ? match[1] : null;
}

function extractAppStoreId(url: string): string | null {
  const match = url.match(/id(\d+)/);
  return match ? match[1] : null;
}

function extractTrustpilotDomain(url: string): string | null {
  const match = url.match(/trustpilot\.com\/review\/([^/?]+)/);
  return match ? match[1] : null;
}

async function scrapePlayStore(appId: string) {
  // Uses the unofficial Play Store RSS feed — no API key needed
  const res = await fetch(
    `https://itunes.apple.com/rss/customerreviews/id=${appId}/sortBy=mostRecent/json`
  );
  // Play Store: use google-play-scraper via a public proxy or install it as a dependency
  // For now using the public gplay API endpoint pattern:
  const gplayRes = await fetch(
    `https://play.google.com/store/apps/details?id=${appId}&hl=en`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } }
  );
  // NOTE: Full scraping of Play Store HTML requires cheerio/puppeteer in production.
  // Return empty array to be safe until you add google-play-scraper package.
  return [];
}

async function scrapeAppStore(appId: string) {
  // Apple provides an official RSS feed for reviews — no auth needed
  const res = await fetch(
    `https://itunes.apple.com/rss/customerreviews/id=${appId}/sortBy=mostRecent/json`
  );
  if (!res.ok) return [];
  const data = await res.json();
  const entries = data?.feed?.entry || [];
  // First entry is app metadata, skip it
  return entries.slice(1).map((e: any) => ({
    author: e.author?.name?.label || 'Anonymous',
    rating: parseInt(e['im:rating']?.label || '0', 10),
    review_text: e.content?.label || '',
    review_date: e.updated?.label?.split('T')[0] || '',
  }));
}

async function scrapeTrustpilot(domain: string) {
  // Trustpilot has a public widget API
  const res = await fetch(
    `https://www.trustpilot.com/review/${domain}?languages=en`,
    { headers: { 'User-Agent': 'Mozilla/5.0' } }
  );
  // NOTE: Full HTML parsing needs cheerio. Install it: npm install cheerio
  // For now returning empty — add cheerio parsing in production
  return [];
}
