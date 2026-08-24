import { describe, expect, it } from "vitest";
import { createResourceMaster } from "../src/resource-master/application/resource-master.js";
import { cableCatalog } from "./fixtures/cable-catalog.js";
import { InMemoryResourceRepository } from "../src/resource-master/infrastructure/in-memory-resource-repository.js";
import type { PersistedResource } from "../src/resource-master/domain/types.js";
import {
  InMemoryResourceCatalogReader,
  validResourceCatalogSnapshot,
} from "./support/in-memory-resource-catalog.js";

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
} as const;

const setup = () => {
  let sequence = 0;
  const repository = new InMemoryResourceRepository();
  const master = createResourceMaster({
    catalogReader: new InMemoryResourceCatalogReader(),
    repository,
    createResourceId: () => `00000000-0000-4000-8000-${String(++sequence).padStart(12, "0")}`,
  });
  return { master, repository };
};

describe("Resource Master application", () => {
  it("keeps option ownership on applicability bindings rather than attribute definitions", () => {
    for (const definition of cableCatalog.attributes) {
      expect(definition).not.toHaveProperty("optionSetCode");
      expect(definition).not.toHaveProperty("quantityUnitCodes");
    }
    expect(
      cableCatalog.bindings.find((binding) => binding.attributeCode === "insulation"),
    ).toMatchObject({ optionSetCode: "INSULATION" });
  });

  it("exposes exactly the Cable taxonomy, effective schema, options and units", async () => {
    const { master } = setup();
    const taxonomy = await master.getTaxonomy();
    expect(taxonomy).toMatchObject({ ok: true, value: [{ code: "MATERIAL" }] });
    const schema = await master.getEffectiveResourceSchema({
      classCode: "MATERIAL",
      familyCode: "CONDUCTORES",
      typeCode: "CABLE",
    });
    expect(schema.ok && schema.value.attributes).toHaveLength(5);
    expect(await master.getValidOptions({ attributeCode: "insulation" })).toMatchObject({
      ok: true,
      value: expect.arrayContaining([
        expect.objectContaining({ code: "THW" }),
        expect.objectContaining({ code: "DESNUDO" }),
      ]),
    });
    expect(await master.getNaturalUnits({ familyCode: "CONDUCTORES" })).toMatchObject({
      ok: true,
      value: { allowed: expect.arrayContaining([expect.objectContaining({ code: "M" })]) },
    });
  });

  it("creates, gets and describes a valid resource while preserving historical identity", async () => {
    const { master } = setup();
    const created = await master.createResource(valid);
    expect(created).toMatchObject({
      ok: true,
      value: { identityPolicyVersion: "v1", revision: 1 },
    });
    if (!created.ok) throw new Error("expected create success");
    expect(created.value.resourceId).toMatch(/^[0-9a-f-]{36}$/);
    const fetched = await master.getResource({ resourceId: created.value.resourceId });
    expect(fetched).toEqual(created);
    const described = await master.describeResource({ resourceId: created.value.resourceId });
    expect(described).toMatchObject({
      ok: true,
      value: { description: expect.stringContaining("THW") },
    });
  });

  it("rejects missing required, invalid options, forbidden payload and naked N/A payload", async () => {
    const { master } = setup();
    const missing = await master.createResource({
      ...valid,
      attributes: { ...valid.attributes, gauge: undefined },
    });
    expect(missing).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
    const invalid = await master.createResource({
      ...valid,
      attributes: { ...valid.attributes, insulation: "PVC" },
    });
    expect(invalid).toMatchObject({ ok: false, error: { code: "INVALID_REFERENCE" } });
    const desnudo = await master.createResource({
      ...valid,
      attributes: { ...valid.attributes, insulation: "DESNUDO", color: "ROJO", voltage: "600V" },
    });
    expect(desnudo).toMatchObject({ ok: false, error: { code: "VALIDATION" } });
  });

  it("derives naked cable attributes as not applicable without allowing payload", async () => {
    const { master } = setup();
    const created = await master.createResource({
      ...valid,
      attributes: {
        conductor_material: "COBRE",
        gauge: "12",
        insulation: "DESNUDO",
      },
    });
    expect(created).toMatchObject({ ok: true });
    expect(
      created.ok && created.value.attributes.map((attribute) => attribute.attributeCode),
    ).toEqual(
      ["color", "conductor_material", "gauge", "insulation", "voltage"].filter(
        (code) => !["color", "voltage"].includes(code),
      ),
    );
  });

  it("requires an allowed active natural unit and excludes it from identity", async () => {
    const { master } = setup();
    expect(await master.createResource({ ...valid, naturalUnitCode: "" })).toMatchObject({
      ok: false,
      error: { code: "VALIDATION" },
    });
    expect(await master.createResource({ ...valid, naturalUnitCode: "CM" })).toMatchObject({
      ok: false,
      error: { code: "INVALID_REFERENCE" },
    });
    const first = await master.createResource(valid);
    expect(first.ok).toBe(true);
    const equivalent = await master.createResource({ ...valid, naturalUnitCode: "ROLLO" });
    expect(equivalent).toMatchObject({
      ok: false,
      error: { code: "DUPLICATE", existingResourceId: first.ok ? first.value.resourceId : "" },
    });
  });

  it("reports malformed duplicate binding configuration as a deterministic integrity error", async () => {
    const original = cableCatalog.bindings[0];
    if (original === undefined) throw new Error("expected catalog binding");
    const duplicate = { ...original, id: `${original.id}-duplicate` };
    const remaining = cableCatalog.bindings.slice(1);
    const results = await Promise.all(
      [
        [original, duplicate, ...remaining],
        [duplicate, original, ...remaining],
      ].map((bindings) =>
        createResourceMaster({
          catalogReader: new InMemoryResourceCatalogReader("valid", {
            ...validResourceCatalogSnapshot,
            catalog: { ...validResourceCatalogSnapshot.catalog, bindings },
          }),
          repository: new InMemoryResourceRepository(),
        }).getEffectiveResourceSchema({
          classCode: "MATERIAL",
          familyCode: "CONDUCTORES",
          typeCode: "CABLE",
        }),
      ),
    );
    expect(results).toEqual([
      { ok: false, error: { code: "INTEGRITY", message: expect.any(String) } },
      { ok: false, error: { code: "INTEGRITY", message: expect.any(String) } },
    ]);
    expect(results[0]).toEqual(results[1]);
  });

  it("canonicalizes equivalent identity and safely reports duplicates", async () => {
    const { master } = setup();
    const first = await master.createResource(valid);
    const duplicate = await master.createResource({
      ...valid,
      attributes: { ...valid.attributes, gauge: "+12" },
    });
    expect(duplicate).toMatchObject({
      ok: false,
      error: { code: "DUPLICATE", existingResourceId: first.ok ? first.value.resourceId : "" },
    });
  });

  it.each(["cab", "th", "12", "cobre"])("finds Cable independently by %s", async (term) => {
    const { master } = setup();
    await master.createResource(valid);
    const result = await master.searchResources({ terms: term, limit: 10 });
    expect(result).toMatchObject({ ok: true, value: { items: [expect.any(Object)] } });
  });

  it("ANDs normalized search tokens and validates bounded limits", async () => {
    const { master } = setup();
    await master.createResource(valid);
    expect(await master.searchResources({ terms: "CÂB cobre 12", limit: 10 })).toMatchObject({
      ok: true,
      value: { items: [expect.any(Object)] },
    });
    expect(await master.searchResources({ terms: "cab aluminio", limit: 10 })).toMatchObject({
      ok: true,
      value: { items: [] },
    });
    expect(await master.searchResources({ terms: "cab", limit: 0 })).toMatchObject({
      ok: false,
      error: { code: "INVALID_ARGUMENT" },
    });
  });

  it("updates only NaturalUnit while preserving identity and enforcing optimistic revision", async () => {
    const { master } = setup();
    const created = await master.createResource(valid);
    if (!created.ok) throw new Error("expected create success");

    const updated = await master.updateNonIdentityData({
      resourceId: created.value.resourceId,
      expectedRevision: 1,
      naturalUnitCode: " rollo ",
    });
    expect(updated).toMatchObject({
      ok: true,
      value: {
        resourceId: created.value.resourceId,
        naturalUnitCode: "ROLLO",
        canonicalIdentity: created.value.canonicalIdentity,
        identityPolicyVersion: "v1",
        attributes: created.value.attributes,
        revision: 2,
        active: true,
      },
    });

    expect(
      await master.updateNonIdentityData({
        resourceId: created.value.resourceId,
        expectedRevision: 2,
        naturalUnitCode: "CM",
      }),
    ).toMatchObject({ ok: false, error: { code: "INVALID_REFERENCE" } });
    expect(await master.getResource({ resourceId: created.value.resourceId })).toMatchObject({
      ok: true,
      value: { naturalUnitCode: "ROLLO", revision: 2 },
    });
  });

  it("checks revision before update no-op evaluation", async () => {
    const { master } = setup();
    const created = await master.createResource(valid);
    if (!created.ok) throw new Error("expected create success");

    expect(
      await master.updateNonIdentityData({
        resourceId: created.value.resourceId,
        expectedRevision: 1,
        naturalUnitCode: "M",
      }),
    ).toEqual(created);
    expect(
      await master.updateNonIdentityData({
        resourceId: created.value.resourceId,
        expectedRevision: 0,
        naturalUnitCode: "ROLLO",
      }),
    ).toMatchObject({ ok: false, error: { code: "CONFLICT", currentRevision: 1 } });
    expect(
      await master.updateNonIdentityData({
        resourceId: created.value.resourceId,
        expectedRevision: 0,
        naturalUnitCode: "M",
      }),
    ).toMatchObject({ ok: false, error: { code: "CONFLICT", currentRevision: 1 } });
  });

  it("reports missing update/deactivate targets and rejects updates to inactive resources", async () => {
    const { master } = setup();

    expect(
      await master.updateNonIdentityData({
        resourceId: "missing",
        expectedRevision: 1,
        naturalUnitCode: "M",
      }),
    ).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });
    expect(
      await master.deactivateResource({ resourceId: "missing", expectedRevision: 1 }),
    ).toMatchObject({ ok: false, error: { code: "NOT_FOUND" } });

    const created = await master.createResource(valid);
    if (!created.ok) throw new Error("expected create success");
    await master.deactivateResource({ resourceId: created.value.resourceId, expectedRevision: 1 });
    expect(
      await master.updateNonIdentityData({
        resourceId: created.value.resourceId,
        expectedRevision: 2,
        naturalUnitCode: "ROLLO",
      }),
    ).toMatchObject({ ok: false, error: { code: "INVALID_LIFECYCLE" } });
  });

  it("deactivates once and keeps inactive resources historically readable", async () => {
    const { master } = setup();
    const created = await master.createResource(valid);
    if (!created.ok) throw new Error("expected create success");

    expect(
      await master.deactivateResource({
        resourceId: created.value.resourceId,
        expectedRevision: 0,
      }),
    ).toMatchObject({ ok: false, error: { code: "CONFLICT", currentRevision: 1 } });
    const deactivated = await master.deactivateResource({
      resourceId: created.value.resourceId,
      expectedRevision: 1,
    });
    expect(deactivated).toMatchObject({
      ok: true,
      value: {
        resourceId: created.value.resourceId,
        canonicalIdentity: created.value.canonicalIdentity,
        attributes: created.value.attributes,
        active: false,
        revision: 2,
      },
    });
    expect(await master.getResource({ resourceId: created.value.resourceId })).toEqual(deactivated);
    expect(await master.describeResource({ resourceId: created.value.resourceId })).toMatchObject({
      ok: true,
      value: { description: expect.stringContaining("THW") },
    });
    expect(
      await master.deactivateResource({
        resourceId: created.value.resourceId,
        expectedRevision: 2,
      }),
    ).toMatchObject({ ok: false, error: { code: "INVALID_LIFECYCLE" } });
  });

  it("filters search by lifecycle and keeps order/cursors stable within each set", async () => {
    const { master } = setup();
    const first = await master.createResource(valid);
    const second = await master.createResource({
      ...valid,
      attributes: { ...valid.attributes, color: "NEGRO" },
    });
    const third = await master.createResource({
      ...valid,
      attributes: { ...valid.attributes, color: "BLANCO" },
    });
    if (!first.ok || !second.ok || !third.ok) throw new Error("expected create success");
    await master.deactivateResource({ resourceId: second.value.resourceId, expectedRevision: 1 });

    const activeDefault = await master.searchResources({ terms: "cab", limit: 10 });
    expect(activeDefault.ok && activeDefault.value.items.map((item) => item.resourceId)).toEqual([
      first.value.resourceId,
      third.value.resourceId,
    ]);
    const inactive = await master.searchResources({
      terms: "cab",
      lifecycle: "INACTIVE",
      limit: 10,
    });
    expect(inactive.ok && inactive.value.items.map((item) => item.resourceId)).toEqual([
      second.value.resourceId,
    ]);

    const allIds: string[] = [];
    let cursor: string | null = null;
    do {
      const page = await master.searchResources({
        terms: "cab",
        lifecycle: "ALL",
        limit: 1,
        cursor,
      });
      if (!page.ok) throw new Error("expected search success");
      allIds.push(...page.value.items.map((item) => item.resourceId));
      cursor = page.value.cursor;
    } while (cursor !== null);
    expect(allIds).toEqual(
      [first.value.resourceId, second.value.resourceId, third.value.resourceId].sort(),
    );
  });

  it("binds cursors to lifecycle and canonical normalized term sequences", async () => {
    const { master } = setup();
    await master.createResource(valid);
    await master.createResource({
      ...valid,
      attributes: { ...valid.attributes, color: "NEGRO" },
    });

    const first = await master.searchResources({ terms: " CÂB   CÓBRE ", limit: 1 });
    if (!first.ok || first.value.cursor === null) throw new Error("expected a cursor");

    expect(
      await master.searchResources({ terms: "cab cobre", limit: 1, cursor: first.value.cursor }),
    ).toMatchObject({ ok: true });
    expect(
      await master.searchResources({ terms: "cab aluminio", limit: 1, cursor: first.value.cursor }),
    ).toMatchObject({ ok: false, error: { code: "INVALID_ARGUMENT" } });
    expect(
      await master.searchResources({
        terms: "cab cobre",
        lifecycle: "ALL",
        limit: 1,
        cursor: first.value.cursor,
      }),
    ).toMatchObject({ ok: false, error: { code: "INVALID_ARGUMENT" } });
    expect(
      await master.searchResources({ terms: "cab cobre", limit: 1, cursor: "v2:broken" }),
    ).toMatchObject({ ok: false, error: { code: "INVALID_ARGUMENT" } });
  });

  it("completes deterministic keyset pagination beyond 1000 resources", async () => {
    const repository = new InMemoryResourceRepository();
    const resources = Array.from({ length: 1_005 }, (_, index): PersistedResource => {
      const ordinal = String(index + 1).padStart(4, "0");
      return {
        resourceId: `resource-${ordinal}`,
        classCode: "MATERIAL",
        familyCode: "CONDUCTORES",
        typeCode: "CABLE",
        naturalUnitCode: "M",
        attributes: [],
        canonicalIdentity: `identity-${ordinal}`,
        identityPolicyVersion: "v1",
        active: true,
        revision: 1,
        searchProjection: "cab",
      };
    });
    await Promise.all(resources.map((resource) => repository.createIfIdentityAbsent(resource)));
    const master = createResourceMaster({
      catalogReader: new InMemoryResourceCatalogReader(),
      repository,
    });

    const ids: string[] = [];
    let cursor: string | null = null;
    do {
      const page = await master.searchResources({ terms: "cab", limit: 50, cursor });
      if (!page.ok) throw new Error(`pagination failed after ${ids.length} resources`);
      ids.push(...page.value.items.map((item) => item.resourceId));
      cursor = page.value.cursor;
    } while (cursor !== null);

    expect(ids).toEqual(resources.map((resource) => resource.resourceId));
  });
});
