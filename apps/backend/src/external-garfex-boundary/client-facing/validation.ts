import type {
  ExternalError,
  ExternalErrorCode,
  ExternalFailure,
  ExternalFieldIssueReason,
  ExternalOperation,
  ExternalRequest,
  ExternalSuccess,
} from "./contract.js";
import { semanticManifest } from "./generated/semantic-contract.generated.js";

// The interpreter consumes only the generated manifest algebra. These types model
// its recursive data shape; they do not describe any business field or enum.
type RuntimeType =
  | { readonly kind: "array"; readonly element: RuntimeType }
  | { readonly kind: "literal"; readonly value: boolean | null | number | string }
  | { readonly kind: "object"; readonly properties: readonly RuntimeProperty[] }
  | { readonly kind: "named"; readonly name: string }
  | { readonly kind: "nullable"; readonly type: RuntimeType }
  | { readonly kind: "record"; readonly value: RuntimeType }
  | { readonly kind: "scalar"; readonly name: string };

type RuntimeProperty = {
  readonly name: string;
  readonly optional: boolean;
  readonly type: RuntimeType;
};

type RuntimeModel = {
  readonly name: string;
  readonly properties: readonly RuntimeProperty[];
  readonly indexer?: { readonly value: RuntimeType } | null;
};

type RuntimeEnum = {
  readonly name: string;
  readonly values: readonly (string | number)[];
};

type RuntimeUnion = {
  readonly name: string;
  readonly variants: readonly { readonly name: string; readonly type: RuntimeType }[];
};

type RuntimeScalar = {
  readonly base: string;
  readonly constraints: {
    readonly maxItems?: number;
    readonly maxLength?: number;
    readonly maxValue?: number;
    readonly minItems?: number;
    readonly minLength?: number;
    readonly minValue?: number;
    readonly pattern?: string;
  };
  readonly name: string;
};

type ParseSuccess = { readonly success: true; readonly value: unknown };
type GeneratedFieldIssueReason = Exclude<
  ExternalFieldIssueReason,
  "TYPE" | "UNKNOWN_FIELD" | "INVALID_VALUE"
>;
type ParseFailure = {
  readonly success: false;
  readonly path: string;
  readonly reason: GeneratedFieldIssueReason;
  readonly legacyReason: ExternalFieldIssueReason;
};
type ParseResult = ParseSuccess | ParseFailure;
type Dictionary = Record<string, unknown>;
export type ExternalValidationResult<T> = T | ExternalFailure;

const legacyReasonFor = (reason: GeneratedFieldIssueReason): ExternalFieldIssueReason => {
  switch (reason) {
    case "INVALID_FORMAT":
      return "TYPE";
    case "UNSUPPORTED":
      return "INVALID_VALUE";
    default:
      return reason;
  }
};

const legacyFieldIssueReason = (
  value: unknown,
): value is Extract<ExternalFieldIssueReason, "TYPE" | "UNKNOWN_FIELD" | "INVALID_VALUE"> =>
  value === "TYPE" || value === "UNKNOWN_FIELD" || value === "INVALID_VALUE";

const generatedStringValues = (name: string): readonly string[] | undefined => {
  const definition = semanticManifest.enums.find((candidate) => candidate.name === name);
  if (definition === undefined) return undefined;
  const values: string[] = [];
  for (const value of definition.values) {
    if (typeof value !== "string") return undefined;
    values.push(value);
  }
  return values;
};

const generatedValue = (enumName: string, value: string): string | undefined => {
  const values = generatedStringValues(enumName);
  return values?.find((candidate) => candidate === value);
};

const externalErrorCode = (value: unknown): value is ExternalErrorCode =>
  typeof value === "string" && generatedValue("ExternalFailureCode", value) !== undefined;

const externalFieldIssueReason = (value: unknown): value is GeneratedFieldIssueReason =>
  typeof value === "string" && generatedValue("FieldIssueReason", value) !== undefined;

const generatedErrorCode = (name: string): ExternalErrorCode => {
  if (externalErrorCode(name)) return name;
  throw new Error(`generated external error code is missing: ${name}`);
};

const generatedReason = (name: string): GeneratedFieldIssueReason => {
  if (externalFieldIssueReason(name)) return name;
  throw new Error(`generated field-issue reason is missing: ${name}`);
};

const invalidArgumentCode = (): ExternalErrorCode => generatedErrorCode("INVALID_ARGUMENT");
const internalFailureCode = (): ExternalErrorCode => generatedErrorCode("INTERNAL_FAILURE");

function parseFailure(
  path: string,
  reason: GeneratedFieldIssueReason,
  legacyReason: ExternalFieldIssueReason = legacyReasonFor(reason),
): ParseFailure {
  return { success: false, path, reason, legacyReason };
}

function invalid(path: string, reason: ExternalFieldIssueReason): ExternalFailure {
  return {
    ok: false,
    error: {
      code: invalidArgumentCode(),
      fieldIssues: [{ path, reason }],
    },
  };
}

function internalFailure(): ExternalFailure {
  return { ok: false, error: { code: internalFailureCode() } };
}

function plainRecord(value: unknown): value is Dictionary {
  try {
    if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  } catch {
    return false;
  }
}

function ownKeys(value: object): readonly PropertyKey[] | undefined {
  try {
    return Reflect.ownKeys(value);
  } catch {
    return undefined;
  }
}

function ownValue(
  record: object,
  key: string,
): { readonly present: true; readonly value: unknown } | { readonly present: false } | undefined {
  try {
    if (!Object.hasOwn(record, key)) return { present: false };
    return { present: true, value: Reflect.get(record, key) };
  } catch {
    return undefined;
  }
}

const forbiddenPrototypeKey = (key: string): boolean =>
  key === "__proto__" || key === "constructor" || key === "prototype";

const reservedAttributeKey = (key: string): boolean => {
  const normalized = key.replace(/[_.-]/g, "").toLowerCase();
  return /^(?:__proto__|constructor|prototype|actor|role|capabilit|claim|token|credential|session|provider|auth|authorit|identity|resourceid|convex|document|database|repository|persist|deploy|catalog)/.test(
    normalized,
  );
};

function propertyPath(path: string, key: string): string {
  return path === "$" ? key : `${path}.${key}`;
}

function hasControlCharacter(value: string): boolean {
  for (const character of value) {
    const code = character.charCodeAt(0);
    if (code < 32 || code === 127) return true;
  }
  return false;
}

function generatedModel(name: string): RuntimeModel | undefined {
  return semanticManifest.models.find((candidate) => candidate.name === name);
}

function generatedEnum(name: string): RuntimeEnum | undefined {
  return semanticManifest.enums.find((candidate) => candidate.name === name);
}

function generatedUnion(name: string): RuntimeUnion | undefined {
  return semanticManifest.unions.find((candidate) => candidate.name === name);
}

function generatedScalar(name: string): RuntimeScalar | undefined {
  return semanticManifest.scalars.find((candidate) => candidate.name === name);
}

type LegacyAttributeTypes = {
  readonly key: RuntimeType;
  readonly value: RuntimeType;
};

function legacyAttributeTypes(type: RuntimeType): LegacyAttributeTypes | undefined {
  if (type.kind !== "array" || type.element.kind !== "named") return undefined;
  const attributeModel = generatedModel(type.element.name);
  if (attributeModel === undefined) return undefined;
  const key = attributeModel.properties.find(({ name }) => name === "attributeCode");
  const value = attributeModel.properties.find(({ name }) => name === "value");
  if (key === undefined || value === undefined) return undefined;
  return { key: key.type, value: value.type };
}

function parseLegacyAttributeMap(
  types: LegacyAttributeTypes,
  value: unknown,
  path: string,
  stack: readonly string[],
): ParseResult {
  if (!plainRecord(value)) return parseFailure(path, generatedReason("INVALID_FORMAT"));
  const keys = ownKeys(value);
  if (keys === undefined) return parseFailure(path, generatedReason("INVALID_FORMAT"));
  const result: Dictionary = {};
  for (const key of keys) {
    if (typeof key !== "string" || forbiddenPrototypeKey(key) || reservedAttributeKey(key)) {
      return parseFailure(
        propertyPath(path, typeof key === "string" ? key : "*"),
        generatedReason("UNSUPPORTED"),
        "UNKNOWN_FIELD",
      );
    }
    const parsedKey = parseType(types.key, key, propertyPath(path, key), stack);
    if (!parsedKey.success) return parsedKey;
    const item = ownValue(value, key);
    if (item === undefined || !item.present) {
      return parseFailure(propertyPath(path, key), generatedReason("INVALID_FORMAT"));
    }
    const parsed = parseType(types.value, item.value, propertyPath(path, key), stack);
    if (!parsed.success) return parsed;
    result[key] = parsed.value;
  }
  return { success: true, value: result };
}

function parseLegacyRequest(
  model: RuntimeModel,
  value: unknown,
  path: string,
  stack: readonly string[],
): ParseResult | undefined {
  if (!plainRecord(value)) return undefined;
  const attributes = model.properties.find(({ name }) => name === "attributes");
  if (attributes === undefined) return undefined;
  const types = legacyAttributeTypes(attributes.type);
  if (types === undefined) return undefined;
  const attributeValue = ownValue(value, attributes.name);
  if (attributeValue === undefined || !attributeValue.present) return undefined;
  if (!plainRecord(attributeValue.value)) return undefined;

  const keys = ownKeys(value);
  if (keys === undefined) return parseFailure(path, generatedReason("INVALID_FORMAT"));
  const allowed = new Set(model.properties.map(({ name }) => name));
  for (const key of keys) {
    if (typeof key !== "string" || forbiddenPrototypeKey(key) || !allowed.has(key)) {
      return parseFailure(
        propertyPath(path, typeof key === "string" ? key : "*"),
        generatedReason("UNSUPPORTED"),
        "UNKNOWN_FIELD",
      );
    }
  }

  const result: Dictionary = {};
  for (const property of model.properties) {
    if (forbiddenPrototypeKey(property.name)) {
      return parseFailure(
        propertyPath(path, property.name),
        generatedReason("UNSUPPORTED"),
        "UNKNOWN_FIELD",
      );
    }
    const item = ownValue(value, property.name);
    if (item === undefined)
      return parseFailure(propertyPath(path, property.name), generatedReason("INVALID_FORMAT"));
    if (!item.present) {
      if (property.optional) continue;
      return parseFailure(propertyPath(path, property.name), generatedReason("REQUIRED"));
    }
    const parsed =
      property.name === attributes.name
        ? parseLegacyAttributeMap(types, item.value, propertyPath(path, property.name), stack)
        : parseType(property.type, item.value, propertyPath(path, property.name), stack);
    if (!parsed.success) return parsed;
    result[property.name] = parsed.value;
  }
  return { success: true, value: result };
}

function canonicalArrayIndex(key: string, length: number): number | undefined {
  if (!/^(0|[1-9]\d*)$/.test(key)) return undefined;
  const index = Number(key);
  return Number.isSafeInteger(index) && index >= 0 && index < length && String(index) === key
    ? index
    : undefined;
}

function ownArrayValue(
  value: readonly unknown[],
  index: number,
): { readonly present: true; readonly value: unknown } | { readonly present: false } | undefined {
  try {
    if (!Object.hasOwn(value, index)) return { present: false };
    return { present: true, value: value[index] };
  } catch {
    return undefined;
  }
}

function parseArray(
  type: Extract<RuntimeType, { readonly kind: "array" }>,
  value: unknown,
  path: string,
  stack: readonly string[],
): ParseResult {
  if (!Array.isArray(value)) return parseFailure(path, generatedReason("INVALID_FORMAT"));
  const keys = ownKeys(value);
  if (keys === undefined) return parseFailure(path, generatedReason("INVALID_FORMAT"));

  let length: number;
  try {
    length = value.length;
  } catch {
    return parseFailure(path, generatedReason("INVALID_FORMAT"));
  }
  if (!Number.isSafeInteger(length) || length < 0) {
    return parseFailure(path, generatedReason("INVALID_FORMAT"));
  }

  for (const key of keys) {
    if (key === "length") continue;
    if (typeof key !== "string" || canonicalArrayIndex(key, length) === undefined) {
      return parseFailure(path, generatedReason("UNSUPPORTED"), "UNKNOWN_FIELD");
    }
  }

  const result: unknown[] = [];
  for (let index = 0; index < length; index += 1) {
    const item = ownArrayValue(value, index);
    if (item === undefined || !item.present) {
      return parseFailure(`${path}[${index}]`, generatedReason("REQUIRED"));
    }
    const parsed = parseType(type.element, item.value, `${path}[${index}]`, stack);
    if (!parsed.success) return parsed;
    result.push(parsed.value);
  }
  return { success: true, value: result };
}

function parseRecord(
  type: Extract<RuntimeType, { readonly kind: "record" }>,
  value: unknown,
  path: string,
  stack: readonly string[],
): ParseResult {
  if (!plainRecord(value)) return parseFailure(path, generatedReason("INVALID_FORMAT"));
  const keys = ownKeys(value);
  if (keys === undefined) return parseFailure(path, generatedReason("INVALID_FORMAT"));
  const result: Dictionary = {};
  for (const key of keys) {
    if (typeof key !== "string" || forbiddenPrototypeKey(key) || reservedAttributeKey(key)) {
      return parseFailure(
        propertyPath(path, typeof key === "string" ? key : "*"),
        generatedReason("UNSUPPORTED"),
        "UNKNOWN_FIELD",
      );
    }
    const item = ownValue(value, key);
    if (item === undefined || !item.present) {
      return parseFailure(propertyPath(path, key), generatedReason("INVALID_FORMAT"));
    }
    const parsed = parseType(type.value, item.value, propertyPath(path, key), stack);
    if (!parsed.success) return parsed;
    result[key] = parsed.value;
  }
  return { success: true, value: result };
}

function parseObject(
  properties: readonly RuntimeProperty[],
  indexer: { readonly value: RuntimeType } | null | undefined,
  value: unknown,
  path: string,
  stack: readonly string[],
): ParseResult {
  if (!plainRecord(value)) return parseFailure(path, generatedReason("INVALID_FORMAT"));
  const keys = ownKeys(value);
  if (keys === undefined) return parseFailure(path, generatedReason("INVALID_FORMAT"));
  const allowed = new Set(properties.map(({ name }) => name));
  if (indexer === null || indexer === undefined) {
    for (const key of keys) {
      if (typeof key !== "string" || forbiddenPrototypeKey(key) || !allowed.has(key)) {
        return parseFailure(
          propertyPath(path, typeof key === "string" ? key : "*"),
          generatedReason("UNSUPPORTED"),
          "UNKNOWN_FIELD",
        );
      }
    }
  }

  const result: Dictionary = {};
  for (const property of properties) {
    if (forbiddenPrototypeKey(property.name)) {
      return parseFailure(
        propertyPath(path, property.name),
        generatedReason("UNSUPPORTED"),
        "UNKNOWN_FIELD",
      );
    }
    const item = ownValue(value, property.name);
    if (item === undefined)
      return parseFailure(propertyPath(path, property.name), generatedReason("INVALID_FORMAT"));
    if (!item.present) {
      if (property.optional) continue;
      return parseFailure(propertyPath(path, property.name), generatedReason("REQUIRED"));
    }
    const parsed = parseType(property.type, item.value, propertyPath(path, property.name), stack);
    if (!parsed.success) return parsed;
    if (
      property.name === "attributeCode" &&
      typeof parsed.value === "string" &&
      reservedAttributeKey(parsed.value)
    ) {
      return parseFailure(
        propertyPath(path, property.name),
        generatedReason("UNSUPPORTED"),
        "UNKNOWN_FIELD",
      );
    }
    if (
      property.name === "cursor" &&
      typeof parsed.value === "string" &&
      (parsed.value.length === 0 || hasControlCharacter(parsed.value))
    ) {
      return parseFailure(
        propertyPath(path, property.name),
        generatedReason("INVALID_FORMAT"),
        "INVALID_VALUE",
      );
    }
    result[property.name] = parsed.value;
  }

  if (indexer !== null && indexer !== undefined) {
    for (const key of keys) {
      if (typeof key !== "string" || forbiddenPrototypeKey(key) || reservedAttributeKey(key)) {
        return parseFailure(
          propertyPath(path, typeof key === "string" ? key : "*"),
          generatedReason("UNSUPPORTED"),
          "UNKNOWN_FIELD",
        );
      }
      if (allowed.has(key)) continue;
      const item = ownValue(value, key);
      if (item === undefined || !item.present) {
        return parseFailure(propertyPath(path, key), generatedReason("INVALID_FORMAT"));
      }
      const parsed = parseType(indexer.value, item.value, propertyPath(path, key), stack);
      if (!parsed.success) return parsed;
      result[key] = parsed.value;
    }
  }
  return { success: true, value: result };
}

function parseScalar(scalar: RuntimeScalar, value: unknown, path: string): ParseResult {
  const { base, constraints } = scalar;
  if (base === "string") {
    if (typeof value !== "string")
      return parseFailure(path, generatedReason("INVALID_FORMAT"), "TYPE");
    if (constraints.minLength !== undefined && value.length < constraints.minLength) {
      return parseFailure(path, generatedReason("OUT_OF_RANGE"));
    }
    if (constraints.maxLength !== undefined && value.length > constraints.maxLength) {
      return parseFailure(path, generatedReason("OUT_OF_RANGE"));
    }
    if (constraints.pattern !== undefined) {
      let matches = false;
      try {
        matches = new RegExp(constraints.pattern).test(value);
      } catch {
        return parseFailure(path, generatedReason("INVALID_FORMAT"));
      }
      if (!matches) return parseFailure(path, generatedReason("INVALID_FORMAT"));
    }
    if (constraints.minLength !== undefined && hasControlCharacter(value)) {
      return parseFailure(path, generatedReason("INVALID_FORMAT"));
    }
    return { success: true, value };
  }

  if (base === "boolean") {
    return typeof value === "boolean"
      ? { success: true, value }
      : parseFailure(path, generatedReason("INVALID_FORMAT"), "TYPE");
  }

  if (base !== "int32") return parseFailure(path, generatedReason("INVALID_FORMAT"), "TYPE");
  if (typeof value !== "number" || !Number.isSafeInteger(value)) {
    return parseFailure(path, generatedReason("INVALID_FORMAT"), "TYPE");
  }
  if (value < 0 || value > 2147483647) {
    return parseFailure(path, generatedReason("OUT_OF_RANGE"));
  }
  if (constraints.minValue !== undefined && value < constraints.minValue) {
    return parseFailure(path, generatedReason("OUT_OF_RANGE"));
  }
  if (constraints.maxValue !== undefined && value > constraints.maxValue) {
    return parseFailure(path, generatedReason("OUT_OF_RANGE"));
  }
  return { success: true, value };
}

function pascalFailureName(code: string): string {
  return `${code
    .toLowerCase()
    .split("_")
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join("")}Failure`;
}

function failureVariant(
  union: RuntimeUnion,
  value: unknown,
): { readonly name: string; readonly type: RuntimeType } | undefined {
  if (!plainRecord(value)) return undefined;
  const code = ownValue(value, "code");
  if (code === undefined || !code.present || typeof code.value !== "string") return undefined;
  const expectedModel = pascalFailureName(code.value);
  return union.variants.find(({ type }) => type.kind === "named" && type.name === expectedModel);
}

function parseFieldIssue(
  model: RuntimeModel,
  value: unknown,
  path: string,
  stack: readonly string[],
): ParseResult {
  const fieldProperty = model.properties.find(({ name }) => name === "field");
  const reasonProperty = model.properties.find(({ name }) => name === "reason");
  if (fieldProperty === undefined || reasonProperty === undefined) {
    return parseObject(model.properties, model.indexer, value, path, stack);
  }
  if (!plainRecord(value)) return parseFailure(path, generatedReason("INVALID_FORMAT"));
  const keys = ownKeys(value);
  if (keys === undefined) return parseFailure(path, generatedReason("INVALID_FORMAT"));
  const field = ownValue(value, "field");
  const legacyPath = ownValue(value, "path");
  const reason = ownValue(value, "reason");
  if (field === undefined || legacyPath === undefined || reason === undefined) {
    return parseFailure(path, generatedReason("INVALID_FORMAT"));
  }
  const fieldKey =
    field.present && !legacyPath.present
      ? "field"
      : !field.present && legacyPath.present
        ? "path"
        : undefined;
  if (fieldKey === undefined || !reason.present) {
    return parseFailure(path, generatedReason("INVALID_FORMAT"));
  }
  for (const key of keys) {
    if (typeof key !== "string" || (key !== fieldKey && key !== "reason")) {
      return parseFailure(
        propertyPath(path, typeof key === "string" ? key : "*"),
        generatedReason("UNSUPPORTED"),
        "UNKNOWN_FIELD",
      );
    }
  }

  const fieldValue =
    fieldKey === "field"
      ? field.present
        ? field.value
        : undefined
      : legacyPath.present
        ? legacyPath.value
        : undefined;
  const parsedField = parseType(
    fieldProperty.type,
    fieldValue,
    propertyPath(path, fieldKey),
    stack,
  );
  if (!parsedField.success) return parsedField;
  const parsedReason = parseType(
    reasonProperty.type,
    reason.value,
    propertyPath(path, "reason"),
    stack,
  );
  if (parsedReason.success) {
    const result: Dictionary = {};
    result[fieldKey] = parsedField.value;
    result.reason = parsedReason.value;
    return { success: true, value: result };
  }
  if (fieldKey !== "path" || !legacyFieldIssueReason(reason.value)) return parsedReason;
  const result: Dictionary = {};
  result.path = parsedField.value;
  result.reason = reason.value;
  return { success: true, value: result };
}

function parseUnion(
  union: RuntimeUnion,
  value: unknown,
  path: string,
  stack: readonly string[],
): ParseResult {
  const failure = failureVariant(union, value);
  if (failure !== undefined) return parseType(failure.type, value, path, stack);

  let firstFailure: ParseFailure | undefined;
  for (const variant of union.variants) {
    const parsed = parseType(variant.type, value, path, stack);
    if (parsed.success) return parsed;
    if (firstFailure === undefined) firstFailure = parsed;
  }
  return firstFailure ?? parseFailure(path, generatedReason("INVALID_FORMAT"));
}

function parseNamed(
  name: string,
  value: unknown,
  path: string,
  stack: readonly string[],
): ParseResult {
  if (stack.includes(name)) return parseFailure(path, generatedReason("INVALID_FORMAT"));
  const nextStack = stack.concat(name);
  const model = generatedModel(name);
  if (model !== undefined) {
    const isFieldIssue =
      model.properties.some(({ name: propertyName }) => propertyName === "field") &&
      model.properties.some(({ name: propertyName }) => propertyName === "reason");
    return isFieldIssue
      ? parseFieldIssue(model, value, path, nextStack)
      : parseObject(model.properties, model.indexer, value, path, nextStack);
  }
  const enumeration = generatedEnum(name);
  if (enumeration !== undefined) {
    for (const candidate of enumeration.values) {
      if (Object.is(candidate, value)) return { success: true, value: candidate };
    }
    return parseFailure(path, generatedReason("UNSUPPORTED"), "INVALID_VALUE");
  }
  const union = generatedUnion(name);
  if (union !== undefined) return parseUnion(union, value, path, nextStack);
  const scalar = generatedScalar(name);
  if (scalar !== undefined) return parseScalar(scalar, value, path);
  return parseFailure(path, generatedReason("INVALID_FORMAT"));
}

function parseType(
  type: RuntimeType,
  value: unknown,
  path: string,
  stack: readonly string[],
): ParseResult {
  switch (type.kind) {
    case "array":
      return parseArray(type, value, path, stack);
    case "literal":
      return Object.is(type.value, value)
        ? { success: true, value }
        : parseFailure(path, generatedReason("UNSUPPORTED"), "INVALID_VALUE");
    case "object":
      return parseObject(type.properties, null, value, path, stack);
    case "named":
      return parseNamed(type.name, value, path, stack);
    case "nullable":
      return value === null
        ? { success: true, value: null }
        : parseType(type.type, value, path, stack);
    case "record":
      return parseRecord(type, value, path, stack);
    case "scalar":
      return parseScalar({ name: type.name, base: type.name, constraints: {} }, value, path);
  }
}

function successful<T>(
  result: ParseResult,
): result is { readonly success: true; readonly value: T } {
  return result.success;
}

function operationDefinition(operation: ExternalOperation) {
  return semanticManifest.operations.find(({ name }) => name === operation);
}

function safeRequest<Operation extends ExternalOperation>(
  operation: Operation,
  value: unknown,
): ExternalValidationResult<ExternalRequest<Operation>> {
  try {
    const definition = operationDefinition(operation);
    if (definition === undefined) return invalid("operation", "INVALID_VALUE");
    const result = parseNamed(definition.request, value, "$", []);
    if (result.success) {
      if (!successful<ExternalRequest<Operation>>(result)) return invalid("$", "TYPE");
      return result.value;
    }
    const model = generatedModel(definition.request);
    const legacy = model === undefined ? undefined : parseLegacyRequest(model, value, "$", []);
    if (legacy !== undefined) {
      if (!legacy.success) return invalid(legacy.path, legacy.legacyReason);
      if (!successful<ExternalRequest<Operation>>(legacy)) return invalid("$", "TYPE");
      return legacy.value;
    }
    return invalid(result.path, result.legacyReason);
  } catch {
    return invalid("$", generatedReason("INVALID_FORMAT"));
  }
}

function safeSuccess<Operation extends ExternalOperation>(
  operation: Operation,
  value: unknown,
): ExternalValidationResult<ExternalSuccess<Operation>> {
  try {
    const definition = operationDefinition(operation);
    if (definition === undefined) return internalFailure();
    const result = parseNamed(definition.success, value, "$", []);
    if (result.success && successful<ExternalSuccess<Operation>>(result)) return result.value;
    const model = generatedModel(definition.success);
    if (model === undefined || model.properties.length !== 1 || model.indexer !== undefined) {
      return internalFailure();
    }
    const property = model.properties[0];
    if (property === undefined || property.optional) return internalFailure();
    const legacy = parseType(property.type, value, "$", []);
    if (!legacy.success || !successful<ExternalSuccess<Operation>>(legacy))
      return internalFailure();
    return legacy.value;
  } catch {
    return internalFailure();
  }
}

export function parseExternalOperationIdentifier(
  value: unknown,
): ExternalOperation | ExternalFailure {
  try {
    if (typeof value !== "string") return invalid("operation", "TYPE");
    const operation = semanticManifest.operations.find(({ name }) => name === value)?.name;
    return operation ?? invalid("operation", "INVALID_VALUE");
  } catch {
    return invalid("operation", "TYPE");
  }
}

export function validateExternalGetTaxonomyRequest(
  value: unknown,
): ExternalValidationResult<ExternalRequest<"getTaxonomy">> {
  return safeRequest("getTaxonomy", value);
}

export const validateExternalGetEffectiveResourceSchemaRequest = (
  value: unknown,
): ExternalValidationResult<ExternalRequest<"getEffectiveResourceSchema">> =>
  safeRequest("getEffectiveResourceSchema", value);

export const validateExternalGetValidOptionsRequest = (
  value: unknown,
): ExternalValidationResult<ExternalRequest<"getValidOptions">> =>
  safeRequest("getValidOptions", value);

export const validateExternalGetNaturalUnitsRequest = (
  value: unknown,
): ExternalValidationResult<ExternalRequest<"getNaturalUnits">> =>
  safeRequest("getNaturalUnits", value);

export const validateExternalGetResourceRequest = (
  value: unknown,
): ExternalValidationResult<ExternalRequest<"getResource">> => safeRequest("getResource", value);

export const validateExternalSearchResourcesRequest = (
  value: unknown,
): ExternalValidationResult<ExternalRequest<"searchResources">> =>
  safeRequest("searchResources", value);

export const validateExternalDescribeResourceRequest = (
  value: unknown,
): ExternalValidationResult<ExternalRequest<"describeResource">> =>
  safeRequest("describeResource", value);

export const validateExternalCreateResourceRequest = (
  value: unknown,
): ExternalValidationResult<ExternalRequest<"createResource">> =>
  safeRequest("createResource", value);

export const validateExternalUpdateNonIdentityDataRequest = (
  value: unknown,
): ExternalValidationResult<ExternalRequest<"updateNonIdentityData">> =>
  safeRequest("updateNonIdentityData", value);

export const validateExternalDeactivateResourceRequest = (
  value: unknown,
): ExternalValidationResult<ExternalRequest<"deactivateResource">> =>
  safeRequest("deactivateResource", value);

export const validateExternalGetTaxonomySuccess = (
  value: unknown,
): ExternalValidationResult<ExternalSuccess<"getTaxonomy">> => safeSuccess("getTaxonomy", value);

export const validateExternalGetEffectiveResourceSchemaSuccess = (
  value: unknown,
): ExternalValidationResult<ExternalSuccess<"getEffectiveResourceSchema">> =>
  safeSuccess("getEffectiveResourceSchema", value);

export const validateExternalGetValidOptionsSuccess = (
  value: unknown,
): ExternalValidationResult<ExternalSuccess<"getValidOptions">> =>
  safeSuccess("getValidOptions", value);

export const validateExternalGetNaturalUnitsSuccess = (
  value: unknown,
): ExternalValidationResult<ExternalSuccess<"getNaturalUnits">> =>
  safeSuccess("getNaturalUnits", value);

export const validateExternalGetResourceSuccess = (
  value: unknown,
): ExternalValidationResult<ExternalSuccess<"getResource">> => safeSuccess("getResource", value);

export const validateExternalSearchResourcesSuccess = (
  value: unknown,
): ExternalValidationResult<ExternalSuccess<"searchResources">> =>
  safeSuccess("searchResources", value);

export const validateExternalDescribeResourceSuccess = (
  value: unknown,
): ExternalValidationResult<ExternalSuccess<"describeResource">> =>
  safeSuccess("describeResource", value);

export const validateExternalCreateResourceSuccess = (
  value: unknown,
): ExternalValidationResult<ExternalSuccess<"createResource">> =>
  safeSuccess("createResource", value);

export const validateExternalUpdateNonIdentityDataSuccess = (
  value: unknown,
): ExternalValidationResult<ExternalSuccess<"updateNonIdentityData">> =>
  safeSuccess("updateNonIdentityData", value);

export const validateExternalDeactivateResourceSuccess = (
  value: unknown,
): ExternalValidationResult<ExternalSuccess<"deactivateResource">> =>
  safeSuccess("deactivateResource", value);

export function validateExternalFailure(value: unknown): ExternalFailure {
  try {
    if (!plainRecord(value)) return internalFailure();
    const keys = ownKeys(value);
    if (
      keys === undefined ||
      keys.length !== 2 ||
      !keys.every((key) => key === "ok" || key === "error")
    ) {
      return internalFailure();
    }
    const ok = ownValue(value, "ok");
    const error = ownValue(value, "error");
    if (
      ok === undefined ||
      error === undefined ||
      !ok.present ||
      !error.present ||
      ok.value !== false
    ) {
      return internalFailure();
    }
    const parsed = parseNamed("SafeFailure", error.value, "$.error", []);
    if (!parsed.success || !successful<ExternalError>(parsed)) return internalFailure();
    return { ok: false, error: parsed.value };
  } catch {
    return internalFailure();
  }
}
