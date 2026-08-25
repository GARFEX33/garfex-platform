# Apply Progress: external-garfex-boundary

## Authoritative scope

- Active change: `external-garfex-boundary`.
- Artifact authority: OpenSpec, mirrored to Engram where available.
- Action context: repository-local at `/home/garfex/PROGRAMACION/garfex-platform`.
- Delivery: `ask-on-risk` resolved as `feature-branch-chain`; no `size:exception`.
- Receipt-driven review is disabled/unmanaged and is not part of this SDD apply.
- Completed work units: U1, U2a, U2b1, U2b2, U2b3, U3, U4, U5, and U6a.
- Next work unit: U6b, after parent lifecycle handoff.
- U6b, U7–U11, final validation, sync, and archive remain outside the completed scope.

## U1 — Independent external contract

Status: completed and native attempt settled `passed`.

### TDD evidence

| Stage | Evidence | Result |
| --- | --- | --- |
| RED | `corepack pnpm --filter @garfex/backend test -- external-garfex-contract.test.ts` before `contract.ts` existed | Failed because the contract module was absent. |
| GREEN | Same command after creating the contract | Passed: 12 files, 105 tests. |
| TRIANGULATE | Focused command, backend typecheck, and import/forbidden-term inspection | Passed; `contract.ts` has no imports or trusted/internal terms. |
| REFACTOR | Focused test and typecheck after literal/discriminated-type cleanup | Passed with no diagnostics. |

### Files and budget

- `apps/backend/src/external-garfex-boundary/client-facing/contract.ts`
- U1 portion of `apps/backend/tests/external-garfex-contract.test.ts`
- 363 authored additions, within the 400-line work-unit budget.

### Outcome

The client-facing contract owns exactly ten operation identifiers and eleven safe error codes. It defines independent business DTOs and exposes no ActorContext, actor, role, capability, auth, Resource Master, Convex, persistence, deployment, or transport type.

## Interrupted U2 history and correction

The initial U2 executor timed out after producing review-hostile, compressed validator code. The parent gate rejected that implementation despite its claimed passing tests because compressed single-line declarations defeated the changed-line budget and primary LSP initially reported a module-resolution error.

The single automatic corrective executor also timed out. It left materially improved partial edits: readable multi-line validation code, a clean primary LSP result, and a dependency-preserving split of U2 into:

- U2a: operation recognition and ten closed request validators.
- U2b: ten success validators and closed failure validation.

Automatic mode stopped after the second timeout. The user then explicitly authorized a narrower native rescope to verify and close only the retained U2a edits. The native rescope preserves cumulative attempts and the 400-line limit; it does not reset budget.

## U2a — Closed request validation

Status: completed after explicit bounded continuation.

### Evidence

| Check | Result |
| --- | --- |
| `corepack pnpm --filter @garfex/backend test -- external-garfex-contract.test.ts` | Exit 0; 12 backend test files and 109 tests passed. Vitest did not isolate the named file, so this is broader than the requested focus. |
| `corepack pnpm --filter @garfex/backend typecheck` | Exit 0; no diagnostics. |
| `corepack pnpm exec biome format apps/backend/src/external-garfex-boundary/client-facing/validation.ts apps/backend/tests/external-garfex-contract.test.ts` | Exit 0; two files checked without writes. |
| `corepack pnpm exec biome lint apps/backend/src/external-garfex-boundary/client-facing/validation.ts apps/backend/tests/external-garfex-contract.test.ts` | Exit 0; two files checked without fixes. |
| Primary LSP diagnostics | Clean for `validation.ts` and the contract test. |
| `git diff --check` | Exit 0, but the new files are untracked and therefore require a later whole-candidate whitespace gate. |
| Readability inspection | `validation.ts` is 303 conventionally formatted lines; no minified single-line declarations remain. |
| Dependency inspection | Production validation imports only boundary-local `contract.ts`; no backend/internal/third-party dependency. |

The original missing-validator RED failure remains relevant to U2a because operation recognition and all request validators were absent at that point. The retained tests cover malformed/non-plain requests, unknown fields, authority and platform-like forgery, bounded limits and revisions, lifecycle/cursor rules, and nested quantities.

### Outcome

`client-facing/validation.ts` now exports:

- `parseExternalOperationIdentifier`;
- exactly ten named closed request validators.

Accepted values are rebuilt. Search optionals remain omitted unless supplied, cursors remain nullable and opaque, limits remain 1–50, revisions remain non-negative safe integers, and authority-bearing or infrastructure-like fields fail closed before any trusted identity or module invocation exists.

U2b2 resource/search/description/mutation validators and U2b3 failure validation are not present and remain unchecked.

## Current changed files

- `apps/backend/src/external-garfex-boundary/client-facing/contract.ts`
- `apps/backend/src/external-garfex-boundary/client-facing/validation.ts`
- `apps/backend/tests/external-garfex-contract.test.ts`
- `openspec/changes/external-garfex-boundary/tasks.md`
- `openspec/changes/external-garfex-boundary/apply-progress.md`

All new implementation, tests, and SDD artifacts remain untracked. No commit, branch, push, PR, review, receipt, transport, SDK, productive IdP, Convex entrypoint, deployment, or consumer change was created.

## Deviations and open risks

- U2 was first split into U2a/U2b after the original line forecast proved unsafe; the corrective U2b run split that retained scope into U2b1 discovery/schema/options/units, U2b2 resource/search/description/mutation results, and U2b3 closed failures. Dependencies in `tasks.md` now require all relevant U2b slices before U4/U5/U6.
- The configured Vitest invocation runs the whole backend suite instead of isolating the named test file; later evidence must state this truthfully.
- `git diff --check` cannot inspect untracked files. Final verification must include the whole candidate by another non-mutating whitespace/format gate.
- Full repository tests, architecture tests, build, and `corepack pnpm check` remain deferred to their planned gates.

## Prior recommendation before corrective U2b1

The pre-correction recommendation was to recalculate native SDD status and hand off U2b2 only after parent lifecycle actions; U2b3, U3–U11, final verification, sync, and archive remained incomplete.

## Corrective U2b split and U2b1 — Discovery/schema/options/units success validators

Status: U2b1 completed; U2b2 and U2b3 deferred. This is the single corrective rerun after the prior U2b timeout.

The prior U2b attempt (ordinal 5) timed out after 1200000ms with roughly 305 production and 300 test lines retained, no phase envelope, and no authoritative task/progress evidence. Those edits were treated as unaccepted remediation input. This ordinal-6 run kept only the first new slice, removed/deferred resource/search/description/mutation-result and failure validator code/tests, and preserved accepted U1/U2a behavior.

### U2b1 TDD cycle evidence

| Stage | Evidence | Result |
| --- | --- | --- |
| RED | Added the slice-boundary test while retained later exports were still present. | Failed: 1 test failed; 11 passed in the 12-file backend run. |
| GREEN | Removed deferred validators/tests and kept four readable discovery/schema/options/units validators. | Passed: 12 files, 113 tests. |
| TRIANGULATE | Added hostile, malformed, serialization-safe, and null-prototype discovery cases. | Passed: 12 files, 114 tests. |
| REFACTOR | Simplified boundary-local output parsing, fixed callback/formatting issues, and reran checks. | Passed: 12 files, 114 tests; typecheck and Biome format/lint clean. |

### Verification and boundary

- Focused command: `corepack pnpm --filter @garfex/backend test -- external-garfex-contract.test.ts` — exit 0; Vitest ran all 12 backend files and 114 tests.
- Backend typecheck: `corepack pnpm --filter @garfex/backend typecheck` — exit 0.
- Non-writing Biome format and lint on edited TS files — both exit 0; no writes or fixes.
- Edited files: `apps/backend/src/external-garfex-boundary/client-facing/validation.ts`, `apps/backend/tests/external-garfex-contract.test.ts`, `openspec/changes/external-garfex-boundary/tasks.md`, and this progress artifact. `contract.ts` behavior was preserved.
- U2b1 review boundary is the four discovery/schema/options/units success validators and their focused tests. The final TS slice is 443 production plus 590 test lines, compared with the retained U2a baseline of 303 plus 408; the resulting 322-line authored TS addition remains below the 400-line corrective review budget. SDD bookkeeping is not a later output unit.
- No U2b2, U2b3, U3, trusted operation, transport, SDK, IdP, Convex exposure, deployment, consumer, commit, branch, push, PR, review, receipt, or delivery gate was started.

### Remaining implementation tasks

- U2b2 remains unchecked: resource/search/description and mutation-result success validators/tests.
- U2b3 remains unchecked: closed failure validation/containment and metadata tests.
- U3–U11 and the final repository validation rows remain unchecked. Parent-owned lifecycle rows remain deferred to the parent.

### Structured status consumed

- `schemaName`: `gentle-ai.sdd-status`; `changeName`: `external-garfex-boundary`; `artifactStore`: `openspec`.
- `applyState`: `ready`; `dependencies.apply`: `ready`; `nextRecommended`: `apply`; `actionContext.mode`: `repo-local` with workspace root and allowed edit root `/home/garfex/PROGRAMACION/garfex-platform`.
- The native runtime attempt was continued with its active opaque token; attempt ordinal 6 remained bounded by 2 cumulative attempts and 400 changed lines throughout this phase. No action-context warnings or edit-root violations occurred.
- Native status had no blocked reasons. Final verification is not ready because unchecked implementation tasks remain; next route is parent lifecycle, not verification or archive.

## Next recommendation

Hand off `parent-lifecycle`; the parent must reconcile the bounded attempt and choose the next authorized U2b2 continuation. Do not start U2b2/U2b3/U3 or delivery gates in this phase.

### Exact unchecked implementation rows mirrored from tasks.md

These are the exact unchecked implementation-owned checkbox lines at this phase; they remain deferred.

- [ ] Add failing focused cases for resource, search, description, and all three mutation-result success shapes, including nested attribute values, extra fields, fresh references, and opaque/null cursors. <!-- sdd-owner: implementation -->
- [ ] Implement the six remaining named success validators; rebuild reviewed resource, summary, description, and mutation-result fields, preserve nullable opaque cursors, reject extras, and contain malformed output as `INTERNAL_FAILURE`. <!-- sdd-owner: implementation -->
- [ ] Run the focused contract test against malformed resource/search/mutation results and serialization, proving no cursor structure, internal field, authority value, or Resource Master dependency crosses validation. <!-- sdd-owner: implementation -->
- [ ] Consolidate only boundary-local resource/search output predicates, preserve all reviewed fields and fresh references, and rerun the focused test plus backend typecheck without introducing a schema/IDL or generation dependency. <!-- sdd-owner: implementation -->
- [ ] Add failing focused cases for all eleven failure codes, each allowlisted metadata form, unsafe metadata, unknown codes, malformed failures, and diagnostic containment. <!-- sdd-owner: implementation -->
- [ ] Implement `validateExternalFailure` with the closed error metadata model, fresh rebuilding, extra-field rejection, and metadata-free `INTERNAL_FAILURE` fallback for malformed failure values. <!-- sdd-owner: implementation -->
- [ ] Run the focused contract test against malformed failures and `JSON.stringify`, proving no internal messages, stacks, provider data, authority values, or platform details are released. <!-- sdd-owner: implementation -->
- [ ] Consolidate only boundary-local failure predicates, preserve the eleven-code and allowlisted metadata sets, and rerun focused output/failure tests plus backend typecheck without introducing a schema/IDL or generation dependency. <!-- sdd-owner: implementation -->
- [ ] Add failing authentication cases in `apps/backend/tests/external-garfex-security.test.ts` for null composition, missing identity, provider exception, server-created actor separation, copied capability sets, and proof that no raw business request is accepted by the resolver. <!-- sdd-owner: implementation -->
- [ ] Implement `apps/backend/src/external-garfex-boundary/trusted/identity.ts` with `TrustedActorResolver.resolveActor(): Promise<ActorContext | null>` and `createTrustedActorResolver`, importing auth and Resource Master types only at this trusted edge and never reading client-facing DTO fields. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-security.test.ts tests/auth-boundary.test.ts` and backend typecheck, proving provider failures become `null`, capability mutation of the source composition cannot mutate the actor, and no client-facing file imports identity types. <!-- sdd-owner: implementation -->
- [ ] Refine `apps/backend/src/external-garfex-boundary/trusted/identity.ts` so the resolver has no operation selector, request parameter, capability pre-check, or transport concern; rerun U3 focused and existing auth tests. <!-- sdd-owner: implementation -->
- [ ] Add failing cases in `apps/backend/tests/external-garfex-security.test.ts` for every internal `ResourceErrorCode`, valid/invalid `existingResourceId`, valid/invalid `currentRevision`, unknown runtime codes, thrown provider/application errors, secret-bearing messages/details/stacks, malformed failures, and a diagnostics sink that throws. <!-- sdd-owner: implementation -->
- [ ] Implement `apps/backend/src/external-garfex-boundary/trusted/errors.ts` with `ExternalBoundaryDiagnostics`, the exact eleven-code mapping, safe allowlisted metadata, catalog-state coarsening, metadata-free `INTERNAL_FAILURE`, authentication exception handling, and guarded server-only diagnostics; import Resource Master only through `apps/backend/src/resource-master/public.ts`. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-security.test.ts` and backend typecheck, serialize every normalized failure with `JSON.stringify`, and prove no provider, credential, actor, capability, persistence, Convex, catalog, configuration, message, or stack detail appears. <!-- sdd-owner: implementation -->
- [ ] Replace any open-ended error branching in `trusted/errors.ts` with an exhaustive switch/`never` check and boundary-local helpers that cannot let diagnostics failure alter the outward result; rerun U4 security tests. <!-- sdd-owner: implementation -->
- [ ] Add failing projection cases in `apps/backend/tests/external-garfex-operations.test.ts` for every reviewed success family, injected internal/authority/platform fields, nested reference identity, resource attribute quantities, operation-specific mutation wrappers, and `undefined` search continuation becoming `null`. <!-- sdd-owner: implementation -->
- [ ] Implement `apps/backend/src/external-garfex-boundary/trusted/projections.ts` with explicit field-by-field copying for taxonomy, effective schema/rules, options, natural units, resources, search summaries/cursors, and descriptions, using a private resource copier only behind named create/update/deactivate wrappers. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-operations.test.ts` and backend typecheck with U2 success validators, proving extra internal fields are absent, nested arrays/objects are new references, and no object spread or source reference is returned. <!-- sdd-owner: implementation -->
- [ ] Deduplicate only private projection mechanics in `apps/backend/src/external-garfex-boundary/trusted/projections.ts`; preserve named projector evidence and rerun projection tests plus contract validation tests without widening any external field. <!-- sdd-owner: implementation -->
- [ ] Add failing table-driven cases in `apps/backend/tests/external-garfex-operations.test.ts` for the six named read wrappers, including validator-before-auth ordering, actor-first arguments, field-by-field request mapping, exactly-one same-named method call, projection/error validation, and no-call malformed requests. <!-- sdd-owner: implementation -->
- [ ] Implement the six named functions in `apps/backend/src/external-garfex-boundary/trusted/read-operations.ts` with explicit request construction and direct calls to the matching `ResourceMaster` public methods; use no exported operation selector, callable map, registry, or generic executor. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-operations.test.ts` plus the relevant cases in `apps/backend/tests/resource-master-authorization.test.ts`, proving incapable actors reach the real module authorization and forbidden work stops before catalog/repository access. <!-- sdd-owner: implementation -->
- [ ] Refine private authentication/exception containment helpers in `trusted/read-operations.ts` only if they do not accept an operation identifier or choose a method; rerun read mapping tests, security tests, and backend typecheck. <!-- sdd-owner: implementation -->
- [ ] Add failing search cases in `apps/backend/tests/external-garfex-operations.test.ts` for omitted lifecycle/limit/cursor, explicit nullable cursor, bounded limits, same cursor round-trip, `undefined` continuation to `null`, malformed cursor/limit/lifecycle no-call behavior, and a spy proving only `searchResources` runs once. <!-- sdd-owner: implementation -->
- [ ] Implement `invokeExternalSearchResources` in `apps/backend/src/external-garfex-boundary/trusted/read-operations.ts`, rebuilding `terms` and only supplied optionals, preserving cursor opacity, calling `resourceMaster.searchResources(actor, mappedInput)`, projecting the page, and validating the complete outcome. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-operations.test.ts` and the focused Resource Master pagination tests, proving the boundary never decodes, constructs, or exposes cursor structure and never turns omitted fields into explicit `undefined` properties. <!-- sdd-owner: implementation -->
- [ ] Keep search-specific option construction explicit in `trusted/read-operations.ts` and rerun U7 search tests, U6 read tests, and backend typecheck without adding a transport or cursor helper tied to persistence/Convex. <!-- sdd-owner: implementation -->
- [ ] Add failing mutation cases in `apps/backend/tests/external-garfex-operations.test.ts` and `apps/backend/tests/external-garfex-security.test.ts` for rebuilt create attributes, resource ID/revision/unit mapping, exactly-one direct method calls, forged authority rejection, and each mutation's missing-neighbor-capability forbidden path with downstream spies untouched. <!-- sdd-owner: implementation -->
- [ ] Implement the three named functions in `apps/backend/src/external-garfex-boundary/trusted/mutation-operations.ts`, validating before authentication, rebuilding all internal inputs, passing the trusted actor separately, calling only the matching public method, and using named success/error projection paths. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-operations.test.ts external-garfex-security.test.ts` and the relevant `apps/backend/tests/resource-master-authorization.test.ts` cases, proving no edge capability table duplicates or replaces `resource-master/application/authorization.ts`. <!-- sdd-owner: implementation -->
- [ ] Remove only accidental duplication between mutation wrappers in `apps/backend/src/external-garfex-boundary/trusted/mutation-operations.ts` through private boundary-local helpers, retain three named direct calls, and rerun operation/security tests plus backend typecheck. <!-- sdd-owner: implementation -->
- [ ] Add the failing fixture-parity harness in `apps/backend/tests/external-garfex-compatibility.test.ts` before the fixture exists, asserting ten operation entries, request/success/failure validation, eleven error metadata forms, and serialized deep equality. <!-- sdd-owner: implementation -->
- [ ] Add `apps/backend/tests/fixtures/external-garfex-boundary/compatibility.json` and complete the parity test with representative safe values, applicable failures, null/opaque cursor cases, validator-backed fixture loading, and no internal messages, stacks, provider data, Convex IDs, persistence records, or deployment/catalog-admin values. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-compatibility.test.ts` and the full backend test suite, proving JSON round-trip identity, one-to-one operation coverage, allowlisted metadata, and drift failure when fixture-visible fields are changed without an intentional fixture update. <!-- sdd-owner: implementation -->
- [ ] Make traversal deterministic in `apps/backend/tests/external-garfex-compatibility.test.ts` and keep `apps/backend/tests/fixtures/external-garfex-boundary/compatibility.json` as repository test evidence only; rerun compatibility, operation, security, and contract tests without selecting a wire format or generation direction. <!-- sdd-owner: implementation -->
- [ ] Extend `tooling/tests/architecture.test.ts` with failing expectations for all seven rule names, a valid independent-contract fixture, a valid trusted-public-edge fixture, and these violations: `internal-import.ts`, `authority-field.ts`, `platform-leak.ts`, `trusted-internal-import.ts`, `generic-executor.ts`, `automatic-derivation.ts`, and `transport-import.ts`. <!-- sdd-owner: implementation -->
- [ ] Update `tooling/architecture/check.mjs` with narrowly scoped import/syntax checks and add the valid/violating fixtures under `tooling/architecture-fixtures/valid/external-garfex-boundary/` and `tooling/architecture-fixtures/violations/external-garfex-boundary/`; keep trusted imports limited to public Resource Master/auth composition and reject Convex, persistence, deployment, transport, derivation, and generic business publication. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm test:architecture` and inspect the checker output for every named fixture, proving existing `external-client-boundary` protections remain green and the new rules do not rely on broad repository-wide keyword bans. <!-- sdd-owner: implementation -->
- [ ] Refine rule diagnostics and fixture names in `tooling/architecture/check.mjs` and `tooling/tests/architecture.test.ts` so each violation fails for its intended rule only; rerun architecture tests and full typecheck. <!-- sdd-owner: implementation -->
- [ ] Add the failing parser/assertions in `apps/backend/tests/external-garfex-documentation-parity.test.ts` for the exact ten operation rows, direct mappings, eleven error codes, allowlisted metadata names, and required non-decision statements before the canonical document is complete. <!-- sdd-owner: implementation -->
- [ ] Create `docs/external-garfex-boundary.md` with the lead distinction `External Client Contract != Resource Master Public Application Contract`, exact operation/mapping/request/success/error tables, trusted identity flow, final module authorization, compatibility ownership, fixture/check commands, Convex isolation, and transport/IdP/schema/SDK/consumer non-decisions; update `docs/architecture.md`, `docs/external-client-boundary.md`, and `docs/auth-boundary.md` with links and dependency arrows only. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-documentation-parity.test.ts external-garfex-compatibility.test.ts` and `corepack pnpm test:architecture`, proving documented identifiers, direct mappings, metadata, and non-decisions agree without presenting JSON fixtures as a selected transport. <!-- sdd-owner: implementation -->
- [ ] Apply progressive disclosure and review-oriented tables to `docs/external-garfex-boundary.md`, `docs/architecture.md`, `docs/external-client-boundary.md`, and `docs/auth-boundary.md`, remove duplicated contradictory semantics, preserve repository independence and deferred packaging, and rerun documentation parity plus the relevant focused tests. <!-- sdd-owner: implementation -->
- [ ] Run the strict repository test command `corepack pnpm test` and record the exact Vitest result, including coverage completion. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test`, `corepack pnpm --filter @garfex/backend typecheck`, `corepack pnpm test:architecture`, and `corepack pnpm build`; record each exact result and any unexecuted check. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm check` and inspect `git diff --stat` plus `git diff --numstat` for the selected work unit/PR, confirming authored additions plus deletions stay within 400 lines per slice and no transport, SDK, productive IdP, Convex exposure, universal executor, or internal contract publication slipped in. <!-- sdd-owner: implementation -->
- [ ] Verify rollback boundaries against `apps/backend/src/resource-master/`, `apps/backend/src/auth/`, `apps/backend/convex/`, and persistence/infrastructure files, confirming the change can be disabled without weakening Resource Master authorization or changing Convex persistence behavior. <!-- sdd-owner: implementation -->

### Deferred parent-owned row

- [ ] After the final validation gate, confirm deviations and unexecuted checks are recorded for the SDD archive and close the lifecycle only if the forbidden-scope guardrails remain true. <!-- sdd-owner: parent -->

## U2b2 — Resource/search/description/mutation-result success validation

Status: completed; U2b2 only. U1, U2a, and U2b1 behavior was preserved. U2b3 failure validation and U3 remain deferred.

### TDD Cycle Evidence

| Stage | Evidence | Result |
| --- | --- | --- |
| RED | Added the six-validator resource, search, description, and mutation-result tests before production exports. The final RED run was `corepack pnpm --filter @garfex/backend test -- external-garfex-contract.test.ts`. | Failed as intended: 12 files ran, 114 tests passed, and 4 new tests failed because the remaining validator exports were not functions. A transient nested-suite placement error was corrected before production code was written. |
| GREEN | Added boundary-local output predicates and the six named success validators, then reran the same focused command. | Passed: 12 files, 118 tests. |
| TRIANGULATE | Ran `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-contract.test.ts -t "external GARFEX resource/search/mutation output validation"`. | Passed: 1 file, 4 tests passed, 12 tests skipped; malformed output, hostile accessors, metadata-free serialization, fresh nested values, and opaque/null cursors were exercised. |
| REFACTOR | Reran backend typecheck, non-writing Biome format/lint, and `corepack pnpm --filter @garfex/backend test -- external-garfex-contract.test.ts` after readable formatting cleanup. | All passed: typecheck clean; Biome format and lint checked two files without writes/fixes; focused command ran 12 files and 118 tests. |

### Implementation and containment

- `validation.ts` now exports exactly the six remaining success validators: `getResource`, `searchResources`, `describeResource`, `createResource`, `updateNonIdentityData`, and `deactivateResource`.
- Resource and mutation results share one private exact-field resource parser; search summaries, descriptions, nested attributes, string/boolean/quantity values, revisions, and the literal `v1` identity policy are rebuilt field by field.
- Search cursors accept only nullable strings and are copied without splitting, decoding, constructing, or interpreting their contents; the opaque test value survives JSON round-trip unchanged and final-page `null` is preserved.
- Existing closed output shapes reject top-level and nested internal, authority, platform, repository, and quantity fields. Parser failures and throwing accessors return exactly metadata-free `INTERNAL_FAILURE`.
- The client-facing validator imports only its boundary-local `contract.ts`; no Resource Master, auth, backend, Convex, persistence, schema/IDL, transport, or third-party dependency was introduced. `validateExternalFailure` remains absent for U2b3.

### Files, workload, and boundary

- Changed implementation/test files: `apps/backend/src/external-garfex-boundary/client-facing/validation.ts` and `apps/backend/tests/external-garfex-contract.test.ts`.
- Changed SDD files: `openspec/changes/external-garfex-boundary/tasks.md` and this cumulative `apply-progress.md`.
- The feature-branch-chain boundary is the assigned U2b2 slice only. The U2b1 baseline was 443 production plus 590 test lines; the post-U2b2 files are 533 plus 750, approximately 250 authored TypeScript additions, below the 400-line limit. SDD bookkeeping is excluded from that authored-line estimate.
- No commit, branch, push, PR, review, receipt, consumer, transport, deployment, SDK, productive IdP, Convex entrypoint, or Resource Master change was created.

### Structured status consumed and produced

- Consumed native `gentle-ai.sdd-status` for `external-garfex-boundary`: `artifactStore: openspec`, `applyState: ready`, `dependencies.apply: ready`, and `nextRecommended: apply`.
- Consumed `actionContext.mode: repo-local`, workspace root `/home/garfex/PROGRAMACION/garfex-platform`, allowed edit root the same, and no warnings; the workload gate was already resolved to `feature-branch-chain` with no size exception.
- Produced four U2b2 implementation checkbox updates in `tasks.md` and this cumulative progress evidence. The native change remains not ready for verify because U2b3 and later implementation rows remain unchecked; next routing is parent lifecycle after this bounded apply unit.

### Deviations and unexecuted checks

- The package's named Vitest argument runs the entire backend suite; every occurrence is recorded with the truthful 12-file result. Repository-wide tests, architecture tests, build, and `corepack pnpm check` remain deferred to their planned gates.
- The active attempt remained within its 400 authored-line budget; no unsafe edit-root or action-context condition occurred.

### Current exact unchecked implementation-owned rows

The following lines are copied from the persisted `tasks.md` after the four U2b2 checkboxes were reconciled:

- [ ] Add failing focused cases for all eleven failure codes, each allowlisted metadata form, unsafe metadata, unknown codes, malformed failures, and diagnostic containment. <!-- sdd-owner: implementation -->
- [ ] Implement `validateExternalFailure` with the closed error metadata model, fresh rebuilding, extra-field rejection, and metadata-free `INTERNAL_FAILURE` fallback for malformed failure values. <!-- sdd-owner: implementation -->
- [ ] Run the focused contract test against malformed failures and `JSON.stringify`, proving no internal messages, stacks, provider data, authority values, or platform details are released. <!-- sdd-owner: implementation -->
- [ ] Consolidate only boundary-local failure predicates, preserve the eleven-code and allowlisted metadata sets, and rerun focused output/failure tests plus backend typecheck without introducing a schema/IDL or generation dependency. <!-- sdd-owner: implementation -->
- [ ] Add failing authentication cases in `apps/backend/tests/external-garfex-security.test.ts` for null composition, missing identity, provider exception, server-created actor separation, copied capability sets, and proof that no raw business request is accepted by the resolver. <!-- sdd-owner: implementation -->
- [ ] Implement `apps/backend/src/external-garfex-boundary/trusted/identity.ts` with `TrustedActorResolver.resolveActor(): Promise<ActorContext | null>` and `createTrustedActorResolver`, importing auth and Resource Master types only at this trusted edge and never reading client-facing DTO fields. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-security.test.ts tests/auth-boundary.test.ts` and backend typecheck, proving provider failures become `null`, capability mutation of the source composition cannot mutate the actor, and no client-facing file imports identity types. <!-- sdd-owner: implementation -->
- [ ] Refine `apps/backend/src/external-garfex-boundary/trusted/identity.ts` so the resolver has no operation selector, request parameter, capability pre-check, or transport concern; rerun U3 focused and existing auth tests. <!-- sdd-owner: implementation -->
- [ ] Add failing cases in `apps/backend/tests/external-garfex-security.test.ts` for every internal `ResourceErrorCode`, valid/invalid `existingResourceId`, valid/invalid `currentRevision`, unknown runtime codes, thrown provider/application errors, secret-bearing messages/details/stacks, malformed failures, and a diagnostics sink that throws. <!-- sdd-owner: implementation -->
- [ ] Implement `apps/backend/src/external-garfex-boundary/trusted/errors.ts` with `ExternalBoundaryDiagnostics`, the exact eleven-code mapping, safe allowlisted metadata, catalog-state coarsening, metadata-free `INTERNAL_FAILURE`, authentication exception handling, and guarded server-only diagnostics; import Resource Master only through `apps/backend/src/resource-master/public.ts`. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-security.test.ts` and backend typecheck, serialize every normalized failure with `JSON.stringify`, and prove no provider, credential, actor, capability, persistence, Convex, catalog, configuration, message, or stack detail appears. <!-- sdd-owner: implementation -->
- [ ] Replace any open-ended error branching in `trusted/errors.ts` with an exhaustive switch/`never` check and boundary-local helpers that cannot let diagnostics failure alter the outward result; rerun U4 security tests. <!-- sdd-owner: implementation -->
- [ ] Add failing projection cases in `apps/backend/tests/external-garfex-operations.test.ts` for every reviewed success family, injected internal/authority/platform fields, nested reference identity, resource attribute quantities, operation-specific mutation wrappers, and `undefined` search continuation becoming `null`. <!-- sdd-owner: implementation -->
- [ ] Implement `apps/backend/src/external-garfex-boundary/trusted/projections.ts` with explicit field-by-field copying for taxonomy, effective schema/rules, options, natural units, resources, search summaries/cursors, and descriptions, using a private resource copier only behind named create/update/deactivate wrappers. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-operations.test.ts` and backend typecheck with U2 success validators, proving extra internal fields are absent, nested arrays/objects are new references, and no object spread or source reference is returned. <!-- sdd-owner: implementation -->
- [ ] Deduplicate only private projection mechanics in `apps/backend/src/external-garfex-boundary/trusted/projections.ts`; preserve named projector evidence and rerun projection tests plus contract validation tests without widening any external field. <!-- sdd-owner: implementation -->
- [ ] Add failing table-driven cases in `apps/backend/tests/external-garfex-operations.test.ts` for the six named read wrappers, including validator-before-auth ordering, actor-first arguments, field-by-field request mapping, exactly-one same-named method call, projection/error validation, and no-call malformed requests. <!-- sdd-owner: implementation -->
- [ ] Implement the six named functions in `apps/backend/src/external-garfex-boundary/trusted/read-operations.ts` with explicit request construction and direct calls to the matching `ResourceMaster` public methods; use no exported operation selector, callable map, registry, or generic executor. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-operations.test.ts` plus the relevant cases in `apps/backend/tests/resource-master-authorization.test.ts`, proving incapable actors reach the real module authorization and forbidden work stops before catalog/repository access. <!-- sdd-owner: implementation -->
- [ ] Refine private authentication/exception containment helpers in `trusted/read-operations.ts` only if they do not accept an operation identifier or choose a method; rerun read mapping tests, security tests, and backend typecheck. <!-- sdd-owner: implementation -->
- [ ] Add failing search cases in `apps/backend/tests/external-garfex-operations.test.ts` for omitted lifecycle/limit/cursor, explicit nullable cursor, bounded limits, same cursor round-trip, `undefined` continuation to `null`, malformed cursor/limit/lifecycle no-call behavior, and a spy proving only `searchResources` runs once. <!-- sdd-owner: implementation -->
- [ ] Implement `invokeExternalSearchResources` in `apps/backend/src/external-garfex-boundary/trusted/read-operations.ts`, rebuilding `terms` and only supplied optionals, preserving cursor opacity, calling `resourceMaster.searchResources(actor, mappedInput)`, projecting the page, and validating the complete outcome. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-operations.test.ts` and the focused Resource Master pagination tests, proving the boundary never decodes, constructs, or exposes cursor structure and never turns omitted fields into explicit `undefined` properties. <!-- sdd-owner: implementation -->
- [ ] Keep search-specific option construction explicit in `trusted/read-operations.ts` and rerun U7 search tests, U6 read tests, and backend typecheck without adding a transport or cursor helper tied to persistence/Convex. <!-- sdd-owner: implementation -->
- [ ] Add failing mutation cases in `apps/backend/tests/external-garfex-operations.test.ts` and `apps/backend/tests/external-garfex-security.test.ts` for rebuilt create attributes, resource ID/revision/unit mapping, exactly-one direct method calls, forged authority rejection, and each mutation's missing-neighbor-capability forbidden path with downstream spies untouched. <!-- sdd-owner: implementation -->
- [ ] Implement the three named functions in `apps/backend/src/external-garfex-boundary/trusted/mutation-operations.ts`, validating before authentication, rebuilding all internal inputs, passing the trusted actor separately, calling only the matching public method, and using named success/error projection paths. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-operations.test.ts external-garfex-security.test.ts` and the relevant `apps/backend/tests/resource-master-authorization.test.ts` cases, proving no edge capability table duplicates or replaces `resource-master/application/authorization.ts`. <!-- sdd-owner: implementation -->
- [ ] Remove only accidental duplication between mutation wrappers in `apps/backend/src/external-garfex-boundary/trusted/mutation-operations.ts` through private boundary-local helpers, retain three named direct calls, and rerun operation/security tests plus backend typecheck. <!-- sdd-owner: implementation -->
- [ ] Add the failing fixture-parity harness in `apps/backend/tests/external-garfex-compatibility.test.ts` before the fixture exists, asserting ten operation entries, request/success/failure validation, eleven error metadata forms, and serialized deep equality. <!-- sdd-owner: implementation -->
- [ ] Add `apps/backend/tests/fixtures/external-garfex-boundary/compatibility.json` and complete the parity test with representative safe values, applicable failures, null/opaque cursor cases, validator-backed fixture loading, and no internal messages, stacks, provider data, Convex IDs, persistence records, or deployment/catalog-admin values. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-compatibility.test.ts` and the full backend test suite, proving JSON round-trip identity, one-to-one operation coverage, allowlisted metadata, and drift failure when fixture-visible fields are changed without an intentional fixture update. <!-- sdd-owner: implementation -->
- [ ] Make traversal deterministic in `apps/backend/tests/external-garfex-compatibility.test.ts` and keep `apps/backend/tests/fixtures/external-garfex-boundary/compatibility.json` as repository test evidence only; rerun compatibility, operation, security, and contract tests without selecting a wire format or generation direction. <!-- sdd-owner: implementation -->
- [ ] Extend `tooling/tests/architecture.test.ts` with failing expectations for all seven rule names, a valid independent-contract fixture, a valid trusted-public-edge fixture, and these violations: `internal-import.ts`, `authority-field.ts`, `platform-leak.ts`, `trusted-internal-import.ts`, `generic-executor.ts`, `automatic-derivation.ts`, and `transport-import.ts`. <!-- sdd-owner: implementation -->
- [ ] Update `tooling/architecture/check.mjs` with narrowly scoped import/syntax checks and add the valid/violating fixtures under `tooling/architecture-fixtures/valid/external-garfex-boundary/` and `tooling/architecture-fixtures/violations/external-garfex-boundary/`; keep trusted imports limited to public Resource Master/auth composition and reject Convex, persistence, deployment, transport, derivation, and generic business publication. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm test:architecture` and inspect the checker output for every named fixture, proving existing `external-client-boundary` protections remain green and the new rules do not rely on broad repository-wide keyword bans. <!-- sdd-owner: implementation -->
- [ ] Refine rule diagnostics and fixture names in `tooling/architecture/check.mjs` and `tooling/tests/architecture.test.ts` so each violation fails for its intended rule only; rerun architecture tests and full typecheck. <!-- sdd-owner: implementation -->
- [ ] Add the failing parser/assertions in `apps/backend/tests/external-garfex-documentation-parity.test.ts` for the exact ten operation rows, direct mappings, eleven error codes, allowlisted metadata names, and required non-decision statements before the canonical document is complete. <!-- sdd-owner: implementation -->
- [ ] Create `docs/external-garfex-boundary.md` with the lead distinction `External Client Contract != Resource Master Public Application Contract`, exact operation/mapping/request/success/error tables, trusted identity flow, final module authorization, compatibility ownership, fixture/check commands, Convex isolation, and transport/IdP/schema/SDK/consumer non-decisions; update `docs/architecture.md`, `docs/external-client-boundary.md`, and `docs/auth-boundary.md` with links and dependency arrows only. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-documentation-parity.test.ts external-garfex-compatibility.test.ts` and `corepack pnpm test:architecture`, proving documented identifiers, direct mappings, metadata, and non-decisions agree without presenting JSON fixtures as a selected transport. <!-- sdd-owner: implementation -->
- [ ] Apply progressive disclosure and review-oriented tables to `docs/external-garfex-boundary.md`, `docs/architecture.md`, `docs/external-client-boundary.md`, and `docs/auth-boundary.md`, remove duplicated contradictory semantics, preserve repository independence and deferred packaging, and rerun documentation parity plus the relevant focused tests. <!-- sdd-owner: implementation -->
- [ ] Run the strict repository test command `corepack pnpm test` and record the exact Vitest result, including coverage completion. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test`, `corepack pnpm --filter @garfex/backend typecheck`, `corepack pnpm test:architecture`, and `corepack pnpm build`; record each exact result and any unexecuted check. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm check` and inspect `git diff --stat` plus `git diff --numstat` for the selected work unit/PR, confirming authored additions plus deletions stay within 400 lines per slice and no transport, SDK, productive IdP, Convex exposure, universal executor, or internal contract publication slipped in. <!-- sdd-owner: implementation -->
- [ ] Verify rollback boundaries against `apps/backend/src/resource-master/`, `apps/backend/src/auth/`, `apps/backend/convex/`, and persistence/infrastructure files, confirming the change can be disabled without weakening Resource Master authorization or changing Convex persistence behavior. <!-- sdd-owner: implementation -->

## U2b3 — Closed failure validation and containment

Status: completed; this apply executed only U2b3. U3 and all later units remain deferred.

### TDD Cycle Evidence

| Task | Test file | Layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Add failure cases for all eleven codes and unsafe values | `apps/backend/tests/external-garfex-contract.test.ts` | Unit | 16/16 focused tests passed before edits | Written first; 15 passed and 3 failed because the export was absent | 18/18 focused tests passed | 19/19 after null-prototype and omitted-metadata cases | 19/19 after formatting and predicate cleanup |
| Implement `validateExternalFailure` | `apps/backend/src/external-garfex-boundary/client-facing/validation.ts` | Unit | Existing validator suite remained green | Failure tests referenced the missing function before production edits | 18/18 focused tests passed | 19/19 with every metadata branch exercised | Backend typecheck and Biome checks passed |
| Triangulate serialization and leak containment | `apps/backend/tests/external-garfex-contract.test.ts` | Unit | Existing output tests passed | Serialization/leak assertions were part of the failing test set | 18/18 focused tests passed | 19/19; `JSON.stringify` emitted only reviewed fields or the exact fallback | 19/19 after readable cleanup |
| Refactor readable failure predicates | `apps/backend/src/external-garfex-boundary/client-facing/validation.ts` | Unit | 18/18 GREEN tests | N/A after the behavior was established | N/A | 19/19 focused tests passed | Typecheck, format, and lint passed without writes |

### Implementation evidence

- `validateExternalFailure` now accepts only a closed `{ ok: false, error }` shape and rebuilds every accepted error object.
- `INVALID_ARGUMENT`, `INVALID_REFERENCE`, and `VALIDATION_FAILED` alone accept rebuilt `fieldIssues`; `DUPLICATE` alone accepts `existingResourceId`; `CONFLICT` alone accepts `currentRevision`.
- Unknown codes, extra keys, malformed metadata, symbol keys, null/array/date values, and throwing accessors return exactly `{ ok: false, error: { code: "INTERNAL_FAILURE" } }`.
- Serialization tests prove messages, stacks, provider, authority, platform, persistence, and internal diagnostic values are not emitted.
- Accepted request and success validators were preserved; production validation still imports only the boundary-local `contract.ts` and no backend, internal, third-party, schema, or transport dependency.

### Files and workload

- Changed implementation/test files: `apps/backend/src/external-garfex-boundary/client-facing/validation.ts` and `apps/backend/tests/external-garfex-contract.test.ts`.
- Changed SDD files: `openspec/changes/external-garfex-boundary/tasks.md` and this cumulative `apply-progress.md`.
- The U2b2 baseline was 533 production lines plus 750 test lines; the final U2b3 files are 649 plus 1,011 lines, approximately 377 authored TypeScript additions across the slice, within the 400-line budget. SDD bookkeeping is excluded from that authored-line estimate.
- The assigned delivery boundary remains the feature-branch-chain U2b3 slice; no size exception was used.
- No U3 identity work, trusted operations, transport, SDK, productive IdP, Convex entrypoint, deployment, consumer, review, receipt, commit, branch, push, PR, or delivery gate was created.

### Verification

- `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-contract.test.ts` — exit 0; 1 file and 19 tests passed.
- `corepack pnpm --filter @garfex/backend typecheck` — exit 0; no diagnostics.
- `corepack pnpm exec biome format apps/backend/src/external-garfex-boundary/client-facing/validation.ts apps/backend/tests/external-garfex-contract.test.ts` — exit 0; 2 files checked, no fixes applied.
- `corepack pnpm exec biome lint apps/backend/src/external-garfex-boundary/client-facing/validation.ts apps/backend/tests/external-garfex-contract.test.ts` — exit 0; 2 files checked, no fixes applied.
- A first package-filtered Biome invocation used repository-root paths from the `apps/backend` working directory and reported no files; the corrected root invocation above passed and performed no writes.
- Full repository tests, architecture tests, build, `corepack pnpm check`, and final delivery gates remain intentionally unexecuted for this bounded apply unit.

### Structured status consumed and produced

- Consumed native `gentle-ai.sdd-status` for `external-garfex-boundary`: `artifactStore: openspec`, `applyState: ready`, `dependencies.apply: ready`, and `nextRecommended: apply`.
- Consumed `actionContext.mode: repo-local`, workspace root and allowed edit root `/home/garfex/PROGRAMACION/garfex-platform`, with no warnings or edit-root violations.
- Consumed the resolved workload path `chain strategy: feature-branch-chain`; no decision or `size:exception` approval was needed.
- Produced all four U2b3 implementation checkbox updates in `tasks.md`; the change remains incomplete because U3 and later implementation rows are unchecked. This phase recommends `parent-lifecycle`, not verify, review, receipt, or U3.

### Current exact unchecked task rows

The following exact unchecked rows remain in the persisted `tasks.md` after U2b3:

- [ ] Add failing authentication cases in `apps/backend/tests/external-garfex-security.test.ts` for null composition, missing identity, provider exception, server-created actor separation, copied capability sets, and proof that no raw business request is accepted by the resolver. <!-- sdd-owner: implementation -->
- [ ] Implement `apps/backend/src/external-garfex-boundary/trusted/identity.ts` with `TrustedActorResolver.resolveActor(): Promise<ActorContext | null>` and `createTrustedActorResolver`, importing auth and Resource Master types only at this trusted edge and never reading client-facing DTO fields. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-security.test.ts tests/auth-boundary.test.ts` and backend typecheck, proving provider failures become `null`, capability mutation of the source composition cannot mutate the actor, and no client-facing file imports identity types. <!-- sdd-owner: implementation -->
- [ ] Refine `apps/backend/src/external-garfex-boundary/trusted/identity.ts` so the resolver has no operation selector, request parameter, capability pre-check, or transport concern; rerun U3 focused and existing auth tests. <!-- sdd-owner: implementation -->
- [ ] Add failing cases in `apps/backend/tests/external-garfex-security.test.ts` for every internal `ResourceErrorCode`, valid/invalid `existingResourceId`, valid/invalid `currentRevision`, unknown runtime codes, thrown provider/application errors, secret-bearing messages/details/stacks, malformed failures, and a diagnostics sink that throws. <!-- sdd-owner: implementation -->
- [ ] Implement `apps/backend/src/external-garfex-boundary/trusted/errors.ts` with `ExternalBoundaryDiagnostics`, the exact eleven-code mapping, safe allowlisted metadata, catalog-state coarsening, metadata-free `INTERNAL_FAILURE`, authentication exception handling, and guarded server-only diagnostics; import Resource Master only through `apps/backend/src/resource-master/public.ts`. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-security.test.ts` and backend typecheck, serialize every normalized failure with `JSON.stringify`, and prove no provider, credential, actor, capability, persistence, Convex, catalog, configuration, message, or stack detail appears. <!-- sdd-owner: implementation -->
- [ ] Replace any open-ended error branching in `trusted/errors.ts` with an exhaustive switch/`never` check and boundary-local helpers that cannot let diagnostics failure alter the outward result; rerun U4 security tests. <!-- sdd-owner: implementation -->
- [ ] Add failing projection cases in `apps/backend/tests/external-garfex-operations.test.ts` for every reviewed success family, injected internal/authority/platform fields, nested reference identity, resource attribute quantities, operation-specific mutation wrappers, and `undefined` search continuation becoming `null`. <!-- sdd-owner: implementation -->
- [ ] Implement `apps/backend/src/external-garfex-boundary/trusted/projections.ts` with explicit field-by-field copying for taxonomy, effective schema/rules, options, natural units, resources, search summaries/cursors, and descriptions, using a private resource copier only behind named create/update/deactivate wrappers. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-operations.test.ts` and backend typecheck with U2 success validators, proving extra internal fields are absent, nested arrays/objects are new references, and no object spread or source reference is returned. <!-- sdd-owner: implementation -->
- [ ] Deduplicate only private projection mechanics in `apps/backend/src/external-garfex-boundary/trusted/projections.ts`; preserve named projector evidence and rerun projection tests plus contract validation tests without widening any external field. <!-- sdd-owner: implementation -->
- [ ] Add failing table-driven cases in `apps/backend/tests/external-garfex-operations.test.ts` for the six named read wrappers, including validator-before-auth ordering, actor-first arguments, field-by-field request mapping, exactly-one same-named method call, projection/error validation, and no-call malformed requests. <!-- sdd-owner: implementation -->
- [ ] Implement the six named functions in `apps/backend/src/external-garfex-boundary/trusted/read-operations.ts` with explicit request construction and direct calls to the matching `ResourceMaster` public methods; use no exported operation selector, callable map, registry, or generic executor. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-operations.test.ts` plus the relevant cases in `apps/backend/tests/resource-master-authorization.test.ts`, proving incapable actors reach the real module authorization and forbidden work stops before catalog/repository access. <!-- sdd-owner: implementation -->
- [ ] Refine private authentication/exception containment helpers in `trusted/read-operations.ts` only if they do not accept an operation identifier or choose a method; rerun read mapping tests, security tests, and backend typecheck. <!-- sdd-owner: implementation -->
- [ ] Add failing search cases in `apps/backend/tests/external-garfex-operations.test.ts` for omitted lifecycle/limit/cursor, explicit nullable cursor, bounded limits, same cursor round-trip, `undefined` continuation to `null`, malformed cursor/limit/lifecycle no-call behavior, and a spy proving only `searchResources` runs once. <!-- sdd-owner: implementation -->
- [ ] Implement `invokeExternalSearchResources` in `apps/backend/src/external-garfex-boundary/trusted/read-operations.ts`, rebuilding `terms` and only supplied optionals, preserving cursor opacity, calling `resourceMaster.searchResources(actor, mappedInput)`, projecting the page, and validating the complete outcome. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-operations.test.ts` and the focused Resource Master pagination tests, proving the boundary never decodes, constructs, or exposes cursor structure and never turns omitted fields into explicit `undefined` properties. <!-- sdd-owner: implementation -->
- [ ] Keep search-specific option construction explicit in `trusted/read-operations.ts` and rerun U7 search tests, U6 read tests, and backend typecheck without adding a transport or cursor helper tied to persistence/Convex. <!-- sdd-owner: implementation -->
- [ ] Add failing mutation cases in `apps/backend/tests/external-garfex-operations.test.ts` and `apps/backend/tests/external-garfex-security.test.ts` for rebuilt create attributes, resource ID/revision/unit mapping, exactly-one direct method calls, forged authority rejection, and each mutation's missing-neighbor-capability forbidden path with downstream spies untouched. <!-- sdd-owner: implementation -->
- [ ] Implement the three named functions in `apps/backend/src/external-garfex-boundary/trusted/mutation-operations.ts`, validating before authentication, rebuilding all internal inputs, passing the trusted actor separately, calling only the matching public method, and using named success/error projection paths. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-operations.test.ts external-garfex-security.test.ts` and the relevant `apps/backend/tests/resource-master-authorization.test.ts` cases, proving no edge capability table duplicates or replaces `resource-master/application/authorization.ts`. <!-- sdd-owner: implementation -->
- [ ] Remove only accidental duplication between mutation wrappers in `apps/backend/src/external-garfex-boundary/trusted/mutation-operations.ts` through private boundary-local helpers, retain three named direct calls, and rerun operation/security tests plus backend typecheck. <!-- sdd-owner: implementation -->
- [ ] Add the failing fixture-parity harness in `apps/backend/tests/external-garfex-compatibility.test.ts` before the fixture exists, asserting ten operation entries, request/success/failure validation, eleven error metadata forms, and serialized deep equality. <!-- sdd-owner: implementation -->
- [ ] Add `apps/backend/tests/fixtures/external-garfex-boundary/compatibility.json` and complete the parity test with representative safe values, applicable failures, null/opaque cursor cases, validator-backed fixture loading, and no internal messages, stacks, provider data, Convex IDs, persistence records, or deployment/catalog-admin values. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-compatibility.test.ts` and the full backend test suite, proving JSON round-trip identity, one-to-one operation coverage, allowlisted metadata, and drift failure when fixture-visible fields are changed without an intentional fixture update. <!-- sdd-owner: implementation -->
- [ ] Make traversal deterministic in `apps/backend/tests/external-garfex-compatibility.test.ts` and keep `apps/backend/tests/fixtures/external-garfex-boundary/compatibility.json` as repository test evidence only; rerun compatibility, operation, security, and contract tests without selecting a wire format or generation direction. <!-- sdd-owner: implementation -->
- [ ] Extend `tooling/tests/architecture.test.ts` with failing expectations for all seven rule names, a valid independent-contract fixture, a valid trusted-public-edge fixture, and these violations: `internal-import.ts`, `authority-field.ts`, `platform-leak.ts`, `trusted-internal-import.ts`, `generic-executor.ts`, `automatic-derivation.ts`, and `transport-import.ts`. <!-- sdd-owner: implementation -->
- [ ] Update `tooling/architecture/check.mjs` with narrowly scoped import/syntax checks and add the valid/violating fixtures under `tooling/architecture-fixtures/valid/external-garfex-boundary/` and `tooling/architecture-fixtures/violations/external-garfex-boundary/`; keep trusted imports limited to public Resource Master/auth composition and reject Convex, persistence, deployment, transport, derivation, and generic business publication. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm test:architecture` and inspect the checker output for every named fixture, proving existing `external-client-boundary` protections remain green and the new rules do not rely on broad repository-wide keyword bans. <!-- sdd-owner: implementation -->
- [ ] Refine rule diagnostics and fixture names in `tooling/architecture/check.mjs` and `tooling/tests/architecture.test.ts` so each violation fails for its intended rule only; rerun architecture tests and full typecheck. <!-- sdd-owner: implementation -->
- [ ] Add the failing parser/assertions in `apps/backend/tests/external-garfex-documentation-parity.test.ts` for the exact ten operation rows, direct mappings, eleven error codes, allowlisted metadata names, and required non-decision statements before the canonical document is complete. <!-- sdd-owner: implementation -->
- [ ] Create `docs/external-garfex-boundary.md` with the lead distinction `External Client Contract != Resource Master Public Application Contract`, exact operation/mapping/request/success/error tables, trusted identity flow, final module authorization, compatibility ownership, fixture/check commands, Convex isolation, and transport/IdP/schema/SDK/consumer non-decisions; update `docs/architecture.md`, `docs/external-client-boundary.md`, and `docs/auth-boundary.md` with links and dependency arrows only. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-documentation-parity.test.ts external-garfex-compatibility.test.ts` and `corepack pnpm test:architecture`, proving documented identifiers, direct mappings, metadata, and non-decisions agree without presenting JSON fixtures as a selected transport. <!-- sdd-owner: implementation -->
- [ ] Apply progressive disclosure and review-oriented tables to `docs/external-garfex-boundary.md`, `docs/architecture.md`, `docs/external-client-boundary.md`, and `docs/auth-boundary.md`, remove duplicated contradictory semantics, preserve repository independence and deferred packaging, and rerun documentation parity plus the relevant focused tests. <!-- sdd-owner: implementation -->
- [ ] Run the strict repository test command `corepack pnpm test` and record the exact Vitest result, including coverage completion. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm --filter @garfex/backend test`, `corepack pnpm --filter @garfex/backend typecheck`, `corepack pnpm test:architecture`, and `corepack pnpm build`; record each exact result and any unexecuted check. <!-- sdd-owner: implementation -->
- [ ] Run `corepack pnpm check` and inspect `git diff --stat` plus `git diff --numstat` for the selected work unit/PR, confirming authored additions plus deletions stay within 400 lines per slice and no transport, SDK, productive IdP, Convex exposure, universal executor, or internal contract publication slipped in. <!-- sdd-owner: implementation -->
- [ ] Verify rollback boundaries against `apps/backend/src/resource-master/`, `apps/backend/src/auth/`, `apps/backend/convex/`, and persistence/infrastructure files, confirming the change can be disabled without weakening Resource Master authorization or changing Convex persistence behavior. <!-- sdd-owner: implementation -->
- [ ] After the final validation gate, confirm deviations and unexecuted checks are recorded for the SDD archive and close the lifecycle only if the forbidden-scope guardrails remain true. <!-- sdd-owner: parent -->

## U3 — Trusted server actor boundary

Status: completed; this apply executed only U3. U4 and later implementation units remain deferred to the parent lifecycle.

