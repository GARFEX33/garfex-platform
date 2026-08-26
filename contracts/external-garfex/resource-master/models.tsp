namespace Garfex.External.ResourceMaster;

@minLength(1)
scalar NonEmptyCode extends string;

@minLength(1)
scalar ResourceId extends string;

@minLength(1)
scalar SearchTerms extends string;

@minValue(1)
@maxValue(50)
scalar SearchLimit extends int32;

enum ResourceLifecycleFilter {
  ACTIVE,
  INACTIVE,
  ALL,
}

enum AttributeKind {
  CONTROLLED_OPTION,
  INTEGER,
  DECIMAL,
  BOOLEAN,
  CONTROLLED_TEXT,
  QUANTITY,
}

enum ApplicabilityMode {
  REQUIRED,
  OPTIONAL,
  FORBIDDEN,
  NOT_APPLICABLE,
}

enum IdentityPolicyVersion {
  v1,
}

model TaxonomyType {
  code: NonEmptyCode;
  name: string;
}

model TaxonomyFamily {
  code: NonEmptyCode;
  name: string;
  types: TaxonomyType[];
}

model Taxonomy {
  code: NonEmptyCode;
  name: string;
  families: TaxonomyFamily[];
}

model ApplicabilityResult {
  mode: ApplicabilityMode;
  identity: boolean;
}

model ApplicabilityRule {
  when: {
    attributeCode: NonEmptyCode;
    optionCode: NonEmptyCode;
  };
  result: ApplicabilityResult;
}

model EffectiveAttribute {
  code: NonEmptyCode;
  name: string;
  kind: AttributeKind;
  meaning: string;
  defaultResult: ApplicabilityResult;
  rules: ApplicabilityRule[];
}

model Option {
  code: NonEmptyCode;
  label: string;
}

model NaturalUnit {
  code: NonEmptyCode;
  name: string;
}

model QuantityValue {
  magnitude: string;
  unitCode: NonEmptyCode;
}

union AttributeValue {
  text: string,
  flag: boolean,
  quantity: QuantityValue,
}

model ResourceAttribute {
  attributeCode: NonEmptyCode;
  value: AttributeValue;
  displayValue: string;
  identityParticipating: boolean;
}

model Resource {
  resourceId: ResourceId;
  classCode: NonEmptyCode;
  familyCode: NonEmptyCode;
  typeCode: NonEmptyCode;
  naturalUnitCode: NonEmptyCode;
  attributes: ResourceAttribute[];
  canonicalIdentity: NonEmptyCode;
  identityPolicyVersion: IdentityPolicyVersion;
  active: boolean;
  revision: int32;
}

model ResourceSummary {
  resourceId: ResourceId;
  classCode: NonEmptyCode;
  className: string;
  familyCode: NonEmptyCode;
  familyName: string;
  typeCode: NonEmptyCode;
  typeName: string;
  naturalUnitCode: NonEmptyCode;
  description: string;
  optionCodes: NonEmptyCode[];
  optionLabels: string[];
  values: string[];
}
