import { convexTest } from "convex-test";
import { describe, expect, it } from "vitest";
import { api } from "../convex/_generated/api.js";
import schema from "../convex/schema.js";

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
});
