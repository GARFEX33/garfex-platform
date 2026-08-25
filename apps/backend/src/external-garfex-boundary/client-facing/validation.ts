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

const internalFailure = (): ExternalFailure => ({
  ok: false,
  error: { code: "INTERNAL_FAILURE" },
});

type OutputParser<T> = (value: unknown) => T | undefined;
type ParsedField<T> = T extends OutputParser<infer Value> ? Value : never;

function outputShape<const Fields extends Record<string, OutputParser<unknown>>>(
  fields: Fields,
): OutputParser<{ [Key in keyof Fields]: ParsedField<Fields[Key]> }> {
  return (value) => {
    if (!plainObject(value)) return undefined;
    for (const key of Reflect.ownKeys(value)) {
      if (typeof key !== "string" || !Object.hasOwn(fields, key)) return undefined;
    }
    const result: Dictionary = {};
    for (const key of Object.keys(fields)) {
      const field = fields[key];
      if (field === undefined || !Object.hasOwn(value, key)) return undefined;
      const parsed = field(value[key]);
      if (parsed === undefined) return undefined;
      result[key] = parsed;
    }
    return result as { [Key in keyof Fields]: ParsedField<Fields[Key]> };
  };
}

function outputArrayOf<T>(parse: OutputParser<T>): OutputParser<T[]> {
  return (value) => {
    if (!Array.isArray(value)) return undefined;
    for (const key of Reflect.ownKeys(value)) {
      if (
        key !== "length" &&
        (typeof key !== "string" || !/^(0|[1-9]\d*)$/.test(key) || Number(key) >= value.length)
      ) {
        return undefined;
      }
    }
    const result: T[] = [];
    for (let index = 0; index < value.length; index += 1) {
      if (!Object.hasOwn(value, index)) return undefined;
      const parsed = parse(value[index]);
      if (parsed === undefined) return undefined;
      result.push(parsed);
    }
    return result;
  };
}

const outputText: OutputParser<string> = (value) => (typeof value === "string" ? value : undefined);
const outputBoolean: OutputParser<boolean> = (value) =>
  typeof value === "boolean" ? value : undefined;
const outputIdentifier: OutputParser<string> = (value) => {
  if (typeof value !== "string" || value.length === 0 || controlCharacter(value)) return undefined;
  return value;
};

function outputChoice<const Values extends readonly string[]>(
  values: Values,
): OutputParser<Values[number]> {
  return (value) => {
    if (typeof value !== "string") return undefined;
    return values.includes(value as Values[number]) ? (value as Values[number]) : undefined;
  };
}

function validateOutput<T>(parse: OutputParser<T>, value: unknown): ExternalValidationResult<T> {
  try {
    const result = parse(value);
    return result === undefined ? internalFailure() : result;
  } catch {
    return internalFailure();
  }
}

const codeName = outputShape({ code: outputIdentifier, name: outputText });
const taxonomyFamily = outputShape({
  code: outputIdentifier,
  name: outputText,
  types: outputArrayOf(codeName),
});
const taxonomyEntry = outputShape({
  code: outputIdentifier,
  name: outputText,
  families: outputArrayOf(taxonomyFamily),
});

const schemaResult = outputShape({
  mode: outputChoice(externalSchemaResultModes),
  identity: outputBoolean,
});
const schemaRule = outputShape({
  when: outputShape({ attributeCode: outputIdentifier, optionCode: outputIdentifier }),
  result: schemaResult,
});
const schemaAttribute = outputShape({
  code: outputIdentifier,
  name: outputText,
  kind: outputChoice(externalAttributeKinds),
  meaning: outputText,
  defaultResult: schemaResult,
  rules: outputArrayOf(schemaRule),
});

const option = outputShape({ code: outputIdentifier, label: outputText });
const outputQuantity: OutputParser<ExternalAttributeValue> = outputShape({
  magnitude: outputIdentifier,
  unitCode: outputIdentifier,
});
const outputAttributeValue: OutputParser<ExternalAttributeValue> = (value) => {
  if (typeof value === "string" || typeof value === "boolean") return value;
  return outputQuantity(value);
};
const outputResourceAttribute: OutputParser<ExternalSuccess<"getResource">["attributes"][number]> =
  outputShape({
    attributeCode: outputIdentifier,
    value: outputAttributeValue,
    displayValue: outputText,
    identityParticipating: outputBoolean,
  });
const outputRevision: OutputParser<number> = (value) =>
  typeof value === "number" && Number.isSafeInteger(value) && value >= 0 ? value : undefined;
const outputResource: OutputParser<ExternalSuccess<"getResource">> = outputShape({
  resourceId: outputIdentifier,
  classCode: outputIdentifier,
  familyCode: outputIdentifier,
  typeCode: outputIdentifier,
  naturalUnitCode: outputIdentifier,
  attributes: outputArrayOf(outputResourceAttribute),
  canonicalIdentity: outputIdentifier,
  identityPolicyVersion: outputChoice(["v1"] as const),
  active: outputBoolean,
  revision: outputRevision,
});
const outputSummary: OutputParser<ExternalSuccess<"searchResources">["items"][number]> =
  outputShape({
    resourceId: outputIdentifier,
    classCode: outputIdentifier,
    className: outputText,
    familyCode: outputIdentifier,
    familyName: outputText,
    typeCode: outputIdentifier,
    typeName: outputText,
    naturalUnitCode: outputIdentifier,
    description: outputText,
    optionCodes: outputArrayOf(outputIdentifier),
    optionLabels: outputArrayOf(outputText),
    values: outputArrayOf(outputText),
  });
const outputCursor: OutputParser<string | null> = (value) =>
  value === null ? null : outputIdentifier(value);
const outputSearch: OutputParser<ExternalSuccess<"searchResources">> = outputShape({
  items: outputArrayOf(outputSummary),
  cursor: outputCursor,
});
const outputDescription: OutputParser<ExternalSuccess<"describeResource">> = outputShape({
  resourceId: outputIdentifier,
  description: outputText,
});

export function validateExternalGetTaxonomySuccess(
  value: unknown,
): ExternalValidationResult<ExternalSuccess<"getTaxonomy">> {
  return validateOutput(outputArrayOf(taxonomyEntry), value);
}

export function validateExternalGetEffectiveResourceSchemaSuccess(
  value: unknown,
): ExternalValidationResult<ExternalSuccess<"getEffectiveResourceSchema">> {
  return validateOutput(outputShape({ attributes: outputArrayOf(schemaAttribute) }), value);
}

export function validateExternalGetValidOptionsSuccess(
  value: unknown,
): ExternalValidationResult<ExternalSuccess<"getValidOptions">> {
  return validateOutput(outputArrayOf(option), value);
}

export function validateExternalGetNaturalUnitsSuccess(
  value: unknown,
): ExternalValidationResult<ExternalSuccess<"getNaturalUnits">> {
  return validateOutput(
    outputShape({ allowed: outputArrayOf(codeName), suggested: codeName }),
    value,
  );
}

export function validateExternalGetResourceSuccess(
  value: unknown,
): ExternalValidationResult<ExternalSuccess<"getResource">> {
  return validateOutput(outputResource, value);
}

export function validateExternalSearchResourcesSuccess(
  value: unknown,
): ExternalValidationResult<ExternalSuccess<"searchResources">> {
  return validateOutput(outputSearch, value);
}

export function validateExternalDescribeResourceSuccess(
  value: unknown,
): ExternalValidationResult<ExternalSuccess<"describeResource">> {
  return validateOutput(outputDescription, value);
}

export function validateExternalCreateResourceSuccess(
  value: unknown,
): ExternalValidationResult<ExternalSuccess<"createResource">> {
  return validateOutput(outputResource, value);
}

export function validateExternalUpdateNonIdentityDataSuccess(
  value: unknown,
): ExternalValidationResult<ExternalSuccess<"updateNonIdentityData">> {
  return validateOutput(outputResource, value);
}

export function validateExternalDeactivateResourceSuccess(
  value: unknown,
): ExternalValidationResult<ExternalSuccess<"deactivateResource">> {
  return validateOutput(outputResource, value);
}

type ParsedOptional<T> =
  | { readonly present: false }
  | { readonly present: true; readonly value: T };

function closedFailureObject(
  value: unknown,
  allowedKeys: readonly string[],
): Dictionary | undefined {
  if (!plainObject(value)) return undefined;
  for (const key of Reflect.ownKeys(value)) {
    if (typeof key !== "string" || !allowedKeys.includes(key)) return undefined;
  }
  return value;
}

function parseOptionalFailureField<T>(
  record: Dictionary,
  key: string,
  parse: OutputParser<T>,
): ParsedOptional<T> | undefined {
  if (!Object.hasOwn(record, key)) return { present: false };
  const parsed = parse(record[key]);
  return parsed === undefined ? undefined : { present: true, value: parsed };
}

const failureFieldIssue: OutputParser<ExternalFieldIssue> = outputShape({
  path: outputIdentifier,
  reason: outputChoice(externalFieldIssueReasons),
});
const failureFieldIssues: OutputParser<readonly ExternalFieldIssue[]> =
  outputArrayOf(failureFieldIssue);

function parseFieldIssueError(
  record: Dictionary,
  code: "INVALID_ARGUMENT" | "INVALID_REFERENCE" | "VALIDATION_FAILED",
): ExternalError | undefined {
  const closed = closedFailureObject(record, ["code", "fieldIssues"]);
  if (closed === undefined) return undefined;
  const fieldIssues = parseOptionalFailureField(closed, "fieldIssues", failureFieldIssues);
  if (fieldIssues === undefined) return undefined;
  return fieldIssues.present ? { code, fieldIssues: fieldIssues.value } : { code };
}

function parseDuplicateError(record: Dictionary): ExternalError | undefined {
  const closed = closedFailureObject(record, ["code", "existingResourceId"]);
  if (closed === undefined) return undefined;
  const existingResourceId = parseOptionalFailureField(
    closed,
    "existingResourceId",
    outputIdentifier,
  );
  if (existingResourceId === undefined) return undefined;
  return existingResourceId.present
    ? { code: "DUPLICATE", existingResourceId: existingResourceId.value }
    : { code: "DUPLICATE" };
}

function parseConflictError(record: Dictionary): ExternalError | undefined {
  const closed = closedFailureObject(record, ["code", "currentRevision"]);
  if (closed === undefined) return undefined;
  const currentRevision = parseOptionalFailureField(closed, "currentRevision", outputRevision);
  if (currentRevision === undefined) return undefined;
  return currentRevision.present
    ? { code: "CONFLICT", currentRevision: currentRevision.value }
    : { code: "CONFLICT" };
}

function parseExternalError(value: unknown): ExternalError | undefined {
  const record = closedFailureObject(value, [
    "code",
    "fieldIssues",
    "existingResourceId",
    "currentRevision",
  ]);
  if (record === undefined) return undefined;
  const code = outputChoice(externalErrorCodes)(record.code);
  if (code === undefined) return undefined;

  switch (code) {
    case "INVALID_ARGUMENT":
    case "INVALID_REFERENCE":
    case "VALIDATION_FAILED":
      return parseFieldIssueError(record, code);
    case "DUPLICATE":
      return parseDuplicateError(record);
    case "CONFLICT":
      return parseConflictError(record);
    case "UNAUTHENTICATED":
    case "FORBIDDEN":
    case "NOT_FOUND":
    case "INVALID_LIFECYCLE":
    case "CATALOG_UNAVAILABLE":
    case "INTERNAL_FAILURE": {
      const closed = closedFailureObject(record, ["code"]);
      return closed === undefined ? undefined : { code };
    }
  }
}

export function validateExternalFailure(value: unknown): ExternalFailure {
  try {
    const record = closedFailureObject(value, ["ok", "error"]);
    if (record === undefined || record.ok !== false || !Object.hasOwn(record, "error")) {
      return internalFailure();
    }
    const error = parseExternalError(record.error);
    return error === undefined ? internalFailure() : { ok: false, error };
  } catch {
    return internalFailure();
  }
}
