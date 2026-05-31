"use client";

import * as React from "react";

export type Locale = "es" | "en";

type Dictionary = {
  about: string;
  contact: string;
  signIn: string;
  menu: string;
  manageCourse: string;
  resources: string;
  languageLabel: string;
};

const dictionaries: Record<Locale, Dictionary> = {
  es: {
    about: "Acerca de nosotros",
    contact: "Contáctanos",
    signIn: "Iniciar sesión",
    menu: "Menú",
    manageCourse: "Gestionar curso",
    resources: "Recursos",
    languageLabel: "Idioma",
  },
  en: {
    about: "About us",
    contact: "Contact",
    signIn: "Sign in",
    menu: "Menu",
    manageCourse: "Manage course",
    resources: "Resources",
    languageLabel: "Language",
  },
};

const LOCALE_COOKIE_NAME = "se_libre_locale";

type LocaleContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
};

const LocaleContext = React.createContext<LocaleContextValue | null>(null);

function isLocale(value: string | undefined): value is Locale {
  return value === "es" || value === "en";
}

function getInitialLocale(): Locale {
  if (typeof document === "undefined") return "es";

  const cookieLocale = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${LOCALE_COOKIE_NAME}=`))
    ?.split("=")[1];

  return isLocale(cookieLocale) ? cookieLocale : "es";
}

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = React.useState<Locale>(getInitialLocale);

  const setLocale = React.useCallback((nextLocale: Locale) => {
    setLocaleState(nextLocale);
    document.cookie = `${LOCALE_COOKIE_NAME}=${nextLocale}; path=/; max-age=${60 * 60 * 24 * 365}`;
    document.documentElement.lang = nextLocale;
  }, []);

  React.useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = React.useMemo(
    () => ({
      locale,
      setLocale,
      t: dictionaries[locale],
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
