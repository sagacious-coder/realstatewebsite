'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Building2,
  CheckCircle2,
  Search,
  Filter,
  Edit2,
  X,
  Save,
  Tag,
  Star,
  Globe,
} from 'lucide-react';
import { type Location, type CountryCode, LocationSchema } from '@wild-hills/contracts';
import { getAdminLocations, saveAdminLocation } from '@/lib/data';

export default function AdminLocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [editingLoc, setEditingLoc] = useState<Location | null>(null);
  const [editTagLabel, setEditTagLabel] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsFeatured, setEditIsFeatured] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    async function loadLocs() {
      setLoading(true);
      try {
        const data = await getAdminLocations();
        setLocations(data);
      } catch (err) {
        console.error('Failed to load locations:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLocs();
  }, []);

  const filteredLocations = useMemo(() => {
    return locations.filter((loc) => {
      if (countryFilter !== 'all' && loc.countryCode !== countryFilter) return false;
      if (typeFilter !== 'all' && loc.type !== typeFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        return (
          loc.name.toLowerCase().includes(q) ||
          loc.slug.toLowerCase().includes(q) ||
          (loc.description && loc.description.toLowerCase().includes(q)) ||
          (loc.tagLabel && loc.tagLabel.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [locations, countryFilter, typeFilter, searchQuery]);

  const openEditModal = (loc: Location) => {
    setEditingLoc(loc);
    setEditTagLabel(loc.tagLabel || '');
    setEditDescription(loc.description || '');
    setEditIsFeatured(loc.isFeatured || false);
    setSaveSuccess(false);
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLoc) return;

    setIsSaving(true);
    try {
      const updated: Location = {
        ...editingLoc,
        tagLabel: editTagLabel.trim() || null,
        description: editDescription.trim() || null,
        isFeatured: editIsFeatured,
      };

      LocationSchema.parse(updated);
      await saveAdminLocation(updated);
      setLocations((prev) => prev.map((l) => (l.id === updated.id ? updated : l)));
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setEditingLoc(null);
      }, 1000);
    } catch (err) {
      console.error('Failed to save location updates:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          Locations & Geographic Desks
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Regional coverage, city hubs, luxury districts, and investment yield metadata across UAE, Turkey, Georgia, and Egypt.
        </p>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-line shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search location by name, area, tag..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-line bg-sand/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={countryFilter}
            onChange={(e) => setCountryFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-line bg-white text-navy focus:outline-none focus:ring-2 focus:ring-gold/50"
          >
            <option value="all">All Markets</option>
            <option value="ae">United Arab Emirates (AE)</option>
            <option value="tr">Turkey (TR)</option>
            <option value="ge">Georgia (GE)</option>
            <option value="eg">Egypt (EG)</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-line bg-white text-navy focus:outline-none focus:ring-2 focus:ring-gold/50"
          >
            <option value="all">All Types</option>
            <option value="city">Cities & Metropolitan</option>
            <option value="area">Districts & Areas</option>
          </select>
        </div>
      </div>

      {/* Locations Grid */}
      {loading ? (
        <div className="p-12 text-center text-sm text-muted">Loading locations directory...</div>
      ) : filteredLocations.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted">No locations match your filters.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLocations.map((loc) => (
            <div
              key={loc.id}
              className="p-6 rounded-2xl bg-white border border-line shadow-sm flex flex-col justify-between hover:border-gold/50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-sand border border-line text-navy">
                      {loc.countryCode.toUpperCase()}
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-sand/60 text-muted">
                      {loc.type}
                    </span>
                    {loc.isFeatured && (
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-gold/20 text-navy border border-gold/40 flex items-center gap-1">
                        <Star className="w-2.5 h-2.5 fill-gold text-gold" />
                        <span>Featured</span>
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => openEditModal(loc)}
                    className="p-1.5 rounded-lg text-muted hover:text-navy hover:bg-sand/60 transition-colors"
                    title="Edit Location Settings"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <h3 className="font-serif text-lg font-bold text-navy flex items-center justify-between">
                  <span>{loc.name}</span>
                </h3>

                {loc.tagLabel && (
                  <div className="mt-1">
                    <span className="text-[11px] font-semibold text-gold-dark bg-gold/10 px-2 py-0.5 rounded border border-gold/20">
                      {loc.tagLabel}
                    </span>
                  </div>
                )}

                {loc.description && (
                  <p className="mt-2.5 text-xs text-muted line-clamp-3 leading-relaxed">
                    {loc.description}
                  </p>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-line flex items-center justify-between text-xs">
                <span className="text-muted font-mono text-[11px]">
                  {loc.coordinates?.lat.toFixed(4)}, {loc.coordinates?.lng.toFixed(4)}
                </span>
                <span className="font-bold text-navy">
                  {loc.listingCount} Properties
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingLoc && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity"
          onClick={() => setEditingLoc(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-line shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-line flex items-center justify-between bg-sand/30">
              <div className="flex items-center gap-2.5">
                <MapPin className="w-5 h-5 text-gold" />
                <h3 className="font-serif text-lg font-bold text-navy">
                  Edit Location: {editingLoc.name}
                </h3>
              </div>
              <button
                onClick={() => setEditingLoc(null)}
                className="p-1 rounded-lg text-muted hover:text-navy hover:bg-sand/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLocation} className="p-6 space-y-4 text-xs sm:text-sm">
              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Location details updated successfully!</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-navy block mb-1">
                  Tag Label / Investment Highlight
                </label>
                <input
                  type="text"
                  placeholder="e.g. Prime Marina, 8.5% Net Yield, Beachfront Haven"
                  value={editTagLabel}
                  onChange={(e) => setEditTagLabel(e.target.value)}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-line focus:outline-none focus:ring-2 focus:ring-gold/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-navy block mb-1">
                  District & Lifestyle Overview
                </label>
                <textarea
                  rows={4}
                  placeholder="Editorial guide to transport, lifestyle, infrastructure, rental demand..."
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border border-line focus:outline-none focus:ring-2 focus:ring-gold/50 leading-relaxed"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="featuredToggle"
                  checked={editIsFeatured}
                  onChange={(e) => setEditIsFeatured(e.target.checked)}
                  className="w-4 h-4 rounded text-gold focus:ring-gold border-line"
                />
                <label htmlFor="featuredToggle" className="text-xs font-semibold text-navy cursor-pointer">
                  Feature this location on country homepage and directory pins
                </label>
              </div>

              <div className="pt-4 border-t border-line flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingLoc(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-line bg-white hover:bg-sand/40 text-navy"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-gold text-navy hover:bg-gold-light transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
