import { describe, expect, it, vi } from "vitest";
import { createResourceMaster } from "../src/resource-master/application/resource-master.js";
import type { ResourceRepository } from "../src/resource-master/application/ports/resource-repository.js";
import * as mutations from "../src/external-garfex-boundary/trusted/mutation-operations.js";
import {
  createAuthenticationComposition,
  type AuthenticationComposition,
} from "../src/auth/composition.js";
import {
  normalizeResourceError,
  normalizeThrownError,
  type ExternalBoundaryDiagnostics,
} from "../src/external-garfex-boundary/trusted/errors.js";
import {
  createTrustedActorResolver,
  type TrustedActorResolver,
} from "../src/external-garfex-boundary/trusted/identity.js";
import type {
  ActorContext,
  ActorId,
  Capability,
  ResourceError,
  ResourceErrorCode,
  ResourceMaster,
} from "../src/resource-master/public.js";

type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends <Value>() => Value extends Right ? 1 : 2
    ? true
    : false;
type Assert<T extends true> = T;
type _ResolverTakesNoBusinessInput = Assert<
  Equal<Parameters<TrustedActorResolver["resolveActor"]>, []>
>;

const resolverTypeAssertions: [_ResolverTakesNoBusinessInput] = [true];
void resolverTypeAssertions;

const trustedActorId = "server-controlled-actor" as ActorId;

const compositionFor = (
  resolveActorId: () => Promise<ActorId | null>,
  capabilities: Iterable<Capability> = ["resource:read"],
): AuthenticationComposition => createAuthenticationComposition({ resolveActorId }, capabilities);

describe("trusted external GARFEX actor resolution", () => {
  it("returns null when authentication composition is absent", async () => {
    const resolver = createTrustedActorResolver(null);

    await expect(resolver.resolveActor()).resolves.toBeNull();
  });

  it("returns null when the trusted identity adapter has no identity", async () => {
    const resolveActorId = vi.fn(async (): Promise<ActorId | null> => null);
    const resolver = createTrustedActorResolver(compositionFor(resolveActorId));

    await expect(resolver.resolveActor()).resolves.toBeNull();
    expect(resolveActorId).toHaveBeenCalledOnce();
  });

  it("returns null when the identity provider throws", async () => {
    const resolveActorId = vi.fn(async (): Promise<ActorId | null> => {
      throw new Error("provider token and configuration secret");
    });
    const resolver = createTrustedActorResolver(compositionFor(resolveActorId));

    await expect(resolver.resolveActor()).resolves.toBeNull();
    expect(resolveActorId).toHaveBeenCalledOnce();
  });

  it("creates fresh actors and copies only configured server capabilities", async () => {
    const composition = compositionFor(async () => trustedActorId, ["resource:read"]);
    const resolver = createTrustedActorResolver(composition);

    const first = await resolver.resolveActor();
    expect(first).toEqual({ actorId: trustedActorId, capabilities: new Set(["resource:read"]) });
    expect(first?.capabilities).not.toBe(composition.capabilities);

    (composition.capabilities as Set<Capability>).add("catalog:admin");
    expect(first?.capabilities.has("catalog:admin")).toBe(false);

    const second = await resolver.resolveActor();
    expect(second).not.toBe(first);
    expect(second?.capabilities).not.toBe(first?.capabilities);
    expect([...(second?.capabilities ?? [])]).toEqual(["resource:read", "catalog:admin"]);
  });

  it("does not accept authority or operation fields from a raw business request", async () => {
    const resolver = createTrustedActorResolver(
      compositionFor(async () => trustedActorId, ["resource:read"]),
    );
    const forgedBusinessRequest = {
      actorId: "attacker",
      capabilities: ["catalog:admin"],
      operation: "deactivateResource",
      resourceId: "resource-1",
    };

    expect(resolver.resolveActor.length).toBe(0);
    const actor = await Reflect.apply(resolver.resolveActor, resolver, [forgedBusinessRequest]);

    expect(actor).toEqual({ actorId: trustedActorId, capabilities: new Set(["resource:read"]) });
    expect(actor).not.toHaveProperty("resourceId");
  });
});

const secret = "provider-token=secret; persistence=/private/catalog; stack=hidden";

const resourceErrorFor = (
  code: ResourceErrorCode,
  fields: Record<string, unknown> = {},
): ResourceError =>
  ({
    code,
    message: secret,
    details: [secret],
    ...fields,
  }) as ResourceError;

describe("trusted external GARFEX error normalization", () => {
  it.each([
    ["UNAUTHENTICATED", "UNAUTHENTICATED"],
    ["FORBIDDEN", "FORBIDDEN"],
    ["INVALID_ARGUMENT", "INVALID_ARGUMENT"],
    ["INVALID_REFERENCE", "INVALID_REFERENCE"],
    ["VALIDATION", "VALIDATION_FAILED"],
    ["NOT_FOUND", "NOT_FOUND"],
    ["DUPLICATE", "DUPLICATE"],
    ["CONFLICT", "CONFLICT"],
    ["INVALID_LIFECYCLE", "INVALID_LIFECYCLE"],
    ["RESOURCE_CATALOG_UNAVAILABLE", "CATALOG_UNAVAILABLE"],
    ["RESOURCE_CATALOG_UNINITIALIZED", "CATALOG_UNAVAILABLE"],
    ["INTEGRITY", "INTERNAL_FAILURE"],
    ["INTERNAL", "INTERNAL_FAILURE"],
    ["RESOURCE_CATALOG_INVALID", "INTERNAL_FAILURE"],
  ] as const)("maps %s to the closed external code %s", (internalCode, externalCode) => {
    const outcome = normalizeResourceError(resourceErrorFor(internalCode));
    expect(outcome).toEqual({ ok: false, error: { code: externalCode } });
    expect(JSON.stringify(outcome)).not.toContain(secret);
  });

  it("carries only validated duplicate identifiers and conflict revisions", () => {
    expect(
      normalizeResourceError(resourceErrorFor("DUPLICATE", { existingResourceId: "resource-42" })),
    ).toEqual({
      ok: false,
      error: { code: "DUPLICATE", existingResourceId: "resource-42" },
    });
    expect(normalizeResourceError(resourceErrorFor("CONFLICT", { currentRevision: 7 }))).toEqual({
      ok: false,
      error: { code: "CONFLICT", currentRevision: 7 },
    });

    for (const existingResourceId of ["", "resource\n42", 42, null, undefined]) {
      expect(normalizeResourceError(resourceErrorFor("DUPLICATE", { existingResourceId }))).toEqual(
        { ok: false, error: { code: "INTERNAL_FAILURE" } },
      );
    }
    for (const currentRevision of [
      -1,
      1.5,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      "7",
      null,
      undefined,
    ]) {
      expect(normalizeResourceError(resourceErrorFor("CONFLICT", { currentRevision }))).toEqual({
        ok: false,
        error: { code: "INTERNAL_FAILURE" },
      });
    }
  });

  it("fails closed for unknown, malformed, and throwing runtime errors", () => {
    const malformed = new Proxy(
      { code: "FORBIDDEN" },
      {
        get: () => {
          throw new Error(secret);
        },
      },
    );
    for (const value of [
      null,
      undefined,
      "not-a-resource-error",
      { code: "UNKNOWN_RUNTIME_CODE", message: secret },
      { message: secret },
      malformed,
    ]) {
      const outcome = normalizeResourceError(value);
      expect(outcome).toEqual({ ok: false, error: { code: "INTERNAL_FAILURE" } });
      expect(JSON.stringify(outcome)).not.toContain(secret);
    }
  });

  it("ignores throwing internal diagnostic fields and drops unapproved metadata", () => {
    const error = {
      code: "FORBIDDEN",
      get message(): string {
        throw new Error(secret);
      },
      get details(): string[] {
        throw new Error(secret);
      },
      get stack(): string {
        throw new Error(secret);
      },
      actorId: "attacker",
      capability: "resource:read",
    };

    expect(normalizeResourceError(error)).toEqual({ ok: false, error: { code: "FORBIDDEN" } });
    expect(
      normalizeResourceError(
        resourceErrorFor("DUPLICATE", {
          existingResourceId: "resource-42",
          currentRevision: 99,
          stack: secret,
        }),
      ),
    ).toEqual({
      ok: false,
      error: { code: "DUPLICATE", existingResourceId: "resource-42" },
    });
  });

  it("contains projection failures as metadata-free internal failures without a sink", () => {
    const outcome = normalizeThrownError("getResource", "projection", {
      message: secret,
      stack: secret,
      details: [secret],
    });

    expect(outcome).toEqual({ ok: false, error: { code: "INTERNAL_FAILURE" } });
    expect(JSON.stringify(outcome)).not.toContain(secret);
  });

  it("sanitizes thrown authentication and application errors while recording server diagnostics", () => {
    const diagnostics: ExternalBoundaryDiagnostics = { record: vi.fn() };
    const cause = new Error(secret);
    cause.stack = `${secret}\ninternal stack`;

    const authentication = normalizeThrownError(
      "getResource",
      "authentication",
      cause,
      diagnostics,
    );
    expect(authentication).toEqual({ ok: false, error: { code: "UNAUTHENTICATED" } });

    const application = normalizeThrownError("getResource", "invocation", cause, diagnostics);
    expect(application).toEqual({ ok: false, error: { code: "INTERNAL_FAILURE" } });
    expect(diagnostics.record).toHaveBeenCalledTimes(2);
    expect(JSON.stringify(authentication)).not.toContain(secret);
    expect(JSON.stringify(application)).not.toContain(secret);
  });

  it("does not let a throwing diagnostics sink change or leak the safe outcome", () => {
    const diagnostics: ExternalBoundaryDiagnostics = {
      record: () => {
        throw new Error("diagnostics sink secret");
      },
    };

    const outcome = normalizeThrownError(
      "getResource",
      "response-validation",
      new Error(secret),
      diagnostics,
    );

    expect(outcome).toEqual({ ok: false, error: { code: "INTERNAL_FAILURE" } });
    expect(JSON.stringify(outcome)).not.toContain("diagnostics sink secret");
    expect(JSON.stringify(outcome)).not.toContain(secret);
  });
});

type MutationDependencies = {
  readonly actorResolver: { resolveActor(): Promise<ActorContext | null> };
  readonly resourceMaster: ResourceMaster;
};
type MutationSecurityCase = readonly [
  string,
  (request: unknown, dependencies: MutationDependencies) => Promise<unknown>,
  Record<string, unknown>,
  Capability,
];

const mutationSecurityCases: readonly MutationSecurityCase[] = [
  [
    "createResource",
    mutations.invokeExternalCreateResource,
    {
      classCode: "hardware",
      familyCode: "wire",
      typeCode: "solid-wire",
      naturalUnitCode: "meter",
      attributes: {},
    },
    "resource:update-non-identity",
  ],
  [
    "updateNonIdentityData",
    mutations.invokeExternalUpdateNonIdentityData,
    { resourceId: "resource-1", expectedRevision: 3, naturalUnitCode: "meter" },
    "resource:create",
  ],
  [
    "deactivateResource",
    mutations.invokeExternalDeactivateResource,
    { resourceId: "resource-1", expectedRevision: 3 },
    "resource:update-non-identity",
  ],
];

describe("external GARFEX mutation security", () => {
  it.each(mutationSecurityCases)(
    "rejects forged authority and preserves final deny-by-default authorization for %s",
    async (_name, invoke, request, neighboringCapability) => {
      const forgedResolveActor = vi.fn(async () => null);
      const forgedMethods = {
        createResource: vi.fn(),
        updateNonIdentityData: vi.fn(),
        deactivateResource: vi.fn(),
      } as unknown as ResourceMaster;
      const forged = await invoke(
        { ...request, actorId: "attacker", capabilities: ["resource:create"] },
        { actorResolver: { resolveActor: forgedResolveActor }, resourceMaster: forgedMethods },
      );
      expect(forged).toEqual({
        ok: false,
        error: {
          code: "INVALID_ARGUMENT",
          fieldIssues: [{ path: "actorId", reason: "UNKNOWN_FIELD" }],
        },
      });
      expect(forgedResolveActor).not.toHaveBeenCalled();
      for (const method of Object.values(forgedMethods)) expect(method).not.toHaveBeenCalled();

      const loadSnapshot = vi.fn();
      const createIfIdentityAbsent = vi.fn();
      const updateNaturalUnit = vi.fn();
      const deactivate = vi.fn();
      const resourceMaster = createResourceMaster({
        catalogReader: { loadSnapshot },
        repository: {
          createIfIdentityAbsent,
          updateNaturalUnit,
          deactivate,
        } as unknown as ResourceRepository,
      });
      const resolveActor = vi.fn(async () => ({
        actorId: "server-authorized-identity" as ActorId,
        capabilities: new Set<Capability>([neighboringCapability]),
      }));
      const denied = await invoke(request, {
        actorResolver: { resolveActor },
        resourceMaster,
      });

      expect(denied).toEqual({ ok: false, error: { code: "FORBIDDEN" } });
      expect(resolveActor).toHaveBeenCalledOnce();
      expect(loadSnapshot).not.toHaveBeenCalled();
      expect(createIfIdentityAbsent).not.toHaveBeenCalled();
      expect(updateNaturalUnit).not.toHaveBeenCalled();
      expect(deactivate).not.toHaveBeenCalled();
    },
  );
});
