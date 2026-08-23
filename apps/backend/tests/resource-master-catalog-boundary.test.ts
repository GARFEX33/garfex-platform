import { describe, expect, it } from "vitest";
import { createResourceMaster } from "../src/resource-master/application/resource-master.js";
import type { PersistedResource } from "../src/resource-master/domain/types.js";
import type { ResourceMaster } from "../src/resource-master/public.js";
import { InMemoryResourceRepository } from "../src/resource-master/infrastructure/in-memory-resource-repository.js";
import { InMemoryResourceCatalogReader } from "./support/in-memory-resource-catalog.js";

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

const seededResource: PersistedResource = {
  resourceId: "resource-1",
  classCode: "MATERIAL",
  familyCode: "CONDUCTORES",
  typeCode: "CABLE",
  naturalUnitCode: "M",
  attributes: [],
  canonicalIdentity: "seed-identity",
  identityPolicyVersion: "v1",
  active: true,
  revision: 1,
  searchProjection: "cab cobre",
};

const operations = (master: ResourceMaster) =>
  [
    { name: "getTaxonomy", invoke: () => master.getTaxonomy() },
    {
      name: "getEffectiveResourceSchema",
      invoke: () =>
        master.getEffectiveResourceSchema({
          classCode: "MATERIAL",
          familyCode: "CONDUCTORES",
          typeCode: "CABLE",
        }),
    },
    {
      name: "getValidOptions",
      invoke: () => master.getValidOptions({ attributeCode: "insulation" }),
    },
    {
      name: "getNaturalUnits",
      invoke: () => master.getNaturalUnits({ familyCode: "CONDUCTORES" }),
    },
    { name: "createResource", invoke: () => master.createResource(valid) },
    {
      name: "updateNonIdentityData",
      invoke: () =>
        master.updateNonIdentityData({
          resourceId: seededResource.resourceId,
          expectedRevision: 1,
          naturalUnitCode: "M",
        }),
    },
    {
      name: "getResource",
      invoke: () => master.getResource({ resourceId: seededResource.resourceId }),
    },
    {
      name: "deactivateResource",
      invoke: () =>
        master.deactivateResource({ resourceId: seededResource.resourceId, expectedRevision: 1 }),
    },
    { name: "searchResources", invoke: () => master.searchResources({ terms: "cab", limit: 10 }) },
    {
      name: "describeResource",
      invoke: () => master.describeResource({ resourceId: seededResource.resourceId }),
    },
  ] as const;

const repository = async (count = 1) => {
  const value = new InMemoryResourceRepository();
  for (let index = 0; index < count; index += 1) {
    await value.createIfIdentityAbsent({
      ...seededResource,
      resourceId: `resource-${index + 1}`,
      canonicalIdentity: `seed-${index + 1}`,
    });
  }
  return value;
};

const messages = {
  RESOURCE_CATALOG_UNAVAILABLE: "resource catalog is unavailable",
  RESOURCE_CATALOG_UNINITIALIZED: "resource catalog is uninitialized",
  RESOURCE_CATALOG_INVALID: "resource catalog is invalid",
} as const;

describe("Resource Master catalog reader boundary", () => {
  it("loads one valid snapshot for every entrypoint", async () => {
    const reader = new InMemoryResourceCatalogReader("valid");
    const master = createResourceMaster({
      catalogReader: reader,
      repository: await repository(),
      createResourceId: () => "resource-created",
    });

    for (const operation of operations(master)) {
      const result = await operation.invoke();
      expect(result.ok, operation.name).toBe(true);
      expect(reader.loadCount, operation.name).toBe(1);
      reader.loadCount = 0;
    }
  });

  it.each([
    ["unavailable", "RESOURCE_CATALOG_UNAVAILABLE"],
    ["uninitialized", "RESOURCE_CATALOG_UNINITIALIZED"],
    ["empty", "RESOURCE_CATALOG_UNINITIALIZED"],
    ["invalid", "RESOURCE_CATALOG_INVALID"],
    ["thrown", "RESOURCE_CATALOG_UNAVAILABLE"],
  ] as const)("maps %s for all ten entrypoints without leaking details", async (state, code) => {
    for (const operation of operations(
      createResourceMaster({
        catalogReader: new InMemoryResourceCatalogReader(state),
        repository: await repository(),
      }),
    )) {
      const result = await operation.invoke();
      expect(result).toEqual({ ok: false, error: { code, message: messages[code] } });
      expect(JSON.stringify(result)).not.toContain("catalog-123");
    }
  });

  it("loads once while producing multiple search results", async () => {
    const reader = new InMemoryResourceCatalogReader();
    const master = createResourceMaster({
      catalogReader: reader,
      repository: await repository(3),
    });

    const result = await master.searchResources({ terms: "cab", limit: 3 });

    expect(result.ok && result.value.items).toHaveLength(3);
    expect(reader.loadCount).toBe(1);
  });

  it("acquires catalog before argument validation for every entrypoint", async () => {
    const invalidOperations = [
      (master: ResourceMaster) => master.getTaxonomy(),
      (master: ResourceMaster) => master.getEffectiveResourceSchema({} as never),
      (master: ResourceMaster) => master.getValidOptions({} as never),
      (master: ResourceMaster) => master.getNaturalUnits({} as never),
      (master: ResourceMaster) => master.createResource({} as never),
      (master: ResourceMaster) => master.updateNonIdentityData({} as never),
      (master: ResourceMaster) => master.getResource({} as never),
      (master: ResourceMaster) => master.deactivateResource({} as never),
      (master: ResourceMaster) => master.searchResources({ terms: "", limit: 0 }),
      (master: ResourceMaster) => master.describeResource({} as never),
    ];
    for (const invoke of invalidOperations) {
      const reader = new InMemoryResourceCatalogReader("unavailable");
      const master = createResourceMaster({
        catalogReader: reader,
        repository: await repository(),
      });
      expect(await invoke(master)).toEqual({
        ok: false,
        error: {
          code: "RESOURCE_CATALOG_UNAVAILABLE",
          message: messages.RESOURCE_CATALOG_UNAVAILABLE,
        },
      });
      expect(reader.loadCount).toBe(1);
    }
  });
});
