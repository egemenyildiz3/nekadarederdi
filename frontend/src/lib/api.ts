import type { CalculationResult, CalculatorState, MarketCatalog } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

export async function fetchSeries(): Promise<MarketCatalog> {
  const response = await fetch(`${API_BASE_URL}/series`);
  if (!response.ok) {
    throw new Error('Veri listesi yüklenemedi.');
  }

  return response.json() as Promise<MarketCatalog>;
}

export async function calculateOnBackend(state: CalculatorState): Promise<CalculationResult[]> {
  const response = await fetch(`${API_BASE_URL}/calculate`, {
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
