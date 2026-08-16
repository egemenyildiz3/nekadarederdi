# Proje Özeti: Ne Kadar Ederdi? (nekadarederdi.net)

## Amaç

Kullanıcıların geçmişteki bir parasal değerin, seçtikleri yatırım araçlarına veya ekonomik göstergelere göre bugünkü ya da başka bir tarihteki yaklaşık karşılığını hızlı, sade ve görselleştirilmiş şekilde görebilmelerini sağlayan üyeliksiz web aracı.

Site; mobil öncelikli, hızlı açılan, paylaşılabilir ve SEO açısından temiz bir statik web uygulaması olarak tasarlanacaktır.

## Teknoloji Yığını

- React
- TypeScript
- Tailwind CSS
- Vite
- ASP.NET Core backend API
- Backend tarafında statik JSON veri dosyaları
- Docker Compose ile ayrı frontend ve backend servisleri

## Gelir Modeli

- Google AdSense ve benzeri görüntülü/metin reklam ağları
- Reklam alanları içerik kaymasına yol açmayacak sabit placeholder alanlarıyla ayrılacaktır.

---

## 1. Fonksiyonel Gereksinimler

- **Dinamik girdi formu:** Kullanıcıdan miktar, başlangıç ay/yıl, bitiş ay/yıl ve karşılaştırma kriterleri alınmalıdır.
- **Çoklu karşılaştırma:** Kullanıcı aynı anda TÜFE, USD, EUR, gram altın, asgari ücret ve gümüş gibi birden fazla kriter seçebilmelidir.
- **Tarihsel çapraz hesaplama:** Hesaplama yalnızca geçmişten bugüne değil, geçmişten geçmişe de yapılabilmelidir.
- **YTL/TL dönüşümü:** 1 Ocak 2005 öncesi başlangıç tarihleri için girilen tutar otomatik olarak 1.000.000'a bölünmeli ve kullanıcıya anlaşılır bir uyarı gösterilmelidir.
- **Sonuç ekranı:** Sonuçlar sade, okunabilir, mobil uyumlu özet kartları olarak sunulmalıdır.
- **Görselleştirme:** Sonuç alanında karşılaştırma kartları, çarpan bilgisi ve temel oran farkı görsel olarak taranabilir olmalıdır.
- **Paylaşım:** Sonuçlar X, WhatsApp ve kopyalanabilir URL ile paylaşılabilmelidir.
- **Paylaşılabilir URL:** Form durumu query string'e yazılmalı; link açıldığında aynı hesaplama tekrar kurulmalıdır.

---

## 2. Fonksiyonel Olmayan Gereksinimler

- **Sadelik:** İlk ekran doğrudan hesaplama aracını göstermelidir. Pazarlama tipi landing page yapılmayacaktır.
- **Mobil öncelik:** Arayüz tek elle kullanıma uygun, büyük dokunma hedeflerine sahip ve tüm cihazlarda okunabilir olmalıdır.
- **Performans:** Uygulama statik üretilecek, veri dosyaları küçük tutulacak ve gereksiz bağımlılık eklenmeyecektir.
- **SEO:** Statik HTML meta etiketleri, açıklayıcı başlıklar ve semantic route desteği planlanmalıdır.
- **Erişilebilirlik:** Form etiketleri, klavye kullanımı, kontrast ve odak durumları dikkatle ele alınmalıdır.
- **Reklam yerleşimi:** Header altı ve sonuç kartları altı için sabit yükseklikte reklam placeholder alanları ayrılmalıdır.
- **Dağıtım:** Vite build çıktısı Docker içinde Nginx ile 7180 portundan sunulmalıdır. 3000 portu geliştirme dışında kullanılmayacaktır.

---

## 3. Veri Kaynakları ve Veri Yaklaşımı

İlk sürüm canlı dış API kullanmayacaktır. Backend `backend/data/market-series.json` dosyasından statik zaman serilerini okuyacak ve frontend bu verilere `/api` üzerinden erişecektir. Bu değerler başlangıç/demo verisi olarak tutulacak; gerçek üretim verileri sonradan aynı şemayla TÜİK, TCMB EVDS ve ilgili resmi kaynaklardan güncellenmelidir.

| Veri Türü | Planlanan Kaynak | Frekans |
| --- | --- | --- |
| TÜFE | TÜİK | Aylık |
| USD / EUR | TCMB EVDS | Aylık ortalama |
| Gram altın | TCMB EVDS veya güvenilir piyasa arşivi | Aylık ortalama |
| Asgari ücret | Çalışma ve Sosyal Güvenlik Bakanlığı arşivleri | Yıllık / dönemsel |
| Gümüş | TCMB EVDS, BIST veya güvenilir piyasa arşivi | Aylık ortalama |

---

## 4. Geliştirme Yol Haritası

1. **Klasör ayrımı:** `frontend/` ve `backend/` klasörlerini ayrı uygulamalar olarak tut.
2. **Backend API:** ASP.NET Core API içinde statik JSON veri okuma, IMemoryCache ve hesaplama motorunu kur.
3. **Frontend:** Vite tabanlı React/TypeScript/Tailwind uygulamasını backend `/api` uçlarına bağla.
4. **Hesaplama motoru:** Tarih seçimi, en yakın önceki veri noktasını bulma, çarpan hesabı ve 2005 öncesi TL dönüşümünü backend'de uygula.
5. **Arayüz:** Sade, mobil öncelikli hesaplama formu, çoklu seçim kontrolleri, sonuç kartları ve reklam placeholder alanlarını inşa et.
6. **Paylaşım:** Query string senkronizasyonu, X/WhatsApp linkleri ve panoya kopyalama ekle.
7. **Dağıtım:** Docker Compose ile ASP.NET backend'i 7400, frontend'i 7180 portundan çalıştır.
8. **Doğrulama:** Root `npm run build` ile hem backend hem frontend build'ini kontrol et.




INSAN YORUMLARI:
- tarih secici cok kotu, eski gorunuyor, secmesi zor ve ingilizce. onu duzelt. bozulmaya cok musait. yanlis bir tarih yazip backspace basinca site cokuyor mesela
- yazi fontunu daha karakteristik, uygun bir fonta donustur.
- tl olarak karsilastirma da ekleyelim
- solda secimlerin yapildigi kisim, daha fazla karsilastirma ekleyince manasiz bir boslukla uzuyor, uzamasin.
- hem tabe hem de sol uste guzel bir logo tasarla ve ekle
- paylasma ozellikleri cok guzel olmus, onlara da twitter ve whatsapp logosu ekle
- su an sadece gecmisten gelecege karsilastirabiliyoruz, gunumuzden gecmise de karsilastirabilsek guzel olurdu
- gercek verileri topla ve duzenli ve otomatik bicimde toplayabilecegimiz sistemi kur
