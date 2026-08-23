import { describe, expect, it } from "vitest";
import {
  evaluateApplicability,
  resolveEffectiveBindings,
} from "../src/resource-master/domain/schema.js";
import { parseResourceCatalogPayload } from "../src/resource-master/domain/catalog-snapshot.js";
import { cableCatalog } from "./fixtures/cable-catalog.js";
import type { ApplicabilityBinding } from "../src/resource-master/domain/types.js";

const family: ApplicabilityBinding = {
  id: "family-color",
  scope: "FAMILY",
  ownerCode: "CONDUCTORES",
  attributeCode: "color",
  active: true,
  defaultResult: { mode: "OPTIONAL", identity: false },
  rules: [],
};

describe("effective schema resolution", () => {
  it("inherits family, fully replaces with type, and suppresses with inactive override", () => {
    expect(resolveEffectiveBindings([family], "CONDUCTORES", "CABLE")[0]?.defaultResult.mode).toBe(
      "OPTIONAL",
    );
    const override: ApplicabilityBinding = {
      ...family,
      id: "type-color",
      scope: "TYPE",
      ownerCode: "CABLE",
      defaultResult: { mode: "REQUIRED", identity: true },
    };
    expect(resolveEffectiveBindings([family, override], "CONDUCTORES", "CABLE")).toEqual([
      override,
    ]);
    expect(
      resolveEffectiveBindings([family, { ...override, active: false }], "CONDUCTORES", "CABLE"),
    ).toEqual([]);
  });

  it("is storage-order independent and never returns duplicate attributes", () => {
    const gauge = { ...family, id: "gauge", attributeCode: "gauge" };
    expect(resolveEffectiveBindings([gauge, family], "CONDUCTORES", "CABLE")).toEqual(
      resolveEffectiveBindings([family, gauge], "CONDUCTORES", "CABLE"),
    );
  });

  it("rejects duplicate same-scope bindings deterministically in either storage order", () => {
    const duplicate = { ...family, id: "family-color-duplicate" };
    const messages = [
      [family, duplicate],
      [duplicate, family],
    ].map((bindings) => {
      try {
        resolveEffectiveBindings(bindings, "CONDUCTORES", "CABLE");
        return "no error";
      } catch (error) {
        return error instanceof Error ? error.message : String(error);
      }
    });

    expect(messages[0]).toMatch(/duplicate FAMILY binding.*CONDUCTORES.*color/i);
    expect(messages[1]).toBe(messages[0]);
  });

  it("validates the complete Cable snapshot without replacing effective-binding semantics", () => {
    const snapshot = parseResourceCatalogPayload({
      catalogKey: "resource-master",
      schemaVersion: 1,
      sourceVersion: "cable-catalog-v1",
      lifecycle: "ACTIVE",
      catalog: cableCatalog,
    });
    expect(
      resolveEffectiveBindings(snapshot.catalog.bindings, "CONDUCTORES", "CABLE"),
    ).toHaveLength(5);
    expect(snapshot.catalog.presentation.attributeOrder).toEqual([
      "conductor_material",
      "gauge",
      "insulation",
      "color",
      "voltage",
    ]);
  });

  it("uses explicit defaults, accepts identical matches, and rejects conflicting matches", () => {
    const binding: ApplicabilityBinding = {
      ...family,
      rules: [
        {
          when: { attributeCode: "insulation", optionCode: "DESNUDO" },
          result: { mode: "NOT_APPLICABLE", identity: false },
        },
      ],
    };
    expect(evaluateApplicability(binding, {})).toEqual(binding.defaultResult);
    expect(evaluateApplicability(binding, { insulation: "DESNUDO" })).toEqual({
      mode: "NOT_APPLICABLE",
      identity: false,
    });
    expect(
      evaluateApplicability(
        {
          ...binding,
          rules: [
            ...binding.rules,
            {
              when: { attributeCode: "insulation", optionCode: "DESNUDO" },
              result: { mode: "REQUIRED", identity: true },
            },
          ],
        },
        { insulation: "DESNUDO" },
      ),
    ).toEqual({ kind: "AMBIGUOUS_APPLICABILITY" });
  });
});
