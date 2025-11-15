import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pdfRouter } from './routes/pdf';
import { ragRouter } from './routes/rag';
import { workflowRouter } from './routes/workflow';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/pdf', pdfRouter);
app.use('/api/rag', ragRouter);
app.use('/api/workflow', workflowRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Cloudilic backend is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

