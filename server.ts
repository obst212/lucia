import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { apiRouter } from "./src/server/apiRouter";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Mount API router FIRST
  app.use("/api", apiRouter);

  // Global Express Error Handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Global Express Error:", err);
    const status = err.status || err.statusCode || 500;
    const message = err.type === "entity.too.large"
      ? "업로드한 파일 용량이 너무 큽니다. (최대 50MB 제한)"
      : (err.message || "서버 처리 중 오류가 발생했습니다.");
    res.status(status).json({ error: message });
  });

  // Vite middleware setup for development vs static serve for production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
