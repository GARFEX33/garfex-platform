export type JdS002Category = "transport-rejection" | "canonical-invalid" | "accepted";

export type JdS002Case = {
  readonly id: string;
  readonly operation:
    | "getResource"
    | "searchResources"
    | "createResource"
    | "updateNonIdentityData";
  readonly args: unknown;
  readonly category: JdS002Category;
  readonly expectedDownstreamWork: "not-invoked" | "invoked";
  readonly expectedErrorCode?: string;
};

const canonicalAttribute = {
  attributeCode: "conductor_material",
  value: "COBRE",
  displayValue: "COBRE",
  identityParticipating: true,
};

const canonicalCreate = {
  classCode: "MATERIAL",
  familyCode: "CONDUCTORES",
  typeCode: "CABLE",
  naturalUnitCode: "M",
  attributes: [canonicalAttribute],
};

const cyclicArgs: Record<string, unknown> = { resourceId: "missing" };
cyclicArgs.self = cyclicArgs;

class ResourceIdValue {
  readonly resourceId = "missing";
}

export const jdS002Cases: readonly JdS002Case[] = [
  {
    id: "missing-resource-id",
    operation: "getResource",
    args: {},
    category: "transport-rejection",
    expectedDownstreamWork: "not-invoked",
  },
  {
    id: "missing-nested-field",
    operation: "createResource",
    args: { ...canonicalCreate, attributes: [{ attributeCode: "gauge", value: "12" }] },
    category: "transport-rejection",
    expectedDownstreamWork: "not-invoked",
  },
  {
    id: "unknown-request-field",
    operation: "getResource",
    args: { resourceId: "missing", actorId: "forged" },
    category: "transport-rejection",
    expectedDownstreamWork: "not-invoked",
  },
  {
    id: "unknown-nested-field",
    operation: "createResource",
    args: {
      ...canonicalCreate,
      attributes: [{ ...canonicalAttribute, nestedExtra: "rejected" }],
    },
    category: "transport-rejection",
    expectedDownstreamWork: "not-invoked",
  },
  {
    id: "wrong-primitive",
    operation: "getResource",
    args: { resourceId: 42 },
    category: "transport-rejection",
    expectedDownstreamWork: "not-invoked",
  },
  {
    id: "wrong-object-shape",
    operation: "createResource",
    args: { ...canonicalCreate, attributes: {} },
    category: "transport-rejection",
    expectedDownstreamWork: "not-invoked",
  },
  {
    id: "wrong-array-shape",
    operation: "createResource",
    args: { ...canonicalCreate, attributes: [canonicalAttribute, "not-an-attribute"] },
    category: "transport-rejection",
    expectedDownstreamWork: "not-invoked",
  },
  {
    id: "wrong-null-shape",
    operation: "getResource",
    args: { resourceId: null },
    category: "transport-rejection",
    expectedDownstreamWork: "not-invoked",
  },
  {
    id: "legacy-attribute-map",
    operation: "createResource",
    args: { ...canonicalCreate, attributes: { conductor_material: "COBRE" } },
    category: "transport-rejection",
    expectedDownstreamWork: "not-invoked",
  },
  {
    id: "invalid-lifecycle-literal",
    operation: "searchResources",
    args: { terms: "cable", lifecycle: "BROKEN" },
    category: "transport-rejection",
    expectedDownstreamWork: "not-invoked",
  },
  {
    id: "unsupported-int64",
    operation: "updateNonIdentityData",
    args: { resourceId: "missing", expectedRevision: 1n, naturalUnitCode: "M" },
    category: "transport-rejection",
    expectedDownstreamWork: "not-invoked",
  },
  {
    id: "unsupported-bytes",
    operation: "getResource",
    args: { resourceId: new Uint8Array([1, 2, 3]) },
    category: "transport-rejection",
    expectedDownstreamWork: "not-invoked",
  },
  {
    id: "nonserializable-function",
    operation: "getResource",
    args: { resourceId: () => "missing" },
    category: "transport-rejection",
    expectedDownstreamWork: "not-invoked",
  },
  {
    id: "nonserializable-symbol",
    operation: "getResource",
    args: { resourceId: Symbol("resource") },
    category: "transport-rejection",
    expectedDownstreamWork: "not-invoked",
  },
  {
    id: "nonserializable-cycle",
    operation: "getResource",
    args: cyclicArgs,
    category: "transport-rejection",
    expectedDownstreamWork: "not-invoked",
  },
  {
    id: "nonserializable-undefined",
    operation: "getResource",
    args: { resourceId: undefined },
    category: "transport-rejection",
    expectedDownstreamWork: "not-invoked",
  },
  {
    id: "nonserializable-class",
    operation: "getResource",
    args: new ResourceIdValue(),
    category: "transport-rejection",
    expectedDownstreamWork: "not-invoked",
  },
  {
    id: "empty-resource-id",
    operation: "getResource",
    args: { resourceId: "" },
    category: "canonical-invalid",
    expectedDownstreamWork: "not-invoked",
    expectedErrorCode: "INVALID_ARGUMENT",
  },
  {
    id: "control-constrained-string",
    operation: "getResource",
    args: { resourceId: "bad\u0001id" },
    category: "canonical-invalid",
    expectedDownstreamWork: "not-invoked",
    expectedErrorCode: "INVALID_ARGUMENT",
  },
  {
    id: "empty-cursor",
    operation: "searchResources",
    args: { terms: "cable", cursor: "" },
    category: "canonical-invalid",
    expectedDownstreamWork: "not-invoked",
    expectedErrorCode: "INVALID_ARGUMENT",
  },
  {
    id: "fractional-number",
    operation: "updateNonIdentityData",
    args: { resourceId: "missing", expectedRevision: 1.5, naturalUnitCode: "M" },
    category: "canonical-invalid",
    expectedDownstreamWork: "not-invoked",
    expectedErrorCode: "INVALID_ARGUMENT",
  },
  {
    id: "non-finite-number",
    operation: "updateNonIdentityData",
    args: { resourceId: "missing", expectedRevision: Number.NaN, naturalUnitCode: "M" },
    category: "canonical-invalid",
    expectedDownstreamWork: "not-invoked",
    expectedErrorCode: "INVALID_ARGUMENT",
  },
  {
    id: "unsafe-number",
    operation: "updateNonIdentityData",
    args: {
      resourceId: "missing",
      expectedRevision: Number.MAX_SAFE_INTEGER + 1,
      naturalUnitCode: "M",
    },
    category: "canonical-invalid",
    expectedDownstreamWork: "not-invoked",
    expectedErrorCode: "INVALID_ARGUMENT",
  },
  {
    id: "out-of-int32-number",
    operation: "updateNonIdentityData",
    args: { resourceId: "missing", expectedRevision: 2_147_483_648, naturalUnitCode: "M" },
    category: "canonical-invalid",
    expectedDownstreamWork: "not-invoked",
    expectedErrorCode: "INVALID_ARGUMENT",
  },
  {
    id: "search-limit-zero",
    operation: "searchResources",
    args: { terms: "cable", limit: 0 },
    category: "canonical-invalid",
    expectedDownstreamWork: "not-invoked",
    expectedErrorCode: "INVALID_ARGUMENT",
  },
  {
    id: "search-limit-over-upper-bound",
    operation: "searchResources",
    args: { terms: "cable", limit: 51 },
    category: "canonical-invalid",
    expectedDownstreamWork: "not-invoked",
    expectedErrorCode: "INVALID_ARGUMENT",
  },
  {
    id: "repeated-attribute-code",
    operation: "createResource",
    args: {
      ...canonicalCreate,
      attributes: [canonicalAttribute, { ...canonicalAttribute, value: "ALUMINIO" }],
    },
    category: "canonical-invalid",
    expectedDownstreamWork: "not-invoked",
    expectedErrorCode: "INVALID_ARGUMENT",
  },
  {
    id: "search-limit-one",
    operation: "searchResources",
    args: { terms: "cable", limit: 1 },
    category: "accepted",
    expectedDownstreamWork: "invoked",
  },
  {
    id: "search-limit-fifty",
    operation: "searchResources",
    args: { terms: "cable", limit: 50 },
    category: "accepted",
    expectedDownstreamWork: "invoked",
  },
  {
    id: "negative-signed-revision",
    operation: "updateNonIdentityData",
    args: { resourceId: "missing", expectedRevision: -1, naturalUnitCode: "M" },
    category: "accepted",
    expectedDownstreamWork: "invoked",
    expectedErrorCode: "INVALID_ARGUMENT",
  },
  {
    id: "empty-attribute-array",
    operation: "createResource",
    args: { ...canonicalCreate, attributes: [] },
    category: "accepted",
    expectedDownstreamWork: "invoked",
  },
  {
    id: "forged-top-level-authority",
    operation: "getResource",
    args: { resourceId: "missing", actor: "forged", capabilities: ["resource:read"] },
    category: "transport-rejection",
    expectedDownstreamWork: "not-invoked",
  },
  {
    id: "forged-nested-authority",
    operation: "createResource",
    args: {
      ...canonicalCreate,
      attributes: [{ ...canonicalAttribute, actorId: "forged", claims: { admin: true } }],
    },
    category: "transport-rejection",
    expectedDownstreamWork: "not-invoked",
  },
  {
    id: "ordinary-authority-like-text",
    operation: "getResource",
    args: { resourceId: "actor:ordinary-user" },
    category: "accepted",
    expectedDownstreamWork: "invoked",
  },
];

export const jdS002CaseIds = jdS002Cases.map(({ id }) => id);
