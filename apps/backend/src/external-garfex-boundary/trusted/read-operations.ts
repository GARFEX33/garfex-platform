import type { ActorContext, ResourceMaster, Result } from "../../resource-master/public.js";
import type {
  ExternalDescribeResourceRequest,
  ExternalFailure,
  ExternalGetEffectiveResourceSchemaRequest,
  ExternalGetNaturalUnitsRequest,
  ExternalGetResourceRequest,
  ExternalGetValidOptionsRequest,
  ExternalOperation,
  ExternalOutcome,
  ExternalRequest,
  ExternalSearchResourcesRequest,
  ExternalSuccess,
} from "../client-facing/contract.js";
import {
  type ExternalBoundaryDiagnostics,
  normalizeResourceError,
  normalizeThrownError,
} from "./errors.js";
import {
  projectExternalDescribeResource,
  projectExternalGetEffectiveResourceSchema,
  projectExternalGetNaturalUnits,
  projectExternalGetResource,
  projectExternalGetTaxonomy,
  projectExternalGetValidOptions,
  projectExternalSearchResources,
} from "./projections.js";

type ReadResult<Operation extends ExternalOperation> = ExternalOutcome<Operation>;
type ReadRequest<Operation extends ExternalOperation> = ExternalRequest<Operation>;
type ReadSuccess<Operation extends ExternalOperation> = ExternalSuccess<Operation>;

function isFailure(value: unknown): value is ExternalFailure {
  try {
    return value !== null && typeof value === "object" && "ok" in value && value.ok === false;
  } catch {
    return false;
  }
}

function checkedFailure(value: ExternalFailure): ExternalFailure {
  return value;
}

function applicationValue<T>(result: Result<T>): T | ExternalFailure {
  try {
    if (result.ok === false) return checkedFailure(normalizeResourceError(result.error));
    if (result.ok !== true) return { ok: false, error: { code: "INTERNAL_FAILURE" } };
    return result.value;
  } catch {
    return { ok: false, error: { code: "INTERNAL_FAILURE" } };
  }
}

async function completeReadOutcome<Operation extends ExternalOperation, Input>(
  operation: Operation,
  invoke: () => Promise<Result<Input>>,
  project: (value: Input) => ReadSuccess<Operation>,
  diagnostics?: ExternalBoundaryDiagnostics,
): Promise<ReadResult<Operation>> {
  let result: Result<Input>;
  try {
    result = await invoke();
  } catch (cause) {
    return checkedFailure(normalizeThrownError(operation, "invocation", cause, diagnostics));
  }

  const value = applicationValue(result);
  if (isFailure(value)) return value;

  try {
    return { ok: true, value: project(value) };
  } catch (cause) {
    return checkedFailure(normalizeThrownError(operation, "projection", cause, diagnostics));
  }
}

export async function handleGetTaxonomy(
  _input: ReadRequest<"getTaxonomy">,
  actor: ActorContext,
  resourceMaster: ResourceMaster,
  diagnostics?: ExternalBoundaryDiagnostics,
): Promise<ReadResult<"getTaxonomy">> {
  return completeReadOutcome(
    "getTaxonomy",
    () => resourceMaster.getTaxonomy(actor),
    projectExternalGetTaxonomy,
    diagnostics,
  );
}

export async function handleGetEffectiveResourceSchema(
  input: ExternalGetEffectiveResourceSchemaRequest,
  actor: ActorContext,
  resourceMaster: ResourceMaster,
  diagnostics?: ExternalBoundaryDiagnostics,
): Promise<ReadResult<"getEffectiveResourceSchema">> {
  const moduleInput: Parameters<ResourceMaster["getEffectiveResourceSchema"]>[1] = {
    classCode: input.classCode,
    familyCode: input.familyCode,
    typeCode: input.typeCode,
  };
  return completeReadOutcome(
    "getEffectiveResourceSchema",
    () => resourceMaster.getEffectiveResourceSchema(actor, moduleInput),
    projectExternalGetEffectiveResourceSchema,
    diagnostics,
  );
}

export async function handleGetValidOptions(
  input: ExternalGetValidOptionsRequest,
  actor: ActorContext,
  resourceMaster: ResourceMaster,
  diagnostics?: ExternalBoundaryDiagnostics,
): Promise<ReadResult<"getValidOptions">> {
  const moduleInput: Parameters<ResourceMaster["getValidOptions"]>[1] = {
    attributeCode: input.attributeCode,
  };
  return completeReadOutcome(
    "getValidOptions",
    () => resourceMaster.getValidOptions(actor, moduleInput),
    projectExternalGetValidOptions,
    diagnostics,
  );
}

export async function handleGetNaturalUnits(
  input: ExternalGetNaturalUnitsRequest,
  actor: ActorContext,
  resourceMaster: ResourceMaster,
  diagnostics?: ExternalBoundaryDiagnostics,
): Promise<ReadResult<"getNaturalUnits">> {
  const moduleInput: Parameters<ResourceMaster["getNaturalUnits"]>[1] = {
    familyCode: input.familyCode,
  };
  return completeReadOutcome(
    "getNaturalUnits",
    () => resourceMaster.getNaturalUnits(actor, moduleInput),
    projectExternalGetNaturalUnits,
    diagnostics,
  );
}

export async function handleGetResource(
  input: ExternalGetResourceRequest,
  actor: ActorContext,
  resourceMaster: ResourceMaster,
  diagnostics?: ExternalBoundaryDiagnostics,
): Promise<ReadResult<"getResource">> {
  const moduleInput: Parameters<ResourceMaster["getResource"]>[1] = {
    resourceId: input.resourceId,
  };
  return completeReadOutcome(
    "getResource",
    () => resourceMaster.getResource(actor, moduleInput),
    projectExternalGetResource,
    diagnostics,
  );
}

export async function handleSearchResources(
  input: ExternalSearchResourcesRequest,
  actor: ActorContext,
  resourceMaster: ResourceMaster,
  diagnostics?: ExternalBoundaryDiagnostics,
): Promise<ReadResult<"searchResources">> {
  type SearchModuleInput = {
    -readonly [Key in keyof Parameters<ResourceMaster["searchResources"]>[1]]: Parameters<
      ResourceMaster["searchResources"]
    >[1][Key];
  };
  const moduleInput: SearchModuleInput = {
    terms: input.terms,
  };
  if (input.lifecycle !== undefined) moduleInput.lifecycle = input.lifecycle;
  if (input.limit !== undefined) moduleInput.limit = input.limit;
  if (input.cursor !== undefined) moduleInput.cursor = input.cursor;

  return completeReadOutcome(
    "searchResources",
    () => resourceMaster.searchResources(actor, moduleInput),
    projectExternalSearchResources,
    diagnostics,
  );
}

export async function handleDescribeResource(
  input: ExternalDescribeResourceRequest,
  actor: ActorContext,
  resourceMaster: ResourceMaster,
  diagnostics?: ExternalBoundaryDiagnostics,
): Promise<ReadResult<"describeResource">> {
  const moduleInput: Parameters<ResourceMaster["describeResource"]>[1] = {
    resourceId: input.resourceId,
  };
  return completeReadOutcome(
    "describeResource",
    () => resourceMaster.describeResource(actor, moduleInput),
    projectExternalDescribeResource,
    diagnostics,
  );
}
