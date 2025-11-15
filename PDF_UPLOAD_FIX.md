# PDF Upload Error Fix

## Problem
When uploading a PDF on Vercel, you were getting:
```
Error: [object Object]
```

## Root Causes

1. **File Upload Directory**: Vercel serverless functions can only write to `/tmp` directory, not to custom `uploads/` folders
2. **Error Handling**: Error objects were being converted to strings incorrectly, showing "[object Object]"

## Fixes Applied

### 1. Backend - PDF Route (`backend/src/routes/pdf.ts`)
- ✅ Updated multer to use `/tmp` directory on Vercel (automatically detected)
- ✅ Added proper multer error handling middleware
- ✅ Improved error message handling to always return strings
- ✅ Better file cleanup with error handling

### 2. Frontend - RAG Node (`frontend/src/components/nodes/RAGNode.tsx`)
- ✅ Improved error handling to properly extract error messages
- ✅ Prevents "[object Object]" from appearing
- ✅ Better error message display

## What You Need to Do

### Step 1: Commit and Push Changes

```bash
git add backend/src/routes/pdf.ts
git add frontend/src/components/nodes/RAGNode.tsx
git commit -m "Fix PDF upload for Vercel serverless functions"
git push origin main
```

### Step 2: Redeploy on Vercel

Vercel should automatically redeploy when you push, or you can manually trigger a deployment.

### Step 3: Test PDF Upload

1. Go to your deployed site
2. Add a RAG node
3. Upload a PDF file
4. You should now see proper error messages (if any) or success message

## Technical Details

### Vercel Detection
The code automatically detects if it's running on Vercel:
```typescript
const isVercel = process.env.VERCEL === '1' || process.env.VERCEL_ENV;
const uploadDest = isVercel ? '/tmp' : path.join(process.cwd(), 'uploads');
```

### Error Handling
- Multer errors are caught by middleware before reaching the route handler
- All error messages are converted to strings
- Frontend properly extracts error messages from response

## File Size Limits

- **Vercel Serverless Functions**: 4.5MB limit (Hobby plan)
- **Current Code**: 10MB limit (will fail on Vercel if file > 4.5MB)

If you need larger files, consider:
- Using Vercel Blob Storage
- Upgrading to Vercel Pro plan (50MB limit)
- Using external storage (S3, etc.)

## Testing

After deployment, test with:
1. Small PDF (< 1MB) - Should work
2. Medium PDF (1-4MB) - Should work
3. Large PDF (> 4.5MB) - Will fail with clear error message
4. Non-PDF file - Should show "Only PDF files are allowed"

## Still Having Issues?

1. Check Vercel function logs: Dashboard → Your Project → Functions → View Logs
2. Check browser console for detailed error messages
3. Verify environment variables are set correctly
4. Check that backend folder is in your GitHub repository

