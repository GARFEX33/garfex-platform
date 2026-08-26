import { describe, expect, it, vi } from "vitest";
import {
  normalizeResourceError,
  normalizeThrownError,
  type ExternalBoundaryDiagnostics,
} from "../src/external-garfex-boundary/trusted/errors.js";
import type { ResourceErrorCode } from "../src/resource-master/public.js";

const secret = "provider=private; stack=internal; catalog=protected";

const resourceError = (code: ResourceErrorCode, extra: Record<string, unknown> = {}) =>
  ({ code, message: secret, details: [secret], ...extra }) as never;

describe("external Resource Master error normalization", () => {
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
  ] as const)("maps %s to %s without diagnostics", (code, expected) => {
    expect(normalizeResourceError(resourceError(code))).toEqual({
      ok: false,
      error: { code: expected },
    });
  });

  it.each(["INVALID_ARGUMENT", "INVALID_REFERENCE", "VALIDATION"] as const)(
    "retains only manifest-valid fieldIssues for %s",
    (code) => {
      const fieldIssues = [{ field: "naturalUnitCode", reason: "REQUIRED" }];
      expect(normalizeResourceError(resourceError(code, { fieldIssues }))).toEqual({
        ok: false,
        error: { code: code === "VALIDATION" ? "VALIDATION_FAILED" : code, fieldIssues },
      });
      expect(
        normalizeResourceError(
          resourceError(code, { fieldIssues: [{ field: "", reason: "REQUIRED" }] }),
        ),
      ).toEqual({ ok: false, error: { code: "INTERNAL_FAILURE" } });
      expect(
        normalizeResourceError(
          resourceError(code, { fieldIssues: [{ field: "x", reason: secret }] }),
        ),
      ).toEqual({ ok: false, error: { code: "INTERNAL_FAILURE" } });
    },
  );

  it("exposes only applicable duplicate and conflict metadata", () => {
    expect(
      normalizeResourceError(resourceError("DUPLICATE", { existingResourceId: "resource-1" })),
    ).toEqual({
      ok: false,
      error: { code: "DUPLICATE", existingResourceId: "resource-1" },
    });
    expect(normalizeResourceError(resourceError("CONFLICT", { currentRevision: 4 }))).toEqual({
      ok: false,
      error: { code: "CONFLICT", currentRevision: 4 },
    });
    for (const [code, metadata] of [
      ["DUPLICATE", { existingResourceId: "" }],
      ["DUPLICATE", { existingResourceId: 12 }],
      ["CONFLICT", { currentRevision: -1 }],
      ["CONFLICT", { currentRevision: 1.5 }],
      ["CONFLICT", { currentRevision: "4" }],
    ] as const) {
      expect(normalizeResourceError(resourceError(code, metadata))).toEqual({
        ok: false,
        error: { code: "INTERNAL_FAILURE" },
      });
    }
    expect(
      normalizeResourceError(
        resourceError("FORBIDDEN", {
          fieldIssues: [],
          existingResourceId: "x",
          currentRevision: 4,
        }),
      ),
    ).toEqual({ ok: false, error: { code: "FORBIDDEN" } });
  });

  it("coarsens malformed, unknown, thrown, and hostile failures", () => {
    const throwing = new Proxy(
      { code: "FORBIDDEN" },
      {
        get: () => {
          throw new Error(secret);
        },
      },
    );
    const symbolic = { code: "FORBIDDEN", [Symbol("diagnostic")]: secret };
    for (const value of [
      null,
      undefined,
      { code: "UNKNOWN", message: secret },
      { code: "INVALID_ARGUMENT", fieldIssues: "not-an-array" },
      {
        code: "INVALID_ARGUMENT",
        fieldIssues: new Proxy([], {
          ownKeys: () => {
            throw new Error(secret);
          },
        }),
      },
      throwing,
    ]) {
      expect(normalizeResourceError(value)).toEqual({
        ok: false,
        error: { code: "INTERNAL_FAILURE" },
      });
    }
    expect(normalizeResourceError(symbolic)).toEqual({ ok: false, error: { code: "FORBIDDEN" } });
    expect(JSON.stringify(normalizeResourceError(symbolic))).not.toContain(secret);
    expect(JSON.stringify(normalizeResourceError(resourceError("INTERNAL")))).not.toContain(secret);
  });

  it("keeps external membership exactly equal to the generated eleven-code contract", () => {
    const outputs = [
      normalizeResourceError(resourceError("UNAUTHENTICATED")),
      normalizeResourceError(resourceError("FORBIDDEN")),
      normalizeResourceError(resourceError("INVALID_ARGUMENT")),
      normalizeResourceError(resourceError("INVALID_REFERENCE")),
      normalizeResourceError(resourceError("VALIDATION")),
      normalizeResourceError(resourceError("NOT_FOUND")),
      normalizeResourceError(resourceError("DUPLICATE")),
      normalizeResourceError(resourceError("CONFLICT")),
      normalizeResourceError(resourceError("INVALID_LIFECYCLE")),
      normalizeResourceError(resourceError("RESOURCE_CATALOG_UNAVAILABLE")),
      normalizeResourceError(resourceError("INTERNAL")),
    ];
    expect(new Set(outputs.map(({ error }) => error.code))).toEqual(
      new Set([
        "UNAUTHENTICATED",
        "FORBIDDEN",
        "INVALID_ARGUMENT",
        "INVALID_REFERENCE",
        "VALIDATION_FAILED",
        "NOT_FOUND",
        "DUPLICATE",
        "CONFLICT",
        "INVALID_LIFECYCLE",
        "CATALOG_UNAVAILABLE",
        "INTERNAL_FAILURE",
      ]),
    );
  });

  it("contains every operation and failure phase without releasing success", () => {
    const operations = [
      "getTaxonomy",
      "getEffectiveResourceSchema",
      "getValidOptions",
      "getNaturalUnits",
      "getResource",
      "searchResources",
      "describeResource",
      "createResource",
      "updateNonIdentityData",
      "deactivateResource",
    ] as const;
    const phases = ["authentication", "invocation", "projection", "response-validation"] as const;
    for (const operation of operations) {
      for (const phase of phases) {
        expect(normalizeThrownError(operation, phase, new Error(secret))).toEqual({
          ok: false,
          error: { code: phase === "authentication" ? "UNAUTHENTICATED" : "INTERNAL_FAILURE" },
        });
      }
    }
  });

  it("preserves safe outcomes when the server-only diagnostics sink throws", () => {
    const diagnostics: ExternalBoundaryDiagnostics = {
      record: vi.fn(() => {
        throw new Error(secret);
      }),
    };
    expect(normalizeThrownError("getResource", "authentication", secret, diagnostics)).toEqual({
      ok: false,
      error: { code: "UNAUTHENTICATED" },
    });
    expect(normalizeThrownError("getResource", "projection", secret, diagnostics)).toEqual({
      ok: false,
      error: { code: "INTERNAL_FAILURE" },
    });
  });
});
