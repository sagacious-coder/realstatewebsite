import type {
  CountryCode,
  CurrencyCode,
  ListingSort,
  PropertyStatus,
  PropertyType,
  UnitSizeUnit,
  ListingSummary,
} from '@wild-hills/contracts';

export interface SearchFilterState {
  q?: string;
  country?: CountryCode;
  city?: string;
  area?: string;
  type?: PropertyType[];
  minPrice?: number;
  maxPrice?: number;
  currency?: CurrencyCode;
  beds?: string;
  baths?: number;
  minSize?: number;
  maxSize?: number;
  sizeUnit?: UnitSizeUnit;
  status?: PropertyStatus[];
  isHotDeal?: boolean;
  isNewLaunch?: boolean;
  isVerified?: boolean;
  hasInstallments?: boolean;
  sort?: ListingSort;
  page?: number;
  limit?: number;
  view?: 'grid' | 'list';
}

export interface ActiveFilterChip {
  id: string;
  key: keyof SearchFilterState;
  label: string;
  value?: unknown;
}

export interface ComparePropertyItem extends ListingSummary {
  priceFormatted?: string;
  priceOriginal?: string;
}

