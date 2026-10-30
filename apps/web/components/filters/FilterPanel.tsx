'use client';

import React, { useState } from 'react';
import { useLocale } from 'next-intl';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Slider } from '@/components/ui/Slider';
import { Checkbox } from '@/components/ui/Checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterState {
  country?: string;
  city?: string;
  propertyType?: string;
  bedrooms?: string;
  priceMin?: number;
  priceMax?: number;
  status?: string[];
  features?: string[];
}

export interface FilterPanelProps {
  initialFilters?: FilterState;
  onFilterChange?: (filters: FilterState) => void;
  resultCount?: number;
  currencyCode?: string;
  className?: string;
  locale?: string;
}

const PROPERTY_TYPES = [
  { label: 'All types', value: 'all' },
  { label: 'Apartment', value: 'apartment' },
  { label: 'Villa', value: 'villa' },
  { label: 'Townhouse', value: 'townhouse' },
  { label: 'Penthouse', value: 'penthouse' },
  { label: 'Duplex', value: 'duplex' },
  { label: 'Chalet', value: 'chalet' },
];

const BEDROOM_OPTIONS = ['All', 'Studio', '1', '2', '3', '4', '5+'];

const STATUS_OPTIONS = [
  { label: 'Ready', value: 'ready' },
  { label: 'Under construction', value: 'under_construction' },
  { label: 'Off-plan', value: 'off_plan' },
];

const FEATURE_OPTIONS = [
  { label: 'Sea view', value: 'sea_view' },
  { label: 'Private pool', value: 'private_pool' },
  { label: 'Balcony or terrace', value: 'balcony' },
  { label: 'Residency eligible', value: 'residency_eligible' },
];

/**
 * FilterPanel: Section 4.4, 9.2, 13.5
 * - Search filters: Location, Property Type, Bedrooms, Price Slider + Min/Max inputs, Status, Features
 * - Live count announcement button with aria-live="polite"
 * - Reset button
 * - Clean brand styling: 4px radius, 1px line border, ivory container
 */
export function FilterPanel({
  initialFilters = {},
  onFilterChange,
  resultCount = 128,
  currencyCode = 'AED',
  className,
  locale: propLocale,
}: FilterPanelProps) {
  const routeLocale = useLocale();
  const activeLocale = propLocale || routeLocale || 'en';
  const formatNumber = (num: number) => new Intl.NumberFormat(activeLocale).format(num);

  const [selectedType, setSelectedType] = useState(initialFilters.propertyType || 'all');
  const [selectedBeds, setSelectedBeds] = useState(initialFilters.bedrooms || 'All');
  const [priceRange, setPriceRange] = useState<number[]>([
    initialFilters.priceMin || 500000,
    initialFilters.priceMax || 8000000,
  ]);
  const [selectedStatus, setSelectedStatus] = useState<string[]>(
    initialFilters.status || ['ready', 'off_plan']
  );
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    initialFilters.features || []
  );

  const handlePriceSliderChange = (vals: number[]) => {
    setPriceRange(vals);
  };

  const handleStatusToggle = (val: string, checked: boolean) => {
    setSelectedStatus((prev) =>
      checked ? [...prev, val] : prev.filter((item) => item !== val)
    );
  };

  const handleFeatureToggle = (val: string, checked: boolean) => {
    setSelectedFeatures((prev) =>
      checked ? [...prev, val] : prev.filter((item) => item !== val)
    );
  };

  const handleReset = () => {
    setSelectedType('all');
    setSelectedBeds('All');
    setPriceRange([500000, 8000000]);
    setSelectedStatus(['ready', 'off_plan']);
    setSelectedFeatures([]);
    if (onFilterChange) {
      onFilterChange({});
    }
  };

  const handleApply = () => {
    if (onFilterChange) {
      onFilterChange({
        propertyType: selectedType,
        bedrooms: selectedBeds,
        priceMin: priceRange[0],
        priceMax: priceRange[1],
        status: selectedStatus,
        features: selectedFeatures,
      });
    }
  };

  return (
    <div
      className={cn(
        'flex flex-col gap-6 rounded-[6px] border border-line bg-white p-5 sm:p-6 shadow-sm',
        className
      )}
      role="search"
      aria-label="Property search filters"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-line pb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-gold" strokeWidth={1.5} />
          <h2 className="font-serif text-base font-semibold text-navy">Filters</h2>
        </div>
        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 text-xs font-medium text-muted hover:text-navy focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded-[2px]"
        >
          <RotateCcw className="h-3 w-3" strokeWidth={1.5} />
          <span>Reset</span>
        </button>
      </div>

      {/* Property Type */}
      <div className="space-y-1.5">
        <label
          htmlFor="filter-property-type"
          className="block text-xs font-semibold tracking-wider text-muted uppercase"
        >
          Property type
        </label>
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger id="filter-property-type" aria-label="Select property type">
            <SelectValue placeholder="All property types" />
          </SelectTrigger>
          <SelectContent>
            {PROPERTY_TYPES.map((pt) => (
              <SelectItem key={pt.value} value={pt.value}>
                {pt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bedrooms Toggle Group */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold tracking-wider text-muted uppercase">
          Bedrooms
        </label>
        <div className="grid grid-cols-4 gap-1 sm:grid-cols-7" role="radiogroup" aria-label="Bedrooms">
          {BEDROOM_OPTIONS.map((bed) => {
            const isSelected = selectedBeds === bed;
            return (
              <button
                key={bed}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => setSelectedBeds(bed)}
                className={cn(
                  'flex h-10 items-center justify-center rounded-[4px] border text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold',
                  isSelected
                    ? 'border-navy bg-navy text-white shadow-xs'
                    : 'border-line bg-white text-navy hover:bg-mist/80'
                )}
              >
                {bed}
              </button>
            );
          })}
        </div>
      </div>

      {/* Price Range: Slider paired with min and max number inputs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label
            htmlFor="filter-price-slider"
            className="block text-xs font-semibold tracking-wider text-muted uppercase"
          >
            Price range ({currencyCode})
          </label>
          <span className="text-xs text-muted">
            <bdi>{formatNumber(priceRange[0])}</bdi> – <bdi>{formatNumber(priceRange[1])}</bdi>
          </span>
        </div>

        <Slider
          id="filter-price-slider"
          min={100000}
          max={15000000}
          step={50000}
          value={priceRange}
          onValueChange={handlePriceSliderChange}
          aria-label="Filter price range"
          aria-valuetext={`${currencyCode} ${formatNumber(priceRange[0])} to ${formatNumber(priceRange[1])}`}
        />

        <div className="grid grid-cols-2 gap-3 pt-1">
          <Input
            label="Min price"
            type="number"
            value={priceRange[0]}
            onChange={(e) =>
              setPriceRange([Number(e.target.value) || 0, priceRange[1]])
            }
            className="h-10 text-xs"
          />
          <Input
            label="Max price"
            type="number"
            value={priceRange[1]}
            onChange={(e) =>
              setPriceRange([priceRange[0], Number(e.target.value) || 0])
            }
            className="h-10 text-xs"
          />
        </div>
      </div>

      {/* Construction Status Checkboxes */}
      <div className="space-y-2 border-t border-line pt-4">
        <span className="block text-xs font-semibold tracking-wider text-muted uppercase">
          Status
        </span>
        <div className="space-y-2">
          {STATUS_OPTIONS.map((st) => (
            <Checkbox
              key={st.value}
              id={`status-${st.value}`}
              label={st.label}
              checked={selectedStatus.includes(st.value)}
              onCheckedChange={(checked) => handleStatusToggle(st.value, Boolean(checked))}
            />
          ))}
        </div>
      </div>

      {/* Features Checkboxes */}
      <div className="space-y-2 border-t border-line pt-4">
        <span className="block text-xs font-semibold tracking-wider text-muted uppercase">
          Features
        </span>
        <div className="space-y-2">
          {FEATURE_OPTIONS.map((feat) => (
            <Checkbox
              key={feat.value}
              id={`feat-${feat.value}`}
              label={feat.label}
              checked={selectedFeatures.includes(feat.value)}
              onCheckedChange={(checked) => handleFeatureToggle(feat.value, Boolean(checked))}
            />
          ))}
        </div>
      </div>

      {/* Live Result Announcement & Apply Button */}
      <div className="border-t border-line pt-4">
        <Button
          variant="primary"
          onClick={handleApply}
          className="w-full justify-center"
        >
          {/* Live region for accessibility as specified in 13.5 */}
          <span aria-live="polite">
            Show <bdi>{resultCount}</bdi> homes
          </span>
        </Button>
      </div>
    </div>
  );
}
