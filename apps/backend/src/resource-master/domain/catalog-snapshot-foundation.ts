import { applicabilityModes, attributeKinds } from "./types.js";
import type { ApplicabilityBinding, ApplicabilityResult, ResourceCatalog } from "./types.js";

export const resourceCatalogKey = "resource-master" as const;
export const resourceCatalogSchemaVersion = 1 as const;
export const resourceCatalogBounds = {
  maxBytes: 768_000,
  maxDepth: 12,
  maxArrayLength: 4_096,
  maxObjectFields: 512,
} as const;

export interface ResourceCatalogPayload {
  readonly catalogKey: typeof resourceCatalogKey;
  readonly schemaVersion: typeof resourceCatalogSchemaVersion;
  readonly sourceVersion: string;
  readonly lifecycle: "ACTIVE";
  readonly catalog: ResourceCatalog;
}

export interface ResourceCatalogSnapshot extends ResourceCatalogPayload {
  readonly revision: number;
}

export interface ResourceCatalogMeasurement {
  readonly bytes: number;
  readonly depth: number;
  readonly largestArray: number;
  readonly largestObject: number;
}

export class ResourceCatalogValidationError extends Error {
  readonly kind: "EMPTY" | "INVALID";
  readonly issues: readonly string[];

  constructor(kind: "EMPTY" | "INVALID", issues: readonly string[]) {
    super("resource catalog validation failed");
    this.name = "ResourceCatalogValidationError";
    this.kind = kind;
    this.issues = Object.freeze([...issues].sort());
  }
}

export type RecordValue = Record<string, unknown>;

export const own = (value: RecordValue, key: string): boolean => Object.hasOwn(value, key);
export const isRecord = (value: unknown): value is RecordValue =>
  typeof value === "object" && value !== null && !Array.isArray(value);
export const invalid = (issue: string): never => {
  throw new ResourceCatalogValidationError("INVALID", [issue]);
};

const fieldsError = (path: string, missing: readonly string[], extra: readonly string[]): never =>
  invalid(
    `${path} fields: ${[
      ...missing.map((field) => `missing ${field}`),
      ...extra.map((field) => `unknown ${field}`),
    ]
      .sort()
      .join(", ")}`,
  );

export const record = (value: unknown, path: string, fields: readonly string[]): RecordValue => {
  const object = isRecord(value) ? value : invalid(`${path} must be an object`);
  const missing = fields.filter((field) => !own(object, field));
  const extra = Object.keys(object).filter((field) => !fields.includes(field));
  if (missing.length || extra.length) fieldsError(path, missing, extra);
  return object;
};

export const optionalRecord = (
  value: unknown,
  path: string,
  required: readonly string[],
  optional: readonly string[],
): RecordValue => {
  const object = isRecord(value) ? value : invalid(`${path} must be an object`);
  const missing = required.filter((field) => !own(object, field));
  const allowed = [...required, ...optional];
  const extra = Object.keys(object).filter((field) => !allowed.includes(field));
  if (missing.length || extra.length) fieldsError(path, missing, extra);
  return object;
};

export const text = (value: unknown, path: string, nonblank = true, max = 1_024): string =>
  typeof value === "string" && value.length <= max && (!nonblank || value.trim() !== "")
    ? value
    : invalid(`${path} must be a bounded string`);
export const bool = (value: unknown, path: string): boolean =>
  typeof value === "boolean" ? value : invalid(`${path} must be a boolean`);
export const list = (value: unknown, path: string): readonly unknown[] =>
  Array.isArray(value) && value.length <= resourceCatalogBounds.maxArrayLength
    ? value
    : invalid(`${path} must be a bounded array`);
export const integer = (value: unknown, path: string, min = 0): number =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= min
    ? value
    : invalid(`${path} must be a safe integer`);
export const enumValue = <T extends string>(
  value: unknown,
  values: readonly T[],
  path: string,
): T =>
  typeof value === "string" && values.includes(value as T)
    ? (value as T)
    : invalid(`${path} is invalid`);
export const stringList = (value: unknown, path: string): readonly string[] =>
  list(value, path).map((item, index) => text(item, `${path}[${index}]`));

const result = (value: unknown, path: string): ApplicabilityResult => {
  const object = record(value, path, ["mode", "identity"]);
  const mode = enumValue(object.mode, applicabilityModes, `${path}.mode`);
  const identity = bool(object.identity, `${path}.identity`);
  if (mode === "NOT_APPLICABLE" && identity)
    invalid(`${path} cannot participate in identity when mode is NOT_APPLICABLE`);
  return { mode, identity };
};

const parseRule = (value: unknown, path: string) => {
  const rule = record(value, path, ["when", "result"]);
  const when = record(rule.when, `${path}.when`, ["attributeCode", "optionCode"]);
  return {
    when: {
      attributeCode: text(when.attributeCode, `${path}.when.attributeCode`),
      optionCode: text(when.optionCode, `${path}.when.optionCode`),
    },
    result: result(rule.result, `${path}.result`),
  };
};

const parseBinding = (value: unknown, index: number): ApplicabilityBinding => {
  const path = `bindings[${index}]`;
  const binding = optionalRecord(
    value,
    path,
    ["id", "scope", "ownerCode", "attributeCode", "active", "defaultResult", "rules"],
    ["optionSetCode", "quantityUnitCodes", "displayOrder"],
  );
  const base = {
    id: text(binding.id, `${path}.id`),
    scope: enumValue(binding.scope, ["FAMILY", "TYPE"], `${path}.scope`),
    ownerCode: text(binding.ownerCode, `${path}.ownerCode`),
    attributeCode: text(binding.attributeCode, `${path}.attributeCode`),
    active: bool(binding.active, `${path}.active`),
    defaultResult: result(binding.defaultResult, `${path}.defaultResult`),
    rules: list(binding.rules, `${path}.rules`).map((rule, ruleIndex) =>
      parseRule(rule, `${path}.rules[${ruleIndex}]`),
    ),
  };
  return {
    ...base,
    ...(own(binding, "optionSetCode")
      ? { optionSetCode: text(binding.optionSetCode, `${path}.optionSetCode`) }
      : {}),
    ...(own(binding, "quantityUnitCodes")
      ? { quantityUnitCodes: stringList(binding.quantityUnitCodes, `${path}.quantityUnitCodes`) }
      : {}),
    ...(own(binding, "displayOrder")
      ? { displayOrder: integer(binding.displayOrder, `${path}.displayOrder`, 1) }
      : {}),
  } as ApplicabilityBinding;
};

export const parseResourceCatalogShape = (value: unknown): ResourceCatalog => {
  const object = record(value, "catalog", [
    "classDefinition",
    "family",
    "type",
    "attributes",
    "optionSets",
    "naturalUnits",
    "bindings",
    "presentation",
  ]);
  const classObject = record(object.classDefinition, "classDefinition", ["code", "name", "active"]);
  const familyObject = record(object.family, "family", [
    "code",
    "name",
    "classCode",
    "active",
    "allowedNaturalUnitCodes",
    "suggestedNaturalUnitCode",
  ]);
  const typeObject = record(object.type, "type", ["code", "name", "familyCode", "active"]);
  const attributes = list(object.attributes, "attributes").map((value, index) => {
    const attribute = record(value, `attributes[${index}]`, [
      "code",
      "name",
      "kind",
      "meaning",
      "active",
    ]);
    return {
      code: text(attribute.code, `attributes[${index}].code`),
      name: text(attribute.name, `attributes[${index}].name`),
      kind: enumValue(attribute.kind, attributeKinds, `attributes[${index}].kind`),
      meaning: text(attribute.meaning, `attributes[${index}].meaning`),
      active: bool(attribute.active, `attributes[${index}].active`),
    };
  });
  const optionSets = list(object.optionSets, "optionSets").map((value, index) => {
    const set = record(value, `optionSets[${index}]`, [
      "code",
      "attributeCode",
      "active",
      "options",
    ]);
    const options = list(set.options, `optionSets[${index}].options`).map((item, optionIndex) => {
      const option = record(item, `optionSets[${index}].options[${optionIndex}]`, [
        "code",
        "label",
        "active",
      ]);
      return {
        code: text(option.code, `optionSets[${index}].options[${optionIndex}].code`),
        label: text(option.label, `optionSets[${index}].options[${optionIndex}].label`),
        active: bool(option.active, `optionSets[${index}].options[${optionIndex}].active`),
      };
    });
    return {
      code: text(set.code, `optionSets[${index}].code`),
      attributeCode: text(set.attributeCode, `optionSets[${index}].attributeCode`),
      active: bool(set.active, `optionSets[${index}].active`),
      options,
    };
  });
  const naturalUnits = list(object.naturalUnits, "naturalUnits").map((value, index) => {
    const unit = record(value, `naturalUnits[${index}]`, ["code", "name", "active"]);
    return {
      code: text(unit.code, `naturalUnits[${index}].code`),
      name: text(unit.name, `naturalUnits[${index}].name`),
      active: bool(unit.active, `naturalUnits[${index}].active`),
    };
  });
  const bindings = list(object.bindings, "bindings").map(parseBinding);
  const presentation = record(object.presentation, "presentation", [
    "attributeOrder",
    "includeNaturalUnit",
  ]);
  return {
    classDefinition: {
      code: text(classObject.code, "classDefinition.code"),
      name: text(classObject.name, "classDefinition.name"),
      active: bool(classObject.active, "classDefinition.active"),
    },
    family: {
      code: text(familyObject.code, "family.code"),
      name: text(familyObject.name, "family.name"),
      classCode: text(familyObject.classCode, "family.classCode"),
      active: bool(familyObject.active, "family.active"),
      allowedNaturalUnitCodes: stringList(
        familyObject.allowedNaturalUnitCodes,
        "family.allowedNaturalUnitCodes",
      ),
      suggestedNaturalUnitCode: text(
        familyObject.suggestedNaturalUnitCode,
        "family.suggestedNaturalUnitCode",
      ),
    },
    type: {
      code: text(typeObject.code, "type.code"),
      name: text(typeObject.name, "type.name"),
      familyCode: text(typeObject.familyCode, "type.familyCode"),
      active: bool(typeObject.active, "type.active"),
    },
    attributes,
    optionSets,
    naturalUnits,
    bindings,
    presentation: {
      attributeOrder: stringList(presentation.attributeOrder, "presentation.attributeOrder"),
      includeNaturalUnit: bool(presentation.includeNaturalUnit, "presentation.includeNaturalUnit"),
    },
  };
};

export const deepFreeze = <T>(value: T): T => {
  if (value !== null && typeof value === "object" && !Object.isFrozen(value)) {
    for (const child of Object.values(value as RecordValue)) deepFreeze(child);
    Object.freeze(value);
  }
  return value;
};

export const measureResourceCatalog = (value: unknown): ResourceCatalogMeasurement => {
  let depth = 0;
  let largestArray = 0;
  let largestObject = 0;
  const walk = (current: unknown, level: number, seen: WeakSet<object>): void => {
    depth = Math.max(depth, level);
    if (current === null || typeof current !== "object") return;
    if (seen.has(current)) throw new TypeError("cyclic catalog value");
    seen.add(current);
    if (Array.isArray(current)) {
      largestArray = Math.max(largestArray, current.length);
      current.forEach((child) => {
        walk(child, level + 1, seen);
      });
    } else {
      largestObject = Math.max(largestObject, Object.keys(current).length);
      Object.values(current).forEach((child) => {
        walk(child, level + 1, seen);
      });
    }
    seen.delete(current);
  };
  walk(value, 1, new WeakSet<object>());
  let encoded: string;
  try {
    encoded = JSON.stringify(value);
  } catch {
    throw new TypeError("catalog value is not JSON encodable");
  }
  if (encoded === undefined) throw new TypeError("catalog value is not JSON encodable");
  return {
    bytes: new TextEncoder().encode(encoded).byteLength,
    depth,
    largestArray,
    largestObject,
  };
};

export const assertResourceCatalogBounds = (value: unknown): void => {
  let measured: ResourceCatalogMeasurement;
  try {
    measured = measureResourceCatalog(value);
  } catch {
    invalid("catalog is not JSON encodable");
    return;
  }
  if (
    measured.bytes > resourceCatalogBounds.maxBytes ||
    measured.depth > resourceCatalogBounds.maxDepth ||
    measured.largestArray > resourceCatalogBounds.maxArrayLength ||
    measured.largestObject > resourceCatalogBounds.maxObjectFields
  )
    invalid("catalog exceeds conservative bounds");
};
