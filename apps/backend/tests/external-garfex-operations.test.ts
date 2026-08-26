import { describe, expect, it, vi } from "vitest";
import * as validators from "../src/external-garfex-boundary/client-facing/validation.js";
import * as operations from "../src/external-garfex-boundary/composition.js";
import type { TrustedActorResolver } from "../src/external-garfex-boundary/trusted/identity.js";
import * as mutations from "../src/external-garfex-boundary/trusted/mutation-operations.js";
import * as projections from "../src/external-garfex-boundary/trusted/projections.js";
import type { ResourceRepository } from "../src/resource-master/application/ports/resource-repository.js";
import { createResourceMaster } from "../src/resource-master/application/resource-master.js";
import type {
  ActorContext,
  ActorId,
  EffectiveAttributeView,
  ResourceMaster,
  ResourceSummary,
  ResourceView,
  TaxonomyView,
} from "../src/resource-master/public.js";

type SearchSuccess = { readonly items: ResourceSummary[]; readonly cursor: string | null };
type DescriptionSuccess = { readonly resourceId: string; readonly description: string };

const resourceReadSuccess: ResourceView = {
  resourceId: "resource-1",
  classCode: "hardware",
  familyCode: "wire",
  typeCode: "solid-wire",
  naturalUnitCode: "meter",
  attributes: [],
  canonicalIdentity: "hardware|wire|solid-wire",
  identityPolicyVersion: "v1",
  active: true,
  revision: 3,
};
const descriptionReadSuccess: DescriptionSuccess = {
  resourceId: "resource-1",
  description: "Hardware Wire Solid wire",
};

function searchSuccess(cursor: string | null): SearchSuccess {
  return {
    items: [
      {
        resourceId: "resource-1",
        classCode: "hardware",
        className: "Hardware",
        familyCode: "wire",
        familyName: "Wire",
        typeCode: "solid-wire",
        typeName: "Solid wire",
        naturalUnitCode: "meter",
        description: "Hardware Wire Solid wire",
        optionCodes: ["bare"],
        optionLabels: ["Bare"],
        values: ["Bare", "12"],
      },
    ],
    cursor,
  };
}

function expectValidated(value: unknown, validate: (value: unknown) => unknown): void {
  expect(validate(value)).toEqual(value);
}

describe("external GARFEX success projections", () => {
  it("projects taxonomy, schema, options, and units without internal fields", () => {
    const sharedType = { code: "solid-wire", name: "Solid wire", internalTypeId: "type-secret" };
    const taxonomy = [
      {
        code: "hardware",
        name: "Hardware",
        families: [
          {
            code: "wire",
            name: "Wire",
            types: [sharedType],
            internalFamilyId: "family-secret",
          },
        ],
        internalCatalogId: "catalog-secret",
      },
    ] as unknown as TaxonomyView[];
    const defaultResult = { mode: "OPTIONAL", identity: true, internal: "secret" };
    const ruleWhen = { attributeCode: "finish", optionCode: "bare", internal: "secret" };
    const ruleResult = { mode: "REQUIRED", identity: false, internal: "secret" };
    const schema = {
      attributes: [
        {
          code: "finish",
          name: "Finish",
          kind: "CONTROLLED_OPTION",
          meaning: "Surface finish",
          defaultResult,
          rules: [{ when: ruleWhen, result: ruleResult, internalRuleId: "rule-secret" }],
          internalAttributeId: "attribute-secret",
        },
      ],
      internalSchemaId: "schema-secret",
    } as unknown as { attributes: EffectiveAttributeView[] };
    const option = { code: "bare", label: "Bare", internalOptionId: "option-secret" };
    const options = [option] as unknown as { code: string; label: string }[];
    const unit = { code: "meter", name: "Meter", internalUnitId: "unit-secret" };
    const units = {
      allowed: [unit],
      suggested: unit,
      internalFamilyId: "family-secret",
    } as unknown as {
      allowed: { code: string; name: string }[];
      suggested: { code: string; name: string };
    };
    const projectedTaxonomy = projections.projectExternalGetTaxonomy(taxonomy);
    const projectedSchema = projections.projectExternalGetEffectiveResourceSchema(schema);
    const projectedOptions = projections.projectExternalGetValidOptions(options);
    const projectedUnits = projections.projectExternalGetNaturalUnits(units);

    expect(projectedTaxonomy).toEqual([
      {
        code: "hardware",
        name: "Hardware",
        families: [
          { code: "wire", name: "Wire", types: [{ code: "solid-wire", name: "Solid wire" }] },
        ],
      },
    ]);
    expect(projectedSchema).toEqual({
      attributes: [
        {
          code: "finish",
          name: "Finish",
          kind: "CONTROLLED_OPTION",
          meaning: "Surface finish",
          defaultResult: { mode: "OPTIONAL", identity: true },
          rules: [
            {
              when: { attributeCode: "finish", optionCode: "bare" },
              result: { mode: "REQUIRED", identity: false },
            },
          ],
        },
      ],
    });
    expect(projectedOptions).toEqual([{ code: "bare", label: "Bare" }]);
    expect(projectedUnits).toEqual({
      allowed: [{ code: "meter", name: "Meter" }],
      suggested: { code: "meter", name: "Meter" },
    });
    expect(projectedTaxonomy).not.toBe(taxonomy);
    expect(projectedTaxonomy[0]?.families[0]?.types[0]).not.toBe(sharedType);
    expect(projectedSchema.attributes[0]?.defaultResult).not.toBe(defaultResult);
    expect(projectedSchema.attributes[0]?.rules[0]?.when).not.toBe(ruleWhen);
    expect(projectedOptions[0]).not.toBe(option);
    expect(projectedUnits.allowed[0]).not.toBe(unit);
    expect(projectedUnits.suggested).not.toBe(unit);

    expectValidated(projectedTaxonomy, validators.validateExternalGetTaxonomySuccess);
    expectValidated(projectedSchema, validators.validateExternalGetEffectiveResourceSchemaSuccess);
    expectValidated(projectedOptions, validators.validateExternalGetValidOptionsSuccess);
    expectValidated(projectedUnits, validators.validateExternalGetNaturalUnitsSuccess);
  });

  it("projects resources through each named operation wrapper and limits quantities", () => {
    const quantity = {
      magnitude: "12",
      unitCode: "awg",
      internalUnitId: "unit-secret",
    };
    const resource = {
      resourceId: "resource-1",
      classCode: "hardware",
      familyCode: "wire",
      typeCode: "solid-wire",
      naturalUnitCode: "meter",
      attributes: [
        {
          attributeCode: "finish",
          value: "bare",
          displayValue: "Bare",
          identityParticipating: true,
          internalAttributeId: "attribute-secret",
        },
        {
          attributeCode: "gauge",
          value: quantity,
          displayValue: "12",
          identityParticipating: true,
          internalAttributeId: "attribute-secret",
        },
      ],
      canonicalIdentity: "hardware|wire|solid-wire|finish=bare|gauge=12-awg",
      identityPolicyVersion: "v1",
      active: true,
      revision: 3,
      internalDocumentId: "document-secret",
      actorId: "forged-actor",
      convexId: "convex-secret",
    } as unknown as ResourceView;
    const expected = {
      resourceId: "resource-1",
      classCode: "hardware",
      familyCode: "wire",
      typeCode: "solid-wire",
      naturalUnitCode: "meter",
      attributes: [
        {
          attributeCode: "finish",
          value: "bare",
          displayValue: "Bare",
          identityParticipating: true,
        },
        {
          attributeCode: "gauge",
          value: { magnitude: "12", unitCode: "awg" },
          displayValue: "12",
          identityParticipating: true,
        },
      ],
      canonicalIdentity: "hardware|wire|solid-wire|finish=bare|gauge=12-awg",
      identityPolicyVersion: "v1" as const,
      active: true,
      revision: 3,
    };
    const projected = [
      projections.projectExternalGetResource(resource),
      projections.projectExternalCreateResource(resource),
      projections.projectExternalUpdateNonIdentityData(resource),
      projections.projectExternalDeactivateResource(resource),
    ];

    for (const result of projected) {
      expect(result).toEqual(expected);
      expect(result).not.toBe(resource);
      expect(result.attributes).not.toBe(resource.attributes);
      expect(result.attributes[1]?.value).not.toBe(quantity);
    }
    expectValidated(projected[0], validators.validateExternalGetResourceSuccess);
    expectValidated(projected[1], validators.validateExternalCreateResourceSuccess);
    expectValidated(projected[2], validators.validateExternalUpdateNonIdentityDataSuccess);
    expectValidated(projected[3], validators.validateExternalDeactivateResourceSuccess);
  });

  it("projects search and description while nulling missing continuation", () => {
    const summary = {
      resourceId: "resource-1",
      classCode: "hardware",
      className: "Hardware",
      familyCode: "wire",
      familyName: "Wire",
      typeCode: "solid-wire",
      typeName: "Solid wire",
      naturalUnitCode: "meter",
      description: "Hardware Wire Solid wire",
      optionCodes: ["bare"],
      optionLabels: ["Bare"],
      values: ["Bare", "12"],
      repositoryId: "repository-secret",
    } as unknown as ResourceSummary;
    const search = {
      items: [summary],
      cursor: undefined,
      internalPageId: "page-secret",
    } as unknown as SearchSuccess;
    const description = {
      resourceId: "resource-1",
      description: "Hardware Wire Solid wire",
      internalDocumentId: "document-secret",
    } as unknown as DescriptionSuccess;

    const projectedSearch = projections.projectExternalSearchResources(search);
    const projectedDescription = projections.projectExternalDescribeResource(description);

    expect(projectedSearch).toEqual({
      items: [
        {
          resourceId: "resource-1",
          classCode: "hardware",
          className: "Hardware",
          familyCode: "wire",
          familyName: "Wire",
          typeCode: "solid-wire",
          typeName: "Solid wire",
          naturalUnitCode: "meter",
          description: "Hardware Wire Solid wire",
          optionCodes: ["bare"],
          optionLabels: ["Bare"],
          values: ["Bare", "12"],
        },
      ],
      cursor: null,
    });
    expect(projectedDescription).toEqual({
      resourceId: "resource-1",
      description: "Hardware Wire Solid wire",
    });
    expect(projectedSearch.items).not.toBe(search.items);
    expect(projectedSearch.items[0]).not.toBe(summary);
    expect(projectedSearch.items[0]?.optionCodes).not.toBe(summary.optionCodes);
    expect(projectedDescription).not.toBe(description);

    expectValidated(projectedSearch, validators.validateExternalSearchResourcesSuccess);
    expectValidated(projectedDescription, validators.validateExternalDescribeResourceSuccess);

    const continued = projections.projectExternalSearchResources({
      ...search,
      cursor: "opaque-cursor",
    });
    expect(continued.cursor).toBe("opaque-cursor");
  });
});

const readActor = {
  actorId: "server-read-actor" as ActorId,
  capabilities: new Set(["resource:read"]),
} as ActorContext;

type ReadMethod = keyof ReturnType<typeof readMethodSpies>;
type ReadDependencies = {
  actorResolver: TrustedActorResolver;
  resourceMaster: ResourceMaster;
};
type ReadInvocation = (rawRequest: unknown, dependencies: ReadDependencies) => Promise<unknown>;
function readCase(
  invoke: ReadInvocation,
  method: ReadMethod,
  request: Record<string, unknown>,
  internal: unknown,
  mappedInput: Record<string, unknown> | null = request,
) {
  return {
    name: method,
    invoke,
    method,
    request,
    mappedInput: mappedInput === null ? null : { ...mappedInput },
    internal,
  };
}
type ReadCase = ReturnType<typeof readCase>;

const searchReadCase = readCase(
  operations.invokeExternalSearchResources,
  "searchResources",
  { terms: "wire" },
  searchSuccess(null),
);

const readCases = [
  readCase(
    operations.invokeExternalGetTaxonomy,
    "getTaxonomy",
    {},
    [{ code: "hardware", name: "Hardware", families: [] }],
    null,
  ),
  readCase(
    operations.invokeExternalGetEffectiveResourceSchema,
    "getEffectiveResourceSchema",
    { classCode: "hardware", familyCode: "wire", typeCode: "solid-wire" },
    { attributes: [] },
  ),
  readCase(
    operations.invokeExternalGetValidOptions,
    "getValidOptions",
    { attributeCode: "finish" },
    [{ code: "bare", label: "Bare" }],
  ),
  readCase(
    operations.invokeExternalGetNaturalUnits,
    "getNaturalUnits",
    { familyCode: "wire" },
    {
      allowed: [{ code: "meter", name: "Meter" }],
      suggested: { code: "meter", name: "Meter" },
    },
  ),
  readCase(
    operations.invokeExternalGetResource,
    "getResource",
    { resourceId: "resource-1" },
    resourceReadSuccess,
  ),
  readCase(
    operations.invokeExternalDescribeResource,
    "describeResource",
    { resourceId: "resource-1" },
    descriptionReadSuccess,
  ),
  searchReadCase,
];

function readMethodSpies() {
  const result = { ok: false, error: { code: "INTERNAL", message: "unused" } };
  return {
    getTaxonomy: vi.fn(async () => result),
    getEffectiveResourceSchema: vi.fn(async () => result),
    getValidOptions: vi.fn(async () => result),
    getNaturalUnits: vi.fn(async () => result),
    getResource: vi.fn(async () => result),
    searchResources: vi.fn(async () => result),
    describeResource: vi.fn(async () => result),
  };
}

type ReadSpies = ReturnType<typeof readMethodSpies>;
function runRead(
  testCase: ReadCase,
  rawRequest: unknown,
  methods: ReadSpies,
  resolveActor: () => Promise<ActorContext | null>,
): Promise<unknown> {
  const dependencies: ReadDependencies = {
    actorResolver: { resolveActor },
    resourceMaster: methods as unknown as ResourceMaster,
  };
  return testCase.invoke(rawRequest, dependencies);
}

describe("external GARFEX named read invocations", () => {
  it.each(readCases)(
    "$name validates, maps, projects, and calls only its matching method",
    async (testCase) => {
      const methods = readMethodSpies();
      methods[testCase.method] = vi.fn(
        async () => ({ ok: true, value: testCase.internal }) as never,
      );
      const resolveActor = vi.fn(async () => readActor);
      const result = await runRead(testCase, testCase.request, methods, resolveActor);

      expect(result).toEqual({ ok: true, value: testCase.internal });
      expect(resolveActor).toHaveBeenCalledOnce();
      expect(methods[testCase.method]).toHaveBeenCalledOnce();
      const args = methods[testCase.method].mock.calls[0] as unknown[];
      expect(args[0]).toBe(readActor);
      if (testCase.mappedInput === null) {
        expect(args).toHaveLength(1);
      } else {
        expect(args[1]).toEqual(testCase.mappedInput);
        expect(args[1]).not.toBe(testCase.request);
      }
      for (const [method, spy] of Object.entries(methods)) {
        if (method !== testCase.method) expect(spy).not.toHaveBeenCalled();
      }
    },
  );

  it.each(readCases)(
    "$name validates before auth and short-circuits unauthenticated calls",
    async (testCase) => {
      const methods = readMethodSpies();
      const resolveActor = vi.fn<() => Promise<ActorContext | null>>(async () => {
        throw new Error("authentication must not run");
      });
      const malformed = { ...testCase.request, unexpected: "secret" };
      expect(await runRead(testCase, malformed, methods, resolveActor)).toEqual({
        ok: false,
        error: {
          code: "INVALID_ARGUMENT",
          fieldIssues: [{ path: "unexpected", reason: "UNKNOWN_FIELD" }],
        },
      });
      expect(resolveActor).not.toHaveBeenCalled();

      resolveActor.mockResolvedValue(null);
      expect(await runRead(testCase, testCase.request, methods, resolveActor)).toEqual({
        ok: false,
        error: { code: "UNAUTHENTICATED" },
      });
      expect(resolveActor).toHaveBeenCalledOnce();
      for (const spy of Object.values(methods)) expect(spy).not.toHaveBeenCalled();
    },
  );

  it.each(readCases)("$name normalizes a Resource Master failure", async (testCase) => {
    const methods = readMethodSpies();
    methods[testCase.method] = vi.fn(
      async () =>
        ({
          ok: false,
          error: { code: "FORBIDDEN", message: "required capability is secret" },
        }) as never,
    );
    expect(await runRead(testCase, testCase.request, methods, async () => readActor)).toEqual({
      ok: false,
      error: { code: "FORBIDDEN" },
    });
  });

  it.each(readCases)("$name contains invocation exceptions", async (testCase) => {
    const methods = readMethodSpies();
    methods[testCase.method] = vi.fn(async () => {
      throw new Error("provider, persistence, and stack secret");
    });
    expect(await runRead(testCase, testCase.request, methods, async () => readActor)).toEqual({
      ok: false,
      error: { code: "INTERNAL_FAILURE" },
    });
  });

  it("contains an invalid projected success before release", async () => {
    const methods = readMethodSpies();
    methods.getTaxonomy = vi.fn(
      async () => ({ ok: true, value: [{ code: "", name: "", families: [] }] }) as never,
    );
    const result = await runRead(readCases[0] as ReadCase, {}, methods, async () => readActor);
    expect(result).toEqual({ ok: false, error: { code: "INTERNAL_FAILURE" } });
  });

  it.each([
    readCase(
      operations.invokeExternalGetResource,
      "getResource",
      { resourceId: "resource-1" },
      { ...resourceReadSuccess, resourceId: "" },
    ),
    readCase(
      operations.invokeExternalDescribeResource,
      "describeResource",
      { resourceId: "resource-1" },
      { ...descriptionReadSuccess, resourceId: "" },
    ),
  ])("$name contains an invalid projected success before release", async (testCase) => {
    const methods = readMethodSpies();
    methods[testCase.method] = vi.fn(async () => ({ ok: true, value: testCase.internal }) as never);
    const result = await runRead(testCase, testCase.request, methods, async () => readActor);
    expect(result).toEqual({ ok: false, error: { code: "INTERNAL_FAILURE" } });
  });
});

describe("external GARFEX U6b authorization handoff", () => {
  it.each([
    ["getResource", operations.invokeExternalGetResource],
    ["describeResource", operations.invokeExternalDescribeResource],
  ] as const)("lets Resource Master deny %s before downstream data work", async (_name, invoke) => {
    const loadSnapshot = vi.fn();
    const getByResourceId = vi.fn();
    const repository = { getByResourceId } as unknown as ResourceRepository;
    const resourceMaster = createResourceMaster({
      catalogReader: { loadSnapshot },
      repository,
    });
    const resolveActor = vi.fn(
      async () =>
        ({
          actorId: "server-unauthorized-actor" as ActorId,
          capabilities: new Set(),
        }) as ActorContext,
    );

    const result = await invoke(
      { resourceId: "protected-resource" },
      { actorResolver: { resolveActor }, resourceMaster },
    );

    expect(result).toEqual({ ok: false, error: { code: "FORBIDDEN" } });
    expect(resolveActor).toHaveBeenCalledOnce();
    expect(loadSnapshot).not.toHaveBeenCalled();
    expect(getByResourceId).not.toHaveBeenCalled();
  });
});

describe("external GARFEX U7 search invocation", () => {
  const opaqueCursor = "opaque|cursor-v2|private-state";

  it("keeps omitted lifecycle, limit, and cursor absent and calls only searchResources once", async () => {
    const methods = readMethodSpies();
    methods.searchResources = vi.fn(
      async () => ({ ok: true, value: searchSuccess(null) }) as never,
    );
    const request = { terms: "wire" };
    const resolveActor = vi.fn(async () => readActor);

    const result = await runRead(searchReadCase, request, methods, resolveActor);

    expect(result).toEqual({ ok: true, value: searchSuccess(null) });
    expect(methods.searchResources).toHaveBeenCalledOnce();
    const args = methods.searchResources.mock.calls[0] as unknown[];
    expect(args[0]).toBe(readActor);
    expect(args[1]).toEqual(request);
    expect(args[1]).not.toBe(request);
    expect(Object.keys(args[1] as Record<string, unknown>)).toEqual(["terms"]);
    expect(Object.hasOwn(args[1] as object, "lifecycle")).toBe(false);
    expect(Object.hasOwn(args[1] as object, "limit")).toBe(false);
    expect(Object.hasOwn(args[1] as object, "cursor")).toBe(false);
    for (const [method, spy] of Object.entries(methods)) {
      if (method !== "searchResources") expect(spy).not.toHaveBeenCalled();
    }
  });

  it.each([
    {
      name: "bounded lower limit",
      request: { terms: "wire", limit: 1 },
      expected: { terms: "wire", limit: 1 },
      resultCursor: null,
    },
    {
      name: "bounded upper limit with explicit null cursor",
      request: { terms: "wire", limit: 50, cursor: null },
      expected: { terms: "wire", limit: 50, cursor: null },
      resultCursor: null,
    },
    {
      name: "opaque continuation cursor",
      request: { terms: "wire", lifecycle: "INACTIVE", limit: 3, cursor: opaqueCursor },
      expected: { terms: "wire", lifecycle: "INACTIVE", limit: 3, cursor: opaqueCursor },
      resultCursor: opaqueCursor,
    },
  ])("preserves supplied search options for $name", async ({ request, expected, resultCursor }) => {
    const methods = readMethodSpies();
    methods.searchResources = vi.fn(
      async () => ({ ok: true, value: searchSuccess(resultCursor) }) as never,
    );

    const result = await runRead(searchReadCase, request, methods, async () => readActor);

    expect(result).toEqual({ ok: true, value: searchSuccess(resultCursor) });
    expect(methods.searchResources).toHaveBeenCalledOnce();
    const args = methods.searchResources.mock.calls[0] as unknown[];
    expect(args[1]).toEqual(expected);
    expect(args[1]).not.toBe(request);
  });

  it.each([
    { request: { terms: "wire", lifecycle: "BROKEN" }, path: "lifecycle", reason: "INVALID_VALUE" },
    { request: { terms: "wire", limit: 0 }, path: "limit", reason: "OUT_OF_RANGE" },
    { request: { terms: "wire", limit: 51 }, path: "limit", reason: "OUT_OF_RANGE" },
    { request: { terms: "wire", cursor: 12 }, path: "cursor", reason: "TYPE" },
    { request: { terms: "wire", cursor: "" }, path: "cursor", reason: "INVALID_VALUE" },
  ] as const)(
    "rejects malformed pagination in $path before auth or module work",
    async ({ request, path, reason }) => {
      const methods = readMethodSpies();
      const resolveActor = vi.fn(async () => readActor);

      const result = await runRead(searchReadCase, request, methods, resolveActor);

      expect(result).toEqual({
        ok: false,
        error: { code: "INVALID_ARGUMENT", fieldIssues: [{ path, reason }] },
      });
      expect(resolveActor).not.toHaveBeenCalled();
      for (const spy of Object.values(methods)) expect(spy).not.toHaveBeenCalled();
    },
  );

  it("contains a malformed projected page before release", async () => {
    const methods = readMethodSpies();
    methods.searchResources = vi.fn(
      async () => ({ ok: true, value: { items: [], cursor: 12 } }) as never,
    );

    const result = await runRead(searchReadCase, { terms: "wire" }, methods, async () => readActor);

    expect(result).toEqual({ ok: false, error: { code: "INTERNAL_FAILURE" } });
    expect(methods.searchResources).toHaveBeenCalledOnce();
  });
});

type MutationMethod = "createResource" | "updateNonIdentityData" | "deactivateResource";
type MutationInvocation = (rawRequest: unknown, dependencies: ReadDependencies) => Promise<unknown>;
type MutationCase = {
  readonly method: MutationMethod;
  readonly invoke: MutationInvocation;
  readonly request: Record<string, unknown>;
  readonly mappedInput: Record<string, unknown>;
};

const mutationAttribute = { magnitude: "12", unitCode: "awg" };
const mutationCases: readonly MutationCase[] = [
  {
    method: "createResource",
    invoke: mutations.invokeExternalCreateResource,
    request: {
      classCode: "hardware",
      familyCode: "wire",
      typeCode: "solid-wire",
      naturalUnitCode: "meter",
      attributes: { gauge: mutationAttribute },
    },
    mappedInput: {
      classCode: "hardware",
      familyCode: "wire",
      typeCode: "solid-wire",
      naturalUnitCode: "meter",
      attributes: { gauge: { magnitude: "12", unitCode: "awg" } },
    },
  },
  {
    method: "updateNonIdentityData",
    invoke: mutations.invokeExternalUpdateNonIdentityData,
    request: { resourceId: "resource-1", expectedRevision: 3, naturalUnitCode: "meter" },
    mappedInput: { resourceId: "resource-1", expectedRevision: 3, naturalUnitCode: "meter" },
  },
  {
    method: "deactivateResource",
    invoke: mutations.invokeExternalDeactivateResource,
    request: { resourceId: "resource-1", expectedRevision: 3 },
    mappedInput: { resourceId: "resource-1", expectedRevision: 3 },
  },
];

function mutationMethodSpies() {
  const failure = { ok: false, error: { code: "INTERNAL", message: "unused" } };
  return {
    createResource: vi.fn(async () => failure),
    updateNonIdentityData: vi.fn(async () => failure),
    deactivateResource: vi.fn(async () => failure),
  };
}

type MutationSpies = ReturnType<typeof mutationMethodSpies>;

function runMutation(
  testCase: MutationCase,
  rawRequest: unknown,
  methods: MutationSpies,
  resolveActor: () => Promise<ActorContext | null>,
): Promise<unknown> {
  return testCase.invoke(rawRequest, {
    actorResolver: { resolveActor },
    resourceMaster: methods as unknown as ResourceMaster,
  });
}

const mutationActor = {
  actorId: "server-mutation-actor" as ActorId,
  capabilities: new Set(["resource:create"]),
} as ActorContext;

describe("external GARFEX named mutation invocations", () => {
  it.each(mutationCases)(
    "$method validates, rebuilds, and calls only its matching method",
    async (testCase) => {
      const methods = mutationMethodSpies();
      methods[testCase.method] = vi.fn(async () => ({
        ok: true,
        value: resourceReadSuccess,
      })) as never;
      const request = testCase.request;
      const result = await runMutation(testCase, request, methods, async () => mutationActor);

      expect(result).toEqual({ ok: true, value: resourceReadSuccess });
      expect(methods[testCase.method]).toHaveBeenCalledOnce();
      const args = methods[testCase.method].mock.calls[0] as unknown[];
      expect(args[0]).toBe(mutationActor);
      expect(args[1]).toEqual(testCase.mappedInput);
      expect(args[1]).not.toBe(request);
      expect(args[1]).not.toHaveProperty("actorId");
      if (testCase.method === "createResource") {
        const input = args[1] as { attributes: Record<string, unknown> };
        expect(input.attributes).not.toBe(request.attributes);
        expect(input.attributes.gauge).not.toBe(mutationAttribute);
      }
      for (const [method, spy] of Object.entries(methods)) {
        if (method !== testCase.method) expect(spy).not.toHaveBeenCalled();
      }
    },
  );
});
