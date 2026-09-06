import { chineseCatalog } from './catalogs';

export { mergeCatalogs } from './catalogs';

export type Locale = 'zh-CN' | 'en';

const storageKey = 'uw2.locale';
const listeners = new Set<() => void>();
let memoryLocale: Locale | undefined;
let useMemoryLocale = false;

const readStoredLocale = (): Locale => {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored === 'en' || stored === 'zh-CN' ? stored : 'zh-CN';
  } catch {
    return 'zh-CN';
  }
};

export const getLocale = (): Locale =>
  useMemoryLocale && memoryLocale ? memoryLocale : readStoredLocale();

export const setLocale = (locale: Locale): void => {
  const changed = getLocale() !== locale;
  memoryLocale = locale;
  try {
    localStorage.setItem(storageKey, locale);
    useMemoryLocale = false;
  } catch {
    // The in-memory selection remains active when storage is unavailable.
    useMemoryLocale = true;
  }
  if (changed) listeners.forEach((listener) => listener());
};

export const subscribeLocale = (listener: () => void): (() => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export const localizeDocument = (): void => {
  const locale = getLocale();
  document.documentElement.lang = locale;
  const translatedNodes =
    document.querySelectorAll<HTMLElement>('[data-en][data-zh]');
  translatedNodes.forEach((element) => {
    const translated =
      locale === 'zh-CN' ? element.dataset.zh! : element.dataset.en!;
    Reflect.set(element, 'textContent', translated);
  });
  const localeOnlyNodes =
    document.querySelectorAll<HTMLElement>('[data-locale-only]');
  localeOnlyNodes.forEach((element) => {
    const hidden = element.dataset.localeOnly !== locale;
    Reflect.set(element, 'hidden', hidden);
  });
};

export const t = (
  source: string,
  values: Record<string, string | number> = {},
): string => {
  const translated = Object.prototype.hasOwnProperty.call(
    chineseCatalog,
    source,
  )
    ? chineseCatalog[source]
    : source;
  const template = getLocale() === 'zh-CN' ? translated : source;
  return template.replace(/\{([^}]+)\}/g, (match, name: string) =>
    Object.prototype.hasOwnProperty.call(values, name)
      ? String(values[name])
      : match,
  );
};
