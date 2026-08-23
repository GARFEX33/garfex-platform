import { describe, expect, it } from "vitest";
import { canonicalizeValue } from "../src/resource-master/domain/canonicalization.js";

describe("resource value canonicalization", () => {
  it("canonicalizes integers and exact decimals without floating point", () => {
    expect(canonicalizeValue("INTEGER", "01")).toMatchObject({ identity: "1" });
    expect(canonicalizeValue("INTEGER", "+1")).toMatchObject({ identity: "1" });
    expect(canonicalizeValue("DECIMAL", "01.000")).toMatchObject({ identity: "1" });
    expect(canonicalizeValue("DECIMAL", "-0.0100")).toMatchObject({ identity: "-0.01" });
  });

  it("canonicalizes the remaining supported value kinds", () => {
    expect(canonicalizeValue("CONTROLLED_OPTION", " cobre ")).toMatchObject({ identity: "COBRE" });
    expect(canonicalizeValue("BOOLEAN", false)).toMatchObject({ identity: "false" });
    expect(canonicalizeValue("CONTROLLED_TEXT", "  Café   COBRE ")).toMatchObject({
      identity: "café cobre",
      display: "Café COBRE",
    });
    expect(canonicalizeValue("QUANTITY", { magnitude: "01.00", unitCode: "m" })).toMatchObject({
      identity: "1 M",
    });
  });

  it("rejects floats for integers, inexact boolean text, and malformed decimals", () => {
    expect(() => canonicalizeValue("INTEGER", "1.1")).toThrow();
    expect(() => canonicalizeValue("BOOLEAN", "true")).toThrow();
    expect(() => canonicalizeValue("DECIMAL", "1e2")).toThrow();
    expect(() => canonicalizeValue("DECIMAL", 1.1)).toThrow();
    expect(() => canonicalizeValue("QUANTITY", { magnitude: 1.1, unitCode: "M" })).toThrow();
  });
});
