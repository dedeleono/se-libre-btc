import { describe, expect, it } from "vitest";

import { parseNotes } from "./notes";

const lexical = (blocks: unknown[]) => JSON.stringify({ root: { children: blocks, type: "root" } });

describe("parseNotes", () => {
  it("returns an empty notebook for missing or blank notes", () => {
    expect(parseNotes(null)).toBe("");
    expect(parseNotes(undefined)).toBe("");
    expect(parseNotes("")).toBe("");
    expect(parseNotes("   ")).toBe("");
  });

  it("passes HTML notes through unchanged", () => {
    const html = '<p class="PlaygroundEditorTheme__paragraph">hola</p>';
    expect(parseNotes(html)).toBe(html);
  });

  it("converts every paragraph of legacy Lexical JSON notes", () => {
    const raw =
      '{"root":{"children":[{"children":[{"text":"Hola","type":"text"}],"type":"paragraph"},{"children":[{"text":"Mundo","type":"text"}],"type":"paragraph"}],"type":"root"}}';
    expect(parseNotes(raw)).toBe("<p>Hola</p><p>Mundo</p>");
  });

  it("keeps nested text as one paragraph per top-level block", () => {
    const raw = lexical([
      {
        type: "list",
        children: [
          { type: "listitem", children: [{ type: "text", text: "uno" }] },
          { type: "listitem", children: [{ type: "text", text: "dos" }] },
        ],
      },
    ]);
    expect(parseNotes(raw)).toBe("<p>unodos</p>");
  });

  it("escapes HTML characters in legacy note text", () => {
    const raw = lexical([{ type: "paragraph", children: [{ type: "text", text: '<b>x</b> & "y"' }] }]);
    expect(parseNotes(raw)).toBe("<p>&lt;b&gt;x&lt;/b&gt; &amp; &quot;y&quot;</p>");
  });

  it("keeps malformed legacy JSON as visible text instead of dropping it", () => {
    expect(parseNotes('{"root": nope')).toBe("<p>{&quot;root&quot;: nope</p>");
  });

  it("returns an empty notebook for non-string input", () => {
    expect(parseNotes({})).toBe("");
    expect(parseNotes(42)).toBe("");
  });
});
