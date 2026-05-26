import path from "node:path";
import express from "express";
import { config } from "./config.js";
import { apiErrorHandler, apiRouter } from "./routes/api.js";

export function createApp(): express.Express {
  const app = express();
  const clientDist = path.join(config.paths.consoleDir, "dist", "client");

  app.disable("x-powered-by");
  app.use(express.json({ limit: "128kb" }));
  app.use("/api", apiRouter);
  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "API route not found." });
  });
  app.use(express.static(clientDist));
  app.get("*", (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
  app.use(apiErrorHandler);

  return app;
}
