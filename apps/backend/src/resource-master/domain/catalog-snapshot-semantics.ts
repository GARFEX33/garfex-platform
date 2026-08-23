import { resolveEffectiveBindings } from "./schema.js";
import type { ApplicabilityResult, ResourceCatalog } from "./types.js";
import {
  parseResourceCatalogShape,
  ResourceCatalogValidationError,
} from "./catalog-snapshot-foundation.js";

const duplicates = (values: readonly string[], label: string, issues: string[]) => {
  const seen = new Set<string>();
  for (const value of values) {
    if (seen.has(value)) issues.push(`duplicate ${label} ${value}`);
    seen.add(value);
  }
};
const resultKey = (value: ApplicabilityResult) => `${value.mode}:${value.identity}`;

const validateResourceCatalog = (catalog: ResourceCatalog): void => {
  const issues: string[] = [];
  const { classDefinition, family, type } = catalog;
  for (const [label, count] of [
    ["attributes", catalog.attributes.length],
    ["optionSets", catalog.optionSets.length],
    ["naturalUnits", catalog.naturalUnits.length],
    ["bindings", catalog.bindings.length],
    ["presentation", catalog.presentation.attributeOrder.length],
  ] as const)
    if (!count) issues.push(`${label} section is empty`);
  if (family.classCode !== classDefinition.code) issues.push("family class reference is dangling");
  if (type.familyCode !== family.code) issues.push("type family reference is dangling");
  if (family.active && !classDefinition.active)
    issues.push("active family depends on inactive class");
  if (type.active && !family.active) issues.push("active type depends on inactive family");
  duplicates(
    catalog.attributes.map(({ code }) => code),
    "attribute code",
    issues,
  );
  duplicates(
    catalog.optionSets.map(({ code }) => code),
    "option-set code",
    issues,
  );
  duplicates(
    catalog.naturalUnits.map(({ code }) => code),
    "natural-unit code",
    issues,
  );
  duplicates(
    catalog.bindings.map(({ id }) => id),
    "binding id",
    issues,
  );
  duplicates(catalog.presentation.attributeOrder, "presentation attribute", issues);
  duplicates(family.allowedNaturalUnitCodes, "allowed unit", issues);
  const attributes = new Map(catalog.attributes.map((item) => [item.code, item]));
  const units = new Map(catalog.naturalUnits.map((item) => [item.code, item]));
  const sets = new Map(catalog.optionSets.map((item) => [item.code, item]));
  const setsByAttribute = new Map<string, string>();
  for (const set of catalog.optionSets) {
    const attribute = attributes.get(set.attributeCode);
    if (!attribute) issues.push(`option-set ${set.code} owns missing attribute`);
    else if (attribute.kind !== "CONTROLLED_OPTION")
      issues.push(`option-set ${set.code} owns non-option attribute`);
    if (set.active && attribute?.active !== true)
      issues.push(`active option-set ${set.code} depends on inactive attribute`);
    if (setsByAttribute.has(set.attributeCode))
      issues.push(`duplicate option-set ownership ${set.attributeCode}`);
    setsByAttribute.set(set.attributeCode, set.code);
    duplicates(
      set.options.map(({ code }) => code),
      `option ${set.code}`,
      issues,
    );
    if (set.active && !set.options.some((option) => option.active))
      issues.push(`active option-set ${set.code} has no active option`);
  }
  for (const code of family.allowedNaturalUnitCodes) {
    if (!units.has(code)) issues.push(`family allows missing unit ${code}`);
    else if (family.active && units.get(code)?.active !== true)
      issues.push(`active family allows inactive unit ${code}`);
  }
  if (!family.allowedNaturalUnitCodes.includes(family.suggestedNaturalUnitCode))
    issues.push("suggested unit is not allowed");
  if (family.active && units.get(family.suggestedNaturalUnitCode)?.active !== true)
    issues.push("suggested unit is inactive or missing");
  const bindingKeys = new Set<string>();
  const displayOrders = new Set<number>();
  for (const binding of catalog.bindings) {
    const key = `${binding.scope}:${binding.ownerCode}:${binding.attributeCode}`;
    const owner = binding.scope === "FAMILY" ? family : type;
    const attribute = attributes.get(binding.attributeCode);
    const set = binding.optionSetCode === undefined ? undefined : sets.get(binding.optionSetCode);
    if (bindingKeys.has(key)) issues.push(`duplicate binding ownership ${key}`);
    bindingKeys.add(key);
    if (binding.ownerCode !== owner.code) issues.push(`binding ${binding.id} has wrong owner`);
    if (!attribute) issues.push(`binding ${binding.id} references missing attribute`);
    if (binding.active && (attribute?.active !== true || owner.active !== true))
      issues.push(`active binding ${binding.id} has inactive dependency`);
    if (binding.displayOrder === undefined) {
      if (binding.active) issues.push(`active binding ${binding.id} has no display order`);
    } else {
      if (displayOrders.has(binding.displayOrder))
        issues.push(`duplicate display order ${binding.displayOrder}`);
      displayOrders.add(binding.displayOrder);
    }
    if (attribute?.kind === "CONTROLLED_OPTION") {
      if (binding.optionSetCode === undefined || set?.attributeCode !== binding.attributeCode)
        issues.push(`binding ${binding.id} has wrong option ownership`);
      if (binding.quantityUnitCodes !== undefined)
        issues.push(`binding ${binding.id} mixes option and unit ownership`);
      if (binding.active && set?.active !== true)
        issues.push(`active binding ${binding.id} uses inactive option-set`);
    } else if (attribute?.kind === "QUANTITY") {
      if (binding.optionSetCode !== undefined || binding.quantityUnitCodes === undefined)
        issues.push(`quantity binding ${binding.id} has invalid ownership`);
      duplicates(binding.quantityUnitCodes ?? [], `quantity unit ${binding.id}`, issues);
      for (const code of binding.quantityUnitCodes ?? [])
        if (!units.has(code) || (binding.active && units.get(code)?.active !== true))
          issues.push(`binding ${binding.id} uses invalid unit ${code}`);
    } else if (binding.optionSetCode !== undefined || binding.quantityUnitCodes !== undefined)
      issues.push(`binding ${binding.id} has incompatible ownership`);
    const predicates = new Set<string>();
    for (const rule of binding.rules) {
      const predicate = `${rule.when.attributeCode}:${rule.when.optionCode}`;
      const operand = attributes.get(rule.when.attributeCode);
      const optionSetCode = setsByAttribute.get(rule.when.attributeCode);
      const operandSet = optionSetCode === undefined ? undefined : sets.get(optionSetCode);
      if (predicates.has(predicate)) issues.push(`duplicate rule predicate ${predicate}`);
      predicates.add(predicate);
      if (
        operand?.kind !== "CONTROLLED_OPTION" ||
        operandSet?.options.some((option) => option.code === rule.when.optionCode) !== true
      )
        issues.push(`rule ${predicate} has invalid operand`);
      if (
        binding.active &&
        (operand?.active !== true ||
          operandSet?.active !== true ||
          operandSet.options.some(
            (option) => option.code === rule.when.optionCode && option.active,
          ) !== true)
      )
        issues.push(`active rule ${predicate} has inactive dependency`);
    }
    for (let index = 0; index < binding.rules.length; index += 1) {
      const current = binding.rules[index];
      if (current === undefined) continue;
      for (const other of binding.rules.slice(index + 1))
        if (
          current.when.attributeCode !== other.when.attributeCode ||
          current.when.optionCode === other.when.optionCode
        )
          if (resultKey(current.result) !== resultKey(other.result))
            issues.push(`conflicting rule outcomes in ${binding.id}`);
    }
  }
  try {
    const effective = resolveEffectiveBindings(catalog.bindings, family.code, type.code);
    const visible = new Set(effective.map(({ attributeCode }) => attributeCode));
    const presented = new Set(catalog.presentation.attributeOrder);
    for (const code of catalog.presentation.attributeOrder)
      if (!visible.has(code) || attributes.get(code)?.active !== true)
        issues.push(`presentation references invisible attribute ${code}`);
    if (presented.size !== visible.size || [...visible].some((code) => !presented.has(code)))
      issues.push("presentation does not cover effective bindings");
    const ordered = [...effective]
      .sort((a, b) => (a.displayOrder ?? 0) - (b.displayOrder ?? 0))
      .map(({ attributeCode }) => attributeCode);
    if (ordered.join("\0") !== catalog.presentation.attributeOrder.join("\0"))
      issues.push("presentation order disagrees with display order");
  } catch (error) {
    issues.push(error instanceof Error ? error.message : "effective binding resolution failed");
  }
  if (issues.length) throw new ResourceCatalogValidationError("INVALID", issues);
};

export const parseResourceCatalogSemantics = (value: unknown): ResourceCatalog => {
  const catalog = parseResourceCatalogShape(value);
  if (
    !catalog.attributes.length &&
    !catalog.optionSets.length &&
    !catalog.naturalUnits.length &&
    !catalog.bindings.length &&
    !catalog.presentation.attributeOrder.length
  )
    throw new ResourceCatalogValidationError("EMPTY", ["catalog has no usable content"]);
  validateResourceCatalog(catalog);
  return catalog;
};
