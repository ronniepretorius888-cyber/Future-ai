// server.js - Future-AI backend (compact, tested patterns)
// Dependencies: express, body-parser, cors, node-fetch, dotenv
const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');
const cors = require('cors');
const fetch = require('node-fetch'); // v2 style
require('dotenv').config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const PORT = process.env.PORT || 10000;
const DB_FILE = path.join(__dirname, 'sales.json');

// Ensure DB file exists
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({
    sales: [],
    tokens: [],
    marketing: { weekly: { enabled: true, lastSent: 0 }, monthly: { enabled: true, lastSent: 0 }, templates: {} }
  }, null, 2));
}

function readDB() {
  try { return JSON.parse(fs.readFileSync(DB_FILE, 'utf8')); }
  catch (e) { return { sales: [], tokens: [], marketing: { weekly: { enabled: true, lastSent: 0 }, monthly: { enabled: true, lastSent: 0 }, templates: {} } }; }
}
function writeDB(obj) { fs.writeFileSync(DB_FILE, JSON.stringify(obj, null, 2)); }

const genToken = () => require('crypto').randomBytes(18).toString('hex');
const nowISO = () => new Date().toISOString();
const asCurrency = n => 'R' + Number(n || 0).toFixed(2);

// Env config (set these in Render environment)
const ADMIN_KEY = process.env.ADMIN_KEY || 'Rp760601#!';
const PAYFAST_MERCHANT_ID = process.env.PAYFAST_MERCHANT_ID || '';
const PAYFAST_MERCHANT_KEY = process.env.PAYFAST_MERCHANT_KEY || '';
const FROM_EMAIL = process.env.FROM_EMAIL || 'no-reply@future-ai.example';
const PLATFORM_CUT = parseFloat(process.env.PLATFORM_CUT || '0.20');
const MAILER_PROVIDER = (process.env.MAILER_PROVIDER || 'mailersend').toLowerCase();
const MAILER_API_KEY = process.env.MAILER_API_KEY || '';
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const ELEVENLABS_KEY = process.env.ELEVENLABS_KEY || '';

// Lightweight sendEmail wrapper (MailerSend & Sendinblue)
async function sendEmail(to, subject, text) {
  if (!to) return false;
  try {
    if (MAILER_PROVIDER === 'mailersend' && MAILER_API_KEY) {
      const payload = { from: { email: FROM_EMAIL }, to: [{ email: to }], subject, text };
      const r = await fetch('https://api.mailersend.com/v1/email', {
        method: 'POST',
        headers: { Authorization: `Bearer ${MAILER_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return r.ok;
    }
    if (MAILER_PROVIDER === 'sendinblue' && MAILER_API_KEY) {
      const payload = { sender: { email: FROM_EMAIL }, to: [{ email: to }], subject, htmlContent: `<pre>${text}</pre>` };
      const r = await fetch('https://api.sendinblue.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': MAILER_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      return r.ok;
    }
    console.warn('No mailer configured');
    return false;
  } catch (e) { console.error('sendEmail error', e); return false; }
}

// create token and store
function createToken(sale) {
  const db = readDB();
  const token = genToken();
  const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
  db.tokens = db.tokens || [];
  db.tokens.push({ token, item: sale.title || sale.itemId || 'item', amount: sale.amount || 0, date: nowISO(), expiresAt, buyer_email: sale.buyer_email || null });
  writeDB(db);
  return { token, expiresAt };
}

/* --------------------------
   PayFast IPN endpoint
   (PayFast will POST purchase data here)
   NOTE: For production add server-to-server validation per PayFast docs.
   -------------------------- */
app.post('/api/payfast/ipn', async (req, res) => {
  try {
    const payload = req.body || {};
    console.log('IPN received:', payload);
    const sale = {
      date: nowISO(),
      itemId: payload.item_name ? String(payload.item_name).replace(/\s+/g, '-').toLowerCase() : (payload.item_number || payload.m_payment_id || 'unknown'),
      title: payload.item_name || 'PayFast Purchase',
      amount: Number(payload.amount_gross || payload.amount || 0),
      buyer_email: payload.email_address || payload.buyer_email || null,
      raw: payload
    };
    const db = readDB();
    db.sales.push(sale);
    writeDB(db);

    const tokenObj = createToken(sale);
    if (sale.buyer_email) {
      const txt = `Thank you for supporting Future-AI by Ronnie Pretorius\n\nPurchase: ${sale.title}\nAmount: ${asCurrency(sale.amount)}\nDate: ${sale.date}\n\nAccess token (valid 24 hours): ${tokenObj.token}\n\nEnjoy!`;
      await sendEmail(sale.buyer_email, `Your receipt — ${sale.title}`, txt);
    }
    return res.status(200).send('OK');
  } catch (e) {
    console.error('IPN error', e);
    return res.status(500).send('ERR');
  }
});

// PayFast config for frontend link building
app.get('/api/payfast-config', (req, res) => {
  res.json({ merchant_id: PAYFAST_MERCHANT_ID, merchant_key: PAYFAST_MERCHANT_KEY });
});

// PayFast return confirmation (frontend polls this after payment)
app.get('/api/payfast/confirm', (req, res) => {
  const { tool, amount } = req.query;
  const db = readDB();
  const found = (db.sales || []).find(s => (String(s.itemId || s.title || '').toLowerCase().includes(String(tool || '').toLowerCase())) && Math.abs(Number(s.amount || 0) - Number(amount || 0)) < 0.01);
  if (found) {
    let t = (db.tokens || []).find(x => x.amount === found.amount && (x.item === found.title || x.item === found.itemId));
    if (!t) t = createToken(found);
    return res.json({ ok: true, token: t.token, expiresAt: t.expiresAt, sale: found });
  }
  return res.json({ ok: false, message: 'Sale not found (IPN may still be processing)' });
});

// token validation endpoint (frontend uses to unlock tools)
app.post('/api/validate-token', (req, res) => {
  const token = req.body && req.body.token;
  const db = readDB();
  const rec = (db.tokens || []).find(t => t.token === token);
  if (!rec) return res.json({ ok: false, message: 'Invalid token' });
  if (Date.now() > rec.expiresAt) return res.json({ ok: false, message: 'Token expired' });
  return res.json({ ok: true, token: rec.token, item: rec.item, expiresAt: rec.expiresAt });
});

// Admin endpoints (protected by ADMIN_KEY)
app.get('/api/admin/sales', (req, res) => {
  const key = req.query.key || req.headers['x-admin-key'];
  if (!key || key !== ADMIN_KEY) return res.status(403).json({ error: 'forbidden' });
  const db = readDB();
  const totalRevenue = (db.sales || []).reduce((s, x) => s + Number(x.amount || 0), 0);
  const platformCut = totalRevenue * PLATFORM_CUT;
  const vendorCosts = (db.sales || []).reduce((s, x) => s + Number(x.vendor_cost || 0 || 0), 0);
  const net = totalRevenue - platformCut - vendorCosts;
  return res.json({ sales: db.sales, tokens: db.tokens || [], stats: { totalRevenue, platformCut, vendorCosts, net } });
});

// CSV export
app.get('/api/admin/sales.csv', (req, res) => {
  const key = req.query.key || req.headers['x-admin-key'];
  if (!key || key !== ADMIN_KEY) return res.status(403).send('Forbidden');
  const db = readDB();
  const rows = [['date', 'title', 'itemId', 'amount', 'buyer_email'].join(',')];
  (db.sales || []).forEach(s => rows.push([s.date, `"${(s.title || '').replace(/"/g, '""')}"`, s.itemId, (s.amount || 0), (s.buyer_email || '')].join(',')));
  res.setHeader('Content-Type', 'text/csv');
  res.send(rows.join('\n'));
});

// Basic AI proxy endpoints (require keys in env)
app.post('/api/ai/text', async (req, res) => {
  if (!OPENAI_API_KEY) return res.status(400).json({ error: 'OPENAI_API_KEY not configured' });
  const { prompt, model = 'gpt-3.5-turbo' } = req.body || {};
  try {
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, messages: [{ role: 'user', content: prompt }], max_tokens: 400 })
    });
    const j = await r.json();
    return res.json(j);
  } catch (e) { console.error('AI text error', e); return res.status(500).json({ error: 'AI text error' }); }
});

// Health
app.get('/api/health', (req, res) => res.json({ ok: true, time: nowISO() }));

// Serve frontend static files (assumes /public is present in repo)
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => console.log(`Future-AI server running on port ${PORT}`));
