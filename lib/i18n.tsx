"use client";

import * as React from "react";

import {
  defaultLocale,
  isLocale,
  localeCookieName,
  messages,
  type Locale,
  type Messages,
} from "@/lib/i18n/messages";

export type { Locale, Messages };

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Messages;
};

const LocaleContext = React.createContext<LocaleContextValue | null>(null);

function getInitialLocale(): Locale {
  if (typeof document === "undefined") return defaultLocale;

  const cookieLocale = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${localeCookieName}=`))
    ?.split("=")[1];

  return isLocale(cookieLocale) ? cookieLocale : defaultLocale;
}

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = React.useState<Locale>(
    initialLocale ?? getInitialLocale
  );

  const setLocale = React.useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    document.cookie = `${localeCookieName}=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    document.documentElement.lang = nextLocale;
  }, []);

  React.useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = React.useMemo(
    () => ({
      locale,
      setLocale,
      t: messages[locale],
    }),
    [locale, setLocale]
  );

  return (
    <LocaleContext.Provider value={value}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  const context = React.useContext(LocaleContext);
  if (!context) {
    throw new Error("useLocale must be used within LocaleProvider");
  }

  return context;
}
