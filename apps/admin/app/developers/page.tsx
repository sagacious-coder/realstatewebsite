'use client';

import React, { useState, useEffect } from 'react';
import {
  Briefcase,
  Building,
  ExternalLink,
  ShieldCheck,
  Plus,
  X,
  CheckCircle2,
  Search,
  Globe,
} from 'lucide-react';
import { type Developer, type CountryCode, DeveloperSchema } from '@wild-hills/contracts';
import { getAdminDevelopers, saveAdminDeveloper } from '@/lib/data';

export default function AdminDevelopersPage() {
  const [developers, setDevelopers] = useState<Developer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // New developer form state
  const [newName, setNewName] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newWebsite, setNewWebsite] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newCountries, setNewCountries] = useState<CountryCode[]>(['ae']);
  const [newLogo, setNewLogo] = useState('/images/defaults/apartment/cover-card.webp');

  useEffect(() => {
    async function loadDevelopers() {
      setLoading(true);
      try {
        const data = await getAdminDevelopers();
        setDevelopers(data);
      } catch (err) {
        console.error('Failed to load developers:', err);
      } finally {
        setLoading(false);
      }
    }
    loadDevelopers();
  }, []);

  const handleCountryToggle = (code: CountryCode) => {
    if (newCountries.includes(code)) {
      if (newCountries.length > 1) {
        setNewCountries(newCountries.filter((c) => c !== code));
      }
    } else {
      setNewCountries([...newCountries, code]);
    }
  };

  const handleCreateDeveloper = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!newName.trim()) {
      setFormError('Developer name is required');
      return;
    }

    const slug = newSlug.trim() || newName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const id = `dev-${slug}`;

    const devData: Developer = {
      id,
      slug,
      name: newName.trim(),
      logo: newLogo || '/images/defaults/apartment/cover-card.webp',
      countryCodes: newCountries,
      websiteUrl: newWebsite.trim() ? newWebsite.trim() : null,
      description: newDescription.trim(),
      projectCount: 0,
      activeListingCount: 0,
      isFeatured: false,
    };

    setIsSaving(true);
    try {
      // Validate schema
      DeveloperSchema.parse(devData);
      const saved = await saveAdminDeveloper(devData);
      setDevelopers((prev) => [saved, ...prev]);
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        setIsModalOpen(false);
        setNewName('');
        setNewSlug('');
        setNewWebsite('');
        setNewDescription('');
        setNewCountries(['ae']);
      }, 1200);
    } catch (err: any) {
      console.error('Error saving developer:', err);
      setFormError(err.message || 'Failed to save developer. Please check input formats.');
    } finally {
      setIsSaving(false);
    }
  };

  const filtered = developers.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      d.name.toLowerCase().includes(q) ||
      d.description.toLowerCase().includes(q) ||
      d.countryCodes.some((c) => c.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Master Developers
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Directory of licensed developer partners undergoing escrow verification and milestone audits.
          </p>
        </div>

        <button
          onClick={() => {
            setFormError(null);
            setIsModalOpen(true);
          }}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-sand hover:bg-navy-light text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4 text-gold" />
          <span>Add Developer</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-line shadow-sm flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search developers by name, country..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm rounded-xl border border-line bg-sand/20 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gold/50"
          />
        </div>
        <span className="text-xs text-muted hidden sm:inline">
          {filtered.length} Registered Partners
        </span>
      </div>

      {/* Developers Grid */}
      {loading ? (
        <div className="p-12 text-center text-sm text-muted">Loading developers directory...</div>
      ) : filtered.length === 0 ? (
        <div className="p-12 text-center text-sm text-muted">No developers found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((dev) => (
            <div
              key={dev.id}
              className="p-6 rounded-2xl bg-white border border-line shadow-sm flex flex-col justify-between hover:border-gold/50 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-sand border border-line flex items-center justify-center overflow-hidden">
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
                  {dev.description || 'Verified luxury master developer partner.'}
                </p>

                {dev.websiteUrl && (
                  <a
                    href={dev.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 mt-3 text-xs text-gold-dark hover:underline font-medium"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Official Portal</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="mt-6 pt-4 border-t border-line flex items-center justify-between text-xs">
                <span className="font-semibold text-navy">
                  {dev.projectCount} Projects · {dev.activeListingCount} Listings
                </span>
                <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Escrow Audited</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Developer Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-line shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-line flex items-center justify-between bg-sand/30">
              <div className="flex items-center gap-2.5">
                <Building className="w-5 h-5 text-gold" />
                <h3 className="font-serif text-lg font-bold text-navy">Register New Developer</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-muted hover:text-navy hover:bg-sand/60"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDeveloper} className="p-6 space-y-4 text-xs sm:text-sm">
              {formError && (
                <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
                  {formError}
                </div>
              )}

              {saveSuccess && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Developer partner added successfully!</span>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-navy block mb-1">Developer Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emaar Properties, Palm Hills"
                  value={newName}
                  onChange={(e) => {
                    setNewName(e.target.value);
                    if (!newSlug) {
                      setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }
                  }}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-line focus:outline-none focus:ring-2 focus:ring-gold/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-navy block mb-1">Slug Identifier</label>
                  <input
                    type="text"
                    placeholder="e.g. emaar-properties"
                    value={newSlug}
                    onChange={(e) => setNewSlug(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-line font-mono focus:outline-none focus:ring-2 focus:ring-gold/50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-navy block mb-1">Official Website</label>
                  <input
                    type="url"
                    placeholder="https://example.com"
                    value={newWebsite}
                    onChange={(e) => setNewWebsite(e.target.value)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-line focus:outline-none focus:ring-2 focus:ring-gold/50"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-navy block mb-1.5">Operating Markets</label>
                <div className="flex gap-2">
                  {(['ae', 'tr', 'ge', 'eg'] as CountryCode[]).map((c) => {
                    const isSelected = newCountries.includes(c);
                    return (
                      <button
                        type="button"
                        key={c}
                        onClick={() => handleCountryToggle(c)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors border ${
                          isSelected
                            ? 'bg-navy text-sand border-navy'
                            : 'bg-sand/40 text-navy border-line hover:bg-sand'
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-navy block mb-1">Company Overview</label>
                <textarea
                  rows={3}
                  placeholder="Summary of developer track record, escrow compliance, flagship projects..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-3 text-xs sm:text-sm rounded-xl border border-line focus:outline-none focus:ring-2 focus:ring-gold/50"
                />
              </div>

              <div className="pt-4 border-t border-line flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-line bg-white hover:bg-sand/40 text-navy"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-gold text-navy hover:bg-gold-light transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : 'Register Developer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
