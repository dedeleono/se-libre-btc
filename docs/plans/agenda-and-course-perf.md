# Plan: Agenda meeting links + Course page ~60s load

Status: investigation + plan only. No application code changed. Throwaway diagnostic
scripts were run from the repo root and deleted.

---

## Issue B — Chapter page takes ~1 minute to load

### Root cause (with evidence)

The chapter page is **latency-bound, not CPU-bound**. The database is a remote Supabase
pooler in `us-west-2` and every single round-trip costs ~700ms from this environment.
The page issues a long **sequential** chain of Prisma queries, and Prisma's nested
`include`s fan each call out into many separate SQL round-trips. ~50 sequential
round-trips × ~700ms each is what produces the multi-second-to-~60s wall time.

Evidence (measured with throwaway `node` scripts run from repo root, loading `.env`,
using the same pooled `DATABASE_URL` the app uses):

- Pure per-round-trip latency, warm connection, trivial query:
  - `SELECT 1` (warm) = **699–1032ms, median ~722ms**. This is the floor: even a no-op
    query costs ~700ms. The bottleneck is network RTT to `aws-1-us-west-2.pooler.supabase.com:6543`, not query execution.
- Sequential vs parallel proof:
  - 5 sequential `SELECT 1` = **4049ms** (≈ 5 × 700ms).
  - 5 parallel `SELECT 1` = **1810ms**. Parallelizing collapses independent latency.
- Per-query timings replicating the actual page waterfall:
  - `chapter.findUnique(isIntro)` = 717ms
  - `user.findUnique(by email)` = 703ms
  - `getChapters` chapter.findUnique(+quiz+questions+options+liveSession) = 1141ms
  - `getChapters` courseModule.findFirst(+course+chapters+quiz+liveSession) = 1721ms
  - `getChapters` chapterProgress.findUnique = 694ms
  - page `chapter.findUnique(full include)` = 2712ms
  - chapter-access courseEnrollment / pathEnrollment / cohortEnrollment / module sequence = ~0.7–1s each
- Round-trips per nested include (one `findUnique`/`findFirst` call expands into many SQLs):
  - page full chapter `include` = **9 round-trips**
  - getChapters module tree = **7 round-trips**
- Full page waterfall replicated end-to-end = **10896ms across 50 prisma queries** in a
  bare script. The real dev/server request adds on top of this: `auth()` →
  better-auth `getSession` does its own session+user DB lookups; `lib/db.ts` runs the
  client with `log: ['query','error','warn']` (per-query console serialization);
  Next dev compilation; and intermittently higher RTT. Those multipliers push the bare
  ~11s toward the reported ~60s.

What is **NOT** the cause (ruled out by reading the code):
- **S3 presigning** — `lib/s3.ts` `getPresignedDownloadUrl` is never called in the
  chapter SSR path. `app/(course)/courses/[courseId]/chapters/[chapterId]/_components/content-viewer.tsx`
  is a `"use client"` component and uses `videoUrl`/`pdfUrl` directly as `<video src>` /
  `<iframe src>`. Presigning only lives in API routes (`app/api/s3/*`). Not on the render path.
- **ytdl-core** — only in `app/api/s3/yt/route.ts` and `app/api/s3/youtube-download/route.ts`,
  never during SSR. `youtubeUrl` is rendered as a plain `<iframe>` client-side.
- **enroll route** — `app/api/courses/[courseId]/enroll/route.ts` does 1 auth + 1 find +
  1 upsert, no email/S3/loops. Not the slow page (it just POSTs then navigates).
- **Connection pooling misconfig** — `.env` `DATABASE_URL` is correct: pooled host,
  port 6543, `pgbouncer=true`; `lib/db.ts:7-35` further normalizes the flag. The
  problem is RTT count, not a broken/exhausted pool.
- **Missing email index** — `User.email` is `@unique` (schema.prisma:19),
  `Session.token` is `@unique` (schema.prisma:111). Lookups are indexed.

#### Specific code-level waste on the render path
File: `app/(course)/courses/[courseId]/chapters/[chapterId]/page.tsx`

1. **Strict sequential waterfall** of independent awaits (lines 19, 28, 76, 129, 135, 167).
   `chapterIntro` (19), `dbUser` (76), `getChapters` (129), the full `chapter` (135),
   and `isChapterAccessible` (167) each block the next.
2. **Redundant duplicate fetch of the same chapter.** `getChapters` (actions/getChapters.ts:12-25)
   fetches `chapter` with `quiz → questions → options` and `liveSession`. The page then
   fetches the **same chapter id** again at lines 135-161 with an overlapping include
   (`quiz → questions → options`, `liveSession`, plus `module → course`, `studentProgress`,
   `attachments`). The expensive quiz/questions/options tree is loaded twice (~9 + part of
   the getChapters 7 round-trips, doubled work).
3. **`getChapters` also loads the entire sibling-chapter tree** (courseModule.findFirst
   with `chapters: { include: { quiz, liveSession } }`, getChapters.ts:31-40) just to
   compute `nextChapter` (one id). That's a heavy multi-round-trip query for a single field.
4. **`isChapterAccessible` re-queries** enrollment + a full published-chapter sequence
   (lib/chapter-access.ts:107, 112) — more sequential round-trips — and, notably, the
   function `return true` at line 141 makes the gating logic effectively a no-op for
   enrolled users (it returns true whether or not the previous chapter is completed), so
   most of its DB work is wasted.
5. **`dbUser = prisma.user.findUnique(by email)`** (page line 76) is redundant: `auth()`
   already returns `session.user.id` (and role). The only thing the page uses from
   `dbUser` is `dbUser.id` (passed to getChapters line 130) — which equals
   `session.user.id`. One whole round-trip removable.
6. **`log: ['query', ...]`** in `lib/db.ts:40` serializes every SQL to the console on
   every request in dev; with ~50 queries/page this adds measurable overhead and noise.

### Fix plan (ordered, smallest-correct-fix first)

**Fix 1 — Drop the redundant `dbUser` lookup. (1 query removed)**
- File: `app/(course)/courses/[courseId]/chapters/[chapterId]/page.tsx`
- Remove the `prisma.user.findUnique({ where: { email } })` block (lines 76-127) for the
  authenticated path. Use `session.user.id` directly where `dbUser.id` is used (line 130:
  `userId: session.user.id`). Keep the intro/unauthenticated branches (they already key off
  `chapterIntro?.isIntro`). The `!dbUser` intro fallback (84-123) is dead once we trust the
  session; collapse it.
- Rationale: `auth()` already provides a verified `id`, `email`, `role`. Saves ~700ms.

**Fix 2 — Eliminate the duplicate chapter fetch + parallelize the independent awaits.**
- File: `app/(course)/courses/[courseId]/chapters/[chapterId]/page.tsx`
- The page currently does: `chapterIntro` (19) → `auth()` (28) → `getChapters` (129) →
  full `chapter` (135) → `isChapterAccessible` (167), all sequential.
- Restructure so that after `auth()` (which must come first), the independent reads run
  together. Concretely, fetch the **full chapter once** (the page's include at 135-161
  already is a superset of getChapters' chapter), and derive `nextChapter` + `studentProgress`
  from cheaper targeted queries in parallel:
  ```ts
  const session = await auth();           // required first
  if (!session?.user) { /* existing intro / sign-in branch */ }

  const userId = session.user.id;
  const [chapter, nextChapter, studentProgress] = await Promise.all([
    prisma.chapter.findUnique({
      where: { id: params.chapterId },
      include: {
        module: { include: { course: true } },
        quiz: { include: { questions: { include: { options: true }, orderBy: { position: "asc" } } } },
        liveSession: true,
        attachments: true,
      },
    }),
    // nextChapter: only need id + position of siblings, not their quiz/liveSession trees
    getNextChapterId(params.chapterId),     // see Fix 3
    prisma.chapterProgress.findUnique({
      where: { userId_chapterId: { userId, chapterId: params.chapterId } },
    }),
  ]);
  ```
  Note: the initial `chapterIntro` round-trip (line 19) is only needed for the
  unauthenticated/intro branch; for authenticated users the `isIntro` flag is already on
  the full `chapter` we fetch — drop the separate `chapterIntro` query for the
  authenticated path (move it inside the `!session?.user` branch only).
- Replace the page's call to `getChapters` (129) with the above. `getChapters` can be
  retired from this page, or slimmed (see Fix 3).
- Rationale: removes the second full chapter+quiz+questions+options round-trips (the most
  expensive, ~9 RT / 2.7s) and runs the 3 remaining reads concurrently instead of serially.

**Fix 3 — Make `nextChapter` a single cheap query (don't load the whole module tree).**
- File: `actions/getChapters.ts` (or a new small helper used by the page).
- Replace `courseModule.findFirst({ ... chapters: { include: { quiz, liveSession } } })`
  (getChapters.ts:31-40, 7 round-trips) with a targeted query that returns only the next
  chapter's id:
  ```ts
  // need the current chapter's position + moduleId first; we already have the chapter
  // from Fix 2, so pass position+moduleId in and do ONE query:
  const next = await prisma.chapter.findFirst({
    where: { moduleId: chapter.moduleId, position: { gt: chapter.position }, isPublished: true },
    orderBy: { position: "asc" },
    select: { id: true },
  });
  ```
- Rationale: 1 indexed round-trip instead of a 7-round-trip nested tree, and only the id
  is actually consumed (`nextChapter?.id` at page lines 206, 217).

**Fix 4 — Trim / short-circuit `isChapterAccessible`.**
- File: `lib/chapter-access.ts`
- The function currently always `return true` at line 141 for enrolled users regardless of
  previous-chapter completion, so `getPublishedChapterSequence` (112) and the
  `previousProgress` lookup (124) are wasted round-trips. Either:
  - (a) If the product intent is "enrolled users can access any published chapter",
    delete lines 112-141 and return `true` right after the enrollment check (line 110).
    That removes the `getPublishedChapterSequence` multi-row query and the extra progress
    lookup. **Smallest correct fix** if gating is genuinely not enforced.
  - (b) If sequential gating IS intended, fix the logic (the final `return true` should be
    `return false`) — but that's a behavior change; flag for product decision, do not do it
    as part of the perf fix.
- Also: run the enrollment check concurrently with the chapter fetch where possible. Since
  `isChapterAccessible` needs `chapter.module.courseId` (from Fix 2's `chapter`), it must
  follow the chapter fetch, but it can be awaited alongside `studentProgress`/`nextChapter`
  by passing the courseId in once known. Net effect: 1 enrollment round-trip instead of
  enrollment + sequence + progress (3+).

**Fix 5 — Quiet Prisma query logging in dev.**
- File: `lib/db.ts:40`
- Change `log: ['query', 'error', 'warn']` to `log: ['error', 'warn']` (or gate `'query'`
  behind an explicit `process.env.PRISMA_DEBUG === 'true'`).
- Rationale: removes per-query console serialization overhead and the misleading wall of
  query logs while debugging.

**Fix 6 (infra, separate from code) — reduce or hide the ~700ms RTT.**
- The structural floor is geographic latency to `us-west-2`. Code fixes above cut the
  *number* of serial round-trips from ~50 to a handful (~3-5 concurrent), turning ~60s
  into low single-digit seconds. To go further:
  - Deploy the app in the same region as the Supabase project (us-west-2) so RTT drops to
    single-digit ms. This is the highest-leverage non-code change but is a deploy/infra
    decision, not a file edit.
  - Consider Prisma `relationLoadStrategy: "join"` (Prisma 5.10+, preview
    `relationJoins`) so nested includes become a single SQL JOIN instead of N round-trips.
    Verify Prisma version before recommending; note it interacts with pgbouncer.
- These are recommendations; the code Fixes 1-5 are sufficient to resolve the user-facing
  ~60s symptom on their own.

### Verification (Issue B)
- Add a temporary timing wrapper (or use the dev request log) around the page render and
  confirm total DB time drops from ~50 round-trips to ≤5 concurrent ones.
- Reproduce: as an enrolled student, click "open"/"get started" on a course and time the
  chapter page. Target: from ~60s to a few seconds (bounded by ~1-2 RTT of ~700ms while
  remote, or sub-second once co-located per Fix 6).
- Throwaway script check: re-run a probe doing `Promise.all` of the 3 remaining reads and
  confirm it returns in ~1× RTT rather than ~10×.
- Confirm no functional regression: quiz chapters still render (`chapter.quiz`), next-chapter
  navigation still works (`nextChapter?.id`), completed banner still shows
  (`studentProgress?.isCompleted`), intro/unauthenticated preview path unchanged.

---

## Issue A — Student "Agenda" page shows no meeting link / no way to join

### Data path (confirmed)
- Admin enters `meetingUrl` and `recordingUrl` in
  `app/(dashboard)/(routes)/admin/cohorts/_components/cohort-form.tsx` (fields at lines
  30-31, 61). They POST/PATCH to `app/api/cohorts/[cohortId]/live-sessions/route.ts:36`,
  `app/api/live-sessions/route.ts:32`, `app/api/live-sessions/[liveSessionId]/route.ts:24`,
  all of which persist `meetingUrl` (and recordingUrl). So links admins enter ARE stored.
- `LiveSession` model (`prisma/schema.prisma:441-468`) has `description`, `startsAt`,
  `endsAt`, `meetingUrl`, `recordingUrl`, `status` (enum SCHEDULED|LIVE|COMPLETED|CANCELLED).
- The agenda page (`app/(dashboard)/(routes)/student/schedule/page.tsx:10-21`) already
  fetches the full rows; it just renders only `title` + `startsAt.toLocaleString()`
  (lines 32-33). So this is a pure render-layer change.

### Caveat to flag (data, not blocking)
The query filters `startsAt: { gte: new Date() }` (line 11), so it only returns *upcoming*
sessions. A "Watch recording" link is most useful for *past* sessions, which this query
excludes. Two options:
- **Minimal (recommended for this ticket):** keep the upcoming-only query and still render
  `recordingUrl` when present (occasionally a live/just-started session has a recording).
- **Fuller (optional, note for product):** broaden the query to also include recent past
  sessions with a `recordingUrl`, e.g. drop the `gte` filter or add an `OR` for
  `{ recordingUrl: { not: null } }`. This is a behavior/scope change — flag it; do not
  silently expand scope.

### i18n keys to add
File: `lib/i18n/messages.ts`. Add to BOTH `student` blocks — `es` (~line 337-358) and
`en` (~line 1310-1331). New keys:

`es` block:
```ts
    joinMeeting: "Unirse a la reunión",
    watchRecording: "Ver grabación",
    sessionLive: "En vivo",
    sessionTimeRange: (start: string, end: string) => `${start} – ${end}`,
```
`en` block:
```ts
    joinMeeting: "Join meeting",
    watchRecording: "Watch recording",
    sessionLive: "Live",
    sessionTimeRange: (start: string, end: string) => `${start} – ${end}`,
```
(`scheduleSubtitle`, `noUpcomingSessions` already exist and are reused as-is.)

### Exact JSX
File: `app/(dashboard)/(routes)/student/schedule/page.tsx`.

Update imports (line 1-4) to add Button, Link, and lucide icons:
```ts
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Video, PlayCircle } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getServerMessages } from "@/lib/i18n-server";
```

Replace the `.map(...)` card body (current lines 30-35) with:
```tsx
{liveSessions.map((liveSession) => {
  const isLive = liveSession.status === "LIVE";
  const start = liveSession.startsAt.toLocaleString();
  const end = liveSession.endsAt?.toLocaleString();
  return (
    <Card key={liveSession.id}>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>{liveSession.title}</CardTitle>
          {isLive && (
            <span className="inline-flex items-center gap-1 border-2 border-foreground bg-primary px-2 py-0.5 text-xs font-bold uppercase tracking-[0.08em] text-primary-foreground">
              {t.student.sessionLive}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-muted-foreground">
        <div className="font-semibold">
          {end ? t.student.sessionTimeRange(start, end) : start}
        </div>
        {liveSession.description && liveSession.description.trim() && (
          <p>{liveSession.description}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {liveSession.meetingUrl &&
            (liveSession.status === "SCHEDULED" || liveSession.status === "LIVE") && (
              <Button asChild size="sm">
                <a href={liveSession.meetingUrl} target="_blank" rel="noopener noreferrer">
                  <Video className="mr-2 h-4 w-4" />
                  {t.student.joinMeeting}
                </a>
              </Button>
            )}
          {liveSession.recordingUrl && (
            <Button asChild size="sm" variant="outline">
              <a href={liveSession.recordingUrl} target="_blank" rel="noopener noreferrer">
                <PlayCircle className="mr-2 h-4 w-4" />
                {t.student.watchRecording}
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
})}
{liveSessions.length === 0 && (
  <Card>
    <CardContent className="p-8 text-center text-sm text-muted-foreground">
      {t.student.noUpcomingSessions}
    </CardContent>
  </Card>
)}
```

Notes on conventions used:
- `Button asChild` + `<a target="_blank" rel="noopener noreferrer">` matches the existing
  pattern (`Button asChild` is used in content-viewer.tsx:106, 517; `Button` supports
  `asChild` per components/ui/button.tsx:40-45).
- The "LIVE" pill reuses the stamp/poster look (`border-2 border-foreground`, uppercase,
  `tracking-[0.08em]`) seen throughout content-viewer.tsx.
- lucide icons `Video` / `PlayCircle` are consistent with the app's lucide usage
  (student/page.tsx already imports from `lucide-react`).
- The local `.map` variable is renamed from `session` to `liveSession` to avoid shadowing
  the outer `session` (auth) variable; without this rename the join-link condition would
  read from the wrong object.

### Verification (Issue A)
- As a student enrolled in a cohort/course that has an upcoming LiveSession with a
  `meetingUrl`, open `/student/schedule` ("Agenda"). Confirm: the card shows the start
  (and end, if set) time range, the description if present, and a "Join meeting" button
  that opens the meeting URL in a new tab.
- Set a session `status = LIVE` and confirm the "LIVE" pill appears and the join button is
  still shown.
- Add a `recordingUrl` and confirm "Watch recording" appears.
- Toggle locale es/en and confirm both label sets render (keys present in both blocks).
- Confirm an admin-entered meetingUrl (via the cohort form) actually surfaces on the
  student page, proving the end-to-end path.
