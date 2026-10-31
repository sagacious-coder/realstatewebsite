'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Edit, ExternalLink } from 'lucide-react';
import { ListingSummary } from '@wild-hills/contracts';
import { formatPrice } from '@/lib/utils';

export function RecentListingsWidget({ listings }: { listings: ListingSummary[] }) {
  const recent = listings.slice(0, 5);

  return (
    <div className="bg-white rounded-2xl border border-line p-6 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="font-serif text-lg font-bold text-navy">Recently Added Properties</h3>
          <p className="text-xs text-muted">Latest inventory additions across all markets</p>
        </div>
        <Link
          href="/listings"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-gold hover:text-navy transition-colors"
        >
          <span>View All</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-line">
        {recent.map((item) => (
          <div key={item.id} className="py-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-12 h-10 rounded-lg overflow-hidden bg-sand border border-line shrink-0">
                <img
                  src={item.coverImage || '/images/defaults/apartment/cover-card.webp'}
                  alt={item.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="min-w-0">
                <Link
                  href={`/listings/${item.id}/edit`}
                  className="text-xs sm:text-sm font-semibold text-navy hover:text-gold transition-colors block truncate"
                >
                  {item.title}
                </Link>
                <span className="text-[11px] text-muted block mt-0.5 font-mono">
                  {item.refNumber} · {item.location.city} ({item.location.countryCode.toUpperCase()})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-xs sm:text-sm font-bold text-navy">
                {formatPrice(item.priceMinor, item.currency)}
              </span>
              <Link
                href={`/listings/${item.id}/edit`}
                className="p-1.5 rounded-lg text-navy hover:bg-sand transition-colors"
                title="Edit"
              >
                <Edit className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

