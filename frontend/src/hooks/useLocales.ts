import React from 'react';
import i18n from '@/i18n';

export interface LocaleInfo {
  code: string; // e.g., en, es, fr-FR
  language: string; // base language (en, es, fr)
  region?: string; // region (US, MX, FR)
  nativeName: string;
  englishName: string;
}

function parseLangFromPath(path: string): string | null {
  // Examples of paths: /src/i18n/locales/en/common.json, /src/i18n/locales/es/sidebar.json
  const match = path.match(/\/locales\/(.*?)\//);
  return match?.[1] ?? null;
}

function unique<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

function getDisplayName(code: string, locale: string): string {
  try {
    // ts-ignore - older TS versions may not have languageDisplay type
    const dn = new Intl.DisplayNames([locale], { type: 'language', languageDisplay: 'standard' });
    return dn.of(code) ?? code;
  } catch {
    return code;
  }
}

export function useLocales() {
  // Discover locales from the folders under src/i18n/locales/**/common.json
  // Eager so it works at runtime without async
  const files = import.meta.glob('/src/i18n/locales/**/common.json', { eager: true });
  const discovered = React.useMemo(() => {
    const langs = unique(
      Object.keys(files)
        .map(parseLangFromPath)
        .filter((x): x is string => !!x)
    );

    // Always ensure at least fallback
    const withFallback = langs.length ? langs : ['en'];

    // Normalize to language-region if present
    const list: LocaleInfo[] = withFallback.map((code) => {
      const [language, region] = code.includes('-') ? code.split('-') : [code, undefined];
      const englishName = getDisplayName(language, 'en');
      const nativeName = getDisplayName(language, language);
      return { code, language, region, englishName, nativeName };
    });

    return list;
  }, [files]);

  const current = i18n.language || i18n.resolvedLanguage || 'en';

  const changeLanguage = React.useCallback(async (code: string) => {
    await i18n.changeLanguage(code);
    try { localStorage.setItem('i18nextLng', code); } catch { /* ignore */ }
  }, []);

  return { locales: discovered, current, changeLanguage };
}

export default useLocales;
