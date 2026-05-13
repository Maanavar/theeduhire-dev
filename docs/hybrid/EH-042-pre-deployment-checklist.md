# Pre-Deployment Checklist (EH-042)

**Date:** May 10, 2026  
**Status:** Required before rollout  
**Importance:** CRITICAL - Deployment will fail without these manual steps

---

## Overview

This document outlines the manual steps required before deploying the latest changes to production. These steps are necessary because `prisma/migrations/` is ignored in the repository, requiring manual database schema updates and external resource setup.

---

## 1. Manual Database Schema Updates

### Why This is Needed
The `prisma/migrations/` directory is git-ignored to prevent merge conflicts in a multi-environment setup. Database schema changes must be applied manually using SQL.

### Required Column Additions

#### 1.1 Add `verification_status` Column to `school_profiles` Table

**Purpose:** Track school verification workflow state (PENDING, VERIFIED, REJECTED, UNDER_REVIEW)

```sql
ALTER TABLE school_profiles
ADD COLUMN verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
ADD COLUMN verification_notes TEXT,
ADD COLUMN verified_by_admin_id UUID REFERENCES users(id),
ADD COLUMN verification_timestamp TIMESTAMP WITH TIME ZONE;

-- Create index for faster status queries
CREATE INDEX idx_school_profiles_verification_status 
  ON school_profiles(verification_status);
```

**Verification:** Run this query to confirm
```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'school_profiles' 
  AND column_name IN ('verification_status', 'verification_notes', 'verified_by_admin_id', 'verification_timestamp');
```

Expected output: 4 rows with the new columns

#### 1.2 Add `logo_url` Column to `school_profiles` Table

**Purpose:** Store reference to school logos stored in Supabase bucket

```sql
ALTER TABLE school_profiles
ADD COLUMN logo_url VARCHAR(1024);

-- Create index for queries filtering by logo presence
CREATE INDEX idx_school_profiles_logo_url 
  ON school_profiles(logo_url) 
  WHERE logo_url IS NOT NULL;
```

**Verification:** Run this query to confirm
```sql
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'school_profiles' 
  AND column_name = 'logo_url';
```

Expected output: 1 row with VARCHAR(1024)

#### 1.3 Add `school_id` Foreign Key to `users` Table (if not exists)

**Purpose:** Link users to their school for better data organization

```sql
-- Check if column exists first
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'school_id'
  ) THEN
    ALTER TABLE users
    ADD COLUMN school_id UUID REFERENCES school_profiles(id) ON DELETE SET NULL;
    
    CREATE INDEX idx_users_school_id ON users(school_id);
  END IF;
END $$;
```

### Summary of Manual SQL Steps

1. **Connect to your Supabase database** (or your PostgreSQL database)
2. **Open the SQL editor** in Supabase Dashboard or use `psql` CLI
3. **Run the three SQL blocks above** in order, waiting for each to complete
4. **Verify each change** using the verification queries provided
5. **Take a backup** of your database after successful application

---

## 2. Supabase Bucket Setup

### Why This is Needed
School logos and other static assets need a dedicated storage location.

### 2.1 Create the `school-logos` Bucket

**Steps:**

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Navigate to **Storage** in the sidebar
4. Click **Create a new bucket**
5. Enter bucket name: `school-logos`
6. **Access Control:** Keep as **Private** initially
7. Click **Create bucket**

### 2.2 Configure Bucket Policies

**Allow public read access (optional):**

If you want school logos to be publicly viewable, add this policy:

1. Click the three-dot menu on the `school-logos` bucket
2. Select **Policies**
3. Click **Add policy**
4. Create a policy allowing `SELECT` for authenticated users:

```sql
-- Allow authenticated users to read school logos
CREATE POLICY "Allow read access for authenticated users"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'school-logos' AND
  auth.role() = 'authenticated'
);
```

**Allow uploads by school admins:**

```sql
-- Allow school admins to upload logos
CREATE POLICY "Allow school admins to upload logos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'school-logos' AND
  auth.role() = 'authenticated'
);
```

### 2.3 Verify Bucket Creation

Run this query in the SQL editor:

```sql
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE name = 'school-logos';
```

Expected output: 1 row with bucket details

---

## 3. Environment Variables Verification

Ensure these environment variables are set in your deployment environment:

```
# .env.production or equivalent
DATABASE_URL=postgresql://...  # Your Supabase database URL
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

---

## 4. Pre-Deployment Verification Checklist

Before deploying, verify all manual steps are complete:

- [ ] Database connection successful
- [ ] `verification_status` column added to `school_profiles`
- [ ] `verification_notes`, `verified_by_admin_id`, `verification_timestamp` columns added
- [ ] Index created on `verification_status`
- [ ] `logo_url` column added to `school_profiles`
- [ ] Index created on `logo_url`
- [ ] `school_id` foreign key added to `users` table (if needed)
- [ ] `school-logos` bucket created in Supabase Storage
- [ ] Bucket policies configured appropriately
- [ ] Environment variables verified in production environment
- [ ] Database backup taken
- [ ] Team notified of deployment window

---

## 5. Rollback Plan

If deployment fails or issues occur:

1. **Stop the deployment** immediately
2. **Restore the database backup** from pre-deployment
3. **Delete the `school-logos` bucket** if it caused issues
4. **Verify all systems are operational** before attempting re-deployment

### Rollback SQL (if needed to remove new columns)

```sql
-- Only run if rolling back entirely
ALTER TABLE school_profiles
DROP COLUMN IF EXISTS verification_status,
DROP COLUMN IF EXISTS verification_notes,
DROP COLUMN IF EXISTS verified_by_admin_id,
DROP COLUMN IF EXISTS verification_timestamp,
DROP COLUMN IF EXISTS logo_url;

ALTER TABLE users
DROP COLUMN IF EXISTS school_id;
```

---

## 6. Post-Deployment Verification

After deployment:

1. **Test school admin login** with verification workflows
2. **Verify logo upload functionality** in school admin panel
3. **Check database logs** for any errors
4. **Monitor application logs** for the first hour
5. **Test school profile viewing** with new columns

---

## Support & Troubleshooting

### Common Issues

**Issue:** `Column already exists` error
- **Solution:** The column may already be present. Use the verification queries above to check.

**Issue:** Foreign key constraint violation
- **Solution:** Ensure `school_profiles` table exists before adding foreign keys to `users`.

**Issue:** Bucket creation fails
- **Solution:** Ensure your Supabase project has storage enabled. Contact Supabase support if needed.

**Issue:** Permission denied on database
- **Solution:** Verify you're using the correct database credentials with admin/owner privileges.

---

## Questions or Issues?

Contact the platform team before proceeding with production deployment.

---

**Document Version:** 1.0  
**Last Updated:** May 10, 2026  
**Next Review:** After first successful production rollout
