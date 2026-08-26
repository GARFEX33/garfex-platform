import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  compileProject,
  contractRoot,
  expectedCompatibilityRevision,
  expectedContractIdentity,
  metadataFixtureRoot,
  outputOf,
} from "./support/compile.js";

describe("external contract metadata", () => {
  it("compiles the canonical authority without an emitter", () => {
    const result = compileProject(contractRoot);

    expect(result.status, outputOf(result)).toBe(0);
  });

  it("requires exactly one namespace metadata application with exact opaque values", () => {
    const source = readFileSync(resolve(contractRoot, "main.tsp"), "utf8");
    const applications = source.match(/@externalContract\(/g) ?? [];

    expect(applications).toHaveLength(1);
    expect(source).toContain(
      `@externalContract("${expectedContractIdentity}", "${expectedCompatibilityRevision}")`,
    );
  });

  it.each([
    ["missing", "external contract metadata must be applied exactly once"],
    ["duplicate", "external contract metadata must be applied exactly once"],
    ["empty", "external contract identity and compatibility revision must be non-empty"],
    ["wrong-target", "decorator-wrong-target"],
  ] as const)("rejects the %s metadata case with a precise diagnostic", (fixture, diagnostic) => {
    const result = compileProject(resolve(metadataFixtureRoot, fixture));
    const output = outputOf(result);

    expect(result.status).not.toBe(0);
    expect(output).toContain(diagnostic);
  });
});
