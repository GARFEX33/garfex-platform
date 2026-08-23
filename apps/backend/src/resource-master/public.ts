export const resourceErrorCodes = [
  "INVALID_ARGUMENT",
  "NOT_FOUND",
  "DUPLICATE",
  "INVALID_REFERENCE",
  "VALIDATION",
  "CONFLICT",
  "INVALID_LIFECYCLE",
  "INTEGRITY",
  "INTERNAL",
] as const;
export type ResourceErrorCode = (typeof resourceErrorCodes)[number];

export interface ResourceError {
  readonly code: ResourceErrorCode;
  readonly message: string;
  readonly details?: string[];
  readonly existingResourceId?: string;
  readonly currentRevision?: number;
}
export type Result<T> =
  | { readonly ok: true; readonly value: T }
  | { readonly ok: false; readonly error: ResourceError };

export interface CreateResourceInput {
  readonly classCode: string;
  readonly familyCode: string;
  readonly typeCode: string;
  readonly naturalUnitCode: string;
  readonly attributes: Readonly<Record<string, unknown>>;
}
export interface UpdateNonIdentityDataInput {
  readonly resourceId: string;
  readonly expectedRevision: number;
  readonly naturalUnitCode: string;
}
export interface DeactivateResourceInput {
  readonly resourceId: string;
  readonly expectedRevision: number;
}
export type ResourceLifecycleFilter = "ACTIVE" | "INACTIVE" | "ALL";

export interface TaxonomyView {
  readonly code: string;
  readonly name: string;
  readonly families: {
    readonly code: string;
    readonly name: string;
    readonly types: { readonly code: string; readonly name: string }[];
  }[];
}
export interface EffectiveAttributeView {
  readonly code: string;
  readonly name: string;
  readonly kind:
    | "CONTROLLED_OPTION"
    | "INTEGER"
    | "DECIMAL"
    | "BOOLEAN"
    | "CONTROLLED_TEXT"
    | "QUANTITY";
  readonly meaning: string;
  readonly defaultResult: {
    readonly mode: "REQUIRED" | "OPTIONAL" | "FORBIDDEN" | "NOT_APPLICABLE";
    readonly identity: boolean;
  };
  readonly rules: {
    readonly when: { readonly attributeCode: string; readonly optionCode: string };
    readonly result: {
      readonly mode: "REQUIRED" | "OPTIONAL" | "FORBIDDEN" | "NOT_APPLICABLE";
      readonly identity: boolean;
    };
  }[];
}
export interface ResourceAttributeView {
  readonly attributeCode: string;
  readonly value: string | boolean | { readonly magnitude: string; readonly unitCode: string };
  readonly displayValue: string;
  readonly identityParticipating: boolean;
}
export interface ResourceView {
  readonly resourceId: string;
  readonly classCode: string;
  readonly familyCode: string;
  readonly typeCode: string;
  readonly naturalUnitCode: string;
  readonly attributes: ResourceAttributeView[];
  readonly canonicalIdentity: string;
  readonly identityPolicyVersion: "v1";
  readonly active: boolean;
  readonly revision: number;
}
export interface ResourceSummary {
  readonly resourceId: string;
  readonly classCode: string;
  readonly className: string;
  readonly familyCode: string;
  readonly familyName: string;
  readonly typeCode: string;
  readonly typeName: string;
  readonly naturalUnitCode: string;
  readonly description: string;
  readonly optionCodes: string[];
  readonly optionLabels: string[];
  readonly values: string[];
}

export interface ResourceMaster {
  getTaxonomy(): Promise<Result<TaxonomyView[]>>;
  getEffectiveResourceSchema(input: {
    readonly classCode: string;
    readonly familyCode: string;
    readonly typeCode: string;
  }): Promise<Result<{ readonly attributes: EffectiveAttributeView[] }>>;
  getValidOptions(input: {
    readonly attributeCode: string;
  }): Promise<Result<{ readonly code: string; readonly label: string }[]>>;
  getNaturalUnits(input: { readonly familyCode: string }): Promise<
    Result<{
      readonly allowed: { readonly code: string; readonly name: string }[];
      readonly suggested: { readonly code: string; readonly name: string };
    }>
  >;
  createResource(input: CreateResourceInput): Promise<Result<ResourceView>>;
  updateNonIdentityData(input: UpdateNonIdentityDataInput): Promise<Result<ResourceView>>;
  deactivateResource(input: DeactivateResourceInput): Promise<Result<ResourceView>>;
  getResource(input: { readonly resourceId: string }): Promise<Result<ResourceView>>;
  searchResources(input: {
    readonly terms: string;
    readonly lifecycle?: ResourceLifecycleFilter;
    readonly limit?: number;
    readonly cursor?: string | null;
  }): Promise<Result<{ readonly items: ResourceSummary[]; readonly cursor: string | null }>>;
  describeResource(input: {
    readonly resourceId: string;
  }): Promise<Result<{ readonly resourceId: string; readonly description: string }>>;
}
