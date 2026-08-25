export const externalOperationIdentifiers = [
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

export type ExternalOperation = (typeof externalOperationIdentifiers)[number];

export const externalResourceLifecycles = ["ACTIVE", "INACTIVE", "ALL"] as const;
export type ExternalResourceLifecycle = (typeof externalResourceLifecycles)[number];

export type ExternalGetTaxonomyRequest = Record<never, never>;

export type ExternalGetEffectiveResourceSchemaRequest = {
  readonly classCode: string;
  readonly familyCode: string;
  readonly typeCode: string;
};

export type ExternalGetValidOptionsRequest = { readonly attributeCode: string };
export type ExternalGetNaturalUnitsRequest = { readonly familyCode: string };
export type ExternalGetResourceRequest = { readonly resourceId: string };

export type ExternalSearchResourcesRequest = {
  readonly terms: string;
  readonly lifecycle?: ExternalResourceLifecycle;
  readonly limit?: number;
  readonly cursor?: string | null;
};

export type ExternalDescribeResourceRequest = { readonly resourceId: string };

export type ExternalQuantity = { readonly magnitude: string; readonly unitCode: string };
export type ExternalAttributeValue = string | boolean | ExternalQuantity;

export type ExternalCreateResourceRequest = {
  readonly classCode: string;
  readonly familyCode: string;
  readonly typeCode: string;
  readonly naturalUnitCode: string;
  readonly attributes: Readonly<Record<string, ExternalAttributeValue>>;
};

export type ExternalUpdateNonIdentityDataRequest = {
  readonly resourceId: string;
  readonly expectedRevision: number;
  readonly naturalUnitCode: string;
};

export type ExternalDeactivateResourceRequest = {
  readonly resourceId: string;
  readonly expectedRevision: number;
};

export interface ExternalRequests {
  readonly getTaxonomy: ExternalGetTaxonomyRequest;
  readonly getEffectiveResourceSchema: ExternalGetEffectiveResourceSchemaRequest;
  readonly getValidOptions: ExternalGetValidOptionsRequest;
  readonly getNaturalUnits: ExternalGetNaturalUnitsRequest;
  readonly getResource: ExternalGetResourceRequest;
  readonly searchResources: ExternalSearchResourcesRequest;
  readonly describeResource: ExternalDescribeResourceRequest;
  readonly createResource: ExternalCreateResourceRequest;
  readonly updateNonIdentityData: ExternalUpdateNonIdentityDataRequest;
  readonly deactivateResource: ExternalDeactivateResourceRequest;
}

export type ExternalRequest<K extends ExternalOperation> = ExternalRequests[K];

type ExternalCodeName = { readonly code: string; readonly name: string };
export type ExternalTaxonomyType = ExternalCodeName;
export type ExternalTaxonomyFamily = ExternalCodeName & {
  readonly types: readonly ExternalTaxonomyType[];
};
export type ExternalTaxonomyEntry = ExternalCodeName & {
  readonly families: readonly ExternalTaxonomyFamily[];
};
export type ExternalTaxonomy = readonly ExternalTaxonomyEntry[];

export const externalSchemaResultModes = [
  "REQUIRED",
  "OPTIONAL",
  "FORBIDDEN",
  "NOT_APPLICABLE",
] as const;
export type ExternalSchemaResultMode = (typeof externalSchemaResultModes)[number];

export const externalAttributeKinds = [
  "CONTROLLED_OPTION",
  "INTEGER",
  "DECIMAL",
  "BOOLEAN",
  "CONTROLLED_TEXT",
  "QUANTITY",
] as const;
export type ExternalAttributeKind = (typeof externalAttributeKinds)[number];

export type ExternalSchemaResult = {
  readonly mode: ExternalSchemaResultMode;
  readonly identity: boolean;
};
export type ExternalSchemaRule = {
  readonly when: { readonly attributeCode: string; readonly optionCode: string };
  readonly result: ExternalSchemaResult;
};
export type ExternalEffectiveAttribute = {
  readonly code: string;
  readonly name: string;
  readonly kind: ExternalAttributeKind;
  readonly meaning: string;
  readonly defaultResult: ExternalSchemaResult;
  readonly rules: readonly ExternalSchemaRule[];
};
export type ExternalEffectiveResourceSchema = {
  readonly attributes: readonly ExternalEffectiveAttribute[];
};
export type ExternalOption = { readonly code: string; readonly label: string };
export type ExternalValidOptions = readonly ExternalOption[];
export type ExternalNaturalUnit = ExternalCodeName;
export type ExternalNaturalUnits = {
  readonly allowed: readonly ExternalNaturalUnit[];
  readonly suggested: ExternalNaturalUnit;
};
export type ExternalResourceAttribute = {
  readonly attributeCode: string;
  readonly value: ExternalAttributeValue;
  readonly displayValue: string;
  readonly identityParticipating: boolean;
};
export type ExternalResource = {
  readonly resourceId: string;
  readonly classCode: string;
  readonly familyCode: string;
  readonly typeCode: string;
  readonly naturalUnitCode: string;
  readonly attributes: readonly ExternalResourceAttribute[];
  readonly canonicalIdentity: string;
  readonly identityPolicyVersion: "v1";
  readonly active: boolean;
  readonly revision: number;
};
export type ExternalResourceSummary = {
  readonly resourceId: string;
  readonly classCode: string;
  readonly className: string;
  readonly familyCode: string;
  readonly familyName: string;
  readonly typeCode: string;
  readonly typeName: string;
  readonly naturalUnitCode: string;
  readonly description: string;
  readonly optionCodes: readonly string[];
  readonly optionLabels: readonly string[];
  readonly values: readonly string[];
};
export type ExternalSearchResourcesResult = {
  readonly items: readonly ExternalResourceSummary[];
  readonly cursor: string | null;
};
export type ExternalResourceDescription = {
  readonly resourceId: string;
  readonly description: string;
};

export interface ExternalSuccesses {
  readonly getTaxonomy: ExternalTaxonomy;
  readonly getEffectiveResourceSchema: ExternalEffectiveResourceSchema;
  readonly getValidOptions: ExternalValidOptions;
  readonly getNaturalUnits: ExternalNaturalUnits;
  readonly getResource: ExternalResource;
  readonly searchResources: ExternalSearchResourcesResult;
  readonly describeResource: ExternalResourceDescription;
  readonly createResource: ExternalResource;
  readonly updateNonIdentityData: ExternalResource;
  readonly deactivateResource: ExternalResource;
}

export type ExternalSuccess<K extends ExternalOperation> = ExternalSuccesses[K];

export const externalErrorCodes = [
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "INVALID_ARGUMENT",
  "INVALID_REFERENCE",
  "VALIDATION_FAILED",
  "NOT_FOUND",
  "DUPLICATE",
  "CONFLICT",
  "INVALID_LIFECYCLE",
  "CATALOG_UNAVAILABLE",
  "INTERNAL_FAILURE",
] as const;

export type ExternalErrorCode = (typeof externalErrorCodes)[number];

export const externalFieldIssueReasons = [
  "REQUIRED",
  "TYPE",
  "UNKNOWN_FIELD",
  "OUT_OF_RANGE",
  "INVALID_VALUE",
] as const;

export type ExternalFieldIssueReason = (typeof externalFieldIssueReasons)[number];

export interface ExternalFieldIssue {
  readonly path: string;
  readonly reason: ExternalFieldIssueReason;
}

type ExternalFieldIssueErrorCode = "INVALID_ARGUMENT" | "INVALID_REFERENCE" | "VALIDATION_FAILED";

type ExternalFieldIssueError = {
  [Code in ExternalFieldIssueErrorCode]: {
    readonly code: Code;
    readonly fieldIssues?: readonly ExternalFieldIssue[];
  };
}[ExternalFieldIssueErrorCode];

export type ExternalError =
  | ExternalFieldIssueError
  | { readonly code: "UNAUTHENTICATED" }
  | { readonly code: "FORBIDDEN" }
  | { readonly code: "NOT_FOUND" }
  | { readonly code: "DUPLICATE"; readonly existingResourceId?: string }
  | { readonly code: "CONFLICT"; readonly currentRevision?: number }
  | { readonly code: "INVALID_LIFECYCLE" }
  | { readonly code: "CATALOG_UNAVAILABLE" }
  | { readonly code: "INTERNAL_FAILURE" };

export type ExternalFailure = {
  readonly ok: false;
  readonly error: ExternalError;
};

export type ExternalOutcome<K extends ExternalOperation> =
  | { readonly ok: true; readonly value: ExternalSuccess<K> }
  | ExternalFailure;
