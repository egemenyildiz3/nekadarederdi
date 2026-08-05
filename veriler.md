# Ne Kadar Ederdi? — Veri Kaynakları ve Veri Mimarisi

Bu doküman, "Ne Kadar Ederdi?" uygulamasında kullanılacak tarihsel finansal verilerin kaynaklarını, erişim yöntemlerini ve veritabanı/JSON veri yapısını tanımlar.

---

## 1. Veri Kaynakları ve Resmi Seriler

| Enstrüman / Veri | Veri Kaynağı | Güncelleme Sıklığı | Erişim Yöntemi | Notlar |
| :--- | :--- | :--- | :--- | :--- |
| **TÜFE (Enflasyon)** | TÜİK (Türkiye İstatistik Kurumu) | Aylık (Her ayın 3'ü) | TÜİK Web / CSV / EVDS | 2003=100 Bazlı Tüketici Fiyat Endeksi serisi kullanılır. |
| **USD / TRY** | TCMB EVDS (Elektronik Veri Dağıtım) | Günlük / Aylık Ortalama | EVDS API (Ücretsiz) / CSV | Dolar/TL aylık ortalama veya ay sonu kapanış kurları. |
| **EUR / TRY** | TCMB EVDS | Günlük / Aylık Ortalama | EVDS API (Ücretsiz) / CSV | Euro/TL aylık ortalama veya ay sonu kapanış kurları. |
| **Gram Altın (TL)** | TCMB EVDS / Borsa İstanbul / Hesaplama | Aylık | Hesaplama veya Hazır Seri | `(Ons Altın USD / 31.1035) * USD/TRY` formülüyle %100 hassasiyetle türetilebilir. |
| **Gram Gümüş (TL)** | Investing / St. Louis Fed (FRED) | Aylık | Hesaplama veya Hazır Seri | `(Ons Gümüş USD / 31.1035) * USD/TRY` formülüyle türetilir. |
| **Net Asgari Ücret** | ÇSGB / TÜİK | Yıllık / Dönemsel | Statik Tablo (Manuel) | 1990-Günümüz arası toplam ~40-50 satırlık sabit veridir. |

---

## 2. Veri Temin Yöntemi (MVP Stratejisi)

1. **Canlı Dış API Bağımlılığı Yoktur:** Uygulama her kullanıcı sorgusunda dış API'ye istek atmaz. Veriler `backend/data/market-series.json` dosyasında statik olarak saklanır.
2. **Yüksek Performans (In-Memory Cache):** Backend açılırken bu JSON dosyasını belleğe (`IMemoryCache`) yükler. Hesaplamalar mikro-saniye seviyesinde gerçekleşir.
3. **Aylık Otomatik/Yarı Otomatik Güncelleme:** TÜİK her ayın 3'ünde enflasyonu açıkladığında JSON dosyasına tek bir yeni ay satırı eklenir. Bu işlem basit bir Python scripti ile otomatize edilebilir veya manuel yapılabilir.

---

## 3. JSON Veri Şeması (`backend/data/market-series.json`)

Tüm tarihsel veriler `YYYY-MM` anahtarıyla (Aylık Granülarite) aşağıdaki formatta tutulur:

```json
{
  "meta": {
    "base_cpi_year": "2003=100",
    "last_updated": "2026-07-01",
    "currency_unit": "TRY"
  },
  "series": {
    "2004-12": {
      "cpi": 112.85,
      "usd": 1.42,
      "eur": 1.91,
      "gold_gram": 19.50,
      "silver_gram": 0.31,
      "min_wage": 318.60
    },
    "2005-01": {
      "cpi": 113.46,
      "usd": 1.34,
      "eur": 1.76,
      "gold_gram": 18.20,
      "silver_gram": 0.29,
      "min_wage": 350.15
    },
    "2024-01": {
      "cpi": 1850.25,
      "usd": 30.20,
      "eur": 32.80,
      "gold_gram": 1980.50,
      "silver_gram": 23.40,
      "min_wage": 17002.12
    }
  }
}