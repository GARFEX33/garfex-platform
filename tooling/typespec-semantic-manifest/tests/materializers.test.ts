import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { SemanticManifest } from "../src/manifest-model.js";
import { materializeDocs } from "../src/materialize-docs.js";
import { materializeRuntime } from "../src/materialize-runtime.js";
import { materializeArtifacts } from "../src/materialize.js";
import { repositoryRoot } from "./support/compile.js";

const manifestPath = resolve(
  repositoryRoot,
  "contracts/external-garfex/resource-master/generated/semantic-manifest.json",
);

const manifest = JSON.parse(readFileSync(manifestPath, "utf8")) as SemanticManifest;

const expectedOperations = manifest.operations.map(({ name }) => name);
const expectedFailureCodes = manifest.enums.find(
  ({ name }) => name === "ExternalFailureCode",
)?.values;

const prohibitedConcepts =
  /backend|convex|persistence|actorcontext|capabilit(?:y|ies)|authority|transport|http|openapi|orval|route|header|status(?:code)?|serialization|sdk|deployment|network/i;

describe("manifest-only materializers", () => {
  it("embeds readonly runtime schema data with digest and exact contract metadata", () => {
    const source = materializeRuntime(manifest);

    expect(source).toContain("export const externalContractIdentity");
    expect(source).toContain(
      `export const externalContractIdentity = ${JSON.stringify(manifest.externalContractIdentity)} as const;`,
    );
    expect(source).toContain(
      `export const compatibilityRevision = ${JSON.stringify(manifest.compatibilityRevision)} as const;`,
    );
    expect(source).toMatch(/\/\* Manifest digest: sha256:[0-9a-f]{64} \*\//);
    expect(source).toContain("export const semanticManifest =");
    expect(source).toContain("as const;");
    expect(source).not.toContain('from "');
    expect(source).not.toMatch(prohibitedConcepts);

    for (const operation of expectedOperations) expect(source).toContain(`"${operation}"`);
    for (const code of expectedFailureCodes ?? []) expect(source).toContain(`"${String(code)}"`);
  });

  it("renders standalone consumer semantics from the manifest", () => {
    const documentation = materializeDocs(manifest);

    expect(documentation.startsWith("# Contract identity and compatibility\n")).toBe(true);
    expect(documentation).toContain(
      `- External contract identity: \`${manifest.externalContractIdentity}\``,
    );
    expect(documentation).toContain(
      `- Compatibility revision: \`${manifest.compatibilityRevision}\``,
    );
    expect(documentation).toContain("## Workflows");
    expect(documentation).toContain("## Public UI-supporting metadata");
    expect(documentation).toContain("## Safe failures");
    expect(documentation).toContain("## Compatibility guidance");
    expect(documentation).not.toMatch(prohibitedConcepts);

    for (const operation of expectedOperations)
      expect(documentation).toContain(`### \`${operation}\``);
    for (const code of expectedFailureCodes ?? [])
      expect(documentation).toContain(`\`${String(code)}\``);
    for (const model of ["Taxonomy", "EffectiveAttribute", "Option", "NaturalUnit"]) {
      expect(documentation).toContain(`### \`${model}\``);
    }
  });

  it("uses canonical manifest semantics rather than hard-coded metadata", () => {
    const changed = {
      ...manifest,
      externalContractIdentity: "example.contract.lineage",
      compatibilityRevision: "candidate",
    } satisfies SemanticManifest;

    const artifacts = materializeArtifacts(changed);
    expect(artifacts.runtime).toContain(
      'export const externalContractIdentity = "example.contract.lineage" as const;',
    );
    expect(artifacts.runtime).toContain(
      'export const compatibilityRevision = "candidate" as const;',
    );
    expect(artifacts.documentation).toContain("`example.contract.lineage`");
    expect(artifacts.documentation).toContain("`candidate`");
  });

  it("produces byte-identical artifacts for semantically reordered manifest arrays", () => {
    const reordered = {
      ...manifest,
      operations: [...manifest.operations].reverse(),
      models: [...manifest.models].reverse(),
      scalars: [...manifest.scalars].reverse(),
      enums: [...manifest.enums].reverse(),
      unions: [...manifest.unions].reverse(),
    } satisfies SemanticManifest;

    expect(materializeArtifacts(reordered)).toEqual(materializeArtifacts(manifest));
  });
});
