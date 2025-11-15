# Fix 404 Error for API Routes

## Problem
Getting `{"code":"404","message":"The page could not be found"}` when trying to upload PDFs.

## Root Cause
The API routes in `api/index.ts` were mounted incorrectly. In Vercel, when you have `api/index.ts`, it handles requests to `/api/*`, and the Express app receives the **full path including `/api`**.

## Fix Applied

Updated `api/index.ts` to mount routes with `/api` prefix:
- `/api/pdf` → handles `/api/pdf/upload`, etc.
- `/api/rag` → handles `/api/rag/search`, etc.
- `/api/workflow` → handles `/api/workflow/execute`, etc.

## What Changed

**Before:**
```typescript
app.use('/pdf', pdfRouter);  // Would look for /pdf/upload
```

**After:**
```typescript
app.use('/api/pdf', pdfRouter);  // Correctly handles /api/pdf/upload
```

## Next Steps

1. **Commit and push:**
   ```bash
   git add api/index.ts
   git commit -m "Fix API route mounting for Vercel"
   git push origin main
   ```

2. **Wait for Vercel to redeploy** (or manually trigger)

3. **Test the endpoints:**
   - Health: `https://your-project.vercel.app/api/health`
   - PDF Upload: Should work now at `/api/pdf/upload`

## How Vercel Routing Works

- Files in `api/` folder become serverless functions
- `api/index.ts` handles all `/api/*` requests
- Express app receives the **full path** (including `/api`)
- So routes must be mounted with `/api` prefix

## Testing

After deployment, test:
1. Visit `/api/health` - Should return `{"status":"ok",...}`
2. Visit `/api` - Should return `{"status":"ok","message":"API is running"}`
3. Upload PDF - Should work without 404 error

## If Still Getting 404

1. Check Vercel function logs: Dashboard → Functions → View Logs
2. Verify the file `api/index.ts` exists in your GitHub repo
3. Check that the backend folder is committed (needed for imports)
4. Verify environment variables are set

