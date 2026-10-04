# Ne Kadar Ederdi?

Geçmiş bir tutarı TÜFE, döviz, altın, gümüş, asgari ücret, BIST 100, Bitcoin, konut ve yakıt endeksiyle ay bazında karşılaştıran araç.

## Geliştirme ve doğrulama

Node 22 ile `npm ci`, ardından `npm run check` çalıştırın. Bu komut üretim bağımlılık denetimini, Worker tip kontrolünü, hesaplama/veri regresyonlarını ve tam site derlemesini içerir.

Yerel üretim benzeri sunucu: `npx wrangler dev --port 8787 --local-upstream 127.0.0.1`. Yerel upstream belirtilmezse üretim alan adı yönlendirmesi geliştirme sunucusunda döngüye neden olabilir. Ayrı terminalde `npm run test:site` çalıştırın. Canlı kontrol için `SITE_URL=https://nekadarederdi.com` ortam değişkenini kullanın.

Tarayıcı testi: Python Playwright kurulu ve Microsoft Edge mevcutken `python scripts/test-browser.py`. Windows'ta Python 3.13 için `py -3.13 scripts/test-browser.py` kullanılabilir. Test masaüstü, 320/390 px mobil, koyu tema, hesaplama hatası ve JavaScript kapalı içeriği kontrol eder. Ekran görüntüleri git dışında `.wrangler/qa/` dizinine yazılır.

## İçerik ve hesaplama

`shared/content.ts` içerikleri; `shared/routes.ts` yayımlanan sayfaları ve eski adreslerin kalıcı yönlendirmelerini tanımlar. Build, gerçek React bileşenlerini bütün sayfalarda önceden HTML'e dönüştürür. Ayrı bot içeriği yoktur. `scripts/prerender.mjs` sitemap'i de aynı adres listesinden üretir; sitemap'i elle düzenlemeyin. `CONTENT_UPDATED` yalnız içerik gerçekten değiştiğinde güncellenir; veri tabloları ayrıca katalog tarihini kullanır.

API, hesaplayıcının ilk gösterimi ve Atlas örnekleri `shared/calculation.ts` motorunu kullanır. Eksik aylar ilk/son gözlemle doldurulmaz. 2005 öncesi ve seri başlangıcından önceki tarihler desteklenmez. Ters yönde tarih karşılaştırması desteklenir. Paylaşılan hesaplar URL fragment'inde saklanır.

## Veri bakımı

`npm run data:update` yalnız tamamlanmış takvim aylarını çeker. `npm run data:verify` güncellik ve veri bütünlüğünü birlikte kontrol eder. `DATA_END_MONTH=YYYY-MM` ile geçmişteki tamamlanmış bir ay seçilebilir. TÜFE ve bazı piyasa/endeks serileri üçüncü taraf aktarımlarından gelir; kaynak sayfasında bu ayrım açıkça belirtilir.

Güncelleme workflow'u, değişiklik commit edildiğinde dağıtım workflow'unu açıkça çağırır: `GITHUB_TOKEN` ile yapılan push tek başına diğer push workflow'larını tetiklemez. Bir kaynak 403 döndürürse mevcut snapshot korunabilir; güncellik sınırı aşıldığında workflow başarısız olur. Bu durumu veri taze görünüyormuş gibi tarih değiştirerek çözmeyin; kaynak erişimini düzeltin veya doğrulanmış yeni kaynakla yeniden derleyin. EVDS kaynakları için `EVDS_API_KEY`, isteğe bağlı mevduat için `EVDS_DEPOSIT_SERIES` gerekir. Mevduat verisi yoksa araçta sunulmaz.

## Yayın ve AdSense

`main` push'u test ve Cloudflare dağıtımını çalıştırır. Dağıtımdan sonra canlı `test:site` ve tarayıcı kontrollerini çalıştırın. AdSense sahiplik meta etiketi ve ads.txt korunur; reklam gösterimi şu an etkin değildir. Reklam eklemek ayrı bir yayın değişikliği olarak değerlendirilmelidir.

4 Ekim 2026 düzeltmesi tekrar eden sayfaları birleştirir, hesaplama dayanaklarını açar ve veri eksiklerinde yanlış sonuç üretimini engeller. Bunlar AdSense onay garantisi değildir. Yeniden başvurudan önce Search Console'da ana sayfa, bir rehber, bir Atlas örneği ve veri kaynaklarını canlı URL testiyle kontrol edin. Sitemap adresi değişmedi. AdSense hesabındaki yeniden inceleme tarihi 11 Ekim 2026'dır; içeriğin gerçek kullanıcı yararı ve düzenli bakımı devam etmelidir.
