'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Users,
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
  Save,
  Tag,
  Building,
  Calendar,
  Briefcase,
  ChevronRight,
} from 'lucide-react';
import {
  type LeadRecord,
  type LeadStatus,
  type CountryCode,
  LEAD_STATUSES,
} from '@wild-hills/contracts';
import { getAdminLeads, updateAdminLeadStatus } from '@/lib/data';

const STATUS_LABELS: Record<LeadStatus, string> = {
  new: 'New Inquiry',
  contacted: 'Contacted',
  qualified: 'Qualified',
  viewing_scheduled: 'Viewing Scheduled',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
  lost: 'Closed Lost',
  closed: 'Closed',
};

const STATUS_COLORS: Record<LeadStatus, { bg: string; text: string; border: string }> = {
  new: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  contacted: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  qualified: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  viewing_scheduled: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  closed_won: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  closed_lost: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  lost: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  closed: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
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

export default function LeadsPage() {
  const [leads, setLeads] = useState<LeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [countryFilter, setCountryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedLead, setSelectedLead] = useState<LeadRecord | null>(null);
  const [editStatus, setEditStatus] = useState<LeadStatus>('new');
  const [editNotes, setEditNotes] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchLeads() {
      setLoading(true);
      try {
        const data = await getAdminLeads();
        setLeads(data);
      } catch (err) {
        console.error('Failed to load leads:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLeads();
  }, []);

  const filteredLeads = useMemo(() => {
    return leads.filter((l) => {
      if (countryFilter !== 'all' && l.countryCode !== countryFilter) return false;
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = l.name.toLowerCase().includes(q);
        const matchesEmail = l.email.toLowerCase().includes(q);
        const matchesPhone = l.phone.toLowerCase().includes(q);
        const matchesRef = l.propertyRef?.toLowerCase().includes(q);
        const matchesTitle = l.propertyTitle?.toLowerCase().includes(q);
        if (!matchesName && !matchesEmail && !matchesPhone && !matchesRef && !matchesTitle) {
          return false;
        }
      }
      return true;
    });
  }, [leads, countryFilter, statusFilter, searchQuery]);

  const stats = useMemo(() => {
    return {
      total: leads.length,
      new: leads.filter((l) => l.status === 'new').length,
      viewings: leads.filter((l) => l.status === 'viewing_scheduled').length,
      won: leads.filter((l) => l.status === 'closed_won').length,
    };
  }, [leads]);

  const openLeadDetail = (lead: LeadRecord) => {
    setSelectedLead(lead);
    setEditStatus(lead.status as LeadStatus);
    setEditNotes(lead.internalNotes || '');
    setSaveSuccess(false);
  };

  const handleSaveLead = async () => {
    if (!selectedLead) return;
    setIsSaving(true);
    try {
      await updateAdminLeadStatus(selectedLead.id, editStatus, editNotes);
      setLeads((prev) =>
        prev.map((l) =>
          l.id === selectedLead.id
            ? { ...l, status: editStatus, internalNotes: editNotes, updatedAt: new Date().toISOString() }
            : l
        )
      );
      setSelectedLead((prev) => (prev ? { ...prev, status: editStatus, internalNotes: editNotes } : null));
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update lead:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCsv = () => {
    if (leads.length === 0) return;

    const headers = [
      'Lead ID',
      'Created Date',
      'Inquirer Name',
      'Email',
      'Phone',
      'Preferred Contact',
      'Country',
      'Property Ref',
      'Property Title',
      'Budget Min',
      'Budget Max',
      'Currency',
      'Status',
      'Message',
      'Internal Notes',
      'UTM Source',
      'UTM Campaign',
    ];

    const rows = filteredLeads.map((l) => [
      sanitizeCsvValue(l.id),
      sanitizeCsvValue(l.createdAt),
      sanitizeCsvValue(l.name),
      sanitizeCsvValue(l.email),
      sanitizeCsvValue(l.phone),
      sanitizeCsvValue(l.preferredContact),
      sanitizeCsvValue(l.countryCode.toUpperCase()),
      sanitizeCsvValue(l.propertyRef || ''),
      sanitizeCsvValue(l.propertyTitle || ''),
      sanitizeCsvValue(l.budgetMin || ''),
      sanitizeCsvValue(l.budgetMax || ''),
      sanitizeCsvValue(l.currency || ''),
      sanitizeCsvValue(STATUS_LABELS[l.status as LeadStatus] || l.status),
      sanitizeCsvValue(l.message || ''),
      sanitizeCsvValue(l.internalNotes || ''),
      sanitizeCsvValue(l.utmSource || ''),
      sanitizeCsvValue(l.utmCampaign || ''),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `wild-hills-leads-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
            Leads & Inquiries CRM
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            Track high-net-worth client consultations, property viewing requests, and deal pipeline.
          </p>
        </div>

        <button
          onClick={handleExportCsv}
          disabled={leads.length === 0}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-navy text-sand hover:bg-navy-light text-xs sm:text-sm font-semibold transition-all shadow-sm active:scale-95 disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-gold" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Metric Counters */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-line shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted uppercase tracking-wider">Total Leads</span>
            <Users className="w-4 h-4 text-navy/40" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-navy">{stats.total}</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-line shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">New Inquiries</span>
            <AlertCircle className="w-4 h-4 text-blue-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-blue-700">{stats.new}</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-line shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Viewings</span>
            <Clock className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-indigo-700">{stats.viewings}</div>
        </div>

        <div className="p-4 sm:p-5 rounded-2xl bg-white border border-line shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Deals Won</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-serif font-bold text-emerald-700">{stats.won}</div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-line shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-muted absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search leads, email, ref, or property..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm rounded-xl border border-line bg-white text-navy focus:outline-none focus:ring-2 focus:ring-gold/50"
          >
            <option value="all">All Statuses</option>
            <option value="new">New Inquiries</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="viewing_scheduled">Viewing Scheduled</option>
            <option value="closed_won">Closed Won</option>
            <option value="closed_lost">Closed Lost</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl border border-line overflow-hidden shadow-sm">
        <div className="p-4 border-b border-line flex items-center justify-between bg-sand/20">
          <span className="text-xs font-bold text-navy uppercase tracking-wider">
            Showing {filteredLeads.length} of {leads.length} Records
          </span>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-muted">Loading CRM leads...</div>
        ) : filteredLeads.length === 0 ? (
          <div className="p-12 text-center text-sm text-muted">
            No inquiries match your selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-line bg-sand/10 text-muted font-semibold uppercase text-[11px] tracking-wider">
                  <th className="py-3 px-4">Client</th>
                  <th className="py-3 px-4">Market</th>
                  <th className="py-3 px-4">Property / Ref</th>
                  <th className="py-3 px-4">Budget</th>
                  <th className="py-3 px-4">Contact</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {filteredLeads.map((lead) => {
                  const statusStyle =
                    STATUS_COLORS[lead.status as LeadStatus] || STATUS_COLORS.new;

                  return (
                    <tr
                      key={lead.id}
                      onClick={() => openLeadDetail(lead)}
                      className="hover:bg-sand/30 cursor-pointer transition-colors"
                    >
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-navy text-sand flex items-center justify-center font-bold text-xs shrink-0">
                            {lead.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-navy hover:underline">{lead.name}</div>
                            <div className="text-[11px] text-muted font-mono">{lead.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-sand border border-line text-navy">
                          {lead.countryCode}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 max-w-[200px]">
                        {lead.propertyRef ? (
                          <div>
                            <span className="font-mono text-[11px] font-bold text-navy block">
                              {lead.propertyRef}
                            </span>
                            <span className="text-[11px] text-muted truncate block">
                              {lead.propertyTitle || 'Listing inquiry'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-muted italic text-[11px]">General Inquiry</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 font-semibold text-navy whitespace-nowrap">
                        {lead.budgetMin || lead.budgetMax ? (
                          <span>
                            {lead.currency}{' '}
                            {lead.budgetMin ? lead.budgetMin.toLocaleString() : '0'} –{' '}
                            {lead.budgetMax ? lead.budgetMax.toLocaleString() : 'Any'}
                          </span>
                        ) : (
                          <span className="text-muted italic text-xs">Unspecified</span>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                          {lead.phone && (
                            <a
                              href={`https://wa.me/${lead.phone.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                              title="Chat on WhatsApp"
                            >
                              <MessageSquare className="w-3.5 h-3.5" />
                            </a>
                          )}
                          <a
                            href={`mailto:${lead.email}`}
                            className="p-1.5 rounded-lg bg-sand/60 text-navy hover:bg-sand transition-colors"
                            title="Send Email"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-full border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}
                        >
                          {STATUS_LABELS[lead.status as LeadStatus] || lead.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-muted text-xs whitespace-nowrap">
                        {new Date(lead.createdAt).toLocaleDateString(undefined, {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openLeadDetail(lead);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-navy rounded-lg border border-line bg-sand/40 hover:bg-sand transition-colors"
                        >
                          Manage
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

      {/* Slide-over / Modal Detail View */}
      {selectedLead && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-end p-0 sm:p-4 transition-opacity"
          onClick={() => setSelectedLead(null)}
        >
          <div
            className="w-full max-w-xl h-full sm:h-auto sm:max-h-[90vh] bg-white rounded-none sm:rounded-2xl border border-line shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-line flex items-center justify-between bg-sand/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy text-sand flex items-center justify-center font-bold text-base">
                  {selectedLead.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-navy">{selectedLead.name}</h3>
                  <span className="text-xs text-muted font-mono">{selectedLead.id}</span>
                </div>
              </div>

              <button
                onClick={() => setSelectedLead(null)}
                className="p-1.5 rounded-lg text-muted hover:text-navy hover:bg-sand/60 transition-colors"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* Contact & Meta */}
              <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="p-3 rounded-xl bg-sand/20 border border-line">
                  <span className="text-muted block text-[11px] uppercase font-bold mb-1">Email</span>
                  <a href={`mailto:${selectedLead.email}`} className="font-semibold text-navy hover:underline break-all">
                    {selectedLead.email}
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-sand/20 border border-line">
                  <span className="text-muted block text-[11px] uppercase font-bold mb-1">Phone / WhatsApp</span>
                  <a
                    href={`https://wa.me/${selectedLead.phone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-semibold text-emerald-700 hover:underline flex items-center gap-1.5"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{selectedLead.phone}</span>
                  </a>
                </div>

                <div className="p-3 rounded-xl bg-sand/20 border border-line">
                  <span className="text-muted block text-[11px] uppercase font-bold mb-1">Market & Desk</span>
                  <span className="font-bold text-navy uppercase">{selectedLead.countryCode}</span>
                </div>

                <div className="p-3 rounded-xl bg-sand/20 border border-line">
                  <span className="text-muted block text-[11px] uppercase font-bold mb-1">Preferred Channel</span>
                  <span className="font-bold text-navy capitalize">{selectedLead.preferredContact}</span>
                </div>
              </div>

              {/* Property Reference */}
              {selectedLead.propertyRef && (
                <div className="p-4 rounded-xl bg-sand/30 border border-line space-y-1.5">
                  <span className="text-[11px] uppercase font-bold text-muted block">Inquired Property</span>
                  <div className="font-bold text-navy text-sm">{selectedLead.propertyTitle}</div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono px-2 py-0.5 rounded bg-white border border-line font-bold text-navy">
                      {selectedLead.propertyRef}
                    </span>
                    {selectedLead.listingId && (
                      <Link
                        href={`/listings/${selectedLead.listingId}/edit`}
                        className="text-gold-dark hover:underline flex items-center gap-1 font-semibold"
                      >
                        <span>Open in Listings Editor</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* Inquiry Message */}
              {selectedLead.message && (
                <div className="space-y-1.5">
                  <span className="text-[11px] uppercase font-bold text-muted block">Client Message</span>
                  <div className="p-4 rounded-xl bg-sand/10 border border-line text-navy/90 text-xs sm:text-sm leading-relaxed">
                    &ldquo;{selectedLead.message}&rdquo;
                  </div>
                </div>
              )}

              {/* Campaign Attribution */}
              {(selectedLead.utmSource || selectedLead.utmCampaign) && (
                <div className="p-3 rounded-xl bg-sand/10 border border-line flex items-center gap-4 text-xs text-muted font-mono">
                  {selectedLead.utmSource && (
                    <span>Source: <strong className="text-navy">{selectedLead.utmSource}</strong></span>
                  )}
                  {selectedLead.utmCampaign && (
                    <span>Campaign: <strong className="text-navy">{selectedLead.utmCampaign}</strong></span>
                  )}
                </div>
              )}

              {/* Status & Staff Notes Editor */}
              <div className="space-y-4 pt-4 border-t border-line">
                <h4 className="font-serif text-sm font-bold text-navy">Update Lead Status & Notes</h4>

                <div>
                  <label className="text-xs font-semibold text-navy block mb-1">Pipeline Status</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as LeadStatus)}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-line bg-white text-navy focus:outline-none focus:ring-2 focus:ring-gold/50"
                  >
                    <option value="new">New Inquiry</option>
                    <option value="contacted">Contacted</option>
                    <option value="qualified">Qualified</option>
                    <option value="viewing_scheduled">Viewing Scheduled</option>
                    <option value="closed_won">Closed Won</option>
                    <option value="closed_lost">Closed Lost</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-navy block mb-1">
                    Internal Staff Notes (Private)
                  </label>
                  <textarea
                    rows={4}
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    placeholder="Add private staff notes, meeting logs, buyer preferences..."
                    className="w-full p-3 text-xs sm:text-sm rounded-xl border border-line bg-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                  />
                </div>

                {saveSuccess && (
                  <div className="p-3 rounded-xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Lead updated successfully!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-line bg-sand/20 flex items-center justify-between">
              <span className="text-[11px] text-muted">
                Last updated: {new Date(selectedLead.updatedAt).toLocaleString()}
              </span>

              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-line bg-white hover:bg-sand/40 text-navy transition-colors"
                >
                  Close
                </button>
                <button
                  onClick={handleSaveLead}
                  disabled={isSaving}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-gold text-navy hover:bg-gold-light transition-all shadow-sm active:scale-95 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
