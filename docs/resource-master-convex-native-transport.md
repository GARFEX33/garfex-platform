# Resource Master native Convex transport

## Scope and authority

Native Convex is accepted only as a downstream transport for GARFEX-owned compatible **local and development** clients. TypeSpec remains the sole, transport-neutral authority for the ten operation names, requests, constraints, successes, safe failures, and metadata. This does not claim productive readiness, productive authentication, public Internet reachability, or third-party support.

The accepted family is exactly:

`getTaxonomy`, `getEffectiveResourceSchema`, `getValidOptions`, `getNaturalUnits`, `getResource`, `searchResources`, `describeResource`, `createResource`, `updateNonIdentityData`, and `deactivateResource`.

Each `api.resourceMaster.<name>` binding calls only the identically named Resource Master public operation. There is no generic executor, dispatcher, second family, HTTP route, SDK, publication path, or UI behavior.

## Canonical dialect

Create requests use `attributes: ResourceAttribute[]`. Every entry contains exactly `attributeCode`, `value`, `displayValue`, and `identityParticipating`; the adapter maps values by explicit `attributeCode`, never by array position, and rejects repeated codes as `INVALID_ARGUMENT` with `attributes/CONFLICTING`. Caller display and identity flags are not authority: Resource Master derives canonical persisted values.

Successes are operation-specific wrappers: `{ items }`, `{ attributes }`, `{ options }`, `{ allowed, suggested }`, `{ resource }`, `{ items, cursor }`, or `{ resourceId, description }`. Search cursors are opaque and nullable. Legacy code-keyed create maps, bare successes, and implicit wrapping are not accepted on the native path.

## Trusted composition and failures

The named handler validates business input, resolves configured local-development identity, creates a fresh server-side actor context, calls the matching Resource Master operation, and returns a field-by-field projection. Resource Master performs the final exact deny-by-default capability check before catalog or repository work. Actor IDs, roles, capabilities, claims, tokens, sessions, provider values, Convex IDs, persistence records, and diagnostics never cross the boundary.

The only external failure codes are `UNAUTHENTICATED`, `FORBIDDEN`, `INVALID_ARGUMENT`, `INVALID_REFERENCE`, `VALIDATION_FAILED`, `NOT_FOUND`, `DUPLICATE`, `CONFLICT`, `INVALID_LIFECYCLE`, `CATALOG_UNAVAILABLE`, and `INTERNAL_FAILURE`. Only applicable `fieldIssues`, `existingResourceId`, or `currentRevision` metadata is allowed.

## JD-S-002 validation boundary

The selected decision is strict structural Convex validation followed by TypeSpec-authoritative runtime validation. Missing fields, unknown fields, wrong shapes/types, unsupported values, and forged authority fields are transport rejection before the named handler. Convex-serializable values such as empty constrained strings, invalid limits, fractional integers, and repeated attribute codes are admitted to the handler and return canonical `INVALID_ARGUMENT`; Resource Master and data work are not invoked. The matrix is shared by the in-process harness and the real-client runner, and a transport rejection is never relabeled as `INVALID_ARGUMENT`.

The executable case table is [`apps/backend/tests/smoke/jd-s-002-cases.ts`](../apps/backend/tests/smoke/jd-s-002-cases.ts). Its redacted evidence schema is [`apps/backend/tests/smoke/resource-master-native-evidence.schema.json`](../apps/backend/tests/smoke/resource-master-native-evidence.schema.json).

## Evidence and guarded smoke

`convex-test` proves in-process composition, canonical wrappers, authorization, leakage containment, and one-shot query/transaction behavior. It is not deployment proof. The separate `smoke:native` runner uses the generated `api.resourceMaster.*` bindings and `ConvexHttpClient` to exercise discovery, create/get/describe/search, update, deactivate, inactive search, and the JD-S-002 cases. It refuses missing, ambiguous, or productive target classification and records only redacted target, digests, case outcomes, and exit status.

The parent must classify and announce `local-anonymous` or `dev` with the Convex deploy guard before any deployment-affecting command. This apply deliberately does not run codegen/deployment, bootstrap, `convex run`, or the real-client smoke. No smoke result is claimed here.

The previous transport-open non-decision is superseded only for this narrow native local/development acceptance. HTTP, productive identity/deployment, public or third-party exposure, SDK/publication, semantic-version policy, compatibility windows, deprecation, and migration duration remain unselected or deferred.
