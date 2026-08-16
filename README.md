# Ne Kadar Ederdi?

Geçmişteki ya da bugünkü bir TL tutarını TÜFE, döviz, altın, gümüş ve asgari ücretle kıyaslayan web aracı.

## Lokal Geliştirme

Backend:

```bash
npm run dev:backend
```

Frontend:

```bash
npm run dev:frontend
```

Adresler:

```text
Frontend: http://localhost:7573
Backend:  http://localhost:7400
```

## Build

```bash
npm run build
```

## Docker

```bash
docker compose up -d --build
```

Adres:

```text
http://localhost:7180
```

## Gerçek Veriyi Güncelle

```bash
npm run data:update
```

Bu komut `backend/Data/market-series.json` dosyasını günceller.

## Cloudflare

Cloudflare sürümünde tek Worker hem frontend dosyalarını hem `/api` endpointlerini servis eder.

İlk giriş:

```bash
npx wrangler login
```

Local Cloudflare testi:

```bash
npm run cf:dev
```

Adres:

```text
http://127.0.0.1:8787
```

Deploy:

```bash
npm run cf:deploy
```

## GitHub CI/CD

Push ve pull request kontrolleri:

```text
.github/workflows/deploy-cloudflare.yml
```

Workflow şunları yapar:

```text
npm audit --omit=dev
Worker TypeScript kontrolü
ASP.NET backend build
React frontend build
main branch push ise Cloudflare deploy
```

GitHub repo secrets:

```text
CLOUDFLARE_ACCOUNT_ID = cd4dca0755176b5015a23e6d3c60f683
CLOUDFLARE_API_TOKEN  = Cloudflare API token
```

Token için Cloudflare'da `Edit Cloudflare Workers` yetkili API token oluştur.

Deploy sonrası Wrangler bir `*.workers.dev` adresi verir.

Domain bağlama:

```text
Cloudflare Dashboard
Workers & Pages
nekadarederdi Worker
Settings
Domains & Routes
Add Custom Domain
```

Önerilen domain:

```text
nekadarederdi.net
```

API aynı domain altında çalışır:

```text
https://nekadarederdi.net/api/series
https://nekadarederdi.net/api/calculate
```

## Otomatik Veri Güncelleme

GitHub'a push edildiğinde `.github/workflows/update-market-data.yml` zamanlı çalışır.

Zamanlama:

```text
Her ayın 4, 10, 17 ve 24. günü saat 06:30 UTC
```

Veri değişirse workflow `backend/Data/market-series.json` için otomatik commit atar.
