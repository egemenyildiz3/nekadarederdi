import catalogData from '../../../data/market-series.json';
import { CONTENT_UPDATED } from '../../../shared/routes';
import type { CalculationResult, MarketCatalog } from '../types';
import { formatMoney, formatMonth, numberFormatter } from '../lib/format';

const catalog = catalogData as MarketCatalog;
const sources: Record<string, { href: string; method: string; limitation: string }> = {
  cpi: { href: 'https://www.hakedis.org/endeksler/tuketici-fiyat-genel-endeksi-ve-degisim-oranlari-2003', method: 'TÜİK 2003=100 endeks tablosunun üçüncü taraf yayını. Endeks oranı kullanılır.', limitation: 'Kişisel harcama sepetinizi veya belirli bir ürünün fiyatını göstermez.' },
  usd: { href: 'https://www.tcmb.gov.tr/kurlar/kurlar_tr.html', method: 'TCMB gösterge döviz alış kurlarının aylık ortalaması.', limitation: 'Bankada işlem yapılabilen kur veya ay sonu kuru değildir.' },
  eur: { href: 'https://www.tcmb.gov.tr/kurlar/kurlar_tr.html', method: 'TCMB gösterge döviz alış kurlarının aylık ortalaması.', limitation: 'Alış-satış makası ve komisyon dahil değildir.' },
  gold: { href: 'https://datahub.io/core/gold-prices', method: 'World Bank / DataHub aylık ons USD × aylık USD/TL ÷ 31,1034768.', limitation: 'İki aylık ortalamanın çarpımıdır; günlük gram fiyatlarının ortalaması veya kuyumcu satış fiyatı değildir.' },
  silver: { href: 'https://www.worldbank.org/en/research/commodity-markets', method: 'World Bank kaynaklı ons USD serisi × aylık USD/TL ÷ 31,1034768.', limitation: 'İşçilik, saflık farkı, yerel prim ve işlem maliyetleri dahil değildir.' },
  minimumWage: { href: 'https://www.csgb.gov.tr/istatistikler/calisma-hayati-istatistikleri/asgari-ucret/', method: 'İlgili dönemde geçerli net asgari ücret. Yıl içindeki değişimler ay bazında izlenir.', limitation: 'Geçmiş dönem vergi ve AGİ koşulları net ücreti etkiler; kişisel bordro hesabı değildir.' },
  bist100: { href: 'https://finance.yahoo.com/quote/XU100.IS/history/', method: 'Yahoo Finance XU100.IS aylık kapanış fiyat endeksi.', limitation: 'Temettü getirisi dahil değildir; yatırım fonunun veya portföyün getirisi değildir.' },
  bitcoin: { href: 'https://finance.yahoo.com/quote/BTC-USD/history/', method: 'BTC-USD aylık kapanışı × TCMB aylık USD/TL ortalaması.', limitation: 'Aynı andaki iki piyasa fiyatının çarpımı değildir; yaklaşık TL kıyasıdır.' },
  housing: { href: 'https://www.tcmb.gov.tr/wps/wcm/connect/TR/TCMB+TR/Main+Menu/Istatistikler/Reel+Sektor+Istatistikleri/Konut+Fiyat+Endeksi/', method: 'TCMB konut fiyat endeksinin üçüncü taraf tarihsel derlemesi.', limitation: 'Belirli bir evin fiyatını, kira getirisini veya bölgesel değerlemeyi göstermez.' },
  gasoline: { href: 'https://fred.stlouisfed.org/series/CP0722TRM086NEST', method: 'Eurostat / FRED Türkiye kişisel ulaşım yakıt ve yağlayıcı HICP endeksi.', limitation: 'TL/litre benzin fiyatı değildir. Benzin, diğer yakıtlar ve yağlayıcıları kapsayan fiyat endeksidir.' },
};

export function SourceLedger() {
  return <section className="evidence-section" aria-labelledby="source-ledger-title">
    <h2 id="source-ledger-title">Seri bazında kaynak ve yöntem</h2>
    <p>Kaynağa ait bağlantı ile verinin dosyamıza alınma yolu aynı olmayabilir. Aşağıdaki derleme notu, hesaplamada kullanılan gerçek kaynağı belirtir. <a href="/veri-durumu">Tarih kapsamını inceleyin.</a></p>
    {catalog.series.map(series => <section className="source-entry" id={series.key} key={series.key}>
      <h3>{series.name}</h3>
      <p>{sources[series.key]?.method}</p>
      <p><strong>Derleme notu:</strong> {series.sourceNote}</p>
      <p><strong>Sınır:</strong> {sources[series.key]?.limitation}</p>
      {sources[series.key] && <a href={sources[series.key].href} rel="noreferrer" target="_blank">{series.shortName} kaynağını aç</a>}
    </section>)}
  </section>;
}

export function DataStatus() {
  return <article className="evidence-section">
    <p className="eyebrow">Açık veri kapsamı</p><h1>Hesaplamanın veri durumu</h1>
    <p>Veri dosyasının güncellenme tarihi: <time dateTime={catalog.updatedAt}>{catalog.updatedAt}</time>. Bu tarih bütün serilerin aynı aya kadar güncel olduğu anlamına gelmez. Her satırdaki son gözlem esas alınır.</p>
    <div className="evidence-table-scroll"><table className="evidence-table"><caption>Hesaplayıcının kullandığı aylık veri dosyası</caption><thead><tr><th>Seri</th><th>İlk ay</th><th>Son ay</th><th>Son değer</th><th>Gözlem / eksik ay</th></tr></thead><tbody>
      {catalog.series.map(series => {
        const first = series.observations[0]; const last = series.observations[series.observations.length - 1];
        const monthIndex = (date: string) => Number(date.slice(0, 4)) * 12 + Number(date.slice(5, 7));
        const missing = monthIndex(last.date) - monthIndex(first.date) + 1 - series.observations.length;
        return <tr key={series.key}><th scope="row"><a href={`/veri-kaynaklari#${series.key}`}>{series.name}</a></th><td>{formatMonth(first.date.slice(0, 7))}</td><td>{formatMonth(last.date.slice(0, 7))}</td><td>{numberFormatter.format(last.value)} {series.unit}</td><td>{series.observations.length} / {missing}</td></tr>;
      })}
    </tbody></table></div>
    <h2>Eksik ayda ne olur?</h2><p>Olmayan gözlem tahmin edilmez ve başka ayın değeriyle doldurulmaz. Hesaplayıcı, son ortak veri ayını önerir. Seri içinde eksik bir ay veya kapsam dışındaki bir başlangıç seçerseniz tarih ya da ölçütü değiştirmenizi ister.</p>
    <h2>Veriyi kendiniz kontrol edin</h2><p><a href="/api/series" download="nekadarederdi-veri.json">Hesaplamada kullanılan JSON verisini indirin</a>. Tutar × bitiş değeri ÷ başlangıç değeri işlemiyle sonuçları yeniden üretebilirsiniz. Kaynakların yayın gecikmesi ve revizyonları nedeniyle bu dosya canlı fiyat ekranı değildir.</p>
    <h2>4 Ekim 2026 bakım notu</h2><p>Sayfalar ve örnek hesaplar aynı içerik ve hesaplama motorundan üretiliyor. Eksik tarihleri ilk veya son değerle dolduran davranış kaldırıldı. Yakıt göstergesinin litre fiyatı değil endeks olduğu açıklandı. Bu bakım kaydı, yeni ekonomik veri yayımlandığı iddiası değildir.</p>
    <p>İçerik düzenlemesi: <time dateTime={CONTENT_UPDATED}>{CONTENT_UPDATED}</time>. Veri hatası için <a href="/iletisim">kaynak ve tarih belirterek bildirim yapın</a>.</p>
  </article>;
}

export function CalculationEvidence({ results }: { results: CalculationResult[] }) {
  const cpi = results.find(result => result.series.key === 'cpi');
  return <section className="calculation-evidence" aria-label="Hesabın dayanağı">
    {cpi && <p><strong>TÜFE nasıl okunur?</strong> {formatMoney(cpi.normalizedAmount)} tutarının {formatMonth(cpi.endObservation.date.slice(0, 7))} fiyat düzeyindeki karşılığı yaklaşık {formatMoney(cpi.resultAmount)}. Bu, seçilen iki ayın genel tüketici fiyatları oranıdır; kişisel enflasyonunuz farklı olabilir.</p>}
    <details><summary>Hesabın adımları ve kullanılan değerler</summary>
      <p>Sonuç = başlangıç tutarının TL karşılığı × bitiş değeri ÷ başlangıç değeri. Yuvarlama yalnızca gösterimde yapılır.</p>
      {results.map(result => <div className="calculation-step" key={result.series.key}>
        <h3>{result.series.name}</h3>
        <p>{formatMoney(result.normalizedAmount)} × {numberFormatter.format(result.endObservation.value)} ÷ {numberFormatter.format(result.startObservation.value)} = {formatMoney(result.resultAmount)}</p>
        <p>{formatMonth(result.startObservation.date.slice(0, 7))} → {formatMonth(result.endObservation.date.slice(0, 7))} · Birim: {result.series.unit}</p>
        {cpi && result.series.key !== 'cpi' && <p>TÜFE'ye göre fark: %{numberFormatter.format((result.multiplier / cpi.multiplier - 1) * 100)}. Bu fark, maliyetler hariç bu göstergenin tüketici fiyatlarına kıyasla değişimidir.</p>}
        <a href={`/veri-kaynaklari#${result.series.key}`}>Kaynak ve yöntemi incele</a>
      </div>)}
    </details>
    <p><a href="/veri-durumu">Veri kapsamı</a> · <a href="/metodoloji">Yöntem ve sınırlar</a></p>
  </section>;
}
