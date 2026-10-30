'use client';

import React, { useState, useMemo } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { Calculator, ArrowRight, CheckCircle2, Calendar, DollarSign } from 'lucide-react';
import type { CountryCode } from '@/lib/data';
import { COUNTRY_DEFAULT_CURRENCY } from '@/lib/countries';

export interface PaymentPlanCalculatorSectionProps {
  countryCode: CountryCode;
  countryName: string;
}

export function PaymentPlanCalculatorSection({
  countryCode,
  countryName,
}: PaymentPlanCalculatorSectionProps) {
  const t = useTranslations('countryHome.calculator');
  const locale = useLocale();
  const { formatPrice, currency: activeCurrency } = useCurrency();

  const nativeCurrency = COUNTRY_DEFAULT_CURRENCY[countryCode] || 'USD';

  // Default values based on typical market prices
  const defaultPrices: Record<CountryCode, number> = {
    ae: 2000000, // 2,000,000 AED
    tr: 12000000, // 12,000,000 TRY (~$350k)
    ge: 300000, // 300,000 GEL (~$110k)
    eg: 8000000, // 8,000,000 EGP (~$160k)
  };

  const [price, setPrice] = useState<number>(defaultPrices[countryCode] || 1500000);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [constructionPercent, setConstructionPercent] = useState<number>(60);
  const [durationMonths, setDurationMonths] = useState<number>(36);
  const [inquirySent, setInquirySent] = useState<boolean>(false);

  // Derived handover percentage (100% - downPayment - construction)
  const handoverPercent = useMemo(
    () => Math.max(0, 100 - downPaymentPercent - constructionPercent),
    [downPaymentPercent, constructionPercent]
  );

  // Monetary calculations in native currency
  const downPaymentAmount = useMemo(() => (price * downPaymentPercent) / 100, [price, downPaymentPercent]);
  const constructionTotal = useMemo(() => (price * constructionPercent) / 100, [price, constructionPercent]);
  const monthlyInstallment = useMemo(
    () => (durationMonths > 0 ? constructionTotal / durationMonths : 0),
    [constructionTotal, durationMonths]
  );
  const handoverAmount = useMemo(() => (price * handoverPercent) / 100, [price, handoverPercent]);

  // Formatted in active currency via minor units conversion
  const formattedPrice = formatPrice(price * 100, nativeCurrency);
  const formattedDownPayment = formatPrice(downPaymentAmount * 100, nativeCurrency);
  const formattedMonthly = formatPrice(Math.round(monthlyInstallment * 100), nativeCurrency);
  const formattedHandover = formatPrice(handoverAmount * 100, nativeCurrency);

  return (
    <section
      id="payment-plan-calculator"
      className="bg-white py-16 md:py-24 border-b border-line"
      aria-labelledby="calculator-heading"
    >
      <div className="container mx-auto px-4 sm:px-6">
        <SectionHeading
          kicker={t('kicker')}
          title={t('title')}
          subtitle={t('subtitle')}
          align="start"
        />

        <div className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-12 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-7 space-y-6 rounded-[6px] border border-line bg-ivory/30 p-6 sm:p-8">
            {/* Property Price Input & Slider */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="calc-price-input" className="text-sm font-semibold text-navy">
                  {t('propertyPrice')} ({nativeCurrency})
                </label>
                <span className="text-base font-bold font-serif text-gold-deep">
                  {formattedPrice}
                </span>
              </div>
              <input
                id="calc-price-input"
                type="range"
                min={defaultPrices[countryCode] * 0.3}
                max={defaultPrices[countryCode] * 4}
                step={defaultPrices[countryCode] * 0.05}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full accent-gold h-2 bg-line rounded-lg cursor-pointer"
                aria-label={t('propertyPrice')}
              />
              <div className="mt-2 flex justify-between text-xs text-muted">
                <span>{(defaultPrices[countryCode] * 0.3).toLocaleString(locale)} {nativeCurrency}</span>
                <span>{(defaultPrices[countryCode] * 4).toLocaleString(locale)} {nativeCurrency}</span>
              </div>
            </div>

            {/* Down Payment % Selector */}
            <div>
              <label className="text-sm font-semibold text-navy block mb-2">
                {t('downPayment')}: <span className="text-gold-deep font-bold">{downPaymentPercent}%</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[10, 15, 20, 30].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      setDownPaymentPercent(pct);
                      if (pct + constructionPercent > 90) {
                        setConstructionPercent(90 - pct);
                      }
                    }}
                    className={`rounded-[4px] border py-2 text-xs font-semibold transition-all ${
                      downPaymentPercent === pct
                        ? 'border-gold bg-navy text-ivory'
                        : 'border-line bg-white text-navy hover:border-gold/60'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            {/* Construction Installment % and Duration */}
            <div>
              <label className="text-sm font-semibold text-navy block mb-2">
                {t('constructionInstallments')}: <span className="text-gold-deep font-bold">{constructionPercent}%</span>
              </label>
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[40, 50, 60, 70].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      setConstructionPercent(pct);
                      if (pct + downPaymentPercent > 90) {
                        setDownPaymentPercent(90 - pct);
                      }
                    }}
                    className={`rounded-[4px] border py-2 text-xs font-semibold transition-all ${
                      constructionPercent === pct
                        ? 'border-gold bg-navy text-ivory'
                        : 'border-line bg-white text-navy hover:border-gold/60'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}
              </div>

              {/* Installment Tenure Duration (Months) */}
              <label className="text-xs font-semibold text-muted block mb-1.5 uppercase tracking-wider">
                {t('duration')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[24, 36, 48].map((months) => (
                  <button
                    key={months}
                    type="button"
                    onClick={() => setDurationMonths(months)}
                    className={`rounded-[4px] border py-2 text-xs font-semibold transition-all ${
                      durationMonths === months
                        ? 'border-gold bg-navy text-ivory'
                        : 'border-line bg-white text-navy hover:border-gold/60'
                    }`}
                  >
                    {months} {t('months')}
                  </button>
                ))}
              </div>
            </div>

            {/* Handover Balance Display */}
            <div className="pt-2 border-t border-line/60 flex items-center justify-between text-xs text-muted">
              <span>{t('handover')}</span>
              <span className="font-semibold text-navy">{handoverPercent}%</span>
            </div>
          </div>

          {/* Breakdown & Calculation Result Card */}
          <div className="lg:col-span-5 rounded-[6px] border border-line bg-white p-6 sm:p-8 shadow-sm">
            <div className="mb-6 flex items-center gap-2 pb-4 border-b border-line">
              <Calculator className="h-5 w-5 text-gold-deep" />
              <h3 className="font-serif text-lg font-semibold text-navy">
                Payment Schedule Summary
              </h3>
            </div>

            {/* Milestones */}
            <div className="space-y-4">
              {/* Down Payment */}
              <div className="rounded-[4px] bg-ivory/50 p-4 border border-line/50">
                <div className="text-xs font-medium text-muted uppercase tracking-wider">
                  {t('downPaymentAmount')} ({downPaymentPercent}%)
                </div>
                <div className="mt-1 text-2xl font-bold font-serif text-navy">
                  {formattedDownPayment}
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {(downPaymentAmount).toLocaleString(locale)} {nativeCurrency}
                </div>
              </div>

              {/* Monthly Installment */}
              <div className="rounded-[4px] bg-mist/40 p-4 border border-emerald/20">
                <div className="text-xs font-medium text-emerald uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" />
                  {t('monthlyAmount')} ({durationMonths} {t('months')})
                </div>
                <div className="mt-1 text-2xl font-bold font-serif text-emerald-deep">
                  {formattedMonthly}
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {Math.round(monthlyInstallment).toLocaleString(locale)} {nativeCurrency} / month
                </div>
              </div>

              {/* Handover Amount */}
              <div className="rounded-[4px] bg-ivory/50 p-4 border border-line/50">
                <div className="text-xs font-medium text-muted uppercase tracking-wider">
                  {t('handoverAmount')} ({handoverPercent}%)
                </div>
                <div className="mt-1 text-xl font-bold font-serif text-navy">
                  {formattedHandover}
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {(handoverAmount).toLocaleString(locale)} {nativeCurrency}
                </div>
              </div>
            </div>

            {/* Request Schedule Action */}
            <div className="mt-8 pt-6 border-t border-line">
              {inquirySent ? (
                <div className="flex items-center gap-2 text-sm font-medium text-emerald">
                  <CheckCircle2 className="h-5 w-5" />
                  Official payment schedule request registered. Our advisors will contact you shortly.
                </div>
              ) : (
                <Button
                  variant="primary"
                  size="md"
                  onClick={() => setInquirySent(true)}
                  className="w-full flex items-center justify-center gap-2 font-medium"
                >
                  {t('inquire')}
                  <ArrowRight className="h-4 w-4 rtl:rotate-180" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
