'use client';

import React, { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Search, X, LayoutGrid, List } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/utils';
import type { CountryCode, ListingSort } from '@wild-hills/contracts';
import { MobileFilterSheet, type MobileFilterSheetProps } from './MobileFilterSheet';

export interface SearchHeaderProps {
  countryCode: CountryCode;
  countryName: string;
  totalCount: number;
  searchQuery: string;
  sort: ListingSort;
  viewMode: 'grid' | 'list';
  onSearchChange: (q: string) => void;
  onSortChange: (sort: ListingSort) => void;
  onViewChange: (mode: 'grid' | 'list') => void;
  mobileFilterProps: MobileFilterSheetProps;
  className?: string;
}

const SORT_OPTIONS: ListingSort[] = [
  'featured',
  'price_asc',
  'price_desc',
  'newest',
  'beds_asc',
  'beds_desc',
  'size_desc',
];

export function SearchHeader({
  countryCode,
  countryName,
  totalCount,
  searchQuery,
  sort,
  viewMode,
  onSearchChange,
  onSortChange,
  onViewChange,
  mobileFilterProps,
  className,
}: SearchHeaderProps) {
  const t = useTranslations('search');
  const [localSearch, setLocalSearch] = useState(searchQuery);

  // Sync internal search state when URL updates
  useEffect(() => {
    setLocalSearch(searchQuery);
  }, [searchQuery]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearchChange(localSearch.trim());
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    onSearchChange('');
  };

  return (
    <div className={cn('space-y-4 text-start', className)}>
      {/* Top Banner & Search Box */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-semibold text-navy tracking-tight">
            {t('title', { country: countryName })}
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted">
            {t('showingCount', { count: totalCount, country: countryName })}
          </p>
        </div>

        {/* Search input box */}
        <form
          onSubmit={handleSearchSubmit}
          className="relative flex-1 max-w-md w-full"
          role="search"
        >
          <div className="relative flex items-center">
            <Search
              className="absolute start-3.5 h-4 w-4 text-muted pointer-events-none"
              strokeWidth={1.5}
              aria-hidden="true"
            />
            <Input
              type="text"
              value={localSearch}
              onChange={(e) => setLocalSearch(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className="ps-10 pe-10 h-10 w-full bg-white text-xs sm:text-sm border-line shadow-xs focus-visible:ring-gold"
              aria-label={t('searchPlaceholder')}
            />
            {localSearch && (
              <button
                type="button"
                onClick={handleClearSearch}
                aria-label="Clear search"
                className="absolute end-3 p-1 text-muted hover:text-navy transition-colors"
              >
                <X className="h-4 w-4" strokeWidth={1.5} />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Control Bar: Mobile Filter Trigger, Sort Dropdown & Grid/List View Toggle */}
      <div className="flex items-center justify-between gap-3 border-y border-line py-2.5">
        <div className="flex items-center gap-2">
          {/* Mobile Filter Sheet Button */}
          <MobileFilterSheet {...mobileFilterProps} />

          {/* Results count indicator */}
          <span className="hidden lg:inline text-xs font-semibold text-navy">
            {t('showingCount', { count: totalCount, country: countryName })}
          </span>
        </div>

        <div className="flex items-center gap-3 ms-auto">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <label htmlFor="sort-select" className="text-xs font-medium text-muted hidden sm:inline whitespace-nowrap">
              {t('sort.label')}:
            </label>
            <Select
              value={sort}
              onValueChange={(val) => onSortChange(val as ListingSort)}
            >
              <SelectTrigger id="sort-select" className="h-9 w-[170px] sm:w-[190px] bg-white text-xs border-line">
                <SelectValue placeholder={t('sort.label')} />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((opt) => (
                  <SelectItem key={opt} value={opt} className="text-xs">
                    {t(`sort.${opt}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Grid vs List View Toggle */}
          <div className="flex items-center rounded-[4px] border border-line bg-white p-0.5 shadow-xs">
            <button
              type="button"
              onClick={() => onViewChange('grid')}
              aria-label={t('viewGrid')}
              aria-pressed={viewMode === 'grid'}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-[2px] transition-colors focus-visible:outline-2 focus-visible:outline-gold',
                viewMode === 'grid'
                  ? 'bg-navy text-ivory shadow-xs'
                  : 'text-muted hover:text-navy'
              )}
            >
              <LayoutGrid className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
            <button
              type="button"
              onClick={() => onViewChange('list')}
              aria-label={t('viewList')}
              aria-pressed={viewMode === 'list'}
              className={cn(
                'flex h-7 w-7 items-center justify-center rounded-[2px] transition-colors focus-visible:outline-2 focus-visible:outline-gold',
                viewMode === 'list'
                  ? 'bg-navy text-ivory shadow-xs'
                  : 'text-muted hover:text-navy'
              )}
            >
              <List className="h-3.5 w-3.5" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

