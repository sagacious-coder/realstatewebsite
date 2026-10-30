'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { ListingCard } from '@/components/cards/ListingCard';
import type { BadgeVariant } from '@/components/ui/Badge';
import { useCurrency } from '@/components/providers/CurrencyProvider';
import type { ListingSummary, CountryCode } from '@wild-hills/contracts';
import { CompareTray } from './CompareTray';
import { SearchEmptyState } from './SearchEmptyState';
import type { SearchFilterState } from './types';

export interface ListingResultsProps {
  listings: ListingSummary[];
  countryCode: CountryCode;
  countryName: string;
  filters: SearchFilterState;
  onResetFilters: () => void;
  viewMode?: 'grid' | 'list';
  className?: string;
}

export function ListingResults({
  listings,
  countryCode,
  countryName,
  filters,
  onResetFilters,
  viewMode = 'grid',
  className,
}: ListingResultsProps) {
  const locale = useLocale();
  const { currency, formatPrice } = useCurrency();

  // Favorite heart state (localStorage)
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('wh_favorites');
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch {
      // Storage unavailable in private browsing
    }
  }, []);

  const handleToggleFavorite = useCallback((id: string) => {
    setFavorites((prev) => {
      const next = prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id];
      try {
        localStorage.setItem('wh_favorites', JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  // Compare properties state (up to 4 items)
  const [comparedItems, setComparedItems] = useState<ListingSummary[]>([]);

  const handleToggleCompare = useCallback((id: string) => {
    setComparedItems((prev) => {
      const exists = prev.some((item) => item.id === id);
      if (exists) {
        return prev.filter((item) => item.id !== id);
      }
      if (prev.length >= 4) {
        return prev; // max 4 items
      }
      const itemToAdd = listings.find((l) => l.id === id);
      return itemToAdd ? [...prev, itemToAdd] : prev;
    });
  }, [listings]);

  const handleRemoveCompareItem = useCallback((id: string) => {
    setComparedItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const handleClearCompare = useCallback(() => {
    setComparedItems([]);
  }, []);

  if (listings.length === 0) {
    return (
      <SearchEmptyState
        countryCode={countryCode}
        countryName={countryName}
        filters={filters}
        onResetFilters={onResetFilters}
      />
    );
  }

  return (
    <>
      <div
        className={
          viewMode === 'grid'
            ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6'
            : 'flex flex-col gap-5'
        }
      >
        {listings.map((item) => {
          // Format dual price
          const priceFormatted = formatPrice(item.priceMinor, item.currency);
          const priceOriginal =
            currency !== item.currency
              ? `${new Intl.NumberFormat(locale).format(item.priceMinor / 100)} ${item.currency}`
              : undefined;

          // Map badges
          const badges: BadgeVariant[] = [];
          if (item.isVerified) badges.push('verified');
          if (item.isHotDeal) badges.push('hot-deal');
          if (item.isNewLaunch) badges.push('new-launch');
          if (item.status === 'ready') badges.push('ready');
          if (item.status === 'off_plan') badges.push('off-plan');

          const locationStr = item.location
            ? `${item.location.area ? `${item.location.area}, ` : ''}${item.location.city}`
            : countryName;

          const isFav = favorites.includes(item.id);
          const isComp = comparedItems.some((c) => c.id === item.id);

          return (
            <ListingCard
              key={item.id}
              id={item.id}
              refCode={item.refNumber}
              title={item.title}
              location={locationStr}
              priceFormatted={priceFormatted}
              priceOriginal={priceOriginal}
              coverImage={item.coverImage}
              bedrooms={item.bedrooms}
              bathrooms={item.bathrooms}
              sizeSqm={item.sizeSqm}
              isSqft={filters.sizeUnit === 'sqft'}
              propertyType={item.propertyType}
              badges={badges.length > 0 ? badges : ['new-launch']}
              isFavorite={isFav}
              isCompared={isComp}
              onToggleFavorite={handleToggleFavorite}
              onToggleCompare={handleToggleCompare}
              viewMode={viewMode}
              href={`/${locale}/${item.location.countryCode}/property/${item.refNumber.toLowerCase()}-${item.slug}`}
              locale={locale}
            />
          );
        })}
      </div>

      {/* Floating Compare Tray */}
      <CompareTray
        items={comparedItems}
        onRemoveItem={handleRemoveCompareItem}
        onClearAll={handleClearCompare}
        currency={currency}
        formatPrice={formatPrice}
      />
    </>
  );
}

