import type {
  EffectiveAttributeView,
  ResourceMaster,
  ResourceView,
} from "../../resource-master/public.js";
import type {
  ExternalAttributeValue,
  ExternalResource,
  ExternalSuccess,
} from "../client-facing/contract.js";

type SuccessValue<Result> =
  Extract<Awaited<Result>, { readonly ok: true }> extends {
    readonly value: infer Value;
  }
    ? Value
    : never;
type TaxonomySuccess = SuccessValue<ReturnType<ResourceMaster["getTaxonomy"]>>;
type SchemaSuccess = SuccessValue<ReturnType<ResourceMaster["getEffectiveResourceSchema"]>>;
type OptionsSuccess = SuccessValue<ReturnType<ResourceMaster["getValidOptions"]>>;
type UnitsSuccess = SuccessValue<ReturnType<ResourceMaster["getNaturalUnits"]>>;
type SearchSuccess = SuccessValue<ReturnType<ResourceMaster["searchResources"]>>;
type DescriptionSuccess = SuccessValue<ReturnType<ResourceMaster["describeResource"]>>;

export function projectExternalGetTaxonomy(value: TaxonomySuccess): ExternalSuccess<"getTaxonomy"> {
  return {
    items: value.map((entry) => ({
      code: entry.code,
      name: entry.name,
      families: entry.families.map((family) => ({
        code: family.code,
        name: family.name,
        types: family.types.map((type) => ({ code: type.code, name: type.name })),
      })),
    })),
  };
}

function projectSchemaResult(result: EffectiveAttributeView["defaultResult"]) {
  return { mode: result.mode, identity: result.identity };
}

export function projectExternalGetEffectiveResourceSchema(
  value: SchemaSuccess,
): ExternalSuccess<"getEffectiveResourceSchema"> {
  return {
    attributes: value.attributes.map((attribute) => ({
      code: attribute.code,
      name: attribute.name,
      kind: attribute.kind,
      meaning: attribute.meaning,
      defaultResult: projectSchemaResult(attribute.defaultResult),
      rules: attribute.rules.map((rule) => ({
        when: {
          attributeCode: rule.when.attributeCode,
          optionCode: rule.when.optionCode,
        },
        result: projectSchemaResult(rule.result),
      })),
    })),
  };
}

export const projectExternalGetValidOptions = (
  value: OptionsSuccess,
): ExternalSuccess<"getValidOptions"> => ({
  options: value.map((option) => ({ code: option.code, label: option.label })),
});

export const projectExternalGetNaturalUnits = (
  value: UnitsSuccess,
): ExternalSuccess<"getNaturalUnits"> => ({
  allowed: value.allowed.map((unit) => ({ code: unit.code, name: unit.name })),
  suggested: { code: value.suggested.code, name: value.suggested.name },
});

function projectAttributeValue(
  value: ResourceView["attributes"][number]["value"],
): ExternalAttributeValue {
  if (typeof value === "string" || typeof value === "boolean") return value;
  return { magnitude: value.magnitude, unitCode: value.unitCode };
}

function projectResource(value: ResourceView): ExternalResource {
  return {
    resourceId: value.resourceId,
    classCode: value.classCode,
    familyCode: value.familyCode,
    typeCode: value.typeCode,
    naturalUnitCode: value.naturalUnitCode,
    attributes: value.attributes.map((attribute) => ({
      attributeCode: attribute.attributeCode,
      value: projectAttributeValue(attribute.value),
      displayValue: attribute.displayValue,
      identityParticipating: attribute.identityParticipating,
    })),
    canonicalIdentity: value.canonicalIdentity,
    identityPolicyVersion: value.identityPolicyVersion,
    active: value.active,
    revision: value.revision,
  };
}

export const projectExternalGetResource = (
  value: ResourceView,
): ExternalSuccess<"getResource"> => ({
  resource: projectResource(value),
});

export function projectExternalSearchResources(
  value: SearchSuccess,
): ExternalSuccess<"searchResources"> {
  return {
    items: value.items.map((item) => ({
      resourceId: item.resourceId,
      classCode: item.classCode,
      className: item.className,
      familyCode: item.familyCode,
      familyName: item.familyName,
      typeCode: item.typeCode,
      typeName: item.typeName,
      naturalUnitCode: item.naturalUnitCode,
      description: item.description,
      optionCodes: item.optionCodes.map((code) => code),
      optionLabels: item.optionLabels.map((label) => label),
      values: item.values.map((itemValue) => itemValue),
    })),
    cursor: value.cursor ?? null,
  };
}

export const projectExternalDescribeResource = (
  value: DescriptionSuccess,
): ExternalSuccess<"describeResource"> => ({
  resourceId: value.resourceId,
  description: value.description,
});

export const projectExternalCreateResource = (
  value: ResourceView,
): ExternalSuccess<"createResource"> => ({ resource: projectResource(value) });

export const projectExternalUpdateNonIdentityData = (
  value: ResourceView,
): ExternalSuccess<"updateNonIdentityData"> => ({ resource: projectResource(value) });

export const projectExternalDeactivateResource = (
  value: ResourceView,
): ExternalSuccess<"deactivateResource"> => ({ resource: projectResource(value) });
