import { ApplicationError, canCreateClass } from "@masteryloop/domain";
import { createAccount, pageOf } from "@masteryloop/application";
import { createAccountSchema, dashboardQuerySchema } from "@masteryloop/contracts";
import { workerConfig } from "./config.ts";
import { createWorkerHandler } from "./handler.ts";
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
Deno.test(
  "shared domain/application/contracts execute without Node or browser services",
  async () => {
    const actor = {
      id: "admin",
      organizationId: "school",
      role: "ADMIN",
      displayName: "Admin",
    } as const;
    assert(canCreateClass(actor), "domain policy");
    assert(
      pageOf(Array.from({ length: 21 }, (_, i) => ({ id: String(i) }))).nextCursor === "19",
      "pagination",
    );
    assert(!dashboardQuerySchema.safeParse({ peopleAfter: "bad" }).success, "cursor validation");
    const input = createAccountSchema.parse({
      requestId: "30000000-0000-4000-8000-000000000001",
      email: "test@example.com",
      password: "synthetic-password",
      role: "STUDENT",
      displayName: "Test",
      gradeLevel: "P5",
      schoolYear: 2026,
    });
    const id = await createAccount(
      actor,
      input,
      { reserve: () => Promise.resolve("existing"), update: () => Promise.resolve() },
      {
        create: () => {
          throw new Error("Retry should not call provider");
        },
      },
    );
    assert(id === "existing", "idempotent application use case");
    assert(new ApplicationError("FORBIDDEN", "Denied").code === "FORBIDDEN", "shared errors");
  },
);
Deno.test("worker configuration fails without disclosing values", () => {
  for (const values of [{}, { WORKER_TRIGGER_TOKEN: "secret", SUPABASE_URL: "bad" }]) {
    let failed = false;
    try {
      workerConfig((key) => (values as Record<string, string>)[key]);
    } catch (error) {
      failed = error instanceof Error && !error.message.includes("secret");
    }
    assert(failed, "invalid configuration rejected safely");
  }
});
Deno.test("worker authenticates health and does not pretend to consume grading jobs", async () => {
  const token = "synthetic-trigger-token-for-tests-only";
  const handler = createWorkerHandler({
    triggerToken: token,
    supabaseUrl: "http://localhost:54321",
  });
  assert(
    (await handler(new Request("http://worker/health", { method: "POST" }))).status === 401,
    "unauthenticated rejected",
  );
  const headers = { authorization: `Bearer ${token}` };
  assert(
    (await handler(new Request("http://worker/health", { headers }))).status === 405,
    "method rejected",
  );
  assert(
    (await handler(new Request("http://worker/run", { method: "POST", headers }))).status === 503,
    "grading disabled",
  );
  const response = await handler(new Request("http://worker/health", { method: "POST", headers }));
  assert(
    response.status === 200 && (await response.json()).gradingEnabled === false,
    "health contract",
  );
});
