'use client';

import React, { useState } from 'react';
import { useTranslations } from 'next-intl';
import { SearchX, RotateCcw, SendHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalTitle,
  ModalDescription,
} from '@/components/ui/Modal';
import { LeadForm } from '@/components/forms/LeadForm';
import type { CountryCode } from '@wild-hills/contracts';
import type { SearchFilterState } from './types';

export interface SearchEmptyStateProps {
  countryCode: CountryCode;
  countryName: string;
  filters: SearchFilterState;
  onResetFilters: () => void;
  className?: string;
}

export function SearchEmptyState({
  countryCode,
  countryName,
  filters,
  onResetFilters,
  className,
}: SearchEmptyStateProps) {
  const t = useTranslations('search');
  const [modalOpen, setModalOpen] = useState(false);

  // Build pre-filled inquiry message summarizing active query
  const defaultInquiryMessage = React.useMemo(() => {
    const parts: string[] = [`Looking for property in ${countryName}.`];
    if (filters.city) parts.push(`City: ${filters.city}`);
    if (filters.type && filters.type.length > 0) parts.push(`Type: ${filters.type.join(', ')}`);
    if (filters.beds && filters.beds !== 'all') parts.push(`Bedrooms: ${filters.beds}`);
    if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
      parts.push(`Budget: ${filters.minPrice ?? 0} - ${filters.maxPrice ?? 'Any'}`);
    }
    return parts.join(' | ');
  }, [filters, countryName]);

  return (
    <div className="flex flex-col items-center justify-center rounded-card border border-line bg-white px-6 py-16 text-center shadow-subtle my-6">
      {/* Icon frame */}
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-mist text-gold-deep border border-emerald/20 shadow-xs">
        <SearchX className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
      </div>

      <h3 className="font-serif text-xl sm:text-2xl font-semibold text-navy">
        {t('empty.title')}
      </h3>
      <p className="mt-2 max-w-md text-sm text-muted leading-relaxed">
        {t('empty.description')}
      </p>

      {/* Action buttons */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={onResetFilters}
          className="inline-flex items-center gap-1.5 border-line hover:border-gold"
        >
          <RotateCcw className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>{t('empty.reset')}</span>
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center gap-1.5 font-semibold"
        >
          <SendHorizontal className="h-3.5 w-3.5" strokeWidth={1.5} />
          <span>{t('empty.customSearch')}</span>
        </Button>
      </div>

      {/* Bespoke Search Request Modal */}
      <Modal open={modalOpen} onOpenChange={setModalOpen}>
        <ModalContent className="max-w-lg p-6 bg-white rounded-card">
          <ModalHeader className="text-start pb-4 border-b border-line">
            <ModalTitle className="font-serif text-xl font-semibold text-navy">
              {t('empty.modalTitle')}
            </ModalTitle>
            <ModalDescription className="text-xs text-muted mt-1">
              {t('empty.modalSubtitle')}
            </ModalDescription>
          </ModalHeader>

          <div className="pt-4">
            <LeadForm
              defaultMessage={defaultInquiryMessage}
              propertyTitle={`Bespoke Search · ${countryName}`}
              onSubmitSuccess={() => {
                setTimeout(() => setModalOpen(false), 2000);
              }}
            />
          </div>
        </ModalContent>
      </Modal>
    </div>
  );
}

