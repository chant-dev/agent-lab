const DEFAULT_API_HOST = "127.0.0.1";
const DEFAULT_API_PORT = "8787";
const LOCAL_API_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

export function resolveDevApiTarget(rawHost = DEFAULT_API_HOST, rawPort = DEFAULT_API_PORT): string {
  const host = rawHost.trim() || DEFAULT_API_HOST;
  if (!LOCAL_API_HOSTS.has(host)) {
    throw new Error("AGENTLAB_CONSOLE_HOST must be local-only. Refusing non-local proxy target.");
  }

  const port = parseDevApiPort(rawPort);
  return `http://${formatProxyHost(host)}:${port}`;
}

function parseDevApiPort(rawPort: string): number {
  const normalized = rawPort.trim();
  if (!/^\d+$/.test(normalized)) {
    throw new Error("AGENTLAB_CONSOLE_PORT must be a valid TCP port.");
  }

  const port = Number.parseInt(normalized, 10);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error("AGENTLAB_CONSOLE_PORT must be a valid TCP port.");
  }
  return port;
}

function formatProxyHost(host: string): string {
  return host === "::1" ? "[::1]" : host;
}
