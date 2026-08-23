import type { ResourceCatalog } from "../domain/types.js";

const optionSet = (code: string, attributeCode: string, options: readonly [string, string][]) => ({
  code,
  attributeCode,
  active: true as const,
  options: options.map(([optionCode, label]) => ({
    code: optionCode,
    label,
    active: true as const,
  })),
});
const binding = (
  attributeCode: string,
  displayOrder: number,
  optionSetCode?: string,
  rules: ResourceCatalog["bindings"][number]["rules"] = [],
) => ({
  id: `CONDUCTORES-${attributeCode}`,
  scope: "FAMILY" as const,
  ownerCode: "CONDUCTORES",
  attributeCode,
  active: true,
  defaultResult: { mode: "REQUIRED" as const, identity: true },
  rules,
  ...(optionSetCode === undefined ? {} : { optionSetCode }),
  displayOrder,
});
const nakedRule = {
  when: { attributeCode: "insulation", optionCode: "DESNUDO" },
  result: { mode: "NOT_APPLICABLE" as const, identity: false },
};

export const cableCatalog: ResourceCatalog = {
  classDefinition: { code: "MATERIAL", name: "Material", active: true },
  family: {
    code: "CONDUCTORES",
    name: "Conductores",
    classCode: "MATERIAL",
    active: true,
    allowedNaturalUnitCodes: ["M", "ROLLO"],
    suggestedNaturalUnitCode: "M",
  },
  type: { code: "CABLE", name: "Cable", familyCode: "CONDUCTORES", active: true },
  attributes: [
    {
      code: "conductor_material",
      name: "Material conductor",
      kind: "CONTROLLED_OPTION",
      meaning: "Material eléctrico del conductor",
      active: true,
    },
    { code: "gauge", name: "Calibre", kind: "INTEGER", meaning: "Calibre AWG", active: true },
    {
      code: "insulation",
      name: "Aislamiento",
      kind: "CONTROLLED_OPTION",
      meaning: "Tipo de aislamiento",
      active: true,
    },
    {
      code: "color",
      name: "Color",
      kind: "CONTROLLED_OPTION",
      meaning: "Color exterior",
      active: true,
    },
    {
      code: "voltage",
      name: "Voltaje",
      kind: "CONTROLLED_OPTION",
      meaning: "Tensión nominal",
      active: true,
    },
  ],
  optionSets: [
    optionSet("CONDUCTOR_MATERIAL", "conductor_material", [
      ["COBRE", "Cobre"],
      ["ALUMINIO", "Aluminio"],
    ]),
    optionSet("INSULATION", "insulation", [
      ["THW", "THW"],
      ["DESNUDO", "Desnudo"],
    ]),
    optionSet("COLOR", "color", [
      ["ROJO", "Rojo"],
      ["NEGRO", "Negro"],
      ["BLANCO", "Blanco"],
    ]),
    optionSet("VOLTAGE", "voltage", [
      ["600V", "600 V"],
      ["1000V", "1000 V"],
    ]),
  ],
  naturalUnits: [
    { code: "M", name: "Metro", active: true },
    { code: "ROLLO", name: "Rollo", active: true },
  ],
  bindings: [
    binding("conductor_material", 1, "CONDUCTOR_MATERIAL"),
    binding("gauge", 2),
    binding("insulation", 3, "INSULATION"),
    binding("color", 4, "COLOR", [nakedRule]),
    binding("voltage", 5, "VOLTAGE", [nakedRule]),
  ],
  presentation: {
    attributeOrder: ["conductor_material", "gauge", "insulation", "color", "voltage"],
    includeNaturalUnit: false,
  },
};
