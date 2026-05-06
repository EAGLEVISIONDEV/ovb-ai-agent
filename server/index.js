require('dotenv').config();
const express = require('express');
const cors = require('cors');
const compression = require('compression');
const path = require('path');
const fs = require('fs');
const aiRoutes = require('./routes/ai');

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ────────────────────────────────────────
app.use(compression({
  filter: (req, res) => {
    if (req.path.includes('/stream')) return false;
    return compression.filter(req, res);
  },
}));

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));

app.use(express.json({ limit: '2mb' }));

// ─── API Routes ───────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({ status: 'OK', ai: !!process.env.ANTHROPIC_API_KEY, ts: new Date().toISOString() });
});

app.use('/api/ai', aiRoutes);

// ─── Serve Next.js build in production ────────────────
const nextDir = path.join(__dirname, '../client/.next');
const outDir = path.join(__dirname, '../client/out');
if (process.env.NODE_ENV === 'production' && fs.existsSync(outDir)) {
  app.use(express.static(outDir));
  app.get('*', (req, res) => res.sendFile(path.join(outDir, 'index.html')));
}

// ─── Error handler ────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('❌', err.message);
  res.status(500).json({ error: err.message });
});

// ─── Start ────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 OVB AI Agent server running on http://localhost:${PORT}`);
  console.log(`🧠 Claude AI: ${process.env.ANTHROPIC_API_KEY ? '✅ Connected' : '❌ Missing ANTHROPIC_API_KEY'}`);
  console.log('');
});
