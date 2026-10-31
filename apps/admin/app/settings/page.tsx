import React from 'react';
import { ShieldCheck, Key, Lock, UserCheck, Bell, Database } from 'lucide-react';

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="font-serif text-2xl sm:text-3xl font-bold text-navy">
          Platform Settings & Security
        </h1>
        <p className="text-xs sm:text-sm text-muted mt-1">
          Access control, WebAuthn passkey authentication, and staff permission policies.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-line p-6 shadow-sm space-y-6">
        <div className="flex items-center gap-3 pb-4 border-b border-line">
          <Key className="w-5 h-5 text-gold" />
          <div>
            <h3 className="font-serif text-base font-bold text-navy">Staff Authentication & MFA</h3>
            <p className="text-xs text-muted">Strict WebAuthn biometric passkeys and TOTP factors</p>
          </div>
        </div>

        <div className="space-y-4 text-xs sm:text-sm">
          <div className="flex items-center justify-between p-4 rounded-xl bg-sand/40 border border-line">
            <div>
              <span className="font-bold text-navy block">Registered Owner Passkey</span>
              <span className="text-muted text-xs">YubiKey 5C NFC / Apple Touch ID (Hardware backed)</span>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-xs">
              Enforced
            </span>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl bg-sand/40 border border-line">
            <div>
              <span className="font-bold text-navy block">Session Timeout</span>
              <span className="text-muted text-xs">Automatic logout after 8 hours of inactivity</span>
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

