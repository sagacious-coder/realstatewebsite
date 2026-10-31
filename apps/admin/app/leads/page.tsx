import React from 'react';
import { Users, Mail, Phone, Clock, MessageSquare, ArrowRight } from 'lucide-react';

export default function LeadsPage() {
  const mockLeads = [
    {
      id: 'lead-01',
      name: 'Alexander Weber',
      email: 'a.weber@zurich-cap.ch',
      phone: '+41 44 123 4567',
      listingRef: 'WH-AE-101',
      country: 'ae',
      budget: '$1,500,000 – $2,500,000',
      status: 'new',
      date: '24 mins ago',
      message: 'Interested in the Marina waterfront penthouse. Requesting private floor plans and developer payment schedule.',
    },
    {
      id: 'lead-02',
      name: 'Tariq Al-Mansoor',
      email: 'tariq.m@gulfinvest.ae',
      phone: '+971 50 987 6543',
      listingRef: 'WH-AE-102',
      country: 'ae',
      budget: '$2,000,000+',
      status: 'contacted',
      date: '2 hours ago',
      message: 'Looking for a 4-bedroom ready villa in Yas Island for primary residency.',
    },
    {
      id: 'lead-03',
      name: 'Sophie Dupont',
      email: 'sophie.dupont@paris-luxury.fr',
      phone: '+33 1 42 68 55 00',
      listingRef: 'WH-TR-201',
      country: 'tr',
      budget: '$800,000',
      status: 'qualified',
      date: '5 hours ago',
      message: 'Requesting virtual viewing for Bosphorus sea view residence.',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          Leads & Inquiries CRM
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Review incoming buyer inquiries, property requests, and private client consultations.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-line overflow-hidden shadow-sm">
        <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-gold" />
            <span className="font-serif text-base font-bold text-navy">Active Pipeline</span>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-sand text-navy">
            {mockLeads.length} Inquiries Pending Review
          </span>
        </div>

        <div className="divide-y divide-line">
          {mockLeads.map((lead) => (
            <div key={lead.id} className="p-5 sm:p-6 hover:bg-sand/20 transition-colors space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-navy text-sand flex items-center justify-center font-bold text-sm">
                    {lead.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-navy">{lead.name}</h3>
                    <span className="text-xs text-muted font-mono">{lead.email} · {lead.phone}</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-sand border border-line text-navy">
                    Ref: {lead.listingRef}
                  </span>
                  <span className="text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    {lead.status}
                  </span>
                </div>
              </div>

              <p className="text-xs sm:text-sm text-navy/80 bg-sand/40 p-3 rounded-xl border border-line leading-relaxed">
                &ldquo;{lead.message}&rdquo;
              </p>

              <div className="flex items-center justify-between text-xs text-muted pt-1">
                <span>Budget: <strong className="text-navy">{lead.budget}</strong></span>
                <span className="flex items-center gap-1 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{lead.date}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
