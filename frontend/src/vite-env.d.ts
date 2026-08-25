/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_ADSENSE_CLIENT?: string;
  readonly VITE_ADSENSE_TOP_SLOT?: string;
  readonly VITE_ADSENSE_SQUARE_SLOT?: string;
  readonly VITE_ADSENSE_RESULTS_SLOT?: string;
  readonly VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
