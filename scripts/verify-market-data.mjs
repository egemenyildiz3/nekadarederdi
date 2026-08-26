import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const catalog = JSON.parse(await readFile(resolve('data', 'market-series.json'), 'utf8'));
const referenceMonth = process.env.DATA_VERIFY_END_MONTH ?? new Date().toISOString().slice(0, 7);

const requiredSeries = {
  cpi: { maxLagMonths: 1 },
  usd: { maxLagMonths: 0 },
  eur: { maxLagMonths: 0 },
  gold: { maxLagMonths: 1 },
  minimumWage: { maxLagMonths: 0 },
  silver: { maxLagMonths: 1 },
  bist100: { maxLagMonths: 0 },
  bitcoin: { maxLagMonths: 0 },
  housing: { maxLagMonths: 1 },
  gasoline: { maxLagMonths: 1 },
};

const optionalSeries = {
  deposit: { maxLagMonths: 1 },
};

const errors = [];

for (const [key, rule] of Object.entries(requiredSeries)) {
  verifySeries(key, rule, true);
}

for (const [key, rule] of Object.entries(optionalSeries)) {
  verifySeries(key, rule, false);
}

if (errors.length > 0) {
  console.error('Market data verification failed:');
  for (const error of errors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

console.log(`Market data verification passed for ${referenceMonth}.`);

function verifySeries(key, rule, required) {
  const series = catalog.series.find((item) => item.key === key);

  if (!series) {
    if (required) {
      errors.push(`${key}: seri bulunamadi.`);
    }
    return;
  }

  const observations = [...(series.observations ?? [])]
    .filter((item) => item.date && Number.isFinite(item.value))
    .sort((first, second) => first.date.localeCompare(second.date));

  if (observations.length === 0) {
    errors.push(`${key}: gecerli gozlem yok.`);
    return;
  }

  const firstMonth = observations[0].date.slice(0, 7);
  const lastMonth = observations.at(-1).date.slice(0, 7);
  const lag = monthDistance(lastMonth, referenceMonth);

  if (lag > rule.maxLagMonths) {
    errors.push(`${key}: son veri ${lastMonth}; ${referenceMonth} icin izin verilen gecikme ${rule.maxLagMonths} ay, mevcut gecikme ${lag} ay.`);
  }

  const availableMonths = new Set(observations.map((item) => item.date.slice(0, 7)));
  const missingMonths = listMonths(firstMonth, lastMonth).filter((month) => !availableMonths.has(month));

  if (missingMonths.length > 0) {
    const sample = missingMonths.slice(0, 8).join(', ');
    const suffix = missingMonths.length > 8 ? ` ve ${missingMonths.length - 8} ay daha` : '';
    errors.push(`${key}: seri icinde eksik ay var: ${sample}${suffix}.`);
  }
}

function monthDistance(fromMonth, toMonth) {
  const [fromYear, fromMonthNumber] = fromMonth.split('-').map(Number);
  const [toYear, toMonthNumber] = toMonth.split('-').map(Number);
  return (toYear - fromYear) * 12 + (toMonthNumber - fromMonthNumber);
}

function listMonths(startMonth, endMonth) {
  const [startYear, startMonthNumber] = startMonth.split('-').map(Number);
  const [endYear, endMonthNumber] = endMonth.split('-').map(Number);
  const result = [];
  let year = startYear;
  let month = startMonthNumber;

  while (year < endYear || (year === endYear && month <= endMonthNumber)) {
    result.push(`${year}-${String(month).padStart(2, '0')}`);
    month += 1;

    if (month === 13) {
      year += 1;
      month = 1;
    }
  }

  return result;
}
