import { INFO_PAGES, type InfoPageContent, type GuidePageContent, type PublisherPageContent } from '../../shared/content';
import { ACTIVE_GUIDES as GUIDE_PAGES, ACTIVE_ARTICLES as PUBLISHER_PAGES, REDIRECTS } from '../../shared/routes';
import { calculate, latestCommonMonth } from '../../shared/calculation';
import { DataStatus, SourceLedger, CalculationEvidence } from './components/DataEvidence';
﻿import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Loader2, Moon, Sun } from 'lucide-react';
import { Logo } from './components/Logo';
import { MonthSelect } from './components/MonthSelect';
import { MoneyValue } from './components/MoneyValue';
import { ResultCard } from './components/ResultCard';
import catalogData from '../../data/market-series.json';
import { calculateOnBackend, fetchSeries } from './lib/api';
import { defaultState, isDefaultState, parseStateFromUrl, stateToHash } from './lib/calculator';
import { formatEditableNumber, formatInputAmount, formatMoney, formatMonth, numberFormatter, parseEditableLocalizedNumber } from './lib/format';
import type { CalculationResult, CalculatorState, InputUnit, MarketCatalog, MarketSeries, SeriesKey } from './types';

const MAX_INPUT_AMOUNT = 999_999_999_999;
const MAX_INPUT_MESSAGE = 'Miktar en fazla 999.999.999.999 olabilir.';
const AMOUNT_FORMAT_MESSAGE = 'Örnek: 10000, 10.000 veya 10.000,50.';

const CRITERIA: { key: SeriesKey; label: string; hint: string; group: 'purchase' | 'currency' | 'asset' }[] = [
  { key: 'cpi', label: 'Reel TL', hint: 'Alım gücü', group: 'purchase' },
  { key: 'minimumWage', label: 'Asgari ücret', hint: 'Net', group: 'purchase' },
  { key: 'gasoline', label: 'Yakıt endeksi', hint: 'Endeks', group: 'purchase' },
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

const FOOTER_LINKS = [
  { href: '/atlas', label: 'Atlas' },
  { href: '/rehberler', label: 'Rehberler' },
  { href: '/veri-kaynaklari', label: 'Veri Kaynakları' },
  { href: '/veri-durumu', label: 'Veri Durumu' },
  { href: '/hakkinda', label: 'Hakkında' },
  { href: '/metodoloji', label: 'Metodoloji' },
  { href: '/iletisim', label: 'İletişim' },
  { href: '/gizlilik-politikasi', label: 'Gizlilik Politikası' },
  { href: '/kullanim-sartlari', label: 'Kullanım Şartları' },
];

function App({ pathname = typeof window === 'undefined' ? '/' : window.location.pathname }: { pathname?: string }) {
  pathname = (REDIRECTS[pathname] ?? pathname).split('#')[0];
  const infoPage = INFO_PAGES.find(page => page.path === pathname);
  const guidePage = GUIDE_PAGES.find(page => page.path === pathname);
  const publisherPage = PUBLISHER_PAGES.find(page => page.path === pathname);
  if (pathname === '/rehberler') return <GuideIndexPage />;
  if (pathname === '/atlas') return <PublisherIndexPage hub="atlas" />;
  if (pathname === '/veri-durumu') return <main className="page-shell min-h-screen"><div className="mx-auto max-w-5xl px-4 py-5"><PageHeader /><DataStatus /><SiteFooter /></div></main>;
  if (infoPage) return <InfoPage page={infoPage} />;
  if (guidePage) return <GuidePage page={guidePage} />;
  if (publisherPage) return <PublisherPage page={publisherPage} />;
  if (pathname !== '/') return <main className="page-shell min-h-screen"><div className="mx-auto max-w-5xl px-4 py-5"><PageHeader /><h1>Sayfa bulunamadı</h1><p>Bu adres artık kullanılmıyor veya yanlış yazılmış olabilir.</p><a href="/">Hesaplayıcıya dön</a><SiteFooter /></div></main>;
  return <Calculator />;
}

function Calculator() {
  const [state, setState] = useState<CalculatorState>(() => {
    const initialState = parseStateFromUrl(typeof window === 'undefined' ? '' : window.location.search, typeof window === 'undefined' ? '' : window.location.hash);
    const lastMonth = latestCommonMonth(catalogData as MarketCatalog, initialState.criteria);
    return { ...initialState, amount: Math.min(initialState.amount, MAX_INPUT_AMOUNT), endMonth: lastMonth && initialState.endMonth > lastMonth ? lastMonth : initialState.endMonth };
  });
  const [results, setResults] = useState<CalculationResult[]>(() => { try { return calculate(catalogData as MarketCatalog, state); } catch { return []; } });
  const [catalog, setCatalog] = useState<MarketCatalog | null>(catalogData as MarketCatalog);
  const [debouncedState, setDebouncedState] = useState(state);
  const [amountText, setAmountText] = useState(() => formatEditableNumber(state.amount));
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [amountWarning, setAmountWarning] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    typeof document !== 'undefined' && document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  );

  useEffect(() => {
    function readSharedCalculation() {
      const next = parseStateFromUrl(window.location.search, window.location.hash);
      next.amount = Math.min(next.amount, MAX_INPUT_AMOUNT);
      const last = latestCommonMonth(catalogData as MarketCatalog, next.criteria);
      if (last && next.endMonth > last) next.endMonth = last;
      setState(next);
      setAmountText(formatEditableNumber(next.amount));
      setAmountWarning('');
    }
    window.addEventListener('hashchange', readSharedCalculation);
    return () => window.removeEventListener('hashchange', readSharedCalculation);
  }, []);

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
    const hash = isDefaultState(state) ? '' : stateToHash(state);
    const nextUrl = `${window.location.pathname}${hash}`;
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
    const commonEndMonth = getLatestCommonEndMonth(catalog, debouncedState.criteria);
    const requestState =
      commonEndMonth && debouncedState.endMonth > commonEndMonth
        ? { ...debouncedState, endMonth: commonEndMonth }
        : debouncedState;

    let cancelled = false;
    setLoading(true);
    setResults([]);
    calculateOnBackend(requestState)
      .then((nextResults) => {
        if (cancelled) return;
        setResults(nextResults);
        setError('');
      })
      .catch((apiError: unknown) => {
        if (cancelled) return;
        const message = apiError instanceof Error ? apiError.message : 'Hesaplama yapılamadı.';
        setError(message);
        setResults([]);
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [catalog, debouncedState]);

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
  const latestCommonEndMonth = useMemo(() => getLatestCommonEndMonth(catalog, state.criteria), [catalog, state.criteria]);
  const endMaxYear = latestCommonEndMonth ? Number(latestCommonEndMonth.slice(0, 4)) : yearRange.max;

  useEffect(() => {
    if (latestCommonEndMonth && state.endMonth > latestCommonEndMonth) {
      setState((current) => ({ ...current, endMonth: latestCommonEndMonth }));
    }
  }, [latestCommonEndMonth, state.endMonth]);

  const resultEndMonth = getResultEndMonth(results) ?? state.endMonth;
  const inputTryAmount = results[0]?.normalizedAmount;
  const shareText = `Ne Kadar Ederdi? ${formatInputAmount(state.amount, state.inputUnit)}: ${formatMonth(state.startMonth)} → ${formatMonth(resultEndMonth)}`;
  const shareUrl = typeof window === 'undefined' ? 'https://nekadarederdi.com/' : window.location.href;

  function updateState(partial: Partial<CalculatorState>) {
    setState((current) => ({ ...current, ...partial }));
  }

  function updateAmount(value: string) {
    if (!/^[\d.,]*$/.test(value)) {
      setAmountWarning('Miktar alanına sadece rakam, nokta ve virgül girebilirsiniz.');
      return;
    }

    const parsed = parseEditableLocalizedNumber(value);

    if (!parsed.ok && parsed.reason === 'empty') {
      setAmountText(value);
      setAmountWarning('');
      return;
    }

    if (!parsed.ok) {
      setAmountWarning(AMOUNT_FORMAT_MESSAGE);
      return;
    }

    if (parsed.value > MAX_INPUT_AMOUNT) {
      setAmountWarning(MAX_INPUT_MESSAGE);
      return;
    }

    if (parsed.value <= 0) {
      setAmountWarning("Miktar 0'dan büyük olmalı.");
      return;
    }

    setAmountText(value);
    setAmountWarning('');
    updateState({ amount: parsed.value });
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

  function toggleTheme() {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    const root = document.documentElement;
    root.classList.add('theme-switching');
    root.dataset.theme = nextTheme;
    localStorage.setItem('theme', nextTheme);
    setTheme(nextTheme);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => root.classList.remove('theme-switching'));
    });
  }

  return (
    <main className="app-shell min-h-screen">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-4 py-4 sm:px-6 sm:py-5 lg:px-8">
        <header className="site-header">
          <Logo />
          <div className="site-header__copy">
            <p className="eyebrow">Ay ay değer hesabı</p>
            <p className="site-header__line">Geçmiş para, bugünün hesabıyla.</p>
            <p className="site-header__note">
              TÜFE, döviz, altın, gümüş, gelir ve piyasa verilerini aynı ekranda okuyun.
            </p>
          </div>
          <button
            aria-label={theme === 'dark' ? 'Açık temaya geç' : 'Koyu temaya geç'}
            className="theme-toggle"
            type="button"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun aria-hidden="true" size={18} /> : <Moon aria-hidden="true" size={18} />}
          </button>
        </header>

        <nav className="primary-links" aria-label="Ana gezinme"><a href="/rehberler">Rehberler</a><a href="/atlas">Örnek hesaplar</a><a href="/veri-kaynaklari">Veri kaynakları</a><a href="/veri-durumu">Veri durumu</a></nav>

        <section id="hesapla" className="workbench [overflow-anchor:none]">
          <form
            className="calculator-panel [overflow-anchor:none] lg:sticky lg:top-5 lg:self-start"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="calculator-panel__head">
              <p className="eyebrow">Hesapla</p>
              <h1>Ne kadar ederdi?</h1>
              <p>{formatMonth(state.startMonth)} ile {formatMonth(state.endMonth)} arasındaki karşılığı karşılaştırın.</p>
            </div>

            <div className="calculator-fields">
              <div className="amount-field">
                <div className="amount-field__labels">
                  <span>Miktar</span>
                  <span>Birim</span>
                </div>
                <div className="amount-control">
                  <label className="sr-only" htmlFor="amount">
                    Miktar
                  </label>
                  <input
                    id="amount"
                    className="amount-control__input"
                    inputMode="decimal"
                    enterKeyHint="done"
                    type="text"
                    value={amountText}
                    onBlur={formatAmountInput}
                    onFocus={() => setAmountWarning('')}
                    onChange={(event) => updateAmount(event.target.value)}
                  />
                  <label className="sr-only" htmlFor="input-unit">
                    Birim
                  </label>
                  <select
                    id="input-unit"
                    className="amount-control__select"
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
                {amountWarning && <p className="field-warning">{amountWarning}</p>}
              </div>

              <div className="date-grid">
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
                  maxMonth={latestCommonEndMonth ?? undefined}
                  maxYear={endMaxYear}
                  value={state.endMonth}
                  onChange={(endMonth) => updateState({ endMonth })}
                />
              </div>

              {latestCommonEndMonth !== null && latestCommonEndMonth! < defaultState().endMonth && (
                <p className="inline-note">
                  Seçili karşılaştırmalar için son ortak veri: {formatMonth(latestCommonEndMonth ?? '')}.
                </p>
              )}

              <fieldset className="criteria-picker">
                <legend>Karşılaştırma ölçütleri</legend>
                <div className="criteria-picker__groups">
                  {CRITERIA_GROUPS.map((group) => {
                    const criteria = availableCriteria.filter((criterion) => criterion.group === group.key);

                    if (criteria.length === 0) {
                      return null;
                    }

                    return (
                      <div className="criteria-group" key={group.key}>
                        <p>{group.label}</p>
                        <div className="criteria-grid">
                          {criteria.map((criterion) => {
                            const selected = state.criteria.includes(criterion.key);

                            return (
                              <button
                                aria-pressed={selected}
                                className="criteria-button"
                                data-selected={selected}
                                key={criterion.key}
                                type="button"
                                onClick={() => toggleCriterion(criterion.key)}
                              >
                                <span>{criterion.label}</span>
                                {selected && <Check aria-hidden="true" size={16} />}
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
                <p className="inline-note inline-note--strong">
                  Veri seti 2005 öncesini kapsamıyor. Eski TL’den sıfır atmak, o dönemin fiyat verisinin yerini tutmaz. 2005 veya sonrasını seçin.
                </p>
              )}
            </div>
          </form>

          <section className="results-panel [overflow-anchor:none]" aria-live="polite">
            <div className="result-summary">
              <div className="result-summary__main">
                <div>
                  <p className="eyebrow">Hesaplama özeti</p>
                  <h2>
                    <MoneyValue inputUnit={state.inputUnit} size="summary" value={state.amount || 0} />
                  </h2>
                  <p>
                    {formatMonth(state.startMonth)} tarihinden {formatMonth(resultEndMonth)} tarihine göre.
                  </p>
                  {state.inputUnit !== 'try' && inputTryAmount ? (
                    <p className="result-summary__note">
                      Başlangıç ayındaki yaklaşık TL karşılığı: {formatMoney(inputTryAmount)}
                    </p>
                  ) : null}
                </div>
                <div className="share-actions">
                  <a
                    className="icon-action"
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                    rel="noreferrer"
                    target="_blank"
                    title="X'te paylaş"
                  >
                    <XIcon />
                  </a>
                  <a
                    className="icon-action"
                    href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
                    rel="noreferrer"
                    target="_blank"
                    title="WhatsApp'ta paylaş"
                  >
                    <WhatsAppIcon />
                  </a>
                  <button className="icon-action" title="Bağlantıyı kopyala" type="button" onClick={copyUrl}>
                    {copied ? <Check aria-hidden="true" size={18} /> : <Copy aria-hidden="true" size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {error && <p className="error-state" role="alert">{error}</p>}

            {loading && !error && results.length === 0 && (
              <div className="loading-state">
                <Loader2 className="animate-spin" aria-hidden="true" size={28} />
                <span>Hesaplama hazırlanıyor</span>
              </div>
            )}

            {results.length > 0 && (
              <div className="result-ledger [overflow-anchor:none]">
                <div className="result-ledger__head">
                  <span>Ölçüt</span>
                  <span>Karşılık</span>
                  <span>Çarpan</span>
                  <span aria-hidden="true" />
                </div>
                {results.map((result) => (
                  <ResultCard key={result.series.key} result={result} />
                ))}
              </div>
            )}
            {results.length > 0 && <CalculationEvidence results={results} />}
          </section>
        </section>

        <p className="disclaimer">
          Aylık tarihsel verilerle yaklaşık karşılaştırma. Her serinin son ayı farklı olabilir; sonuçlar güncel piyasa fiyatı veya yatırım tavsiyesi değildir.
        </p>

        <section className="guide-section" aria-labelledby="reading-heading">
          <div className="guide-section__intro"><p className="eyebrow">Sorunuza uygun ölçüt</p><h2 id="reading-heading">Bu sonuç ne anlama geliyor?</h2><p>Eski bir fiyat, maaş ve birikim aynı yöntemle yorumlanmaz. Aşağıdaki rehberler hangi hesabın hangi soruya cevap verdiğini örneklerle açıklar.</p></div>
          <div className="guide-card-grid">{GUIDE_PAGES.map(page => <a className="guide-card" href={page.path} key={page.path}><h3>{page.title}</h3><p>{page.description}</p></a>)}</div>
          <div className="guide-faq">
            <details><summary>“Bugün” neden son takvim ayı değil?</summary><p>TÜFE ve diğer endeksler gecikmeli yayımlanır. Seçtiğiniz serilerin tamamında bulunan son ay kullanılır ve formda gösterilir. Yeni veri yayımlanmadan tahmin yapılmaz. <a href="/veri-durumu">Her serinin son ayını görün.</a></p></details>
            <details><summary>2005 öncesindeki eski TL tutarını hesaplayabilir miyim?</summary><p>Bu veri seti 2005 öncesini kapsamıyor. Altı sıfır atmak yalnızca para birimini değiştirir; enflasyon hesabı için o dönemin endeks verisi de gerekir. Araç bu tarihlerde sonuç üretmez.</p></details>
            <details><summary>Neden banka veya kuyumcu fiyatından farklı?</summary><p>Döviz aylık ortalamadır. Gram altın ve gümüş, aylık ons fiyatı ile aylık kurdan türetilir. Günlük fiyat, alış-satış makası, işçilik ve komisyonlar dahil değildir. <a href="/veri-kaynaklari">Seri yöntemlerini inceleyin.</a></p></details>
          </div>
        </section>
        <section className="guide-link-panel"><p className="eyebrow">Veriyle açıklanan örnekler</p><nav className="guide-links" aria-label="Örnek hesaplar">{PUBLISHER_PAGES.map(page => <a href={page.path} key={page.path}>{page.title}</a>)}</nav></section>

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
            <a className="rounded-md border border-ink-200 bg-white px-3 py-2 text-ink-700 hover:border-ink-500" href="/rehberler">
              Rehberler
            </a>
            <a href="/veri-durumu">Veri durumu</a>
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
            {(page.path === '/veri-kaynaklari' ? [] : page.sections).map((section) => (
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
          {page.path === '/veri-kaynaklari' && <SourceLedger />}
        </article>

        <SiteFooter />
      </div>
    </main>
  );
}

function GuideIndexPage() {
  useEffect(() => {
    const title = 'Rehberler | Ne Kadar Ederdi?';
    const description =
      'TÜFE, dolar, altın, asgari ücret ve geçmiş para değeri hesaplamalarını doğru yorumlamak için hazırlanmış Ne Kadar Ederdi rehberleri.';
    document.title = title;
    setMetaContent('description', description);
    setMetaProperty('og:title', title);
    setMetaProperty('og:description', description);
    setMetaProperty('og:url', 'https://nekadarederdi.com/rehberler');
    setMetaContent('twitter:title', title);
    setMetaContent('twitter:description', description);
    setCanonical('https://nekadarederdi.com/rehberler');
  }, []);

  return (
    <main className="page-shell min-h-screen text-ink-950">
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <PageHeader />
        <article className="grid gap-6">
          <section className="grid gap-4 border-b border-ink-100 pb-6">
            <p className="font-data text-xs font-semibold uppercase text-oxide-700">Rehberler</p>
            <h1 className="max-w-3xl font-display text-4xl font-black leading-tight text-ink-950 sm:text-5xl">
              Para değeri hesaplamalarını doğru okumak
            </h1>
            <p className="max-w-3xl text-base leading-7 text-ink-600 sm:text-lg">
              Eski bir fiyatı bugüne taşımak, dövizle kıyaslamak ve maaşı gelir ölçeğinde okumak farklı hesaplardır. Sorunuza uygun yöntemi seçin ve örneklerle adım adım uygulayın.
            </p>
          </section>
          <section className="guide-card-grid" aria-label="Rehber yazıları">
            {GUIDE_PAGES.map((page) => (
              <a className="guide-card" href={page.path} key={page.path}>
                <span className="eyebrow">Rehber</span>
                <h2>{page.title}</h2>
                <p>{page.description}</p>
              </a>
            ))}
          </section>
        </article>
        <SiteFooter />
      </div>
    </main>
  );
}

function GuidePage({ page }: { page: GuidePageContent }) {
  const relatedGuides = GUIDE_PAGES.filter((item) => item.path !== page.path).slice(0, 3);

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
        <PageHeader />
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
                Bu ayarla hesapla
              </a>
            </div>
          </section>

          <section className="guide-article-grid">
            {page.sections.map((section) => (
              <article className="rounded-md border border-ink-100 bg-white p-5 shadow-soft" key={section.title}>
                <h2 className="font-display text-xl font-black leading-tight text-ink-950">{section.title}</h2>
                <p className="mt-3 text-sm leading-6 text-ink-600">{section.body}</p>
              </article>
            ))}
          </section>

          <section className="rounded-md border border-ink-100 bg-white p-5 shadow-soft">
            <h2 className="font-display text-2xl font-black text-ink-950">Kısa sonuç</h2>
            <ul className="mt-4 grid gap-3 text-sm leading-6 text-ink-700">
              {page.takeaways.map((takeaway) => (
                <li className="guide-takeaway" key={takeaway}>{takeaway}</li>
              ))}
            </ul>
          </section>

          <section className="grid gap-3 border-t border-ink-100 pt-6">
            <h2 className="font-display text-2xl font-black text-ink-950">İlgili rehberler</h2>
            <div className="grid gap-2 sm:grid-cols-3">
              {relatedGuides.map((guide) => (
                <a
                  className="rounded-md border border-ink-100 bg-white p-4 text-sm font-semibold text-ink-800 transition hover:border-oxide-700 hover:text-oxide-800"
                  href={guide.path}
                  key={guide.path}
                >
                  {guide.title}
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

function PublisherIndexPage({ hub }: { hub: PublisherPageContent['hub'] }) {
  const pages = PUBLISHER_PAGES.filter((page) => page.hub === hub);
  const config = getPublisherHubConfig(hub);

  useEffect(() => {
    document.title = config.metaTitle;
    setMetaContent('description', config.description);
    setMetaProperty('og:title', config.metaTitle);
    setMetaProperty('og:description', config.description);
    setMetaProperty('og:url', `https://nekadarederdi.com${config.path}`);
    setMetaContent('twitter:title', config.metaTitle);
    setMetaContent('twitter:description', config.description);
    setCanonical(`https://nekadarederdi.com${config.path}`);
  }, [config]);

  return (
    <main className="page-shell min-h-screen text-ink-950">
      <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-5 sm:px-6 lg:px-8">
        <PageHeader />
        <article className="publisher-page">
          <section className="publisher-hero">
            <p className="eyebrow">{config.eyebrow}</p>
            <h1>{config.title}</h1>
            <p>{config.description}</p>
          </section>
          <section className="publisher-grid" aria-label={config.title}>
            {pages.map((page) => (
              <a className="publisher-card" href={page.path} key={page.path}>
                <span className="eyebrow">{page.eyebrow}</span>
                <h2>{page.title}</h2>
                <p>{page.description}</p>
              </a>
            ))}
          </section>
          <section className="publisher-note">
            <h2>Bu bölüm neden var?</h2>
            <p>{config.note}</p>
          </section>
        </article>
        <SiteFooter />
      </div>
    </main>
  );
}

function PublisherPage({ page }: { page: PublisherPageContent }) {
  const results = page.calculation ? calculatePublishedResults(page.calculation) : [];
  const latestRows = getSeriesLedgerRows(page);
  const relatedPages = PUBLISHER_PAGES.filter((item) => item.hub === page.hub && item.path !== page.path).slice(0, 3);

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
        <PageHeader />
        <article className="publisher-page">
          <section className="publisher-hero">
            <p className="eyebrow">{page.eyebrow}</p>
            <h1>{page.title}</h1>
            <p>{page.intro}</p>
            {page.calculatorHref ? (
              <a className="publisher-cta" href={results[0] ? `${page.calculatorHref}&end=${results[0].endObservation.date.slice(0, 7)}` : page.calculatorHref}>
                Hesap makinesinde aç
              </a>
            ) : null}
          </section>

          {results.length > 0 ? (
            <section className="publisher-table-section" aria-labelledby="publisher-result-heading">
              <div>
                <p className="eyebrow">Veriden çıkan tablo</p>
                <h2 id="publisher-result-heading">
                  {formatInputAmount(page.calculation!.amount, page.calculation!.inputUnit)} için ölçütlere göre karşılık
                </h2>
                <p>
                  {formatMonth(page.calculation!.startMonth)} başlangıcından {formatMonth(results[0].endObservation.date.slice(0, 7))} son
                  ortak veri ayına kadar hesaplandı.
                </p>
              </div>
              <div className="publisher-table" role="table" aria-label="Örnek hesaplama sonuçları">
                <div className="publisher-table__row publisher-table__row--head" role="row">
                  <span role="columnheader">Ölçüt</span>
                  <span role="columnheader">Karşılık</span>
                  <span role="columnheader">Çarpan</span>
                  <span role="columnheader">Bitiş verisi</span>
                </div>
                {results.map((result) => (
                  <div className="publisher-table__row" role="row" key={result.series.key}>
                    <span role="cell">
                      <strong>{result.series.name}</strong>
                      <small>{result.series.description}</small>
                    </span>
                    <span role="cell">{formatMoney(result.resultAmount)}</span>
                    <span role="cell">{numberFormatter.format(result.multiplier)}x</span>
                    <span role="cell">
                      {formatTryNumberForPage(result.endObservation.value)}
                      <small>{formatMonth(result.endObservation.date.slice(0, 7))}</small>
                    </span>
                  </div>
                ))}
              </div>
              <CalculationEvidence results={results} />
            </section>
          ) : null}

          {latestRows.length > 0 ? (
            <section className="publisher-table-section" aria-labelledby="series-ledger-heading">
              <div>
                <p className="eyebrow">Seri kapsamı</p>
                <h2 id="series-ledger-heading">Bu sayfada kullanılan veri durumu</h2>
                <p>Aşağıda her serinin mevcut son gözlemi yer alır. Örnek hesapta ise bütün ölçütler aynı ortak ayda karşılaştırılır.</p>
              </div>
              <div className="publisher-table publisher-table--compact" role="table" aria-label="Veri serisi durumu">
                <div className="publisher-table__row publisher-table__row--head" role="row">
                  <span role="columnheader">Seri</span>
                  <span role="columnheader">Son ay</span>
                  <span role="columnheader">Son değer</span>
                  <span role="columnheader">Kaynak notu</span>
                </div>
                {latestRows.map((row) => (
                  <div className="publisher-table__row" role="row" key={row.key}>
                    <span role="cell">
                      <strong>{row.name}</strong>
                    </span>
                    <span role="cell">{formatMonth(row.month)}</span>
                    <span role="cell">{row.value}</span>
                    <span role="cell">{row.source}</span>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="publisher-section-grid">
            {page.sections.map((section) => (
              <article key={section.title}>
                <h2>{section.title}</h2>
                <p>{section.body}</p>
              </article>
            ))}
          </section>

          <section className="publisher-note">
            <h2>Yöntem ve sınırlama</h2>
            <p>
              Tablolar Ne Kadar Ederdi veri setindeki aylık gözlemlerle oran yöntemi kullanılarak üretilir. Sonuçlar
              bilgilendirme amaçlı yaklaşık karşılaştırmadır; yatırım tavsiyesi, resmi hak ediş ya da hukuki hesap
              değildir.
            </p>
          </section>

          {relatedPages.length > 0 ? (
            <section className="guide-link-panel">
              <p className="eyebrow">Aynı bölümden</p>
              <nav className="guide-links" aria-label="İlgili yayın sayfaları">
                {relatedPages.map((relatedPage) => (
                  <a href={relatedPage.path} key={relatedPage.path}>
                    {relatedPage.title}
                  </a>
                ))}
              </nav>
            </section>
          ) : null}
        </article>
        <SiteFooter />
      </div>
    </main>
  );
}

function getPublisherHubConfig(hub: PublisherPageContent['hub']) {
  const configs = {
    atlas: {
      path: '/atlas',
      eyebrow: 'Para Değeri Atlası',
      title: 'Para Değeri Atlası',
      metaTitle: 'Para Değeri Atlası | Ne Kadar Ederdi?',
      description:
        'Geçmiş para değerini TÜFE, döviz, altın, ücret ve piyasa serileriyle açıklayan veri tabanlı analizler.',
      note:
        'Her örnekte tutarı, başlangıç ayını ve kullanılan gözlemleri görebilirsiniz. Aynı hesabı kendi tutarınızla yeniden açarak sonuçların nasıl değiştiğini karşılaştırın.',
    },
    guncellemeler: {
      path: '/guncellemeler',
      eyebrow: 'Güncellemeler',
      title: 'Aylık veri notları',
      metaTitle: 'Aylık Veri Notları | Ne Kadar Ederdi?',
      description:
        'Ne Kadar Ederdi veri setindeki güncellemeler, son veri ayları ve kaynak gecikmeleri hakkında düzenli notlar.',
      note:
        'Bu notlar, sitenin veri bakımını görünür kılar. Hangi serinin hangi aya kadar geldiğini ve hesaplamanın neden bazen son ortak aya döndüğünü açıklar.',
    },
    'veri-defteri': {
      path: '/veri-defteri',
      eyebrow: 'Veri kaynakları',
      title: 'Veri kaynakları',
      metaTitle: 'Veri kaynakları | Ne Kadar Ederdi?',
      description:
        'TÜFE, dolar, gram altın, asgari ücret ve diğer serilerin hesaplamada nasıl kullanıldığını açıklayan kaynak defteri.',
      note:
        'Veri kaynakları, her serinin neyi anlattığını ve neyi anlatmadığını açıklar. Amaç hesaplama sonucunu kaynak ve yöntem bağlamından koparmamaktır.',
    },
  } as const;

  return configs[hub];
}

function calculatePublishedResults(calculation: NonNullable<PublisherPageContent['calculation']>): CalculationResult[] {
  const catalog = catalogData as MarketCatalog;
  const criteria = calculation.criteria.filter(key => catalog.series.some(series => series.key === key));
  const endMonth = latestCommonMonth(catalog, criteria);
  return endMonth ? calculate(catalog, { ...calculation, criteria, endMonth }) : [];
}

function getSeriesLedgerRows(page: PublisherPageContent) {
  const catalog = catalogData as MarketCatalog;
  const keys = page.calculation?.criteria ?? getHubSeriesKeys(page.hub);

  return keys
    .map((key) => {
      const series = catalog.series.find((item) => item.key === key);
      const latest = series?.observations
        .filter((item) => Number.isFinite(item.value))
        .sort((first, second) => second.date.localeCompare(first.date))[0];

      if (!series || !latest) {
        return null;
      }

      return {
        key,
        name: series.name,
        month: latest.date.slice(0, 7),
        value: `${formatTryNumberForPage(latest.value)} ${series.unit}`,
        source: series.sourceNote,
      };
    })
    .filter((row): row is { key: SeriesKey; name: string; month: string; value: string; source: string } => Boolean(row));
}

function getHubSeriesKeys(hub: PublisherPageContent['hub']): SeriesKey[] {
  if (hub === 'veri-defteri') {
    return ['cpi', 'usd', 'gold', 'minimumWage'];
  }

  return ['cpi', 'usd', 'eur', 'gold', 'minimumWage', 'gasoline'];
}

function formatTryNumberForPage(value: number) {
  return numberFormatter.format(value);
}

function getLatestCommonEndMonth(catalog: MarketCatalog | null, criteria: SeriesKey[]): string | null {
  return catalog ? latestCommonMonth(catalog, criteria) : null;
}

function getResultEndMonth(results: CalculationResult[]) {
  const months = results
    .map((result) => result.endObservation.date.slice(0, 7))
    .filter(Boolean)
    .sort();

  return months[0] ?? null;
}

function PageHeader() {
  return (
    <header className="grid gap-4 border-b border-ink-100 pb-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
      <a className="w-fit" href="/" aria-label="Ana hesaplayıcıya git">
        <Logo />
      </a>
      <nav className="flex flex-wrap gap-2 text-sm sm:justify-self-end" aria-label="Site sayfaları">
        <a className="rounded-md border border-ink-200 bg-white px-3 py-2 text-ink-700 hover:border-ink-500" href="/">
          Hesaplayıcı
        </a>
        <a className="rounded-md border border-ink-200 bg-white px-3 py-2 text-ink-700 hover:border-ink-500" href="/rehberler">
          Rehberler
        </a>
        <a className="rounded-md border border-ink-200 bg-white px-3 py-2 text-ink-700 hover:border-ink-500" href="/atlas">
          Atlas
        </a>
        <a className="rounded-md border border-ink-200 bg-white px-3 py-2 text-ink-700 hover:border-ink-500" href="/veri-kaynaklari">
          Veri kaynakları
        </a>
        <a className="rounded-md border border-ink-200 bg-white px-3 py-2 text-ink-700 hover:border-ink-500" href="/metodoloji">
          Metodoloji
        </a>
        <a className="rounded-md border border-ink-200 bg-white px-3 py-2 text-ink-700 hover:border-ink-500" href="/veri-durumu">
          Veri durumu
        </a>
      </nav>
    </header>
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
