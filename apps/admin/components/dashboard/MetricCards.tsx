'use client';

import React from 'react';
import { Building2, Users, Briefcase, TrendingUp } from 'lucide-react';

interface MetricCardsProps {
  listingCount: number;
  developerCount: number;
}

export function MetricCards({ listingCount, developerCount }: MetricCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
      {/* 1. Active Listings */}
      <div className="p-5 rounded-2xl bg-white border border-line shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted font-semibold">
            Active Properties
          </span>
          <p className="text-2xl sm:text-3xl font-serif font-bold text-navy mt-1">
            {listingCount}
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">
            +4 added this week
          </span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-navy/10 text-navy flex items-center justify-center">
          <Building2 className="w-6 h-6" />
        </div>
      </div>

      {/* 2. Client Inquiries */}
      <div className="p-5 rounded-2xl bg-white border border-line shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted font-semibold">
            Inquiries & Leads
          </span>
          <p className="text-2xl sm:text-3xl font-serif font-bold text-navy mt-1">
            42
          </p>
          <span className="text-[11px] text-emerald-600 font-medium">
            98% response rate
          </span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-gold/20 text-gold flex items-center justify-center">
          <Users className="w-6 h-6" />
        </div>
      </div>

      {/* 3. Partner Developers */}
      <div className="p-5 rounded-2xl bg-white border border-line shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted font-semibold">
            Master Developers
          </span>
          <p className="text-2xl sm:text-3xl font-serif font-bold text-navy mt-1">
            {developerCount}
          </p>
          <span className="text-[11px] text-muted font-medium">
            100% Escrow Audited
          </span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald/10 text-emerald flex items-center justify-center">
          <Briefcase className="w-6 h-6" />
        </div>
      </div>

      {/* 4. Average Yield */}
      <div className="p-5 rounded-2xl bg-white border border-line shadow-sm flex items-center justify-between">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted font-semibold">
            Avg. Rental Yield
          </span>
          <p className="text-2xl sm:text-3xl font-serif font-bold text-navy mt-1">
            7.8%
          </p>
          <span className="text-[11px] text-gold font-medium">
            Net investment yield
          </span>
        </div>
        <div className="w-12 h-12 rounded-xl bg-sand text-navy flex items-center justify-center">
          <TrendingUp className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

