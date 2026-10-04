import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { verifyCatalog } from './verify-market-data.mjs';

const catalog = JSON.parse(await readFile(new URL('../data/market-series.json', import.meta.url), 'utf8'));
const referenceMonth = new Date().toISOString().slice(0, 7);
const futureMonth = `${Number(referenceMonth.slice(0, 4)) + 1}-01`;
const options = { referenceMonth, checkFreshness: false };
assert.deepEqual(verifyCatalog(catalog, options), []);
function rejects(mutate, pattern) {
  const copy = structuredClone(catalog);
  mutate(copy);
  assert.match(verifyCatalog(copy, options).join('\n'), pattern);
}
rejects((copy) => { copy.series[0].observations[0].value = 0; }, /nonpositive/);
rejects((copy) => { copy.series[0].observations[0].value = null; }, /invalid value/);
rejects((copy) => { copy.series[0].observations[0].date = '2005-13-01'; }, /invalid monthly date/);
rejects((copy) => { copy.series[0].observations.splice(1, 1); }, /missing months/);
rejects((copy) => { copy.series[0].observations[1] = copy.series[0].observations[0]; }, /duplicate or unordered/);
rejects((copy) => { copy.series[0].observations.push({ date: `${futureMonth}-01`, value: 1 }); }, /future observation/);
rejects((copy) => { copy.series.pop(); }, /required series missing/);
rejects((copy) => { copy.series.push(copy.series[0]); }, /duplicate series/);
assert.ok(verifyCatalog(catalog, { referenceMonth: futureMonth }).some((error) => error.includes('latest data')));
console.log('Market data integrity regression tests passed.');

// Execute the updater's real functions with network doubles, without its write entrypoint.
const { runInNewContext } = await import('node:vm');
const updater = await readFile(new URL('./update-market-data.mjs', import.meta.url), 'utf8');
function updaterContext(fetch) {
  const context = { catalog: structuredClone(catalog), startYear: 2005, end: '2026-09',
    troyOunceGram: 31.1034768, process: { env: {} }, fetch, AbortSignal,
    console: { warn() {}, log() {} } };
  runInNewContext(updater.slice(updater.indexOf('function setSeries(')), context);
  return context;
}
const emptyYahoo = updaterContext(async () => ({ ok: true, text: async () => JSON.stringify({ chart: { result: [] } }) }));
assert.equal(await emptyYahoo.fetchYahooMonthly('BTC-USD', '2014-09'), null, 'TRY fallback must not be converted from USD twice');
assert.deepEqual(JSON.parse(JSON.stringify(await emptyYahoo.fetchYahooMonthly('XU100.IS', '2005-01'))), catalog.series.find((s) => s.key === 'bist100').observations);
const nullYahoo = updaterContext(async () => ({ ok: true, text: async () => JSON.stringify({ chart: { result: [{ timestamp: [Date.parse('2026-09-01') / 1000], indicators: { quote: [{ close: [null] }] } }] } }) }));
assert.equal(await nullYahoo.fetchYahooMonthly('BTC-USD', '2014-09'), null);
const failedYahoo = updaterContext(async () => ({ ok: false, status: 403 }));
assert.equal(await failedYahoo.fetchYahooMonthly('BTC-USD', '2014-09'), null);
assert.throws(() => emptyYahoo.setSeries('gold', { observations: [] }), /empty source/);
assert.throws(() => emptyYahoo.setSeries('gold', { observations: [{ date: '2026-09-01', value: 1 }] }), /lost existing months/);
const cpiTruncated = updaterContext(async (url) => url.includes('oska')
  ? { ok: false, status: 403 }
  : { ok: true, text: async () => '<tr><td>2026</td><td>3866.74</td></tr>' });
assert.deepEqual(JSON.parse(JSON.stringify(await cpiTruncated.fetchCpi())), catalog.series.find((s) => s.key === 'cpi').observations, '403 plus truncated CPI must preserve the whole snapshot');
const cpiRebased = updaterContext(async (url) => ({ ok: true, text: async () => url.includes('oska')
  ? '<td><strong>Ocak 2026</strong></td><td>100</td>'
  : '<tr><td>2026</td><td>3866.74</td></tr>' }));
await assert.rejects(() => cpiRebased.fetchCpi(), /index basis/);
const badTcmb = updaterContext(async () => ({ ok: true, text: async () => '<invalid/>' }));
await assert.rejects(() => badTcmb.fetchRateDay(2026, 9, 1), /valid positive USD and EUR/);
console.log('Updater fallback, truncated-source and index-basis regression tests passed.');
