import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const rules = {
  cpi: { maxLagMonths: 2 },
  usd: { maxLagMonths: 1 },
  eur: { maxLagMonths: 1 },
  gold: { maxLagMonths: 2 },
  minimumWage: { maxLagMonths: 1 },
  silver: { maxLagMonths: 2 },
  bist100: { maxLagMonths: 1 },
  bitcoin: { maxLagMonths: 1 },
  housing: { maxLagMonths: 3, allowMissingMonths: true },
  gasoline: { maxLagMonths: 2 },
};
const monthPattern = /^\d{4}-(0[1-9]|1[0-2])$/;

// Freshness is separate from integrity: a historical snapshot can be valid but stale.
export function verifyCatalog(catalog, { referenceMonth = new Date().toISOString().slice(0, 7), checkFreshness = true } = {}) {
  const errors = [];
  if (!monthPattern.test(referenceMonth)) return ['Invalid reference month.'];
  if (!Array.isArray(catalog.series)) return ['Catalog has no series array.'];
  const keys = new Set();
  for (const series of catalog.series) {
    if (keys.has(series.key)) errors.push(`${series.key}: duplicate series.`);
    keys.add(series.key);
    const observations = series.observations;
    if (!Array.isArray(observations) || !observations.length) {
      errors.push(`${series.key}: no observations.`);
      continue;
    }
    let previousMonth;
    for (const item of observations) {
      const month = typeof item.date === 'string' ? item.date.slice(0, 7) : '';
      if (!monthPattern.test(month) || item.date !== `${month}-01`) {
        errors.push(`${series.key}: invalid monthly date ${item.date}.`);
        continue;
      }
      if (!Number.isFinite(item.value) || item.value <= 0) errors.push(`${series.key}: nonpositive or invalid value at ${month}.`);
      if (month > referenceMonth) errors.push(`${series.key}: future observation ${month}.`);
      if (previousMonth && month <= previousMonth) errors.push(`${series.key}: duplicate or unordered month ${month}.`);
      if (previousMonth && monthDistance(previousMonth, month) > 1 && !rules[series.key]?.allowMissingMonths) {
        errors.push(`${series.key}: missing months between ${previousMonth} and ${month}.`);
      }
      previousMonth = month;
    }
    const lastMonth = observations.at(-1)?.date?.slice(0, 7);
    const rule = rules[series.key] ?? { maxLagMonths: 2 };
    if (checkFreshness && monthPattern.test(lastMonth) && monthDistance(lastMonth, referenceMonth) > rule.maxLagMonths) {
      errors.push(`${series.key}: latest data ${lastMonth}; reference ${referenceMonth}, maximum lag ${rule.maxLagMonths} months.`);
    }
  }
  for (const key of Object.keys(rules)) if (!keys.has(key)) errors.push(`${key}: required series missing.`);
  return errors;
}

function monthDistance(fromMonth, toMonth) {
  const [fromYear, fromNumber] = fromMonth.split('-').map(Number);
  const [toYear, toNumber] = toMonth.split('-').map(Number);
  return (toYear - fromYear) * 12 + toNumber - fromNumber;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const catalog = JSON.parse(await readFile(resolve('data', 'market-series.json'), 'utf8'));
  const referenceMonth = process.env.DATA_VERIFY_END_MONTH ?? new Date().toISOString().slice(0, 7);
  const errors = verifyCatalog(catalog, { referenceMonth, checkFreshness: !process.argv.includes('--integrity-only') });
  if (errors.length) {
    console.error(`Market data verification failed:\n${errors.map((error) => `- ${error}`).join('\n')}`);
    process.exitCode = 1;
  } else {
    console.log(`Market data ${process.argv.includes('--integrity-only') ? 'integrity' : 'verification'} passed for ${referenceMonth}.`);
  }
}
