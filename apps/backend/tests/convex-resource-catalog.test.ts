import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../convex/schema.js";
import { parseResourceCatalogPayload } from "../src/resource-master/domain/catalog-snapshot.js";
import { cableCatalog } from "./fixtures/cable-catalog.js";

const modules = (
  import.meta as ImportMeta & {
    glob(pattern: string): Record<string, () => Promise<unknown>>;
  }
).glob("../convex/**/*.ts");
const snapshot = { ...parseResourceCatalogPayload({
  catalogKey: "resource-master",
  schemaVersion: 1,
  sourceVersion: "fixture",
  lifecycle: "ACTIVE",
  catalog: cableCatalog,
}), revision: 1 };

describe("Convex catalog schema foundation", () => {
  it("accepts one bounded aggregate through its indexed key and rejects malformed transport", async () => {
    const t = convexTest(schema, modules);
    await t.run((ctx) => ctx.db.insert("resourceCatalogSnapshots", snapshot as never));
    expect(
      await t.run((ctx) =>
        ctx.db.query("resourceCatalogSnapshots")
          .withIndex("by_catalog_key", (q) => q.eq("catalogKey", "resource-master"))
          .take(2),
      ),
    ).toHaveLength(1);
    await expect(
      t.run((ctx) =>
        ctx.db.insert("resourceCatalogSnapshots", {
          ...snapshot,
          catalog: { ...snapshot.catalog, attributes: [{ code: "bad" }] },
        } as never),
      ),
    ).rejects.toThrow();
  });
});
