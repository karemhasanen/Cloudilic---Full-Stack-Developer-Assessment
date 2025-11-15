# Cloudilic – Full‑Stack Developer Assessment

A full-stack web application built with React Flow that allows users to create and connect workflow blocks to process PDFs and interact with an AI assistant using RAG (Retrieve-Augment-Generate) technology.

## 🚀 Features

- **Drag-and-Drop Workflow Builder**: Create workflows by dragging nodes onto a canvas
- **Three Node Types**:
  - **Input Node**: Enter questions or prompts (supports multi-line text)
  - **RAG Node**: Upload PDF documents for retrieval-augmented generation
  - **Output Node**: Display AI responses with formatted output
- **PDF Processing**: Extract and index PDF content for semantic search
- **RAG Implementation**: Semantic search to retrieve relevant document sections
- **AI Integration**: Generate AI responses using OpenAI or OpenRouter (supports multiple models)
- **Workflow Execution**: Run complete workflows with a single button click

### ✨ Bonus Features

- **Short-Term Memory**: Conversation history for follow-up questions
- **Smart Prompt Design**: Enhanced prompts with chain-of-thought reasoning
- **Multi-Step Orchestration**: Support for multiple RAG nodes and complex workflows
- **Context Aggregation**: Combine information from multiple PDF documents

## Tech Stack

### Backend
- Node.js + TypeScript
- Express.js
- OpenAI API / OpenRouter API (supports multiple AI models)
- pdf-parse for PDF extraction
- In-memory vector store with cosine similarity for semantic search

### Frontend
- React + TypeScript
- React Flow for workflow visualization
- Vite for build tooling
- Axios for API calls

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **OpenAI API key** OR **OpenRouter API key** (at least one required)
  - Get OpenAI API key: https://platform.openai.com/api-keys
  - Get OpenRouter API key: https://openrouter.ai/keys

## 🛠️ Setup Instructions

### Step 1: Clone the Repository

```bash
git clone <your-repository-url>
cd cloudilic-workflow-builder
```

### Step 2: Install Dependencies

#### Install Backend Dependencies

```bash
cd backend
npm install
```

#### Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### Step 3: Configure Environment Variables

Create a `.env` file in the `backend` directory:

**Windows:**
```powershell
cd backend
copy env.example .env
```

**Mac/Linux:**
```bash
cd backend
cp env.example .env
```

Then edit `backend/.env` and add your API key(s):

```env
PORT=5000

# API Keys - At least one is required
OPENAI_API_KEY=your_openai_api_key_here
# OPENROUTER_API_KEY=your_openrouter_api_key_here

# Model Configuration
CHAT_MODEL=gpt-3.5-turbo
EMBEDDING_MODEL=text-embedding-3-small

# Token Limits (adjust based on your API provider)
# Note: These are set for maximum output quality - monitor your usage!
MAX_TOKENS=4096
MAX_CONTEXT_CHUNKS=5
MAX_TOTAL_CONTEXT_CHUNKS=8
MAX_HISTORY_MESSAGES=5
MAX_CHUNK_LENGTH=600
```

**Important Notes:**
- You need at least one API key (OpenAI or OpenRouter)
- **Both keys can be set**: If both are provided, OpenAI is tried first with automatic fallback to OpenRouter
- If using OpenAI only: Set `OPENAI_API_KEY`
- If using OpenRouter only: Set `OPENROUTER_API_KEY`
- If using both: Set both keys for automatic fallback when OpenAI quota is exceeded
- Get API keys:
  - OpenAI: https://platform.openai.com/api-keys
  - OpenRouter: https://openrouter.ai/keys
- **Never commit your `.env` file to Git!** It contains sensitive API keys.

### Step 4: Run the Application

#### Start Backend Server

Open a terminal and run:

```bash
cd backend
npm run dev
```

You should see: `🚀 Server running on port 5000`

#### Start Frontend Development Server

Open a **new terminal** and run:

```bash
cd frontend
npm run dev
```

You should see: `Local: http://localhost:3000`

### Step 5: Access the Application

Open your browser and navigate to: **http://localhost:3000**

## 📖 Usage Guide

### Basic Workflow

1. **Add Nodes**: 
   - Click nodes in the left sidebar, OR
   - Drag nodes from the sidebar onto the canvas

2. **Connect Nodes**: 
   - Drag from the **right handle** (output) of one node
   - Connect to the **left handle** (input) of another node
   - Connect in sequence: **Input → RAG → Output**

3. **Configure Input Node**: 
   - Click on the Input node
   - Enter your question or prompt in the text area

4. **Upload PDF**: 
   - Click on the RAG node
   - Click "Upload PDF" button
   - Select a PDF file (max 10MB)
   - Wait for processing confirmation

5. **Run Workflow**: 
   - Click the **"Run Workflow"** button in the top-right corner
   - Wait for processing (you'll see a loading indicator)

6. **View Results**: 
   - The AI response will appear in the Output node
   - You can see the query, context sources, and execution steps

### Advanced Features

- **Follow-up Questions**: Run the workflow again with a new question - the AI remembers previous context
- **Multiple PDFs**: Add multiple RAG nodes to query different documents
- **Multi-Step Workflows**: Connect multiple RAG nodes in sequence for complex processing

## Project Structure

```
cloudilic-workflow-builder/
├── backend/
│   ├── src/
│   │   ├── index.ts              # Express server entry point
│   │   ├── routes/                # API routes
│   │   │   ├── pdf.ts            # PDF upload endpoint
│   │   │   ├── rag.ts            # RAG search and generation
│   │   │   └── workflow.ts       # Workflow execution
│   │   └── services/             # Business logic
│   │       ├── pdfService.ts     # PDF processing
│   │       ├── ragService.ts     # RAG operations
│   │       ├── vectorStore.ts    # Vector storage and search
│   │       ├── workflowService.ts # Workflow orchestration
│   │       └── memoryService.ts  # Conversation memory
│   ├── package.json
│   └── tsconfig.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Sidebar.tsx       # Node palette
│   │   │   ├── RunButton.tsx     # Workflow execution button
│   │   │   └── nodes/            # Custom node components
│   │   │       ├── InputNode.tsx
│   │   │       ├── RAGNode.tsx
│   │   │       └── OutputNode.tsx
│   │   ├── hooks/
│   │   │   └── useWorkflowExecution.ts
│   │   ├── App.tsx               # Main application component
│   │   └── main.tsx              # React entry point
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## API Endpoints

### Backend API

- `GET /api/health` - Health check endpoint
- `POST /api/pdf/upload` - Upload and process PDF file
- `POST /api/rag/search` - Search for relevant document sections
- `POST /api/rag/generate` - Generate AI response with context
- `POST /api/workflow/execute` - Execute complete workflow

## ⚙️ Environment Variables

### Backend Configuration (.env)

#### Required Variables

- `OPENAI_API_KEY` OR `OPENROUTER_API_KEY` - At least one API key is required

#### Optional Variables

**Server Configuration:**
- `PORT` - Server port (default: 5000)

**Model Configuration:**
- `CHAT_MODEL` - Model for chat completions (default: `gpt-3.5-turbo`)
  - OpenAI: `gpt-3.5-turbo`, `gpt-4-turbo-preview`, `gpt-4`
  - OpenRouter: `openai/gpt-4-turbo`, `anthropic/claude-3-opus`, etc.
- `EMBEDDING_MODEL` - Model for embeddings (default: `text-embedding-3-small`)
  - OpenAI: `text-embedding-3-small`, `text-embedding-3-large`, `text-embedding-ada-002`
  - OpenRouter: `openai/text-embedding-ada-002` (with provider prefix)

**Token Limits:**
- `MAX_TOKENS` - Maximum output tokens (default: 4096 for OpenAI, 3000 for OpenRouter)
- `MAX_CONTEXT_CHUNKS` - Context chunks per document search (default: 5)
- `MAX_TOTAL_CONTEXT_CHUNKS` - Total chunks across all documents (default: 8)
- `MAX_HISTORY_MESSAGES` - Conversation history messages (default: 5)
- `MAX_CHUNK_LENGTH` - Characters per context chunk (default: 600)

**Advanced:**
- `USE_OPENROUTER_FOR_EMBEDDINGS` - Force OpenRouter for embeddings (default: `false`)

See `backend/env.example` for a complete example.

## 📤 GitHub Setup

### Initializing Git Repository

If you haven't already initialized Git:

```bash
# Initialize Git repository
git init

# Add all files (respects .gitignore)
git add .

# Make your first commit
git commit -m "Initial commit: Cloudilic Workflow Builder"

# Add your GitHub remote (replace with your repository URL)
git remote add origin https://github.com/yourusername/your-repo-name.git

# Push to GitHub
git branch -M main
git push -u origin main
```

### What's Ignored by Git

The `.gitignore` file is configured to ignore:
- ✅ `node_modules/` - Dependencies
- ✅ `.env` files - API keys (never commit these!)
- ✅ `dist/` and `build/` - Build outputs
- ✅ `uploads/` - User-uploaded PDFs
- ✅ Log files and temporary files
- ✅ IDE configuration files

**All source code and documentation files are included.**

### Important Security Note

⚠️ **Never commit your `.env` file!** It contains your API keys. The `.gitignore` is configured to prevent this, but always double-check before committing.

## 🚀 Deployment

### Build for Production

#### Backend

```bash
cd backend
npm run build
npm start
```

The compiled files will be in `backend/dist/`

#### Frontend

```bash
cd frontend
npm run build
```

The built files will be in `frontend/dist/`

### Deploy to Vercel

#### Frontend Deployment

1. Install Vercel CLI: `npm i -g vercel`
2. Deploy:
   ```bash
   cd frontend
   vercel
   ```
3. Configure environment variables in Vercel dashboard

#### Backend Deployment

For Node.js backends, consider:
- **Railway**: https://railway.app
- **Render**: https://render.com
- **Heroku**: https://heroku.com
- **Fly.io**: https://fly.io

Make sure to set all environment variables in your hosting platform.

### Quick Deploy Commands

```bash
# Build both
npm run build:all

# Or individually
npm run build:backend
npm run build:frontend
```

## 🔧 Development

### Project Scripts

**Root Level:**
```bash
npm run install:all      # Install all dependencies
npm run dev:backend      # Start backend dev server
npm run dev:frontend     # Start frontend dev server
npm run build:all        # Build both backend and frontend
```

**Backend:**
```bash
npm run dev              # Start development server with hot reload
npm run build            # Build TypeScript to JavaScript
npm run start            # Start production server
npm run type-check       # Type check without building
```

**Frontend:**
```bash
npm run dev              # Start Vite dev server
npm run build            # Build for production
npm run preview          # Preview production build
```

### Development Notes

- **Vector Store**: In-memory implementation with cosine similarity search
- **PDF Processing**: Chunks text with overlap for better context retrieval
- **Workflow Execution**: Uses topological sorting to determine execution order
- **Memory**: Conversation history stored in-memory (30-minute timeout)
- **Multi-Document**: Supports multiple RAG nodes for querying different PDFs

## 📚 Additional Information

All setup and configuration details are included in this README. For more information:
- Setup instructions: See "🛠️ Setup Instructions" section above
- Troubleshooting: See "🐛 Troubleshooting" section below
- Model configuration: See "⚙️ Environment Variables" section above

## 🐛 Troubleshooting

### Common Issues

1. **Port Already in Use**: Change `PORT` in `backend/.env`
2. **API Key Errors**: Verify your API key is correct and has credits/billing set up
3. **PDF Upload Fails**: Check file size (max 10MB) and ensure PDF has extractable text
4. **Token Limit Errors**: Reduce `MAX_TOKENS` or context chunk settings

See the "🐛 Troubleshooting" section above for detailed solutions.

## 🎯 Features Implemented

✅ Drag-and-drop workflow builder  
✅ PDF upload and processing  
✅ Semantic search with embeddings  
✅ RAG (Retrieve-Augment-Generate)  
✅ Multi-document support  
✅ Conversation memory  
✅ Smart prompt engineering  
✅ Multi-step workflow orchestration  
✅ OpenAI and OpenRouter support  
✅ Beautiful, modern UI  

## 📝 License

ISC

## 👤 Author

Built for Cloudilic Full-Stack Developer Assessment

---

**Live Demo**: [Add your deployed URL here]  
**Repository**: [Add your GitHub URL here]

#   C l o u d i l i c - F u l l - S t a c k - D e v e l o p e r - A s s e s s m e n t  
 