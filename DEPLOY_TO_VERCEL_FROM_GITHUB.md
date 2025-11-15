# Deploy to Vercel from GitHub - Step by Step

Since you already have your project on GitHub, follow these steps to deploy via Vercel.

## Step 1: Commit and Push the New Changes

The configuration files have been updated for Vercel deployment. You need to commit and push these changes:

```bash
# Navigate to your project directory
cd "F:\projects\Cloudilic – Full‑Stack Developer Assessment"

# Check what files have changed
git status

# Add the new/updated files
git add vercel.json
git add api/index.ts
git add VERCEL_DEPLOYMENT.md
git add VERCEL_QUICK_START.md
git add DEPLOY_TO_VERCEL_FROM_GITHUB.md

# Or add all changes at once
git add .

# Commit the changes
git commit -m "Configure project for Vercel deployment"

# Push to GitHub
git push origin main
# (or git push origin master if your main branch is called master)
```

## Step 2: Connect Vercel to Your GitHub Repository

1. **Go to Vercel**
   - Visit [vercel.com](https://vercel.com)
   - Sign up or log in (you can use your GitHub account)

2. **Import Your Project**
   - Click **"Add New Project"** or **"Import Project"**
   - You'll see a list of your GitHub repositories
   - Find and select your **"Cloudilic – Full‑Stack Developer Assessment"** repository
   - Click **"Import"**

## Step 3: Configure Project Settings

Vercel will try to auto-detect your project. Configure it as follows:

### Basic Settings:
- **Framework Preset:** Select **"Other"** or **"Other (No Framework)"**
- **Root Directory:** Leave as `./` (root of repository)

### Build Settings:
- **Build Command:** 
  ```
  cd frontend && npm install && npm run build
  ```
- **Output Directory:** 
  ```
  frontend/dist
  ```
- **Install Command:** 
  ```
  npm install && cd backend && npm install && cd ../frontend && npm install
  ```

### Environment Variables:
Click **"Environment Variables"** and add the following:

**Required:**
- `OPENAI_API_KEY` = `your_openai_api_key_here`

**Optional (with defaults):**
- `OPENROUTER_API_KEY` = `your_openrouter_api_key_here` (optional)
- `USE_OPENROUTER_FOR_EMBEDDINGS` = `false`
- `CHAT_MODEL` = `gpt-3.5-turbo`
- `EMBEDDING_MODEL` = `text-embedding-3-small`
- `MAX_TOKENS` = `4096`
- `MAX_CONTEXT_CHUNKS` = `5`
- `MAX_TOTAL_CONTEXT_CHUNKS` = `8`
- `MAX_HISTORY_MESSAGES` = `5`
- `MAX_CHUNK_LENGTH` = `600`

**If using Pinecone:**
- `PINECONE_API_KEY` = `your_pinecone_api_key`
- `PINECONE_ENVIRONMENT` = `your_pinecone_environment`
- `PINECONE_INDEX_NAME` = `your_pinecone_index_name`

> **Important:** Make sure to select **"Production"**, **"Preview"**, and **"Development"** for each environment variable (or at least Production).

## Step 4: Deploy

1. Click **"Deploy"** button
2. Wait for the build to complete (usually 2-5 minutes)
3. Vercel will show you the deployment URL (e.g., `https://your-project.vercel.app`)

## Step 5: Test Your Deployment

Once deployed, test these endpoints:

1. **Frontend:** 
   - Visit: `https://your-project.vercel.app`
   - Should show your React app

2. **API Health Check:**
   - Visit: `https://your-project.vercel.app/api/health`
   - Should return: `{"status":"ok","message":"Cloudilic backend is running"}`

3. **Test API Endpoints:**
   - `/api/pdf/*` - PDF upload and processing
   - `/api/rag/*` - RAG operations  
   - `/api/workflow/*` - Workflow execution

## Step 6: Automatic Deployments (Optional)

Vercel automatically deploys when you push to your main branch:
- **Production:** Deploys from `main` or `master` branch
- **Preview:** Deploys from other branches and pull requests

You can disable this in Project Settings → Git if needed.

## Troubleshooting

### Build Fails
- **Check build logs** in Vercel Dashboard → Deployments → Click on failed deployment
- **Common issues:**
  - Missing dependencies in `package.json`
  - TypeScript errors (run `npm run build` locally first)
  - Environment variables not set

### API Not Working
- **Check serverless function logs:** Vercel Dashboard → Functions tab
- **Verify environment variables** are set correctly
- **Test API endpoint:** `https://your-project.vercel.app/api/health`

### Frontend Can't Connect to API
- **Check browser console** for errors
- **Verify API calls** use relative paths (`/api/...` not `http://localhost:5000/api/...`)
- **Check CORS settings** in `api/index.ts`

### Environment Variables Not Loading
- Make sure variables are set for the correct **environment** (Production/Preview/Development)
- **Redeploy** after adding new environment variables
- Variable names are **case-sensitive**

## Updating Your Deployment

After making code changes:

```bash
git add .
git commit -m "Your commit message"
git push origin main
```

Vercel will automatically detect the push and redeploy (if auto-deploy is enabled).

## Need Help?

- Check the detailed guide: [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
- Vercel Documentation: [vercel.com/docs](https://vercel.com/docs)
- Vercel Support: [vercel.com/support](https://vercel.com/support)

