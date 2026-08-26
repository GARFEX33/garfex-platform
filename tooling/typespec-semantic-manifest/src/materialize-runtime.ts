import {
  assertMaterializableManifest,
  canonicalGeneratedText,
  manifestDigest,
} from "./materialize-common.js";
import { serializeManifest, type SemanticManifest } from "./manifest-model.js";

/**
 * Materialize the readonly runtime schema embedding. The input is the emitted
 * manifest only; this function never reads TypeSpec source or application code.
 */
export const materializeRuntime = (manifest: SemanticManifest): string => {
  assertMaterializableManifest(manifest);
  const source = [
    "/* GENERATED FILE: derived from semantic-manifest.json; do not edit. */",
    `/* Manifest digest: ${manifestDigest(manifest)} */`,
    "",
    `export const externalContractIdentity = ${JSON.stringify(manifest.externalContractIdentity)} as const;`,
    `export const compatibilityRevision = ${JSON.stringify(manifest.compatibilityRevision)} as const;`,
    `export const manifestDigest = ${JSON.stringify(manifestDigest(manifest))} as const;`,
    `export const schemaRevision = ${JSON.stringify(manifest.schemaRevision)} as const;`,
    "",
    "export const contractMetadata = {",
    "  externalContractIdentity,",
    "  compatibilityRevision,",
    "  manifestDigest,",
    "  schemaRevision,",
    "} as const;",
    "",
    "export const semanticManifest =",
    `${serializeManifest(manifest).trimEnd()} as const;`,
    "",
    "export const operations = semanticManifest.operations;",
    "export const models = semanticManifest.models;",
    "export const scalars = semanticManifest.scalars;",
    "export const enums = semanticManifest.enums;",
    "export const unions = semanticManifest.unions;",
    "",
    "export type ExternalContractIdentity = typeof externalContractIdentity;",
    "export type CompatibilityRevision = typeof compatibilityRevision;",
    "export type GeneratedSemanticManifest = typeof semanticManifest;",
    "export type GeneratedContractMetadata = typeof contractMetadata;",
  ].join("\n");
  return canonicalGeneratedText(source);
};

export {
  assertMaterializableManifest,
  canonicalGeneratedText,
  checkManifestDigest,
  manifestDigest,
  manifestSafetyIssues,
} from "./materialize-common.js";
export type {
  MaterializationIssue,
  MaterializationIssueCode,
  MaterializedArtifact,
  MaterializedArtifacts,
} from "./materialize-common.js";
