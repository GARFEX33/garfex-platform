import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

describe("manifest-derived Resource Master Convex validators", () => {
  it("emits one closed validator pair for every named operation", () => {
    const source = readFileSync(
      join(process.cwd(), "apps/backend/convex/resourceMasterContract.generated.ts"),
      "utf8",
    );
    for (const operation of [
      "getTaxonomy",
      "getEffectiveResourceSchema",
      "getValidOptions",
      "getNaturalUnits",
      "getResource",
      "searchResources",
      "describeResource",
      "createResource",
      "updateNonIdentityData",
      "deactivateResource",
    ]) {
      expect(source).toContain(`export const ${operation}Args`);
      expect(source).toContain(`export const ${operation}Returns`);
    }
    expect(source).toContain("const resourceAttribute = v.object({");
    expect(source).toContain('v.literal("INVALID_ARGUMENT")');
    expect(source).toContain("Manifest digest:");
  });
});
