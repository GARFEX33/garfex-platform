import { semanticManifest } from "./generated/semantic-contract.generated.js";

export {
  compatibilityRevision,
  contractMetadata,
  enums,
  externalContractIdentity,
  manifestDigest,
  models,
  operations,
  scalars,
  schemaRevision,
  semanticManifest,
  unions,
} from "./generated/semantic-contract.generated.js";

/** The generated manifest's recursive schema algebra, kept separate from values. */
type GeneratedSemanticType =
  | { readonly kind: "array"; readonly element: GeneratedSemanticType }
  | { readonly kind: "literal"; readonly value: boolean | null | number | string }
  | { readonly kind: "object"; readonly properties: readonly GeneratedProperty[] }
  | { readonly kind: "named"; readonly name: string }
  | { readonly kind: "nullable"; readonly type: GeneratedSemanticType }
  | { readonly kind: "record"; readonly value: GeneratedSemanticType }
  | { readonly kind: "scalar"; readonly name: string };

type GeneratedProperty = {
  readonly name: string;
  readonly optional: boolean;
  readonly type: GeneratedSemanticType;
};

type GeneratedModel = {
  readonly name: string;
  readonly properties: readonly GeneratedProperty[];
  readonly indexer?: { readonly value: GeneratedSemanticType } | null;
};

type GeneratedUnion = {
  readonly name: string;
  readonly variants: readonly {
    readonly name: string;
    readonly type: GeneratedSemanticType;
  }[];
};

type GeneratedManifest = typeof semanticManifest;
type ManifestModels = GeneratedManifest["models"];
type ManifestEnums = GeneratedManifest["enums"];
type ManifestUnions = GeneratedManifest["unions"];
type ManifestScalars = GeneratedManifest["scalars"];

type DefinitionByName<
  Definitions extends readonly { readonly name: string }[],
  Name extends string,
> = Extract<Definitions[number], { readonly name: Name }>;

type ManifestModelByName<Name extends string> = DefinitionByName<ManifestModels, Name>;
type ManifestEnumByName<Name extends string> = DefinitionByName<ManifestEnums, Name>;
type ManifestUnionByName<Name extends string> = DefinitionByName<ManifestUnions, Name>;
type ManifestScalarByName<Name extends string> = DefinitionByName<ManifestScalars, Name>;

type GeneratedScalarValue<Base extends string> = Base extends "boolean"
  ? boolean
  : Base extends "string"
    ? string
    : number;
type GeneratedTypeDepth = 12;
type PreviousGeneratedDepth<Depth extends number> = Depth extends 12
  ? 11
  : Depth extends 11
    ? 10
    : Depth extends 10
      ? 9
      : Depth extends 9
        ? 8
        : Depth extends 8
          ? 7
          : Depth extends 7
            ? 6
            : Depth extends 6
              ? 5
              : Depth extends 5
                ? 4
                : Depth extends 4
                  ? 3
                  : Depth extends 3
                    ? 2
                    : Depth extends 2
                      ? 1
                      : 0;

type GeneratedProperties<
  Properties extends readonly GeneratedProperty[],
  Depth extends number = GeneratedTypeDepth,
> = {
  [Property in Properties[number] as Property["optional"] extends false
    ? Property["name"]
    : never]: GeneratedValue<Property["type"], Depth>;
} & {
  [Property in Properties[number] as Property["optional"] extends true
    ? Property["name"]
    : never]?: GeneratedValue<Property["type"], Depth>;
};

type GeneratedModelValue<
  Model extends GeneratedModel,
  Depth extends number = GeneratedTypeDepth,
> = GeneratedProperties<Model["properties"], Depth> &
  (Model["indexer"] extends { readonly value: infer Value extends GeneratedSemanticType }
    ? Readonly<Record<string, GeneratedValue<Value, Depth>>>
    : unknown);

type GeneratedUnionValue<
  Union extends GeneratedUnion,
  Depth extends number = GeneratedTypeDepth,
> = GeneratedValue<Union["variants"][number]["type"], Depth>;

type GeneratedNamed<Name extends string, Depth extends number = GeneratedTypeDepth> = [
  ManifestModelByName<Name>,
] extends [never]
  ? [ManifestEnumByName<Name>] extends [never]
    ? [ManifestUnionByName<Name>] extends [never]
      ? [ManifestScalarByName<Name>] extends [never]
        ? never
        : GeneratedScalarValue<ManifestScalarByName<Name>["base"]>
      : GeneratedUnionValue<ManifestUnionByName<Name>, Depth>
    : ManifestEnumByName<Name>["values"][number]
  : GeneratedModelValue<ManifestModelByName<Name>, Depth>;

type GeneratedValue<
  Definition extends GeneratedSemanticType,
  Depth extends number = GeneratedTypeDepth,
> = Depth extends 0
  ? unknown
  : Definition extends {
        readonly kind: "array";
        readonly element: infer Element extends GeneratedSemanticType;
      }
    ? GeneratedValue<Element, PreviousGeneratedDepth<Depth>>[]
    : Definition extends { readonly kind: "literal"; readonly value: infer Value }
      ? Value
      : Definition extends {
            readonly kind: "object";
            readonly properties: infer Properties extends readonly GeneratedProperty[];
          }
        ? GeneratedProperties<Properties, PreviousGeneratedDepth<Depth>>
        : Definition extends { readonly kind: "named"; readonly name: infer Name extends string }
          ? GeneratedNamed<Name, PreviousGeneratedDepth<Depth>>
          : Definition extends {
                readonly kind: "nullable";
                readonly type: infer NullableType extends GeneratedSemanticType;
              }
            ? GeneratedValue<NullableType, PreviousGeneratedDepth<Depth>> | null
            : Definition extends {
                  readonly kind: "record";
                  readonly value: infer RecordValue extends GeneratedSemanticType;
                }
              ? Readonly<Record<string, GeneratedValue<RecordValue, PreviousGeneratedDepth<Depth>>>>
              : Definition extends {
                    readonly kind: "scalar";
                    readonly name: infer Name extends string;
                  }
                ? GeneratedScalarValue<Name>
                : never;

type GeneratedOperation = GeneratedManifest["operations"][number];
type EnumValues<Name extends string> = Extract<
  GeneratedManifest["enums"][number],
  { readonly name: Name }
>["values"][number];

export type ExternalOperation = GeneratedOperation["name"];

type OperationDefinition<Operation extends ExternalOperation> = Extract<
  GeneratedOperation,
  { readonly name: Operation }
>;
type OperationRequestName<Operation extends ExternalOperation> =
  OperationDefinition<Operation>["request"];
type OperationSuccessName<Operation extends ExternalOperation> =
  OperationDefinition<Operation>["success"];

export const externalOperationIdentifiers = Object.freeze(
  semanticManifest.operations.map(({ name }) => name),
);

export type ExternalResourceLifecycle = EnumValues<"ResourceLifecycleFilter">;
export type ExternalSchemaResultMode = EnumValues<"ApplicabilityMode">;
export type ExternalAttributeKind = EnumValues<"AttributeKind">;
export type ExternalErrorCode = EnumValues<"ExternalFailureCode">;
export type ExternalFieldIssueReason =
  | EnumValues<"FieldIssueReason">
  | "TYPE"
  | "UNKNOWN_FIELD"
  | "INVALID_VALUE";

type StringEnumValue<Name extends string> = Extract<EnumValues<Name>, string>;

const generatedStringValue = <Name extends string>(
  name: Name,
  value: unknown,
): value is StringEnumValue<Name> => {
  if (typeof value !== "string") return false;
  const definition = semanticManifest.enums.find((candidate) => candidate.name === name);
  return definition?.values.some((candidate) => candidate === value) ?? false;
};

const generatedStringEnum = <Name extends string>(name: Name): readonly StringEnumValue<Name>[] => {
  const definition = semanticManifest.enums.find((candidate) => candidate.name === name);
  if (definition === undefined) throw new Error(`missing generated enum ${name}`);
  const values: StringEnumValue<Name>[] = [];
  for (const value of definition.values) {
    if (!generatedStringValue(name, value)) {
      throw new Error(`generated enum ${name} is not string-valued`);
    }
    values.push(value);
  }
  return Object.freeze(values);
};

export const externalResourceLifecycles = generatedStringEnum("ResourceLifecycleFilter");
export const externalSchemaResultModes = generatedStringEnum("ApplicabilityMode");
export const externalAttributeKinds = generatedStringEnum("AttributeKind");
const generatedExternalErrorCodes = generatedStringEnum("ExternalFailureCode");
const compatibilityErrorOrder: readonly ExternalErrorCode[] = [
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
];
const orderedErrorCodes: ExternalErrorCode[] = [];
for (const value of compatibilityErrorOrder) {
  if (generatedExternalErrorCodes.some((candidate) => candidate === value)) {
    orderedErrorCodes.push(value);
  }
}
for (const value of generatedExternalErrorCodes) {
  if (!compatibilityErrorOrder.some((candidate) => candidate === value)) {
    orderedErrorCodes.push(value);
  }
}
export const externalErrorCodes = Object.freeze(orderedErrorCodes);
export const externalFieldIssueReasons = generatedStringEnum("FieldIssueReason");

export type GeneratedExternalRequest<Operation extends ExternalOperation> = GeneratedNamed<
  OperationRequestName<Operation>
>;

export type GeneratedExternalSuccess<Operation extends ExternalOperation> = GeneratedNamed<
  OperationSuccessName<Operation>
>;

export type ExternalRequests = {
  readonly [Operation in ExternalOperation]: GeneratedExternalRequest<Operation>;
};

export type ExternalRequest<Operation extends ExternalOperation> = ExternalRequests[Operation];

export type ExternalSuccesses = {
  readonly [Operation in ExternalOperation]: GeneratedExternalSuccess<Operation>;
};

export type ExternalSuccess<Operation extends ExternalOperation> = ExternalSuccesses[Operation];

export type ExternalGetTaxonomyRequest = ExternalRequests["getTaxonomy"];
export type ExternalGetEffectiveResourceSchemaRequest =
  ExternalRequests["getEffectiveResourceSchema"];
export type ExternalGetValidOptionsRequest = ExternalRequests["getValidOptions"];
export type ExternalGetNaturalUnitsRequest = ExternalRequests["getNaturalUnits"];
export type ExternalGetResourceRequest = ExternalRequests["getResource"];
export type ExternalSearchResourcesRequest = ExternalRequests["searchResources"];
export type ExternalDescribeResourceRequest = ExternalRequests["describeResource"];
export type ExternalCreateResourceRequest = ExternalRequests["createResource"];
export type ExternalUpdateNonIdentityDataRequest = ExternalRequests["updateNonIdentityData"];
export type ExternalDeactivateResourceRequest = ExternalRequests["deactivateResource"];

export type ExternalTaxonomyType = GeneratedNamed<"TaxonomyType">;
export type ExternalTaxonomyFamily = GeneratedNamed<"TaxonomyFamily">;
export type ExternalTaxonomy = GeneratedNamed<"Taxonomy">;
export type ExternalEffectiveAttribute = GeneratedNamed<"EffectiveAttribute">;
export type ExternalEffectiveResourceSchema = GeneratedNamed<"GetEffectiveResourceSchemaSuccess">;
export type ExternalOption = GeneratedNamed<"Option">;
export type ExternalValidOptions = readonly ExternalOption[];
export type ExternalNaturalUnit = GeneratedNamed<"NaturalUnit">;
export type ExternalNaturalUnits = GeneratedNamed<"GetNaturalUnitsSuccess">;
export type ExternalQuantity = GeneratedNamed<"QuantityValue">;
export type ExternalAttributeValue = GeneratedNamed<"AttributeValue">;
export type GeneratedExternalResourceAttribute = GeneratedNamed<"ResourceAttribute">;
export type GeneratedExternalResource = GeneratedNamed<"Resource">;
export type ExternalResourceAttribute = GeneratedExternalResourceAttribute;
export type ExternalResource = GeneratedExternalResource;
export type GeneratedExternalResourceSummary = GeneratedNamed<"ResourceSummary">;
export type GeneratedExternalSearchResourcesResult = GeneratedNamed<"SearchResourcesSuccess">;
export type ExternalResourceSummary = GeneratedExternalResourceSummary;
export type ExternalSearchResourcesResult = GeneratedNamed<"SearchResourcesSuccess">;
export type ExternalResourceDescription = GeneratedNamed<"DescribeResourceSuccess">;

export type ExternalFieldIssueReasonCanonical =
  | "CONFLICTING"
  | "INVALID_FORMAT"
  | "OUT_OF_RANGE"
  | "REQUIRED"
  | "UNSUPPORTED";
export type ExternalFieldIssue = {
  field: string;
  reason: ExternalFieldIssueReasonCanonical;
};

type _UpperSnakeCase<
  Value extends string,
  First extends boolean = true,
> = Value extends `${infer Head}${infer Tail}`
  ? `${First extends true ? "" : Head extends Lowercase<Head> ? "" : "_"}${Uppercase<Head>}${_UpperSnakeCase<Tail, false>}`
  : "";

export type ExternalError =
  | { readonly code: "UNAUTHENTICATED" }
  | { readonly code: "FORBIDDEN" }
  | { readonly code: "INVALID_ARGUMENT"; fieldIssues?: ExternalFieldIssue[] }
  | { readonly code: "INVALID_REFERENCE"; fieldIssues?: ExternalFieldIssue[] }
  | { readonly code: "VALIDATION_FAILED"; fieldIssues?: ExternalFieldIssue[] }
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

export type ExternalOutcome<Operation extends ExternalOperation> =
  | { readonly ok: true; readonly value: ExternalSuccess<Operation> }
  | ExternalFailure;
