# Deployment Guide

This guide covers deployment for the Se Libre BTC course platform.

## Pre-Deployment Checklist

- PostgreSQL database with `DATABASE_URL` and `DIRECT_URL`.
- Generated Prisma client.
- Object storage for course images, videos, PDFs, and resources.
- Email SMTP credentials for admin campaigns and transactional email.
- Auth secret and production app URL.
- Optional Recurrente keys for future paid products.
- Supabase credentials if Supabase-backed uploads or services are enabled.

## Required Validation

Run these checks before deploying:

```bash
DATABASE_URL="postgresql://user:pass@host:5432/db" DIRECT_URL="postgresql://user:pass@host:5432/db" yarn prisma validate
yarn prisma generate
yarn tsc --noEmit
yarn lint
yarn build
```

## Database

Apply migrations in production:

```bash
yarn prisma migrate deploy
yarn prisma generate
```

The current platform data model includes courses, modules, chapters, learning paths, cohorts, live sessions, free enrollments, self-check quizzes, generic payments, forum posts, notifications, and course contributors.

## Environment Variables

Core:

- `DATABASE_URL`
- `DIRECT_URL`
- `AUTH_SECRET`
- `NEXTAUTH_URL`

Email:

- `EMAIL_SERVER_HOST`
- `EMAIL_SERVER_PORT`
- `EMAIL_SERVER_USER`
- `EMAIL_SERVER_PASSWORD`
- `EMAIL_FROM`

Storage (Backblaze B2 S3-compatible API):

- `B2_BUCKET_NAME` — B2 bucket name.
- `B2_BUCKET_ID` — optional bucket ID.
- `B2_APPLICATION_KEY_ID` — Backblaze application key ID.
- `B2_APPLICATION_KEY` — Backblaze application key secret.
- `B2_ENDPOINT` — required S3 endpoint host, for example `s3.us-east-005.backblazeb2.com`. No separate region env var is required; the code infers it from this endpoint.
- `B2_DOWNLOAD_URL` — optional public/custom/CDN base URL. If unset, public URLs use `https://{bucket}.{B2_ENDPOINT}/{key}`.

The code also accepts older `BACKBLAZE_*` and AWS-compatible variable names for compatibility, but the current local `.env` uses the `B2_*` names above.

If direct browser uploads fail and fall back to server-side upload, configure CORS on the Backblaze bucket to allow `PUT` from the app domain and local development origin.

Supabase, when used:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

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
