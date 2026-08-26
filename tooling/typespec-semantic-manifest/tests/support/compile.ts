import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

export const repositoryRoot = resolve(import.meta.dirname, "../../../..");
export const contractRoot = resolve(repositoryRoot, "contracts/external-garfex/resource-master");
export const metadataFixtureRoot = resolve(
  repositoryRoot,
  "tooling/typespec-semantic-manifest/tests/fixtures/metadata",
);
export const authorityFixtureRoot = resolve(
  repositoryRoot,
  "tooling/typespec-semantic-manifest/tests/fixtures/authority",
);

export const expectedContractIdentity = "garfex.resource-master.external-client-contract";
export const expectedCompatibilityRevision = "1";

export const compileProject = (cwd: string) =>
  spawnSync("corepack", ["pnpm", "exec", "tsp", "compile", ".", "--no-emit"], {
    cwd,
    encoding: "utf8",
  });

export const outputOf = (result: ReturnType<typeof compileProject>) =>
  `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
