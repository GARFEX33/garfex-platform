import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { SemanticManifest } from "../src/manifest-model.js";
import { materializeDocs } from "../src/materialize-docs.js";
import { repositoryRoot } from "./support/compile.js";

const manifestPath = resolve(
  repositoryRoot,
  "contracts/external-garfex/resource-master/generated/semantic-manifest.json",
);
const generatedPath = resolve(
  repositoryRoot,
  "docs/generated/resource-master-external-contract.md",
);
const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as SemanticManifest;

const operationNames = manifest.operations.map(({ name }) => name);
const failureCodes =
  manifest.enums.find(({ name }) => name === "ExternalFailureCode")?.values ?? [];

const read = (relativePath: string): string =>
  readFileSync(resolve(repositoryRoot, relativePath), "utf8");

describe("external consumer documentation parity", () => {
  it("matches the generated consumer document exactly to the manifest materializer", () => {
    expect(read("docs/generated/resource-master-external-contract.md")).toBe(
      materializeDocs(manifest),
    );
    expect(operationNames).toHaveLength(10);
    expect(failureCodes).toHaveLength(11);
    for (const operation of operationNames) {
      expect(read(generatedPath).toString()).toContain(`### \`${operation}\``);
    }
    for (const code of failureCodes) expect(read(generatedPath)).toContain(`\`${String(code)}\``);
  });

  it("keeps generated semantics standalone and preserves opaque revision guidance", () => {
    const generated = read("docs/generated/resource-master-external-contract.md");
    expect(generated).toMatch(/^# Contract identity and compatibility/);
    expect(generated).toContain(
      `External contract identity: \`${manifest.externalContractIdentity}\``,
    );
    expect(generated).toContain(`Compatibility revision: \`${manifest.compatibilityRevision}\``);
    expect(generated).toContain("opaque string");
    expect(generated).toContain("compare it for exact equality");
    expect(generated).toContain("Only the business fields listed below are consumer input");
    expect(generated).not.toMatch(
      /ActorContext|capabilit(?:y|ies)|Convex|persistence|HTTP|route|header|SDK|deployment/i,
    );
  });
});
