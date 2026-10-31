import React from 'react';
import { MapPin, Building2, CheckCircle2 } from 'lucide-react';
import { FIXTURE_LOCATIONS } from '@wild-hills/contracts';

export default function AdminLocationsPage() {
  const cities = FIXTURE_LOCATIONS.filter((l) => l.type === 'city');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          Locations & Geographic Desks
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Regional coverage across UAE, Egypt, Georgia, and Turkey.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {cities.map((loc) => (
          <div
            key={loc.id}
            className="p-6 rounded-2xl bg-white border border-line shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-sand border border-line text-navy">
                  {loc.countryCode.toUpperCase()}
                </span>
                <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Active Desk</span>
                </span>
              </div>

              <h3 className="font-serif text-lg font-bold text-navy">{loc.name}</h3>
              {loc.description && (
                <p className="mt-2 text-xs text-muted line-clamp-3 leading-relaxed">
                  {loc.description}
                </p>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-line flex items-center justify-between text-xs">
              <span className="text-muted font-mono">
                {loc.coordinates?.lat.toFixed(4)}, {loc.coordinates?.lng.toFixed(4)}
              </span>
              <span className="font-bold text-navy">
                {loc.listingCount} Properties
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

