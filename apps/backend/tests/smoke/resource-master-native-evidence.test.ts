import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { jdS002CaseIds, jdS002Cases } from "./jd-s-002-cases.js";

type JsonObject = Record<string, unknown>;

type EvidenceSchema = {
  readonly required: readonly string[];
  readonly properties: JsonObject;
};

const smokeDirectory = dirname(fileURLToPath(import.meta.url));
const schemaPath = join(smokeDirectory, "resource-master-native-evidence.schema.json");
const evidencePath = join(smokeDirectory, "resource-master-native-evidence.json");
const generatedBindingPaths = [
  {
    relativePath: "apps/backend/convex/_generated/api.d.ts",
    absolutePath: join(smokeDirectory, "../../convex/_generated/api.d.ts"),
  },
  {
    relativePath: "apps/backend/convex/_generated/api.js",
    absolutePath: join(smokeDirectory, "../../convex/_generated/api.js"),
  },
] as const;

function readJson(path: string): JsonObject {
  return JSON.parse(readFileSync(path, "utf8")) as JsonObject;
}

function generatedClientDigest(): string {
  const digest = createHash("sha256");
  for (const binding of generatedBindingPaths) {
    digest.update(binding.relativePath);
    digest.update("\0");
    digest.update(readFileSync(binding.absolutePath));
    digest.update("\0");
  }
  return `sha256:${digest.digest("hex")}`;
}

describe("Resource Master native smoke evidence", () => {
  it("requires the closed matrix when a live result is marked complete", () => {
    const schema = readJson(schemaPath) as unknown as EvidenceSchema;
    const evidence = readJson(evidencePath);
    const allowedKeys = new Set(Object.keys(schema.properties));

    expect(schema.required).toEqual(
      expect.arrayContaining([
        "evidenceKind",
        "evidenceStatus",
        "matrixVersion",
        "targetKind",
        "redactedTarget",
        "smokeIdentity",
      ]),
    );
    expect(Object.keys(evidence).every((key) => allowedKeys.has(key))).toBe(true);
    for (const key of schema.required) expect(evidence).toHaveProperty(key);

    expect(evidence.evidenceKind).toBe("real-generated-client-smoke");
    expect(["complete", "pending-rerun"]).toContain(evidence.evidenceStatus);
    expect(evidence.matrixVersion).toBe("JD-S-002/closed-v2");
    expect(["local-anonymous", "dev"]).toContain(evidence.targetKind);
    expect(evidence.redactedTarget).toMatch(/^(https?:\/\/)?[A-Za-z0-9.:-]+$/);
    expect(evidence.convexVersion).toBe("1.45.0");
    expect(evidence.manifestDigest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(evidence.generatedValidatorDigest).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(evidence.generatedClientDigest).toBe(generatedClientDigest());
    expect(evidence.commandExitStatus).toBe(0);
    expect(createHash("sha256").update(readFileSync(evidencePath)).digest("hex")).toBe(
      "cf84bcf7801bbfdf3051633f2938f76a2f16a1cbdc12b3fe7231bacb8b1facbd",
    );

    const identity = evidence.smokeIdentity as JsonObject;
    expect(Object.keys(identity).sort()).toEqual(["gauge", "runId"]);
    expect(identity.runId).toEqual(expect.any(Number));
    expect(identity.runId).toBeGreaterThanOrEqual(1);
    expect(identity.runId).toBeLessThanOrEqual(2_147_483_647);
    expect(identity.gauge).toMatch(/^[1-9][0-9]*$/);

    if (evidence.evidenceStatus === "pending-rerun") {
      expect(evidence).not.toHaveProperty("cases");
      return;
    }

    const cases = evidence.cases as JsonObject[];
    const caseSchema = (schema.properties.cases as JsonObject).items as JsonObject;
    const allowedCaseKeys = new Set(Object.keys(caseSchema.properties as JsonObject));
    const requiredCaseKeys = caseSchema.required as readonly string[];
    expect(cases).toHaveLength(34);
    expect(cases.map((entry) => entry.id)).toEqual(jdS002CaseIds);
    expect(new Set(cases.map((entry) => entry.id)).size).toBe(34);
    expect(cases.filter((entry) => entry.category === "transport-rejection")).toHaveLength(19);
    expect(cases.filter((entry) => entry.category === "canonical-invalid")).toHaveLength(10);
    expect(cases.filter((entry) => entry.category === "accepted")).toHaveLength(5);
    expect(
      cases.every((entry) => Object.keys(entry).every((key) => allowedCaseKeys.has(key))),
    ).toBe(true);
    expect(cases.every((entry) => requiredCaseKeys.every((key) => key in entry))).toBe(true);
    expect(
      cases.every((entry) =>
        ["transport-rejection", "canonical-invalid", "accepted"].includes(String(entry.category)),
      ),
    ).toBe(true);
    expect(cases.every((entry) => entry.category === entry.observed)).toBe(true);
    for (const testCase of jdS002Cases) {
      const evidenceCase = cases.find((entry) => entry.id === testCase.id);
      expect(evidenceCase?.category).toBe(testCase.category);
    }

    const serialized = JSON.stringify(evidence);
    expect(serialized).not.toMatch(/CONVEX_DEPLOY_KEY|token|secret|password|credential/i);
    expect(serialized).not.toMatch(/deploymentName|deploymentId|productive/i);
  });
});
