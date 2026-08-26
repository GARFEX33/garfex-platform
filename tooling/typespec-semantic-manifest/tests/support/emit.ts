import { mkdtempSync, readFileSync, readdirSync, rmSync } from "node:fs";
import { join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import { repositoryRoot } from "./compile.js";

export {
  contractRoot,
  expectedCompatibilityRevision,
  expectedContractIdentity,
} from "./compile.js";
export const emitterFixtureRoot = resolve(
  repositoryRoot,
  "tooling/typespec-semantic-manifest/tests/fixtures/emitter",
);

export const expectedOperations = [
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
] as const;

export const compileWithEmitter = (
  cwd: string,
  outputDir: string,
  environment: NodeJS.ProcessEnv = {},
) =>
  spawnSync(
    "corepack",
    [
      "pnpm",
      "exec",
      "tsp",
      "compile",
      ".",
      "--emit",
      "@garfex/typespec-semantic-manifest",
      "--output-dir",
      outputDir,
      "--option",
      `@garfex/typespec-semantic-manifest.emitter-output-dir=${outputDir}`,
    ],
    { cwd, encoding: "utf8", env: { ...process.env, ...environment } },
  );

export const outputOf = (result: ReturnType<typeof compileWithEmitter>) =>
  `${result.stdout ?? ""}\n${result.stderr ?? ""}`;

export const createOutputDir = () => mkdtempSync(join(repositoryRoot, ".typespec-emitter-test-"));

export const removeOutputDir = (outputDir: string) =>
  rmSync(outputDir, { recursive: true, force: true });

export const filesUnder = (directory: string): string[] => {
  const entries = readdirSync(directory, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? filesUnder(path) : [path];
  });
};

export const manifestPath = (outputDir: string) =>
  filesUnder(outputDir).find((path) => path.endsWith("semantic-manifest.json"));

export const manifestBytes = (outputDir: string) => {
  const path = manifestPath(outputDir);
  if (path === undefined) throw new Error(`semantic manifest was not emitted under ${outputDir}`);
  return readFileSync(path);
};

export const manifestJson = (outputDir: string): Record<string, unknown> =>
  JSON.parse(manifestBytes(outputDir).toString("utf8")) as Record<string, unknown>;
