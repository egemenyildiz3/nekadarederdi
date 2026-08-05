Eski agent işi tam bitirememiş olsa da en azından masaya derli toplu bir süreç belgesi bırakmış. Belgedeki kararların ve varsayımların büyük kısmı MVP için gayet mantıklı, ancak birkaç teknik nüans ve netleştirilmesi gereken kritik nokta var.

Mevcut dokümanı güncellemek ve üzerine ilerlemek için her bir maddeye eklediğim `gemini comment:` değerlendirmelerini aşağıda bulabilirsin:

---

# Geliştirme Süreci, Varsayımlar ve Açık Sorular

## Süreç

1. Mevcut `nekadarederdi.md` okundu.
> **gemini comment:** Temel vizyonu ve proje sınırlarını anlamak için doğru ilk adım.


2. İlk dokümandaki ASP.NET Core / Razor Pages tercihi kullanıcı geri bildirimiyle geçersiz sayıldı.
> **gemini comment:** İsabetli bir çark etme. Dinamik grafikler, anlık veri güncellemeleri ve akıcı bir kullanıcı deneyimi için Razor Pages bu devirde hantal kalırdı.


3. Ana teknoloji kararı React + TypeScript + Tailwind CSS + Vite frontend ve ASP.NET Core backend olarak güncellendi.
> **gemini comment:** Oldukça güçlü ve endüstri standardı bir stack. SPA mimarisi hesaplama, grafikleri anlık render etme ve paylaşılabilir URL (URL state sync) işlerini yağ gibi kaydırır.


4. Repo, Razor denemesinden arındırılıp `frontend/` ve `backend/` klasörlerine ayrılacak.
> **gemini comment:** Decoupled (ayrık) mimari şart. Bu sayede ileride frontend'i Vercel/Netlify'a, backend API'yi Render/Fly.io veya Azure'a ayrı ayrı sıfır maliyetle dağıtabiliriz.


5. İlk çalışan sürüm; backend statik JSON veri dosyası, backend hesaplama motoru, frontend paylaşılabilir URL ve mobil öncelikli UI içerecek.
> **gemini comment:** MVP (Minimum Viable Product) için en sağlıklı yol. Veritabanı (DB) bağlamakla vakit kaybetmeden veriyi JSON + `IMemoryCache` üzerinden sunup direkt ürüne odaklanmak doğru yaklaşım.

=> Bazi gereksiz dosya ve filelar var, onlari da temizlersin

---

## Varsayımlar

* İlk sürüm üyelik ve canlı dış API gerektirmeyecek.
> **gemini comment:** Kesinlikle katılıyorum. Tarihsel veriler (TÜFE, Dolar, Gram Altın) zaten geçmişe dönük statik veya en fazla ayda bir append edilen verilerdir. Canlı API bağlayıp latency veya rate-limit riski almaya hiç gerek yok.


* ASP.NET Core backend uygulaması API, veri okuma, IMemoryCache ve hesaplama sorumluluğunu taşıyacak.
> **gemini comment:** Doğru mimari. Veri boyutu (birkaç MB JSON) çok küçük olacağı için backend uygulaması açılırken JSON'ı `IMemoryCache` bellek alanına alacak ve hesaplama isteklerine mikro-saniyeler seviyesinde yanıt dönecektir.


* Frontend yalnızca kullanıcı arayüzü, URL durumu ve paylaşım davranışını yönetecek.
> **gemini comment:** URL parametreleri (`?tutar=1000&tarih=2015-01&enstruman=usd`) doğrudan React state'ine bağlanmalı. Böylece kullanıcı hesaplama yaptığında oluşan URL kopyalanıp WhatsApp/X'te paylaşıldığında karşı taraf aynı sonucu görür.


* Hesaplamalar yatırım tavsiyesi değil, yaklaşık tarihsel kıyaslama aracı olarak sunulacak.
> **gemini comment:** Hukuki ve etik açıdan zorunlu. Sayfanın en altına ve hesaplama kartının hemen altına şık ama göze çarpan bir "Yatırım Tavsiyesi Değildir (YTD)" ibaresi yerleştirilmelidir.


* `backend/data/market-series.json` içindeki başlangıç verileri demo/örnek veri olarak kabul edilecek; üretimden önce resmi kaynaklarla güncellenmesi gerekecek.
> **gemini comment:** JSON veri şemasını baştan sıkı tutalım. Örn: `{ "2024-01": { "CPI": 1850.5, "USD": 30.2, "GOLD": 1980.0 } }`. Şema doğru kurulursa resmi veriyi basmak tek bir dosyayı değiştirmekten ibaret olur.


* Başlangıç ve bitiş tarihleri ay bazında ele alınacak.
> **gemini comment:** Türkiye'deki tarihsel enflasyon (TÜFE) verileri zaten aylık açıklanır. Günlük veri aramak hem tutarsızlık yaratır hem de gereksiz karmaşıklık getirir. Ay bazlı yaklaşım (Monthly Granularity) bu tür araçlarda standarttır.


* Seçilen ay için veri yoksa o aydan önceki en yakın veri noktası kullanılacak.
> **gemini comment:** Mantıklı bir Fallback (Forward-Fill) stratejisi. Ancak kullanıcı verisi henüz olmayan gelecek bir ayı seçerse UI tarafında "Seçilen ayın verisi henüz açıklanmadığı için [Son Ay] verisi kullanılmıştır" uyarısı gösterilmelidir.


* 2005 öncesi para dönüşümü sadece başlangıç tutarına uygulanacak.
> **gemini comment:** **Kritik nokta!** 1 Ocak 2005'te 6 sıfır atıldı (1.000.000 TL = 1 YTL). Eğer kullanıcı 2004 öncesi için "1.000.000 TL" girerse backend bunu 1 TL olarak normalize edip hesaplamaya dahil etmelidir.


* Tasarımda gösterişli landing page yerine doğrudan kullanılabilir hesaplama ekranı tercih edilecek.
> **gemini comment:** Utility-first UI yaklaşımı. Kullanıcı siteye girdiği an karşısında hesaplama formunu görmeli, laf kalabalığı landing sayfaları kullanıcıyı kaçırır.



---

## Açık Sorular

* Üretim verileri hangi kesin kaynak ve lisans koşullarıyla güncellenecek?
> **gemini comment:**
> * **Enflasyon:** TÜİK resmi TÜFE endeksi.
> * **Döviz & Altın:** TCMB EVDS (Elektronik Veri Dağıtım Sistemi). EVDS ücretsiz API key verir, basit bir node/python scripti ile her ay bu JSON otomatik güncellenebilir.
> 
> 


* TÜFE için hangi baz yıl ve seri kullanılacak?
> **gemini comment:** TÜİK'in **2003=100** bazlı TÜFE endeksi ana seri olmalıdır. 2003 öncesine gidilecekse eski seriler (1994=100 vb.) zincirleme endeks (chain-linking) yöntemiyle 2003 bazına uyarlanarak taranabilir.


* Altın ve gümüş için serbest piyasa mı, TCMB tabanlı seri mi tercih edilecek?
> **gemini comment:** Tutarlılık ve resmiyet açısından **TCMB kapanış kurları ve Ons/Gram serileri** tercih edilmeli. Serbest piyasa verilerinde geçmişe dönük anomali ve makas farkları veri kalitesini bozabilir.


* Site yalnızca Türkçe mi kalacak, yoksa ileride İngilizce dil desteği istenecek mi?
> **gemini comment:** "Ne kadar ederdi?" konsepti ve TL'nin enflasyon geçmişi %99 oranında yerel kullanıcıyı ilgilendirir. MVP aşamasında i18n altyapısıyla vakit kaybetmeyip tamamen **Türkçe** odaklı gitmek en doğrusu.


* SEO için ileride `/enflasyon-hesaplayici` gibi ayrı route'lar gerçekten ayrı sayfa olarak mı üretilecek, yoksa tek React uygulaması içinde mi ele alınacak?
> **gemini comment:** Organik arama trafiği (Google) bu projenin ana damarı olacaktır. Bu yüzden `/dolar-hesaplayici`, `/altin-enflasyon-hesaplayici` gibi statik/dinamik route'lar SEO için altın değerindedir. React Router ile bunlar SPA içinde çözülebilir ancak Google botlarının iyi indexlemesi için ileride Vite SSG (Static Site Generation) eklentisiyle bu route'ları statik HTML olarak export etmek SEO performansını tavan yaptırır.