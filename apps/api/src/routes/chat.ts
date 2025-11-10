import express from 'express';
import type { Request, Response } from 'express';
import axios from 'axios';

const router = express.Router();

const VANNA_API_BASE_URL = process.env.VANNA_API_BASE_URL || 'http://localhost:8000';

// POST /api/chat-with-data - Send natural language query to Vanna AI
router.post('/', async (req: Request, res: Response) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }

    // Forward request to Vanna AI service
    const response = await axios.post(
      `${VANNA_API_BASE_URL}/api/query`,
      { question },
      {
        timeout: 30000, 
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    res.json(response.data);
  } catch (error: any) {
    console.error('Error querying Vanna AI:', error.message);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNREFUSED') {
        return res.status(503).json({
          error: 'Vanna AI service is not available',
          details: 'Please ensure the Vanna AI service is running',
        });
      }
      
      if (error.response) {
        return res.status(error.response.status).json({
          error: error.response.data.error || 'Error from Vanna AI service',
          details: error.response.data.details,
        });
      }
    }

    res.status(500).json({
      error: 'Failed to process query',
      details: error.message,
    });
  }
});

// GET /api/chat-with-data/health - Check Vanna AI service health
router.get('/health', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(`${VANNA_API_BASE_URL}/health`, {
      timeout: 5000,
    });

    res.json({
      status: 'connected',
      vannaService: response.data,
    });
  } catch (error) {
    res.status(503).json({
      status: 'disconnected',
      error: 'Vanna AI service is not available',
    });
  }
});

export default router;
