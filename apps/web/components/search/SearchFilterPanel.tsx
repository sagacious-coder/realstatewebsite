'use client';

import React from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { RotateCcw, Filter, MapPin, Building2, DollarSign, Bed, Bath, Maximize2, Layers } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Slider } from '@/components/ui/Slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { cn } from '@/lib/utils';
import type { CountryCode, CurrencyCode, Location, PropertyType, PropertyStatus, UnitSizeUnit } from '@wild-hills/contracts';
import type { SearchFilterState } from './types';

export interface SearchFilterPanelProps {
  countryCode: CountryCode;
  locations: Location[];
  currency: CurrencyCode;
  filters: SearchFilterState;
  onFilterChange: (updates: Partial<SearchFilterState>) => void;
  onResetAll: () => void;
  totalCount?: number;
  className?: string;
  isMobileModal?: boolean;
}

const PROPERTY_TYPE_KEYS: PropertyType[] = [
  'apartment',
  'villa',
  'townhouse',
  'penthouse',
  'duplex',
  'studio',
  'chalet',
];

const BED_OPTIONS = ['all', 'studio', '1', '2', '3', '4', '5+'] as const;
const BATH_OPTIONS = [0, 1, 2, 3, 4] as const;

export function SearchFilterPanel({
  countryCode,
  locations,
  currency,
  filters,
  onFilterChange,
  onResetAll,
  totalCount,
  className,
  isMobileModal = false,
}: SearchFilterPanelProps) {
  const t = useTranslations('search');
  const locale = useLocale();

  // Filter locations to cities in this country
  const cities = React.useMemo(() => {
    return locations.filter(
      (loc) => loc.countryCode === countryCode && (loc.type === 'city' || !loc.type)
    );
  }, [locations, countryCode]);

  // Distinct areas in the selected city (if any)
  const areas = React.useMemo(() => {
    if (!filters.city) return [];
    const selectedCityLoc = cities.find(
      (c) => c.name.toLowerCase() === filters.city?.toLowerCase()
    );
    return locations.filter(
      (loc) =>
        loc.countryCode === countryCode &&
        loc.type === 'area' &&
        (!selectedCityLoc || loc.parentId === selectedCityLoc.id)
    );
  }, [locations, countryCode, filters.city, cities]);

  // Compute active filters count
  const activeCount = React.useMemo(() => {
    let count = 0;
    if (filters.q) count++;
    if (filters.city) count++;
    if (filters.area) count++;
    if (filters.type && filters.type.length > 0) count += filters.type.length;
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) count++;
    if (filters.beds && filters.beds !== 'all') count++;
    if (filters.baths && filters.baths > 0) count++;
    if (filters.minSize !== undefined || filters.maxSize !== undefined) count++;
    if (filters.status && filters.status.length > 0) count += filters.status.length;
    if (filters.isHotDeal) count++;
    if (filters.isNewLaunch) count++;
    if (filters.isVerified) count++;
    if (filters.hasInstallments) count++;
    return count;
  }, [filters]);

  const handleTypeToggle = (typeKey: PropertyType) => {
    const current = filters.type || [];
    const exists = current.includes(typeKey);
    const next = exists ? current.filter((t) => t !== typeKey) : [...current, typeKey];
    onFilterChange({ type: next.length > 0 ? next : undefined });
  };

  const handleStatusToggle = (statusKey: PropertyStatus) => {
    const current = filters.status || [];
    const exists = current.includes(statusKey);
    const next = exists ? current.filter((s) => s !== statusKey) : [...current, statusKey];
    onFilterChange({ status: next.length > 0 ? next : undefined });
  };

  const currentSizeUnit: UnitSizeUnit = filters.sizeUnit || 'sqm';

  // Format currency numbers cleanly
  const formatNum = (val: number) => new Intl.NumberFormat(locale).format(val);

  return (
    <aside
      className={cn(
        'w-full rounded-card border border-line bg-white p-5 shadow-subtle',
        !isMobileModal && 'sticky top-24 max-h-[calc(100vh-7rem)] overflow-y-auto',
        className
      )}
      aria-label={t('filters')}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-line pb-4 mb-5">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gold-deep" strokeWidth={1.5} aria-hidden="true" />
          <h2 className="font-serif text-lg font-semibold text-navy">{t('filters')}</h2>
          {activeCount > 0 && (
            <span className="flex h-5 items-center justify-center rounded-full bg-gold/20 px-2 text-xs font-semibold text-gold-deep">
              {activeCount}
            </span>
          )}
        </div>

        {activeCount > 0 && (
          <button
            type="button"
            onClick={onResetAll}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted hover:text-navy transition-colors focus-visible:outline-2 focus-visible:outline-gold rounded-[2px]"
          >
            <RotateCcw className="h-3 w-3" strokeWidth={1.5} aria-hidden="true" />
            <span>{t('resetFilters')}</span>
          </button>
        )}
      </div>

      <div className="space-y-6">
        {/* 1. Location (City & Area) */}
        <div>
          <label className="mb-2 block text-xs font-semibold tracking-wider text-muted uppercase">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-gold-deep" strokeWidth={1.5} />
              {t('location')}
            </span>
          </label>
          <div className="space-y-2.5">
            {/* City Selector */}
            <Select
              value={filters.city || 'all'}
              onValueChange={(val) =>
                onFilterChange({
                  city: val === 'all' ? undefined : val,
                  area: undefined, // reset area when city changes
                })
              }
            >
              <SelectTrigger className="w-full bg-ivory/50">
                <SelectValue placeholder={t('allCities')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('allCities')}</SelectItem>
                {cities.map((c) => (
                  <SelectItem key={c.slug} value={c.name}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Area Selector (if areas exist) */}
            {areas.length > 0 && (
              <Select
                value={filters.area || 'all'}
                onValueChange={(val) =>
                  onFilterChange({ area: val === 'all' ? undefined : val })
                }
              >
                <SelectTrigger className="w-full bg-ivory/50 text-xs">
                  <SelectValue placeholder={t('allAreas')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('allAreas')}</SelectItem>
                  {areas.map((a) => (
                    <SelectItem key={a.slug} value={a.name}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        {/* 2. Property Type */}
        <div className="border-t border-line pt-5">
          <label className="mb-2.5 block text-xs font-semibold tracking-wider text-muted uppercase">
            <span className="inline-flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-gold-deep" strokeWidth={1.5} />
              {t('propertyType')}
            </span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PROPERTY_TYPE_KEYS.map((typeKey) => {
              const isSelected = (filters.type || []).includes(typeKey);
              return (
                <button
                  key={typeKey}
                  type="button"
                  onClick={() => handleTypeToggle(typeKey)}
                  className={cn(
                    'flex items-center justify-between rounded-[4px] border px-3 py-2 text-xs font-medium transition-all text-start',
                    isSelected
                      ? 'border-gold bg-mist text-navy font-semibold shadow-xs'
                      : 'border-line bg-white text-muted hover:border-gold/60 hover:text-navy'
                  )}
                  aria-pressed={isSelected}
                >
                  <span className="truncate">{t(`types.${typeKey}`)}</span>
                  {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-gold-deep" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Price Range */}
        <div className="border-t border-line pt-5">
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-semibold tracking-wider text-muted uppercase">
              <span className="inline-flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-gold-deep" strokeWidth={1.5} />
                {t('priceRange')} ({currency})
              </span>
            </label>
            {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
              <button
                type="button"
                onClick={() => onFilterChange({ minPrice: undefined, maxPrice: undefined })}
                className="text-[11px] text-gold-deep hover:underline"
              >
                {t('clearAll')}
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="mb-1 block text-[11px] text-muted">{t('minPrice')}</span>
              <Input
                type="number"
                min={0}
                step={50000}
                placeholder="0"
                value={filters.minPrice !== undefined ? filters.minPrice : ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  onFilterChange({ minPrice: val });
                }}
                className="h-9 text-xs"
              />
            </div>
            <div>
              <span className="mb-1 block text-[11px] text-muted">{t('maxPrice')}</span>
              <Input
                type="number"
                min={0}
                step={50000}
                placeholder="Any"
                value={filters.maxPrice !== undefined ? filters.maxPrice : ''}
                onChange={(e) => {
                  const val = e.target.value ? Number(e.target.value) : undefined;
                  onFilterChange({ maxPrice: val });
                }}
                className="h-9 text-xs"
              />
            </div>
          </div>
        </div>

        {/* 4. Bedrooms */}
        <div className="border-t border-line pt-5">
          <label className="mb-2.5 block text-xs font-semibold tracking-wider text-muted uppercase">
            <span className="inline-flex items-center gap-1.5">
              <Bed className="h-3.5 w-3.5 text-gold-deep" strokeWidth={1.5} />
              {t('bedrooms')}
            </span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {BED_OPTIONS.map((opt) => {
              const currentBed = filters.beds || 'all';
              const isSelected = currentBed.toLowerCase() === opt.toLowerCase();
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() =>
                    onFilterChange({ beds: opt === 'all' ? undefined : opt })
                  }
                  className={cn(
                    'flex h-8 min-w-[2.25rem] items-center justify-center rounded-[4px] border px-2 text-xs font-medium transition-all',
                    isSelected
                      ? 'border-navy bg-navy text-ivory font-semibold shadow-xs'
                      : 'border-line bg-white text-muted hover:border-gold/60 hover:text-navy'
                  )}
                  aria-pressed={isSelected}
                >
                  {opt === 'all' ? t('anyBeds') : opt === 'studio' ? t('studio') : opt}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5. Bathrooms */}
        <div className="border-t border-line pt-5">
          <label className="mb-2.5 block text-xs font-semibold tracking-wider text-muted uppercase">
            <span className="inline-flex items-center gap-1.5">
              <Bath className="h-3.5 w-3.5 text-gold-deep" strokeWidth={1.5} />
              {t('bathrooms')}
            </span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {BATH_OPTIONS.map((count) => {
              const currentBaths = filters.baths || 0;
              const isSelected = currentBaths === count;
              return (
                <button
                  key={count}
                  type="button"
                  onClick={() =>
                    onFilterChange({ baths: count === 0 ? undefined : count })
                  }
                  className={cn(
                    'flex h-8 min-w-[2.25rem] items-center justify-center rounded-[4px] border px-2.5 text-xs font-medium transition-all',
                    isSelected
                      ? 'border-navy bg-navy text-ivory font-semibold shadow-xs'
                      : 'border-line bg-white text-muted hover:border-gold/60 hover:text-navy'
                  )}
                  aria-pressed={isSelected}
                >
                  {count === 0 ? t('anyBeds') : `${count}+`}
                </button>
              );
            })}
          </div>
        </div>

        {/* 6. Property Size (Sqm / Sqft toggle) */}
        <div className="border-t border-line pt-5">
          <div className="flex items-center justify-between mb-2.5">
            <label className="text-xs font-semibold tracking-wider text-muted uppercase">
              <span className="inline-flex items-center gap-1.5">
                <Maximize2 className="h-3.5 w-3.5 text-gold-deep" strokeWidth={1.5} />
                {t('size')}
              </span>
            </label>
            {/* Unit Toggle */}
            <div className="inline-flex rounded-[4px] border border-line p-0.5 bg-ivory">
              <button
                type="button"
                onClick={() => onFilterChange({ sizeUnit: 'sqm' })}
                className={cn(
                  'px-2 py-0.5 text-[10px] font-semibold rounded-[2px] transition-colors',
                  currentSizeUnit === 'sqm'
                    ? 'bg-navy text-ivory shadow-xs'
                    : 'text-muted hover:text-navy'
                )}
              >
                {t('sqm')}
              </button>
              <button
                type="button"
                onClick={() => onFilterChange({ sizeUnit: 'sqft' })}
                className={cn(
                  'px-2 py-0.5 text-[10px] font-semibold rounded-[2px] transition-colors',
                  currentSizeUnit === 'sqft'
                    ? 'bg-navy text-ivory shadow-xs'
                    : 'text-muted hover:text-navy'
                )}
              >
                {t('sqft')}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Input
              type="number"
              min={0}
              placeholder={t('minSize')}
              value={filters.minSize !== undefined ? filters.minSize : ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined;
                onFilterChange({ minSize: val });
              }}
              className="h-9 text-xs"
            />
            <Input
              type="number"
              min={0}
              placeholder={t('maxSize')}
              value={filters.maxSize !== undefined ? filters.maxSize : ''}
              onChange={(e) => {
                const val = e.target.value ? Number(e.target.value) : undefined;
                onFilterChange({ maxSize: val });
              }}
              className="h-9 text-xs"
            />
          </div>
        </div>

        {/* 7. Completion Status */}
        <div className="border-t border-line pt-5">
          <label className="mb-2.5 block text-xs font-semibold tracking-wider text-muted uppercase">
            <span className="inline-flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-gold-deep" strokeWidth={1.5} />
              {t('status')}
            </span>
          </label>
          <div className="space-y-2">
            {[
              { key: 'ready' as PropertyStatus, label: t('ready') },
              { key: 'off_plan' as PropertyStatus, label: t('offPlan') },
              { key: 'under_construction' as PropertyStatus, label: t('underConstruction') },
            ].map(({ key, label }) => {
              const isChecked = (filters.status || []).includes(key);
              return (
                <label
                  key={key}
                  className="flex items-center gap-2.5 text-xs text-navy font-medium cursor-pointer select-none hover:text-gold-deep"
                >
                  <Checkbox
                    checked={isChecked}
                    onCheckedChange={() => handleStatusToggle(key)}
                    className="h-4 w-4"
                  />
                  <span>{label}</span>
                </label>
              );
            })}
          </div>
        </div>

        {/* 8. Feature Highlights */}
        <div className="border-t border-line pt-5">
          <label className="mb-2.5 block text-xs font-semibold tracking-wider text-muted uppercase">
            {t('features')}
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2.5 text-xs text-navy font-medium cursor-pointer select-none hover:text-gold-deep">
              <Checkbox
                checked={Boolean(filters.isHotDeal)}
                onCheckedChange={(checked) =>
                  onFilterChange({ isHotDeal: checked ? true : undefined })
                }
                className="h-4 w-4"
              />
              <span>{t('hotDeal')}</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-navy font-medium cursor-pointer select-none hover:text-gold-deep">
              <Checkbox
                checked={Boolean(filters.isNewLaunch)}
                onCheckedChange={(checked) =>
                  onFilterChange({ isNewLaunch: checked ? true : undefined })
                }
                className="h-4 w-4"
              />
              <span>{t('newLaunch')}</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-navy font-medium cursor-pointer select-none hover:text-gold-deep">
              <Checkbox
                checked={Boolean(filters.isVerified)}
                onCheckedChange={(checked) =>
                  onFilterChange({ isVerified: checked ? true : undefined })
                }
                className="h-4 w-4"
              />
              <span>{t('verified')}</span>
            </label>

            <label className="flex items-center gap-2.5 text-xs text-navy font-medium cursor-pointer select-none hover:text-gold-deep">
              <Checkbox
                checked={Boolean(filters.hasInstallments)}
                onCheckedChange={(checked) =>
                  onFilterChange({ hasInstallments: checked ? true : undefined })
                }
                className="h-4 w-4"
              />
              <span>{t('hasInstallments')}</span>
            </label>
          </div>
        </div>
      </div>
    </aside>
  );
}
