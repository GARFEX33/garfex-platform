# Tasks: Resource Master Convex Native Transport

## Review Workload Forecast

| Field | Value |
| ------- | ------- |
| Estimated changed lines | Approximately 850–1,200 authored lines across implementation, tests, controls, smoke tooling, and documentation; generated snapshots are additional review surface but excluded from the authored estimate |
| 400-line budget risk | High (approved `size:exception` for one PR) |
| Chained PRs recommended | No |
| Suggested split | One PR with the user-approved `size:exception`; chained strategy is not applicable |
| Delivery strategy | exception-ok |
| Chain strategy | not applicable |
| Likely files | `contracts/external-garfex/resource-master/**`; `tooling/contract-tooling.mjs`; `apps/backend/src/external-garfex-boundary/**`; `apps/backend/convex/resourceMaster.ts`; new `apps/backend/convex/resourceMasterContract.generated.ts`; `apps/backend/tests/**`; `tooling/architecture/**`; `docs/**` |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: not applicable
400-line budget risk: High

The forecast crosses the 400 authored-line review budget because the change spans canonical runtime removal, a deterministic generated artifact, ten-operation Convex routing, strict TDD behavior/security coverage, architecture fixtures, several documentation records, and a distinct real-client smoke. The parent resolved delivery as `exception-ok`: one PR with an explicitly user-approved `size:exception`; no chain selection is required.

## Scope and sequencing guardrails

- TypeSpec remains the sole semantic authority; Convex validators, generated bindings, serialization, and deployment remain downstream transport machinery.
- The accepted native surface is exactly these existing functions, once each: `api.resourceMaster.getTaxonomy`, `api.resourceMaster.getEffectiveResourceSchema`, `api.resourceMaster.getValidOptions`, `api.resourceMaster.getNaturalUnits`, `api.resourceMaster.getResource`, `api.resourceMaster.searchResources`, `api.resourceMaster.describeResource`, `api.resourceMaster.createResource`, `api.resourceMaster.updateNonIdentityData`, and `api.resourceMaster.deactivateResource`.
- No task may add a second family, generic executor, dispatcher, alternate registry, universal payload, HTTP route, productive identity/deployment, UI, SDK/publication path, or edit under `openspec/changes/persistent-resource-catalog/`.
- Every work unit starts RED, records the failing assertion, proceeds to the smallest GREEN implementation, TRIANGULATEs against the relevant independent boundary, and REFACTORs only while all prior evidence remains green. Existing tests must be corrected to canonical behavior, never widened into dual-dialect acceptance.
- Normal apply commands are repository-local and non-deployment-affecting. Any Convex development/codegen/bootstrap command that can write or target a deployment is separately classified and announced with `convex-deploy-guard`; productive targets are forbidden.

## Dependency-ordered implementation work units

### Work Unit 1 — Reconcile canonical TypeSpec/runtime dialect before Convex exposure

**Traceability:** Spec requirements `Canonical dialect reconciliation precedes native exposure`, `Deterministic transport-neutral outcomes`, and `No internal or Convex leakage`; scenarios `Create maps attributes by explicit code`, `Legacy create map is not canonical input`, `Bare success cannot enter the canonical path`, `Quarantined compatibility is unreachable`, and `Equivalent successes normalize identically`. Design decisions: remove canonical compatibility replacement/parsers and bare-success fallback; map `ResourceAttribute[]` by explicit `attributeCode`; preserve exact wrapped values and TypeSpec-owned semantics.

**Start boundary:** Existing TypeSpec and external runtime still permit the code-keyed create map, bare successes, or compatibility field-issue aliases. No Convex registration or validator is changed in this unit.

**Finish boundary:** Canonical external requests and outcomes are strict and independently owned; create adaptation iterates explicit `attributeCode`, rejects repeated codes as canonical `INVALID_ARGUMENT` with `attributes/CONFLICTING`, and legacy helpers cannot be reached from the canonical composition. TypeSpec remains free of Convex imports and transport concepts.

**Verification boundary:** Contract/runtime tests and TypeSpec compilation pass before any native Convex exposure work begins. **Rollback boundary:** Revert only canonical contract/runtime and trusted projection/mapping edits in the listed files; do not touch Resource Master domain, schema, persistence, catalog, or protected OpenSpec content.

- [x] **RED:** Add or correct failing tests under `apps/backend/tests/**` matching `*external*`, `*contract*`, `*compatibility*`, and `*projection*` to reject legacy code-keyed `attributes`, bare taxonomy/options/resource successes, implicit wrapping, legacy field-issue aliases, and array-index code inference; add an order-permutation and repeated-`attributeCode` case. Run `corepack pnpm test` and record the old-dialect failures. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Update `contracts/external-garfex/resource-master/{models.tsp,operations.tsp,contract-metadata.tsp}` and `apps/backend/src/external-garfex-boundary/client-facing/{contract.ts,validation.ts}` so the manifest-derived canonical request/success/error models are the only accepted path; remove compatibility request replacement, legacy parsers, bare-success fallback, and legacy field-issue aliases without adding Convex concepts. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Update `apps/backend/src/external-garfex-boundary/trusted/{projections.ts,mutation-operations.ts}` to build operation-specific wrappers field-by-field, preserve nullable opaque search cursors, map each canonical attribute value under its explicit `attributeCode`, reject repeated codes before Resource Master, and keep caller `displayValue`/`identityParticipating` non-authoritative. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** Run `corepack pnpm test`, `corepack pnpm contract:typespec:check`, `corepack pnpm contract:generate`, and `corepack pnpm contract:check`; inspect the generated semantic manifest and canonical runtime for Convex/backend imports and verify the protected path with `test -z "$(git status --short -- openspec/changes/persistent-resource-catalog/)"`. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** Convert old map/bare-success fixtures in the discovered external contract test paths into explicit negative evidence, remove dead compatibility symbols/imports, and preserve one canonical request/result dialect without changing Resource Master public/application/domain files. <!-- sdd-owner: implementation -->

**Commit unit:** `feat(contract): reconcile Resource Master external dialect` with tests beside canonical behavior. This commit is independently reviewable and contains no Convex exposure change.

### Work Unit 2 — Generate deterministic Convex validators downstream of TypeSpec

**Traceability:** Spec requirement `Convex validators remain downstream of TypeSpec` and scenarios `Validator drift cannot redefine the contract` and `TypeSpec remains transport-neutral after acceptance`; parity scenarios under `Exact ten-operation native parity is mandatory`. Design decisions: `contract:generate` emits `apps/backend/convex/resourceMasterContract.generated.ts`; recursive strict validators use manifest requiredness/types; eleven literal safe-error branches correlate allowlisted metadata; generated output registers/invokes nothing.

**Start boundary:** Unit 1 canonical manifest/runtime is green, but Convex validator ownership and drift are unproven and no generated native validator artifact is committed.

**Finish boundary:** The generated artifact contains exactly named args and return validators for the ten operations, manifest identity/digest, closed nested structures, canonical wrappers, and correlated safe failures; it imports only `v` from `convex/values`, never feeds TypeSpec, and cannot be manually widened without `contract:check` failing.

**Verification boundary:** Generation is deterministic and byte-checked in a temporary regeneration; validator behavior and digest tests pass. **Rollback boundary:** Remove only the generated emitter/output and its tests; leave canonical TypeSpec/runtime edits from Work Unit 1 intact.

- [x] **RED:** Add failing generator/parity tests in `tooling/tests/**` matching `*contract*`, `*generator*`, or `*parity*` plus a focused backend validator test target for missing/extra operations, wrong requiredness, widened literals, open nested objects, bare wrappers, widened metadata, stale digest, and Convex-derived semantic input. Run `corepack pnpm test`. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Extend `tooling/contract-tooling.mjs` so `contract:generate` consumes only the deterministic TypeSpec semantic manifest and emits `apps/backend/convex/resourceMasterContract.generated.ts` with the ten named args/return validators, recursive closed structures, `ResourceAttribute[]`, nullable cursor, exact literal error codes, and only permitted `fieldIssues`, `existingResourceId`, or `currentRevision` branches. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Commit and wire the deterministic artifact `apps/backend/convex/resourceMasterContract.generated.ts`; ensure it has no registration, `api` import, handler invocation, persistence field, platform value, or reverse dependency into TypeSpec/canonical runtime. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** Run `corepack pnpm contract:typespec:check`, `corepack pnpm contract:generate`, `corepack pnpm contract:check`, `corepack pnpm --filter @garfex/backend typecheck`, and `corepack pnpm test`; compare the committed artifact with a temporary regeneration and record manifest/generated digests. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** Consolidate generator fixtures into deterministic all-ten parity descriptors, document the Convex 1.45.0 pin and generated-client typing consequences, and ensure no handwritten business validator remains necessary in `apps/backend/convex/resourceMaster.ts`. <!-- sdd-owner: implementation -->

**Commit unit:** `feat(contract): generate TypeSpec-derived native validators` with generator tests and the deterministic generated artifact together. It is the first transport-artifact unit and still does not route a callable handler.

### Work Unit 3 — Compose trusted identity and route the existing native family

**Traceability:** Spec requirements `Native composition preserves trusted authority and safe encapsulation` and `Exact ten-operation native parity`; scenarios `Fresh server-derived actor reaches Resource Master`, `Final authorization denies before data work`, `Unsafe failure is contained`, and `Request, success, failure, metadata, and mapping parity passes`. Design decisions: generated validator → named runtime validator → configured authentication → fresh copied-capability `ActorContext` → named composition → identically named Resource Master method → final module authorization → query/mutation infrastructure → explicit projection/normalization; no generic executor or duplicate mutation entrypoints.

**Start boundary:** Canonical runtime and generated validators are green, while `apps/backend/convex/resourceMaster.ts` still uses old handwritten validators/direct module wiring or old result dialect.

**Finish boundary:** The existing `apps/backend/convex/resourceMaster.ts` retains exactly seven one-shot queries and three transactional mutations, each with generated args/returns and a one-to-one named composition call; authentication and actor construction are server-derived; query/mutation factories preserve transaction boundaries; all module outputs/errors are projected and normalized safely.

**Verification boundary:** Named routing, validator usage, fresh actor creation, and no direct data access are proven by focused composition tests and backend typecheck. **Rollback boundary:** Revert only native handler routing/composition/projection changes; do not restore legacy canonical acceptance or alter Resource Master policy/schema/persistence.

- [x] **RED:** Add failing named-mapping and security tests in `apps/backend/tests/**` matching `*composition*`, `*security*`, `*resource-master*`, and `*convex*` to enumerate exactly the ten approved bindings, reject generic dispatch/second families, observe fresh actor/capability copies, and assert no catalog/repository/persistence work before request validation and final authorization. Run `corepack pnpm test`. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Update `apps/backend/src/external-garfex-boundary/composition.ts` and `apps/backend/src/external-garfex-boundary/trusted/mutation-operations.ts` so composition owns the sole ten trusted invocation entrypoints, validates before identity, maps each operation to the identically named Resource Master public method, and leaves Resource Master final deny-by-default authorization authoritative. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Update `apps/backend/convex/resourceMaster.ts` to import `apps/backend/convex/resourceMasterContract.generated.ts` validators, retain exactly the seven named queries and three named mutations, call only the corresponding external composition functions, and use `createConvexQueryResourceMaster` or `createConvexMutationResourceMaster` without direct `ctx.db`, schema, repository, catalog-installer, or internal DTO access. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Ensure `apps/backend/src/auth/{composition.ts,resource-master-edge.ts,local-development-identity-adapter.ts}` continues to resolve only configured local/development identity and creates a fresh copied-capability `ActorContext`; client business arguments contain no actor, role, capability, claim, token, credential, session, provider, or Convex authority field. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** Run `corepack pnpm --filter @garfex/backend typecheck`, `corepack pnpm --filter @garfex/backend test`, `corepack pnpm test:architecture`, and `corepack pnpm contract:check`; inspect generated public bindings for exactly the ten names and seven-query/three-mutation classification. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** Remove duplicate mutation invocation exports and dead direct-handler validators/imports, keep explicit operation names visible in source, and verify the diff contains no HTTP, generic executor, alternate registry, productive auth/deployment, or protected catalog path. <!-- sdd-owner: implementation -->

**Commit unit:** `feat(resource-master): route the ten native calls through trusted composition` with composition, adapter, and focused tests together.

### Work Unit 4 — Prove all-ten behavior, security, and JD-S-002 in-process

**Traceability:** Spec requirements `Exact ten-operation native parity`, `JD-S-002 validation outcomes are explicit and observable`, `Native composition preserves trusted authority and safe encapsulation`, and `Native acceptance requires integrated and real-client evidence`; scenarios `Pre-handler rejection is not misreported`, `Admitted invalid value is normalized canonically`, `Forged authority behavior is classified and safe`, `Convex test harness proves integrated semantics`, and `One-shot use does not require realtime`. Design decisions: strict structural Convex validation plus handler-owned semantic validation; pre-handler rejection is not `INVALID_ARGUMENT`; all ten generated references and query/mutation behavior are exercised.

**Start boundary:** Named native routing is present, but old Convex tests and fixtures may still assert bare `value` payloads, map-shaped attributes, incomplete errors, or only happy paths.

**Finish boundary:** `convex-test` proves all ten functions, canonical requests/wrappers, explicit attribute mapping and order invariance, repeated-code invalidation, all eleven safe failure branches/metadata rules, opaque cursors, auth/fresh actor/final exact capability denial before data work, leakage containment, legacy exclusion, family uniqueness, and one-shot query/transactional mutation behavior. Evidence is explicitly labeled in-process and never treated as deployment proof.

**Verification boundary:** `corepack pnpm test` and backend tests pass with a shared versioned JD-S-002 matrix. **Rollback boundary:** Revert only test harness, fixtures, and behavior fixes for this native boundary; do not weaken assertions to re-admit legacy dialects.

- [x] **RED:** Correct `apps/backend/tests/convex-resource-master.test.ts` and discovered `apps/backend/tests/**` external/security/error/parity suites to assert canonical wrappers and `ResourceAttribute[]`, then run `corepack pnpm test` to capture failures from the previous dialect and missing negative cases. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Expand `apps/backend/tests/convex-resource-master.test.ts` to invoke every generated `api.resourceMaster.*` reference: seven one-shot reads (`getTaxonomy`, `getEffectiveResourceSchema`, `getValidOptions`, `getNaturalUnits`, `getResource`, `searchResources`, `describeResource`) and three transactional mutations (`createResource`, `updateNonIdentityData`, `deactivateResource`) with exact canonical outcomes and lifecycle/revision behavior. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Add a shared JD-S-002 case table under `apps/backend/tests/**` covering missing/unknown fields, wrong primitives/shapes/nulls, legacy maps, unknown literals, unsupported Convex values, non-serializable values, empty/control strings and cursors, fractional/non-finite/unsafe/out-of-int32 numbers, limits `0/1/50/51`, signed negative `expectedRevision`, repeated attributes, empty arrays, and forged authority fields; assert `transport-rejection`, `canonical-invalid`, or `accepted` plus zero handler/resolver/module/data work where observable. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Add in-process security/leakage cases for unauthenticated identity, missing/unknown/mismatched capabilities, fresh actor instances, final `FORBIDDEN` before data access, every safe code and metadata allowlist, malformed/thrown/unsafe failures as metadata-free `INTERNAL_FAILURE`, opaque cursors, hostile extra fields/getters/symbols/sparse arrays, persistence/Convex IDs, catalog/provider details, messages, stacks, and bare wrappers. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** Run `corepack pnpm --filter @garfex/backend test`, `corepack pnpm test`, `corepack pnpm --filter @garfex/backend typecheck`, and `corepack pnpm test:architecture`; record in-process evidence separately from any future real-client row and explicitly state that `convex-test` is not deployment proof. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** Make fixtures deterministic, keep canonical and negative legacy evidence visibly separate, reuse the shared JD matrix rather than duplicating dialect assumptions, and preserve strict assertions for no realtime subscription, no direct persistence, and exactly one public family. <!-- sdd-owner: implementation -->

**Commit unit:** `test(resource-master): prove canonical ten-operation behavior and security` with behavior fixes and tests in one review unit.

### Work Unit 5 — Enforce architecture and protected-scope controls

**Traceability:** Spec requirements `Architecture fitness enforcement`, `TypeSpec-aware architecture fitness checks`, `Convex and backend internals remain encapsulated`, and `Scope exclusions and deferred decisions remain explicit`; scenarios `Each prohibited pattern has a failing fixture`, `Safe independent contract and accepted adapter pass`, `Prohibited TypeSpec or adapter construct fails`, `Module addition remains private by architecture`, and `Protected catalog change is absent`. Design decisions: permit only the reviewed downstream native adapter for the ten names; reject semantic Convex derivation, authority/persistence/platform leakage, generic execution, automatic publication, direct persistence, final-auth bypass, and validator drift.

**Start boundary:** Runtime and tests are canonical, but architecture checks may still encode the former blanket transport prohibition or lack controlled violating fixtures for the accepted downstream exception.

**Finish boundary:** Architecture tooling permits only the TypeSpec-neutral contract plus reviewed downstream generated/native transport artifact, rejects every prohibited pattern with named fixtures, verifies exact ten family/mapping and final authorization, and fails if the protected catalog tree changes.

**Verification boundary:** Architecture tests and checker pass for valid fixtures and fail for each intended violation. **Rollback boundary:** Revert only `tooling/architecture/**` controls, fixtures, and tests; never alter protected files to make a fixture pass.

- [x] **RED:** Add failing valid/violating fixture expectations to `tooling/tests/architecture.test.ts`, `tooling/architecture/check.mjs`, and concrete fixture globs under `tooling/architecture/**` for internal imports, authority fields, Convex/generated semantic derivation, persistence/deployment leakage, generic forwarding, duplicate families, automatic publication, direct `ctx.db`, bypassed final authorization, stale validators, and protected-path changes. Run `corepack pnpm test:architecture`. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Update `tooling/architecture/check.mjs` and its fixtures to recognize the ten approved native names as downstream-only exceptions while retaining TypeSpec transport neutrality and rejecting all unreviewed native functions, registries, HTTP/OpenAPI/Scalar/Orval/SDK publication, productive identity/deployment, internal DTOs, persistence records, catalog administration, and module-contract derivation. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Add exact family/mapping, generated-validator ownership/digest, no-direct-persistence, final-authorization, canonical-only dependency, transport-neutral TypeSpec, and protected-path assertions to `tooling/tests/architecture.test.ts` and the corresponding controlled fixtures. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** Run `corepack pnpm test:architecture`, `corepack pnpm contract:check`, `corepack pnpm --filter @garfex/backend typecheck`, and `corepack pnpm test`; separately run `git diff --exit-code -- openspec/changes/persistent-resource-catalog/` and `git diff --cached --exit-code -- openspec/changes/persistent-resource-catalog/` and require both to be clean. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** Name each architecture rule and fixture by the requirement it protects, remove overlapping broad scans that would accidentally authorize a second family, and keep all accepted Convex references confined to downstream transport machinery. <!-- sdd-owner: implementation -->

**Commit unit:** `test(architecture): enforce native transport boundary rules` with controls and fixtures together.

### Work Unit 6 — Update canonical/native documentation and deterministic evidence artifacts

**Traceability:** Spec requirements `Canonical boundary documentation`, `Transport-neutral consumer documentation`, `No internal or Convex leakage`, and `Scope exclusions and deferred decisions remain explicit`; scenarios `Documentation matches executable semantics`, `ADRs preserve the amended architecture`, `Remaining non-decisions stay open`, `Semantic documentation stands alone`, and `Native guidance remains subordinate and scoped`. Design decisions: docs distinguish TypeSpec semantics, trusted edge, actor-first module, and downstream native adapter; supersede only the old transport non-decision; state local/development-only scope, breaking dialect migration, JD-S-002 distinction, safe containment, and both evidence environments.

**Start boundary:** Executable semantics and architecture controls are green, while generated semantic docs or ADRs may still claim transport remains entirely open or expose stale map/bare-success language.

**Finish boundary:** Deterministic generated semantic documentation remains transport-neutral; `docs/{external-client-boundary.md,external-garfex-boundary.md,auth-boundary.md,architecture.md}` and `docs/resource-master-convex-native-transport.md` cross-link exact operations/mappings/wrappers/errors/metadata, trusted actor/final authorization, legacy exclusion, JD-S-002, evidence distinction, guard rules, and all non-goals. An evidence ledger records case IDs, environment, digests, redacted target, catalog revision, and exit status without secrets.

**Verification boundary:** Documentation parity and generation checks prove no stale transport-open claim, Convex semantic derivation, productive/public claim, or HTTP commitment. **Rollback boundary:** Revert only documentation/evidence changes and their parity tests; do not change runtime behavior or protected OpenSpec content.

- [x] **RED:** Add documentation-parity failures in `tooling/tests/**` matching `*documentation*`, `*docs*`, or `*parity*` for stale no-transport claims, wrong operation/wrapper/error tables, missing supersession language, missing local/development scope, missing JD-S-002 distinction, and accidental HTTP/productive/third-party/UI claims. Run `corepack pnpm test`. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Regenerate `docs/generated/resource-master-external-contract.md` from TypeSpec and amend `docs/external-client-boundary.md`, `docs/external-garfex-boundary.md`, `docs/auth-boundary.md`, and `docs/architecture.md` to cross-link the accepted native adapter without making TypeSpec transport-specific. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Add `docs/resource-master-convex-native-transport.md` with the exact ten bindings and one-to-one mappings, canonical `ResourceAttribute[]`/wrappers, strict validator/JD-S-002 matrix, trusted identity/final authorization, safe eleven-code failures, local/development-only one-shot usage, explicit non-goals, and a clear statement that `convex-test` is not deployment proof. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Add the redacted deterministic evidence ledger at the concrete smoke/evidence path selected by the implementation (discovery target `apps/backend/tests/smoke/**` or `tooling/evidence/**`) with schema fields for commit/worktree, Convex version, manifest/generated/client digests, classified target kind and redacted identifier, catalog revision, case ID/category/outcome, and command exit status; prohibit secrets and productive identifiers. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** Run `corepack pnpm contract:typespec:check`, `corepack pnpm contract:generate`, `corepack pnpm contract:check`, `corepack pnpm test:architecture`, and `corepack pnpm test`; inspect changed documentation for exact ten parity and protected-path cleanliness. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** Keep generated semantic docs deterministic, keep native invocation guidance subordinate to TypeSpec, cross-link the relevant boundary records, and state that semantic-version ordering/windows/deprecation/migration duration remain deferred. <!-- sdd-owner: implementation -->

**Commit unit:** `docs(resource-master): document canonical native Convex boundary` with docs, evidence schema, and parity tests beside the behavior they describe.

### Work Unit 7 — Prove a real local/development generated-client smoke boundary

**Traceability:** Spec requirement `Native acceptance requires integrated and real-client evidence`; scenarios `Generated client proves deployed boundary behavior`, `Both proof environments agree`, and `One-shot use does not require realtime`. Design decisions: use installed Convex 1.45.0 generated `api.resourceMaster.*` references with a one-shot `ConvexHttpClient` or equivalent against only disposable local-anonymous/named personal development; seed only through the existing internal catalog bootstrap; run no subscription; keep in-process and real-client evidence columns distinct.

**Start boundary:** In-process evidence is green and smoke tooling/evidence schema is available, but no real deployment/client observation has been made.

**Finish boundary:** The smoke script drives all required reads, search, create/get/describe/update/deactivate/inactive-search flows plus the shared JD-S-002 cases through generated bindings, records exact wrappers/failures/serialization categories, and proves trusted local/development identity without claiming productive, public, or third-party readiness.

**Verification boundary:** A real client and real local/development deployment independently pass; `convex-test` results cannot fill the real-client column. **Rollback boundary:** Delete only disposable smoke data/target state and revert smoke/evidence tooling; no schema, production, protected catalog, or productive deployment rollback exists.

- [x] **RED:** Add a failing real-client smoke target at `apps/backend/tests/smoke/resource-master-native-client.ts` and a concrete runner entry in `apps/backend/package.json`; assert that the script refuses missing/ambiguous/non-local-development target classification and has no subscription path. Run only the repository test runner for the unit; do not deploy during RED. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Implement the one-shot generated-client smoke using Convex 1.45.0 and generated `api.resourceMaster.*` references, configured trusted local/development identity, canonical lifecycle flow, exact wrappers/failures, opaque cursor checks, and the shared JD-S-002 case table. Use a test-only unsafe helper only for malformed-call cases and record transport rejection separately from returned `INVALID_ARGUMENT`. <!-- sdd-owner: implementation -->
- [x] **GREEN:** Locate the existing internal catalog bootstrap under `apps/backend/convex/**` or its documented internal runner and make smoke setup use that path only; do not add a public seed function or direct persistence write. Record the exact bootstrap command in the evidence ledger after target classification. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** Before each deployment-affecting command, inspect `.env.local`, `convex.json`, and deployment-key state, announce `target: local-anonymous (...)` or `target: dev (...)`, and stop on ambiguity using `convex-deploy-guard`. Then, only on the classified non-production target, run `corepack pnpm --filter @garfex/backend exec convex dev --once`, the discovered internal bootstrap command, and `corepack pnpm --filter @garfex/backend exec node --experimental-strip-types tests/smoke/resource-master-native-client.ts`; record exit statuses, redacted target, digests, and case results. <!-- sdd-owner: implementation -->
- [x] **TRIANGULATE:** Compare every shared JD-S-002 case between `convex-test` and the real generated client, require matching category and downstream-call consequence, and explicitly report any harness limitation rather than relabeling in-process evidence as deployment proof. <!-- sdd-owner: implementation -->
- [x] **REFACTOR:** Keep deployment-affecting commands out of normal `corepack pnpm test`/`corepack pnpm check` acceptance, document their guard classification and any future fresh consent requirement, clean disposable data, and preserve the prohibition on productive authentication/deployment/public exposure. <!-- sdd-owner: implementation -->

**Commit unit:** `test(smoke): prove native generated-client local boundary` with smoke runner, evidence output, and documentation of the deployment guard beside the test.

## Safe apply commands versus guarded smoke commands

**Safe repository-local acceptance commands (no deployment target is contacted):**

```text
corepack pnpm contract:typespec:check
corepack pnpm contract:generate
corepack pnpm contract:check
corepack pnpm test
corepack pnpm --filter @garfex/backend test
corepack pnpm --filter @garfex/backend typecheck
corepack pnpm test:architecture
corepack pnpm build
corepack pnpm check

test -z "$(git status --short -- openspec/changes/persistent-resource-catalog/)"
git diff --exit-code -- openspec/changes/persistent-resource-catalog/
git diff --cached --exit-code -- openspec/changes/persistent-resource-catalog/
```

**Deployment-affecting commands requiring a fresh `convex-deploy-guard` classification and announcement immediately before execution:**

```text
corepack pnpm --filter @garfex/backend exec convex dev --once
corepack pnpm --filter @garfex/backend exec convex run <existing-internal-catalog-bootstrap>
corepack pnpm --filter @garfex/backend exec node --experimental-strip-types tests/smoke/resource-master-native-client.ts
```

The placeholder `<existing-internal-catalog-bootstrap>` is a discovery target, not a fabricated function name: identify the existing internal bootstrap under `apps/backend/convex/**`, classify its target, announce the target separately, and record the exact resolved command. No productive target is permitted, and any required non-production authorization or fresh consent must be obtained later under the guard rules. `convex-test` remains in-process evidence only and is never deployment proof.

## Final acceptance evidence

The implementation is complete only when the following exact command set is green, with the guarded smoke evidence appended separately:

```text
corepack pnpm contract:typespec:check
corepack pnpm contract:generate
corepack pnpm contract:check
corepack pnpm test
corepack pnpm --filter @garfex/backend test
corepack pnpm --filter @garfex/backend typecheck
corepack pnpm test:architecture
corepack pnpm build
corepack pnpm check

test -z "$(git status --short -- openspec/changes/persistent-resource-catalog/)"
git diff --exit-code -- openspec/changes/persistent-resource-catalog/
git diff --cached --exit-code -- openspec/changes/persistent-resource-catalog/
```

The final report must identify the exact ten function names, canonical dialect, generated artifact digest, all-ten in-process result, real-client result, JD-S-002 category agreement, safe failure/leakage result, deployment target classification, smoke command exit status, rollback boundary, and explicit non-claims for HTTP, productive deployment/authentication, public Internet, third-party clients, UI, SDK/publication, and protected catalog changes.

## Parent-owned post-apply gates

- [x] Decide and record the delivery strategy before apply because the forecast is High and `chain_strategy` is currently `pending`; if chained delivery is selected, choose exactly one allowed strategy and preserve the PR boundaries above. <!-- sdd-owner: parent -->
- [x] Receipt-driven review is `disabled/unmanaged` (`gentle-ai review mode status`: off by default), so no bounded review or approval was fabricated; the user-approved one-PR `size:exception` retains tests/docs beside behavior. <!-- sdd-owner: parent -->
- [x] Before acceptance, verify all safe commands and the protected-path checks pass, confirm guarded smoke evidence is distinct from `convex-test`, and record any unexecuted or deviating checks without fabricating historical byte states. Evidence: final parent verification PASS; `corepack pnpm check` 34 files/382 tests, architecture 10 tests/67 modules, protected checks clean; live evidence was hash-verified rather than rerun. <!-- sdd-owner: parent -->
- [x] Gate lifecycle completion on the exact ten-family parity, both evidence environments, local/development-only scope, and absence of HTTP/productive/public/third-party/UI/protected-catalog expansion. Evidence: exact 7 queries/3 mutations, in-process plus local-anonymous generated-client evidence, and architecture/scope checks PASS. <!-- sdd-owner: parent -->
