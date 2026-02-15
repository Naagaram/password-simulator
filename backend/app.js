const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { analyzePassword } = require('./utils/analyze');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.post('/analyze', async (req, res) => {
  const { password } = req.body;
  
  // Enhanced validation
  if (!password) {
    return res.status(400).json({ 
      error: 'Password required',
      code: 'MISSING_PASSWORD' 
    });
  }
  
  if (typeof password !== 'string') {
    return res.status(400).json({ 
      error: 'Password must be a string',
      code: 'INVALID_TYPE' 
    });
  }
  
  if (password.length > 128) {
    return res.status(400).json({ 
      error: 'Password too long (max 128 characters)',
      code: 'PASSWORD_TOO_LONG' 
    });
  }
  
  try {
    const result = await analyzePassword(password, { detailed: true });
    res.json(result);
  } catch (e) {
    console.error('Analysis error:', e);
    res.status(500).json({ 
      error: 'Analysis failed',
      message: process.env.NODE_ENV === 'development' ? e.message : 'Internal server error',
      code: 'ANALYSIS_ERROR'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Password Analyzer backend running on port ${PORT}`));