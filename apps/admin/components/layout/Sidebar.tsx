'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
  Inbox,
  Briefcase,
  MapPin,
  Settings,
  ShieldCheck,
  ExternalLink,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/', icon: LayoutDashboard },
  { label: 'Listings', href: '/listings', icon: Building2 },
  { label: 'Leads & Inquiries', href: '/leads', icon: Users },
  { label: 'Seller Submissions', href: '/submissions', icon: Inbox },
  { label: 'Developers', href: '/developers', icon: Briefcase },
  { label: 'Locations', href: '/locations', icon: MapPin },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-navy text-sand flex flex-col justify-between border-r border-navy-light/40 transition-transform duration-300 ease-in-out lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div>
          {/* Brand Header */}
          <div className="h-16 px-6 flex items-center justify-between border-b border-white/10">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gold/20 border border-gold/40 flex items-center justify-center text-gold font-serif font-bold text-lg">
                W
              </div>
              <div>
                <span className="font-serif text-base font-bold text-white tracking-wide block">
                  Wild Hills
                </span>
                <span className="text-[10px] uppercase font-semibold text-gold tracking-widest block -mt-0.5">
                  Admin Portal
                </span>
              </div>
            </Link>

            <button
              onClick={onClose}
              className="p-1 rounded-lg text-sand/60 hover:text-white lg:hidden"
              aria-label="Close navigation"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="p-4 space-y-1.5">
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const isActive =
                item.href === '/'
                  ? pathname === '/'
                  : pathname === item.href || pathname.startsWith(`${item.href}/`);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => onClose()}
                  className={cn(
                    'flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-gold text-navy font-bold shadow-sm'
                      : 'text-sand/70 hover:text-white hover:bg-white/5'
                  )}
                >
                  <Icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-navy' : 'text-gold')} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / System Status */}
        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
              <ShieldCheck className="w-4 h-4 shrink-0" />
              <span>Contract v1 · Mock Mode</span>
            </div>
            <p className="mt-1 text-[11px] text-sand/60">
              Fastify Backend parity ready
            </p>
          </div>

          <a
            href="http://localhost:3000"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 rounded-lg text-xs text-sand/70 hover:text-white hover:bg-white/5 transition-colors"
          >
            <span>View Public Site</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </aside>
    </>
  );
}

