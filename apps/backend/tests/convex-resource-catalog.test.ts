import { convexTest } from "convex-test";
import type { Infer } from "convex/values";
import type { FunctionReference } from "convex/server";
import { describe, expect, it } from "vitest";
import { api, internal } from "../convex/_generated/api.js";
import type { DatabaseReader, DatabaseWriter } from "../convex/_generated/server.js";
import schema from "../convex/schema.js";
import {
  measureResourceCatalog,
  parseResourceCatalogPayload,
  resourceCatalogBounds,
  resourceCatalogPayloadEquals,
  resourceCatalogSnapshotEquals,
} from "../src/resource-master/domain/catalog-snapshot.js";
import { cableCatalogV1 } from "../src/resource-master/deployment/cable-catalog-v1.js";
import type { installResultValidator } from "../convex/resourceCatalogValidators.js";
import type { InstallResourceCatalogResult } from "../src/resource-master/application/ports/resource-catalog-installer.js";
import { cableCatalog as fixtureCatalog } from "./fixtures/cable-catalog.js";
import {
  ConvexResourceCatalogInstaller,
  ConvexResourceCatalogReader,
} from "../src/resource-master/infrastructure/convex-resource-catalog.js";

const modules = (
  import.meta as ImportMeta & {
    glob(pattern: string): Record<string, () => Promise<unknown>>;
  }
).glob("../convex/**/*.ts");
type InstallRef = FunctionReference<
  "mutation",
  "internal",
  { expectedRevision: number },
  InstallResourceCatalogResult
>;
const installRef: InstallRef = internal.resourceCatalogBootstrap.installCableCatalogV1;
type Assert<T extends true> = T;
type ValidatorOutputMatchesPort =
  Infer<typeof installResultValidator> extends InstallResourceCatalogResult ? true : false;
type InstallValidatorMatchesPort = Assert<ValidatorOutputMatchesPort>;
const installValidatorMatchesPort: InstallValidatorMatchesPort = true;
void installValidatorMatchesPort;
const payload = parseResourceCatalogPayload(cableCatalogV1);
const snapshot = { ...payload, revision: 1 };
const readDocuments = (db: DatabaseReader) =>
  db
    .query("resourceCatalogSnapshots")
    .withIndex("by_catalog_key", (q) => q.eq("catalogKey", "resource-master"))
    .take(2);
const replacement = (name: string) => ({
  ...payload,
  catalog: { ...payload.catalog, family: { ...payload.catalog.family, name } },
});

describe("Convex persistent Resource Catalog", () => {
  it("reads a singleton through the indexed bounded path and classifies 0/1/>1", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run((ctx) => new ConvexResourceCatalogReader(ctx.db).loadSnapshot()),
    ).rejects.toMatchObject({ code: "RESOURCE_CATALOG_UNINITIALIZED" });
    await t.run((ctx) => ctx.db.insert("resourceCatalogSnapshots", snapshot as never));
    expect(await t.run((ctx) => new ConvexResourceCatalogReader(ctx.db).loadSnapshot())).toEqual(
      snapshot,
    );
    await t.run((ctx) => ctx.db.insert("resourceCatalogSnapshots", snapshot as never));
    await expect(
      t.run((ctx) => new ConvexResourceCatalogReader(ctx.db).loadSnapshot()),
    ).rejects.toMatchObject({ code: "RESOURCE_CATALOG_INVALID" });
    expect(await t.run((ctx) => readDocuments(ctx.db))).toHaveLength(2);
  });

  it("maps empty aggregates and storage failures distinctly", async () => {
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
    ).rejects.toMatchObject({ code: "RESOURCE_CATALOG_UNINITIALIZED" });
    const db = {
      query: () => {
        throw new Error("storage");
      },
    } as never;
    await expect(new ConvexResourceCatalogReader(db).loadSnapshot()).rejects.toMatchObject({
      code: "RESOURCE_CATALOG_UNAVAILABLE",
    });
  });

  it("rejects transport/storage shapes and enforces the four aggregate bounds", async () => {
    const t = convexTest(schema, modules);
    await expect(
      t.run((ctx) =>
        ctx.db.insert("resourceCatalogSnapshots", {
          ...snapshot,
          catalog: { ...snapshot.catalog, attributes: [{ code: "bad" }] },
        } as never),
      ),
    ).rejects.toThrow();
    const measured = measureResourceCatalog(cableCatalogV1);
    expect(measured).toEqual({ bytes: 3317, depth: 8, largestArray: 5, largestObject: 9 });
    expect(measured.bytes).toBeLessThanOrEqual(resourceCatalogBounds.maxBytes);
  });

  it("proves independent v1 inputs and a bounded indexed read", async () => {
    expect(
      resourceCatalogPayloadEquals({ ...payload, catalog: fixtureCatalog }, cableCatalogV1),
    ).toBe(true);
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

  it("installs internally, replays before stale OCC, replaces, and preserves equivalence", async () => {
    const t = convexTest(schema, modules);
    expect(await t.mutation(installRef, { expectedRevision: 0 })).toMatchObject({
      kind: "INSTALLED",
      snapshot: { revision: 1 },
    });
    expect(await t.mutation(installRef, { expectedRevision: 99 })).toMatchObject({
      kind: "UNCHANGED",
      snapshot: { revision: 1 },
    });
    const installed = await t.run((ctx) => new ConvexResourceCatalogReader(ctx.db).loadSnapshot());
    expect(resourceCatalogSnapshotEquals(installed, snapshot)).toBe(true);
    expect("resourceCatalogBootstrap" in api).toBe(false);
    expect(
      await t.run((ctx) =>
        new ConvexResourceCatalogInstaller(ctx.db).install({
          expectedRevision: 1,
          candidate: replacement("Conductores actualizados"),
        }),
      ),
    ).toMatchObject({ kind: "INSTALLED", snapshot: { revision: 2 } });
    await expect(
      t.run((ctx) =>
        new ConvexResourceCatalogInstaller(ctx.db).install({
          expectedRevision: 1,
          candidate: replacement("stale"),
        }),
      ),
    ).resolves.toMatchObject({ kind: "CONFLICT", currentRevision: 2 });
  });

  it("rejects immutable stable-code changes without replacing authority", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(installRef, { expectedRevision: 0 });
    const candidate = {
      ...payload,
      catalog: {
        ...payload.catalog,
        classDefinition: { ...payload.catalog.classDefinition, code: "OTHER" },
      },
    };
    await expect(
      t.run((ctx) =>
        new ConvexResourceCatalogInstaller(ctx.db).install({ expectedRevision: 1, candidate }),
      ),
    ).rejects.toThrow();
    expect(await t.run((ctx) => readDocuments(ctx.db))).toHaveLength(1);
  });

  it("rejects invalid candidates before write and rolls back a failed mutation", async () => {
    const t = convexTest(schema, modules);
    const invalidCandidate = {
      ...payload,
      catalog: { ...payload.catalog, family: { ...payload.catalog.family, classCode: "wrong" } },
    };
    await expect(
      t.run((ctx) =>
        new ConvexResourceCatalogInstaller(ctx.db).install({
          expectedRevision: 0,
          candidate: invalidCandidate,
        }),
      ),
    ).rejects.toThrow();
    expect(await t.run((ctx) => readDocuments(ctx.db))).toHaveLength(0);
    await expect(
      t.mutation(async (ctx) => {
        await new ConvexResourceCatalogInstaller(ctx.db).install({
          expectedRevision: 0,
          candidate: payload,
        });
        throw new Error("force rollback");
      }),
    ).rejects.toThrow("force rollback");
    expect(await t.run((ctx) => readDocuments(ctx.db))).toHaveLength(0);
  });

  it("keeps stale non-replay conflicts read-only and preserves inactive history", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(installRef, { expectedRevision: 0 });
    const stale = await t.run((ctx) =>
      new ConvexResourceCatalogInstaller(ctx.db).install({
        expectedRevision: 0,
        candidate: replacement("stale replacement"),
      }),
    );
    expect(stale).toEqual({ kind: "CONFLICT", currentRevision: 1 });
    const inactiveOption = {
      ...payload,
      catalog: {
        ...payload.catalog,
        optionSets: payload.catalog.optionSets.map((set) =>
          set.code === "CONDUCTOR_MATERIAL"
            ? {
                ...set,
                options: set.options.map((option) =>
                  option.code === "ALUMINIO" ? { ...option, active: false } : option,
                ),
              }
            : set,
        ),
      },
    };
    const installed = await t.run((ctx) =>
      new ConvexResourceCatalogInstaller(ctx.db).install({
        expectedRevision: 1,
        candidate: inactiveOption,
      }),
    );
    expect(installed).toMatchObject({ kind: "INSTALLED", snapshot: { revision: 2 } });
    const loaded = await t.run((ctx) => new ConvexResourceCatalogReader(ctx.db).loadSnapshot());
    expect(loaded.catalog.optionSets[0]?.options).toContainEqual({
      code: "ALUMINIO",
      label: "Aluminio",
      active: false,
    });
    expect(loaded.catalog.optionSets[0]?.options).toContainEqual({
      code: "COBRE",
      label: "Cobre",
      active: true,
    });
  });

  it("rejects stable ownership changes without changing the current revision", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(installRef, { expectedRevision: 0 });
    const candidate = {
      ...payload,
      catalog: {
        ...payload.catalog,
        optionSets: payload.catalog.optionSets.map((set) =>
          set.code === "INSULATION" ? { ...set, attributeCode: "color" } : set,
        ),
      },
    };
    await expect(
      t.run((ctx) =>
        new ConvexResourceCatalogInstaller(ctx.db).install({
          expectedRevision: 1,
          candidate,
        }),
      ),
    ).rejects.toMatchObject({ kind: "INVALID" });
    const current = await t.run((ctx) => new ConvexResourceCatalogReader(ctx.db).loadSnapshot());
    expect(current.revision).toBe(1);
    expect(current.catalog.optionSets.find((set) => set.code === "INSULATION")?.attributeCode).toBe(
      "insulation",
    );
  });

  it("aborts and rolls back when read-back equivalence fails", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(installRef, { expectedRevision: 0 });
    await expect(
      t.mutation(async (ctx) => {
        const corruptingWriter = {
          query: ctx.db.query.bind(ctx.db),
          insert: ctx.db.insert.bind(ctx.db),
          replace: async (table: unknown, id: unknown, value: unknown) =>
            ctx.db.replace(
              table as never,
              id as never,
              {
                ...(value as Record<string, unknown>),
                sourceVersion: "corrupted-read-back",
              } as never,
            ),
        } as unknown as DatabaseWriter;
        await new ConvexResourceCatalogInstaller(corruptingWriter).install({
          expectedRevision: 1,
          candidate: replacement("read-back mismatch"),
        });
      }),
    ).rejects.toThrow("read-back equivalence failed");
    const current = await t.run((ctx) => new ConvexResourceCatalogReader(ctx.db).loadSnapshot());
    expect(current).toEqual(snapshot);
  });
});
