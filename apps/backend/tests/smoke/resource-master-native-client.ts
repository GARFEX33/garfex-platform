import { randomInt } from "node:crypto";
import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api.js";
import { jdS002Cases, type JdS002Case } from "./jd-s-002-cases.js";

type TargetKind = "local-anonymous" | "dev";
export type SmokeTarget = {
  readonly kind: TargetKind;
  readonly url: string;
  readonly redactedIdentifier: string;
};

export type SmokeIdentity = {
  readonly runId: number;
  readonly gauge: string;
};

const MAX_SMOKE_RUN_ID = 2_147_483_647;

export function smokeIdentityForRunId(runId: number): SmokeIdentity {
  if (!Number.isSafeInteger(runId) || runId < 1 || runId > MAX_SMOKE_RUN_ID) {
    throw new Error("GARFEX_NATIVE_SMOKE_RUN_ID must be a positive signed int32");
  }
  return { runId, gauge: String(runId) };
}

export function smokeRunId(env: NodeJS.ProcessEnv = process.env): number {
  const override = env.GARFEX_NATIVE_SMOKE_RUN_ID;
  if (override !== undefined) {
    if (!/^[1-9]\\d*$/.test(override)) {
      throw new Error("GARFEX_NATIVE_SMOKE_RUN_ID must be a positive signed int32");
    }
    return smokeIdentityForRunId(Number(override)).runId;
  }
  return randomInt(1, MAX_SMOKE_RUN_ID + 1);
}

export function createSmokeCreateArgs(identity: SmokeIdentity) {
  return {
    classCode: "MATERIAL",
    familyCode: "CONDUCTORES",
    typeCode: "CABLE",
    naturalUnitCode: "M",
    attributes: [
      {
        attributeCode: "conductor_material",
        value: "COBRE",
        displayValue: "COBRE",
        identityParticipating: true,
      },
      {
        attributeCode: "gauge",
        value: identity.gauge,
        displayValue: identity.gauge,
        identityParticipating: true,
      },
      {
        attributeCode: "insulation",
        value: "THW",
        displayValue: "THW",
        identityParticipating: true,
      },
      { attributeCode: "color", value: "ROJO", displayValue: "ROJO", identityParticipating: false },
      {
        attributeCode: "voltage",
        value: "600V",
        displayValue: "600V",
        identityParticipating: false,
      },
    ],
  };
}

type SmokeResource = { readonly resourceId: string; readonly revision: number };
type Outcome =
  | {
      readonly ok: true;
      readonly value: { readonly resource?: SmokeResource; readonly cursor?: unknown };
    }
  | { readonly ok: false; readonly error: { readonly code?: string } };

const productionPattern = /(?:^|[-_.])(?:prod|production)(?:[-_.]|$)/i;

function redactedIdentifier(url: string): string {
  const parsed = new URL(url);
  return `${parsed.protocol}//${parsed.hostname}`;
}

export function classifySmokeTarget(
  env: NodeJS.ProcessEnv = process.env,
  files: { readonly convexConfig?: string; readonly localEnv?: string } = {},
): SmokeTarget {
  const kind = env.GARFEX_CONVEX_TARGET_KIND;
  if (kind !== "local-anonymous" && kind !== "dev") {
    throw new Error("GARFEX_CONVEX_TARGET_KIND must be local-anonymous or dev");
  }
  const url = env.CONVEX_URL;
  if (url === undefined || url.length === 0) throw new Error("CONVEX_URL is required");
  const parsed = new URL(url);
  const isLocal = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  if (
    productionPattern.test(env.CONVEX_DEPLOYMENT ?? "") ||
    productionPattern.test(parsed.hostname)
  ) {
    throw new Error("productive Convex targets are forbidden");
  }
  if (kind === "local-anonymous" && (!isLocal || env.CONVEX_DEPLOY_KEY !== undefined)) {
    throw new Error("local-anonymous requires localhost/127.0.0.1 and no deployment key");
  }
  if (kind === "dev" && isLocal) throw new Error("dev target must not be local-anonymous");
  if (files.convexConfig?.toLowerCase().includes("production")) {
    throw new Error("convex.json identifies a productive target");
  }
  if (files.localEnv?.toLowerCase().includes("production")) {
    throw new Error(".env.local identifies a productive target");
  }
  return { kind, url, redactedIdentifier: redactedIdentifier(url) };
}

export function smokeEvidenceTemplate(target: SmokeTarget, identity: SmokeIdentity) {
  return {
    evidenceKind: "real-generated-client-smoke",
    evidenceStatus: "complete",
    matrixVersion: "JD-S-002/closed-v2",
    targetKind: target.kind,
    redactedTarget: target.redactedIdentifier,
    smokeIdentity: identity,
    cases: [],
  } as const;
}

function assertOutcome(value: unknown, operation: string): asserts value is Outcome {
  if (value === null || typeof value !== "object" || typeof (value as Outcome).ok !== "boolean") {
    throw new Error(`${operation} returned a non-outcome value`);
  }
  const outcome = value as Outcome;
  if (!outcome.ok && (outcome.error === undefined || typeof outcome.error.code !== "string")) {
    throw new Error(`${operation} returned a non-canonical failure outcome`);
  }
}

export function observeJdS002ReturnedOutcome(
  testCase: JdS002Case,
  value: unknown,
): Exclude<JdS002Case["category"], "transport-rejection"> {
  assertOutcome(value, testCase.id);
  if (testCase.category === "transport-rejection") {
    throw new Error(`${testCase.id}: expected transport-rejection, but call returned an outcome`);
  }
  if (testCase.category === "canonical-invalid") {
    if (value.ok || value.error.code !== "INVALID_ARGUMENT") {
      throw new Error(`${testCase.id}: expected returned INVALID_ARGUMENT for canonical-invalid`);
    }
    return "canonical-invalid";
  }
  if (
    testCase.expectedErrorCode !== undefined &&
    (value.ok || value.error.code !== testCase.expectedErrorCode)
  ) {
    throw new Error(
      `${testCase.id}: expected returned ${testCase.expectedErrorCode} for accepted case`,
    );
  }
  return "accepted";
}

async function callCase(client: ConvexHttpClient, testCase: JdS002Case): Promise<unknown> {
  switch (testCase.operation) {
    case "getResource":
      return client.query(api.resourceMaster.getResource, testCase.args as never);
    case "searchResources":
      return client.query(api.resourceMaster.searchResources, testCase.args as never);
    case "createResource":
      return client.mutation(api.resourceMaster.createResource, testCase.args as never);
    case "updateNonIdentityData":
      return client.mutation(api.resourceMaster.updateNonIdentityData, testCase.args as never);
  }
}

async function runSmoke(target: SmokeTarget, identity: SmokeIdentity) {
  if (
    process.env.GARFEX_RUNTIME_ENV !== "local-development" ||
    process.env.GARFEX_AUTH_MODE !== "local-development"
  ) {
    throw new Error("trusted local-development identity is not configured");
  }
  const client = new ConvexHttpClient(target.url, { logger: false });
  const taxonomy: unknown = await client.query(api.resourceMaster.getTaxonomy, {});
  const schema: unknown = await client.query(api.resourceMaster.getEffectiveResourceSchema, {
    classCode: "MATERIAL",
    familyCode: "CONDUCTORES",
    typeCode: "CABLE",
  });
  const options: unknown = await client.query(api.resourceMaster.getValidOptions, {
    attributeCode: "insulation",
  });
  const units: unknown = await client.query(api.resourceMaster.getNaturalUnits, {
    familyCode: "CONDUCTORES",
  });
  const discovery: readonly [string, unknown][] = [
    ["getTaxonomy", taxonomy],
    ["getEffectiveResourceSchema", schema],
    ["getValidOptions", options],
    ["getNaturalUnits", units],
  ];
  for (const [name, value] of discovery) {
    assertOutcome(value, name);
    if (!value.ok) throw new Error(`${name} failed: ${value.error?.code ?? "unknown"}`);
  }

  const created: unknown = await client.mutation(
    api.resourceMaster.createResource,
    createSmokeCreateArgs(identity),
  );
  assertOutcome(created, "createResource");
  if (!created.ok) {
    const code = created.error?.code ?? "unknown";
    if (code === "DUPLICATE") {
      throw new Error(
        `createResource returned DUPLICATE for smoke run ${identity.runId} (gauge ${identity.gauge}); no retry was attempted`,
      );
    }
    throw new Error(`createResource failed: ${code}`);
  }
  if (created.value.resource === undefined)
    throw new Error("createResource did not return a resource wrapper");
  const resource = created.value.resource;
  const fetched: unknown = await client.query(api.resourceMaster.getResource, {
    resourceId: resource.resourceId,
  });
  const described: unknown = await client.query(api.resourceMaster.describeResource, {
    resourceId: resource.resourceId,
  });
  const page: unknown = await client.query(api.resourceMaster.searchResources, {
    terms: "cable cobre",
    limit: 10,
  });
  const resourceReads: readonly [string, unknown][] = [
    ["getResource", fetched],
    ["describeResource", described],
    ["searchResources", page],
  ];
  for (const [name, value] of resourceReads) {
    assertOutcome(value, name);
    if (!value.ok) throw new Error(`${name} failed: ${value.error?.code ?? "unknown"}`);
  }
  assertOutcome(page, "searchResources");
  if (
    page.ok &&
    page.value.cursor !== undefined &&
    page.value.cursor !== null &&
    typeof page.value.cursor !== "string"
  )
    throw new Error("search cursor is not opaque text or null");
  const updated: unknown = await client.mutation(api.resourceMaster.updateNonIdentityData, {
    resourceId: resource.resourceId,
    expectedRevision: resource.revision,
    naturalUnitCode: "ROLLO",
  });
  assertOutcome(updated, "updateNonIdentityData");
  if (!updated.ok)
    throw new Error(`updateNonIdentityData failed: ${updated.error?.code ?? "unknown"}`);
  const deactivated: unknown = await client.mutation(api.resourceMaster.deactivateResource, {
    resourceId: resource.resourceId,
    expectedRevision:
      updated.ok && updated.value.resource !== undefined
        ? updated.value.resource.revision
        : (() => {
            throw new Error("updateResource did not return a resource wrapper");
          })(),
  });
  assertOutcome(deactivated, "deactivateResource");
  if (!deactivated.ok)
    throw new Error(`deactivateResource failed: ${deactivated.error?.code ?? "unknown"}`);
  const inactive: unknown = await client.query(api.resourceMaster.searchResources, {
    terms: "cable cobre",
    lifecycle: "INACTIVE",
    limit: 10,
  });
  assertOutcome(inactive, "inactive search");

  const cases = [] as {
    readonly id: string;
    readonly category: string;
    readonly observed: string;
  }[];
  for (const testCase of jdS002Cases) {
    let value: unknown;
    try {
      value = await callCase(client, testCase);
    } catch (error) {
      if (testCase.category !== "transport-rejection") throw error;
      cases.push({ id: testCase.id, category: testCase.category, observed: "transport-rejection" });
      continue;
    }
    const observed = observeJdS002ReturnedOutcome(testCase, value);
    cases.push({ id: testCase.id, category: testCase.category, observed });
  }
  return { ...smokeEvidenceTemplate(target, identity), cases };
}

export async function runNativeSmokeIfEnabled(
  enabled: boolean,
  runner: () => Promise<void>,
): Promise<void> {
  if (enabled) await runner();
}

export async function main() {
  const target = classifySmokeTarget(process.env, {
    convexConfig: readFileSync("convex.json", "utf8"),
    localEnv: readFileSync(".env.local", "utf8"),
  });
  const identity = smokeIdentityForRunId(smokeRunId());
  const evidence = await runSmoke(target, identity);
  process.stdout.write(`${JSON.stringify(evidence, null, 2)}\n`);
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await runNativeSmokeIfEnabled(process.env.GARFEX_NATIVE_SMOKE_ENABLE === "1", main);
}
