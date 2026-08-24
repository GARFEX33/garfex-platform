import type { ActorContext, Capability, Result } from "../public.js";

export const resourceMasterOperationCapabilities = {
  getTaxonomy: "resource:read",
  getEffectiveResourceSchema: "resource:read",
  getValidOptions: "resource:read",
  getNaturalUnits: "resource:read",
  getResource: "resource:read",
  searchResources: "resource:read",
  describeResource: "resource:read",
  createResource: "resource:create",
  updateNonIdentityData: "resource:update-non-identity",
  deactivateResource: "resource:deactivate",
} as const satisfies Readonly<Record<string, Capability>>;

export type ResourceMasterOperation = keyof typeof resourceMasterOperationCapabilities;

export const requiredCapabilityForResourceMasterOperation = (
  operation: string,
): Capability | null =>
  Object.hasOwn(resourceMasterOperationCapabilities, operation)
    ? resourceMasterOperationCapabilities[operation as ResourceMasterOperation]
    : null;

export const authorizeResourceMasterOperation = (
  operation: string,
  actor: ActorContext,
): Result<void> => {
  const capability = requiredCapabilityForResourceMasterOperation(operation);
  return capability !== null && actor.capabilities.has(capability)
    ? { ok: true, value: undefined }
    : {
        ok: false,
        error: { code: "FORBIDDEN", message: "operation is not permitted" },
      };
};
