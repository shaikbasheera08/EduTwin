import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { readDB } from './config/db.js';
import { handleAuthRoutes } from './routes/auth.js';
import { handleStudentRoutes } from './routes/students.js';
import { handleAiRoutes } from './routes/ai.js';
import { handleProgressRoutes } from './routes/progress.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.join(__dirname, '../../public');
const PORT = process.env.PORT || 5000;

// Initialize database with seed on startup
readDB();

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

const server = http.createServer(async (req, res) => {
  // Global CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;

  // Read request body for POST/PUT
  let body = {};
  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    try {
      const buffers = [];
      for await (const chunk of req) {
        buffers.push(chunk);
      }
      const rawBody = Buffer.concat(buffers).toString('utf-8');
      if (rawBody.trim()) {
        body = JSON.parse(rawBody);
      }
    } catch (e) {
      console.warn('Could not parse request JSON body:', e.message);
    }
  }

  // Health endpoint
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'healthy',
      app: 'EduTwin — AI-Powered Digital Student Twin',
      version: '1.0.0',
      timestamp: new Date().toISOString()
    }));
    return;
  }

  // API Route Dispatchers
  if (pathname.startsWith('/api/auth')) {
    const handled = handleAuthRoutes(req, res, parsedUrl, body);
    if (handled !== false) return;
  }

  if (pathname.startsWith('/api/students')) {
    const handled = handleStudentRoutes(req, res, parsedUrl, body);
    if (handled !== false) return;
  }

  if (pathname.startsWith('/api/ai')) {
    const handled = handleAiRoutes(req, res, parsedUrl, body);
    if (handled !== false) return;
  }

  if (pathname.startsWith('/api/progress') || pathname.startsWith('/api/learning-plan') || pathname.startsWith('/api/demo')) {
    const handled = handleProgressRoutes(req, res, parsedUrl, body);
    if (handled !== false) return;
  }

  // If path starts with /api but wasn't handled
  if (pathname.startsWith('/api')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: `Endpoint ${req.method} ${pathname} not found.` }));
    return;
  }

  // Static File Serving
  let filePath = path.join(PUBLIC_DIR, pathname === '/' ? 'index.html' : pathname);
  
  // SPA Fallback: If no file extension and file doesn't exist, serve index.html
  if (!path.extname(filePath) && !fs.existsSync(filePath)) {
    filePath = path.join(PUBLIC_DIR, 'index.html');
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback to index.html for client-side routing
      const fallbackPath = path.join(PUBLIC_DIR, 'index.html');
      fs.readFile(fallbackPath, (fallbackErr, content) => {
        if (fallbackErr) {
          res.writeHead(404, { 'Content-Type': 'text/plain' });
          res.end('404 Not Found');
        } else {
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(content);
        }
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      } else {
        res.writeHead(200, { 'Content-Type': contentType });
        res.end(content);
      }
    });
  });
});

server.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`🚀 EduTwin Full-Stack Server Running Successfully!`);
  console.log(`🌐 Application URL: http://localhost:${PORT}`);
  console.log(`📡 API Base:        http://localhost:${PORT}/api`);
  console.log(`⚡ Zero-dependency native Node runtime active`);
  console.log(`========================================================`);
});
