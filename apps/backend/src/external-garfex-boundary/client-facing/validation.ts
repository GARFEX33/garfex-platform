import {
  externalAttributeKinds,
  externalErrorCodes,
  externalFieldIssueReasons,
  externalOperationIdentifiers,
  externalResourceLifecycles,
  externalSchemaResultModes,
} from "./contract.js";
import type {
  ExternalAttributeValue,
  ExternalError,
  ExternalFailure,
  ExternalFieldIssue,
  ExternalFieldIssueReason,
  ExternalOperation,
  ExternalRequest,
  ExternalSuccess,
} from "./contract.js";

type Dictionary = Record<string, unknown>;
export type ExternalValidationResult<T> = T | ExternalFailure;

function plainObject(value: unknown): value is Dictionary {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  return [Object.prototype, null].includes(Object.getPrototypeOf(value));
}

function invalid(path: string, reason: ExternalFieldIssueReason): ExternalFailure {
  return { ok: false, error: { code: "INVALID_ARGUMENT", fieldIssues: [{ path, reason }] } };
}

function failed(value: unknown): value is ExternalFailure {
  return plainObject(value) && value.ok === false && plainObject(value.error);
}

function safe<T>(validate: () => ExternalValidationResult<T>): ExternalValidationResult<T> {
  try {
    return validate();
  } catch {
    return invalid("$", "INVALID_VALUE");
  }
}

function closed(
  value: unknown,
  allowed: readonly string[],
  path = "$",
): Dictionary | ExternalFailure {
  if (!plainObject(value)) return invalid(path, "TYPE");
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string" || !allowed.includes(key)) {
      return invalid(path === "$" && typeof key === "string" ? key : path, "UNKNOWN_FIELD");
    }
  }
  return value;
}

function text(record: Dictionary, key: string, path = key): string | ExternalFailure {
  if (!Object.hasOwn(record, key)) return invalid(path, "REQUIRED");
  const value = record[key];
  return typeof value === "string" && value.length > 0 ? value : invalid(path, "TYPE");
}

function integer(
  record: Dictionary,
  key: string,
  minimum: number,
  maximum: number,
): number | ExternalFailure {
  if (!Object.hasOwn(record, key)) return invalid(key, "REQUIRED");
  const value = record[key];
  return typeof value === "number" &&
    Number.isSafeInteger(value) &&
    value >= minimum &&
    value <= maximum
    ? value
    : invalid(key, "OUT_OF_RANGE");
}

function choice<const Values extends readonly string[]>(
  record: Dictionary,
  key: string,
  values: Values,
): Values[number] | ExternalFailure {
  const value = text(record, key);
  return failed(value)
    ? value
    : values.includes(value as Values[number])
      ? value
      : invalid(key, "INVALID_VALUE");
}

function textFields(
  record: Dictionary,
  keys: readonly string[],
): Record<string, string> | ExternalFailure {
  const result: Record<string, string> = {};
  for (const key of keys) {
    const value = text(record, key);
    if (failed(value)) return value;
    result[key] = value;
  }
  return result;
}

function field(fields: Record<string, string>, key: string): string {
  const value = fields[key];
  if (value === undefined) throw new Error(`validated field is missing: ${key}`);
  return value;
}

function textValidator<T>(
  keys: readonly string[],
  build: (fields: Record<string, string>) => T,
): (value: unknown) => ExternalValidationResult<T> {
  return (value) =>
    safe(() => {
      const record = closed(value, keys);
      if (failed(record)) return record;
      const fields = textFields(record, keys);
      return failed(fields) ? fields : build(fields);
    });
}

const controlCharacter = (value: string): boolean =>
  [...value].some((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);

const reservedAttributePattern =
  /^(?:__proto__|constructor|prototype|actor|role|capabilit|claim|token|credential|session|provider|auth|authorit|identity|resourceid|convex|document|database|repository|persist|deploy|catalog)/;

function attribute(value: unknown, path: string): ExternalAttributeValue | ExternalFailure {
  if (typeof value === "string" || typeof value === "boolean") return value;
  const quantity = closed(value, ["magnitude", "unitCode"], path);
  if (failed(quantity)) return quantity;
  const magnitude = text(quantity, "magnitude", `${path}.magnitude`);
  if (failed(magnitude)) return magnitude;
  const unitCode = text(quantity, "unitCode", `${path}.unitCode`);
  return failed(unitCode) ? unitCode : { magnitude, unitCode };
}

function attributes(
  value: unknown,
  path: string,
): Record<string, ExternalAttributeValue> | ExternalFailure {
  if (!plainObject(value)) return invalid(path, "TYPE");
  const result: Record<string, ExternalAttributeValue> = {};
  for (const key of Reflect.ownKeys(value)) {
    const normalized = typeof key === "string" ? key.replace(/[_.-]/g, "").toLowerCase() : "";
    if (typeof key !== "string" || reservedAttributePattern.test(normalized)) {
      return invalid(`${path}.${typeof key === "string" ? key : "*"}`, "UNKNOWN_FIELD");
    }
    const item = attribute(value[key], `${path}.${key}`);
    if (failed(item)) return item;
    result[key] = item;
  }
  return result;
}

export function parseExternalOperationIdentifier(
  value: unknown,
): ExternalOperation | ExternalFailure {
  const operation =
    typeof value === "string"
      ? externalOperationIdentifiers.find((candidate) => candidate === value)
      : undefined;
  return operation ?? invalid("operation", typeof value === "string" ? "INVALID_VALUE" : "TYPE");
}

export function validateExternalGetTaxonomyRequest(
  value: unknown,
): ExternalValidationResult<ExternalRequest<"getTaxonomy">> {
  return safe(() => {
    const record = closed(value, []);
    return failed(record) ? record : {};
  });
}

export const validateExternalGetEffectiveResourceSchemaRequest = textValidator(
  ["classCode", "familyCode", "typeCode"],
  (fields) => ({
    classCode: field(fields, "classCode"),
    familyCode: field(fields, "familyCode"),
    typeCode: field(fields, "typeCode"),
  }),
);

export const validateExternalGetValidOptionsRequest = textValidator(
  ["attributeCode"],
  (fields) => ({ attributeCode: field(fields, "attributeCode") }),
);

export const validateExternalGetNaturalUnitsRequest = textValidator(["familyCode"], (fields) => ({
  familyCode: field(fields, "familyCode"),
}));

export const validateExternalGetResourceRequest = textValidator(["resourceId"], (fields) => ({
  resourceId: field(fields, "resourceId"),
}));

export function validateExternalSearchResourcesRequest(
  value: unknown,
): ExternalValidationResult<ExternalRequest<"searchResources">> {
  return safe(() => {
    const record = closed(value, ["terms", "lifecycle", "limit", "cursor"]);
    if (failed(record)) return record;
    const terms = text(record, "terms");
    if (failed(terms)) return terms;

    const result: ExternalRequest<"searchResources"> & {
      lifecycle?: (typeof externalResourceLifecycles)[number];
      limit?: number;
      cursor?: string | null;
    } = { terms };
    if (Object.hasOwn(record, "lifecycle")) {
      const lifecycle = choice(record, "lifecycle", externalResourceLifecycles);
      if (failed(lifecycle)) return lifecycle;
      result.lifecycle = lifecycle;
    }
    if (Object.hasOwn(record, "limit")) {
      const limit = integer(record, "limit", 1, 50);
      if (failed(limit)) return limit;
      result.limit = limit;
    }
    if (Object.hasOwn(record, "cursor")) {
      const cursor = record.cursor;
      if (cursor !== null && typeof cursor !== "string") return invalid("cursor", "TYPE");
      if (typeof cursor === "string" && (cursor.length === 0 || controlCharacter(cursor))) {
        return invalid("cursor", "INVALID_VALUE");
      }
      result.cursor = cursor;
    }
    return result;
  });
}

export const validateExternalDescribeResourceRequest = textValidator(["resourceId"], (fields) => ({
  resourceId: field(fields, "resourceId"),
}));

export function validateExternalCreateResourceRequest(
  value: unknown,
): ExternalValidationResult<ExternalRequest<"createResource">> {
  return safe(() => {
    const record = closed(value, [
      "classCode",
      "familyCode",
      "typeCode",
      "naturalUnitCode",
      "attributes",
    ]);
    if (failed(record)) return record;
    const fields = textFields(record, ["classCode", "familyCode", "typeCode", "naturalUnitCode"]);
    if (failed(fields)) return fields;
    const values = attributes(record.attributes, "attributes");
    if (failed(values)) return values;
    return {
      classCode: field(fields, "classCode"),
      familyCode: field(fields, "familyCode"),
      typeCode: field(fields, "typeCode"),
      naturalUnitCode: field(fields, "naturalUnitCode"),
      attributes: values,
    };
  });
}

function revisionRequest<T>(
  value: unknown,
  keys: readonly string[],
  build: (
    resourceId: string,
    expectedRevision: number,
    record: Dictionary,
  ) => ExternalValidationResult<T>,
): ExternalValidationResult<T> {
  return safe(() => {
    const record = closed(value, keys);
    if (failed(record)) return record;
    const resourceId = text(record, "resourceId");
    if (failed(resourceId)) return resourceId;
    const expectedRevision = integer(record, "expectedRevision", 0, Number.MAX_SAFE_INTEGER);
    return failed(expectedRevision)
      ? expectedRevision
      : build(resourceId, expectedRevision, record);
  });
}

export function validateExternalUpdateNonIdentityDataRequest(
  value: unknown,
): ExternalValidationResult<ExternalRequest<"updateNonIdentityData">> {
  return revisionRequest(
    value,
    ["resourceId", "expectedRevision", "naturalUnitCode"],
    (resourceId, expectedRevision, record) => {
      const naturalUnitCode = text(record, "naturalUnitCode");
      return failed(naturalUnitCode)
        ? naturalUnitCode
        : { resourceId, expectedRevision, naturalUnitCode };
    },
  );
}

export function validateExternalDeactivateResourceRequest(
  value: unknown,
): ExternalValidationResult<ExternalRequest<"deactivateResource">> {
  return revisionRequest(
    value,
    ["resourceId", "expectedRevision"],
    (resourceId, expectedRevision) => ({
      resourceId,
      expectedRevision,
    }),
  );
}
