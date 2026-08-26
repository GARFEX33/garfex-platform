import type { ActorContext, ResourceMaster } from "../resource-master/public.js";
import type {
  ExternalFailure,
  ExternalOperation,
  ExternalOutcome,
  ExternalSuccess,
} from "./client-facing/contract.js";
import {
  type ExternalValidationResult,
  validateExternalCreateResourceRequest,
  validateExternalDeactivateResourceRequest,
  validateExternalDescribeResourceRequest,
  validateExternalDescribeResourceSuccess,
  validateExternalFailure,
  validateExternalGetEffectiveResourceSchemaRequest,
  validateExternalGetEffectiveResourceSchemaSuccess,
  validateExternalGetNaturalUnitsRequest,
  validateExternalGetNaturalUnitsSuccess,
  validateExternalGetResourceRequest,
  validateExternalGetResourceSuccess,
  validateExternalGetTaxonomyRequest,
  validateExternalGetTaxonomySuccess,
  validateExternalGetValidOptionsRequest,
  validateExternalGetValidOptionsSuccess,
  validateExternalSearchResourcesRequest,
  validateExternalSearchResourcesSuccess,
  validateExternalUpdateNonIdentityDataRequest,
} from "./client-facing/validation.js";
import { type ExternalBoundaryDiagnostics, normalizeThrownError } from "./trusted/errors.js";
import type { TrustedActorResolver } from "./trusted/identity.js";
import {
  handleCreateResource,
  handleDeactivateResource,
  handleUpdateNonIdentityData,
} from "./trusted/mutation-operations.js";
import {
  handleDescribeResource,
  handleGetEffectiveResourceSchema,
  handleGetNaturalUnits,
  handleGetResource,
  handleGetTaxonomy,
  handleGetValidOptions,
  handleSearchResources,
} from "./trusted/read-operations.js";

export type ExternalReadCompositionDependencies = {
  readonly actorResolver: TrustedActorResolver;
  readonly resourceMaster: ResourceMaster;
  readonly diagnostics?: ExternalBoundaryDiagnostics;
};

type SuccessOutcome = { readonly ok: true; readonly value: unknown };

type CapabilityFor<Operation extends ExternalOperation> = Operation extends
  | "getTaxonomy"
  | "getEffectiveResourceSchema"
  | "getValidOptions"
  | "getNaturalUnits"
  | "getResource"
  | "searchResources"
  | "describeResource"
  ? "resource:read"
  : Operation extends "createResource"
    ? "resource:create"
    : Operation extends "updateNonIdentityData"
      ? "resource:update-non-identity"
      : "resource:deactivate";

export const externalOperationMappingEvidence = {
  getTaxonomy: { moduleMethod: "getTaxonomy", capability: "resource:read" },
  getEffectiveResourceSchema: {
    moduleMethod: "getEffectiveResourceSchema",
    capability: "resource:read",
  },
  getValidOptions: { moduleMethod: "getValidOptions", capability: "resource:read" },
  getNaturalUnits: { moduleMethod: "getNaturalUnits", capability: "resource:read" },
  getResource: { moduleMethod: "getResource", capability: "resource:read" },
  searchResources: { moduleMethod: "searchResources", capability: "resource:read" },
  describeResource: { moduleMethod: "describeResource", capability: "resource:read" },
  createResource: { moduleMethod: "createResource", capability: "resource:create" },
  updateNonIdentityData: {
    moduleMethod: "updateNonIdentityData",
    capability: "resource:update-non-identity",
  },
  deactivateResource: { moduleMethod: "deactivateResource", capability: "resource:deactivate" },
} satisfies {
  readonly [Operation in ExternalOperation]: {
    readonly moduleMethod: Operation;
    readonly capability: CapabilityFor<Operation>;
  };
};

type NamedSuccessValidator<Operation extends ExternalOperation> = (
  value: unknown,
) => ExternalValidationResult<ExternalSuccess<Operation>>;

function isFailure(value: unknown): value is ExternalFailure {
  try {
    return value !== null && typeof value === "object" && "ok" in value && value.ok === false;
  } catch {
    return false;
  }
}

function isSuccess(value: unknown): value is SuccessOutcome {
  try {
    return value !== null && typeof value === "object" && "ok" in value && value.ok === true;
  } catch {
    return false;
  }
}

function checkedFailure(value: ExternalFailure): ExternalFailure {
  return validateExternalFailure(value);
}

function internalFailure(): ExternalFailure {
  return checkedFailure({ ok: false, error: { code: "INTERNAL_FAILURE" } });
}

async function resolveTrustedActor(
  operation: ExternalOperation,
  resolver: TrustedActorResolver,
  diagnostics?: ExternalBoundaryDiagnostics,
): Promise<ActorContext | ExternalFailure> {
  try {
    // TrustedActorResolver is the authentication composition boundary. Its
    // implementation creates a new ActorContext and copies server capabilities
    // for every successful resolution; business input never reaches it.
    const actor = await resolver.resolveActor();
    return actor === null
      ? checkedFailure({ ok: false, error: { code: "UNAUTHENTICATED" } })
      : actor;
  } catch (cause) {
    return checkedFailure(normalizeThrownError(operation, "authentication", cause, diagnostics));
  }
}

function completeReadOutcome<Operation extends ExternalOperation>(
  operation: Operation,
  outcome: unknown,
  validateSuccess: NamedSuccessValidator<Operation>,
  diagnostics?: ExternalBoundaryDiagnostics,
): ExternalOutcome<Operation> {
  try {
    if (isFailure(outcome)) return checkedFailure(outcome);
    if (!isSuccess(outcome)) return internalFailure();

    const validated = validateSuccess(outcome.value);
    if (isFailure(validated)) {
      return checkedFailure(
        normalizeThrownError(operation, "response-validation", validated, diagnostics),
      );
    }
    return { ok: true, value: validated };
  } catch (cause) {
    return checkedFailure(
      normalizeThrownError(operation, "response-validation", cause, diagnostics),
    );
  }
}

export async function invokeExternalGetTaxonomy(
  rawRequest: unknown,
  dependencies: ExternalReadCompositionDependencies,
): Promise<ExternalOutcome<"getTaxonomy">> {
  const request = validateExternalGetTaxonomyRequest(rawRequest);
  if (isFailure(request)) return checkedFailure(request);
  const actor = await resolveTrustedActor(
    "getTaxonomy",
    dependencies.actorResolver,
    dependencies.diagnostics,
  );
  if (isFailure(actor)) return actor;

  let outcome: ExternalOutcome<"getTaxonomy">;
  try {
    outcome = await handleGetTaxonomy(
      request,
      actor,
      dependencies.resourceMaster,
      dependencies.diagnostics,
    );
  } catch (cause) {
    return checkedFailure(
      normalizeThrownError("getTaxonomy", "invocation", cause, dependencies.diagnostics),
    );
  }
  return completeReadOutcome(
    "getTaxonomy",
    outcome,
    validateExternalGetTaxonomySuccess,
    dependencies.diagnostics,
  );
}

export async function invokeExternalGetEffectiveResourceSchema(
  rawRequest: unknown,
  dependencies: ExternalReadCompositionDependencies,
): Promise<ExternalOutcome<"getEffectiveResourceSchema">> {
  const request = validateExternalGetEffectiveResourceSchemaRequest(rawRequest);
  if (isFailure(request)) return checkedFailure(request);
  const actor = await resolveTrustedActor(
    "getEffectiveResourceSchema",
    dependencies.actorResolver,
    dependencies.diagnostics,
  );
  if (isFailure(actor)) return actor;

  let outcome: ExternalOutcome<"getEffectiveResourceSchema">;
  try {
    outcome = await handleGetEffectiveResourceSchema(
      request,
      actor,
      dependencies.resourceMaster,
      dependencies.diagnostics,
    );
  } catch (cause) {
    return checkedFailure(
      normalizeThrownError(
        "getEffectiveResourceSchema",
        "invocation",
        cause,
        dependencies.diagnostics,
      ),
    );
  }
  return completeReadOutcome(
    "getEffectiveResourceSchema",
    outcome,
    validateExternalGetEffectiveResourceSchemaSuccess,
    dependencies.diagnostics,
  );
}

export async function invokeExternalGetValidOptions(
  rawRequest: unknown,
  dependencies: ExternalReadCompositionDependencies,
): Promise<ExternalOutcome<"getValidOptions">> {
  const request = validateExternalGetValidOptionsRequest(rawRequest);
  if (isFailure(request)) return checkedFailure(request);
  const actor = await resolveTrustedActor(
    "getValidOptions",
    dependencies.actorResolver,
    dependencies.diagnostics,
  );
  if (isFailure(actor)) return actor;

  let outcome: ExternalOutcome<"getValidOptions">;
  try {
    outcome = await handleGetValidOptions(
      request,
      actor,
      dependencies.resourceMaster,
      dependencies.diagnostics,
    );
  } catch (cause) {
    return checkedFailure(
      normalizeThrownError("getValidOptions", "invocation", cause, dependencies.diagnostics),
    );
  }
  return completeReadOutcome(
    "getValidOptions",
    outcome,
    validateExternalGetValidOptionsSuccess,
    dependencies.diagnostics,
  );
}

export async function invokeExternalGetNaturalUnits(
  rawRequest: unknown,
  dependencies: ExternalReadCompositionDependencies,
): Promise<ExternalOutcome<"getNaturalUnits">> {
  const request = validateExternalGetNaturalUnitsRequest(rawRequest);
  if (isFailure(request)) return checkedFailure(request);
  const actor = await resolveTrustedActor(
    "getNaturalUnits",
    dependencies.actorResolver,
    dependencies.diagnostics,
  );
  if (isFailure(actor)) return actor;

  let outcome: ExternalOutcome<"getNaturalUnits">;
  try {
    outcome = await handleGetNaturalUnits(
      request,
      actor,
      dependencies.resourceMaster,
      dependencies.diagnostics,
    );
  } catch (cause) {
    return checkedFailure(
      normalizeThrownError("getNaturalUnits", "invocation", cause, dependencies.diagnostics),
    );
  }
  return completeReadOutcome(
    "getNaturalUnits",
    outcome,
    validateExternalGetNaturalUnitsSuccess,
    dependencies.diagnostics,
  );
}

export async function invokeExternalGetResource(
  rawRequest: unknown,
  dependencies: ExternalReadCompositionDependencies,
): Promise<ExternalOutcome<"getResource">> {
  const request = validateExternalGetResourceRequest(rawRequest);
  if (isFailure(request)) return checkedFailure(request);
  const actor = await resolveTrustedActor(
    "getResource",
    dependencies.actorResolver,
    dependencies.diagnostics,
  );
  if (isFailure(actor)) return actor;

  let outcome: ExternalOutcome<"getResource">;
  try {
    outcome = await handleGetResource(
      request,
      actor,
      dependencies.resourceMaster,
      dependencies.diagnostics,
    );
  } catch (cause) {
    return checkedFailure(
      normalizeThrownError("getResource", "invocation", cause, dependencies.diagnostics),
    );
  }
  return completeReadOutcome(
    "getResource",
    outcome,
    validateExternalGetResourceSuccess,
    dependencies.diagnostics,
  );
}

export async function invokeExternalSearchResources(
  rawRequest: unknown,
  dependencies: ExternalReadCompositionDependencies,
): Promise<ExternalOutcome<"searchResources">> {
  const request = validateExternalSearchResourcesRequest(rawRequest);
  if (isFailure(request)) return checkedFailure(request);
  const actor = await resolveTrustedActor(
    "searchResources",
    dependencies.actorResolver,
    dependencies.diagnostics,
  );
  if (isFailure(actor)) return actor;

  let outcome: ExternalOutcome<"searchResources">;
  try {
    outcome = await handleSearchResources(
      request,
      actor,
      dependencies.resourceMaster,
      dependencies.diagnostics,
    );
  } catch (cause) {
    return checkedFailure(
      normalizeThrownError("searchResources", "invocation", cause, dependencies.diagnostics),
    );
  }
  return completeReadOutcome(
    "searchResources",
    outcome,
    validateExternalSearchResourcesSuccess,
    dependencies.diagnostics,
  );
}

export async function invokeExternalDescribeResource(
  rawRequest: unknown,
  dependencies: ExternalReadCompositionDependencies,
): Promise<ExternalOutcome<"describeResource">> {
  const request = validateExternalDescribeResourceRequest(rawRequest);
  if (isFailure(request)) return checkedFailure(request);
  const actor = await resolveTrustedActor(
    "describeResource",
    dependencies.actorResolver,
    dependencies.diagnostics,
  );
  if (isFailure(actor)) return actor;

  let outcome: ExternalOutcome<"describeResource">;
  try {
    outcome = await handleDescribeResource(
      request,
      actor,
      dependencies.resourceMaster,
      dependencies.diagnostics,
    );
  } catch (cause) {
    return checkedFailure(
      normalizeThrownError("describeResource", "invocation", cause, dependencies.diagnostics),
    );
  }
  return completeReadOutcome(
    "describeResource",
    outcome,
    validateExternalDescribeResourceSuccess,
    dependencies.diagnostics,
  );
}

export async function invokeExternalCreateResource(
  rawRequest: unknown,
  dependencies: ExternalReadCompositionDependencies,
): Promise<ExternalOutcome<"createResource">> {
  const request = validateExternalCreateResourceRequest(rawRequest);
  if (isFailure(request)) return checkedFailure(request);
  const actor = await resolveTrustedActor(
    "createResource",
    dependencies.actorResolver,
    dependencies.diagnostics,
  );
  if (isFailure(actor)) return actor;
  return handleCreateResource(
    request,
    actor,
    dependencies.resourceMaster,
    dependencies.diagnostics,
  );
}

export async function invokeExternalUpdateNonIdentityData(
  rawRequest: unknown,
  dependencies: ExternalReadCompositionDependencies,
): Promise<ExternalOutcome<"updateNonIdentityData">> {
  const request = validateExternalUpdateNonIdentityDataRequest(rawRequest);
  if (isFailure(request)) return checkedFailure(request);
  const actor = await resolveTrustedActor(
    "updateNonIdentityData",
    dependencies.actorResolver,
    dependencies.diagnostics,
  );
  if (isFailure(actor)) return actor;
  return handleUpdateNonIdentityData(
    request,
    actor,
    dependencies.resourceMaster,
    dependencies.diagnostics,
  );
}

export async function invokeExternalDeactivateResource(
  rawRequest: unknown,
  dependencies: ExternalReadCompositionDependencies,
): Promise<ExternalOutcome<"deactivateResource">> {
  const request = validateExternalDeactivateResourceRequest(rawRequest);
  if (isFailure(request)) return checkedFailure(request);
  const actor = await resolveTrustedActor(
    "deactivateResource",
    dependencies.actorResolver,
    dependencies.diagnostics,
  );
  if (isFailure(actor)) return actor;
  return handleDeactivateResource(
    request,
    actor,
    dependencies.resourceMaster,
    dependencies.diagnostics,
  );
}
