# Deployment Guide

This guide covers deployment for the Se Libre BTC course platform

## Pre-Deployment Checklist

- PostgreSQL database with `DATABASE_URL` and `DIRECT_URL`.
- Generated Prisma client.
- Object storage for course images, videos, PDFs, and resources.
- Email SMTP credentials for admin campaigns and transactional email.
- Auth secret and production app URL.
- Optional Recurrente keys for future paid products.

## Required Validation

Run these checks before deploying:

```bash
DATABASE_URL="postgresql://user:pass@host:5432/db" DIRECT_URL="postgresql://user:pass@host:5432/db" yarn prisma validate
yarn prisma generate
yarn typecheck
yarn lint
yarn test
yarn build
```

Run `yarn verify` before you push. Vercel runs the tests and `next build`, which typechecks and lints, on every preview deploy. A failing check blocks the deploy.

## Database

Apply migrations in production:

```bash
yarn prisma migrate deploy
yarn prisma generate
```

The current platform data model includes courses, modules, chapters, learning paths, cohorts, live sessions, free enrollments, self-check quizzes, generic payments, forum posts, notifications, and course contributors.

## Environment Variables

Copy `.env.example` to `.env` and fill in values. It lists every variable the code reads.

Core:

- `DATABASE_URL`
- `DIRECT_URL`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `AUTH_SECRET`
- `NEXT_PUBLIC_APP_URL`
- `PRISMA_DEBUG` — optional; `true` logs every Prisma query.

Google sign-in:

- `AUTH_GOOGLE_ID` — OAuth client ID. Required because `lib/auth.ts` always registers the Google provider.
- `AUTH_GOOGLE_SECRET` — OAuth client secret. Required because `lib/auth.ts` always registers the Google provider.

Email:

- `EMAIL_SERVER_HOST`
- `EMAIL_SERVER_PORT`
- `EMAIL_SERVER_USER`
- `EMAIL_SERVER_PASSWORD`
- `EMAIL_FROM`
- `CONTACT_EMAIL` — optional; recipient of the public contact form.

Storage (Backblaze B2 S3-compatible API):

- `B2_BUCKET_NAME` — B2 bucket name.
- `B2_BUCKET_ID` — optional bucket ID.
- `B2_APPLICATION_KEY_ID` — Backblaze application key ID.
- `B2_APPLICATION_KEY` — Backblaze application key secret.
- `B2_ENDPOINT` — required S3 endpoint host, for example `s3.us-east-005.backblazeb2.com`. No separate region env var is required; the code infers it from this endpoint.
- `B2_DOWNLOAD_URL` — optional public/custom/CDN base URL. If unset, public URLs use `https://{bucket}.{B2_ENDPOINT}/{key}`.
- `STORAGE_PUBLIC_ACCESS` — optional; `true` links files straight to the public bucket, otherwise files are proxied through `/api/s3/file/...`.

The code also accepts older `BACKBLAZE_*` and AWS-compatible variable names for compatibility, but the current local `.env` uses the `B2_*` names above.

If direct browser uploads fail and fall back to server-side upload, configure CORS on the Backblaze bucket to allow `PUT` from the app domain and local development origin.

Payments, when enabled:

- `NEXT_PUBLIC_RECURRENTE_API_URL`
- `RECURRENTE_PUBLIC_KEY`
- `RECURRENTE_SECRET_KEY`

## Vercel Deployment

Use the Next.js preset.

- Install command: `yarn install`
- Build command: `yarn build`
- Output directory: `.next`

After deployment, create or verify an admin user, then test:

- Admin course creation and publishing.
- Free student course enrollment.
- Learning path creation and enrollment.
- Cohort creation with live sessions.
- Student schedule visibility.
- Quiz attempt scoring and chapter completion.
- Forum visibility by course/path/cohort enrollment.
- Admin email groups.

## Free MVP Payments

The live product path is free enrollment. Paid products intentionally return payment-required responses until checkout expansion is completed. Payment records remain generic and can represent courses, learning paths, or subscriptions.
