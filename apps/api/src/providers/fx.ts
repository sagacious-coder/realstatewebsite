export interface FxRates {
  base: string;
  date: string;
  rates: Record<string, number>;
}

export interface FxProvider {
  getRates(base?: string): Promise<FxRates>;
}

/**
 * Fixture FX Adapter providing stable, deterministic currency conversion rates
 * across supported currencies: USD, AED, EUR, TRY, GEL, EGP.
 */
export class FixtureFxAdapter implements FxProvider {
  // Baseline USD exchange rates
  private baselineRates: Record<string, number> = {
    USD: 1.0,
    AED: 3.6725,
    EUR: 0.9245,
    TRY: 34.25,
    GEL: 2.72,
    EGP: 48.65,
    GBP: 0.792,
  };

  async getRates(base = 'USD'): Promise<FxRates> {
    const baseMultiplier = this.baselineRates[base] || 1.0;
    const rates: Record<string, number> = {};

    for (const [curr, rate] of Object.entries(this.baselineRates)) {
      rates[curr] = Number((rate / baseMultiplier).toFixed(6));
    }

    return {
      base,
      date: new Date().toISOString().split('T')[0] ?? '2026-11-01',
      rates,
    };
  }
}
