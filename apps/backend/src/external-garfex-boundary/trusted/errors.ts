import type {
  ExternalErrorCode,
  ExternalFailure,
  ExternalOperation,
} from "../client-facing/contract.js";
import { validateExternalFailure } from "../client-facing/validation.js";
import type { ResourceError, ResourceErrorCode } from "../../resource-master/public.js";

export type ExternalBoundaryDiagnosticPhase =
  | "authentication"
  | "invocation"
  | "projection"
  | "response-validation";

export interface ExternalBoundaryDiagnostics {
  record(event: {
    operation: ExternalOperation;
    phase: ExternalBoundaryDiagnosticPhase;
    cause: unknown;
  }): void;
}

const internalFailure = (): ExternalFailure => ({
  ok: false,
  error: { code: "INTERNAL_FAILURE" },
});

type FailureRecord = Record<string, unknown>;

/** The generated validator is the only external error membership/shape authority. */
function validatedFailure(
  code: ExternalErrorCode,
  source: FailureRecord,
  metadata: readonly string[],
): ExternalFailure {
  const error: FailureRecord = { code };
  for (const name of metadata) {
    if (Object.hasOwn(source, name)) error[name] = source[name];
  }
  return validateExternalFailure({ ok: false, error });
}

function resourceErrorCode(value: unknown): ResourceErrorCode | undefined {
  switch (value) {
    case "UNAUTHENTICATED":
      return "UNAUTHENTICATED";
    case "FORBIDDEN":
      return "FORBIDDEN";
    case "INVALID_ARGUMENT":
      return "INVALID_ARGUMENT";
    case "NOT_FOUND":
      return "NOT_FOUND";
    case "DUPLICATE":
      return "DUPLICATE";
    case "INVALID_REFERENCE":
      return "INVALID_REFERENCE";
    case "VALIDATION":
      return "VALIDATION";
    case "CONFLICT":
      return "CONFLICT";
    case "INVALID_LIFECYCLE":
      return "INVALID_LIFECYCLE";
    case "INTEGRITY":
      return "INTEGRITY";
    case "INTERNAL":
      return "INTERNAL";
    case "RESOURCE_CATALOG_UNAVAILABLE":
      return "RESOURCE_CATALOG_UNAVAILABLE";
    case "RESOURCE_CATALOG_UNINITIALIZED":
      return "RESOURCE_CATALOG_UNINITIALIZED";
    case "RESOURCE_CATALOG_INVALID":
      return "RESOURCE_CATALOG_INVALID";
    default:
      return undefined;
  }
}

function plainRecord(value: unknown): FailureRecord | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null
    ? (value as FailureRecord)
    : undefined;
}

export function normalizeResourceError(error: ResourceError): ExternalFailure;
export function normalizeResourceError(error: unknown): ExternalFailure;
export function normalizeResourceError(error: unknown): ExternalFailure {
  try {
    const record = plainRecord(error);
    if (record === undefined) return internalFailure();
    const code = resourceErrorCode(record.code);
    if (code === undefined) return internalFailure();

    switch (code) {
      case "UNAUTHENTICATED":
        return validatedFailure("UNAUTHENTICATED", record, []);
      case "FORBIDDEN":
        return validatedFailure("FORBIDDEN", record, []);
      case "INVALID_ARGUMENT":
        return validatedFailure("INVALID_ARGUMENT", record, ["fieldIssues"]);
      case "INVALID_REFERENCE":
        return validatedFailure("INVALID_REFERENCE", record, ["fieldIssues"]);
      case "VALIDATION":
        return validatedFailure("VALIDATION_FAILED", record, ["fieldIssues"]);
      case "NOT_FOUND":
        return validatedFailure("NOT_FOUND", record, []);
      case "DUPLICATE":
        return validatedFailure("DUPLICATE", record, ["existingResourceId"]);
      case "CONFLICT":
        return validatedFailure("CONFLICT", record, ["currentRevision"]);
      case "INVALID_LIFECYCLE":
        return validatedFailure("INVALID_LIFECYCLE", record, []);
      case "RESOURCE_CATALOG_UNAVAILABLE":
      case "RESOURCE_CATALOG_UNINITIALIZED":
        return validatedFailure("CATALOG_UNAVAILABLE", record, []);
      case "INTEGRITY":
      case "INTERNAL":
      case "RESOURCE_CATALOG_INVALID":
        return internalFailure();
      default: {
        const exhaustive: never = code;
        return exhaustive;
      }
    }
  } catch {
    return internalFailure();
  }
}

export function normalizeThrownError(
  operation: ExternalOperation,
  phase: ExternalBoundaryDiagnosticPhase,
  cause: unknown,
  diagnostics?: ExternalBoundaryDiagnostics,
): ExternalFailure {
  try {
    diagnostics?.record({ operation, phase, cause });
  } catch {
    // Diagnostics are server-only and must never affect the external outcome.
  }

  return phase === "authentication"
    ? validatedFailure("UNAUTHENTICATED", {}, [])
    : internalFailure();
}
