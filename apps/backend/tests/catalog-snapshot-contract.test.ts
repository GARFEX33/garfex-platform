import { describe, expect, it } from "vitest";
import {
  parseResourceCatalogPayload,
  measureResourceCatalog,
  parseResourceCatalogSnapshot,
  resourceCatalogPayloadEquals,
  resourceCatalogSnapshotEquals,
  ResourceCatalogValidationError,
  validateResourceCatalogReplacement,
} from "../src/resource-master/domain/catalog-snapshot.js";
import { cableCatalog } from "./fixtures/cable-catalog.js";
import type { ResourceCatalog } from "../src/resource-master/domain/types.js";
import type { ResourceCatalogSnapshot } from "../src/resource-master/domain/catalog-snapshot.js";

type Parser = (value: unknown) => unknown;
const payload = () => ({
  catalogKey: "resource-master" as const,
  schemaVersion: 1 as const,
  sourceVersion: "cable-catalog-v1",
  lifecycle: "ACTIVE" as const,
  catalog: cableCatalog,
});
const snapshot = (revision = 1) => ({ ...payload(), revision });
const emptyCatalog = (attributes: ResourceCatalog["attributes"]) => ({
  ...cableCatalog,
  attributes,
  optionSets: [],
  naturalUnits: [],
  bindings: [],
  presentation: { attributeOrder: [], includeNaturalUnit: false },
});
const expectFailure = (value: unknown, parser: Parser = parseResourceCatalogPayload): void => {
  expect(() => parser(value)).toThrow(ResourceCatalogValidationError);
};
const replacement = (current: ResourceCatalogSnapshot, catalog: ResourceCatalog): void =>
  validateResourceCatalogReplacement(
    current,
    parseResourceCatalogPayload({ ...payload(), catalog }),
  );

describe("resource catalog snapshot contract", () => {
  it("parses and measures the complete Cable payload", () => {
    expect(measureResourceCatalog(payload())).toMatchObject({
      bytes: 3317,
      depth: 8,
      largestArray: 5,
      largestObject: 9,
    });
    const parsed = parseResourceCatalogPayload(payload());
    const persisted = parseResourceCatalogSnapshot(snapshot());
    expect(parsed.catalog).toEqual(cableCatalog);
    expect(persisted.revision).toBe(1);
    expect(Object.isFrozen(persisted)).toBe(true);
    expect(Object.isFrozen(persisted.catalog.bindings[0])).toBe(true);
    expect(() => {
      (persisted.catalog.family as { name: string }).name = "changed";
    }).toThrow(TypeError);
  });

  it("distinguishes empty content from malformed envelope and revisions", () => {
    expectFailure({ ...payload(), catalog: emptyCatalog([]) });
    expectFailure({ ...payload(), sourceVersion: "" });
    expectFailure({ ...payload(), catalog: emptyCatalog(cableCatalog.attributes) });
    const attribute = cableCatalog.attributes[0];
    const optionSet = cableCatalog.optionSets[0];
    if (!attribute || !optionSet) throw new Error("complete fixture expected");
    const { name: _name, ...missingName } = attribute;
    expectFailure({
      ...payload(),
      catalog: { ...cableCatalog, attributes: [missingName, ...cableCatalog.attributes.slice(1)] },
    });
    expectFailure({
      ...payload(),
      catalog: {
        ...cableCatalog,
        optionSets: [{ ...optionSet, extra: true }, ...cableCatalog.optionSets.slice(1)],
      },
    });
    expectFailure({ ...payload(), extra: true });
    expectFailure({ ...payload(), catalogKey: "other" });
    expectFailure({ ...payload(), schemaVersion: 2 });
    expectFailure({ ...payload(), lifecycle: "INACTIVE" });
    expectFailure({ ...payload(), revision: 0 }, parseResourceCatalogSnapshot);
    expectFailure({ ...payload(), revision: -1 }, parseResourceCatalogSnapshot);
    expectFailure({ ...payload(), revision: 1.5 }, parseResourceCatalogSnapshot);
    expectFailure(payload(), parseResourceCatalogSnapshot);
    expectFailure({ ...snapshot(), revision: "1" }, parseResourceCatalogSnapshot);
    expect(parseResourceCatalogSnapshot(snapshot(2)).revision).toBe(2);
  });

  it("compares complete ordered semantics independently from payload revisions", () => {
    const first = parseResourceCatalogPayload(payload());
    const second = parseResourceCatalogPayload(payload());
    expect(resourceCatalogPayloadEquals(first, second)).toBe(true);
    expect(
      resourceCatalogSnapshotEquals(
        parseResourceCatalogSnapshot(snapshot()),
        parseResourceCatalogSnapshot(snapshot(2)),
      ),
    ).toBe(false);
    const reordered = parseResourceCatalogPayload({
      ...payload(),
      catalog: {
        ...cableCatalog,
        optionSets: cableCatalog.optionSets.map((set, index) =>
          index === 0 ? { ...set, options: [...set.options].reverse() } : set,
        ),
      },
    });
    expect(resourceCatalogPayloadEquals(first, reordered)).toBe(false);
  });

  it("rejects stable identity removal and allows presentation-only edits", () => {
    const current = parseResourceCatalogSnapshot(snapshot());
    expect(() =>
      replacement(current, {
        ...cableCatalog,
        attributes: cableCatalog.attributes.map((attribute) =>
          attribute.code === "gauge" ? { ...attribute, kind: "DECIMAL" as const } : attribute,
        ),
      }),
    ).toThrow(ResourceCatalogValidationError);
    expect(() =>
      replacement(current, {
        ...cableCatalog,
        family: {
          ...cableCatalog.family,
          allowedNaturalUnitCodes: ["M"],
          suggestedNaturalUnitCode: "M",
        },
        naturalUnits: cableCatalog.naturalUnits.slice(0, 1),
      }),
    ).toThrow(ResourceCatalogValidationError);
    expect(() =>
      replacement(current, {
        ...cableCatalog,
        attributes: cableCatalog.attributes.map((attribute) =>
          attribute.code === "gauge" ? { ...attribute, name: "Gauge" } : attribute,
        ),
      }),
    ).not.toThrow();
  });
});
