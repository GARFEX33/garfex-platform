import { describe, expect, it, vi } from "vitest";
import { createAuthenticationComposition } from "../src/auth/composition.js";
import { parseExternalOperationIdentifier } from "../src/external-garfex-boundary/client-facing/validation.js";
import * as composition from "../src/external-garfex-boundary/composition.js";
import {
  createTrustedActorResolver,
  type TrustedActorResolver,
} from "../src/external-garfex-boundary/trusted/identity.js";
import {
  handleCreateResource,
  handleDeactivateResource,
  handleUpdateNonIdentityData,
} from "../src/external-garfex-boundary/trusted/mutation-operations.js";
import {
  handleDescribeResource,
  handleGetEffectiveResourceSchema,
  handleGetNaturalUnits,
  handleGetResource,
  handleGetTaxonomy,
  handleGetValidOptions,
  handleSearchResources,
} from "../src/external-garfex-boundary/trusted/read-operations.js";
import type { ResourceRepository } from "../src/resource-master/application/ports/resource-repository.js";
import { createResourceMaster } from "../src/resource-master/application/resource-master.js";
import type { ActorContext, ActorId, ResourceMaster } from "../src/resource-master/public.js";

const actor: ActorContext = {
  actorId: "composition-actor" as ActorId,
  capabilities: new Set(["resource:read"]),
};

const requests = {
  getTaxonomy: {},
  getEffectiveResourceSchema: {
    classCode: "hardware",
    familyCode: "wire",
    typeCode: "solid-wire",
  },
  getValidOptions: { attributeCode: "finish" },
  getNaturalUnits: { familyCode: "wire" },
  getResource: { resourceId: "resource-1" },
  searchResources: { terms: "wire" },
  describeResource: { resourceId: "resource-1" },
} as const;

const taxonomy = [{ code: "hardware", name: "Hardware", families: [] }];
const schema = { attributes: [] };
const options = [{ code: "bare", label: "Bare" }];
const units = {
  allowed: [{ code: "meter", name: "Meter" }],
  suggested: { code: "meter", name: "Meter" },
};
const resource = {
  resourceId: "resource-1",
  classCode: "hardware",
  familyCode: "wire",
  typeCode: "solid-wire",
  naturalUnitCode: "meter",
  attributes: [],
  canonicalIdentity: "hardware|wire|solid-wire",
  identityPolicyVersion: "v1" as const,
  active: true,
  revision: 3,
};
const search = { items: [], cursor: null };
const description = { resourceId: "resource-1", description: "Hardware Wire" };

type ReadMethodName =
  | "getTaxonomy"
  | "getEffectiveResourceSchema"
  | "getValidOptions"
  | "getNaturalUnits"
  | "getResource"
  | "searchResources"
  | "describeResource";
type ReadMethodSpies = Record<ReadMethodName, ReturnType<typeof vi.fn>>;

function resourceMasterForReads(): {
  readonly resourceMaster: ResourceMaster;
  readonly methods: ReadMethodSpies;
} {
  const methods = {
    getTaxonomy: vi.fn(async () => ({ ok: true, value: taxonomy })),
    getEffectiveResourceSchema: vi.fn(async () => ({ ok: true, value: schema })),
    getValidOptions: vi.fn(async () => ({ ok: true, value: options })),
    getNaturalUnits: vi.fn(async () => ({ ok: true, value: units })),
    getResource: vi.fn(async () => ({ ok: true, value: resource })),
    searchResources: vi.fn(async () => ({ ok: true, value: search })),
    describeResource: vi.fn(async () => ({ ok: true, value: description })),
  };
  return { resourceMaster: methods as unknown as ResourceMaster, methods };
}

type Invoke = (rawRequest: unknown, dependencies: ReadDependencies) => Promise<unknown>;
type ReadDependencies = {
  readonly actorResolver: TrustedActorResolver;
  readonly resourceMaster: ResourceMaster;
};

const cases: readonly (readonly [
  string,
  Invoke,
  unknown,
  keyof ReturnType<typeof resourceMasterForReads>["methods"],
])[] = [
  ["getTaxonomy", composition.invokeExternalGetTaxonomy, requests.getTaxonomy, "getTaxonomy"],
  [
    "getEffectiveResourceSchema",
    composition.invokeExternalGetEffectiveResourceSchema,
    requests.getEffectiveResourceSchema,
    "getEffectiveResourceSchema",
  ],
  [
    "getValidOptions",
    composition.invokeExternalGetValidOptions,
    requests.getValidOptions,
    "getValidOptions",
  ],
  [
    "getNaturalUnits",
    composition.invokeExternalGetNaturalUnits,
    requests.getNaturalUnits,
    "getNaturalUnits",
  ],
  ["getResource", composition.invokeExternalGetResource, requests.getResource, "getResource"],
  [
    "searchResources",
    composition.invokeExternalSearchResources,
    requests.searchResources,
    "searchResources",
  ],
  [
    "describeResource",
    composition.invokeExternalDescribeResource,
    requests.describeResource,
    "describeResource",
  ],
];

describe("external GARFEX mutation composition", () => {
  const mutationRequest = {
    createResource: {
      classCode: "hardware",
      familyCode: "wire",
      typeCode: "solid-wire",
      naturalUnitCode: "meter",
      attributes: [
        {
          attributeCode: "gauge",
          value: { magnitude: "12", unitCode: "awg" },
          displayValue: "12",
          identityParticipating: true,
        },
      ],
    },
    updateNonIdentityData: {
      resourceId: "resource-1",
      expectedRevision: 3,
      naturalUnitCode: "meter",
    },
    deactivateResource: { resourceId: "resource-1", expectedRevision: 3 },
  };

  it("exposes named mutation handlers that accept trusted actor state", async () => {
    const methods = {
      createResource: vi.fn(async () => ({ ok: true, value: resource })),
      updateNonIdentityData: vi.fn(async () => ({ ok: true, value: resource })),
      deactivateResource: vi.fn(async () => ({ ok: true, value: resource })),
    } as unknown as ResourceMaster;

    await expect(
      handleCreateResource(mutationRequest.createResource, actor, methods),
    ).resolves.toEqual({ ok: true, value: { resource } });
    await expect(
      handleUpdateNonIdentityData(mutationRequest.updateNonIdentityData, actor, methods),
    ).resolves.toEqual({ ok: true, value: { resource } });
    await expect(
      handleDeactivateResource(mutationRequest.deactivateResource, actor, methods),
    ).resolves.toEqual({ ok: true, value: { resource } });
  });

  it("composes each mutation with validation before auth and no client authority", async () => {
    const methods = {
      createResource: vi.fn(async () => ({ ok: true, value: resource })),
      updateNonIdentityData: vi.fn(async () => ({ ok: true, value: resource })),
      deactivateResource: vi.fn(async () => ({ ok: true, value: resource })),
    } as unknown as ResourceMaster;
    const resolveActor = vi.fn(async () => actor);

    await expect(
      composition.invokeExternalCreateResource(
        { ...mutationRequest.createResource, actorId: "forged" },
        { actorResolver: { resolveActor }, resourceMaster: methods },
      ),
    ).resolves.toEqual({
      ok: false,
      error: {
        code: "INVALID_ARGUMENT",
        fieldIssues: [{ field: "actorId", reason: "UNSUPPORTED" }],
      },
    });
    expect(resolveActor).not.toHaveBeenCalled();

    await expect(
      composition.invokeExternalUpdateNonIdentityData(mutationRequest.updateNonIdentityData, {
        actorResolver: { resolveActor },
        resourceMaster: methods,
      }),
    ).resolves.toEqual({ ok: true, value: { resource } });
    await expect(
      composition.invokeExternalDeactivateResource(mutationRequest.deactivateResource, {
        actorResolver: { resolveActor },
        resourceMaster: methods,
      }),
    ).resolves.toEqual({ ok: true, value: { resource } });
    expect(resolveActor).toHaveBeenCalledTimes(2);
  });
});

describe("external GARFEX read composition", () => {
  it.each(cases)("validates %s before trusted authentication", async (_name, invoke, request) => {
    const { resourceMaster, methods } = resourceMasterForReads();
    const resolveActor = vi.fn(async () => actor);

    const result = await invoke(
      { ...(request as Record<string, unknown>), actorId: "forged-authority" },
      { actorResolver: { resolveActor }, resourceMaster },
    );

    expect(result).toEqual({
      ok: false,
      error: {
        code: "INVALID_ARGUMENT",
        fieldIssues: [{ field: "actorId", reason: "UNSUPPORTED" }],
      },
    });
    expect(resolveActor).not.toHaveBeenCalled();
    for (const method of Object.values(methods)) expect(method).not.toHaveBeenCalled();
  });

  it.each(cases)(
    "resolves trusted auth and invokes only the named handler for %s",
    async (_name, invoke, request, method) => {
      const { resourceMaster, methods } = resourceMasterForReads();
      const resolveActor = vi.fn(async () => actor);

      await invoke(request, { actorResolver: { resolveActor }, resourceMaster });

      expect(resolveActor).toHaveBeenCalledOnce();
      expect(methods[method]).toHaveBeenCalledOnce();
      const call = methods[method].mock.calls[0] as unknown[];
      expect(call[0]).toBe(actor);
      for (const [name, spy] of Object.entries(methods)) {
        if (name !== method) expect(spy).not.toHaveBeenCalled();
      }
    },
  );

  it("contains an invalid final projected outcome and does not expose a generic dispatcher", async () => {
    const { resourceMaster, methods } = resourceMasterForReads();
    methods.getTaxonomy.mockResolvedValue({
      ok: true,
      value: [{ code: "", name: "", families: [] }],
    });

    await expect(
      composition.invokeExternalGetTaxonomy(requests.getTaxonomy, {
        actorResolver: { resolveActor: async () => actor },
        resourceMaster,
      }),
    ).resolves.toEqual({ ok: false, error: { code: "INTERNAL_FAILURE" } });
    expect("invokeExternalOperation" in composition).toBe(false);
  });

  it("keeps named handlers independent of authentication wiring", async () => {
    const { resourceMaster, methods } = resourceMasterForReads();

    await expect(handleGetTaxonomy(requests.getTaxonomy, actor, resourceMaster)).resolves.toEqual({
      ok: true,
      value: { items: taxonomy },
    });
    await expect(
      handleGetEffectiveResourceSchema(requests.getEffectiveResourceSchema, actor, resourceMaster),
    ).resolves.toEqual({ ok: true, value: schema });
    await expect(
      handleGetValidOptions(requests.getValidOptions, actor, resourceMaster),
    ).resolves.toEqual({
      ok: true,
      value: { options },
    });
    await expect(
      handleGetNaturalUnits(requests.getNaturalUnits, actor, resourceMaster),
    ).resolves.toEqual({
      ok: true,
      value: units,
    });
    await expect(handleGetResource(requests.getResource, actor, resourceMaster)).resolves.toEqual({
      ok: true,
      value: { resource },
    });
    await expect(
      handleSearchResources(requests.searchResources, actor, resourceMaster),
    ).resolves.toEqual({
      ok: true,
      value: search,
    });
    await expect(
      handleDescribeResource(requests.describeResource, actor, resourceMaster),
    ).resolves.toEqual({
      ok: true,
      value: description,
    });
    expect(methods.getTaxonomy).toHaveBeenCalledOnce();
  });

  it("receives a fresh actor from trusted authentication for each invocation", async () => {
    const { resourceMaster, methods } = resourceMasterForReads();
    const observedActors: ActorContext[] = [];
    methods.getTaxonomy.mockImplementation(async (resolvedActor: ActorContext) => {
      observedActors.push(resolvedActor);
      return { ok: true, value: taxonomy };
    });
    const resolver = createTrustedActorResolver(
      createAuthenticationComposition(
        { resolveActorId: async () => "trusted-identity" as ActorId },
        ["resource:read"],
      ),
    );

    await composition.invokeExternalGetTaxonomy(requests.getTaxonomy, {
      actorResolver: resolver,
      resourceMaster,
    });
    await composition.invokeExternalGetTaxonomy(requests.getTaxonomy, {
      actorResolver: resolver,
      resourceMaster,
    });

    expect(observedActors).toHaveLength(2);
    expect(observedActors[0]).not.toBe(observedActors[1]);
    expect(observedActors[0]?.capabilities).not.toBe(observedActors[1]?.capabilities);
    expect([...((observedActors[0]?.capabilities ?? []) as Set<string>)]).toEqual([
      "resource:read",
    ]);
  });

  it.each(cases)(
    "lets Resource Master deny %s before downstream reads",
    async (_name, invoke, request) => {
      const loadSnapshot = vi.fn();
      const resourceMaster = createResourceMaster({
        catalogReader: { loadSnapshot },
        repository: {} as ResourceRepository,
      });
      const resolveActor = vi.fn(
        async () =>
          ({
            actorId: "unauthorized-read-actor" as ActorId,
            capabilities: new Set(),
          }) as ActorContext,
      );

      await expect(
        invoke(request, { actorResolver: { resolveActor }, resourceMaster }),
      ).resolves.toEqual({
        ok: false,
        error: { code: "FORBIDDEN" },
      });
      expect(resolveActor).toHaveBeenCalledOnce();
      expect(loadSnapshot).not.toHaveBeenCalled();
    },
  );

  it("rejects unknown operation identifiers without exposing an operation dispatcher", () => {
    expect(parseExternalOperationIdentifier("unknown-operation")).toEqual({
      ok: false,
      error: {
        code: "INVALID_ARGUMENT",
        fieldIssues: [{ field: "operation", reason: "UNSUPPORTED" }],
      },
    });
    expect(
      Object.keys(composition)
        .filter((name) => name.startsWith("invokeExternal"))
        .sort(),
    ).toEqual([
      "invokeExternalCreateResource",
      "invokeExternalDeactivateResource",
      "invokeExternalDescribeResource",
      "invokeExternalGetEffectiveResourceSchema",
      "invokeExternalGetNaturalUnits",
      "invokeExternalGetResource",
      "invokeExternalGetTaxonomy",
      "invokeExternalGetValidOptions",
      "invokeExternalSearchResources",
      "invokeExternalUpdateNonIdentityData",
    ]);
    expect("invokeExternalOperation" in composition).toBe(false);
    expect(Object.keys(composition.externalOperationMappingEvidence).sort()).toEqual([
      "createResource",
      "deactivateResource",
      "describeResource",
      "getEffectiveResourceSchema",
      "getNaturalUnits",
      "getResource",
      "getTaxonomy",
      "getValidOptions",
      "searchResources",
      "updateNonIdentityData",
    ]);
    expect(composition.externalOperationMappingEvidence.createResource).toEqual({
      moduleMethod: "createResource",
      capability: "resource:create",
    });
    expect(composition.externalOperationMappingEvidence).not.toHaveProperty("archiveResource");
  });
});
