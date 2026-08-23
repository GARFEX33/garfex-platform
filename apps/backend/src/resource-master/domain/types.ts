export const attributeKinds = [
  "CONTROLLED_OPTION",
  "INTEGER",
  "DECIMAL",
  "BOOLEAN",
  "CONTROLLED_TEXT",
  "QUANTITY",
] as const;
export type AttributeKind = (typeof attributeKinds)[number];

export const applicabilityModes = ["REQUIRED", "OPTIONAL", "FORBIDDEN", "NOT_APPLICABLE"] as const;
export type ApplicabilityMode = (typeof applicabilityModes)[number];

export interface ApplicabilityResult {
  readonly mode: ApplicabilityMode;
  readonly identity: boolean;
}

export interface ApplicabilityRule {
  readonly when: { readonly attributeCode: string; readonly optionCode: string };
  readonly result: ApplicabilityResult;
}

export interface ApplicabilityBinding {
  readonly id: string;
  readonly scope: "FAMILY" | "TYPE";
  readonly ownerCode: string;
  readonly attributeCode: string;
  readonly active: boolean;
  readonly defaultResult: ApplicabilityResult;
  readonly rules: readonly ApplicabilityRule[];
  readonly optionSetCode?: string;
  readonly quantityUnitCodes?: readonly string[];
  readonly displayOrder?: number;
}

export interface AttributeDefinition {
  readonly code: string;
  readonly name: string;
  readonly kind: AttributeKind;
  readonly meaning: string;
  readonly active: boolean;
}

export interface CatalogOption {
  readonly code: string;
  readonly label: string;
  readonly active: boolean;
}

export interface OptionSet {
  readonly code: string;
  readonly attributeCode: string;
  readonly active: boolean;
  readonly options: readonly CatalogOption[];
}

export interface NaturalUnit {
  readonly code: string;
  readonly name: string;
  readonly active: boolean;
}

export interface ResourceCatalog {
  readonly classDefinition: {
    readonly code: string;
    readonly name: string;
    readonly active: boolean;
  };
  readonly family: {
    readonly code: string;
    readonly name: string;
    readonly classCode: string;
    readonly active: boolean;
    readonly allowedNaturalUnitCodes: readonly string[];
    readonly suggestedNaturalUnitCode: string;
  };
  readonly type: {
    readonly code: string;
    readonly name: string;
    readonly familyCode: string;
    readonly active: boolean;
  };
  readonly attributes: readonly AttributeDefinition[];
  readonly optionSets: readonly OptionSet[];
  readonly naturalUnits: readonly NaturalUnit[];
  readonly bindings: readonly ApplicabilityBinding[];
  readonly presentation: {
    readonly attributeOrder: readonly string[];
    readonly includeNaturalUnit: boolean;
  };
}

export interface CanonicalValue {
  readonly identity: string;
  readonly display: string;
  readonly stored: string | boolean | { readonly magnitude: string; readonly unitCode: string };
}

export interface PersistedAttribute {
  readonly attributeCode: string;
  readonly kind: AttributeKind;
  readonly canonicalIdentity: string;
  readonly displayValue: string;
  readonly storedValue: CanonicalValue["stored"];
  readonly identityParticipating: boolean;
}

export interface PersistedResource {
  readonly resourceId: string;
  readonly classCode: string;
  readonly familyCode: string;
  readonly typeCode: string;
  readonly naturalUnitCode: string;
  readonly attributes: readonly PersistedAttribute[];
  readonly canonicalIdentity: string;
  readonly identityPolicyVersion: "v1";
  readonly active: true;
  readonly revision: number;
  readonly searchProjection: string;
}
