import type { CalculationResult, CalculatorState, MarketCatalog, SpotMarket } from '../types';

const API_BASE_URL = resolveApiBaseUrl(import.meta.env.VITE_API_BASE_URL);

export async function fetchSeries(): Promise<MarketCatalog> {
  const response = await fetch(apiUrl('/series'));
  if (!response.ok) {
    throw new Error('Veri listesi yüklenemedi.');
  }

  return response.json() as Promise<MarketCatalog>;
}

export async function fetchSpotMarket(): Promise<SpotMarket> {
  const response = await fetch(apiUrl('/spot'));
  if (!response.ok) {
    throw new Error('Güncel piyasa verileri yüklenemedi.');
  }

  return response.json() as Promise<SpotMarket>;
}

export async function calculateOnBackend(state: CalculatorState): Promise<CalculationResult[]> {
  const response = await fetch(apiUrl('/calculate'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(state),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? 'Hesaplama yapılamadı.');
  }

  const payload = (await response.json()) as { results: CalculationResult[] };
  return payload.results;
}

function apiUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

function resolveApiBaseUrl(configuredBaseUrl?: string): string {
  if (typeof window !== 'undefined' && window.location.hostname.replace(/^www\./, '') === 'nekadarederdi.com') {
    return '/api';
  }

  if (!configuredBaseUrl) {
    return '/api';
  }

  try {
    const configured = new URL(configuredBaseUrl, window.location.origin);
    const currentHost = window.location.hostname.replace(/^www\./, '');
    const configuredHost = configured.hostname.replace(/^www\./, '');

    if (configuredHost === currentHost) {
      return configured.pathname.replace(/\/$/, '') || '/api';
    }
  } catch {
    return configuredBaseUrl.replace(/\/$/, '');
  }

  return configuredBaseUrl.replace(/\/$/, '');
}
