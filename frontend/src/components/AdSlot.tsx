import { useEffect } from 'react';

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
  results: import.meta.env.VITE_ADSENSE_RESULTS_SLOT ?? import.meta.env.VITE_ADSENSE_TOP_SLOT,
};

export function AdSlot({ label, placement }: AdSlotProps) {
  const clientId = ADSENSE_CLIENT;
  const adSlot = AD_SLOTS[placement];
  const isConfigured = Boolean(clientId && adSlot);

  useEffect(() => {
    if (!clientId || !adSlot) {
      return;
    }

    ensureAdSenseScript(clientId);

    try {
      window.adsbygoogle = window.adsbygoogle ?? [];
      window.adsbygoogle.push({});
    } catch {
      // Ad blockers and pending AdSense approval can throw here; the reserved slot stays in place.
    }
  }, [clientId, adSlot]);

  if (!isConfigured) {
    return (
      <div className="flex min-h-24 items-center justify-center rounded-md border border-dashed border-ink-200 bg-white/70 px-4 text-center text-sm text-ink-500">
        {label}
      </div>
    );
  }

  return (
    <div className="min-h-24 rounded-md border border-dashed border-ink-100 bg-white/70 px-2 py-3">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
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
