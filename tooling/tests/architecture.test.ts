import { spawnSync } from "node:child_process";
import { mkdtempSync, mkdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
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

const outputOf = (result: ReturnType<typeof spawnSync>) =>
  `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

describe("architecture fitness functions", () => {
  it("accepts the public contract path", () => {
    const result = check("valid");

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("architecture check passed");
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
