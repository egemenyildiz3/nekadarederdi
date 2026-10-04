import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { build } from 'esbuild';

const bundled = await build({ entryPoints: ['shared/calculation.ts'], bundle: true, write: false, format: 'esm', platform: 'node' });
const { calculate, latestCommonMonth } = await import(`data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].text).toString('base64')}`);
const catalog = JSON.parse(await readFile('data/market-series.json', 'utf8'));
const request = { amount: 1000, inputUnit: 'try', startMonth: '2020-01', endMonth: '2024-01', criteria: ['cpi', 'usd'] };
const rows = calculate(catalog, request);
const cpi = catalog.series.find(series => series.key === 'cpi');
const value = month => cpi.observations.find(row => row.date.startsWith(month)).value;
assert.equal(rows[0].resultAmount, 1000 * (value('2024-01') / value('2020-01')));
assert.equal(calculate(catalog, { ...request, endMonth: request.startMonth })[0].resultAmount, 1000);
const reverse = calculate(catalog, { ...request, startMonth: request.endMonth, endMonth: request.startMonth })[0];
assert.ok(Math.abs(reverse.multiplier * rows[0].multiplier - 1) < 1e-12);
const dollars = calculate(catalog, { ...request, inputUnit: 'usd' });
const usdStart = catalog.series.find(series => series.key === 'usd').observations.find(row => row.date.startsWith('2020-01')).value;
assert.equal(dollars[0].normalizedAmount, 1000 * usdStart);
for (const patch of [{ startMonth: '2000-01' }, { endMonth: '2099-12' }, { startMonth: '2020-13' }, { amount: -1 }, { amount: Infinity }, { amount: 1e12 }, { criteria: [] }, { criteria: ['unknown'] }, { criteria: 'cpi' }, { inputUnit: 'btc' }, { startMonth: '2010-01', criteria: ['bitcoin'] }]) {
  assert.throws(() => calculate(catalog, { ...request, ...patch }), JSON.stringify(patch));
}
assert.throws(() => calculate(catalog, null));
const gap = structuredClone(catalog);
gap.series.find(series => series.key === 'cpi').observations = cpi.observations.filter(row => !row.date.startsWith('2024-01'));
assert.throws(() => calculate(gap, request), /2024-01 için veri yok/);
const common = latestCommonMonth(catalog, ['cpi', 'usd', 'gold', 'minimumWage']);
assert.ok(common);
assert.equal(latestCommonMonth(catalog, ['missing']), null);
for (const key of ['cpi', 'usd', 'gold', 'minimumWage']) assert.ok(catalog.series.find(series => series.key === key).observations.some(row => row.date.startsWith(common)));
console.log('Calculation tests passed: ratios, reverse/same month, input conversion, missing data, invalid requests and common month.');
