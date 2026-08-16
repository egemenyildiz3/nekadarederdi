# Ne Kadar Ederdi? Çalıştırma

Tüm komutları proje kök dizininde çalıştır:

```bash
cd C:\Users\egeme\Documents\Repositories\nekadarederdi
```

## Portlar

```text
Backend API:  http://localhost:7400
Frontend dev: http://localhost:7573
Docker web:   http://localhost:7180
```

## Geliştirme

Backend:

```bash
npm run dev:backend
```

Frontend için ayrı terminal:

```bash
npm run dev:frontend
```

Uygulama:

```text
http://localhost:7573
```

## Build

```bash
npm run build
```

Build sadece dosya üretir, uygulamayı çalıştırmaz.

## Gerçek Veriyi Güncelle

```bash
npm run data:update
```

Bu komut `backend/Data/market-series.json` dosyasını günceller.

## Otomatik Veri Güncelleme

Repo GitHub'a push edilirse `.github/workflows/update-market-data.yml` otomatik çalışır.

Zamanlama:

```text
Her ayın 4, 10, 17 ve 24. günü saat 06:30 UTC
```

Workflow veri değişirse `backend/Data/market-series.json` dosyasına otomatik commit atar.

Not: Lokal Docker container kendi kendine veri güncellemez. Yeni veriyi canlıya almak için veri güncellemeden sonra yeniden build gerekir:

```bash
npm run data:update
docker compose up -d --build
```

## Hızlı Kontrol

Backend ayaktayken:

```bash
curl http://localhost:7400/health
```

Beklenen cevap:

```json
{"ok":true}
```

## Docker

```bash
docker compose up --build
```

Docker ile uygulama:

```text
http://localhost:7180
```

## Önemli Dosyalar

```text
backend/Data/market-series.json       Gerçek veri dosyası
scripts/update-market-data.mjs        Veri güncelleme scripti
frontend/src/App.tsx                  Ana arayüz
backend/Services/ValueCalculator.cs   Hesaplama motoru
```
