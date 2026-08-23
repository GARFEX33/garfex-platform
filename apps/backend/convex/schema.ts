import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const attributeKind = v.union(
  v.literal("CONTROLLED_OPTION"),
  v.literal("INTEGER"),
  v.literal("DECIMAL"),
  v.literal("BOOLEAN"),
  v.literal("CONTROLLED_TEXT"),
  v.literal("QUANTITY"),
);
const storedValue = v.union(
  v.string(),
  v.boolean(),
  v.object({ magnitude: v.string(), unitCode: v.string() }),
);

export default defineSchema({
  resources: defineTable({
    resourceId: v.string(),
    classCode: v.string(),
    familyCode: v.string(),
    typeCode: v.string(),
    naturalUnitCode: v.string(),
    canonicalIdentity: v.string(),
    identityPolicyVersion: v.literal("v1"),
    active: v.literal(true),
    revision: v.number(),
    searchProjection: v.string(),
  })
    .index("by_identity", ["canonicalIdentity"])
    .index("by_resource_id", ["resourceId"])
    .index("by_active_resource_id", ["active", "resourceId"]),
  resourceAttributes: defineTable({
    resourceId: v.string(),
    attributeCode: v.string(),
    kind: attributeKind,
    canonicalIdentity: v.string(),
    displayValue: v.string(),
    storedValue,
    identityParticipating: v.boolean(),
  }).index("by_resource_code", ["resourceId", "attributeCode"]),
});
