'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Filter,
  MoreVertical,
  ExternalLink,
  Edit,
  Copy,
  Trash2,
  Archive,
  ArrowUpDown,
  Building2,
  CheckSquare,
  Square,
  Sparkles,
} from 'lucide-react';
import {
  ListingSummary,
  CountryCode,
  PropertyType,
  PropertyStatus,
} from '@wild-hills/contracts';
import {
  getAdminListings,
  deleteAdminListing,
  duplicateAdminListing,
} from '@/lib/data';
import { formatPrice, cn } from '@/lib/utils';
import { DeleteListingDialog } from './DeleteListingDialog';

export function ListingsTable() {
  const [listings, setListings] = useState<ListingSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search & filter state
  const [search, setSearch] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Selected IDs for bulk actions
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Delete modal state
  const [deletingListing, setDeletingListing] = useState<ListingSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Active action menu row ID
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const loadListings = React.useCallback(async () => {
    setIsLoading(true);
    const data = await getAdminListings({
      country: selectedCountry !== 'all' ? (selectedCountry as CountryCode) : undefined,
      type: selectedType !== 'all' ? selectedType : undefined,
      status: selectedStatus !== 'all' ? selectedStatus : undefined,
      search,
      sort: sortBy,
    });
    setListings(data);
    setIsLoading(false);
  }, [selectedCountry, selectedType, selectedStatus, search, sortBy]);

  useEffect(() => {
    loadListings();
  }, [loadListings]);

  // Bulk selection toggles
  const handleSelectAll = () => {
    if (selectedIds.length === listings.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(listings.map((l) => l.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Actions
  const handleDuplicate = async (id: string) => {
    await duplicateAdminListing(id);
    setActiveMenuId(null);
    await loadListings();
  };

  const handleDeleteConfirm = async () => {
    if (!deletingListing) return;
    setIsDeleting(true);
    await deleteAdminListing(deletingListing.id);
    setIsDeleting(false);
    setDeletingListing(null);
    setActiveMenuId(null);
    await loadListings();
  };

  const getStatusBadge = (status: PropertyStatus | string) => {
    switch (status) {
      case 'ready':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            Ready
          </span>
        );
      case 'off_plan':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
            Off-Plan
          </span>
        );
      case 'under_construction':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-200">
            Building
          </span>
        );
      case 'draft':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-gray-100 text-gray-700 border border-gray-200">
            Draft
          </span>
        );
      case 'sold':
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-purple-100 text-purple-800 border border-purple-200">
            Sold
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-sand text-navy border border-line">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Search Bar */}
      <div className="bg-white rounded-2xl border border-line p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search by title, ref code, or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-sand/60 border border-line text-xs sm:text-sm text-navy focus:outline-none focus:ring-1 focus:ring-gold"
            />
          </div>

          {/* New Listing Button */}
          <Link
            href="/listings/new"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gold text-navy font-bold text-xs sm:text-sm hover:bg-gold/90 shadow-sm transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>New Listing</span>
          </Link>
        </div>

        {/* Filter & Sort Controls */}
        <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-line text-xs">
          <div className="flex items-center gap-2">
            <span className="text-muted font-medium">Market:</span>
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-sand/60 border border-line font-medium text-navy focus:outline-none"
            >
              <option value="all">All Markets</option>
              <option value="ae">UAE (ae)</option>
              <option value="eg">Egypt (eg)</option>
              <option value="ge">Georgia (ge)</option>
              <option value="tr">Turkey (tr)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted font-medium">Type:</span>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-sand/60 border border-line font-medium text-navy focus:outline-none capitalize"
            >
              <option value="all">All Types</option>
              <option value="apartment">Apartment</option>
              <option value="villa">Villa</option>
              <option value="townhouse">Townhouse</option>
              <option value="penthouse">Penthouse</option>
              <option value="duplex">Duplex</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-muted font-medium">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-sand/60 border border-line font-medium text-navy focus:outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="ready">Ready</option>
              <option value="off_plan">Off-Plan</option>
              <option value="under_construction">Building</option>
              <option value="draft">Draft</option>
            </select>
          </div>

          <div className="flex items-center gap-2 ml-auto">
            <ArrowUpDown className="w-3.5 h-3.5 text-muted" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg bg-sand/60 border border-line font-medium text-navy focus:outline-none"
            >
              <option value="newest">Newest First</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="ref">Ref Number</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Action Bar (when items selected) */}
      {selectedIds.length > 0 && (
        <div className="bg-navy text-sand p-3.5 rounded-xl flex items-center justify-between gap-4 text-xs shadow-md animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-gold" />
            <span className="font-semibold">{selectedIds.length} properties selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 rounded-lg border border-white/20 text-sand hover:text-white"
            >
              Deselect All
            </button>
            <button
              onClick={() => {
                alert(`Published ${selectedIds.length} listings`);
                setSelectedIds([]);
              }}
              className="px-3 py-1.5 rounded-lg bg-gold text-navy font-bold hover:bg-gold/90"
            >
              Publish Selected
            </button>
          </div>
        </div>
      )}

      {/* Data Table Container */}
      <div className="bg-white rounded-2xl border border-line overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-sand/70 border-b border-line text-muted uppercase text-[11px] font-semibold tracking-wider">
              <tr>
                <th className="p-4 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={listings.length > 0 && selectedIds.length === listings.length}
                    onChange={handleSelectAll}
                    className="rounded border-line text-gold focus:ring-gold cursor-pointer"
                  />
                </th>
                <th className="p-4 w-16">Photo</th>
                <th className="p-4">Ref Code</th>
                <th className="p-4 min-w-[200px]">Property Title</th>
                <th className="p-4">Location</th>
                <th className="p-4">Type</th>
                <th className="p-4">Asking Price</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {isLoading ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-muted">
                    Loading property listings...
                  </td>
                </tr>
              ) : listings.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center">
                    <Building2 className="w-10 h-10 text-muted/40 mx-auto mb-3" />
                    <p className="font-serif text-base font-bold text-navy">No listings match your filter</p>
                    <p className="text-xs text-muted mt-1">Try resetting filters or adding a new listing.</p>
                  </td>
                </tr>
              ) : (
                listings.map((item) => {
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <tr
                      key={item.id}
                      className={cn(
                        'hover:bg-sand/30 transition-colors',
                        isSelected ? 'bg-gold/5' : ''
                      )}
                    >
                      {/* Checkbox */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(item.id)}
                          className="rounded border-line text-gold focus:ring-gold cursor-pointer"
                        />
                      </td>

                      {/* Thumbnail */}
                      <td className="p-4">
                        <div className="w-12 h-10 rounded-lg overflow-hidden bg-sand border border-line shrink-0">
                          <img
                            src={item.coverImage || '/images/defaults/apartment/cover-card.webp'}
                            alt={item.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>

                      {/* Ref Number */}
                      <td className="p-4 font-mono font-bold text-navy">
                        {item.refNumber}
                      </td>

                      {/* Title */}
                      <td className="p-4 font-medium text-navy">
                        <Link
                          href={`/listings/${item.id}/edit`}
                          className="hover:text-gold transition-colors block line-clamp-1"
                        >
                          {item.title}
                        </Link>
                        {item.developer?.name && (
                          <span className="text-[11px] text-muted block mt-0.5">
                            by {item.developer.name}
                          </span>
                        )}
                      </td>

                      {/* Location */}
                      <td className="p-4 whitespace-nowrap">
                        <span className="font-medium text-navy">{item.location.city}</span>
                        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-sand ml-1.5 border border-line text-navy/70">
                          {item.location.countryCode}
                        </span>
                      </td>

                      {/* Property Type */}
                      <td className="p-4 capitalize text-navy/90 whitespace-nowrap">
                        {item.propertyType}
                      </td>

                      {/* Price */}
                      <td className="p-4 font-bold text-navy whitespace-nowrap">
                        {formatPrice(item.priceMinor, item.currency)}
                      </td>

                      {/* Status */}
                      <td className="p-4 whitespace-nowrap">
                        {getStatusBadge(item.status)}
                      </td>

                      {/* Action Menu */}
                      <td className="p-4 text-right relative whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/listings/${item.id}/edit`}
                            className="p-1.5 rounded-lg text-navy hover:bg-sand transition-colors"
                            title="Edit Listing"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>

                          <button
                            onClick={() => handleDuplicate(item.id)}
                            className="p-1.5 rounded-lg text-navy hover:bg-sand transition-colors"
                            title="Duplicate Listing"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          <a
                            href={`http://localhost:3000/en/${item.location.countryCode}/buy/${item.slug}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-navy hover:bg-sand transition-colors"
                            title="View on Public Site"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>

                          <button
                            onClick={() => setDeletingListing(item)}
                            className="p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                            title="Delete Listing"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <DeleteListingDialog
        isOpen={Boolean(deletingListing)}
        listingTitle={deletingListing?.title || ''}
        isDeleting={isDeleting}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeletingListing(null)}
      />
    </div>
  );
}
