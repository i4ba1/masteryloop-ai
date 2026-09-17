import { describe, expect, it } from "vitest";
// @ts-expect-error Standalone JavaScript CLI shared with CI.
import {
  boundaryErrors,
  importsIn,
  clientBoundaryErrors,
  directivesIn,
  checkArchitecture,
} from "../../scripts/check-architecture.mjs";
describe("architecture guard (AC-13)", () => {
  it("rejects an intentional domain vendor import", () => {
    expect(
      boundaryErrors(
        "packages/domain/src/fixture.ts",
        importsIn('import { createClient } from "@supabase/supabase-js";'),
      ),
    ).toHaveLength(1);
  });
  it("rejects framework and infrastructure dependencies in application", () => {
    expect(
      boundaryErrors("packages/application/src/fixture.ts", [
        "next/headers",
        "@masteryloop/infrastructure",
      ]),
    ).toHaveLength(2);
  });
  it("allows inward application dependencies", () => {
    expect(
      boundaryErrors("packages/application/src/identity/ports.ts", [
        "@masteryloop/domain",
        "./models.ts",
      ]),
    ).toEqual([]);
  });
  it("rejects relative escapes and deep feature imports", () => {
    expect(
      boundaryErrors("packages/domain/src/fixture.ts", ["../../infrastructure/src/index.ts"]),
    ).toHaveLength(1);
    expect(
      boundaryErrors("apps/web/src/features/roster/ui/page.tsx", [
        "@/features/auth/server/actions",
      ]),
    ).toHaveLength(1);
    expect(
      boundaryErrors("apps/web/src/features/roster/ui/page.tsx", ["@/features/auth/server"]),
    ).toEqual([]);
  });
  it("inspects exports, dynamic imports and type imports", () => {
    expect(
      importsIn('export * from "react"; const x = import("next"); type X = import("openai").X;'),
    ).toEqual(["react", "next", "openai"]);
  });
});

describe("client/server dependency graph", () => {
  const client = { source: '"use client";', dependencies: ["barrel"] };
  it("rejects server-only code through re-export barrels", () => {
    const modules = new Map([
      ["client", client],
      ["barrel", { source: 'export * from "./secret";', dependencies: ["secret"] }],
      ["secret", { source: 'import "server-only";', dependencies: [] }],
    ]);
    expect(clientBoundaryErrors(modules)).toEqual([
      "Client imports server-only code: client -> barrel -> secret",
    ]);
  });
  it.each(["next/headers", "next/server", "node:fs"])(
    "rejects browser access to %s",
    (dependency) => {
      expect(
        clientBoundaryErrors(
          new Map([
            ["client", { source: `"use client"; import "${dependency}";`, dependencies: [] }],
          ]),
        ),
      ).toHaveLength(1);
    },
  );
  it("allows server action references without traversing their server dependencies", () => {
    const modules = new Map([
      ["client", client],
      ["barrel", { source: 'export { action } from "./action";', dependencies: ["action"] }],
      ["action", { source: '"use server"; import "server-only";', dependencies: [] }],
    ]);
    expect(clientBoundaryErrors(modules)).toEqual([]);
  });
  it("ignores erased types but preserves mixed and dynamic runtime imports", () => {
    const source =
      'import type { A } from "types"; import { type B } from "types2"; export type { C } from "types3"; export { type D } from "types4"; type E = import("types5").E; import { type F, value } from "runtime"; export { type G, other } from "runtime2"; const lazy = import("runtime3");';
    expect(importsIn(source, true)).toEqual(["runtime", "runtime2", "runtime3"]);
    expect(importsIn(source)).toContain("types");
  });
  it("recognizes directives only in the module directive prologue", () => {
    expect(directivesIn('// comment\n"use client";')).toEqual(["use client"]);
    expect(directivesIn('const label = "use server"; "use client";')).toEqual([]);
  });
  it("terminates on cycles while still inspecting other dependencies", () => {
    const modules = new Map([
      ["client", client],
      ["barrel", { source: "", dependencies: ["client", "secret"] }],
      ["secret", { source: 'import "server-only";', dependencies: [] }],
    ]);
    expect(clientBoundaryErrors(modules)).toHaveLength(1);
  });
  it("accepts the current workspace including client forms calling server actions", () => {
    expect(checkArchitecture()).toEqual([]);
  });
});
