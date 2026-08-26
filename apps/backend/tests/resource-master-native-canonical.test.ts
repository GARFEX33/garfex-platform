import { describe, expect, it } from "vitest";
import {
  validateExternalCreateResourceRequest,
  validateExternalGetTaxonomySuccess,
  validateExternalGetValidOptionsSuccess,
} from "../src/external-garfex-boundary/client-facing/validation.js";
import {
  projectExternalGetTaxonomy,
  projectExternalGetValidOptions,
} from "../src/external-garfex-boundary/trusted/projections.js";

const canonicalAttributes = [
  {
    attributeCode: "finish",
    value: "bare",
    displayValue: "Bare",
    identityParticipating: true,
  },
];

describe("canonical Resource Master native dialect", () => {
  it("rejects legacy code-keyed create attributes", () => {
    expect(
      validateExternalCreateResourceRequest({
        classCode: "hardware",
        familyCode: "wire",
        typeCode: "solid-wire",
        naturalUnitCode: "meter",
        attributes: { finish: "bare" },
      }),
    ).toMatchObject({ ok: false, error: { code: "INVALID_ARGUMENT" } });
  });

  it("accepts canonical attributes as an explicit array", () => {
    expect(
      validateExternalCreateResourceRequest({
        classCode: "hardware",
        familyCode: "wire",
        typeCode: "solid-wire",
        naturalUnitCode: "meter",
        attributes: canonicalAttributes,
      }),
    ).toEqual({
      classCode: "hardware",
      familyCode: "wire",
      typeCode: "solid-wire",
      naturalUnitCode: "meter",
      attributes: canonicalAttributes,
    });
  });

  it("requires operation-specific success wrappers", () => {
    expect(
      validateExternalGetTaxonomySuccess([{ code: "hardware", name: "Hardware", families: [] }]),
    ).toMatchObject({ ok: false });
    expect(validateExternalGetTaxonomySuccess({ items: [] })).toEqual({ items: [] });
    expect(validateExternalGetValidOptionsSuccess([{ code: "bare", label: "Bare" }])).toMatchObject(
      { ok: false },
    );
    expect(validateExternalGetValidOptionsSuccess({ options: [] })).toEqual({ options: [] });
  });

  it("projects every discovery success into its canonical wrapper", () => {
    expect(
      projectExternalGetTaxonomy([{ code: "hardware", name: "Hardware", families: [] }] as never),
    ).toEqual({
      items: [{ code: "hardware", name: "Hardware", families: [] }],
    });
    expect(projectExternalGetValidOptions([{ code: "bare", label: "Bare" }] as never)).toEqual({
      options: [{ code: "bare", label: "Bare" }],
    });
  });
});
