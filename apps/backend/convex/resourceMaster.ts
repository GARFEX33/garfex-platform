import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";
import {
  createConvexMutationResourceMaster,
  createConvexQueryResourceMaster,
} from "../src/resource-master/infrastructure/convex-resource-master.js";

const taxonomyArgs = {
  classCode: v.string(),
  familyCode: v.string(),
  typeCode: v.string(),
};
const attributeKind = v.union(
  v.literal("CONTROLLED_OPTION"),
  v.literal("INTEGER"),
  v.literal("DECIMAL"),
  v.literal("BOOLEAN"),
  v.literal("CONTROLLED_TEXT"),
  v.literal("QUANTITY"),
);
const applicabilityMode = v.union(
  v.literal("REQUIRED"),
  v.literal("OPTIONAL"),
  v.literal("FORBIDDEN"),
  v.literal("NOT_APPLICABLE"),
);
const applicabilityResult = v.object({ mode: applicabilityMode, identity: v.boolean() });
const applicabilityRule = v.object({
  when: v.object({ attributeCode: v.string(), optionCode: v.string() }),
  result: applicabilityResult,
});
const resourceError = v.object({
  code: v.union(
    v.literal("INVALID_ARGUMENT"),
    v.literal("NOT_FOUND"),
    v.literal("DUPLICATE"),
    v.literal("INVALID_REFERENCE"),
    v.literal("VALIDATION"),
    v.literal("CONFLICT"),
    v.literal("INVALID_LIFECYCLE"),
    v.literal("INTEGRITY"),
    v.literal("INTERNAL"),
    v.literal("RESOURCE_CATALOG_UNAVAILABLE"),
    v.literal("RESOURCE_CATALOG_UNINITIALIZED"),
    v.literal("RESOURCE_CATALOG_INVALID"),
  ),
  message: v.string(),
  details: v.optional(v.array(v.string())),
  existingResourceId: v.optional(v.string()),
  currentRevision: v.optional(v.number()),
});
const failureResult = v.object({ ok: v.literal(false), error: resourceError });
const taxonomy = v.array(
  v.object({
    code: v.string(),
    name: v.string(),
    families: v.array(
      v.object({
        code: v.string(),
        name: v.string(),
        types: v.array(v.object({ code: v.string(), name: v.string() })),
      }),
    ),
  }),
);
const effectiveSchema = v.object({
  attributes: v.array(
    v.object({
      code: v.string(),
      name: v.string(),
      kind: attributeKind,
      meaning: v.string(),
      defaultResult: applicabilityResult,
      rules: v.array(applicabilityRule),
    }),
  ),
});
const optionList = v.array(v.object({ code: v.string(), label: v.string() }));
const namedUnit = v.object({ code: v.string(), name: v.string() });
const naturalUnits = v.object({ allowed: v.array(namedUnit), suggested: namedUnit });
const storedValue = v.union(
  v.string(),
  v.boolean(),
  v.object({ magnitude: v.string(), unitCode: v.string() }),
);
const resourceView = v.object({
  resourceId: v.string(),
  classCode: v.string(),
  familyCode: v.string(),
  typeCode: v.string(),
  naturalUnitCode: v.string(),
  attributes: v.array(
    v.object({
      attributeCode: v.string(),
      value: storedValue,
      displayValue: v.string(),
      identityParticipating: v.boolean(),
    }),
  ),
  canonicalIdentity: v.string(),
  identityPolicyVersion: v.literal("v1"),
  active: v.boolean(),
  revision: v.number(),
});
const resourceSummary = v.object({
  resourceId: v.string(),
  classCode: v.string(),
  className: v.string(),
  familyCode: v.string(),
  familyName: v.string(),
  typeCode: v.string(),
  typeName: v.string(),
  naturalUnitCode: v.string(),
  description: v.string(),
  optionCodes: v.array(v.string()),
  optionLabels: v.array(v.string()),
  values: v.array(v.string()),
});
const searchPage = v.object({
  items: v.array(resourceSummary),
  cursor: v.union(v.string(), v.null()),
});
const description = v.object({ resourceId: v.string(), description: v.string() });

const internalFailure = () => ({
  ok: false as const,
  error: { code: "INTERNAL" as const, message: "resource operation failed" },
});

export const getTaxonomy = query({
  args: {},
  returns: v.union(v.object({ ok: v.literal(true), value: taxonomy }), failureResult),
  handler: async (ctx) => createConvexQueryResourceMaster(ctx).getTaxonomy(),
});

export const getEffectiveResourceSchema = query({
  args: taxonomyArgs,
  returns: v.union(v.object({ ok: v.literal(true), value: effectiveSchema }), failureResult),
  handler: async (ctx, args) =>
    createConvexQueryResourceMaster(ctx).getEffectiveResourceSchema(args),
});

export const getValidOptions = query({
  args: { attributeCode: v.string() },
  returns: v.union(v.object({ ok: v.literal(true), value: optionList }), failureResult),
  handler: async (ctx, args) => createConvexQueryResourceMaster(ctx).getValidOptions(args),
});

export const getNaturalUnits = query({
  args: { familyCode: v.string() },
  returns: v.union(v.object({ ok: v.literal(true), value: naturalUnits }), failureResult),
  handler: async (ctx, args) => createConvexQueryResourceMaster(ctx).getNaturalUnits(args),
});

export const createResource = mutation({
  args: {
    ...taxonomyArgs,
    naturalUnitCode: v.string(),
    attributes: v.object({
      conductor_material: v.optional(v.string()),
      gauge: v.optional(v.union(v.string(), v.number())),
      insulation: v.optional(v.string()),
      color: v.optional(v.string()),
      voltage: v.optional(v.string()),
    }),
  },
  returns: v.union(v.object({ ok: v.literal(true), value: resourceView }), failureResult),
  handler: async (ctx, args) => {
    try {
      return await createConvexMutationResourceMaster(ctx).createResource(args);
    } catch {
      return internalFailure();
    }
  },
});

export const updateNonIdentityData = mutation({
  args: {
    resourceId: v.string(),
    expectedRevision: v.number(),
    naturalUnitCode: v.string(),
  },
  returns: v.union(v.object({ ok: v.literal(true), value: resourceView }), failureResult),
  handler: async (ctx, args) => {
    try {
      return await createConvexMutationResourceMaster(ctx).updateNonIdentityData(args);
    } catch {
      return internalFailure();
    }
  },
});

export const deactivateResource = mutation({
  args: { resourceId: v.string(), expectedRevision: v.number() },
  returns: v.union(v.object({ ok: v.literal(true), value: resourceView }), failureResult),
  handler: async (ctx, args) => {
    try {
      return await createConvexMutationResourceMaster(ctx).deactivateResource(args);
    } catch {
      return internalFailure();
    }
  },
});

export const getResource = query({
  args: { resourceId: v.string() },
  returns: v.union(v.object({ ok: v.literal(true), value: resourceView }), failureResult),
  handler: async (ctx, args) => {
    try {
      return await createConvexQueryResourceMaster(ctx).getResource(args);
    } catch {
      return internalFailure();
    }
  },
});

export const searchResources = query({
  args: {
    terms: v.string(),
    lifecycle: v.optional(v.union(v.literal("ACTIVE"), v.literal("INACTIVE"), v.literal("ALL"))),
    limit: v.optional(v.number()),
    cursor: v.optional(v.union(v.string(), v.null())),
  },
  returns: v.union(v.object({ ok: v.literal(true), value: searchPage }), failureResult),
  handler: async (ctx, args) => {
    try {
      return await createConvexQueryResourceMaster(ctx).searchResources(args);
    } catch {
      return internalFailure();
    }
  },
});

export const describeResource = query({
  args: { resourceId: v.string() },
  returns: v.union(v.object({ ok: v.literal(true), value: description }), failureResult),
  handler: async (ctx, args) => {
    try {
      return await createConvexQueryResourceMaster(ctx).describeResource(args);
    } catch {
      return internalFailure();
    }
  },
});
