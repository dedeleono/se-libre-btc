/**
 * One-off migration: clean up rich-text fields that accidentally stored the
 * Lexical editor's ContentEditable wrapper DOM instead of the actual content.
 *
 * Background: the editor's onChange used to serialize content by scraping
 * `document.querySelector('.editor-container .editor').innerHTML`, which captured
 * the `<div class="ContentEditable__root" contenteditable="true" ...>` wrapper
 * around the real content. The serializer is now fixed (uses
 * $generateHtmlFromNodes), but rows saved before the fix still contain the
 * wrapper. This script unwraps them, preserving the inner rich-text HTML so it
 * matches what the fixed editor now produces.
 *
 * Run (dry-run, prints what WOULD change, writes nothing):
 *   TS_NODE_COMPILER_OPTIONS='{"module":"commonjs","moduleResolution":"node"}' \
 *     node --env-file=.env -r ts-node/register/transpile-only \
 *     scripts/cleanup-lexical-wrappers.ts
 *
 * Apply the changes:
 *   ...same command... scripts/cleanup-lexical-wrappers.ts --apply
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ log: ["error", "warn"] });

const MARKER = "ContentEditable__root";

// Every field written by the rich-text <Editor> component.
const TARGETS = [
  { model: "course", field: "description", label: "Course.description" },
  { model: "courseModule", field: "description", label: "CourseModule.description" },
  { model: "chapter", field: "description", label: "Chapter.description" },
  { model: "chapter", field: "richContent", label: "Chapter.richContent" },
] as const;

// Editor-chrome classes that the old DOM scrape leaked in as siblings of the
// content (floating toolbars, drag handles, placeholder). The real content
// lives ONLY inside ContentEditable__root, so anything outside it is discarded.
const CHROME_MARKERS = [
  "ContentEditable__root",
  "ContentEditable__placeholder",
  "link-editor",
  "draggable-block-menu",
  "draggable-block-target-line",
  "table-cell-action-button-container",
];

/**
 * Returns the inner rich-text HTML of the `<div class="ContentEditable__root">`
 * wrapper, discarding everything outside it (the leaked floating UI siblings).
 * Uses depth-balanced <div> matching so nested divs inside real content
 * (layouts, tables, collapsibles) survive, and recurses in the unlikely event
 * the content was wrapped more than once.
 */
function unwrapContentEditable(html: string, pass = 0): string {
  if (pass > 5) return html.trim();

  const openRe = /<div\b[^>]*\bContentEditable__root\b[^>]*>/i;
  const open = openRe.exec(html);
  if (!open) return html.trim();

  const innerStart = open.index + open[0].length;

  // Balance <div>/</div> from innerStart to locate the matching close tag.
  const tagRe = /<(\/?)div\b[^>]*?>/gi;
  tagRe.lastIndex = innerStart;
  let depth = 1;
  let closeStart = -1;
  let m: RegExpExecArray | null;
  while ((m = tagRe.exec(html)) !== null) {
    const isClose = m[1] === "/";
    const selfClosing = /\/>\s*$/.test(m[0]);
    if (isClose) {
      depth--;
      if (depth === 0) {
        closeStart = m.index;
        break;
      }
    } else if (!selfClosing) {
      depth++;
    }
  }

  if (closeStart === -1) return html.trim(); // unbalanced — bail, don't corrupt

  const inner = html.slice(innerStart, closeStart).trim();
  return openRe.test(inner) ? unwrapContentEditable(inner, pass + 1) : inner;
}

const truncate = (s: string, n = 120) =>
  s.length > n ? `${s.slice(0, n)}…` : s;

async function main() {
  const apply = process.argv.includes("--apply");
  console.log(
    apply
      ? "MODE: APPLY — changes will be written to the database\n"
      : "MODE: DRY-RUN — no changes will be written (pass --apply to write)\n"
  );

  let totalAffected = 0;
  let totalUpdated = 0;

  for (const target of TARGETS) {
    const delegate = (prisma as any)[target.model];
    const rows: Array<Record<string, any>> = await delegate.findMany({
      where: { [target.field]: { contains: MARKER } },
      select: { id: true, [target.field]: true },
    });

    if (rows.length === 0) {
      console.log(`✓ ${target.label}: no corrupted rows`);
      continue;
    }

    console.log(`\n── ${target.label}: ${rows.length} corrupted row(s) ──`);

    for (const row of rows) {
      const before = (row[target.field] as string) ?? "";
      const after = unwrapContentEditable(before);
      totalAffected++;

      const leftoverChrome = CHROME_MARKERS.filter((c) => after.includes(c));
      console.log(`  • id=${row.id}`);
      console.log(`      before: ${truncate(before)}`);
      console.log(`      after:  ${truncate(after) || "(empty)"}`);
      if (leftoverChrome.length > 0) {
        console.log(
          `      ⚠️  editor chrome still present (${leftoverChrome.join(", ")}) — SKIPPING this row`
        );
        continue;
      }
      if (after === before) {
        console.log("      (no change)");
        continue;
      }

      if (apply) {
        await delegate.update({
          where: { id: row.id },
          data: { [target.field]: after },
        });
        totalUpdated++;
      }
    }
  }

  console.log(
    `\nDone. ${totalAffected} corrupted field value(s) found, ${
      apply ? `${totalUpdated} updated.` : "0 updated (dry-run)."
    }`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
