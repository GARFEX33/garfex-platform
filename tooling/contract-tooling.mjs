import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const contract = join(root, "contracts/external-garfex/resource-master");
const manifestPath = join(contract, "generated/semantic-manifest.json");
const baselinePath = join(contract, "baseline/accepted-semantic-manifest.json");
const runtimePath = join(
  root,
  "apps/backend/src/external-garfex-boundary/client-facing/generated/semantic-contract.generated.ts",
);
const docsPath = join(root, "docs/generated/resource-master-external-contract.md");

const run = (command, args, cwd = root) => {
  const result = spawnSync(command, args, { cwd, encoding: "utf8" });
  if (result.status !== 0)
    throw new Error(`${command} ${args.join(" ")} failed\n${result.stdout}\n${result.stderr}`);
  return result.stdout;
};

const compile = (cwd, noEmit) =>
  run("corepack", ["pnpm", "exec", "tsp", "compile", ".", ...(noEmit ? ["--no-emit"] : [])], cwd);
const json = (path) => JSON.parse(execFileSync("cat", [path], { encoding: "utf8" }));
const digestOf = (text) => `sha256:${createHash("sha256").update(text, "utf8").digest("hex")}`;
const { materializeArtifacts, checkMaterializedArtifacts, checkManifestBytes } = await import(
  "./typespec-semantic-manifest/src/materialize.ts"
);
const { checkManifestCompatibility } = await import("./typespec-semantic-manifest/src/compare.ts");

const materialize = async (manifest, write) => {
  const artifacts = materializeArtifacts(manifest);
  if (write) {
    await writeFile(runtimePath, artifacts.runtime, "utf8");
    await writeFile(docsPath, artifacts.documentation, "utf8");
  }
  return artifacts;
};

const generate = async () => {
  compile(contract, false);
  const manifest = json(manifestPath);
  await materialize(manifest, true);
  console.log("contract:generate wrote manifest, runtime, and consumer documentation");
};

const check = async () => {
  console.log(
    "contract:check (non-writing, read-only): TypeSpec -> manifest -> materializer -> baseline -> parity -> stale",
  );
  compile(contract, true);
  const temporary = await mkdtemp(join(root, ".contract-check-"));
  try {
    const temporaryContract = join(temporary, "resource-master");
    await cp(contract, temporaryContract, { recursive: true });
    const temporaryConfig = join(temporaryContract, "tspconfig.yaml");
    const config = await readFile(temporaryConfig, "utf8");
    await writeFile(
      temporaryConfig,
      config.replace("{project-root}/generated", "{project-root}/generated"),
      "utf8",
    );
    compile(temporaryContract, false);
    const candidateBytes = await readFile(
      join(temporaryContract, "generated/semantic-manifest.json"),
      "utf8",
    );
    const candidate = JSON.parse(candidateBytes);
    const committedBytes = await readFile(manifestPath, "utf8");
    const manifestIssues = checkManifestBytes(candidate, committedBytes);
    if (manifestIssues.length)
      throw new Error(manifestIssues.map((issue) => issue.message).join("; "));
    const baseline = json(baselinePath);
    const compatibility = checkManifestCompatibility(baseline, candidate);
    if (!compatibility.accepted)
      throw new Error(compatibility.violations.map(({ message }) => message).join("; "));
    const artifacts = materializeArtifacts(candidate);
    const runtime = await readFile(runtimePath, "utf8");
    const documentation = await readFile(docsPath, "utf8");
    const artifactIssues = checkMaterializedArtifacts(candidate, {
      runtime,
      documentation,
      manifestDigest: digestOf(candidateBytes),
    });
    if (artifactIssues.length)
      throw new Error(artifactIssues.map((issue) => issue.message).join("; "));
    if (runtime !== artifacts.runtime || documentation !== artifacts.documentation)
      throw new Error("generated artifact parity failed");
    console.log(
      `contract:check passed; digest ${digestOf(candidateBytes)}; temporary generation cleaned`,
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
};

const command = process.argv[2];
if (command === "generate") await generate();
else if (command === "check") await check();
else throw new Error(`unknown contract tooling command: ${command}`);
