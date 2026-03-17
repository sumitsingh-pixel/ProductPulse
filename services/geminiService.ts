
import { GoogleGenAI, Type } from "@google/genai";
import { KPIDictionary, KPIFact, KPIThreshold, ProjectContext, LighthouseReport, EpicStory, ChartConfig, SentimentAudit, ReviewSource } from "../types";

const getAIClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey || apiKey === 'undefined') throw new Error("API_KEY_MISSING");
  return new GoogleGenAI({ apiKey });
};

const safeParse = (text: string | undefined, context: string) => {
  if (!text) return null;
  try {
    const cleanJson = text.trim().replace(/^```json\n?/, '').replace(/\n?```$/, '');
    return JSON.parse(cleanJson);
  } catch (e) {
    console.error(`[AI Service] JSON Parsing Failed for ${context}`, text);
    return null;
  }
};

// export const detectReviewSources = async (url: string): Promise<ReviewSource[]> => {
//   try {
//     const ai = getAIClient();
//     const prompt = `Act as a web scraper assistant. For the URL "${url}", predict/detect the most likely review platform URLs (Google Business, App Store, Play Store, Trustpilot). 
//     Base this on standard patterns for this brand/URL.
    
//     Return JSON array of ReviewSource objects:
//     {
//       "id": string (unique slug),
//       "name": string (e.g. "App Store"),
//       "url": string (likely or real URL),
//       "count": number (estimated review count),
//       "detected": boolean (true if highly likely to exist)
//     }`;

//     const response = await ai.models.generateContent({
//       model: 'gemini-3-flash-preview',
//       contents: prompt,
//       config: { responseMimeType: "application/json" }
//     });

//     const result = safeParse(response.text, "Source Detection");
//     return result?.map((s: any) => ({ ...s, status: s.detected ? 'verified' : 'unverified' })) || [];
//   } catch (err) {
//     console.error(err);
//     return [];
//   }
// };

export const detectReviewSources = async (url: string): Promise<ReviewSource[]> => {
  // Extract domain to build likely review source URLs
  let domain = '';
  try { domain = new URL(url).hostname.replace('www.', ''); } catch { domain = url; }

  const appName = domain.split('.')[0]; // e.g. "myapp" from "myapp.com"

  // Return structured guesses — user confirms/edits these in the UI before audit runs
  const sources: ReviewSource[] = [
    {
      id: 'play_store',
      name: 'Play Store',
      url: `https://play.google.com/store/apps/details?id=com.${appName}`,
      count: 0,
      detected: false,
      status: 'unverified'
    },
    {
      id: 'app_store',
      name: 'App Store',
      url: `https://apps.apple.com/app/${appName}`,
      count: 0,
      detected: false,
      status: 'unverified'
    },
    {
      id: 'trustpilot',
      name: 'Trustpilot',
      url: `https://www.trustpilot.com/review/${domain}`,
      count: 0,
      detected: false,
      status: 'unverified'
    },
    {
      id: 'google_business',
      name: 'Google Business',
      url: `https://www.google.com/search?q=${domain}+reviews`,
      count: 0,
      detected: false,
      status: 'unverified'
    }
  ];

  return sources;
};

// export const performSentimentAudit = async (url: string, sources: ReviewSource[], rawData?: string): Promise<SentimentAudit> => {
//   try {
//     const ai = getAIClient();
//     const prompt = `Perform a comprehensive Sentiment Analysis and UX Audit for the URL: "${url}".
    
//     SOURCES TO ANALYZE: ${JSON.stringify(sources)}
//     ${rawData ? `USER PROVIDED ADDITIONAL DATA: ${rawData}` : ''}

//     REQUIRED JSON STRUCTURE:
//     {
//       "url": string,
//       "timestamp": string,
//       "sources": Array<ReviewSource>,
//       "metrics": {
//         "overallSatisfaction": { "value": 0-100, "confidence": 0-100, "dataPoints": number },
//         "taskCompletion": { "value": 0-100, "confidence": 0-100, "dataPoints": number },
//         "abandonmentRate": { "value": 0-100, "confidence": 0-100, "dataPoints": number },
//         "nps": { "value": -100 to 100, "confidence": 0-100, "dataPoints": number }
//       },
//       "summary": { "overview": string, "keyFindings": string, "overallImpression": string },
//       "visuals": {
//         "desktopVsMobile": { "metrics": ["Navigation", "Readability", "Speed", "Accessibility"], "desktop": [number, number, number, number], "mobile": [number, number, number, number] },
//         "issuePriority": [ { "category": string, "value": number, "severity": "critical"|"high"|"medium" } ],
//         "sentimentTrend": [ { "date": string, "score": number } ]
//       },
//       "usabilityParadox": string,
//       "wcagIssues": [ { "standard": string, "description": string } ],
//       "iaIssues": [string],
//       "digitalEquityImpact": string,
//       "recommendations": [ { "id": number, "title": string, "impact": "High"|"Medium"|"Low", "description": string, "timeline": string, "outcome": string } ],
//       "verificationData": [ { "source": string, "rating": number, "date": string, "review": string, "aiInterpretation": string, "sentiment": "positive"|"negative"|"neutral" } ],
//       "quotes": { "positive": [{ "text": string, "source": string }], "negative": [{ "text": string, "source": string }] }
//     }

//     GENERATE ACCURATE DATA BASED ON REAL-WORLD FEEDBACK FOR THIS URL. 
//     Ensure "verificationData" has at least 10 sample reviews for the user to check accuracy.`;

//     const response = await ai.models.generateContent({
//       model: 'gemini-3-flash-preview',
//       contents: prompt,
//       config: { 
//         responseMimeType: "application/json",
//         thinkingConfig: { thinkingBudget: 5000 }
//       }
//     });

//     return safeParse(response.text, "Sentiment Audit") || null;
//   } catch (err) {
//     console.error(err);
//     throw err;
//   }
// };
// export const performSentimentAudit = async (url: string, sources: ReviewSource[]): Promise<SentimentAudit> => {
//   // Step 1: Fetch real reviews from our Vercel scrape endpoint
//   let realReviews: any[] = [];
//   try {
//     const scrapeRes = await fetch('/api/sentiment/scrape', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ sources })
//     });
//     if (scrapeRes.ok) {
//       // const scrapeData = await scrapeRes.json();
//       // realReviews = scrapeData.reviews || [];
//       const scrapeData = await scrapeRes.json();
// realReviews = scrapeData.reviews || [];
// const computedMetrics = scrapeData.metrics || null; 
//     }
//   } catch (err) {
//     console.warn('[Sentiment] Scrape step failed, proceeding with empty reviews:', err);
//   }

//   const hasRealData = realReviews.length > 0;

//   // Step 2: Build Gemini prompt with real review text as context
//   const ai = getAIClient();

//   const reviewContext = hasRealData
//     ? `REAL SCRAPED REVIEWS (${realReviews.length} reviews):\n${JSON.stringify(realReviews.slice(0, 80))}`
//     : `NO REAL REVIEWS COULD BE SCRAPED. The user has verified the following sources exist: ${JSON.stringify(sources)}. 
//        Clearly state in your summary that this analysis is based on limited data and the confidence scores should be low (below 40).`;

//   const prompt = `Perform a Sentiment Analysis and UX Audit for: "${url}".

// ${reviewContext}
// const metricsContext = computedMetrics
//   ? `\nPRE-COMPUTED METRICS (use these exact values, do not recalculate):\n${JSON.stringify(computedMetrics)}`
//   : '';
//   ${metricsContext}

// INSTRUCTIONS:
// - Base ALL metrics and scores ONLY on the real review data provided above.
// - If no real reviews were provided, set all confidence scores below 40 and clearly note limited data.
// - Do NOT invent review text. The "verificationData" array must ONLY contain reviews from the REAL SCRAPED REVIEWS list above.
// - Calculate overallSatisfaction from average star ratings in the real data.
// - Calculate NPS from the distribution of 1-2 star (detractors), 3 star (passives), 4-5 star (promoters).
// - Identify real themes from actual review text.

// REQUIRED JSON STRUCTURE:
// {
//   "url": string,
//   "timestamp": string (ISO),
//   "sources": ${JSON.stringify(sources)},
//   "metrics": {
//     "overallSatisfaction": { "value": number 0-100, "confidence": number 0-100, "dataPoints": number },
//     "taskCompletion": { "value": number 0-100, "confidence": number 0-100, "dataPoints": number },
//     "abandonmentRate": { "value": number 0-100, "confidence": number 0-100, "dataPoints": number },
//     "nps": { "value": number -100 to 100, "confidence": number 0-100, "dataPoints": number }
//   },
//   "summary": { "overview": string, "keyFindings": string, "overallImpression": string },
//   "visuals": {
//     "desktopVsMobile": { "metrics": ["Navigation","Readability","Speed","Accessibility"], "desktop": [n,n,n,n], "mobile": [n,n,n,n] },
//     "issuePriority": [ { "category": string, "value": number, "severity": "critical"|"high"|"medium" } ],
//     "sentimentTrend": [ { "date": string, "score": number } ]
//   },
//   "usabilityParadox": string,
//   "wcagIssues": [ { "standard": string, "description": string } ],
//   "iaIssues": [string],
//   "digitalEquityImpact": string,
//   "recommendations": [ { "id": number, "title": string, "impact": "High"|"Medium"|"Low", "description": string, "timeline": string, "outcome": string } ],
//   "verificationData": [ { "source": string, "rating": number, "date": string, "review": string, "aiInterpretation": string, "sentiment": "positive"|"negative"|"neutral" } ],
//   "quotes": { "positive": [{ "text": string, "source": string }], "negative": [{ "text": string, "source": string }] }
// }`;

//   const response = await ai.models.generateContent({
//     model: 'gemini-2.5-flash-preview-04-17',
//     contents: prompt,
//     config: {
//       responseMimeType: "application/json",
//       thinkingConfig: { thinkingBudget: 5000 }
//     }
//   });

//   return safeParse(response.text, "Sentiment Audit") || null;
// };

// export const performSentimentAudit = async (url: string, sources: ReviewSource[]): Promise<SentimentAudit> => {
//   // Step 1: Fetch real reviews from our Vercel scrape endpoint
//   let realReviews: any[] = [];
export const performSentimentAudit = async (url: string, sources: ReviewSource[]): Promise<SentimentAudit> => {
  try {
  // Step 1: Fetch real reviews...
  let realReviews: any[] = [];
  let computedMetrics: any = null;

  try {
    const scrapeRes = await fetch('/api/sentiment/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sources })
    });
    if (scrapeRes.ok) {
      const scrapeData = await scrapeRes.json();
      realReviews = scrapeData.reviews || [];
      computedMetrics = scrapeData.metrics || null;
    }
  } catch (err) {
    console.warn('[Sentiment] Scrape step failed, proceeding with empty reviews:', err);
  }

  const hasRealData = realReviews.length > 0;

  // Step 2: Build Gemini prompt with real review text as context
  const ai = getAIClient();

  const reviewContext = hasRealData
    ? `REAL SCRAPED REVIEWS (${realReviews.length} reviews):\n${JSON.stringify(realReviews.slice(0, 80))}`
    : `NO REAL REVIEWS COULD BE SCRAPED. The user has verified the following sources exist: ${JSON.stringify(sources)}. 
       Clearly state in your summary that this analysis is based on limited data and the confidence scores should be low (below 40).`;

  const metricsContext = computedMetrics
    ? `\nPRE-COMPUTED METRICS (use these exact values, do not recalculate):\n${JSON.stringify(computedMetrics)}`
    : '';

 const prompt = `Perform a Sentiment Analysis and UX Audit for: "${url}".

${reviewContext}
${metricsContext}

INSTRUCTIONS:
- Base ALL metrics and scores ONLY on the real review data provided above.
- If no real reviews were provided, set all confidence scores below 40 and clearly note limited data.
- Do NOT invent review text. The "verificationData" array must ONLY contain reviews from the REAL SCRAPED REVIEWS list above.
- Calculate overallSatisfaction from average star ratings in the real data.
- Calculate NPS from the distribution of 1-2 star (detractors), 3 star (passives), 4-5 star (promoters).
- Identify real themes from actual review text.

REQUIRED JSON STRUCTURE:
{
  "url": string,
  "timestamp": string (ISO),
  "sources": ${JSON.stringify(sources)},
  "metrics": {
    "overallSatisfaction": { "value": number 0-100, "confidence": number 0-100, "dataPoints": number },
    "taskCompletion": { "value": number 0-100, "confidence": number 0-100, "dataPoints": number },
    "abandonmentRate": { "value": number 0-100, "confidence": number 0-100, "dataPoints": number },
    "nps": { "value": number -100 to 100, "confidence": number 0-100, "dataPoints": number }
  },
  "summary": { "overview": string, "keyFindings": string, "overallImpression": string },
  "visuals": {
    "desktopVsMobile": { "metrics": ["Navigation","Readability","Speed","Accessibility"], "desktop": [n,n,n,n], "mobile": [n,n,n,n] },
    "issuePriority": [ { "category": string, "value": number, "severity": "critical"|"high"|"medium" } ],
    "sentimentTrend": [ { "date": string, "score": number } ]
  },
  "usabilityParadox": string,
  "wcagIssues": [ { "standard": string, "description": string } ],
  "iaIssues": [string],
  "digitalEquityImpact": string,
  "recommendations": [ { "id": number, "title": string, "impact": "High"|"Medium"|"Low", "description": string, "timeline": string, "outcome": string } ],
  "verificationData": [ { "source": string, "rating": number, "date": string, "review": string, "aiInterpretation": string, "sentiment": "positive"|"negative"|"neutral" } ],
  "quotes": { "positive": [{ "text": string, "source": string }], "negative": [{ "text": string, "source": string }] }
}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      thinkingConfig: { thinkingBudget: 5000 }
    }
  });

//   return safeParse(response.text, "Sentiment Audit") || null;
// };
    const parsed = safeParse(response.text, "Sentiment Audit");
    if (!parsed) throw new Error("Gemini returned unparseable JSON");
    return parsed;
  } catch (err) {
    console.error("[Sentiment Audit] Failed:", err);
    throw err;
  }
};
export const getChartConfigFromNL = async (query: string, availableMetrics: string[]): Promise<ChartConfig> => {
  try {
    const ai = getAIClient();
    const prompt = `You are a GA4 data visualization assistant. Given a user query and a list of available metrics, return a valid JSON chart configuration.
    
    AVAILABLE METRICS: ${availableMetrics.join(', ')}
    USER QUERY: "${query}"

    RETURN ONLY JSON IN THIS FORMAT:
    {
      "type": "line" | "bar" | "pie",
      "metrics": string[],
      "days": number,
      "title": string
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });

    return safeParse(response.text, "NL Chart Config") || {
      type: 'line',
      metrics: [availableMetrics[0]],
      days: 30,
      title: 'KPI Trend Analysis'
    };
  } catch (err) {
    console.error(err);
    return { type: 'line', metrics: [availableMetrics[0]], days: 30, title: 'KPI Trend Analysis' };
  }
};

// export const getExecutiveAnalysis = async (facts: KPIFact[], dictionary: KPIDictionary[], thresholds: KPIThreshold[], context: ProjectContext) => {
//   try {
//     const ai = getAIClient();
//     const prompt = `Perform an Executive Analysis for Project: ${context.name}.
//     Return JSON: { "insights": [{ "title": string, "detail": string, "type": "risk"|"opportunity"|"neutral" }], "recommendations": [{ "title": string, "detail": string, "impact": "High"|"Medium"|"Low" }] }`;
//     const response = await ai.models.generateContent({
//       model: 'gemini-3-flash-preview',
//       contents: prompt,
//       config: { responseMimeType: "application/json" }
//     });
//     return safeParse(response.text, "Executive Analysis") || { insights: [], recommendations: [] };
//   } catch (err) { return { insights: [], recommendations: [] }; }
// };
export const getExecutiveAnalysis = async (facts: KPIFact[], dictionary: KPIDictionary[], thresholds: KPIThreshold[], context: ProjectContext) => {
  try {
    const ai = getAIClient();
    
    const prompt = `You are a strategic analytics expert. Analyze the following KPI data and provide actionable insights.

DATA:
KPI Facts (actual performance data): ${JSON.stringify(facts)}
KPI Dictionary (metric definitions): ${JSON.stringify(dictionary)}
KPI Thresholds (target/warning/failure levels): ${JSON.stringify(thresholds)}

TASK:
1. Compare actual KPI values against defined thresholds
2. Identify KPIs exceeding failure thresholds (critical risks)
3. Identify KPIs below target but above warning (opportunities for improvement)
4. Identify positive trends and strong performers
5. Provide specific, data-driven recommendations

Return ONLY valid JSON in this exact format:
{
  "insights": [
    {
      "title": "Brief insight title",
      "detail": "Specific data point and what it means. Reference actual numbers from the data.",
      "type": "risk" | "opportunity" | "neutral"
    }
  ],
  "recommendations": [
    {
      "title": "Actionable recommendation",
      "detail": "Specific steps to take based on the data analysis. Include which KPIs to focus on.",
      "impact": "High" | "Medium" | "Low"
    }
  ]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    
    return safeParse(response.text, "Executive Analysis") || { insights: [], recommendations: [] };
  } catch (err) { 
    console.error("Executive analysis failed:", err);
    return { insights: [], recommendations: [] }; 
  }
};

export const chatWithKPIAgent = async (history: any[], userMessage: string, context: string) => {
  try {
    const ai = getAIClient();
    const chat = ai.chats.create({
      model: 'gemini-3-flash-preview',
      config: { systemInstruction: `You are an Analytics Strategist. Context: ${context}` }
    });
    const response = await chat.sendMessage({ message: userMessage });
    return response.text;
  } catch (err: any) { return `Error: ${err.message}`; }
};

export const generateLighthouseReport = async (urls: string[]): Promise<LighthouseReport[]> => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Simulate a detailed Lighthouse SEO and Performance audit for the following URLs: ${urls.join(', ')}. 
      For each URL, provide TWO reports: one for "Desktop" and one for "Mobile".
      Return strictly a JSON array. Data should be realistic for each specific URL if known, or high-quality synthetic data following Core Web Vital standards.`,
      config: { 
        responseMimeType: "application/json",
        thinkingConfig: { thinkingBudget: 4000 },
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              url: { type: Type.STRING },
              timestamp: { type: Type.STRING },
              device: { type: Type.STRING, description: "Must be exactly 'Desktop' or 'Mobile'" },
              performance: { type: Type.NUMBER, description: "0 to 100" },
              accessibility: { type: Type.NUMBER, description: "0 to 100" },
              seo: { type: Type.NUMBER, description: "0 to 100" },
              bestPractices: { type: Type.NUMBER, description: "0 to 100" },
              lcp: { type: Type.NUMBER, description: "Largest Contentful Paint in ms" },
              fcp: { type: Type.NUMBER, description: "First Contentful Paint in ms" },
              cls: { type: Type.NUMBER, description: "Cumulative Layout Shift score" },
              fid: { type: Type.NUMBER, description: "First Input Delay in ms" },
              recommendations: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              }
            },
            required: ["url", "device", "performance", "accessibility", "seo", "bestPractices", "lcp", "fcp", "cls", "fid", "recommendations"]
          }
        }
      }
    });
    return safeParse(response.text, "Lighthouse Report") || [];
  } catch (err) { 
    console.error("[Gemini Service] Lighthouse failure:", err);
    return []; 
  }
};

export const getPrioritizedBacklog = async (project: ProjectContext, stories: EpicStory[], method: string, marketContext: string) => {
  try {
    const ai = getAIClient();
    const prompt = `You are a world-class Agile Coach. Your task is to prioritize a product backlog for the project: "${project.name}" (${project.description}).
    
    METHODOLOGY: ${method === 'MoSCoW' ? 'MoSCoW (Must, Should, Could, Won\'t)' : 'RICE Scoring'}
    MARKET CONTEXT: ${marketContext}
    BACKLOG: ${JSON.stringify(stories)}

    IF METHOD IS MoSCoW:
    - Must: Critical, project fails without it.
    - Should: Important but not launch-blocking.
    - Could: Nice-to-have if time permits.
    - Won't: Explicitly out of scope for this version.

    RETURN JSON:
    {
      "summary": "Brief summary of prioritization strategy",
      "methodology": "Explanation of methodology used",
      "prioritizedItems": [
        {
          "id": "item unique ID",
          "title": "item title",
          "bucket": "Must-Have | Should-Have | Could-Have | Won't-Have",
          "score": number (if RICE),
          "rationale": "strategic reasoning for this placement",
          "epicTitle": "Optional parent epic"
        }
      ]
    }`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, "Backlog Prioritization") || { summary: '', prioritizedItems: [] };
  } catch (err) { 
    console.error("[Gemini Service] Prioritization failure:", err);
    return { summary: 'Error in prioritization stream.', prioritizedItems: [] }; 
  }
};

export const discoverGA4Tags = async (project: ProjectContext, propertyId: string) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze GA4 property ${propertyId} for ${project.name}. Return JSON: { tags: string[], detected_inception_date: string }`,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, "Tag Discovery") || { tags: [], detected_inception_date: "" };
  } catch (err) { return { tags: [], detected_inception_date: "" }; }
};

export const validateGA4Handshake = async (project: ProjectContext, propertyId: string, tags: string[]) => {
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Validate GA4: ${propertyId}. Return JSON: { healthScore: number, summary: string, checks: object }`,
      config: { responseMimeType: "application/json" }
    });
    return safeParse(response.text, "Handshake Validation") || { healthScore: 0, summary: "", checks: {} };
  } catch (err) { return { healthScore: 0, summary: "", checks: {} }; }
};
