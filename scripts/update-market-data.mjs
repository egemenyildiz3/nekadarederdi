import { readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '..');
const dataPath = resolve(root, 'backend', 'Data', 'market-series.json');
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
  minimumWage: 'Ocal Hukuk dönemsel asgari ücret tablosu; Resmi Gazete referanslı net ücret satırları',
};

const catalog = JSON.parse(await readFile(dataPath, 'utf8'));
const [cpi, rates, goldUsd, silverUsd, minimumWage] = await Promise.all([
  fetchCpi(),
  fetchTcmbRates(),
  fetchGoldUsd(),
  fetchSilverUsd(),
  fetchMinimumWage(),
]);

setSeries('tl', {
  name: 'Sabit TL',
  shortName: 'TL',
  description: 'Tutarın endeks, kur ya da varlık fiyatına bağlanmadan aynı TL değeriyle kalan hali.',
  unit: 'TL',
  sourceNote: 'Sabit TL referans serisi. Satın alma gücü ya da yatırım getirisi içermez.',
  observations: rates.usd.map((item) => ({ date: item.date, value: 1 })),
});
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
    fetchText('https://www.hakedis.org/endeksler/tuketici-fiyat-genel-endeksi-ve-degisim-oranlari-2003'),
    fetchText('https://www.oska.com.tr/tufe-ve-yi-ufe-endeksleri/'),
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
      byMonth.set(date.slice(0, 7), value);
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

async function fetchMinimumWage() {
  const html = await fetchText('https://www.ocalhukuk.com/yillara-gore-net-ve-brut-asgari-ucret-tablosu/');
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
  const response = await fetch(url, {
    headers: {
      'user-agent': 'nekadarederdi-data-updater/1.0',
    },
  });

  if (options.allow404 && response.status === 404) {
    return '';
  }

  if (!response.ok) {
    throw new Error(`${url} isteği başarısız: ${response.status}`);
  }

  return response.text();
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

function parseCsv(csv) {
  return csv
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split(',').map((cell) => cell.trim()));
}
