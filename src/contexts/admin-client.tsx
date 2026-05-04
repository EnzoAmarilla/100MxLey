"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface ActiveClient {
  id:        string;
  name:      string;
  email:     string;
  storeName: string;
}

interface AdminClientContextType {
  activeClient:    ActiveClient | null;
  setActiveClient: (client: ActiveClient | null) => void;
  hydrated:        boolean;
}

const AdminClientContext = createContext<AdminClientContextType>({
  activeClient:    null,
  setActiveClient: () => {},
  hydrated:        false,
});

const STORAGE_KEY = "admin_active_client";

export function AdminClientProvider({ children }: { children: ReactNode }) {
  const [activeClient, setActiveClientState] = useState<ActiveClient | null>(null);
  const [hydrated, setHydrated]              = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setActiveClientState(JSON.parse(stored));
    } catch { /* ignore */ }
    setHydrated(true);
  }, []);

  const setActiveClient = (client: ActiveClient | null) => {
    setActiveClientState(client);
    if (client) localStorage.setItem(STORAGE_KEY, JSON.stringify(client));
    else        localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <AdminClientContext.Provider value={{ activeClient, setActiveClient, hydrated }}>
      {children}
    </AdminClientContext.Provider>
  );
}

export function useAdminClient() {
  return useContext(AdminClientContext);
}
