'use client';

import React from 'react';
import { Pagination } from '@/components/ui/Pagination';

export interface SearchPaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

export function SearchPagination({
  currentPage,
  totalPages,
  onPageChange,
  className,
}: SearchPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className={className}>
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={onPageChange}
      />
    </div>
  );
}

