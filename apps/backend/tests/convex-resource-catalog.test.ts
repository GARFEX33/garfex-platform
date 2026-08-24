import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import schema from "../convex/schema.js";
import {
  measureResourceCatalog,
  parseResourceCatalogPayload,
  resourceCatalogBounds,
} from "../src/resource-master/domain/catalog-snapshot.js";
import { cableCatalogV1 } from "../src/resource-master/deployment/cable-catalog-v1.js";
import { ConvexResourceCatalogReader } from "../src/resource-master/infrastructure/convex-resource-catalog.js";

const modules = (
  import.meta as ImportMeta & {
    glob(pattern: string): Record<string, () => Promise<unknown>>;
  }
).glob("../convex/**/*.ts");
const payload = parseResourceCatalogPayload(cableCatalogV1);
const snapshot = { ...payload, revision: 1 };

describe("Convex persistent Resource Catalog reader", () => {
  it("classifies zero, one, and duplicate documents through the indexed bounded path", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run((ctx) => new ConvexResourceCatalogReader(ctx.db).loadSnapshot()),
    ).rejects.toMatchObject({
      code: "RESOURCE_CATALOG_UNINITIALIZED",
    });
    await t.run((ctx) => ctx.db.insert("resourceCatalogSnapshots", snapshot as never));
    expect(await t.run((ctx) => new ConvexResourceCatalogReader(ctx.db).loadSnapshot())).toEqual(
      snapshot,
    );
    await t.run((ctx) => ctx.db.insert("resourceCatalogSnapshots", snapshot as never));
    await expect(
      t.run((ctx) => new ConvexResourceCatalogReader(ctx.db).loadSnapshot()),
    ).rejects.toMatchObject({
      code: "RESOURCE_CATALOG_INVALID",
    });
  });

  it("maps empty and storage failures without leaking implementation detail", async () => {
    const t = convexTest(schema, modules);
    const empty = {
      ...snapshot,
      catalog: {
        ...snapshot.catalog,
        attributes: [],
        optionSets: [],
        naturalUnits: [],
        bindings: [],
        presentation: { attributeOrder: [], includeNaturalUnit: false },
      },
    };
    await t.run((ctx) => ctx.db.insert("resourceCatalogSnapshots", empty as never));
    await expect(
      t.run((ctx) => new ConvexResourceCatalogReader(ctx.db).loadSnapshot()),
    ).rejects.toMatchObject({
      code: "RESOURCE_CATALOG_UNINITIALIZED",
    });
    const db = {
      query: () => {
        throw new Error("storage");
      },
    } as never;
    await expect(new ConvexResourceCatalogReader(db).loadSnapshot()).rejects.toMatchObject({
      code: "RESOURCE_CATALOG_UNAVAILABLE",
    });
  });

  it("measures the payload under conservative bounds and uses take(2)", async () => {
    expect(measureResourceCatalog(cableCatalogV1)).toEqual({
      bytes: 3317,
      depth: 8,
      largestArray: 5,
      largestObject: 9,
    });
    expect(measureResourceCatalog(cableCatalogV1).bytes).toBeLessThanOrEqual(
      resourceCatalogBounds.maxBytes,
    );
    const calls: number[] = [];
    const db = {
      query: () => ({
        withIndex: () => ({
          take: (limit: number) => {
            calls.push(limit);
            return Promise.resolve([]);
          },
        }),
      }),
    } as never;
    await expect(new ConvexResourceCatalogReader(db).loadSnapshot()).rejects.toMatchObject({
      code: "RESOURCE_CATALOG_UNINITIALIZED",
    });
    expect(calls).toEqual([2]);
  });
});
