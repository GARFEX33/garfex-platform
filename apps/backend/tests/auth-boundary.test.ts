import { describe, expect, it, vi } from "vitest";
import { createResourceMaster } from "../src/resource-master/application/resource-master.js";
import type { ResourceRepository } from "../src/resource-master/application/ports/resource-repository.js";
import type { ActorId } from "../src/resource-master/public.js";
import {
  createAuthenticationComposition,
  createConfiguredAuthenticationComposition,
} from "../src/auth/composition.js";
import { invokeAuthenticatedResourceMasterOperation } from "../src/auth/resource-master-edge.js";
import { capabilitiesForRole } from "../src/auth/roles.js";
import {
  LOCAL_DEVELOPMENT_ACTOR_ID,
  localDevelopmentCapabilities,
} from "../src/auth/local-development-identity-adapter.js";

const forbidden = {
  ok: false,
  error: { code: "FORBIDDEN", message: "operation is not permitted" },
} as const;

const unauthenticated = {
  ok: false,
  error: { code: "UNAUTHENTICATED", message: "authentication is required" },
} as const;

describe("authentication composition and edge", () => {
  it("defines the exact Viewer, Editor, and Admin composition mappings", () => {
    expect([...capabilitiesForRole("Viewer")]).toEqual(["resource:read"]);
    expect([...capabilitiesForRole("Editor")]).toEqual([
      "resource:read",
      "resource:create",
      "resource:update-non-identity",
    ]);
    expect([...capabilitiesForRole("Admin")]).toEqual([
      "resource:read",
      "resource:create",
      "resource:update-non-identity",
      "resource:deactivate",
    ]);
  });

  it("uses one stable local-development actor with four resource capabilities and no catalog admin", async () => {
    const composition = createConfiguredAuthenticationComposition({
      runtimeEnvironment: "local-development",
      authMode: "local-development",
    });
    expect(composition).not.toBeNull();
    const observed = await invokeAuthenticatedResourceMasterOperation(
      composition,
      async (context) => ({
        ok: true as const,
        value: context,
      }),
    );
    expect(observed).toMatchObject({
      ok: true,
      value: { actorId: LOCAL_DEVELOPMENT_ACTOR_ID },
    });
    expect(observed.ok && [...observed.value.capabilities]).toEqual(localDevelopmentCapabilities);
    expect(observed.ok && observed.value.capabilities.has("catalog:admin")).toBe(false);
  });

  it.each([
    [undefined, undefined],
    ["local-development", undefined],
    [undefined, "local-development"],
    ["", "local-development"],
    ["local-development", ""],
    ["development", "local-development"],
    ["local-development", "development"],
    ["production", "local-development"],
    ["local-development", "production"],
    ["preview", "local-development"],
    ["local-development", "preview"],
    ["staging", "local-development"],
    ["local-development", "staging"],
    ["unknown", "local-development"],
    ["local-development", "unknown"],
    ["LOCAL-DEVELOPMENT", "local-development"],
    ["local-development", "LOCAL-DEVELOPMENT"],
    ["production", "production"],
  ])(
    "does not activate a local actor for runtime %s and auth mode %s",
    async (runtimeEnvironment, authMode) => {
      const composition = createConfiguredAuthenticationComposition({
        runtimeEnvironment,
        authMode,
      });
      const invoke = vi.fn();
      expect(await invokeAuthenticatedResourceMasterOperation(composition, invoke)).toEqual(
        unauthenticated,
      );
      expect(invoke).not.toHaveBeenCalled();
    },
  );

  it("sanitizes missing and invalid identity before application invocation", async () => {
    const invoke = vi.fn();
    const missing = createAuthenticationComposition({ resolveActorId: async () => null }, [
      "resource:read",
    ]);
    const invalid = createAuthenticationComposition(
      {
        resolveActorId: async () => {
          throw new Error("provider token detail");
        },
      },
      ["resource:read"],
    );

    expect(await invokeAuthenticatedResourceMasterOperation(missing, invoke)).toEqual(
      unauthenticated,
    );
    expect(await invokeAuthenticatedResourceMasterOperation(invalid, invoke)).toEqual(
      unauthenticated,
    );
    expect(invoke).not.toHaveBeenCalled();
  });

  it("cannot use client identity, role, capability, claims, token, or session fields as authority", async () => {
    const forgedInput = {
      resourceId: "resource-1",
      actorId: "attacker",
      roles: ["Admin"],
      capabilities: ["resource:read"],
      claims: { sub: "provider-subject" },
      token: "secret",
      session: { identity: "attacker" },
    };
    const invoke = vi.fn(async () => ({ ok: true as const, value: forgedInput }));

    expect(await invokeAuthenticatedResourceMasterOperation(null, invoke)).toEqual(unauthenticated);
    expect(invoke).not.toHaveBeenCalled();
  });

  it("keeps an authenticated but insufficient actor FORBIDDEN", async () => {
    const composition = createAuthenticationComposition(
      { resolveActorId: async () => "garfex-actor:viewer" as ActorId },
      capabilitiesForRole("Viewer"),
    );
    const master = createResourceMaster({
      catalogReader: { loadSnapshot: vi.fn() },
      repository: {} as ResourceRepository,
    });

    expect(
      await invokeAuthenticatedResourceMasterOperation(composition, (context) =>
        master.createResource(context, {} as never),
      ),
    ).toEqual(forbidden);
  });
});
