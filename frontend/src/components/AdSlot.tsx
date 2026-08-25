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
  const wrapperClassName = `ad-slot ad-slot--${placement}`;
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
      <div className={wrapperClassName}>
        <AdLabel />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div className={wrapperClassName}>
      {adStatus !== 'filled' ? (
        <>
          <AdLabel />
          <span className="ad-slot__text">
            {label}
          </span>
        </>
      ) : null}
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block', minHeight: placement === 'top' ? '80px' : '96px', width: '100%' }}
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
  return <span className="ad-slot__label">Reklam</span>;
}
