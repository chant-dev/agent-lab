import { describe, expect, it } from "vitest";
import { config } from "../config.js";
import { buildAddIdeaScriptArgs, buildCheckScriptArgs, buildRunNextScriptArgs } from "./scriptService.js";

describe("script argument builders", () => {
  it("passes the configured AgentLab root to idea submission scripts", () => {
    const args = buildAddIdeaScriptArgs({
      idea: "Build a polished local planning tool.",
      priority: "High",
      appTypeHint: "Full-stack app",
      qualityLevel: "Production",
      buildMode: "standard",
    });

    expect(valueAfter(args, "-Root")).toBe(config.paths.root);
    expect(valueAfter(args, "-Idea")).toBe("Build a polished local planning tool.");
    expect(valueAfter(args, "-Sandbox")).toBe(config.scriptRuntime.codexSandbox);
    expect(valueAfter(args, "-HeartbeatSeconds")).toBe(String(config.scriptRuntime.heartbeatSeconds));
    expect(valueAfter(args, "-BuildMode")).toBe("standard");
  });

  it("passes the configured AgentLab root to queue runner scripts", () => {
    const args = buildRunNextScriptArgs("production");

    expect(valueAfter(args, "-Root")).toBe(config.paths.root);
    expect(valueAfter(args, "-Mode")).toBe("production");
    expect(valueAfter(args, "-Sandbox")).toBe(config.scriptRuntime.codexSandbox);
    expect(valueAfter(args, "-HeartbeatSeconds")).toBe(String(config.scriptRuntime.heartbeatSeconds));
  });

  it("passes the configured AgentLab root to health check scripts", () => {
    const args = buildCheckScriptArgs();

    expect(valueAfter(args, "-Root")).toBe(config.paths.root);
  });
});

function valueAfter(args: string[], key: string): string | undefined {
  const index = args.indexOf(key);
  return index === -1 ? undefined : args[index + 1];
}
