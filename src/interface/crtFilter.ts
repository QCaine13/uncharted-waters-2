import { useSyncExternalStore } from 'react';

export const CRT_FILTER_STORAGE_KEY = 'uw2.crt_filter';

const listeners = new Set<() => void>();

export function isCrtFilterEnabled(): boolean {
  if (typeof window === 'undefined' || typeof localStorage === 'undefined') {
    return false;
  }
  try {
    return localStorage.getItem(CRT_FILTER_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setCrtFilterEnabled(enabled: boolean): void {
  if (typeof localStorage !== 'undefined') {
    try {
      localStorage.setItem(CRT_FILTER_STORAGE_KEY, enabled ? 'true' : 'false');
    } catch {
      // Safe fallback
    }
  }
  listeners.forEach((listener) => listener());
}

export function toggleCrtFilter(): boolean {
  const next = !isCrtFilterEnabled();
  setCrtFilterEnabled(next);
  return next;
}

export function subscribeCrtFilter(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function useCrtFilter(): boolean {
  return useSyncExternalStore(
    subscribeCrtFilter,
    isCrtFilterEnabled,
    () => false,
  );
}
