# Course Completion: Maverick Upsell + Certificate of Completion

**Date:** 2026-06-21
**Status:** Approved (pending spec review)

## Goal

When a student finishes the Dinero Libre course, give them a dedicated celebration
moment that does two things:

1. **Certificate of completion** — a downloadable, shareable, verifiable diploma the
   student earned. Two selectable designs (Standard / Punk), prefilled-but-editable
   name, server-rendered PNG, with a QR + serial that links to a public verification
   page.
2. **Maverick Capital Investment upsell** — a clearly-separated partner CTA pointing
   students who now understand Bitcoin toward buying it.

Both live on one dedicated completion page. The **certificate comes first** (the reward
they earned); the **Maverick CTA comes second** (the natural next step). They are
visually distinct sections so the upsell never reads as part of the diploma.

## Background / current state

- Progress is tracked per chapter. `actions/get-progress.ts` returns 100% once every
  published chapter has a completed `ChapterProgress`. There is no course-level
  "finished" event today.
- `CourseEnrollment.completedAt` already exists in the schema but is **never set**.
- `ChapterProgress.completedAt` exists but is **never set** by the progress route.
- The last lesson's `CompletionButton` currently dead-ends at "Última lección" with no
  next action.
- `User` has `name`, `firstName`, `lastName` for the certificate recipient name.
- No PDF/image-generation library is installed. `next/og` (`ImageResponse`) is built
  into Next 14. `framer-motion` is available. `qrcode.react` is installed (DOM-only).
- Brand tokens in `app/globals.css`: Bitcoin orange `--naranja-500 #F7931A`, dark
  `--volcan-900`, cream `--crema-050`; fonts Anton (display), Quicksand (body),
  Playfair Display (serif). The two PDF designs in `public/certs/` use exactly this
  language (Punk = dark/orange/stickers; Standard = cream/formal frame).
- App is Spanish-first bilingual (es/en) via `lib/i18n/messages.ts`.

## Decisions (locked with the user)

| Decision | Choice |
| --- | --- |
| Completion UX | Dedicated page `/courses/[courseId]/complete` |
| Certificate output | Server-rendered PNG via `next/og` |
| Name on certificate | Prefill from profile, editable before download |
| Verification | Unique serial + QR → public `/verify/[serial]` page |
| Persistence | Record `CourseEnrollment.completedAt`; re-access from dashboard |
| Preview rendering | Single source: preview `<img>` = the PNG route (approach A) |
| Section order | Certificate first, Maverick CTA second, visually separated |

## Architecture

```
Last lesson ──complete──▶ /courses/[courseId]/complete  (guard: progress == 100%)
                                  │
        ┌─────────────────────────┴──────────────────────────┐
        │ 1. Hero: ¡Felicidades! (framer-motion + confetti)   │
        │ 2. Certificate studio (the reward)                  │
        │      • editable name (prefilled)                    │
        │      • design toggle: Standard / Punk               │
        │      • <img> preview  ==  the PNG route             │
        │      • "Descargar certificado"                      │
        │ ───────────── visual divider ──────────────         │
        │ 3. Maverick Capital Investment CTA (next step)      │
        └────────────────────────────────────────────────────┘
                                  │
   GET /api/certificates/[id]/image[?download=1]  ─▶ next/og PNG (Standard|Punk) + QR
                                  │
                  QR encodes ─▶ /verify/[serial]  (public validity page)
```

**Single source of truth:** the `next/og` route renders the certificate from the stored
`Certificate` record (never from unsigned query params), so preview === download ===
verify render, and the recipient name cannot be spoofed via the URL.

## Data model

```prisma
enum CertificateDesign {
  STANDARD
  PUNK
}

model Certificate {
  id            String   @id @default(cuid())
  serial        String   @unique          // human-friendly, e.g. "DL-2026-7QK4ZP"
  userId        String
  courseId      String
  recipientName String                     // editable, stored server-side
  design        CertificateDesign @default(STANDARD)
  issuedAt      DateTime @default(now())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, courseId])             // one certificate per user per course
  @@index([userId])
  @@index([courseId])
}
```

Add back-relations `certificates Certificate[]` to `User` and `Course`.

**Serial format:** `DL-<year>-<6 char base32 from id/random>`. Generated at creation,
unique. Used in the verify URL and printed on the certificate.

**Migration:** `migrate dev` is broken in this repo — hand-write the migration SQL and
apply with `prisma migrate deploy` (see project memory `prisma-migration-workflow`).

## Completion recording

In `app/api/courses/[courseId]/chapters/[chapterId]/progress/route.ts` (the existing
`PUT`):

1. Upsert `ChapterProgress` with `isCompleted: true` **and `completedAt: now()`**
   (fix the currently-unused field).
2. Recompute progress via `getProgress(userId, courseId)`.
3. If `progress === 100` and the user's `CourseEnrollment.completedAt` is null, set it
   to `now()`. (Find enrollment by `userId_courseId`; no-op if no enrollment row.)

This keeps a single authoritative completion timestamp and is idempotent.

## The completion page — `app/(course)/courses/[courseId]/complete/page.tsx`

Server component.

- **Guard:** require an authenticated, enrolled user whose `getProgress == 100`.
  Otherwise `redirect("/courses/[courseId]")`. (Accept either live 100% or a set
  `completedAt` so re-visits work even if a chapter is later unpublished.)
- **Ensure certificate:** server-side, upsert a `Certificate` for `(userId, courseId)`.
  Prefill `recipientName` from `firstName + " " + lastName` (trimmed) || `name` ||
  email local-part. Default `design = STANDARD`.
- **Layout (top → bottom):**
  1. **Hero** — Anton display "¡FELICIDADES!" + "Completaste el curso {courseTitle}".
     `framer-motion` entrance; a light confetti burst (small canvas/CSS, no heavy dep).
  2. **Certificate studio** (client island `CertificateStudio`):
     - Editable name `Input` (prefilled).
     - Standard/Punk toggle (segmented control / two preview thumbnails).
     - `<img>` preview pointing at the PNG route with a cache-bust `?v={updatedAt}`.
     - "Descargar certificado" button → PNG route with `?download=1`.
     - Name edit (debounced ~400ms) and design toggle call a server action
       `updateCertificate({ id, recipientName?, design? })`; on success the `<img>`
       refreshes via a new `v` value.
     - Small "Verifica este certificado en …/verify/{serial}" helper text/link.
  3. **Divider** — clear visual break (rule + spacing, distinct background) so the
     upsell is unmistakably separate from the diploma.
  4. **Maverick CTA** (`MaverickCta`, static, brand-styled card, marked as partner):
     - Heading: **"Comunícate con los expertos de Bitcoin"**
     - **Maverick Capital Investment**
     - Primary button → `https://maverickcapitalinvestment.com`
       (`target="_blank" rel="noopener noreferrer"`)
     - Phone `+502 3206-5088` as a `tel:+50232065088` link.

## Certificate image route — `app/api/certificates/[id]/image/route.tsx`

- Uses `ImageResponse` from `next/og`. **Node runtime** (to read bundled font files and
  run the QR lib comfortably).
- Loads the `Certificate` by `id`, plus its course title. 404 if not found.
- Size **1600 × 1131** (landscape, ~A-series ratio matching the source PDFs).
- Two JSX templates switched on `certificate.design`:
  - **Standard** — cream background (`--crema-050`), formal double border, Playfair +
    Anton "CERTIFICADO", centered seal, body "Por culminar con éxito el curso
    {courseTitle}. Otorgado a:" + **{recipientName}** on a rule, footer "Asociación
    Guatemala Libre", and a footer row with issue date · serial · QR.
  - **Punk** — dark background (`--volcan-900`), Bitcoin-orange accents, sticker tags
    ("#DINEROLIBRE", "SIN PERMISO", "NI BANCOS · NI PERMISO · NI MIEDO"), white
    "CERTIFICADO" with orange offset shadow, body "Completó el curso {courseTitle}.
    Otorgado a:" + **{recipientName}**, "Sé tu propio banco / Asociación Guatemala
    Libre", bottom slogan ribbon, and issue date · serial · QR.
- **Fonts:** bundle `Anton`, `Quicksand`, `Playfair Display` `.ttf` under
  `assets/fonts/` (Google `@import` does not apply inside `next/og`). Load each as an
  `ArrayBuffer` and pass via the `fonts` option.
- **Logo / seal:** embed `public/logo.png` / `public/logoDark.png` as data URIs. If the
  orange "Sé tu propio banco" seal in the source PDFs is not part of the existing logo
  assets, export it to `assets/` as a standalone PNG/SVG (flagged as an asset task).
- **QR:** add the small pure-JS **`qrcode`** dependency; generate a data-URI QR encoding
  the absolute `/verify/{serial}` URL (base URL from request origin / env) and embed it
  as `<img>` in the template.
- **Download mode:** when `?download=1`, set
  `Content-Disposition: attachment; filename="certificado-dinero-libre.png"`.

## Verification page — `app/verify/[serial]/page.tsx`

- Public, no auth. Looks up `Certificate` by `serial`.
- **Found:** "Certificado válido ✓" badge with recipient name, course title, issue date,
  serial, and the certificate image (`<img>` of the PNG route by id).
- **Not found:** "Certificado no encontrado" empty state.

## Entry points

1. **Last-lesson completion** — in `completion-button.tsx`, when completion succeeds and
   there is **no `nextChapterId`**, `router.push("/courses/[courseId]/complete")`
   instead of dead-ending at "Última lección".
2. **Dashboard "Mis cursos"** — completed courses (enrollment `completedAt != null`)
   show a "Ver certificado" link → `/courses/[courseId]/complete`.

## i18n

- New `completion` and `certificate` namespaces in both `es` and `en` in
  `lib/i18n/messages.ts` (titles, labels, buttons, verify-page strings).
- Maverick proper nouns ("Maverick Capital Investment", URL, phone) remain literal in
  both locales.

## Files

**Create**
- `app/(course)/courses/[courseId]/complete/page.tsx` — completion page (server).
- `app/(course)/courses/[courseId]/complete/_components/certificate-studio.tsx` — client.
- `app/(course)/courses/[courseId]/complete/_components/maverick-cta.tsx` — static CTA.
- `app/(course)/courses/[courseId]/complete/_components/completion-hero.tsx` — hero+confetti.
- `app/api/certificates/[id]/image/route.tsx` — `next/og` PNG (both templates).
- `app/verify/[serial]/page.tsx` — public verification page.
- `actions/certificate.ts` — `ensureCertificate`, `updateCertificate` (server actions).
- `lib/certificate.ts` — serial generation + design helpers + recipient-name prefill.
- `assets/fonts/*.ttf`, optional `assets/seal.*` — bundled assets for og.
- Prisma migration SQL (hand-written) for `Certificate` + enum.

**Modify**
- `prisma/schema.prisma` — `Certificate` model, `CertificateDesign` enum, back-relations.
- `app/api/courses/[courseId]/chapters/[chapterId]/progress/route.ts` — set
  `completedAt` on chapter + course on 100%.
- `app/(course)/courses/[courseId]/chapters/[chapterId]/_components/completion-button.tsx`
  — redirect to `/complete` on last lesson.
- Student dashboard "Mis cursos" — "Ver certificado" link for completed courses.
- `lib/i18n/messages.ts` — new namespaces (es + en).
- `package.json` — add `qrcode` (+ `@types/qrcode` dev).

## Scope / YAGNI

**In:** completion page, certificate-first + Maverick-second layout, two designs,
editable name, QR + serial verification, completion recording, dashboard link, i18n.

**Out (later, easy on this foundation):** admin certificate management/revocation,
emailing the certificate, LinkedIn "add to profile" deep-link, per-cohort branding,
certificate analytics.

## Risks / notes

- `next/og` font loading must use bundled buffers; verify the three families render in
  the route (a common gotcha).
- Recreating the two PDF designs in satori's CSS subset (flexbox, no arbitrary
  `background-image` tricks) requires care — the slogan ribbon and ornate frame may need
  simplification while staying faithful. Validate visually against the source PDFs.
- Confetti should stay dependency-light; if `framer-motion` alone is awkward, a tiny
  self-contained canvas burst is acceptable. No heavy confetti lib.
- QR base URL must resolve correctly in preview/prod (derive from request, fall back to
  an env var).
