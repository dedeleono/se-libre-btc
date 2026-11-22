import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import ts from "typescript";
import { describe, expect, it } from "vitest";

// Walks the static import graph of the Lexical editor from every app-facing entry point
// and records which file imports which bare package. Guards the removal of the vendored
// playground's websocket collaboration mode.

const ROOT = path.resolve(__dirname, "..");
const ENTRY_POINTS = [
  "components/editor.tsx",
  "components/expandable-editor.tsx",
  "components/lexical-editor-wrapper.tsx",
  "components/editor/editor.tsx",
];
const EXTENSIONS = ["", ".ts", ".tsx", "/index.ts", "/index.tsx"];

function resolveLocal(fromFile: string, specifier: string): string | null {
  const base = specifier.startsWith("@/")
    ? path.join(ROOT, specifier.slice(2))
    : path.resolve(path.dirname(fromFile), specifier);
  for (const ext of EXTENSIONS) {
    const candidate = base + ext;
    if (/\.tsx?$/.test(candidate) && existsSync(candidate)) return candidate;
  }
  return null; // CSS, JSON, images
}

function walkEditorGraph() {
  const packageImporters = new Map<string, Set<string>>();
  const seen = new Set<string>();
  const queue = ENTRY_POINTS.map((p) => path.join(ROOT, p));
  while (queue.length > 0) {
    const file = queue.pop()!;
    if (seen.has(file)) continue;
    seen.add(file);
    const { importedFiles } = ts.preProcessFile(readFileSync(file, "utf8"), true, true);
    for (const { fileName: spec } of importedFiles) {
      if (spec.startsWith(".") || spec.startsWith("@/")) {
        const resolved = resolveLocal(file, spec);
        if (resolved) queue.push(resolved);
        continue;
      }
      const importers = packageImporters.get(spec) ?? new Set<string>();
      importers.add(path.relative(ROOT, file));
      packageImporters.set(spec, importers);
    }
  }
  return { files: seen, packageImporters };
}

describe("editor module graph", () => {
  const { files, packageImporters } = walkEditorGraph();
  const importersOf = (pkg: string) => [...(packageImporters.get(pkg) ?? [])].sort();

  it("walks the real editor (sanity check)", () => {
    expect(files.size).toBeGreaterThan(50);
    expect(importersOf("lexical").length).toBeGreaterThan(0);
  });

  it("no longer imports y-websocket or the collaboration plugin", () => {
    expect(importersOf("y-websocket")).toEqual([]);
    expect(importersOf("@lexical/react/LexicalCollaborationPlugin")).toEqual([]);
    expect([...files].some((f) => f.endsWith("components/editor/collaboration.ts"))).toBe(false);
  });

  it("no longer carries the Lexical playground's dev-only tooling", () => {
    const devOnly = [
      "components/editor/Settings.tsx",
      "components/editor-ui/Switch.tsx",
      "components/editor/plugins/DocsPlugin/index.tsx",
      "components/editor/plugins/PasteLogPlugin/index.tsx",
      "components/editor/plugins/TestRecorderPlugin/index.tsx",
      "components/editor/plugins/TreeViewPlugin/index.tsx",
      "components/editor/plugins/TypingPerfPlugin/index.ts",
    ];
    for (const file of devOnly) expect(existsSync(path.join(ROOT, file)), file).toBe(false);
    expect(importersOf("@lexical/react/LexicalTreeView")).toEqual([]);
    const source = [...files].map((f) => readFileSync(f, "utf8")).join("\n");
    expect(source).not.toMatch(/isDevPlayground|showTreeView|showNestedEditorTreeView|measureTypingPerf|setURLParam/);
  });

  it("imports yjs only from the comments feature", () => {
    expect(importersOf("yjs")).toEqual([
      "components/editor/commenting/index.ts",
      "components/editor/plugins/CommentPlugin/index.tsx",
    ]);
  });
});
