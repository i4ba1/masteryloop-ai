import type { WorkerConfig } from "./config.ts";
export function createWorkerHandler(config: WorkerConfig) {
  return async (request: Request): Promise<Response> => {
    const authorization = request.headers.get("authorization") ?? "";
    const encoder = new TextEncoder();
    const [actual, expected] = await Promise.all([
      crypto.subtle.digest("SHA-256", encoder.encode(authorization)),
      crypto.subtle.digest("SHA-256", encoder.encode(`Bearer ${config.triggerToken}`)),
    ]);
    const a = new Uint8Array(actual);
    const b = new Uint8Array(expected);
    let difference = 0;
    for (let i = 0; i < a.length; i++) difference |= a[i]! ^ b[i]!;
    if (difference !== 0) return Response.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    if (request.method !== "POST")
      return Response.json(
        { error: "METHOD_NOT_ALLOWED" },
        { status: 405, headers: { Allow: "POST" } },
      );
    if (!new URL(request.url).pathname.endsWith("/health"))
      return Response.json({ error: "WORKER_NOT_IMPLEMENTED" }, { status: 503 });
    return Response.json({
      status: "ready",
      capability: "foundation-health",
      gradingEnabled: false,
    });
  };
}
