import { cookies } from "next/headers";

import {
  defaultLocale,
  isLocale,
  localeCookieName,
  messages,
  type Locale,
} from "@/lib/i18n/messages";

export async function getServerLocale(): Promise<Locale> {
  const cookieLocale = (await cookies()).get(localeCookieName)?.value;
  return isLocale(cookieLocale) ? cookieLocale : defaultLocale;
}

export async function getServerMessages() {
  return messages[await getServerLocale()];
}
