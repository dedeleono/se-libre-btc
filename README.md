# Se Libre BTC Platform

Se Libre BTC is a course platform for Bitcoin education. The app supports two global roles, `ADMIN` and `STUDENT`, with course contributors modeled per course for future instructor workflows.

## Core Features

- Course authoring with modules, chapters, resources, videos, PDFs, rich content, and publish controls.
- Public course preview at `/courses/preview/[courseId]`.
- Authenticated course player at `/courses/[courseId]`.
- Learning paths that bundle ordered courses.
- Cohorts for live or hybrid delivery.
- Live sessions attached to courses, learning paths, or cohorts.
- Self-check quizzes with attempts, answers, pass/fail scoring, retries, and optional answer explanations.
- Free enrollment MVP for courses, learning paths, and cohorts.
- Generic payment records for future paid courses, learning paths, and subscriptions.
- Forum posts scoped to courses, learning paths, or cohorts.
- Admin emailing to all students or course/path/cohort groups.

## Roles

`ADMIN` users manage content, students, payments, learning paths, cohorts, live sessions, forum posts, and email campaigns.

`STUDENT` users enroll in free products, access the course player, take self-check quizzes, view schedules, participate in scoped forums, and review payment history.

## Main Routes

- `/admin` - admin dashboard.
- `/admin/courses` - course builder entry point.
- `/admin/learning-paths` - learning path builder.
- `/admin/cohorts` - cohort and live session management.
- `/student` - student dashboard.
- `/student/schedule` - enrolled live session schedule.
- `/courses` - public course catalog.
- `/courses/preview/[courseId]` - public course preview.
- `/courses/[courseId]` - authenticated course player.
- `/learning-paths` - public learning path catalog.
- `/forum` - enrollment-aware community area.

## Data Model

The platform centers on:

- `Course`, `CourseModule`, `Chapter`, and `Attachment`.
- `LearningPath` and `LearningPathCourse`.
- `CourseEnrollment`, `LearningPathEnrollment`, and `CohortEnrollment`.
- `Cohort` and `LiveSession`.
- `Quiz`, `QuizQuestion`, `QuizOption`, `QuizAttempt`, and `QuizAttemptAnswer`.
- `Payment` with `COURSE`, `LEARNING_PATH`, or `SUBSCRIPTION` product types.
- `CourseContributor` for future per-course instructor/editor roles.

## Development

Install dependencies:

```bash
yarn install
```

Validate and generate Prisma:

```bash
DATABASE_URL="postgresql://user:pass@localhost:5432/db" DIRECT_URL="postgresql://user:pass@localhost:5432/db" yarn prisma validate
yarn prisma generate
```

Run quality checks:

```bash
yarn tsc --noEmit
yarn lint
yarn build
```

Start the app:

```bash
yarn dev
```
