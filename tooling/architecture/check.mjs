import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { relative, resolve, sep } from "node:path";
import process from "node:process";

const root = resolve(import.meta.dirname, "../..");
const workspaceMembers = ["apps", "packages"].flatMap((workspaceDirectory) => {
  const absoluteDirectory = resolve(root, workspaceDirectory);
  if (!existsSync(absoluteDirectory)) return [];

  return readdirSync(absoluteDirectory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .flatMap((entry) => {
      const member = resolve(absoluteDirectory, entry.name);
      const sourceDirectories = ["src", "convex"]
        .map((directory) => resolve(member, directory))
        .filter((directory) => existsSync(directory));
      return sourceDirectories.length > 0 ? sourceDirectories : [member];
    });
});
const requestedTargets = process.argv.slice(2);
const targets =
  requestedTargets.length > 0
    ? requestedTargets.map((target) => resolve(root, target))
    : [resolve(root, "tooling/architecture-fixtures/valid"), ...workspaceMembers];

const dependencyCruiser = resolve(
  root,
  "node_modules/dependency-cruiser/bin/dependency-cruise.mjs",
);
const cruise = spawnSync(
  process.execPath,
  [
    dependencyCruiser,
    "--config",
    resolve(root, ".dependency-cruiser.mjs"),
    "--output-type",
    "json",
    "--exclude",
    "(?:^|/)convex/_generated/",
    ...targets,
  ],
  { cwd: root, encoding: "utf8" },
);

if (cruise.error !== undefined) {
  console.error(`architecture checker could not start dependency-cruiser: ${cruise.error.message}`);
  process.exit(2);
}

let report;
try {
  report = JSON.parse(cruise.stdout);
} catch {
  console.error("architecture checker received invalid dependency-cruiser output");
  console.error(cruise.stderr.trim());
  process.exit(2);
}

const normalize = (path) => path.split(sep).join("/");
const moduleName = (path) => /(?:^|\/)modules\/([^/]+)\//.exec(path)?.[1];
const isPublicSurface = (path) =>
  /(?:^|\/)modules\/[^/]+\/public\.[cm]?[jt]s$/.test(path) ||
  /(?:^|\/)resource-master\/public\.[cm]?[jt]s$/.test(path);
const resourceLayer = (path) =>
  /(?:^|\/)resource-master\/(public\.[cm]?[jt]s|domain\/|application\/|infrastructure\/)/.exec(
    path,
  )?.[1];
const isResourceInternal = (path) =>
  /(?:^|\/)resource-master\/(?:domain|application|infrastructure)\//.test(path);
const isResourceCore = (path) =>
  /(?:^|\/)resource-master\/(?:public[^/]*\.[cm]?[jt]s|domain\/|application\/)/.test(path);
const isResourceDomain = (path) => /(?:^|\/)resource-master\/domain\//.test(path);
const isAuthModule = (path) => /(?:^|\/)auth\//.test(path);
const isAuthComposition = (path) => /(?:^|\/)auth\/composition\.[cm]?[jt]s$/.test(path);
const isLocalDevelopmentIdentityAdapter = (path) =>
  /(?:^|\/)auth\/local-development-identity-adapter\.[cm]?[jt]s$/.test(path);
const isConvexEntrypoint = (path) =>
  /(?:^|\/)convex\/(?!_generated\/)[^/]+\.[cm]?[jt]s$/.test(path);
const isCatalogBootstrap = (path) =>
  /(?:^|\/)apps\/backend\/convex\/resourceCatalogBootstrap\.[cm]?[jt]s$/.test(path);
const isDeploymentPayload = (path) =>
  /(?:^|\/)apps\/backend\/src\/resource-master\/deployment\//.test(path);
const isResourceRuntime = (path) =>
  /(?:^|\/)apps\/backend\/src\/resource-master\//.test(path) ||
  /(?:^|\/)apps\/backend\/convex\/(?!_generated\/)/.test(path);
const isResourceFixtureViolation = (path) =>
  /tooling\/architecture-fixtures\/violations\/resource-master\/(?:fixture-import|runtime-deployment-import|public-catalog-port)\.ts$/.test(
    path,
  );
const isCatalogFixture = (path) => /(?:^|\/)apps\/backend\/tests\/fixtures\//.test(path);
const isCatalogPort = (path) =>
  /(?:^|\/)apps\/backend\/src\/resource-master\/application\/ports\/resource-catalog-(?:reader|installer)\./.test(
    path,
  );
const isBootstrapWrapper = (from, to) =>
  isConvexEntrypoint(from) && isCatalogBootstrap(to) && !isCatalogBootstrap(from);
const isResourceMasterEntrypoint = (path) =>
  /(?:^|\/)apps\/backend\/convex\/resourceMaster\.[cm]?[jt]s$/.test(path);
const isBannedCoreDependency = (path) =>
  /(?:^|\/)(?:convex|@convex-dev|@temporalio|ai)(?:\/|$)/.test(path) ||
  /(?:^|\/)convex\//.test(path) ||
  /(?:^|\/)_generated\//.test(path) ||
  /(?:^|\/)(?:infrastructure|deployment|ui|http|agents?)\//.test(path);
const violations = new Map();

const addViolation = (rule, from, to) => {
  const key = `${rule}:${from}:${to}`;
  violations.set(key, { rule, from, to });
};

for (const violation of report.summary?.violations ?? []) {
  addViolation(violation.rule.name, violation.from, violation.to);
}

for (const module of report.modules ?? []) {
  const from = normalize(relative(root, module.source));
  const fromModule = moduleName(from);

  const source = existsSync(module.source) ? readFileSync(module.source, "utf8") : "";
  if (
    isResourceCore(from) &&
    /\b(?:ProviderClaims|ProviderIdentity|ProviderSubject|ConvexIdentity|SessionIdentity)\b/.test(
      source,
    )
  ) {
    addViolation("resource-core-no-provider-types", from, "<source>");
  }

  for (const dependency of module.dependencies ?? []) {
    const to = normalize(relative(root, dependency.resolved));
    const toModule = moduleName(to);

    if (isResourceDomain(from) && isAuthModule(to)) {
      addViolation("resource-domain-no-auth", from, to);
    }
    if (isResourceCore(from) && isAuthModule(to)) {
      addViolation("resource-auth-composition-only", from, to);
    }
    if (
      isLocalDevelopmentIdentityAdapter(to) &&
      !isAuthComposition(from) &&
      !isLocalDevelopmentIdentityAdapter(from)
    ) {
      addViolation("local-development-auth-isolated", from, to);
    }

    if ((isResourceRuntime(from) || isResourceFixtureViolation(from)) && isCatalogFixture(to)) {
      addViolation("resource-runtime-no-fixture", from, to);
    }
    if (
      (isResourceRuntime(from) || isResourceFixtureViolation(from)) &&
      isDeploymentPayload(to) &&
      !isCatalogBootstrap(from)
    ) {
      addViolation("resource-runtime-no-deployment", from, to);
    }
    if ((isPublicSurface(from) || from.endsWith("/public-catalog-port.ts")) && isCatalogPort(to)) {
      addViolation("resource-public-no-catalog-installer", from, to);
    }
    if (isBootstrapWrapper(from, to)) {
      addViolation("convex-no-public-bootstrap", from, to);
    }
    if (
      (isResourceMasterEntrypoint(from) || isBootstrapWrapper(from, to)) &&
      ![
        "RESOURCE_CATALOG_UNAVAILABLE",
        "RESOURCE_CATALOG_UNINITIALIZED",
        "RESOURCE_CATALOG_INVALID",
      ].every((code) => source.includes(`"${code}"`))
    ) {
      addViolation("convex-resource-catalog-errors", from, to);
    }

    if (/(?:^|\/)modules\/[^/]+\/domain\//.test(from)) {
      const ownDomain =
        fromModule !== undefined && fromModule === toModule && /\/domain\//.test(to);
      if (!ownDomain) addViolation("pure-domain", from, to);
    }

    const fromResourceLayer = resourceLayer(from);
    if (
      fromResourceLayer !== undefined &&
      /^(?:public\.|domain\/|application\/)/.test(fromResourceLayer) &&
      isBannedCoreDependency(to)
    ) {
      addViolation("resource-core-no-platform", from, to);
    }
    if (
      /(?:^|\/)resource-master\/domain\//.test(from) &&
      !/(?:^|\/)resource-master\/domain\//.test(to)
    ) {
      addViolation("resource-pure-domain", from, to);
    }
    if (
      /(?:^|\/)resource-master\/application\//.test(from) &&
      /(?:^|\/)resource-master\/infrastructure\//.test(to)
    ) {
      addViolation("resource-application-no-adapter", from, to);
    }
    if (/(?:^|\/)resource-master\/public\.[cm]?[jt]s$/.test(from) && isResourceInternal(to)) {
      addViolation("resource-public-contract-only", from, to);
    }
    if (isConvexEntrypoint(from) && /(?:^|\/)resource-master\/(?:domain|application)\//.test(to)) {
      addViolation("convex-entrypoint-no-core-internals", from, to);
    }
    if (
      !/(?:^|\/)resource-master\//.test(from) &&
      !/(?:^|\/)convex\//.test(from) &&
      !/(?:^|\/)(?:tests?|__tests__)\//.test(from) &&
      isResourceInternal(to)
    ) {
      addViolation("resource-consumers-public-only", from, to);
    }

    if (
      fromModule !== undefined &&
      toModule !== undefined &&
      fromModule !== toModule &&
      !isPublicSurface(to)
    ) {
      addViolation("cross-module-public-only", from, to);
    }

    if (
      /(?:^|\/)modules\/[^/]+\/application\//.test(from) &&
      fromModule === toModule &&
      /\/infrastructure\//.test(to)
    ) {
      addViolation("application-no-infrastructure", from, to);
    }

    if (isPublicSurface(from) && fromModule === toModule && /\/infrastructure\//.test(to)) {
      addViolation("public-surface-contracts-only", from, to);
    }

    if (/(?:^|\/)temporal\//.test(from) && toModule !== undefined && !isPublicSurface(to)) {
      addViolation("temporal-application-contracts-only", from, to);
    }

    if (/(?:^|\/)agent\/core\//.test(from) && !/(?:^|\/)agent\/core\//.test(to)) {
      addViolation("agent-core-independent", from, to);
    }

    if (
      /(?:^|\/)agent\/agents\//.test(from) &&
      /(?:^|\/)(?:infrastructure|persistence)\//.test(to)
    ) {
      addViolation("agent-no-persistence", from, to);
    }
  }
}

if (violations.size > 0) {
  for (const { rule, from, to } of violations.values()) {
    console.error(`error ${rule}: ${from} -> ${to}`);
  }
  process.exit(1);
}

console.log(`architecture check passed (${report.modules?.length ?? 0} modules cruised)`);
