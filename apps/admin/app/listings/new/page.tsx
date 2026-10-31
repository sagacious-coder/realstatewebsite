import React, { Suspense } from 'react';
import { ListingForm } from '@/components/listings/ListingForm';

export default function NewListingPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-muted">Loading listing editor...</div>}>
      <ListingForm mode="create" />
    </Suspense>
  );
}
