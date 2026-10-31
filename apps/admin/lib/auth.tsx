'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'country_manager' | 'agent' | 'editor';
  avatarUrl: string;
  mfaEnabled: boolean;
  countryScope?: string[];
  sessionExpiresAt: string;
}

const MOCK_OWNER_USER: AdminUser = {
  id: 'usr-admin-01',
  name: 'Elena Rostova',
  email: 'elena@wildhills.example',
  role: 'super_admin',
  avatarUrl: '/images/defaults/apartment/cover-card.webp',
  mfaEnabled: true,
  countryScope: ['ae', 'eg', 'ge', 'tr'],
  sessionExpiresAt: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
};

interface AuthContextType {
  user: AdminUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  loginWithPasskey: () => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: MOCK_OWNER_USER,
  isAuthenticated: true,
  isLoading: false,
  loginWithPasskey: async () => true,
  logout: () => {},
});

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(MOCK_OWNER_USER);
  const [isLoading, setIsLoading] = useState(false);

  const loginWithPasskey = async () => {
    setIsLoading(true);
    // Preserved hook for WebAuthn passkey assertion
    await new Promise((res) => setTimeout(res, 500));
    setUser(MOCK_OWNER_USER);
    setIsLoading(false);
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: Boolean(user),
        isLoading,
        loginWithPasskey,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAdminAuth() {
  return useContext(AuthContext);
}
