'use client';

import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Key,
  Lock,
  Building,
  Mail,
  Phone,
  DollarSign,
  TrendingUp,
  Save,
  CheckCircle2,
  RefreshCw,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { type ExchangeRates, type CurrencyCode } from '@wild-hills/contracts';
import {
  getAdminExchangeRates,
  saveAdminExchangeRates,
  getAdminGeneralSettings,
  saveAdminGeneralSettings,
  type AdminGeneralSettings,
} from '@/lib/data';

export default function AdminSettingsPage() {
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [ratesInput, setRatesInput] = useState<Record<string, string>>({});
  const [ratesSaving, setRatesSaving] = useState(false);
  const [ratesSuccess, setRatesSuccess] = useState(false);

  const [settings, setSettings] = useState<AdminGeneralSettings | null>(null);
  const [settingsSaving, setSettingsSaving] = useState(false);
  const [settingsSuccess, setSettingsSuccess] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const ratesData = await getAdminExchangeRates();
        setRates(ratesData);
        const initialInputs: Record<string, string> = {};
        for (const [curr, val] of Object.entries(ratesData.rates)) {
          initialInputs[curr] = String(val);
        }
        setRatesInput(initialInputs);

        const genSettings = await getAdminGeneralSettings();
        setSettings(genSettings);
      } catch (err) {
        console.error('Failed to load admin settings:', err);
      }
    }
    loadData();
  }, []);

  const handleRateChange = (currency: string, value: string) => {
    setRatesInput((prev) => ({
      ...prev,
      [currency]: value,
    }));
  };

  const handleSaveRates = async (e: React.FormEvent) => {
    e.preventDefault();
    setRatesSaving(true);
    try {
      const parsedRates: Record<string, number> = {};
      for (const [curr, val] of Object.entries(ratesInput)) {
        const num = parseFloat(val);
        if (!isNaN(num) && num > 0) {
          parsedRates[curr] = num;
        }
      }

      const updated = await saveAdminExchangeRates(parsedRates);
      setRates(updated);
      setRatesSuccess(true);
      setTimeout(() => setRatesSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update exchange rates:', err);
    } finally {
      setRatesSaving(false);
    }
  };

  const handleSaveGeneral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    setSettingsSaving(true);
    try {
      const updated = await saveAdminGeneralSettings(settings);
      setSettings(updated);
      setSettingsSuccess(true);
      setTimeout(() => setSettingsSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to update general settings:', err);
    } finally {
      setSettingsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          Platform Settings & Configuration
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Manage corporate credentials, FX exchange rate feeds, notifications, and security protocols.
        </p>
      </div>

      {/* 1. General Corporate Settings */}
      <div className="bg-white rounded-2xl border border-line p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sand border border-line flex items-center justify-center text-navy">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-navy">Corporate & Communication</h3>
              <p className="text-xs text-muted">Company entity details and inbound lead alert recipients</p>
            </div>
          </div>

          {settingsSuccess && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Saved</span>
            </div>
          )}
        </div>

        {settings && (
          <form onSubmit={handleSaveGeneral} className="space-y-4 text-xs sm:text-sm">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-navy block mb-1">Company Legal Name</label>
                <input
                  type="text"
                  value={settings.companyName}
                  onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-line focus:outline-none focus:ring-2 focus:ring-gold/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-navy block mb-1">Concierge Lead Email</label>
                <input
                  type="email"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-line focus:outline-none focus:ring-2 focus:ring-gold/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-navy block mb-1">Alert WhatsApp Number</label>
                <input
                  type="text"
                  value={settings.whatsappAlertPhone}
                  onChange={(e) => setSettings({ ...settings, whatsappAlertPhone: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-line font-mono focus:outline-none focus:ring-2 focus:ring-gold/50"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-navy block mb-1">Emergency Concierge Line</label>
                <input
                  type="text"
                  value={settings.emergencyPhone}
                  onChange={(e) => setSettings({ ...settings, emergencyPhone: e.target.value })}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-line font-mono focus:outline-none focus:ring-2 focus:ring-gold/50"
                />
              </div>
            </div>

            <div className="pt-3 flex justify-end">
              <button
                type="submit"
                disabled={settingsSaving}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-navy text-sand hover:bg-navy-light transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-gold" />
                <span>{settingsSaving ? 'Saving...' : 'Save Corporate Settings'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 2. FX Exchange Rates */}
      <div className="bg-white rounded-2xl border border-line p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-line">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sand border border-line flex items-center justify-center text-navy">
              <TrendingUp className="w-5 h-5 text-gold-dark" />
            </div>
            <div>
              <h3 className="font-serif text-base font-bold text-navy">Currency Exchange Rates (Base USD)</h3>
              <p className="text-xs text-muted">
                Multi-currency conversion multipliers used across AED, EUR, TRY, GEL, and EGP
              </p>
            </div>
          </div>

          {ratesSuccess && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Rates Updated</span>
            </div>
          )}
        </div>

        {rates && (
          <form onSubmit={handleSaveRates} className="space-y-5">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {['USD', 'AED', 'EUR', 'TRY', 'GEL', 'EGP'].map((curr) => {
                const val = ratesInput[curr] ?? '1';
                const isBase = curr === 'USD';

                return (
                  <div key={curr} className="p-3 rounded-xl bg-sand/20 border border-line space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-navy">{curr}</span>
                      {isBase && (
                        <span className="text-[10px] uppercase font-bold text-gold-dark bg-gold/20 px-1.5 py-0.5 rounded">
                          Base
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="number"
                        step="0.0001"
                        disabled={isBase}
                        value={val}
                        onChange={(e) => handleRateChange(curr, e.target.value)}
                        className={`w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-line focus:outline-none focus:ring-2 focus:ring-gold/50 ${
                          isBase ? 'bg-sand/40 text-muted font-bold' : 'bg-white text-navy font-bold'
                        }`}
                      />
                    </div>
                    <span className="text-[10px] text-muted block">
                      1 USD = {val} {curr}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
              <span className="text-[11px] text-muted font-mono flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>Last updated: {new Date(rates.timestamp).toLocaleString()}</span>
              </span>

              <button
                type="submit"
                disabled={ratesSaving}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-gold text-navy hover:bg-gold-light transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{ratesSaving ? 'Updating...' : 'Save Exchange Rates'}</span>
              </button>
            </div>
          </form>
        )}
      </div>

      {/* 3. Platform Security & MFA */}
      <div className="bg-white rounded-2xl border border-line p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-line">
          <div className="w-10 h-10 rounded-xl bg-sand border border-line flex items-center justify-center text-navy">
            <Key className="w-5 h-5 text-gold" />
          </div>
          <div>
            <h3 className="font-serif text-base font-bold text-navy">Staff Authentication & MFA</h3>
            <p className="text-xs text-muted">Strict WebAuthn biometric passkeys, TOTP, and session policies</p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm">
          <div className="flex items-center justify-between p-4 rounded-xl bg-sand/40 border border-line">
            <div>
              <span className="font-bold text-navy block">Registered Owner Passkey</span>
              <span className="text-muted text-xs">YubiKey 5C NFC / Apple Touch ID (FIDO2 Hardware backed)</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
              Enforced
            </span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-sand/40 border border-line">
            <div>
              <span className="font-bold text-navy block">Session Timeout</span>
              <span className="text-muted text-xs">Automatic logout after inactivity period</span>
            </div>
            <span className="font-mono font-bold text-navy">8 Hours</span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-sand/40 border border-line">
            <div>
              <span className="font-bold text-navy block">Database Isolation & Audit Log</span>
              <span className="text-muted text-xs">Append-only immutable audit trail on all listing mutations</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
