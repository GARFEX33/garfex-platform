import { describe, expect, it } from "vitest";
import { ResourceCatalogValidationError } from "../src/resource-master/domain/catalog-snapshot-foundation.js";
import { parseResourceCatalogSemantics } from "../src/resource-master/domain/catalog-snapshot-semantics.js";
import { cableCatalog } from "./fixtures/cable-catalog.js";
import type { ResourceCatalog } from "../src/resource-master/domain/types.js";

const at = <T>(items: readonly T[], index: number, change: (item: T) => T) =>
  items.map((item, candidate) => (candidate === index ? change(item) : item));
const where = <T>(items: readonly T[], code: string, change: (item: T) => T) =>
  items.map((item) => {
    const candidate = item as { readonly attributeCode?: string; readonly code?: string };
    return (candidate.attributeCode ?? candidate.code) === code ? change(item) : item;
  });
const invalid = (catalog: ResourceCatalog): void =>
  expect(() => parseResourceCatalogSemantics(catalog)).toThrow(ResourceCatalogValidationError);

describe("resource catalog semantic validation", () => {
  it("preserves Cable references, ownership, applicability and presentation", () => {
    const parsed: ResourceCatalog = parseResourceCatalogSemantics(cableCatalog);
    expect(parsed.bindings.map(({ attributeCode }) => attributeCode)).toEqual(
      cableCatalog.bindings.map(({ attributeCode }) => attributeCode),
    );
    expect(parsed.optionSets.map(({ attributeCode }) => attributeCode)).toEqual(
      cableCatalog.optionSets.map(({ attributeCode }) => attributeCode),
    );
    expect(parsed.presentation.attributeOrder).toEqual(cableCatalog.presentation.attributeOrder);
  });

  it("rejects references, ownership, lifecycle, rules and presentation violations", () => {
    const set = cableCatalog.optionSets[0];
    const attribute = cableCatalog.attributes[0];
    const unit = cableCatalog.naturalUnits[0];
    const binding = cableCatalog.bindings[0];
    if (!set || !attribute || !unit || !binding) throw new Error("complete fixture expected");
    const cases: readonly ResourceCatalog[] = [
      { ...cableCatalog, attributes: [...cableCatalog.attributes, attribute] },
      { ...cableCatalog, optionSets: [...cableCatalog.optionSets, set] },
      {
        ...cableCatalog,
        optionSets: at(cableCatalog.optionSets, 0, (item) => ({
          ...item,
          options: [...item.options, item.options[0]!],
        })),
      },
      { ...cableCatalog, naturalUnits: [...cableCatalog.naturalUnits, unit] },
      { ...cableCatalog, bindings: [...cableCatalog.bindings, binding] },
      {
        ...cableCatalog,
        bindings: where(cableCatalog.bindings, "color", (item) => ({
          ...item,
          rules: [...item.rules, item.rules[0]!],
        })),
      },
      {
        ...cableCatalog,
        presentation: {
          ...cableCatalog.presentation,
          attributeOrder: [...cableCatalog.presentation.attributeOrder, "gauge"],
        },
      },
      { ...cableCatalog, family: { ...cableCatalog.family, classCode: "MISSING" } },
      {
        ...cableCatalog,
        optionSets: at(cableCatalog.optionSets, 0, (item) => ({ ...item, attributeCode: "gauge" })),
      },
      { ...cableCatalog, family: { ...cableCatalog.family, allowedNaturalUnitCodes: ["MISSING"] } },
      {
        ...cableCatalog,
        bindings: at(cableCatalog.bindings, 0, (item) => ({ ...item, ownerCode: "MISSING" })),
      },
      {
        ...cableCatalog,
        attributes: where(cableCatalog.attributes, "insulation", (item) => ({
          ...item,
          active: false,
        })),
      },
      {
        ...cableCatalog,
        optionSets: at(cableCatalog.optionSets, 1, (item) => ({
          ...item,
          options: at(item.options, 1, (option) => ({ ...option, active: false })),
        })),
      },
      {
        ...cableCatalog,
        bindings: where(cableCatalog.bindings, "color", (item) => ({
          ...item,
          rules: [
            ...item.rules,
            {
              when: { attributeCode: "conductor_material", optionCode: "COBRE" },
              result: { mode: "OPTIONAL" as const, identity: false },
            },
          ],
        })),
      },
      {
        ...cableCatalog,
        bindings: where(cableCatalog.bindings, "gauge", (item) => ({ ...item, displayOrder: 99 })),
      },
    ];
    for (const catalog of cases) invalid(catalog);
  });
});
