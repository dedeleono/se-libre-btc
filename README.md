# Colegio Saber Ver - Learning Management System (LMS)

> A comprehensive educational platform designed for Colegio Saber Ver, featuring course management, assessments, forums, and integrated payment processing.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Features by User Role](#features-by-user-role)
- [Database Schema](#database-schema)
- [Setup & Installation](#setup--installation)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Third-Party Integrations](#third-party-integrations)
- [Maintenance & Support](#maintenance--support)

---

## 🎯 Overview

Colegio Saber Ver LMS is a full-featured educational management platform built with modern web technologies. The platform supports three user roles (Admin, Teacher, Student) with role-based access control, comprehensive course management, interactive assignments with multiple question types, payment processing, and real-time collaboration features.

**Key Capabilities:**
- Multi-role authentication system with email verification
- Course and curriculum management organized by levels and modules
- Rich content editor (Lexical) with collaborative editing
- Multiple assignment types (quizzes, open-ended, file uploads, matching questions)
- Automated and manual grading systems
- Payment processing with Recurrente integration
- Forum and discussion boards
- Real-time notifications
- File storage with AWS S3 and CloudFront CDN
- Academic year management and student enrollment tracking
- Analytics and progress tracking

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js 14.2.5 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS with custom design system
- **UI Components:** Radix UI primitives
- **Rich Text Editor:** Lexical with custom plugins
- **State Management:** React Query (TanStack Query)
- **Forms:** React Hook Form with Zod validation
- **Animations:** Framer Motion

### Backend
- **Framework:** Next.js API Routes
- **Authentication:** NextAuth.js v5 (with custom email provider)
- **Database:** PostgreSQL (Prisma ORM)
- **File Storage:** AWS S3 + CloudFront
- **Email:** Nodemailer with React Email templates
- **Real-time:** Supabase for real-time features

### Payment Processing
- **Provider:** Recurrente (for level enrollment and payments)

### Development Tools
- **Package Manager:** Yarn
- **Linting:** ESLint
- **Code Formatting:** Prettier
- **Type Checking:** TypeScript

---

## 🏗️ Architecture

### Application Structure

The application follows a **role-based architecture** with three main user portals:

```
├── (auth)          # Authentication routes (login, signup)
├── (client)        # Public-facing pages (landing, about, contact)
├── (course)        # Course viewing and interaction
├── (dashboard)     # Role-based dashboards
│   ├── /admin      # Admin portal
│   ├── /teacher    # Teacher portal
│   └── /student    # Student portal
└── api/            # Backend API routes
```

### Data Flow

1. **Authentication Flow:**
   - Email-based passwordless authentication
   - JWT session tokens stored in cookies
   - Role-based middleware protection
   - Onboarding flow for new users

2. **Course Access Flow:**
   - Students must have valid academic year enrollment
   - Payment verification through Recurrente
   - Level-based course assignment
   - Chapter progress tracking

3. **Assignment Workflow:**
   - Teachers create assignments with multiple question types
   - Students submit answers (timed or untimed)
   - Automatic grading for multiple-choice questions
   - Manual grading for open-ended responses
   - Grade history and regrade requests

---

## 👥 Features by User Role

### 🎓 Student Features

**Dashboard:**
- Overview of enrolled courses and progress
- Recent submissions and grades
- Upcoming assignments and deadlines

**Courses:**
- Browse and access enrolled courses
- View course modules and chapters
- Interactive content (video, PDF, rich text)
- Take notes within chapters
- Track completion progress

**Assignments:**
- Submit quizzes and homework
- Multiple question types support:
  - Multiple choice
  - Fill-in-the-blank
  - Open-ended (text)
  - File uploads
  - Matching questions
- View grades and feedback

**Additional Features:**
- Calendar view of course schedule
- Portfolio of submitted work
- Forum participation
- Payment history
- Profile management

### 👨‍🏫 Teacher Features

**Dashboard:**
- Course activity overview
- Recent student submissions
- Statistics on assignments and student progress

**Course Management:**
- Create and edit courses
- Organize content into modules and chapters
- Upload attachments (documents, videos, images)
- Rich content editor with collaborative features
- Reorder chapters and modules

**Assignment Management:**
- Create quizzes and assignments
- Multiple question types with points allocation
- Set deadlines and timers
- View all submissions
- Grade assignments manually or automatically
- Provide feedback to students
- Handle regrade requests

**Student Management:**
- View enrolled students
- Track individual student progress
- Access student portfolios

**Communication:**
- Send bulk emails to students
- Create forum posts and discussions
- Respond to student questions

### 👨‍💼 Admin Features

**Dashboard:**
- System-wide analytics
- Recent enrollments and payments
- Platform statistics

**User Management:**
- Create and manage students, teachers, and admins
- Send invitation emails
- Assign users to levels
- Track user activity and status

**Academic Year Management:**
- Create and manage academic years
- Enroll students in levels for specific years
- Track payment status per academic year
- Year rollover functionality

**Course Management:**
- Assign courses to levels
- Assign teachers to courses
- Manage course visibility and publishing
- Duplicate courses across levels

**Payment Management:**
- View all payment transactions
- Configure level pricing (inscription + monthly fees)
- Track payment status
- Generate payment reports

**System Administration:**
- Manage categories
- Handle regrade approvals
- View and manage all forum posts
- Send system-wide emails

---

## 🗄️ Database Schema

The database uses **PostgreSQL** with Prisma ORM. Key models include:

### Core Models

**User:**
- Multi-role support (ADMIN, TEACHER, STUDENT)
- Profile information (name, email, phone, image)
- Carnet and MINEDUC ID for students
- Onboarding status tracking

**Level:**
- Academic levels/grades
- Pricing configuration (inscription + monthly)
- Course assignments

**Course:**
- Course metadata (title, description, image)
- Teacher assignment
- Publishing status
- Freelance vs. level-based courses

**CourseModule:**
- Organizes chapters within a course
- Sequential ordering

**Chapter:**
- Different types (LESSON, QUIZ, ASSIGNMENT)
- Multiple content formats (video, PDF, rich content, YouTube)
- Progress tracking

**Assignment:**
- Quiz or homework assignments
- Timer support
- Multiple question types
- Point allocation

### Assessment Models

**Question:**
- Multiple types: MULTIPLE_CHOICE, OPEN_ENDED, FILL_IN_THE_BLANK, MATCHING
- Points per question
- Options and correct answers

**Submission:**
- Student assignment submissions
- Status tracking (PENDING, SUBMITTED, GRADED)
- File upload support
- Teacher feedback

**Answer:**
- Student responses to questions
- Automatic scoring for multiple-choice
- Manual scoring for open-ended

### Grading & Scoring

**StudentAssignmentScore:** Individual assignment scores
**StudentModuleScore:** Module-level scores
**StudentCourseScore:** Course-level scores
**StudentLevelScore:** Overall level scores
**GradeHistory:** Audit trail for grade changes and approvals

### Academic Management

**AcademicYear:**
- School year definition (e.g., "2024-2025")
- Active status tracking

**StudentAcademicYear:**
- Links students to levels within academic years
- Payment status
- Final grades
- Academic status (ACTIVE, COMPLETED, FAILED)

### Payment System

**Payment:**
- Amount and status tracking
- Payment method
- Links to user, level, course
- Academic year association

**PendingInvitation:**
- Pre-enrollment invitations
- Token-based email verification
- Payment link association

### Communication

**ForumPost:** Discussion topics
**ForumReply:** Threaded comments
**Notifications:** System notifications
**StudentNote:** Chapter-specific notes

---

## 🚀 Setup & Installation

### Prerequisites

- **Node.js:** v18 or higher
- **Yarn:** v1.22+
- **PostgreSQL:** v14 or higher
- **AWS Account:** For S3 storage
- **Recurrente Account:** For payment processing

### Installation Steps

1. **Clone the repository:**
```bash
git clone https://github.com/dedeleono/saber-ver-v2.git
cd saber-ver-v2
```

2. **Install dependencies:**
```bash
yarn install
```

3. **Set up environment variables:**
Create a `.env` file in the root directory (see [Environment Variables](#environment-variables) section).

4. **Set up the database:**
```bash
# Generate Prisma Client
yarn prisma generate

# Run migrations
yarn prisma migrate deploy

# (Optional) Seed the database
yarn prisma db seed
```

5. **Run the development server:**
```bash
yarn dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

```bash
yarn build
yarn start
```

---

## 🔐 Environment Variables

Create a `.env` file with the following variables:

### Database
```env
DATABASE_URL="postgresql://user:password@host:5432/database"
DIRECT_URL="postgresql://user:password@host:5432/database"
```

### Authentication
```env
AUTH_SECRET="your-secret-key-generate-with-openssl"
NEXTAUTH_URL="http://localhost:3000"
```

### Email Configuration
```env
EMAIL_SERVER_HOST="smtp.gmail.com"
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER="your-email@gmail.com"
EMAIL_SERVER_PASSWORD="your-app-password"
EMAIL_FROM="noreply@saberverv2.com"
```

### AWS S3 Storage
```env
AWS_BUCKET_NAME="your-bucket-name"
AWS_BUCKET_REGION="us-east-1"
AWS_BUCKET_ACCESS_KEY="your-access-key"
AWS_BUCKET_SECRET_ACCESS_KEY="your-secret-key"
AWS_CLOUDFRONT_URL="https://your-cloudfront-distribution.cloudfront.net"
```

### Supabase (for real-time features)
```env
SUPABASE_URL="https://your-project.supabase.co"
SUPABASE_ANON_KEY="your-anon-key"
SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

### Payment Processing (Recurrente)
```env
NEXT_PUBLIC_RECURRENTE_API_URL="https://app.recurrente.com/api"
RECURRENTE_PUBLIC_KEY="your-public-key"
RECURRENTE_SECRET_KEY="your-secret-key"
```

---

## 🚢 Deployment

### Recommended Platform: Vercel

1. **Connect your repository** to Vercel
2. **Configure environment variables** in Vercel dashboard
3. **Set build command:** `yarn build`
4. **Set output directory:** `.next`

### Database Hosting

Recommended PostgreSQL hosting providers:
- **Supabase** (includes real-time features)
- **Neon**
- **Railway**
- **AWS RDS**

### File Storage

Configure AWS S3 bucket with:
- Public read access for uploaded files
- CloudFront distribution for CDN
- CORS configuration for uploads from your domain

### Email Service

For production email sending, use:
- **AWS SES**
- **SendGrid**
- **Postmark**

Update email configuration in `lib/auth.ts` and environment variables.

---

## 📁 Project Structure

```
saber-ver-v2/
├── actions/                    # Server actions
│   ├── course.ts              # Course-related actions
│   ├── get-analytics.ts       # Analytics data
│   ├── grades.ts              # Grading operations
│   └── ...
│
├── app/                        # Next.js App Router
│   ├── (auth)/                # Authentication pages
│   ├── (client)/              # Public pages
│   ├── (course)/              # Course viewing
│   ├── (dashboard)/           # Role-based dashboards
│   │   ├── (routes)/
│   │   │   ├── admin/         # Admin portal
│   │   │   ├── teacher/       # Teacher portal
│   │   │   └── student/       # Student portal
│   │   └── layout.tsx
│   ├── api/                   # API routes
│   │   ├── assignments/
│   │   ├── courses/
│   │   ├── payments/
│   │   ├── auth/
│   │   └── ...
│   ├── layout.tsx
│   └── globals.css
│
├── components/                 # Reusable components
│   ├── editor/                # Lexical rich text editor
│   ├── forms/                 # Form components
│   ├── layout/                # Layout components
│   ├── modals/                # Modal dialogs
│   ├── stepper/               # Multi-step forms
│   └── ui/                    # UI primitives (shadcn/ui)
│
├── context/                    # React context providers
│   ├── FlashMessageContext.tsx
│   ├── SettingsContext.tsx
│   └── ToolbarContext.tsx
│
├── hooks/                      # Custom React hooks
│   ├── useDebounce.ts
│   ├── useModal.tsx
│   └── ...
│
├── lib/                        # Utility libraries
│   ├── auth.ts                # Authentication configuration
│   ├── db.ts                  # Prisma client
│   ├── s3.ts                  # AWS S3 operations
│   ├── payment-service.ts     # Payment integration
│   ├── utils.ts               # General utilities
│   └── validations/           # Zod schemas
│
├── prisma/                     # Database
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Migration files
│   └── seed.ts                # Seed data
│
├── types/                      # TypeScript types
│   ├── assignments.ts
│   ├── course.ts
│   ├── dashboard.ts
│   ├── payment.ts
│   └── ...
│
├── utilities/                  # Helper functions
│
├── middleware.ts              # Next.js middleware
├── next.config.mjs            # Next.js configuration
├── tailwind.config.ts         # Tailwind CSS config
└── package.json
```

### Key Directories

**`/app/api`**: All backend API endpoints
- RESTful API routes for CRUD operations
- File upload/download endpoints
- Payment webhook handlers
- Authentication endpoints

**`/actions`**: Server-side actions for data fetching and mutations
- Used by client components to interact with the database
- Implements business logic

**`/components/editor`**: Custom Lexical editor implementation
- Rich text editing with plugins
- Collaborative editing support (YJS)
- Custom nodes (images, videos, equations, etc.)

**`/lib`**: Core utilities and configurations
- Authentication setup
- Database client
- External service integrations

---

## 🔌 Third-Party Integrations

### 1. **Authentication (NextAuth.js)**
- Email-based passwordless authentication
- JWT session management
- Custom Prisma adapter
- Role-based access control

**Configuration:** `lib/auth.ts`, `lib/auth.config.ts`

### 2. **Database (Prisma + PostgreSQL)**
- Type-safe database client
- Automatic migrations
- Connection pooling

**Configuration:** `prisma/schema.prisma`

### 3. **File Storage (AWS S3 + CloudFront)**
- Secure file uploads
- CDN delivery for static assets
- Pre-signed URLs for private files

**Configuration:** `lib/s3.ts`

### 4. **Payment Processing (Recurrente)**
- Level enrollment payments
- Subscription management
- Webhook handling for payment confirmations

**Configuration:** `lib/payment-service.ts`, `app/api/payments/`

### 5. **Email Service (Nodemailer + React Email)**
- Transactional emails (auth, notifications)
- Template-based emails
- Bulk email support

**Configuration:** `lib/email-templates.ts`, `components/emails/`

### 6. **Real-time Features (Supabase)**
- Real-time notifications
- Collaborative editing
- Live updates

**Configuration:** `lib/supabase/`

### 7. **Rich Text Editor (Lexical)**
- Advanced content editing
- Mathematical equations (KaTeX)
- Code syntax highlighting
- Drag-and-drop media
- Collaborative editing

**Configuration:** `components/editor/`

---

## 🔧 Maintenance & Support

### Common Tasks

#### Adding a New User Role
1. Update `UserRole` enum in `prisma/schema.prisma`
2. Add role routes in `app/(dashboard)/_components/sidebar-routes.tsx`
3. Update middleware in `middleware.ts`
4. Create role-specific dashboard in `app/(dashboard)/(routes)/`

#### Creating a New Assignment Type
1. Add question type to `QuestionType` enum in schema
2. Update `Question` model with necessary fields
3. Create UI component in `app/(dashboard)/(routes)/teacher/assignments/`
4. Implement grading logic in `actions/grades.ts`

#### Adding a Payment Method
1. Update payment service in `lib/payment-service.ts`
2. Add webhook handler in `app/api/payments/`
3. Update payment form in `components/forms/payment-form.tsx`

#### Database Migrations
```bash
# Create a new migration
yarn prisma migrate dev --name migration_name

# Apply migrations to production
yarn prisma migrate deploy

# Reset database (development only)
yarn prisma migrate reset
```

### Monitoring & Debugging

- **Logs:** Check Vercel deployment logs
- **Database:** Use Prisma Studio (`yarn prisma studio`)
- **Email Testing:** Use Nodemailer test accounts or MailHog
- **Error Tracking:** Consider integrating Sentry

### Backup Strategy

1. **Database:** Set up automated daily backups of PostgreSQL
2. **Files:** Enable versioning on S3 bucket
3. **Code:** Regular commits to Git repository

### Performance Optimization

- Images are served through CloudFront CDN
- Database queries use Prisma query optimization
- API routes use Next.js ISR and dynamic rendering
- Client-side caching with React Query

### Security Considerations

- All API routes are protected with NextAuth middleware
- Role-based access control on every endpoint
- SQL injection prevention through Prisma ORM
- XSS protection through React's built-in sanitization
- CSRF protection via NextAuth
- Environment variables for sensitive data
- File upload validation and sanitization

---

## 📝 License

This project is proprietary software developed for Colegio Saber Ver.

---

## 📞 Contact & Support

**Technical Contact:**
- For technical questions about the codebase, refer to inline code comments
- Check API route files for endpoint documentation
- Review Prisma schema for data model details

**Deployment & Infrastructure:**
- Vercel Dashboard: For deployment settings and logs
- AWS Console: For S3 bucket and CloudFront configuration
- Database Provider Dashboard: For database management

---

## 🎓 Getting Started Guide

### For Administrators

1. **Initial Setup:**
   - Create admin account through invitation or database seed
   - Set up academic years
   - Create levels and pricing

2. **User Management:**
   - Invite teachers and assign them to levels
   - Send student invitation emails with payment links
   - Monitor enrollment and payment status

3. **Course Management:**
   - Create categories
   - Assign courses to levels
   - Assign teachers to courses

### For Teachers

1. **Course Creation:**
   - Navigate to Teacher Dashboard
   - Create a new course or edit assigned courses
   - Organize content into modules and chapters
   - Upload materials (videos, PDFs, attachments)

2. **Assignment Creation:**
   - Create quizzes or homework assignments
   - Add questions with various types
   - Set points, deadlines, and timers
   - Publish assignments

3. **Grading:**
   - Review student submissions
   - Provide feedback
   - Grade open-ended responses
   - Handle regrade requests

### For Students

1. **Enrollment:**
   - Receive invitation email
   - Complete payment process
   - Complete onboarding
   - Access dashboard

2. **Course Access:**
   - View enrolled courses
   - Progress through chapters
   - Take notes
   - Mark chapters as complete

3. **Assignments:**
   - View upcoming assignments
   - Submit answers within deadlines
   - Review grades and feedback
   - Request regrades if needed

---

## 🚦 Troubleshooting

### Common Issues

**Authentication Issues:**
- Verify `AUTH_SECRET` is set correctly
- Check email server credentials
- Ensure database connection is working

**File Upload Issues:**
- Verify AWS credentials
- Check S3 bucket permissions
- Ensure CORS is configured correctly

**Payment Issues:**
- Verify Recurrente API credentials
- Check webhook endpoint is accessible
- Monitor payment status in admin dashboard

**Database Connection Issues:**
- Check `DATABASE_URL` format
- Verify database is accessible
- Run `yarn prisma generate` after schema changes

---

**Version:** 2.0  
**Last Updated:** 2025  
**Built with ❤️ for Colegio Saber Ver**
