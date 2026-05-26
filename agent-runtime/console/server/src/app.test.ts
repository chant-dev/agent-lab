import type { Server } from "node:http";
import { once } from "node:events";
import { afterEach, describe, expect, it } from "vitest";
import { createApp } from "./app.js";

let server: Server | null = null;

afterEach(async () => {
  if (!server) {
    return;
  }

  await new Promise<void>((resolve, reject) => {
    server?.close((error) => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    });
  });
  server = null;
});

describe("createApp", () => {
  it("returns a JSON 404 for unknown API routes", async () => {
    const baseUrl = await startServer();

    const response = await fetch(`${baseUrl}/api/not-a-real-route`);

    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
    await expect(response.json()).resolves.toEqual({ error: "API route not found." });
  });
});

async function startServer(): Promise<string> {
  server = createApp().listen(0, "127.0.0.1");
  await once(server, "listening");

  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Could not determine test server address.");
  }

  return `http://127.0.0.1:${address.port}`;
}
