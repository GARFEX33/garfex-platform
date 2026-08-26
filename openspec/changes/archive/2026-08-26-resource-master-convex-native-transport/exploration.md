# Resource Master Convex Native Transport — Exploration

## Executive summary

The repository already has the intended native Convex family: `apps/backend/convex/resourceMaster.ts` registers the ten `api.resourceMaster.*` functions and composes the actor-first Resource Master. No duplicate transport family is needed. The implementation is not yet a canonical TypeSpec transport, however. Its Convex arguments and results expose the older module dialect, while the existing TypeSpec/external boundary defines wrapped successes (`items`, `options`, `resource`) and `CreateResourceRequest.attributes: ResourceAttribute[]`.

Before native exposure, the canonical TypeSpec/runtime dialect must be reconciled and proven exact. In particular, legacy code-keyed create attributes and bare-success compatibility must be removed or quarantined from the canonical path. Only then should the existing Convex functions be routed through the trusted external composition seam. This exploration does not choose that routing or any validator strategy.

## Repository evidence and ownership

- TypeSpec authority is at `contracts/external-garfex/resource-master/` (`main.tsp`, `models.tsp`, `operations.tsp`, `failures.tsp`, `contract-metadata.tsp`, and `tspconfig.yaml`). It emits the deterministic semantic manifest through `@garfex/typespec-semantic-manifest`; root scripts provide `contract:typespec:check`, `contract:generate`, and `contract:check`.
- The canonical external contract has ten named operations: seven reads/discovery operations and three mutations. TypeSpec explicitly defines wrapped successes: `GetTaxonomySuccess.items`, `GetValidOptionsSuccess.options`, `GetResourceSuccess.resource`, and `Create/Update/DeactivateResourceSuccess.resource`; search uses `items` plus `cursor`.
- `ResourceAttribute` is an object with `attributeCode`, `value`, `displayValue`, and `identityParticipating`; `CreateResourceRequest.attributes` is an array of those objects. There is no canonical array-index-to-code or code-keyed map convention in TypeSpec.
- `apps/backend/src/resource-master/public.ts` is the framework-neutral actor-first module API. It currently uses `CreateResourceInput.attributes: Readonly<Record<string, unknown>>`, returns bare module values inside `Result<T>`, and exposes fourteen internal error codes. Resource Master authorization is implemented below this boundary and remains the final deny-by-default authority.
- `apps/backend/src/auth/resource-master-edge.ts` resolves identity server-side and creates `{ actorId, capabilities }`; it does not trust business input for identity or authorization. Configured authentication is deliberately local/development-only in `src/auth/composition.ts` and `local-development-identity-adapter.ts`.
- `apps/backend/src/external-garfex-boundary/` already contains named request validation, trusted actor resolution, explicit per-operation mapping, projections, and safe error normalization. It is the closest reusable composition seam, but it currently retains compatibility behavior that conflicts with the corrected canonical path.
- `apps/backend/convex/resourceMaster.ts` is the only current Convex Resource Master family. It directly invokes the module adapter through `auth/resource-master-edge.ts` and `infrastructure/convex-resource-master.ts`; it does not currently invoke the external boundary composition.
- `apps/backend/src/resource-master/infrastructure/convex-resource-master.ts` constructs fresh `ConvexResourceCatalogReader` and repository adapters for query/mutation contexts. Convex remains private infrastructure.

The protected `openspec/changes/persistent-resource-catalog/` tree was not modified and must remain untouched.

## Contradictions and exact gaps

### 1. Create request dialect is contradictory

TypeSpec and the generated manifest require `attributes: ResourceAttribute[]`. The runtime external contract deliberately contains a compatibility type replacement and `validation.ts` contains `parseLegacyRequest` / `parseLegacyAttributeMap`; it accepts a code-keyed object and returns it as the compatibility request. `mutation-operations.ts` then rebuilds that map and passes it to the module API. The Convex public mutation independently validates a code-keyed object with hard-coded keys (`conductor_material`, `gauge`, `insulation`, `color`, `voltage`). Existing Convex tests and the compatibility fixture use the map shape.

This is the mandatory Judgment Day gap: no array index may be interpreted as an attribute code, and no legacy map may remain accepted by the canonical native path. The change must decide whether legacy support is removed, isolated behind a clearly non-canonical compatibility adapter, or quarantined with tests proving it cannot enter canonical Convex composition. TypeSpec must remain the semantic source.

### 2. Canonical success wrappers are not the Convex dialect

Convex functions currently return `Result<T>` with bare values: taxonomy is `value: Taxonomy[]`, valid options is `value: Option[]`, and resources are `value: ResourceView`. The TypeSpec contract requires operation success wrappers: `items`, `options`, or `resource` (and the existing external boundary projects those wrappers). `safeSuccess` in `client-facing/validation.ts` still accepts a bare value when the canonical wrapper has exactly one property. The generated contract types also define a `CompatibilityRequest` and `ExternalSuccesses` of bare values. These are direct signs that compatibility acceptance is still mixed into the canonical path.

The exact parity proof must compare request fields/constraints, success wrapper shape, error code and metadata matrix, and all ten named mappings. A successful Convex call must not be accepted merely because a legacy bare value can be wrapped implicitly.

### 3. Convex validators can reject before handler normalization

`apps/backend/convex/resourceMaster.ts` uses strict `v.string`, `v.number`, unions, and the code-keyed attributes object. Convex argument validation occurs before the handler, so malformed types, missing fields, unknown object fields, and unsupported Convex values can throw before `INVALID_ARGUMENT` can be produced by the trusted edge. Existing tests explicitly expect a forged identity payload to reject/throw at the transport validator. Handler `try/catch` only contains failures after argument validation and currently maps them to the internal module dialect.

Open alternatives requiring design evidence (not silently selected here):

1. Keep precise Convex validators and document that pre-handler validator failures are transport-level rejection, while canonical `INVALID_ARGUMENT` covers only values admitted by Convex.
2. Use a deliberately permissive top-level/field validator and pass raw admitted input to the external validator so handler-owned normalization can return canonical `INVALID_ARGUMENT`; test the remaining Convex-serializability boundary.
3. Add a separate permissive native wrapper while preserving typed internal functions, only if this does not create a second `resourceMaster` family or bypasses the canonical named composition.

The proposal/design must state the chosen error boundary, prove unknown-field and malformed-value behavior, and preserve server-side identity construction. Convex `convex-test` behavior must be checked against a real local deployment smoke because pre-handler behavior and generated client serialization can differ.

## Reuse points and likely later edit surfaces

- Reuse the existing `api.resourceMaster.*` names and the ten operation set; do not add an HTTP endpoint, generic executor, operation registry, or second Convex family.
- Reuse TypeSpec sources, semantic manifest/baseline, generated runtime contract machinery, external trusted identity/mapping/projection/error modules, and existing Resource Master application authorization.
- Likely later edits: `apps/backend/convex/resourceMaster.ts`; external contract generated/compatibility machinery and its tests; `external-garfex-boundary/trusted/mutation-operations.ts`, read operations, projections, and validation; Convex integration tests and new native-transport tests; architecture checks/fixtures and docs where needed. The module public API and infrastructure should change only if an explicit parity adapter requires it.
- Existing Convex tests (`apps/backend/tests/convex-resource-master.test.ts`) seed the catalog through internal bootstrap and exercise all ten functions, auth fail-closed behavior, persistence, lifecycle, pagination, and return serialization. They are strong integrated evidence but currently assert the old `value` dialect and old create map.
- Existing external contract/operation/security/compatibility/generated-runtime tests provide parity, closed-shape, named-mapping, projection, error-normalization, and authority-leakage evidence. They currently also encode legacy compatibility and therefore must be split into canonical proof versus quarantined legacy proof if compatibility remains.

## Authorization and security constraints

Trusted identity must be resolved server-side from the configured adapter; native business arguments must not contain actor IDs, roles, capabilities, claims, tokens, sessions, provider data, or Convex internals. The external edge may authenticate and construct a fresh `ActorContext`, but Resource Master must perform the exact per-operation capability check first and deny unknown/missing mappings by default. No native wrapper may pre-authorize in a way that replaces or broadens Resource Master authorization.

The canonical boundary must allowlist the eleven TypeSpec safe failure codes and only reviewed metadata (`fieldIssues`, `existingResourceId`, `currentRevision`). Internal module/catalog/Convex diagnostics must normalize to safe failures and remain server-side.

## Local/development E2E evidence required

Two proofs are distinct:

1. **`convex-test` integrated proof:** in-process Convex function execution with the test schema/modules, seeded catalog, generated `api.resourceMaster.*` bindings, multiple trusted/unauthenticated contexts as supported, exact canonical request/result assertions, deny-by-default assertions, malformed input assertions, and proof that no duplicate family or generic dispatcher exists. This proves composition and behavior under the test harness; it is not network/deployment evidence.
2. **Real local deployment client smoke:** a local/development Convex deployment with the native generated client invoking the same existing `api.resourceMaster.*` functions, proving generated argument serialization, pre-handler validator behavior, canonical wrappers/failures, trusted identity configuration, and create/update/deactivate/read/search behavior end to end. It must use local/development configuration only, must not require productive auth or public Internet, and is explicitly required as separate evidence. No deployment commands are run during exploration.

The evidence ledger should record which cases are proven by each layer, especially invalid arguments that throw before handlers, canonical `INVALID_ARGUMENT` returned by handlers, forged identity field rejection, missing capability `FORBIDDEN` before catalog/repository work, catalog failure normalization, opaque cursor preservation, and exact wrapper shapes.

## Risks

- Legacy compatibility can silently re-enter the canonical path through generated TypeScript types, `safeRequest`, `safeSuccess`, fixtures, or Convex tests.
- Direct Convex composition can drift from TypeSpec even while module tests remain green.
- Permissive Convex validators can widen the admitted serializable surface or weaken generated client typing; strict validators can make canonical normalized `INVALID_ARGUMENT` unreachable for some malformed inputs.
- Returning module `Result<T>` directly leaks the internal dialect and makes later Resource Master DTO changes transport-visible.
- A wrapper that authenticates but bypasses the external named projection/error seam can leak internal fields or make Resource Master authorization appear optional.
- `convex-test` can provide false confidence if no real local client smoke verifies deployment-side argument validation and serialization.
- Reusing a legacy compatibility fixture as transport authority would incorrectly select its map/bare-success representation; it must remain semantic evidence only after correction.

## Non-goals

No HTTP or other public network binding, productive authentication, public Internet reachability, third-party API, UI/client architecture, Agent Platform, Temporal, new Resource Master capability, generic business executor, duplicate API family, schema/persistence redesign, or catalog capability is part of this change. No deployment command is part of exploration.

## Open decisions for proposal/design

1. Exact canonical boundary: route existing Convex functions through the external composition after parity proof, or introduce only a narrowly justified adapter while preserving one named family.
2. Whether legacy map/bare-success support is deleted or quarantined, and the exact architecture/test gate proving it cannot be canonical.
3. Convex args-validator strategy and the split between pre-handler throws and handler-owned canonical `INVALID_ARGUMENT`.
4. Exact mapping from TypeSpec `ResourceAttribute[]` to the module’s current record input without array-index-to-code inference; likely requires an explicit code-to-value reconstruction owned by a reviewed adapter, but no implementation choice is made here.
5. Canonical failure serialization through Convex validators, including safe field-issue shape and whether all TypeSpec constraints can be represented without pre-handler loss.
6. Proof format and acceptance gate for exact TypeSpec/runtime/Convex parity, including real local client smoke evidence.
