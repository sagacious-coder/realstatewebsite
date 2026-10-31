import React from 'react';
import Link from 'next/link';
import {
  Plus,
  Users,
  Building2,
  Briefcase,
  MapPin,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { getAdminListings, getAdminDevelopers } from '@/lib/data';
import { MetricCards } from '@/components/dashboard/MetricCards';
import { RecentListingsWidget } from '@/components/dashboard/RecentListingsWidget';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const listings = await getAdminListings();
  const developers = await getAdminDevelopers();

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className="bg-navy text-sand rounded-3xl p-6 sm:p-10 relative overflow-hidden shadow-sm border border-line">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/20 text-gold border border-gold/30 text-xs font-semibold mb-4 tracking-wider uppercase">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Operational Command</span>
          </div>

          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Welcome back, Elena
          </h1>

          <p className="mt-2 text-xs sm:text-sm text-sand/80 leading-relaxed">
            Here is your daily portfolio overview across the UAE, Egypt, Georgia, and Turkey. 
            All escrow integrations and listing pipelines are operating normally.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link
              href="/listings/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-navy text-xs sm:text-sm font-bold hover:bg-gold/90 transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Create Listing</span>
            </Link>

            <Link
              href="/listings"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-white/20 text-sand hover:text-white hover:bg-white/10 text-xs sm:text-sm font-semibold transition-colors"
            >
              <Building2 className="w-4 h-4" />
              <span>Manage Directory</span>
            </Link>
          </div>
        </div>
      </div>

      {/* KPI Metrics Grid */}
      <MetricCards
        listingCount={listings.length}
        developerCount={developers.length}
      />

      {/* Main Grid: Recent Listings & Market Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentListingsWidget listings={listings} />
        </div>

        {/* Market Distribution Widget */}
        <div className="bg-white rounded-2xl border border-line p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="font-serif text-lg font-bold text-navy">Market Distribution</h3>
            <p className="text-xs text-muted mt-0.5">Active portfolio allocations by country</p>

            <div className="mt-6 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>United Arab Emirates</span>
                  <span className="text-gold font-bold">42%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-sand overflow-hidden">
                  <div className="h-full bg-navy rounded-full" style={{ width: '42%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Turkey (Istanbul & Antalya)</span>
                  <span className="text-gold font-bold">25%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-sand overflow-hidden">
                  <div className="h-full bg-gold rounded-full" style={{ width: '25%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Georgia (Batumi & Tbilisi)</span>
                  <span className="text-gold font-bold">18%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-sand overflow-hidden">
                  <div className="h-full bg-emerald-700 rounded-full" style={{ width: '18%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span>Egypt (Cairo & North Coast)</span>
                  <span className="text-gold font-bold">15%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-sand overflow-hidden">
                  <div className="h-full bg-amber-600 rounded-full" style={{ width: '15%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-line mt-6">
            <Link
              href="/locations"
              className="inline-flex items-center justify-between w-full text-xs font-semibold text-navy hover:text-gold transition-colors"
            >
              <span>Manage Regional Desks</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

