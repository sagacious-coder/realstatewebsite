import React from 'react';
import { Briefcase, Building, ExternalLink, ShieldCheck } from 'lucide-react';
import { FIXTURE_DEVELOPERS } from '@wild-hills/contracts';

export default function AdminDevelopersPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Master Developers
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Directory of licensed developer partners undergoing escrow and milestone audits.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {FIXTURE_DEVELOPERS.map((dev) => (
          <div
            key={dev.id}
            className="p-6 rounded-2xl bg-white border border-line shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-sand border border-line flex items-center justify-center">
                  <Building className="w-6 h-6 text-navy" />
                </div>
                <div className="flex gap-1">
                  {dev.countryCodes.map((c) => (
                    <span
                      key={c}
                      className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-sand border border-line text-navy"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <h3 className="font-serif text-lg font-bold text-navy">{dev.name}</h3>
              <p className="mt-2 text-xs text-muted line-clamp-3 leading-relaxed">
                {dev.description}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-line flex items-center justify-between text-xs">
              <span className="font-semibold text-navy">
                {dev.projectCount} Projects · {dev.activeListingCount} Listings
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Audited</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

