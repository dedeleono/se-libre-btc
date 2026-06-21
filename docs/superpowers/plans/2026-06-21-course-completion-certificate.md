# Course Completion Certificate + Maverick Upsell — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** When a student finishes a course, show a dedicated `/complete` page with a downloadable, verifiable certificate of completion (two designs, editable name) followed by a clearly-separated Maverick Capital Investment "buy BTC" CTA.

**Architecture:** A new `Certificate` Prisma record is the single source of truth. A `next/og` route renders the certificate PNG from that record (so on-page preview, download, and the public `/verify/[serial]` page are identical and the name cannot be spoofed). Course completion is recorded on `CourseEnrollment.completedAt` inside the existing chapter-progress route. The completion page composes a celebration hero, a client "certificate studio" (name + design + preview + download), and a static Maverick CTA.

**Tech Stack:** Next.js 14.2.5 App Router (Server Components + Server Actions), Prisma + PostgreSQL, `next/og` (`ImageResponse`), `qrcode` (new dep), `framer-motion`, shadcn/ui, Tailwind, custom i18n (`lib/i18n/messages.ts`), Vitest (pure-logic only).

## Global Constraints

- **Spanish-first bilingual.** Every user-facing string goes in both `es` and `en` in `lib/i18n/messages.ts`. `es` is defined first and is the type source (`export type Messages = typeof es`). UI reads strings via `useLocale()` (client) or `getServerMessages()` (server). Maverick proper nouns are literal in both locales.
- **Maverick content (verbatim):** heading "Comunícate con los expertos de Bitcoin"; name "Maverick Capital Investment"; URL `https://maverickcapitalinvestment.com`; phone `+502 3206-5088` (tel: `+50232065088`).
- **Prisma migrations:** `prisma migrate dev` is broken in this repo. Hand-write SQL under `prisma/migrations/<timestamp>_<name>/migration.sql` and apply with `npx prisma migrate deploy`. Provider is PostgreSQL.
- **Prisma client import:** `import { prisma } from "@/lib/db"`. Auth: `import { auth } from "@/lib/auth"` → `const session = await auth(); session.user.id`.
- **Certificate rule:** exactly one `Certificate` per `(userId, courseId)`.
- **next/og templates use inline styles only** (no Tailwind/`className`); images must be embedded as data URLs.
- **Tests:** Vitest is config-limited to pure logic (node env, no jsdom/RTL). Apply TDD to pure helpers. For routes/pages/components, verification = `npx tsc --noEmit`, `npm run lint`, and the explicit manual checks given per task. Do **not** add a React test harness.
- **Brand tokens** (from `app/globals.css`): `--naranja-500 #F7931A`, `--naranja-700 #B25F00`, `--volcan-900 #14110D`, `--volcan-500 #3A352D`, `--crema-050 #FBF6EE`, `--crema-200 #E8DCC6`, `--maiz-500 #E2B23A`. Fonts: Anton (display), Quicksand (body), Playfair Display (serif).

---

### Task 1: Certificate Prisma model + migration

**Files:**
- Modify: `prisma/schema.prisma` (add enum, model, back-relations)
- Create: `prisma/migrations/20260621000000_add_certificate/migration.sql`

**Interfaces:**
- Produces: Prisma model `Certificate { id, serial, userId, courseId, recipientName, design: CertificateDesign, issuedAt, createdAt, updatedAt }`; enum `CertificateDesign { STANDARD, PUNK }`; relations `User.certificates`, `Course.certificates`. Unique `(userId, courseId)` and unique `serial`.

- [ ] **Step 1: Add the enum and model to `prisma/schema.prisma`**

Add near the other enums (top of file region with enums) and models:

```prisma
enum CertificateDesign {
  STANDARD
  PUNK
}

model Certificate {
  id            String            @id @default(cuid())
  serial        String            @unique
  userId        String
  courseId      String
  recipientName String
  design        CertificateDesign @default(STANDARD)
  issuedAt      DateTime          @default(now())

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  course Course @relation(fields: [courseId], references: [id], onDelete: Cascade)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([userId, courseId])
  @@index([userId])
  @@index([courseId])
}
```

- [ ] **Step 2: Add back-relations**

In `model User` (after `chapterProgress ChapterProgress[]`):
```prisma
  certificates       Certificate[]
```
In `model Course` (after `pendingInvitations PendingInvitation[]`):
```prisma
  certificates       Certificate[]
```

- [ ] **Step 3: Write the migration SQL**

Create `prisma/migrations/20260621000000_add_certificate/migration.sql`:

```sql
-- Certificate of completion
CREATE TYPE "CertificateDesign" AS ENUM ('STANDARD', 'PUNK');

CREATE TABLE "Certificate" (
    "id" TEXT NOT NULL,
    "serial" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "recipientName" TEXT NOT NULL,
    "design" "CertificateDesign" NOT NULL DEFAULT 'STANDARD',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Certificate_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Certificate_serial_key" ON "Certificate"("serial");
CREATE UNIQUE INDEX "Certificate_userId_courseId_key" ON "Certificate"("userId", "courseId");
CREATE INDEX "Certificate_userId_idx" ON "Certificate"("userId");
CREATE INDEX "Certificate_courseId_idx" ON "Certificate"("courseId");

ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Certificate" ADD CONSTRAINT "Certificate_courseId_fkey"
    FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
```

- [ ] **Step 4: Apply migration and regenerate client**

Run: `npx prisma migrate deploy && npx prisma generate`
Expected: "1 migration applied" (or "No pending migrations" if already applied) and "Generated Prisma Client".

- [ ] **Step 5: Verify the schema compiles and the type exists**

Run: `npx tsc --noEmit`
Expected: no errors. (Confirms `Certificate`/`CertificateDesign` are in the generated client.)

- [ ] **Step 6: Commit**

```bash
git add prisma/schema.prisma prisma/migrations/20260621000000_add_certificate/
git commit -m "feat(db): add Certificate model + CertificateDesign enum"
```

---

### Task 2: Certificate domain helpers (`lib/certificate.ts`) — TDD

**Files:**
- Create: `lib/certificate.ts`
- Create: `lib/certificate.test.ts`
- Modify: `vitest.config.ts` (broaden include)

**Interfaces:**
- Produces:
  - `generateSerial(date?: Date): string` → `"DL-<year>-<6 uppercase base32 chars>"` (e.g. `DL-2026-7QK4ZP`).
  - `prefillRecipientName(user: { firstName?: string | null; lastName?: string | null; name?: string | null; email: string }): string`.
  - `type CertificateRecipient = Parameters<typeof prefillRecipientName>[0]`.

- [ ] **Step 1: Broaden Vitest include**

In `vitest.config.ts`, change `include` to:
```ts
    include: ["lib/**/*.test.ts"],
```

- [ ] **Step 2: Write the failing test**

Create `lib/certificate.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { generateSerial, prefillRecipientName } from "./certificate";

describe("generateSerial", () => {
  it("formats as DL-<year>-<6 base32 chars>", () => {
    const serial = generateSerial(new Date("2026-06-21T00:00:00Z"));
    expect(serial).toMatch(/^DL-2026-[0-9A-HJKMNP-TV-Z]{6}$/);
  });

  it("is unique across many calls", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 1000; i++) seen.add(generateSerial());
    expect(seen.size).toBe(1000);
  });
});

describe("prefillRecipientName", () => {
  it("uses firstName + lastName when present", () => {
    expect(
      prefillRecipientName({ firstName: "Diego", lastName: "Oliva", name: null, email: "d@x.com" })
    ).toBe("Diego Oliva");
  });

  it("falls back to name, then email local-part", () => {
    expect(prefillRecipientName({ firstName: null, lastName: null, name: "Satoshi", email: "s@x.com" })).toBe("Satoshi");
    expect(prefillRecipientName({ firstName: null, lastName: null, name: null, email: "nakamoto@x.com" })).toBe("nakamoto");
  });

  it("trims and collapses whitespace", () => {
    expect(prefillRecipientName({ firstName: "  Ana ", lastName: " ", name: null, email: "a@x.com" })).toBe("Ana");
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- lib/certificate.test.ts`
Expected: FAIL — cannot import from `./certificate` (module not found).

- [ ] **Step 4: Implement `lib/certificate.ts`**

```ts
import { randomInt } from "node:crypto";

// Crockford base32 (no I, L, O, U) — unambiguous, human-readable.
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function generateSerial(date: Date = new Date()): string {
  const year = date.getUTCFullYear();
  let code = "";
  for (let i = 0; i < 6; i++) code += ALPHABET[randomInt(0, ALPHABET.length)];
  return `DL-${year}-${code}`;
}

export type CertificateRecipient = {
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  email: string;
};

export function prefillRecipientName(user: CertificateRecipient): string {
  const clean = (v?: string | null) => (v ?? "").replace(/\s+/g, " ").trim();
  const full = clean(`${clean(user.firstName)} ${clean(user.lastName)}`);
  if (full) return full;
  const name = clean(user.name);
  if (name) return name;
  return user.email.split("@")[0];
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- lib/certificate.test.ts`
Expected: PASS (all cases green).

- [ ] **Step 6: Commit**

```bash
git add lib/certificate.ts lib/certificate.test.ts vitest.config.ts
git commit -m "feat(cert): serial generation + recipient-name prefill helpers"
```

---

### Task 3: i18n namespaces (`completion` + `certificate`)

**Files:**
- Modify: `lib/i18n/messages.ts` (add namespaces to `es` and `en`)

**Interfaces:**
- Produces: `t.completion.*` and `t.certificate.*` strings used by Tasks 8, 9, 10.

- [ ] **Step 1: Add the namespaces to the `es` object**

Inside `const es = { ... }`, after the `course: { ... },` block (ends ~line 723), add:
```ts
    completion: {
      heroTitle: "¡Felicidades!",
      heroSubtitle: (course: string) => `Completaste el curso ${course}`,
      certificateSectionTitle: "Tu certificado",
      certificateSectionSubtitle: "Personaliza tu nombre y descarga tu certificado de finalización.",
      nameLabel: "Nombre en el certificado",
      namePlaceholder: "Tu nombre completo",
      designLabel: "Diseño",
      designStandard: "Clásico",
      designPunk: "Punk",
      download: "Descargar certificado",
      preview: "Vista previa del certificado",
      verifyHint: (url: string) => `Verifica este certificado en ${url}`,
      maverickKicker: "¿Listo para tu primer Bitcoin?",
      maverickTitle: "Comunícate con los expertos de Bitcoin",
      maverickPartner: "Maverick Capital Investment",
      maverickWebsiteCta: "Visitar Maverick Capital Investment",
      maverickPhoneLabel: "Teléfono",
      maverickDisclaimer: "Socio externo. Dinero Libre no gestiona compras de Bitcoin.",
    },
    certificate: {
      issuedTo: "Otorgado a:",
      bodyStandard: (course: string) => `Por culminar con éxito el curso ${course}.`,
      bodyPunk: (course: string) => `Completó el curso ${course}.`,
      issuedOn: "Fecha de emisión",
      serialLabel: "Folio",
      verifyTitle: "Verificación de certificado",
      verifyValid: "Certificado válido",
      verifyNotFound: "Certificado no encontrado",
      verifyNotFoundDescription: "No encontramos un certificado con este folio. Verifica el enlace e inténtalo de nuevo.",
      recipient: "Titular",
      courseLabel: "Curso",
    },
```

- [ ] **Step 2: Add the same namespaces to the `en` object**

Inside `const en: Messages = { ... }`, after its `course: { ... },` block, add:
```ts
    completion: {
      heroTitle: "Congratulations!",
      heroSubtitle: (course: string) => `You completed the ${course} course`,
      certificateSectionTitle: "Your certificate",
      certificateSectionSubtitle: "Personalize your name and download your certificate of completion.",
      nameLabel: "Name on certificate",
      namePlaceholder: "Your full name",
      designLabel: "Design",
      designStandard: "Classic",
      designPunk: "Punk",
      download: "Download certificate",
      preview: "Certificate preview",
      verifyHint: (url: string) => `Verify this certificate at ${url}`,
      maverickKicker: "Ready for your first Bitcoin?",
      maverickTitle: "Comunícate con los expertos de Bitcoin",
      maverickPartner: "Maverick Capital Investment",
      maverickWebsiteCta: "Visit Maverick Capital Investment",
      maverickPhoneLabel: "Phone",
      maverickDisclaimer: "External partner. Dinero Libre does not handle Bitcoin purchases.",
    },
    certificate: {
      issuedTo: "Awarded to:",
      bodyStandard: (course: string) => `For successfully completing the ${course} course.`,
      bodyPunk: (course: string) => `Completed the ${course} course.`,
      issuedOn: "Issue date",
      serialLabel: "Serial",
      verifyTitle: "Certificate verification",
      verifyValid: "Valid certificate",
      verifyNotFound: "Certificate not found",
      verifyNotFoundDescription: "We couldn't find a certificate with this serial. Check the link and try again.",
      recipient: "Holder",
      courseLabel: "Course",
    },
```

- [ ] **Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: no errors (the `en` object must structurally match `es` or `Messages` type fails).

- [ ] **Step 4: Commit**

```bash
git add lib/i18n/messages.ts
git commit -m "feat(i18n): completion + certificate namespaces (es/en)"
```

---

### Task 4: QR helper (`lib/qr.ts`) + `qrcode` dependency — TDD

**Files:**
- Create: `lib/qr.ts`
- Create: `lib/qr.test.ts`
- Modify: `package.json` (add `qrcode`, `@types/qrcode`)

**Interfaces:**
- Produces: `generateQrDataUrl(url: string): Promise<string>` → a `data:image/png;base64,...` string.

- [ ] **Step 1: Install dependency**

Run: `yarn add qrcode && yarn add -D @types/qrcode`
Expected: `qrcode` in dependencies, `@types/qrcode` in devDependencies.

- [ ] **Step 2: Write the failing test**

Create `lib/qr.test.ts`:
```ts
import { describe, it, expect } from "vitest";
import { generateQrDataUrl } from "./qr";

describe("generateQrDataUrl", () => {
  it("returns a png data url for a verification link", async () => {
    const dataUrl = await generateQrDataUrl("https://example.com/verify/DL-2026-ABC123");
    expect(dataUrl.startsWith("data:image/png;base64,")).toBe(true);
    expect(dataUrl.length).toBeGreaterThan(100);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test -- lib/qr.test.ts`
Expected: FAIL — module `./qr` not found.

- [ ] **Step 4: Implement `lib/qr.ts`**

```ts
import QRCode from "qrcode";

export async function generateQrDataUrl(url: string): Promise<string> {
  return QRCode.toDataURL(url, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 220,
    color: { dark: "#14110D", light: "#00000000" }, // transparent background
  });
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npm test -- lib/qr.test.ts`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add lib/qr.ts lib/qr.test.ts package.json yarn.lock
git commit -m "feat(cert): QR data-url helper (qrcode dep)"
```

---

### Task 5: Server actions (`actions/certificate.ts`)

**Files:**
- Create: `actions/certificate.ts`

**Interfaces:**
- Consumes: `generateSerial`, `prefillRecipientName` (Task 2); `prisma` (`@/lib/db`); `auth` (`@/lib/auth`); `getProgress` (`@/actions/get-progress`).
- Produces:
  - `ensureCertificate(courseId: string): Promise<{ id: string; serial: string; recipientName: string; design: "STANDARD" | "PUNK"; updatedAt: Date }>` — requires the signed-in user to be at 100% progress (or have `completedAt`); creates the cert if absent (prefilled), returns it.
  - `updateCertificate(input: { id: string; recipientName?: string; design?: "STANDARD" | "PUNK" }): Promise<{ ok: true; updatedAt: Date }>` — owner-only; trims/validates name (1–80 chars).

- [ ] **Step 1: Implement `actions/certificate.ts`**

```ts
"use server";

import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getProgress } from "@/actions/get-progress";
import { generateSerial, prefillRecipientName } from "@/lib/certificate";

async function requireUser() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("UNAUTHORIZED");
  return session.user.id;
}

async function assertCourseComplete(userId: string, courseId: string) {
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (enrollment?.completedAt) return;
  const progress = await getProgress(userId, courseId);
  if (progress < 100) throw new Error("COURSE_NOT_COMPLETE");
}

export async function ensureCertificate(courseId: string) {
  const userId = await requireUser();
  await assertCourseComplete(userId, courseId);

  const existing = await prisma.certificate.findUnique({
    where: { userId_courseId: { userId, courseId } },
  });
  if (existing) {
    return {
      id: existing.id,
      serial: existing.serial,
      recipientName: existing.recipientName,
      design: existing.design,
      updatedAt: existing.updatedAt,
    };
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });

  // Retry on the (extremely unlikely) serial collision.
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const created = await prisma.certificate.create({
        data: {
          userId,
          courseId,
          serial: generateSerial(),
          recipientName: prefillRecipientName(user),
        },
      });
      return {
        id: created.id,
        serial: created.serial,
        recipientName: created.recipientName,
        design: created.design,
        updatedAt: created.updatedAt,
      };
    } catch (err: unknown) {
      // Unique violation on (userId,courseId) → someone created it concurrently.
      const created = await prisma.certificate.findUnique({
        where: { userId_courseId: { userId, courseId } },
      });
      if (created) {
        return {
          id: created.id,
          serial: created.serial,
          recipientName: created.recipientName,
          design: created.design,
          updatedAt: created.updatedAt,
        };
      }
      if (attempt === 4) throw err;
    }
  }
  throw new Error("CERTIFICATE_CREATE_FAILED");
}

export async function updateCertificate(input: {
  id: string;
  recipientName?: string;
  design?: "STANDARD" | "PUNK";
}) {
  const userId = await requireUser();
  const cert = await prisma.certificate.findUnique({ where: { id: input.id } });
  if (!cert || cert.userId !== userId) throw new Error("NOT_FOUND");

  const data: { recipientName?: string; design?: "STANDARD" | "PUNK" } = {};
  if (input.recipientName !== undefined) {
    const name = input.recipientName.replace(/\s+/g, " ").trim();
    if (name.length < 1 || name.length > 80) throw new Error("INVALID_NAME");
    data.recipientName = name;
  }
  if (input.design !== undefined) data.design = input.design;

  const updated = await prisma.certificate.update({ where: { id: input.id }, data });
  return { ok: true as const, updatedAt: updated.updatedAt };
}
```

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add actions/certificate.ts
git commit -m "feat(cert): ensure/update certificate server actions"
```

---

### Task 6: Record course completion in the progress route

**Files:**
- Modify: `app/api/courses/[courseId]/chapters/[chapterId]/progress/route.ts`

**Interfaces:**
- Consumes: `getProgress` (`@/actions/get-progress`).
- Produces: side effects — sets `ChapterProgress.completedAt` and, on 100%, `CourseEnrollment.completedAt`.

- [ ] **Step 1: Update the route**

Replace the body of `PUT` (keep imports; add `getProgress`) so the upsert sets `completedAt` and course completion is recorded:

```ts
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getProgress } from "@/actions/get-progress";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const now = new Date();

    const progress = await prisma.chapterProgress.upsert({
      where: { userId_chapterId: { userId, chapterId: params.chapterId } },
      create: { userId, chapterId: params.chapterId, isCompleted: true, completedAt: now },
      update: { isCompleted: true, completedAt: now },
    });

    // Record course-level completion exactly once.
    const percent = await getProgress(userId, params.courseId);
    if (percent >= 100) {
      await prisma.courseEnrollment.updateMany({
        where: { userId, courseId: params.courseId, completedAt: null },
        data: { completedAt: now },
      });
    }

    return NextResponse.json(progress);
  } catch (error) {
    console.error("[CHAPTER_PROGRESS]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
```

> Note: `updateMany` with `completedAt: null` makes this idempotent and a no-op when there is no enrollment row.

- [ ] **Step 2: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Manual verification**

Start dev (`npm run dev`), complete the final chapter of a test course as an enrolled student, then in the DB confirm `CourseEnrollment.completedAt` is set and that `ChapterProgress.completedAt` is populated. (If no DB console handy, add a temporary `console.log(percent)` and confirm it reaches 100, then remove it.)
Expected: completion timestamp recorded once.

- [ ] **Step 4: Commit**

```bash
git add "app/api/courses/[courseId]/chapters/[chapterId]/progress/route.ts"
git commit -m "feat(progress): record chapter + course completion timestamps"
```

---

### Task 7: Certificate image route (`next/og`, two designs, QR)

**Files:**
- Create: `assets/fonts/Anton-Regular.ttf`, `assets/fonts/Quicksand-SemiBold.ttf`, `assets/fonts/PlayfairDisplay-Bold.ttf`
- Create: `lib/certificate-assets.ts` (font + logo loaders, base URL helper)
- Create: `lib/certificate-templates.tsx` (`StandardCertificate`, `PunkCertificate`)
- Create: `app/api/certificates/[id]/image/route.tsx`

**Interfaces:**
- Consumes: `prisma`; `generateQrDataUrl` (Task 4); `Certificate` record (Task 1).
- Produces:
  - `loadCertificateFonts(): Promise<{ name: string; data: ArrayBuffer; weight: number; style: "normal" }[]>`
  - `loadLogoDataUrl(dark: boolean): Promise<string>`
  - `getBaseUrl(req: Request): string`
  - `StandardCertificate(props: CertTemplateProps): JSX.Element`, `PunkCertificate(props: CertTemplateProps): JSX.Element`
  - `type CertTemplateProps = { recipientName: string; courseTitle: string; issuedAt: Date; serial: string; qrDataUrl: string; logoDataUrl: string; locale: "es" | "en" }`
  - Route: `GET /api/certificates/[id]/image` → `image/png` (1600×1131); `?download=1` adds attachment disposition.

- [ ] **Step 1: Add the font files**

Download the TTFs into `assets/fonts/` (these families are already referenced in `app/globals.css`):
```bash
mkdir -p assets/fonts
curl -L -o assets/fonts/Anton-Regular.ttf "https://github.com/google/fonts/raw/main/ofl/anton/Anton-Regular.ttf"
curl -L -o assets/fonts/Quicksand-SemiBold.ttf "https://github.com/google/fonts/raw/main/ofl/quicksand/static/Quicksand-SemiBold.ttf"
curl -L -o assets/fonts/PlayfairDisplay-Bold.ttf "https://github.com/google/fonts/raw/main/ofl/playfairdisplay/static/PlayfairDisplay-Bold.ttf"
```
Expected: three non-empty `.ttf` files (verify with `ls -la assets/fonts`; each should be > 50 KB).

- [ ] **Step 2: Implement `lib/certificate-assets.ts`**

```ts
import { readFile } from "node:fs/promises";
import { join } from "node:path";

async function readArrayBuffer(relPath: string): Promise<ArrayBuffer> {
  const buf = await readFile(join(process.cwd(), relPath));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
}

export async function loadCertificateFonts() {
  const [anton, quicksand, playfair] = await Promise.all([
    readArrayBuffer("assets/fonts/Anton-Regular.ttf"),
    readArrayBuffer("assets/fonts/Quicksand-SemiBold.ttf"),
    readArrayBuffer("assets/fonts/PlayfairDisplay-Bold.ttf"),
  ]);
  return [
    { name: "Anton", data: anton, weight: 400 as const, style: "normal" as const },
    { name: "Quicksand", data: quicksand, weight: 600 as const, style: "normal" as const },
    { name: "Playfair Display", data: playfair, weight: 700 as const, style: "normal" as const },
  ];
}

export async function loadLogoDataUrl(dark: boolean): Promise<string> {
  const buf = await readFile(join(process.cwd(), "public", dark ? "logoDark.png" : "logo.png"));
  return `data:image/png;base64,${buf.toString("base64")}`;
}

export function getBaseUrl(req: Request): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}
```

- [ ] **Step 3: Implement `lib/certificate-templates.tsx`**

Inline-styled JSX only. Faithful to the two source PDFs in `public/certs/`.

```tsx
import { messages } from "@/lib/i18n/messages";

export type CertTemplateProps = {
  recipientName: string;
  courseTitle: string;
  issuedAt: Date;
  serial: string;
  qrDataUrl: string;
  logoDataUrl: string;
  locale: "es" | "en";
};

const fmtDate = (d: Date, locale: string) =>
  new Intl.DateTimeFormat(locale === "en" ? "en-US" : "es-GT", {
    day: "numeric", month: "long", year: "numeric",
  }).format(d);

export function StandardCertificate(p: CertTemplateProps) {
  const t = messages[p.locale].certificate;
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", padding: 48, background: "#14110D" }}>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", background: "#FBF6EE", border: "3px solid #14110D", padding: 56 }}>
        <div style={{ position: "absolute", top: 70, left: 70, right: 70, bottom: 70, border: "1px solid #B79A82" }} />
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "space-between", paddingTop: 24, paddingBottom: 16 }}>
          <img src={p.logoDataUrl} width={150} style={{ objectFit: "contain" }} alt="" />
          <div style={{ fontFamily: "Anton", fontSize: 92, color: "#14110D", letterSpacing: 4, textTransform: "uppercase" }}>CERTIFICADO</div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div style={{ fontFamily: "Quicksand", fontSize: 26, color: "#4B2E1E" }}>{t.bodyStandard(p.courseTitle)}</div>
            <div style={{ fontFamily: "Quicksand", fontSize: 22, color: "#6F4A33" }}>{t.issuedTo}</div>
            <div style={{ fontFamily: "Playfair Display", fontSize: 56, fontWeight: 700, color: "#14110D", borderBottom: "2px solid #C0573B", paddingBottom: 8, marginTop: 4 }}>{p.recipientName}</div>
          </div>
          <div style={{ display: "flex", width: "100%", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div style={{ display: "flex", flexDirection: "column", fontFamily: "Quicksand", fontSize: 18, color: "#6F4A33" }}>
              <span>{t.issuedOn}: {fmtDate(p.issuedAt, p.locale)}</span>
              <span>{t.serialLabel}: {p.serial}</span>
            </div>
            <div style={{ fontFamily: "Anton", fontSize: 22, color: "#14110D", textTransform: "uppercase", letterSpacing: 2 }}>Asociación Guatemala Libre</div>
            <img src={p.qrDataUrl} width={110} height={110} alt="" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function PunkCertificate(p: CertTemplateProps) {
  const t = messages[p.locale].certificate;
  const tag = (label: string) => (
    <div style={{ display: "flex", background: "#F7931A", color: "#14110D", fontFamily: "Anton", fontSize: 18, padding: "6px 12px", textTransform: "uppercase", letterSpacing: 1 }}>{label}</div>
  );
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: "#14110D", border: "3px solid #F7931A", padding: 48, position: "relative" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        {tag("#DINEROLIBRE")}
        <img src={p.logoDataUrl} width={150} style={{ objectFit: "contain" }} alt="" />
        {tag("SIN PERMISO")}
      </div>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, justifyContent: "center", gap: 14 }}>
        <div style={{ fontFamily: "Quicksand", fontSize: 20, color: "#E2B23A", letterSpacing: 4, textTransform: "uppercase" }}>Ni bancos · Ni permiso · Ni miedo</div>
        <div style={{ fontFamily: "Anton", fontSize: 104, color: "#FBF6EE", letterSpacing: 4, textTransform: "uppercase", textShadow: "6px 6px 0 #F7931A" }}>CERTIFICADO</div>
        <div style={{ fontFamily: "Quicksand", fontSize: 24, color: "#F4ECDE" }}>{t.bodyPunk(p.courseTitle)}</div>
        <div style={{ fontFamily: "Quicksand", fontSize: 20, color: "#E8DCC6" }}>{t.issuedTo}</div>
        <div style={{ fontFamily: "Anton", fontSize: 52, color: "#F7931A", textTransform: "uppercase", letterSpacing: 2 }}>{p.recipientName}</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", flexDirection: "column", fontFamily: "Quicksand", fontSize: 18, color: "#D2C2A2" }}>
          <span>{t.issuedOn}: {fmtDate(p.issuedAt, p.locale)}</span>
          <span>{t.serialLabel}: {p.serial}</span>
        </div>
        <div style={{ fontFamily: "Anton", fontSize: 22, color: "#FBF6EE", textTransform: "uppercase", letterSpacing: 2 }}>Sé tu propio banco</div>
        <img src={p.qrDataUrl} width={110} height={110} style={{ background: "#FBF6EE", padding: 6 }} alt="" />
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Implement the route `app/api/certificates/[id]/image/route.tsx`**

```tsx
import { ImageResponse } from "next/og";
import { prisma } from "@/lib/db";
import { generateQrDataUrl } from "@/lib/qr";
import { loadCertificateFonts, loadLogoDataUrl, getBaseUrl } from "@/lib/certificate-assets";
import { StandardCertificate, PunkCertificate } from "@/lib/certificate-templates";
import { getServerLocale } from "@/lib/i18n-server";

export const runtime = "nodejs";

const WIDTH = 1600;
const HEIGHT = 1131;

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const cert = await prisma.certificate.findUnique({
    where: { id: params.id },
    include: { course: { select: { title: true } } },
  });
  if (!cert) return new Response("Not found", { status: 404 });

  const locale = getServerLocale();
  const baseUrl = getBaseUrl(req);
  const [fonts, qrDataUrl, logoDataUrl] = await Promise.all([
    loadCertificateFonts(),
    generateQrDataUrl(`${baseUrl}/verify/${cert.serial}`),
    loadLogoDataUrl(cert.design === "PUNK"),
  ]);

  const props = {
    recipientName: cert.recipientName,
    courseTitle: cert.course.title,
    issuedAt: cert.issuedAt,
    serial: cert.serial,
    qrDataUrl,
    logoDataUrl,
    locale,
  };

  const element = cert.design === "PUNK" ? PunkCertificate(props) : StandardCertificate(props);

  const res = new ImageResponse(element, { width: WIDTH, height: HEIGHT, fonts });

  const download = new URL(req.url).searchParams.get("download");
  if (download) {
    res.headers.set(
      "Content-Disposition",
      `attachment; filename="certificado-dinero-libre-${cert.serial}.png"`
    );
  }
  return res;
}
```

- [ ] **Step 5: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 6: Manual verification (visual)**

With a `Certificate` row present (create one via Prisma Studio or by visiting `/complete` after Task 9, or temporarily seed one), open in a browser:
- `http://localhost:3000/api/certificates/<id>/image` → renders the Standard PNG.
- Flip the row's `design` to `PUNK` → reload → renders the Punk PNG.
- Append `?download=1` → browser downloads the file.
Compare both against the source PDFs in `public/certs/`. Adjust spacing/sizes in `lib/certificate-templates.tsx` until faithful (fonts must render — if text is boxes, re-check Step 1 fonts).
Expected: two on-brand certificates, QR present, name/course/date/serial correct.

- [ ] **Step 7: Commit**

```bash
git add assets/fonts lib/certificate-assets.ts lib/certificate-templates.tsx "app/api/certificates/[id]/image/route.tsx"
git commit -m "feat(cert): next/og certificate image route (standard + punk)"
```

---

### Task 8: Public verification page (`/verify/[serial]`)

**Files:**
- Create: `app/verify/[serial]/page.tsx`

**Interfaces:**
- Consumes: `prisma`; image route (Task 7); `getServerMessages` (`@/lib/i18n-server`); `t.certificate.*` (Task 3).

- [ ] **Step 1: Implement the page**

```tsx
import { prisma } from "@/lib/db";
import { getServerMessages } from "@/lib/i18n-server";
import { CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function VerifyCertificatePage({ params }: { params: { serial: string } }) {
  const t = getServerMessages().certificate;
  const cert = await prisma.certificate.findUnique({
    where: { serial: params.serial },
    include: { course: { select: { title: true } } },
  });

  if (!cert) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-4 p-6 text-center">
        <XCircle className="h-14 w-14 text-destructive" />
        <h1 className="font-[var(--font-display)] text-3xl uppercase">{t.verifyNotFound}</h1>
        <p className="text-sm text-muted-foreground">{t.verifyNotFoundDescription}</p>
      </div>
    );
  }

  const issued = new Intl.DateTimeFormat("es-GT", { day: "numeric", month: "long", year: "numeric" }).format(cert.issuedAt);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-6 p-6">
      <div className="flex items-center gap-3">
        <CheckCircle2 className="h-9 w-9 text-[hsl(var(--success))]" />
        <h1 className="font-[var(--font-display)] text-3xl uppercase">{t.verifyValid}</h1>
      </div>
      <Card className="grid gap-3 p-6 text-sm">
        <Row label={t.recipient} value={cert.recipientName} />
        <Row label={t.courseLabel} value={cert.course.title} />
        <Row label={t.issuedOn} value={issued} />
        <Row label={t.serialLabel} value={cert.serial} />
      </Card>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/api/certificates/${cert.id}/image`}
        alt={t.verifyTitle}
        className="w-full rounded-[2px] border-2 border-foreground"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border pb-2 last:border-0">
      <span className="font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</span>
      <span className="text-right">{value}</span>
    </div>
  );
}
```

- [ ] **Step 2: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 3: Manual verification**

Visit `http://localhost:3000/verify/<serial>` for an existing cert → valid badge + details + image. Visit `/verify/DL-2026-NOPE00` → "Certificado no encontrado".
Expected: both states render correctly.

- [ ] **Step 4: Commit**

```bash
git add "app/verify/[serial]/page.tsx"
git commit -m "feat(cert): public certificate verification page"
```

---

### Task 9: Completion page + components

**Files:**
- Create: `app/(course)/courses/[courseId]/complete/page.tsx`
- Create: `app/(course)/courses/[courseId]/complete/_components/completion-hero.tsx`
- Create: `app/(course)/courses/[courseId]/complete/_components/certificate-studio.tsx`
- Create: `app/(course)/courses/[courseId]/complete/_components/maverick-cta.tsx`

**Interfaces:**
- Consumes: `ensureCertificate`, `updateCertificate` (Task 5); image route (Task 7); `getProgress`; `auth`; `prisma`; `t.completion.*` (Task 3); shadcn `Input`, `Button`, `Card`, `ToggleGroup`.

- [ ] **Step 1: Implement the hero (`completion-hero.tsx`)**

```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocale } from "@/lib/i18n";

export function CompletionHero({ courseTitle }: { courseTitle: string }) {
  const { t } = useLocale();
  // Render confetti only after mount → no SSR/hydration mismatch from random values.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative flex flex-col items-center gap-2 overflow-hidden py-10 text-center"
    >
      {mounted && <ConfettiBurst />}
      <span className="text-5xl">🎉</span>
      <h1 className="font-[var(--font-display)] text-5xl uppercase leading-none">{t.completion.heroTitle}</h1>
      <p className="text-lg font-semibold text-muted-foreground">{t.completion.heroSubtitle(courseTitle)}</p>
    </motion.div>
  );
}

function ConfettiBurst() {
  const colors = ["#F7931A", "#E2B23A", "#1A8765", "#C0573B"];
  // Stable per-mount randoms; horizontal spread via static `left` (animating x% on an
  // 8px element does nothing useful).
  const pieces = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        left: Math.random() * 100,
        color: colors[i % colors.length],
        duration: 1.4 + Math.random(),
        delay: Math.random() * 0.3,
        rotate: Math.random() * 540,
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="pointer-events-none absolute inset-0">
      {pieces.map((p, i) => (
        <motion.span
          key={i}
          initial={{ opacity: 1, y: -20, rotate: 0 }}
          animate={{ opacity: 0, y: 240, rotate: p.rotate }}
          transition={{ duration: p.duration, delay: p.delay, ease: "easeOut" }}
          style={{ position: "absolute", top: 0, left: `${p.left}%`, width: 8, height: 14, background: p.color }}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Implement the Maverick CTA (`maverick-cta.tsx`)**

```tsx
"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ExternalLink, Phone } from "lucide-react";
import { useLocale } from "@/lib/i18n";

export function MaverickCta() {
  const { t } = useLocale();
  return (
    <Card className="border-2 border-foreground bg-[var(--volcan-900)] p-8 text-[var(--crema-050)] shadow-[var(--shadow-block-naranja)]">
      <p className="text-sm font-bold uppercase tracking-[0.12em] text-[var(--naranja-500)]">
        {t.completion.maverickKicker}
      </p>
      <h2 className="mt-2 font-[var(--font-display)] text-3xl uppercase leading-tight">
        {t.completion.maverickTitle}
      </h2>
      <p className="mt-3 text-xl font-semibold">{t.completion.maverickPartner}</p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg" className="bg-[var(--naranja-500)] text-[var(--volcan-900)] hover:bg-[var(--naranja-600)]">
          <a href="https://maverickcapitalinvestment.com" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="mr-2 h-4 w-4" />
            {t.completion.maverickWebsiteCta}
          </a>
        </Button>
        <Button asChild size="lg" variant="outline" className="border-[var(--crema-050)] bg-transparent text-[var(--crema-050)] hover:bg-[var(--volcan-500)]">
          <a href="tel:+50232065088">
            <Phone className="mr-2 h-4 w-4" />
            +502 3206-5088
          </a>
        </Button>
      </div>

      <p className="mt-4 text-xs text-[var(--crema-200)]">{t.completion.maverickDisclaimer}</p>
    </Card>
  );
}
```

- [ ] **Step 3: Implement the certificate studio (`certificate-studio.tsx`)**

```tsx
"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Download, Loader2 } from "lucide-react";
import { useLocale } from "@/lib/i18n";
import { updateCertificate } from "@/actions/certificate";

type Design = "STANDARD" | "PUNK";

export function CertificateStudio({
  certId,
  serial,
  initialName,
  initialDesign,
  initialVersion,
}: {
  certId: string;
  serial: string;
  initialName: string;
  initialDesign: Design;
  initialVersion: number;
}) {
  const { t } = useLocale();
  const [name, setName] = useState(initialName);
  const [design, setDesign] = useState<Design>(initialDesign);
  const [version, setVersion] = useState(initialVersion); // cache-bust for the <img>
  const [isPending, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const imgSrc = `/api/certificates/${certId}/image?v=${version}`;

  const persist = (changes: { recipientName?: string; design?: Design }) => {
    startTransition(async () => {
      const res = await updateCertificate({ id: certId, ...changes });
      setVersion(new Date(res.updatedAt).getTime());
    });
  };

  // Debounce name edits.
  useEffect(() => {
    if (name === initialName) return;
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const clean = name.replace(/\s+/g, " ").trim();
      if (clean.length >= 1 && clean.length <= 80) persist({ recipientName: clean });
    }, 400);
    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  const onDesignChange = (value: string) => {
    if (value !== "STANDARD" && value !== "PUNK") return;
    setDesign(value);
    persist({ design: value });
  };

  return (
    <Card className="p-6">
      <div className="space-y-1">
        <h2 className="font-[var(--font-display)] text-3xl uppercase leading-none">{t.completion.certificateSectionTitle}</h2>
        <p className="text-sm text-muted-foreground">{t.completion.certificateSectionSubtitle}</p>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="cert-name">{t.completion.nameLabel}</Label>
            <Input
              id="cert-name"
              value={name}
              maxLength={80}
              placeholder={t.completion.namePlaceholder}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>{t.completion.designLabel}</Label>
            <ToggleGroup type="single" value={design} onValueChange={onDesignChange} className="justify-start">
              <ToggleGroupItem value="STANDARD">{t.completion.designStandard}</ToggleGroupItem>
              <ToggleGroupItem value="PUNK">{t.completion.designPunk}</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <Button asChild className="w-full">
            <a href={`/api/certificates/${certId}/image?download=1&v=${version}`} download>
              <Download className="mr-2 h-4 w-4" />
              {t.completion.download}
            </a>
          </Button>

          <p className="text-xs text-muted-foreground">{t.completion.verifyHint(`/verify/${serial}`)}</p>
        </div>

        <div className="relative">
          {isPending && (
            <div className="absolute right-2 top-2 z-10 rounded bg-background/80 p-1">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imgSrc}
            alt={t.completion.preview}
            className="w-full rounded-[2px] border-2 border-foreground shadow-[var(--shadow-card)]"
          />
        </div>
      </div>
    </Card>
  );
}
```

- [ ] **Step 4: Implement the page (`complete/page.tsx`)**

```tsx
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getProgress } from "@/actions/get-progress";
import { ensureCertificate } from "@/actions/certificate";
import { CompletionHero } from "./_components/completion-hero";
import { CertificateStudio } from "./_components/certificate-studio";
import { MaverickCta } from "./_components/maverick-cta";
import { Separator } from "@/components/ui/separator";

export const dynamic = "force-dynamic";

export default async function CourseCompletePage({ params }: { params: { courseId: string } }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/sign-in");

  const course = await prisma.course.findUnique({
    where: { id: params.courseId },
    select: { id: true, title: true },
  });
  if (!course) redirect("/courses");

  // Guard: only finishers. Accept a recorded completedAt OR live 100%.
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { userId_courseId: { userId: session.user.id, courseId: params.courseId } },
  });
  const progress = await getProgress(session.user.id, params.courseId);
  if (!enrollment?.completedAt && progress < 100) {
    redirect(`/courses/${params.courseId}`);
  }

  const cert = await ensureCertificate(params.courseId);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 p-4 pb-16">
      <CompletionHero courseTitle={course.title} />

      <CertificateStudio
        certId={cert.id}
        serial={cert.serial}
        initialName={cert.recipientName}
        initialDesign={cert.design}
        initialVersion={new Date(cert.updatedAt).getTime()}
      />

      <Separator className="my-2" />

      <MaverickCta />
    </div>
  );
}
```

- [ ] **Step 5: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 6: Manual verification**

As an enrolled student at 100%, open `/courses/<id>/complete`:
- Hero animates; certificate preview renders.
- Edit the name → after ~400ms the preview updates.
- Toggle Standard/Punk → preview swaps.
- "Descargar certificado" downloads the PNG.
- Maverick card is visually separate (dark/orange), website opens in a new tab, phone is a `tel:` link.
- As a non-finisher, `/complete` redirects back to the course.
Expected: all behaviors correct.

- [ ] **Step 7: Commit**

```bash
git add "app/(course)/courses/[courseId]/complete"
git commit -m "feat(cert): course completion page (certificate studio + Maverick CTA)"
```

---

### Task 10: Entry points (last-lesson redirect + dashboard link)

**Files:**
- Modify: `app/(course)/courses/[courseId]/chapters/[chapterId]/_components/completion-button.tsx`
- Modify: `app/(dashboard)/(routes)/student/courses/page.tsx`

**Interfaces:**
- Consumes: completion page route (Task 9); `t.completion.*`.

- [ ] **Step 1: Redirect to `/complete` when finishing the last lesson**

In `completion-button.tsx`, in `onComplete`, replace the `if (nextChapterId) {...}` block with:
```ts
        if (nextChapterId) {
          router.push(`/courses/${courseId}/chapters/${nextChapterId}`);
        } else {
          router.push(`/courses/${courseId}/complete`);
        }
```
And in the `isCompleted` button branch (the "last lesson" dead-end), make the last-lesson button navigate to `/complete`:
```tsx
    if (isCompleted) {
      return (
        <Button
          onClick={() =>
            nextChapterId
              ? router.push(`/courses/${courseId}/chapters/${nextChapterId}`)
              : router.push(`/courses/${courseId}/complete`)
          }
          className="flex items-center gap-x-2"
        >
          {!nextChapterId ? (
            t.course.lastLesson
          ) : (
            <>
              {t.course.nextLesson}
              <ChevronRight className="h-4 w-4" />
            </>
          )}
        </Button>
      );
    }
```

- [ ] **Step 2: Add a "Ver certificado" link to completed courses in the dashboard**

In `student/courses/page.tsx`, the `enrollments.map(({ course }) => ...)` destructure currently drops `completedAt`. Change the map to keep the enrollment and render a conditional link.

Replace `{enrollments.map(({ course }) => {` with `{enrollments.map((enrollment) => {` and add at the top of the callback body:
```tsx
            const course = enrollment.course;
```
Then inside `<CardContent className="space-y-4">`, after the existing `<Button asChild className="w-full">…</Button>`, add:
```tsx
                  {enrollment.completedAt && (
                    <Button asChild variant="outline" className="w-full">
                      <Link href={`/courses/${course.id}/complete`}>{t.completion.certificateSectionTitle}</Link>
                    </Button>
                  )}
```

- [ ] **Step 3: Typecheck + lint**

Run: `npx tsc --noEmit && npm run lint`
Expected: no errors.

- [ ] **Step 4: Manual verification**

- Complete the final lesson → lands on `/complete`.
- Revisit the last lesson when already completed → its button navigates to `/complete`.
- Dashboard "Mis cursos" shows "Tu certificado" only on completed courses → links to `/complete`.
Expected: all entry points work.

- [ ] **Step 5: Commit**

```bash
git add "app/(course)/courses/[courseId]/chapters/[chapterId]/_components/completion-button.tsx" "app/(dashboard)/(routes)/student/courses/page.tsx"
git commit -m "feat(cert): wire completion-page entry points (last lesson + dashboard)"
```

---

## Final verification

- [ ] **Full typecheck, lint, tests**

Run: `npx tsc --noEmit && npm run lint && npm test`
Expected: all pass.

- [ ] **End-to-end smoke (manual)**

As a fresh enrolled student: finish the course → `/complete` → edit name → switch design → download → scan/open QR → `/verify/<serial>` shows valid → dashboard shows "Tu certificado". Confirm Maverick links. Confirm both certificate designs match the source PDFs in `public/certs/`.

- [ ] **Optional cleanup**

If the orange "Sé tu propio banco" seal from the source PDFs is desired beyond the logo, export it to `assets/` and add it to the templates. Not required for v1.

---

## Self-review notes (author)

- **Spec coverage:** model+migration (T1), completion recording (T6), completion page with certificate-first/Maverick-second (T9), two designs + editable name + preview=download (T7/T9), QR+serial verification (T4/T7/T8), dashboard re-access + last-lesson entry (T10), i18n es/en (T3). All spec sections mapped.
- **Placeholders:** none — every code step is complete; the only optional item (seal asset) is explicitly out-of-scope.
- **Type consistency:** `Design`/`CertificateDesign` = `"STANDARD" | "PUNK"` throughout; `ensureCertificate` returns `{ id, serial, recipientName, design, updatedAt }` consumed verbatim by T9; `CertTemplateProps` shared by both templates and the route; `generateQrDataUrl`/`generateSerial`/`prefillRecipientName` signatures match their call sites.
