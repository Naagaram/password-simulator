const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { analyzePassword } = require('./utils/analyze');

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post('/analyze', async (req, res) => {
  const { password } = req.body;
  if (!password) return res.status(400).json({ error: 'Password required' });
  try {
    const result = await analyzePassword(password, { detailed: true });
    res.json(result);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Password Analyzer backend running on port ${PORT}`));
