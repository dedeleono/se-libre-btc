import { describe, expect, it } from "vitest";

import { locales } from "../i18n/messages";
import { isPublicRoute } from "../public-routes";

import {
  LEGAL_UPDATED_AT,
  legalDocumentKeys,
  legalDocumentPaths,
  legalDocuments,
  type LegalBlock,
} from "./content";

const allText = (blocks: readonly LegalBlock[]) => blocks.flatMap((block) => (typeof block === "string" ? [block] : block));

describe("legal documents", () => {
  it.each(legalDocumentKeys)("%s has the same sections in the same order in every locale", (key) => {
    const [first, ...rest] = locales.map((locale) => legalDocuments[locale][key]);
    for (const doc of rest) {
      expect(doc.sections.map((s) => s.id)).toEqual(first.sections.map((s) => s.id));
      doc.sections.forEach((section, index) => {
        const blocks = first.sections[index].blocks;
        expect(section.blocks.map((b) => (typeof b === "string" ? "p" : b.length))).toEqual(
          blocks.map((b) => (typeof b === "string" ? "p" : b.length)),
        );
      });
    }
  });

  it.each(legalDocumentKeys)("%s section ids are unique anchors", (key) => {
    for (const locale of locales) {
      const ids = legalDocuments[locale][key].sections.map((s) => s.id);
      expect(new Set(ids).size).toBe(ids.length);
      ids.forEach((id) => expect(id).toMatch(/^[a-z][a-z-]*$/));
    }
  });

  it.each(legalDocumentKeys)("%s has no placeholder brackets or empty text", (key) => {
    for (const locale of locales) {
      const doc = legalDocuments[locale][key];
      const text = [doc.title, doc.summary, ...doc.sections.flatMap((s) => [s.heading, ...allText(s.blocks)])];
      text.forEach((value) => {
        expect(value.trim()).not.toBe("");
        expect(value).not.toMatch(/[[\]{}]|TODO|XXX/);
      });
    }
  });

  it("the update date is a real ISO date", () => {
    expect(LEGAL_UPDATED_AT).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(new Date(`${LEGAL_UPDATED_AT}T00:00:00Z`).toISOString().startsWith(LEGAL_UPDATED_AT)).toBe(true);
  });

  it.each(legalDocumentKeys)("%s is reachable without a session", (key) => {
    expect(isPublicRoute(legalDocumentPaths[key])).toBe(true);
  });
});
