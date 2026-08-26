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
type RuntimeUnion = {
  readonly name: string;
  readonly variants: readonly { readonly name: string; readonly type: RuntimeType }[];
};
type RuntimeScalar = {
  readonly name: string;
  readonly base: string;
  readonly constraints: Record<string, number | string | undefined>;
};
type Dictionary = Record<string, unknown>;
type FieldIssueReason = Exclude<
  ExternalFieldIssueReason,
  "TYPE" | "UNKNOWN_FIELD" | "INVALID_VALUE"
>;
type ParseResult =
  | { readonly success: true; readonly value: unknown }
  | { readonly success: false; readonly field: string; readonly reason: FieldIssueReason };
export type ExternalValidationResult<T> = T | ExternalFailure;

const enumValues = (name: string): readonly (string | number)[] | undefined =>
  semanticManifest.enums.find((candidate) => candidate.name === name)?.values;
const model = (name: string): RuntimeModel | undefined =>
  semanticManifest.models.find((candidate) => candidate.name === name);
const union = (name: string): RuntimeUnion | undefined =>
  semanticManifest.unions.find((candidate) => candidate.name === name);
const scalar = (name: string): RuntimeScalar | undefined =>
  semanticManifest.scalars.find((candidate) => candidate.name === name);
const operation = (name: ExternalOperation) =>
  semanticManifest.operations.find((candidate) => candidate.name === name);
const isPlainRecord = (value: unknown): value is Dictionary => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};
const ownKeys = (value: object): readonly PropertyKey[] => Reflect.ownKeys(value);
const own = (value: object, key: string): { present: boolean; value?: unknown } =>
  Object.hasOwn(value, key)
    ? { present: true, value: Reflect.get(value, key) }
    : { present: false };
const pathOf = (path: string, key: string): string => (path === "$" ? key : `${path}.${key}`);
const issue = (field: string, reason: FieldIssueReason): ExternalFailure => ({
  ok: false,
  error: { code: "INVALID_ARGUMENT", fieldIssues: [{ field, reason }] },
});
const internalFailure = (): ExternalFailure => ({ ok: false, error: { code: "INTERNAL_FAILURE" } });

function parseScalar(definition: RuntimeScalar, value: unknown, field: string): ParseResult {
  if (definition.base === "string") {
    if (typeof value !== "string") return { success: false, field, reason: "INVALID_FORMAT" };
    const minLength =
      typeof definition.constraints.minLength === "number"
        ? definition.constraints.minLength
        : undefined;
    const maxLength =
      typeof definition.constraints.maxLength === "number"
        ? definition.constraints.maxLength
        : undefined;
    const pattern =
      typeof definition.constraints.pattern === "string"
        ? definition.constraints.pattern
        : undefined;
    if (minLength !== undefined && value.length < minLength)
      return { success: false, field, reason: "OUT_OF_RANGE" };
    if (maxLength !== undefined && value.length > maxLength)
      return { success: false, field, reason: "OUT_OF_RANGE" };
    if (pattern !== undefined && !new RegExp(pattern).test(value))
      return { success: false, field, reason: "INVALID_FORMAT" };
    if (
      minLength !== undefined &&
      [...value].some(
        (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
      )
    )
      return { success: false, field, reason: "INVALID_FORMAT" };
    return { success: true, value };
  }
  if (definition.base === "boolean")
    return typeof value === "boolean"
      ? { success: true, value }
      : { success: false, field, reason: "INVALID_FORMAT" };
  if (
    definition.base !== "int32" ||
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    !Number.isFinite(value)
  )
    return { success: false, field, reason: "INVALID_FORMAT" };
  if (value < -2147483648 || value > 2147483647)
    return { success: false, field, reason: "OUT_OF_RANGE" };
  const minValue =
    typeof definition.constraints.minValue === "number"
      ? definition.constraints.minValue
      : undefined;
  const maxValue =
    typeof definition.constraints.maxValue === "number"
      ? definition.constraints.maxValue
      : undefined;
  if ((minValue !== undefined && value < minValue) || (maxValue !== undefined && value > maxValue))
    return { success: false, field, reason: "OUT_OF_RANGE" };
  return { success: true, value };
}

function parseType(
  type: RuntimeType,
  value: unknown,
  field: string,
  stack: readonly string[] = [],
): ParseResult {
  switch (type.kind) {
    case "literal":
      return Object.is(type.value, value)
        ? { success: true, value }
        : { success: false, field, reason: "UNSUPPORTED" };
    case "nullable":
      return value === null ? { success: true, value } : parseType(type.type, value, field, stack);
    case "array": {
      if (!Array.isArray(value)) return { success: false, field, reason: "INVALID_FORMAT" };
      for (const key of ownKeys(value)) {
        if (
          key !== "length" &&
          (typeof key !== "string" || !/^(0|[1-9]\d*)$/.test(key) || Number(key) >= value.length)
        )
          return { success: false, field, reason: "UNSUPPORTED" };
      }
      const result: unknown[] = [];
      for (let index = 0; index < value.length; index += 1) {
        if (!Object.hasOwn(value, index))
          return { success: false, field: `${field}[${index}]`, reason: "REQUIRED" };
        const parsed = parseType(type.element, value[index], `${field}[${index}]`, stack);
        if (!parsed.success) return parsed;
        result.push(parsed.value);
      }
      return { success: true, value: result };
    }
    case "object":
      return parseObject(type.properties, undefined, value, field, stack);
    case "record": {
      if (!isPlainRecord(value)) return { success: false, field, reason: "INVALID_FORMAT" };
      const result: Dictionary = {};
      for (const key of ownKeys(value)) {
        if (typeof key !== "string") return { success: false, field, reason: "UNSUPPORTED" };
        const parsed = parseType(type.value, Reflect.get(value, key), pathOf(field, key), stack);
        if (!parsed.success) return parsed;
        result[key] = parsed.value;
      }
      return { success: true, value: result };
    }
    case "scalar": {
      const definition =
        scalar(type.name) ??
        (["string", "boolean", "int32"].includes(type.name)
          ? { name: type.name, base: type.name, constraints: {} }
          : undefined);
      return definition === undefined
        ? { success: false, field, reason: "INVALID_FORMAT" }
        : parseScalar(definition, value, field);
    }
    case "named": {
      if (stack.includes(type.name)) return { success: false, field, reason: "INVALID_FORMAT" };
      const next = [...stack, type.name];
      const namedModel = model(type.name);
      if (namedModel !== undefined)
        return parseObject(namedModel.properties, namedModel.indexer?.value, value, field, next);
      const namedEnum = enumValues(type.name);
      if (namedEnum !== undefined)
        return namedEnum.some((candidate) => Object.is(candidate, value))
          ? { success: true, value }
          : { success: false, field, reason: "UNSUPPORTED" };
      const namedUnion = union(type.name);
      if (namedUnion !== undefined) {
        const code = isPlainRecord(value) ? own(value, "code") : { present: false };
        const selected =
          code.present && typeof code.value === "string"
            ? namedUnion.variants.find(
                (variant) =>
                  variant.type.kind === "named" &&
                  variant.type.name ===
                    `${String(code.value)
                      .toLowerCase()
                      .replace(/(^|_)(\w)/g, (_, _separator, letter) =>
                        letter.toUpperCase(),
                      )}Failure`,
              )
            : undefined;
        const variants = selected === undefined ? namedUnion.variants : [selected];
        let first: ParseResult | undefined;
        for (const variant of variants) {
          const parsed = parseType(variant.type, value, field, next);
          if (parsed.success) return parsed;
          first ??= parsed;
        }
        return first ?? { success: false, field, reason: "INVALID_FORMAT" };
      }
      const namedScalar =
        scalar(type.name) ??
        (["string", "boolean", "int32"].includes(type.name)
          ? { name: type.name, base: type.name, constraints: {} }
          : undefined);
      return namedScalar === undefined
        ? { success: false, field, reason: "INVALID_FORMAT" }
        : parseScalar(namedScalar, value, field);
    }
  }
}

function parseObject(
  properties: readonly RuntimeProperty[],
  indexer: RuntimeType | undefined,
  value: unknown,
  field: string,
  stack: readonly string[],
): ParseResult {
  if (!isPlainRecord(value)) return { success: false, field, reason: "INVALID_FORMAT" };
  const allowed = new Set(properties.map((property) => property.name));
  const keys = ownKeys(value);
  if (indexer === undefined) {
    for (const key of keys)
      if (typeof key !== "string" || !allowed.has(key))
        return { success: false, field: pathOf(field, String(key)), reason: "UNSUPPORTED" };
  }
  const result: Dictionary = {};
  for (const property of properties) {
    const member = own(value, property.name);
    if (!member.present) {
      if (property.optional) continue;
      return { success: false, field: pathOf(field, property.name), reason: "REQUIRED" };
    }
    const propertyField = pathOf(field, property.name);
    if (property.name === "cursor" && typeof member.value === "string") {
      if (member.value.length === 0)
        return { success: false, field: propertyField, reason: "OUT_OF_RANGE" };
      if (
        [...member.value].some(
          (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
        )
      )
        return { success: false, field: propertyField, reason: "INVALID_FORMAT" };
    }
    const parsed = parseType(property.type, member.value, propertyField, stack);
    if (!parsed.success) return parsed;
    result[property.name] = parsed.value;
  }
  if (indexer !== undefined) {
    for (const key of keys) {
      if (typeof key !== "string" || allowed.has(key)) continue;
      const parsed = parseType(indexer, Reflect.get(value, key), pathOf(field, key), stack);
      if (!parsed.success) return parsed;
      result[key] = parsed.value;
    }
  }
  return { success: true, value: result };
}

function safeRequest<Operation extends ExternalOperation>(
  operationName: Operation,
  value: unknown,
): ExternalValidationResult<ExternalRequest<Operation>> {
  try {
    const definition = operation(operationName);
    if (definition === undefined) return issue("operation", "UNSUPPORTED");
    const parsed = parseType({ kind: "named", name: definition.request }, value, "$");
    return parsed.success
      ? (parsed.value as ExternalRequest<Operation>)
      : issue(parsed.field, parsed.reason);
  } catch {
    return issue("$", "INVALID_FORMAT");
  }
}

function safeSuccess<Operation extends ExternalOperation>(
  operationName: Operation,
  value: unknown,
): ExternalValidationResult<ExternalSuccess<Operation>> {
  try {
    const definition = operation(operationName);
    if (definition === undefined) return internalFailure();
    const parsed = parseType({ kind: "named", name: definition.success }, value, "$");
    return parsed.success ? (parsed.value as ExternalSuccess<Operation>) : internalFailure();
  } catch {
    return internalFailure();
  }
}

export function validateExternalFailure(value: unknown): ExternalFailure {
  try {
    if (!isPlainRecord(value) || ownKeys(value).length !== 2 || own(value, "ok").value !== false)
      return internalFailure();
    const error = own(value, "error").value;
    if (!isPlainRecord(error)) return internalFailure();
    const code = own(error, "code").value;
    const allowedCodes: readonly ExternalErrorCode[] = [
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
    ];
    if (typeof code !== "string" || !allowedCodes.includes(code as ExternalErrorCode))
      return internalFailure();
    const allowedByCode: Record<string, readonly string[]> = {
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
    const keys = ownKeys(error);
    if (keys.some((key) => typeof key !== "string" || !allowedByCode[code]?.includes(key)))
      return internalFailure();
    if (Object.hasOwn(error, "fieldIssues")) {
      if (!Array.isArray(error.fieldIssues) || error.fieldIssues.length === 0)
        return internalFailure();
      for (const fieldIssue of error.fieldIssues) {
        const parsed = parseType({ kind: "named", name: "FieldIssue" }, fieldIssue, "fieldIssues");
        if (!parsed.success) return internalFailure();
      }
    }
    if (
      Object.hasOwn(error, "existingResourceId") &&
      (typeof error.existingResourceId !== "string" ||
        error.existingResourceId.length === 0 ||
        [...error.existingResourceId].some(
          (character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127,
        ))
    )
      return internalFailure();
    if (
      Object.hasOwn(error, "currentRevision") &&
      (typeof error.currentRevision !== "number" ||
        !Number.isInteger(error.currentRevision) ||
        error.currentRevision < -2147483648 ||
        error.currentRevision > 2147483647)
    )
      return internalFailure();
    const normalized: Record<string, unknown> = { code };
    if (Object.hasOwn(error, "fieldIssues")) {
      normalized.fieldIssues = (error.fieldIssues as readonly Record<string, unknown>[]).map(
        (fieldIssue) => ({
          field: fieldIssue.field,
          reason: fieldIssue.reason,
        }),
      );
    }
    if (Object.hasOwn(error, "existingResourceId"))
      normalized.existingResourceId = error.existingResourceId;
    if (Object.hasOwn(error, "currentRevision")) normalized.currentRevision = error.currentRevision;
    return { ok: false, error: normalized as ExternalError };
  } catch {
    return internalFailure();
  }
}

export function parseExternalOperationIdentifier(
  value: unknown,
): ExternalOperation | ExternalFailure {
  return typeof value === "string" &&
    semanticManifest.operations.some((candidate) => candidate.name === value)
    ? (value as ExternalOperation)
    : issue("operation", typeof value === "string" ? "UNSUPPORTED" : "INVALID_FORMAT");
}

const requestValidator =
  <Operation extends ExternalOperation>(name: Operation) =>
  (value: unknown) =>
    safeRequest(name, value);
const successValidator =
  <Operation extends ExternalOperation>(name: Operation) =>
  (value: unknown) =>
    safeSuccess(name, value);

export const validateExternalGetTaxonomyRequest = requestValidator("getTaxonomy");
export const validateExternalGetEffectiveResourceSchemaRequest = requestValidator(
  "getEffectiveResourceSchema",
);
export const validateExternalGetValidOptionsRequest = requestValidator("getValidOptions");
export const validateExternalGetNaturalUnitsRequest = requestValidator("getNaturalUnits");
export const validateExternalGetResourceRequest = requestValidator("getResource");
export const validateExternalSearchResourcesRequest = requestValidator("searchResources");
export const validateExternalDescribeResourceRequest = requestValidator("describeResource");
export const validateExternalCreateResourceRequest = requestValidator("createResource");
export const validateExternalUpdateNonIdentityDataRequest =
  requestValidator("updateNonIdentityData");
export const validateExternalDeactivateResourceRequest = requestValidator("deactivateResource");
export const validateExternalGetTaxonomySuccess = successValidator("getTaxonomy");
export const validateExternalGetEffectiveResourceSchemaSuccess = successValidator(
  "getEffectiveResourceSchema",
);
export const validateExternalGetValidOptionsSuccess = successValidator("getValidOptions");
export const validateExternalGetNaturalUnitsSuccess = successValidator("getNaturalUnits");
export const validateExternalGetResourceSuccess = successValidator("getResource");
export const validateExternalSearchResourcesSuccess = successValidator("searchResources");
export const validateExternalDescribeResourceSuccess = successValidator("describeResource");
export const validateExternalCreateResourceSuccess = successValidator("createResource");
export const validateExternalUpdateNonIdentityDataSuccess =
  successValidator("updateNonIdentityData");
export const validateExternalDeactivateResourceSuccess = successValidator("deactivateResource");
