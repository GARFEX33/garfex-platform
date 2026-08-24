import { describe, expect, it } from "vitest";
import {
  authorizeResourceMasterOperation,
  requiredCapabilityForResourceMasterOperation,
  resourceMasterOperationCapabilities,
} from "../src/resource-master/application/authorization.js";
import type { ActorContext, ActorId, Capability } from "../src/resource-master/public.js";

const actor = (...capabilities: Capability[]): ActorContext => ({
  actorId: "garfex-actor:test" as ActorId,
  capabilities: new Set(capabilities),
});

const forbidden = {
  ok: false,
  error: { code: "FORBIDDEN", message: "operation is not permitted" },
} as const;

describe("Resource Master capability authorization", () => {
  it("maps all ten managed operations exactly and fails closed for unknown operations", () => {
    expect(resourceMasterOperationCapabilities).toEqual({
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
    });
    expect(requiredCapabilityForResourceMasterOperation("unknown-operation")).toBeNull();
    expect(authorizeResourceMasterOperation("unknown-operation", actor("resource:read"))).toEqual(
      forbidden,
    );
  });

  it.each([
    ["resource:read", "getTaxonomy"],
    ["resource:create", "createResource"],
    ["resource:update-non-identity", "updateNonIdentityData"],
    ["resource:deactivate", "deactivateResource"],
  ] as const)("isolates %s to its mapped operation family", (capability, allowedOperation) => {
    const minimallyAuthorized = actor(capability);
    for (const operation of Object.keys(resourceMasterOperationCapabilities)) {
      const result = authorizeResourceMasterOperation(operation, minimallyAuthorized);
      expect(result.ok, operation).toBe(
        operation === allowedOperation ||
          (capability === "resource:read" &&
            resourceMasterOperationCapabilities[
              operation as keyof typeof resourceMasterOperationCapabilities
            ] === "resource:read"),
      );
    }
  });

  it("keeps reserved catalog admin behaviorless", () => {
    for (const operation of Object.keys(resourceMasterOperationCapabilities)) {
      expect(
        authorizeResourceMasterOperation(operation, actor("catalog:admin")),
        operation,
      ).toEqual(forbidden);
    }
  });
});
