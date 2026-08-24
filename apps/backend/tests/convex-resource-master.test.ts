import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../convex/_generated/api.js";
import schema from "../convex/schema.js";
import { cableCatalogV1 } from "../src/resource-master/deployment/cable-catalog-v1.js";
import { parseResourceCatalogPayload } from "../src/resource-master/domain/catalog-snapshot.js";

const modules = (
  import.meta as ImportMeta & {
    glob(pattern: string): Record<string, () => Promise<unknown>>;
  }
).glob("../convex/**/*.ts");
const valid = {
  classCode: "MATERIAL",
  familyCode: "CONDUCTORES",
  typeCode: "CABLE",
  naturalUnitCode: "M",
  attributes: {
    conductor_material: "COBRE",
    gauge: "12",
    insulation: "THW",
    color: "ROJO",
    voltage: "600V",
  },
};

describe("Convex Resource Master adapter", () => {
  it("serializes every catalog query through its registered return validator", async () => {
    const t = convexTest(schema, modules);
    expect(await t.query(api.resourceMaster.getTaxonomy, {})).toMatchObject({
      ok: true,
      value: [{ code: "MATERIAL", families: [{ code: "CONDUCTORES" }] }],
    });
    expect(
      await t.query(api.resourceMaster.getEffectiveResourceSchema, {
        classCode: valid.classCode,
        familyCode: valid.familyCode,
        typeCode: valid.typeCode,
      }),
    ).toMatchObject({
      ok: true,
      value: { attributes: expect.arrayContaining([expect.objectContaining({ code: "gauge" })]) },
    });
    expect(
      await t.query(api.resourceMaster.getValidOptions, { attributeCode: "insulation" }),
    ).toMatchObject({
      ok: true,
      value: expect.arrayContaining([expect.objectContaining({ code: "THW" })]),
    });
    expect(
      await t.query(api.resourceMaster.getNaturalUnits, { familyCode: "CONDUCTORES" }),
    ).toMatchObject({ ok: true, value: { suggested: { code: "M" } } });
  });

  it("keeps staged catalog data unserved before the authority cutover", async () => {
    const t = convexTest(schema, modules);
    const staged = parseResourceCatalogPayload({
      ...cableCatalogV1,
      catalog: {
        ...cableCatalogV1.catalog,
        family: { ...cableCatalogV1.catalog.family, name: "staged-only" },
      },
    });
    await t.run(async (ctx) =>
      ctx.db.insert("resourceCatalogSnapshots", { ...staged, revision: 1 } as never),
    );
    expect(await t.query(api.resourceMaster.getTaxonomy, {})).toMatchObject({
      ok: true,
      value: [{ families: [{ name: "Conductores" }] }],
    });
    expect(
      await t.run(async (ctx) => ctx.db.query("resourceCatalogSnapshots").take(2)),
    ).toHaveLength(1);
  });

  it("persists header and attributes atomically and rejects indexed duplicates", async () => {
    const t = convexTest(schema, modules);
    const created = await t.mutation(api.resourceMaster.createResource, valid);
    expect(created).toMatchObject({ ok: true, value: { revision: 1 } });
    const duplicate = await t.mutation(api.resourceMaster.createResource, {
      ...valid,
      attributes: { ...valid.attributes, gauge: "+12" },
    });
    expect(duplicate).toMatchObject({ ok: false, error: { code: "DUPLICATE" } });
    const counts = await t.run(async (ctx) => ({
      resources: (await ctx.db.query("resources").collect()).length,
      attributes: (await ctx.db.query("resourceAttributes").collect()).length,
    }));
    expect(counts).toEqual({ resources: 1, attributes: 5 });
  });

  it("gets, describes and searches through real registered queries", async () => {
    const t = convexTest(schema, modules);
    const created = await t.mutation(api.resourceMaster.createResource, valid);
    if (!created.ok) throw new Error("expected create success");
    expect(
      await t.query(api.resourceMaster.getResource, { resourceId: created.value.resourceId }),
    ).toEqual(created);
    expect(
      await t.query(api.resourceMaster.describeResource, { resourceId: created.value.resourceId }),
    ).toMatchObject({ ok: true, value: { description: expect.stringContaining("THW") } });
    expect(
      await t.query(api.resourceMaster.searchResources, { terms: "cab cobre", limit: 10 }),
    ).toMatchObject({
      ok: true,
      value: { items: [expect.objectContaining({ resourceId: created.value.resourceId })] },
    });
  });

  it("atomically updates and deactivates persisted resources with revision guards", async () => {
    const t = convexTest(schema, modules);
    expect(
      await t.mutation(api.resourceMaster.updateNonIdentityData, {
        resourceId: "missing",
        expectedRevision: 1,
        naturalUnitCode: "M",
      }),
    ).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
    expect(
      await t.mutation(api.resourceMaster.deactivateResource, {
        resourceId: "missing",
        expectedRevision: 1,
      }),
    ).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });

    const created = await t.mutation(api.resourceMaster.createResource, valid);
    if (!created.ok) throw new Error("expected create success");

    expect(
      await t.mutation(api.resourceMaster.updateNonIdentityData, {
        resourceId: created.value.resourceId,
        expectedRevision: 0,
        naturalUnitCode: "M",
      }),
    ).toMatchObject({ ok: false, error: { code: "CONFLICT", currentRevision: 1 } });
    const updated = await t.mutation(api.resourceMaster.updateNonIdentityData, {
      resourceId: created.value.resourceId,
      expectedRevision: 1,
      naturalUnitCode: "ROLLO",
    });
    expect(updated).toMatchObject({
      ok: true,
      value: { naturalUnitCode: "ROLLO", revision: 2, active: true },
    });
    const deactivated = await t.mutation(api.resourceMaster.deactivateResource, {
      resourceId: created.value.resourceId,
      expectedRevision: 2,
    });
    expect(deactivated).toMatchObject({ ok: true, value: { active: false, revision: 3 } });
    expect(
      await t.mutation(api.resourceMaster.updateNonIdentityData, {
        resourceId: created.value.resourceId,
        expectedRevision: 3,
        naturalUnitCode: "M",
      }),
    ).toMatchObject({ ok: false, error: { code: "INVALID_LIFECYCLE" } });

    const persisted = await t.run(async (ctx) => {
      const header = await ctx.db
        .query("resources")
        .withIndex("by_resource_id", (query) => query.eq("resourceId", created.value.resourceId))
        .unique();
      const attributes = await ctx.db
        .query("resourceAttributes")
        .withIndex("by_resource_code", (query) => query.eq("resourceId", created.value.resourceId))
        .collect();
      return { header, attributes };
    });
    expect(persisted.header).toMatchObject({
      resourceId: created.value.resourceId,
      canonicalIdentity: created.value.canonicalIdentity,
      naturalUnitCode: "ROLLO",
      active: false,
      revision: 3,
    });
    expect(persisted.attributes).toHaveLength(created.value.attributes.length);
    expect(
      await t.query(api.resourceMaster.getResource, { resourceId: created.value.resourceId }),
    ).toEqual(deactivated);
    expect(
      await t.query(api.resourceMaster.searchResources, {
        terms: "cab",
        lifecycle: "INACTIVE",
        limit: 10,
      }),
    ).toMatchObject({
      ok: true,
      value: { items: [expect.objectContaining({ resourceId: created.value.resourceId })] },
    });
  });

  it("uses query-bound keyset cursors and continues across repository batches", async () => {
    const t = convexTest(schema, modules);
    await t.run(async (ctx) => {
      for (let index = 1; index <= 205; index += 1) {
        const ordinal = String(index).padStart(3, "0");
        await ctx.db.insert("resources", {
          resourceId: `resource-${ordinal}`,
          classCode: "MATERIAL",
          familyCode: "CONDUCTORES",
          typeCode: "CABLE",
          naturalUnitCode: "M",
          canonicalIdentity: `identity-${ordinal}`,
          identityPolicyVersion: "v1",
          active: true,
          revision: 1,
          searchProjection: index === 205 ? "resource cab cobre" : "resource",
        });
      }
    });

    expect(
      await t.query(api.resourceMaster.searchResources, { terms: "cab cobre", limit: 1 }),
    ).toMatchObject({
      ok: true,
      value: { items: [expect.objectContaining({ resourceId: "resource-205" })], cursor: null },
    });

    const first = await t.query(api.resourceMaster.searchResources, {
      terms: "resource",
      lifecycle: "ACTIVE",
      limit: 1,
    });
    if (!first.ok || first.value.cursor === null) throw new Error("expected a cursor");
    expect(
      await t.query(api.resourceMaster.searchResources, {
        terms: "RESOURCE",
        lifecycle: "ACTIVE",
        limit: 1,
        cursor: first.value.cursor,
      }),
    ).toMatchObject({ ok: true });
    expect(
      await t.query(api.resourceMaster.searchResources, {
        terms: "resource",
        lifecycle: "ALL",
        limit: 1,
        cursor: first.value.cursor,
      }),
    ).toMatchObject({ ok: false, error: { code: "INVALID_ARGUMENT" } });
    expect(
      await t.query(api.resourceMaster.searchResources, {
        terms: "different",
        lifecycle: "ACTIVE",
        limit: 1,
        cursor: first.value.cursor,
      }),
    ).toMatchObject({ ok: false, error: { code: "INVALID_ARGUMENT" } });
  });
});
