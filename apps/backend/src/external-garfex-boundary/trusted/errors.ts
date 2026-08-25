import type { ExternalFailure, ExternalOperation } from "../client-facing/contract.js";
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

function validExternalIdentifier(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.length > 0 &&
    ![...value].some((character) => {
      const code = character.charCodeAt(0);
      return code < 32 || code === 127;
    })
  );
}

function validRevision(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
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

function plainRecord(value: unknown): Record<string, unknown> | undefined {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return undefined;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null
    ? (value as Record<string, unknown>)
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
        return { ok: false, error: { code: "UNAUTHENTICATED" } };
      case "FORBIDDEN":
        return { ok: false, error: { code: "FORBIDDEN" } };
      case "INVALID_ARGUMENT":
        return { ok: false, error: { code: "INVALID_ARGUMENT" } };
      case "INVALID_REFERENCE":
        return { ok: false, error: { code: "INVALID_REFERENCE" } };
      case "VALIDATION":
        return { ok: false, error: { code: "VALIDATION_FAILED" } };
      case "NOT_FOUND":
        return { ok: false, error: { code: "NOT_FOUND" } };
      case "DUPLICATE": {
        if (!Object.hasOwn(record, "existingResourceId")) {
          return { ok: false, error: { code: "DUPLICATE" } };
        }
        const existingResourceId = record.existingResourceId;
        return validExternalIdentifier(existingResourceId)
          ? { ok: false, error: { code: "DUPLICATE", existingResourceId } }
          : internalFailure();
      }
      case "CONFLICT": {
        if (!Object.hasOwn(record, "currentRevision")) {
          return { ok: false, error: { code: "CONFLICT" } };
        }
        const currentRevision = record.currentRevision;
        return validRevision(currentRevision)
          ? { ok: false, error: { code: "CONFLICT", currentRevision } }
          : internalFailure();
      }
      case "INVALID_LIFECYCLE":
        return { ok: false, error: { code: "INVALID_LIFECYCLE" } };
      case "RESOURCE_CATALOG_UNAVAILABLE":
      case "RESOURCE_CATALOG_UNINITIALIZED":
        return { ok: false, error: { code: "CATALOG_UNAVAILABLE" } };
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
    ? { ok: false, error: { code: "UNAUTHENTICATED" } }
    : internalFailure();
}
