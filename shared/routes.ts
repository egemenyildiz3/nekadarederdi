import { LANDING_PAGES, INFO_PAGES, GUIDE_PAGES, PUBLISHER_PAGES } from './content';

export const REDIRECTS: Record<string, string> = {
  ...Object.fromEntries(LANDING_PAGES.map(page => [page.path, '/'])),
  '/rehberler/2010daki-1000-tl-bugun-ne-kadar': '/atlas/2010daki-1000-tl-bugun-ne-anlatiyor',
  '/veri-defteri': '/veri-kaynaklari',
  '/veri-defteri/tufe': '/veri-kaynaklari#cpi',
  '/veri-defteri/dolar': '/veri-kaynaklari#usd',
  '/veri-defteri/gram-altin': '/veri-kaynaklari#gold',
  '/veri-defteri/asgari-ucret': '/veri-kaynaklari#minimumWage',
  '/guncellemeler': '/veri-durumu',
  '/guncellemeler/2026-08': '/veri-durumu',
  '/guncellemeler/2026-09': '/veri-durumu',
};

export const ACTIVE_GUIDES = GUIDE_PAGES.filter(page => !REDIRECTS[page.path]);
export const ACTIVE_ARTICLES = PUBLISHER_PAGES.filter(page => !REDIRECTS[page.path]);
export const PAGES: Record<string, { title: string; description: string }> = {
  '/': { title: 'Ne Kadar Ederdi? | Geçmiş Para Değeri ve Enflasyon Hesaplama', description: 'Geçmişteki tutarları TÜFE, döviz, altın ve asgari ücretle karşılaştırın. Kullanılan ayları, kaynakları ve hesabın adımlarını inceleyin.' },
  '/rehberler': { title: 'Para Değeri Rehberleri | Ne Kadar Ederdi?', description: 'Enflasyon, döviz, altın ve ücret karşılaştırmalarını örnek hesaplarla okuyun.' },
  '/atlas': { title: 'Para Değeri Atlası | Ne Kadar Ederdi?', description: 'Eski maaşları ve geçmiş tutarları aynı dönemin verileriyle karşılaştıran açıklamalı hesaplar.' },
  '/veri-durumu': { title: 'Veri Durumu ve Kapsam | Ne Kadar Ederdi?', description: 'Hesaplamada kullanılan her serinin başlangıcı, son gözlemi, eksik ayları ve veri dosyasının tarihi.' },
  ...Object.fromEntries([...INFO_PAGES, ...ACTIVE_GUIDES, ...ACTIVE_ARTICLES].map(page => [page.path, { title: page.metaTitle, description: page.description }])),
};

export const CONTENT_UPDATED = '2026-10-04';
