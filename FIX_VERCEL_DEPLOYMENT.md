# Fix Vercel Deployment Error

## Problem
You're getting this error:
```
sh: line 1: cd: backend: No such file or directory
```

This means the `backend` folder is not in your GitHub repository.

## Solution

### Step 1: Check if Backend Folder is in Git

Run this command in your project directory:

```bash
git ls-files backend/
```

If this returns nothing or an error, the backend folder is not tracked by Git.

### Step 2: Add Backend Folder to Git

Make sure the backend folder and its files are committed:

```bash
# Check git status
git status

# Add backend folder (if it shows as untracked)
git add backend/

# Check what will be committed
git status

# Commit the backend folder
git commit -m "Add backend folder for Vercel deployment"

# Push to GitHub
git push origin main
```

### Step 3: Verify Backend is in Repository

After pushing, verify on GitHub:
1. Go to your repository on GitHub
2. Check if you can see the `backend/` folder
3. Make sure it contains:
   - `package.json`
   - `src/` folder with routes and services
   - `tsconfig.json`

### Step 4: Important Files to Commit

Make sure these are NOT in `.gitignore` and ARE committed:
- ✅ `backend/package.json`
- ✅ `backend/src/` (all TypeScript files)
- ✅ `backend/tsconfig.json`
- ✅ `api/index.ts` (at root)
- ✅ `vercel.json` (at root)

These should be ignored (already in .gitignore):
- ❌ `backend/node_modules/`
- ❌ `backend/.env`
- ❌ `backend/dist/`
- ❌ `backend/uploads/`

### Step 5: Updated vercel.json

I've updated `vercel.json` to be more resilient. The install command now handles missing directories gracefully:

```json
"installCommand": "npm install && (cd backend && npm install || true) && cd frontend && npm install"
```

However, **you still need the backend folder in GitHub** because `api/index.ts` imports from `../backend/src/routes/*`.

### Step 6: Redeploy on Vercel

After committing and pushing the backend folder:

1. Go to Vercel Dashboard
2. Your project should auto-redeploy (if connected to GitHub)
3. Or manually trigger a new deployment

## Alternative: If Backend Still Not Found

If the backend folder still causes issues, you have two options:

### Option A: Move Routes to api/ Folder (Recommended for Vercel)

Move the backend routes directly into the `api/` folder structure. This is more aligned with Vercel's serverless function architecture.

### Option B: Use Root Dependencies Only

Ensure all backend dependencies are in the root `package.json` and don't require a separate backend install.

## Quick Fix Commands

```bash
# Navigate to project
cd "F:\projects\Cloudilic – Full‑Stack Developer Assessment"

# Check if backend is tracked
git ls-files backend/ | head -10

# If empty, add it
git add backend/
git commit -m "Add backend folder"
git push origin main

# Then redeploy on Vercel
```

## Still Having Issues?

If you continue to have problems:

1. **Check Vercel build logs** - Look for the exact error message
2. **Verify file structure on GitHub** - Make sure backend folder is visible
3. **Check .gitignore** - Ensure backend folder isn't accidentally ignored
4. **Try manual deployment** - Use `vercel --prod` from CLI to see detailed errors

