import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

const smokeDirectory = dirname(fileURLToPath(import.meta.url));
const repositoryRoot = resolve(smokeDirectory, "../../../../");
const archivedChangePath =
  "openspec/changes/archive/2026-08-26-resource-master-convex-native-transport";
const activeChangePrefix = "openspec/changes/resource-master-convex-native-transport/";
const ledgerPath = join(repositoryRoot, archivedChangePath, "strict-tdd-task-test-ledger.json");

function resolveArchivedTaskSource(path: string): string {
  const repositoryPath = resolve(repositoryRoot, path);
  if (existsSync(repositoryPath) || !path.startsWith(activeChangePrefix)) return repositoryPath;
  return resolve(repositoryRoot, archivedChangePath, path.slice(activeChangePrefix.length));
}

const expectedTaskIds = [
  ...Array.from({ length: 5 }, (_, index) => `WU1-${index + 1}`),
  ...Array.from({ length: 5 }, (_, index) => `WU2-${index + 1}`),
  ...Array.from({ length: 6 }, (_, index) => `WU3-${index + 1}`),
  ...Array.from({ length: 6 }, (_, index) => `WU4-${index + 1}`),
  ...Array.from({ length: 5 }, (_, index) => `WU5-${index + 1}`),
  ...Array.from({ length: 6 }, (_, index) => `WU6-${index + 1}`),
  ...Array.from({ length: 6 }, (_, index) => `WU7-${index + 1}`),
];

type LedgerRow = {
  readonly taskId: string;
  readonly workUnit: string;
  readonly task: string;
  readonly taskSource: string;
  readonly taskText: string;
  readonly testFile: string;
  readonly red: {
    readonly command: string;
    readonly exit: number;
    readonly assertion: string;
    readonly provenance: string;
  };
  readonly green: { readonly command: string; readonly test: string };
  readonly triangulation: string;
  readonly evidenceSource: string;
};

describe("strict-TDD task-to-test ledger", () => {
  it("maps every implementation task to concrete, non-placeholder evidence", () => {
    const rows = JSON.parse(readFileSync(ledgerPath, "utf8")) as LedgerRow[];
    expect(rows).toHaveLength(39);
    expect(new Set(rows.map(({ taskId }) => taskId)).size).toBe(39);
    expect(rows.map(({ taskId }) => taskId)).toEqual(expectedTaskIds);

    for (const row of rows) {
      expect(row.workUnit).toMatch(/^WU[1-7]$/);
      expect(row.task.length).toBeGreaterThan(20);
      const taskSource = row.taskSource.match(/^(.*):(\d+)$/);
      expect(taskSource).not.toBeNull();
      expect(existsSync(resolveArchivedTaskSource(taskSource?.[1] ?? ""))).toBe(true);
      expect(Number(taskSource?.[2])).toBeGreaterThan(0);
      expect(row.taskText).toMatch(/^- \[x\] /);
      expect(row.testFile.length).toBeGreaterThan(10);
      expect(existsSync(resolve(repositoryRoot, row.testFile))).toBe(true);
      expect(row.red.command).toMatch(/vitest|contract:check|typecheck|test:architecture/);
      expect([0, 1]).toContain(row.red.exit);
      expect(row.red.assertion.length).toBeGreaterThan(20);
      expect(row.red.provenance).toMatch(/^RECONSTRUCTED CONTROLLED-RED:/);
      expect(row.red.provenance).toMatch(/does not claim historical execution/);
      expect(row.green.command).toContain("vitest");
      expect(row.green.test.length).toBeGreaterThan(20);
      expect(row.triangulation.length).toBeGreaterThan(20);
      expect(row.evidenceSource.length).toBeGreaterThan(20);
      expect(JSON.stringify(row)).not.toMatch(/TODO|TBD|fabricat|placeholder/i);
    }
  });
});
