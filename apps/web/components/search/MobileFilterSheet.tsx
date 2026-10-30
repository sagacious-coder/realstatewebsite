'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/Sheet';
import { SearchFilterPanel, type SearchFilterPanelProps } from './SearchFilterPanel';
import { cn } from '@/lib/utils';

export interface MobileFilterSheetProps extends SearchFilterPanelProps {
  triggerClassName?: string;
}

export function MobileFilterSheet(props: MobileFilterSheetProps) {
  const t = useTranslations('search');
  const [open, setOpen] = useState(false);

  // Calculate active filter count
  const activeCount = React.useMemo(() => {
    let count = 0;
    const f = props.filters;
    if (f.q) count++;
    if (f.city) count++;
    if (f.area) count++;
    if (f.type && f.type.length > 0) count += f.type.length;
    if (f.minPrice !== undefined || f.maxPrice !== undefined) count++;
    if (f.beds && f.beds !== 'all') count++;
    if (f.baths && f.baths > 0) count++;
    if (f.minSize !== undefined || f.maxSize !== undefined) count++;
    if (f.status && f.status.length > 0) count += f.status.length;
    if (f.isHotDeal) count++;
    if (f.isNewLaunch) count++;
    if (f.isVerified) count++;
    if (f.hasInstallments) count++;
    return count;
  }, [props.filters]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'inline-flex items-center gap-2 border-line bg-white text-navy font-medium shadow-xs hover:border-gold lg:hidden min-h-[42px] px-4',
            props.triggerClassName
          )}
          aria-label={t('filters')}
        >
          <SlidersHorizontal className="h-4 w-4 text-gold-deep" strokeWidth={1.5} />
          <span>{t('filters')}</span>
          {activeCount > 0 && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-navy text-[11px] font-semibold text-ivory px-1.5">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent
        side="bottom"
        className="max-h-[90vh] overflow-y-auto rounded-t-card p-0 sm:max-w-md sm:side-right"
      >
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-line bg-white px-5 py-4">
          <SheetHeader className="p-0 border-none space-y-0">
            <SheetTitle className="font-serif text-lg font-semibold text-navy flex items-center gap-2">
              <SlidersHorizontal className="h-4 w-4 text-gold-deep" strokeWidth={1.5} />
              <span>{t('filters')}</span>
              {activeCount > 0 && (
                <span className="text-xs font-normal text-muted">
                  ({t('filterCount', { count: activeCount })})
                </span>
              )}
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className="p-5 pb-24">
          <SearchFilterPanel {...props} isMobileModal={true} className="border-none p-0 shadow-none" />
        </div>

        {/* Sticky Mobile Apply Bar */}
        <div className="sticky bottom-0 z-20 flex items-center gap-3 border-t border-line bg-white/95 backdrop-blur-md px-5 py-3 shadow-subtle">
          {activeCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={props.onResetAll}
              className="text-xs border-line hover:border-gold"
            >
              {t('resetFilters')}
            </Button>
          )}
          <Button
            variant="primary"
            className="flex-1 text-xs font-semibold"
            onClick={() => setOpen(false)}
          >
            {t('applyFilters', { count: props.totalCount ?? 0 })}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

