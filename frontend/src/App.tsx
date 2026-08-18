import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Loader2 } from 'lucide-react';
import { AdSlot } from './components/AdSlot';
import { Logo } from './components/Logo';
import { MonthSelect } from './components/MonthSelect';
import { ResultCard } from './components/ResultCard';
import { calculateOnBackend, fetchSeries } from './lib/api';
import { defaultState, isDefaultState, parseStateFromUrl, stateToSearchParams } from './lib/calculator';
import { formatEditableNumber, formatInputAmount, formatMoney, formatMonth, parseLocalizedNumber } from './lib/format';
import type { CalculationResult, CalculatorState, InputUnit, MarketCatalog, SeriesKey } from './types';

const CRITERIA: { key: SeriesKey; label: string; hint: string }[] = [
  { key: 'cpi', label: 'Reel TL', hint: 'Alım gücü' },
  { key: 'usd', label: 'USD', hint: 'Dolar' },
  { key: 'eur', label: 'EUR', hint: 'Euro' },
  { key: 'gold', label: 'Altın', hint: 'Gram' },
  { key: 'minimumWage', label: 'Asgari ücret', hint: 'Net' },
  { key: 'silver', label: 'Gümüş', hint: 'Gram' },
  { key: 'bist100', label: 'BIST 100', hint: 'Endeks' },
  { key: 'bitcoin', label: 'Bitcoin', hint: 'BTC' },
  { key: 'housing', label: 'Konut', hint: 'KFE' },
  { key: 'gasoline', label: 'Benzin', hint: 'Yakıt' },
  { key: 'deposit', label: 'Mevduat', hint: 'Bileşik' },
];

const INPUT_UNITS: { key: InputUnit; label: string }[] = [
  { key: 'try', label: 'TL' },
  { key: 'usd', label: 'USD' },
  { key: 'eur', label: 'EUR' },
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

function App() {
  const landingPage = LANDING_PAGES.find((page) => page.path === window.location.pathname);

  if (landingPage) {
    return <LandingPage page={landingPage} />;
  }

  const [state, setState] = useState<CalculatorState>(() => parseStateFromUrl(window.location.search));
  const [results, setResults] = useState<CalculationResult[]>([]);
  const [catalog, setCatalog] = useState<MarketCatalog | null>(null);
  const [debouncedState, setDebouncedState] = useState(state);
  const [amountText, setAmountText] = useState(() => formatEditableNumber(state.amount));
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSeries()
      .then((nextCatalog) => setCatalog(nextCatalog))
      .catch(() => setError('Veri listesi yüklenemedi. Lütfen daha sonra tekrar deneyin.'));
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
    setLoading(true);
    calculateOnBackend(debouncedState)
      .then((nextResults) => {
        setResults(nextResults);
        setError('');
      })
      .catch((apiError: unknown) => {
        const message = apiError instanceof Error ? apiError.message : 'Hesaplama yapılamadı.';
        setError(message);
        setResults([]);
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
    const available = new Set(catalog?.series.map((series) => series.key) ?? defaultState().criteria);
    return CRITERIA.filter((criterion) => available.has(criterion.key));
  }, [catalog]);

  const inputTryAmount = results[0]?.normalizedAmount;
  const shareText = `Ne Kadar Ederdi? ${formatInputAmount(state.amount, state.inputUnit)}: ${formatMonth(state.startMonth)} → ${formatMonth(state.endMonth)}`;
  const shareUrl = window.location.href;

  function updateState(partial: Partial<CalculatorState>) {
    setState((current) => ({ ...current, ...partial }));
  }

  function updateAmount(value: string) {
    setAmountText(value);
    const amount = parseLocalizedNumber(value);

    if (Number.isFinite(amount) && amount > 0) {
      updateState({ amount });
    }
  }

  function formatAmountInput() {
    setAmountText(formatEditableNumber(state.amount));
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
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
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

        <div className="grid gap-2 rounded-md border border-ink-100 bg-white/70 p-2 text-[11px] font-semibold uppercase text-ink-600 shadow-soft sm:grid-cols-4">
          <span className="rounded bg-paper-100 px-3 py-2">TÜFE</span>
          <span className="rounded bg-paper-100 px-3 py-2">Döviz</span>
          <span className="rounded bg-paper-100 px-3 py-2">Altın</span>
          <span className="rounded bg-paper-100 px-3 py-2">Piyasa</span>
        </div>

        <AdSlot label="Reklam alanı" placement="top" />

        <section className="grid items-start gap-6 lg:grid-cols-[minmax(0,380px)_1fr]">
          <form
            className="ledger-card h-fit rounded-md border border-ink-100 p-5 shadow-soft lg:sticky lg:top-5"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="grid gap-5">
              <div className="grid gap-2">
                <div className="grid grid-cols-[minmax(0,1fr)_150px] gap-3">
                  <span className="text-sm font-semibold text-ink-800">Miktar</span>
                  <span className="text-sm font-semibold text-ink-800">Birim</span>
                </div>
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
                <div className="grid grid-cols-2 gap-2">
                  {availableCriteria.map((criterion) => {
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
                        <span className="flex items-center justify-between gap-2 text-sm font-bold">
                          {criterion.label}
                          {selected && <Check aria-hidden="true" size={16} />}
                        </span>
                        <span className={`text-xs ${selected ? 'text-oxide-50' : 'text-ink-500'}`}>
                          {criterion.hint}
                        </span>
                      </button>
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

          <section className="grid gap-4">
            <div className="ledger-card rounded-md border border-ink-100 p-5 shadow-soft">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="font-data text-xs font-semibold uppercase text-oxide-700">Hesaplama özeti</p>
                  <div className="value-stripe mt-2 rounded-md px-3 py-2">
                    <h1 className="currency-value font-data font-bold tracking-normal text-ink-950">
                      {formatInputAmount(state.amount || 0, state.inputUnit)}
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

            {loading && !error && (
              <div className="flex min-h-48 items-center justify-center rounded-md border border-ink-100 bg-white">
                <Loader2 className="animate-spin text-oxide-700" aria-hidden="true" size={28} />
              </div>
            )}

            {!loading && results.length > 0 && (
              <div className="grid gap-4 md:grid-cols-2 md:items-start">
                <div className="grid gap-4">
                  {results
                    .filter((_, index) => index % 2 === 0)
                    .map((result) => (
                      <ResultCard key={result.series.key} result={result} />
                    ))}
                </div>
                <div className="grid gap-4">
                  {results
                    .filter((_, index) => index % 2 === 1)
                    .map((result) => (
                      <ResultCard key={result.series.key} result={result} />
                    ))}
                </div>
              </div>
            )}

            {results.length > 0 && <AdSlot label="Sonuç altı reklam alanı" placement="results" />}

            <p className="rounded-md border border-ink-100 bg-white p-4 text-xs leading-5 text-ink-500">
              Bu araç resmi ve güvenilir tarihsel kaynaklardan derlenen aylık verilerle yaklaşık kıyaslama sunar; yatırım tavsiyesi değildir.
            </p>
          </section>
        </section>

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
      <path d="M12.04 2a9.88 9.88 0 0 0-8.5 14.92L2.4 22l5.2-1.08A9.93 9.93 0 1 0 12.04 2Zm0 1.86a8.06 8.06 0 0 1 6.82 12.37 8.06 8.06 0 0 1-10.78 2.8l-.37-.22-3.05.64.65-2.98-.25-.39a8.06 8.06 0 0 1 6.98-12.22Zm-3.1 4.25c-.18 0-.46.07-.7.34-.25.27-.92.9-.92 2.2 0 1.29.94 2.54 1.07 2.72.13.18 1.82 2.91 4.5 3.97 2.23.88 2.68.7 3.16.66.49-.04 1.57-.64 1.8-1.26.22-.62.22-1.15.15-1.26-.06-.11-.24-.18-.5-.31-.27-.13-1.57-.78-1.81-.86-.25-.09-.42-.13-.6.13-.18.27-.69.86-.85 1.04-.16.18-.31.2-.58.07-.27-.13-1.12-.41-2.14-1.31-.79-.7-1.32-1.57-1.47-1.84-.16-.27-.02-.41.12-.54.12-.12.27-.31.4-.47.14-.16.18-.27.27-.45.09-.18.04-.34-.02-.47-.07-.13-.6-1.46-.82-2-.22-.52-.44-.45-.6-.46l-.52-.01Z" />
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
      </div>
    </main>
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
