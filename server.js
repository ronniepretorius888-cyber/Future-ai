import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const PORT = process.env.PORT || 3000;

// Static path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "public")));

app.get("/api", (req, res) => {
  res.json({ message: "Welcome to Future-AI, powered by Ronnie Pretorius 💡" });
});

app.listen(PORT, () => {
  console.log(`🚀 Future-AI running on port ${PORT}`);
});
