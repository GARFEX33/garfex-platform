import type { PersistedAttribute } from "./types.js";

const encode = (value: string): string => `${value.length}:${value}`;

export const createCanonicalIdentity = (input: {
  readonly classCode: string;
  readonly familyCode: string;
  readonly typeCode: string;
  readonly attributes: readonly PersistedAttribute[];
}): string => {
  const values = input.attributes
    .filter((attribute) => attribute.identityParticipating)
    .sort((left, right) => left.attributeCode.localeCompare(right.attributeCode))
    .map(
      (attribute) => `${encode(attribute.attributeCode)}=${encode(attribute.canonicalIdentity)}`,
    );
  return ["v1", input.classCode, input.familyCode, input.typeCode, ...values].map(encode).join("|");
};
