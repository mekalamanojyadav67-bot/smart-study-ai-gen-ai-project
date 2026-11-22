import "dotenv/config";
import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import {
  MODEL_NAME,
  handleExtractPdf,
  handleGenerateFlashcards,
  handleGenerateQuiz,
  handleSummarize,
} from "./server/studyHandlers.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: "25mb" }));

  app.get("/api/health", (_req, res) => {
    res.json({ ok: true, model: MODEL_NAME });
  });

  app.post("/api/extract-pdf", async (req, res) => {
    const result = await handleExtractPdf(req.body);
    res.status(result.status).json(result.data);
  });

  app.post("/api/ai/summarize", async (req, res) => {
    const result = await handleSummarize(req.body);
    res.status(result.status).json(result.data);
  });

  app.post("/api/ai/quiz", async (req, res) => {
    const result = await handleGenerateQuiz(req.body);
    res.status(result.status).json(result.data);
  });

  app.post("/api/ai/flashcards", async (req, res) => {
    const result = await handleGenerateFlashcards(req.body);
    res.status(result.status).json(result.data);
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("/{*path}", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`Smart Study AI server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
