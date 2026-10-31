import React from 'react';
import { ListingsTable } from '@/components/listings/ListingsTable';

export const dynamic = 'force-dynamic';

export default function ListingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          Property Listings
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Review, manage, search, and update properties across all international desks.
        </p>
      </div>

      <ListingsTable />
    </div>
  );
}

