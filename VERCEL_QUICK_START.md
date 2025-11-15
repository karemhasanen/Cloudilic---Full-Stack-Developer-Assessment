# Vercel Deployment - Quick Start

## 🚀 Fast Deployment Steps

### 1. Push to Git
```bash
git add .
git commit -m "Ready for Vercel"
git push
```

### 2. Deploy via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com)
2. Click **"Add New Project"**
3. Import your Git repository
4. Configure:
   - **Framework Preset:** Other
   - **Root Directory:** `./`
   - **Build Command:** `cd frontend && npm install && npm run build`
   - **Output Directory:** `frontend/dist`
   - **Install Command:** `npm install && cd backend && npm install && cd ../frontend && npm install`
5. Click **"Deploy"**

### 3. Set Environment Variables
In Vercel Dashboard → Settings → Environment Variables, add:

**Required:**
- `OPENAI_API_KEY` - Your OpenAI API key

**Optional (with defaults):**
- `OPENROUTER_API_KEY` - OpenRouter API key
- `CHAT_MODEL` - Default: `gpt-3.5-turbo`
- `EMBEDDING_MODEL` - Default: `text-embedding-3-small`
- `MAX_TOKENS` - Default: `4096`
- `MAX_CONTEXT_CHUNKS` - Default: `5`
- `MAX_TOTAL_CONTEXT_CHUNKS` - Default: `8`
- `MAX_HISTORY_MESSAGES` - Default: `5`
- `MAX_CHUNK_LENGTH` - Default: `600`

**If using Pinecone:**
- `PINECONE_API_KEY`
- `PINECONE_ENVIRONMENT`
- `PINECONE_INDEX_NAME`

### 4. Test Your Deployment
- Frontend: `https://your-project.vercel.app`
- API Health: `https://your-project.vercel.app/api/health`

## 📝 CLI Deployment (Alternative)

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Deploy
vercel

# Deploy to production
vercel --prod
```

## ⚠️ Important Notes

- **File Upload Limit:** 4.5MB for serverless functions
- **Timeout:** 10 seconds (Hobby plan)
- **API Routes:** All accessible at `/api/*`
- **Frontend:** Serves from `frontend/dist`

## 🔧 Troubleshooting

**Build fails?**
- Check all `package.json` files have correct dependencies
- Verify TypeScript compiles: `cd backend && npm run build`

**API not working?**
- Verify environment variables are set
- Check serverless function logs in Vercel Dashboard

**Frontend can't reach API?**
- Ensure API calls use relative paths: `/api/...`
- Check CORS settings in `api/index.ts`

For detailed instructions, see [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

