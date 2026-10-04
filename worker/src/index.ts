import { PAGES as SEO_PAGES, REDIRECTS } from '../../shared/routes';
import { calculate as calculateShared } from '../../shared/calculation';
import type { MarketCatalog } from '../../frontend/src/types';
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

const CANONICAL_HOST = 'nekadarederdi.com';
const URL_STATE_PARAMS = ['amount', 'unit', 'start', 'end', 'criteria'];
const ADS_TXT = 'google.com, pub-3946058913389575, DIRECT, f08c47fec0942fa0';
const ROBOTS_TXT = `User-agent: *
Allow: /

Sitemap: https://nekadarederdi.com/sitemap.xml`;
const rateLimits = new Map<string, { resetAt: number; count: number }>();
const KNOWN_PAGE_PATHS = new Set([...Object.keys(SEO_PAGES), ...Object.keys(REDIRECTS)]);
const INDEXABLE_PAGE_PATHS = new Set(Object.keys(SEO_PAGES));

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'GET' || request.method === 'HEAD') {
      const cleanPath = url.pathname === '/index.html' ? '/' : url.pathname.replace(/\/index\.html$/, '');
      if (cleanPath !== url.pathname && INDEXABLE_PAGE_PATHS.has(cleanPath)) {
        url.pathname = cleanPath;
        return Response.redirect(url.toString(), 301);
      }
    }

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
      normalizePageQuery(url);
      return Response.redirect(url.toString(), 301);
    }

    if (request.method === 'GET' || request.method === 'HEAD') {
      const normalizedPath = normalizeTrailingSlash(url.pathname);

      if (normalizedPath && KNOWN_PAGE_PATHS.has(normalizedPath)) {
        url.pathname = normalizedPath;
        return Response.redirect(url.toString(), 301);
      }
    }

    const pageQueryRedirectUrl = getPageQueryRedirectUrl(request, url);

    if (pageQueryRedirectUrl) {
      return Response.redirect(pageQueryRedirectUrl, 301);
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

    if (url.pathname === '/sitemap.xml') return env.ASSETS.fetch(request);
    if (REDIRECTS[url.pathname]) return Response.redirect(new URL(REDIRECTS[url.pathname], url.origin).toString(), 301);

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
        return json({ results: calculateShared(catalog as MarketCatalog, payload) });
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
  if (INDEXABLE_PAGE_PATHS.has(url.pathname)) url.pathname = url.pathname === '/' ? '/index.html' : `${url.pathname}/index.html`;
  else if (!/\.[a-z0-9]+$/i.test(url.pathname)) url.pathname = '/404.html';
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
  const isIndexablePage = isKnownPage && INDEXABLE_PAGE_PATHS.has(url.pathname) && request.url === canonical;
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

function getPageQueryRedirectUrl(request: Request, url: URL) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return null;
  }

  if (!KNOWN_PAGE_PATHS.has(url.pathname) || !hasSearchParams(url)) {
    return null;
  }

  const nextUrl = new URL(url.toString());
  normalizePageQuery(nextUrl);
  return nextUrl.toString();
}

function normalizePageQuery(url: URL) {
  if (!KNOWN_PAGE_PATHS.has(url.pathname) || !hasSearchParams(url)) {
    return;
  }

  const stateParams = new URLSearchParams();

  for (const key of URL_STATE_PARAMS) {
    const value = url.searchParams.get(key);

    if (value) {
      stateParams.set(key, value);
    }
  }

  url.search = '';
  url.hash = url.pathname === '/' && hasSearchParams(stateParams) ? stateParams.toString() : '';
}

function hasSearchParams(value: URL | URLSearchParams) {
  const params = value instanceof URL ? value.searchParams : value;
  return params.keys().next().done === false;
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
