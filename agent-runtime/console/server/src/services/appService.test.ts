import { describe, expect, it } from "vitest";
import { assertSafeAppName } from "./appService.js";

describe("assertSafeAppName", () => {
  it("allows normal app and runtime tool names", () => {
    expect(() => assertSafeAppName("agentlab-console")).not.toThrow();
    expect(() => assertSafeAppName("Customer Portal 2.0")).not.toThrow();
  });

  it("rejects traversal and path separator input", () => {
    expect(() => assertSafeAppName("..\\secret")).toThrow(/Invalid app name/);
    expect(() => assertSafeAppName("../secret")).toThrow(/Invalid app name/);
    expect(() => assertSafeAppName("nested/app")).toThrow(/Invalid app name/);
  });

  it("rejects ambiguous names that could resolve outside an app folder", () => {
    expect(() => assertSafeAppName("")).toThrow(/Invalid app name/);
    expect(() => assertSafeAppName("   ")).toThrow(/Invalid app name/);
    expect(() => assertSafeAppName(".")).toThrow(/Invalid app name/);
    expect(() => assertSafeAppName("app-name.")).toThrow(/Invalid app name/);
    expect(() => assertSafeAppName(" app-name")).toThrow(/Invalid app name/);
    expect(() => assertSafeAppName("app-name ")).toThrow(/Invalid app name/);
  });

  it("rejects Windows reserved device names", () => {
    expect(() => assertSafeAppName("CON")).toThrow(/Invalid app name/);
    expect(() => assertSafeAppName("aux.txt")).toThrow(/Invalid app name/);
    expect(() => assertSafeAppName("LPT1")).toThrow(/Invalid app name/);
    expect(() => assertSafeAppName("COM9.log")).toThrow(/Invalid app name/);
    expect(() => assertSafeAppName("COM10")).not.toThrow();
  });
});
