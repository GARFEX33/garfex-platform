import { createHash } from "node:crypto";
import { serializeManifest, type SemanticManifest } from "./manifest-model.js";

export type MaterializedArtifact = "runtime" | "documentation";

export interface MaterializedArtifacts {
  readonly runtime: string;
  readonly documentation: string;
  readonly manifestDigest: string;
}

export type MaterializationIssueCode =
  | "invalid-manifest"
  | "missing"
  | "missing-digest-header"
  | "stale-digest"
  | "metadata-mismatch"
  | "prohibited-content"
  | "manual-divergence";

export interface MaterializationIssue {
  readonly artifact: "manifest" | MaterializedArtifact;
  readonly code: MaterializationIssueCode;
  readonly message: string;
}

const runtimeDigestHeader = /\/\* Manifest digest: (sha256:[0-9a-f]{64}) \*\//;
const documentationDigestHeader = /<!-- Manifest digest: (sha256:[0-9a-f]{64}) -->/;

/**
 * Generated public artifacts may contain only external business semantics. The
 * lower-case `scalar` schema kind is intentionally not prohibited: it is part
 * of the manifest algebra. Product/platform terms are rejected case-insensitively.
 */
const prohibitedConcepts: readonly RegExp[] = [
  /\bbackend\b/i,
  /\bconvex\b/i,
  /\bpersistence\b/i,
  /\bactor(?:context|id)?\b/i,
  /\bcapabilit(?:y|ies)\b/i,
  /\bauthority\b/i,
  /\brole?s?\b/i,
  /\bclaim?s?\b/i,
  /\btoken?s?\b/i,
  /\bcredential?s?\b/i,
  /\bsession?s?\b/i,
  /\bprovider?s?\b/i,
  /\btransport\b/i,
  /\bhttps?\b/i,
  /\bopenapi\b/i,
  /\borval\b/i,
  /\broute?s?\b/i,
  /\bverb?s?\b/i,
  /\bheaders?\b/i,
  /\bstatus(?:es|codes?)?\b/i,
  /\bserialization\b/i,
  /\bScalar\b/,
  /\bsdk\b/i,
  /\bdeployment\b/i,
  /\bnetwork\b/i,
];

const digest = (bytes: string): string =>
  `sha256:${createHash("sha256").update(bytes, "utf8").digest("hex")}`;

/** Return the canonical UTF-8 manifest representation used for provenance. */
export const canonicalManifestBytes = (manifest: SemanticManifest): string =>
  serializeManifest(manifest);

/** Return the digest embedded in every generated consumer artifact. */
export const manifestDigest = (manifest: SemanticManifest): string =>
  digest(canonicalManifestBytes(manifest));

/** Keep all generated output UTF-8/LF and terminate it with exactly one LF. */
export const canonicalGeneratedText = (value: string): string =>
  `${value.replace(/\r\n?/g, "\n").replace(/\n+$/u, "")}\n`;

const metadataIssues = (
  artifact: MaterializedArtifact,
  content: string,
  manifest: SemanticManifest,
): MaterializationIssue[] => {
  const issues: MaterializationIssue[] = [];
  const identity = JSON.stringify(manifest.externalContractIdentity);
  const revision = JSON.stringify(manifest.compatibilityRevision);
  const identityVisible =
    artifact === "runtime"
      ? content.includes(`export const externalContractIdentity = ${identity} as const;`)
      : content.includes(`- External contract identity: \`${manifest.externalContractIdentity}\``);
  const revisionVisible =
    artifact === "runtime"
      ? content.includes(`export const compatibilityRevision = ${revision} as const;`)
      : content.includes(`- Compatibility revision: \`${manifest.compatibilityRevision}\``);

  if (!identityVisible || !revisionVisible) {
    issues.push({
      artifact,
      code: "metadata-mismatch",
      message: `${artifact} does not expose the exact TypeSpec-authored contract identity and compatibility revision`,
    });
  }
  return issues;
};

const prohibitedIssues = (
  artifact: MaterializedArtifact,
  content: string,
): MaterializationIssue[] => {
  const match = prohibitedConcepts.find((pattern) => pattern.test(content));
  return match === undefined
    ? []
    : [
        {
          artifact,
          code: "prohibited-content",
          message: `${artifact} contains a prohibited backend, authority, platform, or transport concept`,
        },
      ];
};

const digestFor = (artifact: MaterializedArtifact, content: string): string | undefined => {
  const pattern = artifact === "runtime" ? runtimeDigestHeader : documentationDigestHeader;
  return pattern.exec(content)?.[1];
};

export const manifestSafetyIssues = (
  manifest: SemanticManifest,
): readonly MaterializationIssue[] => {
  const issues: MaterializationIssue[] = [];
  if (
    typeof manifest.externalContractIdentity !== "string" ||
    manifest.externalContractIdentity.length === 0 ||
    typeof manifest.compatibilityRevision !== "string" ||
    manifest.compatibilityRevision.length === 0
  ) {
    issues.push({
      artifact: "manifest",
      code: "invalid-manifest",
      message:
        "manifest must carry non-empty external contract identity and compatibility revision strings",
    });
  }

  const content = canonicalManifestBytes(manifest);
  if (prohibitedConcepts.some((pattern) => pattern.test(content))) {
    issues.push({
      artifact: "manifest",
      code: "prohibited-content",
      message: "manifest contains a prohibited backend, authority, platform, or transport concept",
    });
  }
  return issues;
};

export const assertMaterializableManifest = (manifest: SemanticManifest): void => {
  const issues = manifestSafetyIssues(manifest);
  if (issues.length > 0) throw new Error(issues.map(({ message }) => message).join("; "));
};

const checkArtifact = (
  manifest: SemanticManifest,
  artifact: MaterializedArtifact,
  actual: string | undefined,
  expected: string,
): readonly MaterializationIssue[] => {
  if (actual === undefined) {
    return [
      {
        artifact,
        code: "missing",
        message: `${artifact} materialization is missing`,
      },
    ];
  }

  const issues: MaterializationIssue[] = [
    ...metadataIssues(artifact, actual, manifest),
    ...prohibitedIssues(artifact, actual),
  ];
  const expectedDigest = manifestDigest(manifest);
  const actualDigest = digestFor(artifact, actual);
  if (actualDigest === undefined) {
    issues.push({
      artifact,
      code: "missing-digest-header",
      message: `${artifact} is missing its manifest digest header`,
    });
  } else if (actualDigest !== expectedDigest) {
    issues.push({
      artifact,
      code: "stale-digest",
      message: `${artifact} carries ${actualDigest}, expected ${expectedDigest}`,
    });
  }
  if (actual !== expected) {
    issues.push({
      artifact,
      code: "manual-divergence",
      message: `${artifact} bytes differ from deterministic manifest materialization`,
    });
  }
  return issues;
};

export const checkManifestBytes = (
  manifest: SemanticManifest,
  actual: string | Uint8Array,
): readonly MaterializationIssue[] => {
  const actualText = typeof actual === "string" ? actual : new TextDecoder().decode(actual);
  return actualText === canonicalManifestBytes(manifest)
    ? []
    : [
        {
          artifact: "manifest",
          code: "manual-divergence",
          message: "semantic-manifest.json bytes differ from canonical manifest bytes",
        },
      ];
};

export const checkMaterializedArtifact = (
  manifest: SemanticManifest,
  artifact: MaterializedArtifact,
  actual: string | undefined,
  expected: string,
): readonly MaterializationIssue[] => checkArtifact(manifest, artifact, actual, expected);

export const checkManifestDigest = (
  manifest: SemanticManifest,
  actual: string | undefined,
): readonly MaterializationIssue[] =>
  actual === manifestDigest(manifest)
    ? []
    : [
        {
          artifact: "manifest",
          code: actual === undefined ? "missing" : "stale-digest",
          message: `manifest digest ${actual ?? "is missing"}; expected ${manifestDigest(manifest)}`,
        },
      ];

export { prohibitedConcepts };
