import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Loader2 } from 'lucide-react';
import { AdSlot } from './components/AdSlot';
import { Logo } from './components/Logo';
import { MonthSelect } from './components/MonthSelect';
import { MoneyValue } from './components/MoneyValue';
import { ResultCard } from './components/ResultCard';
import { SpotMarketBar } from './components/SpotMarketBar';
import { calculateOnBackend, fetchSeries } from './lib/api';
import { defaultState, isDefaultState, parseStateFromUrl, stateToSearchParams } from './lib/calculator';
import { formatEditableNumber, formatInputAmount, formatMoney, formatMonth, parseLocalizedNumber } from './lib/format';
import type { CalculationResult, CalculatorState, InputUnit, MarketCatalog, SeriesKey } from './types';

const MAX_INPUT_AMOUNT = 999_999_999_999;
const MAX_INPUT_MESSAGE = 'Miktar en fazla 999.999.999.999 olabilir.';

const CRITERIA: { key: SeriesKey; label: string; hint: string; group: 'purchase' | 'currency' | 'asset' }[] = [
  { key: 'cpi', label: 'Reel TL', hint: 'Alım gücü', group: 'purchase' },
  { key: 'minimumWage', label: 'Asgari ücret', hint: 'Net', group: 'purchase' },
  { key: 'gasoline', label: 'Benzin', hint: 'Yakıt', group: 'purchase' },
  { key: 'usd', label: 'Dolar', hint: 'Dolar', group: 'currency' },
  { key: 'eur', label: 'Euro', hint: 'Euro', group: 'currency' },
  { key: 'gold', label: 'Altın', hint: 'Gram', group: 'asset' },
  { key: 'silver', label: 'Gümüş', hint: 'Gram', group: 'asset' },
  { key: 'bist100', label: 'BIST 100', hint: 'Endeks', group: 'asset' },
  { key: 'bitcoin', label: 'Bitcoin', hint: 'BTC', group: 'asset' },
  { key: 'housing', label: 'Konut', hint: 'KFE', group: 'asset' },
  { key: 'deposit', label: 'Mevduat', hint: 'Bileşik', group: 'asset' },
];

const CRITERIA_GROUPS: { key: 'purchase' | 'currency' | 'asset'; label: string }[] = [
  { key: 'purchase', label: 'Alım gücü' },
  { key: 'currency', label: 'Döviz' },
  { key: 'asset', label: 'Yatırım' },
];

const INPUT_UNITS: { key: InputUnit; label: string }[] = [
  { key: 'try', label: 'TL' },
  { key: 'usd', label: 'Dolar' },
  { key: 'eur', label: 'Euro' },
  { key: 'gold', label: 'Gram altın' },
  { key: 'silver', label: 'Gram gümüş' },
];

type LandingPageContent = {
  path: string;
  title: string;
  metaTitle: string;
  description: string;
  intro: string;
  calculatorHref: string;
  sections: { title: string; body: string }[];
};

type InfoPageContent = {
  path: string;
  title: string;
  metaTitle: string;
  description: string;
  intro: string;
  sections: { title: string; body: string; link?: { label: string; href: string } }[];
};

const LANDING_PAGES: LandingPageContent[] = [
  {
    path: '/enflasyon-hesaplama',
    title: 'Enflasyon hesaplama',
    metaTitle: 'Enflasyon Hesaplama | TÜFE ile Geçmiş Para Değeri',
    description:
      'Geçmişteki bir TL tutarının TÜFE verilerine göre bugünkü yaklaşık satın alma gücünü hesaplayın.',
    intro:
      'Enflasyon hesaplama, aynı tutarın farklı tarihlerdeki alım gücünü karşılaştırmak için kullanılır. Ne Kadar Ederdi, TÜFE serisiyle geçmiş TL değerini aylık düzeyde yaklaşık olarak gösterir.',
    calculatorHref: '/?criteria=cpi',
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
    calculatorHref: '/?criteria=cpi%2CminimumWage',
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
    calculatorHref: '/?criteria=usd',
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
    calculatorHref: '/?criteria=gold%2Csilver',
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
    calculatorHref: '/?amount=10000&start=2010-01&criteria=cpi%2Cusd%2Cgold%2Cbist100%2Cbitcoin',
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
    calculatorHref: '/?criteria=cpi%2CminimumWage%2Cusd%2Cgold',
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
    calculatorHref: '/?criteria=cpi%2CminimumWage%2Cusd',
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
    calculatorHref: '/?criteria=gold%2Csilver%2Cbist100%2Cbitcoin',
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

const INFO_PAGES: InfoPageContent[] = [
  {
    path: '/hakkinda',
    title: 'Hakkında',
    metaTitle: 'Hakkında | Ne Kadar Ederdi?',
    description:
      "Ne Kadar Ederdi'nin amacı, kullandığı veri türleri ve hesaplama yaklaşımı hakkında bilgi.",
    intro:
      'Ne Kadar Ederdi, geçmişteki veya bugünkü bir tutarı farklı ekonomik göstergelerle ay bazında karşılaştırmak için hazırlanmış bağımsız bir hesaplama aracıdır.',
    sections: [
      {
        title: 'Ne işe yarar?',
        body:
          'Araç; TÜFE, döviz, gram altın, gümüş, asgari ücret, BIST 100, Bitcoin ve benzeri tarihsel serilerle yaklaşık karşılaştırma yapar. Amaç tek bir kesin cevap vermek değil, farklı ölçütleri birlikte okunur hale getirmektir.',
      },
      {
        title: 'Veri yaklaşımı',
        body:
          'Hesaplamalar aylık veri noktalarına dayanır. Kaynak notları sonuç kartlarında gösterilir; seri güncellemeleri otomatik veri toplama süreciyle yenilenir ve eksik kaynaklarda mevcut son veri korunur.',
      },
      {
        title: 'Tavsiye değildir',
        body:
          'Sonuçlar bilgilendirme amaçlıdır. Yatırım, kredi, kira, maaş veya hukuki kararlar için tek başına kullanılmamalıdır.',
      },
    ],
  },
  {
    path: '/iletisim',
    title: 'İletişim',
    metaTitle: 'İletişim | Ne Kadar Ederdi?',
    description:
      'Ne Kadar Ederdi ile ilgili öneri, veri kaynağı, hata bildirimi ve reklam talepleri için iletişim bilgileri.',
    intro:
      'Öneri, hata bildirimi, veri kaynağı düzeltmesi veya reklam ve iş birliği talepleri için iletişim kurabilirsiniz.',
    sections: [
      {
        title: 'E-posta',
        body:
          'Siteyle ilgili geri bildirimler için e-posta gönderebilirsiniz. Mümkünse ilgili sayfa adresini, tarih aralığını ve beklediğiniz sonucu da ekleyin.',
        link: { label: 'egemenyildiz03@gmail.com', href: 'mailto:egemenyildiz03@gmail.com' },
      },
      {
        title: 'Veri ve hata bildirimi',
        body:
          'Bir seride eksik, gecikmeli veya hatalı görünen veri fark ederseniz kaynak önerisini ve örnek hesaplamayı paylaşmanız sorunu daha hızlı incelememizi sağlar.',
      },
      {
        title: 'Reklam ve iş birliği',
        body:
          'Reklam yerleşimleri kullanıcı deneyimini bozmayacak şekilde sınırlı tutulur. İş birliği taleplerinde marka, kampanya ve hedef sayfa bilgisini belirtmeniz yeterlidir.',
      },
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
          'Site performansını ve ziyaret trafiğini anlamak için Cloudflare Web Analytics kullanılabilir. Reklam gösterimi için Google AdSense kullanılır; Google ve iş ortakları çerezler veya benzer teknolojilerle reklam ölçümü yapabilir.',
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

const FOOTER_LINKS = [
  { href: '/hakkinda', label: 'Hakkında' },
  { href: '/iletisim', label: 'İletişim' },
  { href: '/gizlilik-politikasi', label: 'Gizlilik Politikası' },
  { href: '/kullanim-sartlari', label: 'Kullanım Şartları' },
];

function App() {
  const landingPage = LANDING_PAGES.find((page) => page.path === window.location.pathname);
  const infoPage = INFO_PAGES.find((page) => page.path === window.location.pathname);

  if (landingPage) {
    return <LandingPage page={landingPage} />;
  }

  if (infoPage) {
    return <InfoPage page={infoPage} />;
  }

  const [state, setState] = useState<CalculatorState>(() => {
    const initialState = parseStateFromUrl(window.location.search);
    return { ...initialState, amount: Math.min(initialState.amount, MAX_INPUT_AMOUNT) };
  });
  const [results, setResults] = useState<CalculationResult[]>([]);
  const [catalog, setCatalog] = useState<MarketCatalog | null>(null);
  const [debouncedState, setDebouncedState] = useState(state);
  const [amountText, setAmountText] = useState(() => formatEditableNumber(state.amount));
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [amountWarning, setAmountWarning] = useState('');

  useEffect(() => {
    fetchSeries()
      .then((nextCatalog) => setCatalog(nextCatalog))
      .catch(() => {
        // The calculator can still work through the backend even if the optional catalog request is blocked.
      });
  }, []);

  useEffect(() => {
    if (!catalog) {
      return;
    }

    const available = new Set(catalog.series.map((series) => series.key));
    setState((current) => {
      const criteria = current.criteria.filter((key) => available.has(key));
      return criteria.length === current.criteria.length ? current : { ...current, criteria: criteria.length ? criteria : ['cpi'] };
    });
  }, [catalog]);

  useEffect(() => {
    const query = isDefaultState(state) ? '' : `?${stateToSearchParams(state)}`;
    const nextUrl = `${window.location.pathname}${query}`;
    window.history.replaceState(null, '', nextUrl);
  }, [state]);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedState(state), 220);
    return () => window.clearTimeout(timeout);
  }, [state]);

  useEffect(() => {
    if (results.length === 0) {
      setLoading(true);
    }
    calculateOnBackend(debouncedState)
      .then((nextResults) => {
        setResults(nextResults);
        setError('');
      })
      .catch((apiError: unknown) => {
        const message = apiError instanceof Error ? apiError.message : 'Hesaplama yapılamadı.';
        setError(message);
        if (results.length === 0) {
          setResults([]);
        }
      })
      .finally(() => setLoading(false));
  }, [debouncedState]);

  const yearRange = useMemo(() => {
    const observations = catalog?.series.flatMap((series) => series.observations) ?? [];
    const years = observations.map((item) => Number(item.date.slice(0, 4))).filter(Number.isFinite);
    const currentYear = Number(new Date().toISOString().slice(0, 4));

    return {
      min: years.length ? Math.min(...years) : 2000,
      max: Math.max(currentYear, years.length ? Math.max(...years) : currentYear),
    };
  }, [catalog]);
  const availableCriteria = useMemo(() => {
    if (!catalog) {
      return CRITERIA;
    }

    const available = new Set(catalog.series.map((series) => series.key));
    return CRITERIA.filter((criterion) => available.has(criterion.key));
  }, [catalog]);

  const inputTryAmount = results[0]?.normalizedAmount;
  const shareText = `Ne Kadar Ederdi? ${formatInputAmount(state.amount, state.inputUnit)}: ${formatMonth(state.startMonth)} → ${formatMonth(state.endMonth)}`;
  const shareUrl = window.location.href;

  function updateState(partial: Partial<CalculatorState>) {
    setState((current) => ({ ...current, ...partial }));
  }

  function updateAmount(value: string) {
    if (!/^[\d.,]*$/.test(value)) {
      setAmountWarning('Miktar alanına sadece rakam, nokta ve virgül girebilirsiniz.');
      return;
    }

    if (!value) {
      setAmountText(value);
      setAmountWarning('');
      return;
    }

    const amount = parseLocalizedNumber(value);

    if (Number.isFinite(amount) && amount > 0) {
      if (amount > MAX_INPUT_AMOUNT) {
        setAmountWarning(MAX_INPUT_MESSAGE);
        return;
      }

      setAmountText(value);
      setAmountWarning('');
      updateState({ amount });
      return;
    }

    setAmountText(value);
    setAmountWarning('');
  }

  function formatAmountInput() {
    setAmountText(formatEditableNumber(state.amount));
    setAmountWarning('');
  }

  function toggleCriterion(key: SeriesKey) {
    setState((current) => {
      const exists = current.criteria.includes(key);
      const criteria = exists ? current.criteria.filter((item) => item !== key) : [...current.criteria, key];
      return { ...current, criteria: criteria.length ? criteria : ['cpi'] };
    });
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <main className="page-shell min-h-screen text-ink-950">
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-5 px-3 py-4 sm:gap-6 sm:px-6 sm:py-5 lg:px-8">
        <header className="grid gap-4 border-b border-ink-100 pb-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <Logo />
          <div className="max-w-2xl border-l-4 border-coin-500 pl-4 sm:justify-self-end sm:text-right sm:border-l-0 sm:border-r-4 sm:pl-0 sm:pr-4">
            <p className="font-data text-xs font-semibold uppercase text-oxide-700">Ay ay değer hesabı</p>
            <p className="mt-1 text-base font-semibold leading-6 text-ink-800">
              Geçmiş para, bugünün hesabıyla.
            </p>
            <p className="mt-1 text-sm leading-6 text-ink-500">
              TÜFE, döviz, altın, gümüş, gelir ve piyasa verileriyle kıyaslayın.
            </p>
          </div>
        </header>

        <SpotMarketBar />

        <AdSlot label="Reklam alanı" placement="top" />

        <section className="grid items-start gap-5 [overflow-anchor:none] lg:grid-cols-[minmax(0,380px)_1fr] lg:gap-6">
          <form
            className="ledger-card h-fit rounded-md border border-ink-100 p-4 shadow-soft [overflow-anchor:none] sm:p-5 lg:sticky lg:top-5 lg:self-start"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="grid gap-5">
              <div className="grid gap-2">
                <div className="hidden grid-cols-[minmax(0,1fr)_150px] gap-3 sm:grid lg:hidden xl:grid">
                  <span className="text-sm font-semibold text-ink-800">Miktar</span>
                  <span className="text-sm font-semibold text-ink-800">Birim</span>
                </div>
                <span className="text-sm font-semibold text-ink-800 sm:hidden lg:block xl:hidden">Miktar ve birim</span>
                <div className="grid overflow-hidden rounded-md border border-ink-200 bg-paper-50 transition focus-within:border-oxide-700 focus-within:ring-4 focus-within:ring-oxide-100 sm:grid-cols-[minmax(0,1fr)_150px] lg:grid-cols-1 xl:grid-cols-[minmax(0,1fr)_150px]">
                  <label className="sr-only" htmlFor="amount">
                    Miktar
                  </label>
                  <input
                    id="amount"
                    className="h-12 min-w-0 border-0 bg-transparent px-4 font-data text-base text-ink-950 outline-none"
                    inputMode="decimal"
                    type="text"
                    value={amountText}
                    onBlur={formatAmountInput}
                    onChange={(event) => updateAmount(event.target.value)}
                  />
                  <label className="sr-only" htmlFor="input-unit">
                    Birim
                  </label>
                  <select
                    id="input-unit"
                    className="h-12 min-w-0 border-0 border-t border-ink-200 bg-transparent px-3 text-base text-ink-950 outline-none sm:border-l sm:border-t-0 lg:border-l-0 lg:border-t xl:border-l xl:border-t-0"
                    value={state.inputUnit}
                    onChange={(event) => updateState({ inputUnit: event.target.value as InputUnit })}
                  >
                    {INPUT_UNITS.map((unit) => (
                      <option key={unit.key} value={unit.key}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
                {amountWarning && (
                  <p className="rounded-md border border-red-100 bg-red-50 px-3 py-2 text-xs leading-5 text-red-700">
                    {amountWarning}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <MonthSelect
                  label="Başlangıç"
                  minYear={yearRange.min}
                  maxYear={yearRange.max}
                  value={state.startMonth}
                  onChange={(startMonth) => updateState({ startMonth })}
                />
                <MonthSelect
                  label="Bitiş"
                  minYear={yearRange.min}
                  maxYear={yearRange.max}
                  value={state.endMonth}
                  onChange={(endMonth) => updateState({ endMonth })}
                />
              </div>

              <fieldset className="grid gap-3">
                <legend className="text-sm font-semibold text-ink-800">Karşılaştırma</legend>
                <div className="grid gap-4">
                  {CRITERIA_GROUPS.map((group) => {
                    const criteria = availableCriteria.filter((criterion) => criterion.group === group.key);

                    if (criteria.length === 0) {
                      return null;
                    }

                    return (
                      <div className="grid gap-2" key={group.key}>
                        <p className="font-data text-[11px] font-semibold uppercase text-oxide-700">{group.label}</p>
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {criteria.map((criterion) => {
                            const selected = state.criteria.includes(criterion.key);

                            return (
                              <button
                                aria-pressed={selected}
                                className={`grid min-h-14 rounded-md border px-3 py-2 text-left transition ${
                                  selected
                                    ? 'border-oxide-800 bg-oxide-800 text-white'
                                    : 'border-ink-200 bg-paper-50 text-ink-800 hover:border-ink-500'
                                }`}
                                key={criterion.key}
                                type="button"
                                onClick={() => toggleCriterion(criterion.key)}
                              >
                                <span className="flex items-center justify-between gap-2 text-base font-extrabold">
                                  {criterion.label}
                                  {selected && <Check aria-hidden="true" size={16} />}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </fieldset>

              {state.startMonth < '2005-01' && (
                <p className="rounded-md bg-coin-50 p-3 text-sm leading-6 text-ink-800">
                  2005 öncesi girişlerde eski TL yeni TL'ye çevrilir; başlangıç tutarı 1.000.000'a bölünerek hesaplanır.
                </p>
              )}

            </div>
          </form>

          <section className="grid gap-4 [overflow-anchor:none]">
            <div className="ledger-card rounded-md border border-ink-100 p-4 shadow-soft sm:p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-data text-xs font-semibold uppercase text-oxide-700">Hesaplama özeti</p>
                  <div className="value-stripe mt-2 rounded-md px-3 py-2">
                    <h1>
                      <MoneyValue inputUnit={state.inputUnit} size="summary" value={state.amount || 0} />
                    </h1>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-ink-600">
                    {formatMonth(state.startMonth)} tarihinden {formatMonth(state.endMonth)} tarihine göre.
                  </p>
                  {state.inputUnit !== 'try' && inputTryAmount ? (
                    <p className="mt-1 text-sm leading-6 text-ink-500">
                      Başlangıç ayındaki yaklaşık TL karşılığı: {formatMoney(inputTryAmount)}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  <a
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink-200 text-ink-700 transition hover:border-ink-500"
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                    rel="noreferrer"
                    target="_blank"
                    title="X'te paylaş"
                  >
                    <XIcon />
                  </a>
                  <a
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink-200 text-ink-700 transition hover:border-ink-500"
                    href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
                    rel="noreferrer"
                    target="_blank"
                    title="WhatsApp'ta paylaş"
                  >
                    <WhatsAppIcon />
                  </a>
                  <button
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink-200 text-ink-700 transition hover:border-ink-500"
                    title="Bağlantıyı kopyala"
                    type="button"
                    onClick={copyUrl}
                  >
                    {copied ? <Check aria-hidden="true" size={18} /> : <Copy aria-hidden="true" size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {error && <p className="rounded-md bg-red-50 p-4 text-sm text-red-700">{error}</p>}

            {loading && !error && results.length === 0 && (
              <div className="flex min-h-48 items-center justify-center rounded-md border border-ink-100 bg-white">
                <Loader2 className="animate-spin text-oxide-700" aria-hidden="true" size={28} />
              </div>
            )}

            {results.length > 0 && (
              <div className="grid gap-4 [overflow-anchor:none] md:grid-cols-2 md:items-start">
                <div className="grid gap-4 [overflow-anchor:none]">
                  {results
                    .filter((_, index) => index % 2 === 0)
                    .map((result) => (
                      <ResultCard key={result.series.key} result={result} />
                    ))}
                </div>
                <div className="grid gap-4 [overflow-anchor:none]">
                  {results
                    .filter((_, index) => index % 2 === 1)
                    .map((result) => (
                      <ResultCard key={result.series.key} result={result} />
                    ))}
                </div>
              </div>
            )}

          </section>
        </section>

        {results.length > 0 && <AdSlot label="Sonuç altı reklam alanı" placement="results" />}

        <p className="rounded-md border border-ink-100 bg-white p-4 text-xs leading-5 text-ink-500">
          Bu araç resmi ve güvenilir tarihsel kaynaklardan derlenen aylık verilerle yaklaşık kıyaslama sunar; yatırım tavsiyesi değildir.
        </p>

        <section
          aria-labelledby="seo-heading"
          className="grid gap-4 border-t border-ink-100 pt-6 text-sm leading-6 text-ink-600 md:grid-cols-3"
        >
          <div className="md:col-span-3">
            <h2 id="seo-heading" className="font-display text-xl font-black leading-tight text-ink-950">
              Geçmişteki para değerini karşılaştırma
            </h2>
          </div>
          <article className="rounded-md border border-ink-100 bg-white p-4">
            <h3 className="font-semibold text-ink-900">Enflasyona göre TL değeri</h3>
            <p className="mt-2">
              TÜFE serisi, geçmişteki bir TL tutarının bugünkü yaklaşık satın alma gücünü görmek için kullanılır.
            </p>
          </article>
          <article className="rounded-md border border-ink-100 bg-white p-4">
            <h3 className="font-semibold text-ink-900">Döviz ve değerli maden kıyası</h3>
            <p className="mt-2">
              Dolar, euro, gram altın ve gümüş karşılaştırmaları aylık veri serileri üzerinden yaklaşık çarpan üretir.
            </p>
          </article>
          <article className="rounded-md border border-ink-100 bg-white p-4">
            <h3 className="font-semibold text-ink-900">Asgari ücretle karşılaştırma</h3>
            <p className="mt-2">
              Net asgari ücret serisi, belirli bir tutarın dönemsel gelir düzeyleriyle kıyaslanmasına yardımcı olur.
            </p>
          </article>
          <nav className="grid gap-2 md:col-span-3 sm:grid-cols-2 lg:grid-cols-5" aria-label="İlgili rehberler">
            {LANDING_PAGES.map((page) => (
              <a
                className="rounded-md border border-ink-100 bg-white p-3 text-sm font-semibold text-ink-800 transition hover:border-oxide-700 hover:text-oxide-800"
                href={page.path}
                key={page.path}
              >
                {page.title}
              </a>
            ))}
          </nav>
        </section>

        <SiteFooter />
      </div>
    </main>
  );
}

function XIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.9 2h3.1l-6.8 7.8 8 12.2h-6.3l-4.9-7.1-5.6 7.1H3.3l7.3-8.4L3 2h6.4l4.4 6.5L18.9 2Zm-1.1 17.9h1.7L8.5 4H6.7l11.1 15.9Z" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.52 3.48A11.83 11.83 0 0 0 12.1 0C5.54 0 .21 5.33.2 11.89c0 2.1.55 4.15 1.6 5.96L.1 24l6.3-1.65a11.9 11.9 0 0 0 5.69 1.45h.01c6.56 0 11.9-5.33 11.9-11.9 0-3.18-1.24-6.17-3.48-8.42ZM12.1 21.79h-.01a9.88 9.88 0 0 1-5.04-1.38l-.36-.21-3.74.98 1-3.64-.24-.37a9.86 9.86 0 0 1-1.51-5.28c0-5.45 4.44-9.89 9.9-9.89a9.82 9.82 0 0 1 6.99 2.9 9.83 9.83 0 0 1 2.9 7c0 5.46-4.44 9.89-9.89 9.89Zm5.42-7.4c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.08-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.22 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.23 1.36.2 1.87.12.57-.08 1.76-.72 2-1.41.25-.7.25-1.3.17-1.42-.07-.13-.27-.2-.57-.35Z" />
    </svg>
  );
}

function LandingPage({ page }: { page: LandingPageContent }) {
  const relatedPages = LANDING_PAGES.filter((item) => item.path !== page.path);

  useEffect(() => {
    document.title = `${page.metaTitle} | Ne Kadar Ederdi?`;
    setMetaContent('description', page.description);
    setMetaProperty('og:title', `${page.metaTitle} | Ne Kadar Ederdi?`);
    setMetaProperty('og:description', page.description);
    setMetaProperty('og:url', `https://nekadarederdi.com${page.path}`);
    setMetaContent('twitter:title', `${page.metaTitle} | Ne Kadar Ederdi?`);
    setMetaContent('twitter:description', page.description);
    setCanonical(`https://nekadarederdi.com${page.path}`);
  }, [page]);

  return (
    <main className="min-h-screen bg-paper-50 text-ink-950">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="grid gap-4 border-b border-ink-100 pb-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <a className="w-fit" href="/" aria-label="Ana hesaplayıcıya git">
            <Logo />
          </a>
          <nav className="flex flex-wrap gap-2 text-sm sm:justify-self-end" aria-label="SEO sayfaları">
            <a className="rounded-md border border-ink-200 bg-white px-3 py-2 text-ink-700 hover:border-ink-500" href="/">
              Hesaplayıcı
            </a>
            <a
              className="rounded-md border border-oxide-200 bg-oxide-50 px-3 py-2 text-oxide-800 hover:border-oxide-700"
              href={page.calculatorHref}
            >
              Hemen hesapla
            </a>
          </nav>
        </header>

        <article className="grid gap-6">
          <section className="grid gap-4 border-b border-ink-100 pb-6">
            <p className="font-data text-xs font-semibold uppercase text-oxide-700">Rehber</p>
            <h1 className="max-w-3xl font-display text-4xl font-black leading-tight text-ink-950 sm:text-5xl">
              {page.title}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-ink-600 sm:text-lg">{page.intro}</p>
            <div>
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-md bg-ink-950 px-5 text-base font-bold text-white transition hover:bg-ink-800"
                href={page.calculatorHref}
              >
                Hesaplayıcıyı aç
              </a>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {page.sections.map((section) => (
              <article className="rounded-md border border-ink-100 bg-white p-5 shadow-soft" key={section.title}>
                <h2 className="font-display text-xl font-black leading-tight text-ink-950">{section.title}</h2>
                <p className="mt-3 text-sm leading-6 text-ink-600">{section.body}</p>
              </article>
            ))}
          </section>

          <section className="grid gap-3 border-t border-ink-100 pt-6">
            <h2 className="font-display text-2xl font-black text-ink-950">İlgili hesaplama sayfaları</h2>
            <div className="grid gap-2 sm:grid-cols-2">
              {relatedPages.map((relatedPage) => (
                <a
                  className="rounded-md border border-ink-100 bg-white p-4 text-sm font-semibold text-ink-800 transition hover:border-oxide-700 hover:text-oxide-800"
                  href={relatedPage.path}
                  key={relatedPage.path}
                >
                  {relatedPage.title}
                </a>
              ))}
            </div>
          </section>
        </article>

        <SiteFooter />
      </div>
    </main>
  );
}

function InfoPage({ page }: { page: InfoPageContent }) {
  useEffect(() => {
    document.title = page.metaTitle;
    setMetaContent('description', page.description);
    setMetaProperty('og:title', page.metaTitle);
    setMetaProperty('og:description', page.description);
    setMetaProperty('og:url', `https://nekadarederdi.com${page.path}`);
    setMetaContent('twitter:title', page.metaTitle);
    setMetaContent('twitter:description', page.description);
    setCanonical(`https://nekadarederdi.com${page.path}`);
  }, [page]);

  return (
    <main className="page-shell min-h-screen text-ink-950">
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <header className="grid gap-4 border-b border-ink-100 pb-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
          <a className="w-fit" href="/" aria-label="Ana hesaplayıcıya git">
            <Logo />
          </a>
          <nav className="flex flex-wrap gap-2 text-sm sm:justify-self-end" aria-label="Site sayfaları">
            <a className="rounded-md border border-ink-200 bg-white px-3 py-2 text-ink-700 hover:border-ink-500" href="/">
              Hesaplayıcı
            </a>
            {LANDING_PAGES.slice(0, 2).map((landingPage) => (
              <a
                className="rounded-md border border-ink-200 bg-white px-3 py-2 text-ink-700 hover:border-ink-500"
                href={landingPage.path}
                key={landingPage.path}
              >
                {landingPage.title}
              </a>
            ))}
          </nav>
        </header>

        <article className="grid gap-6">
          <section className="grid gap-4 border-b border-ink-100 pb-6">
            <p className="font-data text-xs font-semibold uppercase text-oxide-700">Site bilgisi</p>
            <h1 className="max-w-3xl font-display text-4xl font-black leading-tight text-ink-950 sm:text-5xl">
              {page.title}
            </h1>
            <p className="max-w-3xl text-base leading-7 text-ink-600 sm:text-lg">{page.intro}</p>
          </section>

          <section className="grid gap-4 md:grid-cols-2">
            {page.sections.map((section) => (
              <article className="ledger-card rounded-md border border-ink-100 p-5 shadow-soft" key={section.title}>
                <h2 className="font-display text-xl font-black leading-tight text-ink-950">{section.title}</h2>
                <p className="mt-3 text-sm leading-6 text-ink-600">{section.body}</p>
                {section.link ? (
                  <a
                    className="mt-4 inline-flex rounded-md border border-oxide-200 bg-oxide-50 px-3 py-2 text-sm font-semibold text-oxide-800 hover:border-oxide-700"
                    href={section.link.href}
                  >
                    {section.link.label}
                  </a>
                ) : null}
              </article>
            ))}
          </section>
        </article>

        <SiteFooter />
      </div>
    </main>
  );
}

function SiteFooter() {
  return (
    <footer className="border-t border-ink-100 py-6 text-sm text-ink-500">
      <nav className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Alt sayfalar">
        {FOOTER_LINKS.map((link) => (
          <a className="font-semibold text-ink-700 hover:text-oxide-800" href={link.href} key={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
      <p className="mt-3 text-xs leading-5">
        Ne Kadar Ederdi tarihsel veri karşılaştırma aracıdır; yatırım tavsiyesi değildir.
      </p>
    </footer>
  );
}

function setMetaContent(name: string, content: string) {
  const element = document.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  element?.setAttribute('content', content);
}

function setMetaProperty(property: string, content: string) {
  const element = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  element?.setAttribute('content', content);
}

function setCanonical(href: string) {
  const element = document.querySelector<HTMLLinkElement>('link[rel="canonical"]');
  element?.setAttribute('href', href);
}

export default App;
