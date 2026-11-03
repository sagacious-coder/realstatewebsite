import { FIXTURE_EXCHANGE_RATES } from '@wild-hills/contracts/fixtures';
import type { ExchangeRates, CurrencyCode } from '@wild-hills/contracts';
import { ratesRepository } from '../repositories/rates.repository.js';

export class RatesService {
  async getExchangeRates(): Promise<ExchangeRates> {
    const row = await ratesRepository.getRates();
    if (row && row.rates) {
      return {
        base: 'USD',
        rates: row.rates as Record<CurrencyCode, number>,
        timestamp: row.updatedAt ? row.updatedAt.toISOString() : new Date().toISOString(),
      };
    }

    return {
      base: 'USD',
      rates: FIXTURE_EXCHANGE_RATES.rates,
      timestamp: FIXTURE_EXCHANGE_RATES.timestamp,
    };
  }
}

export const ratesService = new RatesService();
