
"use client";

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import React, { createContext, useContext } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const API_KEY_STORAGE_KEY = 'habitlocal_gemini_api_key';

interface ApiKeyContextType {
  apiKey: string | null;
  setApiKey: Dispatch<SetStateAction<string | null>>;
  isApiKeySet: boolean;
}

const ApiKeyContext = createContext<ApiKeyContextType | undefined>(undefined);

export function ApiKeyProvider({ children }: { children: ReactNode }) {
  const [apiKey, setApiKey] = useLocalStorage<string | null>(API_KEY_STORAGE_KEY, null);
  const isApiKeySet = apiKey !== null && apiKey.trim() !== '';

  return (
    <ApiKeyContext.Provider value={{ apiKey, setApiKey, isApiKeySet }}>
      {children}
    </ApiKeyContext.Provider>
  );
}

export function useApiKey(): ApiKeyContextType {
  const context = useContext(ApiKeyContext);
  if (context === undefined) {
    throw new Error('useApiKey must be used within an ApiKeyProvider');
  }
  return context;
}
