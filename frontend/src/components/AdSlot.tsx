import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type AdPlacement = 'top' | 'results';

type AdSlotProps = {
  label: string;
  placement: AdPlacement;
};

const ADSENSE_CLIENT = import.meta.env.VITE_ADSENSE_CLIENT;
const AD_SLOTS: Record<AdPlacement, string | undefined> = {
  top: import.meta.env.VITE_ADSENSE_TOP_SLOT,
  results: import.meta.env.VITE_ADSENSE_RESULTS_SLOT,
};

export function AdSlot({ label, placement }: AdSlotProps) {
  const clientId = ADSENSE_CLIENT;
  const adSlot = AD_SLOTS[placement];
  const isConfigured = Boolean(clientId && adSlot);
  const adRef = useRef<HTMLModElement>(null);
  const [adStatus, setAdStatus] = useState<'pending' | 'filled' | 'unfilled'>('pending');

  useEffect(() => {
    if (!clientId || !adSlot) {
      return;
    }

    setAdStatus('pending');
    ensureAdSenseScript(clientId);

    try {
      window.adsbygoogle = window.adsbygoogle ?? [];
      window.adsbygoogle.push({});
    } catch {
      // Ad blockers and pending AdSense approval can throw here; the reserved slot stays in place.
    }
  }, [clientId, adSlot]);

  useEffect(() => {
    if (!isConfigured || !adRef.current) {
      return;
    }

    const element = adRef.current;
    const readStatus = () => {
      const status = element.getAttribute('data-ad-status');
      if (status === 'filled' || status === 'unfilled') {
        setAdStatus(status);
      }
    };

    const observer = new MutationObserver(readStatus);
    observer.observe(element, { attributes: true, attributeFilter: ['data-ad-status'] });

    const timeoutId = window.setTimeout(() => {
      if (adStatus === 'pending') {
        setAdStatus('unfilled');
      }
    }, 2500);

    readStatus();

    return () => {
      observer.disconnect();
      window.clearTimeout(timeoutId);
    };
  }, [adStatus, isConfigured]);

  if (!isConfigured) {
    return (
      <div className="relative flex min-h-24 items-center justify-center rounded-md border border-dashed border-ink-200 bg-white/70 px-4 text-center text-sm text-ink-500">
        <AdLabel />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-24 items-center justify-center overflow-hidden rounded-md border border-dashed border-ink-100 bg-white/70 px-2 py-3">
      {adStatus !== 'filled' ? (
        <>
          <AdLabel />
          <span className="pointer-events-none absolute inset-x-4 top-1/2 -translate-y-1/2 text-center text-sm text-ink-400">
            {label}
          </span>
        </>
      ) : null}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', minHeight: '96px', width: '100%' }}
        data-ad-client={clientId}
        data-ad-slot={adSlot}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}

function ensureAdSenseScript(clientId: string) {
  const scriptId = 'adsense-script';

  if (document.getElementById(scriptId)) {
    return;
  }

  const script = document.createElement('script');
  script.id = scriptId;
  script.async = true;
  script.crossOrigin = 'anonymous';
  script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(clientId)}`;
  document.head.appendChild(script);
}

function AdLabel() {
  return (
    <span className="absolute left-3 top-2 rounded border border-ink-100 bg-white/80 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-normal text-ink-400">
      Reklam
    </span>
  );
}
