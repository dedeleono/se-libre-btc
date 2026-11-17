type LexicalJsonNode = { text?: unknown; children?: unknown };

const escapeHtml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function collectText(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const { text, children } = node as LexicalJsonNode;
  const own = typeof text === "string" ? text : "";
  return own + (Array.isArray(children) ? children.map(collectText).join("") : "");
}

export function parseNotes(raw: unknown): string {
  if (typeof raw !== "string" || raw.trim() === "") return "";
  if (!raw.trimStart().startsWith('{"root":')) return raw;
  try {
    const blocks: unknown = JSON.parse(raw)?.root?.children;
    if (!Array.isArray(blocks)) return `<p>${escapeHtml(raw)}</p>`;
    return blocks
      .map(collectText)
      .filter(Boolean)
      .map((text) => `<p>${escapeHtml(text)}</p>`)
      .join("");
  } catch {
    return `<p>${escapeHtml(raw)}</p>`;
  }
}
