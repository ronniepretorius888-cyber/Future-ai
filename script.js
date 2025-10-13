// public/script.js - connects frontend to backend APIs

async function apiGet(path) {
  const r = await fetch(path);
  return await r.json();
}

function promptAdminKey() {
  const k = prompt('Enter ADMIN KEY (your admin password)') || '';
  return k;
}

async function showStats() {
  const key = promptAdminKey();
  if (!key) return alert('Admin key required to view stats');
  const url = `/api/admin/sales?key=${encodeURIComponent(key)}`;
  try {
    const j = await apiGet(url);
    if (j.error) return alert('Forbidden or invalid key');
    const s = j.stats || {};
    document.getElementById('output').innerHTML = `
      <h3>📊 Admin Dashboard</h3>
      <pre>${JSON.stringify(s, null, 2)}</pre>
      <p>Sales count: ${(j.sales || []).length}</p>
      <button onclick="exportCSV()">Export CSV</button>
    `;
  } catch (e) { alert('Error loading stats: ' + e); }
}

function exportCSV() {
  const key = promptAdminKey();
  if (!key) return;
  window.open(`/api/admin/sales.csv?key=${encodeURIComponent(key)}`, '_blank');
}

async function generateContent() {
  const prompt = window.prompt('Enter a prompt for AI text (example: "Write a short product description for an AI tool")');
  if (!prompt) return;
  try {
    const r = await fetch('/api/ai/text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt })
    });
    const j = await r.json();
    if (j.error) return alert('AI error: ' + (j.error || JSON.stringify(j)));
    // try to extract a safe string
    const text = j?.choices?.[0]?.message?.content || JSON.stringify(j).slice(0,1000);
    document.getElementById('output').innerHTML = `<h3>AI Result</h3><pre>${text}</pre>`;
  } catch (e) { alert('AI request failed: ' + e); }
}

async function manageLinks() {
  document.getElementById('output').innerHTML = `<h3>Manage Links</h3><p>Edit affiliate links and vendor prices in GitHub repo admin files for now.</p>`;
}

async function showUpdates() {
  document.getElementById('output').innerHTML = `<h3>Updates</h3><p>Weekly tip: Use AI to write short comparison tables for products. Monthly: Add new partners for higher margins.</p>`;
}

// test health
(async function checkHealth(){
  try {
    const h = await apiGet('/api/health');
    console.log('Backend health:', h);
  } catch(e) {
    console.log('No backend detected (static site only). Connect the backend service to enable features.');
  }
})();
