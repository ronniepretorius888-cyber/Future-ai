function showStats() {
  document.getElementById("output").innerHTML = `
    <h3>📊 Admin Dashboard</h3>
    <p><strong>User:</strong> Ronnie Pretorius</p>
    <p><strong>Project:</strong> Future-AI</p>
    <p><strong>Status:</strong> Active</p>
    <p><strong>Revenue:</strong> R0.00 (Live tracking coming soon)</p>
  `;
}

function generateContent() {
  document.getElementById("output").innerHTML = `
    <h3>🧠 AI Tools</h3>
    <p>Generate blog posts, social media captions, or ad copy with one tap.</p>
    <p>💡 Future-AI Pro integrates GPT & image tools for businesses.</p>
  `;
}

function manageLinks() {
  document.getElementById("output").innerHTML = `
    <h3>🔗 Affiliate & Sales Links</h3>
    <p>Track, shorten, and promote your products in real time.</p>
    <p>Integrations coming: PayFast, MailerSend, and future AI Analytics.</p>
  `;
}

function showUpdates() {
  document.getElementById("output").innerHTML = `
    <h3>🗓️ Marketing & Updates</h3>
    <p>Weekly tip: Use AI tools to boost engagement by 40%.</p>
    <p>Monthly focus: Optimize conversion with real-time tracking.</p>
  `;
}
