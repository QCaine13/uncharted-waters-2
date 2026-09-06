import { useSyncExternalStore } from 'react';
import { getLocale, subscribeLocale, type Locale } from './index';

export default function useLocale(): Locale {
  return useSyncExternalStore(subscribeLocale, getLocale, getLocale);
}
