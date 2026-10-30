'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CurrencyCode, PropertyType, PropertyStatus } from '@wild-hills/contracts';
import type { SearchFilterState, ActiveFilterChip } from './types';

export interface ActiveFilterChipsProps {
  filters: SearchFilterState;
  currency: CurrencyCode;
  onRemoveChip: (chip: ActiveFilterChip) => void;
  onClearAll: () => void;
  className?: string;
}

export function ActiveFilterChips({
  filters,
  currency,
  onRemoveChip,
  onClearAll,
  className,
}: ActiveFilterChipsProps) {
  const t = useTranslations('search');
  const locale = useLocale();

  const chips: ActiveFilterChip[] = React.useMemo(() => {
    const formatNum = (num: number) => new Intl.NumberFormat(locale).format(num);
    const list: ActiveFilterChip[] = [];

    // Search query
    if (filters.q) {
      list.push({
        id: 'q',
        key: 'q',
        label: `"${filters.q}"`,
      });
    }

    // City
    if (filters.city) {
      list.push({
        id: 'city',
        key: 'city',
        label: filters.city,
      });
    }

    // Area
    if (filters.area) {
      list.push({
        id: 'area',
        key: 'area',
        label: filters.area,
      });
    }

    // Property Types
    if (filters.type && filters.type.length > 0) {
      filters.type.forEach((tp) => {
        list.push({
          id: `type-${tp}`,
          key: 'type',
          label: t(`types.${tp}`),
          value: tp,
        });
      });
    }

    // Price range
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      let priceLabel = '';
      if (filters.minPrice !== undefined && filters.maxPrice !== undefined) {
        priceLabel = `${formatNum(filters.minPrice)} – ${formatNum(filters.maxPrice)} ${currency}`;
      } else if (filters.minPrice !== undefined) {
        priceLabel = `≥ ${formatNum(filters.minPrice)} ${currency}`;
      } else if (filters.maxPrice !== undefined) {
        priceLabel = `≤ ${formatNum(filters.maxPrice)} ${currency}`;
      }
      list.push({
        id: 'price',
        key: 'minPrice', // indicates price bounds
        label: priceLabel,
      });
    }

    // Bedrooms
    if (filters.beds && filters.beds !== 'all') {
      const bedsLabel =
        filters.beds === 'studio'
          ? t('studio')
          : `${filters.beds} ${t('bedrooms')}`;
      list.push({
        id: 'beds',
        key: 'beds',
        label: bedsLabel,
      });
    }

    // Bathrooms
    if (filters.baths && filters.baths > 0) {
      list.push({
        id: 'baths',
        key: 'baths',
        label: `${filters.baths}+ ${t('bathrooms')}`,
      });
    }

    // Size range
    if (filters.minSize !== undefined || filters.maxSize !== undefined) {
      const unit = t(filters.sizeUnit === 'sqft' ? 'sqft' : 'sqm');
      let sizeLabel = '';
      if (filters.minSize !== undefined && filters.maxSize !== undefined) {
        sizeLabel = `${formatNum(filters.minSize)} – ${formatNum(filters.maxSize)} ${unit}`;
      } else if (filters.minSize !== undefined) {
        sizeLabel = `≥ ${formatNum(filters.minSize)} ${unit}`;
      } else if (filters.maxSize !== undefined) {
        sizeLabel = `≤ ${formatNum(filters.maxSize)} ${unit}`;
      }
      list.push({
        id: 'size',
        key: 'minSize',
        label: sizeLabel,
      });
    }

    // Status
    if (filters.status && filters.status.length > 0) {
      filters.status.forEach((st) => {
        const statusLabel =
          st === 'ready'
            ? t('ready')
            : st === 'off_plan'
              ? t('offPlan')
              : t('underConstruction');
        list.push({
          id: `status-${st}`,
          key: 'status',
          label: statusLabel,
          value: st,
        });
      });
    }

    // Feature flags
    if (filters.isHotDeal) {
      list.push({ id: 'isHotDeal', key: 'isHotDeal', label: t('hotDeal') });
    }
    if (filters.isNewLaunch) {
      list.push({ id: 'isNewLaunch', key: 'isNewLaunch', label: t('newLaunch') });
    }
    if (filters.isVerified) {
      list.push({ id: 'isVerified', key: 'isVerified', label: t('verified') });
    }
    if (filters.hasInstallments) {
      list.push({ id: 'hasInstallments', key: 'hasInstallments', label: t('hasInstallments') });
    }

    return list;
  }, [filters, currency, t, locale]);

  if (chips.length === 0) return null;

  return (
    <div
      className={cn('flex flex-wrap items-center gap-2 pt-1 pb-3 text-start', className)}
      role="region"
      aria-label={t('activeFilters')}
    >
      <span className="text-xs font-semibold text-muted uppercase tracking-wider me-1">
        {t('activeFilters')}:
      </span>

      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-1.5 rounded-[4px] border border-line bg-white py-1 ps-2.5 pe-1.5 text-xs font-medium text-navy shadow-xs transition-colors hover:border-gold/60"
        >
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={() => onRemoveChip(chip)}
            aria-label={`Remove filter: ${chip.label}`}
            className="flex h-4 w-4 items-center justify-center rounded-[2px] text-muted hover:bg-mist hover:text-navy transition-colors focus-visible:outline-2 focus-visible:outline-gold"
          >
            <X className="h-3 w-3" strokeWidth={1.5} />
          </button>
        </span>
      ))}

      {chips.length > 0 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-medium text-gold-deep underline decoration-gold/60 underline-offset-2 hover:text-navy ms-2 focus-visible:outline-2 focus-visible:outline-gold rounded-[2px]"
        >
          {t('clearAll')}
        </button>
      )}
    </div>
  );
}
