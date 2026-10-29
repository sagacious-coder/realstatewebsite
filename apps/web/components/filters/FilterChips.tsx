'use client';

import React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterChipItem {
  id: string;
  label: string;
  group?: string;
}

export interface FilterChipsProps {
  chips: FilterChipItem[];
  onRemove: (id: string) => void;
  onClearAll?: () => void;
  className?: string;
}

/**
 * FilterChips: Section 4.4
 * - Horizontal list of active filters
 * - 4px radius, 1px line border, ivory/white pill
 * - Accessible remove button with Lucide X icon (stroke 1.5)
 * - "Clear all" action
 * - RTL compatible with logical padding and margins
 */
export function FilterChips({
  chips,
  onRemove,
  onClearAll,
  className,
}: FilterChipsProps) {
  if (!chips || chips.length === 0) return null;

  return (
    <div
      className={cn('flex flex-wrap items-center gap-2 py-2', className)}
      role="region"
      aria-label="Active filters"
    >
      <span className="text-xs font-medium text-muted me-1">
        Active filters:
      </span>

      {chips.map((chip) => (
        <span
          key={chip.id}
          className="inline-flex items-center gap-1.5 rounded-[4px] border border-line bg-white py-1 ps-2.5 pe-1.5 text-xs font-medium text-navy shadow-xs transition-colors hover:border-gold/60"
        >
          <span>{chip.label}</span>
          <button
            type="button"
            onClick={() => onRemove(chip.id)}
            aria-label={`Remove filter: ${chip.label}`}
            className="flex h-5 w-5 items-center justify-center rounded-[3px] text-muted hover:bg-mist hover:text-navy focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
          >
            <X className="h-3.5 w-3.5" strokeWidth={1.5} />
          </button>
        </span>
      ))}

      {onClearAll && chips.length > 1 && (
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs font-medium text-gold-deep underline decoration-gold/60 underline-offset-2 hover:text-navy ms-1 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold rounded-[2px]"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
