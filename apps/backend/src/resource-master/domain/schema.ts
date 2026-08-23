import type { ApplicabilityBinding, ApplicabilityResult } from "./types.js";

export class SchemaIntegrityError extends Error {}

export const resolveEffectiveBindings = (
  bindings: readonly ApplicabilityBinding[],
  familyCode: string,
  typeCode: string,
): readonly ApplicabilityBinding[] => {
  const scopedBindings = bindings.filter(
    (binding) =>
      (binding.scope === "FAMILY" && binding.ownerCode === familyCode) ||
      (binding.scope === "TYPE" && binding.ownerCode === typeCode),
  );
  const grouped = new Map<string, ApplicabilityBinding[]>();
  for (const binding of scopedBindings) {
    const key = `${binding.scope}:${binding.ownerCode}:${binding.attributeCode}`;
    const group = grouped.get(key) ?? [];
    group.push(binding);
    grouped.set(key, group);
  }
  const duplicateKey = [...grouped.entries()]
    .filter(([, group]) => group.length > 1)
    .map(([key]) => key)
    .sort()[0];
  if (duplicateKey !== undefined) {
    const [scope, ownerCode, attributeCode] = duplicateKey.split(":");
    throw new SchemaIntegrityError(
      `duplicate ${scope} binding for ${ownerCode} attribute ${attributeCode}`,
    );
  }
  const family = new Map(
    scopedBindings
      .filter((binding) => binding.scope === "FAMILY")
      .map((binding) => [binding.attributeCode, binding] as const),
  );
  const type = new Map(
    scopedBindings
      .filter((binding) => binding.scope === "TYPE")
      .map((binding) => [binding.attributeCode, binding] as const),
  );
  const attributes = [...new Set([...family.keys(), ...type.keys()])].sort();
  return attributes.flatMap((attributeCode) => {
    const explicit = type.get(attributeCode);
    if (explicit !== undefined) return explicit.active ? [explicit] : [];
    const inherited = family.get(attributeCode);
    return inherited?.active === true ? [inherited] : [];
  });
};

export const evaluateApplicability = (
  binding: ApplicabilityBinding,
  canonicalOptions: Readonly<Record<string, string>>,
): ApplicabilityResult | { readonly kind: "AMBIGUOUS_APPLICABILITY" } => {
  const matches = binding.rules
    .filter((rule) => canonicalOptions[rule.when.attributeCode] === rule.when.optionCode)
    .map((rule) => rule.result);
  if (matches.length === 0) return binding.defaultResult;
  const first = matches[0];
  if (first === undefined) return binding.defaultResult;
  return matches.every((result) => result.mode === first.mode && result.identity === first.identity)
    ? first
    : { kind: "AMBIGUOUS_APPLICABILITY" };
};
