namespace Garfex.External.ResourceMaster;

model GetTaxonomyRequest {}
model GetTaxonomySuccess {
  items: Taxonomy[];
}
union GetTaxonomyOutcome {
  success: GetTaxonomySuccess,
  failure: SafeFailure,
}
op getTaxonomy(request: GetTaxonomyRequest): GetTaxonomyOutcome;

model GetEffectiveResourceSchemaRequest {
  classCode: NonEmptyCode;
  familyCode: NonEmptyCode;
  typeCode: NonEmptyCode;
}
model GetEffectiveResourceSchemaSuccess {
  attributes: EffectiveAttribute[];
}
union GetEffectiveResourceSchemaOutcome {
  success: GetEffectiveResourceSchemaSuccess,
  failure: SafeFailure,
}
op getEffectiveResourceSchema(request: GetEffectiveResourceSchemaRequest): GetEffectiveResourceSchemaOutcome;

model GetValidOptionsRequest {
  attributeCode: NonEmptyCode;
}
model GetValidOptionsSuccess {
  options: Option[];
}
union GetValidOptionsOutcome {
  success: GetValidOptionsSuccess,
  failure: SafeFailure,
}
op getValidOptions(request: GetValidOptionsRequest): GetValidOptionsOutcome;

model GetNaturalUnitsRequest {
  familyCode: NonEmptyCode;
}
model GetNaturalUnitsSuccess {
  allowed: NaturalUnit[];
  suggested: NaturalUnit;
}
union GetNaturalUnitsOutcome {
  success: GetNaturalUnitsSuccess,
  failure: SafeFailure,
}
op getNaturalUnits(request: GetNaturalUnitsRequest): GetNaturalUnitsOutcome;

model GetResourceRequest {
  resourceId: ResourceId;
}
model GetResourceSuccess {
  resource: Resource;
}
union GetResourceOutcome {
  success: GetResourceSuccess,
  failure: SafeFailure,
}
op getResource(request: GetResourceRequest): GetResourceOutcome;

model SearchResourcesRequest {
  terms: SearchTerms;
  lifecycle?: ResourceLifecycleFilter;
  limit?: SearchLimit;
  cursor?: string | null;
}
model SearchResourcesSuccess {
  items: ResourceSummary[];
  cursor: string | null;
}
union SearchResourcesOutcome {
  success: SearchResourcesSuccess,
  failure: SafeFailure,
}
op searchResources(request: SearchResourcesRequest): SearchResourcesOutcome;

model DescribeResourceRequest {
  resourceId: ResourceId;
}
model DescribeResourceSuccess {
  resourceId: ResourceId;
  description: string;
}
union DescribeResourceOutcome {
  success: DescribeResourceSuccess,
  failure: SafeFailure,
}
op describeResource(request: DescribeResourceRequest): DescribeResourceOutcome;

model CreateResourceRequest {
  classCode: NonEmptyCode;
  familyCode: NonEmptyCode;
  typeCode: NonEmptyCode;
  naturalUnitCode: NonEmptyCode;
  attributes: ResourceAttribute[];
}
model CreateResourceSuccess {
  resource: Resource;
}
union CreateResourceOutcome {
  success: CreateResourceSuccess,
  failure: SafeFailure,
}
op createResource(request: CreateResourceRequest): CreateResourceOutcome;

model UpdateNonIdentityDataRequest {
  resourceId: ResourceId;
  expectedRevision: int32;
  naturalUnitCode: NonEmptyCode;
}
model UpdateNonIdentityDataSuccess {
  resource: Resource;
}
union UpdateNonIdentityDataOutcome {
  success: UpdateNonIdentityDataSuccess,
  failure: SafeFailure,
}
op updateNonIdentityData(request: UpdateNonIdentityDataRequest): UpdateNonIdentityDataOutcome;

model DeactivateResourceRequest {
  resourceId: ResourceId;
  expectedRevision: int32;
}
model DeactivateResourceSuccess {
  resource: Resource;
}
union DeactivateResourceOutcome {
  success: DeactivateResourceSuccess,
  failure: SafeFailure,
}
op deactivateResource(request: DeactivateResourceRequest): DeactivateResourceOutcome;
