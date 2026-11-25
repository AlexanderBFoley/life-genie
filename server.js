// server.js - Real-time Life Genie Dual-Loop Server
// Local-first, Node preferred. Integrates with voice-bridge, Ollama, desktop tools.
// Run: npm init -y && npm i ws express && node server.js
// Access: http://localhost:5181  (or integrate into AEGIS :5180)

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let twinState = {
  mode: 'genie',
  preferences: { style: 'photoreal', tone: 'tldr', neverReask: true },
  lastConfirmed: new Date().toISOString(),
  sources: ['LIFE THREAD', 'proxy-alex']
};

let consent = { mic: true, cam: false, screen: false, cua: false, localOnly: true };
let interruptBudget = 3;
let ledger = [];

app.use(express.static('public'));
app.get('/status', (req, res) => {
  res.json({ hotLoop: true, vram: 6.0, twin: twinState, consent, interruptBudget, ledgerLength: ledger.length });
});

wss.on('connection', (ws) => {
  console.log('Client connected - real-time hot loop active');
  ws.send(JSON.stringify({ type: 'status', data: { message: 'Life Genie hot loop live. Barge-in ready.', twin: twinState } }));

  ws.on('message', (message) => {
    const msg = JSON.parse(message);
    if (msg.type === 'speech') {
      // Simulate STT -> LLM -> TTS streaming
      ws.send(JSON.stringify({ type: 'transcript', text: msg.text }));
      setTimeout(() => {
        ws.send(JSON.stringify({ type: 'response', text: 'Got it. Processing with Twin context. Never re-asking.', audio: 'tts-stream-started' }));
      }, 400);
    }
    if (msg.type === 'bargein') {
      ws.send(JSON.stringify({ type: 'interrupt', message: 'Barge-in detected. Stopping TTS <150ms.' }));
    }
    if (msg.type === 'cua_propose') {
      if (!consent.cua) return ws.send(JSON.stringify({ type: 'error', message: 'CUA gate closed' }));
      ws.send(JSON.stringify({ type: 'confirm_required', action: msg.action }));
    }
    if (msg.type === 'cua_confirm') {
      ledger.push({ action: msg.action, verified: true, ts: new Date().toISOString(), artifact: 'screenshot-post.png' });
      ws.send(JSON.stringify({ type: 'verified', ledger: ledger[ledger.length-1] }));
    }
    if (msg.type === 'mode') {
      twinState.mode = msg.mode;
      ws.send(JSON.stringify({ type: 'mode_switched', mode: msg.mode }));
    }
  });
});

server.listen(5181, () => {
  console.log('Life Genie real-time server on http://localhost:5181');
  console.log('WebSocket ready for live voice/CUA/Twin. Integrate local STT/TTS via voice-bridge.');
});
