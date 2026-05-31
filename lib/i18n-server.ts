import { cookies } from "next/headers";

import {
  defaultLocale,
  isLocale,
  localeCookieName,
  messages,
  type Locale,
} from "@/lib/i18n/messages";

export function getServerLocale(): Locale {
  const cookieLocale = cookies().get(localeCookieName)?.value;
  return isLocale(cookieLocale) ? cookieLocale : defaultLocale;
}

export function getServerMessages() {
  return messages[getServerLocale()];
}

