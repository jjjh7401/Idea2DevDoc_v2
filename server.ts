import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// Database setup
const db = new Database("specgen.db");
db.exec(`
  CREATE TABLE IF NOT EXISTS history (
    id TEXT PRIMARY KEY,
    idea TEXT,
    docs TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// API Routes
app.post("/api/history", (req, res) => {
  const { idea, docs } = req.body;
  if (!idea || !docs) {
    return res.status(400).json({ error: "아이디어와 문서가 필요합니다." });
  }
  const id = Math.random().toString(36).substring(2, 15);
  db.prepare("INSERT INTO history (id, idea, docs) VALUES (?, ?, ?)").run(id, idea, JSON.stringify(docs));
  res.json({ id });
});

app.get("/api/history", (req, res) => {
  const history = db.prepare("SELECT * FROM history ORDER BY created_at DESC").all();
  res.json(history.map((h: any) => ({ ...h, docs: JSON.parse(h.docs) })));
});

app.get("/api/history/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM history WHERE id = ?").get(req.params.id) as any;
  if (!row) return res.status(404).json({ error: "기록을 찾을 수 없습니다." });
  res.json({ ...row, docs: JSON.parse(row.docs) });
});

// GitHub OAuth Placeholder
app.get("/api/auth/github/url", (req, res) => {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) return res.status(500).json({ error: "GitHub Client ID가 설정되지 않았습니다." });
  
  const redirectUri = `${process.env.APP_URL}/api/auth/github/callback`;
  const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo`;
  res.json({ url });
});

// Vite middleware for development
if (process.env.NODE_ENV !== "production") {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: "spa",
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, "dist"), { index: false }));
  app.get("*", async (req, res) => {
    try {
      const indexPath = path.join(__dirname, "dist", "index.html");
      let html = await fs.promises.readFile(indexPath, "utf-8");
      
      // Inject API key into the HTML at runtime
      const apiKeyScript = `<script>window.GEMINI_API_KEY = ${JSON.stringify(process.env.GEMINI_API_KEY || "")};</script>`;
      html = html.replace("</head>", `${apiKeyScript}</head>`);
      
      res.send(html);
    } catch (e) {
      console.error("Error serving index.html:", e);
      res.status(500).send("Internal Server Error");
    }
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
