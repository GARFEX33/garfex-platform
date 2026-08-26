import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  type ExternalErrorCode,
  externalErrorCodes,
  externalOperationIdentifiers,
} from "../src/external-garfex-boundary/client-facing/contract.js";
import { resourceMasterOperationCapabilities } from "../src/resource-master/application/authorization.js";

const documentationUrl = new URL("../../../docs/external-garfex-boundary.md", import.meta.url);
const canonicalUrls = {
  externalClient: new URL("../../../docs/external-client-boundary.md", import.meta.url),
  auth: new URL("../../../docs/auth-boundary.md", import.meta.url),
  architecture: new URL("../../../docs/architecture.md", import.meta.url),
  generated: new URL(
    "../../../docs/generated/resource-master-external-contract.md",
    import.meta.url,
  ),
} as const;
const fixtureUrl = new URL(
  "./fixtures/external-garfex-boundary/compatibility.json",
  import.meta.url,
);

const expectedMetadata: Record<ExternalErrorCode, string> = {
  UNAUTHENTICATED: "none",
  FORBIDDEN: "none",
  INVALID_ARGUMENT: "fieldIssues",
  INVALID_REFERENCE: "fieldIssues",
  VALIDATION_FAILED: "fieldIssues",
  NOT_FOUND: "none",
  DUPLICATE: "existingResourceId",
  CONFLICT: "currentRevision",
  INVALID_LIFECYCLE: "none",
  CATALOG_UNAVAILABLE: "none",
  INTERNAL_FAILURE: "none",
};

function documentation(): string {
  return readFileSync(documentationUrl, "utf8");
}

function section(name: string): string {
  const source = documentation();
  const start = `<!-- garfex:${name}:start -->`;
  const end = `<!-- garfex:${name}:end -->`;
  const startIndex = source.indexOf(start);
  const endIndex = source.indexOf(end, startIndex + start.length);
  if (startIndex < 0 || endIndex < 0) throw new Error(`missing documentation section: ${name}`);
  return source.slice(startIndex + start.length, endIndex);
}

function tableRows(name: string): string[][] {
  return section(name)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith("|"))
    .map((line) =>
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim().replaceAll("`", "")),
    )
    .filter(
      (cells) =>
        cells.length > 0 &&
        !cells[0]?.startsWith("---") &&
        cells[0] !== "External operation" &&
        cells[0] !== "External code",
    );
}

function markers(name: string): string[] {
  return section(name)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /^[a-z0-9-]+$/.test(line));
}

function record(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("expected a record");
  }
  return value as Record<string, unknown>;
}

function fixture(): Record<string, unknown> {
  return record(JSON.parse(readFileSync(fixtureUrl, "utf8")) as unknown);
}

function canonicalDocument(name: keyof typeof canonicalUrls): string {
  return readFileSync(canonicalUrls[name], "utf8");
}

describe("external GARFEX documentation parity", () => {
  it("matches executable operations, mappings, fixture entries, and error metadata", () => {
    const source = documentation();
    expect(
      source.startsWith(
        "# External Client Contract != Resource Master Public Application Contract\n",
      ),
    ).toBe(true);

    const mappings = externalOperationIdentifiers.map((operation) => [
      operation,
      operation,
      resourceMasterOperationCapabilities[operation],
    ]);
    expect(tableRows("operation-parity")).toEqual(mappings);

    const loaded = fixture();
    expect(Object.keys(record(loaded.operations))).toEqual([...externalOperationIdentifiers]);
    expect(
      tableRows("error-parity").map(([code, , metadata]) => [code, metadata?.split(/\s+/)[0]]),
    ).toEqual(externalErrorCodes.map((code) => [code, expectedMetadata[code]]));

    const matrix = record(loaded.errorMatrix);
    expect(Object.keys(matrix)).toEqual([...externalErrorCodes]);
    for (const code of externalErrorCodes) {
      const error = record(record(matrix[code]).error);
      const metadata =
        Object.keys(error)
          .filter((key) => key !== "code")
          .join(",") || "none";
      expect(metadata).toBe(expectedMetadata[code]);
    }
  });

  it("keeps the reviewed technology and consumer decisions explicitly open", () => {
    expect(markers("non-decisions")).toEqual([
      "transport-protocol-status-framing",
      "network-reachability",
      "schema-idl-generation",
      "sdk-distribution-version-mechanics",
      "productive-idp-session",
      "consumer-behavior",
    ]);
  });

  it("cross-links the three boundaries, generated semantics, and acceptance evidence", () => {
    const boundary = documentation();
    expect(boundary).toContain("contracts/external-garfex/resource-master/");
    expect(boundary).toContain("generated/resource-master-external-contract.md");
    expect(boundary).toContain("accepted-semantic-manifest.json");
    expect(boundary).toContain("stale-artifact");
    expect(boundary).toContain("breaking-change");
    expect(boundary).toContain("TypeSpec");
    expect(boundary).toContain("fresh `ActorContext`");
    expect(boundary).toContain("final deny-by-default capability");
    expect(boundary).toContain("Convex remains a private");

    const canonicalRecords = (["externalClient", "auth", "architecture"] as const).map(
      canonicalDocument,
    );
    const linkedRecords = canonicalRecords.join("\n");
    for (const record of canonicalRecords) {
      expect(record).toContain("external-garfex-boundary.md");
      expect(record).toContain("contracts/external-garfex/resource-master/");
      expect(record).toContain("semantic-manifest.json");
      expect(record).toContain("accepted-semantic-manifest.json");
      expect(record).toContain("resource-master-external-contract.md");
      expect(record).toContain("opaque");
      expect(record).toContain("transport");
      expect(record).toContain("Convex");
    }
    for (const recordName of ["external-client-boundary.md", "auth-boundary.md", "architecture.md"])
      expect(linkedRecords).toContain(recordName);

    const generated = canonicalDocument("generated");
    expect(generated).toContain("Compatibility revision: `1`");
    expect(generated).toContain("opaque string");
    expect(generated).not.toMatch(
      /ActorContext|capabilit(?:y|ies)|Convex|persistence|HTTP|route|header/i,
    );
  });
});
