import type { ActorContext, ResourceMaster, Result } from "../../resource-master/public.js";
import type {
  ExternalAttributeValue,
  ExternalCreateResourceRequest,
  ExternalDeactivateResourceRequest,
  ExternalFailure,
  ExternalOperation,
  ExternalOutcome,
  ExternalResourceAttribute,
  ExternalUpdateNonIdentityDataRequest,
} from "../client-facing/contract.js";
import {
  validateExternalCreateResourceSuccess,
  validateExternalDeactivateResourceSuccess,
  validateExternalFailure,
  validateExternalUpdateNonIdentityDataSuccess,
} from "../client-facing/validation.js";
import {
  type ExternalBoundaryDiagnostics,
  normalizeResourceError,
  normalizeThrownError,
} from "./errors.js";
import {
  projectExternalCreateResource,
  projectExternalDeactivateResource,
  projectExternalUpdateNonIdentityData,
} from "./projections.js";

type SuccessValidator<T> = (value: unknown) => T | ExternalFailure;

type ProjectedOutcome<T> = { readonly ok: true; readonly value: T } | ExternalFailure;

function isFailure(value: unknown): value is ExternalFailure {
  try {
    return value !== null && typeof value === "object" && "ok" in value && value.ok === false;
  } catch {
    return false;
  }
}

function checkedFailure(value: ExternalFailure): ExternalFailure {
  return validateExternalFailure(value);
}

function applicationValue<T>(result: Result<T>): T | ExternalFailure {
  try {
    if (result.ok === false) return checkedFailure(normalizeResourceError(result.error));
    if (result.ok !== true)
      return checkedFailure({ ok: false, error: { code: "INTERNAL_FAILURE" } });
    return result.value;
  } catch {
    return checkedFailure({ ok: false, error: { code: "INTERNAL_FAILURE" } });
  }
}

function completeMutationOutcome<Input, Output>(
  operation: ExternalOperation,
  result: Result<Input>,
  project: (value: Input) => unknown,
  validate: SuccessValidator<Output>,
  diagnostics?: ExternalBoundaryDiagnostics,
): ProjectedOutcome<Output> {
  const value = applicationValue(result);
  if (isFailure(value)) return value;
  try {
    const validated = validate(project(value));
    return isFailure(validated)
      ? checkedFailure(
          normalizeThrownError(operation, "response-validation", validated, diagnostics),
        )
      : { ok: true, value: validated };
  } catch (cause) {
    return checkedFailure(normalizeThrownError(operation, "projection", cause, diagnostics));
  }
}

function rebuildAttributeValue(value: ExternalAttributeValue): ExternalAttributeValue {
  if (typeof value === "string" || typeof value === "boolean") return value;
  return { magnitude: value.magnitude, unitCode: value.unitCode };
}

function rebuildAttributes(
  attributes: readonly ExternalResourceAttribute[],
): Record<string, ExternalAttributeValue> | ExternalFailure {
  const rebuilt: Record<string, ExternalAttributeValue> = {};
  for (const attribute of attributes) {
    if (Object.hasOwn(rebuilt, attribute.attributeCode)) {
      return {
        ok: false,
        error: {
          code: "INVALID_ARGUMENT",
          fieldIssues: [{ field: "attributes", reason: "CONFLICTING" }],
        },
      };
    }
    rebuilt[attribute.attributeCode] = rebuildAttributeValue(attribute.value);
  }
  return rebuilt;
}

export async function handleCreateResource(
  request: ExternalCreateResourceRequest,
  actor: ActorContext,
  resourceMaster: ResourceMaster,
  diagnostics?: ExternalBoundaryDiagnostics,
): Promise<ExternalOutcome<"createResource">> {
  const attributes = rebuildAttributes(request.attributes);
  if (isFailure(attributes)) return attributes;
  const input: Parameters<ResourceMaster["createResource"]>[1] = {
    classCode: request.classCode,
    familyCode: request.familyCode,
    typeCode: request.typeCode,
    naturalUnitCode: request.naturalUnitCode,
    attributes,
  };
  let result: Awaited<ReturnType<ResourceMaster["createResource"]>>;
  try {
    result = await resourceMaster.createResource(actor, input);
  } catch (cause) {
    return checkedFailure(normalizeThrownError("createResource", "invocation", cause, diagnostics));
  }
  return completeMutationOutcome(
    "createResource",
    result,
    projectExternalCreateResource,
    validateExternalCreateResourceSuccess,
    diagnostics,
  );
}

export async function handleUpdateNonIdentityData(
  request: ExternalUpdateNonIdentityDataRequest,
  actor: ActorContext,
  resourceMaster: ResourceMaster,
  diagnostics?: ExternalBoundaryDiagnostics,
): Promise<ExternalOutcome<"updateNonIdentityData">> {
  const input: Parameters<ResourceMaster["updateNonIdentityData"]>[1] = {
    resourceId: request.resourceId,
    expectedRevision: request.expectedRevision,
    naturalUnitCode: request.naturalUnitCode,
  };
  let result: Awaited<ReturnType<ResourceMaster["updateNonIdentityData"]>>;
  try {
    result = await resourceMaster.updateNonIdentityData(actor, input);
  } catch (cause) {
    return checkedFailure(
      normalizeThrownError("updateNonIdentityData", "invocation", cause, diagnostics),
    );
  }
  return completeMutationOutcome(
    "updateNonIdentityData",
    result,
    projectExternalUpdateNonIdentityData,
    validateExternalUpdateNonIdentityDataSuccess,
    diagnostics,
  );
}

export async function handleDeactivateResource(
  request: ExternalDeactivateResourceRequest,
  actor: ActorContext,
  resourceMaster: ResourceMaster,
  diagnostics?: ExternalBoundaryDiagnostics,
): Promise<ExternalOutcome<"deactivateResource">> {
  const input: Parameters<ResourceMaster["deactivateResource"]>[1] = {
    resourceId: request.resourceId,
    expectedRevision: request.expectedRevision,
  };
  let result: Awaited<ReturnType<ResourceMaster["deactivateResource"]>>;
  try {
    result = await resourceMaster.deactivateResource(actor, input);
  } catch (cause) {
    return checkedFailure(
      normalizeThrownError("deactivateResource", "invocation", cause, diagnostics),
    );
  }
  return completeMutationOutcome(
    "deactivateResource",
    result,
    projectExternalDeactivateResource,
    validateExternalDeactivateResourceSuccess,
    diagnostics,
  );
}
