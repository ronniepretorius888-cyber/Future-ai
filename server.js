// server.js
import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 10000;

// Resolve directory (needed for Render)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ✅ Serve all files from the "public" folder
app.use(express.static(path.join(__dirname, "public")));

// ✅ Route for homepage
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Optional test route (you can check it at /api/test)
app.get("/api/test", (req, res) => {
  res.json({ message: "Future-AI API is working! 🚀" });
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`Future-AI server running on port ${PORT}`);
});
