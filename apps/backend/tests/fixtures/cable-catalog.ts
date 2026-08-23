import type { ResourceCatalog } from "../../src/resource-master/domain/types.js";

const options = (code: string, attributeCode: string, values: readonly [string, string][]) => ({
  code,
  attributeCode,
  active: true as const,
  options: values.map(([optionCode, label]) => ({
    code: optionCode,
    label,
    active: true as const,
  })),
});
const attribute = (
  code: string,
  name: string,
  kind: ResourceCatalog["attributes"][number]["kind"],
  meaning: string,
) => ({ code, name, kind, meaning, active: true as const });
const nakedRule = {
  when: { attributeCode: "insulation", optionCode: "DESNUDO" },
  result: { mode: "NOT_APPLICABLE" as const, identity: false },
};
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
  active: true as const,
  defaultResult: { mode: "REQUIRED" as const, identity: true },
  rules,
  ...(optionSetCode === undefined ? {} : { optionSetCode }),
  displayOrder,
});

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
    attribute(
      "conductor_material",
      "Material conductor",
      "CONTROLLED_OPTION",
      "Material eléctrico del conductor",
    ),
    attribute("gauge", "Calibre", "INTEGER", "Calibre AWG"),
    attribute("insulation", "Aislamiento", "CONTROLLED_OPTION", "Tipo de aislamiento"),
    attribute("color", "Color", "CONTROLLED_OPTION", "Color exterior"),
    attribute("voltage", "Voltaje", "CONTROLLED_OPTION", "Tensión nominal"),
  ],
  optionSets: [
    options("CONDUCTOR_MATERIAL", "conductor_material", [
      ["COBRE", "Cobre"],
      ["ALUMINIO", "Aluminio"],
    ]),
    options("INSULATION", "insulation", [
      ["THW", "THW"],
      ["DESNUDO", "Desnudo"],
    ]),
    options("COLOR", "color", [
      ["ROJO", "Rojo"],
      ["NEGRO", "Negro"],
      ["BLANCO", "Blanco"],
    ]),
    options("VOLTAGE", "voltage", [
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
