'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Inbox,
  Search,
  Download,
  Filter,
  Phone,
  Mail,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  X,
  FileText,
  Building,
  Calendar,
  ChevronRight,
  ArrowRight,
  Bed,
  Bath,
  Maximize2,
  DollarSign,
  Image as ImageIcon,
} from 'lucide-react';
import {
  type SubmissionRecord,
  type SubmissionStatus,
  type CountryCode,
  fromMinorUnits,
} from '@wild-hills/contracts';
import { getAdminSubmissions, updateAdminSubmissionStatus } from '@/lib/data';

const SUBMISSION_STATUS_LABELS: Record<SubmissionStatus, string> = {
  pending_review: 'Pending Review',
  reviewing: 'Reviewing',
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  converted_to_draft: 'Converted to Draft',
  archived: 'Archived',
};

const SUBMISSION_STATUS_COLORS: Record<SubmissionStatus, { bg: string; text: string; border: string }> = {
  pending_review: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  reviewing: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  approved: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  rejected: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  converted_to_draft: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  archived: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
};

/**
 * Formula Injection Protection (RFC 4180 + Excel/Calc CSV Neutralization)
 * Prepends a single-quote (') if the value begins with =, +, -, or @
 */
function sanitizeCsvValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  let str = String(val).trim();
  if (/^[=+\-@]/.test(str)) {
    str = `'${str}`;
  }
  if (/[",\n\r]/.test(str)) {
    str = `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export default function SubmissionsPage() {
  const router = useRouter();
  const [submissions, setSubmissions] = useState<SubmissionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedSub, setSelectedSub] = useState<SubmissionRecord | null>(null);
  const [statusActionLoading, setStatusActionLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    async function fetchSubmissions() {
      setLoading(true);
      try {
        const data = await getAdminSubmissions();
        setSubmissions(data);
      } catch (err) {
        console.error('Failed to load submissions:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchSubmissions();
  }, []);

  const filteredSubmissions = useMemo(() => {
    return submissions.filter((s) => {
      if (countryFilter !== 'all' && s.countryCode !== countryFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = s.sellerName.toLowerCase().includes(q);
        const matchesEmail = s.sellerEmail.toLowerCase().includes(q);
        const matchesPhone = s.sellerPhone.toLowerCase().includes(q);
        const matchesCity = s.city.toLowerCase().includes(q);
        const matchesArea = s.area?.toLowerCase().includes(q);
        const matchesType = s.propertyType.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesCity && !matchesArea && !matchesType) {
          return false;
        }
      }
      return true;
    });
  }, [submissions, countryFilter, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: submissions.length,
      pending: submissions.filter((s) => s.status === 'pending_review' || s.status === 'pending').length,
      approved: submissions.filter((s) => s.status === 'approved').length,
      converted: submissions.filter((s) => s.status === 'converted_to_draft').length,
    };
  }, [submissions]);

  const handleUpdateStatus = async (status: SubmissionStatus) => {
    if (!selectedSub) return;
    setStatusActionLoading(true);
    try {
      await updateAdminSubmissionStatus(selectedSub.id, status);
      setSubmissions((prev) =>
        prev.map((s) =>
          s.id === selectedSub.id
            ? { ...s, status, updatedAt: new Date().toISOString() }
            : s
        )
      );
      setSelectedSub((prev) => (prev ? { ...prev, status } : null));
      setToastMessage(`Status updated to ${SUBMISSION_STATUS_LABELS[status] || status}`);
      setTimeout(() => setToastMessage(null), 3000);
    } catch (err) {
      console.error('Failed to update submission status:', err);
    } finally {
      setStatusActionLoading(false);
    }
  };

  const handleConvertToDraft = async () => {
    if (!selectedSub) return;
    // Mark as converted
    await handleUpdateStatus('converted_to_draft');

    // Build URL query params to pre-fill listing form
    const priceFormatted = (selectedSub.expectedPriceMinor / 100).toString();
    const query = new URLSearchParams({
      title: `${selectedSub.bedrooms} Bed ${selectedSub.propertyType.charAt(0).toUpperCase() + selectedSub.propertyType.slice(1)} in ${selectedSub.city}`,
      city: selectedSub.city,
      area: selectedSub.area || selectedSub.city,
      country: selectedSub.countryCode,
      type: selectedSub.propertyType,
      price: priceFormatted,
      beds: selectedSub.bedrooms.toString(),
      baths: selectedSub.bathrooms.toString(),
      size: selectedSub.sizeSqm.toString(),
      desc: selectedSub.description || '',
    });

    router.push(`/listings/new?${query.toString()}`);
  };

  const handleExportCsv = () => {
    if (submissions.length === 0) return;

    const headers = [
      'Submission ID',
      'Date Submitted',
      'Seller Name',
      'Seller Email',
      'Seller Phone',
      'Country',
      'City',
      'Area',
      'Property Type',
      'Bedrooms',
      'Bathrooms',
      'Size Sqm',
      'Expected Price',
      'Currency',
      'Status',
      'Description',
      'Private Notes',
    ];

    const rows = filteredSubmissions.map((s) => [
      sanitizeCsvValue(s.id),
      sanitizeCsvValue(s.createdAt),
      sanitizeCsvValue(s.sellerName),
      sanitizeCsvValue(s.sellerEmail),
      sanitizeCsvValue(s.sellerPhone),
      sanitizeCsvValue(s.countryCode.toUpperCase()),
      sanitizeCsvValue(s.city),
      sanitizeCsvValue(s.area || ''),
      sanitizeCsvValue(s.propertyType),
      sanitizeCsvValue(s.bedrooms),
      sanitizeCsvValue(s.bathrooms),
      sanitizeCsvValue(s.sizeSqm),
      sanitizeCsvValue(s.expectedPriceMinor / 100),
      sanitizeCsvValue(s.currency),
      sanitizeCsvValue(SUBMISSION_STATUS_LABELS[s.status as SubmissionStatus] || s.status),
      sanitizeCsvValue(s.description || ''),
      sanitizeCsvValue(s.notes || ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `wild-hills-seller-submissions-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Seller Submissions Inbox
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Review property listings submitted by private owners and asset managers via the Sell With Us portal.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={submissions.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-sand hover:bg-navy-light text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-gold" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-line shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Total Submissions</span>
            <Inbox className="w-4 h-4 text-navy/40" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-navy">{stats.total}</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-line shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Pending Review</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-amber-700">{stats.pending}</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-line shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Approved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-emerald-700">{stats.approved}</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-line shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Drafts Converted</span>
            <Building className="w-4 h-4 text-purple-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-purple-700">{stats.converted}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-line shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search seller, city, type, or phone..."
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
            <option value="ae">UAE</option>
            <option value="tr">Turkey</option>
            <option value="ge">Georgia</option>
            <option value="eg">Egypt</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-line bg-white text-navy focus:outline-none focus:ring-2 focus:ring-gold/50"
          >
            <option value="all">All Statuses</option>
            <option value="pending_review">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="converted_to_draft">Converted to Draft</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-white rounded-2xl border border-line overflow-hidden shadow-sm">
        <div className="p-4 border-b border-line flex items-center justify-between bg-sand/20">
          <span className="text-xs font-bold text-navy uppercase tracking-wider">
            Showing {filteredSubmissions.length} of {submissions.length} Submissions
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-muted">Loading submissions...</div>
        ) : filteredSubmissions.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted">
            No seller submissions match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-line bg-sand/10 text-muted font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Owner / Seller</th>
                  <th className="py-3 px-4">Location</th>
                  <th className="py-3 px-4">Property Specs</th>
                  <th className="py-3 px-4">Asking Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredSubmissions.map((sub) => {
                  const statusStyle =
                    SUBMISSION_STATUS_COLORS[sub.status as SubmissionStatus] || SUBMISSION_STATUS_COLORS.pending_review;

                  return (
                    <tr
                      key={sub.id}
                      onClick={() => setSelectedSub(sub)}
                      className="hover:bg-sand/30 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-navy text-sand flex items-center justify-center font-bold text-xs shrink-0">
                            {sub.sellerName.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-navy hover:underline">{sub.sellerName}</div>
                            <div className="text-[11px] text-muted font-mono">{sub.sellerEmail}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-sand border border-line text-navy">
                            {sub.countryCode}
                          </span>
                          <span className="font-semibold text-navy">{sub.city}</span>
                          {sub.area && <span className="text-muted text-xs">({sub.area})</span>}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 text-navy font-medium">
                          <span className="capitalize font-bold">{sub.propertyType}</span>
                          <span className="text-muted">·</span>
                          <span>{sub.bedrooms} Beds</span>
                          <span className="text-muted">·</span>
                          <span>{sub.sizeSqm} sqm</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-bold text-navy whitespace-nowrap">
                        {sub.currency} {(sub.expectedPriceMinor / 100).toLocaleString()}
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                        >
                          {SUBMISSION_STATUS_LABELS[sub.status as SubmissionStatus] || sub.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-muted text-xs whitespace-nowrap">
                        {new Date(sub.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSub(sub);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-navy rounded-lg border border-line bg-sand/40 hover:bg-sand transition-colors"
                        >
                          Review
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {selectedSub && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 transition-opacity"
          onClick={() => setSelectedSub(null)}
        >
          <div
            className="w-full max-w-2xl bg-white rounded-2xl border border-line shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-line flex items-center justify-between bg-sand/30">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-lg font-bold text-navy">
                    {selectedSub.bedrooms} Bed {selectedSub.propertyType.toUpperCase()} in {selectedSub.city}
                  </h3>
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-sand border border-line text-navy">
                    {selectedSub.countryCode}
                  </span>
                </div>
                <span className="text-xs text-muted font-mono">Submission Ref: {selectedSub.id}</span>
              </div>

              <button
                onClick={() => setSelectedSub(null)}
                className="p-1.5 rounded-lg text-muted hover:text-navy hover:bg-sand/60 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1 text-xs sm:text-sm">
              {toastMessage && (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>{toastMessage}</span>
                </div>
              )}

              {/* Owner Contacts */}
              <div className="p-4 rounded-xl bg-sand/20 border border-line space-y-3">
                <span className="text-[11px] uppercase font-bold text-muted block">Seller Information</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-muted block text-[11px]">Seller Name</span>
                    <strong className="text-navy">{selectedSub.sellerName}</strong>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Email</span>
                    <a href={`mailto:${selectedSub.sellerEmail}`} className="text-navy font-semibold hover:underline">
                      {selectedSub.sellerEmail}
                    </a>
                  </div>
                  <div>
                    <span className="text-muted block text-[11px]">Phone / WhatsApp</span>
                    <a
                      href={`https://wa.me/${selectedSub.sellerPhone.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-700 font-semibold hover:underline flex items-center gap-1"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>{selectedSub.sellerPhone}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Property Details Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-xl bg-sand/10 border border-line">
                  <span className="text-muted block text-[11px]">Property Type</span>
                  <strong className="capitalize text-navy">{selectedSub.propertyType}</strong>
                </div>

                <div className="p-3 rounded-xl bg-sand/10 border border-line">
                  <span className="text-muted block text-[11px]">Bedrooms & Baths</span>
                  <strong className="text-navy">{selectedSub.bedrooms} Beds · {selectedSub.bathrooms} Baths</strong>
                </div>

                <div className="p-3 rounded-xl bg-sand/10 border border-line">
                  <span className="text-muted block text-[11px]">Size Area</span>
                  <strong className="text-navy">{selectedSub.sizeSqm} sqm</strong>
                </div>

                <div className="p-3 rounded-xl bg-sand/10 border border-line">
                  <span className="text-muted block text-[11px]">Asking Price</span>
                  <strong className="text-navy text-sm font-serif">
                    {selectedSub.currency} {(selectedSub.expectedPriceMinor / 100).toLocaleString()}
                  </strong>
                </div>
              </div>

              {/* Property Description */}
              {selectedSub.description && (
                <div className="space-y-1">
                  <span className="text-[11px] uppercase font-bold text-muted block">Owner Description</span>
                  <div className="p-3 rounded-xl bg-sand/10 border border-line text-navy/90 leading-relaxed">
                    {selectedSub.description}
                  </div>
                </div>
              )}

              {/* Private Seller Notes */}
              {selectedSub.notes && (
                <div className="space-y-1">
                  <span className="text-[11px] uppercase font-bold text-muted block">Internal / Private Notes</span>
                  <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 text-amber-900 leading-relaxed">
                    {selectedSub.notes}
                  </div>
                </div>
              )}

              {/* Attached Photos */}
              {selectedSub.images && selectedSub.images.length > 0 && (
                <div className="space-y-2">
                  <span className="text-[11px] uppercase font-bold text-muted block">
                    Uploaded Photos ({selectedSub.images.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {selectedSub.images.map((img, idx) => (
                      <div key={idx} className="relative aspect-video rounded-lg overflow-hidden border border-line bg-sand">
                        <img src={img} alt={`Submission photo ${idx + 1}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with Actions */}
            <div className="p-4 border-t border-line bg-sand/20 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-xs text-muted">Status:</span>
                <span className="text-xs font-bold text-navy uppercase">{selectedSub.status}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
                {selectedSub.status !== 'approved' && (
                  <button
                    onClick={() => handleUpdateStatus('approved')}
                    disabled={statusActionLoading}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100 transition-colors"
                  >
                    Approve
                  </button>
                )}

                {selectedSub.status !== 'rejected' && (
                  <button
                    onClick={() => handleUpdateStatus('rejected')}
                    disabled={statusActionLoading}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-red-300 bg-red-50 text-red-800 hover:bg-red-100 transition-colors"
                  >
                    Reject
                  </button>
                )}

                <button
                  onClick={handleConvertToDraft}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-navy text-sand hover:bg-navy-light transition-all shadow-sm active:scale-95"
                >
                  <Building className="w-4 h-4 text-gold" />
                  <span>Convert to Listing Draft</span>
                  <ArrowRight className="w-3.5 h-3.5 text-gold" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

