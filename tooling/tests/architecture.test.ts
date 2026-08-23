import { spawnSync } from "node:child_process";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const checker = resolve(root, "tooling/architecture/check.mjs");

const check = (fixture: "valid" | "violations") =>
  spawnSync(process.execPath, [checker, `tooling/architecture-fixtures/${fixture}`], {
    cwd: root,
    encoding: "utf8",
  });

describe("architecture fitness functions", () => {
  it("accepts the public contract path", () => {
    const result = check("valid");

    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toContain("architecture check passed");
  });

  it("reports every controlled boundary violation by rule name", () => {
    const result = check("violations");
    const output = `${result.stdout}\n${result.stderr}`;

    expect(result.status).toBe(1);
    expect(output).toContain("pure-domain");
    expect(output).toContain("cross-module-public-only");
    expect(output).toContain("application-no-infrastructure");
    expect(output).toContain("public-surface-contracts-only");
    expect(output).toContain("temporal-application-contracts-only");
    expect(output).toContain("agent-core-independent");
    expect(output).toContain("agent-no-persistence");
    expect(output).toContain("resource-core-no-platform");
    expect(output).toContain("resource-pure-domain");
    expect(output).toContain("resource-application-no-adapter");
    expect(output).toContain("resource-public-contract-only");
    expect(output).toContain("convex-entrypoint-no-core-internals");
    expect(output).toContain("resource-consumers-public-only");
    expect(output).toContain("no-circular");
    expect(output).toContain("no-unresolved");
  });
});
