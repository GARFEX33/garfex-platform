import { describe, expect, it } from "vitest";
import {
  externalErrorCodes,
  externalOperationIdentifiers,
  type ExternalAttributeValue,
  type ExternalError,
  type ExternalFailure,
  type ExternalOperation,
  type ExternalOutcome,
  type ExternalRequests,
  type ExternalSuccesses,
} from "../src/external-garfex-boundary/client-facing/contract.js";
import {
  parseExternalOperationIdentifier,
  validateExternalCreateResourceRequest,
  validateExternalCreateResourceSuccess,
  validateExternalDeactivateResourceRequest,
  validateExternalDeactivateResourceSuccess,
  validateExternalDescribeResourceRequest,
  validateExternalDescribeResourceSuccess,
  validateExternalGetEffectiveResourceSchemaRequest,
  validateExternalGetEffectiveResourceSchemaSuccess,
  validateExternalGetNaturalUnitsRequest,
  validateExternalGetNaturalUnitsSuccess,
  validateExternalGetResourceRequest,
  validateExternalGetResourceSuccess,
  validateExternalGetTaxonomyRequest,
  validateExternalGetTaxonomySuccess,
  validateExternalGetValidOptionsRequest,
  validateExternalGetValidOptionsSuccess,
  validateExternalSearchResourcesRequest,
  validateExternalSearchResourcesSuccess,
  validateExternalFailure,
  validateExternalUpdateNonIdentityDataRequest,
  validateExternalUpdateNonIdentityDataSuccess,
} from "../src/external-garfex-boundary/client-facing/validation.js";

const expectedOperations = [
  "getTaxonomy",
  "getEffectiveResourceSchema",
  "getValidOptions",
  "getNaturalUnits",
  "getResource",
  "searchResources",
  "describeResource",
  "createResource",
  "updateNonIdentityData",
  "deactivateResource",
] as const;

const expectedErrors = [
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "INVALID_ARGUMENT",
  "INVALID_REFERENCE",
  "VALIDATION_FAILED",
  "NOT_FOUND",
  "DUPLICATE",
  "CONFLICT",
  "INVALID_LIFECYCLE",
  "CATALOG_UNAVAILABLE",
  "INTERNAL_FAILURE",
] as const;

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2
    ? true
    : false;
type Assert<T extends true> = T;

type _OperationUnionIsClosed = Assert<
  Equal<ExternalOperation, (typeof expectedOperations)[number]>
>;
type _RequestMapIsKeyedByOperation = Assert<Equal<keyof ExternalRequests, ExternalOperation>>;
type _SuccessMapIsKeyedByOperation = Assert<Equal<keyof ExternalSuccesses, ExternalOperation>>;
type _ErrorHasNoMessage = Assert<
  Equal<"message" extends keyof ExternalError ? true : false, false>
>;
type _ErrorHasNoDetails = Assert<
  Equal<"details" extends keyof ExternalError ? true : false, false>
>;
type _ForbiddenHasNoFieldIssues = Assert<
  Equal<
    "fieldIssues" extends keyof Extract<ExternalError, { readonly code: "FORBIDDEN" }>
      ? true
      : false,
    false
  >
>;
type _DuplicateHasIdentifierMetadata = Assert<
  Equal<
    "existingResourceId" extends keyof Extract<ExternalError, { readonly code: "DUPLICATE" }>
      ? true
      : false,
    true
  >
>;
type _ConflictHasRevisionMetadata = Assert<
  Equal<
    "currentRevision" extends keyof Extract<ExternalError, { readonly code: "CONFLICT" }>
      ? true
      : false,
    true
  >
>;

const contractTypeAssertions: [
  _OperationUnionIsClosed,
  _RequestMapIsKeyedByOperation,
  _SuccessMapIsKeyedByOperation,
  _ErrorHasNoMessage,
  _ErrorHasNoDetails,
  _ForbiddenHasNoFieldIssues,
  _DuplicateHasIdentifierMetadata,
  _ConflictHasRevisionMetadata,
] = [true, true, true, true, true, true, true, true];
void contractTypeAssertions;

const ordinaryRequests: ExternalRequests = {
  getTaxonomy: {},
  getEffectiveResourceSchema: {
    classCode: "hardware",
    familyCode: "wire",
    typeCode: "solid-wire",
  },
  getValidOptions: { attributeCode: "finish" },
  getNaturalUnits: { familyCode: "wire" },
  getResource: { resourceId: "resource-1" },
  searchResources: { terms: "copper", cursor: null },
  describeResource: { resourceId: "resource-1" },
  createResource: {
    classCode: "hardware",
    familyCode: "wire",
    typeCode: "solid-wire",
    naturalUnitCode: "meter",
    attributes: {
      finish: "bare",
      stranded: false,
      gauge: { magnitude: "12", unitCode: "awg" },
    },
  },
  updateNonIdentityData: {
    resourceId: "resource-1",
    expectedRevision: 2,
    naturalUnitCode: "meter",
  },
  deactivateResource: { resourceId: "resource-1", expectedRevision: 2 },
};

const ordinaryAttributeValues: ExternalAttributeValue[] = [
  "bare",
  false,
  { magnitude: "12", unitCode: "awg" },
];

const safeFailures: ExternalFailure[] = [
  { ok: false, error: { code: "UNAUTHENTICATED" } },
  { ok: false, error: { code: "FORBIDDEN" } },
  {
    ok: false,
    error: { code: "INVALID_ARGUMENT", fieldIssues: [{ path: "resourceId", reason: "REQUIRED" }] },
  },
  {
    ok: false,
    error: {
      code: "INVALID_REFERENCE",
      fieldIssues: [{ path: "familyCode", reason: "INVALID_VALUE" }],
    },
  },
  {
    ok: false,
    error: {
      code: "VALIDATION_FAILED",
      fieldIssues: [{ path: "attributes.gauge", reason: "TYPE" }],
    },
  },
  { ok: false, error: { code: "NOT_FOUND" } },
  { ok: false, error: { code: "DUPLICATE", existingResourceId: "resource-1" } },
  { ok: false, error: { code: "CONFLICT", currentRevision: 2 } },
  { ok: false, error: { code: "INVALID_LIFECYCLE" } },
  { ok: false, error: { code: "CATALOG_UNAVAILABLE" } },
  { ok: false, error: { code: "INTERNAL_FAILURE" } },
];

const taxonomyOutcome: ExternalOutcome<"getTaxonomy"> = { ok: true, value: [] };
void [ordinaryAttributeValues, safeFailures, taxonomyOutcome];

const successTaxonomy: ExternalSuccesses["getTaxonomy"] = [
  {
    code: "hardware",
    name: "Hardware",
    families: [
      {
        code: "wire",
        name: "Wire",
        types: [{ code: "solid-wire", name: "Solid wire" }],
      },
    ],
  },
];
const successSchema: ExternalSuccesses["getEffectiveResourceSchema"] = {
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
};
const successOptions: ExternalSuccesses["getValidOptions"] = [{ code: "bare", label: "Bare" }];
const successNaturalUnits: ExternalSuccesses["getNaturalUnits"] = {
  allowed: [{ code: "meter", name: "Meter" }],
  suggested: { code: "meter", name: "Meter" },
};
const successResource: ExternalSuccesses["getResource"] = {
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
      attributeCode: "stranded",
      value: false,
      displayValue: "No",
      identityParticipating: false,
    },
    {
      attributeCode: "gauge",
      value: { magnitude: "12", unitCode: "awg" },
      displayValue: "12",
      identityParticipating: true,
    },
  ],
  canonicalIdentity: "hardware|wire|solid-wire|finish=bare|gauge=12-awg",
  identityPolicyVersion: "v1",
  active: true,
  revision: 3,
};
const successSearch: ExternalSuccesses["searchResources"] = {
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
  cursor: "opaque|cursor-v2|private-state",
};
const successDescription: ExternalSuccesses["describeResource"] = {
  resourceId: "resource-1",
  description: "Hardware Wire Solid wire",
};
const resourceSuccessOperations = [
  "getResource",
  "createResource",
  "updateNonIdentityData",
  "deactivateResource",
] as const;
type ResourceSuccessOperation = (typeof resourceSuccessOperations)[number];
const resourceSuccessValidators: Record<ResourceSuccessOperation, OutputValidator> = {
  getResource: validateExternalGetResourceSuccess,
  createResource: validateExternalCreateResourceSuccess,
  updateNonIdentityData: validateExternalUpdateNonIdentityDataSuccess,
  deactivateResource: validateExternalDeactivateResourceSuccess,
};
const discoveryOperations = [
  "getTaxonomy",
  "getEffectiveResourceSchema",
  "getValidOptions",
  "getNaturalUnits",
] as const;
type DiscoveryOperation = (typeof discoveryOperations)[number];
const successValues = {
  getTaxonomy: successTaxonomy,
  getEffectiveResourceSchema: successSchema,
  getValidOptions: successOptions,
  getNaturalUnits: successNaturalUnits,
} satisfies { [Operation in DiscoveryOperation]: ExternalSuccesses[Operation] };

type OutputValidator = (value: unknown) => unknown;
const successValidators: Record<DiscoveryOperation, OutputValidator> = {
  getTaxonomy: validateExternalGetTaxonomySuccess,
  getEffectiveResourceSchema: validateExternalGetEffectiveResourceSchemaSuccess,
  getValidOptions: validateExternalGetValidOptionsSuccess,
  getNaturalUnits: validateExternalGetNaturalUnitsSuccess,
};

function expectFresh(source: unknown, rebuilt: unknown): void {
  if (source === null || typeof source !== "object") return;
  expect(rebuilt).not.toBe(source);
  if (Array.isArray(source)) {
    expect(Array.isArray(rebuilt)).toBe(true);
    if (!Array.isArray(rebuilt)) return;
    source.forEach((item, index) => {
      expectFresh(item, rebuilt[index]);
    });
    return;
  }
  if (rebuilt === null || typeof rebuilt !== "object" || Array.isArray(rebuilt)) return;
  for (const key of Object.keys(source)) {
    expectFresh(
      (source as Record<string, unknown>)[key],
      (rebuilt as Record<string, unknown>)[key],
    );
  }
}

function expectInternalFailure(result: unknown): void {
  expect(result).toEqual({ ok: false, error: { code: "INTERNAL_FAILURE" } });
  expect(JSON.stringify(result)).toBe('{"ok":false,"error":{"code":"INTERNAL_FAILURE"}}');
}

type SuccessExtraCase = [DiscoveryOperation, unknown];
const extraSuccessCases: SuccessExtraCase[] = [
  ["getTaxonomy", [{ ...successTaxonomy[0], internalField: "secret" }]],
  [
    "getEffectiveResourceSchema",
    { ...successSchema, attributes: [{ ...successSchema.attributes[0], internalField: "secret" }] },
  ],
  ["getValidOptions", [{ ...successOptions[0], internalField: "secret" }]],
  [
    "getNaturalUnits",
    {
      ...successNaturalUnits,
      suggested: { ...successNaturalUnits.suggested, internalField: "secret" },
    },
  ],
];

type RequestValidator = (value: unknown) => unknown;

const requestValidators: Record<ExternalOperation, RequestValidator> = {
  getTaxonomy: validateExternalGetTaxonomyRequest,
  getEffectiveResourceSchema: validateExternalGetEffectiveResourceSchemaRequest,
  getValidOptions: validateExternalGetValidOptionsRequest,
  getNaturalUnits: validateExternalGetNaturalUnitsRequest,
  getResource: validateExternalGetResourceRequest,
  searchResources: validateExternalSearchResourcesRequest,
  describeResource: validateExternalDescribeResourceRequest,
  createResource: validateExternalCreateResourceRequest,
  updateNonIdentityData: validateExternalUpdateNonIdentityDataRequest,
  deactivateResource: validateExternalDeactivateResourceRequest,
};

function expectInvalid(result: unknown, path?: string): void {
  expect(result).toMatchObject({ ok: false, error: { code: "INVALID_ARGUMENT" } });
  if (path !== undefined) {
    expect(result).toMatchObject({ error: { fieldIssues: [{ path }] } });
  }
}

describe("external GARFEX client-facing contract", () => {
  it("contains exactly the ten approved operation identifiers", () => {
    expect(externalOperationIdentifiers).toEqual(expectedOperations);
    expect(new Set(externalOperationIdentifiers).size).toBe(10);
  });

  it("contains exactly the eleven safe external error codes", () => {
    expect(externalErrorCodes).toEqual(expectedErrors);
    expect(new Set(externalErrorCodes).size).toBe(11);
  });

  it("keeps error metadata discriminated and excludes arbitrary messages", () => {
    expect(Object.keys(safeFailures[1]?.error ?? {})).toEqual(["code"]);
    expect(Object.keys(safeFailures[6]?.error ?? {})).toEqual(["code", "existingResourceId"]);
    expect(Object.keys(safeFailures[7]?.error ?? {})).toEqual(["code", "currentRevision"]);
    expect(safeFailures.every((failure) => !("message" in failure.error))).toBe(true);
  });

  describe("external GARFEX request validation", () => {
    it("recognizes only the closed operation set", () => {
      for (const operation of expectedOperations) {
        expect(parseExternalOperationIdentifier(operation)).toBe(operation);
      }
      expectInvalid(parseExternalOperationIdentifier("newInternalOperation"), "operation");
      expectInvalid(parseExternalOperationIdentifier({ operation: "getTaxonomy" }), "operation");
      expectInvalid(parseExternalOperationIdentifier(null), "operation");
    });

    it("rebuilds every closed request and preserves omitted search optionals", () => {
      for (const operation of externalOperationIdentifiers) {
        const input = ordinaryRequests[operation];
        const result = requestValidators[operation](input);
        expect(result).toEqual(input);
        expect(result).not.toBe(input);
      }

      const search = requestValidators.searchResources({ terms: "wire" });
      expect(search).toEqual({ terms: "wire" });
      expect(Object.keys(search as Record<string, unknown>)).toEqual(["terms"]);

      const completeSearch = requestValidators.searchResources({
        terms: "wire",
        cursor: null,
        limit: 50,
        lifecycle: "ALL",
      });
      expect(completeSearch).toEqual({
        terms: "wire",
        cursor: null,
        limit: 50,
        lifecycle: "ALL",
      });
    });

    it("fails closed for malformed requests and stable field paths", () => {
      for (const validator of Object.values(requestValidators)) {
        for (const value of [null, [], new Date()]) {
          expectInvalid(validator(value));
        }
      }

      const missingFields: Array<[RequestValidator, unknown, string]> = [
        [
          validateExternalGetEffectiveResourceSchemaRequest,
          { classCode: "c", familyCode: "f" },
          "typeCode",
        ],
        [validateExternalGetValidOptionsRequest, {}, "attributeCode"],
        [validateExternalGetNaturalUnitsRequest, {}, "familyCode"],
        [validateExternalGetResourceRequest, {}, "resourceId"],
        [validateExternalSearchResourcesRequest, {}, "terms"],
        [validateExternalDescribeResourceRequest, {}, "resourceId"],
        [
          validateExternalCreateResourceRequest,
          { classCode: "c", familyCode: "f", typeCode: "t", naturalUnitCode: "u" },
          "attributes",
        ],
        [
          validateExternalUpdateNonIdentityDataRequest,
          { resourceId: "r", naturalUnitCode: "u" },
          "expectedRevision",
        ],
        [validateExternalDeactivateResourceRequest, { expectedRevision: 0 }, "resourceId"],
      ];
      for (const [validator, value, path] of missingFields) {
        expectInvalid(validator(value), path);
      }

      expectInvalid(validateExternalGetTaxonomyRequest({ extra: true }), "extra");
      expectInvalid(validateExternalGetResourceRequest({ resourceId: 4 }), "resourceId");
      expectInvalid(
        validateExternalGetResourceRequest({ resourceId: "r", actorId: "forged" }),
        "actorId",
      );
      expectInvalid(
        validateExternalCreateResourceRequest({
          classCode: "c",
          familyCode: "f",
          typeCode: "t",
          naturalUnitCode: "u",
          attributes: { actorId: "forged" },
        }),
        "attributes.actorId",
      );
      expectInvalid(
        validateExternalCreateResourceRequest({
          classCode: "c",
          familyCode: "f",
          typeCode: "t",
          naturalUnitCode: "u",
          attributes: { providerId: "forged" },
        }),
        "attributes.providerId",
      );
      expectInvalid(
        validateExternalCreateResourceRequest({
          classCode: "c",
          familyCode: "f",
          typeCode: "t",
          naturalUnitCode: "u",
          attributes: {
            quantity: { magnitude: "1", unitCode: "m", extra: true },
          },
        }),
        "attributes.quantity",
      );
      expectInvalid(
        validateExternalCreateResourceRequest({
          classCode: "c",
          familyCode: "f",
          typeCode: "t",
          naturalUnitCode: "u",
          attributes: { quantity: 12 },
        }),
        "attributes.quantity",
      );

      for (const value of [0, 51, 1.5]) {
        expectInvalid(
          validateExternalSearchResourcesRequest({ terms: "wire", limit: value }),
          "limit",
        );
      }
      expectInvalid(
        validateExternalSearchResourcesRequest({ terms: "wire", lifecycle: "BROKEN" }),
        "lifecycle",
      );
      for (const value of ["", "line\nfeed", 2]) {
        expectInvalid(
          validateExternalSearchResourcesRequest({ terms: "wire", cursor: value }),
          "cursor",
        );
      }
      for (const value of [-1, 1.5, Number.MAX_SAFE_INTEGER + 1]) {
        expectInvalid(
          validateExternalDeactivateResourceRequest({ resourceId: "r", expectedRevision: value }),
          "expectedRevision",
        );
      }
    });

    it("rejects unknown authority fields for every request shape", () => {
      const unknownFieldRequests: Array<[ExternalOperation, unknown, string]> = [
        [
          "getEffectiveResourceSchema",
          { classCode: "c", familyCode: "f", typeCode: "t", actorId: "x" },
          "actorId",
        ],
        ["getValidOptions", { attributeCode: "a", role: "x" }, "role"],
        ["getNaturalUnits", { familyCode: "f", capability: "x" }, "capability"],
        ["getResource", { resourceId: "r", token: "x" }, "token"],
        ["searchResources", { terms: "x", claims: "x" }, "claims"],
        ["describeResource", { resourceId: "r", session: "x" }, "session"],
        [
          "createResource",
          {
            classCode: "c",
            familyCode: "f",
            typeCode: "t",
            naturalUnitCode: "u",
            attributes: {},
            actor: "x",
          },
          "actor",
        ],
        [
          "updateNonIdentityData",
          { resourceId: "r", expectedRevision: 0, naturalUnitCode: "u", credentials: "x" },
          "credentials",
        ],
        [
          "deactivateResource",
          { resourceId: "r", expectedRevision: 0, deploymentId: "x" },
          "deploymentId",
        ],
      ];

      for (const [operation, value, path] of unknownFieldRequests) {
        expectInvalid(requestValidators[operation](value), path);
      }

      for (const key of [
        "actorId",
        "providerId",
        "sessionId",
        "convexId",
        "repositoryId",
        "deploymentId",
        "catalogAdmin",
      ]) {
        const attributes: Record<string, unknown> = { [key]: "forged" };
        expectInvalid(
          validateExternalCreateResourceRequest({
            classCode: "c",
            familyCode: "f",
            typeCode: "t",
            naturalUnitCode: "u",
            attributes,
          }),
          `attributes.${key}`,
        );
      }
    });
  });
});
