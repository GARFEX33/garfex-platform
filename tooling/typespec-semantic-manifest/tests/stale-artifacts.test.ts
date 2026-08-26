import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { SemanticManifest } from "../src/manifest-model.js";
import {
  checkManifestBytes,
  checkMaterializedArtifacts,
  materializeArtifacts,
  manifestDigest,
} from "../src/materialize.js";
import { repositoryRoot } from "./support/compile.js";

const manifestPath = resolve(
  repositoryRoot,
  "contracts/external-garfex/resource-master/generated/semantic-manifest.json",
);
const manifestBytes = readFileSync(manifestPath);
const manifest = JSON.parse(manifestBytes.toString("utf8")) as SemanticManifest;
const artifacts = materializeArtifacts(manifest);
const generatedRuntimePath = resolve(
  repositoryRoot,
  "apps/backend/src/external-garfex-boundary/client-facing/generated/semantic-contract.generated.ts",
);
const generatedDocumentationPath = resolve(
  repositoryRoot,
  "docs/generated/resource-master-external-contract.md",
);

describe("manifest-derived stale artifact checks", () => {
  it("accepts the exact deterministic materializations and manifest bytes", () => {
    expect(manifestDigest(manifest)).toBe(artifacts.manifestDigest);
    expect(checkManifestBytes(manifest, manifestBytes.toString("utf8"))).toEqual([]);
    expect(checkMaterializedArtifacts(manifest, artifacts)).toEqual([]);
  });

  it("rejects missing, stale, and hand-edited materializations without writing", () => {
    expect(checkMaterializedArtifacts(manifest, { ...artifacts, runtime: undefined })).toEqual(
      expect.arrayContaining([expect.objectContaining({ artifact: "runtime", code: "missing" })]),
    );

    const stale = {
      ...artifacts,
      manifestDigest: "sha256:0000000000000000000000000000000000000000000000000000000000000000",
    };
    expect(checkMaterializedArtifacts(manifest, stale)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ artifact: "manifest", code: "stale-digest" }),
      ]),
    );

    const edited = {
      ...artifacts,
      runtime: artifacts.runtime.replace("semanticManifest", "manuallyChangedManifest"),
    };
    expect(checkMaterializedArtifacts(manifest, edited)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ artifact: "runtime", code: "manual-divergence" }),
      ]),
    );
  });

  it("rejects omitted or silently changed identity and revision values", () => {
    const withoutIdentity = artifacts.documentation.replace(
      `- External contract identity: \`${manifest.externalContractIdentity}\``,
      "- External contract identity: " + "``",
    );
    const withoutRevision = artifacts.runtime.replace(
      `export const compatibilityRevision = ${JSON.stringify(manifest.compatibilityRevision)} as const;\n`,
      "",
    );

    expect(
      checkMaterializedArtifacts(manifest, { ...artifacts, documentation: withoutIdentity }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ artifact: "documentation", code: "metadata-mismatch" }),
      ]),
    );
    expect(
      checkMaterializedArtifacts(manifest, { ...artifacts, runtime: withoutRevision }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ artifact: "runtime", code: "metadata-mismatch" }),
      ]),
    );
  });

  it("matches the committed generated files byte-for-byte", () => {
    expect(
      checkMaterializedArtifacts(manifest, {
        runtime: readFileSync(generatedRuntimePath, "utf8"),
        documentation: readFileSync(generatedDocumentationPath, "utf8"),
        manifestDigest: artifacts.manifestDigest,
      }),
    ).toEqual([]);
  });

  it("rejects stale manifest bytes and generated leakage from controlled fixtures", () => {
    const staleManifest = manifestBytes
      .toString("utf8")
      .replace(
        `"compatibilityRevision": ${JSON.stringify(manifest.compatibilityRevision)}`,
        '"compatibilityRevision": "2"',
      );
    expect(checkManifestBytes(manifest, staleManifest)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ artifact: "manifest", code: "manual-divergence" }),
      ]),
    );

    const leakedDocumentation = readFileSync(
      resolve(
        repositoryRoot,
        "tooling/typespec-semantic-manifest/tests/fixtures/materializers/leaked-documentation.md",
      ),
      "utf8",
    );
    expect(
      checkMaterializedArtifacts(manifest, { ...artifacts, documentation: leakedDocumentation }),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ artifact: "documentation", code: "prohibited-content" }),
      ]),
    );
  });

  it("rejects authority-like and delivery-specific leakage in temporary artifacts", () => {
    const leaked = `${artifacts.documentation}\nactorId role token provider routes verbs statuses headers Scalar`;
    expect(checkMaterializedArtifacts(manifest, { ...artifacts, documentation: leaked })).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ artifact: "documentation", code: "prohibited-content" }),
      ]),
    );
  });

  it.each([
    [
      "digest header",
      "runtime",
      `Manifest digest: ${artifacts.manifestDigest}`,
      "Manifest digest: sha256:" + "0".repeat(64),
    ],
    ["operation entry", "runtime", '"getTaxonomy"', '"differentOperation"'],
    ["model field", "runtime", '"resourceId"', '"differentField"'],
    ["error code", "runtime", '"FORBIDDEN"', '"DIAGNOSTIC"'],
    ["metadata allowance", "documentation", "`currentRevision`", "`privateDetail`"],
  ] as const)("rejects a mutated %s in a temporary %s artifact", (_label, artifact, from, to) => {
    const candidate = {
      ...artifacts,
      [artifact]: (artifact === "runtime" ? artifacts.runtime : artifacts.documentation).replace(
        from,
        to,
      ),
    };
    expect(checkMaterializedArtifacts(manifest, candidate)).toEqual(
      expect.arrayContaining([expect.objectContaining({ artifact, code: "manual-divergence" })]),
    );
  });
});
