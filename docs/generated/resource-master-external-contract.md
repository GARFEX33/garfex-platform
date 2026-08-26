# Contract identity and compatibility

<!-- GENERATED FILE: derived from semantic-manifest.json; do not edit. -->
<!-- Manifest digest: sha256:32a4d0ea37e9441763d49971c8075d21fa07cc36b0ea69446613098a12b83f53 -->

- External contract identity: `garfex.resource-master.external-client-contract`
- Compatibility revision: `1`

The identity names one external contract lineage. The compatibility revision is an opaque string: compare it for exact equality and do not infer ordering, ranges, support duration, or a versioning policy.

Only the business fields listed below are consumer input. Identity and access context are outside these values.

## Consumer decision

Use the named workflow request and read only the listed success fields. A consumer needs no implementation knowledge to interpret these business meanings.

## Workflows

Each workflow has a named request, success, and closed failure shape. The ten entries are emitted in the reviewed order from the manifest.

### `getTaxonomy`

- Request model: `GetTaxonomyRequest`
- Success model: `GetTaxonomySuccess`
- Failure model: `SafeFailure`

#### Request fields

_No fields._

#### Success fields

| Field | Required | Shape |
| --- | --- | --- |
| `items` | Yes | `Array<Taxonomy>` |

### `getEffectiveResourceSchema`

- Request model: `GetEffectiveResourceSchemaRequest`
- Success model: `GetEffectiveResourceSchemaSuccess`
- Failure model: `SafeFailure`

#### Request fields

| Field | Required | Shape |
| --- | --- | --- |
| `classCode` | Yes | `NonEmptyCode` |
| `familyCode` | Yes | `NonEmptyCode` |
| `typeCode` | Yes | `NonEmptyCode` |

#### Success fields

| Field | Required | Shape |
| --- | --- | --- |
| `attributes` | Yes | `Array<EffectiveAttribute>` |

### `getValidOptions`

- Request model: `GetValidOptionsRequest`
- Success model: `GetValidOptionsSuccess`
- Failure model: `SafeFailure`

#### Request fields

| Field | Required | Shape |
| --- | --- | --- |
| `attributeCode` | Yes | `NonEmptyCode` |

#### Success fields

| Field | Required | Shape |
| --- | --- | --- |
| `options` | Yes | `Array<Option>` |

### `getNaturalUnits`

- Request model: `GetNaturalUnitsRequest`
- Success model: `GetNaturalUnitsSuccess`
- Failure model: `SafeFailure`

#### Request fields

| Field | Required | Shape |
| --- | --- | --- |
| `familyCode` | Yes | `NonEmptyCode` |

#### Success fields

| Field | Required | Shape |
| --- | --- | --- |
| `allowed` | Yes | `Array<NaturalUnit>` |
| `suggested` | Yes | `NaturalUnit` |

### `getResource`

- Request model: `GetResourceRequest`
- Success model: `GetResourceSuccess`
- Failure model: `SafeFailure`

#### Request fields

| Field | Required | Shape |
| --- | --- | --- |
| `resourceId` | Yes | `ResourceId` |

#### Success fields

| Field | Required | Shape |
| --- | --- | --- |
| `resource` | Yes | `Resource` |

### `searchResources`

- Request model: `SearchResourcesRequest`
- Success model: `SearchResourcesSuccess`
- Failure model: `SafeFailure`

#### Request fields

| Field | Required | Shape |
| --- | --- | --- |
| `cursor` | No | `string \| null` |
| `lifecycle` | No | `ResourceLifecycleFilter` |
| `limit` | No | `SearchLimit` |
| `terms` | Yes | `SearchTerms` |

#### Success fields

| Field | Required | Shape |
| --- | --- | --- |
| `cursor` | Yes | `string \| null` |
| `items` | Yes | `Array<ResourceSummary>` |

### `describeResource`

- Request model: `DescribeResourceRequest`
- Success model: `DescribeResourceSuccess`
- Failure model: `SafeFailure`

#### Request fields

| Field | Required | Shape |
| --- | --- | --- |
| `resourceId` | Yes | `ResourceId` |

#### Success fields

| Field | Required | Shape |
| --- | --- | --- |
| `description` | Yes | `string` |
| `resourceId` | Yes | `ResourceId` |

### `createResource`

- Request model: `CreateResourceRequest`
- Success model: `CreateResourceSuccess`
- Failure model: `SafeFailure`

#### Request fields

| Field | Required | Shape |
| --- | --- | --- |
| `attributes` | Yes | `Array<ResourceAttribute>` |
| `classCode` | Yes | `NonEmptyCode` |
| `familyCode` | Yes | `NonEmptyCode` |
| `naturalUnitCode` | Yes | `NonEmptyCode` |
| `typeCode` | Yes | `NonEmptyCode` |

#### Success fields

| Field | Required | Shape |
| --- | --- | --- |
| `resource` | Yes | `Resource` |

### `updateNonIdentityData`

- Request model: `UpdateNonIdentityDataRequest`
- Success model: `UpdateNonIdentityDataSuccess`
- Failure model: `SafeFailure`

#### Request fields

| Field | Required | Shape |
| --- | --- | --- |
| `expectedRevision` | Yes | `int32` |
| `naturalUnitCode` | Yes | `NonEmptyCode` |
| `resourceId` | Yes | `ResourceId` |

#### Success fields

| Field | Required | Shape |
| --- | --- | --- |
| `resource` | Yes | `Resource` |

### `deactivateResource`

- Request model: `DeactivateResourceRequest`
- Success model: `DeactivateResourceSuccess`
- Failure model: `SafeFailure`

#### Request fields

| Field | Required | Shape |
| --- | --- | --- |
| `expectedRevision` | Yes | `int32` |
| `resourceId` | Yes | `ResourceId` |

#### Success fields

| Field | Required | Shape |
| --- | --- | --- |
| `resource` | Yes | `Resource` |

## Public UI-supporting metadata

Taxonomy labels, effective attribute descriptions and constraints, option code/label pairs, and natural-unit choices are represented by the public models below. These projections contain only fields present in the manifest.

### `ApplicabilityResult`

| Field | Required | Shape |
| --- | --- | --- |
| `identity` | Yes | `boolean` |
| `mode` | Yes | `ApplicabilityMode` |

### `ApplicabilityRule`

| Field | Required | Shape |
| --- | --- | --- |
| `result` | Yes | `ApplicabilityResult` |
| `when` | Yes | `{ attributeCode: NonEmptyCode; optionCode: NonEmptyCode }` |

### `CatalogUnavailableFailure`

| Field | Required | Shape |
| --- | --- | --- |
| `code` | Yes | `ExternalFailureCode` |

### `ConflictFailure`

| Field | Required | Shape |
| --- | --- | --- |
| `code` | Yes | `ExternalFailureCode` |
| `currentRevision` | No | `int32` |

### `CreateResourceRequest`

| Field | Required | Shape |
| --- | --- | --- |
| `attributes` | Yes | `Array<ResourceAttribute>` |
| `classCode` | Yes | `NonEmptyCode` |
| `familyCode` | Yes | `NonEmptyCode` |
| `naturalUnitCode` | Yes | `NonEmptyCode` |
| `typeCode` | Yes | `NonEmptyCode` |

### `CreateResourceSuccess`

| Field | Required | Shape |
| --- | --- | --- |
| `resource` | Yes | `Resource` |

### `DeactivateResourceRequest`

| Field | Required | Shape |
| --- | --- | --- |
| `expectedRevision` | Yes | `int32` |
| `resourceId` | Yes | `ResourceId` |

### `DeactivateResourceSuccess`

| Field | Required | Shape |
| --- | --- | --- |
| `resource` | Yes | `Resource` |

### `DescribeResourceRequest`

| Field | Required | Shape |
| --- | --- | --- |
| `resourceId` | Yes | `ResourceId` |

### `DescribeResourceSuccess`

| Field | Required | Shape |
| --- | --- | --- |
| `description` | Yes | `string` |
| `resourceId` | Yes | `ResourceId` |

### `DuplicateFailure`

| Field | Required | Shape |
| --- | --- | --- |
| `code` | Yes | `ExternalFailureCode` |
| `existingResourceId` | No | `ResourceId` |

### `EffectiveAttribute`

| Field | Required | Shape |
| --- | --- | --- |
| `code` | Yes | `NonEmptyCode` |
| `defaultResult` | Yes | `ApplicabilityResult` |
| `kind` | Yes | `AttributeKind` |
| `meaning` | Yes | `string` |
| `name` | Yes | `string` |
| `rules` | Yes | `Array<ApplicabilityRule>` |

### `FieldIssue`

| Field | Required | Shape |
| --- | --- | --- |
| `field` | Yes | `NonEmptyCode` |
| `reason` | Yes | `FieldIssueReason` |

### `ForbiddenFailure`

| Field | Required | Shape |
| --- | --- | --- |
| `code` | Yes | `ExternalFailureCode` |

### `GetEffectiveResourceSchemaRequest`

| Field | Required | Shape |
| --- | --- | --- |
| `classCode` | Yes | `NonEmptyCode` |
| `familyCode` | Yes | `NonEmptyCode` |
| `typeCode` | Yes | `NonEmptyCode` |

### `GetEffectiveResourceSchemaSuccess`

| Field | Required | Shape |
| --- | --- | --- |
| `attributes` | Yes | `Array<EffectiveAttribute>` |

### `GetNaturalUnitsRequest`

| Field | Required | Shape |
| --- | --- | --- |
| `familyCode` | Yes | `NonEmptyCode` |

### `GetNaturalUnitsSuccess`

| Field | Required | Shape |
| --- | --- | --- |
| `allowed` | Yes | `Array<NaturalUnit>` |
| `suggested` | Yes | `NaturalUnit` |

### `GetResourceRequest`

| Field | Required | Shape |
| --- | --- | --- |
| `resourceId` | Yes | `ResourceId` |

### `GetResourceSuccess`

| Field | Required | Shape |
| --- | --- | --- |
| `resource` | Yes | `Resource` |

### `GetTaxonomyRequest`

_No fields._

### `GetTaxonomySuccess`

| Field | Required | Shape |
| --- | --- | --- |
| `items` | Yes | `Array<Taxonomy>` |

### `GetValidOptionsRequest`

| Field | Required | Shape |
| --- | --- | --- |
| `attributeCode` | Yes | `NonEmptyCode` |

### `GetValidOptionsSuccess`

| Field | Required | Shape |
| --- | --- | --- |
| `options` | Yes | `Array<Option>` |

### `InternalFailure`

| Field | Required | Shape |
| --- | --- | --- |
| `code` | Yes | `ExternalFailureCode` |

### `InvalidArgumentFailure`

| Field | Required | Shape |
| --- | --- | --- |
| `code` | Yes | `ExternalFailureCode` |
| `fieldIssues` | No | `Array<FieldIssue>` |

### `InvalidLifecycleFailure`

| Field | Required | Shape |
| --- | --- | --- |
| `code` | Yes | `ExternalFailureCode` |

### `InvalidReferenceFailure`

| Field | Required | Shape |
| --- | --- | --- |
| `code` | Yes | `ExternalFailureCode` |
| `fieldIssues` | No | `Array<FieldIssue>` |

### `NaturalUnit`

| Field | Required | Shape |
| --- | --- | --- |
| `code` | Yes | `NonEmptyCode` |
| `name` | Yes | `string` |

### `NotFoundFailure`

| Field | Required | Shape |
| --- | --- | --- |
| `code` | Yes | `ExternalFailureCode` |

### `Option`

| Field | Required | Shape |
| --- | --- | --- |
| `code` | Yes | `NonEmptyCode` |
| `label` | Yes | `string` |

### `QuantityValue`

| Field | Required | Shape |
| --- | --- | --- |
| `magnitude` | Yes | `string` |
| `unitCode` | Yes | `NonEmptyCode` |

### `Resource`

| Field | Required | Shape |
| --- | --- | --- |
| `active` | Yes | `boolean` |
| `attributes` | Yes | `Array<ResourceAttribute>` |
| `canonicalIdentity` | Yes | `NonEmptyCode` |
| `classCode` | Yes | `NonEmptyCode` |
| `familyCode` | Yes | `NonEmptyCode` |
| `identityPolicyVersion` | Yes | `IdentityPolicyVersion` |
| `naturalUnitCode` | Yes | `NonEmptyCode` |
| `resourceId` | Yes | `ResourceId` |
| `revision` | Yes | `int32` |
| `typeCode` | Yes | `NonEmptyCode` |

### `ResourceAttribute`

| Field | Required | Shape |
| --- | --- | --- |
| `attributeCode` | Yes | `NonEmptyCode` |
| `displayValue` | Yes | `string` |
| `identityParticipating` | Yes | `boolean` |
| `value` | Yes | `AttributeValue` |

### `ResourceSummary`

| Field | Required | Shape |
| --- | --- | --- |
| `classCode` | Yes | `NonEmptyCode` |
| `className` | Yes | `string` |
| `description` | Yes | `string` |
| `familyCode` | Yes | `NonEmptyCode` |
| `familyName` | Yes | `string` |
| `naturalUnitCode` | Yes | `NonEmptyCode` |
| `optionCodes` | Yes | `Array<NonEmptyCode>` |
| `optionLabels` | Yes | `Array<string>` |
| `resourceId` | Yes | `ResourceId` |
| `typeCode` | Yes | `NonEmptyCode` |
| `typeName` | Yes | `string` |
| `values` | Yes | `Array<string>` |

### `SearchResourcesRequest`

| Field | Required | Shape |
| --- | --- | --- |
| `cursor` | No | `string \| null` |
| `lifecycle` | No | `ResourceLifecycleFilter` |
| `limit` | No | `SearchLimit` |
| `terms` | Yes | `SearchTerms` |

### `SearchResourcesSuccess`

| Field | Required | Shape |
| --- | --- | --- |
| `cursor` | Yes | `string \| null` |
| `items` | Yes | `Array<ResourceSummary>` |

### `Taxonomy`

| Field | Required | Shape |
| --- | --- | --- |
| `code` | Yes | `NonEmptyCode` |
| `families` | Yes | `Array<TaxonomyFamily>` |
| `name` | Yes | `string` |

### `TaxonomyFamily`

| Field | Required | Shape |
| --- | --- | --- |
| `code` | Yes | `NonEmptyCode` |
| `name` | Yes | `string` |
| `types` | Yes | `Array<TaxonomyType>` |

### `TaxonomyType`

| Field | Required | Shape |
| --- | --- | --- |
| `code` | Yes | `NonEmptyCode` |
| `name` | Yes | `string` |

### `UnauthenticatedFailure`

| Field | Required | Shape |
| --- | --- | --- |
| `code` | Yes | `ExternalFailureCode` |

### `UpdateNonIdentityDataRequest`

| Field | Required | Shape |
| --- | --- | --- |
| `expectedRevision` | Yes | `int32` |
| `naturalUnitCode` | Yes | `NonEmptyCode` |
| `resourceId` | Yes | `ResourceId` |

### `UpdateNonIdentityDataSuccess`

| Field | Required | Shape |
| --- | --- | --- |
| `resource` | Yes | `Resource` |

### `ValidationFailedFailure`

| Field | Required | Shape |
| --- | --- | --- |
| `code` | Yes | `ExternalFailureCode` |
| `fieldIssues` | No | `Array<FieldIssue>` |

## Safe failures

A failure is one closed variant. The code values and optional corrective fields below are the complete reviewed failure surface.

| Failure variant | Shape | Additional fields |
| --- | --- | --- |
| `catalogUnavailable` | `CatalogUnavailableFailure` | none |
| `conflict` | `ConflictFailure` | `currentRevision` |
| `duplicate` | `DuplicateFailure` | `existingResourceId` |
| `forbidden` | `ForbiddenFailure` | none |
| `internal` | `InternalFailure` | none |
| `invalidArgument` | `InvalidArgumentFailure` | `fieldIssues` |
| `invalidLifecycle` | `InvalidLifecycleFailure` | none |
| `invalidReference` | `InvalidReferenceFailure` | `fieldIssues` |
| `notFound` | `NotFoundFailure` | none |
| `unauthenticated` | `UnauthenticatedFailure` | none |
| `validationFailed` | `ValidationFailedFailure` | `fieldIssues` |

### Failure codes

- `CATALOG_UNAVAILABLE`
- `CONFLICT`
- `DUPLICATE`
- `FORBIDDEN`
- `INTERNAL_FAILURE`
- `INVALID_ARGUMENT`
- `INVALID_LIFECYCLE`
- `INVALID_REFERENCE`
- `NOT_FOUND`
- `UNAUTHENTICATED`
- `VALIDATION_FAILED`

## Compatibility guidance

The identity and compatibility revision are exact opaque values authored by the contract source. A consumer may compare each string for equality; it must not infer numeric ordering, semantic-version components, ranges, support duration, or rollout behavior.

The manifest digest identifies the exact generated inputs for this document. If the digest or any generated value differs, regenerate from the current manifest rather than editing this document.
