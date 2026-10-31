import React, { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { getAdminListingById } from '@/lib/data';
import { ListingForm } from '@/components/listings/ListingForm';

export const dynamic = 'force-dynamic';

interface EditListingPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditListingPage({ params }: EditListingPageProps) {
  const { id } = await params;
  const listing = await getAdminListingById(id);

  if (!listing) {
    notFound();
  }

  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-muted">Loading listing editor...</div>}>
      <ListingForm initialListing={listing} mode="edit" />
    </Suspense>
  );
}
