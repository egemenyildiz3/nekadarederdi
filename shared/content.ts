import type { InputUnit, SeriesKey } from '../frontend/src/types';

export type LandingPageContent = {
  path: string;
  title: string;
  metaTitle: string;
  description: string;
  intro: string;
  calculatorHref: string;
  sections: { title: string; body: string }[];
};

export type InfoPageContent = {
  path: string;
  title: string;
  metaTitle: string;
  description: string;
  intro: string;
  sections: { title: string; body: string; link?: { label: string; href: string } }[];
};

export type GuidePageContent = {
  path: string;
  title: string;
  metaTitle: string;
  description: string;
  intro: string;
  calculatorHref: string;
  sections: { title: string; body: string }[];
  takeaways: string[];
};

export type PublisherPageContent = {
  path: string;
  hub: 'atlas' | 'guncellemeler' | 'veri-defteri';
  eyebrow: string;
  title: string;
  metaTitle: string;
  description: string;
  intro: string;
  calculatorHref?: string;
  calculation?: {
    amount: number;
    inputUnit: InputUnit;
    startMonth: string;
    criteria: SeriesKey[];
  };
  sections: { title: string; body: string }[];
};

export const LANDING_PAGES: LandingPageContent[] = [
  {
    path: '/enflasyon-hesaplama',
    title: 'Enflasyon hesaplama',
    metaTitle: 'Enflasyon Hesaplama | TÜFE ile Geçmiş Para Değeri',
    description:
      'Geçmişteki bir TL tutarının TÜFE verilerine göre bugünkü yaklaşık satın alma gücünü hesaplayın.',
    intro:
      'Enflasyon hesaplama, aynı tutarın farklı tarihlerdeki alım gücünü karşılaştırmak için kullanılır. Ne Kadar Ederdi, TÜFE serisiyle geçmiş TL değerini aylık düzeyde yaklaşık olarak gösterir.',
    calculatorHref: '/#hesapla',
    sections: [
      {
        title: 'TÜFE ile para değeri nasıl okunur?',
        body:
          'TÜFE, tüketici fiyatlarındaki değişimi izler. Başlangıç ve bitiş ayı arasındaki endeks farkı, geçmişteki tutarın bugünkü alım gücüne yaklaşık bir çarpan verir.',
      },
      {
        title: 'Hangi sorular için kullanılır?',
        body:
          '“2010 yılında 10.000 TL bugün ne kadar ederdi?” veya “eski maaşım bugünkü parayla kaç TL olurdu?” gibi karşılaştırmalar için uygundur.',
      },
      {
        title: 'Sonuç yatırım tavsiyesi değildir',
        body:
          'Hesaplama tarihsel veri karşılaştırmasıdır. Fiyat, maaş, kur ve yatırım kararları için tek başına kullanılmamalıdır.',
      },
    ],
  },
  {
    path: '/gecmis-para-degeri',
    title: 'Geçmiş para değeri',
    metaTitle: 'Geçmiş Para Değeri Hesaplama | Ne Kadar Ederdi?',
    description:
      'Geçmişteki TL tutarlarını bugünkü değerle, enflasyon, döviz, altın, gümüş ve asgari ücret üzerinden kıyaslayın.',
    intro:
      'Geçmiş para değeri tek bir cevaba indirgenmez. Aynı tutar TÜFE’ye göre başka, dolara veya altına göre başka bir karşılık verebilir. Bu sayfa farklı ölçütleri birlikte okumak için hazırlanmıştır.',
    calculatorHref: '/',
    sections: [
      {
        title: 'Reel değer fiyat düzeyine bağlıdır',
        body:
          'Reel değer, tutarın kağıt üzerindeki sayısını değil, fiyat düzeyi karşısındaki yaklaşık alım gücünü gösterir.',
      },
      {
        title: 'Tek ölçüt yerine çoklu kıyas',
        body:
          'TÜFE alım gücü, dolar ve euro kur etkisi, altın ve gümüş değerli maden kıyası, asgari ücret ise gelir düzeyi perspektifi sağlar.',
      },
      {
        title: 'Ay bazında hesaplama',
        body:
          'Veriler aylık serilerle işlendiği için yıl içindeki büyük değişimler daha görünür hale gelir.',
      },
    ],
  },
  {
    path: '/bugunun-parasiyla-ne-kadar',
    title: 'Bugünün parasıyla ne kadar?',
    metaTitle: 'Bugünün Parasıyla Ne Kadar? | TL Alım Gücü Hesaplama',
    description:
      'Eski bir fiyatın, maaşın veya borcun bugünün parasıyla yaklaşık karşılığını hesaplayın.',
    intro:
      '“Bugünün parasıyla ne kadar?” sorusu, geçmişteki bir tutarı bugünkü fiyat ortamına taşır. Hesaplayıcı, seçilen başlangıç ve bitiş ayına göre yaklaşık karşılığı üretir.',
    calculatorHref: '/#hesapla',
    sections: [
      {
        title: 'Fiyatları bugüne taşımak',
        body:
          'Eski kira, maaş, ürün fiyatı veya birikim tutarı TÜFE ile bugünkü satın alma gücü açısından okunabilir.',
      },
      {
        title: 'Gelir düzeyiyle kıyaslamak',
        body:
          'Asgari ücret ölçütü, belirli bir tutarın farklı dönemlerdeki temel gelir seviyesine göre nasıl değiştiğini görmeye yardımcı olur.',
      },
      {
        title: 'Paylaşılabilir sonuç',
        body:
          'Hesaplama sonrası oluşan URL, seçilen tutar ve tarihlerle paylaşılabilir.',
      },
    ],
  },
  {
    path: '/dolar-bazinda-ne-kadar-ederdi',
    title: 'Dolar bazında ne kadar ederdi?',
    metaTitle: 'Dolar Bazında Ne Kadar Ederdi? | TL USD Karşılaştırma',
    description:
      'Geçmişteki TL tutarını dolar kuru değişimine göre bugünkü yaklaşık TL karşılığıyla kıyaslayın.',
    intro:
      'Dolar bazında karşılaştırma, TL’nin ABD doları karşısındaki değişimini görmek için kullanılır. Bu yaklaşım alım gücünden farklıdır; kur hareketine odaklanır.',
    calculatorHref: '/#hesapla',
    sections: [
      {
        title: 'Kur bazlı karşılaştırma nedir?',
        body:
          'Başlangıç ayındaki TL/USD seviyesi ile bitiş ayındaki seviye karşılaştırılır ve tutara yaklaşık bir kur çarpanı uygulanır.',
      },
      {
        title: 'Enflasyonla aynı şey değildir',
        body:
          'Dolar bazlı sonuç, Türkiye’deki tüketici fiyatlarını değil TL’nin dolar karşısındaki değişimini gösterir.',
      },
      {
        title: 'Ne zaman kullanılır?',
        body:
          'Dövizle ifade edilen maliyetler, ithal ürünler veya döviz bazlı birikim kıyasları için fikir verir.',
      },
    ],
  },
  {
    path: '/altin-bazinda-ne-kadar-ederdi',
    title: 'Altın bazında ne kadar ederdi?',
    metaTitle: 'Altın Bazında Ne Kadar Ederdi? | Gram Altın Karşılaştırma',
    description:
      'Geçmişteki TL tutarını gram altın fiyatı değişimine göre bugünkü yaklaşık karşılığıyla hesaplayın.',
    intro:
      'Altın bazında karşılaştırma, belirli bir TL tutarının gram altın fiyatındaki değişimle nasıl farklılaşacağını gösterir. Bu sonuç yatırım getirisi değil, tarihsel fiyat kıyasıdır.',
    calculatorHref: '/#hesapla',
    sections: [
      {
        title: 'Gram altın çarpanı',
        body:
          'Başlangıç ve bitiş ayındaki gram altın TL fiyatları oranlanır. Böylece geçmişteki tutarın altın fiyatına göre bugünkü yaklaşık karşılığı bulunur.',
      },
      {
        title: 'Gümüşle birlikte okumak',
        body:
          'Gümüş serisi, değerli madenler arasında farklı fiyat davranışlarını kıyaslamaya yardımcı olur.',
      },
      {
        title: 'Yaklaşık tarihsel kıyas',
        body:
          'Vergi, makas, alış-satış farkı ve işlem maliyeti gibi detaylar hesaplamaya dahil değildir.',
      },
    ],
  },
  {
    path: '/2010da-10000-tl-bugun-ne-kadar',
    title: '2010’da 10.000 TL bugün ne kadar?',
    metaTitle: '2010’da 10.000 TL Bugün Ne Kadar? | Enflasyon ve Yatırım Kıyas',
    description:
      '2010 yılındaki 10.000 TL tutarını bugünün parasıyla, TÜFE, dolar, altın, BIST 100 ve Bitcoin verileriyle kıyaslayın.',
    intro:
      '“2010’da 10.000 TL bugün ne kadar ederdi?” sorusu tek bir cevaba sahip değildir. TÜFE alım gücünü, dolar ve altın kur/fiyat etkisini, BIST 100 ve Bitcoin ise piyasa bazlı tarihsel değişimi gösterir.',
    calculatorHref: '/#hesapla',
    sections: [
      {
        title: 'TÜFE ile bugünkü karşılık',
        body:
          'TÜFE hesabı, 2010’daki 10.000 TL’nin tüketici fiyatları karşısındaki yaklaşık bugünkü alım gücünü gösterir.',
      },
      {
        title: 'Dolar ve altın farklı sonuç verir',
        body:
          'Döviz ve gram altın serileri fiyat hareketlerini izlediği için enflasyon hesabından farklı çarpanlar üretir.',
      },
      {
        title: 'Piyasa göstergeleriyle okumak',
        body:
          'BIST 100 ve Bitcoin gibi seriler, aynı tutarın yatırım piyasalarıyla kıyaslandığında nasıl değişeceğini yaklaşık olarak gösterir.',
      },
    ],
  },
  {
    path: '/eski-maas-bugun-ne-kadar',
    title: 'Eski maaş bugün ne kadar?',
    metaTitle: 'Eski Maaş Bugün Ne Kadar? | Maaş Enflasyon Hesaplama',
    description:
      'Eski maaşınızı bugünkü alım gücüyle ve asgari ücret, döviz, altın gibi farklı göstergelerle karşılaştırın.',
    intro:
      'Eski maaşın bugünkü karşılığını hesaplarken yalnızca nominal tutara bakmak yanıltıcıdır. Enflasyon, asgari ücret, döviz ve altın gibi ölçütler farklı ekonomik bakışlar sağlar.',
    calculatorHref: '/#hesapla',
    sections: [
      {
        title: 'Maaşın alım gücü',
        body:
          'TÜFE serisi, eski maaşın bugünkü fiyat düzeyindeki yaklaşık alım gücünü hesaplamak için en doğrudan ölçüttür.',
      },
      {
        title: 'Asgari ücretle kıyas',
        body:
          'Asgari ücret karşılaştırması, maaşın temel gelir düzeylerine göre tarih içinde nasıl konumlandığını anlamaya yardım eder.',
      },
      {
        title: 'Döviz ve altın perspektifi',
        body:
          'Dolar ve altın bazlı sonuçlar gelir alım gücünden çok kur ve değerli maden fiyatı değişimini gösterir.',
      },
    ],
  },
  {
    path: '/kira-enflasyon-hesaplama',
    title: 'Kira enflasyon hesaplama',
    metaTitle: 'Kira Enflasyon Hesaplama | Eski Kira Bugün Ne Kadar?',
    description:
      'Geçmişteki kira tutarını TÜFE ve farklı ekonomik göstergelerle bugünkü yaklaşık değerine taşıyın.',
    intro:
      'Eski kira tutarlarını bugünün koşullarıyla okumak için TÜFE iyi bir başlangıç noktasıdır. Aynı tutarı döviz, altın veya asgari ücret gibi ölçütlerle kıyaslamak ise farklı yorumlar sağlar.',
    calculatorHref: '/#hesapla',
    sections: [
      {
        title: 'Kira tutarını bugüne taşımak',
        body:
          'Başlangıç ayındaki kira, seçilen bitiş ayına TÜFE çarpanıyla taşınarak yaklaşık bugünkü alım gücü bulunur.',
      },
      {
        title: 'Gelire göre kira yükü',
        body:
          'Asgari ücret karşılaştırması, bir kira tutarının temel gelir seviyesine göre ne kadar ağırlaştığını veya hafiflediğini gösterir.',
      },
      {
        title: 'Yaklaşık karşılaştırma',
        body:
          'Hesaplama kira artış mevzuatı ya da bölgesel konut piyasası yerine genel ekonomik serileri kullanır.',
      },
    ],
  },
  {
    path: '/bist-bitcoin-altin-karsilastirma',
    title: 'BIST, Bitcoin ve altın karşılaştırma',
    metaTitle: 'BIST, Bitcoin ve Altın Karşılaştırma | Ne Kadar Ederdi?',
    description:
      'Bir TL tutarını BIST 100, Bitcoin, gram altın ve gümüş fiyatlarındaki tarihsel değişimle karşılaştırın.',
    intro:
      'Aynı TL tutarı enflasyon, döviz, altın, BIST 100 ve Bitcoin gibi farklı serilerle bambaşka sonuçlar verebilir. Bu sayfa yatırım tavsiyesi değil, tarihsel kıyaslama çerçevesi sunar.',
    calculatorHref: '/#hesapla',
    sections: [
      {
        title: 'Fiyat serileri aynı şeyi ölçmez',
        body:
          'Altın, BIST 100 ve Bitcoin farklı risk, oynaklık ve piyasa dinamiklerine sahiptir; sonuçlar birlikte okunmalıdır.',
      },
      {
        title: 'Tarih aralığı sonucu belirler',
        body:
          'Başlangıç ve bitiş ayı değiştikçe çarpanlar büyük ölçüde farklılaşabilir. Bu yüzden ay bazlı seçim önemlidir.',
      },
      {
        title: 'Yaklaşık ve brüt karşılaştırma',
        body:
          'Vergi, işlem maliyeti, temettü, saklama maliyeti veya alım-satım makası gibi detaylar dahil değildir.',
      },
    ],
  },
];

export const INFO_PAGES: InfoPageContent[] = [
  {
    path: '/hakkinda',
    title: 'Hakkında',
    metaTitle: 'Hakkında | Ne Kadar Ederdi?',
    description:
      "Ne Kadar Ederdi'nin amacı, kullandığı veri türleri ve hesaplama yaklaşımı hakkında bilgi.",
    intro: "Ne Kadar Ederdi, Egemen Yıldız tarafından yayımlanan bağımsız bir tarihsel para karşılaştırma aracıdır. Eski bir maaşın, birikimin veya fiyatın hangi ölçüte göre değiştiğini görünür kılmayı amaçlar.",
    sections: [
      {
        "title": "Ne işe yarar?",
        "body": "Hesaplayıcı seçtiğiniz tutar ve aylar için endeks ya da fiyat oranını uygular. Rehberler işlemin nasıl yapıldığını, Atlas yazıları ise maaş ve birikim gibi sorularda nasıl yorumlanacağını açıklar. Sonuç kartları hesabın dayandığı başlangıç ve bitiş değerlerini gösterir."
      },
      {
        "title": "Yayımlayıcı ve düzeltmeler",
        "body": "Sitenin geliştirilmesi ve içeriklerinden Egemen Yıldız sorumludur. Veri veya anlatım hatalarını sayfa, ay ve kaynak bağlantısıyla bildirebilirsiniz. Kurumlarla resmî bağlantı ya da finansal danışmanlık hizmeti iddiası yoktur.",
        "link": {
          "label": "Düzeltme bildirin",
          "href": "/iletisim"
        }
      },
      {
        "title": "Veri yaklaşımı",
        "body": "Katalog hem doğrudan kurum verilerini hem de bunları aktaran üçüncü taraf derlemelerini içerir. Gram altın, gümüş ve Bitcoin TL değerleri dönüşümle üretilir. Kaynağın kim olduğu kadar verinin nasıl dönüştürüldüğü de sonuç açısından önemlidir.",
        "link": {
          "label": "Kaynaklar ve veri durumu",
          "href": "/veri-kaynaklari"
        }
      },
      {
        "title": "Yazı tarihi ile veri tarihi farklıdır",
        "body": "Bir yazının düzenlendiği tarih, ekonomik serinin son gözlem tarihi değildir. Hesaplamada sonuç kartındaki ayları esas alın. Varsayımsal örnekler yöntem öğretir; güncel piyasa fiyatı veya gerçekleşmiş yatırım getirisi olarak sunulmaz."
      }
    ],
  },
  {
    path: '/metodoloji',
    title: 'Metodoloji',
    metaTitle: 'Metodoloji | Ne Kadar Ederdi?',
    description:
      'Ne Kadar Ederdi hesaplamalarının hangi yöntemle üretildiğini, aylık veri yaklaşımını ve sonuçların nasıl yorumlanması gerektiğini açıklar.',
    intro: "Hesap, seçilen ölçütün iki aydaki değerlerinin oranına dayanır. Bu adımlar, sonuç kartındaki rakamları bağımsız olarak yeniden hesaplamanız ve sonucun sınırlarını görmeniz içindir.",
    sections: [
      {
        "title": "1. Tutarı başlangıç ayının TL değerine çevirme",
        "body": "TL girildiğinde başlangıç tutarı doğrudan kullanılır. Dolar, euro, gram altın veya gram gümüş girildiğinde miktar başlangıç ayındaki ilgili TL birim değeriyle çarpılır. Tamamen varsayımsal 100 dolar ve 20 TL/dolar başlangıç kuru, 2.000 TL taban tutar oluşturur."
      },
      {
        "title": "2. Aynı serinin iki değerini oranlama",
        "body": "Sonuç = başlangıç TL tutarı × (bitiş seri değeri / başlangıç seri değeri). Varsayımsal 2.000 TL, 200 başlangıç endeksi ve 500 bitiş endeksi için çarpan 2,5; sonuç 5.000 TL olur. Toplam değişim (2,5 − 1) × 100 = %150’dir. Bu oran yıllıklandırılmış getiri değildir."
      },
      {
        "title": "3. Tarih ve gözlem kapsamı",
        "body": "Aylık seri kullanılır; ay etiketi o ayın belirli gününde işlem yapılabileceği anlamına gelmez. Hesaplayıcı son ortak veri ayını önerir ve formda gösterir. Seçilen başlangıç veya bitiş ayında veri yoksa başka ayın değeri kullanılmaz; hata gösterilir. Serilerin son veri ayları farklı olabilir."
      },
      {
        "title": "4. Ortalama ile kapanışın farkı",
        "body": "Döviz için aylık ortalama, BIST 100 ve Bitcoin için aylık kapanış kullanılır. Altın ve gümüşün TL gram değerleri aylık ons fiyatı ile aylık kur ortalamasından türetilir. Ortalamaların çarpımı günlük TL fiyatlarının ortalamasıyla birebir aynı değildir. Sonuç belirli bir banka işleminin simülasyonu değildir."
      },
      {
        "title": "5. Endeks bazını koruma",
        "body": "Endeksin baz yılı değişse de aynı katsayıyla dönüştürülen iki değer arasındaki oran değişmez. Farklı bazlardaki değerleri doğrudan bölmek hatalıdır. Yakıt ve konut serileri birim fiyat değil endekstir; sonuçlarından litre veya metrekare miktarı çıkarılamaz."
      },
      {
        "title": "6. Kapsam dışındaki kalemler",
        "body": "Vergi, komisyon, makas, temettü ve kişisel harcama ağırlıkları dahil değildir. TÜFE kişisel yaşam maliyetini tam ölçmez; BIST fiyat endeksi toplam yatırım getirisini göstermez. Verinin aktarım ve dönüşüm yolları ayrıca açıklanır.",
        "link": {
          "label": "Kaynak zincirini inceleyin",
          "href": "/veri-kaynaklari"
        }
      }
    ],
  },
  {
    path: '/veri-kaynaklari',
    title: 'Veri Kaynakları',
    metaTitle: 'Veri Kaynakları | Ne Kadar Ederdi?',
    description:
      'Ne Kadar Ederdi üzerinde kullanılan TÜFE, döviz, altın, gümüş, asgari ücret, BIST 100, Bitcoin, konut ve yakıt veri serilerinin kaynak yaklaşımı.',
    intro: "Ekonomik verinin yayımlayıcısı, aktarım servisi ve dönüşüm yöntemi aşağıda ayrı ayrı açıklanır. Tüm seriler doğrudan resmî API’den alınmış değildir. Katalogdaki ilk ve son gözlem aylarını Veri Durumu sayfasında kontrol edebilirsiniz.",
    sections: [
      {
        "title": "TÜFE: üçüncü taraf aktarımı",
        "body": "Katalogdaki TÜFE, Hakedis.org ve OSKA’da yayımlanan TÜİK endeks tablolarından derlenir. Bunlar aktarım kaynaklarıdır; site TÜİK’in resmî hesaplayıcısı değildir. İki tarihin aynı endeks bazında olması gerekir. Yüzde değişim tablosu ile endeks seviyelerini birbirinin yerine kullanmayın.",
        "link": {
          "label": "TÜFE aktarım tablosu — Hakedis.org",
          "href": "https://www.hakedis.org/endeksler/tuketici-fiyat-genel-endeksi-ve-degisim-oranlari-2003"
        }
      },
      {
        "title": "TÜFE tanımını doğrulama",
        "body": "TÜİK tüketici mal ve hizmetlerinin fiyat değişimini ölçer; kapsam kişisel alışveriş listenizden farklıdır. Resmî tanım, kapsam ve bültenleri kurumun veri portalından inceleyebilirsiniz.",
        "link": {
          "label": "TÜİK veri portalı",
          "href": "https://veriportali.tuik.gov.tr/"
        }
      },
      {
        "title": "Dolar ve euro: TCMB",
        "body": "TCMB günlük XML kayıtlarındaki döviz alış kurları ay içinde ortalanır. Bunlar gösterge kurlarıdır; bankanızın işlem kuru değildir. Tatil günlerinde ayrı kayıt bulunmayabilir.",
        "link": {
          "label": "TCMB kur kayıtları",
          "href": "https://www.tcmb.gov.tr/kurlar/today.xml"
        }
      },
      {
        "title": "Gram altın: ons fiyatından türetim",
        "body": "DataHub gold-prices derlemesindeki World Bank Pink Sheet ons altın USD fiyatı kullanılır. TL/gram = ons USD × USD/TL / 31,1034768. Kuyumcu satış fiyatı, işçilik ve makas bu türetimde yoktur.",
        "link": {
          "label": "DataHub altın verisi",
          "href": "https://datahub.io/core/gold-prices"
        }
      },
      {
        "title": "Gram gümüş: ayrı aktarım kaynağı",
        "body": "Eco3min’in World Bank Pink Sheet referanslı ons USD CSV derlemesi alınır; TCMB aylık USD/TL ortalamasıyla gram TL’ye çevrilir. Altınla aynı dönüşüm kullanılması aynı fiyat davranışı anlamına gelmez.",
        "link": {
          "label": "Gümüş CSV kaynağı",
          "href": "https://eco3min.fr/dataset/silver-price.csv"
        }
      },
      {
        "title": "BIST 100 ve Bitcoin: kapanış verileri",
        "body": "Yahoo Finance üzerinden XU100.IS ve BTC-USD aylık kapanışları alınır. BIST serisi temettülü toplam getiri değildir. Bitcoin dolar kapanışı aylık ortalama kurla TL’ye çevrilir; aynı andaki gerçek TL işlem fiyatı olarak okunamaz.",
        "link": {
          "label": "BIST 100 tarihsel veri",
          "href": "https://finance.yahoo.com/quote/XU100.IS/history/"
        }
      },
      {
        "title": "Asgari ücret: net ücret derlemesi",
        "body": "Resmî Gazete kararlarına referans veren Öcal Hukuk tablosu aktarım kaynağıdır. Yıl içindeki değişiklikler ayrı dönemlerdir. Tarihsel net ücret serisi bireysel bordro veya çalışan özelindeki vergi hesabını yapmaz.",
        "link": {
          "label": "Asgari ücret aktarım tablosu",
          "href": "https://www.ocalhukuk.com/yillara-gore-net-ve-brut-asgari-ucret-tablosu/"
        }
      },
      {
        "title": "Konut: endeks ve aktarım yolu",
        "body": "TCMB EVDS Konut Fiyat Endeksi veya Altınla sayfasındaki gömülü TCMB/EVDS tarihsel aktarımı kullanılır. Ülke genelindeki endeks tek bir evin satış değerini veya kira gelirini göstermez.",
        "link": {
          "label": "Konut endeksi aktarım sayfası",
          "href": "https://altinla.com/tr/konut/fiyat-endeksi"
        }
      },
      {
        "title": "Yakıt: litre fiyatı değil",
        "body": "Katalogdaki veri FRED üzerinden alınan Eurostat Türkiye HICP CP0722TRM086NEST serisidir. Kişisel ulaşım için yakıt ve yağlayıcıların fiyat endeksini ölçer. Endeks puanını TL/litre kabul ederek alınabilecek litre miktarını hesaplamak yanlıştır.",
        "link": {
          "label": "FRED / Eurostat yakıt serisi",
          "href": "https://fred.stlouisfed.org/series/CP0722TRM086NEST"
        }
      },
      {
        "title": "Güncelleme tarihi ve hata düzeltme",
        "body": "Katalog güncelleme tarihi her serinin o tarihe kadar gözlem içerdiği anlamına gelmez. Sonuç kartındaki kullanılan ay ve değerleri esas alın. Kaynak erişilemezse önceki gözlemler korunabilir. Hata bildirirken kaynak bağlantısını ve gözlem ayını ekleyin.",
        "link": {
          "label": "Veri hatası bildirin",
          "href": "/iletisim"
        }
      }
    ],
  },
  {
    path: '/iletisim',
    title: 'İletişim',
    metaTitle: 'İletişim | Ne Kadar Ederdi?',
    description: "Yayımlayıcı Egemen Yıldız’a veri hatası, hesaplama sorusu veya içerik düzeltmesi bildirin.",
    intro: "Ne Kadar Ederdi’nin yayımlayıcısı Egemen Yıldız’a aşağıdaki e-posta adresinden ulaşabilirsiniz. Özellikle yeniden üretilebilen hesaplama sorunları ve kaynak düzeltmeleri yararlıdır.",
    sections: [
      {
        "title": "E-posta",
        "body": "Veri hatası, erişim sorunu ve içerik önerileri için iletişim adresi:",
        "link": {
          "label": "egemenyildiz03@gmail.com",
          "href": "mailto:egemenyildiz03@gmail.com"
        }
      },
      {
        "title": "Hesaplama hatasını yeniden üretmek",
        "body": "Sayfa veya paylaşım bağlantısını, tutarı, giriş birimini ve başlangıç-bitiş aylarını yazın. Hangi sonuç kartında sorun gördüğünüzü ve beklediğiniz hesabı belirtin. Kimlik, banka hesabı veya kişisel mali belgeler göndermeniz gerekmez."
      },
      {
        "title": "Kaynak veya içerik düzeltmesi",
        "body": "Hatalı cümleyi ya da seri gözlemini belirtin; mümkünse özgün kurum yayınına bağlantı ekleyin. Böylece aktarım hatası, farklı tarih seçimi ve yöntem farkı birbirinden ayrılabilir."
      }
    ],
  },
  {
    path: '/gizlilik-politikasi',
    title: 'Gizlilik Politikası',
    metaTitle: 'Gizlilik Politikası | Ne Kadar Ederdi?',
    description:
      "Ne Kadar Ederdi'nin analitik, reklam, çerez ve kullanıcı verisi yaklaşımı hakkında gizlilik bilgileri.",
    intro:
      'Bu sayfa, Ne Kadar Ederdi kullanılırken hangi tür verilerin işlenebileceğini ve üçüncü taraf servislerin nasıl kullanıldığını açıklar.',
    sections: [
      {
        title: 'Toplanan veriler',
        body:
          'Sitede hesaplama yapmak için kullanıcı hesabı gerekmez. Miktar, tarih ve karşılaştırma seçimleri hesaplama amacıyla tarayıcınız ile sunucu arasında işlenir; bu bilgiler bireysel profil oluşturmak için kullanılmaz.',
      },
      {
        title: 'Analitik ve reklam',
        body:
          'Site performansını ve ziyaret trafiğini anlamak için Cloudflare Web Analytics kullanılabilir. Bu sürümde reklam gösterimi etkin değildir. Google AdSense etkinleştirilirse Google ve iş ortaklarının çerez veya benzer teknolojilerle yaptığı reklam ölçümü için bu politika ve gerekli tercih seçenekleri güncellenir.',
        link: {
          label: 'Google reklam verilerini nasıl kullanır?',
          href: 'https://policies.google.com/technologies/partner-sites',
        },
      },
      {
        title: 'Tarayıcı tercihleri ve teknik kayıtlar',
        body: 'Açık veya koyu tema tercihi tarayıcınızın yerel depolamasında tutulur. Paylaşım bağlantısındaki tutar ve tarihler bağlantıyı alan kişi tarafından görülebilir. Barındırma ve kötüye kullanım önleme sırasında IP adresi, istek zamanı ve teknik hata kayıtları işlenebilir. Harici yazı tipleri Google Fonts üzerinden yüklenir.',
      },
      {
        title: 'İletişim bilgileri',
        body:
          'E-posta ile bize ulaşırsanız, paylaştığınız ad, e-posta adresi ve mesaj içeriği yalnızca talebinize cevap vermek için kullanılır.',
      },
      {
        title: 'Üçüncü taraf bağlantılar',
        body:
          'Sitede veri kaynaklarına, sosyal paylaşım servislerine veya reklam ağlarına yönlendiren bağlantılar bulunabilir. Bu servislerin kendi gizlilik politikalarını incelemeniz önerilir.',
      },
    ],
  },
  {
    path: '/kullanim-sartlari',
    title: 'Kullanım Şartları',
    metaTitle: 'Kullanım Şartları | Ne Kadar Ederdi?',
    description:
      "Ne Kadar Ederdi hesaplama aracının kullanım koşulları, veri sınırları ve sorumluluk reddi.",
    intro:
      'Ne Kadar Ederdi sitesini kullanarak hesaplamaların yaklaşık ve bilgilendirme amaçlı olduğunu kabul etmiş olursunuz.',
    sections: [
      {
        title: 'Yaklaşık hesaplama',
        body:
          'Sonuçlar aylık tarihsel serilerden üretilen yaklaşık karşılaştırmalardır. Veri kaynaklarında revizyon, gecikme, eksiklik veya metodoloji farkı olabilir.',
      },
      {
        title: 'Finansal tavsiye değildir',
        body:
          'Sitedeki içerikler yatırım, finans, hukuk, vergi veya muhasebe tavsiyesi niteliğinde değildir. Kararlarınız için uzman görüşü almanız önerilir.',
      },
      {
        title: 'Kullanım sorumluluğu',
        body:
          'Hesaplama sonuçlarını yorumlama ve kullanma sorumluluğu kullanıcıya aittir. Site kesintisiz, hatasız veya belirli bir amaca uygun sonuç garantisi vermez.',
      },
      {
        title: 'Değişiklikler',
        body:
          'Veri serileri, reklam yerleşimleri, sayfa içerikleri ve kullanım şartları zaman içinde güncellenebilir.',
      },
    ],
  },
];

export const GUIDE_PAGES: GuidePageContent[] = [
  {
    path: '/rehberler/tufe-ile-para-degeri-nasil-hesaplanir',
    title: 'TÜFE ile para değeri nasıl hesaplanır?',
    metaTitle: 'TÜFE ile Para Değeri Nasıl Hesaplanır? | Ne Kadar Ederdi?',
    description:
      'Geçmişteki bir TL tutarının TÜFE endeksiyle bugünkü yaklaşık alım gücüne nasıl taşındığını örneklerle okuyun.',
    intro: "Eski tutarı yeni fiyatlara taşımak ile bugünkü tutarı geçmiş fiyatlarla ifade etmek ters yönlü iki işlemdir. Bu rehber hangi durumda çarpıp hangi durumda böleceğinizi ve nominal artıştan reel değişime nasıl geçeceğinizi gösterir.",
    calculatorHref: '/#amount=10000&unit=try&start=2010-01&criteria=cpi%2CminimumWage%2Cusd',
    sections: [
      {
        "title": "İleri taşıma: eski tutarın yeni karşılığı",
        "body": "Bu rehberdeki sayılar tamamen varsayımsaldır. Başlangıç endeksi 200, bitiş endeksi 500 olsun. Çarpan 500 / 200 = 2,5; eski 1.000 TL’nin bitiş dönemi karşılığı 1.000 × 2,5 = 2.500 TL olur. Bu tutar paranızın ulaştığı banka bakiyesi değil, tüketici fiyat değişimine göre eşdeğeridir."
      },
      {
        "title": "Geriye taşıma: aynı paranın eski fiyatlarla değeri",
        "body": "Aynı örnekte bugünkü 1.000 TL başlangıç fiyatlarıyla 1.000 × 200 / 500 = 400 TL’dir. Nominal tutar değişmeden tutulmuşsa başlangıç alım gücünün %40’ı kalmıştır. %150 fiyat artışı ve %60 alım gücü kaybı çelişmez: hesapların paydaları farklıdır."
      },
      {
        "title": "Maaş artışından reel değişime",
        "body": "Varsayımsal maaş 1.000 TL’den 2.000 TL’ye, endeks 200’den 500’e çıksın. Maaş çarpanı 2, fiyat çarpanı 2,5’tir. Reel değişim = (2 / 2,5 − 1) × 100 = −%20. Maaşın ikiye katlanması alım gücünün arttığını göstermez. Yüzde artışları birbirinden çıkarmak doğru reel sonucu vermez."
      },
      {
        "title": "Aylık oranları neden toplamamalısınız?",
        "body": "Varsayımsal ardışık iki ayda %10 ve %20 fiyat artışı varsa çarpan 1,10 × 1,20 = 1,32; toplam artış %32 olur. %30 hesabı bileşik etkiyi atlar. Aynı bazdaki başlangıç ve bitiş endekslerinin oranı bu birikimi içerir; ayrıca aylık oran eklemeyin."
      },
      {
        "title": "Sonucu kontrol etmek için üç soru",
        "body": "Endeksler aynı bazdan mı geliyor? Sonuç kartındaki aylar istediğiniz dönemle eşleşiyor mu? Sorduğunuz soru genel tüketim sepeti mi, belirli bir ürün mü? TÜFE kişisel sepetinizi veya tek kira sözleşmesini temsil etmez. Bir ürün için gerçek eski ve yeni fiyatını ayrıca karşılaştırın."
      }
    ],
    takeaways: [
      "Eski tutarı ileri taşımak için bitiş endeksi / başlangıç endeksi kullanılır.",
      "Reel değişim, nominal çarpanın fiyat çarpanına bölünmesiyle hesaplanır.",
      "Örnekteki endeksler varsayımsaldır; gerçek hesap için sonuç kartındaki gözlemleri kullanın."
    ],
  },
  {
    path: '/rehberler/dolar-ve-tufe-karsilastirmasi',
    title: 'Dolar ve TÜFE karşılaştırması nasıl okunur?',
    metaTitle: 'Dolar ve TÜFE Karşılaştırması | Ne Kadar Ederdi?',
    description:
      'Aynı tutarın dolar kuru ve TÜFE ölçütleriyle neden farklı sonuçlar verdiğini, hangi sonucun neyi anlattığını öğrenin.',
    intro: "“Dolar tutsaydım ne olurdu?” ile “aynı tüketim düzeyini korumak için kaç TL gerekir?” farklı sorulardır. İki sonucu birlikte okumak kur artışının yerel fiyat artışının önünde mi gerisinde mi kaldığını ayırt etmenizi sağlar.",
    calculatorHref: '/#amount=10000&unit=try&start=2010-01&criteria=cpi%2Cusd%2Ceur',
    sections: [
      {
        "title": "Dolar hesabını iki işleme ayırın",
        "body": "Bu rehberin sayıları varsayımsaldır. 10.000 TL / 10 TL-dolar başlangıç kuru = 1.000 dolar. Bitiş kuru 25 TL/dolar olursa karşılık 1.000 × 25 = 25.000 TL olur. Aynı işlem 10.000 × 25 / 10 biçiminde de yazılır. Dolar miktarı sabittir; hesaba faiz eklenmez."
      },
      {
        "title": "Aynı dönemin TÜFE karşılığını bulun",
        "body": "Örnekte TÜFE çarpanı 3 olsun. Başlangıçtaki 10.000 TL’nin tüketici fiyatlarına göre karşılığı 30.000 TL’dir. Dolar karşılığı ile arada 5.000 TL fark vardır. Gerçek karşılaştırmada iki serinin başlangıç ve bitiş aylarının eşleştiğini kontrol edin."
      },
      {
        "title": "TL kazancı ile reel değişimi ayırın",
        "body": "Kur çarpanı 2,5, TÜFE çarpanı 3 ise reel değişim (2,5 / 3 − 1) × 100 ≈ −%16,7 olur. Kurun %150 yükselmesi yerel alım gücünün %150 arttığını söylemez. Bu sonuç Türkiye fiyatlarına göredir; ABD’de doların alım gücü için ABD fiyat endeksi gerekir."
      },
      {
        "title": "Döviz borcu sorusu nasıl farklılaşır?",
        "body": "Sabit 1.000 dolar borcun TL karşılığı kurla değişir. Gerçek ödeme yükü için ödeme gününün kuru, sözleşme faizi ve masraflar gerekir. Aylık ortalama gösterge kur, ödeme tutarını belirlemez. Hesaplayıcı tarihsel ölçeği karşılaştırır."
      },
      {
        "title": "İthal ürün fiyatını kurdan türetmeyin",
        "body": "Telefon veya otomobilin fiyatı vergi, model, stok ve satıcı fiyatlamasına da bağlıdır. Dolar sonucunun TÜFE’den yüksek çıkması tek bir ürünün aynı oranda pahalandığını kanıtlamaz. Ürün sorusu için karşılaştırılabilir ürünün gerçek eski ve yeni fiyatlarını kullanın."
      }
    ],
    takeaways: [
      "Dolar sonucu sabit döviz miktarının varsayımsal TL karşılığıdır.",
      "Kur ve TÜFE aynı tarih aralığında karşılaştırılmalıdır.",
      "Kur artışını doğrudan yerel alım gücü değişimi olarak okumayın."
    ],
  },
  {
    path: '/rehberler/gram-altin-ile-alim-gucu-hesaplama',
    title: 'Gram altın ile alım gücü hesabı aynı şey mi?',
    metaTitle: 'Gram Altın ile Alım Gücü Hesaplama | Ne Kadar Ederdi?',
    description:
      'Gram altın karşılaştırmasının neyi gösterdiğini, TÜFE alım gücü hesabından neden ayrıldığını okuyun.',
    intro: "Altın karşılaştırmasında ilk soru fiyatın nereden geldiğidir. Sitedeki gram TL serisi kuyumcu satış fiyatı değildir; aylık ons altın fiyatı ile dolar kurundan hesaplanır. Bu ayrım gerçek bir işlemle sonuç arasındaki farkı açıklar.",
    calculatorHref: '/#amount=10000&unit=try&start=2010-01&criteria=cpi%2Cgold%2Csilver',
    sections: [
      {
        "title": "Ons fiyatından gram TL’ye",
        "body": "Formül: gram TL = ons USD × USD/TL / 31,1034768. Tamamen varsayımsal 2.000 USD/ons ve 30 TL/USD yaklaşık 1.929,04 TL/gram verir. Bu güncel fiyat değil, dönüşüm örneğidir. Aylık ortalamalar belirli bir günün işlem fiyatını temsil etmez."
      },
      {
        "title": "Geçmiş tutarın sabit altın miktarını izleme",
        "body": "Varsayımsal eski gram fiyatı 100 TL ise 10.000 TL, 100 gram fiyat karşılığıdır. Yeni gram fiyatı 400 TL olursa aynı miktarın karşılığı 40.000 TL olur. Formül 10.000 × 400 / 100’dür. Altın miktarı artmaz; sabit miktarın TL karşılığı değişir."
      },
      {
        "title": "Ons ve kur etkisi birlikte çalışır",
        "body": "Uyumlu verilerle gram TL çarpanı = ons USD çarpanı × kur çarpanı. Varsayımsal ons fiyatı %10 düşerken kur %50 artarsa 0,90 × 1,50 = 1,35, yani %35 yükseliş olur. TL yükselişinin tamamını ons altın kazancı diye yorumlamayın."
      },
      {
        "title": "Alım gücü için TÜFE ile ikinci adım",
        "body": "Varsayımsal altın çarpanı 4, TÜFE çarpanı 5 ise TÜFE’ye göre değişim (4 / 5 − 1) × 100 = −%20’dir. Altının TL fiyatı artsa da bu örnekte tüketim sepeti daha hızlı pahalanmıştır. Kişisel harcama sepetiniz hakkında aynı sonuç kesin değildir."
      },
      {
        "title": "Gerçek işlemin farkı",
        "body": "Alış ve satış fiyatı farklıdır. Saflık, işçilik, komisyon ve saklama maliyeti net sonucu değiştirir. Gümüşte aynı gram dönüşümü kullanılır fakat metalin kendi ons fiyatı geçerlidir. İki metal aynı dönüşümden geçtiği için aynı performansı göstermez."
      }
    ],
    takeaways: [
      "Gram altın ons USD ve kurdan türetilir; kuyumcu kotasyonu değildir.",
      "TL fiyat artışı ons ve kur etkisini birlikte içerir.",
      "Alım gücü için altın çarpanını TÜFE çarpanıyla karşılaştırın."
    ],
  },
  {
    path: '/rehberler/asgari-ucretin-yillara-gore-alim-gucu',
    title: 'Asgari ücretin yıllara göre alım gücü nasıl karşılaştırılır?',
    metaTitle: 'Asgari Ücretin Yıllara Göre Alım Gücü | Ne Kadar Ederdi?',
    description:
      'Asgari ücret serisinin eski maaş, kira ve fiyat karşılaştırmalarında nasıl yorumlanması gerektiğini açıklayan rehber.',
    intro: "Maaşın kaç asgari ücrete denk geldiği ile ne satın alabildiği ayrı ölçülerdir. İlki gelir ölçeğini, ikincisi fiyatlar karşısındaki durumu anlatır. Bu rehber iki hesabı birbirine karıştırmadan yapmanızı sağlar.",
    calculatorHref: "/#amount=10000&unit=try&start=2010-01&criteria=cpi%2CminimumWage",
    sections: [
      {
        "title": "Maaşı asgari ücretin katı olarak yazma",
        "body": "Bu rehberdeki rakamlar varsayımsaldır. 6.000 TL maaş / 2.000 TL net asgari ücret = 3 kat. Yeni dönemde 24.000 TL maaş / 10.000 TL asgari ücret = 2,4 kat. Maaş nominal olarak artmış olsa da asgari ücretle göreli mesafe daralmıştır."
      },
      {
        "title": "Eski göreli konumu koruyan maaş",
        "body": "Eski 3 kat oranını korumak için yeni dönemde 3 × 10.000 = 30.000 TL gerekir. Sitedeki asgari ücret karşılığı aynı hesabı 6.000 × 10.000 / 2.000 ile yapar. Bu rakam piyasa ücreti önerisi veya çalışanın hak ettiği maaş beyanı değildir."
      },
      {
        "title": "Asgari ücretin kendi reel değişimi",
        "body": "Ücret çarpanını aynı dönemin TÜFE çarpanına bölün. Varsayımsal ücret çarpanı 5, TÜFE çarpanı 4 ise (5 / 4 − 1) × 100 = %25 reel değişim olur. Genel tüketici fiyatları kişinin gerçek bütçesini tam temsil etmez."
      },
      {
        "title": "Kira yükü için ayrı oran",
        "body": "Kira / net maaş, gelirin kiraya ayrılan payıdır. Eski kira 2.000 TL ve maaş 6.000 TL ise pay %33,3; yeni kira 12.000 TL ve maaş 24.000 TL ise %50’dir. Kendi yükünüz için iki dönemin gerçek kira ve maaşı gerekir; sadece asgari ücret artışı yeterli değildir."
      },
      {
        "title": "Net-brüt ve tarih kontrolü",
        "body": "Net maaşı net asgari ücretle aynı ay üzerinden karşılaştırın. Yıl içi ücret değişikliğinde ocak ve temmuz farklı sonuç verebilir. Tarihsel net ücret derlemelerinde vergi ve çalışan varsayımları dönemler arasında değişebilir. Seri bireysel bordro veya hukuki alacak hesabı değildir."
      }
    ],
    takeaways: [
      "Asgari ücret katı fiyatlardan ayrı bir göreli gelir ölçüsüdür.",
      "Alım gücü için aynı dönemin TÜFE çarpanını da kullanın.",
      "Kira yükü için gerçek kira ve net maaş değerlerini karşılaştırın."
    ],
  },
  {
    path: '/rehberler/2010daki-1000-tl-bugun-ne-kadar',
    title: '2010’daki 1.000 TL bugün ne kadar ederdi?',
    metaTitle: '2010’daki 1.000 TL Bugün Ne Kadar? | Ne Kadar Ederdi?',
    description:
      '2010 yılındaki 1.000 TL tutarını TÜFE, dolar, altın ve asgari ücret gibi farklı ölçütlerle yorumlama rehberi.',
    intro:
      '2010’daki 1.000 TL için tek bir doğru cevap yoktur. TÜFE, dolar, altın ve asgari ücret sonuçları farklı ekonomik anlamlara gelir; bu rehber sonuçları nasıl okuyacağınızı açıklar.',
    calculatorHref: '/#amount=1000&unit=try&start=2010-01&criteria=cpi%2Cusd%2Cgold%2CminimumWage',
    sections: [
      {
        title: 'Önce soruyu netleştirin',
        body:
          '“Bugünkü alım gücü ne?” diyorsanız reel TL sonucuna, “döviz karşılığı ne oldu?” diyorsanız dolar veya euro sonucuna bakmanız gerekir.',
      },
      {
        title: 'Altın sonucu ayrı okunur',
        body:
          'Gram altın sonucu, 1.000 TL’nin altın fiyatına göre nasıl değişeceğini gösterir. Bu alım gücü veya maaş karşılaştırması değildir.',
      },
      {
        title: 'Hesap makinesiyle ayrıntılandırın',
        body:
          'Rehberdeki bağlantı hesap makinesini 2010 başlangıcı ve 1.000 TL tutarıyla açar. Bitiş ayını ve ölçütleri değiştirerek sonucu yeniden yorumlayabilirsiniz.',
      },
    ],
    takeaways: [
      'Aynı tutar farklı ölçütlerde farklı sonuç verir.',
      'Rehber sayfası yorum çerçevesi sunar; hesap makinesi güncel seriyle sonucu üretir.',
      'Arbitrary hesaplama URL’leri hash ile paylaşılır, otomatik indexlenmez.',
    ],
  },
];

export const PUBLISHER_PAGES: PublisherPageContent[] = [
  {
    path: '/atlas/2010daki-1000-tl-bugun-ne-anlatiyor',
    hub: 'atlas',
    eyebrow: 'Para Değeri Atlası',
    title: '2010’daki 1.000 TL bugün ne anlatıyor?',
    metaTitle: '2010’daki 1.000 TL Bugün Ne Anlatıyor? | Para Değeri Atlası',
    description: "Ocak 2010 başlangıçlı 1.000 TL örneğinde tüketim, döviz, altın ve ücret karşılıklarını sonuç tablosuyla yorumlayın.",
    intro: "Başlangıç ayı Ocak 2010, tutar 1.000 TL. Bu tutar örnektir; belirli bir kişinin birikimini temsil etmez. Aşağıdaki hesap katalogdaki gözlemlerle üretilir. “Bugün” ifadesini takvim günü olarak değil, tabloda yazan bitiş ayı olarak okuyun.",
    calculatorHref: "/#amount=1000&unit=try&start=2010-01&criteria=cpi%2Cusd%2Ceur%2Cgold%2CminimumWage",
    calculation: {
      "amount": 1000,
      "inputUnit": "try",
      "startMonth": "2010-01",
      "criteria": [
        "cpi",
        "usd",
        "eur",
        "gold",
        "minimumWage"
      ]
    },
    sections: [
      {
        "title": "Hangi soruyu cevaplıyoruz?",
        "body": "Eski bir fiyat etiketini taşımak için TÜFE satırına bakın. Sabit dolar veya altın miktarının TL karşılığı için ilgili piyasa satırını kullanın. Asgari ücret satırı aynı gelir oranını koruyan tutarı verir. Satırlar birbirinin alternatif tahmini değil, farklı soruların cevaplarıdır."
      },
      {
        "title": "Bir satırı yeniden hesaplayın",
        "body": "Sonucu 1.000’e bölerseniz tablodaki çarpana ulaşırsınız; küçük farklar gösterim yuvarlamasından kaynaklanabilir. Ayrıntılı hesapta bitiş seri değerini başlangıç değerine bölerek aynı çarpanı kontrol edin. Sayıyı yalnızca büyük göründüğü için değil, iki gözleme dayanarak değerlendirin."
      },
      {
        "title": "1.000 TL nakit tutulmuş olsaydı",
        "body": "TÜFE satırı kendiliğinden büyüyen nakit bakiyesi değildir. Faizsiz 1.000 TL nominal olarak 1.000 TL kalır. TÜFE çarpanı F ise başlangıç fiyatlarıyla değeri 1.000 / F TL, korunan alım gücü oranı 1 / F olur. Varsayımsal F = 4 için 250 TL ve %25 bulunur. Gerçek F’yi tablodan alın."
      },
      {
        "title": "2010 yılı neden tek tarih değil?",
        "body": "Ocak ile aralık arasında kur ve fiyat düzeyi değişebilir. Gerçek bir ödemeyi incelerken başlangıcı ödemenin ayına getirin. Seçilen serilerin kapsadığı ortak dönem de değişebilir. Sonucu paylaşırken tutarla birlikte başlangıç ayı, bitiş ayı ve ölçütü yazın."
      },
      {
        "title": "Düzenli birikim hesabı değildir",
        "body": "Bir defalık başlangıç tutarı her ay para yatırılmış gibi yorumlanamaz. Düzenli alımda her ödemenin ayrı tarihi ve fiyatı vardır. Tablo sonradan eklenen parayı ve işlem maliyetlerini içermez; geçmişte hangi yatırımın yapılması gerektiğini söylemez."
      }
    ],
  },
  {
    path: '/atlas/eski-maaslarin-alim-gucu',
    hub: 'atlas',
    eyebrow: 'Para Değeri Atlası',
    title: 'Eski maaşların alım gücü nasıl okunmalı?',
    metaTitle: 'Eski Maaşların Alım Gücü | Para Değeri Atlası',
    description: "Ocak 2015 için örnek 5.000 TL maaşı tüketici fiyatları ve göreli gelir ölçeğiyle değerlendirin.",
    intro: "Ocak 2015 için 5.000 TL net maaş varsayımıyla başlayalım. Bu rakam dönem ortalaması veya bir mesleğin maaşı değildir. Tablo iki ayrı eşiği gösterir: genel fiyat değişimine yetişmek ve asgari ücret karşısındaki eski oranı korumak.",
    calculatorHref: "/#amount=5000&unit=try&start=2015-01&criteria=cpi%2CminimumWage%2Cusd%2Cgold",
    calculation: {
      "amount": 5000,
      "inputUnit": "try",
      "startMonth": "2015-01",
      "criteria": [
        "cpi",
        "minimumWage",
        "usd",
        "gold"
      ]
    },
    sections: [
      {
        "title": "Birinci eşik: tüketici fiyatlarına yetişmek",
        "body": "TÜFE tutarı, 5.000 TL başlangıç maaşının bitiş ayındaki genel fiyat düzeyine taşınmış karşılığıdır. Yeni maaşınızı bu tutara bölün. Oran 1’in altındaysa genel fiyatlara göre geride, üstündeyse ileridesiniz. Tarih ve net-brüt tanımı uyuşmadan kıyas yapmayın."
      },
      {
        "title": "İkinci eşik: göreli gelir konumu",
        "body": "Asgari ücret satırı eski göreli gelir konumunu bitiş ayına taşır. TÜFE eşiğini geçmek bu eşiği de geçmek değildir. Asgari ücret ve fiyatlar farklı hızlarda değişebilir; iki sonuç farklı yönlere işaret edebilir."
      },
      {
        "title": "İki eşik farklı işaret verirse",
        "body": "Tamamen varsayımsal TÜFE karşılığı 30.000 TL, asgari ücret karşılığı 40.000 TL ve yeni maaş 36.000 TL olsun. Genel fiyatlara göre 36.000 / 30.000 = 1,20, yani %20 üzerindedir. Eski asgari ücret oranına göre 36.000 / 40.000 = 0,90, yani %10 altındadır. Alım gücü artarken göreli ücret mesafesi daralabilir."
      },
      {
        "title": "Hayat ve çalışma koşullarını eşitleyin",
        "body": "Çalışma saatini, net-brüt tanımını ve düzenli yan ödemeleri kontrol edin. Yarı zamanlı işten tam zamanlı işe geçerken aylık maaş artışı tek başına ücret iyileşmesi değildir. Şehir, kira veya hane büyüklüğü değişmişse kişisel bütçe sonucu TÜFE hesabından ayrılabilir."
      },
      {
        "title": "Maaş ile birikim farklı hesaplar",
        "body": "Döviz ve altın satırları maaş tutarına ek bağlam sağlar. Maaşın tamamı bu varlıklarda tutulmuş gibi birikim hesabı yapmaz. Yıllar içindeki birikim için her ayın tasarrufu ve işlem tarihi gerekir; tek başlangıç tutarı yeterli değildir."
      }
    ],
  },
  {
    path: '/atlas/dolar-mi-tufe-mi-altin-mi',
    hub: 'atlas',
    eyebrow: 'Para Değeri Atlası',
    title: 'Dolar mı, TÜFE mi, altın mı?',
    metaTitle: 'Dolar mı TÜFE mi Altın mı? | Para Değeri Atlası',
    description: "Ocak 2020 başlangıçlı 10.000 TL örneğinde fiyat çarpanlarını karşılaştırın; reel oranı ve dönem etkisini ayırın.",
    intro: "Ocak 2020 başlangıçlı 10.000 TL örneğinde amaç hangi karşılaştırmanın hangi soruyu cevapladığını görmek. Tablo aynı tutarı tüketici fiyatları, döviz ve değerli madenlerle ayrı ayrı taşır; gelecek için bir varlık önerisi sunmaz.",
    calculatorHref: '/#amount=10000&unit=try&start=2020-01&criteria=cpi%2Cusd%2Ceur%2Cgold%2Csilver',
    calculation: {
      amount: 10000,
      inputUnit: 'try',
      startMonth: '2020-01',
      criteria: ['cpi', 'usd', 'eur', 'gold', 'silver'],
    },
    sections: [
      {
        "title": "Ölçütü sorudan seçin",
        "body": "Genel tüketim düzeyini koruyan tutar için TÜFE; sabit döviz miktarı için dolar veya euro; sabit metal miktarı için altın veya gümüş kullanılır. TÜFE satın alınan bir yatırım ürünü değildir. Tüm satırları yatırım getirisi sıralaması diye sunmak yanıltıcıdır."
      },
      {
        "title": "TÜFE’ye göre ortak kıyas kurma",
        "body": "Varlığın çarpanını TÜFE çarpanına bölün. 1’den büyükse seçilen dönemde brüt fiyat serisi TÜFE artışını aşmıştır. Yüzde fark = (varlık çarpanı / TÜFE çarpanı − 1) × 100. Varsayımsal 6 ve 5 çarpanları için %20 bulunur. Gerçek hesapta tablonun çarpanlarını kullanın."
      },
      {
        "title": "Başlangıç ayına duyarlılığı sınayın",
        "body": "Başlangıcı bir yıl ileri, sonra bir yıl geri alın; bitişi aynı bırakın. Sıralamanın veya farkların değişmesi zaman penceresinin etkisini gösterir. Başlangıç sıra dışı yüksek veya düşük bir fiyata rastlarsa tek aralığın sonucu uzun dönemi temsil etmeyebilir."
      },
      {
        "title": "İki uç nokta aradaki riski saklar",
        "body": "Aynı başlangıç ve bitiş değerlerine sahip iki seri arada farklı düşüşler yaşamış olabilir. Tablo ara kaybı, oynaklığı veya ihtiyaç anında satış fiyatını ölçmez. Bitiş tutarı yüksek olan satırın daha düşük riskli olduğu çıkarılamaz."
      },
      {
        "title": "Yöntem farklarını ve bağlamı koruyun",
        "body": "Döviz aylık ortalama; metaller aylık ons fiyatı ve kurdan türetilen değerlerdir. Aynı anda uygulanabilir işlem fiyatları değildir. Sonucu aktarırken tarihleri, başlangıç tutarını ve brüt fiyat karşılaştırması olduğunu yazın. Makas, vergi ve komisyon net sonucu değiştirir; geçmiş sıralama geleceğin tahmini değildir."
      }
    ],
  },
  {
    path: '/guncellemeler/2026-09',
    hub: 'guncellemeler',
    eyebrow: 'Aylık veri notu',
    title: 'Eylül 2026 veri durumu',
    metaTitle: 'Eylül 2026 Veri Durumu | Ne Kadar Ederdi?',
    description:
      'Ne Kadar Ederdi veri setindeki serilerin son ayları, geciken resmi veriler ve hesaplama davranışı hakkında Eylül 2026 notu.',
    intro:
      'Bu not, sitenin kullandığı veri setinde hangi serilerin hangi aya kadar geldiğini ve gecikmeli yayımlanan serilerde hesaplayıcının neden son güvenilir aya döndüğünü açıklar.',
    sections: [
      {
        title: 'Resmi seriler gecikmeli gelir',
        body:
          'TÜFE, konut endeksi ve bazı maliyet serileri kaynak kurumların yayımlama takvimine bağlıdır. Bir ay seçilebilir olsa bile hesaplama, ilgili ölçütlerin mevcut son ortak ayına göre yapılır.',
      },
      {
        title: 'Piyasa serileri daha hızlı güncellenir',
        body:
          'Döviz, altın, Bitcoin ve BIST gibi piyasa serileri daha sık değişir. Aylık kıyaslama yapısında seri değerleri güncellenirken yöntem aynı kalır.',
      },
      {
        title: 'Kullanıcıya gösterilen uyarı bilinçlidir',
        body:
          'Seçili ölçütlerde son ortak veri ayı daha gerideyse hesaplayıcı bunu form içinde belirtir. Amaç boş ya da uydurma veriyle sonuç üretmemektir.',
      },
    ],
  },
  {
    path: '/guncellemeler/2026-08',
    hub: 'guncellemeler',
    eyebrow: 'Aylık veri notu',
    title: 'Ağustos 2026 veri durumu',
    metaTitle: 'Ağustos 2026 Veri Durumu | Ne Kadar Ederdi?',
    description:
      'Ağustos 2026 itibarıyla para değeri hesaplamalarında kullanılan aylık veri yaklaşımı, ortak ay mantığı ve kaynak gecikmeleri.',
    intro:
      'Ne Kadar Ederdi, farklı kaynaklardan gelen serileri tek bir ekranda okutur. Bu yüzden her seri için “son veri ayı” aynı olmayabilir.',
    sections: [
      {
        title: 'Ortak ay yaklaşımı hatalı karşılaştırmayı önler',
        body:
          'Birden fazla ölçüt seçildiğinde araç, tüm seçili serilerde güvenilir veri bulunan son ortak aya döner. Böylece bir seri güncel, diğeri eksik haldeyken yanıltıcı sonuç gösterilmez.',
      },
      {
        title: 'Kaynak notları sonuç kartlarında tutulur',
        body:
          'Her sonuç kartı başlangıç ve bitiş verisini, çarpanı ve kaynak notunu ayrıca gösterir. Bu notlar kullanıcının sonucu nasıl okuyacağını anlaması için önemlidir.',
      },
      {
        title: 'Güncelleme düzeni sitenin parçasıdır',
        body:
          'Veri seti düzenli kontrol edilir. Yeni seri yayımlandığında hesaplama motoru aynı oran yöntemini kullanarak sonuçları günceller.',
      },
    ],
  },
  {
    path: '/veri-defteri/tufe',
    hub: 'veri-defteri',
    eyebrow: 'Veri Defteri',
    title: 'TÜFE serisi',
    metaTitle: 'TÜFE Serisi | Veri Defteri',
    description:
      'TÜFE serisinin Ne Kadar Ederdi içinde neyi ölçtüğü, nasıl kullanıldığı, hangi sınırlara sahip olduğu ve son veri ayı.',
    sections: [
      {
        title: 'Ne anlatır?',
        body:
          'TÜFE serisi geçmişteki TL tutarının tüketici fiyatları karşısındaki yaklaşık bugünkü alım gücünü hesaplamak için kullanılır.',
      },
      {
        title: 'Ne anlatmaz?',
        body:
          'TÜFE kişisel harcama sepetini, bölgesel fiyat farkını, yatırım getirisini veya resmi hak ediş hesabını tek başına temsil etmez.',
      },
      {
        title: 'Hesaplama yöntemi',
        body:
          'Bitiş ayındaki endeks başlangıç ayındaki endekse bölünür; çıkan çarpan girilen TL tutarına uygulanır.',
      },
    ],
    intro:
      'TÜFE, sitenin reel TL sonucunun temelidir. En çok “geçmişteki para bugünün alım gücüyle ne ederdi?” sorusunda kullanılır.',
  },
  {
    path: '/veri-defteri/dolar',
    hub: 'veri-defteri',
    eyebrow: 'Veri Defteri',
    title: 'Dolar serisi',
    metaTitle: 'Dolar Serisi | Veri Defteri',
    description:
      'Dolar serisinin TL karşılaştırmalarında nasıl kullanıldığı, kur bazlı sonucun ne anlattığı ve hangi sınırlara sahip olduğu.',
    intro:
      'Dolar serisi, TL’nin ABD doları karşısındaki tarihsel değişimini okumak için kullanılır. Bu sonuç enflasyon hesabı değildir.',
    sections: [
      {
        title: 'Ne anlatır?',
        body:
          'Dolar sonucu, seçilen TL tutarının kur değişimine göre bugün yaklaşık hangi TL karşılığa denk geleceğini gösterir.',
      },
      {
        title: 'Ne anlatmaz?',
        body:
          'Dolar kuru yerel tüketici fiyatlarıyla aynı şey değildir. İthal ürün etkisi için fikir verse de genel alım gücünün tek ölçütü değildir.',
      },
      {
        title: 'Nasıl okunur?',
        body:
          'Kur çarpanı büyüdükçe aynı TL tutarının dolar bazlı bugünkü karşılığı artar. Sonuç alış-satış makası ve işlem maliyeti içermez.',
      },
    ],
  },
  {
    path: '/veri-defteri/gram-altin',
    hub: 'veri-defteri',
    eyebrow: 'Veri Defteri',
    title: 'Gram altın serisi',
    metaTitle: 'Gram Altın Serisi | Veri Defteri',
    description:
      'Gram altın fiyat serisinin geçmiş para değeri karşılaştırmalarında nasıl yorumlandığı ve TÜFE’den neden farklı sonuç verdiği.',
    intro:
      'Gram altın serisi, TL tutarlarını değerli maden fiyatı üzerinden okumak için kullanılır. Ons altın ve kur hareketleri sonucu etkiler.',
    sections: [
      {
        title: 'Ne anlatır?',
        body:
          'Geçmişteki bir TL tutarının gram altın fiyatındaki değişime göre bugünkü yaklaşık TL karşılığını gösterir.',
      },
      {
        title: 'Ne anlatmaz?',
        body:
          'Bu sonuç kişisel yatırım getirisi garantisi değildir; vergi, makas, komisyon ve saklama maliyeti dahil değildir.',
      },
      {
        title: 'Nasıl kullanılır?',
        body:
          'TÜFE sonucu ile yan yana okunması, alım gücü ve değerli maden fiyatı perspektiflerinin ayrılmasına yardım eder.',
      },
    ],
  },
  {
    path: '/veri-defteri/asgari-ucret',
    hub: 'veri-defteri',
    eyebrow: 'Veri Defteri',
    title: 'Asgari ücret serisi',
    metaTitle: 'Asgari Ücret Serisi | Veri Defteri',
    description:
      'Asgari ücret serisinin eski maaş, kira ve fiyat karşılaştırmalarında nasıl kullanıldığı ve hangi sınırlara sahip olduğu.',
    intro:
      'Asgari ücret serisi, belirli bir tutarın dönemsel temel gelir düzeyi karşısındaki ağırlığını okumak için kullanılır.',
    sections: [
      {
        title: 'Ne anlatır?',
        body:
          'Aynı tutarın farklı dönemlerdeki net asgari ücret düzeyine göre nasıl konumlandığını gösterir.',
      },
      {
        title: 'Ne anlatmaz?',
        body:
          'Resmi bordro, kıdem, tazminat veya hukuki hak ediş hesabı değildir. Gelir ölçeği olarak yaklaşık karşılaştırma sunar.',
      },
      {
        title: 'Nerede işe yarar?',
        body:
          'Eski maaş, kira ve temel gider karşılaştırmalarında TÜFE sonucunu tamamlayan gelir perspektifi sağlar.',
      },
    ],
  },
];
