'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { CreditCard, FileText, CheckCircle2, Calendar, ArrowRight } from 'lucide-react';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import { cn } from '@/lib/utils';
import type { PaymentPlan, CurrencyCode } from '@wild-hills/contracts';

export interface PropertyPaymentPlanProps {
  paymentPlan?: PaymentPlan | null;
  priceMinor: number;
  originalCurrency: string;
  onRequestSchedule?: () => void;
  className?: string;
}

export function PropertyPaymentPlan({
  paymentPlan,
  priceMinor,
  originalCurrency,
  onRequestSchedule,
  className,
}: PropertyPaymentPlanProps) {
  const t = useTranslations('property.paymentPlan');
  const locale = useLocale();
  const { formatPrice } = useCurrency();

  if (!paymentPlan) return null;

  // Defaults if breakdown is simplified
  const downPaymentPercent = paymentPlan.downPaymentPercent || 20;
  const milestones = paymentPlan.milestoneBreakdown && paymentPlan.milestoneBreakdown.length > 0
    ? paymentPlan.milestoneBreakdown
    : [
        { milestone: t('downPayment'), percent: downPaymentPercent },
        { milestone: t('duringConstruction'), percent: 50 },
        { milestone: t('onHandover'), percent: 30 },
      ];

  return (
    <section
      aria-labelledby="payment-plan-heading"
      className={cn('rounded-card border border-line bg-white p-6 shadow-subtle text-start', className)}
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4 mb-6">
        <div>
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4 text-gold-deep" strokeWidth={1.5} />
            <h2 id="payment-plan-heading" className="font-serif text-xl font-semibold text-navy">
              {t('title')}
            </h2>
          </div>
          <p className="text-xs text-muted mt-1">{t('subtitle')}</p>
        </div>

        {onRequestSchedule && (
          <button
            type="button"
            onClick={onRequestSchedule}
            className="inline-flex items-center gap-1.5 rounded-[4px] border border-line bg-ivory px-3 py-1.5 text-xs font-semibold text-navy hover:border-gold hover:bg-white transition-all self-start sm:self-auto focus-visible:outline-2 focus-visible:outline-gold"
          >
            <FileText className="h-3.5 w-3.5 text-gold-deep" />
            <span>{t('inquireSchedule')}</span>
          </button>
        )}
      </div>

      {/* Progress bar visualizer */}
      <div className="mb-6">
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-mist">
          {milestones.map((m, i) => {
            const colors = ['bg-gold-deep', 'bg-gold', 'bg-emerald', 'bg-navy'];
            const color = colors[i % colors.length];
            return (
              <div
                key={m.milestone}
                style={{ width: `${m.percent}%` }}
                className={cn('h-full transition-all duration-500', color)}
                title={`${m.milestone}: ${m.percent}%`}
              />
            );
          })}
        </div>
      </div>

      {/* Milestones Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {milestones.map((item, idx) => {
          const milestoneMinor = Math.round((priceMinor * item.percent) / 100);
          const milestoneAmount = formatPrice(milestoneMinor, originalCurrency as any);

          return (
            <div
              key={item.milestone}
              className="rounded-[4px] border border-line bg-ivory/60 p-4 relative"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-muted uppercase tracking-wider">
                  {idx + 1}. {item.milestone}
                </span>
                <span className="inline-flex items-center rounded-full bg-gold/20 px-2 py-0.5 text-xs font-bold text-gold-deep">
                  {item.percent}%
                </span>
              </div>

              <div className="font-serif text-lg font-bold text-navy">
                <bdi>{milestoneAmount}</bdi>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

