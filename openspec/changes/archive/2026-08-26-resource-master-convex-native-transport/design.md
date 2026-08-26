# Design: Resource Master Convex Native Transport

## Status, scope, and governing decision

This design accepts the existing ten `api.resourceMaster.*` Convex functions as the first native transport for GARFEX-owned compatible local/development clients, only after their observable business dialect is made identical to the TypeSpec contract. TypeSpec remains transport-neutral and is the sole semantic authority. Convex validators, registered functions, serialization, and generated client references are downstream transport artifacts.

The implementation keeps the existing seven queries and three mutations, preserves Convex query reactivity and mutation transactions, and does not require realtime subscriptions. It does not add HTTP, another transport, a productive identity mechanism, productive deployment, public reachability, an SDK publication path, or a second Resource Master family. The protected `openspec/changes/persistent-resource-catalog/` tree is outside the edit surface.

Repository inspection found only test consumers of the current native dialect. Unknown external local/development consumers are nevertheless treated as possible: the canonical change is intentionally breaking for map-shaped create requests and bare successes, must be announced as such, and will not be hidden by a dual-dialect fallback.

## Architecture

### Selected shape

The existing registered functions remain the only callable native family:

```text
GARFEX-owned local/development generated client
  -> api.resourceMaster.<one named query or mutation>
  -> generated strict Convex structural args validator
  -> named TypeSpec-manifest runtime request validator
  -> configured server authentication composition
  -> fresh TrustedActorResolver / ActorContext
  -> named external GARFEX composition function
  -> identically named Resource Master public application method
  -> Resource Master final deny-by-default capability authorization
  -> query or mutation Convex infrastructure composition
  -> explicit success projection or safe error normalization
  -> generated strict Convex return validator
```

There is no operation-name argument, generic executor, dispatcher, registry, reflection over `ResourceMaster`, alternate module, or second callable wrapper. Each export in `apps/backend/convex/resourceMaster.ts` explicitly calls its corresponding named `invokeExternal...` function.

### Ten-operation parity

The outer normalized outcome remains `{ ok: true, value: <success> } | { ok: false, error: <safe error> }`. The value inside a successful outcome is the exact TypeSpec success model, not the former bare module value.

| Existing Convex function | Kind | Exact args | Exact successful `value` | Named composition and module call |
| --- | --- | --- | --- | --- |
| `getTaxonomy` | query | `{}` | `{ items: Taxonomy[] }` | `invokeExternalGetTaxonomy` -> `getTaxonomy` |
| `getEffectiveResourceSchema` | query | `{ classCode, familyCode, typeCode }` | `{ attributes: EffectiveAttribute[] }` | `invokeExternalGetEffectiveResourceSchema` -> `getEffectiveResourceSchema` |
| `getValidOptions` | query | `{ attributeCode }` | `{ options: Option[] }` | `invokeExternalGetValidOptions` -> `getValidOptions` |
| `getNaturalUnits` | query | `{ familyCode }` | `{ allowed: NaturalUnit[], suggested: NaturalUnit }` | `invokeExternalGetNaturalUnits` -> `getNaturalUnits` |
| `getResource` | query | `{ resourceId }` | `{ resource: Resource }` | `invokeExternalGetResource` -> `getResource` |
| `searchResources` | query | `{ terms, lifecycle?, limit?, cursor? }` | `{ items: ResourceSummary[], cursor: string | null }` | `invokeExternalSearchResources` -> `searchResources` |
| `describeResource` | query | `{ resourceId }` | `{ resourceId, description }` | `invokeExternalDescribeResource` -> `describeResource` |
| `createResource` | mutation | `{ classCode, familyCode, typeCode, naturalUnitCode, attributes: ResourceAttribute[] }` | `{ resource: Resource }` | `invokeExternalCreateResource` -> `createResource` |
| `updateNonIdentityData` | mutation | `{ resourceId, expectedRevision, naturalUnitCode }` | `{ resource: Resource }` | `invokeExternalUpdateNonIdentityData` -> `updateNonIdentityData` |
| `deactivateResource` | mutation | `{ resourceId, expectedRevision }` | `{ resource: Resource }` | `invokeExternalDeactivateResource` -> `deactivateResource` |

The `ResourceAttribute` input object has exactly `attributeCode`, `value`, `displayValue`, and `identityParticipating`. Its `value` is exactly a string, boolean, or closed quantity object `{ magnitude, unitCode }`.

### Canonical create adaptation

The canonical request is validated as `ResourceAttribute[]` before actor resolution or module invocation. The mutation mapper then builds the module's existing code-keyed raw-value input by iterating the array and assigning each cloned `entry.value` under `entry.attributeCode`. Array indexes are never read as codes, and reordering entries with distinct codes produces the same module input.

`displayValue` and `identityParticipating` are required and validated because they are part of the approved TypeSpec request model, but they are not authority. Resource Master continues to derive and return canonical display and identity participation from the catalog and domain rules; caller-provided values cannot override persistence or identity computation. The native guidance will state this explicitly.

A repeated `attributeCode` is rejected by the canonical mapper before Resource Master as `INVALID_ARGUMENT` with `{ field: "attributes", reason: "CONFLICTING" }`; silent first/last-write-wins conversion is forbidden because it would make array order semantic. This adapter invariant is recorded in TypeSpec-owned contract metadata/manifest evidence so it is not an untracked Convex-only constraint.

No change is planned to `ResourceMaster`, its persistence ports, Convex schema, repository implementation, lifecycle rules, or transaction boundaries.

## Canonical runtime correction and legacy disposition

The existing compatibility dialect is removed rather than retained in the accepted path:

- `ExternalRequest<Operation>` becomes the manifest-derived `GeneratedExternalRequest<Operation>` for every operation. The create-specific `CompatibilityCreateResourceRequest` and property replacement disappear.
- `ExternalSuccess<Operation>` becomes the manifest-derived generated success model. The handwritten bare `ExternalSuccesses` map disappears.
- `parseLegacyRequest`, `parseLegacyAttributeMap`, legacy field-issue aliases, and the one-property bare-success fallback are deleted from canonical validation.
- Projection functions build exact wrappers directly: taxonomy uses `{ items }`, options uses `{ options }`, and get/create/update/deactivate use `{ resource }`.
- The compatibility fixture is rewritten as canonical serialized evidence. Old map/bare-success fixtures remain only as negative rejection inputs, not accepted compatibility baselines.

No canonical code imports or calls a legacy adapter. If an unknown consumer later proves that temporary legacy support is unavoidable, that would require a separately approved, explicitly non-canonical in-process compatibility decision; it may not be added to `api.resourceMaster.*`, selected automatically, or used as fallback. This change itself creates no such adapter.

## TypeSpec-to-Convex validator generation

### Generation direction

`contract:generate` continues to compile TypeSpec to the deterministic semantic manifest and canonical runtime TypeScript. It additionally consumes that generated manifest to emit a deterministic transport artifact under `apps/backend/convex/resourceMasterContract.generated.ts`. The Convex artifact never feeds TypeSpec, the semantic manifest, canonical types, runtime validation, baseline comparison, or consumer semantic documentation.

The generated file imports only `v` from `convex/values` and exports named constants for the ten args field maps and ten return validators. It contains the source manifest digest and contract identity. It does not register functions, import `api`, invoke handlers, enumerate module methods, or publish anything.

For each function:

- args validators are exact closed structural translations of the operation request model;
- required/optional properties come from manifest requiredness;
- strings use `v.string()`;
- TypeSpec `int32` uses `v.number()` and is narrowed by canonical runtime validation;
- booleans use `v.boolean()`;
- enums/literals use unions of `v.literal(...)`;
- arrays, nullable values, nested objects, and untagged unions translate recursively;
- create attributes use `v.array(v.object({ attributeCode, value, displayValue, identityParticipating }))`;
- return validators are exact unions of `{ ok: true, value: <operation success model> }` and code-correlated safe failure objects.

The generated failure validator has eleven literal-code branches. Metadata is correlated, not broadly optional: only `INVALID_ARGUMENT`, `INVALID_REFERENCE`, and `VALIDATION_FAILED` may have `fieldIssues`; only `DUPLICATE` may have `existingResourceId`; only `CONFLICT` may have `currentRevision`; all other branches contain only `code`. A field issue has exactly `{ field, reason }`, and reason is one of the five TypeSpec values. No message, details, path alias, stack, or diagnostic property is admitted.

`resourceMaster.ts` must import these generated constants. Handwritten public request/result validators in that file are removed. `contract:check` regenerates the transport artifact into a temporary directory and byte-compares it with the committed artifact, verifies its manifest digest, and evaluates a ten-row parity descriptor. A stale or manually widened/narrowed validator therefore fails before typecheck or deployment.

### Generated client typing consequences

Because registered functions use exact generated validators, Convex's generated `api.resourceMaster.*` references expose canonical compile-time args and outcomes:

- create clients must send `ResourceAttribute[]`; the legacy map does not typecheck;
- all required fields and nested object shapes are required at compile time;
- unknown authority/business fields fail excess-property checks for object literals;
- lifecycle is the exact literal union;
- optional search fields remain optional and cursor is `string | null` when supplied;
- successes expose the exact wrappers in the table above;
- safe errors expose only code-correlated metadata.

TypeScript cannot encode non-empty strings, integer-ness, int32 range, search range 1–50, control-character exclusion, cursor opacity, or repeated attribute codes. Those values can typecheck but are handled by canonical runtime validation as described below. Negative transport tests use an explicit test-only unsafe cast so production examples never normalize malformed calls through `any`.

## JD-S-002: closed malformed-input decision

### Decision

JD-S-002 selects **strict structural Convex validation plus canonical semantic validation in the named handler**. A permissive `v.any()`/raw envelope and a second wrapper family are rejected. This preserves useful generated client typing and minimizes admitted attack surface, at the cost that structurally malformed calls are observable transport rejections rather than canonical outcomes.

A transport rejection means client serialization or Convex args validation fails before the named handler; no actor resolution, Resource Master call, catalog read, repository access, persistence, or transaction work occurs. It must never be reported as `INVALID_ARGUMENT`.

A canonical invalid result means the value is Convex-serializable and structurally admitted, the named handler calls the TypeSpec-manifest runtime validator, and validation returns `{ ok: false, error: { code: "INVALID_ARGUMENT", fieldIssues? } }`. Actor resolution and all Resource Master/downstream work remain uncalled because request validation is the first handler step.

### Closed matrix

| Malformed or edge input | Observable category | Exact consequence |
| --- | --- | --- |
| Missing required top-level field | Convex pre-handler rejection | Generated typing rejects ordinary source; unsafe/wire call is rejected before handler. |
| Missing required nested field, including a `ResourceAttribute` or quantity member | Convex pre-handler rejection | No canonical outcome and no downstream call. |
| Omitted optional `lifecycle`, `limit`, or `cursor` | Accepted, not malformed | The property remains omitted and Resource Master owns defaults. |
| Unknown top-level field | Convex pre-handler rejection | Closed object validator rejects it. |
| Unknown nested field in attribute, quantity, or any request object | Convex pre-handler rejection | Closed nested object validator rejects it. |
| Wrong primitive type for a canonical field | Convex pre-handler rejection | `v.string`, `v.number`, or `v.boolean` rejects before handler. |
| Wrong object/array/null shape, including legacy code-keyed `attributes` | Convex pre-handler rejection | Legacy conversion is not attempted. |
| Lifecycle or other literal outside its generated union | Convex pre-handler rejection | Literal union rejects before handler. |
| Convex-serializable but contract-unsupported platform values such as int64/bigint or bytes in a business field | Convex pre-handler rejection | Exact structural validator rejects the type/shape. |
| Value not serializable as a Convex value, including functions, symbols, cyclic objects, explicit unsupported `undefined` values, or unsupported class instances | Client/Convex serialization rejection before handler | Classified as transport rejection; no handler can normalize it. Optional values must be omitted rather than sent as `undefined`. |
| Empty or control-character-containing `NonEmptyCode`, `ResourceId`, `SearchTerms`, quantity `unitCode`, or other constrained string | Handler-admitted canonical `INVALID_ARGUMENT` | Field issue uses the exact field path in `field` with `OUT_OF_RANGE` for empty and `INVALID_FORMAT` for control/format violations. |
| Empty or control-character-containing non-null cursor | Handler-admitted canonical `INVALID_ARGUMENT` | `{ field: "cursor", reason: "INVALID_FORMAT" }`; cursor remains otherwise opaque. |
| Fractional, non-finite, or unsafe numeric value admitted by `v.number()` for an int32 field | Handler-admitted canonical `INVALID_ARGUMENT` | `INVALID_FORMAT` for non-integer/non-finite and `OUT_OF_RANGE` outside signed int32. |
| Search `limit` integer below 1 or above 50 | Handler-admitted canonical `INVALID_ARGUMENT` | `{ field: "limit", reason: "OUT_OF_RANGE" }`. |
| Signed int32 `expectedRevision`, including a negative value | Structurally and TypeSpec valid | It proceeds to Resource Master; no Convex-only non-negative constraint is invented. Business conflict behavior remains Resource Master-owned. |
| Repeated create `attributeCode` | Handler-admitted canonical `INVALID_ARGUMENT` | `{ field: "attributes", reason: "CONFLICTING" }`; no map is built and Resource Master is not invoked. |
| Empty attribute array | Structurally and TypeSpec valid | It proceeds; any catalog/business failure is normalized from Resource Master, not relabeled as malformed transport input. |
| Forged top-level or nested authority property (`actor`, `actorId`, roles, capabilities, claims, token, credential, session, provider, Convex identity, and aliases) | Convex pre-handler rejection as an unknown field | It cannot influence identity; handler and resolver do not run. |
| A canonical string value that merely contains authority-like text | Not authority and not transport-malformed | It is validated by its declared semantic type and, where applicable, Resource Master/catalog rules; string contents never become actor authority. |

For runtime-invalid requests, `fieldIssues` contains only TypeSpec `FieldIssue` objects and reasons. Compatibility-only `{ path, reason: "TYPE" | "UNKNOWN_FIELD" | "INVALID_VALUE" }` values are removed. Convex pre-handler cases have no `fieldIssues` because there is no canonical outcome.

### Required parity observation

Every matrix row is exercised both through `convex-test` and through a real local/development generated client. The expected category is identical. The evidence records whether the generated client failed during serialization or the deployment rejected args; both are pre-handler transport rejection and both prove zero handler/downstream calls. Any case returned as `INVALID_ARGUMENT` in one environment but thrown in the other fails acceptance.

## Identity, dependency construction, and authorization

Each named handler constructs dependencies for that invocation only:

- `createConfiguredAuthenticationComposition` reads server-controlled `GARFEX_RUNTIME_ENV` and `GARFEX_AUTH_MODE`.
- `createTrustedActorResolver` resolves the configured local/development identity and creates a new `ActorContext` with a newly copied capability `Set` on every successful call.
- Query handlers use `createConvexQueryResourceMaster(ctx)`, which creates fresh read-only catalog and repository adapters from the query context.
- Mutation handlers use `createConvexMutationResourceMaster(ctx)`, which creates fresh reader/writer adapters from the same mutation context, preserving one Convex transaction for create, update, and deactivate.

Constructing these objects performs no data access. The canonical request validator runs before identity resolution. Authentication then runs before module invocation. Resource Master remains the final authorization authority and checks the exact operation-to-capability map before catalog/repository/persistence work. The transport does not duplicate the policy or pre-authorize.

The seven reads require `resource:read`; create requires `resource:create`; update requires `resource:update-non-identity`; deactivate requires `resource:deactivate`. Missing, unknown, or mismatched mappings remain `FORBIDDEN` by Resource Master's deny-by-default implementation. Tests use instrumented actor resolvers, module doubles, and data adapters to prove unauthenticated and forbidden calls perform zero catalog, repository, persistence, and transaction operations.

The current duplicated mutation invocation exports in `trusted/mutation-operations.ts` are collapsed: that file owns only named module mapping/projection helpers, while `composition.ts` owns the ten trusted invocation entrypoints. This leaves one named composition path per operation without creating a generic executor.

## Outcome, error, and containment contract

### Success containment

All module successes are rebuilt field-by-field into independently owned external DTOs and then validated against the manifest-derived success model. Internal object identity is never returned. The corrected projections are exact wrappers, including nullable opaque search cursors. A new internal field remains absent unless TypeSpec and the explicit projection are reviewed together.

### Safe failures

Only these mappings cross the boundary:

| Module/edge condition | External code | Allowed metadata |
| --- | --- | --- |
| Missing/failing trusted identity | `UNAUTHENTICATED` | none |
| Resource Master capability denial | `FORBIDDEN` | none |
| Canonical runtime invalid request or module `INVALID_ARGUMENT` | `INVALID_ARGUMENT` | valid `fieldIssues` only |
| Module `INVALID_REFERENCE` | `INVALID_REFERENCE` | valid `fieldIssues` only |
| Module `VALIDATION` | `VALIDATION_FAILED` | valid `fieldIssues` only |
| Module `NOT_FOUND` | `NOT_FOUND` | none |
| Module `DUPLICATE` | `DUPLICATE` | valid `existingResourceId` only |
| Module `CONFLICT` | `CONFLICT` | signed-int32 `currentRevision` only |
| Module `INVALID_LIFECYCLE` | `INVALID_LIFECYCLE` | none |
| Catalog unavailable or uninitialized | `CATALOG_UNAVAILABLE` | none |
| Integrity, invalid catalog, unknown code, malformed result, projection exception, handler exception, or unsafe metadata | `INTERNAL_FAILURE` | none |

Messages, `details`, stacks, causes, provider values, environment/configuration, catalog distinctions, persistence identifiers, Convex documents/IDs, and generated platform values are never returned. Diagnostics receive causes only on a server-only sink and cannot alter outcomes even if the sink throws.

The handler catches invocation/projection/normalization failures and emits metadata-free `INTERNAL_FAILURE` before return validation. The generated Convex return validator is the final containment barrier: an implementation bug that still constructs a nonconforming result is rejected by Convex rather than serialized. Such a rejection is an operational defect, not a new public failure code, and is covered by malformed-output tests and server diagnostics.

## Architecture and parity controls

The following controls are mandatory and have passing and violating fixtures:

1. **Exact family:** enumerate generated public bindings and assert exactly the ten approved `api.resourceMaster.*` functions once, with seven queries and three mutations. Reject another Resource Master Convex module, generic executor, dispatcher, universal payload, operation map, or CRUD surface.
2. **Generated validator ownership:** reject handwritten args/returns business validators in `convex/resourceMaster.ts`, stale generated validators, manifest-digest mismatch, and any generator input sourced from Convex or `_generated` files.
3. **Canonical-only runtime:** reject compatibility request/success types, legacy parsing imports, implicit wrappers, and any dependency path from `convex/resourceMaster.ts` to a legacy fixture/helper.
4. **Named mapping:** assert each function imports/calls only its corresponding named composition entrypoint and that composition calls only the identically named Resource Master public method. New module methods remain private automatically.
5. **No direct persistence:** reject Convex entrypoint imports of schema records, repository classes, catalog installers, `ctx.db` access, application/domain internals, or persistence/deployment payloads. Only the existing infrastructure composition factory may receive `ctx`.
6. **No semantic platform leakage:** canonical TypeSpec, manifest, runtime types, validation values, fixtures, and generated transport-neutral docs cannot import or derive from Convex validators, `api`, `_generated`, IDs, documents, contexts, or deployment configuration. The generated Convex validator and generated client binding are permitted only as downstream transport artifacts.
7. **No automatic publication:** reject package publication, registry/release scripts, automatic operation enumeration, SDK emission, HTTP/OpenAPI/Scalar/Orval output, and cross-repository links. Contract generation writes only approved repository-local semantic and Convex transport artifacts.
8. **Return containment:** parity checks compare every request field/requiredness/constraint, success wrapper, error branch/metadata allowlist, and operation mapping against the current semantic manifest. Any addition, omission, widening, narrowing, wrapper change, or code mismatch fails.
9. **Authorization evidence:** architecture and behavior tests preserve actor-first module calls and final Resource Master authorization; transport code cannot call repositories or replace capability policy.
10. **Protected scope:** changed-path verification rejects any modification under `openspec/changes/persistent-resource-catalog/`.

`contract:typespec:check`, non-writing `contract:check`, backend typecheck, architecture checks, focused tests, complete tests, and build remain acceptance gates. Generation is explicit and deterministic; no successful check automatically publishes or deploys.

## Strict-TDD verification design

Implementation proceeds test-first at each boundary: add or correct a focused test, observe it fail for the old dialect/behavior, make the smallest production change, then refactor only while green. Existing assertions are not weakened to accept both dialects.

### Canonical contract and validator tests

- Generated-runtime tests prove create is exactly `ResourceAttribute[]`, all four attribute fields are closed, values use the exact union, success validators require wrappers, and field issues use only `{ field, reason }` with five reasons.
- Negative tests prove map-shaped attributes, bare taxonomy/options/resource successes, implicit wrapping, extra fields, old error messages/details, and legacy field-issue aliases are rejected.
- Generator tests compare TypeSpec manifest to generated Convex args/returns and deliberately mutate fixtures for missing fields, wrong requiredness, widened enums, bare wrappers, metadata widening, stale digest, and a missing/extra operation.

### All-ten composition and Convex tests

- A table-driven named-composition test covers all ten request validators, module method calls, wrappers, and error normalization.
- `convex-test` invokes all ten generated `api.resourceMaster.*` references against seeded catalog data and exact canonical values.
- Query tests cover taxonomy, effective schema, valid options, natural units, get, search, and describe as one-shot calls.
- Mutation tests cover create, update, and deactivate in the existing transactional context, including revision conflict, duplicate identity, inactive lifecycle, and atomic persistence.
- ResourceAttribute order is permuted to prove explicit `attributeCode` mapping; repeated codes prove `CONFLICTING`; the legacy map proves pre-handler rejection.

### Authentication and no-data-access tests

- Missing/mismatched local-development configuration yields `UNAUTHENTICATED` before module creation/use or data work.
- A fresh actor object and fresh copied capability set are observed for separate invocations.
- For each capability class, a missing exact capability yields `FORBIDDEN`; unknown/missing operation mapping remains denied.
- Instrumented catalog, repository, persistence, and transaction doubles assert zero access for request-invalid, unauthenticated, and forbidden cases.
- Forged authority fields are exercised at top-level and nested positions and cannot reach the resolver.

### JD-S-002 tests

A single versioned case table drives both the `convex-test` suite and real-client smoke. It includes every row in the closed matrix: required/optional fields, unknown fields, wrong primitives, wrong shapes, legacy map, enum mismatch, int64/bytes, non-serializable values where the client can construct them, empty/control strings, fractional/non-finite/unsafe/out-of-int32 numbers, search range, cursors, repeated attribute codes, and authority forgery. Each case asserts `transport-rejection`, `canonical-invalid`, or `accepted`, plus handler/resolver/module/data-access counters where the harness supports them.

### Cursor, safe-error, and leakage tests

- Search proves limit 1 and 50, rejects 0 and 51 canonically, preserves omitted optionals, returns `cursor: null` at completion, and passes non-empty opaque cursors without decoding or exposing persistence meaning.
- Every safe code is tested with its permitted metadata and with forbidden metadata. Unknown/thrown/malformed errors and malformed successes become `INTERNAL_FAILURE` without diagnostics.
- Hostile output tests cover extra internal fields, Convex IDs/documents, persistence records, catalog details, provider data, messages, details, stacks, getters, symbols, sparse arrays, and wrong wrappers.
- Architecture fixtures prove no legacy re-entry, duplicate family, generic execution, direct persistence, generated-platform semantic derivation, automatic publication, final-auth bypass, or validator drift.

## Distinct real local/development generated-client smoke

The smoke is not `convex-test` and is not represented as such. It uses the checked-in/generated Convex `api` references and a real one-shot Convex client (for example the version-pinned `ConvexHttpClient` from Convex 1.45.0) against a disposable local-anonymous or named personal development deployment. It uses query/mutation calls only; no subscription is required.

Conceptual flow:

1. Apply `convex-deploy-guard`: inspect `.env.local`, `convex.json`, deployment key state or official status; classify the target; announce `local-anonymous` or `dev` before each deployment-affecting command. Ambiguity stops the run. Productive targets are forbidden for this change, even with consent.
2. After any required non-production authorization, run the version-pinned one-shot Convex development/codegen command conceptually (for example `corepack pnpm --filter @garfex/backend exec convex dev --once`) against only the classified local/development target.
3. Install representative catalog data only through the existing internal catalog bootstrap on that same disposable non-production target. This setup is separately classified as deployment-affecting and never becomes a public Resource Master function or direct database write.
4. Run a repository smoke command that imports generated `api.resourceMaster.*` references, configures the trusted local-development server identity, and performs taxonomy/schema/options/units, create, get, describe, search, update, deactivate, and inactive search. Assert exact wrappers, revisions, transaction-visible state, and opaque cursor behavior.
5. Drive the shared JD-S-002 table. Well-typed cases use generated references directly; malformed cases use a test-only unsafe call helper. Record thrown transport rejection separately from returned `INVALID_ARGUMENT`.
6. Run a fail-closed identity configuration case on a disposable non-production target or isolated run and assert sanitized `UNAUTHENTICATED`. Negative capability/no-data-access proof remains primarily in-process because the approved local adapter intentionally grants the four Resource Master capabilities.

The evidence ledger records commit/worktree identity, Convex package version, manifest digest, generated validator digest, generated client/codegen digest, classified deployment kind and redacted identifier, catalog revision, each case ID, observed category/outcome, and command exit status. It stores no deployment key, URL secret, token, provider data, payload diagnostics, or productive identifier. In-process and real-client rows are separate; a green in-process row cannot satisfy the real-client column.

No deployment-affecting command is part of design execution. Any later such command must repeat deploy-guard classification and announcement. Fresh consent is required wherever the guard requires it; productive execution remains forbidden by this change.

## Planned file impact

### Canonical semantics and generation

- `tooling/contract-tooling.mjs`: emit/check the deterministic Convex validator artifact and parity descriptor from the semantic manifest; never reverse the dependency.
- `contracts/external-garfex/resource-master/**`: retain transport neutrality; record the repeated-attribute conflict invariant in TypeSpec-owned semantic metadata if needed by the emitter, without adding Convex concepts.
- `apps/backend/src/external-garfex-boundary/client-facing/contract.ts`: remove compatibility request replacement and bare success aliases.
- `apps/backend/src/external-garfex-boundary/client-facing/validation.ts`: remove legacy request/success and field-issue compatibility; retain strict manifest interpretation and correct signed-int32 semantics.
- `apps/backend/convex/resourceMasterContract.generated.ts` (new generated artifact): exact named args/returns validators downstream of the manifest.

### Trusted composition and native adapter

- `apps/backend/src/external-garfex-boundary/trusted/projections.ts`: build exact operation wrappers.
- `apps/backend/src/external-garfex-boundary/trusted/mutation-operations.ts`: map canonical attributes by explicit code and remove duplicate invocation entrypoints.
- `apps/backend/src/external-garfex-boundary/composition.ts`: remain the sole ten-function trusted composition surface and validate before identity/dependencies.
- `apps/backend/convex/resourceMaster.ts`: keep exactly the existing ten exports, import generated validators, construct query/mutation-specific dependencies, and call only named external composition.

`apps/backend/src/resource-master/public.ts`, Resource Master application/domain behavior, `apps/backend/convex/schema.ts`, repositories, persistence records, and catalog installer design are not expected to change.

### Tests, architecture, evidence, and docs

- Existing external contract/generated-runtime/composition/operation/security/error/compatibility tests are corrected to canonical-only behavior.
- `apps/backend/tests/convex-resource-master.test.ts` is corrected to all ten canonical args/outcomes and expanded for JD-S-002 and no-data-access proof.
- A focused native parity test, shared JD-S-002 case table, real generated-client smoke script, and redacted evidence ledger are added under backend test/smoke ownership.
- `tooling/architecture/check.mjs`, architecture tests, and controlled fixtures gain the native adapter exceptions and prohibitions described above.
- `docs/generated/resource-master-external-contract.md` remains transport-neutral and is regenerated from TypeSpec.
- `docs/external-client-boundary.md`, `docs/external-garfex-boundary.md`, `docs/auth-boundary.md`, and `docs/architecture.md` are amended to supersede only the old transport non-decision, cross-link the accepted native adapter, and remove stale claims that no transport is selected.
- A concise `docs/resource-master-convex-native-transport.md` records local/development-only invocation, the exact ten functions, canonical wrappers, JD-S-002 matrix, evidence distinction, deploy-guard rule, and non-productive scope.

## Documentation contract

Canonical documentation must distinguish four layers: TypeSpec external semantics, trusted server composition, actor-first Resource Master application contract, and downstream native Convex adapter. It must state that native Convex is accepted only for GARFEX-owned compatible local/development clients, while HTTP, public/third-party access, productive identity/deployment, SDK/publication, and consumer UI behavior remain unselected.

The docs explicitly call out the breaking migration from map attributes to `ResourceAttribute[]`, from bare successes to wrappers, and from message-bearing internal errors to safe code/metadata-only failures. They document pre-handler transport rejection separately from canonical failures and do not promise `INVALID_ARGUMENT` for every malformed call.

## Rollout and compatibility

Rollout is local/development-only and contract-first:

1. Canonical runtime and generated Convex parity must be green before the existing functions are described as accepted.
2. GARFEX-owned clients regenerate bindings and migrate create payloads and success reads together. There is no period where a single function accepts or returns both dialects.
3. The in-process suite proves all semantics and safety; the distinct real-client smoke then proves deployed serialization and validation boundaries.
4. Acceptance language is updated only after both evidence columns pass. Nothing is automatically published or deployed.

Unknown external consumers receive a breaking-change notice and must opt into the canonical client update. Keeping function names reduces family migration cost but does not conceal the payload break. No productive compatibility promise is made.

## Rollback and containment

Rollback withdraws native transport acceptance and stops dependent local/development clients; it does not create a fallback family or restore legacy behavior as canonical. The native routing/generated-validator/projection changes can be reverted as one adapter layer while leaving Resource Master domain, schema, catalog, and persisted resources unchanged. If reverting exposes the old pre-existing dialect, documentation must mark those functions unaccepted rather than claim canonical parity.

No schema or data migration is introduced, so no productive data rollback exists. Data created by a disposable smoke deployment is discarded with that non-production environment or left only as local development data. A failure is contained by the evidence layer that detects it: generation/parity, runtime composition, authorization, Convex harness, or real client. Fix-forward is preferred over widening validators or restoring implicit compatibility.

## Tradeoffs

1. **Strict structural validators over permissive raw args:** this preserves precise generated client typing and narrows the attack surface, but some malformed calls throw as transport rejection instead of returning `INVALID_ARGUMENT`.
2. **Generated Convex validators over handwritten duplication:** generation adds tooling complexity and a committed transport artifact, but makes TypeSpec directionality and stale/drift detection executable.
3. **Existing named family over a wrapper family:** this avoids API duplication and migration ambiguity, but makes the canonical payload correction intentionally breaking for any unknown old-dialect consumer.
4. **Removal over in-path compatibility:** deleting legacy acceptance gives one explainable contract and the smallest runtime, but offers no transparent transition for old payloads.
5. **Trusted external composition over direct module results:** the extra validation/projection layer costs code and tests, but contains internal DTO/error drift and preserves transport reuse.
6. **One-shot smoke over realtime demonstration:** one-shot calls are deterministic and prove required query/mutation behavior; they do not certify subscription UX, which remains available but out of acceptance scope.

## Residual risks

- Convex transport rejection remains an exception/rejected promise outside the canonical outcome model; consumers must implement that distinction correctly.
- The generated validator emitter must faithfully represent Convex 1.45.0 behavior; version changes require re-pinning docs/types, regeneration, and both JD-S-002 evidence environments.
- Required create `displayValue` and `identityParticipating` remain non-authoritative while Resource Master computes canonical persisted values; client guidance and tests must prevent consumers from treating them as trusted overrides.
- An unknown local/development consumer may break because repository search cannot prove absence outside this repository.
- Real-client smoke depends on correct non-production target classification and catalog setup; evidence is invalid if target identity or generated bindings are stale.
- This design supplies no evidence or claim for productive authentication, productive deployment, public reachability, third-party use, or an additional transport.
