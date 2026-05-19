/**
 * sseRoutes.js — Server-Sent Events broadcast channel
 *
 * GET /api/sse/updates
 *   Keeps the connection open and pushes a JSON event whenever
 *   any admin mutates data (notices, events, classes, members,
 *   about, albums, contact).
 *
 * Other route files call  `sseEmit(topic)`  after every
 * successful create / update / delete operation.
 */

const express = require("express");
const router  = express.Router();

// ── In-memory set of active SSE response objects ──────────────
const clients = new Set();

/**
 * Broadcast a change event to every connected client.
 * @param {string} topic  e.g. "notices", "events", "classes" …
 */
function sseEmit(topic) {
  const payload = JSON.stringify({ topic, ts: Date.now() });
  for (const res of clients) {
    try {
      res.write(`data: ${payload}\n\n`);
    } catch (_) {
      clients.delete(res);
    }
  }
}

// ── SSE endpoint ───────────────────────────────────────────────
router.get("/updates", (req, res) => {
  // SSE headers
  res.setHeader("Content-Type",  "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection",    "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx buffering
  res.flushHeaders();

  // Send a heartbeat comment every 25 s to keep the connection alive
  // through proxies / load-balancers that close idle connections.
  const heartbeat = setInterval(() => {
    try { res.write(": heartbeat\n\n"); } catch (_) { /* ignore */ }
  }, 25_000);

  // Register this client
  clients.add(res);

  // Send an immediate "connected" event so the client knows it's live
  res.write(`data: ${JSON.stringify({ topic: "connected", ts: Date.now() })}\n\n`);

  // Clean up when the client disconnects
  req.on("close", () => {
    clearInterval(heartbeat);
    clients.delete(res);
  });
});

module.exports = { router, sseEmit };
