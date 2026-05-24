# Deployment Guide - Colegio Saber Ver LMS

This guide provides step-by-step instructions for deploying the Colegio Saber Ver LMS to production.

---

## 📋 Pre-Deployment Checklist

Before deploying to production, ensure you have:

- [ ] PostgreSQL database hosted and accessible
- [ ] AWS S3 bucket configured with CloudFront
- [ ] Email service configured (Gmail, AWS SES, SendGrid, etc.)
- [ ] Recurrente payment account with API keys
- [ ] Supabase project created
- [ ] Domain name configured (if applicable)
- [ ] All environment variables documented

---

## 🚀 Deployment Steps

### 1. Database Setup

#### Option A: Supabase (Recommended)
Supabase provides both PostgreSQL and real-time features in one service.

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy the connection string from Settings > Database
3. Enable Row Level Security (RLS) policies if needed
4. Note down the following credentials:
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

#### Option B: Other PostgreSQL Providers
- **Neon:** Serverless PostgreSQL with autoscaling
- **Railway:** Simple deployment with PostgreSQL
- **AWS RDS:** Enterprise-grade database service

**After database is set up:**
```bash
# Set DATABASE_URL in your .env file
# Run migrations
yarn prisma migrate deploy

# Generate Prisma Client
yarn prisma generate

# (Optional) Seed initial data
yarn prisma db seed
```

### 2. AWS S3 Configuration

#### Create S3 Bucket
1. Log in to AWS Console
2. Navigate to S3 and create a new bucket
3. Configure bucket settings:
   - **Block Public Access:** OFF (for public files)
   - **Versioning:** Enabled (recommended)
   - **Bucket Policy:** Allow GetObject for public access

Example bucket policy:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

#### Configure CORS
Add CORS configuration to allow uploads from your domain:
```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://yourdomain.com", "http://localhost:3000"],
    "ExposeHeaders": ["ETag"]
  }
]
```

#### Create IAM User
1. Navigate to IAM > Users
2. Create a new user with programmatic access
3. Attach policy: `AmazonS3FullAccess` (or create custom policy)
4. Save the Access Key ID and Secret Access Key

#### Set Up CloudFront Distribution
1. Navigate to CloudFront in AWS Console
2. Create a new distribution
3. Set origin domain to your S3 bucket
4. Configure default cache behavior:
   - **Viewer Protocol Policy:** Redirect HTTP to HTTPS
   - **Allowed HTTP Methods:** GET, HEAD, OPTIONS, PUT, POST, PATCH, DELETE
5. Note the CloudFront distribution URL

### 3. Email Service Configuration

#### Option A: Gmail (Development/Small Scale)
1. Enable 2FA on your Gmail account
2. Generate an App Password:
   - Go to Google Account > Security > 2-Step Verification > App passwords
   - Generate a password for "Mail"
3. Use this password as `EMAIL_SERVER_PASSWORD`

**Note:** Gmail has daily sending limits (~500 emails/day)

#### Option B: AWS SES (Production)
1. Navigate to AWS SES
2. Verify your domain or email address
3. Request production access (remove sandbox limitations)
4. Create SMTP credentials
5. Update email configuration in `.env`:
```env
EMAIL_SERVER_HOST="email-smtp.us-east-1.amazonaws.com"
EMAIL_SERVER_PORT=465
EMAIL_SERVER_USER="your-smtp-username"
EMAIL_SERVER_PASSWORD="your-smtp-password"
```

#### Option C: SendGrid
1. Create account at [sendgrid.com](https://sendgrid.com)
2. Create an API key
3. Configure SMTP relay settings
4. Update `.env` with SendGrid SMTP credentials

### 4. Payment Gateway Setup (Recurrente)

1. Create/log in to your Recurrente account
2. Navigate to API settings
3. Copy your API keys:
   - Public Key (for client-side)
   - Secret Key (for server-side)
4. Configure webhook endpoint:
   - URL: `https://yourdomain.com/api/payments/webhook`
   - Events: Payment completed, Payment failed

**Test in sandbox mode first:**
```env
NEXT_PUBLIC_RECURRENTE_API_URL="https://sandbox.recurrente.com/api"
```

**Production:**
```env
NEXT_PUBLIC_RECURRENTE_API_URL="https://app.recurrente.com/api"
```

### 5. Vercel Deployment

#### Step 1: Prepare Repository
```bash
# Ensure code is committed and pushed to GitHub
git add .
git commit -m "Prepare for production deployment"
git push origin main
```

#### Step 2: Connect to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Import your GitHub repository
3. Configure project settings:
   - **Framework Preset:** Next.js
   - **Root Directory:** `./`
   - **Build Command:** `yarn build`
   - **Output Directory:** `.next`
   - **Install Command:** `yarn install`

#### Step 3: Configure Environment Variables
In Vercel dashboard, add all environment variables from `.env`:

**Database:**
- `DATABASE_URL`
- `DIRECT_URL`

**Authentication:**
- `AUTH_SECRET` (generate new for production: `openssl rand -base64 32`)
- `NEXTAUTH_URL` (your production domain)

**Email:**
- `EMAIL_SERVER_HOST`
- `EMAIL_SERVER_PORT`
- `EMAIL_SERVER_USER`
- `EMAIL_SERVER_PASSWORD`
- `EMAIL_FROM`

**AWS:**
- `AWS_BUCKET_NAME`
- `AWS_BUCKET_REGION`
- `AWS_BUCKET_ACCESS_KEY`
- `AWS_BUCKET_SECRET_ACCESS_KEY`
- `AWS_CLOUDFRONT_URL`

**Supabase:**
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

**Recurrente:**
- `NEXT_PUBLIC_RECURRENTE_API_URL`
- `RECURRENTE_PUBLIC_KEY`
- `RECURRENTE_SECRET_KEY`

#### Step 4: Deploy
1. Click "Deploy"
2. Wait for build to complete
3. Vercel will provide a production URL

#### Step 5: Custom Domain (Optional)
1. In Vercel dashboard, go to Settings > Domains
2. Add your custom domain
3. Configure DNS records as instructed by Vercel
4. Update `NEXTAUTH_URL` environment variable

### 6. Post-Deployment Configuration

#### Database Initialization
```bash
# Connect to your production database
# Run migrations if not done yet
yarn prisma migrate deploy

# Create initial admin user
# You can do this via Prisma Studio or SQL:
```

SQL to create admin user:
```sql
INSERT INTO "User" (id, name, email, role, "onboardingCompleted", "emailVerified")
VALUES (
  'admin-id',
  'Admin Name',
  'admin@saberverv2.com',
  'ADMIN',
  true,
  NOW()
);
```

#### Verify Integrations
- [ ] Send test email via the platform
- [ ] Upload a test file to S3
- [ ] Create a test payment (use sandbox if available)
- [ ] Check real-time notifications work
- [ ] Test authentication flow

#### Set Up Monitoring
Consider adding:
- **Sentry:** Error tracking
- **Vercel Analytics:** Performance monitoring
- **Uptime monitoring:** Pingdom, UptimeRobot

---

## 🔒 Security Hardening

### 1. Environment Variables
- Never commit `.env` file to Git
- Rotate secrets regularly
- Use different credentials for development and production

### 2. Database
- Enable SSL for database connections
- Use strong passwords
- Restrict database access to known IP addresses
- Set up automated backups

### 3. AWS S3
- Enable versioning for file recovery
- Set up lifecycle policies to archive old files
- Monitor access logs
- Use separate buckets for different environments

### 4. Authentication
- Generate strong `AUTH_SECRET`
- Set appropriate session expiration times
- Monitor failed login attempts

### 5. API Rate Limiting
Consider implementing rate limiting on API routes to prevent abuse.

---

## 📊 Monitoring & Maintenance

### Vercel Dashboard
- **Deployments:** View deployment history and logs
- **Analytics:** Track page views and performance
- **Logs:** Real-time function logs

### Database Monitoring
- Monitor connection pool usage
- Set up alerts for high query latency
- Regular backup verification

### AWS CloudWatch
- Monitor S3 bucket usage
- Track CloudFront cache hit ratio
- Set up billing alerts

### Regular Tasks
- **Weekly:** Review error logs and fix issues
- **Monthly:** Check payment reconciliation
- **Quarterly:** Security audit and dependency updates
- **Yearly:** Review and optimize infrastructure costs

---

## 🔄 Rollback Procedure

If you need to rollback a deployment:

### In Vercel
1. Go to Deployments tab
2. Find the previous working deployment
3. Click "Promote to Production"

### Database Rollback
```bash
# If you need to revert a migration
yarn prisma migrate resolve --rolled-back migration_name

# Then reapply previous migrations
yarn prisma migrate deploy
```

**Important:** Always backup your database before major migrations!

---

## 📈 Scaling Considerations

### Database Scaling
- **Connection Pooling:** Use Prisma's connection pool settings
- **Read Replicas:** Consider read replicas for heavy read operations
- **Query Optimization:** Use Prisma's query optimization features

### File Storage
- CloudFront handles CDN scaling automatically
- S3 scales automatically with usage
- Consider lifecycle policies to move old files to cheaper storage tiers

### Application Scaling
- Vercel scales automatically with traffic
- Consider Vercel Pro for better performance and more concurrent builds
- Use Edge Functions for better global performance

---

## 🆘 Troubleshooting Production Issues

### Application Not Loading
1. Check Vercel deployment status
2. Review build logs for errors
3. Verify environment variables are set correctly
4. Check DNS configuration

### Database Connection Issues
1. Verify `DATABASE_URL` is correct
2. Check database server is running
3. Verify IP whitelist includes Vercel's IPs
4. Check connection pool settings

### File Upload Failures
1. Verify AWS credentials
2. Check S3 bucket permissions
3. Review CORS configuration
4. Check CloudFront distribution status

### Payment Issues
1. Verify Recurrente API credentials
2. Check webhook endpoint is accessible
3. Review payment logs in Recurrente dashboard
4. Ensure webhook URL is whitelisted

### Email Not Sending
1. Check email server credentials
2. Verify sender email is verified (if using AWS SES)
3. Check spam folder
4. Review email logs in Vercel

---

## 📞 Support Resources

- **Next.js Documentation:** https://nextjs.org/docs
- **Vercel Support:** https://vercel.com/support
- **Prisma Documentation:** https://www.prisma.io/docs
- **AWS Documentation:** https://docs.aws.amazon.com
- **Supabase Documentation:** https://supabase.com/docs

---

## 🎯 Production Checklist

Before launching to users:

- [ ] All environment variables configured
- [ ] Database migrations applied
- [ ] Admin user created
- [ ] Email sending tested
- [ ] File uploads tested
- [ ] Payment flow tested (sandbox)
- [ ] All integrations verified
- [ ] SSL certificate active
- [ ] Monitoring set up
- [ ] Backup strategy implemented
- [ ] Error tracking configured
- [ ] Performance tested under load
- [ ] Security audit completed
- [ ] Documentation reviewed and updated

---

**Good luck with your deployment! 🚀**

