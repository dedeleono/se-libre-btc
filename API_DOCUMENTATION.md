# API Documentation

This API supports the Se Libre BTC course platform with global `ADMIN` and `STUDENT` roles

## Courses

- `POST /api/courses` - create a course.
- `PATCH /api/courses/[courseId]` - update course metadata.
- `DELETE /api/courses/[courseId]` - delete a course.
- `PATCH /api/courses/[courseId]/publish` - publish a course.
- `PATCH /api/courses/[courseId]/unpublish` - unpublish a course.
- `POST /api/courses/[courseId]/enroll` - enroll the authenticated user in a free course; paid products return `402`.

## Modules And Chapters

- `POST /api/courses/[courseId]/course-modules` - create a module.
- `PATCH /api/courses/[courseId]/course-modules/[moduleId]` - update a module.
- `DELETE /api/courses/[courseId]/course-modules/[moduleId]` - delete a module.
- `PATCH /api/courses/[courseId]/course-modules/reorder` - reorder modules.
- `POST /api/courses/[courseId]/course-modules/[moduleId]/chapters` - create a chapter.
- `PATCH /api/courses/[courseId]/course-modules/[moduleId]/chapters/[chapterId]` - update a chapter.
- `DELETE /api/courses/[courseId]/course-modules/[moduleId]/chapters/[chapterId]` - delete a chapter.
- `PATCH /api/courses/[courseId]/course-modules/[moduleId]/chapters/[chapterId]/publish` - publish a chapter.
- `PATCH /api/courses/[courseId]/course-modules/[moduleId]/chapters/[chapterId]/unpublish` - unpublish a chapter.
- `PATCH /api/courses/[courseId]/course-modules/[moduleId]/chapters/reorder` - reorder chapters.

## Learning Paths

- `GET /api/learning-paths` - list published learning paths.
- `POST /api/learning-paths` - create a learning path.
- `PATCH /api/learning-paths/[learningPathId]` - update a learning path.
- `DELETE /api/learning-paths/[learningPathId]` - delete a learning path.
- `PATCH /api/learning-paths/[learningPathId]/publish` - publish a learning path.
- `PATCH /api/learning-paths/[learningPathId]/unpublish` - unpublish a learning path.
- `POST /api/learning-paths/[learningPathId]/courses` - add a course to a path.
- `PATCH /api/learning-paths/[learningPathId]/courses/reorder` - reorder path courses.
- `DELETE /api/learning-paths/[learningPathId]/courses/[courseId]` - remove a course from a path.
- `POST /api/learning-paths/[learningPathId]/enroll` - enroll in a free learning path and its courses; paid products return `402`.

## Cohorts And Live Sessions

- `GET /api/cohorts` - list cohorts.
- `POST /api/cohorts` - create a cohort.
- `PATCH /api/cohorts/[cohortId]` - update a cohort.
- `DELETE /api/cohorts/[cohortId]` - delete a cohort.
- `POST /api/cohorts/[cohortId]/enroll` - enroll in a cohort and linked course/path content.
- `POST /api/cohorts/[cohortId]/live-sessions` - create a cohort live session.
- `GET /api/live-sessions` - list live sessions.
- `POST /api/live-sessions` - create a live session.
- `PATCH /api/live-sessions/[liveSessionId]` - update a live session.
- `DELETE /api/live-sessions/[liveSessionId]` - delete a live session.

## Quizzes

- `POST /api/chapters/[chapterId]/quiz` - create or update a chapter quiz.
- `PATCH /api/quizzes/[quizId]` - update quiz settings.
- `DELETE /api/quizzes/[quizId]` - delete a quiz.
- `POST /api/quizzes/[quizId]/questions` - create a question.
- `PATCH /api/quizzes/[quizId]/questions/[questionId]` - update a question and its options.
- `DELETE /api/quizzes/[quizId]/questions/[questionId]` - delete a question.
- `PATCH /api/quizzes/[quizId]/questions/reorder` - reorder questions.
- `POST /api/quizzes/[quizId]/attempts` - start an attempt.
- `POST /api/quizzes/[quizId]/submit` - submit answers, score the attempt, persist answers, and mark the chapter complete.

Quiz failures never block progress. Chapter completion is recorded after an attempt is sent.

## Forum

- `GET /api/forum` - list posts visible to the authenticated user.
- `POST /api/forum` - create a scoped forum post.
- `POST /api/forum/posts` - create a scoped post from the dashboard UI.
- `GET /api/forum/[postId]/comments` - list comments.
- `POST /api/forum/[postId]/comments` - add a comment when the user has access to the scoped course/path/cohort.

Posts may be scoped by `courseId`, `learningPathId`, or `cohortId`.

## Payments

- `POST /api/payments/create` - create a generic payment record and optional checkout session.
- `GET /api/payments/getAll` - admin payment list with product type, product name, user, amount, and status.
- `GET /api/payments/getPaymentsByStudent` - authenticated student payment list.
- `POST /api/payments/set-intent` - store a payment intent cookie.
- `GET /api/payments/status/[paymentIntentId]` - read generic payment status.

Payment records use `COURSE`, `LEARNING_PATH`, or `SUBSCRIPTION`. Free MVP enrollment does not require checkout.
