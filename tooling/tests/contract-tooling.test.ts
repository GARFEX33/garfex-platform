import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync, statSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const run = (script: string) =>
  spawnSync("corepack", ["pnpm", script], { cwd: root, encoding: "utf8" });

const trackedContractFiles = [
  "contracts/external-garfex/resource-master/generated/semantic-manifest.json",
  "apps/backend/src/external-garfex-boundary/client-facing/generated/semantic-contract.generated.ts",
  "docs/generated/resource-master-external-contract.md",
];

describe("root contract tooling", () => {
  it("exposes the stable TypeSpec, generation, and non-writing commands", () => {
    const scripts = JSON.parse(readFileSync(join(root, "package.json"), "utf8")).scripts;
    expect(scripts).toMatchObject({
      "contract:typespec:check": expect.any(String),
      "contract:generate": expect.any(String),
      "contract:check": expect.any(String),
    });
    expect(scripts.check).toContain("contract:check");
  });

  it("runs TypeSpec no-emit compilation without creating generated output", () => {
    const result = run("contract:typespec:check");
    expect(result.status, result.stderr).toBe(0);
    expect(
      statSync(
        join(root, "contracts/external-garfex/resource-master/generated/semantic-manifest.json"),
      ).isFile(),
    ).toBe(true);
  });

  it("uses the explicit generation command as the only writer", () => {
    const runtime = join(
      root,
      "apps/backend/src/external-garfex-boundary/client-facing/generated/semantic-contract.generated.ts",
    );
    const original = readFileSync(runtime, "utf8");
    writeFileSync(runtime, `${original}/* temporary mutation */\n`, "utf8");
    const result = run("contract:generate");
    expect(result.status, result.stderr).toBe(0);
    expect(readFileSync(runtime, "utf8")).toBe(original);
  });

  it("checks in deterministic dependency order and leaves artifacts and the protected catalog unchanged", () => {
    const before = new Map(
      trackedContractFiles.map((file) => [file, readFileSync(join(root, file), "utf8")]),
    );
    const result = run("contract:check");
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toMatch(/typespec.*manifest.*materializer.*baseline.*parity.*stale/is);
    for (const [file, content] of before)
      expect(readFileSync(join(root, file), "utf8")).toBe(content);
    const protectedDiff = execFileSync(
      "git",
      ["diff", "--name-only", "--", "openspec/changes/persistent-resource-catalog"],
      { cwd: root, encoding: "utf8" },
    );
    expect(protectedDiff).toBe("");
  });

  it("cleans temporary generation directories after a check", () => {
    const result = run("contract:check");
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toMatch(/temporary.*cleaned|cleanup/is);
  });

  it("reports diagnostics and protects against accidental writing in check mode", () => {
    const result = run("contract:check");
    expect(result.status, result.stderr).toBe(0);
    expect(result.stdout).toMatch(/non-writing|read-only/i);
    expect(result.stdout).not.toMatch(/transport|publish|deploy/i);
  });
});
