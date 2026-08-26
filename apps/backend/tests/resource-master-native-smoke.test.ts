import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  classifySmokeTarget,
  createSmokeCreateArgs,
  observeJdS002ReturnedOutcome,
  smokeEvidenceTemplate,
  smokeIdentityForRunId,
  smokeRunId,
} from "./smoke/resource-master-native-client.js";
import {
  validateExternalCreateResourceRequest,
  validateExternalUpdateNonIdentityDataRequest,
} from "../src/external-garfex-boundary/client-facing/validation.js";
import { jdS002Cases, jdS002CaseIds } from "./smoke/jd-s-002-cases.js";

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const smokeEnvironment: NodeJS.ProcessEnv = {
  ...process.env,
  GARFEX_CONVEX_TARGET_KIND: "local-anonymous",
  CONVEX_URL: "http://127.0.0.1:3210",
  GARFEX_RUNTIME_ENV: "local-development",
  GARFEX_AUTH_MODE: "local-development",
};

const runDisabledSmoke = (environment: NodeJS.ProcessEnv) => {
  delete environment.GARFEX_NATIVE_SMOKE_ENABLE;
  const result = spawnSync("corepack", ["pnpm", "smoke:native"], {
    cwd: backendRoot,
    env: environment,
    encoding: "utf8",
  });
  return { result, output: `${result.stdout}\n${result.stderr}` };
};

describe("Resource Master generated-client smoke guard", () => {
  it("reproduces the direct Node ESM resolution failure before any client call", () => {
    const result = spawnSync(
      process.execPath,
      ["--experimental-strip-types", "tests/smoke/resource-master-native-client.ts"],
      { cwd: backendRoot, env: smokeEnvironment, encoding: "utf8" },
    );
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain("ERR_MODULE_NOT_FOUND");
    expect(output).toContain("jd-s-002-cases.js");
  });

  it("keeps the package smoke entrypoint inert until explicitly enabled", () => {
    const { result, output } = runDisabledSmoke({ ...smokeEnvironment });

    expect(result.status).toBe(0);
    expect(output).toContain("resource-master-native-client.entry.test.ts");
    expect(output).not.toContain("ERR_MODULE_NOT_FOUND");
  });

  it("also stays inert for an explicitly classified dev target without enablement", () => {
    const { result, output } = runDisabledSmoke({
      ...smokeEnvironment,
      GARFEX_CONVEX_TARGET_KIND: "dev",
      CONVEX_URL: "https://trusted-dev-123.convex.cloud",
      CONVEX_DEPLOYMENT: "trusted-dev-123",
    });

    expect(result.status).toBe(0);
    expect(output).toContain("resource-master-native-client.entry.test.ts");
    expect(output).not.toContain("ERR_MODULE_NOT_FOUND");
  });

  it("accepts only explicitly classified non-production targets", () => {
    expect(
      classifySmokeTarget(
        {
          GARFEX_CONVEX_TARGET_KIND: "dev",
          CONVEX_URL: "https://trusted-dev-123.convex.cloud",
          CONVEX_DEPLOYMENT: "trusted-dev-123",
        },
        { convexConfig: "functions: convex", localEnv: "CONVEX_URL=dev" },
      ),
    ).toEqual({
      kind: "dev",
      url: "https://trusted-dev-123.convex.cloud",
      redactedIdentifier: "https://trusted-dev-123.convex.cloud",
    });
  });

  it.each([
    [{}, "GARFEX_CONVEX_TARGET_KIND"],
    [{ GARFEX_CONVEX_TARGET_KIND: "dev" }, "CONVEX_URL"],
    [
      {
        GARFEX_CONVEX_TARGET_KIND: "local-anonymous",
        CONVEX_URL: "https://trusted-dev-123.convex.cloud",
      },
      "local-anonymous",
    ],
    [
      {
        GARFEX_CONVEX_TARGET_KIND: "dev",
        CONVEX_URL: "https://prod-123.convex.cloud",
        CONVEX_DEPLOYMENT: "prod-123",
      },
      "productive",
    ],
  ] as const)("refuses unsafe target configuration %#", (env, message) => {
    expect(() => classifySmokeTarget(env)).toThrow(message);
  });

  it("builds distinct valid canonical create payloads for distinct run identifiers", () => {
    const first = createSmokeCreateArgs(smokeIdentityForRunId(10001));
    const second = createSmokeCreateArgs(smokeIdentityForRunId(10002));

    expect(first).not.toEqual(second);
    expect(first.attributes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ attributeCode: "gauge", value: "10001", displayValue: "10001" }),
      ]),
    );
    expect(second.attributes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ attributeCode: "gauge", value: "10002", displayValue: "10002" }),
      ]),
    );
    expect(validateExternalCreateResourceRequest(first)).toEqual(first);
    expect(validateExternalCreateResourceRequest(second)).toEqual(second);
  });

  it("records the validated smoke identity in redacted evidence", () => {
    expect(
      smokeEvidenceTemplate(
        {
          kind: "local-anonymous",
          url: "http://127.0.0.1:3210",
          redactedIdentifier: "http://127.0.0.1",
        },
        smokeIdentityForRunId(10001),
      ),
    ).toMatchObject({ smokeIdentity: { runId: 10001, gauge: "10001" } });
  });

  it("rejects an invalid caller-supplied smoke run identifier", () => {
    expect(() => smokeRunId({ GARFEX_NATIVE_SMOKE_RUN_ID: "12.5" })).toThrow(
      "GARFEX_NATIVE_SMOKE_RUN_ID must be a positive signed int32",
    );
  });

  it("observes accepted returned errors without relabeling them as canonical-invalid", () => {
    const testCase = jdS002Cases.find(({ id }) => id === "negative-signed-revision");
    expect(testCase?.expectedErrorCode).toBe("INVALID_ARGUMENT");
    expect(
      observeJdS002ReturnedOutcome(testCase!, {
        ok: false,
        error: { code: "INVALID_ARGUMENT" },
      }),
    ).toBe("accepted");
  });

  it("keeps canonical-invalid tied to cases expected to fail runtime validation", () => {
    const testCase = jdS002Cases.find(({ id }) => id === "empty-resource-id");
    expect(
      observeJdS002ReturnedOutcome(testCase!, {
        ok: false,
        error: { code: "INVALID_ARGUMENT" },
      }),
    ).toBe("canonical-invalid");
  });

  it("does not treat a returned outcome as transport rejection", () => {
    const testCase = jdS002Cases.find(({ id }) => id === "missing-resource-id");
    expect(() =>
      observeJdS002ReturnedOutcome(testCase!, {
        ok: false,
        error: { code: "INVALID_ARGUMENT" },
      }),
    ).toThrow("expected transport-rejection");
  });

  it("proves signed negative revisions are admitted by runtime validation", () => {
    const testCase = jdS002Cases.find(({ id }) => id === "negative-signed-revision");
    expect(validateExternalUpdateNonIdentityDataRequest(testCase!.args)).toEqual(testCase!.args);
  });

  it("requires every closed JD-S-002 design row in the shared table", () => {
    const requiredCaseIds = [
      "missing-nested-field",
      "unknown-nested-field",
      "wrong-object-shape",
      "wrong-array-shape",
      "wrong-null-shape",
      "invalid-lifecycle-literal",
      "unsupported-int64",
      "unsupported-bytes",
      "nonserializable-function",
      "nonserializable-symbol",
      "nonserializable-cycle",
      "nonserializable-undefined",
      "nonserializable-class",
      "empty-resource-id",
      "control-constrained-string",
      "fractional-number",
      "non-finite-number",
      "unsafe-number",
      "out-of-int32-number",
      "search-limit-one",
      "search-limit-fifty",
      "negative-signed-revision",
      "repeated-attribute-code",
      "empty-attribute-array",
      "forged-top-level-authority",
      "forged-nested-authority",
      "ordinary-authority-like-text",
    ];
    expect(jdS002CaseIds).toEqual(expect.arrayContaining(requiredCaseIds));
    expect(jdS002Cases.length).toBeGreaterThanOrEqual(requiredCaseIds.length);
  });

  it("keeps one deterministic JD-S-002 table for the smoke boundary", () => {
    expect(new Set(jdS002CaseIds).size).toBe(jdS002Cases.length);
    expect(jdS002Cases).toHaveLength(34);
    expect(jdS002Cases.filter(({ category }) => category === "transport-rejection")).toHaveLength(
      19,
    );
    expect(jdS002Cases.filter(({ category }) => category === "canonical-invalid")).toHaveLength(10);
    expect(jdS002Cases.filter(({ category }) => category === "accepted")).toHaveLength(5);
  });
});
