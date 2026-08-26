import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import type { ExternalOperation } from "../src/external-garfex-boundary/client-facing/contract.js";
import * as validators from "../src/external-garfex-boundary/client-facing/validation.js";
import * as reads from "../src/external-garfex-boundary/composition.js";
import * as mutations from "../src/external-garfex-boundary/trusted/mutation-operations.js";
import type { ActorContext, ResourceMaster } from "../src/resource-master/public.js";

const fixtureUrl = new URL(
  "./fixtures/external-garfex-boundary/compatibility.json",
  import.meta.url,
);
const manifestUrl = new URL(
  "../../../contracts/external-garfex/resource-master/generated/semantic-manifest.json",
  import.meta.url,
);
type CompatibilityManifest = {
  readonly enums: readonly {
    readonly name: string;
    readonly values: readonly (string | number)[];
  }[];
  readonly models: readonly {
    readonly name: string;
    readonly properties: readonly { readonly name: string }[];
  }[];
  readonly operations: readonly { readonly name: string }[];
};
const manifest = JSON.parse(readFileSync(manifestUrl, "utf8")) as CompatibilityManifest;
const manifestOperations = manifest.operations.map(
  ({ name }) => name,
) as readonly ExternalOperation[];
const manifestFailureCodes = (
  manifest.enums.find(({ name }) => name === "ExternalFailureCode")?.values ?? []
).map(String);
const modelNameFromFailureCode = (code: string): string => {
  const parts = code.toLowerCase().split("_");
  const modelParts = parts.at(-1) === "failure" ? parts.slice(0, -1) : parts;
  return `${modelParts.map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join("")}Failure`;
};
const manifestMatrixKeys = Object.fromEntries(
  manifestFailureCodes.map((code) => {
    const failureModel = manifest.models.find(
      ({ name }) => name === modelNameFromFailureCode(code),
    );
    if (failureModel === undefined) throw new Error(`manifest has no failure model for ${code}`);
    return [code, failureModel.properties.map(({ name }) => name)];
  }),
) as Record<string, readonly string[]>;
type Validator = (value: unknown) => unknown;
type Dependencies = {
  readonly actorResolver: { resolveActor: () => Promise<ActorContext> };
  readonly resourceMaster: ResourceMaster;
};
type Invocation = (request: unknown, dependencies: Dependencies) => Promise<unknown>;
type OperationCase = readonly [Validator, Validator, Invocation, keyof ResourceMaster];
const cases: Record<ExternalOperation, OperationCase> = {
  getTaxonomy: [
    validators.validateExternalGetTaxonomyRequest,
    validators.validateExternalGetTaxonomySuccess,
    reads.invokeExternalGetTaxonomy,
    "getTaxonomy",
  ],
  getEffectiveResourceSchema: [
    validators.validateExternalGetEffectiveResourceSchemaRequest,
    validators.validateExternalGetEffectiveResourceSchemaSuccess,
    reads.invokeExternalGetEffectiveResourceSchema,
    "getEffectiveResourceSchema",
  ],
  getValidOptions: [
    validators.validateExternalGetValidOptionsRequest,
    validators.validateExternalGetValidOptionsSuccess,
    reads.invokeExternalGetValidOptions,
    "getValidOptions",
  ],
  getNaturalUnits: [
    validators.validateExternalGetNaturalUnitsRequest,
    validators.validateExternalGetNaturalUnitsSuccess,
    reads.invokeExternalGetNaturalUnits,
    "getNaturalUnits",
  ],
  getResource: [
    validators.validateExternalGetResourceRequest,
    validators.validateExternalGetResourceSuccess,
    reads.invokeExternalGetResource,
    "getResource",
  ],
  searchResources: [
    validators.validateExternalSearchResourcesRequest,
    validators.validateExternalSearchResourcesSuccess,
    reads.invokeExternalSearchResources,
    "searchResources",
  ],
  describeResource: [
    validators.validateExternalDescribeResourceRequest,
    validators.validateExternalDescribeResourceSuccess,
    reads.invokeExternalDescribeResource,
    "describeResource",
  ],
  createResource: [
    validators.validateExternalCreateResourceRequest,
    validators.validateExternalCreateResourceSuccess,
    mutations.invokeExternalCreateResource,
    "createResource",
  ],
  updateNonIdentityData: [
    validators.validateExternalUpdateNonIdentityDataRequest,
    validators.validateExternalUpdateNonIdentityDataSuccess,
    mutations.invokeExternalUpdateNonIdentityData,
    "updateNonIdentityData",
  ],
  deactivateResource: [
    validators.validateExternalDeactivateResourceRequest,
    validators.validateExternalDeactivateResourceSuccess,
    mutations.invokeExternalDeactivateResource,
    "deactivateResource",
  ],
};

function record(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("fixture shape is not an object");
  }
  return value as Record<string, unknown>;
}
function loadFixture(): Record<string, unknown> {
  return record(JSON.parse(readFileSync(fixtureUrl, "utf8")) as unknown);
}
function serialized(value: unknown): unknown {
  return JSON.parse(JSON.stringify(value)) as unknown;
}
function internalFailure(failure: unknown): Record<string, unknown> {
  const source = record(record(failure).error);
  const code = String(source.code);
  const internalCode: Record<string, string> = {
    VALIDATION_FAILED: "VALIDATION",
    CATALOG_UNAVAILABLE: "RESOURCE_CATALOG_UNAVAILABLE",
    INTERNAL_FAILURE: "INTERNAL",
  };
  const error: Record<string, unknown> = {
    code: internalCode[code] ?? code,
    message: "fixture stub diagnostic remains server-only",
  };
  if (code === "DUPLICATE") error.existingResourceId = source.existingResourceId;
  if (code === "CONFLICT") error.currentRevision = source.currentRevision;
  return { ok: false, error };
}
function fixtureMaster(operation: ExternalOperation, result: unknown) {
  const unused = async () => ({ ok: false, error: { code: "INTERNAL", message: "unused" } });
  const methods = {
    getTaxonomy: vi.fn(unused),
    getEffectiveResourceSchema: vi.fn(unused),
    getValidOptions: vi.fn(unused),
    getNaturalUnits: vi.fn(unused),
    getResource: vi.fn(unused),
    searchResources: vi.fn(unused),
    describeResource: vi.fn(unused),
    createResource: vi.fn(unused),
    updateNonIdentityData: vi.fn(unused),
    deactivateResource: vi.fn(unused),
  };
  methods[cases[operation][3]].mockImplementation(async () => result as never);
  return { methods, resourceMaster: methods as unknown as ResourceMaster };
}
function dependencies(resourceMaster: ResourceMaster): Dependencies {
  return {
    actorResolver: {
      resolveActor: vi.fn(
        async () =>
          ({
            actorId: "fixture-actor" as ActorContext["actorId"],
            capabilities: new Set() as ActorContext["capabilities"],
          }) as ActorContext,
      ),
    },
    resourceMaster,
  };
}
function expectOnlyNamedMethod(
  methods: Record<string, { mock: { calls: unknown[][] } }>,
  operation: ExternalOperation,
): void {
  const target = cases[operation][3];
  expect(methods[target]).toHaveBeenCalledOnce();
  for (const [name, method] of Object.entries(methods)) {
    if (name !== target) expect(method).not.toHaveBeenCalled();
  }
}

describe("external GARFEX semantic compatibility evidence", () => {
  it("loads ten closed operation entries and validates every fixture shape", () => {
    const fixture = loadFixture();
    expect(fixture.evidenceKind).toBe("semantic-compatibility");
    const entries = record(fixture.operations);
    expect(Object.keys(entries)).toEqual([...manifestOperations]);
    expect(validators.parseExternalOperationIdentifier("futureOperation")).toMatchObject({
      ok: false,
      error: { code: "INVALID_ARGUMENT" },
    });
    for (const operation of manifestOperations) {
      const entry = record(entries[operation]);
      expect(cases[operation][0](entry.request)).toEqual(entry.request);
      expect(cases[operation][1](entry.success)).toEqual(entry.success);
      expect(validators.validateExternalFailure(entry.failure)).toEqual(entry.failure);
    }
    const source = JSON.stringify(fixture).toLowerCase();
    for (const term of [
      "message",
      "stack",
      "provider",
      "actorid",
      "capability",
      "convex",
      "persistence",
      "deployment",
      "catalogadmin",
    ]) {
      expect(source).not.toContain(term);
    }
  });

  it("freezes the complete eleven-code metadata matrix", () => {
    const matrix = record(loadFixture().errorMatrix);
    expect(Object.keys(matrix).sort()).toEqual([...manifestFailureCodes].sort());
    for (const code of manifestFailureCodes) {
      const failure = matrix[code];
      expect(validators.validateExternalFailure(failure)).toEqual(failure);
      expect(Object.keys(record(record(failure).error))).toEqual(manifestMatrixKeys[code]);
    }
  });

  it("preserves opaque continuation and final null cursor evidence", () => {
    const fixture = loadFixture();
    const entry = record(record(fixture.operations).searchResources);
    const cursors = record(fixture.cursorExamples);
    expect(record(entry.request).cursor).toBe(cursors.opaque);
    expect(record(entry.success).cursor).toBe(cursors.opaque);
    const finalPage = { ...record(entry.success), cursor: cursors.final };
    expect(validators.validateExternalSearchResourcesSuccess(finalPage)).toEqual(finalPage);
    expect(serialized(finalPage)).toEqual(finalPage);
  });

  it.each(manifestOperations)(
    "%s fixture drives its named stub and deep-compares serialized success/failure",
    async (operation) => {
      const entry = record(record(loadFixture().operations)[operation]);
      const successStub = fixtureMaster(operation, { ok: true, value: entry.success });
      const success = await cases[operation][2](
        entry.request,
        dependencies(successStub.resourceMaster),
      );
      expect(serialized(success)).toEqual(serialized({ ok: true, value: entry.success }));
      expectOnlyNamedMethod(successStub.methods, operation);

      const failureStub = fixtureMaster(operation, internalFailure(entry.failure));
      const failure = await cases[operation][2](
        entry.request,
        dependencies(failureStub.resourceMaster),
      );
      expect(serialized(failure)).toEqual(serialized(entry.failure));
      expectOnlyNamedMethod(failureStub.methods, operation);
    },
  );
});
