import { describe, expect, it, vi } from "vitest";
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
import type { ResourceRepository } from "../src/resource-master/application/ports/resource-repository.js";
import type { TrustedActorResolver } from "../src/external-garfex-boundary/trusted/identity.js";
import * as operations from "../src/external-garfex-boundary/trusted/read-operations.js";
import * as mutations from "../src/external-garfex-boundary/trusted/mutation-operations.js";
import * as projections from "../src/external-garfex-boundary/trusted/projections.js";
import * as validators from "../src/external-garfex-boundary/client-facing/validation.js";

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
