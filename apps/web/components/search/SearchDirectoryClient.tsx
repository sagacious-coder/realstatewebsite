'use client';

import React, { useTransition } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import type { CountryCode, CurrencyCode, ListingSummary, Location, ListingSort } from '@wild-hills/contracts';
import { SearchHeader } from './SearchHeader';
import { SearchFilterPanel } from './SearchFilterPanel';
import { ActiveFilterChips } from './ActiveFilterChips';
import { ListingResults } from './ListingResults';
import { SearchPagination } from './SearchPagination';
import type { SearchFilterState, ActiveFilterChip } from './types';
import { cn } from '@/lib/utils';

export interface SearchDirectoryClientProps {
  countryCode: CountryCode;
  countryName: string;
  locations: Location[];
  currency: CurrencyCode;
  initialListings: ListingSummary[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filters: SearchFilterState;
}

export function SearchDirectoryClient({
  countryCode,
  countryName,
  locations,
  currency,
  initialListings,
  totalCount,
  currentPage,
  totalPages,
  filters,
}: SearchDirectoryClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [viewMode, setViewMode] = React.useState<'grid' | 'list'>('grid');

  // Push new query parameters to URL, resetting page to 1 unless page change
  const updateUrlParams = React.useCallback(
    (updates: Partial<SearchFilterState>, resetPage = true) => {
      const params = new URLSearchParams(searchParams.toString());

      if (resetPage) {
        params.delete('page');
      }

      Object.entries(updates).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
          params.delete(key);
        } else if (Array.isArray(value)) {
          params.delete(key);
          value.forEach((v) => params.append(key, String(v)));
        } else if (typeof value === 'boolean') {
          if (value) {
            params.set(key, 'true');
          } else {
            params.delete(key);
          }
        } else {
          params.set(key, String(value));
        }
      });

      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`, { scroll: false });
      });
    },
    [router, pathname, searchParams]
  );

  // Handle single filter change
  const handleFilterChange = React.useCallback(
    (updates: Partial<SearchFilterState>) => {
      updateUrlParams(updates, true);
    },
    [updateUrlParams]
  );

  // Reset all filters
  const handleResetAll = React.useCallback(() => {
    startTransition(() => {
      router.push(pathname, { scroll: false });
    });
  }, [router, pathname]);

  // Remove single active chip
  const handleRemoveChip = React.useCallback(
    (chip: ActiveFilterChip) => {
      if (chip.key === 'type' && chip.value) {
        const currentTypes = filters.type || [];
        const next = currentTypes.filter((t) => t !== chip.value);
        updateUrlParams({ type: next.length > 0 ? next : undefined });
      } else if (chip.key === 'status' && chip.value) {
        const currentStatuses = filters.status || [];
        const next = currentStatuses.filter((s) => s !== chip.value);
        updateUrlParams({ status: next.length > 0 ? next : undefined });
      } else if (chip.key === 'minPrice') {
        updateUrlParams({ minPrice: undefined, maxPrice: undefined });
      } else if (chip.key === 'minSize') {
        updateUrlParams({ minSize: undefined, maxSize: undefined });
      } else {
        updateUrlParams({ [chip.key]: undefined });
      }
    },
    [filters, updateUrlParams]
  );

  // Handle pagination page change
  const handlePageChange = React.useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams.toString());
      if (newPage > 1) {
        params.set('page', String(newPage));
      } else {
        params.delete('page');
      }
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
        window.scrollTo({ top: 120, behavior: 'smooth' });
      });
    },
    [router, pathname, searchParams]
  );

  return (
    <div className="container py-8 sm:py-12">
      {/* Search Header */}
      <SearchHeader
        countryCode={countryCode}
        countryName={countryName}
        totalCount={totalCount}
        searchQuery={filters.q || ''}
        sort={filters.sort || 'featured'}
        viewMode={viewMode}
        onSearchChange={(q) => handleFilterChange({ q: q || undefined })}
        onSortChange={(sort) => handleFilterChange({ sort })}
        onViewChange={setViewMode}
        mobileFilterProps={{
          countryCode,
          locations,
          currency,
          filters,
          onFilterChange: handleFilterChange,
          onResetAll: handleResetAll,
          totalCount,
        }}
        className="mb-4"
      />

      {/* Active Filter Chips */}
      <ActiveFilterChips
        filters={filters}
        currency={currency}
        onRemoveChip={handleRemoveChip}
        onClearAll={handleResetAll}
        className="mb-6"
      />

      {/* Main Content Layout: Sidebar + Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
        {/* Desktop Sidebar (1 Column) */}
        <div className="hidden lg:block lg:col-span-1">
          <SearchFilterPanel
            countryCode={countryCode}
            locations={locations}
            currency={currency}
            filters={filters}
            onFilterChange={handleFilterChange}
            onResetAll={handleResetAll}
            totalCount={totalCount}
          />
        </div>

        {/* Results Area (3 Columns on Large Screens) */}
        <div className="col-span-1 lg:col-span-3">
          {/* Subtle transition pending indicator */}
          <div
            className={cn(
              'transition-opacity duration-200',
              isPending && 'opacity-60 pointer-events-none'
            )}
          >
            <ListingResults
              listings={initialListings}
              countryCode={countryCode}
              countryName={countryName}
              filters={filters}
              onResetFilters={handleResetAll}
              viewMode={viewMode}
            />

            {/* Pagination Controls */}
            <SearchPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
              className="mt-10"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

