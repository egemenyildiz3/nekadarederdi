import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dataPath = resolve(root, 'data', 'market-series.json');
const troyOunceGram = 31.1034768;
const startYear = Number(process.env.DATA_START_YEAR ?? 2005);
const end = process.env.DATA_END_MONTH ?? new Date().toISOString().slice(0, 7);

const sources = {
  cpi: 'Hakedis.org ve OSKA üzerinde yayımlanan TÜİK TÜFE 2003=100 endeks tabloları',
  usd: 'TCMB gösterge kurları, aylık döviz alış ortalaması',
  eur: 'TCMB gösterge kurları, aylık döviz alış ortalaması',
  gold:
    'DataHub gold-prices / World Bank Pink Sheet altın ons USD aylık fiyatı ve TCMB USD/TL ortalamasından türetilen gram TL',
  silver:
    'Eco3min / World Bank Pink Sheet gümüş ons USD aylık fiyatı ve TCMB USD/TL ortalamasından türetilen gram TL',
  minimumWage: 'Resmi Gazete referanslı net ücret satırları',
  bist100: 'Yahoo Finance XU100.IS aylık kapanış verileri',
  bitcoin: 'Yahoo Finance BTC-USD aylık kapanış verileri ve TCMB USD/TL ortalamasından türetilen TL fiyatı',
  housing: 'TCMB EVDS Konut Fiyat Endeksi; Altınla üzerinde yayımlanan gömülü TCMB/EVDS tarihsel seri',
  gasoline:
    'FRED / Eurostat Türkiye yakıt ve yağlayıcılar HICP endeksi; veri yoksa konfigüre edilen benzin fiyatı CSV kaynağı',
  deposit:
    'TCMB EVDS TL mevduat faiz oranı serisinden aylık bileşik getiri endeksi; EVDS_API_KEY ve EVDS_DEPOSIT_SERIES ile güncellenir',
};

const catalog = JSON.parse(await readFile(dataPath, 'utf8'));
const [cpi, rates, goldUsd, silverUsd, minimumWage, bist100, btcUsd, housing, gasoline, deposit] = await Promise.all([
  fetchCpi(),
  fetchTcmbRates(),
  fetchGoldUsd(),
  fetchSilverUsd(),
  fetchMinimumWage(),
  fetchYahooMonthly('XU100.IS', `${startYear}-01`),
  fetchYahooMonthly('BTC-USD', '2014-09'),
  fetchHousingIndex(),
  fetchGasolineIndex(),
  fetchDepositIndex(),
]);
const bitcoin = deriveBitcoinTry(btcUsd, rates.usd);

setSeries('cpi', {
  name: 'Reel TL',
  shortName: 'TÜFE',
  description: 'TÜFE bazlı bugünkü alım gücü karşılığı.',
  unit: 'zincir endeks',
  sourceNote: sources.cpi,
  observations: cpi,
});
setSeries('usd', {
  name: 'Amerikan Doları',
  shortName: 'USD',
  description: "TL'nin ABD doları karşısındaki yaklaşık değer değişimi.",
  unit: 'TL/USD',
  sourceNote: sources.usd,
  observations: rates.usd,
});
setSeries('eur', {
  name: 'Euro',
  shortName: 'EUR',
  description: "TL'nin euro karşısındaki yaklaşık değer değişimi.",
  unit: 'TL/EUR',
  sourceNote: sources.eur,
  observations: rates.eur,
});
setSeries('gold', {
  name: 'Gram Altın',
  shortName: 'Altın',
  description: 'Gram altının TL fiyatına göre yaklaşık karşılık.',
  unit: 'TL/gr',
  sourceNote: sources.gold,
  observations: deriveGramTry(goldUsd, rates.usd),
});
setSeries('silver', {
  name: 'Gümüş',
  shortName: 'Gümüş',
  description: 'Gümüşün TL fiyatına göre yaklaşık karşılık.',
  unit: 'TL/gr',
  sourceNote: sources.silver,
  observations: deriveGramTry(silverUsd, rates.usd),
});
setSeries('minimumWage', {
  name: 'Asgari Ücret',
  shortName: 'Asgari Ücret',
  description: 'Net asgari ücrete oranla yaklaşık karşılık.',
  unit: 'net TL',
  sourceNote: sources.minimumWage,
  observations: minimumWage,
});
setSeries('bist100', {
  name: 'BIST 100',
  shortName: 'BIST 100',
  description: 'Borsa İstanbul BIST 100 endeksine göre yaklaşık karşılık.',
  unit: 'endeks puanı',
  sourceNote: sources.bist100,
  observations: bist100,
});
setSeries('bitcoin', {
  name: 'Bitcoin',
  shortName: 'BTC',
  description: 'Bitcoin fiyatının TL karşılığına göre yaklaşık karşılık.',
  unit: 'TL/BTC',
  sourceNote: sources.bitcoin,
  observations: bitcoin,
});
setSeries('housing', {
  name: 'Konut Fiyat Endeksi',
  shortName: 'Konut',
  description: 'Türkiye konut fiyat endeksine göre yaklaşık karşılık.',
  unit: 'KFE endeksi',
  sourceNote: sources.housing,
  observations: housing,
});

if (gasoline.length > 0) {
  setSeries('gasoline', {
    name: 'Benzin',
    shortName: 'Benzin',
    description: 'Yakıt fiyat endeksi ya da benzin fiyatı serisine göre yaklaşık karşılık.',
    unit: 'yakıt endeksi',
    sourceNote: sources.gasoline,
    observations: gasoline,
  });
}

if (deposit.length > 0) {
  setSeries('deposit', {
    name: 'TL Mevduat',
    shortName: 'Mevduat',
    description: 'TL mevduat faizinin aylık bileşik getiri endeksine göre yaklaşık karşılık.',
    unit: 'bileşik endeks',
    sourceNote: sources.deposit,
    observations: deposit,
  });
}

catalog.updatedAt = new Date().toISOString().slice(0, 10);
catalog.meta = {
  granularity: 'monthly',
  startMonth: `${startYear}-01`,
  endMonth: end,
  currencyUnit: 'TRY',
  sources,
};

await writeFile(dataPath, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8');
console.log(`Gerçek veri dosyası güncellendi: ${dataPath}`);

function setSeries(key, nextSeries) {
  const index = catalog.series.findIndex((item) => item.key === key);

  if (index >= 0) {
    catalog.series[index] = { key, ...nextSeries };
  } else {
    catalog.series.push({ key, ...nextSeries });
  }
}

async function fetchCpi() {
  const [hakedisHtml, oskaHtml] = await Promise.all([
    fetchText('https://www.hakedis.org/endeksler/tuketici-fiyat-genel-endeksi-ve-degisim-oranlari-2003', {
      optional: true,
    }),
    fetchText('https://www.oska.com.tr/tufe-ve-yi-ufe-endeksleri/', { optional: true }),
  ]);
  const byMonth = new Map();

  for (const match of hakedisHtml.matchAll(/<tr><td>(\d{4})<\/td>([\s\S]*?)<\/tr>/g)) {
    const year = Number(match[1]);
    const cells = [...match[2].matchAll(/<td>([^<]*)<\/td>/g)].map((cell) => cell[1].trim());

    cells.forEach((rawValue, index) => {
      const value = parseTrNumber(rawValue);

      if (Number.isFinite(value)) {
        byMonth.set(`${year}-${String(index + 1).padStart(2, '0')}`, value);
      }
    });
  }

  for (const match of oskaHtml.matchAll(/<td data-label="Yıl \/ Ay"><strong>([^<]+)<\/strong><\/td>\s*<td data-label="TÜFE Endeksi">([^<]+)<\/td>/g)) {
    const date = toTurkishMonth(match[1]);
    const value = parseTrNumber(match[2]);

    if (date && Number.isFinite(value)) {
      const month = date.slice(0, 7);

      if (!byMonth.has(month)) {
        byMonth.set(month, value);
      }
    }
  }

  for (const match of oskaHtml.matchAll(/<td[^>]*>\s*<strong>([^<]+)<\/strong>\s*<\/td>\s*<td[^>]*>([^<]+)<\/td>/g)) {
    const date = toTurkishMonth(match[1]);
    const value = parseTrNumber(match[2]);

    if (date && Number.isFinite(value)) {
      const month = date.slice(0, 7);

      if (!byMonth.has(month)) {
        byMonth.set(month, value);
      }
    }
  }

  const rows = [...byMonth.entries()]
    .map((match) => ({
      date: `${match[0]}-01`,
      value: match[1],
    }))
    .filter((item) => item.date >= `${startYear}-01-01` && item.date <= `${end}-01`)
    .sort((first, second) => first.date.localeCompare(second.date));

  if (rows.length === 0) {
    const existing = getExistingSeries('cpi');

    if (existing.length > 0) {
      console.warn('TÜFE kaynaklarından veri alınamadı; mevcut veri dosyasındaki TÜFE serisi korundu.');
      return existing;
    }

    throw new Error('TÜFE tablosundan veri çıkarılamadı.');
  }

  return rows.map((row) => ({
    date: row.date,
    value: round(row.value, 6),
  }));
}

async function fetchTcmbRates() {
  const months = listMonths(`${startYear}-01`, end);
  const usd = [];
  const eur = [];

  for (const month of months) {
    const rates = await fetchMonthRates(month);

    if (rates.usd.length > 0 && rates.eur.length > 0) {
      usd.push({ date: `${month}-01`, value: round(average(rates.usd), 6) });
      eur.push({ date: `${month}-01`, value: round(average(rates.eur), 6) });
      console.log(`${month}: TCMB kur ortalaması alındı (${rates.usd.length} gün).`);
    }
  }

  if (usd.length === 0 || eur.length === 0) {
    throw new Error('TCMB kur verisi alınamadı.');
  }

  return { usd, eur };
}

async function fetchMonthRates(month) {
  const [year, monthNumber] = month.split('-').map(Number);
  const today = new Date();
  const maxDay =
    year === today.getFullYear() && monthNumber === today.getMonth() + 1
      ? today.getDate()
      : new Date(year, monthNumber, 0).getDate();
  const usd = [];
  const eur = [];
  const requests = [];

  for (let day = 1; day <= maxDay; day += 1) {
    const date = new Date(year, monthNumber - 1, day);
    const weekday = date.getDay();

    if (weekday === 0 || weekday === 6) {
      continue;
    }

    requests.push(() => fetchRateDay(year, monthNumber, day));
  }

  const settled = await runLimited(requests, 8);

  for (const item of settled.filter(Boolean)) {
    usd.push(item.usd);
    eur.push(item.eur);
  }

  return { usd, eur };
}

async function fetchRateDay(year, month, day) {
  const monthText = String(month).padStart(2, '0');
  const dayText = String(day).padStart(2, '0');
  const url = `https://www.tcmb.gov.tr/kurlar/${year}${monthText}/${dayText}${monthText}${year}.xml`;

  try {
    const xml = await fetchText(url, { allow404: true });

    if (!xml) {
      return null;
    }

    const usd = parseCurrency(xml, 'USD');
    const eur = parseCurrency(xml, 'EUR');
    return usd && eur ? { usd, eur } : null;
  } catch {
    return null;
  }
}

function parseCurrency(xml, code) {
  const block = xml.match(new RegExp(`<Currency[^>]*Kod="${code}"[^>]*>([\\s\\S]*?)<\\/Currency>`))?.[1];
  const value = block?.match(/<ForexBuying>([^<]+)<\/ForexBuying>/)?.[1];
  return value ? Number(value) : null;
}

async function fetchGoldUsd() {
  const csv = await fetchText('https://datahub.io/core/gold-prices/_r/-/data/monthly.csv');
  return parseCsv(csv)
    .slice(1)
    .map(([date, price]) => ({ date: `${date}-01`, value: Number(price) }))
    .filter((item) => item.date >= `${startYear}-01-01` && item.date <= `${end}-01` && Number.isFinite(item.value));
}

async function fetchSilverUsd() {
  const csv = await fetchText('https://eco3min.fr/dataset/silver-price.csv');
  return parseCsv(csv)
    .slice(1)
    .map(([date, price]) => ({ date, value: Number(price) }))
    .filter((item) => item.date >= `${startYear}-01-01` && item.date <= `${end}-01` && Number.isFinite(item.value));
}

async function fetchYahooMonthly(symbol, startMonth) {
  const period1 = Math.floor(Date.parse(`${startMonth}-01T00:00:00Z`) / 1000);
  const period2 = Math.floor(Date.parse(`${end}-28T00:00:00Z`) / 1000);
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?period1=${period1}&period2=${period2}&interval=1mo`;
  const payload = JSON.parse(await fetchText(url));
  const result = payload.chart?.result?.[0];
  const timestamps = result?.timestamp ?? [];
  const close = result?.indicators?.quote?.[0]?.close ?? [];

  const rows = timestamps
    .map((timestamp, index) => {
      const date = new Date(timestamp * 1000);
      const month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
      const value = Number(close[index]);

      return Number.isFinite(value) ? { date: `${month}-01`, value: round(value, 6) } : null;
    })
    .filter(Boolean)
    .filter((item) => item.date >= `${startYear}-01-01` && item.date <= `${end}-01`)
    .sort((first, second) => first.date.localeCompare(second.date));

  if (rows.length === 0) {
    const fallbackKey = symbol === 'XU100.IS' ? 'bist100' : symbol === 'BTC-USD' ? 'bitcoin' : null;
    const existing = fallbackKey ? getExistingSeries(fallbackKey) : [];

    if (existing.length > 0) {
      console.warn(`${symbol} için Yahoo Finance verisi alınamadı; mevcut ${fallbackKey} serisi korundu.`);
      return existing;
    }

    throw new Error(`${symbol} için Yahoo Finance verisi alınamadı.`);
  }

  return dedupeByMonth(rows);
}

function deriveBitcoinTry(btcUsd, usdTryRows) {
  const usdTry = new Map(usdTryRows.map((item) => [item.date.slice(0, 7), item.value]));

  return btcUsd
    .map((item) => {
      const rate = usdTry.get(item.date.slice(0, 7));
      return rate ? { date: item.date, value: round(item.value * rate, 6) } : null;
    })
    .filter(Boolean);
}

async function fetchHousingIndex() {
  const evdsRows = await fetchEvdsMonthlySeries('TP.KFE.TR');

  if (evdsRows.length > 0) {
    return evdsRows;
  }

  const html = await fetchText('https://altinla.com/tr/konut/fiyat-endeksi', { optional: true });
  const rows = [...html.matchAll(/\{\\"date\\":\\"(\d{4}-\d{2}-\d{2})\\",\\"value\\":([0-9.]+)\}/g)]
    .map((match) => ({ date: match[1], value: Number(match[2]) }))
    .filter((item) => item.date >= `${startYear}-01-01` && item.date <= `${end}-01` && Number.isFinite(item.value));
  rows.push(
    ...[...html.matchAll(/\{"date":"(\d{4}-\d{2}-\d{2})","value":([0-9.]+)\}/g)]
      .map((match) => ({ date: match[1], value: Number(match[2]) }))
      .filter((item) => item.date >= `${startYear}-01-01` && item.date <= `${end}-01` && Number.isFinite(item.value)),
  );

  if (rows.length === 0) {
    const existing = getExistingSeries('housing');

    if (existing.length > 0) {
      console.warn('Konut fiyat endeksi kaynağından veri alınamadı; mevcut konut serisi korundu.');
      return existing;
    }

    throw new Error('Konut fiyat endeksi serisi çıkarılamadı.');
  }

  return dedupeByMonth(rows).map((item) => ({ date: item.date, value: round(item.value, 6) }));
}

async function fetchGasolineIndex() {
  const configuredUrl = process.env.GASOLINE_CSV_URL;

  if (configuredUrl) {
    const csv = await fetchText(configuredUrl);
    return parseCsv(csv)
      .slice(1)
      .map(([date, value]) => ({ date: normalizeDate(date), value: parseTrNumber(value) }))
      .filter((item) => item.date && item.date >= `${startYear}-01-01` && item.date <= `${end}-01` && Number.isFinite(item.value))
      .map((item) => ({ date: item.date, value: round(item.value, 6) }));
  }

  try {
    const csv = await fetchText('https://fred.stlouisfed.org/graph/fredgraph.csv?id=CP0722TRM086NEST');
    return parseCsv(csv)
      .slice(1)
      .map(([date, value]) => ({ date: normalizeDate(date), value: Number(value) }))
      .filter((item) => item.date && item.date >= `${startYear}-01-01` && item.date <= `${end}-01` && Number.isFinite(item.value))
      .map((item) => ({ date: item.date, value: round(item.value, 6) }));
  } catch (error) {
    console.warn(`Benzin/yakıt endeksi alınamadı: ${error.message}`);
    return [];
  }
}

async function fetchDepositIndex() {
  const apiKey = process.env.EVDS_API_KEY;
  const seriesCode = process.env.EVDS_DEPOSIT_SERIES;

  if (!apiKey || !seriesCode) {
    console.warn('EVDS_API_KEY veya EVDS_DEPOSIT_SERIES yok; mevduat serisi atlandı.');
    return [];
  }

  const startDate = `01-01-${startYear}`;
  const endDate = `28-${end.slice(5, 7)}-${end.slice(0, 4)}`;
  const url = `https://evds2.tcmb.gov.tr/service/evds/series=${encodeURIComponent(seriesCode)}&startDate=${startDate}&endDate=${endDate}&type=json&key=${encodeURIComponent(apiKey)}`;
  const payload = JSON.parse(await fetchText(url));
  const rows = (payload.items ?? [])
    .map((item) => {
      const date = normalizeDate(item.Tarih ?? item.tarih ?? item.DATE);
      const rawValue = item[seriesCode] ?? item[seriesCode.replace(/\./g, '_')];
      return { date, rate: parseTrNumber(String(rawValue ?? '')) };
    })
    .filter((item) => item.date && Number.isFinite(item.rate))
    .sort((first, second) => first.date.localeCompare(second.date));

  let index = 1;
  return rows.map((item) => {
    index *= 1 + item.rate / 100 / 12;
    return { date: item.date, value: round(index, 8) };
  });
}

async function fetchEvdsMonthlySeries(seriesCode) {
  const apiKey = process.env.EVDS_API_KEY;

  if (!apiKey) {
    console.warn(`EVDS_API_KEY yok; ${seriesCode} serisi EVDS'den alÄ±namadÄ±.`);
    return [];
  }

  const startDate = `01-01-${startYear}`;
  const endDate = `28-${end.slice(5, 7)}-${end.slice(0, 4)}`;
  const url = `https://evds2.tcmb.gov.tr/service/evds/series=${encodeURIComponent(seriesCode)}&startDate=${startDate}&endDate=${endDate}&type=json&key=${encodeURIComponent(apiKey)}`;
  const text = await fetchText(url, { optional: true });

  if (!text) {
    return [];
  }

  const payload = JSON.parse(text);
  const rows = (payload.items ?? [])
    .map((item) => {
      const date = normalizeDate(item.Tarih ?? item.tarih ?? item.DATE);
      const rawValue = item[seriesCode] ?? item[seriesCode.replace(/\./g, '_')];
      return { date, value: parseTrNumber(String(rawValue ?? '')) };
    })
    .filter((item) => item.date && item.date >= `${startYear}-01-01` && item.date <= `${end}-01` && Number.isFinite(item.value))
    .sort((first, second) => first.date.localeCompare(second.date));

  return dedupeByMonth(rows).map((item) => ({ date: item.date, value: round(item.value, 6) }));
}

async function fetchMinimumWage() {
  const html = await fetchText('https://www.ocalhukuk.com/yillara-gore-net-ve-brut-asgari-ucret-tablosu/', {
    optional: true,
  });
  const rows = [...html.matchAll(/<tr[^>]*>\s*<td[^>]*>([^<]+)<\/td>\s*<td[^>]*>([^<]+)<\/td>/g)]
    .flatMap((match) => {
      const [start, endDate] = match[1].split('-').map((part) => part.trim());
      const value = parseTrNumber(match[2]);
      const startMonth = toMonth(start);
      const endMonth = toMonth(endDate);

      if (!startMonth || !endMonth || !Number.isFinite(value)) {
        return [];
      }

      return listMonths(startMonth, endMonth).map((month) => ({
        date: `${month}-01`,
        value,
      }));
    })
    .filter((item) => item.date >= `${startYear}-01-01` && item.date <= `${end}-01`)
    .sort((first, second) => first.date.localeCompare(second.date));

  if (rows.length === 0) {
    const existing = getExistingSeries('minimumWage');

    if (existing.length > 0) {
      console.warn('Asgari ücret kaynağından veri alınamadı; mevcut veri dosyasındaki asgari ücret serisi korundu.');
      return existing;
    }

    throw new Error('Asgari ücret tablosundan veri çıkarılamadı.');
  }

  return rows;
}

function deriveGramTry(usdPerOunce, usdTry) {
  const usdTryByMonth = new Map(usdTry.map((item) => [item.date.slice(0, 7), item.value]));

  return usdPerOunce
    .map((item) => {
      const rate = usdTryByMonth.get(item.date.slice(0, 7));
      return rate
        ? {
            date: item.date,
            value: round((item.value * rate) / troyOunceGram, 6),
          }
        : null;
    })
    .filter(Boolean);
}

async function fetchText(url, options = {}) {
  let response;

  try {
    response = await fetch(url, {
      headers: {
        'user-agent': 'nekadarederdi-data-updater/1.0',
      },
    });
  } catch (error) {
    if (options.optional) {
      console.warn(`${url} atlandı: ${error.message}`);
      return '';
    }

    throw error;
  }

  if (options.allow404 && response.status === 404) {
    return '';
  }

  if (!response.ok) {
    if (options.optional) {
      console.warn(`${url} atlandı: ${response.status}`);
      return '';
    }

    throw new Error(`${url} isteği başarısız: ${response.status}`);
  }

  return response.text();
}

function getExistingSeries(key) {
  return (
    catalog.series
      .find((series) => series.key === key)
      ?.observations?.filter((item) => item.date >= `${startYear}-01-01` && item.date <= `${end}-01`) ?? []
  );
}

async function runLimited(tasks, limit) {
  const results = [];
  let cursor = 0;

  async function worker() {
    while (cursor < tasks.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await tasks[index]();
    }
  }

  await Promise.all(Array.from({ length: limit }, () => worker()));
  return results;
}

function listMonths(startMonth, endMonth) {
  const [startYearPart, startMonthPart] = startMonth.split('-').map(Number);
  const [endYearPart, endMonthPart] = endMonth.split('-').map(Number);
  const result = [];
  let year = startYearPart;
  let month = startMonthPart;

  while (year < endYearPart || (year === endYearPart && month <= endMonthPart)) {
    result.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;

    if (month === 13) {
      year += 1;
      month = 1;
    }
  }

  return result;
}

function toMonth(value) {
  const parts = value?.match(/(\d{2})[./](\d{2})[./](\d{4})/);
  return parts ? `${parts[3]}-${parts[2]}` : null;
}

function normalizeDate(value) {
  if (!value) {
    return null;
  }

  const raw = String(value).trim();
  const iso = raw.match(/^(\d{4})-(\d{2})(?:-(\d{2}))?$/);

  if (iso) {
    return `${iso[1]}-${iso[2]}-01`;
  }

  const tr = raw.match(/^(\d{2})[./](\d{2})[./](\d{4})$/);

  if (tr) {
    return `${tr[3]}-${tr[2]}-01`;
  }

  return null;
}

function toTurkishMonth(value) {
  const months = {
    Ocak: '01',
    Şubat: '02',
    Mart: '03',
    Nisan: '04',
    Mayıs: '05',
    Haziran: '06',
    Temmuz: '07',
    Ağustos: '08',
    Eylül: '09',
    Ekim: '10',
    Kasım: '11',
    Aralık: '12',
  };
  const match = value.trim().match(/^(\S+)\s+(\d{4})$/);

  if (!match || !months[match[1]]) {
    return null;
  }

  return `${match[2]}-${months[match[1]]}-01`;
}

function parseTrNumber(value) {
  const trimmed = value.trim();

  if (!trimmed) {
    return Number.NaN;
  }

  if (trimmed.includes(',')) {
    return Number(trimmed.replace(/\./g, '').replace(',', '.'));
  }

  return Number(trimmed);
}

function average(values) {
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function round(value, digits) {
  return Number(value.toFixed(digits));
}

function dedupeByMonth(rows) {
  return [
    ...new Map(
      rows
        .filter((item) => item.date && Number.isFinite(item.value))
        .sort((first, second) => first.date.localeCompare(second.date))
        .map((item) => [item.date.slice(0, 7), { date: `${item.date.slice(0, 7)}-01`, value: item.value }]),
    ).values(),
  ];
}

function parseCsv(csv) {
  return csv
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(',').map((cell) => cell.trim()));
}
