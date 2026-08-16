import catalog from '../../backend/Data/market-series.json';

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
    <lastmod>2026-08-16</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.75</priority>
  </url>
</urlset>`;
const rateLimits = new Map<string, { resetAt: number; count: number }>();

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

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

    return env.ASSETS.fetch(request);
  },
};

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
      ...extraHeaders,
    },
  });
}
