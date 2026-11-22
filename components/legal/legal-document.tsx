import type { Metadata } from "next";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";

import { getServerLocale } from "@/lib/i18n-server";
import { messages } from "@/lib/i18n/messages";
import {
  LEGAL_UPDATED_AT,
  SUPPORT_EMAIL,
  legalDocumentPaths,
  legalDocuments,
  type LegalDocumentKey,
} from "@/lib/legal/content";

const relatedDocument: Record<LegalDocumentKey, LegalDocumentKey> = {
  terms: "privacy",
  privacy: "terms",
};

const linkFocus =
  "rounded-[2px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground";

export function legalMetadata(key: LegalDocumentKey): Metadata {
  const doc = legalDocuments[getServerLocale()][key];
  return { title: `${doc.title} · Dinero Libre`, description: doc.summary };
}

function withSupportLink(text: string): ReactNode {
  const parts = text.split(SUPPORT_EMAIL);
  if (parts.length === 1) return text;
  return parts.map((part, index) => (
    <Fragment key={index}>
      {index > 0 && <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>}
      {part}
    </Fragment>
  ));
}

export default function LegalDocumentPage({ document: key }: { document: LegalDocumentKey }) {
  const locale = getServerLocale();
  const t = messages[locale].legal;
  const doc = legalDocuments[locale][key];
  const related = relatedDocument[key];
  const updated = new Intl.DateTimeFormat(locale === "es" ? "es-GT" : "en-US", {
    dateStyle: "long",
    timeZone: "UTC",
  }).format(new Date(`${LEGAL_UPDATED_AT}T00:00:00Z`));

  return (
    <div className="mx-auto max-w-[1160px] px-4 py-12 md:px-8 md:py-20">
      <header className="max-w-[65ch] space-y-5 border-b-2 border-foreground pb-8">
        <h1 className="text-[clamp(2.5rem,7vw,4.5rem)] text-balance text-foreground">{doc.title}</h1>
        <p className="text-pretty text-lg font-semibold leading-relaxed text-muted-foreground">
          {doc.summary}
        </p>
        <div className="space-y-1 text-sm text-muted-foreground">
          <p>
            <span className="font-bold text-foreground">{t.lastUpdated}:</span>{" "}
            <time dateTime={LEGAL_UPDATED_AT}>{updated}</time>
          </p>
          <p>{t.disclaimer}</p>
        </div>
      </header>

      <div className="mt-10 grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
        <nav aria-labelledby="legal-contents" className="lg:sticky lg:top-28 lg:self-start">
          <p
            id="legal-contents"
            className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground"
          >
            {t.contents}
          </p>
          <ol className="mt-3 border-s border-foreground/25 ps-4">
            {doc.sections.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className={`block py-1.5 text-sm font-semibold leading-snug text-muted-foreground transition-colors hover:text-foreground ${linkFocus}`}
                >
                  {section.heading}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <article className="lesson-content max-w-[56ch]">
          {doc.sections.map((section) => (
            <section key={section.id} aria-labelledby={section.id}>
              <h2 id={section.id} className="scroll-mt-28">
                {section.heading}
              </h2>
              {section.blocks.map((block, index) =>
                typeof block === "string" ? (
                  <p key={index}>{withSupportLink(block)}</p>
                ) : (
                  <ul key={index} className="list-disc">
                    {block.map((item) => (
                      <li key={item}>{withSupportLink(item)}</li>
                    ))}
                  </ul>
                ),
              )}
            </section>
          ))}
          <p className="mt-12 border-t border-foreground/25 pt-6">
            {t.relatedPrefix}{" "}
            <Link href={legalDocumentPaths[related]}>{legalDocuments[locale][related].title}</Link>
          </p>
        </article>
      </div>
    </div>
  );
}
