import { describe, expect, it } from "vitest";
import {
  compatibilityRevision,
  contractMetadata,
  externalContractIdentity,
  externalErrorCodes,
  externalOperationIdentifiers,
} from "../src/external-garfex-boundary/client-facing/contract.js";
import {
  compatibilityRevision as generatedCompatibilityRevision,
  contractMetadata as generatedContractMetadata,
  externalContractIdentity as generatedExternalContractIdentity,
  semanticManifest,
} from "../src/external-garfex-boundary/client-facing/generated/semantic-contract.generated.js";
import {
  validateExternalCreateResourceRequest,
  validateExternalFailure,
  validateExternalGetEffectiveResourceSchemaSuccess,
  validateExternalGetResourceSuccess,
  validateExternalGetTaxonomySuccess,
  validateExternalGetValidOptionsSuccess,
  validateExternalSearchResourcesRequest,
} from "../src/external-garfex-boundary/client-facing/validation.js";

const manifestEnum = (name: string): readonly (string | number)[] => {
  const definition = semanticManifest.enums.find((candidate) => candidate.name === name);
  if (definition === undefined) throw new Error(`missing generated enum ${name}`);
  return definition.values;
};

const taxonomy = {
  items: [
    {
      code: "hardware",
      name: "Hardware",
      families: [{ code: "wire", name: "Wire", types: [] }],
    },
  ],
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
    },
  ],
  canonicalIdentity: "hardware|wire|solid-wire|finish=bare",
  identityPolicyVersion: "v1",
  active: true,
  revision: 3,
};

describe("generated runtime contract consumption", () => {
  it("exposes the generated readonly contract metadata without redeclaration", () => {
    expect(contractMetadata).toBe(generatedContractMetadata);
    expect(externalContractIdentity).toBe(generatedExternalContractIdentity);
    expect(compatibilityRevision).toBe(generatedCompatibilityRevision);
    expect(externalOperationIdentifiers).toEqual(
      semanticManifest.operations.map(({ name }) => name),
    );
    expect(new Set(externalErrorCodes)).toEqual(new Set(manifestEnum("ExternalFailureCode")));
  });

  it("interprets generated request, success, union, and enum semantics", () => {
    const request = validateExternalCreateResourceRequest({
      classCode: "hardware",
      familyCode: "wire",
      typeCode: "solid-wire",
      naturalUnitCode: "meter",
      attributes: resource.attributes,
    });
    expect(request).toEqual({
      classCode: "hardware",
      familyCode: "wire",
      typeCode: "solid-wire",
      naturalUnitCode: "meter",
      attributes: resource.attributes,
    });

    const taxonomyResult = validateExternalGetTaxonomySuccess(taxonomy);
    expect(taxonomyResult).toEqual(taxonomy);
    expect(taxonomyResult).not.toBe(taxonomy);
    expect(validateExternalGetValidOptionsSuccess({ options: [] })).toEqual({ options: [] });
    expect(validateExternalGetResourceSuccess({ resource })).toEqual({ resource });
    expect(
      validateExternalFailure({
        ok: false,
        error: {
          code: "INVALID_ARGUMENT",
          fieldIssues: [{ field: "resourceId", reason: "REQUIRED" }],
        },
      }),
    ).toEqual({
      ok: false,
      error: {
        code: "INVALID_ARGUMENT",
        fieldIssues: [{ field: "resourceId", reason: "REQUIRED" }],
      },
    });
  });

  it("exercises every generated closed enum, union, nullable, and scalar constraint", () => {
    const lifecycleValues = manifestEnum("ResourceLifecycleFilter");
    for (const lifecycle of lifecycleValues) {
      expect(validateExternalSearchResourcesRequest({ terms: "wire", lifecycle })).toEqual({
        terms: "wire",
        lifecycle,
      });
    }

    const attributeKinds = manifestEnum("AttributeKind");
    for (const kind of attributeKinds) {
      expect(
        validateExternalGetEffectiveResourceSchemaSuccess({
          attributes: [
            {
              code: "finish",
              name: "Finish",
              kind,
              meaning: "Surface finish",
              defaultResult: { mode: "OPTIONAL", identity: true },
              rules: [],
            },
          ],
        }),
      ).toEqual({
        attributes: [
          {
            code: "finish",
            name: "Finish",
            kind,
            meaning: "Surface finish",
            defaultResult: { mode: "OPTIONAL", identity: true },
            rules: [],
          },
        ],
      });
    }

    for (const mode of manifestEnum("ApplicabilityMode")) {
      expect(
        validateExternalGetEffectiveResourceSchemaSuccess({
          attributes: [
            {
              code: "finish",
              name: "Finish",
              kind: "CONTROLLED_OPTION",
              meaning: "Surface finish",
              defaultResult: { mode, identity: true },
              rules: [],
            },
          ],
        }),
      ).not.toMatchObject({ ok: false });
    }

    for (const version of manifestEnum("IdentityPolicyVersion")) {
      expect(
        validateExternalGetResourceSuccess({
          resource: { ...resource, identityPolicyVersion: version },
        }),
      ).toEqual({ resource: { ...resource, identityPolicyVersion: version } });
    }

    for (const reason of manifestEnum("FieldIssueReason")) {
      const failure = {
        ok: false,
        error: { code: "INVALID_ARGUMENT", fieldIssues: [{ field: "resourceId", reason }] },
      };
      expect(validateExternalFailure(failure)).toEqual(failure);
    }

    for (const code of manifestEnum("ExternalFailureCode")) {
      const failure = { ok: false, error: { code } };
      expect(validateExternalFailure(failure)).toEqual(failure);
    }

    for (const value of ["text", false, { magnitude: "12", unitCode: "awg" }]) {
      expect(
        validateExternalCreateResourceRequest({
          classCode: "hardware",
          familyCode: "wire",
          typeCode: "solid-wire",
          naturalUnitCode: "meter",
          attributes: [
            {
              attributeCode: "value",
              value,
              displayValue: String(value),
              identityParticipating: false,
            },
          ],
        }),
      ).toMatchObject({ attributes: [{ value }] });
    }
    expect(
      validateExternalCreateResourceRequest({
        classCode: "hardware",
        familyCode: "wire",
        typeCode: "solid-wire",
        naturalUnitCode: "meter",
        attributes: [
          {
            attributeCode: "value",
            value: { text: "not-an-untagged-value" },
            displayValue: "invalid",
            identityParticipating: false,
          },
        ],
      }),
    ).toMatchObject({ ok: false });

    expect(validateExternalSearchResourcesRequest({ terms: "wire", cursor: null })).toEqual({
      terms: "wire",
      cursor: null,
    });
    expect(validateExternalSearchResourcesRequest({ terms: "wire", cursor: "opaque" })).toEqual({
      terms: "wire",
      cursor: "opaque",
    });
    expect(validateExternalSearchResourcesRequest({ terms: "", limit: 1 })).toMatchObject({
      ok: false,
    });
    expect(validateExternalSearchResourcesRequest({ terms: "wire", limit: 0 })).toMatchObject({
      ok: false,
    });
    expect(validateExternalSearchResourcesRequest({ terms: "wire", limit: 51 })).toMatchObject({
      ok: false,
    });
    expect(validateExternalSearchResourcesRequest({ terms: "wire", limit: 1 })).toEqual({
      terms: "wire",
      limit: 1,
    });
    expect(validateExternalSearchResourcesRequest({ terms: "wire", limit: 50 })).toEqual({
      terms: "wire",
      limit: 50,
    });
  });

  it("contains hostile values and malformed projected results without releasing metadata", () => {
    const symbol = Symbol("provider-secret");
    const symbolArray = Object.assign([{ code: "bare", label: "Bare" }], {
      [symbol]: "secret",
    });
    expect(validateExternalGetValidOptionsSuccess(symbolArray)).toEqual({
      ok: false,
      error: { code: "INTERNAL_FAILURE" },
    });

    const sparse = new Array(1);
    expect(validateExternalGetValidOptionsSuccess(sparse)).toEqual({
      ok: false,
      error: { code: "INTERNAL_FAILURE" },
    });

    const extended = Object.assign([{ code: "bare", label: "Bare" }], {
      internalField: "secret",
    });
    expect(validateExternalGetValidOptionsSuccess(extended)).toEqual({
      ok: false,
      error: { code: "INTERNAL_FAILURE" },
    });

    const throwing = [] as unknown[];
    Object.defineProperty(throwing, "0", {
      configurable: true,
      enumerable: true,
      get: () => {
        throw new Error("internal getter secret");
      },
    });
    throwing.length = 1;
    expect(validateExternalGetValidOptionsSuccess(throwing)).toEqual({
      ok: false,
      error: { code: "INTERNAL_FAILURE" },
    });

    const nullPrototype = Object.create(null) as Record<string, unknown>;
    nullPrototype.resource = resource;
    expect(validateExternalGetResourceSuccess(nullPrototype)).toEqual({
      resource,
    });

    expect(
      validateExternalFailure({
        ok: false,
        error: { code: "FORBIDDEN", message: "provider secret" },
      }),
    ).toEqual({
      ok: false,
      error: { code: "INTERNAL_FAILURE" },
    });
  });
});
