import { describe, expect, it } from "vitest";
import { ZodError, z } from "zod";
import { toApiErrorResponse } from "./api.js";
import { CommandAlreadyRunningError } from "../services/scriptService.js";

describe("toApiErrorResponse", () => {
  it("maps malformed JSON parser errors to a safe client error", () => {
    const error = new SyntaxError("Unexpected token s in JSON at position 1") as SyntaxError & { status: number; type: string };
    error.status = 400;
    error.type = "entity.parse.failed";

    expect(toApiErrorResponse(error)).toEqual({
      status: 400,
      body: { error: "Malformed JSON request body." },
    });
  });

  it("keeps zod validation details for form and command payloads", () => {
    const result = z.object({ mode: z.enum(["standard"]) }).safeParse({ mode: "remote" });
    const error = result.success ? new Error("unexpected success") : result.error;

    const response = toApiErrorResponse(error);

    expect(response.status).toBe(400);
    expect(response.body.error).toBe("Validation failed");
    expect(response.body.details).toEqual(expect.any(Object));
    expect(error).toBeInstanceOf(ZodError);
  });

  it("maps oversized JSON payload errors to 413", () => {
    const error = new Error("request entity too large") as Error & { status: number; statusCode: number; type: string };
    error.status = 413;
    error.statusCode = 413;
    error.type = "entity.too.large";

    expect(toApiErrorResponse(error)).toEqual({
      status: 413,
      body: { error: "Request body is too large." },
    });
  });

  it("maps concurrent command attempts to 409", () => {
    const response = toApiErrorResponse(new CommandAlreadyRunningError({
      id: "run-1",
      action: "run-next",
      mode: "standard",
      label: "run-next (standard)",
      startedAt: "2026-05-22T18:00:00.000Z",
      stdoutTail: "",
      stderrTail: "",
    }));

    expect(response.status).toBe(409);
    expect(response.body.error).toContain("Another AgentLab command is already running");
  });
});
