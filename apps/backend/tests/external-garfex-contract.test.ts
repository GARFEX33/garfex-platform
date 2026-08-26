import { describe, expect, it } from "vitest";
import {
  type ExternalAttributeValue,
  type ExternalError,
  type ExternalFailure,
  type ExternalOperation,
  type ExternalOutcome,
  type ExternalRequests,
  type ExternalSuccesses,
  externalErrorCodes,
  externalOperationIdentifiers,
} from "../src/external-garfex-boundary/client-facing/contract.js";
import {
  parseExternalOperationIdentifier,
  validateExternalCreateResourceRequest,
  validateExternalCreateResourceSuccess,
  validateExternalDeactivateResourceRequest,
  validateExternalDeactivateResourceSuccess,
  validateExternalDescribeResourceRequest,
  validateExternalDescribeResourceSuccess,
  validateExternalFailure,
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
    attributes: [
      { attributeCode: "finish", value: "bare", displayValue: "Bare", identityParticipating: true },
      { attributeCode: "stranded", value: false, displayValue: "No", identityParticipating: false },
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
    error: { code: "INVALID_ARGUMENT", fieldIssues: [{ field: "resourceId", reason: "REQUIRED" }] },
  },
  {
    ok: false,
    error: {
      code: "INVALID_REFERENCE",
      fieldIssues: [{ field: "familyCode", reason: "UNSUPPORTED" }],
    },
  },
  {
    ok: false,
    error: {
      code: "VALIDATION_FAILED",
      fieldIssues: [{ field: "attributes.gauge", reason: "INVALID_FORMAT" }],
    },
  },
  { ok: false, error: { code: "NOT_FOUND" } },
  { ok: false, error: { code: "DUPLICATE", existingResourceId: "resource-1" } },
  { ok: false, error: { code: "CONFLICT", currentRevision: 2 } },
  { ok: false, error: { code: "INVALID_LIFECYCLE" } },
  { ok: false, error: { code: "CATALOG_UNAVAILABLE" } },
  { ok: false, error: { code: "INTERNAL_FAILURE" } },
];

const taxonomyOutcome: ExternalOutcome<"getTaxonomy"> = { ok: true, value: { items: [] } };
void [ordinaryAttributeValues, safeFailures, taxonomyOutcome];

const successTaxonomy: ExternalSuccesses["getTaxonomy"] = {
  items: [
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
  ],
};
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
const successOptions: ExternalSuccesses["getValidOptions"] = {
  options: [{ code: "bare", label: "Bare" }],
};
const successNaturalUnits: ExternalSuccesses["getNaturalUnits"] = {
  allowed: [{ code: "meter", name: "Meter" }],
  suggested: { code: "meter", name: "Meter" },
};
const successResource: ExternalSuccesses["getResource"] = {
  resource: {
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
  },
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
  ["getTaxonomy", [{ ...successTaxonomy.items[0], internalField: "secret" }]],
  [
    "getEffectiveResourceSchema",
    { ...successSchema, attributes: [{ ...successSchema.attributes[0], internalField: "secret" }] },
  ],
  ["getValidOptions", [{ ...successOptions.options[0], internalField: "secret" }]],
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
    expect(result).toMatchObject({
      error: { fieldIssues: [{ field: path.startsWith("attributes.") ? "attributes" : path }] },
    });
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
        "attributes",
      );
      expectInvalid(
        validateExternalCreateResourceRequest({
          classCode: "c",
          familyCode: "f",
          typeCode: "t",
          naturalUnitCode: "u",
          attributes: { providerId: "forged" },
        }),
        "attributes",
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
      for (const value of [1.5, Number.MAX_SAFE_INTEGER + 1]) {
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

  describe("external GARFEX discovery output validation", () => {
    it("rebuilds discovery success shapes with fresh nested values", () => {
      for (const operation of discoveryOperations) {
        const input = successValues[operation];
        const result = successValidators[operation](input);
        expect(result).toEqual(input);
        expectFresh(input, result);
      }
    });

    it("rejects extra or malformed discovery fields as contained failures", () => {
      for (const [operation, value] of extraSuccessCases) {
        expectInternalFailure(successValidators[operation](value));
      }

      const malformedSuccessCases: SuccessExtraCase[] = [
        ["getTaxonomy", [{ code: "hardware", name: "Hardware", families: "invalid" }]],
        [
          "getEffectiveResourceSchema",
          { attributes: [{ ...successSchema.attributes[0], kind: "UNREVIEWED" }] },
        ],
        ["getValidOptions", [{ code: "bare", label: 4 }]],
        ["getNaturalUnits", { allowed: [], suggested: null }],
      ];
      for (const [operation, value] of malformedSuccessCases) {
        expectInternalFailure(successValidators[operation](value));
      }
    });

    it("contains hostile discovery values without diagnostics", () => {
      const extraArray = Object.assign([], { internalField: "secret" });
      expectInternalFailure(validateExternalGetValidOptionsSuccess(extraArray));
      expectInternalFailure(
        validateExternalGetEffectiveResourceSchemaSuccess({
          get attributes() {
            throw new Error("internal schema secret");
          },
        }),
      );
      expectInternalFailure(
        validateExternalGetTaxonomySuccess(
          Object.assign(
            { ...successTaxonomy, items: [...successTaxonomy.items] },
            { internalField: "secret" },
          ),
        ),
      );
      expectInternalFailure(
        validateExternalGetNaturalUnitsSuccess({
          ...successNaturalUnits,
          suggested: { ...successNaturalUnits.suggested, internalField: "secret" },
        }),
      );
    });

    it("accepts null-prototype discovery objects and rebuilds them", () => {
      const entry = Object.create(null) as Record<string, unknown>;
      entry.code = "hardware";
      entry.name = "Hardware";
      entry.families = [];
      const result = validateExternalGetTaxonomySuccess({ items: [entry] });
      expect(result).toEqual({ items: [{ code: "hardware", name: "Hardware", families: [] }] });
      if ("ok" in result) return;
      expect(result.items[0]).not.toBe(entry);
    });

    it("contains symbols, accessors, sparse arrays, and hostile attribute keys", () => {
      const symbol = Symbol("provider-secret");
      const symbolRequest = {
        resourceId: "resource-1",
        [symbol]: "secret",
      };
      expectInvalid(validateExternalGetResourceRequest(symbolRequest));

      const throwingRequest = {
        get resourceId(): never {
          throw new Error("identity getter secret");
        },
      };
      expectInvalid(validateExternalGetResourceRequest(throwingRequest));

      const sparse = new Array(1);
      expectInternalFailure(validateExternalGetValidOptionsSuccess(sparse));

      const extended = Object.assign([{ code: "bare", label: "Bare" }], {
        internalField: "secret",
        [symbol]: "secret",
      });
      expectInternalFailure(validateExternalGetValidOptionsSuccess(extended));

      const throwingItem = [] as unknown[];
      Object.defineProperty(throwingItem, "0", {
        configurable: true,
        enumerable: true,
        get: () => {
          throw new Error("option getter secret");
        },
      });
      throwingItem.length = 1;
      expectInternalFailure(validateExternalGetValidOptionsSuccess(throwingItem));

      for (const key of [
        "__proto__",
        "constructor",
        "prototype",
        "actorId",
        "capability",
        "resourceId",
      ]) {
        const attributes = Object.create(null) as Record<string, unknown>;
        Object.defineProperty(attributes, key, {
          configurable: true,
          enumerable: true,
          value: "forged",
        });
        expectInvalid(
          validateExternalCreateResourceRequest({
            classCode: "hardware",
            familyCode: "wire",
            typeCode: "solid-wire",
            naturalUnitCode: "meter",
            attributes,
          }),
          `attributes.${key}`,
        );
      }

      const attributeGetter = Object.create(null) as Record<string, unknown>;
      Object.defineProperty(attributeGetter, "finish", {
        configurable: true,
        enumerable: true,
        get: () => {
          throw new Error("attribute getter secret");
        },
      });
      expectInvalid(
        validateExternalCreateResourceRequest({
          classCode: "hardware",
          familyCode: "wire",
          typeCode: "solid-wire",
          naturalUnitCode: "meter",
          attributes: attributeGetter,
        }),
        "attributes.finish",
      );
    });
  });

  describe("external GARFEX resource/search/mutation output validation", () => {
    it("rebuilds every remaining success shape with fresh nested values", () => {
      for (const operation of resourceSuccessOperations) {
        const result = resourceSuccessValidators[operation](successResource);
        expect(result).toEqual(successResource);
        expectFresh(successResource, result);
      }

      const searchResult = validateExternalSearchResourcesSuccess(successSearch);
      expect(searchResult).toEqual(successSearch);
      expectFresh(successSearch, searchResult);

      const descriptionResult = validateExternalDescribeResourceSuccess(successDescription);
      expect(descriptionResult).toEqual(successDescription);
      expectFresh(successDescription, descriptionResult);
    });

    it("preserves opaque cursors and nullable final-page cursors", () => {
      const continued = validateExternalSearchResourcesSuccess(successSearch);
      expect(continued).toMatchObject({ cursor: "opaque|cursor-v2|private-state" });
      expect(JSON.parse(JSON.stringify(continued))).toEqual(successSearch);

      const finalPage = { ...successSearch, cursor: null };
      expect(validateExternalSearchResourcesSuccess(finalPage)).toEqual(finalPage);
    });

    it("rejects extra and malformed resource, search, and description fields", () => {
      const resourceWithAuthority = { ...successResource, actorId: "forged" };
      for (const operation of resourceSuccessOperations) {
        expectInternalFailure(resourceSuccessValidators[operation](resourceWithAuthority));
      }

      const resourceWithNestedPlatformField = {
        ...successResource,
        attributes: successResource.resource.attributes.map((attribute) =>
          attribute.attributeCode === "finish"
            ? { ...attribute, platformSecret: "hidden" }
            : attribute,
        ),
      };
      expectInternalFailure(validateExternalGetResourceSuccess(resourceWithNestedPlatformField));

      const resourceWithQuantityExtra = {
        ...successResource,
        attributes: successResource.resource.attributes.map((attribute) =>
          attribute.attributeCode === "gauge"
            ? { ...attribute, value: { magnitude: "12", unitCode: "awg", internalUnit: "hidden" } }
            : attribute,
        ),
      };
      expectInternalFailure(validateExternalCreateResourceSuccess(resourceWithQuantityExtra));

      expectInternalFailure(
        validateExternalSearchResourcesSuccess({
          ...successSearch,
          items: successSearch.items.map((item) => ({ ...item, repositoryId: "hidden" })),
        }),
      );
      expectInternalFailure(
        validateExternalSearchResourcesSuccess({ ...successSearch, cursor: 12 }),
      );
      expectInternalFailure(validateExternalSearchResourcesSuccess({ items: successSearch.items }));
      expectInternalFailure(
        validateExternalDescribeResourceSuccess({ ...successDescription, internalField: true }),
      );
    });

    it("contains malformed output and hostile serialization values", () => {
      expectInternalFailure(
        validateExternalGetResourceSuccess({ ...successResource, revision: -1 }),
      );
      expectInternalFailure(
        validateExternalUpdateNonIdentityDataSuccess({
          ...successResource,
          identityPolicyVersion: "v2",
        }),
      );
      expectInternalFailure(
        validateExternalSearchResourcesSuccess({
          ...successSearch,
          items: successSearch.items.map((item) => ({ ...item, optionCodes: [12] })),
        }),
      );
      expectInternalFailure(validateExternalDescribeResourceSuccess({ resourceId: "resource-1" }));

      const hostileResource = {
        ...successResource,
        get attributes(): never {
          throw new Error("internal resource secret");
        },
      };
      const result = validateExternalDeactivateResourceSuccess(hostileResource);
      expectInternalFailure(result);
      expect(JSON.stringify(result)).not.toContain("internal resource secret");
    });
  });

  describe("external GARFEX failure validation", () => {
    it("rebuilds all eleven failures with only code-allowlisted metadata", () => {
      const expectedKeys: Record<ExternalError["code"], readonly string[]> = {
        UNAUTHENTICATED: ["code"],
        FORBIDDEN: ["code"],
        INVALID_ARGUMENT: ["code", "fieldIssues"],
        INVALID_REFERENCE: ["code", "fieldIssues"],
        VALIDATION_FAILED: ["code", "fieldIssues"],
        NOT_FOUND: ["code"],
        DUPLICATE: ["code", "existingResourceId"],
        CONFLICT: ["code", "currentRevision"],
        INVALID_LIFECYCLE: ["code"],
        CATALOG_UNAVAILABLE: ["code"],
        INTERNAL_FAILURE: ["code"],
      };

      expect(safeFailures).toHaveLength(11);
      for (const failure of safeFailures) {
        const result = validateExternalFailure(failure);
        expect(result).toEqual(failure);
        expectFresh(failure, result);
        expect(Object.keys(result.error)).toEqual(expectedKeys[failure.error.code]);
      }
    });

    it("rebuilds omitted metadata from null-prototype failures", () => {
      const codes = [
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

      for (const code of codes) {
        const error = Object.create(null) as Record<string, unknown>;
        error.code = code;
        const failure = Object.create(null) as Record<string, unknown>;
        failure.ok = false;
        failure.error = error;
        const result = validateExternalFailure(failure);
        expect(result).toEqual({ ok: false, error: { code } });
        expect(result.error).not.toBe(error);
      }
    });

    it("rejects unknown, extra, and malformed failure shapes", () => {
      const symbol = Symbol("platform-secret");
      const symbolFailure = { ok: false, error: { code: "FORBIDDEN" } } as Record<
        PropertyKey,
        unknown
      >;
      symbolFailure[symbol] = "provider-secret";

      const throwingFailures: unknown[] = [
        {
          get ok(): never {
            throw new Error("stack-secret");
          },
        },
        {
          ok: false,
          get error(): never {
            throw new Error("provider-secret");
          },
        },
        {
          ok: false,
          error: {
            get code(): never {
              throw new Error("internal-secret");
            },
          },
        },
        {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            get fieldIssues(): never {
              throw new Error("message-secret");
            },
          },
        },
        {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            fieldIssues: [
              {
                get path(): never {
                  throw new Error("authority-secret");
                },
                reason: "INVALID_FORMAT",
              },
            ],
          },
        },
        {
          ok: false,
          error: {
            code: "DUPLICATE",
            get existingResourceId(): never {
              throw new Error("persistence-secret");
            },
          },
        },
        {
          ok: false,
          error: {
            code: "CONFLICT",
            get currentRevision(): never {
              throw new Error("catalog-secret");
            },
          },
        },
      ];

      const malformedFailures: unknown[] = [
        null,
        undefined,
        [],
        new Date(),
        { ok: true, value: "not-a-failure" },
        { ok: false },
        { ok: false, error: null },
        { ok: false, error: { code: "UNKNOWN" } },
        { ok: false, error: { code: "FORBIDDEN", message: "secret" } },
        { ok: false, error: { code: "FORBIDDEN", fieldIssues: [] } },
        { ok: false, error: { code: "NOT_FOUND", details: "secret" } },
        {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            fieldIssues: [{ field: "field", reason: "INVALID_FORMAT" }],
            extra: true,
          },
        },
        {
          ok: false,
          error: {
            code: "DUPLICATE",
            existingResourceId: "resource-1",
            currentRevision: 2,
          },
        },
        {
          ok: false,
          error: { code: "CONFLICT", currentRevision: 2, existingResourceId: "resource-1" },
        },
        { ok: false, error: { code: "DUPLICATE", existingResourceId: "" } },
        { ok: false, error: { code: "CONFLICT", currentRevision: 1.5 } },
        { ok: false, error: { code: "INVALID_ARGUMENT", fieldIssues: "not-an-array" } },
        { ok: false, error: { code: "INVALID_ARGUMENT", fieldIssues: [null] } },
        {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            fieldIssues: [{ field: "", reason: "INVALID_FORMAT" }],
          },
        },
        {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            fieldIssues: [{ field: "field\nsecret", reason: "INVALID_FORMAT" }],
          },
        },
        {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            fieldIssues: [{ field: "field", reason: "UNKNOWN_REASON" }],
          },
        },
        {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            fieldIssues: [{ field: "field", reason: "INVALID_FORMAT", value: "secret" }],
          },
        },
        symbolFailure,
        ...throwingFailures,
      ];

      for (const value of malformedFailures) {
        expectInternalFailure(validateExternalFailure(value));
      }
    });

    it("keeps serialized failures free of internal diagnostics", () => {
      const secrets = [
        "message-secret",
        "stack-secret",
        "provider-secret",
        "authority-secret",
        "platform-secret",
        "internal-secret",
      ];
      const unsafeFailures: unknown[] = [
        {
          ok: false,
          error: {
            code: "FORBIDDEN",
            message: secrets[0],
            stack: secrets[1],
            provider: secrets[2],
            authority: secrets[3],
            platform: secrets[4],
            internal: secrets[5],
          },
        },
        {
          ok: false,
          error: {
            code: "DUPLICATE",
            existingResourceId: "resource-1",
            details: secrets.join("|"),
          },
        },
        {
          ok: false,
          error: {
            code: "INVALID_ARGUMENT",
            fieldIssues: [{ field: "field", reason: "INVALID_FORMAT", message: secrets[0] }],
          },
        },
      ];

      for (const value of unsafeFailures) {
        const result = validateExternalFailure(value);
        expectInternalFailure(result);
        const serialized = JSON.stringify(result);
        expect(serialized).not.toContain("secret");
        expect(serialized).toBe('{"ok":false,"error":{"code":"INTERNAL_FAILURE"}}');
      }

      expect(JSON.stringify(validateExternalFailure(safeFailures[2]))).toBe(
        '{"ok":false,"error":{"code":"INVALID_ARGUMENT","fieldIssues":[{"field":"resourceId","reason":"REQUIRED"}]}}',
      );
    });
  });
});
