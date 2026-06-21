import { cookies, type UnsafeUnwrappedCookies } from "next/headers";

import {
  defaultLocale,
  isLocale,
  localeCookieName,
  messages,
  type Locale,
} from "@/lib/i18n/messages";

export function getServerLocale(): Locale {
  const cookieLocale = (cookies() as unknown as UnsafeUnwrappedCookies).get(localeCookieName)?.value;
  return isLocale(cookieLocale) ? cookieLocale : defaultLocale;
}

export function getServerMessages() {
  return messages[getServerLocale()];
}

