import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  type CompatibilityEvidence,
  checkManifestCompatibility,
  compareSemanticManifests,
  type SemanticManifest,
} from "../src/compare.js";
import { repositoryRoot } from "./support/compile.js";

const manifestPath = resolve(
  repositoryRoot,
  "contracts/external-garfex/resource-master/generated/semantic-manifest.json",
);
const acceptedBaselinePath = resolve(
  repositoryRoot,
  "contracts/external-garfex/resource-master/baseline/accepted-semantic-manifest.json",
);
const baseline = JSON.parse(readFileSync(manifestPath, "utf8")) as SemanticManifest;
const acceptedBaseline = JSON.parse(readFileSync(acceptedBaselinePath, "utf8")) as SemanticManifest;

type Mutable<T> = T extends readonly (infer Item)[]
  ? Mutable<Item>[]
  : T extends object
    ? { -readonly [Key in keyof T]: Mutable<T[Key]> }
    : T;
type MutableManifest = Mutable<SemanticManifest>;

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const manifestWith = (mutate: (candidate: MutableManifest) => void): SemanticManifest => {
  const candidate = clone(baseline) as MutableManifest;
  mutate(candidate);
  return candidate;
};
const operation = (manifest: MutableManifest, name: string) => {
  const value = manifest.operations.find((entry) => entry.name === name);
  if (value === undefined) throw new Error(`missing operation ${name}`);
  return value;
};
const model = (manifest: MutableManifest, name: string) => {
  const value = manifest.models.find((entry) => entry.name === name);
  if (value === undefined) throw new Error(`missing model ${name}`);
  return value;
};
const union = (manifest: MutableManifest, name: string) => {
  const value = manifest.unions.find((entry) => entry.name === name);
  if (value === undefined) throw new Error(`missing union ${name}`);
  return value;
};
const enumeration = (manifest: MutableManifest, name: string) => {
  const value = manifest.enums.find((entry) => entry.name === name);
  if (value === undefined) throw new Error(`missing enum ${name}`);
  return value;
};
const scalar = (manifest: MutableManifest, name: string) => {
  const value = manifest.scalars.find((entry) => entry.name === name);
  if (value === undefined) throw new Error(`missing scalar ${name}`);
  return value;
};
const hasDifference = (
  result: ReturnType<typeof compareSemanticManifests>,
  category: string,
  path: string,
): boolean =>
  result.differences.some(
    (difference) => difference.category === category && difference.path === path,
  );

const requiredLimit = manifestWith((candidate) => {
  const request = model(candidate, "SearchResourcesRequest");
  const limit = request.properties.find((property) => property.name === "limit");
  if (limit === undefined) throw new Error("missing search limit");
  limit.optional = false;
});

const optionalRequestAddition = manifestWith((candidate) => {
  model(candidate, "SearchResourcesRequest").properties.push({
    name: "futureCursor",
    optional: true,
    type: { kind: "scalar", name: "string" },
  });
});

const successAddition = manifestWith((candidate) => {
  model(candidate, "Resource").properties.push({
    name: "displayName",
    optional: true,
    type: { kind: "scalar", name: "string" },
  });
});

const changedFailureMetadata = manifestWith((candidate) => {
  model(candidate, "ForbiddenFailure").properties.push({
    name: "fieldIssues",
    optional: true,
    type: {
      kind: "array",
      element: { kind: "named", name: "FieldIssue" },
    },
  });
});

const addOperation = manifestWith((candidate) => {
  candidate.operations.push({
    name: "futureOperation",
    request: "GetTaxonomyRequest",
    success: "GetTaxonomySuccess",
    failure: "SafeFailure",
    outcome: "GetTaxonomyOutcome",
  });
});

const renamedOperation = manifestWith((candidate) => {
  operation(candidate, "searchResources").name = "searchResourcesV2";
});

const redirectedReference = manifestWith((candidate) => {
  const source = model(candidate, "GetTaxonomyRequest");
  candidate.models.push({
    name: "RenamedGetTaxonomyRequest",
    properties: source.properties,
  });
  operation(candidate, "getTaxonomy").request = "RenamedGetTaxonomyRequest";
});

const requestNullableAddition = manifestWith((candidate) => {
  const request = model(candidate, "SearchResourcesRequest");
  const cursor = request.properties.find((property) => property.name === "cursor");
  if (cursor === undefined) throw new Error("missing cursor");
  cursor.type = { kind: "scalar", name: "string" };
});

const enumAddition = manifestWith((candidate) => {
  enumeration(candidate, "ResourceLifecycleFilter").values.push("ARCHIVED");
});

const enumRemoval = manifestWith((candidate) => {
  const values = enumeration(candidate, "ResourceLifecycleFilter").values;
  values.splice(values.indexOf("ALL"), 1);
});

const unionAddition = manifestWith((candidate) => {
  union(candidate, "GetTaxonomyOutcome").variants.push({
    name: "partial",
    type: { kind: "named", name: "GetTaxonomySuccess" },
  });
});

const constraintTightening = manifestWith((candidate) => {
  scalar(candidate, "SearchLimit").constraints.minValue = 2;
});

const constraintRelaxation = manifestWith((candidate) => {
  scalar(candidate, "SearchLimit").constraints.minValue = 0;
});

const documentationChange = manifestWith((candidate) => {
  const changed = operation(candidate, "searchResources") as Mutable<
    (typeof candidate.operations)[number]
  > & { documentation?: string };
  changed.documentation = "Searches reviewed external resources.";
});

const provenanceChange = manifestWith((candidate) => {
  candidate.provenance = { ...candidate.provenance, compilerVersion: "1.16.0" };
});

const deploymentProvenanceChange = manifestWith((candidate) => {
  (
    candidate.provenance as Mutable<typeof candidate.provenance> & { deploymentVersion?: string }
  ).deploymentVersion = "candidate-deployment";
});

const errorCodeChange = manifestWith((candidate) => {
  const values = enumeration(candidate, "ExternalFailureCode").values;
  values.splice(values.indexOf("FORBIDDEN"), 1);
});

const successNullabilityChange = manifestWith((candidate) => {
  const success = model(candidate, "SearchResourcesSuccess");
  const cursor = success.properties.find((property) => property.name === "cursor");
  if (cursor === undefined) throw new Error("missing result cursor");
  cursor.type = { kind: "scalar", name: "string" };
});

const unknownChange = manifestWith((candidate) => {
  (candidate as SemanticManifest & { unknownDifference?: string }).unknownDifference =
    "closed-by-default";
});

const breakWithRevision = manifestWith((candidate) => {
  const request = model(candidate, "SearchResourcesRequest");
  const limit = request.properties.find((property) => property.name === "limit");
  if (limit === undefined) throw new Error("missing search limit");
  limit.optional = false;
  candidate.compatibilityRevision = "2";
});

const identityChange = manifestWith((candidate) => {
  candidate.externalContractIdentity = "garfex.resource-master.replacement-client-contract";
  candidate.compatibilityRevision = "2";
});

const migrationEvidence: CompatibilityEvidence = {
  migrationIntent:
    "The limit becomes required after all consumers adopt the reviewed request shape.",
};

const replacementEvidence: CompatibilityEvidence = {
  ...migrationEvidence,
  replacementLineageIntent:
    "This identity intentionally replaces the previous external contract lineage.",
};

describe("conservative semantic compatibility comparator", () => {
  it("accepts the reviewed baseline without semantic differences", () => {
    const result = compareSemanticManifests(baseline, baseline);
    expect(result.differences).toEqual([]);
    expect(checkManifestCompatibility(baseline, baseline).accepted).toBe(true);
  });

  it("keeps the accepted baseline byte-identical and preserves opaque metadata", () => {
    expect(readFileSync(acceptedBaselinePath, "utf8")).toBe(readFileSync(manifestPath, "utf8"));
    expect(acceptedBaseline.externalContractIdentity).toBe(
      "garfex.resource-master.external-client-contract",
    );
    expect(acceptedBaseline.compatibilityRevision).toBe("1");
    expect(compareSemanticManifests(acceptedBaseline, baseline).differences).toEqual([]);
  });

  it.each([
    ["operation addition", addOperation, "breaking", "operations.futureOperation"],
    ["operation rename removal", renamedOperation, "breaking", "operations.searchResources"],
    ["operation rename addition", renamedOperation, "breaking", "operations.searchResourcesV2"],
    [
      "named reference redirection",
      redirectedReference,
      "breaking",
      "operations.getTaxonomy.request.reference",
    ],
    [
      "required request field",
      requiredLimit,
      "breaking",
      "operations.searchResources.request.limit.required",
    ],
    [
      "optional request field addition",
      optionalRequestAddition,
      "additive",
      "operations.searchResources.request.futureCursor",
    ],
    [
      "closed success field addition",
      successAddition,
      "breaking",
      "operations.getResource.success.resource.displayName",
    ],
    [
      "failure metadata applicability",
      changedFailureMetadata,
      "breaking",
      "operations.getTaxonomy.failure.variants.forbidden.fieldIssues",
    ],
    [
      "request nullability removal",
      requestNullableAddition,
      "breaking",
      "operations.searchResources.request.cursor.nullable",
    ],
    [
      "request enum widening",
      enumAddition,
      "additive",
      "operations.searchResources.request.lifecycle.values.ARCHIVED",
    ],
    [
      "request enum narrowing",
      enumRemoval,
      "breaking",
      "operations.searchResources.request.lifecycle.values.ALL",
    ],
    [
      "closed outcome union widening",
      unionAddition,
      "breaking",
      "operations.getTaxonomy.outcome.variants.partial",
    ],
    [
      "request constraint tightening",
      constraintTightening,
      "breaking",
      "operations.searchResources.request.limit.constraints.minValue",
    ],
    [
      "request constraint relaxation",
      constraintRelaxation,
      "additive",
      "operations.searchResources.request.limit.constraints.minValue",
    ],
    ["unknown manifest field", unknownChange, "breaking", "manifest.unknownDifference"],
    [
      "documentation text",
      documentationChange,
      "documentation",
      "operations.searchResources.documentation",
    ],
    [
      "error code removal",
      errorCodeChange,
      "breaking",
      "operations.getTaxonomy.failure.variants.catalogUnavailable.code.values.FORBIDDEN",
    ],
    [
      "success nullability removal",
      successNullabilityChange,
      "breaking",
      "operations.searchResources.success.cursor.nullable",
    ],
    ["tooling provenance", provenanceChange, "tooling-provenance", "provenance.compilerVersion"],
    [
      "deployment provenance",
      deploymentProvenanceChange,
      "tooling-provenance",
      "provenance.deploymentVersion",
    ],
  ] as const)("classifies %s at a stable path", (_label, candidate, category, path) => {
    const result = compareSemanticManifests(baseline, candidate);
    expect(hasDifference(result, category, path)).toBe(true);
  });

  it("classifies a removed operation and request field as breaking", () => {
    const removedOperation = manifestWith((candidate) => {
      candidate.operations = candidate.operations.filter(
        (entry) => entry.name !== "searchResources",
      );
    });
    const removedField = manifestWith((candidate) => {
      const request = model(candidate, "SearchResourcesRequest");
      request.properties = request.properties.filter((property) => property.name !== "terms");
    });

    expect(
      hasDifference(
        compareSemanticManifests(baseline, removedOperation),
        "breaking",
        "operations.searchResources",
      ),
    ).toBe(true);
    expect(
      hasDifference(
        compareSemanticManifests(baseline, removedField),
        "breaking",
        "operations.searchResources.request.terms",
      ),
    ).toBe(true);
  });

  it("classifies a changed success field, union membership, and metadata type conservatively", () => {
    const changedSuccess = manifestWith((candidate) => {
      const resource = model(candidate, "Resource");
      const revision = resource.properties.find((property) => property.name === "revision");
      if (revision === undefined) throw new Error("missing revision");
      revision.type = { kind: "scalar", name: "string" };
    });
    const removedVariant = manifestWith((candidate) => {
      union(candidate, "AttributeValue").variants.splice(0, 1);
    });
    const changedMetadataType = manifestWith((candidate) => {
      const failure = model(candidate, "ConflictFailure");
      const revision = failure.properties.find((property) => property.name === "currentRevision");
      if (revision === undefined) throw new Error("missing current revision");
      revision.type = { kind: "scalar", name: "string" };
    });

    expect(
      compareSemanticManifests(baseline, changedSuccess).differences.some(
        ({ category, path }) => category === "breaking" && path.endsWith("revision.name"),
      ),
    ).toBe(true);
    expect(
      compareSemanticManifests(baseline, removedVariant).differences.some(
        ({ category, path }) => category === "breaking" && path.endsWith("variants.flag"),
      ),
    ).toBe(true);
    expect(
      compareSemanticManifests(baseline, changedMetadataType).differences.some(
        ({ category, path }) => category === "breaking" && path.includes("currentRevision"),
      ),
    ).toBe(true);
  });

  it("keeps identity and opaque revision independent from tooling provenance", () => {
    const result = compareSemanticManifests(baseline, provenanceChange);
    expect(provenanceChange.externalContractIdentity).toBe(baseline.externalContractIdentity);
    expect(provenanceChange.compatibilityRevision).toBe(baseline.compatibilityRevision);
    expect(result.differences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: "tooling-provenance",
          path: "provenance.compilerVersion",
        }),
      ]),
    );
    expect(result.differences.some(({ category }) => category === "breaking")).toBe(false);
    const deploymentResult = compareSemanticManifests(baseline, deploymentProvenanceChange);
    expect(deploymentResult.differences).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          category: "tooling-provenance",
          path: "provenance.deploymentVersion",
        }),
      ]),
    );
    expect(deploymentProvenanceChange.externalContractIdentity).toBe(
      baseline.externalContractIdentity,
    );
    expect(deploymentProvenanceChange.compatibilityRevision).toBe(baseline.compatibilityRevision);
  });

  it("fails closed when a breaking shape keeps the opaque revision", () => {
    const result = checkManifestCompatibility(baseline, requiredLimit, migrationEvidence);
    expect(result.accepted).toBe(false);
    expect(result.violations).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "silent-breaking-change" })]),
    );
  });

  it("requires both approved breaking evidence and migration intent for a revision change", () => {
    const withoutEvidence = checkManifestCompatibility(
      baseline,
      manifestWith((candidate) => {
        candidate.compatibilityRevision = "2";
      }),
      migrationEvidence,
    );
    const withoutIntent = checkManifestCompatibility(baseline, breakWithRevision);
    const approved = checkManifestCompatibility(baseline, breakWithRevision, migrationEvidence);

    expect(withoutEvidence.accepted).toBe(false);
    expect(withoutEvidence.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "revision-change-without-breaking-evidence" }),
      ]),
    );
    expect(withoutIntent.accepted).toBe(false);
    expect(withoutIntent.violations).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "missing-migration-intent" })]),
    );
    expect(approved.accepted).toBe(true);
  });

  it("requires replacement-lineage intent when external identity changes", () => {
    const missingReplacement = checkManifestCompatibility(
      baseline,
      identityChange,
      migrationEvidence,
    );
    const approvedReplacement = checkManifestCompatibility(
      baseline,
      identityChange,
      replacementEvidence,
    );

    expect(missingReplacement.accepted).toBe(false);
    expect(missingReplacement.violations).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "missing-replacement-lineage-intent" }),
      ]),
    );
    expect(approvedReplacement.accepted).toBe(true);
  });

  it("accepts documentation and provenance-only changes without changing identity or revision", () => {
    for (const candidate of [documentationChange, provenanceChange]) {
      const result = checkManifestCompatibility(baseline, candidate);
      expect(result.accepted).toBe(true);
      expect(result.requiresReview).toBe(true);
      expect(candidate.externalContractIdentity).toBe(baseline.externalContractIdentity);
      expect(candidate.compatibilityRevision).toBe(baseline.compatibilityRevision);
    }
  });

  it("loads migration intent from a temporary approved-break fixture", () => {
    const directory = mkdtempSync(join(repositoryRoot, ".typespec-compare-test-"));
    try {
      const intentPath = join(directory, "migration-intent.md");
      writeFileSync(intentPath, "# Reviewed migration\n\nConsumers adopt revision 2.\n", "utf8");
      const evidence: CompatibilityEvidence = {
        migrationIntent: readFileSync(intentPath, "utf8"),
      };
      expect(checkManifestCompatibility(baseline, breakWithRevision, evidence).accepted).toBe(true);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it("returns deterministic difference ordering and stable category names", () => {
    const result = compareSemanticManifests(
      baseline,
      manifestWith((candidate) => {
        candidate.compatibilityRevision = "2";
        candidate.provenance = { ...candidate.provenance, emitterVersion: "0.2.0" };
        model(candidate, "SearchResourcesRequest").properties.push({
          name: "futureCursor",
          optional: true,
          type: { kind: "scalar", name: "string" },
        });
      }),
    );

    expect(result.differences.map(({ path }) => path)).toEqual(
      [...result.differences.map(({ path }) => path)].sort((left, right) =>
        left.localeCompare(right, "en"),
      ),
    );
    expect(new Set(result.differences.map(({ category }) => category))).toEqual(
      new Set(["documentation", "additive", "tooling-provenance"]),
    );
  });
});
