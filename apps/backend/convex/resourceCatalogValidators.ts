import { v } from "convex/values";
const applicabilityResult = v.object({
  mode: v.union(
    v.literal("REQUIRED"),
    v.literal("OPTIONAL"),
    v.literal("FORBIDDEN"),
    v.literal("NOT_APPLICABLE"),
  ),
  identity: v.boolean(),
});
const rule = v.object({
  when: v.object({ attributeCode: v.string(), optionCode: v.string() }),
  result: applicabilityResult,
});
const kind = v.union(
  v.literal("CONTROLLED_OPTION"),
  v.literal("INTEGER"),
  v.literal("DECIMAL"),
  v.literal("BOOLEAN"),
  v.literal("CONTROLLED_TEXT"),
  v.literal("QUANTITY"),
);
const attribute = v.object({
  code: v.string(),
  name: v.string(),
  kind,
  meaning: v.string(),
  active: v.boolean(),
});
const optionSet = v.object({
  code: v.string(),
  attributeCode: v.string(),
  active: v.boolean(),
  options: v.array(v.object({ code: v.string(), label: v.string(), active: v.boolean() })),
});
const binding = v.object({
  id: v.string(),
  scope: v.union(v.literal("FAMILY"), v.literal("TYPE")),
  ownerCode: v.string(),
  attributeCode: v.string(),
  active: v.boolean(),
  defaultResult: applicabilityResult,
  rules: v.array(rule),
  optionSetCode: v.optional(v.string()),
  quantityUnitCodes: v.optional(v.array(v.string())),
  displayOrder: v.optional(v.number()),
});
export const resourceCatalogValidator = v.object({
  classDefinition: v.object({ code: v.string(), name: v.string(), active: v.boolean() }),
  family: v.object({
    code: v.string(),
    name: v.string(),
    classCode: v.string(),
    active: v.boolean(),
    allowedNaturalUnitCodes: v.array(v.string()),
    suggestedNaturalUnitCode: v.string(),
  }),
  type: v.object({
    code: v.string(),
    name: v.string(),
    familyCode: v.string(),
    active: v.boolean(),
  }),
  attributes: v.array(attribute),
  optionSets: v.array(optionSet),
  naturalUnits: v.array(v.object({ code: v.string(), name: v.string(), active: v.boolean() })),
  bindings: v.array(binding),
  presentation: v.object({ attributeOrder: v.array(v.string()), includeNaturalUnit: v.boolean() }),
});
export const resourceCatalogPayloadValidator = v.object({
  catalogKey: v.literal("resource-master"),
  schemaVersion: v.literal(1),
  sourceVersion: v.string(),
  lifecycle: v.literal("ACTIVE"),
  catalog: resourceCatalogValidator,
});
export const resourceCatalogSnapshotValidator = resourceCatalogPayloadValidator.extend({
  revision: v.number(),
});
export const installArgsValidator = v.object({ expectedRevision: v.number() });
export const installResultValidator = v.union(
  v.object({ kind: v.literal("INSTALLED"), snapshot: resourceCatalogSnapshotValidator }),
  v.object({ kind: v.literal("UNCHANGED"), snapshot: resourceCatalogSnapshotValidator }),
  v.object({ kind: v.literal("CONFLICT"), currentRevision: v.number() }),
);
