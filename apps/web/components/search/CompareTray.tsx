'use client';

import React, { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { X, ArrowRightLeft, ExternalLink, Bed, Bath, Square, Layers, Calendar, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '@/components/ui/Modal';
import { SiteImage } from '@/components/SiteImage';
import { cn } from '@/lib/utils';
import type { ListingSummary, CurrencyCode } from '@wild-hills/contracts';

export interface CompareTrayProps {
  items: ListingSummary[];
  onRemoveItem: (id: string) => void;
  onClearAll: () => void;
  currency: CurrencyCode;
  formatPrice: (amountMinor: number, from: CurrencyCode) => string;
  className?: string;
}

export function CompareTray({
  items,
  onRemoveItem,
  onClearAll,
  currency,
  formatPrice,
  className,
}: CompareTrayProps) {
  const t = useTranslations('search.compare');
  const locale = useLocale();
  const [modalOpen, setModalOpen] = useState(false);

  if (!items || items.length === 0) return null;

  return (
    <>
      {/* Floating Bottom Compare Tray */}
      <div
        className={cn(
          'fixed bottom-4 inset-x-4 sm:inset-x-auto sm:end-8 z-40 max-w-xl',
          'flex items-center gap-3 rounded-card border border-gold/40 bg-navy/95 backdrop-blur-md p-3 text-ivory shadow-lg',
          'animate-in fade-in slide-in-from-bottom-4 duration-300',
          className
        )}
        role="region"
        aria-label={t('trayLabel', { count: items.length })}
      >
        {/* Thumbnails row */}
        <div className="flex items-center gap-2 overflow-x-auto py-0.5">
          {items.map((item) => (
            <div
              key={item.id}
              className="group relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-[4px] border border-white/20 bg-navy-2"
            >
              <SiteImage
                src={item.coverImage}
                alt={item.title}
                fill
                className="object-cover"
                sizes="48px"
              />
              <button
                type="button"
                onClick={() => onRemoveItem(item.id)}
                aria-label={`${t('remove')} ${item.title}`}
                className="absolute inset-0 flex items-center justify-center bg-navy/80 text-ivory opacity-0 group-hover:opacity-100 transition-opacity focus-visible:opacity-100"
              >
                <X className="h-4 w-4 text-ivory" strokeWidth={2} />
              </button>
            </div>
          ))}
        </div>

        {/* Tray Text & Action */}
        <div className="flex items-center gap-2 ms-auto">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold whitespace-nowrap"
          >
            <ArrowRightLeft className="h-3.5 w-3.5" strokeWidth={1.5} />
            <span>{t('compareNow')} ({items.length}/4)</span>
          </Button>

          <button
            type="button"
            onClick={onClearAll}
            aria-label={t('clear')}
            className="flex h-8 w-8 items-center justify-center rounded-[4px] text-ivory/70 hover:bg-white/10 hover:text-ivory transition-colors"
          >
            <X className="h-4 w-4" strokeWidth={1.5} />
          </button>
        </div>
      </div>

      {/* Side-by-Side Comparison Modal */}
      <Modal open={modalOpen} onOpenChange={setModalOpen}>
        <ModalContent className="max-w-4xl p-6 bg-white rounded-card max-h-[90vh] overflow-y-auto">
          <ModalHeader className="text-start pb-4 border-b border-line">
            <ModalTitle className="font-serif text-xl sm:text-2xl font-semibold text-navy flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-gold-deep" strokeWidth={1.5} />
              <span>{t('title')}</span>
            </ModalTitle>
            <ModalDescription className="text-xs text-muted mt-1">
              {t('subtitle')} ({items.length} properties selected)
            </ModalDescription>
          </ModalHeader>

          {/* Comparison Table */}
          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-start border-collapse text-xs sm:text-sm">
              <tbody>
                {/* 1. Header / Media Row */}
                <tr className="border-b border-line">
                  <td className="p-3 font-semibold text-muted bg-ivory/50 w-36 sm:w-44">
                    Property
                  </td>
                  {items.map((item) => (
                    <td key={item.id} className="p-3 min-w-[200px] align-top">
                      <div className="relative aspect-[16/10] w-full overflow-hidden rounded-[4px] bg-navy-2 mb-2">
                        <SiteImage
                          src={item.coverImage}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="200px"
                        />
                      </div>
                      <h4 className="font-serif text-sm font-semibold text-navy line-clamp-2">
                        {item.title}
                      </h4>
                      <p className="text-[11px] font-mono text-muted mt-0.5">
                        <bdi>{item.refNumber}</bdi>
                      </p>
                      <button
                        type="button"
                        onClick={() => onRemoveItem(item.id)}
                        className="mt-1 text-[11px] text-red-600 hover:underline"
                      >
                        {t('remove')}
                      </button>
                    </td>
                  ))}
                </tr>

                {/* 2. Price Row */}
                <tr className="border-b border-line">
                  <td className="p-3 font-semibold text-muted bg-ivory/50">
                    {t('price')}
                  </td>
                  {items.map((item) => (
                    <td key={item.id} className="p-3 font-serif font-bold text-navy text-base">
                      <bdi>{formatPrice(item.priceMinor, item.currency)}</bdi>
                      {item.currency !== currency && (
                        <span className="block text-[11px] font-sans font-normal text-muted mt-0.5">
                          <bdi>
                            {new Intl.NumberFormat(locale).format(item.priceMinor / 100)} {item.currency}
                          </bdi>
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* 3. Location Row */}
                <tr className="border-b border-line">
                  <td className="p-3 font-semibold text-muted bg-ivory/50">
                    {t('location')}
                  </td>
                  {items.map((item) => (
                    <td key={item.id} className="p-3 text-navy font-medium">
                      {item.location.area ? `${item.location.area}, ` : ''}
                      {item.location.city}
                    </td>
                  ))}
                </tr>

                {/* 4. Property Type */}
                <tr className="border-b border-line">
                  <td className="p-3 font-semibold text-muted bg-ivory/50">
                    {t('type')}
                  </td>
                  {items.map((item) => (
                    <td key={item.id} className="p-3 text-navy capitalize">
                      {item.propertyType}
                    </td>
                  ))}
                </tr>

                {/* 5. Bedrooms & Bathrooms */}
                <tr className="border-b border-line">
                  <td className="p-3 font-semibold text-muted bg-ivory/50">
                    {t('bedrooms')} / {t('bathrooms')}
                  </td>
                  {items.map((item) => (
                    <td key={item.id} className="p-3 text-navy font-medium">
                      {item.bedrooms === 0 ? 'Studio' : `${item.bedrooms} Beds`} · {item.bathrooms} Baths
                    </td>
                  ))}
                </tr>

                {/* 6. Built-up Area */}
                <tr className="border-b border-line">
                  <td className="p-3 font-semibold text-muted bg-ivory/50">
                    {t('size')}
                  </td>
                  {items.map((item) => (
                    <td key={item.id} className="p-3 text-navy">
                      <bdi>{new Intl.NumberFormat(locale).format(item.sizeSqm)} sqm</bdi>
                      <span className="text-muted text-xs block">
                        (<bdi>{new Intl.NumberFormat(locale).format(Math.round(item.sizeSqm * 10.7639))} sq ft</bdi>)
                      </span>
                    </td>
                  ))}
                </tr>

                {/* 7. Status & Completion */}
                <tr className="border-b border-line">
                  <td className="p-3 font-semibold text-muted bg-ivory/50">
                    {t('status')}
                  </td>
                  {items.map((item) => (
                    <td key={item.id} className="p-3 text-navy capitalize">
                      {item.status.replace('_', ' ')}
                      {item.completionYear && (
                        <span className="text-muted block text-xs">
                          {t('completion')}: {item.completionYear}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>

                {/* 8. Developer */}
                <tr className="border-b border-line">
                  <td className="p-3 font-semibold text-muted bg-ivory/50">
                    {t('developer')}
                  </td>
                  {items.map((item) => (
                    <td key={item.id} className="p-3 text-navy">
                      {item.developer?.name || '—'}
                    </td>
                  ))}
                </tr>

                {/* 9. Payment Plan */}
                <tr className="border-b border-line">
                  <td className="p-3 font-semibold text-muted bg-ivory/50">
                    {t('paymentPlan')}
                  </td>
                  {items.map((item) => {
                    const plan = (item as unknown as { paymentPlan?: { downPaymentPercent: number; constructionPercent: number; handoverPercent: number } }).paymentPlan;
                    return (
                      <td key={item.id} className="p-3">
                        {plan ? (
                          <span className="inline-flex items-center gap-1 text-emerald-deep font-medium">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald" />
                            <span>
                              {plan.downPaymentPercent}% / {plan.constructionPercent}% / {plan.handoverPercent}%
                            </span>
                          </span>
                        ) : (
                          <span className="text-muted">—</span>
                        )}
                      </td>
                    );
                  })}
                </tr>

                {/* 10. Action Row */}
                <tr>
                  <td className="p-3 bg-ivory/50" />
                  {items.map((item) => (
                    <td key={item.id} className="p-3">
                      <a
                        href={`/${locale}/${item.location.countryCode}/property/${item.refNumber.toLowerCase()}-${item.slug}`}
                        className="inline-flex items-center gap-1.5 rounded-[4px] bg-navy px-3 py-1.5 text-xs font-semibold text-ivory hover:bg-navy-2 transition-colors"
                      >
                        <span>{t('viewProperty')}</span>
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </ModalContent>
      </Modal>
    </>
  );
}
