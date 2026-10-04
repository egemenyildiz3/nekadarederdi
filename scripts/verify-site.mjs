import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const base = process.env.SITE_URL ?? 'http://localhost:8787';
const origin = 'https://nekadarederdi.com';
const sitemap = await fetch(`${base}/sitemap.xml`).then(response => response.text());
const paths = [...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(match => new URL(match[1]).pathname);
assert.ok(paths.length >= 10 && paths.length < 20);
const documents = new Map();
for (const path of paths) {
  const response = await fetch(`${base}${path}`);
  assert.equal(response.status, 200, path);
  const html = await response.text(); documents.set(path, html);
  assert.equal((html.match(/<h1[ >]/g) ?? []).length, 1, `${path}: exactly one H1`);
  assert.ok(html.includes(`rel="canonical" href="${origin}${path}"`), `${path}: canonical`);
  assert.ok(html.includes('<footer'), `${path}: complete server-rendered navigation`);
  assert.ok(!html.includes('<!--app-html-->'), `${path}: prerender completed`);
  if (base === origin) {
    assert.ok(html.includes('content="index, follow'), `${path}: indexable`);
    assert.ok(!response.headers.get('x-robots-tag')?.includes('noindex'), `${path}: header indexable`);
  }
}
assert.ok(documents.get('/iletisim').includes('mailto:egemenyildiz03@gmail.com'));
assert.ok(documents.get('/veri-kaynaklari').includes('fred.stlouisfed.org'));
assert.ok(documents.get('/').includes('Hesabın adımları'));
for (const path of ['/index.html', '/rehberler/index.html']) {
  const response = await fetch(`${base}${path}`, { redirect: 'manual' });
  assert.equal(response.status, 301, `${path}: no duplicate HTML URL`);
}
const links = new Set([...documents.values()].flatMap(html => [...html.matchAll(/href="(\/[^"]*)"/g)].map(match => match[1].replaceAll('&amp;', '&'))));
for (const link of links) {
  const path = new URL(link, base).pathname;
  if (documents.has(path)) continue;
  const response = await fetch(new URL(link, base));
  assert.equal(response.status, 200, `Broken internal link: ${link}`);
}
const deployedCatalog = await fetch(`${base}/api/series`).then(response => response.json());
assert.deepEqual(deployedCatalog, JSON.parse(await readFile('data/market-series.json', 'utf8')), 'Deployed catalog matches the tested snapshot');
if (base === origin) {
  const localHtml = await readFile('frontend/dist/index.html', 'utf8');
  // Deployment injects its analytics token, so the JS bundle hash differs from a local build.
  const root = html => html.match(/<div id="root">([\s\S]*)<\/div>/)[1];
  assert.equal(root(documents.get('/')), root(localHtml), 'Production serves the tested prerendered content');
}
for (const [old, target] of [['/enflasyon-hesaplama', '/'], ['/veri-defteri/tufe', '/veri-kaynaklari#cpi'], ['/guncellemeler/2026-09', '/veri-durumu'], ['/rehberler/2010daki-1000-tl-bugun-ne-kadar', '/atlas/2010daki-1000-tl-bugun-ne-anlatiyor']]) {
  const response = await fetch(`${base}${old}`, { redirect: 'manual' });
  assert.equal(response.status, 301, old);
  assert.equal(response.headers.get('location'), `${base}${target}`);
}
const absent = await fetch(`${base}/this-page-does-not-exist`);
assert.equal(absent.status, 404);
assert.ok((await absent.text()).includes('Sayfa bulunamadı'));
const request = { amount: 1000, inputUnit: 'try', startMonth: '2020-01', endMonth: '2024-01', criteria: ['cpi', 'usd'] };
const calculate = payload => fetch(`${base}/api/calculate`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
const success = await calculate(request);
assert.equal(success.status, 200);
assert.equal((await success.json()).results.length, 2);
const missing = await calculate({ ...request, startMonth: '2000-01' });
assert.equal(missing.status, 400);
assert.match((await missing.json()).error, /veri yok/);
console.log(`Verified ${paths.length} complete pages, canonical metadata, sitemap, redirects, 404 and calculation API at ${base}`);
