import { describe, expect, it } from "vitest";
import { pageOf, pageSize } from "./ports.ts";
describe("keyset page boundary", () => {
  it("uses a lookahead without returning it and reaches the final page", () => {
    const rows = Array.from({ length: 45 }, (_, i) => ({ id: String(i).padStart(3, "0") }));
    const first = pageOf(rows.slice(0, pageSize + 1));
    const second = pageOf(rows.filter((row) => row.id > first.nextCursor!).slice(0, pageSize + 1));
    const final = pageOf(rows.filter((row) => row.id > second.nextCursor!).slice(0, pageSize + 1));
    expect([...first.items, ...second.items, ...final.items]).toEqual(rows);
    expect(first.nextCursor).toBe("019");
    expect(final.nextCursor).toBeNull();
  });
  it("does not claim another page for exactly the limit or an empty result", () => {
    expect(pageOf([])).toEqual({ items: [], nextCursor: null });
    expect(
      pageOf(Array.from({ length: pageSize }, (_, i) => ({ id: String(i) }))).nextCursor,
    ).toBeNull();
  });
});
