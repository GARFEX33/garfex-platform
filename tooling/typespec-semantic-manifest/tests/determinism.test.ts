import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { canonicalizeManifest, serializeManifest } from "../src/manifest-model.js";
import {
  compileWithEmitter,
  contractRoot,
  createOutputDir,
  expectedCompatibilityRevision,
  expectedContractIdentity,
  emitterFixtureRoot,
  expectedOperations,
  manifestBytes,
  manifestJson,
  manifestPath,
  outputOf,
  removeOutputDir,
} from "./support/emit.js";

describe("semantic manifest determinism", () => {
  it("produces byte-identical UTF-8 LF output across clean generation runs", () => {
    const firstOutput = createOutputDir();
    const secondOutput = createOutputDir();
    try {
      const first = compileWithEmitter(contractRoot, firstOutput, {
        TZ: "UTC",
        HOSTNAME: "first-machine",
        COMPUTERNAME: "first-machine",
      });
      const second = compileWithEmitter(contractRoot, secondOutput, {
        TZ: "Pacific/Auckland",
        HOSTNAME: "second-machine",
        COMPUTERNAME: "second-machine",
      });
      expect(first.status, outputOf(first)).toBe(0);
      expect(second.status, outputOf(second)).toBe(0);
      expect(manifestBytes(firstOutput)).toEqual(manifestBytes(secondOutput));
    } finally {
      removeOutputDir(firstOutput);
      removeOutputDir(secondOutput);
    }
  });

  it("does not depend on semantic declaration insertion or compiler traversal order", () => {
    const outputDir = createOutputDir();
    try {
      const result = compileWithEmitter(contractRoot, outputDir);
      expect(result.status, outputOf(result)).toBe(0);
      const manifest = manifestJson(outputDir);
      const reordered = {
        ...manifest,
        operations: [...(manifest.operations as unknown[]).reverse()],
        models: [...(manifest.models as unknown[]).reverse()],
        enums: [...(manifest.enums as unknown[]).reverse()],
        unions: [...(manifest.unions as unknown[]).reverse()],
        scalars: [...(manifest.scalars as unknown[]).reverse()],
      };

      const canonical = serializeManifest(canonicalizeManifest(manifest));
      const reorderedCanonical = serializeManifest(canonicalizeManifest(reordered));
      expect(reorderedCanonical).toBe(canonical);
      expect(
        (canonicalizeManifest(reordered).operations as { name: string }[]).map((op) => op.name),
      ).toEqual(expectedOperations);
      expect(canonicalizeManifest(reordered)).toEqual(
        expect.objectContaining({
          externalContractIdentity: expectedContractIdentity,
          compatibilityRevision: expectedCompatibilityRevision,
        }),
      );
    } finally {
      removeOutputDir(outputDir);
    }
  });

  it("keeps provenance free of timestamps, paths, machines, and syntax node identifiers", () => {
    const outputDir = createOutputDir();
    try {
      const result = compileWithEmitter(contractRoot, outputDir);
      expect(result.status, outputOf(result)).toBe(0);
      const path = manifestPath(outputDir);
      expect(path).toBeDefined();
      const text = readFileSync(path as string, "utf8");
      expect(text).not.toMatch(
        /(?:\/home\/|[A-Z]:\\\\|node_modules\/|_id|timestamp|hostname|machine)/i,
      );
      expect(text).toMatch(/"sourceDigest":\s*"sha256:[0-9a-f]{64}"/);
    } finally {
      removeOutputDir(outputDir);
    }
  });

  it("does not accept a manifest after a compiler diagnostic", () => {
    const outputDir = createOutputDir();
    const fixturePath = resolve(emitterFixtureRoot, "transport");
    try {
      const result = compileWithEmitter(fixturePath, outputDir);
      expect(result.status, outputOf(result)).not.toBe(0);
      expect(manifestBytesIfPresent(outputDir)).toBeUndefined();
    } finally {
      removeOutputDir(outputDir);
    }
  });
});

const manifestBytesIfPresent = (outputDir: string): Buffer | undefined => {
  try {
    return manifestBytes(outputDir);
  } catch {
    return undefined;
  }
};
