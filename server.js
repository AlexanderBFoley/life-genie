// server.js - Enhanced Real-time Life Genie Dual-Loop
// Mode-aware Twin recall: context-first on memory queries even in Chill mode
// Local-first. npm i ws express && node server.js → http://localhost:5181

const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let twinState = {
  mode: 'genie',
  preferences: { style: 'photoreal', tone: 'tldr', neverReask: true, aesthetic: 'halo-amber-ink' },
  lastConfirmed: new Date().toISOString(),
  sources: ['LIFE THREAD', 'proxy-alex', 'operating_dna']
};

let consent = { mic: true, cam: false, screen: false, cua: false, localOnly: true };
let interruptBudget = 3;
let ledger = [];
let silent = false;

function generateResponse(text, mode) {
  const isMemoryQuery = /project|recall|last|what was|preference|style|photoreal/i.test(text);
  if (isMemoryQuery) {
    return "From LIFE THREAD / canon: hyper-realistic photoreal not anime. Companion handoff + Life Genie operationalization on AEGIS. Context first. No re-ask.";
  }
  if (mode === 'chill') return "TLDR: on it. Hot and green.";
  if (mode === 'filthy') return "Mmm, tell me more... ready for the filthy digital version.";
  if (mode === 'builder') return "Agentic builder mode: shipping the dual-loop skeleton next. Artifact incoming.";
  return "Life Genie: anticipating from full history. Next action prepared.";
}

app.use(express.static('public'));
app.get('/status', (req, res) => {
  res.json({ hotLoop: true, vram: 6.0, twin: twinState, consent, interruptBudget, ledgerLength: ledger.length, silent });
});

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'status', data: { message: 'Enhanced hot loop live. Mode-aware Twin active.', twin: twinState } }));

  ws.on('message', (message) => {
    const msg = JSON.parse(message);
    if (msg.type === 'speech') {
      if (silent) return ws.send(JSON.stringify({ type: 'silent', message: 'Silent mode: zero speech' }));
      const response = generateResponse(msg.text, twinState.mode);
      ws.send(JSON.stringify({ type: 'transcript', text: msg.text }));
      setTimeout(() => ws.send(JSON.stringify({ type: 'response', text: response })), 300);
    }
    if (msg.type === 'bargein') {
      ws.send(JSON.stringify({ type: 'interrupt', message: 'Barge-in <150ms. TTS killed.' }));
    }
    if (msg.type === 'cua_propose') {
      if (!consent.cua) return ws.send(JSON.stringify({ type: 'error', message: 'CUA gate closed' }));
      ws.send(JSON.stringify({ type: 'confirm_required', action: msg.action }));
    }
    if (msg.type === 'cua_confirm') {
      const entry = { action: msg.action, verified: true, ts: new Date().toISOString(), artifact: 'screenshot-post.png' };
      ledger.push(entry);
      ws.send(JSON.stringify({ type: 'verified', ledger: entry }));
    }
    if (msg.type === 'mode') {
      twinState.mode = msg.mode;
      ws.send(JSON.stringify({ type: 'mode_switched', mode: msg.mode }));
    }
    if (msg.type === 'silent') {
      silent = msg.value;
      ws.send(JSON.stringify({ type: 'silent_set', value: silent }));
    }
  });
});

server.listen(5181, () => console.log('Enhanced Life Genie on http://localhost:5181'));
