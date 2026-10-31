'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Menu,
  ChevronRight,
  Globe,
  Bell,
  User,
  Shield,
  Coins,
} from 'lucide-react';
import { useAdminAuth } from '@/lib/auth';

interface HeaderProps {
  onOpenSidebar: () => void;
  selectedCountry?: string;
  onSelectCountry?: (country: string) => void;
}

export function Header({
  onOpenSidebar,
  selectedCountry = 'all',
  onSelectCountry,
}: HeaderProps) {
  const pathname = usePathname();
  const { user } = useAdminAuth();

  // Compute breadcrumb segments
  const segments = pathname.split('/').filter(Boolean);

  return (
    <header className="h-16 bg-white border-b border-line px-4 sm:px-6 flex items-center justify-between gap-4 sticky top-0 z-30 shadow-sm">
      <div className="flex items-center gap-3">
        {/* Mobile Sidebar Toggle */}
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-xl text-navy hover:bg-sand lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Dynamic Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="hover:text-navy transition-colors font-medium">
            Admin
          </Link>
          {segments.map((seg, i) => {
            const href = `/${segments.slice(0, i + 1).join('/')}`;
            const isLast = i === segments.length - 1;
            const formatted = seg.charAt(0).toUpperCase() + seg.slice(1);

            return (
              <React.Fragment key={href}>
                <ChevronRight className="w-3.5 h-3.5 text-muted/60" />
                {isLast ? (
                  <span className="font-semibold text-navy capitalize">{formatted}</span>
                ) : (
                  <Link href={href} className="hover:text-navy transition-colors capitalize">
                    {formatted}
                  </Link>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right Action Bar */}
      <div className="flex items-center gap-3 sm:gap-4">
        {/* Country Filter Quick Selector */}
        {onSelectCountry && (
          <div className="flex items-center gap-1.5 text-xs">
            <Globe className="w-3.5 h-3.5 text-muted hidden sm:block" />
            <select
              value={selectedCountry}
              onChange={(e) => onSelectCountry(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-sand/60 border border-line text-xs font-semibold text-navy focus:outline-none focus:ring-1 focus:ring-gold"
            >
              <option value="all">All Markets</option>
              <option value="ae">UAE (ae)</option>
              <option value="eg">Egypt (eg)</option>
              <option value="ge">Georgia (ge)</option>
              <option value="tr">Turkey (tr)</option>
            </select>
          </div>
        )}

        {/* Owner Profile Badge */}
        {user && (
          <div className="flex items-center gap-2.5 pl-3 border-l border-line">
            <div className="w-8 h-8 rounded-full bg-navy text-sand flex items-center justify-center font-bold text-xs">
              {user.name.charAt(0)}
            </div>
            <div className="hidden md:block text-left">
              <span className="text-xs font-bold text-navy block leading-none">
                {user.name}
              </span>
              <span className="text-[10px] text-gold font-semibold uppercase tracking-wider block mt-0.5">
                Super Admin
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

