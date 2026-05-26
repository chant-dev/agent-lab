import { describe, expect, it } from "vitest";
import { resolveDevApiTarget } from "./viteProxy";

describe("resolveDevApiTarget", () => {
  it("defaults the Vite proxy to the local Express API", () => {
    expect(resolveDevApiTarget()).toBe("http://127.0.0.1:8787");
  });

  it("uses local host and port overrides", () => {
    expect(resolveDevApiTarget("localhost", "8790")).toBe("http://localhost:8790");
    expect(resolveDevApiTarget("::1", "8791")).toBe("http://[::1]:8791");
  });

  it("rejects non-local hosts and invalid ports", () => {
    expect(() => resolveDevApiTarget("0.0.0.0", "8787")).toThrow(/local-only/);
    expect(() => resolveDevApiTarget("127.0.0.1", "8787abc")).toThrow(/valid TCP port/);
    expect(() => resolveDevApiTarget("127.0.0.1", "0")).toThrow(/valid TCP port/);
  });
});
