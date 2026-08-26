# External Client Contract for Resource Master — Exploration

## Executive summary

The repository already has a working transport-neutral semantic boundary for exactly ten Resource Master operations, but its current authority is handwritten TypeScript under `apps/backend/src/external-garfex-boundary/client-facing/`. The new change should establish TypeSpec as the independent External Client Contract authority while preserving the existing trusted edge and the actor-first Resource Master public application contract as separate layers.

No HTTP binding exists or should be inferred. TypeSpec can define transport-neutral operations, business DTOs, success outcomes, and safe failures without routes, verbs, status codes, OpenAPI, Scalar, Orval, an SDK, or network reachability. Those remain later decisions gated on an approved HTTP binding.

The current repository has no TypeSpec source, configuration, compiler dependency, emitter dependency, or TypeSpec script. Contract compilation, drift detection, and breaking-change detection therefore need explicit tooling design. This exploration makes no production-code change and does not modify `persistent-resource-catalog`.

## Three boundaries that must remain distinct

```text
External Client Contract (TypeSpec authority)
  transport-neutral, client-safe business semantics
  no ActorContext, auth authority, Convex, persistence, or module internals
                    |
                    v
Trusted edge / composition adapter
  validates untrusted values, authenticates server-side, constructs ActorContext,
  maps one named operation, projects output, allowlists failures
                    |
                    v
Module Public Application Contract
  apps/backend/src/resource-master/public.ts
  actor-first in-process TypeScript API; final deny-by-default authorization
                    |
                    v
Application/Domain ports <- private Infrastructure/Convex adapters
```

| Boundary | Owns | Must not become |
| --- | --- | --- |
| External Client Contract | The ten external operation identifiers, client-safe request/success/error meanings, and compatibility authority. | A re-export or mechanical derivation of `resource-master/public.ts`; an HTTP contract; a Convex API; an SDK. |
| Trusted edge | Authentication integration, fresh `ActorContext` construction, explicit operation mapping, projections, runtime validation, diagnostics, and safe error normalization. | A client-facing authority source; the final authorization policy; a generic dispatcher; a direct Convex/domain/application-internal caller. |
| Module Public Application Contract | `ActorContext`, capabilities, internal application DTOs, `Result<T>`, fourteen module error codes, and ten actor-first methods. | An external client contract or transport schema. |

TypeSpec authority does not make the module public contract external. Duplicate-looking DTO definitions and explicit mappings are intentional ownership boundaries.

## Current Resource Master public application contract

`apps/backend/src/resource-master/public.ts` is framework-neutral and has no internal imports. It exports:

- `ActorId`, `ActorContext`, and five capability literals;
- fourteen `ResourceErrorCode` values and `Result<T>`;
- create, update, deactivate, lifecycle, taxonomy, schema, resource, summary, and search DTOs; and
- `ResourceMaster`, containing exactly ten actor-first asynchronous methods.

`apps/backend/src/resource-master/index.ts` and `apps/backend/src/index.ts` re-export selected public types. They remain backend in-process surfaces, not candidate external schema inputs.

### Ten-operation baseline

| Operation | Module input after separate actor | Module success | Required capability |
| --- | --- | --- | --- |
| `getTaxonomy` | none | `TaxonomyView[]` | `resource:read` |
| `getEffectiveResourceSchema` | `classCode`, `familyCode`, `typeCode` | effective attributes | `resource:read` |
| `getValidOptions` | `attributeCode` | code/label options | `resource:read` |
| `getNaturalUnits` | `familyCode` | allowed and suggested units | `resource:read` |
| `getResource` | `resourceId` | `ResourceView` | `resource:read` |
| `searchResources` | `terms`, optional lifecycle/limit/cursor | summaries plus nullable cursor | `resource:read` |
| `describeResource` | `resourceId` | resource ID and description | `resource:read` |
| `createResource` | taxonomy codes, natural unit, attributes | `ResourceView` | `resource:create` |
| `updateNonIdentityData` | resource ID, expected revision, natural unit | `ResourceView` | `resource:update-non-identity` |
| `deactivateResource` | resource ID, expected revision | `ResourceView` | `resource:deactivate` |

`apps/backend/src/resource-master/application/authorization.ts` owns the exact operation-to-capability map. Unknown or unmapped names return `FORBIDDEN`. The application remains the final authorization authority before catalog or repository work. Reserved `catalog:admin` maps to no baseline operation.

## Existing external semantic contract and adapters

The completed archived change `2026-08-25-external-garfex-boundary` established the current semantic baseline. Its active code is under `apps/backend/src/external-garfex-boundary/`:

| Area | Current evidence |
| --- | --- |
| Handwritten external DTO authority | `client-facing/contract.ts` independently defines the ten operations, requests, successes, eleven safe error codes, and outcomes. |
| Runtime validation | `client-facing/validation.ts` validates closed input/output/failure shapes, rejects unknown and authority-like fields, bounds revisions and search limits, and converts malformed output to `INTERNAL_FAILURE`. |
| Trusted identity | `trusted/identity.ts` adapts `AuthenticationComposition`, resolves an `ActorId`, and returns a fresh `ActorContext` with a copied capability set. |
| Named mappings | `trusted/read-operations.ts` and `trusted/mutation-operations.ts` explicitly invoke one matching `ResourceMaster` method each. |
| Success projections | `trusted/projections.ts` rebuilds reviewed external values field by field rather than passing internal objects through. |
| Error mapping | `trusted/errors.ts` allowlists module error meanings and metadata, sanitizes thrown/invalid failures, and keeps diagnostics server-only. |

The current external failure set is:

- `UNAUTHENTICATED`, `FORBIDDEN`, `INVALID_ARGUMENT`, `INVALID_REFERENCE`, `VALIDATION_FAILED`;
- `NOT_FOUND`, `DUPLICATE`, `CONFLICT`, `INVALID_LIFECYCLE`;
- `CATALOG_UNAVAILABLE`, `INTERNAL_FAILURE`.

Only `fieldIssues`, `existingResourceId`, and `currentRevision` are conditionally exposed. Module messages, details, stacks, provider diagnostics, Convex data, and catalog integrity details are not forwarded. `RESOURCE_CATALOG_UNAVAILABLE` and `RESOURCE_CATALOG_UNINITIALIZED` normalize to `CATALOG_UNAVAILABLE`; `INTEGRITY`, `INTERNAL`, `RESOURCE_CATALOG_INVALID`, unknown codes, malformed metadata, projection failures, and invalid responses normalize to metadata-free `INTERNAL_FAILURE`.

The TypeSpec contract should preserve this reviewed semantic baseline unless a later proposal/spec explicitly approves a compatibility change. It must not import or derive from module TypeScript or Convex validators.

## Trusted transport and composition entrypoints

There are two current server-side composition paths, neither of which is an approved external HTTP binding:

1. `apps/backend/convex/resourceMaster.ts` registers ten Convex queries/mutations with explicit Convex argument and return validators. Each handler creates configured authentication composition and invokes the actor-first Resource Master through `apps/backend/src/auth/resource-master-edge.ts` and `infrastructure/convex-resource-master.ts`.
2. `apps/backend/src/external-garfex-boundary/trusted/{read-operations,mutation-operations}.ts` exposes named backend functions that accept raw unknown business input plus trusted dependencies. These are a semantic trusted seam, not routes or network endpoints.

`apps/backend/src/resource-master/infrastructure/convex-resource-master.ts` constructs the application with fresh Convex repository and catalog-reader adapters. Convex remains private infrastructure. A future transport handler should depend only on the trusted external edge or the module public application contract as designed; it must not import application/domain/infrastructure internals or generated Convex bindings.

### ActorContext construction

`apps/backend/src/auth/composition.ts` owns provider-neutral server composition: an `IdentityAdapter` plus a server-configured capability set. The only configured implementation is fail-closed local development when both environment selectors match exactly.

- `auth/resource-master-edge.ts` resolves `ActorId` and builds `{ actorId, capabilities }` for current Convex handlers.
- `external-garfex-boundary/trusted/identity.ts` performs equivalent trusted resolution and copies capabilities into a fresh `Set` for the external semantic seam.
- Neither path reads actor IDs, roles, capabilities, claims, tokens, credentials, sessions, or provider data from business input.
- Productive identity provider, session/token mechanics, and deployment authentication remain open.

A later transport edge may receive authentication metadata, but that metadata must remain outside TypeSpec business DTOs and must be consumed only by trusted server composition.

## Validators, mappings, tests, and drift evidence

### Existing tests

- `external-garfex-contract.test.ts`: closed operation/error unions, request/output/failure validators, unknown-field rejection, output containment, and fresh-value rebuilding.
- `external-garfex-operations.test.ts`: named mappings, actor separation, authentication short-circuiting, projections, error mapping, diagnostics, and thrown-failure containment.
- `external-garfex-security.test.ts`: authority-forgery and sensitive-data leakage controls.
- `external-garfex-compatibility.test.ts`: all ten serialized request/success/failure examples, eleven-code metadata matrix, opaque cursor behavior, and exact named invocation.
- `external-garfex-documentation-parity.test.ts`: operation/capability/error-table parity and explicit non-decision markers.
- `resource-master-authorization.test.ts`, `resource-master-catalog-boundary.test.ts`, and Resource Master/Convex tests: exact capabilities, early denial, all ten operations, catalog behavior, and adapter composition.

The representative compatibility baseline is `apps/backend/tests/fixtures/external-garfex-boundary/compatibility.json`. It is evidence only and does not select JSON as a transport.

### Architecture enforcement

`tooling/architecture/check.mjs` and `tooling/tests/architecture.test.ts` currently enforce named rules including:

- external contract independence from backend internals;
- no authority or platform concepts in client-facing source;
- trusted edge imports only the Resource Master public contract and auth composition;
- no generic business executor, automatic derivation, or transport framing;
- no Convex/generated/persistence/deployment leakage; and
- no package, workspace, Git, filesystem, symlink, or source coupling to the external UI repository.

Controlled valid and violation fixtures exist under `tooling/architecture-fixtures/{valid,violations}/external-garfex-boundary/` and `external-client-boundary/`.

Important gap: the checker scans JavaScript/TypeScript source and selected metadata, but its `sourceExtension` does not include `.tsp`. TypeSpec source and emitted contract artifacts will need direct architecture checks so the new authority cannot bypass existing no-authority/no-platform/no-transport rules.

### Required future drift controls

Design should provide independently reviewable checks for:

1. TypeSpec compilation with no transport emitter required.
2. Exact ten-operation parity between TypeSpec authority and trusted named mappings.
3. Request, success, error-code, and allowlisted-metadata parity against reviewed compatibility evidence.
4. Detection of additions, removals, renames, type narrowing/widening, requiredness changes, enum changes, and field changes before publication.
5. A deliberate baseline/version comparison that reports breaking changes without silently publishing them.
6. Architecture scanning of `.tsp`, TypeSpec configuration, and any committed/generated artifacts for authority, platform, transport, or module-internal leakage.
7. Proof that a new Resource Master method remains private until the TypeSpec contract and explicit trusted mapping are separately changed.

The exact baseline format, compatibility policy, and whether runtime validators or TypeScript types are generated remain design decisions. TypeSpec must be upstream of any such artifact; module TypeScript and Convex validators must not become its source.

## TypeSpec and repository tooling state

Current facts:

- No `.tsp` files exist.
- No `tspconfig.yaml` or equivalent TypeSpec configuration exists.
- No `@typespec/*` dependency appears in root or backend package manifests.
- No TypeSpec compile, format, lint, compatibility, or breaking-change script exists.
- No OpenAPI, Scalar, or Orval tooling is configured.
- The workspace accepts `apps/*` and `packages/*`, but there is currently no `packages/` directory.
- Root checks use pnpm 11, Node 24, TypeScript 5.9, Biome, Vitest, dependency-cruiser, and project references.

Likely tooling work includes a dedicated, independently owned contract location; pinned TypeSpec compiler/library dependencies; a transport-neutral compile gate; repository scripts; and lockfile updates. The physical location, package publication status, emitted artifacts, and compatibility command must be selected in design. No HTTP/OpenAPI emitter should be installed or executed merely to validate the transport-neutral contract.

## Documentation and ADR conventions

The repository uses concise accepted decision records under `docs/` rather than a numbered ADR directory. Typical documents lead with status/decision, include dependency-direction diagrams and ownership tables, enumerate open work, and cross-link related boundaries. Relevant records are:

- `docs/external-client-boundary.md` — repository independence and the rule that module `public.ts` is not an external contract;
- `docs/external-garfex-boundary.md` — canonical ten-operation semantics, safe errors, evidence, and explicit non-decisions;
- `docs/auth-boundary.md` — trusted actor construction and final module authorization;
- `docs/architecture.md` — layer ownership, Convex isolation, and architecture gates.

OpenSpec changes use `exploration.md`, `proposal.md`, `specs/<capability>/spec.md`, `design.md`, `tasks.md`, and verification/progress reports. Technical artifacts are written in English.

## Likely edit surfaces for later phases

| Surface | Likely purpose |
| --- | --- |
| New TypeSpec contract root and configuration | Own transport-neutral namespace, ten operations, DTOs, and safe error semantics. Physical path remains a design decision. |
| Root `package.json`, `pnpm-lock.yaml`, possibly workspace/project config | Pin compiler/tooling and add deterministic compile/drift/breaking gates. |
| Existing `external-garfex-boundary/client-facing/` | Reposition handwritten TypeScript so it is generated from or checked against TypeSpec, rather than remaining an independent competing authority. Exact generation strategy is open. |
| Existing trusted read/mutation/identity/projection/error files | Continue explicit adaptation to `ResourceMaster`; consume only approved contract artifacts and the module public contract. |
| Architecture checker/tests/fixtures | Recognize `.tsp` and generated artifacts; enforce boundary separation and prohibit transport/platform/authority leakage. |
| External contract, compatibility, security, operation, and documentation-parity tests | Make TypeSpec authority and drift/breaking behavior executable while retaining all-ten-operation evidence. |
| `docs/external-garfex-boundary.md`, `external-client-boundary.md`, `auth-boundary.md`, `architecture.md` | Record TypeSpec authority and retain transport/auth/Convex non-decisions. |

`apps/backend/convex/resourceMaster.ts`, Convex schema/generated bindings, Resource Master application/domain/infrastructure, and UI/client repositories are not expected contract-authority edit surfaces. Any change there would require a separately justified need and must not be used to create external reachability.

## Open decisions to preserve

1. HTTP versus any other protocol or transport; routes, verbs, status codes, headers, authentication framing, and serialization are unselected.
2. Network deployment and reachability are unselected.
3. OpenAPI emission, Scalar documentation, Orval generation, and all HTTP-derived artifacts are blocked until an HTTP binding is approved.
4. Runtime validation generation, TypeScript artifact generation, and generated-versus-handwritten adapter strategy are unselected, except that TypeSpec is authoritative.
5. Contract package/publication location, registry/hosting, artifact distribution, semantic version identifiers, compatibility window, and deprecation policy are unselected.
6. Productive identity provider, credentials, token/session validation, role provisioning, and machine identity are unselected.
7. UI/client implementation, workflows, state, SDK consumption, and consumer-specific behavior are out of scope.
8. External expansion beyond the ten baseline operations is unapproved.

## Risks and controls

| Risk | Control |
| --- | --- |
| Treating TypeSpec as HTTP by default | Keep the model transport-neutral and forbid HTTP decorators, routes, verbs, status mappings, and HTTP emitters before binding approval. |
| Keeping two competing authorities | Make TypeSpec authoritative and define an explicit generated-or-parity-checked relationship for current TypeScript DTOs and validators. |
| Publishing ActorContext or capability authority | Keep all identity/auth types absent from TypeSpec business models and construct actors only at the trusted edge. |
| Handler bypasses the module contract | Architecture-test imports and require trusted adapters to call only `resource-master/public.ts` operations. |
| Leaking internal failures | Retain exhaustive allowlisted normalization and metadata-free fallback. |
| Convex becomes external API | Keep TypeSpec and external artifacts free of Convex imports/types; treat current Convex entrypoints only as private runtime evidence. |
| Silent additive or breaking drift | Compile, compare against a reviewed baseline, test exact operation/mapping parity, and fail CI on unreviewed compatibility changes. |
| Generic dispatch auto-publishes future methods | Keep ten named operations and named trusted handlers; reject operation registries and automatic derivation. |

## Recommended next phase

Proceed with `sdd-new` proposal work for `external-client-contract-resource-master`. The proposal should establish TypeSpec as the transport-neutral external authority, preserve the exact ten-operation semantic baseline and three-layer separation, require trusted actor construction and safe mappings, and require compile/drift/breaking gates. It should explicitly defer all HTTP/OpenAPI/Scalar/Orval, SDK, UI/client, productive authentication, and distribution decisions.
