// Next 15 request APIs and the helpers in lib/i18n-server.ts that wrap them.
// Each returns a promise, and a synchronous read logs a dev warning and breaks in Next 16.
const ASYNC_REQUEST_CALL = /(?<![.\w])(cookies|headers|draftMode|getServerLocale|getServerMessages)\(\)/g;
const AWAITED = /await\s*\(?\s*$/;
const DEFINITION = /function\s+$/;
const UNSAFE_UNWRAP_TYPE = /\bUnsafeUnwrapped[A-Z]\w*/;

export type SyncRequestApiUse = { line: number; text: string };

export function findSyncRequestApiUses(source: string): SyncRequestApiUse[] {
  const uses: SyncRequestApiUse[] = [];
  source.split("\n").forEach((text, index) => {
    if (UNSAFE_UNWRAP_TYPE.test(text)) {
      uses.push({ line: index + 1, text: text.trim() });
      return;
    }
    for (const match of text.matchAll(ASYNC_REQUEST_CALL)) {
      const before = text.slice(0, match.index);
      if (!AWAITED.test(before) && !DEFINITION.test(before)) {
        uses.push({ line: index + 1, text: text.trim() });
        return;
      }
    }
  });
  return uses;
}
