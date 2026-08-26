import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { authorityFixtureRoot, compileProject, contractRoot, outputOf } from "./support/compile.js";

const expectedOperations = [
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

describe("TypeSpec external authority", () => {
  it("compiles the independent source without transport bindings", () => {
    const result = compileProject(contractRoot);
    const sources = [
      "main.tsp",
      "contract-metadata.tsp",
      "models.tsp",
      "failures.tsp",
      "operations.tsp",
    ]
      .map((file) => readFileSync(resolve(contractRoot, file), "utf8"))
      .join("\n");

    expect(result.status, outputOf(result)).toBe(0);
    expect(sources).not.toMatch(/@(?:http|rest|openapi|route|header|statusCode)\b/i);
    expect(sources).not.toMatch(
      /(?:Convex|ActorContext|capabilit|resource-master\/public|persistence)/i,
    );
  });

  it("exposes exactly the ten named operations", () => {
    const source = readFileSync(resolve(contractRoot, "operations.tsp"), "utf8");
    const operations = [...source.matchAll(/^op\s+(\w+)/gm)].map((match) => match[1]);

    expect(operations).toEqual(expectedOperations);
    expect(new Set(operations).size).toBe(expectedOperations.length);
  });

  it.each([
    ["extra-operation", "external-contract-operation-extra"],
    ["missing-operation", "external-contract-operation-missing"],
    ["unresolved-shape", "invalid-ref"],
    ["anonymous-shape", "external-contract-anonymous-shape"],
    ["authority-field", "external-contract-authority-field"],
    ["backend-import", "external-contract-platform-leakage"],
    ["transport-decorator", "invalid-ref"],
    ["empty-identity", "external-contract-metadata-empty"],
    ["empty-revision", "external-contract-metadata-empty"],
  ] as const)("rejects the controlled %s authority case", (fixture, diagnostic) => {
    const fixturePath = resolve(authorityFixtureRoot, fixture);
    const result = compileProject(fixturePath);

    expect(result.status, outputOf(result)).not.toBe(0);
    expect(outputOf(result)).toContain(diagnostic);
    expect(existsSync(resolve(fixturePath, "generated"))).toBe(false);
  });
});
