import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const checker = resolve(root, "tooling/architecture/check.mjs");

const check = (fixture: "valid" | "violations") =>
  spawnSync(process.execPath, [checker, `tooling/architecture-fixtures/${fixture}`], {
    cwd: root,
    encoding: "utf8",
  });

const checkTarget = (target: string) =>
  spawnSync(process.execPath, [checker, target], {
    cwd: root,
    encoding: "utf8",
  });

const externalBoundaryRules = [
  "external-contract-independent",
  "external-contract-no-authority",
  "external-contract-no-platform",
  "external-trusted-edge-public-only",
  "external-no-generic-business-executor",
  "external-no-automatic-derivation",
  "external-no-transport",
  "external-no-automatic-publication",
  "external-contract-stale-metadata",
  "external-contract-final-authorization",
  "external-contract-exact-ten",
] as const;

const nativeEntrypointSource = () =>
  readFileSync(resolve(root, "apps/backend/convex/resourceMaster.ts"), "utf8");

const nativeOperations = [
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

const focusedExternalBoundaryFixtures = [
  ["internal-import.ts", "external-contract-independent", "client-facing"],
  ["authority-field.ts", "external-contract-no-authority", "client-facing"],
  ["platform-leak.ts", "external-contract-no-platform", "client-facing"],
  ["trusted-internal-import.ts", "external-trusted-edge-public-only", "trusted"],
  ["generic-executor.ts", "external-no-generic-business-executor", "trusted"],
  ["automatic-derivation.ts", "external-no-automatic-derivation", "client-facing"],
  ["transport-import.ts", "external-no-transport", "trusted"],
  ["automatic-publication.ts", "external-no-automatic-publication", "trusted"],
  ["stale-metadata.json", "external-contract-stale-metadata", "artifacts"],
  ["missing-final-authorization.ts", "external-contract-final-authorization", "trusted"],
  ["wrong-operation-count.tsp", "external-contract-exact-ten", "contracts"],
] as const;

const outputOf = (result: ReturnType<typeof spawnSync>) =>
  `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

describe("architecture fitness functions", () => {
  it("accepts the public contract path", () => {
    const result = check("valid");

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("architecture check passed");
  });

  it("keeps exactly one named ten-operation native family", () => {
    const source = nativeEntrypointSource();
    const exports = [...source.matchAll(/export const (\w+) = (query|mutation)\(/g)].map(
      ([, name, kind]) => [name, kind],
    );
    expect(exports).toEqual([
      ...nativeOperations.slice(0, 7).map((name) => [name, "query"]),
      ...nativeOperations.slice(7).map((name) => [name, "mutation"]),
    ]);
    for (const operation of nativeOperations) {
      const compositionName = `${operation.charAt(0).toUpperCase()}${operation.slice(1)}`;
      expect(source).toContain(`invokeExternal${compositionName}`);
      expect(source.match(new RegExp(`export const ${operation}\\s*=`, "g"))).toHaveLength(1);
    }
    expect(source).not.toMatch(/execute|dispatch|operationRegistry|operationMap|universalPayload/);
    expect(
      readFileSync(
        resolve(root, "apps/backend/src/external-garfex-boundary/trusted/mutation-operations.ts"),
        "utf8",
      ),
    ).not.toMatch(/invokeExternal(?:Create|Update|Deactivate)Resource/);
  });

  it("reports every controlled boundary violation by rule name", () => {
    const result = check("violations");
    const output = outputOf(result);

    expect(result.status).toBe(1);
    expect(output).toContain("pure-domain");
    expect(output).toContain("cross-module-public-only");
    expect(output).toContain("application-no-infrastructure");
    expect(output).toContain("public-surface-contracts-only");
    expect(output).toContain("temporal-application-contracts-only");
    expect(output).toContain("agent-core-independent");
    expect(output).toContain("agent-no-persistence");
    expect(output).toContain("resource-core-no-platform");
    expect(output).toContain("resource-domain-no-auth");
    expect(output).toContain("resource-core-no-provider-types");
    expect(output).toContain("resource-auth-composition-only");
    expect(output).toContain("local-development-auth-isolated");
    expect(output).toContain("resource-pure-domain");
    expect(output).toContain("resource-application-no-adapter");
    expect(output).toContain("resource-public-contract-only");
    expect(output).toContain("convex-entrypoint-no-core-internals");
    expect(output).toContain("resource-consumers-public-only");
    expect(output).toContain("resource-runtime-no-fixture");
    expect(output).toContain("resource-runtime-no-deployment");
    expect(output).toContain("resource-public-no-catalog-installer");
    expect(output).toContain("convex-no-public-bootstrap");
    expect(output).toContain("convex-resource-catalog-errors");
    expect(output).toContain("no-circular");
    expect(output).toContain("no-unresolved");
    expect(output).toContain("external-client-no-counterpart-source-reference");
    expect(output).toContain("external-client-no-counterpart-dependency");
    expect(output).toContain("external-client-no-counterpart-package-config");
    expect(output).toContain("external-client-no-counterpart-config-reference");
    expect(output).toContain("external-client-no-counterpart-workspace-link");
    expect(output).toContain("external-client-no-counterpart-lockfile");
    expect(output).toContain("external-client-no-counterpart-gitmodule");
    expect(output).toContain("client-facing-no-backend-internals");
    expect(output).toContain(
      "client-facing-no-backend-internals: tooling/architecture-fixtures/violations/external-client-boundary/client-facing/side-effect-backend-public.ts -> ../../../../apps/backend/src/resource-master/public.js",
    );
    expect(output).toContain(
      "client-facing-no-backend-internals: tooling/architecture-fixtures/violations/external-client-boundary/client-facing/side-effect-backend-convex.ts -> ../../../../apps/backend/convex/_generated/api.js",
    );
    expect(output).toContain("client-facing-no-trusted-auth-internals");
    expect(output).toContain("resource-master/public.js");
    expect(output).toContain("modules/inventory/public.js");
    expect(output).toContain("external-client-boundary/surface.config.json");
    expect(output).toContain("external-client-boundary/pnpm-lock.yaml");
    expect(output).toContain("external-client-boundary/package-lock.json");
    expect(output).toContain("external-client-boundary/yarn.lock");
  });

  it("inspects the complete TypeSpec-to-documentation contract fixture", () => {
    const result = checkTarget("tooling/architecture-fixtures/valid/external-garfex-boundary");
    const output = outputOf(result);

    expect(result.status, output).toBe(0);
    expect(output).toContain("architecture check passed");
  });

  it("accepts independent contract and trusted public-edge fixtures", () => {
    const result = checkTarget("tooling/architecture-fixtures/valid/external-garfex-boundary");
    const output = outputOf(result);

    expect(result.status, output).toBe(0);
    expect(output).toContain("architecture check passed");
    for (const rule of externalBoundaryRules) {
      expect(output).not.toContain(`error ${rule}:`);
    }
  });

  it("reports each focused external-boundary violation by its named rule", () => {
    for (const [file, expectedRule, layer] of focusedExternalBoundaryFixtures) {
      const result = checkTarget(
        `tooling/architecture-fixtures/violations/external-garfex-boundary/${layer}/${file}`,
      );
      const output = outputOf(result);
      const reportedRules = [
        ...new Set([...output.matchAll(/^error ([^:]+):/gm)].map((match) => match[1])),
      ];

      expect(result.status, `${file}: ${output}`).toBe(1);
      expect(reportedRules, `${file}: ${output}`).toEqual([expectedRule]);
    }
  }, 30_000);

  it("does not inspect the protected persistent catalog change", () => {
    const result = checkTarget("openspec/changes/persistent-resource-catalog");
    const output = outputOf(result);

    expect(result.status, output).toBe(0);
    expect(output).toContain("architecture check passed");
  });

  it("does not treat manifest JSON content as transport selection", () => {
    const temporaryRoot = mkdtempSync(join(root, "tooling/architecture-manifest-"));
    try {
      writeFileSync(
        join(temporaryRoot, "semantic-manifest.json"),
        JSON.stringify({
          externalContractIdentity: "garfex.resource-master.external-client-contract",
          compatibilityRevision: "1",
          protocol: "transport-neutral semantic evidence",
          route: "not-a-selected-transport",
        }),
      );
      const result = checkTarget(temporaryRoot);
      expect(result.status, outputOf(result)).toBe(0);
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("rejects an escaping counterpart symlink without traversing it", () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), "garfex-architecture-"));
    const fixtureRoot = join(temporaryRoot, "fixture");
    const counterpartRoot = join(temporaryRoot, ["garfex-platform", "ui"].join("-"));

    try {
      mkdirSync(fixtureRoot);
      mkdirSync(counterpartRoot);
      writeFileSync(join(fixtureRoot, "valid.ts"), "export const valid = true;\n");
      symlinkSync(counterpartRoot, join(fixtureRoot, "linked-ui"), "dir");

      const result = spawnSync(process.execPath, [checker, fixtureRoot], {
        cwd: root,
        encoding: "utf8",
      });

      expect(result.status).toBe(1);
      expect(outputOf(result)).toContain("external-client-no-counterpart-symlink");
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });

  it("keeps configuration errors distinct from architecture violations", () => {
    const result = spawnSync(process.execPath, [checker, "tooling/does-not-exist"], {
      cwd: root,
      encoding: "utf8",
    });

    expect(result.status).toBe(2);
    expect(outputOf(result)).toContain("architecture checker configuration error");
  });
});
