import fs from "node:fs";
import path from "node:path";

import ts from "typescript";
import { describe, expect, it } from "vitest";

const ROOT = path.resolve(__dirname, "../..");
const SCANNED_DIRS = ["app", "components"];
const EXCLUDED = ["app/(client)/page.tsx", "app/(course)/courses/[courseId]/"];
const TRIGGER = /^(DropdownMenu|Popover|Sheet|Dialog|Drawer|Tooltip|AlertDialog|Collapsible|HoverCard)Trigger$/;

type Source = { file: string; sf: ts.SourceFile };

function collectSources(): Source[] {
  return SCANNED_DIRS.flatMap((dir) =>
    (fs.readdirSync(path.join(ROOT, dir), { recursive: true }) as string[])
      .filter((entry) => entry.endsWith(".tsx"))
      .map((entry) => path.join(dir, entry).split(path.sep).join("/"))
      .filter((file) => !EXCLUDED.some((prefix) => file.startsWith(prefix)))
      .map((file) => ({
        file,
        sf: ts.createSourceFile(
          file,
          fs.readFileSync(path.join(ROOT, file), "utf8"),
          ts.ScriptTarget.Latest,
          true,
          ts.ScriptKind.TSX,
        ),
      })),
  );
}

function walk(node: ts.Node, visit: (node: ts.Node) => void) {
  visit(node);
  node.forEachChild((child) => walk(child, visit));
}

function tagName(node: ts.JsxOpeningLikeElement) {
  return node.tagName.getText();
}

function attribute(node: ts.JsxOpeningLikeElement, name: string) {
  return node.attributes.properties.find(
    (prop): prop is ts.JsxAttribute =>
      ts.isJsxAttribute(prop) && prop.name.getText() === name,
  );
}

function stringValue(attr: ts.JsxAttribute | undefined) {
  return attr?.initializer && ts.isStringLiteral(attr.initializer)
    ? attr.initializer.text
    : undefined;
}

function childElements(element: ts.JsxElement) {
  return element.children.filter(
    (child): child is ts.JsxElement | ts.JsxSelfClosingElement =>
      ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child),
  );
}

function openingOf(element: ts.JsxElement | ts.JsxSelfClosingElement) {
  return ts.isJsxElement(element) ? element.openingElement : element;
}

function hasSrOnlyDescendant(element: ts.JsxElement) {
  let found = false;
  walk(element, (node) => {
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      stringValue(attribute(node, "className"))?.split(/\s+/).includes("sr-only")
    ) {
      found = true;
    }
  });
  return found;
}

function location({ file, sf }: Source, node: ts.Node) {
  return `${file}:${sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1}`;
}

function iconButtonIsNamed(opening: ts.JsxOpeningLikeElement) {
  if (
    attribute(opening, "aria-label") ||
    attribute(opening, "aria-labelledby") ||
    opening.attributes.properties.some(ts.isJsxSpreadAttribute)
  ) {
    return true;
  }
  if (!ts.isJsxOpeningElement(opening)) return false;
  const element = opening.parent;
  if (attribute(opening, "asChild")) {
    const [first] = childElements(element);
    if (first && attribute(openingOf(first), "aria-label")) return true;
  }
  return hasSrOnlyDescendant(element);
}

describe("JSX structure (landing page and lesson player excluded: owned by other plans)", () => {
  const sources = collectSources();

  it("gives every icon-only Button an accessible name", () => {
    const violations: string[] = [];
    for (const source of sources) {
      walk(source.sf, (node) => {
        if (
          (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
          tagName(node) === "Button" &&
          stringValue(attribute(node, "size")) === "icon" &&
          !iconButtonIsNamed(node)
        ) {
          violations.push(location(source, node));
        }
      });
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });

  it("never nests a button inside a Radix trigger that lacks asChild", () => {
    const violations: string[] = [];
    for (const source of sources) {
      walk(source.sf, (node) => {
        if (
          ts.isJsxElement(node) &&
          TRIGGER.test(tagName(node.openingElement)) &&
          !attribute(node.openingElement, "asChild") &&
          childElements(node).some((child) =>
            ["Button", "button"].includes(tagName(openingOf(child))),
          )
        ) {
          violations.push(location(source, node));
        }
      });
    }
    expect(violations, violations.join("\n")).toEqual([]);
  });
});
