# Vercel Deployment Guide

This guide will walk you through deploying your Cloudilic Full-Stack project to Vercel.

## Prerequisites

1. A [Vercel account](https://vercel.com/signup) (free tier works)
2. Git repository (GitHub, GitLab, or Bitbucket)
3. Your project pushed to the repository

## Step-by-Step Deployment

### Step 1: Prepare Your Repository

1. **Push your code to GitHub/GitLab/Bitbucket**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

### Step 2: Install Vercel CLI (Optional but Recommended)

```bash
npm install -g vercel
```

### Step 3: Configure Environment Variables

You need to set the following environment variables in Vercel:

1. **Go to Vercel Dashboard** → Your Project → Settings → Environment Variables

2. **Add these variables:**
   - `OPENAI_API_KEY` - Your OpenAI API key
   - `OPENROUTER_API_KEY` - Your OpenRouter API key (optional)
   - `USE_OPENROUTER_FOR_EMBEDDINGS` - Set to `false` (or `true` if needed)
   - `CHAT_MODEL` - e.g., `gpt-3.5-turbo`
   - `EMBEDDING_MODEL` - e.g., `text-embedding-3-small`
   - `MAX_TOKENS` - e.g., `4096`
   - `MAX_CONTEXT_CHUNKS` - e.g., `5`
   - `MAX_TOTAL_CONTEXT_CHUNKS` - e.g., `8`
   - `MAX_HISTORY_MESSAGES` - e.g., `5`
   - `MAX_CHUNK_LENGTH` - e.g., `600`
   - `PINECONE_API_KEY` - Your Pinecone API key (if using Pinecone)
   - `PINECONE_ENVIRONMENT` - Your Pinecone environment (if using Pinecone)
   - `PINECONE_INDEX_NAME` - Your Pinecone index name (if using Pinecone)

### Step 4: Deploy via Vercel Dashboard

1. **Go to [vercel.com](https://vercel.com)**
2. **Click "Add New Project"**
3. **Import your Git repository**
4. **Configure the project:**
   - **Framework Preset:** Other
   - **Root Directory:** `./` (root of your project)
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Output Directory:** `frontend/dist`
   - **Install Command:** `npm install && cd backend && npm install && cd ../frontend && npm install`

5. **Click "Deploy"**

### Step 5: Deploy via CLI (Alternative Method)

If you prefer using the CLI:

```bash
# Login to Vercel
vercel login

# Navigate to your project root
cd "F:\projects\Cloudilic – Full‑Stack Developer Assessment"

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? (Select your account)
# - Link to existing project? No (first time) or Yes (if redeploying)
# - Project name? (Enter a name or press Enter for default)
# - Directory? ./
# - Override settings? No

# For production deployment:
vercel --prod
```

### Step 6: Verify Deployment

1. **Check the deployment URL** provided by Vercel
2. **Test the API endpoints:**
   - `https://your-project.vercel.app/api/health` - Should return `{ status: 'ok', ... }`
3. **Test the frontend** - Should load your React app

## Project Structure for Vercel

Your project is configured as:
- **Frontend:** React + Vite app in `frontend/` directory
- **Backend:** Express API in `api/` directory (Vercel serverless functions)
- **Build Output:** Frontend builds to `frontend/dist/`

## Important Notes

### File Uploads
- Vercel serverless functions have a **10-second timeout** for Hobby plan
- File uploads are limited to **4.5MB** for serverless functions
- For larger files, consider using Vercel Blob Storage or external storage

### Environment Variables
- Make sure all environment variables are set in Vercel Dashboard
- Variables are available in both frontend and backend
- Use `process.env.VARIABLE_NAME` to access them

### API Routes
- All API routes are accessible at `/api/*`
- The frontend uses relative paths (`/api/...`) which work automatically
- Backend routes are:
  - `/api/pdf/*` - PDF upload and processing
  - `/api/rag/*` - RAG operations
  - `/api/workflow/*` - Workflow execution
  - `/api/health` - Health check

### Build Process
1. Vercel installs dependencies in root, backend, and frontend
2. Frontend is built using `npm run build` in the frontend directory
3. Backend TypeScript is compiled to JavaScript
4. API routes are deployed as serverless functions

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json` files
- Ensure TypeScript compiles without errors
- Check build logs in Vercel Dashboard

### API Routes Not Working
- Verify `api/index.ts` exports the Express app correctly
- Check that environment variables are set
- Review serverless function logs in Vercel Dashboard

### Frontend Can't Connect to API
- Ensure API routes are prefixed with `/api`
- Check CORS settings in `api/index.ts`
- Verify the `vercel.json` rewrites configuration

### Environment Variables Not Loading
- Make sure variables are set for the correct environment (Production, Preview, Development)
- Restart the deployment after adding new variables
- Check variable names match exactly (case-sensitive)

## Updating Your Deployment

After making changes:

```bash
# Via CLI
vercel --prod

# Or push to your main branch (if connected to Git)
git push origin main
```

Vercel will automatically redeploy on every push to your main branch (if auto-deploy is enabled).

## Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Vercel will automatically provision SSL certificates

## Support

For more help:
- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Discord](https://vercel.com/discord)
- Check deployment logs in Vercel Dashboard

