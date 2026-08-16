const CLOUDFLARE_WEB_ANALYTICS_TOKEN = import.meta.env.VITE_CLOUDFLARE_WEB_ANALYTICS_TOKEN;

export function installCloudflareWebAnalytics() {
  if (!CLOUDFLARE_WEB_ANALYTICS_TOKEN || isLocalhost()) {
    return;
  }

  const scriptId = 'cloudflare-web-analytics';

  if (document.getElementById(scriptId)) {
    return;
  }

  const script = document.createElement('script');
  script.id = scriptId;
  script.defer = true;
  script.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  script.dataset.cfBeacon = JSON.stringify({
    token: CLOUDFLARE_WEB_ANALYTICS_TOKEN,
  });
  document.body.appendChild(script);
}

function isLocalhost() {
  return ['localhost', '127.0.0.1', '0.0.0.0'].includes(window.location.hostname);
}
