import { useEffect, useMemo, useState } from 'react';
import { Check, Copy, Loader2, Moon, Sun } from 'lucide-react';
import { AdSlot } from './components/AdSlot';
import { Logo } from './components/Logo';
import { MonthSelect } from './components/MonthSelect';
import { MoneyValue } from './components/MoneyValue';
import { ResultCard } from './components/ResultCard';
import { SpotMarketBar } from './components/SpotMarketBar';
import { calculateOnBackend, fetchSeries } from './lib/api';
import { defaultState, isDefaultState, parseStateFromUrl, stateToSearchParams } from './lib/calculator';
import { formatEditableNumber, formatInputAmount, formatMoney, formatMonth, parseEditableLocalizedNumber } from './lib/format';
import type { CalculationResult, CalculatorState, InputUnit, MarketCatalog, MarketSeries, SeriesKey } from './types';

const MAX_INPUT_AMOUNT = 999_999_999_999;
const MAX_INPUT_MESSAGE = 'Miktar en fazla 999.999.999.999 olabilir.';
const AMOUNT_FORMAT_MESSAGE = 'Ã–rnek: 10000, 10.000 veya 10.000,50.';

const CRITERIA: { key: SeriesKey; label: string; hint: string; group: 'purchase' | 'currency' | 'asset' }[] = [
  { key: 'cpi', label: 'Reel TL', hint: 'AlÄ±m gÃ¼cÃ¼', group: 'purchase' },
  { key: 'minimumWage', label: 'Asgari Ã¼cret', hint: 'Net', group: 'purchase' },
  { key: 'gasoline', label: 'Benzin', hint: 'YakÄ±t', group: 'purchase' },
  { key: 'usd', label: 'Dolar', hint: 'Dolar', group: 'currency' },
  { key: 'eur', label: 'Euro', hint: 'Euro', group: 'currency' },
  { key: 'gold', label: 'AltÄ±n', hint: 'Gram', group: 'asset' },
  { key: 'silver', label: 'GÃ¼mÃ¼ÅŸ', hint: 'Gram', group: 'asset' },
  { key: 'bist100', label: 'BIST 100', hint: 'Endeks', group: 'asset' },
  { key: 'bitcoin', label: 'Bitcoin', hint: 'BTC', group: 'asset' },
  { key: 'housing', label: 'Konut', hint: 'KFE', group: 'asset' },
  { key: 'deposit', label: 'Mevduat', hint: 'BileÅŸik', group: 'asset' },
];

const CRITERIA_GROUPS: { key: 'purchase' | 'currency' | 'asset'; label: string }[] = [
  { key: 'purchase', label: 'AlÄ±m gÃ¼cÃ¼' },
  { key: 'currency', label: 'DÃ¶viz' },
  { key: 'asset', label: 'YatÄ±rÄ±m' },
];

const INPUT_UNITS: { key: InputUnit; label: string }[] = [
  { key: 'try', label: 'TL' },
  { key: 'usd', label: 'Dolar' },
  { key: 'eur', label: 'Euro' },
  { key: 'gold', label: 'Gram altÄ±n' },
  { key: 'silver', label: 'Gram gÃ¼mÃ¼ÅŸ' },
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
    metaTitle: 'Enflasyon Hesaplama | TÃœFE ile GeÃ§miÅŸ Para DeÄŸeri',
    description:
      'GeÃ§miÅŸteki bir TL tutarÄ±nÄ±n TÃœFE verilerine gÃ¶re bugÃ¼nkÃ¼ yaklaÅŸÄ±k satÄ±n alma gÃ¼cÃ¼nÃ¼ hesaplayÄ±n.',
    intro:
      'Enflasyon hesaplama, aynÄ± tutarÄ±n farklÄ± tarihlerdeki alÄ±m gÃ¼cÃ¼nÃ¼ karÅŸÄ±laÅŸtÄ±rmak iÃ§in kullanÄ±lÄ±r. Ne Kadar Ederdi, TÃœFE serisiyle geÃ§miÅŸ TL deÄŸerini aylÄ±k dÃ¼zeyde yaklaÅŸÄ±k olarak gÃ¶sterir.',
    calculatorHref: '/?criteria=cpi',
    sections: [
      {
        title: 'TÃœFE ile para deÄŸeri nasÄ±l okunur?',
        body:
          'TÃœFE, tÃ¼ketici fiyatlarÄ±ndaki deÄŸiÅŸimi izler. BaÅŸlangÄ±Ã§ ve bitiÅŸ ayÄ± arasÄ±ndaki endeks farkÄ±, geÃ§miÅŸteki tutarÄ±n bugÃ¼nkÃ¼ alÄ±m gÃ¼cÃ¼ne yaklaÅŸÄ±k bir Ã§arpan verir.',
      },
      {
        title: 'Hangi sorular iÃ§in kullanÄ±lÄ±r?',
        body:
          'â€œ2010 yÄ±lÄ±nda 10.000 TL bugÃ¼n ne kadar ederdi?â€ veya â€œeski maaÅŸÄ±m bugÃ¼nkÃ¼ parayla kaÃ§ TL olurdu?â€ gibi karÅŸÄ±laÅŸtÄ±rmalar iÃ§in uygundur.',
      },
      {
        title: 'SonuÃ§ yatÄ±rÄ±m tavsiyesi deÄŸildir',
        body:
          'Hesaplama tarihsel veri karÅŸÄ±laÅŸtÄ±rmasÄ±dÄ±r. Fiyat, maaÅŸ, kur ve yatÄ±rÄ±m kararlarÄ± iÃ§in tek baÅŸÄ±na kullanÄ±lmamalÄ±dÄ±r.',
      },
    ],
  },
  {
    path: '/gecmis-para-degeri',
    title: 'GeÃ§miÅŸ para deÄŸeri',
    metaTitle: 'GeÃ§miÅŸ Para DeÄŸeri Hesaplama | Ne Kadar Ederdi?',
    description:
      'GeÃ§miÅŸteki TL tutarlarÄ±nÄ± bugÃ¼nkÃ¼ deÄŸerle, enflasyon, dÃ¶viz, altÄ±n, gÃ¼mÃ¼ÅŸ ve asgari Ã¼cret Ã¼zerinden kÄ±yaslayÄ±n.',
    intro:
      'GeÃ§miÅŸ para deÄŸeri tek bir cevaba indirgenmez. AynÄ± tutar TÃœFEâ€™ye gÃ¶re baÅŸka, dolara veya altÄ±na gÃ¶re baÅŸka bir karÅŸÄ±lÄ±k verebilir. Bu sayfa farklÄ± Ã¶lÃ§Ã¼tleri birlikte okumak iÃ§in hazÄ±rlanmÄ±ÅŸtÄ±r.',
    calculatorHref: '/',
    sections: [
      {
        title: 'Reel deÄŸer fiyat dÃ¼zeyine baÄŸlÄ±dÄ±r',
        body:
          'Reel deÄŸer, tutarÄ±n kaÄŸÄ±t Ã¼zerindeki sayÄ±sÄ±nÄ± deÄŸil, fiyat dÃ¼zeyi karÅŸÄ±sÄ±ndaki yaklaÅŸÄ±k alÄ±m gÃ¼cÃ¼nÃ¼ gÃ¶sterir.',
      },
      {
        title: 'Tek Ã¶lÃ§Ã¼t yerine Ã§oklu kÄ±yas',
        body:
          'TÃœFE alÄ±m gÃ¼cÃ¼, dolar ve euro kur etkisi, altÄ±n ve gÃ¼mÃ¼ÅŸ deÄŸerli maden kÄ±yasÄ±, asgari Ã¼cret ise gelir dÃ¼zeyi perspektifi saÄŸlar.',
      },
      {
        title: 'Ay bazÄ±nda hesaplama',
        body:
          'Veriler aylÄ±k serilerle iÅŸlendiÄŸi iÃ§in yÄ±l iÃ§indeki bÃ¼yÃ¼k deÄŸiÅŸimler daha gÃ¶rÃ¼nÃ¼r hale gelir.',
      },
    ],
  },
  {
    path: '/bugunun-parasiyla-ne-kadar',
    title: 'BugÃ¼nÃ¼n parasÄ±yla ne kadar?',
    metaTitle: 'BugÃ¼nÃ¼n ParasÄ±yla Ne Kadar? | TL AlÄ±m GÃ¼cÃ¼ Hesaplama',
    description:
      'Eski bir fiyatÄ±n, maaÅŸÄ±n veya borcun bugÃ¼nÃ¼n parasÄ±yla yaklaÅŸÄ±k karÅŸÄ±lÄ±ÄŸÄ±nÄ± hesaplayÄ±n.',
    intro:
      'â€œBugÃ¼nÃ¼n parasÄ±yla ne kadar?â€ sorusu, geÃ§miÅŸteki bir tutarÄ± bugÃ¼nkÃ¼ fiyat ortamÄ±na taÅŸÄ±r. HesaplayÄ±cÄ±, seÃ§ilen baÅŸlangÄ±Ã§ ve bitiÅŸ ayÄ±na gÃ¶re yaklaÅŸÄ±k karÅŸÄ±lÄ±ÄŸÄ± Ã¼retir.',
    calculatorHref: '/?criteria=cpi%2CminimumWage',
    sections: [
      {
        title: 'FiyatlarÄ± bugÃ¼ne taÅŸÄ±mak',
        body:
          'Eski kira, maaÅŸ, Ã¼rÃ¼n fiyatÄ± veya birikim tutarÄ± TÃœFE ile bugÃ¼nkÃ¼ satÄ±n alma gÃ¼cÃ¼ aÃ§Ä±sÄ±ndan okunabilir.',
      },
      {
        title: 'Gelir dÃ¼zeyiyle kÄ±yaslamak',
        body:
          'Asgari Ã¼cret Ã¶lÃ§Ã¼tÃ¼, belirli bir tutarÄ±n farklÄ± dÃ¶nemlerdeki temel gelir seviyesine gÃ¶re nasÄ±l deÄŸiÅŸtiÄŸini gÃ¶rmeye yardÄ±mcÄ± olur.',
      },
      {
        title: 'PaylaÅŸÄ±labilir sonuÃ§',
        body:
          'Hesaplama sonrasÄ± oluÅŸan URL, seÃ§ilen tutar ve tarihlerle paylaÅŸÄ±labilir.',
      },
    ],
  },
  {
    path: '/dolar-bazinda-ne-kadar-ederdi',
    title: 'Dolar bazÄ±nda ne kadar ederdi?',
    metaTitle: 'Dolar BazÄ±nda Ne Kadar Ederdi? | TL USD KarÅŸÄ±laÅŸtÄ±rma',
    description:
      'GeÃ§miÅŸteki TL tutarÄ±nÄ± dolar kuru deÄŸiÅŸimine gÃ¶re bugÃ¼nkÃ¼ yaklaÅŸÄ±k TL karÅŸÄ±lÄ±ÄŸÄ±yla kÄ±yaslayÄ±n.',
    intro:
      'Dolar bazÄ±nda karÅŸÄ±laÅŸtÄ±rma, TLâ€™nin ABD dolarÄ± karÅŸÄ±sÄ±ndaki deÄŸiÅŸimini gÃ¶rmek iÃ§in kullanÄ±lÄ±r. Bu yaklaÅŸÄ±m alÄ±m gÃ¼cÃ¼nden farklÄ±dÄ±r; kur hareketine odaklanÄ±r.',
    calculatorHref: '/?criteria=usd',
    sections: [
      {
        title: 'Kur bazlÄ± karÅŸÄ±laÅŸtÄ±rma nedir?',
        body:
          'BaÅŸlangÄ±Ã§ ayÄ±ndaki TL/USD seviyesi ile bitiÅŸ ayÄ±ndaki seviye karÅŸÄ±laÅŸtÄ±rÄ±lÄ±r ve tutara yaklaÅŸÄ±k bir kur Ã§arpanÄ± uygulanÄ±r.',
      },
      {
        title: 'Enflasyonla aynÄ± ÅŸey deÄŸildir',
        body:
          'Dolar bazlÄ± sonuÃ§, TÃ¼rkiyeâ€™deki tÃ¼ketici fiyatlarÄ±nÄ± deÄŸil TLâ€™nin dolar karÅŸÄ±sÄ±ndaki deÄŸiÅŸimini gÃ¶sterir.',
      },
      {
        title: 'Ne zaman kullanÄ±lÄ±r?',
        body:
          'DÃ¶vizle ifade edilen maliyetler, ithal Ã¼rÃ¼nler veya dÃ¶viz bazlÄ± birikim kÄ±yaslarÄ± iÃ§in fikir verir.',
      },
    ],
  },
  {
    path: '/altin-bazinda-ne-kadar-ederdi',
    title: 'AltÄ±n bazÄ±nda ne kadar ederdi?',
    metaTitle: 'AltÄ±n BazÄ±nda Ne Kadar Ederdi? | Gram AltÄ±n KarÅŸÄ±laÅŸtÄ±rma',
    description:
      'GeÃ§miÅŸteki TL tutarÄ±nÄ± gram altÄ±n fiyatÄ± deÄŸiÅŸimine gÃ¶re bugÃ¼nkÃ¼ yaklaÅŸÄ±k karÅŸÄ±lÄ±ÄŸÄ±yla hesaplayÄ±n.',
    intro:
      'AltÄ±n bazÄ±nda karÅŸÄ±laÅŸtÄ±rma, belirli bir TL tutarÄ±nÄ±n gram altÄ±n fiyatÄ±ndaki deÄŸiÅŸimle nasÄ±l farklÄ±laÅŸacaÄŸÄ±nÄ± gÃ¶sterir. Bu sonuÃ§ yatÄ±rÄ±m getirisi deÄŸil, tarihsel fiyat kÄ±yasÄ±dÄ±r.',
    calculatorHref: '/?criteria=gold%2Csilver',
    sections: [
      {
        title: 'Gram altÄ±n Ã§arpanÄ±',
        body:
          'BaÅŸlangÄ±Ã§ ve bitiÅŸ ayÄ±ndaki gram altÄ±n TL fiyatlarÄ± oranlanÄ±r. BÃ¶ylece geÃ§miÅŸteki tutarÄ±n altÄ±n fiyatÄ±na gÃ¶re bugÃ¼nkÃ¼ yaklaÅŸÄ±k karÅŸÄ±lÄ±ÄŸÄ± bulunur.',
      },
      {
        title: 'GÃ¼mÃ¼ÅŸle birlikte okumak',
        body:
          'GÃ¼mÃ¼ÅŸ serisi, deÄŸerli madenler arasÄ±nda farklÄ± fiyat davranÄ±ÅŸlarÄ±nÄ± kÄ±yaslamaya yardÄ±mcÄ± olur.',
      },
      {
        title: 'YaklaÅŸÄ±k tarihsel kÄ±yas',
        body:
          'Vergi, makas, alÄ±ÅŸ-satÄ±ÅŸ farkÄ± ve iÅŸlem maliyeti gibi detaylar hesaplamaya dahil deÄŸildir.',
      },
    ],
  },
  {
    path: '/2010da-10000-tl-bugun-ne-kadar',
    title: '2010â€™da 10.000 TL bugÃ¼n ne kadar?',
    metaTitle: '2010â€™da 10.000 TL BugÃ¼n Ne Kadar? | Enflasyon ve YatÄ±rÄ±m KÄ±yas',
    description:
      '2010 yÄ±lÄ±ndaki 10.000 TL tutarÄ±nÄ± bugÃ¼nÃ¼n parasÄ±yla, TÃœFE, dolar, altÄ±n, BIST 100 ve Bitcoin verileriyle kÄ±yaslayÄ±n.',
    intro:
      'â€œ2010â€™da 10.000 TL bugÃ¼n ne kadar ederdi?â€ sorusu tek bir cevaba sahip deÄŸildir. TÃœFE alÄ±m gÃ¼cÃ¼nÃ¼, dolar ve altÄ±n kur/fiyat etkisini, BIST 100 ve Bitcoin ise piyasa bazlÄ± tarihsel deÄŸiÅŸimi gÃ¶sterir.',
    calculatorHref: '/?amount=10000&start=2010-01&criteria=cpi%2Cusd%2Cgold%2Cbist100%2Cbitcoin',
    sections: [
      {
        title: 'TÃœFE ile bugÃ¼nkÃ¼ karÅŸÄ±lÄ±k',
        body:
          'TÃœFE hesabÄ±, 2010â€™daki 10.000 TLâ€™nin tÃ¼ketici fiyatlarÄ± karÅŸÄ±sÄ±ndaki yaklaÅŸÄ±k bugÃ¼nkÃ¼ alÄ±m gÃ¼cÃ¼nÃ¼ gÃ¶sterir.',
      },
      {
        title: 'Dolar ve altÄ±n farklÄ± sonuÃ§ verir',
        body:
          'DÃ¶viz ve gram altÄ±n serileri fiyat hareketlerini izlediÄŸi iÃ§in enflasyon hesabÄ±ndan farklÄ± Ã§arpanlar Ã¼retir.',
      },
      {
        title: 'Piyasa gÃ¶stergeleriyle okumak',
        body:
          'BIST 100 ve Bitcoin gibi seriler, aynÄ± tutarÄ±n yatÄ±rÄ±m piyasalarÄ±yla kÄ±yaslandÄ±ÄŸÄ±nda nasÄ±l deÄŸiÅŸeceÄŸini yaklaÅŸÄ±k olarak gÃ¶sterir.',
      },
    ],
  },
  {
    path: '/eski-maas-bugun-ne-kadar',
    title: 'Eski maaÅŸ bugÃ¼n ne kadar?',
    metaTitle: 'Eski MaaÅŸ BugÃ¼n Ne Kadar? | MaaÅŸ Enflasyon Hesaplama',
    description:
      'Eski maaÅŸÄ±nÄ±zÄ± bugÃ¼nkÃ¼ alÄ±m gÃ¼cÃ¼yle ve asgari Ã¼cret, dÃ¶viz, altÄ±n gibi farklÄ± gÃ¶stergelerle karÅŸÄ±laÅŸtÄ±rÄ±n.',
    intro:
      'Eski maaÅŸÄ±n bugÃ¼nkÃ¼ karÅŸÄ±lÄ±ÄŸÄ±nÄ± hesaplarken yalnÄ±zca nominal tutara bakmak yanÄ±ltÄ±cÄ±dÄ±r. Enflasyon, asgari Ã¼cret, dÃ¶viz ve altÄ±n gibi Ã¶lÃ§Ã¼tler farklÄ± ekonomik bakÄ±ÅŸlar saÄŸlar.',
    calculatorHref: '/?criteria=cpi%2CminimumWage%2Cusd%2Cgold',
    sections: [
      {
        title: 'MaaÅŸÄ±n alÄ±m gÃ¼cÃ¼',
        body:
          'TÃœFE serisi, eski maaÅŸÄ±n bugÃ¼nkÃ¼ fiyat dÃ¼zeyindeki yaklaÅŸÄ±k alÄ±m gÃ¼cÃ¼nÃ¼ hesaplamak iÃ§in en doÄŸrudan Ã¶lÃ§Ã¼ttÃ¼r.',
      },
      {
        title: 'Asgari Ã¼cretle kÄ±yas',
        body:
          'Asgari Ã¼cret karÅŸÄ±laÅŸtÄ±rmasÄ±, maaÅŸÄ±n temel gelir dÃ¼zeylerine gÃ¶re tarih iÃ§inde nasÄ±l konumlandÄ±ÄŸÄ±nÄ± anlamaya yardÄ±m eder.',
      },
      {
        title: 'DÃ¶viz ve altÄ±n perspektifi',
        body:
          'Dolar ve altÄ±n bazlÄ± sonuÃ§lar gelir alÄ±m gÃ¼cÃ¼nden Ã§ok kur ve deÄŸerli maden fiyatÄ± deÄŸiÅŸimini gÃ¶sterir.',
      },
    ],
  },
  {
    path: '/kira-enflasyon-hesaplama',
    title: 'Kira enflasyon hesaplama',
    metaTitle: 'Kira Enflasyon Hesaplama | Eski Kira BugÃ¼n Ne Kadar?',
    description:
      'GeÃ§miÅŸteki kira tutarÄ±nÄ± TÃœFE ve farklÄ± ekonomik gÃ¶stergelerle bugÃ¼nkÃ¼ yaklaÅŸÄ±k deÄŸerine taÅŸÄ±yÄ±n.',
    intro:
      'Eski kira tutarlarÄ±nÄ± bugÃ¼nÃ¼n koÅŸullarÄ±yla okumak iÃ§in TÃœFE iyi bir baÅŸlangÄ±Ã§ noktasÄ±dÄ±r. AynÄ± tutarÄ± dÃ¶viz, altÄ±n veya asgari Ã¼cret gibi Ã¶lÃ§Ã¼tlerle kÄ±yaslamak ise farklÄ± yorumlar saÄŸlar.',
    calculatorHref: '/?criteria=cpi%2CminimumWage%2Cusd',
    sections: [
      {
        title: 'Kira tutarÄ±nÄ± bugÃ¼ne taÅŸÄ±mak',
        body:
          'BaÅŸlangÄ±Ã§ ayÄ±ndaki kira, seÃ§ilen bitiÅŸ ayÄ±na TÃœFE Ã§arpanÄ±yla taÅŸÄ±narak yaklaÅŸÄ±k bugÃ¼nkÃ¼ alÄ±m gÃ¼cÃ¼ bulunur.',
      },
      {
        title: 'Gelire gÃ¶re kira yÃ¼kÃ¼',
        body:
          'Asgari Ã¼cret karÅŸÄ±laÅŸtÄ±rmasÄ±, bir kira tutarÄ±nÄ±n temel gelir seviyesine gÃ¶re ne kadar aÄŸÄ±rlaÅŸtÄ±ÄŸÄ±nÄ± veya hafiflediÄŸini gÃ¶sterir.',
      },
      {
        title: 'YaklaÅŸÄ±k karÅŸÄ±laÅŸtÄ±rma',
        body:
          'Hesaplama kira artÄ±ÅŸ mevzuatÄ± ya da bÃ¶lgesel konut piyasasÄ± yerine genel ekonomik serileri kullanÄ±r.',
      },
    ],
  },
  {
    path: '/bist-bitcoin-altin-karsilastirma',
    title: 'BIST, Bitcoin ve altÄ±n karÅŸÄ±laÅŸtÄ±rma',
    metaTitle: 'BIST, Bitcoin ve AltÄ±n KarÅŸÄ±laÅŸtÄ±rma | Ne Kadar Ederdi?',
    description:
      'Bir TL tutarÄ±nÄ± BIST 100, Bitcoin, gram altÄ±n ve gÃ¼mÃ¼ÅŸ fiyatlarÄ±ndaki tarihsel deÄŸiÅŸimle karÅŸÄ±laÅŸtÄ±rÄ±n.',
    intro:
      'AynÄ± TL tutarÄ± enflasyon, dÃ¶viz, altÄ±n, BIST 100 ve Bitcoin gibi farklÄ± serilerle bambaÅŸka sonuÃ§lar verebilir. Bu sayfa yatÄ±rÄ±m tavsiyesi deÄŸil, tarihsel kÄ±yaslama Ã§erÃ§evesi sunar.',
    calculatorHref: '/?criteria=gold%2Csilver%2Cbist100%2Cbitcoin',
    sections: [
      {
        title: 'Fiyat serileri aynÄ± ÅŸeyi Ã¶lÃ§mez',
        body:
          'AltÄ±n, BIST 100 ve Bitcoin farklÄ± risk, oynaklÄ±k ve piyasa dinamiklerine sahiptir; sonuÃ§lar birlikte okunmalÄ±dÄ±r.',
      },
      {
        title: 'Tarih aralÄ±ÄŸÄ± sonucu belirler',
        body:
          'BaÅŸlangÄ±Ã§ ve bitiÅŸ ayÄ± deÄŸiÅŸtikÃ§e Ã§arpanlar bÃ¼yÃ¼k Ã¶lÃ§Ã¼de farklÄ±laÅŸabilir. Bu yÃ¼zden ay bazlÄ± seÃ§im Ã¶nemlidir.',
      },
      {
        title: 'YaklaÅŸÄ±k ve brÃ¼t karÅŸÄ±laÅŸtÄ±rma',
        body:
          'Vergi, iÅŸlem maliyeti, temettÃ¼, saklama maliyeti veya alÄ±m-satÄ±m makasÄ± gibi detaylar dahil deÄŸildir.',
      },
    ],
  },
];

const INFO_PAGES: InfoPageContent[] = [
  {
    path: '/hakkinda',
    title: 'HakkÄ±nda',
    metaTitle: 'HakkÄ±nda | Ne Kadar Ederdi?',
    description:
      "Ne Kadar Ederdi'nin amacÄ±, kullandÄ±ÄŸÄ± veri tÃ¼rleri ve hesaplama yaklaÅŸÄ±mÄ± hakkÄ±nda bilgi.",
    intro:
      'Ne Kadar Ederdi, geÃ§miÅŸteki veya bugÃ¼nkÃ¼ bir tutarÄ± farklÄ± ekonomik gÃ¶stergelerle ay bazÄ±nda karÅŸÄ±laÅŸtÄ±rmak iÃ§in hazÄ±rlanmÄ±ÅŸ baÄŸÄ±msÄ±z bir hesaplama aracÄ±dÄ±r.',
    sections: [
      {
        title: 'Ne iÅŸe yarar?',
        body:
          'AraÃ§; TÃœFE, dÃ¶viz, gram altÄ±n, gÃ¼mÃ¼ÅŸ, asgari Ã¼cret, BIST 100, Bitcoin ve benzeri tarihsel serilerle yaklaÅŸÄ±k karÅŸÄ±laÅŸtÄ±rma yapar. AmaÃ§ tek bir kesin cevap vermek deÄŸil, farklÄ± Ã¶lÃ§Ã¼tleri birlikte okunur hale getirmektir.',
      },
      {
        title: 'Veri yaklaÅŸÄ±mÄ±',
        body:
          'Hesaplamalar aylÄ±k veri noktalarÄ±na dayanÄ±r. Kaynak notlarÄ± sonuÃ§ kartlarÄ±nda gÃ¶sterilir; seri gÃ¼ncellemeleri otomatik veri toplama sÃ¼reciyle yenilenir ve eksik kaynaklarda mevcut son veri korunur.',
      },
      {
        title: 'Tavsiye deÄŸildir',
        body:
          'SonuÃ§lar bilgilendirme amaÃ§lÄ±dÄ±r. YatÄ±rÄ±m, kredi, kira, maaÅŸ veya hukuki kararlar iÃ§in tek baÅŸÄ±na kullanÄ±lmamalÄ±dÄ±r.',
      },
    ],
  },
  {
    path: '/iletisim',
    title: 'Ä°letiÅŸim',
    metaTitle: 'Ä°letiÅŸim | Ne Kadar Ederdi?',
    description:
      'Ne Kadar Ederdi ile ilgili Ã¶neri, veri kaynaÄŸÄ±, hata bildirimi ve reklam talepleri iÃ§in iletiÅŸim bilgileri.',
    intro:
      'Ã–neri, hata bildirimi, veri kaynaÄŸÄ± dÃ¼zeltmesi veya reklam ve iÅŸ birliÄŸi talepleri iÃ§in iletiÅŸim kurabilirsiniz.',
    sections: [
      {
        title: 'E-posta',
        body:
          'Siteyle ilgili geri bildirimler iÃ§in e-posta gÃ¶nderebilirsiniz. MÃ¼mkÃ¼nse ilgili sayfa adresini, tarih aralÄ±ÄŸÄ±nÄ± ve beklediÄŸiniz sonucu da ekleyin.',
        link: { label: 'egemenyildiz03@gmail.com', href: 'mailto:egemenyildiz03@gmail.com' },
      },
      {
        title: 'Veri ve hata bildirimi',
        body:
          'Bir seride eksik, gecikmeli veya hatalÄ± gÃ¶rÃ¼nen veri fark ederseniz kaynak Ã¶nerisini ve Ã¶rnek hesaplamayÄ± paylaÅŸmanÄ±z sorunu daha hÄ±zlÄ± incelememizi saÄŸlar.',
      },
      {
        title: 'Reklam ve iÅŸ birliÄŸi',
        body:
          'Reklam yerleÅŸimleri kullanÄ±cÄ± deneyimini bozmayacak ÅŸekilde sÄ±nÄ±rlÄ± tutulur. Ä°ÅŸ birliÄŸi taleplerinde marka, kampanya ve hedef sayfa bilgisini belirtmeniz yeterlidir.',
      },
    ],
  },
  {
    path: '/gizlilik-politikasi',
    title: 'Gizlilik PolitikasÄ±',
    metaTitle: 'Gizlilik PolitikasÄ± | Ne Kadar Ederdi?',
    description:
      "Ne Kadar Ederdi'nin analitik, reklam, Ã§erez ve kullanÄ±cÄ± verisi yaklaÅŸÄ±mÄ± hakkÄ±nda gizlilik bilgileri.",
    intro:
      'Bu sayfa, Ne Kadar Ederdi kullanÄ±lÄ±rken hangi tÃ¼r verilerin iÅŸlenebileceÄŸini ve Ã¼Ã§Ã¼ncÃ¼ taraf servislerin nasÄ±l kullanÄ±ldÄ±ÄŸÄ±nÄ± aÃ§Ä±klar.',
    sections: [
      {
        title: 'Toplanan veriler',
        body:
          'Sitede hesaplama yapmak iÃ§in kullanÄ±cÄ± hesabÄ± gerekmez. Miktar, tarih ve karÅŸÄ±laÅŸtÄ±rma seÃ§imleri hesaplama amacÄ±yla tarayÄ±cÄ±nÄ±z ile sunucu arasÄ±nda iÅŸlenir; bu bilgiler bireysel profil oluÅŸturmak iÃ§in kullanÄ±lmaz.',
      },
      {
        title: 'Analitik ve reklam',
        body:
          'Site performansÄ±nÄ± ve ziyaret trafiÄŸini anlamak iÃ§in Cloudflare Web Analytics kullanÄ±labilir. Reklam gÃ¶sterimi iÃ§in Google AdSense kullanÄ±lÄ±r; Google ve iÅŸ ortaklarÄ± Ã§erezler veya benzer teknolojilerle reklam Ã¶lÃ§Ã¼mÃ¼ yapabilir.',
      },
      {
        title: 'Ä°letiÅŸim bilgileri',
        body:
          'E-posta ile bize ulaÅŸÄ±rsanÄ±z, paylaÅŸtÄ±ÄŸÄ±nÄ±z ad, e-posta adresi ve mesaj iÃ§eriÄŸi yalnÄ±zca talebinize cevap vermek iÃ§in kullanÄ±lÄ±r.',
      },
      {
        title: 'ÃœÃ§Ã¼ncÃ¼ taraf baÄŸlantÄ±lar',
        body:
          'Sitede veri kaynaklarÄ±na, sosyal paylaÅŸÄ±m servislerine veya reklam aÄŸlarÄ±na yÃ¶nlendiren baÄŸlantÄ±lar bulunabilir. Bu servislerin kendi gizlilik politikalarÄ±nÄ± incelemeniz Ã¶nerilir.',
      },
    ],
  },
  {
    path: '/kullanim-sartlari',
    title: 'KullanÄ±m ÅžartlarÄ±',
    metaTitle: 'KullanÄ±m ÅžartlarÄ± | Ne Kadar Ederdi?',
    description:
      "Ne Kadar Ederdi hesaplama aracÄ±nÄ±n kullanÄ±m koÅŸullarÄ±, veri sÄ±nÄ±rlarÄ± ve sorumluluk reddi.",
    intro:
      'Ne Kadar Ederdi sitesini kullanarak hesaplamalarÄ±n yaklaÅŸÄ±k ve bilgilendirme amaÃ§lÄ± olduÄŸunu kabul etmiÅŸ olursunuz.',
    sections: [
      {
        title: 'YaklaÅŸÄ±k hesaplama',
        body:
          'SonuÃ§lar aylÄ±k tarihsel serilerden Ã¼retilen yaklaÅŸÄ±k karÅŸÄ±laÅŸtÄ±rmalardÄ±r. Veri kaynaklarÄ±nda revizyon, gecikme, eksiklik veya metodoloji farkÄ± olabilir.',
      },
      {
        title: 'Finansal tavsiye deÄŸildir',
        body:
          'Sitedeki iÃ§erikler yatÄ±rÄ±m, finans, hukuk, vergi veya muhasebe tavsiyesi niteliÄŸinde deÄŸildir. KararlarÄ±nÄ±z iÃ§in uzman gÃ¶rÃ¼ÅŸÃ¼ almanÄ±z Ã¶nerilir.',
      },
      {
        title: 'KullanÄ±m sorumluluÄŸu',
        body:
          'Hesaplama sonuÃ§larÄ±nÄ± yorumlama ve kullanma sorumluluÄŸu kullanÄ±cÄ±ya aittir. Site kesintisiz, hatasÄ±z veya belirli bir amaca uygun sonuÃ§ garantisi vermez.',
      },
      {
        title: 'DeÄŸiÅŸiklikler',
        body:
          'Veri serileri, reklam yerleÅŸimleri, sayfa iÃ§erikleri ve kullanÄ±m ÅŸartlarÄ± zaman iÃ§inde gÃ¼ncellenebilir.',
      },
    ],
  },
];

const FOOTER_LINKS = [
  { href: '/hakkinda', label: 'HakkÄ±nda' },
  { href: '/iletisim', label: 'Ä°letiÅŸim' },
  { href: '/gizlilik-politikasi', label: 'Gizlilik PolitikasÄ±' },
  { href: '/kullanim-sartlari', label: 'KullanÄ±m ÅžartlarÄ±' },
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
  const [theme, setTheme] = useState<'light' | 'dark'>(() =>
    document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light',
  );

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
        const message = apiError instanceof Error ? apiError.message : 'Hesaplama yapÄ±lamadÄ±.';
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
  const latestCommonEndMonth = useMemo(() => getLatestCommonEndMonth(catalog, state.criteria), [catalog, state.criteria]);
  const endMaxYear = latestCommonEndMonth ? Number(latestCommonEndMonth.slice(0, 4)) : yearRange.max;

  useEffect(() => {
    if (latestCommonEndMonth && state.endMonth > latestCommonEndMonth) {
      setState((current) => ({ ...current, endMonth: latestCommonEndMonth }));
    }
  }, [latestCommonEndMonth, state.endMonth]);

  const inputTryAmount = results[0]?.normalizedAmount;
  const shareText = `Ne Kadar Ederdi? ${formatInputAmount(state.amount, state.inputUnit)}: ${formatMonth(state.startMonth)} â†’ ${formatMonth(state.endMonth)}`;
  const shareUrl = window.location.href;

  function updateState(partial: Partial<CalculatorState>) {
    setState((current) => ({ ...current, ...partial }));
  }

  function updateAmount(value: string) {
    if (!/^[\d.,]*$/.test(value)) {
      setAmountWarning('Miktar alanÄ±na sadece rakam, nokta ve virgÃ¼l girebilirsiniz.');
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
      setAmountWarning("Miktar 0'dan bÃ¼yÃ¼k olmalÄ±.");
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
            <p className="eyebrow">Ay ay deÄŸer hesabÄ±</p>
            <p className="site-header__line">GeÃ§miÅŸ para, bugÃ¼nÃ¼n hesabÄ±yla.</p>
            <p className="site-header__note">
              TÃœFE, dÃ¶viz, altÄ±n, gÃ¼mÃ¼ÅŸ, gelir ve piyasa verilerini aynÄ± ekranda okuyun.
            </p>
          </div>
          <button
            aria-label={theme === 'dark' ? 'AÃ§Ä±k temaya geÃ§' : 'Koyu temaya geÃ§'}
            className="theme-toggle"
            type="button"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun aria-hidden="true" size={18} /> : <Moon aria-hidden="true" size={18} />}
          </button>
        </header>

        <section className="workbench [overflow-anchor:none]">
          <form
            className="calculator-panel [overflow-anchor:none] lg:sticky lg:top-5 lg:self-start"
            onSubmit={(event) => event.preventDefault()}
          >
            <div className="calculator-panel__head">
              <p className="eyebrow">Hesapla</p>
              <h1>Ne kadar ederdi?</h1>
              <p>{formatMonth(state.startMonth)} ile {formatMonth(state.endMonth)} arasÄ±ndaki karÅŸÄ±lÄ±ÄŸÄ± karÅŸÄ±laÅŸtÄ±rÄ±n.</p>
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
                  label="BaÅŸlangÄ±Ã§"
                  minYear={yearRange.min}
                  maxYear={yearRange.max}
                  value={state.startMonth}
                  onChange={(startMonth) => updateState({ startMonth })}
                />
                <MonthSelect
                  label="BitiÅŸ"
                  minYear={yearRange.min}
                  maxMonth={latestCommonEndMonth ?? undefined}
                  maxYear={endMaxYear}
                  value={state.endMonth}
                  onChange={(endMonth) => updateState({ endMonth })}
                />
              </div>

              {latestCommonEndMonth !== null && latestCommonEndMonth! < defaultState().endMonth && (
                <p className="inline-note">
                  SeÃ§ili karÅŸÄ±laÅŸtÄ±rmalar iÃ§in son ortak veri: {formatMonth(latestCommonEndMonth ?? '')}.
                </p>
              )}

              <fieldset className="criteria-picker">
                <legend>KarÅŸÄ±laÅŸtÄ±rma Ã¶lÃ§Ã¼tleri</legend>
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
                  2005 Ã¶ncesi giriÅŸlerde eski TL yeni TL'ye Ã§evrilir; baÅŸlangÄ±Ã§ tutarÄ± 1.000.000'a bÃ¶lÃ¼nerek hesaplanÄ±r.
                </p>
              )}
            </div>
          </form>

          <section className="results-panel [overflow-anchor:none]" aria-live="polite">
            <div className="result-summary">
              <div className="result-summary__main">
                <div>
                  <p className="eyebrow">Hesaplama Ã¶zeti</p>
                  <h2>
                    <MoneyValue inputUnit={state.inputUnit} size="summary" value={state.amount || 0} />
                  </h2>
                  <p>
                    {formatMonth(state.startMonth)} tarihinden {formatMonth(state.endMonth)} tarihine gÃ¶re.
                  </p>
                  {state.inputUnit !== 'try' && inputTryAmount ? (
                    <p className="result-summary__note">
                      BaÅŸlangÄ±Ã§ ayÄ±ndaki yaklaÅŸÄ±k TL karÅŸÄ±lÄ±ÄŸÄ±: {formatMoney(inputTryAmount)}
                    </p>
                  ) : null}
                </div>
                <div className="share-actions">
                  <a
                    className="icon-action"
                    href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
                    rel="noreferrer"
                    target="_blank"
                    title="X'te paylaÅŸ"
                  >
                    <XIcon />
                  </a>
                  <a
                    className="icon-action"
                    href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
                    rel="noreferrer"
                    target="_blank"
                    title="WhatsApp'ta paylaÅŸ"
                  >
                    <WhatsAppIcon />
                  </a>
                  <button className="icon-action" title="BaÄŸlantÄ±yÄ± kopyala" type="button" onClick={copyUrl}>
                    {copied ? <Check aria-hidden="true" size={18} /> : <Copy aria-hidden="true" size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {error && <p className="error-state">{error}</p>}

            {loading && !error && results.length === 0 && (
              <div className="loading-state">
                <Loader2 className="animate-spin" aria-hidden="true" size={28} />
                <span>Hesaplama hazÄ±rlanÄ±yor</span>
              </div>
            )}

            {results.length > 0 && (
              <div className="result-ledger [overflow-anchor:none]">
                <div className="result-ledger__head">
                  <span>Ã–lÃ§Ã¼t</span>
                  <span>KarÅŸÄ±lÄ±k</span>
                  <span>Ã‡arpan</span>
                  <span aria-hidden="true" />
                </div>
                {results.map((result) => (
                  <ResultCard key={result.series.key} result={result} />
                ))}
              </div>
            )}
          </section>
        </section>

        <aside className="secondary-strip">
          <SpotMarketBar />
          <AdSlot label="Reklam alanÄ±" placement="top" />
        </aside>

        {results.length > 0 && <AdSlot label="SonuÃ§ altÄ± reklam alanÄ±" placement="results" />}

        <p className="disclaimer">
          Bu araÃ§ resmi ve gÃ¼venilir tarihsel kaynaklardan derlenen aylÄ±k verilerle yaklaÅŸÄ±k kÄ±yaslama sunar; yatÄ±rÄ±m tavsiyesi deÄŸildir.
        </p>

        <section aria-labelledby="seo-heading" className="guide-section">
          <div className="guide-section__intro">
            <p className="eyebrow">Okuma rehberi</p>
            <h2 id="seo-heading">GeÃ§miÅŸteki para deÄŸerini karÅŸÄ±laÅŸtÄ±rma</h2>
          </div>
          <div className="guide-section__items">
            <article>
              <h3>Enflasyona gÃ¶re TL deÄŸeri</h3>
              <p>TÃœFE serisi, geÃ§miÅŸteki bir TL tutarÄ±nÄ±n bugÃ¼nkÃ¼ yaklaÅŸÄ±k satÄ±n alma gÃ¼cÃ¼nÃ¼ gÃ¶rmek iÃ§in kullanÄ±lÄ±r.</p>
            </article>
            <article>
              <h3>DÃ¶viz ve deÄŸerli maden kÄ±yasÄ±</h3>
              <p>Dolar, euro, gram altÄ±n ve gÃ¼mÃ¼ÅŸ karÅŸÄ±laÅŸtÄ±rmalarÄ± aylÄ±k veri serileri Ã¼zerinden yaklaÅŸÄ±k Ã§arpan Ã¼retir.</p>
            </article>
            <article>
              <h3>Asgari Ã¼cretle karÅŸÄ±laÅŸtÄ±rma</h3>
              <p>Net asgari Ã¼cret serisi, belirli bir tutarÄ±n dÃ¶nemsel gelir dÃ¼zeyleriyle kÄ±yaslanmasÄ±na yardÄ±mcÄ± olur.</p>
            </article>
          </div>
          <nav className="guide-links" aria-label="Ä°lgili rehberler">
            {LANDING_PAGES.map((page) => (
              <a href={page.path} key={page.path}>
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
          <a className="w-fit" href="/" aria-label="Ana hesaplayÄ±cÄ±ya git">
            <Logo />
          </a>
          <nav className="flex flex-wrap gap-2 text-sm sm:justify-self-end" aria-label="SEO sayfalarÄ±">
            <a className="rounded-md border border-ink-200 bg-white px-3 py-2 text-ink-700 hover:border-ink-500" href="/">
              HesaplayÄ±cÄ±
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
                HesaplayÄ±cÄ±yÄ± aÃ§
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
            <h2 className="font-display text-2xl font-black text-ink-950">Ä°lgili hesaplama sayfalarÄ±</h2>
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
          <a className="w-fit" href="/" aria-label="Ana hesaplayÄ±cÄ±ya git">
            <Logo />
          </a>
          <nav className="flex flex-wrap gap-2 text-sm sm:justify-self-end" aria-label="Site sayfalarÄ±">
            <a className="rounded-md border border-ink-200 bg-white px-3 py-2 text-ink-700 hover:border-ink-500" href="/">
              HesaplayÄ±cÄ±
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

function getLatestCommonEndMonth(catalog: MarketCatalog | null, criteria: SeriesKey[]): string | null {
  if (!catalog || criteria.length === 0) {
    return null;
  }

  const latestMonths = criteria
    .map((key) => catalog.series.find((series) => series.key === key))
    .filter((series): series is MarketSeries => Boolean(series))
    .map((series) =>
      series.observations
        .filter((observation) => Number.isFinite(observation.value))
        .map((observation) => observation.date.slice(0, 7))
        .sort((first, second) => second.localeCompare(first))[0],
    )
    .filter((month): month is string => Boolean(month));

  return latestMonths.length ? latestMonths.sort()[0] : null;
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
        Ne Kadar Ederdi tarihsel veri karÅŸÄ±laÅŸtÄ±rma aracÄ±dÄ±r; yatÄ±rÄ±m tavsiyesi deÄŸildir.
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
