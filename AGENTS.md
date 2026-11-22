# AGENTS.md

## Stack

Next.js 15 App Router, React 19, TypeScript strict, Prisma 5 (Postgres on Supabase), better-auth (`lib/auth.ts`, where `auth()` returns `session.user.{id, role, email}`), Tailwind 3 with shadcn/ui (`components/ui`), sonner toasts, and yarn v1.

## Commands

| Task | Command |
| --- | --- |
| Install | `yarn install --frozen-lockfile` |
| Generate the Prisma client | `yarn prisma generate` |
| Dev server | `yarn dev` |
| Typecheck | `yarn typecheck` |
| Lint | `yarn lint` |
| Test | `yarn test` |
| Rendered lesson checks | `yarn check:lesson-layout` (needs `yarn dev` running) |
| Build | `yarn build` (needs a filled-in `.env`, see `.env.example`) |

## Verify before you push

Run `yarn verify` before you push. It runs `yarn typecheck`, `yarn lint`, and `yarn test`.

Vercel runs the tests and `next build`, which typechecks and lints, on every preview deploy. A failing check blocks the deploy.

If you change the lesson page (`app/(course)/courses/[courseId]/chapters/[chapterId]`, the course sidebar, `.lesson-content` or the notes editor) or the admin chapter preview, also run `yarn check:lesson-layout` with `yarn dev` running. It drives the dev-only fixture routes under `app/(dev)/lesson-fixture` (404 in production) in a headless browser at 320 to 1440 px, light and dark. It checks reading layout, notes autosave, tabs, the keyboard path, resources, the sidebar and the admin preview, and it prints `FAILURES: 0` on success. Set `BASE_URL` if the dev server is not on port 3000. Playwright is not a project dependency. The script installs it once into a temp directory, or uses `PLAYWRIGHT_MODULE` and `BROWSER_PATH` if you set them.

## Where things live

- `app/` holds the routes. `app/api/**/route.ts` files are the API.
- `actions/` holds server data functions.
- `lib/` holds domain logic and its tests.
- `components/ui` holds the shadcn primitives.
- `prisma/schema.prisma` is the data model.
- `docs/superpowers/specs/` holds design specs. They are decided design, so follow them. Their implementation plans are in `docs/superpowers/plans/`.
- `docs/plans/` holds performance notes.
- `plans/` holds executable handoff plans.

## Rules

- Every admin API route calls the shared admin guard from `lib/api-auth.ts` before it does any work. Never hand-roll `role !== "ADMIN"` checks.
- Components contain no literal user-facing strings. Add each key to both `es` and `en` in `lib/i18n/messages.ts`. `en` is typed `Messages`, so a key missing from `en` fails typecheck. Read strings with `useLocale()` from `lib/i18n.tsx` in client components and `getServerMessages()` from `lib/i18n-server.ts` in server components.
- Certificate eligibility lives in `lib/certificate-eligibility.ts`:
  - A certificate needs a perfect 100 (`PERFECT_FINAL_QUIZ_SCORE`) on the course's final quiz, taken from the best `COMPLETED` attempt's `scorePercent`.
  - The final quiz is the last quiz flagged `isFinalExam` in course order. If none is flagged, it is the last published quiz chapter in course order (modules by `position`, then chapters by `position`).
  - It fails closed. If the course has any quiz but the final quiz cannot be resolved, the user is not eligible (`FINAL_QUIZ_UNRESOLVED`). Only a course with no quizzes passes automatically (`NO_QUIZZES`).
  - `pickFinalQuiz`, `courseHasAnyQuiz`, and `evaluateEligibility` are pure and tested in `lib/certificate-eligibility.test.ts`. `getCertificateEligibility(userId, courseId)` is the only database entry point. Do not weaken these rules without updating `lib/certificate-eligibility.test.ts`.
- Tests use vitest and live in `lib/**/*.test.ts`. They test pure functions and never touch the database. Model new tests on `lib/certificate-eligibility.test.ts`.
- Never commit `.env`. Add each new variable to `.env.example` (name only) and to `DEPLOYMENT.md`.

## Commits

Write `(<type>): <lowercase summary>`, where the type is one of `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, or `perf`. Example: `(feat): added sponsors section`.
