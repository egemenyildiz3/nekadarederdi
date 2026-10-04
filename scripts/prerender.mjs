import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const root = resolve(import.meta.dirname, '..');
const { render, PAGES, CONTENT_UPDATED, catalog } = await import(pathToFileURL(resolve(root, 'frontend/.prerender/prerender.js')));
const dist = resolve(root, 'frontend/dist');
const template = await readFile(resolve(dist, 'index.html'), 'utf8');
if (!template.includes('<!--app-html-->')) throw new Error('Missing prerender placeholder');
const escape = value => value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
for (const [path, page] of Object.entries({ ...PAGES, '/404': { title: 'Sayfa bulunamadı | Ne Kadar Ederdi?', description: 'Aradığınız sayfa bulunamadı.' } })) {
  const canonical = `https://nekadarederdi.com${path === '/404' ? '/' : path}`;
  const html = template.replace('<!--app-html-->', () => render(path))
    .replace(/<title>.*?<\/title>/s, `<title>${escape(page.title)}</title>`)
    .replace(/(<meta\s+(?:name|property)="(?:description|og:description|twitter:description)"\s+content=")[^"]*/g, `$1${escape(page.description)}`)
    .replace(/(<meta\s+(?:name|property)="(?:og:title|twitter:title)"\s+content=")[^"]*/g, `$1${escape(page.title)}`)
    .replace(/(<link rel="canonical" href=")[^"]*/, `$1${canonical}`)
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${canonical}`)
    .replace('index, follow, max-image-preview:large', path === '/404' ? 'noindex, follow' : 'index, follow, max-image-preview:large');
  const file = resolve(dist, path === '/' ? 'index.html' : path === '/404' ? '404.html' : `${path.slice(1)}/index.html`);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, html);
}
const dataModified = catalog.updatedAt > CONTENT_UPDATED ? catalog.updatedAt : CONTENT_UPDATED;
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${Object.keys(PAGES).map(path => `  <url><loc>https://nekadarederdi.com${path}</loc><lastmod>${['/', '/veri-durumu', '/veri-kaynaklari'].includes(path) || path.startsWith('/atlas/') ? dataModified : CONTENT_UPDATED}</lastmod></url>`).join('\n')}\n</urlset>\n`;
await writeFile(resolve(dist, 'sitemap.xml'), sitemap);
console.log(`Pre-rendered ${Object.keys(PAGES).length} complete pages, 404 and sitemap from the same React content.`);
