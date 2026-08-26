import catalog from '../../data/market-series.json';

type SeriesKey =
  | 'cpi'
  | 'usd'
  | 'eur'
  | 'gold'
  | 'minimumWage'
  | 'silver'
  | 'bist100'
  | 'bitcoin'
  | 'housing'
  | 'gasoline'
  | 'deposit';
type InputUnit = 'try' | 'usd' | 'eur' | 'gold' | 'silver';

type Observation = {
  date: string;
  value: number;
};

type MarketSeries = {
  key: SeriesKey;
  name: string;
  shortName: string;
  description: string;
  unit: string;
  sourceNote: string;
  observations: Observation[];
};

type CalculatorRequest = {
  amount: number;
  inputUnit: InputUnit;
  startMonth: string;
  endMonth: string;
  criteria: SeriesKey[];
};

type SpotMarketItem = {
  key: 'usd' | 'eur' | 'gold' | 'bitcoin';
  label: string;
  value: number;
  previousValue?: number | null;
  changePercent?: number | null;
  unit: string;
  source: string;
};

type Env = {
  ASSETS: Fetcher;
};

const DEFAULT_CRITERIA: SeriesKey[] = ['cpi', 'usd', 'gold', 'minimumWage'];
const VALID_CRITERIA = new Set<SeriesKey>([
  'cpi',
  'usd',
  'eur',
  'gold',
  'minimumWage',
  'silver',
  'bist100',
  'bitcoin',
  'housing',
  'gasoline',
  'deposit',
]);
const VALID_INPUT_UNITS = new Set<InputUnit>(['try', 'usd', 'eur', 'gold', 'silver']);
const TL_CUTOVER = '2005-01';
const MAX_INPUT_AMOUNT = 999_999_999_999;
const CANONICAL_HOST = 'nekadarederdi.com';
const ADS_TXT = 'google.com, pub-3946058913389575, DIRECT, f08c47fec0942fa0';
const ROBOTS_TXT = `User-agent: *
Allow: /

Sitemap: https://nekadarederdi.com/sitemap.xml`;
const SITEMAP_XML = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://nekadarederdi.com/</loc>
    <lastmod>2026-08-16</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://nekadarederdi.com/enflasyon-hesaplama</loc>
    <lastmod>2026-08-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nekadarederdi.com/gecmis-para-degeri</loc>
    <lastmod>2026-08-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nekadarederdi.com/bugunun-parasiyla-ne-kadar</loc>
    <lastmod>2026-08-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://nekadarederdi.com/dolar-bazinda-ne-kadar-ederdi</loc>
    <lastmod>2026-08-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
  </url>
  <url>
    <loc>https://nekadarederdi.com/altin-bazinda-ne-kadar-ederdi</loc>
    <lastmod>2026-08-17</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
  </url>
  <url>
    <loc>https://nekadarederdi.com/2010da-10000-tl-bugun-ne-kadar</loc>
    <lastmod>2026-08-17</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
  </url>
  <url>
    <loc>https://nekadarederdi.com/eski-maas-bugun-ne-kadar</loc>
    <lastmod>2026-08-17</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
  </url>
  <url>
    <loc>https://nekadarederdi.com/kira-enflasyon-hesaplama</loc>
    <lastmod>2026-08-17</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://nekadarederdi.com/bist-bitcoin-altin-karsilastirma</loc>
    <lastmod>2026-08-17</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://nekadarederdi.com/hakkinda</loc>
    <lastmod>2026-08-19</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://nekadarederdi.com/iletisim</loc>
    <lastmod>2026-08-19</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://nekadarederdi.com/gizlilik-politikasi</loc>
    <lastmod>2026-08-19</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://nekadarederdi.com/kullanim-sartlari</loc>
    <lastmod>2026-08-19</lastmod>
    <changefreq>yearly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;
const rateLimits = new Map<string, { resetAt: number; count: number }>();

const SEO_PAGES: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Ne Kadar Ederdi? | Geçmiş Para Değeri ve Enflasyon Hesaplama',
    description:
      'Geçmişteki bir tutarı TÜFE, dolar, euro, gram altın, gümüş, asgari ücret, BIST 100 ve Bitcoin verileriyle ay bazında karşılaştırın.',
  },
  '/enflasyon-hesaplama': {
    title: 'Enflasyon Hesaplama | TÜFE ile Geçmiş Para Değeri',
    description:
      'Geçmişteki bir TL tutarının TÜFE verilerine göre bugünkü yaklaşık satın alma gücünü hesaplayın.',
  },
  '/gecmis-para-degeri': {
    title: 'Geçmiş Para Değeri Hesaplama | Ne Kadar Ederdi?',
    description:
      'Geçmişteki TL tutarlarını bugünkü değerle, enflasyon, döviz, altın, gümüş ve asgari ücret üzerinden kıyaslayın.',
  },
  '/bugunun-parasiyla-ne-kadar': {
    title: 'Bugünün Parasıyla Ne Kadar? | TL Alım Gücü Hesaplama',
    description:
      'Eski bir fiyatın, maaşın veya borcun bugünün parasıyla yaklaşık karşılığını hesaplayın.',
  },
  '/dolar-bazinda-ne-kadar-ederdi': {
    title: 'Dolar Bazında Ne Kadar Ederdi? | TL USD Karşılaştırma',
    description:
      'Geçmişteki TL tutarını dolar kuru değişimine göre bugünkü yaklaşık TL karşılığıyla kıyaslayın.',
  },
  '/altin-bazinda-ne-kadar-ederdi': {
    title: 'Altın Bazında Ne Kadar Ederdi? | Gram Altın Karşılaştırma',
    description:
      'Geçmişteki TL tutarını gram altın fiyatı değişimine göre bugünkü yaklaşık karşılığıyla hesaplayın.',
  },
  '/2010da-10000-tl-bugun-ne-kadar': {
    title: '2010’da 10.000 TL Bugün Ne Kadar? | Enflasyon ve Yatırım Kıyas',
    description:
      '2010 yılındaki 10.000 TL tutarını bugünün parasıyla, TÜFE, dolar, altın, BIST 100 ve Bitcoin verileriyle kıyaslayın.',
  },
  '/eski-maas-bugun-ne-kadar': {
    title: 'Eski Maaş Bugün Ne Kadar? | Maaş Enflasyon Hesaplama',
    description:
      'Eski maaşınızı bugünkü alım gücüyle ve asgari ücret, döviz, altın gibi farklı göstergelerle karşılaştırın.',
  },
  '/kira-enflasyon-hesaplama': {
    title: 'Kira Enflasyon Hesaplama | Eski Kira Bugün Ne Kadar?',
    description:
      'Geçmişteki kira tutarını TÜFE ve farklı ekonomik göstergelerle bugünkü yaklaşık değerine taşıyın.',
  },
  '/bist-bitcoin-altin-karsilastirma': {
    title: 'BIST, Bitcoin ve Altın Karşılaştırma | Ne Kadar Ederdi?',
    description:
      'Bir TL tutarını BIST 100, Bitcoin, gram altın ve gümüş fiyatlarındaki tarihsel değişimle karşılaştırın.',
  },
  '/hakkinda': {
    title: 'Hakkında | Ne Kadar Ederdi?',
    description:
      "Ne Kadar Ederdi'nin amacı, kullandığı veri türleri ve hesaplama yaklaşımı hakkında bilgi.",
  },
  '/iletisim': {
    title: 'İletişim | Ne Kadar Ederdi?',
    description:
      'Ne Kadar Ederdi ile ilgili öneri, veri kaynağı, hata bildirimi ve reklam talepleri için iletişim bilgileri.',
  },
  '/gizlilik-politikasi': {
    title: 'Gizlilik Politikası | Ne Kadar Ederdi?',
    description:
      "Ne Kadar Ederdi'nin analitik, reklam, çerez ve kullanıcı verisi yaklaşımı hakkında gizlilik bilgileri.",
  },
  '/kullanim-sartlari': {
    title: 'Kullanım Şartları | Ne Kadar Ederdi?',
    description:
      "Ne Kadar Ederdi hesaplama aracının kullanım koşulları, veri sınırları ve sorumluluk reddi.",
  },
};
const KNOWN_PAGE_PATHS = new Set(Object.keys(SEO_PAGES));

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/') && request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(),
      });
    }

    if (shouldRedirectToCanonicalHost(request, url)) {
      url.protocol = 'https:';
      url.hostname = CANONICAL_HOST;
      url.port = '';
      return Response.redirect(url.toString(), 301);
    }

    if (request.method === 'GET' || request.method === 'HEAD') {
      const normalizedPath = normalizeTrailingSlash(url.pathname);

      if (normalizedPath && KNOWN_PAGE_PATHS.has(normalizedPath)) {
        url.pathname = normalizedPath;
        return Response.redirect(url.toString(), 301);
      }
    }

    if (url.pathname === '/health') {
      return json({ ok: true });
    }

    if (url.pathname === '/ads.txt') {
      return new Response(`${ADS_TXT}\n`, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    if (url.pathname === '/robots.txt') {
      return new Response(`${ROBOTS_TXT}\n`, {
        headers: {
          'Content-Type': 'text/plain; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    if (url.pathname === '/sitemap.xml') {
      return new Response(`${SITEMAP_XML}\n`, {
        headers: {
          'Content-Type': 'application/xml; charset=utf-8',
          'Cache-Control': 'public, max-age=3600',
        },
      });
    }

    if (url.pathname === '/api/series' && request.method === 'GET') {
      const limited = rateLimit(request, 'series', 120);
      return limited ?? json(catalog);
    }

    if (url.pathname === '/api/spot' && request.method === 'GET') {
      const limited = rateLimit(request, 'spot', 120);
      return limited ?? json(await getSpotMarket());
    }

    if (url.pathname === '/api/calculate' && request.method === 'POST') {
      const limited = rateLimit(request, 'calculate', 60);

      if (limited) {
        return limited;
      }

      try {
        const payload = (await request.json()) as Partial<CalculatorRequest>;
        return json({ results: calculate(payload) });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Hesaplama yapılamadı.';
        return json({ error: message }, 400);
      }
    }

    if (url.pathname.startsWith('/api/')) {
      return json({ error: 'Endpoint bulunamadı.' }, 404);
    }

    return rewriteHtmlMetadata(request, await fetchPageAsset(request, env));
  },
};

function fetchPageAsset(request: Request, env: Env) {
  const url = new URL(request.url);
  url.search = '';
  return env.ASSETS.fetch(new Request(url.toString(), request));
}

async function rewriteHtmlMetadata(request: Request, response: Response) {
  const contentType = response.headers.get('Content-Type') ?? '';

  if (!contentType.includes('text/html')) {
    return response;
  }

  const url = new URL(request.url);
  const isKnownPage = KNOWN_PAGE_PATHS.has(url.pathname);
  const metadata = isKnownPage
    ? SEO_PAGES[url.pathname]
    : {
        title: 'Sayfa bulunamadı | Ne Kadar Ederdi?',
        description: 'Aradığınız sayfa bulunamadı. Ne Kadar Ederdi hesaplayıcısına dönebilirsiniz.',
      };
  const canonical = isKnownPage
    ? `https://${CANONICAL_HOST}${url.pathname === '/' ? '/' : url.pathname}`
    : `https://${CANONICAL_HOST}/`;
  const isIndexablePage = isKnownPage && request.url === canonical;
  const html = await response.text();
  const nextHtml = html
    .replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(metadata.title)}</title>`)
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/>/, `<meta name="description" content="${escapeHtml(metadata.description)}" />`)
    .replace(
      /<meta\s+name="robots"\s+content="[^"]*"\s*\/>/,
      `<meta name="robots" content="${isIndexablePage ? 'index, follow, max-image-preview:large' : 'noindex, follow'}" />`,
    )
    .replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/>/, `<link rel="canonical" href="${canonical}" />`)
    .replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/>/, `<meta property="og:title" content="${escapeHtml(metadata.title)}" />`)
    .replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/>/, `<meta property="og:description" content="${escapeHtml(metadata.description)}" />`)
    .replace(/<meta\s+property="og:url"\s+content="[^"]*"\s*\/>/, `<meta property="og:url" content="${canonical}" />`)
    .replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/>/, `<meta name="twitter:title" content="${escapeHtml(metadata.title)}" />`)
    .replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/>/, `<meta name="twitter:description" content="${escapeHtml(metadata.description)}" />`);

  return new Response(nextHtml, {
    status: isKnownPage ? response.status : 404,
    statusText: isKnownPage ? response.statusText : 'Not Found',
    headers: withSeoHeaders(response.headers, isIndexablePage),
  });
}

function escapeHtml(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

async function getSpotMarket() {
  const [usd, eur, goldOunce, btcTryDirect, btcUsd] = await Promise.all([
    fetchYahooQuote('USDTRY=X'),
    fetchYahooQuote('EURTRY=X'),
    fetchYahooQuote('GC=F'),
    fetchYahooQuote('BTC-TRY'),
    fetchYahooQuote('BTC-USD'),
  ]);
  const fallbackUsd = latestSeriesPair('usd');
  const fallbackEur = latestSeriesPair('eur');
  const fallbackGold = latestSeriesPair('gold');
  const fallbackBitcoin = latestSeriesPair('bitcoin');
  const usdTry = usd?.value ?? fallbackUsd.value;
  const eurTry = eur?.value ?? fallbackEur.value;
  const gramGoldTry = goldOunce?.value && usdTry ? (goldOunce.value * usdTry) / 31.1034768 : fallbackGold.value;
  const btcTry = btcTryDirect?.value ?? (btcUsd?.value && usdTry ? btcUsd.value * usdTry : null);
  const bitcoinTry = btcTry ?? fallbackBitcoin.value;
  const previousUsdTry = usd?.previousValue ?? fallbackUsd.previousValue;
  const previousEurTry = eur?.previousValue ?? fallbackEur.previousValue;
  const previousGramGoldTry =
    goldOunce?.previousValue && previousUsdTry ? (goldOunce.previousValue * previousUsdTry) / 31.1034768 : fallbackGold.previousValue;
  const previousBtcTry =
    btcTryDirect?.previousValue ?? (btcUsd?.previousValue && previousUsdTry ? btcUsd.previousValue * previousUsdTry : fallbackBitcoin.previousValue);
  const source = usd && eur && goldOunce && btcTry ? 'Yahoo Finance, anlık piyasa verisi' : 'Son mevcut seri verisi';
  const items: SpotMarketItem[] = [
    { key: 'usd', label: 'Dolar', value: usdTry, unit: 'TL/USD', source: usd ? 'Yahoo Finance' : 'Son aylık seri' },
    { key: 'eur', label: 'Euro', value: eurTry, unit: 'TL/EUR', source: eur ? 'Yahoo Finance' : 'Son aylık seri' },
    { key: 'gold', label: 'Gram altın', value: gramGoldTry, unit: 'TL/gr', source: goldOunce && usd ? 'Yahoo Finance türev' : 'Son aylık seri' },
    { key: 'bitcoin', label: 'Bitcoin', value: bitcoinTry, unit: 'TL/BTC', source: btcTry ? 'Yahoo Finance' : 'Son aylık seri' },
  ];
  const previousValues: Record<SpotMarketItem['key'], number | null> = {
    usd: previousUsdTry,
    eur: previousEurTry,
    gold: previousGramGoldTry,
    bitcoin: previousBtcTry,
  };
  const enrichedItems = items.map((item) => ({
    ...item,
    previousValue: previousValues[item.key],
    changePercent: calculateChangePercent(item.value, previousValues[item.key]),
  }));

  return {
    updatedAt: new Date().toISOString(),
    source,
    items: enrichedItems,
  };
}

function calculateChangePercent(value: number, previousValue: number | null | undefined) {
  if (!Number.isFinite(value) || !Number.isFinite(previousValue) || !previousValue) {
    return null;
  }

  return ((value - previousValue) / previousValue) * 100;
}

async function fetchYahooQuote(symbol: string) {
  try {
    const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?range=1d&interval=1m`, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'nekadarederdi/1.0',
      },
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      chart?: {
        result?: Array<{
          meta?: { regularMarketPrice?: number; chartPreviousClose?: number; previousClose?: number };
          indicators?: { quote?: Array<{ close?: Array<number | null> }> };
        }>;
      };
    };
    const result = payload.chart?.result?.[0];
    const close = result?.indicators?.quote?.[0]?.close?.filter((value): value is number => Number.isFinite(value)) ?? [];
    const lastClose = close[close.length - 1];
    const value = Number.isFinite(result?.meta?.regularMarketPrice) ? result!.meta!.regularMarketPrice! : lastClose ?? null;
    const previousValue = result?.meta?.chartPreviousClose ?? result?.meta?.previousClose ?? close[0] ?? null;

    return value ? { value, previousValue } : null;
  } catch {
    return null;
  }
}

function latestSeriesPair(key: SeriesKey) {
  const series = (catalog.series as MarketSeries[]).find((item) => item.key === key);
  const observations = series?.observations
    .filter((item) => Number.isFinite(item.value))
    .sort((first, second) => second.date.localeCompare(first.date)) ?? [];

  return {
    value: observations[0]?.value ?? 0,
    previousValue: observations[1]?.value ?? null,
  };
}

function shouldRedirectToCanonicalHost(request: Request, url: URL) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return false;
  }

  if (url.pathname.startsWith('/api/')) {
    return false;
  }

  return !isLocalHost(url.hostname) && (url.hostname !== CANONICAL_HOST || url.protocol !== 'https:');
}

function isLocalHost(hostname: string) {
  return hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
}

function normalizeTrailingSlash(pathname: string) {
  if (pathname === '/' || !pathname.endsWith('/')) {
    return null;
  }

  return pathname.slice(0, -1);
}

function withSeoHeaders(headers: Headers, isIndexablePage: boolean) {
  const nextHeaders = new Headers(headers);

  if (!isIndexablePage) {
    nextHeaders.set('X-Robots-Tag', 'noindex, follow');
  }

  return nextHeaders;
}

function calculate(request: Partial<CalculatorRequest>) {
  validate(request);

  const amount = request.amount!;
  const inputUnit = request.inputUnit ?? 'try';
  const startMonth = request.startMonth!;
  const endMonth = request.endMonth!;
  const availableKeys = new Set((catalog.series as MarketSeries[]).map((item) => item.key));
  const requestedCriteria = request.criteria?.length ? [...new Set(request.criteria)] : DEFAULT_CRITERIA;
  const criteria = requestedCriteria.filter((key) => VALID_CRITERIA.has(key) && availableKeys.has(key));
  const selectedCriteria = criteria.length ? criteria : DEFAULT_CRITERIA.filter((key) => availableKeys.has(key));
  const appliedPre2005Conversion = inputUnit === 'try' && startMonth < TL_CUTOVER;
  const normalizedAmount = inputAmountToTry(amount, inputUnit, startMonth, appliedPre2005Conversion);

  return selectedCriteria.map((key) => {
    if (!VALID_CRITERIA.has(key)) {
      throw new Error(`'${key}' için veri serisi bulunamadı.`);
    }

    const series = (catalog.series as MarketSeries[]).find((item) => item.key === key);

    if (!series) {
      throw new Error(`'${key}' için veri serisi bulunamadı.`);
    }

    const startObservation = pickObservation(series.observations, startMonth);
    const endObservation = pickObservation(series.observations, endMonth);
    const multiplier = endObservation.value / startObservation.value;

    return {
      series: {
        key: series.key,
        name: series.name,
        shortName: series.shortName,
        description: series.description,
        unit: series.unit,
        sourceNote: series.sourceNote,
      },
      originalAmount: amount,
      normalizedAmount,
      resultAmount: normalizedAmount * multiplier,
      multiplier,
      startObservation,
      endObservation,
      appliedPre2005Conversion,
    };
  });
}

function inputAmountToTry(amount: number, inputUnit: InputUnit, startMonth: string, appliedPre2005Conversion: boolean) {
  if (inputUnit === 'try') {
    return appliedPre2005Conversion ? amount / 1_000_000 : amount;
  }

  if (!VALID_INPUT_UNITS.has(inputUnit)) {
    throw new Error('Girdi birimi desteklenmiyor.');
  }

  const series = (catalog.series as MarketSeries[]).find((item) => item.key === inputUnit);

  if (!series) {
    throw new Error(`'${inputUnit}' için veri serisi bulunamadı.`);
  }

  return amount * pickObservation(series.observations, startMonth).value;
}

function validate(request: Partial<CalculatorRequest>) {
  if (!Number.isFinite(request.amount) || !request.amount || request.amount <= 0) {
    throw new Error("Miktar 0'dan büyük olmalı.");
  }

  if (request.amount > MAX_INPUT_AMOUNT) {
    throw new Error('Miktar en fazla 999.999.999.999 olabilir.');
  }

  if (request.inputUnit && !VALID_INPUT_UNITS.has(request.inputUnit)) {
    throw new Error('Girdi birimi desteklenmiyor.');
  }

  if (!isMonth(request.startMonth) || !isMonth(request.endMonth)) {
    throw new Error('Tarih formatı YYYY-MM olmalı ve ay 01-12 aralığında olmalı.');
  }
}

function pickObservation(observations: Observation[], month: string) {
  const monthDate = `${month}-01`;
  const previous = observations
    .filter((item) => item.date <= monthDate)
    .sort((first, second) => second.date.localeCompare(first.date))[0];

  return previous ?? [...observations].sort((first, second) => first.date.localeCompare(second.date))[0];
}

function isMonth(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}$/.test(value)) {
    return false;
  }

  const month = Number(value.slice(5, 7));
  return month >= 1 && month <= 12;
}

function rateLimit(request: Request, bucket: string, limit: number) {
  const ip = request.headers.get('CF-Connecting-IP') ?? request.headers.get('x-forwarded-for') ?? 'local';
  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const current = rateLimits.get(key);

  if (!current || current.resetAt <= now) {
    rateLimits.set(key, { count: 1, resetAt: now + 60_000 });
    return null;
  }

  current.count += 1;

  if (current.count > limit) {
    return json({ error: 'Çok fazla istek gönderildi. Lütfen kısa bir süre sonra tekrar deneyin.' }, 429, {
      'Retry-After': String(Math.ceil((current.resetAt - now) / 1000)),
    });
  }

  return null;
}

function json(payload: unknown, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...corsHeaders(),
      ...extraHeaders,
    },
  });
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}
