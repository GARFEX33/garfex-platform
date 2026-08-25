import type { ActorContext, ResourceMaster, Result } from "../../resource-master/public.js";
import type {
  ExternalFailure,
  ExternalOperation,
  ExternalOutcome,
} from "../client-facing/contract.js";
import {
  validateExternalFailure,
  validateExternalGetEffectiveResourceSchemaRequest,
  validateExternalGetEffectiveResourceSchemaSuccess,
  validateExternalGetNaturalUnitsRequest,
  validateExternalGetNaturalUnitsSuccess,
  validateExternalGetResourceRequest,
  validateExternalGetResourceSuccess,
  validateExternalSearchResourcesRequest,
  validateExternalSearchResourcesSuccess,
  validateExternalGetTaxonomyRequest,
  validateExternalGetTaxonomySuccess,
  validateExternalGetValidOptionsRequest,
  validateExternalGetValidOptionsSuccess,
  validateExternalDescribeResourceRequest,
  validateExternalDescribeResourceSuccess,
} from "../client-facing/validation.js";
import {
  normalizeResourceError,
  normalizeThrownError,
  type ExternalBoundaryDiagnostics,
} from "./errors.js";
import type { TrustedActorResolver } from "./identity.js";
import {
  projectExternalGetEffectiveResourceSchema,
  projectExternalGetNaturalUnits,
  projectExternalGetResource,
  projectExternalSearchResources,
  projectExternalGetTaxonomy,
  projectExternalGetValidOptions,
  projectExternalDescribeResource,
} from "./projections.js";

type ReadDependencies = {
  readonly actorResolver: TrustedActorResolver;
  readonly resourceMaster: ResourceMaster;
  readonly diagnostics?: ExternalBoundaryDiagnostics;
};
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

async function trustedActor(
  resolver: TrustedActorResolver,
): Promise<ActorContext | ExternalFailure> {
  try {
    const actor = await resolver.resolveActor();
    if (actor !== null) return actor;
  } catch {
    // Authentication failures are intentionally indistinguishable at this edge.
  }
  return checkedFailure({ ok: false, error: { code: "UNAUTHENTICATED" } });
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

function completeReadOutcome<Input, Output>(
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

export async function invokeExternalGetTaxonomy(
  rawRequest: unknown,
  { actorResolver, resourceMaster, diagnostics }: ReadDependencies,
): Promise<ExternalOutcome<"getTaxonomy">> {
  const request = validateExternalGetTaxonomyRequest(rawRequest);
  if (isFailure(request)) return checkedFailure(request);
  const actor = await trustedActor(actorResolver);
  if (isFailure(actor)) return actor;

  let result: Awaited<ReturnType<ResourceMaster["getTaxonomy"]>>;
  try {
    result = await resourceMaster.getTaxonomy(actor);
  } catch (cause) {
    return checkedFailure(normalizeThrownError("getTaxonomy", "invocation", cause, diagnostics));
  }
  return completeReadOutcome(
    "getTaxonomy",
    result,
    projectExternalGetTaxonomy,
    validateExternalGetTaxonomySuccess,
    diagnostics,
  );
}

export async function invokeExternalGetEffectiveResourceSchema(
  rawRequest: unknown,
  { actorResolver, resourceMaster, diagnostics }: ReadDependencies,
): Promise<ExternalOutcome<"getEffectiveResourceSchema">> {
  const request = validateExternalGetEffectiveResourceSchemaRequest(rawRequest);
  if (isFailure(request)) return checkedFailure(request);
  const actor = await trustedActor(actorResolver);
  if (isFailure(actor)) return actor;

  let result: Awaited<ReturnType<ResourceMaster["getEffectiveResourceSchema"]>>;
  try {
    result = await resourceMaster.getEffectiveResourceSchema(actor, {
      classCode: request.classCode,
      familyCode: request.familyCode,
      typeCode: request.typeCode,
    });
  } catch (cause) {
    return checkedFailure(
      normalizeThrownError("getEffectiveResourceSchema", "invocation", cause, diagnostics),
    );
  }
  return completeReadOutcome(
    "getEffectiveResourceSchema",
    result,
    projectExternalGetEffectiveResourceSchema,
    validateExternalGetEffectiveResourceSchemaSuccess,
    diagnostics,
  );
}

export async function invokeExternalGetValidOptions(
  rawRequest: unknown,
  { actorResolver, resourceMaster, diagnostics }: ReadDependencies,
): Promise<ExternalOutcome<"getValidOptions">> {
  const request = validateExternalGetValidOptionsRequest(rawRequest);
  if (isFailure(request)) return checkedFailure(request);
  const actor = await trustedActor(actorResolver);
  if (isFailure(actor)) return actor;

  let result: Awaited<ReturnType<ResourceMaster["getValidOptions"]>>;
  try {
    result = await resourceMaster.getValidOptions(actor, { attributeCode: request.attributeCode });
  } catch (cause) {
    return checkedFailure(
      normalizeThrownError("getValidOptions", "invocation", cause, diagnostics),
    );
  }
  return completeReadOutcome(
    "getValidOptions",
    result,
    projectExternalGetValidOptions,
    validateExternalGetValidOptionsSuccess,
    diagnostics,
  );
}

export async function invokeExternalGetNaturalUnits(
  rawRequest: unknown,
  { actorResolver, resourceMaster, diagnostics }: ReadDependencies,
): Promise<ExternalOutcome<"getNaturalUnits">> {
  const request = validateExternalGetNaturalUnitsRequest(rawRequest);
  if (isFailure(request)) return checkedFailure(request);
  const actor = await trustedActor(actorResolver);
  if (isFailure(actor)) return actor;

  let result: Awaited<ReturnType<ResourceMaster["getNaturalUnits"]>>;
  try {
    result = await resourceMaster.getNaturalUnits(actor, { familyCode: request.familyCode });
  } catch (cause) {
    return checkedFailure(
      normalizeThrownError("getNaturalUnits", "invocation", cause, diagnostics),
    );
  }
  return completeReadOutcome(
    "getNaturalUnits",
    result,
    projectExternalGetNaturalUnits,
    validateExternalGetNaturalUnitsSuccess,
    diagnostics,
  );
}

export async function invokeExternalGetResource(
  rawRequest: unknown,
  { actorResolver, resourceMaster, diagnostics }: ReadDependencies,
): Promise<ExternalOutcome<"getResource">> {
  const request = validateExternalGetResourceRequest(rawRequest);
  if (isFailure(request)) return checkedFailure(request);
  const actor = await trustedActor(actorResolver);
  if (isFailure(actor)) return actor;

  let result: Awaited<ReturnType<ResourceMaster["getResource"]>>;
  try {
    result = await resourceMaster.getResource(actor, { resourceId: request.resourceId });
  } catch (cause) {
    return checkedFailure(normalizeThrownError("getResource", "invocation", cause, diagnostics));
  }
  return completeReadOutcome(
    "getResource",
    result,
    projectExternalGetResource,
    validateExternalGetResourceSuccess,
    diagnostics,
  );
}

export async function invokeExternalSearchResources(
  rawRequest: unknown,
  { actorResolver, resourceMaster, diagnostics }: ReadDependencies,
): Promise<ExternalOutcome<"searchResources">> {
  const request = validateExternalSearchResourcesRequest(rawRequest);
  if (isFailure(request)) return checkedFailure(request);
  const actor = await trustedActor(actorResolver);
  if (isFailure(actor)) return actor;

  const input: Parameters<ResourceMaster["searchResources"]>[1] = {
    terms: request.terms,
    ...(request.lifecycle === undefined ? {} : { lifecycle: request.lifecycle }),
    ...(request.limit === undefined ? {} : { limit: request.limit }),
    ...(request.cursor === undefined ? {} : { cursor: request.cursor }),
  };

  let result: Awaited<ReturnType<ResourceMaster["searchResources"]>>;
  try {
    result = await resourceMaster.searchResources(actor, input);
  } catch (cause) {
    return checkedFailure(
      normalizeThrownError("searchResources", "invocation", cause, diagnostics),
    );
  }
  return completeReadOutcome(
    "searchResources",
    result,
    projectExternalSearchResources,
    validateExternalSearchResourcesSuccess,
    diagnostics,
  );
}

export async function invokeExternalDescribeResource(
  rawRequest: unknown,
  { actorResolver, resourceMaster, diagnostics }: ReadDependencies,
): Promise<ExternalOutcome<"describeResource">> {
  const request = validateExternalDescribeResourceRequest(rawRequest);
  if (isFailure(request)) return checkedFailure(request);
  const actor = await trustedActor(actorResolver);
  if (isFailure(actor)) return actor;

  let result: Awaited<ReturnType<ResourceMaster["describeResource"]>>;
  try {
    result = await resourceMaster.describeResource(actor, {
      resourceId: request.resourceId,
    });
  } catch (cause) {
    return checkedFailure(
      normalizeThrownError("describeResource", "invocation", cause, diagnostics),
    );
  }
  return completeReadOutcome(
    "describeResource",
    result,
    projectExternalDescribeResource,
    validateExternalDescribeResourceSuccess,
    diagnostics,
  );
}
