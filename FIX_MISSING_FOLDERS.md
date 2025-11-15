# Fix Missing Folders in GitHub

## Problem
Build is failing because `frontend` folder is not in your GitHub repository.

Error:
```
sh: line 1: cd: frontend: No such file or directory
```

## Root Cause
Both `backend/` and `frontend/` folders need to be committed to GitHub for Vercel to build and deploy your project.

## Solution

### Step 1: Check What's Missing

Run these commands to see what's not tracked:

```bash
# Check if backend is tracked
git ls-files backend/ | head -5

# Check if frontend is tracked  
git ls-files frontend/ | head -5
```

If these return nothing, the folders aren't in your repository.

### Step 2: Add Missing Folders

```bash
# Navigate to your project
cd "F:\projects\Cloudilic – Full‑Stack Developer Assessment"

# Check git status
git status

# Add backend folder (if missing)
git add backend/

# Add frontend folder (if missing)
git add frontend/

# Check what will be committed
git status

# Commit the folders
git commit -m "Add backend and frontend folders for Vercel deployment"

# Push to GitHub
git push origin main
```

### Step 3: Verify on GitHub

1. Go to your GitHub repository
2. Check that you can see:
   - ✅ `backend/` folder with `package.json`, `src/`, etc.
   - ✅ `frontend/` folder with `package.json`, `src/`, `vite.config.ts`, etc.
   - ✅ `api/` folder with `index.ts`

### Step 4: Important Files to Commit

Make sure these are committed (NOT in .gitignore):

**Backend:**
- ✅ `backend/package.json`
- ✅ `backend/src/` (all TypeScript files)
- ✅ `backend/tsconfig.json`

**Frontend:**
- ✅ `frontend/package.json`
- ✅ `frontend/src/` (all TypeScript/React files)
- ✅ `frontend/vite.config.ts`
- ✅ `frontend/index.html`
- ✅ `frontend/tsconfig.json`

**Root:**
- ✅ `api/index.ts`
- ✅ `vercel.json`
- ✅ `package.json`

**Should be ignored (already in .gitignore):**
- ❌ `node_modules/`
- ❌ `backend/node_modules/`
- ❌ `frontend/node_modules/`
- ❌ `.env` files
- ❌ `dist/` folders

### Step 5: Redeploy on Vercel

After pushing:
1. Vercel will automatically detect the push and redeploy
2. Or manually trigger a new deployment

## Updated vercel.json

I've updated `vercel.json` to handle missing directories gracefully, but you still need the folders in GitHub for the build to work.

## Quick Check Commands

```bash
# See what's tracked
git ls-files | grep -E "(backend|frontend)" | head -10

# See what's not tracked but exists locally
git status --ignored

# Add everything (be careful - check .gitignore first)
git add backend/ frontend/
git status  # Review before committing
```

## After Committing

Once both folders are in GitHub:
1. Vercel build should succeed
2. Frontend will build to `frontend/dist`
3. API routes will work from `api/index.ts`

