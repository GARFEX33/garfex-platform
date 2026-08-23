import { describe, expect, it } from "vitest";
import {
  assertResourceCatalogBounds,
  measureResourceCatalog,
  resourceCatalogBounds,
} from "../src/resource-master/domain/catalog-snapshot-foundation.js";

describe("resource catalog snapshot foundation", () => {
  it("measures UTF-8 size and nested collection maxima", () => {
    const value = { emoji: "ñ", nested: { values: [null, null] } };
    const measured = measureResourceCatalog(value);
    expect(measured.bytes).toBe(new TextEncoder().encode(JSON.stringify(value)).byteLength);
    expect(measured).toMatchObject({ depth: 4, largestArray: 2, largestObject: 2 });
  });

  it("accepts exact shape bounds and rejects every over-bound dimension", () => {
    const atBytes = { x: "x".repeat(resourceCatalogBounds.maxBytes - 8) };
    expect(measureResourceCatalog(atBytes).bytes).toBe(resourceCatalogBounds.maxBytes);
    expect(() =>
      assertResourceCatalogBounds({ x: "x".repeat(resourceCatalogBounds.maxBytes - 7) }),
    ).toThrow();
    expect(
      measureResourceCatalog({
        values: Array.from({ length: resourceCatalogBounds.maxArrayLength }, () => null),
      }).largestArray,
    ).toBe(resourceCatalogBounds.maxArrayLength);
    expect(() =>
      assertResourceCatalogBounds({
        values: Array.from({ length: resourceCatalogBounds.maxArrayLength + 1 }, () => null),
      }),
    ).toThrow();
    expect(
      measureResourceCatalog(
        Object.fromEntries(
          Array.from({ length: resourceCatalogBounds.maxObjectFields }, (_, index) => [
            `field${index}`,
            null,
          ]),
        ),
      ).largestObject,
    ).toBe(resourceCatalogBounds.maxObjectFields);
    expect(() =>
      assertResourceCatalogBounds(
        Object.fromEntries(
          Array.from({ length: resourceCatalogBounds.maxObjectFields + 1 }, (_, index) => [
            `field${index}`,
            null,
          ]),
        ),
      ),
    ).toThrow();
    let exactDepth: unknown = null;
    for (let index = 0; index < resourceCatalogBounds.maxDepth - 1; index += 1)
      exactDepth = { child: exactDepth };
    expect(measureResourceCatalog(exactDepth).depth).toBe(resourceCatalogBounds.maxDepth);
    let overDepth: unknown = null;
    for (let index = 0; index < resourceCatalogBounds.maxDepth; index += 1)
      overDepth = { child: overDepth };
    expect(() => assertResourceCatalogBounds(overDepth)).toThrow();
  });
});
