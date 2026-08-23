import {
  assertResourceCatalogBounds,
  deepFreeze,
  integer,
  invalid,
  record,
  resourceCatalogKey,
  resourceCatalogSchemaVersion,
  ResourceCatalogValidationError,
  text,
} from "./catalog-snapshot-foundation.js";
import { parseResourceCatalogSemantics } from "./catalog-snapshot-semantics.js";
import type {
  ResourceCatalogPayload,
  ResourceCatalogSnapshot,
} from "./catalog-snapshot-foundation.js";

export {
  assertResourceCatalogBounds,
  measureResourceCatalog,
  ResourceCatalogValidationError,
  resourceCatalogBounds,
  resourceCatalogKey,
  resourceCatalogSchemaVersion,
} from "./catalog-snapshot-foundation.js";
export type {
  ResourceCatalogMeasurement,
  ResourceCatalogPayload,
  ResourceCatalogSnapshot,
} from "./catalog-snapshot-foundation.js";

export const parseResourceCatalogPayload = (value: unknown): ResourceCatalogPayload => {
  assertResourceCatalogBounds(value);
  const object = record(value, "payload", [
    "catalogKey",
    "schemaVersion",
    "sourceVersion",
    "lifecycle",
    "catalog",
  ]);
  if (object.catalogKey !== resourceCatalogKey) invalid("catalogKey is invalid");
  if (object.schemaVersion !== resourceCatalogSchemaVersion) invalid("schemaVersion is invalid");
  if (object.lifecycle !== "ACTIVE") invalid("lifecycle is invalid");
  return deepFreeze({
    catalogKey: resourceCatalogKey,
    schemaVersion: resourceCatalogSchemaVersion,
    sourceVersion: text(object.sourceVersion, "sourceVersion", true, 128),
    lifecycle: "ACTIVE",
    catalog: parseResourceCatalogSemantics(object.catalog),
  });
};

export const parseResourceCatalogSnapshot = (value: unknown): ResourceCatalogSnapshot => {
  assertResourceCatalogBounds(value);
  const object = record(value, "snapshot", [
    "catalogKey",
    "schemaVersion",
    "sourceVersion",
    "lifecycle",
    "catalog",
    "revision",
  ]);
  const payload = parseResourceCatalogPayload({
    catalogKey: object.catalogKey,
    schemaVersion: object.schemaVersion,
    sourceVersion: object.sourceVersion,
    lifecycle: object.lifecycle,
    catalog: object.catalog,
  });
  return deepFreeze({ ...payload, revision: integer(object.revision, "revision", 1) });
};

const normalized = (value: ResourceCatalogPayload | ResourceCatalogSnapshot): string =>
  JSON.stringify(value);
export const resourceCatalogPayloadEquals = (
  left: ResourceCatalogPayload,
  right: ResourceCatalogPayload,
): boolean =>
  normalized(parseResourceCatalogPayload(left)) === normalized(parseResourceCatalogPayload(right));
export const resourceCatalogSnapshotEquals = (
  left: ResourceCatalogSnapshot,
  right: ResourceCatalogSnapshot,
): boolean =>
  normalized(parseResourceCatalogSnapshot(left)) ===
  normalized(parseResourceCatalogSnapshot(right));

export const validateResourceCatalogReplacement = (
  current: ResourceCatalogSnapshot | null,
  candidate: ResourceCatalogPayload,
): void => {
  const next = parseResourceCatalogPayload(candidate);
  if (current === null) return;
  const before = current.catalog;
  const after = next.catalog;
  const issues: string[] = [];
  if (before.classDefinition.code !== after.classDefinition.code) issues.push("class code changed");
  if (
    before.family.code !== after.family.code ||
    before.family.classCode !== after.family.classCode
  )
    issues.push("family identity changed");
  if (before.type.code !== after.type.code || before.type.familyCode !== after.type.familyCode)
    issues.push("type identity changed");
  const attributes = new Map(after.attributes.map((item) => [item.code, item]));
  for (const item of before.attributes) {
    const replacement = attributes.get(item.code);
    if (!replacement || replacement.kind !== item.kind || replacement.meaning !== item.meaning)
      issues.push(`attribute identity changed ${item.code}`);
  }
  const sets = new Map(after.optionSets.map((item) => [item.code, item]));
  for (const item of before.optionSets) {
    const replacement = sets.get(item.code);
    if (!replacement || replacement.attributeCode !== item.attributeCode)
      issues.push(`option-set identity changed ${item.code}`);
    const options = new Set(replacement?.options.map(({ code }) => code));
    for (const option of item.options)
      if (!options.has(option.code))
        issues.push(`option identity changed ${item.code}:${option.code}`);
  }
  const units = new Set(after.naturalUnits.map(({ code }) => code));
  for (const item of before.naturalUnits)
    if (!units.has(item.code)) issues.push(`natural-unit identity changed ${item.code}`);
  const bindings = new Map(after.bindings.map((item) => [item.id, item]));
  for (const item of before.bindings) {
    const replacement = bindings.get(item.id);
    if (
      !replacement ||
      replacement.scope !== item.scope ||
      replacement.ownerCode !== item.ownerCode ||
      replacement.attributeCode !== item.attributeCode
    )
      issues.push(`binding identity changed ${item.id}`);
  }
  if (issues.length) throw new ResourceCatalogValidationError("INVALID", issues);
};
