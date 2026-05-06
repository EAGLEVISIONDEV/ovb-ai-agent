const express = require('express');
const router = express.Router();
const claude = require('../services/claude');
const { v4: uuidv4 } = require('uuid');

// In-memory session store (replace with Redis/DB in production)
const sessions = new Map();
const MAX_MESSAGES_PER_SESSION = 40;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_SESSIONS = 500;

/* ─── POST /api/ai/session — Create a new chat session ─── */
router.post('/session', (req, res) => {
  const { calculatorType, campaignSlug, referrer } = req.body || {};
  const sessionId = uuidv4();
  sessions.set(sessionId, {
    id: sessionId,
    messages: [],
    context: { calculatorType, campaignSlug, referrer },
    createdAt: new Date(),
    leadExtracted: false,
  });
  // Clean old sessions (>2h) and enforce max
  for (const [id, s] of sessions) {
    if (Date.now() - s.createdAt.getTime() > 2 * 60 * 60 * 1000) sessions.delete(id);
  }
  if (sessions.size > MAX_SESSIONS) {
    // Delete oldest
    const oldest = [...sessions.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt)[0];
    if (oldest) sessions.delete(oldest[0]);
  }
  res.json({ sessionId });
});

/* ─── POST /api/ai/chat — Send a message, get response ─── */
router.post('/chat', async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message required' });
    if (message.length > MAX_MESSAGE_LENGTH) return res.status(400).json({ error: 'Message too long' });

    let session = sessions.get(sessionId);
    if (!session) {
      // Auto-create session if not exists
      const id = sessionId || uuidv4();
      session = { id, messages: [], context: req.body.context || {}, createdAt: new Date(), leadExtracted: false };
      sessions.set(id, session);
    }

    // Add user message
    if (session.messages.length >= MAX_MESSAGES_PER_SESSION) {
      return res.status(429).json({ error: 'Conversația a atins limita maximă. Te rugăm să începi o sesiune nouă.' });
    }
    session.messages.push({ role: 'user', content: message.trim() });

    // Get AI response
    const response = await claude.chat(session.messages, session.context);

    // Add AI response
    session.messages.push({ role: 'assistant', content: response });

    res.json({
      response,
      messageCount: session.messages.length,
      sessionId: session.id,
    });
  } catch (err) {
    console.error('Chat error:', err.message);
    if (err.message.includes('ANTHROPIC_API_KEY')) {
      return res.status(503).json({ error: 'AI service not configured. Add ANTHROPIC_API_KEY to .env' });
    }
    res.status(500).json({ error: 'AI error. Please try again.' });
  }
});

/* ─── POST /api/ai/chat/stream — SSE streaming response ─── */
router.post('/chat/stream', async (req, res) => {
  try {
    const { sessionId, message } = req.body;
    if (!message?.trim()) return res.status(400).json({ error: 'Message required' });

    let session = sessions.get(sessionId);
    if (!session) {
      const id = sessionId || uuidv4();
      session = { id, messages: [], context: req.body.context || {}, createdAt: new Date(), leadExtracted: false };
      sessions.set(id, session);
    }

    session.messages.push({ role: 'user', content: message.trim() });

    // SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    const fullResponse = await claude.chatStream(session.messages, session.context, (chunk) => {
      res.write(`data: ${JSON.stringify({ text: chunk })}\n\n`);
    });

    session.messages.push({ role: 'assistant', content: fullResponse });
    res.write(`data: ${JSON.stringify({ done: true, messageCount: session.messages.length })}\n\n`);
    res.end();
  } catch (err) {
    console.error('Stream error:', err.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'AI error' });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
});

/* ─── POST /api/ai/extract — Extract structured lead data ─── */
router.post('/extract', async (req, res) => {
  try {
    const { sessionId } = req.body;
    const session = sessions.get(sessionId);
    if (!session) return res.status(404).json({ error: 'Session not found' });

    const data = await claude.extractLeadData(session.messages);
    session.leadExtracted = true;

    res.json({ lead: data, messageCount: session.messages.length });
  } catch (err) {
    console.error('Extract error:', err.message);
    res.status(500).json({ error: 'Extraction failed' });
  }
});

/* ─── GET /api/ai/session/:id — Get session info ─── */
router.get('/session/:id', (req, res) => {
  const session = sessions.get(req.params.id);
  if (!session) return res.status(404).json({ error: 'Session not found' });
  res.json({
    id: session.id,
    messageCount: session.messages.length,
    context: session.context,
    createdAt: session.createdAt,
    leadExtracted: session.leadExtracted,
  });
});

module.exports = router;
