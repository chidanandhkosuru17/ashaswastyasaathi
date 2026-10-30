import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

app.use(express.json());

// Health check endpoint for Cloud Run container readiness
app.get('/healthz', (req, res) => {
  res.status(200).send('OK');
});

// Serve static assets from dist
const distPath = path.join(__dirname, 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));

  // SPA fallback to index.html for client-side routing
  app.get('*', (req, res) => {
    res.sendFile(path.join(distPath, 'index.html'));
  });
} else {
  app.get('*', (req, res) => {
    res.status(503).send('Application build in progress. Please refresh.');
  });
}

app.listen(PORT, HOST, () => {
  console.log(`Production server running on http://${HOST}:${PORT}`);
});
