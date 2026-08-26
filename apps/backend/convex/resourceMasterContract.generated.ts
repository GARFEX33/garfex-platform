/* GENERATED FILE: derived from semantic-manifest.json; do not edit. */
/* Manifest digest: sha256:32a4d0ea37e9441763d49971c8075d21fa07cc36b0ea69446613098a12b83f53 */
import { v } from "convex/values";
export const manifestDigest =
  "sha256:32a4d0ea37e9441763d49971c8075d21fa07cc36b0ea69446613098a12b83f53" as const;
export const operationNames = [
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
const nonEmptyCode = v.string();
const fieldIssueReason = v.union(
  v.literal("CONFLICTING"),
  v.literal("INVALID_FORMAT"),
  v.literal("OUT_OF_RANGE"),
  v.literal("REQUIRED"),
  v.literal("UNSUPPORTED"),
);
const fieldIssue = v.object({ field: nonEmptyCode, reason: fieldIssueReason });
const resourceId = v.string();
const safeFailure = v.union(
  v.object({ code: v.literal("UNAUTHENTICATED") }),
  v.object({ code: v.literal("FORBIDDEN") }),
  v.object({ code: v.literal("INVALID_ARGUMENT"), fieldIssues: v.optional(v.array(fieldIssue)) }),
  v.object({ code: v.literal("INVALID_REFERENCE"), fieldIssues: v.optional(v.array(fieldIssue)) }),
  v.object({ code: v.literal("VALIDATION_FAILED"), fieldIssues: v.optional(v.array(fieldIssue)) }),
  v.object({ code: v.literal("NOT_FOUND") }),
  v.object({ code: v.literal("DUPLICATE"), existingResourceId: v.optional(resourceId) }),
  v.object({ code: v.literal("CONFLICT"), currentRevision: v.optional(v.number()) }),
  v.object({ code: v.literal("INVALID_LIFECYCLE") }),
  v.object({ code: v.literal("CATALOG_UNAVAILABLE") }),
  v.object({ code: v.literal("INTERNAL_FAILURE") }),
);
const getTaxonomyRequest = v.object({});
const taxonomyType = v.object({ code: nonEmptyCode, name: v.string() });
const taxonomyFamily = v.object({
  code: nonEmptyCode,
  name: v.string(),
  types: v.array(taxonomyType),
});
const taxonomy = v.object({
  code: nonEmptyCode,
  families: v.array(taxonomyFamily),
  name: v.string(),
});
const getTaxonomySuccess = v.object({ items: v.array(taxonomy) });
export const getTaxonomyArgs = getTaxonomyRequest;
export const getTaxonomyReturns = v.union(
  v.object({ ok: v.literal(true), value: getTaxonomySuccess }),
  v.object({ ok: v.literal(false), error: safeFailure }),
);
const getEffectiveResourceSchemaRequest = v.object({
  classCode: nonEmptyCode,
  familyCode: nonEmptyCode,
  typeCode: nonEmptyCode,
});
const applicabilityMode = v.union(
  v.literal("FORBIDDEN"),
  v.literal("NOT_APPLICABLE"),
  v.literal("OPTIONAL"),
  v.literal("REQUIRED"),
);
const applicabilityResult = v.object({ identity: v.boolean(), mode: applicabilityMode });
const attributeKind = v.union(
  v.literal("BOOLEAN"),
  v.literal("CONTROLLED_OPTION"),
  v.literal("CONTROLLED_TEXT"),
  v.literal("DECIMAL"),
  v.literal("INTEGER"),
  v.literal("QUANTITY"),
);
const applicabilityRule = v.object({
  result: applicabilityResult,
  when: v.object({ attributeCode: nonEmptyCode, optionCode: nonEmptyCode }),
});
const effectiveAttribute = v.object({
  code: nonEmptyCode,
  defaultResult: applicabilityResult,
  kind: attributeKind,
  meaning: v.string(),
  name: v.string(),
  rules: v.array(applicabilityRule),
});
const getEffectiveResourceSchemaSuccess = v.object({ attributes: v.array(effectiveAttribute) });
export const getEffectiveResourceSchemaArgs = getEffectiveResourceSchemaRequest;
export const getEffectiveResourceSchemaReturns = v.union(
  v.object({ ok: v.literal(true), value: getEffectiveResourceSchemaSuccess }),
  v.object({ ok: v.literal(false), error: safeFailure }),
);
const getValidOptionsRequest = v.object({ attributeCode: nonEmptyCode });
const option = v.object({ code: nonEmptyCode, label: v.string() });
const getValidOptionsSuccess = v.object({ options: v.array(option) });
export const getValidOptionsArgs = getValidOptionsRequest;
export const getValidOptionsReturns = v.union(
  v.object({ ok: v.literal(true), value: getValidOptionsSuccess }),
  v.object({ ok: v.literal(false), error: safeFailure }),
);
const getNaturalUnitsRequest = v.object({ familyCode: nonEmptyCode });
const naturalUnit = v.object({ code: nonEmptyCode, name: v.string() });
const getNaturalUnitsSuccess = v.object({ allowed: v.array(naturalUnit), suggested: naturalUnit });
export const getNaturalUnitsArgs = getNaturalUnitsRequest;
export const getNaturalUnitsReturns = v.union(
  v.object({ ok: v.literal(true), value: getNaturalUnitsSuccess }),
  v.object({ ok: v.literal(false), error: safeFailure }),
);
const getResourceRequest = v.object({ resourceId: resourceId });
const quantityValue = v.object({ magnitude: v.string(), unitCode: nonEmptyCode });
const attributeValue = v.union(v.boolean(), quantityValue, v.string());
const resourceAttribute = v.object({
  attributeCode: nonEmptyCode,
  displayValue: v.string(),
  identityParticipating: v.boolean(),
  value: attributeValue,
});
const identityPolicyVersion = v.literal("v1");
const resource = v.object({
  active: v.boolean(),
  attributes: v.array(resourceAttribute),
  canonicalIdentity: nonEmptyCode,
  classCode: nonEmptyCode,
  familyCode: nonEmptyCode,
  identityPolicyVersion: identityPolicyVersion,
  naturalUnitCode: nonEmptyCode,
  resourceId: resourceId,
  revision: v.number(),
  typeCode: nonEmptyCode,
});
const getResourceSuccess = v.object({ resource: resource });
export const getResourceArgs = getResourceRequest;
export const getResourceReturns = v.union(
  v.object({ ok: v.literal(true), value: getResourceSuccess }),
  v.object({ ok: v.literal(false), error: safeFailure }),
);
const resourceLifecycleFilter = v.union(
  v.literal("ACTIVE"),
  v.literal("ALL"),
  v.literal("INACTIVE"),
);
const searchLimit = v.number();
const searchTerms = v.string();
const searchResourcesRequest = v.object({
  cursor: v.optional(v.union(v.string(), v.null())),
  lifecycle: v.optional(resourceLifecycleFilter),
  limit: v.optional(searchLimit),
  terms: searchTerms,
});
const resourceSummary = v.object({
  classCode: nonEmptyCode,
  className: v.string(),
  description: v.string(),
  familyCode: nonEmptyCode,
  familyName: v.string(),
  naturalUnitCode: nonEmptyCode,
  optionCodes: v.array(nonEmptyCode),
  optionLabels: v.array(v.string()),
  resourceId: resourceId,
  typeCode: nonEmptyCode,
  typeName: v.string(),
  values: v.array(v.string()),
});
const searchResourcesSuccess = v.object({
  cursor: v.union(v.string(), v.null()),
  items: v.array(resourceSummary),
});
export const searchResourcesArgs = searchResourcesRequest;
export const searchResourcesReturns = v.union(
  v.object({ ok: v.literal(true), value: searchResourcesSuccess }),
  v.object({ ok: v.literal(false), error: safeFailure }),
);
const describeResourceRequest = v.object({ resourceId: resourceId });
const describeResourceSuccess = v.object({ description: v.string(), resourceId: resourceId });
export const describeResourceArgs = describeResourceRequest;
export const describeResourceReturns = v.union(
  v.object({ ok: v.literal(true), value: describeResourceSuccess }),
  v.object({ ok: v.literal(false), error: safeFailure }),
);
const createResourceRequest = v.object({
  attributes: v.array(resourceAttribute),
  classCode: nonEmptyCode,
  familyCode: nonEmptyCode,
  naturalUnitCode: nonEmptyCode,
  typeCode: nonEmptyCode,
});
const createResourceSuccess = v.object({ resource: resource });
export const createResourceArgs = createResourceRequest;
export const createResourceReturns = v.union(
  v.object({ ok: v.literal(true), value: createResourceSuccess }),
  v.object({ ok: v.literal(false), error: safeFailure }),
);
const updateNonIdentityDataRequest = v.object({
  expectedRevision: v.number(),
  naturalUnitCode: nonEmptyCode,
  resourceId: resourceId,
});
const updateNonIdentityDataSuccess = v.object({ resource: resource });
export const updateNonIdentityDataArgs = updateNonIdentityDataRequest;
export const updateNonIdentityDataReturns = v.union(
  v.object({ ok: v.literal(true), value: updateNonIdentityDataSuccess }),
  v.object({ ok: v.literal(false), error: safeFailure }),
);
const deactivateResourceRequest = v.object({
  expectedRevision: v.number(),
  resourceId: resourceId,
});
const deactivateResourceSuccess = v.object({ resource: resource });
export const deactivateResourceArgs = deactivateResourceRequest;
export const deactivateResourceReturns = v.union(
  v.object({ ok: v.literal(true), value: deactivateResourceSuccess }),
  v.object({ ok: v.literal(false), error: safeFailure }),
);
export const createResourceMasterContract = {
  getTaxonomy: getTaxonomyArgs,
  getEffectiveResourceSchema: getEffectiveResourceSchemaArgs,
  getValidOptions: getValidOptionsArgs,
  getNaturalUnits: getNaturalUnitsArgs,
  getResource: getResourceArgs,
  searchResources: searchResourcesArgs,
  describeResource: describeResourceArgs,
  createResource: createResourceArgs,
  updateNonIdentityData: updateNonIdentityDataArgs,
  deactivateResource: deactivateResourceArgs,
};
export const createResourceMasterReturns = {
  getTaxonomy: getTaxonomyReturns,
  getEffectiveResourceSchema: getEffectiveResourceSchemaReturns,
  getValidOptions: getValidOptionsReturns,
  getNaturalUnits: getNaturalUnitsReturns,
  getResource: getResourceReturns,
  searchResources: searchResourcesReturns,
  describeResource: describeResourceReturns,
  createResource: createResourceReturns,
  updateNonIdentityData: updateNonIdentityDataReturns,
  deactivateResource: deactivateResourceReturns,
};
