import { spawnSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  realpathSync,
} from "node:fs";
import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import process from "node:process";

const root = resolve(import.meta.dirname, "../..");
const counterpartName = ["garfex-platform", "ui"].join("-");
const ignoredDirectories = new Set([
  ".codegraph",
  ".git",
  ".pnpm-store",
  "coverage",
  "dist",
  "node_modules",
]);
const sourceExtension = /\.[cm]?[jt]sx?$|\.tsp$/;
const dependencyFields = [
  "dependencies",
  "devDependencies",
  "optionalDependencies",
  "peerDependencies",
];

const normalize = (path) => path.split(sep).join("/");
const isWithin = (parent, candidate) => {
  const pathFromParent = relative(parent, candidate);
  return pathFromParent === "" || (!pathFromParent.startsWith("..") && !isAbsolute(pathFromParent));
};
const displayPath = (path) =>
  isWithin(root, path) ? normalize(relative(root, path)) : normalize(path);
const targetsCounterpart = (value) => value.toLowerCase().includes(counterpartName);
const targetsCounterpartPackage = (value) => {
  const reference = value.trim();
  if (reference === "" || /\s/.test(reference)) return false;

  return (
    targetsCounterpart(reference) ||
    /(?:^|[/\\])@garfex[/\\](?:ui|surface|platform-ui)(?:[/\\@]|$)/i.test(reference) ||
    /(?:^|[/\\])garfex-(?:platform-)?(?:ui|surface)(?:[./\\@]|$)/i.test(reference)
  );
};
const quotedValues = (source) => [...source.matchAll(/(["'])([^"']+)\1/g)].map((match) => match[2]);
const operationalValues = (source) => [
  ...quotedValues(source),
  ...[...source.matchAll(/(?:^|[:-]\s*)([^\s#"']+)/gm)].map((match) => match[1]),
];
const nestedStringValues = (value) => {
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) return value.flatMap(nestedStringValues);
  if (value !== null && typeof value === "object") {
    return Object.values(value).flatMap(nestedStringValues);
  }
  return [];
};
const startupError = (message) => {
  console.error(`architecture checker configuration error: ${message}`);
  process.exit(2);
};

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

for (const target of targets) {
  if (!existsSync(target)) startupError(`target does not exist: ${displayPath(target)}`);
  if (!isWithin(root, target) && targetsCounterpart(target)) {
    startupError(`refusing to inspect counterpart repository: ${displayPath(target)}`);
  }
}

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
const EXTERNAL_RULE = Object.freeze({
  independent: "external-contract-independent",
  authority: "external-contract-no-authority",
  platform: "external-contract-no-platform",
  trustedPublicOnly: "external-trusted-edge-public-only",
  genericExecutor: "external-no-generic-business-executor",
  derivation: "external-no-automatic-derivation",
  transport: "external-no-transport",
  publication: "external-no-automatic-publication",
  staleMetadata: "external-contract-stale-metadata",
  finalAuthorization: "external-contract-final-authorization",
  exactTen: "external-contract-exact-ten",
});
const classifyPath = (path) => {
  const normalized = normalize(path);
  return {
    externalBoundary: /(?:^|\/)external-garfex-boundary\//.test(normalized),
    externalClient: /(?:^|\/)external-garfex-boundary\/client-facing\//.test(normalized),
    externalTrusted: /(?:^|\/)external-garfex-boundary\/trusted\//.test(normalized),
  };
};
const isExternalBoundarySource = (path) => classifyPath(path).externalBoundary;
const isExternalClientContractSource = (path) => classifyPath(path).externalClient;
const isExternalTrustedEdgeSource = (path) => classifyPath(path).externalTrusted;
const isProtectedInspectionPath = (path) =>
  /(?:^|\/)openspec\/changes\/persistent-resource-catalog(?:\/|$)/.test(normalize(path));
const isExternalCompatibilityFixture = (path) =>
  /(?:^|\/)apps\/backend\/tests\/fixtures\/external-garfex-boundary\//.test(path);
const isExternalContractInternalImport = (specifier) =>
  /(?:^|\/)(?:apps\/backend|resource-master|modules|auth|convex|_generated|persistence|infrastructure|application|domain|deployment)(?:\/|$)/i.test(
    specifier,
  );
const isExternalPlatformImport = (specifier) =>
  /(?:^|\/)(?:convex|_generated|generated|document|repository|persistence|deployment|catalog-admin)(?:\/|$)/i.test(
    specifier,
  );
const hasExternalAuthorityField = (source) =>
  /(?:^|[,{;\n])\s*(?:readonly\s+)?(?:actor|actorId|role|roles|capability|capabilities|claim|claims|token|credential|credentials|session|provider|providerId|providerSubject|providerClaims|authentication|authorization)\s*\??\s*:/m.test(
    source,
  );
const hasExternalAuthorityType = (source) =>
  /\b(?:ActorContext|ActorId|ProviderClaims|ProviderIdentity|ProviderSubject|ConvexIdentity|SessionIdentity|Role|Capability)\b/.test(
    source,
  );
const hasExternalPlatformContract = (source) =>
  /\b(?:Doc|DocumentId|ConvexId|Generated(?:Api|Binding|Document)?|Persistence(?:Record|Document)?|Repository(?:Record|Port)?|Deployment(?:Config|Payload)?|CatalogAdmin(?:istration)?(?:Config|Payload)?)\b/.test(
    source,
  ) ||
  /(?:^|[,{;\n])\s*["']?(?:document|documentId|convexId|persistence|deployment|catalogAdmin)["']?\s*\??\s*:/m.test(
    source,
  );
const hasExternalDerivation = (source) =>
  /\b(?:Pick|Omit|Parameters|ReturnType)\s*<[^;\n]*(?:ResourceMaster|resource[- ]?master|Convex|convex|Generated|_generated)[^;\n]*>/.test(
    source,
  ) ||
  /\b(?:keyof|typeof)\s+(?:ResourceMaster|resourceMaster|Convex|convex|generated)\b/.test(source);
const hasExternalGenericBusinessSurface = (source) =>
  /\bexport\s+(?:(?:async|default)\s+)*(?:function|class)\s+(?:execute|dispatch|runOperation|invokeOperation|handleOperation|create|read|update|delete|list|crud|repository|table|registry)\b/.test(
    source,
  ) ||
  /\bexport\s+(?:const|let|var)\s+(?:execute|dispatch|runOperation|invokeOperation|handleOperation|crud|repository|table|operationHandlers|operationMap|operationRegistry|handlerRegistry)\b/.test(
    source,
  ) ||
  /\b(?:operationHandlers|operationMap|operationRegistry|handlerRegistry)\b/.test(source) ||
  /\b(?:Object\.(?:keys|values|entries)|Reflect\.ownKeys)\s*\(\s*resourceMaster\b/.test(source);
const externalOperationNames = [
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
];
const externalContractIdentity = "garfex.resource-master.external-client-contract";
const externalCompatibilityRevision = "1";
const isApprovedGeneratedContractImport = (specifier) =>
  /(?:^|[/\\])(?:external-garfex-boundary[/\\]client-facing[/\\])?generated[/\\]semantic-contract\.generated(?:\.[cm]?[jt]s)?$/.test(
    specifier,
  );
const hasAutomaticPublication = (source) =>
  /\b(?:publish|publishClient|publishSdk|publishPackage|registerClient|releaseClient|exportClient)\b/i.test(
    source,
  ) && /\b(?:automatic|auto|registry|publication|distribution|sdk|package)\b/i.test(source);
const hasFinalAuthorizationEvidence = (source) =>
  /(?:final\s+authorization|deny[- ]by[- ]default|resource:read|resource:create|resource:update-non-identity|resource:deactivate)/i.test(
    source,
  );
const isExternalTransportImport = (specifier) =>
  /^(?:node:)?(?:http|https|http2|net|tls|server|express|fastify|hono|koa|router|rpc|grpc|trpc|convex)(?:[/:@-]|$)/i.test(
    specifier,
  );
const hasExternalTransportFraming = (source) =>
  /\b(?:statusCode|httpStatus|protocol|route|router|rpcMethod|httpMethod)\s*(?:\?|:|=)/.test(
    source,
  );
const isExternalTrustedForbiddenTarget = (path) =>
  /(?:^|\/)(?:resource-master\/(?:domain|application|infrastructure|deployment)|convex|_generated|persistence|infrastructure|deployment|domain|application)(?:\/|$)/.test(
    path,
  ) || /(?:^|\/)auth\/(?!composition\.[cm]?[jt]s$)/.test(path);
const isClientFacingSource = (path) => /(?:^|\/)client-facing(?:\/|\.|$)/.test(path);
const importSpecifiers = (source) =>
  [...source.matchAll(/(?:from\s*|import\s*(?:\(\s*)?|require\s*\()(["'])([^"']+)\1/g)].map(
    (match) => match[2],
  );
const stringReferencesCounterpartPackage = (source) =>
  quotedValues(source).some(targetsCounterpartPackage);
const isForbiddenClientContractImport = (specifier) =>
  !isApprovedGeneratedContractImport(specifier) &&
  (/(?:^|\/)(?:convex|_generated|infrastructure|persistence)(?:\/|$)/i.test(specifier) ||
    /(?:^|\/)apps\/backend\//i.test(specifier) ||
    /(?:^|\/)resource-master\/(?:public(?:\.[cm]?[jt]s)?$|domain|application|deployment)(?:\/|$)/i.test(
      specifier,
    ) ||
    /(?:^|\/)modules\/[^/]+\/public(?:\.[cm]?[jt]s)?$/i.test(specifier));
const hasTrustedAuthLeak = (source) =>
  /\b(?:ActorContext|ProviderClaims|ProviderIdentity|ProviderSubject|ConvexIdentity|SessionIdentity|Role|Capability)\b/.test(
    source,
  ) ||
  /(?:from\s*|import\s*\(|require\s*\()(["'])[^"']*(?:auth|authorization)[^"']*\1/i.test(source);
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

    if (isExternalTrustedEdgeSource(from) && isExternalTrustedForbiddenTarget(to)) {
      addViolation("external-trusted-edge-public-only", from, to);
    }
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
      !isExternalBoundarySource(from) &&
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

const scanRoots = requestedTargets.length > 0 ? targets : [root];
const scan = (scanRoot, current = scanRoot) => {
  if (isProtectedInspectionPath(current)) return;
  const entry = lstatSync(current);
  const from = displayPath(current);

  if (entry.isSymbolicLink()) {
    const linkTarget = readlinkSync(current);
    let resolvedTarget;
    try {
      resolvedTarget = realpathSync(current);
    } catch {
      resolvedTarget = resolve(dirname(current), linkTarget);
    }
    if (!isWithin(scanRoot, resolvedTarget) && targetsCounterpartPackage(resolvedTarget)) {
      addViolation("external-client-no-counterpart-symlink", from, normalize(resolvedTarget));
    }
    return;
  }

  if (entry.isDirectory()) {
    for (const child of readdirSync(current, { withFileTypes: true })) {
      if (ignoredDirectories.has(child.name)) continue;
      if (
        scanRoot === root &&
        normalize(relative(root, current)) === "tooling/architecture-fixtures" &&
        child.name === "violations"
      ) {
        continue;
      }
      if (child.name.startsWith(".") && child.name !== ".gitmodules") continue;
      scan(scanRoot, resolve(current, child.name));
    }
    return;
  }

  const name = current.split(sep).at(-1) ?? "";
  const isSource = sourceExtension.test(name);
  const isPackageManifest = name === "package.json";
  const isWorkspaceMetadata =
    name === "pnpm-workspace.yaml" || /^tsconfig(?:\.[^.]+)?\.json$/.test(name);
  const isGitmodules = name === ".gitmodules";
  const isLockfile = new Set(["pnpm-lock.yaml", "package-lock.json", "yarn.lock"]).has(name);
  const isConfiguration =
    /\.(?:json|ya?ml|toml)$/.test(name) &&
    !isPackageManifest &&
    !isWorkspaceMetadata &&
    !isLockfile;
  if (
    !isSource &&
    !isPackageManifest &&
    !isWorkspaceMetadata &&
    !isGitmodules &&
    !isLockfile &&
    !isConfiguration
  ) {
    return;
  }

  const source = readFileSync(current, "utf8");
  if (isSource) {
    const specifiers = importSpecifiers(source);
    if (
      specifiers.some(targetsCounterpartPackage) ||
      stringReferencesCounterpartPackage(source) ||
      specifiers.some((specifier) => {
        if (!specifier.startsWith(".")) return false;
        const destination = resolve(dirname(current), specifier);
        return !isWithin(root, destination) && targetsCounterpartPackage(destination);
      })
    ) {
      addViolation("external-client-no-counterpart-source-reference", from, counterpartName);
    }
    if (isClientFacingSource(normalize(current)) && !isExternalBoundarySource(from)) {
      for (const specifier of specifiers.filter(isForbiddenClientContractImport)) {
        addViolation("client-facing-no-backend-internals", from, specifier);
      }
      if (hasTrustedAuthLeak(source)) {
        addViolation("client-facing-no-trusted-auth-internals", from, "<source>");
      }
    }
    if (isExternalClientContractSource(from)) {
      const internalImport = specifiers.find(
        (specifier) =>
          !isApprovedGeneratedContractImport(specifier) &&
          isExternalContractInternalImport(specifier),
      );
      if (internalImport !== undefined) {
        addViolation(EXTERNAL_RULE.independent, from, internalImport);
      }
      if (
        hasExternalAuthorityField(source) ||
        hasExternalAuthorityType(source) ||
        specifiers.some((specifier) => /(?:^|\/)(?:auth|authorization)(?:\/|$)/i.test(specifier))
      ) {
        addViolation(EXTERNAL_RULE.authority, from, "<source>");
      }
      const platformImport = specifiers.find(
        (specifier) =>
          !isApprovedGeneratedContractImport(specifier) && isExternalPlatformImport(specifier),
      );
      if (platformImport !== undefined || hasExternalPlatformContract(source)) {
        addViolation(EXTERNAL_RULE.platform, from, platformImport ?? "<source>");
      }
      if (hasAutomaticPublication(source)) {
        addViolation(EXTERNAL_RULE.publication, from, "<source>");
      }
      if (hasExternalDerivation(source)) {
        addViolation(EXTERNAL_RULE.derivation, from, "<source>");
      }
    }
    if (isExternalBoundarySource(from)) {
      const transportImport = specifiers.find(isExternalTransportImport);
      if (transportImport !== undefined || hasExternalTransportFraming(source)) {
        addViolation(EXTERNAL_RULE.transport, from, transportImport ?? "<source>");
      }
      if (hasExternalGenericBusinessSurface(source)) {
        addViolation(EXTERNAL_RULE.genericExecutor, from, "<source>");
      }
      if (
        isExternalTrustedEdgeSource(from) &&
        (hasAutomaticPublication(source) || /\bpublishClient\b/.test(source))
      ) {
        addViolation(EXTERNAL_RULE.publication, from, "<source>");
      }
      if (
        isExternalTrustedEdgeSource(from) &&
        /(?:named-mappings|mapping|handler|missing-final-authorization)/i.test(from) &&
        !hasFinalAuthorizationEvidence(source)
      ) {
        addViolation(EXTERNAL_RULE.finalAuthorization, from, "<source>");
      }
    }
  }
  if (isExternalBoundarySource(from) && /\.tsp$/.test(from)) {
    const operations = [...source.matchAll(/\b([A-Za-z][A-Za-z0-9]*)\s*\(/g)].map(
      (match) => match[1],
    );
    const declaredOperations = operations.filter((name) => externalOperationNames.includes(name));
    const operationSet = new Set(declaredOperations);
    if (
      operationSet.size !== externalOperationNames.length ||
      declaredOperations.length !== externalOperationNames.length
    ) {
      addViolation(EXTERNAL_RULE.exactTen, from, `${operationSet.size}/10 operations`);
    }
  }
  if (
    isExternalBoundarySource(from) &&
    /(?:semantic-manifest|baseline|generated-contract|semantic-contract\.generated|contract\.md|resource-master-external-contract|stale-metadata)/i.test(
      from,
    ) &&
    (source.includes("externalContractIdentity") ||
      source.includes("compatibilityRevision") ||
      source.includes("external-contract")) &&
    (!source.includes(externalContractIdentity) || !source.includes(externalCompatibilityRevision))
  ) {
    addViolation(EXTERNAL_RULE.staleMetadata, from, "<metadata>");
  }
  if (isExternalCompatibilityFixture(from) && hasExternalPlatformContract(source)) {
    addViolation(EXTERNAL_RULE.platform, from, "<source>");
  }
  if (
    isExternalBoundarySource(from) &&
    /(?:semantic-manifest|baseline|generated-contract|semantic-contract\.generated|contract\.md|resource-master-external-contract|stale-metadata)/i.test(
      from,
    ) &&
    !source.includes(externalContractIdentity)
  ) {
    addViolation(EXTERNAL_RULE.staleMetadata, from, "<missing identity>");
  }

  if (isPackageManifest) {
    let manifest;
    try {
      manifest = JSON.parse(source);
    } catch {
      startupError(`invalid package manifest: ${from}`);
    }
    for (const field of dependencyFields) {
      for (const [dependency, value] of Object.entries(manifest[field] ?? {})) {
        if (targetsCounterpartPackage(dependency) || targetsCounterpartPackage(String(value))) {
          addViolation("external-client-no-counterpart-dependency", from, `${dependency}@${value}`);
        }
      }
    }
    if (nestedStringValues(manifest.workspaces ?? []).some(targetsCounterpartPackage)) {
      addViolation("external-client-no-counterpart-workspace-link", from, "workspaces");
    }
    if (nestedStringValues(manifest).some(targetsCounterpartPackage)) {
      addViolation("external-client-no-counterpart-package-config", from, "<manifest>");
    }
  }

  if (isWorkspaceMetadata && operationalValues(source).some(targetsCounterpartPackage)) {
    addViolation("external-client-no-counterpart-workspace-link", from, counterpartName);
  }
  if (isConfiguration && operationalValues(source).some(targetsCounterpartPackage)) {
    addViolation("external-client-no-counterpart-config-reference", from, counterpartName);
  }
  if (isLockfile) {
    const hasCounterpartGitBinding = source
      .split("\n")
      .some(
        (line) =>
          /(?:git\+|git@|github:|https?:\/\/[^\s"']+\.git(?:[#?]|$))/i.test(line) &&
          operationalValues(line).some(targetsCounterpartPackage),
      );
    const hasEscapingCounterpartLocalBinding = [
      ...source.matchAll(/(?:file|link):([^\s"',}\]]+)/gi),
    ].some((match) => {
      const binding = match[1];
      const destination = resolve(dirname(current), binding);
      return !isWithin(root, destination) && targetsCounterpartPackage(destination);
    });
    if (hasCounterpartGitBinding || hasEscapingCounterpartLocalBinding) {
      addViolation("external-client-no-counterpart-lockfile", from, counterpartName);
    }
  }
  if (isGitmodules && targetsCounterpart(source)) {
    addViolation("external-client-no-counterpart-gitmodule", from, counterpartName);
  }
};

for (const scanRoot of scanRoots) scan(scanRoot);

if (violations.size > 0) {
  for (const { rule, from, to } of violations.values()) {
    console.error(`error ${rule}: ${from} -> ${to}`);
  }
  process.exit(1);
}

console.log(`architecture check passed (${report.modules?.length ?? 0} modules cruised)`);
