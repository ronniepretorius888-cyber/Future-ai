// public/script.js - connects frontend to backend APIs (final)
async function apiGet(path, opts = {}) {
  const r = await fetch(path, opts);
  return await r.json();
}

function adminPrompt() {
  return prompt("Enter ADMIN KEY:") || "";
}

async function showStats() {
  const key = adminPrompt();
  if (!key) return alert("Admin key required");
  try {
    const j = await apiGet(`/api/admin/sales?key=${encodeURIComponent(key)}`);
    if (j.error) return alert("Forbidden or invalid key");
    document.getElementById("output").innerHTML = `<h3>📊 Admin</h3><pre>${JSON.stringify(j.stats, null, 2)}</pre><p>Sales: ${(j.sales||[]).length}</p><button onclick="exportCSV()">Export CSV</button>`;
  } catch (e) { alert("Error: " + e); }
}

function exportCSV() {
  const key = adminPrompt();
  if (!key) return;
  window.open(`/api/admin/sales.csv?key=${encodeURIComponent(key)}`, "_blank");
}

async function generateContent() {
  const prompt = prompt("Enter prompt for AI text:");
  if (!prompt) return;
  try {
    const r = await fetch("/api/ai/text", { method: "POST", headers: { "Content-Type":"application/json" }, body: JSON.stringify({ prompt }) });
    const j = await r.json();
    if (j.error) return alert("AI error: " + (j.error || JSON.stringify(j)));
    const text = j?.choices?.[0]?.message?.content || JSON.stringify(j).slice(0,1000);
    document.getElementById("output").innerHTML = `<h3>AI Output</h3><pre>${text}</pre>`;
  } catch (e) { alert("AI error: " + e); }
}

function manageLinks() {
  document.getElementById("output").innerHTML = `<h3>Link Manager</h3><p>Manage affiliate links inside the GitHub repo (future UI coming).</p>`;
}

function showUpdates() {
  document.getElementById("output").innerHTML = `<h3>Marketing</h3><p>Weekly tip: Use short lists & comparisons. Monthly: Add new tool promotions.</p>`;
}

// initial health check
(async () => {
  try {
    const h = await apiGet("/api/health");
    console.log("Backend:", h);
  } catch (e) {
    console.log("Backend not found (static only). Connect server to enable features.");
  }
})();
