# Ne Kadar Ederdi?

Gecmisteki ya da bugunku bir tutari TUFE, doviz, altin, gumus, asgari ucret, BIST 100, Bitcoin, konut ve yakit verileriyle ay bazinda karsilastiran web araci.

## Mimari

Tek backend Cloudflare Worker'dir.

- Frontend: `frontend/` React + Vite
- Backend/API: `worker/src/index.ts`
- Veri dosyasi: `data/market-series.json`
- Veri guncelleme: `scripts/update-market-data.mjs`

Eski ASP.NET backend ve Docker Compose akisi kaldirildi.

## Komutlar

```bash
npm install
npm run check
npm run cf:dev
npm run cf:deploy
```

`npm run cf:dev` frontend'i build eder ve Worker ile birlikte lokal calistirir.

Sadece frontend hot reload icin iki terminal ac:

```bash
npm run dev:worker
npm run dev:frontend
```

Frontend dev server `http://localhost:7573`, API isteklerini Worker dev server'a `http://localhost:8787` uzerinden proxyler.

## Veri Guncelleme

```bash
npm run data:update
```

GitHub Actions haftalik veri gunceller ve `data/market-series.json` degisirse commit atar.

Opsiyonel secret'lar:

- `EVDS_API_KEY`
- `EVDS_DEPOSIT_SERIES`
- `GASOLINE_CSV_URL`
