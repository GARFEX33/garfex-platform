/**
 * Internal schema revision for the manifest interchange. This is deliberately
 * separate from the opaque consumer compatibility revision authored in TypeSpec.
 */
export const MANIFEST_SCHEMA_REVISION = 1;

/**
 * The reviewed display order for the closed external operation set. Canonical
 * serialization uses this order rather than compiler, filesystem, or insertion order.
 */
export const canonicalOperationOrder = [
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

export interface ScalarConstraints {
  readonly maxItems?: number;
  readonly maxLength?: number;
  readonly maxValue?: number;
  readonly minItems?: number;
  readonly minLength?: number;
  readonly minValue?: number;
  readonly pattern?: string;
}

export type SemanticType =
  | { readonly kind: "array"; readonly element: SemanticType }
  | { readonly kind: "literal"; readonly value: boolean | null | number | string }
  | { readonly kind: "object"; readonly properties: readonly ModelPropertyDefinition[] }
  | { readonly kind: "named"; readonly name: string }
  | { readonly kind: "nullable"; readonly type: SemanticType }
  | { readonly kind: "record"; readonly value: SemanticType }
  | { readonly kind: "scalar"; readonly name: string };

export interface ModelPropertyDefinition {
  readonly name: string;
  readonly optional: boolean;
  readonly type: SemanticType;
}

export interface ModelDefinition {
  readonly name: string;
  readonly properties: readonly ModelPropertyDefinition[];
  readonly indexer?: { readonly value: SemanticType };
}

export interface ScalarDefinition {
  readonly base: string;
  readonly constraints: ScalarConstraints;
  readonly name: string;
}

export interface EnumDefinition {
  readonly name: string;
  readonly values: readonly (string | number)[];
}

export interface UnionVariantDefinition {
  readonly name: string;
  readonly type: SemanticType;
}

export interface UnionDefinition {
  readonly name: string;
  readonly variants: readonly UnionVariantDefinition[];
}

export interface OperationDefinition {
  readonly failure: string;
  readonly name: string;
  readonly outcome: string;
  readonly request: string;
  readonly success: string;
}

/**
 * Reproducibility inputs for a generated manifest. Source bytes are normalized
 * and hashed; compiler, emitter, and canonicalized options identify the toolchain
 * without including timestamps, absolute paths, machine names, or AST locations.
 */
export interface ManifestProvenance {
  readonly compilerVersion: string;
  readonly emitterOptionsDigest: string;
  readonly emitterVersion: string;
  readonly sourceDigest: string;
}

/**
 * The sole downstream semantic interchange emitted by this package. The manifest
 * is generated output, not a second authority: TypeSpec owns identity, revision,
 * operations, models, constraints, and failures. Runtime/docs materializers may
 * consume this shape but must not read backend sources or infer additional fields.
 */
export interface SemanticManifest {
  readonly compatibilityRevision: string;
  readonly enums: readonly EnumDefinition[];
  readonly externalContractIdentity: string;
  readonly models: readonly ModelDefinition[];
  readonly operations: readonly OperationDefinition[];
  readonly provenance: ManifestProvenance;
  readonly scalars: readonly ScalarDefinition[];
  readonly schemaRevision: number;
  readonly unions: readonly UnionDefinition[];
}

const operationRank: ReadonlyMap<string, number> = new Map(
  canonicalOperationOrder.map((name, index) => [name, index]),
);

const compareStrings = (left: string, right: string): number => left.localeCompare(right, "en");

const compareNamed = (left: unknown, right: unknown): number => {
  const leftName =
    typeof left === "object" && left !== null && "name" in left ? left.name : undefined;
  const rightName =
    typeof right === "object" && right !== null && "name" in right ? right.name : undefined;
  return typeof leftName === "string" && typeof rightName === "string"
    ? compareStrings(leftName, rightName)
    : 0;
};

const compareOperations = (left: unknown, right: unknown): number => {
  const leftName = asName(left);
  const rightName = asName(right);
  const leftRank =
    leftName === undefined
      ? Number.MAX_SAFE_INTEGER
      : (operationRank.get(leftName) ?? Number.MAX_SAFE_INTEGER);
  const rightRank =
    rightName === undefined
      ? Number.MAX_SAFE_INTEGER
      : (operationRank.get(rightName) ?? Number.MAX_SAFE_INTEGER);
  return leftRank - rightRank || compareStrings(leftName ?? "", rightName ?? "");
};

const asName = (value: unknown): string | undefined => {
  if (typeof value !== "object" || value === null || !("name" in value)) return undefined;
  const name = value.name;
  return typeof name === "string" ? name : undefined;
};

const arrayComparatorFor = (
  key: string,
): ((left: unknown, right: unknown) => number) | undefined => {
  if (key === "operations") return compareOperations;
  if (key === "models" || key === "scalars" || key === "enums" || key === "unions")
    return compareNamed;
  if (key === "properties" || key === "variants") return compareNamed;
  if (key === "values") {
    return (left, right) => compareStrings(String(left), String(right));
  }
  return undefined;
};

const canonicalizeValue = (value: unknown, key = ""): unknown => {
  if (Array.isArray(value)) {
    const values = value.map((item) => canonicalizeValue(item));
    const comparator = arrayComparatorFor(key);
    return comparator === undefined ? values : values.sort(comparator);
  }
  if (typeof value !== "object" || value === null) return value;

  const record = value as Record<string, unknown>;
  return Object.fromEntries(
    Object.keys(record)
      .sort(compareStrings)
      .map((property) => [property, canonicalizeValue(record[property], property)]),
  );
};

/**
 * Recursively canonicalize a manifest-like value using stable object-key and
 * semantic-array ordering. This helper is intentionally independent of TypeSpec
 * source parsing and backend reads so determinism can be tested in isolation.
 */
export const canonicalizeManifest = <T extends object>(manifest: T): T =>
  canonicalizeValue(manifest) as T;

/**
 * Canonical manifest bytes: UTF-8 JSON, two-space indentation, and one LF
 * terminator. The emitter passes these bytes to TypeSpec's `emitFile`; it does
 * not write the generated-file boundary directly.
 */
export const serializeManifest = (manifest: object): string =>
  `${JSON.stringify(canonicalizeManifest(manifest), null, 2)}\n`;
