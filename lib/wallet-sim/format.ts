// Formatting helpers for sats/BTC display and address truncation.
// All monetary storage remains integer sats; BTC is display-only.

const SATS_PER_BTC = 100_000_000;

export function satsToBtc(sats: number): number {
  return sats / SATS_PER_BTC;
}

export function formatSats(sats: number, locale = "es"): string {
  return `${new Intl.NumberFormat(locale).format(Math.trunc(sats))} sats`;
}

export function formatBtc(sats: number, locale = "es"): string {
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8,
    useGrouping: false,
  }).format(satsToBtc(sats));
}

export function truncateAddress(address: string): string {
  if (!address) return "";
  if (address.length <= 12) return address;
  return `${address.slice(0, 5)}…${address.slice(-4)}`;
}
