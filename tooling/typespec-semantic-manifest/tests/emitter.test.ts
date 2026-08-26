import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import {
  compileWithEmitter,
  contractRoot,
  createOutputDir,
  emitterFixtureRoot,
  expectedCompatibilityRevision,
  expectedContractIdentity,
  expectedOperations,
  filesUnder,
  manifestBytes,
  manifestJson,
  manifestPath,
  outputOf,
  removeOutputDir,
} from "./support/emit.js";

const asRecord = (value: unknown): Record<string, unknown> => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("expected a record");
  }
  return value as Record<string, unknown>;
};

const asRecords = (value: unknown): Record<string, unknown>[] => {
  if (!Array.isArray(value)) throw new Error("expected an array");
  return value.map(asRecord);
};

describe("transport-neutral semantic emitter", () => {
  it("emits one checker-resolved canonical manifest with exact contract metadata", () => {
    const outputDir = createOutputDir();
    try {
      const result = compileWithEmitter(contractRoot, outputDir);
      expect(result.status, outputOf(result)).toBe(0);

      const manifest = manifestJson(outputDir);
      expect(manifest.externalContractIdentity).toBe(expectedContractIdentity);
      expect(manifest.compatibilityRevision).toBe(expectedCompatibilityRevision);
      expect(manifest.schemaRevision).toBe(1);
      expect(manifest.schemaRevision).not.toBe(manifest.compatibilityRevision);

      const operations = asRecords(manifest.operations);
      expect(operations.map((operation) => operation.name)).toEqual(expectedOperations);
      expect(new Set(operations.map((operation) => operation.name)).size).toBe(10);
      expect(operations).toEqual(
        expectedOperations.map((name) =>
          expect.objectContaining({
            name,
            request: expect.any(String),
            success: expect.any(String),
            outcome: expect.any(String),
            failure: "SafeFailure",
          }),
        ),
      );

      const models = asRecords(manifest.models);
      const resource = models.find((model) => model.name === "Resource");
      expect(resource).toBeDefined();
      expect(asRecords(resource?.properties)).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "resourceId", optional: false }),
          expect.objectContaining({ name: "attributes", optional: false }),
          expect.objectContaining({ name: "revision", optional: false }),
        ]),
      );

      const scalars = asRecords(manifest.scalars);
      expect(scalars).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "NonEmptyCode" }),
          expect.objectContaining({ name: "SearchLimit" }),
        ]),
      );
      expect(
        asRecord(scalars.find((scalar) => scalar.name === "SearchLimit")?.constraints),
      ).toEqual({
        maxValue: 50,
        minValue: 1,
      });

      const enums = asRecords(manifest.enums);
      expect(enums).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            name: "ExternalFailureCode",
            values: expect.arrayContaining(expectedFailureCodes),
          }),
        ]),
      );

      const unions = asRecords(manifest.unions);
      expect(unions).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "AttributeValue" }),
          expect.objectContaining({ name: "SafeFailure" }),
        ]),
      );

      const provenance = asRecord(manifest.provenance);
      expect(provenance.compilerVersion).toBe("1.15.0");
      expect(provenance.emitterVersion).toBe("0.1.0");
      expect(provenance.sourceDigest).toMatch(/^sha256:[0-9a-f]{64}$/);
      expect(provenance.emitterOptionsDigest).toMatch(/^sha256:[0-9a-f]{64}$/);

      const bytes = manifestBytes(outputDir);
      expect(bytes.toString("utf8")).toBe(`${JSON.stringify(manifest, null, 2)}\n`);
      expect(bytes.toString("utf8")).not.toContain("\r");
    } finally {
      removeOutputDir(outputDir);
    }
  });

  it("configures only the local emitter and keeps the authority transport-neutral", () => {
    const config = readFileSync(resolve(contractRoot, "tspconfig.yaml"), "utf8");
    expect(config).toContain('"@garfex/typespec-semantic-manifest"');
    expect(config).not.toMatch(/(?:http|rest|openapi|scalar|orval)/i);

    const sources = filesUnder(contractRoot)
      .filter((path) => path.endsWith(".tsp"))
      .map((path) => readFileSync(path, "utf8"))
      .join("\n");
    expect(sources).not.toMatch(/@(?:http|rest|openapi|route|header|statusCode)\b/i);
  });

  it.each([
    ["transport", /(?:invalid-ref|transport|http)/i],
    ["duplicate-operation", /(?:duplicate|external-contract-operation-extra)/i],
    ["unsupported-shape", /external-contract-emitter-unsupported/i],
    ["diagnostic", /external-contract-emitter-recursive/i],
  ] as const)("rejects %s before writing a partial manifest", (fixture, diagnostic) => {
    const outputDir = createOutputDir();
    const fixturePath = resolve(emitterFixtureRoot, fixture);
    try {
      const result = compileWithEmitter(fixturePath, outputDir);
      expect(result.status, outputOf(result)).not.toBe(0);
      expect(outputOf(result)).toMatch(diagnostic);
      expect(existsSync(outputDir)).toBe(true);
      expect(
        filesUnder(outputDir).filter((path) => path.endsWith("semantic-manifest.json")),
      ).toEqual([]);
      expect(manifestPath(outputDir)).toBeUndefined();
    } finally {
      removeOutputDir(outputDir);
    }
  });
});

const expectedFailureCodes = [
  "UNAUTHENTICATED",
  "FORBIDDEN",
  "INVALID_ARGUMENT",
  "INVALID_REFERENCE",
  "VALIDATION_FAILED",
  "NOT_FOUND",
  "DUPLICATE",
  "CONFLICT",
  "INVALID_LIFECYCLE",
  "CATALOG_UNAVAILABLE",
  "INTERNAL_FAILURE",
];
