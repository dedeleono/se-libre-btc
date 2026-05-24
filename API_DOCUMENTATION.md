# API Documentation - Colegio Saber Ver LMS

This document provides an overview of the API routes and server actions available in the platform.

---

## 📋 Table of Contents

- [Authentication](#authentication)
- [Users](#users)
- [Courses](#courses)
- [Assignments](#assignments)
- [Submissions](#submissions)
- [Payments](#payments)
- [Forum](#forum)
- [Notifications](#notifications)
- [File Management](#file-management)
- [Academic Years](#academic-years)
- [Levels](#levels)

---

## 🔐 Authentication

All API routes (except public endpoints) require authentication via NextAuth.js session cookies.

### Authentication Flow

1. User requests magic link via email
2. User clicks link in email
3. Session is created with JWT token
4. Session includes user ID, email, and role

### Auth Endpoints

#### `POST /api/auth/signin`
Initiates email authentication flow.

**Request:**
```json
{
  "email": "user@example.com"
}
```

**Response:**
```json
{
  "message": "Check your email for the login link"
}
```

#### `GET /api/auth/validate-user`
Validates user session and determines redirect path based on:
- Onboarding status
- Payment status (for students)
- User role

**Response:**
```json
{
  "redirectTo": "/student",
  "userInfo": {
    "email": "student@example.com",
    "name": "Student Name"
  }
}
```

---

## 👥 Users

### `GET /api/users/profile`
Get current user's profile information.

**Authentication:** Required

**Response:**
```json
{
  "id": "user-id",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "STUDENT",
  "levelId": "level-id",
  "onboardingCompleted": true
}
```

### `PATCH /api/users/profile`
Update user profile.

**Authentication:** Required

**Request:**
```json
{
  "name": "John Doe",
  "firstName": "John",
  "lastName": "Doe",
  "phone": "+1234567890",
  "carnet": "ABC123"
}
```

**Response:**
```json
{
  "success": true,
  "user": { /* updated user object */ }
}
```

### `POST /api/admin/users/invite`
Send invitation email to new user (Admin only).

**Authentication:** Required (Admin)

**Request:**
```json
{
  "email": "newuser@example.com",
  "name": "New User",
  "firstName": "New",
  "lastName": "User",
  "role": "STUDENT",
  "levelId": "level-id",
  "phone": "+1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "invitationId": "invitation-id",
  "checkoutUrl": "https://payment-url.com"
}
```

---

## 📚 Courses

### `GET /api/courses`
Get all published courses.

**Authentication:** Required

**Query Parameters:**
- `userId` - Filter courses for specific user
- `levelId` - Filter courses by level
- `isPublished` - Filter published/unpublished courses

**Response:**
```json
{
  "courses": [
    {
      "id": "course-id",
      "title": "Introduction to Programming",
      "description": "Learn the basics of programming",
      "imageUrl": "https://cdn.example.com/image.jpg",
      "isPublished": true,
      "teacher": {
        "id": "teacher-id",
        "name": "Teacher Name"
      }
    }
  ]
}
```

### `GET /api/courses/[courseId]`
Get specific course details.

**Authentication:** Required

**Response:**
```json
{
  "id": "course-id",
  "title": "Introduction to Programming",
  "description": "Course description",
  "modules": [
    {
      "id": "module-id",
      "title": "Module 1",
      "position": 0,
      "chapters": [
        {
          "id": "chapter-id",
          "title": "Chapter 1",
          "type": "LESSON",
          "isPublished": true,
          "position": 0
        }
      ]
    }
  ],
  "attachments": [],
  "progress": {
    "completedChapters": 5,
    "totalChapters": 10,
    "percentage": 50
  }
}
```

### `POST /api/courses`
Create new course (Teacher/Admin only).

**Authentication:** Required (Teacher/Admin)

**Request:**
```json
{
  "title": "New Course",
  "description": "Course description",
  "teacherId": "teacher-id"
}
```

**Response:**
```json
{
  "success": true,
  "courseId": "new-course-id"
}
```

### `PATCH /api/courses/[courseId]`
Update course details.

**Authentication:** Required (Teacher/Admin)

**Request:**
```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "imageUrl": "https://cdn.example.com/new-image.jpg",
  "isPublished": true
}
```

### `DELETE /api/courses/[courseId]`
Delete a course (Admin only).

**Authentication:** Required (Admin)

**Response:**
```json
{
  "success": true
}
```

---

## 📖 Chapters

### `GET /api/chapters/[chapterId]`
Get chapter details and content.

**Authentication:** Required

**Response:**
```json
{
  "id": "chapter-id",
  "title": "Chapter Title",
  "type": "LESSON",
  "description": "Chapter description",
  "videoUrl": "https://cdn.example.com/video.mp4",
  "richContent": "<lexical-editor-state>",
  "attachments": [],
  "assignments": [],
  "isCompleted": false,
  "nextChapter": {
    "id": "next-chapter-id",
    "title": "Next Chapter"
  }
}
```

### `POST /api/chapters`
Create new chapter (Teacher/Admin only).

**Authentication:** Required (Teacher/Admin)

**Request:**
```json
{
  "moduleId": "module-id",
  "title": "New Chapter",
  "type": "LESSON",
  "position": 0
}
```

### `PUT /api/chapters/[chapterId]/progress`
Mark chapter as completed.

**Authentication:** Required

**Request:**
```json
{
  "isCompleted": true
}
```

**Response:**
```json
{
  "success": true
}
```

---

## 📝 Assignments

### `GET /api/assignments`
Get all assignments.

**Authentication:** Required

**Query Parameters:**
- `courseId` - Filter by course
- `teacherId` - Filter by teacher
- `status` - Filter by submission status

**Response:**
```json
{
  "assignments": [
    {
      "id": "assignment-id",
      "title": "Quiz 1",
      "description": "First quiz",
      "isQuiz": true,
      "deadline": "2024-12-31T23:59:59Z",
      "maxPoints": 100,
      "chapter": {
        "id": "chapter-id",
        "title": "Chapter 1"
      }
    }
  ]
}
```

### `GET /api/assignments/[assignmentId]`
Get assignment details with questions.

**Authentication:** Required

**Response:**
```json
{
  "id": "assignment-id",
  "title": "Quiz 1",
  "description": "First quiz",
  "maxPoints": 100,
  "timer": 60,
  "deadline": "2024-12-31T23:59:59Z",
  "questions": [
    {
      "id": "question-id",
      "position": 0,
      "content": "What is 2 + 2?",
      "type": "MULTIPLE_CHOICE",
      "points": 10,
      "options": [
        { "id": "opt-1", "content": "3" },
        { "id": "opt-2", "content": "4" },
        { "id": "opt-3", "content": "5" }
      ],
      "correctOption": "opt-2"
    }
  ]
}
```

### `POST /api/assignments`
Create new assignment (Teacher/Admin only).

**Authentication:** Required (Teacher/Admin)

**Request:**
```json
{
  "chapterId": "chapter-id",
  "title": "New Assignment",
  "description": "Assignment description",
  "isQuiz": true,
  "maxPoints": 100,
  "timer": 60,
  "deadline": "2024-12-31T23:59:59Z"
}
```

### `POST /api/assignments/[assignmentId]/questions`
Add question to assignment.

**Authentication:** Required (Teacher/Admin)

**Request:**
```json
{
  "position": 0,
  "content": "Question text",
  "type": "MULTIPLE_CHOICE",
  "points": 10,
  "options": [
    { "content": "Option 1" },
    { "content": "Option 2" },
    { "content": "Option 3" }
  ],
  "correctOption": "0"
}
```

---

## 📄 Submissions

### `GET /api/submissions`
Get submissions for an assignment.

**Authentication:** Required

**Query Parameters:**
- `assignmentId` - Required
- `studentId` - Optional (teachers can view all students)

**Response:**
```json
{
  "submissions": [
    {
      "id": "submission-id",
      "studentId": "student-id",
      "student": {
        "name": "Student Name",
        "email": "student@example.com"
      },
      "status": "GRADED",
      "score": 85,
      "submittedAt": "2024-01-15T10:30:00Z"
    }
  ]
}
```

### `GET /api/submissions/[submissionId]`
Get detailed submission with answers.

**Authentication:** Required

**Response:**
```json
{
  "id": "submission-id",
  "status": "GRADED",
  "score": 85,
  "startedAt": "2024-01-15T10:00:00Z",
  "submittedAt": "2024-01-15T10:30:00Z",
  "teacherFeedback": "Good work!",
  "answers": [
    {
      "questionId": "question-id",
      "content": "Answer text",
      "isCorrect": true,
      "score": 10
    }
  ]
}
```

### `POST /api/submissions`
Create new submission (start assignment).

**Authentication:** Required

**Request:**
```json
{
  "assignmentId": "assignment-id"
}
```

### `PATCH /api/submissions/[submissionId]`
Update submission (submit answers).

**Authentication:** Required

**Request:**
```json
{
  "answers": [
    {
      "questionId": "question-id",
      "content": "Answer text",
      "selectedOptions": ["option-id"]
    }
  ],
  "status": "SUBMITTED"
}
```

### `POST /api/submissions/[submissionId]/grade`
Grade a submission (Teacher/Admin only).

**Authentication:** Required (Teacher/Admin)

**Request:**
```json
{
  "score": 85,
  "feedback": "Good work! Review question 3.",
  "answers": [
    {
      "answerId": "answer-id",
      "score": 10,
      "isCorrect": true
    }
  ]
}
```

---

## 💳 Payments

### `POST /api/payments/create`
Create payment intent for level enrollment.

**Authentication:** Required

**Request:**
```json
{
  "levelId": "level-id",
  "customerEmail": "student@example.com",
  "baseUrl": "https://yourdomain.com"
}
```

**Response:**
```json
{
  "id": "payment-intent-id",
  "amount_in_cents": 50000,
  "currency": "USD",
  "checkout_url": "https://recurrente.com/checkout/xxx",
  "client_secret": "secret_xxx"
}
```

### `POST /api/payments/webhook`
Handle payment webhook from Recurrente.

**Authentication:** Not required (webhook signature validation)

**Request:** (From Recurrente)
```json
{
  "event": "charge.succeeded",
  "data": {
    "id": "payment-id",
    "amount_in_cents": 50000,
    "status": "succeeded",
    "metadata": {
      "levelId": "level-id",
      "userEmail": "student@example.com"
    }
  }
}
```

### `GET /api/payments`
Get payment history (Admin or own payments).

**Authentication:** Required

**Query Parameters:**
- `userId` - Filter by user (Admin only)
- `levelId` - Filter by level
- `status` - Filter by status

**Response:**
```json
{
  "payments": [
    {
      "id": "payment-id",
      "amount": 500.00,
      "status": "COMPLETED",
      "paymentDate": "2024-01-15T10:00:00Z",
      "level": {
        "name": "Nivel 1"
      }
    }
  ]
}
```

---

## 💬 Forum

### `GET /api/forum`
Get forum posts.

**Authentication:** Required

**Query Parameters:**
- `levelId` - Filter by level
- `courseId` - Filter by course
- `authorId` - Filter by author

**Response:**
```json
{
  "posts": [
    {
      "id": "post-id",
      "title": "Question about homework",
      "content": "Post content",
      "authorId": "user-id",
      "author": {
        "name": "Student Name",
        "image": "https://cdn.example.com/avatar.jpg"
      },
      "createdAt": "2024-01-15T10:00:00Z",
      "commentCount": 5,
      "viewCount": 25
    }
  ]
}
```

### `POST /api/forum`
Create forum post.

**Authentication:** Required

**Request:**
```json
{
  "title": "Post Title",
  "content": "Post content",
  "levelId": "level-id",
  "courseId": "course-id",
  "meetingLink": "https://meet.google.com/xxx",
  "meetingDate": "2024-01-20T15:00:00Z"
}
```

### `POST /api/forum/[postId]/reply`
Reply to forum post.

**Authentication:** Required

**Request:**
```json
{
  "content": "Reply content",
  "parentId": "parent-reply-id" // Optional for nested replies
}
```

---

## 🔔 Notifications

### `GET /api/notifications`
Get user notifications.

**Authentication:** Required

**Response:**
```json
{
  "notifications": [
    {
      "id": "notification-id",
      "type": "ASSIGNMENT_GRADED",
      "title": "Assignment Graded",
      "body": "Your assignment has been graded",
      "isRead": false,
      "createdAt": "2024-01-15T10:00:00Z",
      "sender": {
        "name": "Teacher Name"
      }
    }
  ]
}
```

### `PATCH /api/notifications/[notificationId]`
Mark notification as read.

**Authentication:** Required

**Request:**
```json
{
  "isRead": true
}
```

### `PATCH /api/notifications/mark-all-read`
Mark all notifications as read.

**Authentication:** Required

---

## 📁 File Management

### `POST /api/s3/upload`
Upload file to S3.

**Authentication:** Required

**Request:** (multipart/form-data)
```
file: <binary>
type: "video" | "image" | "document" | "mixed"
```

**Response:**
```json
{
  "url": "https://cdn.example.com/assets/video/filename.mp4",
  "key": "assets/video/filename.mp4"
}
```

### `DELETE /api/s3/delete`
Delete file from S3.

**Authentication:** Required

**Request:**
```json
{
  "fileUrl": "https://cdn.example.com/assets/video/filename.mp4"
}
```

### `GET /api/s3/presigned-url`
Get presigned URL for direct upload.

**Authentication:** Required

**Query Parameters:**
- `fileName` - Name of the file
- `fileType` - MIME type
- `type` - "video" | "image" | "document" | "mixed"

**Response:**
```json
{
  "uploadUrl": "https://s3.amazonaws.com/...",
  "fileUrl": "https://cdn.example.com/assets/..."
}
```

---

## 📅 Academic Years

### `GET /api/academic-year`
Get all academic years.

**Authentication:** Required (Admin)

**Response:**
```json
{
  "academicYears": [
    {
      "id": "year-id",
      "name": "2024-2025",
      "startDate": "2024-08-01",
      "endDate": "2025-06-30",
      "isActive": true
    }
  ]
}
```

### `POST /api/academic-year`
Create new academic year (Admin only).

**Authentication:** Required (Admin)

**Request:**
```json
{
  "name": "2024-2025",
  "startDate": "2024-08-01",
  "endDate": "2025-06-30",
  "isActive": true
}
```

### `POST /api/academic-year/rollover`
Rollover students to new academic year.

**Authentication:** Required (Admin)

**Request:**
```json
{
  "currentYearId": "current-year-id",
  "newYearId": "new-year-id",
  "studentIds": ["student-id-1", "student-id-2"],
  "promoteToNextLevel": true
}
```

---

## 🎓 Levels

### `GET /api/levels`
Get all levels.

**Authentication:** Required

**Response:**
```json
{
  "levels": [
    {
      "id": "level-id",
      "name": "Nivel 1",
      "position": 0,
      "price": 500.00,
      "inscriptionPrice": 100.00,
      "courseCount": 5,
      "studentCount": 25
    }
  ]
}
```

### `POST /api/levels`
Create new level (Admin only).

**Authentication:** Required (Admin)

**Request:**
```json
{
  "name": "Nivel 1",
  "position": 0,
  "price": 500.00,
  "inscriptionPrice": 100.00
}
```

### `POST /api/levels/[levelId]/assign-course`
Assign course to level.

**Authentication:** Required (Admin)

**Request:**
```json
{
  "courseId": "course-id"
}
```

---

## 📊 Analytics & Reports

### `GET /api/dashboard/analytics`
Get dashboard analytics.

**Authentication:** Required

**Query Parameters:**
- `userId` - For student/teacher specific analytics
- `courseId` - For course-specific analytics
- `levelId` - For level-specific analytics

**Response:**
```json
{
  "totalStudents": 100,
  "totalCourses": 10,
  "averageProgress": 65.5,
  "completionRate": 80.2,
  "assignmentsSubmitted": 250,
  "averageGrade": 85.5
}
```

### `GET /api/courses/[courseId]/analytics`
Get course-specific analytics (Teacher/Admin).

**Authentication:** Required (Teacher/Admin)

**Response:**
```json
{
  "enrolledStudents": 25,
  "averageProgress": 70.5,
  "completedStudents": 5,
  "averageGrade": 87.2,
  "assignmentStats": [
    {
      "assignmentId": "assignment-id",
      "title": "Quiz 1",
      "submissions": 20,
      "averageScore": 85.5
    }
  ]
}
```

---

## 🔧 Utility Endpoints

### `GET /api/search`
Search across courses, chapters, and assignments.

**Authentication:** Required

**Query Parameters:**
- `q` - Search query
- `type` - "courses" | "chapters" | "assignments"

**Response:**
```json
{
  "results": [
    {
      "id": "result-id",
      "title": "Result Title",
      "type": "course",
      "description": "Result description"
    }
  ]
}
```

### `GET /api/categories`
Get all course categories.

**Authentication:** Required

**Response:**
```json
{
  "categories": [
    {
      "id": "category-id",
      "name": "Programming",
      "courseCount": 5
    }
  ]
}
```

---

## 📧 Email API

### `POST /api/email`
Send bulk email (Teacher/Admin only).

**Authentication:** Required (Teacher/Admin)

**Request:**
```json
{
  "recipients": ["email1@example.com", "email2@example.com"],
  "subject": "Email Subject",
  "htmlContent": "<html>...</html>",
  "levelId": "level-id", // Optional
  "courseId": "course-id" // Optional
}
```

---

## 🛡️ Error Responses

All API endpoints follow a consistent error response format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "statusCode": 400
}
```

### Common Error Codes

- `UNAUTHORIZED` (401) - Missing or invalid authentication
- `FORBIDDEN` (403) - Insufficient permissions
- `NOT_FOUND` (404) - Resource not found
- `VALIDATION_ERROR` (400) - Invalid request data
- `INTERNAL_ERROR` (500) - Server error

---

## 🔒 Authentication & Authorization

### Role-Based Access Control

| Endpoint | Student | Teacher | Admin |
|----------|---------|---------|-------|
| GET /api/courses | ✅ | ✅ | ✅ |
| POST /api/courses | ❌ | ✅ | ✅ |
| DELETE /api/courses | ❌ | ❌ | ✅ |
| POST /api/assignments | ❌ | ✅ | ✅ |
| POST /api/submissions | ✅ | ❌ | ❌ |
| POST /api/submissions/grade | ❌ | ✅ | ✅ |
| GET /api/payments | Own only | ❌ | ✅ |
| POST /api/admin/* | ❌ | ❌ | ✅ |

---

## 📝 Notes

1. **Rate Limiting:** Consider implementing rate limiting for production
2. **Pagination:** Most list endpoints should implement pagination (not shown in examples)
3. **Caching:** Use Next.js caching strategies for frequently accessed data
4. **Validation:** All requests are validated using Zod schemas
5. **Error Handling:** All endpoints include try-catch blocks with appropriate error responses

---

**For more details, refer to the actual implementation in `/app/api/` directory.**

