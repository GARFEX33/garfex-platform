import type {
  EnumDefinition,
  ModelDefinition,
  ModelPropertyDefinition,
  ScalarConstraints,
  ScalarDefinition,
  SemanticManifest,
  SemanticType,
  UnionDefinition,
} from "./manifest-model.js";
import { canonicalOperationOrder } from "./manifest-model.js";

export const semanticDifferenceCategories = [
  "breaking",
  "additive",
  "documentation",
  "tooling-provenance",
] as const;

export type SemanticDifferenceCategory = (typeof semanticDifferenceCategories)[number];
export type SemanticDifferenceKind = "added" | "removed" | "changed" | "unknown";

export interface SemanticDifference {
  readonly category: SemanticDifferenceCategory;
  readonly kind: SemanticDifferenceKind;
  readonly path: string;
  readonly message: string;
  readonly before?: unknown;
  readonly after?: unknown;
}

export interface SemanticComparison {
  readonly differences: readonly SemanticDifference[];
  readonly byCategory: Readonly<Record<SemanticDifferenceCategory, readonly SemanticDifference[]>>;
  readonly hasBreakingDifferences: boolean;
  readonly hasSemanticDifferences: boolean;
  readonly requiresReview: boolean;
}

export interface CompatibilityEvidence {
  /** Non-empty reviewed contents of migration-intent.md. */
  readonly migrationIntent?: string;
  /** Non-empty reviewed contents explaining a replacement contract lineage. */
  readonly replacementLineageIntent?: string;
}

export type CompatibilityViolationCode =
  | "silent-breaking-change"
  | "missing-migration-intent"
  | "missing-replacement-lineage-intent"
  | "revision-change-without-breaking-evidence"
  | "additive-change-requires-review";

export interface CompatibilityViolation {
  readonly code: CompatibilityViolationCode;
  readonly message: string;
  readonly path?: string;
}

export interface ManifestCompatibility extends SemanticComparison {
  readonly accepted: boolean;
  readonly identityChanged: boolean;
  readonly revisionChanged: boolean;
  readonly violations: readonly CompatibilityViolation[];
}

type ManifestDefinition = ModelDefinition | ScalarDefinition | EnumDefinition | UnionDefinition;
type ManifestDefinitionKind = "model" | "scalar" | "enum" | "union";
type CompatibilityContext = "request" | "success" | "failure" | "output";

type ManifestIndex = {
  readonly enums: ReadonlyMap<string, EnumDefinition>;
  readonly models: ReadonlyMap<string, ModelDefinition>;
  readonly scalars: ReadonlyMap<string, ScalarDefinition>;
  readonly unions: ReadonlyMap<string, UnionDefinition>;
};

const documentationKeys = new Set([
  "comment",
  "comments",
  "deprecated",
  "deprecation",
  "description",
  "documentation",
  "doc",
  "docs",
  "remarks",
  "summary",
  "title",
]);

const provenanceKeys = [
  "compilerVersion",
  "emitterOptionsDigest",
  "emitterVersion",
  "sourceDigest",
] as const;
const provenanceKeySet = new Set<string>(provenanceKeys);

const constraintKeys = [
  "maxItems",
  "maxLength",
  "maxValue",
  "minItems",
  "minLength",
  "minValue",
  "pattern",
] as const;
type ConstraintKey = (typeof constraintKeys)[number];

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isSemanticType = (value: unknown): value is SemanticType =>
  isRecord(value) && typeof value.kind === "string";

const isDocumentationKey = (key: string): boolean => documentationKeys.has(key.toLowerCase());

const compareStrings = (left: string, right: string): number => left.localeCompare(right, "en");

const valueKey = (value: string | number): string => String(value);

const stableValue = (value: unknown): string => {
  if (Array.isArray(value)) return `[${value.map(stableValue).join(",")}]`;
  if (!isRecord(value)) return JSON.stringify(value);
  return `{${Object.keys(value)
    .sort(compareStrings)
    .map((key) => `${JSON.stringify(key)}:${stableValue(value[key])}`)
    .join(",")}}`;
};

const sameValue = (left: unknown, right: unknown): boolean =>
  stableValue(left) === stableValue(right);

const addOptionalValues = (
  difference: Omit<SemanticDifference, "before" | "after">,
  before: unknown,
  after: unknown,
): SemanticDifference => {
  const result: SemanticDifference = { ...difference };
  if (before !== undefined) return { ...result, before, ...(after === undefined ? {} : { after }) };
  if (after !== undefined) return { ...result, after };
  return result;
};

const definitionKind = (value: ManifestDefinition): ManifestDefinitionKind => {
  if ("properties" in value) return "model";
  if ("base" in value) return "scalar";
  if ("values" in value) return "enum";
  return "union";
};

const definitionMap = <T extends ManifestDefinition>(
  values: readonly T[],
  kind: ManifestDefinitionKind,
  addInvalid: (path: string, message: string, before?: unknown, after?: unknown) => void,
): ReadonlyMap<string, T> => {
  const result = new Map<string, T>();
  for (const [index, value] of values.entries()) {
    const name = isRecord(value) && typeof value.name === "string" ? value.name : undefined;
    if (name === undefined || name.length === 0) {
      addInvalid(`${kind}s[${index}]`, `manifest ${kind} name is missing`, value);
      continue;
    }
    if (result.has(name)) {
      addInvalid(`${kind}s.${name}`, `manifest ${kind} name is duplicated`, value);
      continue;
    }
    result.set(name, value);
  }
  return result;
};

const indexManifest = (
  manifest: SemanticManifest,
  addInvalid: (path: string, message: string, before?: unknown, after?: unknown) => void,
): ManifestIndex => ({
  enums: definitionMap(manifest.enums, "enum", addInvalid),
  models: definitionMap(manifest.models, "model", addInvalid),
  scalars: definitionMap(manifest.scalars, "scalar", addInvalid),
  unions: definitionMap(manifest.unions, "union", addInvalid),
});

const findDefinition = (index: ManifestIndex, name: string): ManifestDefinition | undefined => {
  return (
    index.models.get(name) ??
    index.scalars.get(name) ??
    index.enums.get(name) ??
    index.unions.get(name)
  );
};

const valuesByKey = <T extends string | number>(values: readonly T[]): ReadonlyMap<string, T> => {
  const result = new Map<string, T>();
  for (const value of values) result.set(valueKey(value), value);
  return result;
};

const namedByName = <T extends { readonly name: string }>(
  values: readonly T[],
  onDuplicate?: (name: string, value: T) => void,
): ReadonlyMap<string, T> => {
  const result = new Map<string, T>();
  for (const value of values) {
    if (result.has(value.name)) {
      onDuplicate?.(value.name, value);
      continue;
    }
    result.set(value.name, value);
  }
  return result;
};

const isClosedOutput = (context: CompatibilityContext): boolean => context !== "request";

const categoryForWidening = (
  context: CompatibilityContext,
  widening: boolean,
): SemanticDifferenceCategory => (!widening || isClosedOutput(context) ? "breaking" : "additive");

const categoryForAddition = (
  context: CompatibilityContext,
  optional = false,
): SemanticDifferenceCategory => {
  if (isClosedOutput(context)) return "breaking";
  return optional ? "additive" : "breaking";
};

const differenceKindForPresence = (
  beforeHas: boolean,
  afterHas: boolean,
): SemanticDifferenceKind => {
  if (!beforeHas) return "added";
  if (!afterHas) return "removed";
  return "changed";
};

const propertyAdditionMessage = (context: CompatibilityContext, optional: boolean): string => {
  if (isClosedOutput(context)) return "a closed-output field was added";
  if (optional) return "an optional request field was added";
  return "a required request field was added";
};

const rootManifestKeys = new Set([
  "compatibilityRevision",
  "enums",
  "externalContractIdentity",
  "models",
  "operations",
  "provenance",
  "scalars",
  "schemaRevision",
  "unions",
]);
const manifestMetadataKeys = new Set([
  "externalContractIdentity",
  "compatibilityRevision",
  "schemaRevision",
]);
const isManifestMetadataKey = (key: string): boolean => manifestMetadataKeys.has(key);

const isKnownSemanticTypeKey = (kind: unknown, key: string): boolean => {
  switch (kind) {
    case "array":
      return key === "kind" || key === "element";
    case "literal":
      return key === "kind" || key === "value";
    case "named":
    case "scalar":
      return key === "kind" || key === "name";
    case "nullable":
      return key === "kind" || key === "type";
    case "record":
      return key === "kind" || key === "value";
    case "object":
      return key === "kind" || key === "properties";
    default:
      return key === "kind";
  }
};

const structuredKeyRules = [
  { required: ["optional", "type"], keys: new Set(["name", "optional", "type"]) },
  { required: ["base", "constraints"], keys: new Set(["name", "base", "constraints"]) },
  { required: ["values", "name"], keys: new Set(["name", "values"]) },
  { required: ["variants", "name"], keys: new Set(["name", "variants"]) },
  {
    required: ["failure", "request", "success"],
    keys: new Set(["failure", "name", "outcome", "request", "success"]),
  },
  { required: ["properties", "name"], keys: new Set(["name", "properties", "indexer"]) },
  { required: ["name", "type"], keys: new Set(["name", "type"]) },
] as const;

const isKnownStructuredKey = (value: Record<string, unknown>, key: string): boolean => {
  if ("kind" in value) return isKnownSemanticTypeKey(value.kind, key);
  const rule = structuredKeyRules.find(({ required }) => required.every((field) => field in value));
  return rule?.keys.has(key) ?? false;
};

const compareNumericConstraint = (
  key: ConstraintKey,
  before: number | undefined,
  after: number | undefined,
): "same" | "widening" | "narrowing" | "unknown" => {
  if (before === after) return "same";
  if (before === undefined || after === undefined) {
    if (before === undefined && after !== undefined) return "narrowing";
    if (before !== undefined && after === undefined) return "widening";
    return "unknown";
  }
  if (key.startsWith("min")) return after < before ? "widening" : "narrowing";
  if (key.startsWith("max")) return after > before ? "widening" : "narrowing";
  return "unknown";
};

class ManifestComparator {
  private readonly differences: SemanticDifference[] = [];
  private readonly visited = new Set<string>();
  private readonly baselineIndex: ManifestIndex;
  private readonly candidateIndex: ManifestIndex;
  private readonly baseline: SemanticManifest;
  private readonly candidate: SemanticManifest;

  public constructor(baseline: SemanticManifest, candidate: SemanticManifest) {
    this.baseline = baseline;
    this.candidate = candidate;
    const addInvalid = (path: string, message: string, before?: unknown, after?: unknown): void => {
      this.add("breaking", "unknown", path, message, before, after);
    };
    this.baselineIndex = indexManifest(baseline, addInvalid);
    this.candidateIndex = indexManifest(candidate, addInvalid);
  }

  public compare(): SemanticComparison {
    this.compareContractMetadata();
    this.compareOperations();
    this.compareAuxiliaryFields(this.baseline, this.candidate, "");

    const differences = [...this.differences].sort(
      (left, right) =>
        compareStrings(left.path, right.path) ||
        compareStrings(left.category, right.category) ||
        compareStrings(left.kind, right.kind) ||
        compareStrings(left.message, right.message),
    );
    const byCategory = Object.fromEntries(
      semanticDifferenceCategories.map((category) => [
        category,
        differences.filter((difference) => difference.category === category),
      ]),
    ) as unknown as Record<SemanticDifferenceCategory, readonly SemanticDifference[]>;

    return {
      differences,
      byCategory,
      hasBreakingDifferences: byCategory.breaking.length > 0,
      hasSemanticDifferences: byCategory.breaking.length > 0 || byCategory.additive.length > 0,
      requiresReview: differences.length > 0,
    };
  }

  private add(
    category: SemanticDifferenceCategory,
    kind: SemanticDifferenceKind,
    path: string,
    message: string,
    before?: unknown,
    after?: unknown,
  ): void {
    const difference = addOptionalValues({ category, kind, path, message }, before, after);
    if (
      this.differences.some(
        (existing) =>
          existing.category === difference.category &&
          existing.kind === difference.kind &&
          existing.path === difference.path &&
          existing.message === difference.message,
      )
    )
      return;
    this.differences.push(difference);
  }

  private compareContractMetadata(): void {
    if (this.baseline.externalContractIdentity !== this.candidate.externalContractIdentity) {
      this.add(
        "breaking",
        "changed",
        "contract.externalContractIdentity",
        "external contract identity changed; this creates a replacement lineage",
        this.baseline.externalContractIdentity,
        this.candidate.externalContractIdentity,
      );
    }
    if (this.baseline.compatibilityRevision !== this.candidate.compatibilityRevision) {
      this.add(
        "documentation",
        "changed",
        "contract.compatibilityRevision",
        "opaque compatibility revision changed",
        this.baseline.compatibilityRevision,
        this.candidate.compatibilityRevision,
      );
    }
    if (this.baseline.schemaRevision !== this.candidate.schemaRevision) {
      this.add(
        "tooling-provenance",
        "changed",
        "manifest.schemaRevision",
        "internal manifest schema revision changed",
        this.baseline.schemaRevision,
        this.candidate.schemaRevision,
      );
    }
    for (const key of provenanceKeys) {
      const before = this.baseline.provenance[key];
      const after = this.candidate.provenance[key];
      if (before !== after) {
        this.add(
          "tooling-provenance",
          "changed",
          `provenance.${key}`,
          `tooling provenance ${key} changed without changing external identity or revision`,
          before,
          after,
        );
      }
    }
  }

  private compareOperations(): void {
    const baselineOperations = namedByName(this.baseline.operations, (name, value) =>
      this.add(
        "breaking",
        "unknown",
        `operations.${name}`,
        "duplicate operation identifiers are rejected closed",
        undefined,
        value,
      ),
    );
    const candidateOperations = namedByName(this.candidate.operations, (name, value) =>
      this.add(
        "breaking",
        "unknown",
        `operations.${name}`,
        "duplicate operation identifiers are rejected closed",
        undefined,
        value,
      ),
    );
    const names = new Set([...baselineOperations.keys(), ...candidateOperations.keys()]);
    const canonicalRank = new Map<string, number>(
      canonicalOperationOrder.map((name, index) => [name, index]),
    );
    const orderedNames = [...names].sort(
      (left, right) =>
        (canonicalRank.get(left) ?? Number.MAX_SAFE_INTEGER) -
          (canonicalRank.get(right) ?? Number.MAX_SAFE_INTEGER) || compareStrings(left, right),
    );

    for (const name of orderedNames) {
      const before = baselineOperations.get(name);
      const after = candidateOperations.get(name);
      if (before === undefined) {
        this.add(
          "breaking",
          "added",
          `operations.${name}`,
          `operation ${name} was added`,
          undefined,
          after,
        );
        continue;
      }
      if (after === undefined) {
        this.add(
          "breaking",
          "removed",
          `operations.${name}`,
          `operation ${name} was removed`,
          before,
          undefined,
        );
        continue;
      }

      this.compareReference(before.request, after.request, `operations.${name}.request`, "request");
      this.compareReference(before.success, after.success, `operations.${name}.success`, "success");
      this.compareReference(before.failure, after.failure, `operations.${name}.failure`, "failure");
      this.compareReference(before.outcome, after.outcome, `operations.${name}.outcome`, "output");
    }
  }

  private compareReference(
    beforeName: string,
    afterName: string,
    path: string,
    context: CompatibilityContext,
  ): void {
    if (typeof beforeName !== "string" || typeof afterName !== "string") {
      this.add(
        "breaking",
        "unknown",
        `${path}.reference`,
        "operation reference is not a valid named reference",
        beforeName,
        afterName,
      );
      return;
    }
    this.compareDefinition(beforeName, afterName, path, context);
  }

  private compareDefinition(
    beforeName: string,
    afterName: string,
    path: string,
    context: CompatibilityContext,
  ): void {
    const before = findDefinition(this.baselineIndex, beforeName);
    const after = findDefinition(this.candidateIndex, afterName);
    if (before === undefined || after === undefined) {
      this.add(
        "breaking",
        "unknown",
        `${path}.reference`,
        "named semantic reference cannot be resolved in both manifests",
        beforeName,
        afterName,
      );
      return;
    }

    if (beforeName !== afterName) {
      this.add(
        "breaking",
        "changed",
        `${path}.reference`,
        "named semantic reference changed",
        beforeName,
        afterName,
      );
    }

    const pair = `${context}|${definitionKind(before)}:${beforeName}|${definitionKind(after)}:${afterName}`;
    if (this.visited.has(pair)) return;
    this.visited.add(pair);

    const beforeKind = definitionKind(before);
    const afterKind = definitionKind(after);
    if (beforeKind !== afterKind) {
      this.add(
        "breaking",
        "unknown",
        `${path}.kind`,
        "named semantic reference changed definition kind and cannot be classified safely",
        beforeKind,
        afterKind,
      );
      return;
    }

    switch (beforeKind) {
      case "model":
        this.compareModel(before as ModelDefinition, after as ModelDefinition, path, context);
        return;
      case "scalar":
        this.compareScalar(before as ScalarDefinition, after as ScalarDefinition, path, context);
        return;
      case "enum":
        this.compareEnum(before as EnumDefinition, after as EnumDefinition, path, context);
        return;
      case "union":
        this.compareUnion(before as UnionDefinition, after as UnionDefinition, path, context);
        return;
      default: {
        const exhaustive: never = beforeKind;
        this.add("breaking", "unknown", path, `unsupported definition kind ${exhaustive}`);
      }
    }
  }

  private compareModel(
    before: ModelDefinition,
    after: ModelDefinition,
    path: string,
    context: CompatibilityContext,
  ): void {
    this.compareProperties(before.properties, after.properties, path, context);
    const beforeIndexer = before.indexer;
    const afterIndexer = after.indexer;
    if (beforeIndexer === undefined && afterIndexer !== undefined) {
      this.add(
        categoryForAddition(context, true),
        "added",
        `${path}.indexer`,
        "an open record indexer was added",
        undefined,
        afterIndexer,
      );
    } else if (beforeIndexer !== undefined && afterIndexer === undefined) {
      this.add(
        "breaking",
        "removed",
        `${path}.indexer`,
        "an open record indexer was removed",
        beforeIndexer,
      );
    } else if (beforeIndexer !== undefined && afterIndexer !== undefined) {
      this.compareType(beforeIndexer.value, afterIndexer.value, `${path}.indexer.value`, context);
    }
  }

  private compareProperties(
    beforeProperties: readonly ModelPropertyDefinition[],
    afterProperties: readonly ModelPropertyDefinition[],
    path: string,
    context: CompatibilityContext,
  ): void {
    const before = namedByName(beforeProperties, (name, value) =>
      this.add(
        "breaking",
        "unknown",
        `${path}.${name}`,
        "duplicate model property identifiers are rejected closed",
        undefined,
        value,
      ),
    );
    const after = namedByName(afterProperties, (name, value) =>
      this.add(
        "breaking",
        "unknown",
        `${path}.${name}`,
        "duplicate model property identifiers are rejected closed",
        undefined,
        value,
      ),
    );
    const names = new Set([...before.keys(), ...after.keys()]);
    for (const name of [...names].sort(compareStrings)) {
      this.compareProperty(before.get(name), after.get(name), `${path}.${name}`, context);
    }
  }

  private compareProperty(
    beforeProperty: ModelPropertyDefinition | undefined,
    afterProperty: ModelPropertyDefinition | undefined,
    path: string,
    context: CompatibilityContext,
  ): void {
    if (beforeProperty === undefined) {
      if (afterProperty === undefined) return;
      this.add(
        categoryForAddition(context, afterProperty.optional),
        "added",
        path,
        propertyAdditionMessage(context, afterProperty.optional),
        undefined,
        afterProperty,
      );
      return;
    }
    if (afterProperty === undefined) {
      this.add("breaking", "removed", path, "a semantic field was removed", beforeProperty);
      return;
    }

    this.comparePropertyRequiredness(beforeProperty, afterProperty, path, context);
    this.compareType(beforeProperty.type, afterProperty.type, path, context);
  }

  private comparePropertyRequiredness(
    beforeProperty: ModelPropertyDefinition,
    afterProperty: ModelPropertyDefinition,
    path: string,
    context: CompatibilityContext,
  ): void {
    if (beforeProperty.optional === afterProperty.optional) return;
    const beforeRequired = !beforeProperty.optional;
    const afterRequired = !afterProperty.optional;
    const category =
      afterRequired && !beforeRequired ? "breaking" : categoryForWidening(context, true);
    const message = afterRequired
      ? "an optional field became required"
      : "a required field became optional";
    this.add(category, "changed", `${path}.required`, message, beforeRequired, afterRequired);
  }

  private compareScalar(
    before: ScalarDefinition,
    after: ScalarDefinition,
    path: string,
    context: CompatibilityContext,
  ): void {
    if (before.base !== after.base) {
      this.add(
        "breaking",
        "unknown",
        `${path}.base`,
        "scalar base type changed and the accepted-value relation is unknown",
        before.base,
        after.base,
      );
    }
    this.compareConstraints(before.constraints, after.constraints, `${path}.constraints`, context);
  }

  private compareConstraints(
    before: ScalarConstraints,
    after: ScalarConstraints,
    path: string,
    context: CompatibilityContext,
  ): void {
    for (const key of constraintKeys) {
      this.compareConstraint(key, before[key], after[key], path, context);
    }
  }

  private compareConstraint(
    key: ConstraintKey,
    beforeValue: number | string | undefined,
    afterValue: number | string | undefined,
    path: string,
    context: CompatibilityContext,
  ): void {
    if (beforeValue === afterValue) return;
    if (key === "pattern") {
      this.comparePatternConstraint(beforeValue, afterValue, path, context);
      return;
    }

    const relation = compareNumericConstraint(
      key,
      beforeValue as number | undefined,
      afterValue as number | undefined,
    );
    const message =
      relation === "widening"
        ? "a request constraint was relaxed"
        : "a scalar constraint was tightened or could not be classified";
    this.add(
      categoryForWidening(context, relation === "widening"),
      differenceKindForPresence(beforeValue !== undefined, afterValue !== undefined),
      `${path}.${key}`,
      message,
      beforeValue,
      afterValue,
    );
  }

  private comparePatternConstraint(
    beforeValue: number | string | undefined,
    afterValue: number | string | undefined,
    path: string,
    context: CompatibilityContext,
  ): void {
    const widening = beforeValue !== undefined && afterValue === undefined;
    this.add(
      categoryForWidening(context, widening),
      differenceKindForPresence(beforeValue !== undefined, afterValue !== undefined),
      `${path}.pattern`,
      widening
        ? "a request pattern constraint was relaxed"
        : "a pattern constraint changed conservatively",
      beforeValue,
      afterValue,
    );
  }

  private compareEnum(
    before: EnumDefinition,
    after: EnumDefinition,
    path: string,
    context: CompatibilityContext,
  ): void {
    const beforeValues = valuesByKey(before.values);
    const afterValues = valuesByKey(after.values);
    const values = new Set([...beforeValues.keys(), ...afterValues.keys()]);
    for (const value of [...values].sort(compareStrings)) {
      const beforeValue = beforeValues.get(value);
      const afterValue = afterValues.get(value);
      if (beforeValue === undefined) {
        this.add(
          categoryForWidening(context, true),
          "added",
          `${path}.values.${value}`,
          "an enum member was added",
          undefined,
          afterValue,
        );
      } else if (afterValue === undefined) {
        this.add(
          "breaking",
          "removed",
          `${path}.values.${value}`,
          "an enum member was removed",
          beforeValue,
        );
      }
    }
  }

  private compareUnion(
    before: UnionDefinition,
    after: UnionDefinition,
    path: string,
    context: CompatibilityContext,
  ): void {
    const beforeVariants = namedByName(before.variants, (name, value) =>
      this.add(
        "breaking",
        "unknown",
        `${path}.variants.${name}`,
        "duplicate union variants are rejected closed",
        undefined,
        value,
      ),
    );
    const afterVariants = namedByName(after.variants, (name, value) =>
      this.add(
        "breaking",
        "unknown",
        `${path}.variants.${name}`,
        "duplicate union variants are rejected closed",
        undefined,
        value,
      ),
    );
    const names = new Set([...beforeVariants.keys(), ...afterVariants.keys()]);
    for (const name of [...names].sort(compareStrings)) {
      const beforeVariant = beforeVariants.get(name);
      const afterVariant = afterVariants.get(name);
      const variantPath = `${path}.variants.${name}`;
      if (beforeVariant === undefined) {
        this.add(
          categoryForWidening(context, true),
          "added",
          variantPath,
          "a union variant was added",
          undefined,
          afterVariant,
        );
      } else if (afterVariant === undefined) {
        this.add("breaking", "removed", variantPath, "a union variant was removed", beforeVariant);
      } else {
        this.compareType(beforeVariant.type, afterVariant.type, variantPath, context);
      }
    }
  }

  private compareType(
    before: SemanticType,
    after: SemanticType,
    path: string,
    context: CompatibilityContext,
  ): void {
    if (!isSemanticType(before) || !isSemanticType(after)) {
      this.add(
        "breaking",
        "unknown",
        path,
        "a semantic type is missing or malformed",
        before,
        after,
      );
      return;
    }
    if (this.compareNullability(before, after, path, context)) return;
    if (before.kind !== after.kind) {
      this.add(
        "breaking",
        "unknown",
        `${path}.kind`,
        "semantic type kind changed and cannot be classified safely",
        before.kind,
        after.kind,
      );
      return;
    }
    this.compareSameKind(before, after, path, context);
  }

  private compareNullability(
    before: SemanticType,
    after: SemanticType,
    path: string,
    context: CompatibilityContext,
  ): boolean {
    const beforeNullable = before.kind === "nullable";
    const afterNullable = after.kind === "nullable";
    if (beforeNullable === afterNullable) return false;
    if (beforeNullable) {
      this.add(
        "breaking",
        "changed",
        `${path}.nullable`,
        "a nullable value became non-nullable",
        true,
        false,
      );
      return true;
    }
    this.add(
      isClosedOutput(context) ? "breaking" : "additive",
      "changed",
      `${path}.nullable`,
      isClosedOutput(context)
        ? "an output became nullable"
        : "a request accepted-value set widened to nullable",
      false,
      true,
    );
    return true;
  }

  private compareSameKind(
    before: SemanticType,
    after: SemanticType,
    path: string,
    context: CompatibilityContext,
  ): void {
    switch (before.kind) {
      case "array":
        this.compareType(
          before.element,
          (after as Extract<SemanticType, { kind: "array" }>).element,
          `${path}.items`,
          context,
        );
        return;
      case "record":
        this.compareType(
          before.value,
          (after as Extract<SemanticType, { kind: "record" }>).value,
          `${path}.value`,
          context,
        );
        return;
      case "object":
        this.compareProperties(
          before.properties,
          (after as Extract<SemanticType, { kind: "object" }>).properties,
          path,
          context,
        );
        return;
      case "named":
        this.compareDefinition(
          before.name,
          (after as Extract<SemanticType, { kind: "named" }>).name,
          path,
          context,
        );
        return;
      case "scalar": {
        const afterScalar = after as Extract<SemanticType, { kind: "scalar" }>;
        if (before.name !== afterScalar.name) {
          this.add(
            "breaking",
            "unknown",
            `${path}.name`,
            "built-in scalar type changed and cannot be classified safely",
            before.name,
            afterScalar.name,
          );
        }
        return;
      }
      case "literal": {
        const afterLiteral = after as Extract<SemanticType, { kind: "literal" }>;
        if (before.value !== afterLiteral.value) {
          this.add(
            "breaking",
            "changed",
            `${path}.value`,
            "a literal semantic value changed",
            before.value,
            afterLiteral.value,
          );
        }
        return;
      }
      case "nullable":
        this.compareType(
          before.type,
          (after as Extract<SemanticType, { kind: "nullable" }>).type,
          `${path}.type`,
          context,
        );
        return;
      default: {
        const exhaustive: never = before;
        this.add("breaking", "unknown", path, `unsupported semantic type ${exhaustive}`);
      }
    }
  }

  private compareAuxiliaryFields(before: unknown, after: unknown, path: string): void {
    if (Array.isArray(before) || Array.isArray(after)) {
      this.compareAuxiliaryArrays(before, after, path);
      return;
    }
    if (isRecord(before) || isRecord(after)) {
      this.compareAuxiliaryObjects(
        isRecord(before) ? before : {},
        isRecord(after) ? after : {},
        path,
      );
    }
  }

  private compareAuxiliaryArrays(before: unknown, after: unknown, path: string): void {
    if (!Array.isArray(before) || !Array.isArray(after)) return;
    const beforeItems = this.sortedAuxiliaryItems(before);
    const afterItems = this.sortedAuxiliaryItems(after);
    const count = Math.min(beforeItems.length, afterItems.length);
    for (let index = 0; index < count; index += 1) {
      const beforeItem = beforeItems[index];
      const afterItem = afterItems[index];
      if (beforeItem === undefined || afterItem === undefined) continue;
      this.compareAuxiliaryFields(beforeItem.value, afterItem.value, `${path}.${beforeItem.key}`);
    }
  }

  private sortedAuxiliaryItems(
    values: readonly unknown[],
  ): readonly { key: string; value: unknown }[] {
    return values
      .map((value, index) => ({
        key: isRecord(value) && typeof value.name === "string" ? value.name : String(index),
        value,
      }))
      .sort((left, right) => compareStrings(left.key, right.key));
  }

  private compareAuxiliaryObjects(
    before: Record<string, unknown>,
    after: Record<string, unknown>,
    path: string,
  ): void {
    const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
    for (const key of [...keys].sort(compareStrings)) {
      this.compareAuxiliaryKey(before, after, key, path);
    }
  }

  private compareAuxiliaryKey(
    before: Record<string, unknown>,
    after: Record<string, unknown>,
    key: string,
    path: string,
  ): void {
    const beforeHas = Object.hasOwn(before, key);
    const afterHas = Object.hasOwn(after, key);
    const beforeValue = before[key];
    const afterValue = after[key];
    const childPath = path === "" ? key : `${path}.${key}`;

    if (isDocumentationKey(key)) {
      this.compareDocumentationValue(beforeHas, afterHas, beforeValue, afterValue, childPath);
      return;
    }
    if (path === "provenance") {
      this.compareUnknownProvenanceValue(
        key,
        beforeHas,
        afterHas,
        beforeValue,
        afterValue,
        childPath,
      );
      return;
    }
    if (isManifestMetadataKey(key)) return;
    if (key === "provenance") {
      this.compareAuxiliaryFields(beforeValue, afterValue, childPath);
      return;
    }

    const known = this.isKnownKey(before, key, path) || this.isKnownKey(after, key, path);
    if (!known) {
      this.compareUnknownAuxiliaryValue(beforeHas, afterHas, beforeValue, afterValue, childPath);
      return;
    }
    if (beforeHas && afterHas) this.compareAuxiliaryFields(beforeValue, afterValue, childPath);
  }

  private compareDocumentationValue(
    beforeHas: boolean,
    afterHas: boolean,
    beforeValue: unknown,
    afterValue: unknown,
    path: string,
  ): void {
    if (beforeHas && afterHas && sameValue(beforeValue, afterValue)) return;
    this.add(
      "documentation",
      differenceKindForPresence(beforeHas, afterHas),
      path,
      "documentation text changed",
      beforeValue,
      afterValue,
    );
  }

  private compareUnknownProvenanceValue(
    key: string,
    beforeHas: boolean,
    afterHas: boolean,
    beforeValue: unknown,
    afterValue: unknown,
    path: string,
  ): void {
    if (provenanceKeySet.has(key)) return;
    if (beforeHas && afterHas && sameValue(beforeValue, afterValue)) return;
    this.add(
      "tooling-provenance",
      differenceKindForPresence(beforeHas, afterHas),
      path,
      "an unrecognized tooling provenance value changed",
      beforeValue,
      afterValue,
    );
  }

  private compareUnknownAuxiliaryValue(
    beforeHas: boolean,
    afterHas: boolean,
    beforeValue: unknown,
    afterValue: unknown,
    path: string,
  ): void {
    if (beforeHas && afterHas && sameValue(beforeValue, afterValue)) return;
    this.add(
      "breaking",
      "unknown",
      `manifest.${path}`,
      "an unknown manifest field changed and is rejected closed",
      beforeValue,
      afterValue,
    );
  }

  private isKnownKey(value: Record<string, unknown>, key: string, path: string): boolean {
    if (isDocumentationKey(key)) return true;
    if (path === "") return rootManifestKeys.has(key);
    if (path === "provenance") return true;
    if (path.endsWith(".constraints")) return constraintKeys.includes(key as ConstraintKey);

    return isKnownStructuredKey(value, key);
  }
}

const emptyByCategory = (): Record<SemanticDifferenceCategory, readonly SemanticDifference[]> => ({
  breaking: [],
  additive: [],
  documentation: [],
  "tooling-provenance": [],
});

const unknownComparison = (error: unknown): SemanticComparison => {
  const message = error instanceof Error ? error.message : "unknown comparator failure";
  const difference: SemanticDifference = {
    category: "breaking",
    kind: "unknown",
    path: "manifest",
    message: `compatibility comparison failed closed: ${message}`,
  };
  return {
    differences: [difference],
    byCategory: { ...emptyByCategory(), breaking: [difference] },
    hasBreakingDifferences: true,
    hasSemanticDifferences: true,
    requiresReview: true,
  };
};

/** Compare two normalized manifests without inferring semantic-version ordering. */
export const compareSemanticManifests = (
  baseline: SemanticManifest,
  candidate: SemanticManifest,
): SemanticComparison => {
  try {
    return new ManifestComparator(baseline, candidate).compare();
  } catch (error) {
    return unknownComparison(error);
  }
};

const hasNonEmptyIntent = (value: string | undefined): boolean =>
  typeof value === "string" && value.trim().length > 0;

/** Apply opaque revision, migration, and replacement-lineage coupling rules. */
export const checkManifestCompatibility = (
  baseline: SemanticManifest,
  candidate: SemanticManifest,
  evidence: CompatibilityEvidence = {},
): ManifestCompatibility => {
  const comparison = compareSemanticManifests(baseline, candidate);
  const identityChanged = baseline.externalContractIdentity !== candidate.externalContractIdentity;
  const revisionChanged = baseline.compatibilityRevision !== candidate.compatibilityRevision;
  const hasBreaking = comparison.hasBreakingDifferences;
  const hasAdditive = comparison.byCategory.additive.length > 0;
  const migrationIntent = hasNonEmptyIntent(evidence.migrationIntent);
  const replacementLineageIntent = hasNonEmptyIntent(evidence.replacementLineageIntent);
  const violations: CompatibilityViolation[] = [];

  if (hasBreaking) {
    if (!revisionChanged) {
      violations.push({
        code: "silent-breaking-change",
        message:
          "breaking semantic differences require a deliberate opaque compatibility revision change",
      });
    } else if (!migrationIntent) {
      violations.push({
        code: "missing-migration-intent",
        message: "a changed opaque compatibility revision requires reviewed migration-intent.md",
      });
    }
  } else if (revisionChanged) {
    violations.push({
      code: "revision-change-without-breaking-evidence",
      message:
        "an opaque compatibility revision cannot change without comparator breaking evidence",
    });
  }

  if (identityChanged && !replacementLineageIntent) {
    violations.push({
      code: "missing-replacement-lineage-intent",
      message: "an external contract identity change requires explicit replacement-lineage intent",
      path: "contract.externalContractIdentity",
    });
  }

  if (!hasBreaking && hasAdditive) {
    violations.push({
      code: "additive-change-requires-review",
      message: "additive request differences are review-blocking semantic drift",
    });
  }

  return {
    ...comparison,
    accepted: violations.length === 0,
    identityChanged,
    revisionChanged,
    violations,
  };
};

export const compareManifests = compareSemanticManifests;
export const checkCompatibility = checkManifestCompatibility;
export const evaluateManifestCompatibility = checkManifestCompatibility;

export type { SemanticManifest } from "./manifest-model.js";
