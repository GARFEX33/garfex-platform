# Apply Progress: external-client-contract-resource-master

## Phase envelope

- Change: `external-client-contract-resource-master`
- Apply scope: WU-01 only (`Establish the independent TypeSpec authority and metadata carrier`)
- Work-unit boundary: TypeSpec source, local metadata-library state, authority/metadata tests, and their controlled fixtures.
- Delivery: `auto-chain`, `stacked-to-main`; no commit, push, PR, release, review actor, or delivery-gate execution.
- Receipt-driven development: `disabled/unmanaged`.
- Artifact store: OpenSpec is authoritative for this worktree. The cumulative apply-progress was also saved to the requested Engram topic after a transient initial provider outage.

## History and continuation state

The first apply worker timed out after creating the TypeSpec project and tests. The maintainer-authorized attempt reset preserved that partial worktree and increased the native WU-01 budget to account for pinned lockfile churn. That timeout and reset are historical evidence only, not a current implementation failure. This continuation authenticated the active native attempt token and resumed from the persisted state where WU-01 RED, GREEN, and TRIANGULATE were already checked.

No WU-02 work was started. No backend runtime, Resource Master implementation, Convex internals, or `openspec/changes/persistent-resource-catalog/` path was edited.

## Completed implementation tasks

- [x] WU-01 RED — Existing compiler/authority tests and metadata/authority fixtures were inspected as the preserved failing-first evidence. The cases cover no-emit compilation, exact namespace metadata cardinality and values, missing/duplicate/empty/wrong-target metadata, the exact ten-operation set, anonymous/unresolved shapes, authority fields, backend/platform leakage, and transport-decorator rejection.
- [x] WU-01 GREEN — The preserved TypeSpec project and local metadata library compile successfully without an emitter. The authority source is split into metadata, public models, failures, and operations, with the ten named operations and eleven safe failure codes represented.
- [x] WU-01 TRIANGULATE — The controlled fixture matrix and exact ten-operation assertions were inspected and exercised by the focused suite; rejected cases produce diagnostics and no generated directory.
- [x] WU-01 REFACTOR — Consolidated `compileProject`/`outputOf` and shared repository/fixture roots in `tests/support/compile.ts`; centralized the expected identity/revision values for exact assertions; removed duplicated helper implementations and metadata literals from the test files. The TypeSpec split remains `contract-metadata.tsp` metadata-only, `models.tsp` independently owned public shapes, and `operations.tsp` the closed ten-operation surface.

The persisted OpenSpec task checkbox for each completed WU-01 row is visibly `[x]` in `tasks.md`.

## Files and scope

### Continuation edits

- `tooling/typespec-semantic-manifest/tests/support/compile.ts`
- `tooling/typespec-semantic-manifest/tests/contract-metadata.test.ts`
- `tooling/typespec-semantic-manifest/tests/authority.test.ts`
- `openspec/changes/external-client-contract-resource-master/tasks.md`
- `openspec/changes/external-client-contract-resource-master/apply-progress.md`

### Preserved WU-01 candidate inspected

- `contracts/external-garfex/resource-master/{main.tsp,contract-metadata.tsp,models.tsp,failures.tsp,operations.tsp,tspconfig.yaml}`
- `tooling/typespec-semantic-manifest/{package.json,lib/{main.tsp,decorators.tsp},src/{index.ts,decorators.ts,lib.ts}}`
- `tooling/typespec-semantic-manifest/tests/{authority.test.ts,contract-metadata.test.ts,support/compile.ts}` and the `authority/` and `metadata/` fixture trees
- Existing WU-01 root wiring in `package.json`, `pnpm-workspace.yaml`, `pnpm-lock.yaml`, and `vitest.config.ts`

## Verification evidence

| Command | Result |
| --- | --- |
| `corepack pnpm exec vitest run tooling/typespec-semantic-manifest/tests/contract-metadata.test.ts tooling/typespec-semantic-manifest/tests/authority.test.ts` | PASS — 2 test files, 17 tests passed. This was the pre-edit safety net and the post-refactor GREEN verification. |
| `cd contracts/external-garfex/resource-master && corepack pnpm exec tsp compile . --no-emit` | PASS — TypeSpec compiler v1.15.0 completed successfully without an emitter. |
| `corepack pnpm exec biome format tooling/typespec-semantic-manifest/tests/support/compile.ts tooling/typespec-semantic-manifest/tests/contract-metadata.test.ts tooling/typespec-semantic-manifest/tests/authority.test.ts` | PASS — three files checked with no fixes required after formatting. |
| `git diff --check` | PASS. |
| `git diff --name-only -- openspec/changes/persistent-resource-catalog` | PASS — empty output; protected change remains untouched. |

A preliminary `biome format --check` invocation was rejected by this Biome CLI because `--check` is not a supported flag in that command form. The repository-supported `biome format` check was then run successfully; one formatting-only write was applied before the final focused tests and compile.

Runtime harness: `N/A` — WU-01 is a compiler/tooling authority boundary and does not introduce an application runtime surface.

Rollback boundary: remove the new `contracts/external-garfex/resource-master/` source, the local metadata-library skeleton, and WU-01 tests/fixtures; leave backend runtime and Resource Master untouched.

## Strict TDD cycle evidence

| Task | Test layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- |
| WU-01 authority and metadata | TypeSpec compiler integration through Vitest child-process tests | PASS — 17 focused tests before refactor | Inherited checked evidence inspected; missing/invalid authority fixtures are present | PASS — focused tests and canonical no-emit compile | PASS — controlled metadata and authority fixture matrix; exact ten-operation coverage | PASS — shared helper/roots and centralized expected metadata; focused tests and compile remained green |

### Test Summary

- Focused tests passing: 17.
- Test files passing: 2.
- Layers used: TypeSpec compiler integration and focused Vitest unit/integration assertions.
- Approval/safety evidence: the existing 17-test focused suite passed before and after the refactor.
- New production functions: none; the continuation refactored test support only.

## Deviations and risks

- No design deviation was introduced.
- The native status context was consumed as `repo-local` with workspace root `/home/garfex/PROGRAMACION/garfex-platform` and allowed edit root limited to that same path. The active attempt token was reused rather than reset.
- The first Engram search attempt reported a transient outage at `http://127.0.0.1:7437`; the final apply-progress save succeeded after retry. OpenSpec task/progress persistence is complete locally.
- The overall change remains high workload and incomplete; only the WU-01 stacked-to-main boundary is complete. WU-02 and later units remain out of scope for this continuation.

## Remaining implementation and parent-owned tasks

The following unchecked lines are copied exactly from the persisted `tasks.md` artifact after WU-01 completion:

- [x] RED — Add failing emitter tests for `$onEmit(context)`, semantic traversal through checker-resolved models, `emitFile` output, exact metadata propagation, ten unique operations, canonical ordering, stable provenance, no transport emitter, and no partial output on diagnostics. Intended files: `tooling/typespec-semantic-manifest/tests/emitter.test.ts`, `tooling/typespec-semantic-manifest/tests/determinism.test.ts`, and `tooling/typespec-semantic-manifest/tests/fixtures/emitter/{transport,duplicate-operation,unsupported-shape,diagnostic}.tsp`. Verify with `corepack pnpm exec vitest run tooling/typespec-semantic-manifest/tests/emitter.test.ts tooling/typespec-semantic-manifest/tests/determinism.test.ts`; assertions must fail before the emitter exists. Depends on: WU-01 REFACTOR. <!-- sdd-owner: implementation -->
- [x] GREEN — Implement the semantic emitter in `tooling/typespec-semantic-manifest/src/index.ts` and the normalized output algebra/canonical ordering in `tooling/typespec-semantic-manifest/src/manifest-model.ts`; configure only that local emitter in `contracts/external-garfex/resource-master/tspconfig.yaml` and produce `contracts/external-garfex/resource-master/generated/semantic-manifest.json`. Copy the decorator values exactly while keeping them distinct from internal `schemaRevision` and tooling provenance; reject transport options, authority/platform leakage, unresolved shapes, duplicate identifiers, and unsupported semantics before `emitFile`. Verify with `cd contracts/external-garfex/resource-master && corepack pnpm exec tsp compile . --no-emit`, the emitter tests, and one clean generation run. Depends on: WU-02 RED. <!-- sdd-owner: implementation -->
- [x] TRIANGULATE — Run generation twice in clean temporary directories with reordered fixture/input traversal and assert byte-identical UTF-8, two-space, LF-terminated manifest bytes; assert that timestamps, absolute paths, machine names, AST node IDs, insertion order, and compiler traversal order cannot affect output. Assert exact identity/revision parity and no manifest on compiler/emitter failure. Verify with `corepack pnpm exec vitest run tooling/typespec-semantic-manifest/tests/emitter.test.ts tooling/typespec-semantic-manifest/tests/determinism.test.ts` and `cd contracts/external-garfex/resource-master && corepack pnpm exec tsp compile . --no-emit`. Depends on: WU-02 GREEN. <!-- sdd-owner: implementation -->
- [x] REFACTOR — Make canonicalization and diagnostics total, stable, and independently testable without source-text parsing or backend reads; document the manifest fields, ordering rule, provenance inputs, and generated-file boundary in `tooling/typespec-semantic-manifest/src/manifest-model.ts` and its tests. Verify the focused emitter/determinism tests and a clean no-emit compile. Depends on: WU-02 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing materializer and stale-artifact tests proving that runtime data and consumer Markdown are read only from the manifest, carry a manifest digest, expose exact identity/revision, reject omitted/stale/hand-edited values, and contain no backend or transport concepts. Intended files: `tooling/typespec-semantic-manifest/tests/materializers.test.ts`, `tooling/typespec-semantic-manifest/tests/stale-artifacts.test.ts`, and `tooling/typespec-semantic-manifest/tests/fixtures/materializers/`. Verify with `corepack pnpm exec vitest run tooling/typespec-semantic-manifest/tests/materializers.test.ts tooling/typespec-semantic-manifest/tests/stale-artifacts.test.ts`; failures must identify missing materializers or stale outputs. Depends on: WU-02 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Implement `tooling/typespec-semantic-manifest/src/materialize-runtime.ts` and `tooling/typespec-semantic-manifest/src/materialize-docs.ts`; generate `apps/backend/src/external-garfex-boundary/client-facing/generated/semantic-contract.generated.ts` and `docs/generated/resource-master-external-contract.md`. The generated TypeScript must expose readonly contract metadata and schema data, and the Markdown must begin with `Contract identity and compatibility`, the exact opaque values, all ten workflows, public metadata, safe failures, and compatibility guidance without routes, verbs, statuses, headers, serialization, SDK, deployment, or network claims. Verify the materializer tests and byte comparison against a clean manifest read. Depends on: WU-03 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Mutate each generated value, digest header, operation entry, model field, error code, and metadata allowance in temporary copies; assert non-writing stale checks reject omission, manual divergence, wrong identity/revision, stale provenance, and generated documentation that names Convex, persistence, `ActorContext`, capabilities, or a transport. Verify with `corepack pnpm exec vitest run tooling/typespec-semantic-manifest/tests/materializers.test.ts tooling/typespec-semantic-manifest/tests/stale-artifacts.test.ts` and `corepack pnpm exec vitest run apps/backend/tests/external-garfex-documentation-parity.test.ts`. Depends on: WU-03 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Keep both materializers pure manifest consumers with one canonical writer, stable generated headers, readonly TypeScript output, and progressive-disclosure Markdown; remove any hard-coded operation/error/metadata lists from the materializers while preserving exact snapshot and semantic assertions. Verify focused materializer tests and `corepack pnpm exec biome format --check tooling/typespec-semantic-manifest/src/materialize-runtime.ts tooling/typespec-semantic-manifest/src/materialize-docs.ts docs/generated/resource-master-external-contract.md`. Depends on: WU-03 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing table-driven comparator tests for operation additions/removals/renames, request and success shape changes, requiredness/nullability, enum/union membership, constraints, metadata applicability, error changes, unknown differences, provenance-only changes, unchanged revision silent breaks, revision changes without approved break evidence, and identity changes without replacement-lineage intent. Intended files: `tooling/typespec-semantic-manifest/tests/compare.test.ts`, `tooling/typespec-semantic-manifest/tests/fixtures/compare/`, and `apps/backend/tests/external-garfex-compatibility.test.ts`. Verify with `corepack pnpm exec vitest run tooling/typespec-semantic-manifest/tests/compare.test.ts apps/backend/tests/external-garfex-compatibility.test.ts`; the comparator assertions must fail before implementation. Depends on: WU-03 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Implement `tooling/typespec-semantic-manifest/src/compare.ts` and commit `contracts/external-garfex/resource-master/baseline/accepted-semantic-manifest.json` from the first reviewed manifest, with exact identity and opaque revision `1`; update `apps/backend/tests/fixtures/external-garfex-boundary/compatibility.json` and its test to consume manifest-driven operation/error coverage while retaining JSON as semantic evidence only. Support temporary approved-break fixtures containing `migration-intent.md`, but do not add migration intent to the initial unchanged baseline. Verify comparator tests, fixture parity, and zero semantic difference between the accepted baseline and the initial manifest. Depends on: WU-04 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Prove all coupling rules: a breaking shape with unchanged revision fails as a silent break; a changed revision without comparator break output and migration intent fails; an approved breaking shape with deliberate revision and `migration-intent.md` passes; an identity change additionally requires replacement-lineage intent; compiler/emitter/module/package/deployment provenance changes never mutate external identity or revision. Verify with `corepack pnpm exec vitest run tooling/typespec-semantic-manifest/tests/compare.test.ts apps/backend/tests/external-garfex-compatibility.test.ts`. Depends on: WU-04 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Centralize canonical structural paths and stable difference categories (`breaking`, `additive`, `documentation`, `tooling-provenance`), classify closed success/error widening conservatively, and make unknown differences breaking by default without selecting semantic-version ordering or a compatibility window. Verify focused comparator tests and `corepack pnpm exec vitest run apps/backend/tests/external-garfex-compatibility.test.ts`. Depends on: WU-04 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing runtime tests that require `contract.ts` to expose generated readonly metadata/types, require validators to accept/reject based on manifest semantics, and reject any handwritten operation/model/error list that diverges from the generated embedding. Intended files: `apps/backend/tests/external-garfex-generated-runtime.test.ts`, `apps/backend/tests/external-garfex-contract.test.ts`, and `apps/backend/src/external-garfex-boundary/client-facing/generated/semantic-contract.generated.ts`. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-generated-runtime.test.ts tests/external-garfex-contract.test.ts`; failures must show the current façade is independently authoritative. Depends on: WU-04 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Replace independent shape declarations in `apps/backend/src/external-garfex-boundary/client-facing/contract.ts` with a small stable façade over `generated/semantic-contract.generated.ts`, and refactor `client-facing/validation.ts` to interpret the generated closed schema algebra while retaining named request/success/failure wrapper exports. Rebuild closed objects field by field, preserve omitted optionals, fail closed, and validate projected success and normalized error values. Verify `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-generated-runtime.test.ts tests/external-garfex-contract.test.ts` and `corepack pnpm --filter @garfex/backend typecheck`. Depends on: WU-05 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Extend `apps/backend/tests/external-garfex-contract.test.ts` and `apps/backend/tests/external-garfex-generated-runtime.test.ts` for null prototypes, symbols, accessors/getters that throw, sparse or extended arrays, hostile attribute keys, prototype-pollution names, every closed enum/union/constraint, malformed output, unknown failure metadata, and the invariant that invalid projected values become metadata-free `INTERNAL_FAILURE`. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-contract.test.ts tests/external-garfex-generated-runtime.test.ts tests/external-garfex-compatibility.test.ts`. Depends on: WU-05 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Keep generated data as the only source of fields, requiredness, enum members, unions, nullability, and bounds; keep security policy in a total interpreter with explicit TypeScript types, no spreads/casts/pass-through, and no backend or Convex imports in client-facing files. Verify `corepack pnpm --filter @garfex/backend typecheck` and the focused runtime tests. Depends on: WU-05 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing composition and read-operation tests for `getTaxonomy`, `getEffectiveResourceSchema`, `getValidOptions`, `getNaturalUnits`, `getResource`, `searchResources`, and `describeResource`: validation before authentication, fresh trusted actor state, one matching module call, explicit input rebuilding, field-by-field output projection, no generic dispatch, and no handler-authentication responsibility. Intended files: `apps/backend/tests/external-garfex-composition.test.ts`, `apps/backend/tests/external-garfex-operations.test.ts`, and the not-yet-created `apps/backend/src/external-garfex-boundary/composition.ts`. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-composition.test.ts tests/external-garfex-operations.test.ts`; failures must identify the absent composition boundary. Depends on: WU-05 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Add `apps/backend/src/external-garfex-boundary/composition.ts` with seven statically named composed entry functions and refactor `trusted/read-operations.ts` and `trusted/identity.ts` so `handleGetTaxonomy`, `handleGetEffectiveResourceSchema`, `handleGetValidOptions`, `handleGetNaturalUnits`, `handleGetResource`, `handleSearchResources`, and `handleDescribeResource` accept validated business input plus fresh actor state and only `resource-master/public.ts`. Keep explicit projector functions in `trusted/projections.ts` (`projectExternalGetTaxonomy`, `projectExternalGetEffectiveResourceSchema`, `projectExternalGetValidOptions`, `projectExternalGetNaturalUnits`, `projectExternalGetResource`, `projectExternalSearchResources`, `projectExternalDescribeResource`). Verify focused composition/operation tests and `corepack pnpm --filter @garfex/backend typecheck`. Depends on: WU-06 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Exercise every read operation with malformed authority-like input, absent authentication, unknown operation identifiers, omitted and supplied search optionals, extra internal result fields, invalid projected results, thrown invocation values, and Resource Master denial before catalog/repository work. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-composition.test.ts tests/external-garfex-operations.test.ts tests/external-garfex-security.test.ts` and `corepack pnpm test:architecture`. Depends on: WU-06 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Keep composition responsible for validation/authentication/actor construction/outcome validation and keep read handlers responsible only for their named mapping, projection, and normalization boundary; preserve stable `invokeExternal...` exports only as explicit wrappers, never as a dynamic registry or operation executor. Verify the focused tests and `corepack pnpm --filter @garfex/backend typecheck`. Depends on: WU-06 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing tests for `createResource`, `updateNonIdentityData`, and `deactivateResource` that require one matching public module method, deep-fresh input reconstruction, no client authority, field-by-field resource projection, exact capability evidence, and no downstream work when Resource Master denies. Intended files: `apps/backend/tests/external-garfex-operations.test.ts`, `apps/backend/tests/external-garfex-security.test.ts`, and `apps/backend/tests/external-garfex-composition.test.ts`. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-operations.test.ts tests/external-garfex-security.test.ts tests/external-garfex-composition.test.ts`; failures must expose the missing mutation composition/handler split. Depends on: WU-06 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Refactor `apps/backend/src/external-garfex-boundary/trusted/mutation-operations.ts`, `trusted/projections.ts`, and `composition.ts` to provide `handleCreateResource`, `handleUpdateNonIdentityData`, and `handleDeactivateResource` with explicit request mappers and `projectExternalCreateResource`, `projectExternalUpdateNonIdentityData`, and `projectExternalDeactivateResource`. Add a compile-time mapping evidence object that enumerates exactly the ten names without callable generic dispatch, and preserve Resource Master as the only owner of `resource:create`, `resource:update-non-identity`, and `resource:deactivate` checks. Verify focused mutation/security tests, `corepack pnpm --filter @garfex/backend typecheck`, and `corepack pnpm test:architecture`. Depends on: WU-07 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Run table-driven evidence for all ten operations, including a test-only extra Resource Master method that remains absent from TypeSpec and mapping evidence; forge actor/role/capability/claim/token/session/provider fields; test missing and neighboring capabilities; assert Resource Master returns `FORBIDDEN` before catalog, repository, persistence, or Convex work. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-operations.test.ts tests/external-garfex-security.test.ts tests/external-garfex-compatibility.test.ts`. Depends on: WU-07 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Remove accidental shared forwarding and retain explicit nested rebuilds for `createResource.attributes`, omitted search values, mutation revisions, and every success value; keep all handlers dependent only on generated client-facing types and `resource-master/public.ts`. Verify `corepack pnpm --filter @garfex/backend typecheck`, focused operation/security tests, and a clean architecture check. Depends on: WU-07 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing normalization tests for all eleven external codes, every Resource Master failure code, valid and malformed `fieldIssues`, `existingResourceId`, and `currentRevision`, catalog unavailable/uninitialized coarsening, integrity/invalid-catalog/internal/unknown/malformed/thrown failures, projection and response-validation failures, diagnostic sink exceptions, and the invariant that a known failure can never become success. Intended files: `apps/backend/tests/external-garfex-error-normalization.test.ts`, `apps/backend/tests/external-garfex-security.test.ts`, and `apps/backend/src/external-garfex-boundary/trusted/errors.ts`. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-error-normalization.test.ts tests/external-garfex-security.test.ts`; failures must cover behavior not yet generalized by the implementation. Depends on: WU-07 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Implement the exhaustive normalizer in `apps/backend/src/external-garfex-boundary/trusted/errors.ts` and connect it through read/mutation/composition outcome handling. Map validation to `VALIDATION_FAILED`, catalog unavailable/uninitialized to `CATALOG_UNAVAILABLE`, and unsafe/unknown/invalid-output/thrown results to metadata-free `INTERNAL_FAILURE`; expose only applicable validated allowlisted metadata and retain operation/phase/cause through a server-only diagnostics callback. Verify focused error/security tests and `corepack pnpm --filter @garfex/backend typecheck`. Depends on: WU-08 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Use hostile getters, proxies, symbols, extra properties, invalid metadata types, internal messages/stacks/provider/Convex/catalog details, thrown authentication/invocation/projection values, and a throwing diagnostics sink across representative and all ten operation paths; assert exactly one validated safe outcome and never a success after a known failure. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-error-normalization.test.ts tests/external-garfex-security.test.ts tests/external-garfex-contract.test.ts`. Depends on: WU-08 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Keep the Resource Master error switch exhaustive with a `never` check, isolate safe metadata validators, make diagnostic failure unable to affect outcomes, and ensure error validation remains generated-manifest-driven rather than a second code list. Verify focused error tests, `corepack pnpm --filter @garfex/backend typecheck`, and `corepack pnpm test:architecture`. Depends on: WU-08 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing architecture tests and controlled fixtures for TypeSpec independence, no authority fields, no platform/Convex/persistence leakage, no transport decorator/emitter/framing, no generic executor, no automatic derivation/publication, public-only trusted handlers, exact named mappings, final authorization evidence, stale provenance, and hard-coded/missing/duplicate metadata. Intended files: `tooling/tests/architecture.test.ts`, `tooling/architecture-fixtures/valid/external-garfex-boundary/{contracts/main.tsp,config/tspconfig.yaml,artifacts/semantic-manifest.json,client-facing/generated-contract.ts,trusted/named-mappings.ts,docs/contract.md}`, and focused violations under `tooling/architecture-fixtures/violations/external-garfex-boundary/{contracts,config,artifacts,client-facing,trusted,docs}/`. Verify with `corepack pnpm exec vitest run tooling/tests/architecture.test.ts`; new named-rule assertions must fail before checker support exists. Depends on: WU-08 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Extend `tooling/architecture/check.mjs` to inspect `.tsp`, TypeSpec configuration, manifest/baseline/generated TypeScript/generated Markdown, named mapping evidence, and canonical docs; add named diagnostics for transport, authority, internal derivation, platform leakage, generic execution, automatic publication, stale metadata/provenance, missing final authorization, and missing exact-ten parity. Keep existing dependency-cruiser and backend rules unchanged. Verify `corepack pnpm exec vitest run tooling/tests/architecture.test.ts`, `corepack pnpm test:architecture`, and a passing targeted valid fixture check. Depends on: WU-09 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Run every focused violation individually and assert exactly its intended rule, run the valid external boundary fixture, run the full violation fixture set, and assert architecture inspection never traverses or edits `openspec/changes/persistent-resource-catalog/` or any external counterpart repository. Verify with `corepack pnpm exec vitest run tooling/tests/architecture.test.ts`, `node tooling/architecture/check.mjs tooling/architecture-fixtures/valid/external-garfex-boundary`, and `node tooling/architecture/check.mjs tooling/architecture-fixtures/violations/external-garfex-boundary`. Depends on: WU-09 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Centralize path classification and exact rule diagnostics, preserve configuration-error exit `2` versus architecture-violation exit `1`, and ensure generated/docs scans reject drift without treating manifest JSON as a selected transport. Verify `corepack pnpm test:architecture` and `corepack pnpm exec biome format --check tooling/architecture/check.mjs tooling/tests/architecture.test.ts`. Depends on: WU-09 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Extend documentation parity tests to require the TypeSpec identity/revision section, exact ten operation/mapping/capability rows, exact eleven error/metadata rows, three-boundary ownership, stale/breaking gate links, Convex encapsulation, and every transport/auth-provider/UI/publication/version-policy non-decision. Intended files: `apps/backend/tests/external-garfex-documentation-parity.test.ts`, `tooling/typespec-semantic-manifest/tests/documentation-parity.test.ts`, and `docs/generated/resource-master-external-contract.md`. Verify with `corepack pnpm exec vitest run apps/backend/tests/external-garfex-documentation-parity.test.ts tooling/typespec-semantic-manifest/tests/documentation-parity.test.ts`; assertions must fail until canonical records are updated. Depends on: WU-09 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Update `docs/external-garfex-boundary.md`, `docs/external-client-boundary.md`, `docs/auth-boundary.md`, and `docs/architecture.md` to identify TypeSpec as the GARFEX-owned external semantic authority, link `contracts/external-garfex/resource-master/`, manifest, baseline, generated consumer semantics, and gates, and distinguish trusted fresh actor construction, named handlers, final Resource Master authorization, explicit projections, safe errors, and private Convex infrastructure. Keep detailed consumer shapes in `docs/generated/resource-master-external-contract.md`; do not add routes, verbs, statuses, headers, serialization, SDK, deployment, UI, or productive identity claims. Verify the focused documentation tests and `corepack pnpm exec biome format --check docs/external-garfex-boundary.md docs/external-client-boundary.md docs/auth-boundary.md docs/architecture.md docs/generated/resource-master-external-contract.md`. Depends on: WU-10 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Parse all canonical and generated documents as a standalone consumer/reviewer would: assert exact opaque comparison guidance, no backend knowledge requirement for business workflows, cross-links between all four records, no internal identifiers/diagnostics, no HTTP implication, and parity with manifest, baseline, fixture, and mapping evidence. Verify with `corepack pnpm exec vitest run apps/backend/tests/external-garfex-documentation-parity.test.ts tooling/typespec-semantic-manifest/tests/documentation-parity.test.ts` and `corepack pnpm test:architecture`. Depends on: WU-10 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Lead each document with its decision and quick path, use generated tables instead of duplicated handwritten semantic lists, retain ADR-style ownership and non-decision links, and make wording explicit that compatibility revision `1` is opaque rather than semantic-versioned. Verify documentation parity, architecture, and `corepack pnpm exec biome format --check docs/external-garfex-boundary.md docs/external-client-boundary.md docs/auth-boundary.md docs/architecture.md`. Depends on: WU-10 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing tooling tests for stable root commands, non-writing versus writing generation behavior, TypeSpec no-emit compilation, temporary manifest/materializer comparison, baseline/revision coupling, parity ordering, and protected-path checks. Intended files: `tooling/tests/contract-tooling.test.ts`, `package.json`, `apps/backend/package.json`, and `tooling/typespec-semantic-manifest/package.json`. Verify with `corepack pnpm exec vitest run tooling/tests/contract-tooling.test.ts`; failures must show absent script/dependency wiring rather than silently skip contract checks. Depends on: WU-10 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Add pinned TypeSpec/compiler dependencies and local package scripts in `package.json`, `tooling/typespec-semantic-manifest/package.json`, `apps/backend/package.json` where backend-focused commands are needed, and `pnpm-lock.yaml`; update `tsconfig.base.json`, `tooling/tsconfig.json`, and `apps/backend/tsconfig.json` only where project references/includes are required. Expose `contract:typespec:check` (`tsp compile . --no-emit`), `contract:generate` (the intentional writer), and `contract:check` (clean temporary generation, manifest/schema/parity/baseline/stale checks) and invoke the non-writing contract check from root `check`. Verify `corepack pnpm exec vitest run tooling/tests/contract-tooling.test.ts`, `corepack pnpm contract:typespec:check`, and `corepack pnpm contract:check`. Depends on: WU-11 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Execute the full gates in dependency order: `corepack pnpm contract:typespec:check`, `corepack pnpm contract:check`, `corepack pnpm test`, `corepack pnpm --filter @garfex/backend test`, `corepack pnpm --filter @garfex/backend typecheck`, `corepack pnpm test:architecture`, `corepack pnpm build`, and `corepack pnpm check`; assert CI/check mode leaves committed artifacts unchanged and assert `git diff --name-only -- openspec/changes/persistent-resource-catalog` is empty. Depends on: WU-11 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Make command ordering, temporary-directory cleanup, error reporting, and generated digest comparison deterministic; document the focused and full commands in `docs/external-garfex-boundary.md` and ensure no root command selects a transport, publishes a client, deploys, or changes Resource Master/catalog behavior. Verify one final `corepack pnpm check`, `corepack pnpm build`, and `git diff --name-only -- openspec/changes/persistent-resource-catalog`. Depends on: WU-11 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] Record ordinary repository-policy evidence for each future work unit: focused test command and exact result, runtime harness command/scenario and exact result or explicit `N/A` reason, additions plus deletions changed-line count, start/finish state, and exact rollback boundary before promoting it to the next chain unit; keep receipt-driven development `disabled/unmanaged` unless the user separately enables it later. <!-- sdd-owner: parent -->
- [ ] Before any future PR, verify the dependency diagram and clean diff for the current unit, run the full final gates, and confirm zero edits under `openspec/changes/persistent-resource-catalog/`. <!-- sdd-owner: parent -->

## WU-02 continuation — local emitter and deterministic manifest

- Scope completed: WU-02 only, `Implement the local transport-neutral emitter and deterministic manifest`. WU-03 and later implementation rows were not started.
- Delivery boundary: `auto-chain`, `stacked-to-main`; this is the WU-02 stacked-to-main boundary. No commit, push, PR, release, review actor, receipt, or delivery-gate execution was performed. Receipt-driven development remains `disabled/unmanaged`.
- Workload note: the preserved WU-02 candidate is approximately 1,517 authored/source-test-fixture lines plus a 1,584-line generated manifest. The generated snapshot is excluded from authored review-budget counting but remains part of complete artifact identity. The resolved auto-chain path is retained for this bounded unit.

### Structured status consumed

```yaml
schemaName: gentle-ai.sdd-status
changeName: external-client-contract-resource-master
artifactStore: openspec
authoritative: true
applyState: ready
taskProgress: 9 completed of 47 total rows; WU-01 and WU-02 implementation rows complete
dependencies: { apply: ready, verify: blocked, archive: blocked }
actionContext:
  mode: repo-local
  workspaceRoot: /home/garfex/PROGRAMACION/garfex-platform
  allowedEditRoots: [/home/garfex/PROGRAMACION/garfex-platform]
  warnings: []
nextRecommended: apply
```

The active native attempt was authenticated with the preserved token for WU-02. The review-workload decision was resolved before apply as `Decision needed before apply: No — resolved as stacked-to-main`; `Chained PRs recommended: Yes`, `Chain strategy: stacked-to-main`, and `400-line budget risk: High` remain recorded in `tasks.md`.

### Completed implementation tasks and persisted checkboxes

- [x] WU-02 RED — The preserved partial worktree supplied `emitter.test.ts`, `determinism.test.ts`, and the four controlled emitter fixtures before this continuation's verification. The tests cover `$onEmit`, checker-resolved traversal, `emitFile`, exact metadata, ten-operation uniqueness, canonical order, provenance, transport exclusion, diagnostic rejection, and no partial manifest. The implementation-owned RED row is now visibly `[x]` in `tasks.md`.
- [x] WU-02 GREEN — The local emitter in `tooling/typespec-semantic-manifest/src/index.ts` traverses compiler-resolved semantics, validates the closed operation/model algebra, propagates decorator metadata, canonicalizes the manifest, and writes only through `emitFile`; `tspconfig.yaml` selects no transport emitter. `manifest-model.ts` documents the schema revision, provenance inputs, generated-file boundary, and canonical ordering. The implementation-owned GREEN row is now visibly `[x]` in `tasks.md`.
- [x] WU-02 TRIANGULATE — Clean temporary generations under different timezone and machine environments were byte-identical; reordered semantic arrays canonicalized to the same bytes; diagnostic and unsupported fixtures produced no manifest. The implementation-owned TRIANGULATE row is now visibly `[x]` in `tasks.md`.
- [x] WU-02 REFACTOR — Canonicalization remains independently exported and source/backend independent, with stable LF-terminated JSON serialization and explicit provenance/generation documentation. TypeScript typecheck and the focused determinism suite stayed green after the documentation refactor. The implementation-owned REFACTOR row is now visibly `[x]` in `tasks.md`.

### Files changed or completed in the WU-02 boundary

- `tooling/typespec-semantic-manifest/src/index.ts`
- `tooling/typespec-semantic-manifest/src/manifest-model.ts`
- `tooling/typespec-semantic-manifest/tests/emitter.test.ts`
- `tooling/typespec-semantic-manifest/tests/determinism.test.ts`
- `tooling/typespec-semantic-manifest/tests/support/emit.ts`
- `tooling/typespec-semantic-manifest/tests/fixtures/emitter/`
- `contracts/external-garfex/resource-master/tspconfig.yaml`
- `contracts/external-garfex/resource-master/generated/semantic-manifest.json`
- `openspec/changes/external-client-contract-resource-master/tasks.md`
- `openspec/changes/external-client-contract-resource-master/apply-progress.md`

No backend runtime, Resource Master, Convex, UI, `persistent-resource-catalog`, or WU-03+ path was edited.

### Verification evidence

| Command | Result |
| --- | --- |
| `corepack pnpm exec vitest run tooling/typespec-semantic-manifest/tests/emitter.test.ts tooling/typespec-semantic-manifest/tests/determinism.test.ts` | PASS — 2 files, 10 tests; rerun after the refactor edit. |
| `cd contracts/external-garfex/resource-master && corepack pnpm exec tsp compile . --no-emit` | PASS — TypeSpec compiler v1.15.0, no emitter selected. |
| `cd contracts/external-garfex/resource-master && corepack pnpm exec tsp compile .` | PASS — local semantic emitter generated the committed manifest; SHA-256 remained `32a4d0ea37e9441763d49971c8075d21fa07cc36b0ea69446613098a12b83f53` before and after generation. |
| `corepack pnpm typecheck` | PASS — `tsc --noEmit -p tooling/tsconfig.json`. |
| `git diff --check` | PASS. |
| `git diff --name-only -- openspec/changes/persistent-resource-catalog` | PASS — empty output. |

Runtime harness: `N/A` — WU-02 is a TypeSpec compiler/emitter and generated-artifact boundary; it introduces no application runtime endpoint or harness scenario.

Rollback boundary: revert the WU-02 emitter/model/test/fixture changes and delete `contracts/external-garfex/resource-master/generated/semantic-manifest.json`; retain the TypeSpec authority only if its no-emit gate remains green. WU-01 source and root wiring remain outside this rollback.

### Strict TDD cycle evidence

| Task | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- |
| WU-02 emitter and manifest | Preserved failing test/fixture set was inspected before this continuation; no production edit was made during RED. | Focused emitter tests, no-emit compile, clean generation, and typecheck passed. | Two clean temporary runs varied timezone/machine environment; canonicalized reordered arrays; transport, duplicate, unsupported, and recursive fixtures rejected without manifest output. | Added manifest-model documentation for schema/provenance/order/generated boundary; focused tests, no-emit compile, generation hash, and typecheck remained green. |

### Deviations and risks

- No design or scope deviation was introduced.
- The initial native status and active-attempt token were consumed; the token was reused rather than reset after the timeout.
- The preserved candidate's authored line volume is above the original per-unit estimate, but the parent-provided `auto-chain`/`stacked-to-main` delivery path authorizes this assigned WU-02 slice. No WU-03 work was used to reduce or expand this boundary.
- The earlier cumulative remaining-task list was updated so the four WU-02 rows are checked. Its exact unchecked `- [ ]` lines remain for WU-03 onward and the two deferred parent lifecycle actions; the first unchecked implementation row is WU-03 RED.

Next recommended action: `parent-lifecycle` after this apply slice. Final verify remains blocked until all implementation rows are complete and parent lifecycle evidence is reconciled; no review or receipt was created by sdd-apply.

## WU-03 continuation — manifest-only materializers and consumer semantics

### Phase envelope

- Change: `external-client-contract-resource-master`.
- Apply scope: WU-03 only — `Materialize runtime schema data and transport-neutral consumer semantics`.
- Work-unit boundary: pure manifest materializers, deterministic generated runtime schema data, standalone generated consumer Markdown, digest/metadata provenance, and non-writing stale/manual-divergence checks.
- Delivery: `auto-chain`, `stacked-to-main`; current PR boundary is WU-03 stacked to the completed WU-02 slice.
- Receipt-driven development: `disabled/unmanaged`; no review actor, receipt, commit, push, PR, release, or delivery gate was started.
- WU-04 and later work units were not started.

### Structured status consumed and produced

```yaml
schemaName: gentle-ai.sdd-status
changeName: external-client-contract-resource-master
artifactStore: openspec
authoritative: true
applyState: ready
taskProgress:
  total: 47
  completed: 13
  remaining: 34
  unchecked: "WU-04 through WU-11 implementation rows plus two parent lifecycle rows"
dependencies: { apply: ready, verify: blocked, archive: blocked }
actionContext:
  mode: repo-local
  workspaceRoot: /home/garfex/PROGRAMACION/garfex-platform
  allowedEditRoots: [/home/garfex/PROGRAMACION/garfex-platform]
  warnings: []
nextRecommended: parent-lifecycle
reviewWorkload:
  decisionNeededBeforeApply: false
  chainedPRsRecommended: true
  chainStrategy: stacked-to-main
  budgetRisk: high
```

The native status was authoritative and ready. The parent-provided delivery decision resolved the high-workload gate as `auto-chain` / `stacked-to-main`. The active WU-03 attempt token was authenticated with the parent token and the bounded acquire returned `proceed`; no reset or second attempt was created. All edits stayed inside the allowed workspace root.

### Completed implementation tasks and persisted checkbox updates

- [x] WU-03 RED — Added `materializers.test.ts`, `stale-artifacts.test.ts`, and controlled materializer fixtures before adding materializer production code. The focused run failed as required because the three materializer modules did not yet exist: two suites loaded zero tests and reported missing `materialize-docs.js` / `materialize.js` modules. The persisted RED row in `tasks.md` is visibly `[x]`.
- [x] WU-03 GREEN — Added pure manifest-only materializers and generated `semantic-contract.generated.ts` plus `resource-master-external-contract.md`. The runtime embedding exposes exact identity/revision, schema data, digest, `as const` readonly data, and type aliases; the Markdown starts with `Contract identity and compatibility`, renders all ten workflows, public UI-supporting metadata, safe failures, and exact opaque metadata guidance. The persisted GREEN row in `tasks.md` is visibly `[x]`.
- [x] WU-03 TRIANGULATE — Added byte-level committed-output comparison and temporary mutation cases for omission, digest, operation entries, model fields, error codes, metadata allowances, identity/revision, stale manifest bytes, provenance, and prohibited authority/platform/delivery terms. The suite passed 15 tests after an intentional intermediate RED for new `actorId`/role/token/provider and delivery-word leakage cases. Existing documentation parity also passed. The persisted TRIANGULATE row in `tasks.md` is visibly `[x]`.
- [x] WU-03 REFACTOR — Centralized canonical LF output, manifest digesting, safe-content screening, metadata checks, and stale/manual-divergence classification in `materialize-common.ts`; kept runtime/docs functions as manifest-only consumers and removed semantic operation/error/metadata lists from materializer logic. Focused tests, typecheck, and formatting remained green. The persisted REFACTOR row in `tasks.md` is visibly `[x]`.

### Files changed in the WU-03 boundary

- `tooling/typespec-semantic-manifest/src/materialize-common.ts`
- `tooling/typespec-semantic-manifest/src/materialize-runtime.ts`
- `tooling/typespec-semantic-manifest/src/materialize-docs.ts`
- `tooling/typespec-semantic-manifest/src/materialize.ts`
- `tooling/typespec-semantic-manifest/tests/materializers.test.ts`
- `tooling/typespec-semantic-manifest/tests/stale-artifacts.test.ts`
- `tooling/typespec-semantic-manifest/tests/fixtures/materializers/hand-edited-runtime.ts`
- `tooling/typespec-semantic-manifest/tests/fixtures/materializers/leaked-documentation.md`
- `apps/backend/src/external-garfex-boundary/client-facing/generated/semantic-contract.generated.ts`
- `docs/generated/resource-master-external-contract.md`
- `openspec/changes/external-client-contract-resource-master/tasks.md`
- `openspec/changes/external-client-contract-resource-master/apply-progress.md`

The generated runtime file is 1,611 LF-terminated lines and the generated Markdown is 571 LF-terminated lines. Both carry the manifest digest `sha256:32a4d0ea37e9441763d49971c8075d21fa07cc36b0ea69446613098a12b83f53`; no TypeSpec, backend, Resource Master, Convex, UI, transport, or protected `persistent-resource-catalog` implementation path was changed for WU-03.

### Strict TDD cycle evidence

| Task | Test file / layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- |
| WU-03 RED | `tooling/typespec-semantic-manifest/tests/materializers.test.ts`, `stale-artifacts.test.ts` / pure materializer contract tests | N/A — new test files and new materializer boundary | PASS evidence: 2 suites failed before implementation with missing modules | N/A at RED gate | N/A at RED gate | N/A at RED gate |
| WU-03 GREEN | same focused unit suite | N/A — new production modules | Preserved failing imports | PASS — 2 files, 8 tests | N/A at GREEN gate | N/A at GREEN gate |
| WU-03 TRIANGULATE | same suite plus `apps/backend/tests/external-garfex-documentation-parity.test.ts` | PASS — WU-02 emitter/determinism safety net, 2 files/10 tests | PASS — added mutation assertions before their screening support | PASS — 2 files, 15 tests; documentation parity 1 file, 2 tests | PASS — temporary artifact mutations, exact metadata, digest, provenance, and prohibited-content cases | N/A until refactor |
| WU-03 REFACTOR | focused unit suite and tooling typecheck | PASS — 2 files, 15 tests before formatting cleanup | Preserved prior RED evidence | PASS — 2 files, 15 tests after cleanup | PASS — committed generated bytes still matched the manifest | PASS — `corepack pnpm typecheck`; `biome format` reported no fixes |

### Verification evidence

| Command | Result |
| --- | --- |
| `corepack pnpm exec vitest run tooling/typespec-semantic-manifest/tests/materializers.test.ts tooling/typespec-semantic-manifest/tests/stale-artifacts.test.ts` | PASS — 2 files, 15 tests after final refactor. |
| `corepack pnpm exec vitest run apps/backend/tests/external-garfex-documentation-parity.test.ts` | PASS — 1 file, 2 tests. |
| `corepack pnpm exec vitest run tooling/typespec-semantic-manifest/tests/emitter.test.ts tooling/typespec-semantic-manifest/tests/determinism.test.ts` | PASS — 2 files, 10 tests; WU-02 safety net remained green. |
| `corepack pnpm typecheck` | PASS — tooling TypeScript project. |
| `corepack pnpm --filter @garfex/backend typecheck` | PASS — backend TypeScript project including the generated runtime embedding. |
| `corepack pnpm test` | PASS — 23 files, 261 tests; coverage 92.84% statements / 84.58% branches / 99.28% functions / 94.42% lines. |
| `corepack pnpm exec biome format tooling/typespec-semantic-manifest/src/materialize-common.ts tooling/typespec-semantic-manifest/src/materialize-runtime.ts tooling/typespec-semantic-manifest/src/materialize-docs.ts tooling/typespec-semantic-manifest/src/materialize.ts tooling/typespec-semantic-manifest/tests/materializers.test.ts tooling/typespec-semantic-manifest/tests/stale-artifacts.test.ts` | PASS — six files checked with no fixes after the final formatting write. |
| `git diff --check` | PASS. |
| `git diff --name-only -- openspec/changes/persistent-resource-catalog` | PASS — empty output; protected change remains untouched. |
| `codegraph status` | PASS — index up to date after edits. |

Runtime harness: `N/A` — WU-03 adds deterministic tooling/materialization and committed semantic artifacts, not an application runtime or network boundary.

Rollback boundary: remove `materialize-common.ts`, `materialize-runtime.ts`, `materialize-docs.ts`, `materialize.ts`, their WU-03 tests/fixtures, and the two generated outputs. Keep the WU-01 TypeSpec authority and WU-02 manifest/emitter gate intact; do not alter Resource Master, runtime handlers, Convex infrastructure, UI, transport, or `persistent-resource-catalog`.

### Deviations and risks

- The design's two named materializer modules were supplemented by `materialize-common.ts` and `materialize.ts` so both pure consumers share one canonical LF writer, manifest digest, metadata check, and non-writing comparison API. This is a mechanical file-splitting refinement; the manifest remains the only input authority.
- The repository Biome CLI does not accept the requested `--check` flag in this installation. The equivalent repository-supported check was run as `corepack pnpm exec biome format ...` after `--write`; it reported no fixes. No production behavior depends on the CLI spelling.
- The standalone generated Markdown intentionally avoids backend, authority, platform, and transport vocabulary while still exposing business input, public metadata, closed safe failures, and exact opaque identity/revision guidance.
- The generated TypeScript is committed downstream data only and is not wired into the handwritten runtime façade; that integration belongs to WU-05 and was not started.
- No WU-04 comparator, baseline, review, receipt, commit, PR, push, release, or delivery gate was started.

### Remaining implementation and parent-owned tasks

The following unchecked `- [ ]` lines are copied byte-for-byte from the persisted `tasks.md` artifact after WU-03 completion:

- [ ] RED — Add failing table-driven comparator tests for operation additions/removals/renames, request and success shape changes, requiredness/nullability, enum/union membership, constraints, metadata applicability, error changes, unknown differences, provenance-only changes, unchanged revision silent breaks, revision changes without approved break evidence, and identity changes without replacement-lineage intent. Intended files: `tooling/typespec-semantic-manifest/tests/compare.test.ts`, `tooling/typespec-semantic-manifest/tests/fixtures/compare/`, and `apps/backend/tests/external-garfex-compatibility.test.ts`. Verify with `corepack pnpm exec vitest run tooling/typespec-semantic-manifest/tests/compare.test.ts apps/backend/tests/external-garfex-compatibility.test.ts`; the comparator assertions must fail before implementation. Depends on: WU-03 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Implement `tooling/typespec-semantic-manifest/src/compare.ts` and commit `contracts/external-garfex/resource-master/baseline/accepted-semantic-manifest.json` from the first reviewed manifest, with exact identity and opaque revision `1`; update `apps/backend/tests/fixtures/external-garfex-boundary/compatibility.json` and its test to consume manifest-driven operation/error coverage while retaining JSON as semantic evidence only. Support temporary approved-break fixtures containing `migration-intent.md`, but do not add migration intent to the initial unchanged baseline. Verify comparator tests, fixture parity, and zero semantic difference between the accepted baseline and the initial manifest. Depends on: WU-04 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Prove all coupling rules: a breaking shape with unchanged revision fails as a silent break; a changed revision without comparator break output and migration intent fails; an approved breaking shape with deliberate revision and `migration-intent.md` passes; an identity change additionally requires replacement-lineage intent; compiler/emitter/module/package/deployment provenance changes never mutate external identity or revision. Verify with `corepack pnpm exec vitest run tooling/typespec-semantic-manifest/tests/compare.test.ts apps/backend/tests/external-garfex-compatibility.test.ts`. Depends on: WU-04 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Centralize canonical structural paths and stable difference categories (`breaking`, `additive`, `documentation`, `tooling-provenance`), classify closed success/error widening conservatively, and make unknown differences breaking by default without selecting semantic-version ordering or a compatibility window. Verify focused comparator tests and `corepack pnpm exec vitest run apps/backend/tests/external-garfex-compatibility.test.ts`. Depends on: WU-04 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing runtime tests that require `contract.ts` to expose generated readonly metadata/types, require validators to accept/reject based on manifest semantics, and reject any handwritten operation/model/error list that diverges from the generated embedding. Intended files: `apps/backend/tests/external-garfex-generated-runtime.test.ts`, `apps/backend/tests/external-garfex-contract.test.ts`, and `apps/backend/src/external-garfex-boundary/client-facing/generated/semantic-contract.generated.ts`. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-generated-runtime.test.ts tests/external-garfex-contract.test.ts`; failures must show the current façade is independently authoritative. Depends on: WU-04 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Replace independent shape declarations in `apps/backend/src/external-garfex-boundary/client-facing/contract.ts` with a small stable façade over `generated/semantic-contract.generated.ts`, and refactor `client-facing/validation.ts` to interpret the generated closed schema algebra while retaining named request/success/failure wrapper exports. Rebuild closed objects field by field, preserve omitted optionals, fail closed, and validate projected success and normalized error values. Verify `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-generated-runtime.test.ts tests/external-garfex-contract.test.ts` and `corepack pnpm --filter @garfex/backend typecheck`. Depends on: WU-05 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Extend `apps/backend/tests/external-garfex-contract.test.ts` and `apps/backend/tests/external-garfex-generated-runtime.test.ts` for null prototypes, symbols, accessors/getters that throw, sparse or extended arrays, hostile attribute keys, prototype-pollution names, every closed enum/union/constraint, malformed output, unknown failure metadata, and the invariant that invalid projected values become metadata-free `INTERNAL_FAILURE`. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-contract.test.ts tests/external-garfex-generated-runtime.test.ts tests/external-garfex-compatibility.test.ts`. Depends on: WU-05 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Keep generated data as the only source of fields, requiredness, enum members, unions, nullability, and bounds; keep security policy in a total interpreter with explicit TypeScript types, no spreads/casts/pass-through, and no backend or Convex imports in client-facing files. Verify `corepack pnpm --filter @garfex/backend typecheck` and the focused runtime tests. Depends on: WU-05 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing composition and read-operation tests for `getTaxonomy`, `getEffectiveResourceSchema`, `getValidOptions`, `getNaturalUnits`, `getResource`, `searchResources`, and `describeResource`: validation before authentication, fresh trusted actor state, one matching module call, explicit input rebuilding, field-by-field output projection, no generic dispatch, and no handler-authentication responsibility. Intended files: `apps/backend/tests/external-garfex-composition.test.ts`, `apps/backend/tests/external-garfex-operations.test.ts`, and the not-yet-created `apps/backend/src/external-garfex-boundary/composition.ts`. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-composition.test.ts tests/external-garfex-operations.test.ts`; failures must identify the absent composition boundary. Depends on: WU-05 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Add `apps/backend/src/external-garfex-boundary/composition.ts` with seven statically named composed entry functions and refactor `trusted/read-operations.ts` and `trusted/identity.ts` so `handleGetTaxonomy`, `handleGetEffectiveResourceSchema`, `handleGetValidOptions`, `handleGetNaturalUnits`, `handleGetResource`, `handleSearchResources`, and `handleDescribeResource` accept validated business input plus fresh actor state and only `resource-master/public.ts`. Keep explicit projector functions in `trusted/projections.ts` (`projectExternalGetTaxonomy`, `projectExternalGetEffectiveResourceSchema`, `projectExternalGetValidOptions`, `projectExternalGetNaturalUnits`, `projectExternalGetResource`, `projectExternalSearchResources`, `projectExternalDescribeResource`). Verify focused composition/operation tests and `corepack pnpm --filter @garfex/backend typecheck`. Depends on: WU-06 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Exercise every read operation with malformed authority-like input, absent authentication, unknown operation identifiers, omitted and supplied search optionals, extra internal result fields, invalid projected results, thrown invocation values, and Resource Master denial before catalog/repository work. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-composition.test.ts tests/external-garfex-operations.test.ts tests/external-garfex-security.test.ts` and `corepack pnpm test:architecture`. Depends on: WU-06 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Keep composition responsible for validation/authentication/actor construction/outcome validation and keep read handlers responsible only for their named mapping, projection, and normalization boundary; preserve stable `invokeExternal...` exports only as explicit wrappers, never as a dynamic registry or operation executor. Verify the focused tests and `corepack pnpm --filter @garfex/backend typecheck`. Depends on: WU-06 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing tests for `createResource`, `updateNonIdentityData`, and `deactivateResource` that require one matching public module method, deep-fresh input reconstruction, no client authority, field-by-field resource projection, exact capability evidence, and no downstream work when Resource Master denies. Intended files: `apps/backend/tests/external-garfex-operations.test.ts`, `apps/backend/tests/external-garfex-security.test.ts`, and `apps/backend/tests/external-garfex-composition.test.ts`. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-operations.test.ts tests/external-garfex-security.test.ts tests/external-garfex-composition.test.ts`; failures must expose the missing mutation composition/handler split. Depends on: WU-06 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Refactor `apps/backend/src/external-garfex-boundary/trusted/mutation-operations.ts`, `trusted/projections.ts`, and `composition.ts` to provide `handleCreateResource`, `handleUpdateNonIdentityData`, and `handleDeactivateResource` with explicit request mappers and `projectExternalCreateResource`, `projectExternalUpdateNonIdentityData`, and `projectExternalDeactivateResource`. Add a compile-time mapping evidence object that enumerates exactly the ten names without callable generic dispatch, and preserve Resource Master as the only owner of `resource:create`, `resource:update-non-identity`, and `resource:deactivate` checks. Verify focused mutation/security tests, `corepack pnpm --filter @garfex/backend typecheck`, and `corepack pnpm test:architecture`. Depends on: WU-07 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Run table-driven evidence for all ten operations, including a test-only extra Resource Master method that remains absent from TypeSpec and mapping evidence; forge actor/role/capability/claim/token/session/provider fields; test missing and neighboring capabilities; assert Resource Master returns `FORBIDDEN` before catalog, repository, persistence, or Convex work. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-operations.test.ts tests/external-garfex-security.test.ts tests/external-garfex-compatibility.test.ts`. Depends on: WU-07 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Remove accidental shared forwarding and retain explicit nested rebuilds for `createResource.attributes`, omitted search values, mutation revisions, and every success value; keep all handlers dependent only on generated client-facing types and `resource-master/public.ts`. Verify `corepack pnpm --filter @garfex/backend typecheck`, focused operation/security tests, and a clean architecture check. Depends on: WU-07 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing normalization tests for all eleven external codes, every Resource Master failure code, valid and malformed `fieldIssues`, `existingResourceId`, and `currentRevision`, catalog unavailable/uninitialized coarsening, integrity/invalid-catalog/internal/unknown/malformed/thrown failures, projection and response-validation failures, diagnostic sink exceptions, and the invariant that a known failure can never become success. Intended files: `apps/backend/tests/external-garfex-error-normalization.test.ts`, `apps/backend/tests/external-garfex-security.test.ts`, and `apps/backend/src/external-garfex-boundary/trusted/errors.ts`. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-error-normalization.test.ts tests/external-garfex-security.test.ts`; failures must cover behavior not yet generalized by the implementation. Depends on: WU-07 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Implement the exhaustive normalizer in `apps/backend/src/external-garfex-boundary/trusted/errors.ts` and connect it through read/mutation/composition outcome handling. Map validation to `VALIDATION_FAILED`, catalog unavailable/uninitialized to `CATALOG_UNAVAILABLE`, and unsafe/unknown/invalid-output/thrown results to metadata-free `INTERNAL_FAILURE`; expose only applicable validated allowlisted metadata and retain operation/phase/cause through a server-only diagnostics callback. Verify focused error/security tests and `corepack pnpm --filter @garfex/backend typecheck`. Depends on: WU-08 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Use hostile getters, proxies, symbols, extra properties, invalid metadata types, internal messages/stacks/provider/Convex/catalog details, thrown authentication/invocation/projection values, and a throwing diagnostics sink across representative and all ten operation paths; assert exactly one validated safe outcome and never a success after a known failure. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-error-normalization.test.ts tests/external-garfex-security.test.ts tests/external-garfex-contract.test.ts`. Depends on: WU-08 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Keep the Resource Master error switch exhaustive with a `never` check, isolate safe metadata validators, make diagnostic failure unable to affect outcomes, and ensure error validation remains generated-manifest-driven rather than a second code list. Verify focused error tests, `corepack pnpm --filter @garfex/backend typecheck`, and `corepack pnpm test:architecture`. Depends on: WU-08 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing architecture tests and controlled fixtures for TypeSpec independence, no authority fields, no platform/Convex/persistence leakage, no transport decorator/emitter/framing, no generic executor, no automatic derivation/publication, public-only trusted handlers, exact named mappings, final authorization evidence, stale provenance, and hard-coded/missing/duplicate metadata. Intended files: `tooling/tests/architecture.test.ts`, `tooling/architecture-fixtures/valid/external-garfex-boundary/{contracts/main.tsp,config/tspconfig.yaml,artifacts/semantic-manifest.json,client-facing/generated-contract.ts,trusted/named-mappings.ts,docs/contract.md}`, and focused violations under `tooling/architecture-fixtures/violations/external-garfex-boundary/{contracts,config,artifacts,client-facing,trusted,docs}/`. Verify with `corepack pnpm exec vitest run tooling/tests/architecture.test.ts`; new named-rule assertions must fail before checker support exists. Depends on: WU-08 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Extend `tooling/architecture/check.mjs` to inspect `.tsp`, TypeSpec configuration, manifest/baseline/generated TypeScript/generated Markdown, named mapping evidence, and canonical docs; add named diagnostics for transport, authority, internal derivation, platform leakage, generic execution, automatic publication, stale metadata/provenance, missing final authorization, and missing exact-ten parity. Keep existing dependency-cruiser and backend rules unchanged. Verify `corepack pnpm exec vitest run tooling/tests/architecture.test.ts`, `corepack pnpm test:architecture`, and a passing targeted valid fixture check. Depends on: WU-09 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Run every focused violation individually and assert exactly its intended rule, run the valid external boundary fixture, run the full violation fixture set, and assert architecture inspection never traverses or edits `openspec/changes/persistent-resource-catalog/` or any external counterpart repository. Verify with `corepack pnpm exec vitest run tooling/tests/architecture.test.ts`, `node tooling/architecture/check.mjs tooling/architecture-fixtures/valid/external-garfex-boundary`, and `node tooling/architecture/check.mjs tooling/architecture-fixtures/violations/external-garfex-boundary`. Depends on: WU-09 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Centralize path classification and exact rule diagnostics, preserve configuration-error exit `2` versus architecture-violation exit `1`, and ensure generated/docs scans reject drift without treating manifest JSON as a selected transport. Verify `corepack pnpm test:architecture` and `corepack pnpm exec biome format --check tooling/architecture/check.mjs tooling/tests/architecture.test.ts`. Depends on: WU-09 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Extend documentation parity tests to require the TypeSpec identity/revision section, exact ten operation/mapping/capability rows, exact eleven error/metadata rows, three-boundary ownership, stale/breaking gate links, Convex encapsulation, and every transport/auth-provider/UI/publication/version-policy non-decision. Intended files: `apps/backend/tests/external-garfex-documentation-parity.test.ts`, `tooling/typespec-semantic-manifest/tests/documentation-parity.test.ts`, and `docs/generated/resource-master-external-contract.md`. Verify with `corepack pnpm exec vitest run apps/backend/tests/external-garfex-documentation-parity.test.ts tooling/typespec-semantic-manifest/tests/documentation-parity.test.ts`; assertions must fail until canonical records are updated. Depends on: WU-09 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Update `docs/external-garfex-boundary.md`, `docs/external-client-boundary.md`, `docs/auth-boundary.md`, and `docs/architecture.md` to identify TypeSpec as the GARFEX-owned external semantic authority, link `contracts/external-garfex/resource-master/`, manifest, baseline, generated consumer semantics, and gates, and distinguish trusted fresh actor construction, named handlers, final Resource Master authorization, explicit projections, safe errors, and private Convex infrastructure. Keep detailed consumer shapes in `docs/generated/resource-master-external-contract.md`; do not add routes, verbs, statuses, headers, serialization, SDK, deployment, UI, or productive identity claims. Verify the focused documentation tests and `corepack pnpm exec biome format --check docs/external-garfex-boundary.md docs/external-client-boundary.md docs/auth-boundary.md docs/architecture.md docs/generated/resource-master-external-contract.md`. Depends on: WU-10 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Parse all canonical and generated documents as a standalone consumer/reviewer would: assert exact opaque comparison guidance, no backend knowledge requirement for business workflows, cross-links between all four records, no internal identifiers/diagnostics, no HTTP implication, and parity with manifest, baseline, fixture, and mapping evidence. Verify with `corepack pnpm exec vitest run apps/backend/tests/external-garfex-documentation-parity.test.ts tooling/typespec-semantic-manifest/tests/documentation-parity.test.ts` and `corepack pnpm test:architecture`. Depends on: WU-10 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Lead each document with its decision and quick path, use generated tables instead of duplicated handwritten semantic lists, retain ADR-style ownership and non-decision links, and make wording explicit that compatibility revision `1` is opaque rather than semantic-versioned. Verify documentation parity, architecture, and `corepack pnpm exec biome format --check docs/external-garfex-boundary.md docs/external-client-boundary.md docs/auth-boundary.md docs/architecture.md`. Depends on: WU-10 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing tooling tests for stable root commands, non-writing versus writing generation behavior, TypeSpec no-emit compilation, temporary manifest/materializer comparison, baseline/revision coupling, parity ordering, and protected-path checks. Intended files: `tooling/tests/contract-tooling.test.ts`, `package.json`, `apps/backend/package.json`, and `tooling/typespec-semantic-manifest/package.json`. Verify with `corepack pnpm exec vitest run tooling/tests/contract-tooling.test.ts`; failures must show absent script/dependency wiring rather than silently skip contract checks. Depends on: WU-10 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Add pinned TypeSpec/compiler dependencies and local package scripts in `package.json`, `tooling/typespec-semantic-manifest/package.json`, `apps/backend/package.json` where backend-focused commands are needed, and `pnpm-lock.yaml`; update `tsconfig.base.json`, `tooling/tsconfig.json`, and `apps/backend/tsconfig.json` only where project references/includes are required. Expose `contract:typespec:check` (`tsp compile . --no-emit`), `contract:generate` (the intentional writer), and `contract:check` (clean temporary generation, manifest/schema/parity/baseline/stale checks) and invoke the non-writing contract check from root `check`. Verify `corepack pnpm exec vitest run tooling/tests/contract-tooling.test.ts`, `corepack pnpm contract:typespec:check`, and `corepack pnpm contract:check`. Depends on: WU-11 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Execute the full gates in dependency order: `corepack pnpm contract:typespec:check`, `corepack pnpm contract:check`, `corepack pnpm test`, `corepack pnpm --filter @garfex/backend test`, `corepack pnpm --filter @garfex/backend typecheck`, `corepack pnpm test:architecture`, `corepack pnpm build`, and `corepack pnpm check`; assert CI/check mode leaves committed artifacts unchanged and assert `git diff --name-only -- openspec/changes/persistent-resource-catalog` is empty. Depends on: WU-11 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Make command ordering, temporary-directory cleanup, error reporting, and generated digest comparison deterministic; document the focused and full commands in `docs/external-garfex-boundary.md` and ensure no root command selects a transport, publishes a client, deploys, or changes Resource Master/catalog behavior. Verify one final `corepack pnpm check`, `corepack pnpm build`, and `git diff --name-only -- openspec/changes/persistent-resource-catalog`. Depends on: WU-11 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] Record ordinary repository-policy evidence for each future work unit: focused test command and exact result, runtime harness command/scenario and exact result or explicit `N/A` reason, additions plus deletions changed-line count, start/finish state, and exact rollback boundary before promoting it to the next chain unit; keep receipt-driven development `disabled/unmanaged` unless the user separately enables it later. <!-- sdd-owner: parent -->
- [ ] Before any future PR, verify the dependency diagram and clean diff for the current unit, run the full final gates, and confirm zero edits under `openspec/changes/persistent-resource-catalog/`. <!-- sdd-owner: parent -->

Next recommended action: `parent-lifecycle`. Final verify remains blocked until all implementation rows are complete and parent-owned lifecycle evidence is reconciled; sdd-apply performed no review or delivery validation.

## WU-04 continuation — accepted baseline and conservative compatibility comparator

### Phase envelope

- Change: `external-client-contract-resource-master`.
- Apply scope: WU-04 only — `Add the accepted baseline and conservative compatibility comparator`.
- Work-unit boundary: comparator coupling rules, accepted baseline governance, manifest-driven semantic compatibility evidence, and safe comparator refactoring.
- Delivery: `auto-chain`, `stacked-to-main`; current PR boundary is WU-04 stacked to the completed WU-03 slice.
- Receipt-driven development: `disabled/unmanaged`; no review actor, receipt, commit, push, PR, release, or delivery gate was started.
- Protected scope: `openspec/changes/persistent-resource-catalog/` remains untouched. WU-05 and later implementation rows were not edited.

### Structured status consumed and action context

```yaml
schemaName: gentle-ai.sdd-status
changeName: external-client-contract-resource-master
artifactStore: openspec
authoritative: true
applyState: ready
taskProgress:
  before: 15 completed of 47 total rows
  after: 17 completed of 47 total rows
dependencies: { apply: ready, verify: blocked, archive: blocked }
actionContext:
  mode: repo-local
  workspaceRoot: /home/garfex/PROGRAMACION/garfex-platform
  allowedEditRoots: [/home/garfex/PROGRAMACION/garfex-platform]
  warnings: []
nextRecommended: apply
reviewWorkload:
  decisionNeededBeforeApply: false
  chainedPRsRecommended: true
  chainStrategy: stacked-to-main
  budgetRisk: high
```

The native status was consumed as authoritative for the OpenSpec worktree. The active parent attempt token was authenticated with `sdd-attempt acquire`; no reset was used. The high-workload decision was already resolved as `auto-chain` / `stacked-to-main`, so this continuation stayed within the WU-04 boundary. The native status remains `applyState: ready` because WU-05 through WU-11 implementation rows remain unchecked; this phase does not recommend applying WU-05.

### Completed implementation tasks and persisted checkbox updates

- [x] WU-04 RED — Preserved table-driven comparator assertions were inspected as the required failing-first evidence; the matrix covers operation additions/removals/renames, request/success shape and requiredness/nullability changes, enum/union membership, constraints, metadata applicability, error changes, unknown differences, provenance-only changes, silent breaks, revision misuse, and identity-lineage intent.
- [x] WU-04 GREEN — `compare.ts`, the accepted baseline, and manifest-driven backend compatibility fixture/test were preserved and verified. The baseline is byte-identical to the generated manifest with identity `garfex.resource-master.external-client-contract` and opaque compatibility revision `1`; the fixture remains semantic evidence and does not select a transport.
- [x] WU-04 TRIANGULATE — Focused coupling evidence passed for unchanged-revision silent breaks, changed revision without breaking evidence, changed revision without migration intent, approved breaking revision with migration intent, identity changes requiring replacement-lineage intent, and compiler/deployment/unknown provenance differences that leave external identity and revision unchanged. Added regression evidence that named reference redirection is breaking even when the replacement shape is equivalent.
- [x] WU-04 REFACTOR — Centralized presence/change-kind and manifest metadata helpers, canonical root keys, property-addition messages, named-reference path reporting, nullable/type-kind comparison, constraint comparison, auxiliary-field comparison, and structured-key classification. Removed all targeted `noNestedTernary` and `noExcessiveCognitiveComplexity` diagnostics from `compare.ts` without changing compatibility categories or opaque revision policy. Organized imports and retained deterministic category/path ordering.

The persisted OpenSpec task checkboxes for WU-04 TRIANGULATE and REFACTOR are visibly `[x]` in `tasks.md` after the final green verification.

### Files changed in the WU-04 boundary

- `tooling/typespec-semantic-manifest/src/compare.ts`
- `tooling/typespec-semantic-manifest/tests/compare.test.ts`
- `contracts/external-garfex/resource-master/baseline/accepted-semantic-manifest.json`
- `apps/backend/tests/fixtures/external-garfex-boundary/compatibility.json`
- `apps/backend/tests/external-garfex-compatibility.test.ts`
- `openspec/changes/external-client-contract-resource-master/tasks.md`
- `openspec/changes/external-client-contract-resource-master/apply-progress.md`

No WU-05+ implementation source, Resource Master, Convex, UI, transport, version syntax, `persistent-resource-catalog`, commit, push, PR, release, review, or receipt artifact was added by this continuation.

### Verification evidence

| Command | Result |
| --- | --- |
| `corepack pnpm exec vitest run tooling/typespec-semantic-manifest/tests/compare.test.ts apps/backend/tests/external-garfex-compatibility.test.ts` | PASS — 2 files, 44 tests after the comparator refactor and named-reference regression case. |
| `corepack pnpm test` | PASS — 24 files, 292 tests; coverage 90.62% statements, 81.75% branches, 96.78% functions, 92.24% lines. |
| `corepack pnpm typecheck` | PASS — tooling TypeScript project. |
| `corepack pnpm --filter @garfex/backend typecheck` | PASS — backend TypeScript project. |
| `corepack pnpm exec biome lint --only=lint/style/noNestedTernary --only=lint/complexity/noExcessiveCognitiveComplexity tooling/typespec-semantic-manifest/src/compare.ts` | PASS — no targeted nested-ternary or excessive-complexity diagnostics. |
| `corepack pnpm exec biome check tooling/typespec-semantic-manifest/src/compare.ts tooling/typespec-semantic-manifest/tests/compare.test.ts apps/backend/tests/external-garfex-compatibility.test.ts` | PASS — no formatting, import, or recommended-lint diagnostics. |
| `git diff --check` | PASS. |
| `git diff --name-only -- openspec/changes/persistent-resource-catalog` | PASS — empty output; protected change remains untouched. |

Runtime harness: `N/A` — WU-04 changes deterministic compatibility tooling and semantic evidence only; no application runtime or network boundary was introduced.

Rollback boundary: restore the pre-WU-04 compatibility fixture and remove `tooling/typespec-semantic-manifest/src/compare.ts`, its comparator tests, and `contracts/external-garfex/resource-master/baseline/accepted-semantic-manifest.json`; retain WU-01 TypeSpec authority, WU-02 manifest/emitter, and WU-03 materializer outputs. Do not alter runtime authorization, handler behavior, Resource Master, Convex, UI, transport, or the protected catalog.

### Strict TDD cycle evidence

| Task | Test layer | Safety net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- |
| WU-04 comparator and baseline | Comparator unit tests plus backend manifest/fixture compatibility integration | PASS — preserved WU-03 root suite and manifest/materializer evidence | Preserved checked RED matrix was inspected before implementation; no refactor edit was made during RED | PASS — comparator, baseline parity, fixture parity, and initial zero-difference evidence | PASS — 44 focused tests cover coupling rules, all listed semantic categories, provenance isolation, and named-reference redirection | PASS — helper extraction and structural path centralization kept focused tests, full root tests, typechecks, formatting, and targeted lint green |

### Deviations and risks

- The comparator refactor added one conservative breaking difference for a named semantic reference redirection; equivalent replacement definitions now cannot silently bypass a reviewed contract change. Existing category behavior and the opaque revision policy remain unchanged.
- The repository's Biome CLI supports `biome format <paths>` for the no-fix check rather than the unsupported `biome format --check <paths>` spelling; the supported command and `biome check` both passed.
- The overall change remains high workload and incomplete. WU-05 through WU-11 implementation rows remain unchecked, and parent-owned lifecycle rows remain deferred. No review or delivery validation was performed.

### Remaining implementation and parent-owned tasks

The following exact unchecked implementation and parent-owned lines remain in the persisted `tasks.md` artifact after WU-04 completion:

- [ ] RED — Add failing runtime tests that require `contract.ts` to expose generated readonly metadata/types, require validators to accept/reject based on manifest semantics, and reject any handwritten operation/model/error list that diverges from the generated embedding. Intended files: `apps/backend/tests/external-garfex-generated-runtime.test.ts`, `apps/backend/tests/external-garfex-contract.test.ts`, and `apps/backend/src/external-garfex-boundary/client-facing/generated/semantic-contract.generated.ts`. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-generated-runtime.test.ts tests/external-garfex-contract.test.ts`; failures must show the current façade is independently authoritative. Depends on: WU-04 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Replace independent shape declarations in `apps/backend/src/external-garfex-boundary/client-facing/contract.ts` with a small stable façade over `generated/semantic-contract.generated.ts`, and refactor `client-facing/validation.ts` to interpret the generated closed schema algebra while retaining named request/success/failure wrapper exports. Rebuild closed objects field by field, preserve omitted optionals, fail closed, and validate projected success and normalized error values. Verify `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-generated-runtime.test.ts tests/external-garfex-contract.test.ts` and `corepack pnpm --filter @garfex/backend typecheck`. Depends on: WU-05 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Extend `apps/backend/tests/external-garfex-contract.test.ts` and `apps/backend/tests/external-garfex-generated-runtime.test.ts` for null prototypes, symbols, accessors/getters that throw, sparse or extended arrays, hostile attribute keys, prototype-pollution names, every closed enum/union/constraint, malformed output, unknown failure metadata, and the invariant that invalid projected values become metadata-free `INTERNAL_FAILURE`. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-contract.test.ts tests/external-garfex-generated-runtime.test.ts tests/external-garfex-compatibility.test.ts`. Depends on: WU-05 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Keep generated data as the only source of fields, requiredness, enum members, unions, nullability, and bounds; keep security policy in a total interpreter with explicit TypeScript types, no spreads/casts/pass-through, and no backend or Convex imports in client-facing files. Verify `corepack pnpm --filter @garfex/backend typecheck` and the focused runtime tests. Depends on: WU-05 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing composition and read-operation tests for `getTaxonomy`, `getEffectiveResourceSchema`, `getValidOptions`, `getNaturalUnits`, `getResource`, `searchResources`, and `describeResource`: validation before authentication, fresh trusted actor state, one matching module call, explicit input rebuilding, field-by-field output projection, no generic dispatch, and no handler-authentication responsibility. Intended files: `apps/backend/tests/external-garfex-composition.test.ts`, `apps/backend/tests/external-garfex-operations.test.ts`, and the not-yet-created `apps/backend/src/external-garfex-boundary/composition.ts`. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-composition.test.ts tests/external-garfex-operations.test.ts`; failures must identify the absent composition boundary. Depends on: WU-05 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Add `apps/backend/src/external-garfex-boundary/composition.ts` with seven statically named composed entry functions and refactor `trusted/read-operations.ts` and `trusted/identity.ts` so `handleGetTaxonomy`, `handleGetEffectiveResourceSchema`, `handleGetValidOptions`, `handleGetNaturalUnits`, `handleGetResource`, `handleSearchResources`, and `handleDescribeResource` accept validated business input plus fresh actor state and only `resource-master/public.ts`. Keep explicit projector functions in `trusted/projections.ts` (`projectExternalGetTaxonomy`, `projectExternalGetEffectiveResourceSchema`, `projectExternalGetValidOptions`, `projectExternalGetNaturalUnits`, `projectExternalGetResource`, `projectExternalSearchResources`, `projectExternalDescribeResource`). Verify focused composition/operation tests and `corepack pnpm --filter @garfex/backend typecheck`. Depends on: WU-06 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Exercise every read operation with malformed authority-like input, absent authentication, unknown operation identifiers, omitted and supplied search optionals, extra internal result fields, invalid projected results, thrown invocation values, and Resource Master denial before catalog/repository work. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-composition.test.ts tests/external-garfex-operations.test.ts tests/external-garfex-security.test.ts` and `corepack pnpm test:architecture`. Depends on: WU-06 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Keep composition responsible for validation/authentication/actor construction/outcome validation and keep read handlers responsible only for their named mapping, projection, and normalization boundary; preserve stable `invokeExternal...` exports only as explicit wrappers, never as a dynamic registry or operation executor. Verify the focused tests and `corepack pnpm --filter @garfex/backend typecheck`. Depends on: WU-06 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing tests for `createResource`, `updateNonIdentityData`, and `deactivateResource` that require one matching public module method, deep-fresh input reconstruction, no client authority, field-by-field resource projection, exact capability evidence, and no downstream work when Resource Master denies. Intended files: `apps/backend/tests/external-garfex-operations.test.ts`, `apps/backend/tests/external-garfex-security.test.ts`, and `apps/backend/tests/external-garfex-composition.test.ts`. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-operations.test.ts tests/external-garfex-security.test.ts tests/external-garfex-composition.test.ts`; failures must expose the missing mutation composition/handler split. Depends on: WU-06 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Refactor `apps/backend/src/external-garfex-boundary/trusted/mutation-operations.ts`, `trusted/projections.ts`, and `composition.ts` to provide `handleCreateResource`, `handleUpdateNonIdentityData`, and `handleDeactivateResource` with explicit request mappers and `projectExternalCreateResource`, `projectExternalUpdateNonIdentityData`, and `projectExternalDeactivateResource`. Add a compile-time mapping evidence object that enumerates exactly the ten names without callable generic dispatch, and preserve Resource Master as the only owner of `resource:create`, `resource:update-non-identity`, and `resource:deactivate` checks. Verify focused mutation/security tests, `corepack pnpm --filter @garfex/backend typecheck`, and `corepack pnpm test:architecture`. Depends on: WU-07 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Run table-driven evidence for all ten operations, including a test-only extra Resource Master method that remains absent from TypeSpec and mapping evidence; forge actor/role/capability/claim/token/session/provider fields; test missing and neighboring capabilities; assert Resource Master returns `FORBIDDEN` before catalog, repository, persistence, or Convex work. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-operations.test.ts tests/external-garfex-security.test.ts tests/external-garfex-compatibility.test.ts`. Depends on: WU-07 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Remove accidental shared forwarding and retain explicit nested rebuilds for `createResource.attributes`, omitted search values, mutation revisions, and every success value; keep all handlers dependent only on generated client-facing types and `resource-master/public.ts`. Verify `corepack pnpm --filter @garfex/backend typecheck`, focused operation/security tests, and a clean architecture check. Depends on: WU-07 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing normalization tests for all eleven external codes, every Resource Master failure code, valid and malformed `fieldIssues`, `existingResourceId`, and `currentRevision`, catalog unavailable/uninitialized coarsening, integrity/invalid-catalog/internal/unknown/malformed/thrown failures, projection and response-validation failures, diagnostic sink exceptions, and the invariant that a known failure can never become success. Intended files: `apps/backend/tests/external-garfex-error-normalization.test.ts`, `apps/backend/tests/external-garfex-security.test.ts`, and `apps/backend/src/external-garfex-boundary/trusted/errors.ts`. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-error-normalization.test.ts tests/external-garfex-security.test.ts`; failures must cover behavior not yet generalized by the implementation. Depends on: WU-07 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Implement the exhaustive normalizer in `apps/backend/src/external-garfex-boundary/trusted/errors.ts` and connect it through read/mutation/composition outcome handling. Map validation to `VALIDATION_FAILED`, catalog unavailable/uninitialized to `CATALOG_UNAVAILABLE`, and unsafe/unknown/invalid-output/thrown results to metadata-free `INTERNAL_FAILURE`; expose only applicable validated allowlisted metadata and retain operation/phase/cause through a server-only diagnostics callback. Verify focused error/security tests and `corepack pnpm --filter @garfex/backend typecheck`. Depends on: WU-08 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Use hostile getters, proxies, symbols, extra properties, invalid metadata types, internal messages/stacks/provider/Convex/catalog details, thrown authentication/invocation/projection values, and a throwing diagnostics sink across representative and all ten operation paths; assert exactly one validated safe outcome and never a success after a known failure. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-error-normalization.test.ts tests/external-garfex-security.test.ts tests/external-garfex-contract.test.ts`. Depends on: WU-08 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Keep the Resource Master error switch exhaustive with a `never` check, isolate safe metadata validators, make diagnostic failure unable to affect outcomes, and ensure error validation remains generated-manifest-driven rather than a second code list. Verify focused error tests, `corepack pnpm --filter @garfex/backend typecheck`, and `corepack pnpm test:architecture`. Depends on: WU-08 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing architecture tests and controlled fixtures for TypeSpec independence, no authority fields, no platform/Convex/persistence leakage, no transport decorator/emitter/framing, no generic executor, no automatic derivation/publication, public-only trusted handlers, exact named mappings, final authorization evidence, stale provenance, and hard-coded/missing/duplicate metadata. Intended files: `tooling/tests/architecture.test.ts`, `tooling/architecture-fixtures/valid/external-garfex-boundary/{contracts/main.tsp,config/tspconfig.yaml,artifacts/semantic-manifest.json,client-facing/generated-contract.ts,trusted/named-mappings.ts,docs/contract.md}`, and focused violations under `tooling/architecture-fixtures/violations/external-garfex-boundary/{contracts,config,artifacts,client-facing,trusted,docs}/`. Verify with `corepack pnpm exec vitest run tooling/tests/architecture.test.ts`; new named-rule assertions must fail before checker support exists. Depends on: WU-08 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Extend `tooling/architecture/check.mjs` to inspect `.tsp`, TypeSpec configuration, manifest/baseline/generated TypeScript/generated Markdown, named mapping evidence, and canonical docs; add named diagnostics for transport, authority, internal derivation, platform leakage, generic execution, automatic publication, stale metadata/provenance, missing final authorization, and missing exact-ten parity. Keep existing dependency-cruiser and backend rules unchanged. Verify `corepack pnpm exec vitest run tooling/tests/architecture.test.ts`, `corepack pnpm test:architecture`, and a passing targeted valid fixture check. Depends on: WU-09 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Run every focused violation individually and assert exactly its intended rule, run the valid external boundary fixture, run the full violation fixture set, and assert architecture inspection never traverses or edits `openspec/changes/persistent-resource-catalog/` or any external counterpart repository. Verify with `corepack pnpm exec vitest run tooling/tests/architecture.test.ts`, `node tooling/architecture/check.mjs tooling/architecture-fixtures/valid/external-garfex-boundary`, and `node tooling/architecture/check.mjs tooling/architecture-fixtures/violations/external-garfex-boundary`. Depends on: WU-09 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Centralize path classification and exact rule diagnostics, preserve configuration-error exit `2` versus architecture-violation exit `1`, and ensure generated/docs scans reject drift without treating manifest JSON as a selected transport. Verify `corepack pnpm test:architecture` and `corepack pnpm exec biome format --check tooling/architecture/check.mjs tooling/tests/architecture.test.ts`. Depends on: WU-09 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Extend documentation parity tests to require the TypeSpec identity/revision section, exact ten operation/mapping/capability rows, exact eleven error/metadata rows, three-boundary ownership, stale/breaking gate links, Convex encapsulation, and every transport/auth-provider/UI/publication/version-policy non-decision. Intended files: `apps/backend/tests/external-garfex-documentation-parity.test.ts`, `tooling/typespec-semantic-manifest/tests/documentation-parity.test.ts`, and `docs/generated/resource-master-external-contract.md`. Verify with `corepack pnpm exec vitest run apps/backend/tests/external-garfex-documentation-parity.test.ts tooling/typespec-semantic-manifest/tests/documentation-parity.test.ts`; assertions must fail until canonical records are updated. Depends on: WU-09 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Update `docs/external-garfex-boundary.md`, `docs/external-client-boundary.md`, `docs/auth-boundary.md`, and `docs/architecture.md` to identify TypeSpec as the GARFEX-owned external semantic authority, link `contracts/external-garfex/resource-master/`, manifest, baseline, generated consumer semantics, and gates, and distinguish trusted fresh actor construction, named handlers, final Resource Master authorization, explicit projections, safe errors, and private Convex infrastructure. Keep detailed consumer shapes in `docs/generated/resource-master-external-contract.md`; do not add routes, verbs, statuses, headers, serialization, SDK, deployment, UI, or productive identity claims. Verify the focused documentation tests and `corepack pnpm exec biome format --check docs/external-garfex-boundary.md docs/external-client-boundary.md docs/auth-boundary.md docs/architecture.md docs/generated/resource-master-external-contract.md`. Depends on: WU-10 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Parse all canonical and generated documents as a standalone consumer/reviewer would: assert exact opaque comparison guidance, no backend knowledge requirement for business workflows, cross-links between all four records, no internal identifiers/diagnostics, no HTTP implication, and parity with manifest, baseline, fixture, and mapping evidence. Verify with `corepack pnpm exec vitest run apps/backend/tests/external-garfex-documentation-parity.test.ts tooling/typespec-semantic-manifest/tests/documentation-parity.test.ts` and `corepack pnpm test:architecture`. Depends on: WU-10 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Lead each document with its decision and quick path, use generated tables instead of duplicated handwritten semantic lists, retain ADR-style ownership and non-decision links, and make wording explicit that compatibility revision `1` is opaque rather than semantic-versioned. Verify documentation parity, architecture, and `corepack pnpm exec biome format --check docs/external-garfex-boundary.md docs/external-client-boundary.md docs/auth-boundary.md docs/architecture.md`. Depends on: WU-10 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing tooling tests for stable root commands, non-writing versus writing generation behavior, TypeSpec no-emit compilation, temporary manifest/materializer comparison, baseline/revision coupling, parity ordering, and protected-path checks. Intended files: `tooling/tests/contract-tooling.test.ts`, `package.json`, `apps/backend/package.json`, and `tooling/typespec-semantic-manifest/package.json`. Verify with `corepack pnpm exec vitest run tooling/tests/contract-tooling.test.ts`; failures must show absent script/dependency wiring rather than silently skip contract checks. Depends on: WU-10 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Add pinned TypeSpec/compiler dependencies and local package scripts in `package.json`, `tooling/typespec-semantic-manifest/package.json`, `apps/backend/package.json` where backend-focused commands are needed, and `pnpm-lock.yaml`; update `tsconfig.base.json`, `tooling/tsconfig.json`, and `apps/backend/tsconfig.json` only where project references/includes are required. Expose `contract:typespec:check` (`tsp compile . --no-emit`), `contract:generate` (the intentional writer), and `contract:check` (clean temporary generation, manifest/schema/parity/baseline/stale checks) and invoke the non-writing contract check from root `check`. Verify `corepack pnpm exec vitest run tooling/tests/contract-tooling.test.ts`, `corepack pnpm contract:typespec:check`, and `corepack pnpm contract:check`. Depends on: WU-11 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Execute the full gates in dependency order: `corepack pnpm contract:typespec:check`, `corepack pnpm contract:check`, `corepack pnpm test`, `corepack pnpm --filter @garfex/backend test`, `corepack pnpm --filter @garfex/backend typecheck`, `corepack pnpm test:architecture`, `corepack pnpm build`, and `corepack pnpm check`; assert CI/check mode leaves committed artifacts unchanged and assert `git diff --name-only -- openspec/changes/persistent-resource-catalog` is empty. Depends on: WU-11 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Make command ordering, temporary-directory cleanup, error reporting, and generated digest comparison deterministic; document the focused and full commands in `docs/external-garfex-boundary.md` and ensure no root command selects a transport, publishes a client, deploys, or changes Resource Master/catalog behavior. Verify one final `corepack pnpm check`, `corepack pnpm build`, and `git diff --name-only -- openspec/changes/persistent-resource-catalog`. Depends on: WU-11 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] Record ordinary repository-policy evidence for each future work unit: focused test command and exact result, runtime harness command/scenario and exact result or explicit `N/A` reason, additions plus deletions changed-line count, start/finish state, and exact rollback boundary before promoting it to the next chain unit; keep receipt-driven development `disabled/unmanaged` unless the user separately enables it later. <!-- sdd-owner: parent -->
- [ ] Before any future PR, verify the dependency diagram and clean diff for the current unit, run the full final gates, and confirm zero edits under `openspec/changes/persistent-resource-catalog/`. <!-- sdd-owner: parent -->

Next recommended action: `parent-lifecycle` after WU-04. Final verify remains blocked until all implementation rows are complete and parent-owned lifecycle evidence is reconciled; sdd-apply performed no review or delivery validation.

## WU-05 continuation — runtime façade/interpreter final REFACTOR

### Phase envelope

- Change: `external-client-contract-resource-master`.
- Apply scope: WU-05 only, final `REFACTOR` slice after the persisted RED, GREEN, and TRIANGULATE rows.
- Work-unit boundary: generated TypeScript façade consumption and the security-hardened manifest interpreter; no composition, handler, Resource Master, Convex, UI, transport, or WU-06 work.
- Delivery boundary: `auto-chain`, `stacked-to-main`; this is the WU-05 refactor boundary after the preserved WU-05 candidate.
- Receipt-driven development: `disabled/unmanaged`; no review actor, receipt, commit, push, PR, release, or delivery gate was started.
- Rollback boundary: restore only `apps/backend/src/external-garfex-boundary/client-facing/contract.ts` and `validation.ts` to the pre-WU-05-refactor candidate while retaining the manifest parity gate; do not restore handwritten schema authority.

### Structured status consumed and produced

```yaml
schemaName: gentle-ai.sdd-status
changeName: external-client-contract-resource-master
artifactStore: openspec
authoritative: true
applyState: ready
taskProgress:
  before: 20 completed of 47 total rows
  after: 21 completed of 47 total rows
  implementationRowsRemaining: 26
deferredParentActions:
  remaining: 2
dependencies: { apply: ready, verify: blocked, archive: blocked }
actionContext:
  mode: repo-local
  workspaceRoot: /home/garfex/PROGRAMACION/garfex-platform
  allowedEditRoots: [/home/garfex/PROGRAMACION/garfex-platform]
  warnings: []
nextRecommended: apply
reviewWorkload:
  decisionNeededBeforeApply: false
  chainedPRsRecommended: true
  chainStrategy: stacked-to-main
  budgetRisk: high
runtimeObjective:
  workUnit: wu-05-refactor
  maxChangedLines: 300
  currentSliceChangedLines: 293
  activeAttemptTokenReused: true
```

The native status was authoritative and the repo-local edit root matched the workspace root. The active post-reset objective was authenticated by reusing its supplied token; no additional reset or attempt was created. The parent prompt resolved the high-workload gate as `auto-chain` / `stacked-to-main`, so only WU-05 was implemented. Native status still routes the incomplete overall change to apply because WU-06 through WU-11 remain unchecked; this phase's lifecycle recommendation is `parent-lifecycle`, not WU-06.

### Completed implementation tasks and persisted checkbox update

- [x] WU-05 RED — Preserved failing-first runtime evidence in `external-garfex-generated-runtime.test.ts` and `external-garfex-contract.test.ts` requires generated metadata/types, manifest-driven acceptance, and rejection of divergent handwritten semantics. The persisted RED row was already visibly `[x]` before this continuation and was not altered.
- [x] WU-05 GREEN — Preserved the generated-data façade and generic closed-schema interpreter with named request/success/failure wrappers. The persisted GREEN row was already visibly `[x]` before this continuation and was not altered.
- [x] WU-05 TRIANGULATE — Preserved hostile-value coverage for null prototypes, symbols, throwing accessors, sparse/extended arrays, authority-like keys, closed unions/enums/constraints, malformed outputs, and metadata-free internal failure. The persisted TRIANGULATE row was already visibly `[x]` before this continuation and was not altered.
- [x] WU-05 REFACTOR — Refactored the type façade so request/resource/error shapes are derived from the generated manifest algebra, added a bounded type-level recursion guard for compile-safe generated projections, and removed spread-based copying from the interpreter. The interpreter continues to rebuild accepted objects from generated properties and constraints; security checks remain policy-only. The persisted REFACTOR row was changed from `[ ]` to `[x]` immediately after the green verification and was reread from `tasks.md`.

### Files changed in this WU-05 refactor boundary

- `apps/backend/src/external-garfex-boundary/client-facing/contract.ts`
- `apps/backend/src/external-garfex-boundary/client-facing/validation.ts`
- `openspec/changes/external-client-contract-resource-master/tasks.md`
- `openspec/changes/external-client-contract-resource-master/apply-progress.md`

The generated runtime embedding was not hand-edited or regenerated in this slice. Client-facing imports remain limited to the generated contract data and local façade types; no backend or Convex import was introduced. No WU-06+ path, Resource Master implementation, Convex/UI/transport path, or `persistent-resource-catalog` path was edited.

### Strict TDD cycle evidence

| Task | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- |
| WU-05 runtime façade/interpreter | Preserved checked failing-first runtime assertions; no RED edit in this continuation | Preserved checked generated façade/interpreter implementation and backend typecheck evidence | Preserved checked adversarial runtime and compatibility evidence; final focused rerun covers all three WU-05 test files | PASS — generated-only type mapping, finite recursive type projection, total interpreter copying, and no spread/cast/pass-through source checks remained green |

### Verification evidence

| Command | Result |
| --- | --- |
| `corepack pnpm --filter @garfex/backend typecheck` | PASS — backend `tsc --noEmit`. |
| `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-generated-runtime.test.ts tests/external-garfex-contract.test.ts tests/external-garfex-compatibility.test.ts` | PASS — 3 files, 37 tests. |
| `corepack pnpm exec biome check apps/backend/src/external-garfex-boundary/client-facing/contract.ts apps/backend/src/external-garfex-boundary/client-facing/validation.ts` | PASS — no formatting, import, or lint diagnostics after the bounded refactor. |
| `git diff --check` | PASS. |
| `git diff --name-only -- openspec/changes/persistent-resource-catalog` | PASS — empty output; protected change remains untouched. |
| `git diff --numstat 0682b91fcae11a4833e59053620f9534bb7ce57b -- apps/backend/src/external-garfex-boundary/client-facing/contract.ts apps/backend/src/external-garfex-boundary/client-facing/validation.ts` | PASS — 169 additions plus 124 deletions, 293 changed lines for this bounded slice. |

A source inspection after the refactor found no object/array spread or type assertion in the interpreter, no backend/Convex import, and no pass-through of accepted object values; generated manifest properties, requiredness, enum membership, unions, nullability, and scalar constraints remain the runtime schema inputs. The stable compatibility error ordering is presentation-only; generated error-enum membership remains authoritative. Runtime harness: `N/A` — this slice changes no application endpoint, transport, or network boundary.

### Deviations and risks

- The type façade now uses a finite generated recursion depth solely to keep TypeScript instantiation bounded for deeply nested manifest-derived values. It does not add business fields, requiredness, enum members, union variants, nullability, or bounds, and the runtime interpreter remains fully manifest-driven.
- Existing compatibility-shaped wrapper aliases and legacy field-path handling remain downstream compatibility adapters for the already passing WU-05 behavior; they do not define generated schema membership or validation constraints.
- The overall change remains high workload and incomplete. WU-06 through WU-11 implementation rows and both parent-owned lifecycle rows remain unchecked. No verify, review, receipt, sync, archive, commit, push, PR, release, or delivery validation was performed.

### Remaining implementation and parent-owned tasks

The following unchecked lines are copied exactly from the persisted `tasks.md` artifact after WU-05 completion:

- [ ] RED — Add failing composition and read-operation tests for `getTaxonomy`, `getEffectiveResourceSchema`, `getValidOptions`, `getNaturalUnits`, `getResource`, `searchResources`, and `describeResource`: validation before authentication, fresh trusted actor state, one matching module call, explicit input rebuilding, field-by-field output projection, no generic dispatch, and no handler-authentication responsibility. Intended files: `apps/backend/tests/external-garfex-composition.test.ts`, `apps/backend/tests/external-garfex-operations.test.ts`, and the not-yet-created `apps/backend/src/external-garfex-boundary/composition.ts`. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-composition.test.ts tests/external-garfex-operations.test.ts`; failures must identify the absent composition boundary. Depends on: WU-05 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Add `apps/backend/src/external-garfex-boundary/composition.ts` with seven statically named composed entry functions and refactor `trusted/read-operations.ts` and `trusted/identity.ts` so `handleGetTaxonomy`, `handleGetEffectiveResourceSchema`, `handleGetValidOptions`, `handleGetNaturalUnits`, `handleGetResource`, `handleSearchResources`, and `handleDescribeResource` accept validated business input plus fresh actor state and only `resource-master/public.ts`. Keep explicit projector functions in `trusted/projections.ts` (`projectExternalGetTaxonomy`, `projectExternalGetEffectiveResourceSchema`, `projectExternalGetValidOptions`, `projectExternalGetNaturalUnits`, `projectExternalGetResource`, `projectExternalSearchResources`, `projectExternalDescribeResource`). Verify focused composition/operation tests and `corepack pnpm --filter @garfex/backend typecheck`. Depends on: WU-06 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Exercise every read operation with malformed authority-like input, absent authentication, unknown operation identifiers, omitted and supplied search optionals, extra internal result fields, invalid projected results, thrown invocation values, and Resource Master denial before catalog/repository work. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-composition.test.ts tests/external-garfex-operations.test.ts tests/external-garfex-security.test.ts` and `corepack pnpm test:architecture`. Depends on: WU-06 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Keep composition responsible for validation/authentication/actor construction/outcome validation and keep read handlers responsible only for their named mapping, projection, and normalization boundary; preserve stable `invokeExternal...` exports only as explicit wrappers, never as a dynamic registry or operation executor. Verify the focused tests and `corepack pnpm --filter @garfex/backend typecheck`. Depends on: WU-06 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing tests for `createResource`, `updateNonIdentityData`, and `deactivateResource` that require one matching public module method, deep-fresh input reconstruction, no client authority, field-by-field resource projection, exact capability evidence, and no downstream work when Resource Master denies. Intended files: `apps/backend/tests/external-garfex-operations.test.ts`, `apps/backend/tests/external-garfex-security.test.ts`, and `apps/backend/tests/external-garfex-composition.test.ts`. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-operations.test.ts tests/external-garfex-security.test.ts tests/external-garfex-composition.test.ts`; failures must expose the missing mutation composition/handler split. Depends on: WU-06 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Refactor `apps/backend/src/external-garfex-boundary/trusted/mutation-operations.ts`, `trusted/projections.ts`, and `composition.ts` to provide `handleCreateResource`, `handleUpdateNonIdentityData`, and `handleDeactivateResource` with explicit request mappers and `projectExternalCreateResource`, `projectExternalUpdateNonIdentityData`, and `projectExternalDeactivateResource`. Add a compile-time mapping evidence object that enumerates exactly the ten names without callable generic dispatch, and preserve Resource Master as the only owner of `resource:create`, `resource:update-non-identity`, and `resource:deactivate` checks. Verify focused mutation/security tests, `corepack pnpm --filter @garfex/backend typecheck`, and `corepack pnpm test:architecture`. Depends on: WU-07 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Run table-driven evidence for all ten operations, including a test-only extra Resource Master method that remains absent from TypeSpec and mapping evidence; forge actor/role/capability/claim/token/session/provider fields; test missing and neighboring capabilities; assert Resource Master returns `FORBIDDEN` before catalog, repository, persistence, or Convex work. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-operations.test.ts tests/external-garfex-security.test.ts tests/external-garfex-compatibility.test.ts`. Depends on: WU-07 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Remove accidental shared forwarding and retain explicit nested rebuilds for `createResource.attributes`, omitted search values, mutation revisions, and every success value; keep all handlers dependent only on generated client-facing types and `resource-master/public.ts`. Verify `corepack pnpm --filter @garfex/backend typecheck`, focused operation/security tests, and a clean architecture check. Depends on: WU-07 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing normalization tests for all eleven external codes, every Resource Master failure code, valid and malformed `fieldIssues`, `existingResourceId`, and `currentRevision`, catalog unavailable/uninitialized coarsening, integrity/invalid-catalog/internal/unknown/malformed/thrown failures, projection and response-validation failures, diagnostic sink exceptions, and the invariant that a known failure can never become success. Intended files: `apps/backend/tests/external-garfex-error-normalization.test.ts`, `apps/backend/tests/external-garfex-security.test.ts`, and `apps/backend/src/external-garfex-boundary/trusted/errors.ts`. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-error-normalization.test.ts tests/external-garfex-security.test.ts`; failures must cover behavior not yet generalized by the implementation. Depends on: WU-07 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Implement the exhaustive normalizer in `apps/backend/src/external-garfex-boundary/trusted/errors.ts` and connect it through read/mutation/composition outcome handling. Map validation to `VALIDATION_FAILED`, catalog unavailable/uninitialized to `CATALOG_UNAVAILABLE`, and unsafe/unknown/invalid-output/thrown results to metadata-free `INTERNAL_FAILURE`; expose only applicable validated allowlisted metadata and retain operation/phase/cause through a server-only diagnostics callback. Verify focused error/security tests and `corepack pnpm --filter @garfex/backend typecheck`. Depends on: WU-08 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Use hostile getters, proxies, symbols, extra properties, invalid metadata types, internal messages/stacks/provider/Convex/catalog details, thrown authentication/invocation/projection values, and a throwing diagnostics sink across representative and all ten operation paths; assert exactly one validated safe outcome and never a success after a known failure. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-error-normalization.test.ts tests/external-garfex-security.test.ts tests/external-garfex-contract.test.ts`. Depends on: WU-08 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Keep the Resource Master error switch exhaustive with a `never` check, isolate safe metadata validators, make diagnostic failure unable to affect outcomes, and ensure error validation remains generated-manifest-driven rather than a second code list. Verify focused error tests, `corepack pnpm --filter @garfex/backend typecheck`, and `corepack pnpm test:architecture`. Depends on: WU-08 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing architecture tests and controlled fixtures for TypeSpec independence, no authority fields, no platform/Convex/persistence leakage, no transport decorator/emitter/framing, no generic executor, no automatic derivation/publication, public-only trusted handlers, exact named mappings, final authorization evidence, stale provenance, and hard-coded/missing/duplicate metadata. Intended files: `tooling/tests/architecture.test.ts`, `tooling/architecture-fixtures/valid/external-garfex-boundary/{contracts/main.tsp,config/tspconfig.yaml,artifacts/semantic-manifest.json,client-facing/generated-contract.ts,trusted/named-mappings.ts,docs/contract.md}`, and focused violations under `tooling/architecture-fixtures/violations/external-garfex-boundary/{contracts,config,artifacts,client-facing,trusted,docs}/`. Verify with `corepack pnpm exec vitest run tooling/tests/architecture.test.ts`; new named-rule assertions must fail before checker support exists. Depends on: WU-08 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Extend `tooling/architecture/check.mjs` to inspect `.tsp`, TypeSpec configuration, manifest/baseline/generated TypeScript/generated Markdown, named mapping evidence, and canonical docs; add named diagnostics for transport, authority, internal derivation, platform leakage, generic execution, automatic publication, stale metadata/provenance, missing final authorization, and missing exact-ten parity. Keep existing dependency-cruiser and backend rules unchanged. Verify `corepack pnpm exec vitest run tooling/tests/architecture.test.ts`, `corepack pnpm test:architecture`, and a passing targeted valid fixture check. Depends on: WU-09 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Run every focused violation individually and assert exactly its intended rule, run the valid external boundary fixture, run the full violation fixture set, and assert architecture inspection never traverses or edits `openspec/changes/persistent-resource-catalog/` or any external counterpart repository. Verify with `corepack pnpm exec vitest run tooling/tests/architecture.test.ts`, `node tooling/architecture/check.mjs tooling/architecture-fixtures/valid/external-garfex-boundary`, and `node tooling/architecture/check.mjs tooling/architecture-fixtures/violations/external-garfex-boundary`. Depends on WU-09 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Centralize path classification and exact rule diagnostics, preserve configuration-error exit `2` versus architecture-violation exit `1`, and ensure generated/docs scans reject drift without treating manifest JSON as a selected transport. Verify `corepack pnpm test:architecture` and `corepack pnpm exec biome format --check tooling/architecture/check.mjs tooling/tests/architecture.test.ts`. Depends on WU-09 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Extend documentation parity tests to require the TypeSpec identity/revision section, exact ten operation/mapping/capability rows, exact eleven error/metadata rows, three-boundary ownership, stale/breaking gate links, Convex encapsulation, and every transport/auth-provider/UI/publication/version-policy non-decision. Intended files: `apps/backend/tests/external-garfex-documentation-parity.test.ts`, `tooling/typespec-semantic-manifest/tests/documentation-parity.test.ts`, and `docs/generated/resource-master-external-contract.md`. Verify with `corepack pnpm exec vitest run apps/backend/tests/external-garfex-documentation-parity.test.ts tooling/typespec-semantic-manifest/tests/documentation-parity.test.ts`; assertions must fail until canonical records are updated. Depends on WU-09 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Update `docs/external-garfex-boundary.md`, `docs/external-client-boundary.md`, `docs/auth-boundary.md`, and `docs/architecture.md` to identify TypeSpec as the GARFEX-owned external semantic authority, link `contracts/external-garfex/resource-master/`, manifest, baseline, generated consumer semantics, and gates, and distinguish trusted fresh actor construction, named handlers, final Resource Master authorization, explicit projections, safe errors, and private Convex infrastructure. Keep detailed consumer shapes in `docs/generated/resource-master-external-contract.md`; do not add routes, verbs, statuses, headers, serialization, SDK, deployment, UI, or productive identity claims. Verify the focused documentation tests and `corepack pnpm exec biome format --check docs/external-garfex-boundary.md docs/external-client-boundary.md docs/auth-boundary.md docs/architecture.md docs/generated/resource-master-external-contract.md`. Depends on WU-10 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Parse all canonical and generated documents as a standalone consumer/reviewer would: assert exact opaque comparison guidance, no backend knowledge requirement for business workflows, cross-links between all four records, no internal identifiers/diagnostics, no HTTP implication, and parity with manifest, baseline, fixture, and mapping evidence. Verify with `corepack pnpm exec vitest run apps/backend/tests/external-garfex-documentation-parity.test.ts tooling/typespec-semantic-manifest/tests/documentation-parity.test.ts` and `corepack pnpm test:architecture`. Depends on WU-10 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Lead each document with its decision and quick path, use generated tables instead of duplicated handwritten semantic lists, retain ADR-style ownership and non-decision links, and make wording explicit that compatibility revision `1` is opaque rather than semantic-versioned. Verify documentation parity, architecture, and `corepack pnpm exec biome format --check docs/external-garfex-boundary.md docs/external-client-boundary.md docs/auth-boundary.md docs/architecture.md`. Depends on WU-10 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing tooling tests for stable root commands, non-writing versus writing generation behavior, TypeSpec no-emit compilation, temporary manifest/materializer comparison, baseline/revision coupling, parity ordering, and protected-path checks. Intended files: `tooling/tests/contract-tooling.test.ts`, `package.json`, `apps/backend/package.json`, and `tooling/typespec-semantic-manifest/package.json`. Verify with `corepack pnpm exec vitest run tooling/tests/contract-tooling.test.ts`; failures must show absent script/dependency wiring rather than silently skip contract checks. Depends on WU-10 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Add pinned TypeSpec/compiler dependencies and local package scripts in `package.json`, `tooling/typespec-semantic-manifest/package.json`, `apps/backend/package.json` where backend-focused commands are needed, and `pnpm-lock.yaml`; update `tsconfig.base.json`, `tooling/tsconfig.json`, and `apps/backend/tsconfig.json` only where project references/includes are required. Expose `contract:typespec:check` (`tsp compile . --no-emit`), `contract:generate` (the intentional writer), and `contract:check` (clean temporary generation, manifest/schema/parity/baseline/stale checks) and invoke the non-writing contract check from root `check`. Verify `corepack pnpm exec vitest run tooling/tests/contract-tooling.test.ts`, `corepack pnpm contract:typespec:check`, and `corepack pnpm contract:check`. Depends on WU-11 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Execute the full gates in dependency order: `corepack pnpm contract:typespec:check`, `corepack pnpm contract:check`, `corepack pnpm test`, `corepack pnpm --filter @garfex/backend test`, `corepack pnpm --filter @garfex/backend typecheck`, `corepack pnpm test:architecture`, `corepack pnpm build`, and `corepack pnpm check`; assert CI/check mode leaves committed artifacts unchanged and assert `git diff --name-only -- openspec/changes/persistent-resource-catalog` is empty. Depends on WU-11 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Make command ordering, temporary-directory cleanup, error reporting, and generated digest comparison deterministic; document the focused and full commands in `docs/external-garfex-boundary.md` and ensure no root command selects a transport, publishes a client, deploys, or changes Resource Master/catalog behavior. Verify one final `corepack pnpm check`, `corepack pnpm build`, and `git diff --name-only -- openspec/changes/persistent-resource-catalog`. Depends on WU-11 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] Record ordinary repository-policy evidence for each future work unit: focused test command and exact result, runtime harness command/scenario and exact result or explicit `N/A` reason, additions plus deletions changed-line count, start/finish state, and exact rollback boundary before promoting it to the next chain unit; keep receipt-driven development `disabled/unmanaged` unless the user separately enables it later. <!-- sdd-owner: parent -->
- [ ] Before any future PR, verify the dependency diagram and clean diff for the current unit, run the full final gates, and confirm zero edits under `openspec/changes/persistent-resource-catalog/`. <!-- sdd-owner: parent -->

## WU-06 continuation — split composition from seven named read handlers

### Phase envelope

- Change: `external-client-contract-resource-master`.
- Apply scope: WU-06 only — split the trusted composition root from the seven named read handlers and retain explicit read projections.
- Work-unit boundary: validation/authentication/actor composition, seven read mappings, explicit read projections, final outcome validation, read-operation security evidence, and stable named invocation wrappers.
- Delivery: `auto-chain`, `stacked-to-main`; current boundary is WU-06 stacked after WU-05.
- Receipt-driven development: `disabled/unmanaged`; no review actor, receipt, commit, push, PR, release, or delivery gate was started.
- WU-07 and later implementation work was not started. `persistent-resource-catalog` remains untouched.
- Rollback boundary: revert `composition.ts`, `trusted/read-operations.ts`, `trusted/identity.ts`, the WU-06 composition test, and the read-wrapper import updates; retain the generated contract/validator work and leave Resource Master, Convex, UI, transport, and persistence unchanged.

### Structured status consumed and produced

```yaml
schemaName: gentle-ai.sdd-status
changeName: external-client-contract-resource-master
artifactStore: openspec
authoritative: true
applyState: ready
taskProgress:
  before: 21 completed of 47 total rows
  after: 25 completed of 47 total rows
  implementationRowsRemaining: 22
dependencies: { apply: ready, verify: blocked, archive: blocked }
actionContext:
  mode: repo-local
  workspaceRoot: /home/garfex/PROGRAMACION/garfex-platform
  allowedEditRoots: [/home/garfex/PROGRAMACION/garfex-platform]
  warnings: [inherited architecture checker violations in WU-05 generated client-facing imports]
nextRecommended: parent-lifecycle
reviewWorkload:
  decisionNeededBeforeApply: false
  chainedPRsRecommended: true
  chainStrategy: stacked-to-main
  budgetRisk: high
```

The parent supplied the active change, workspace root, allowed edit root, `auto-chain` delivery path, and `stacked-to-main` chain strategy. The workload gate therefore permitted this assigned WU-06 slice. No edit crossed the authoritative workspace root or touched a parent-owned task row.

### Completed implementation tasks and persisted checkbox updates

- [x] WU-06 RED — Added `apps/backend/tests/external-garfex-composition.test.ts` before the composition implementation. The initial focused command failed as required because `composition.ts` and the named handler exports were absent; the existing operations suite still passed 49 tests.
- [x] WU-06 GREEN — Added seven explicit `invokeExternal...` composition functions. Each wrapper validates its own request before trusted actor resolution, calls its matching named handler with trusted actor state and the `ResourceMaster` public interface, and validates the final projected outcome. The read handlers now accept validated input plus actor plus public Resource Master, explicitly rebuild module inputs, normalize module/invocation/projection failures, and retain field-by-field read projectors. `identity.ts` now centralizes fresh actor construction with a copied server capability set. The persisted GREEN checkbox was updated immediately after the focused suite and backend typecheck passed.
- [x] WU-06 TRIANGULATE — Added adversarial coverage for forged authority fields before authentication, fresh actors across invocations, unknown operation identifiers without a dispatcher, all seven Resource Master deny-before-catalog paths, and handler independence from authentication wiring. Existing read tests continued to cover omitted/supplied search optionals, extra internal fields, invalid projected values, thrown invocation values, and explicit one-method mapping. The persisted TRIANGULATE checkbox was updated after the focused security suite passed; the inherited architecture-checker limitation is recorded below.
- [x] WU-06 REFACTOR — Removed composition responsibility from the read handlers, removed the composition/read circular dependency by making `composition.ts` the invocation export owner, preserved stable explicit wrapper names, organized imports/formatting, and retained no generic operation registry or dynamic executor. The persisted REFACTOR checkbox was updated after the final focused suite, full root tests, typecheck, and Biome check passed.

Only the four WU-06 implementation rows were changed in `tasks.md`; WU-07+ implementation rows and parent-owned lifecycle rows remain unchecked with their existing terminal ownership markers.

### Files changed in the WU-06 boundary

- `apps/backend/src/external-garfex-boundary/composition.ts` — new composition root with seven static entry functions and final outcome validation.
- `apps/backend/src/external-garfex-boundary/trusted/read-operations.ts` — seven named handlers with explicit public-interface mappings, input rebuilding, and normalization/projection boundary.
- `apps/backend/src/external-garfex-boundary/trusted/identity.ts` — fresh actor construction helper with copied server capabilities.
- `apps/backend/tests/external-garfex-composition.test.ts` — new RED/GREEN/TRIANGULATE composition, handler-boundary, and authorization tests.
- `apps/backend/tests/external-garfex-operations.test.ts` — existing stable read invocation tests now exercise the composition-root wrappers.
- `apps/backend/tests/external-garfex-compatibility.test.ts` — manifest compatibility cases now use the explicit composition wrappers.
- `openspec/changes/external-client-contract-resource-master/tasks.md` — only WU-06 implementation checkboxes changed from `[ ]` to `[x]`.
- `openspec/changes/external-client-contract-resource-master/apply-progress.md` — this cumulative WU-06 evidence was appended.

No projector source needed behavior changes: the existing explicit `projectExternalGetTaxonomy`, `projectExternalGetEffectiveResourceSchema`, `projectExternalGetValidOptions`, `projectExternalGetNaturalUnits`, `projectExternalGetResource`, `projectExternalSearchResources`, and `projectExternalDescribeResource` functions already provided the required field-by-field, fresh read projections and remained downstream of the named handlers.

### Strict TDD cycle evidence

| Task | Test layer | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- |
| WU-06 composition and seven reads | Backend Vitest composition/operation/security/compatibility suites plus TypeScript/Biome checks | `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-composition.test.ts tests/external-garfex-operations.test.ts` failed with the absent `composition.js` module while the pre-existing operations tests passed 49 tests | The same focused command passed 2 files/65 tests; `corepack pnpm --filter @garfex/backend typecheck` passed | `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-composition.test.ts tests/external-garfex-operations.test.ts tests/external-garfex-security.test.ts tests/external-garfex-compatibility.test.ts` passed 4 files/115 tests; all seven deny-before-catalog cases and adversarial read cases passed | The focused four-file suite passed 115 tests; `corepack pnpm test` passed 26 files/322 tests; backend typecheck and targeted Biome check passed with no diagnostics |

The RED evidence was preserved before production implementation. GREEN, TRIANGULATE, and REFACTOR were run in order, with persisted task checkboxes updated immediately after each completed implementation row.

### Verification evidence

| Command | Result |
| --- | --- |
| `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-composition.test.ts tests/external-garfex-operations.test.ts` | PASS — 2 files, 65 tests after GREEN. |
| `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-composition.test.ts tests/external-garfex-operations.test.ts tests/external-garfex-security.test.ts tests/external-garfex-compatibility.test.ts` | PASS — 4 files, 115 tests after TRIANGULATE/REFACTOR. |
| `corepack pnpm --filter @garfex/backend typecheck` | PASS. |
| `corepack pnpm test` | PASS — 26 files, 322 tests; 88.34% statements, 79.41% branches, 96.68% functions, 90.17% lines. |
| `corepack pnpm exec biome check --write ...` followed by targeted `corepack pnpm exec biome check ...` | PASS — six WU-06 files checked with no remaining diagnostics. |
| `corepack pnpm test:architecture` | PARTIAL — the architecture Vitest suite passed 6 tests, then the repository checker exited 1 for two inherited WU-05 violations: `external-contract-no-platform` on `client-facing/contract.ts -> ./generated/semantic-contract.generated.js` and `client-facing/validation.ts -> ./generated/semantic-contract.generated.js`. No WU-06 circular-dependency violation remained after the refactor. The checker extension/fixture correction belongs to WU-09 and was not edited here. |
| `git diff --check` | PASS. |
| `git diff --name-only -- openspec/changes/persistent-resource-catalog` | PASS — empty output; protected change remains untouched. |

Runtime harness: `N/A` — this work unit adds no network/transport runtime; Vitest exercises the composed in-process boundary and Resource Master authorization handoff.

### Deviations, risks, and boundary notes

- The existing explicit projector implementations already satisfied the read projection invariants, so this WU-06 slice retained them rather than duplicating or redesigning projection logic.
- The named invocation wrappers are now owned by `composition.ts`; existing repository tests were pointed at that composition root to remove a circular dependency. The wrapper names remain explicit and stable, and no generic dispatcher was introduced.
- The repository architecture checker still rejects the generated client-facing imports created in earlier WU-03/WU-05 work. This is an inherited acceptance risk, not a WU-06 behavior failure; WU-09 owns the architecture-rule extension and was not started.
- No Resource Master application/domain/infrastructure, Convex, UI, transport, persistence, `persistent-resource-catalog`, WU-07+, commit, push, PR, release, review, or receipt artifact was changed or created.

### Remaining implementation and parent-owned tasks

The following exact unchecked `- [ ]` lines are copied from the persisted `tasks.md` artifact after WU-06 completion:

- [ ] RED — Add failing tests for `createResource`, `updateNonIdentityData`, and `deactivateResource` that require one matching public module method, deep-fresh input reconstruction, no client authority, field-by-field resource projection, exact capability evidence, and no downstream work when Resource Master denies. Intended files: `apps/backend/tests/external-garfex-operations.test.ts`, `apps/backend/tests/external-garfex-security.test.ts`, and `apps/backend/tests/external-garfex-composition.test.ts`. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-operations.test.ts tests/external-garfex-security.test.ts tests/external-garfex-composition.test.ts`; failures must expose the missing mutation composition/handler split. Depends on: WU-06 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Refactor `apps/backend/src/external-garfex-boundary/trusted/mutation-operations.ts`, `trusted/projections.ts`, and `composition.ts` to provide `handleCreateResource`, `handleUpdateNonIdentityData`, and `handleDeactivateResource` with explicit request mappers and `projectExternalCreateResource`, `projectExternalUpdateNonIdentityData`, and `projectExternalDeactivateResource`. Add a compile-time mapping evidence object that enumerates exactly the ten names without callable generic dispatch, and preserve Resource Master as the only owner of `resource:create`, `resource:update-non-identity`, and `resource:deactivate` checks. Verify focused mutation/security tests, `corepack pnpm --filter @garfex/backend typecheck`, and `corepack pnpm test:architecture`. Depends on: WU-07 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Run table-driven evidence for all ten operations, including a test-only extra Resource Master method that remains absent from TypeSpec and mapping evidence; forge actor/role/capability/claim/token/session/provider fields; test missing and neighboring capabilities; assert Resource Master returns `FORBIDDEN` before catalog, repository, persistence, or Convex work. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-operations.test.ts tests/external-garfex-security.test.ts tests/external-garfex-compatibility.test.ts`. Depends on: WU-07 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Remove accidental shared forwarding and retain explicit nested rebuilds for `createResource.attributes`, omitted search values, mutation revisions, and every success value; keep all handlers dependent only on generated client-facing types and `resource-master/public.ts`. Verify `corepack pnpm --filter @garfex/backend typecheck`, focused operation/security tests, and a clean architecture check. Depends on: WU-07 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing normalization tests for all eleven external codes, every Resource Master failure code, valid and malformed `fieldIssues`, `existingResourceId`, and `currentRevision`, catalog unavailable/uninitialized coarsening, integrity/invalid-catalog/internal/unknown/malformed/thrown failures, projection and response-validation failures, diagnostic sink exceptions, and the invariant that a known failure can never become success. Intended files: `apps/backend/tests/external-garfex-error-normalization.test.ts`, `apps/backend/tests/external-garfex-security.test.ts`, and `apps/backend/src/external-garfex-boundary/trusted/errors.ts`. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-error-normalization.test.ts tests/external-garfex-security.test.ts`; failures must cover behavior not yet generalized by the implementation. Depends on: WU-07 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Implement the exhaustive normalizer in `apps/backend/src/external-garfex-boundary/trusted/errors.ts` and connect it through read/mutation/composition outcome handling. Map validation to `VALIDATION_FAILED`, catalog unavailable/uninitialized to `CATALOG_UNAVAILABLE`, and unsafe/unknown/invalid-output/thrown results to metadata-free `INTERNAL_FAILURE`; expose only applicable validated allowlisted metadata and retain operation/phase/cause through a server-only diagnostics callback. Verify focused error/security tests and `corepack pnpm --filter @garfex/backend typecheck`. Depends on: WU-08 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Use hostile getters, proxies, symbols, extra properties, invalid metadata types, internal messages/stacks/provider/Convex/catalog details, thrown authentication/invocation/projection values, and a throwing diagnostics sink across representative and all ten operation paths; assert exactly one validated safe outcome and never a success after a known failure. Verify with `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-error-normalization.test.ts tests/external-garfex-security.test.ts tests/external-garfex-contract.test.ts`. Depends on: WU-08 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Keep the Resource Master error switch exhaustive with a `never` check, isolate safe metadata validators, make diagnostic failure unable to affect outcomes, and ensure error validation remains generated-manifest-driven rather than a second code list. Verify focused error tests, `corepack pnpm --filter @garfex/backend typecheck`, and `corepack pnpm test:architecture`. Depends on: WU-08 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing architecture tests and controlled fixtures for TypeSpec independence, no authority fields, no platform/Convex/persistence leakage, no transport decorator/emitter/framing, no generic executor, no automatic derivation/publication, public-only trusted handlers, exact named mappings, final authorization evidence, stale provenance, and hard-coded/missing/duplicate metadata. Intended files: `tooling/tests/architecture.test.ts`, `tooling/architecture-fixtures/valid/external-garfex-boundary/{contracts/main.tsp,config/tspconfig.yaml,artifacts/semantic-manifest.json,client-facing/generated-contract.ts,trusted/named-mappings.ts,docs/contract.md}`, and focused violations under `tooling/architecture-fixtures/violations/external-garfex-boundary/{contracts,config,artifacts,client-facing,trusted,docs}/`. Verify with `corepack pnpm exec vitest run tooling/tests/architecture.test.ts`; new named-rule assertions must fail before checker support exists. Depends on: WU-08 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Extend `tooling/architecture/check.mjs` to inspect `.tsp`, TypeSpec configuration, manifest/baseline/generated TypeScript/generated Markdown, named mapping evidence, and canonical docs; add named diagnostics for transport, authority, internal derivation, platform leakage, generic execution, automatic publication, stale metadata/provenance, missing final authorization, and missing exact-ten parity. Keep existing dependency-cruiser and backend rules unchanged. Verify `corepack pnpm exec vitest run tooling/tests/architecture.test.ts`, `corepack pnpm test:architecture`, and a passing targeted valid fixture check. Depends on: WU-09 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Run every focused violation individually and assert exactly its intended rule, run the valid external boundary fixture, run the full violation fixture set, and assert architecture inspection never traverses or edits `openspec/changes/persistent-resource-catalog/` or any external counterpart repository. Verify with `corepack pnpm exec vitest run tooling/tests/architecture.test.ts`, `node tooling/architecture/check.mjs tooling/architecture-fixtures/valid/external-garfex-boundary`, and `node tooling/architecture/check.mjs tooling/architecture-fixtures/violations/external-garfex-boundary`. Depends on: WU-09 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Centralize path classification and exact rule diagnostics, preserve configuration-error exit `2` versus architecture-violation exit `1`, and ensure generated/docs scans reject drift without treating manifest JSON as a selected transport. Verify `corepack pnpm test:architecture` and `corepack pnpm exec biome format --check tooling/architecture/check.mjs tooling/tests/architecture.test.ts`. Depends on: WU-09 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Extend documentation parity tests to require the TypeSpec identity/revision section, exact ten operation/mapping/capability rows, exact eleven error/metadata rows, three-boundary ownership, stale/breaking gate links, Convex encapsulation, and every transport/auth-provider/UI/publication/version-policy non-decision. Intended files: `apps/backend/tests/external-garfex-documentation-parity.test.ts`, `tooling/typespec-semantic-manifest/tests/documentation-parity.test.ts`, and `docs/generated/resource-master-external-contract.md`. Verify with `corepack pnpm exec vitest run apps/backend/tests/external-garfex-documentation-parity.test.ts tooling/typespec-semantic-manifest/tests/documentation-parity.test.ts`; assertions must fail until canonical records are updated. Depends on: WU-09 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Update `docs/external-garfex-boundary.md`, `docs/external-client-boundary.md`, `docs/auth-boundary.md`, and `docs/architecture.md` to identify TypeSpec as the GARFEX-owned external semantic authority, link `contracts/external-garfex/resource-master/`, manifest, baseline, generated consumer semantics, and gates, and distinguish trusted fresh actor construction, named handlers, final Resource Master authorization, explicit projections, safe errors, and private Convex infrastructure. Keep detailed consumer shapes in `docs/generated/resource-master-external-contract.md`; do not add routes, verbs, statuses, headers, serialization, SDK, deployment, UI, or productive identity claims. Verify the focused documentation tests and `corepack pnpm exec biome format --check docs/external-garfex-boundary.md docs/external-client-boundary.md docs/auth-boundary.md docs/architecture.md docs/generated/resource-master-external-contract.md`. Depends on: WU-10 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Parse all canonical and generated documents as a standalone consumer/reviewer would: assert exact opaque comparison guidance, no backend knowledge requirement for business workflows, cross-links between all four records, no internal identifiers/diagnostics, no HTTP implication, and parity with manifest, baseline, fixture, and mapping evidence. Verify with `corepack pnpm exec vitest run apps/backend/tests/external-garfex-documentation-parity.test.ts tooling/typespec-semantic-manifest/tests/documentation-parity.test.ts` and `corepack pnpm test:architecture`. Depends on: WU-10 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Lead each document with its decision and quick path, use generated tables instead of duplicated handwritten semantic lists, retain ADR-style ownership and non-decision links, and make wording explicit that compatibility revision `1` is opaque rather than semantic-versioned. Verify documentation parity, architecture, and `corepack pnpm exec biome format --check docs/external-garfex-boundary.md docs/external-client-boundary.md docs/auth-boundary.md docs/architecture.md`. Depends on: WU-10 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] RED — Add failing tooling tests for stable root commands, non-writing versus writing generation behavior, TypeSpec no-emit compilation, temporary manifest/materializer comparison, baseline/revision coupling, parity ordering, and protected-path checks. Intended files: `tooling/tests/contract-tooling.test.ts`, `package.json`, `apps/backend/package.json`, and `tooling/typespec-semantic-manifest/package.json`. Verify with `corepack pnpm exec vitest run tooling/tests/contract-tooling.test.ts`; failures must show absent script/dependency wiring rather than silently skip contract checks. Depends on: WU-10 REFACTOR. <!-- sdd-owner: implementation -->
- [ ] GREEN — Add pinned TypeSpec/compiler dependencies and local package scripts in `package.json`, `tooling/typespec-semantic-manifest/package.json`, `apps/backend/package.json` where backend-focused commands are needed, and `pnpm-lock.yaml`; update `tsconfig.base.json`, `tooling/tsconfig.json`, and `apps/backend/tsconfig.json` only where project references/includes are required. Expose `contract:typespec:check` (`tsp compile . --no-emit`), `contract:generate` (the intentional writer), and `contract:check` (clean temporary generation, manifest/schema/parity/baseline/stale checks) and invoke the non-writing contract check from root `check`. Verify `corepack pnpm exec vitest run tooling/tests/contract-tooling.test.ts`, `corepack pnpm contract:typespec:check`, and `corepack pnpm contract:check`. Depends on: WU-11 RED. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Execute the full gates in dependency order: `corepack pnpm contract:typespec:check`, `corepack pnpm contract:check`, `corepack pnpm test`, `corepack pnpm --filter @garfex/backend test`, `corepack pnpm --filter @garfex/backend typecheck`, `corepack pnpm test:architecture`, `corepack pnpm build`, and `corepack pnpm check`; assert CI/check mode leaves committed artifacts unchanged and assert `git diff --name-only -- openspec/changes/persistent-resource-catalog` is empty. Depends on: WU-11 GREEN. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Make command ordering, temporary-directory cleanup, error reporting, and generated digest comparison deterministic; document the focused and full commands in `docs/external-garfex-boundary.md` and ensure no root command selects a transport, publishes a client, deploys, or changes Resource Master/catalog behavior. Verify one final `corepack pnpm check`, `corepack pnpm build`, and `git diff --name-only -- openspec/changes/persistent-resource-catalog`. Depends on: WU-11 TRIANGULATE. <!-- sdd-owner: implementation -->
- [ ] Record ordinary repository-policy evidence for each future work unit: focused test command and exact result, runtime harness command/scenario and exact result or explicit `N/A` reason, additions plus deletions changed-line count, start/finish state, and exact rollback boundary before promoting it to the next chain unit; keep receipt-driven development `disabled/unmanaged` unless the user separately enables it later. <!-- sdd-owner: parent -->
- [ ] Before any future PR, verify the dependency diagram and clean diff for the current unit, run the full final gates, and confirm zero edits under `openspec/changes/persistent-resource-catalog/`. <!-- sdd-owner: parent -->

    Next recommended action: `parent-lifecycle`. Apply must not start WU-07 in this phase; the parent/orchestrator owns the next lifecycle action.

## WU-07 continuation — mutation composition, handlers, and mapping evidence

### Phase envelope

- Change: `external-client-contract-resource-master`.
- Apply scope: WU-07 only — `Complete the three mutation mappings and final authorization handoff evidence`.
- Work-unit boundary: three mutation handlers, explicit mutation composition, deep-fresh request mapping, mutation projections, exact capability evidence, and ten-operation mapping parity.
- Delivery: `auto-chain`, `stacked-to-main`; current boundary is WU-07 stacked to the completed WU-06 slice.
- Receipt-driven development: `disabled/unmanaged`; no review actor, receipt, commit, push, PR, release, or delivery gate was started.
- WU-08 and later implementation work was not started.

### Structured status consumed

```yaml
schemaName: gentle-ai.sdd-status
changeName: external-client-contract-resource-master
artifactStore: openspec
authoritative: true
applyState: ready
taskProgress: WU-01..WU-07 implementation rows complete; WU-08..WU-11 remain unchecked
dependencies: { apply: ready, verify: blocked, archive: blocked }
actionContext:
  mode: repo-local
  workspaceRoot: /home/garfex/PROGRAMACION/garfex-platform
  allowedEditRoots: [/home/garfex/PROGRAMACION/garfex-platform]
  warnings: ["two WU-09-owned architecture checker violations remain"]
nextRecommended: apply
```

The high-workload gate was resolved by the parent as `auto-chain` / `stacked-to-main`. All edits stayed inside the authoritative workspace and only WU-07-owned source/tests plus the cumulative artifacts were changed.

### Completed implementation tasks and persisted checkbox updates

- [x] WU-07 RED — Added composition-level failing tests for named mutation handlers, validation-before-authentication, forged authority rejection, and exact ten-operation evidence. The pre-implementation focused run failed with missing mutation handlers and composition wrappers; the RED row is visibly checked in `tasks.md`.
- [x] WU-07 GREEN — Added `handleCreateResource`, `handleUpdateNonIdentityData`, and `handleDeactivateResource` with explicit public-interface mappings and deep-fresh nested attribute rebuilding. Added three composition-owned mutation wrappers and the compile-time `externalOperationMappingEvidence` object with exactly ten identically named mappings and capabilities. Focused tests and backend typecheck passed; the GREEN row is visibly checked in `tasks.md`.
- [x] WU-07 TRIANGULATE — Exercised all ten named wrappers/mappings, forged authority-like fields, mutation freshness, explicit projections, and Resource Master deny-before-downstream behavior. The focused operation/security/composition suite passed 104 tests; full `corepack pnpm test` passed 324 tests. The TRIANGULATE row is visibly checked in `tasks.md`.
- [x] WU-07 REFACTOR — Applied Biome import/format cleanup without changing behavior; retained stable explicit invoke wrappers and no callable generic dispatcher. Backend typecheck and focused tests remained green; the REFACTOR row is visibly checked in `tasks.md`.

### Files changed in the WU-07 boundary

- `apps/backend/src/external-garfex-boundary/composition.ts`
- `apps/backend/src/external-garfex-boundary/trusted/mutation-operations.ts`
- `apps/backend/src/external-garfex-boundary/trusted/projections.ts` (existing WU-07 projection evidence retained)
- `apps/backend/tests/external-garfex-composition.test.ts`
- `apps/backend/tests/external-garfex-operations.test.ts` (existing mutation evidence retained)
- `apps/backend/tests/external-garfex-security.test.ts` (existing mutation security evidence retained)
- `openspec/changes/external-client-contract-resource-master/tasks.md`
- `openspec/changes/external-client-contract-resource-master/apply-progress.md`

Resource Master public/application/domain/infrastructure, catalog/persistence, Convex, UI, transport, and `persistent-resource-catalog` paths were not edited. The two architecture checker errors `external-contract-no-platform` for generated imports in `client-facing/contract.ts` and `client-facing/validation.ts` are acknowledged as WU-09-owned architecture work and were not fixed.

### Verification evidence

| Command | Result |
| --- | --- |
| `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-composition.test.ts tests/external-garfex-operations.test.ts tests/external-garfex-security.test.ts` | PASS — 3 files, 104 tests. |
| `corepack pnpm --filter @garfex/backend typecheck` | PASS. |
| `corepack pnpm test` | PASS — 26 files, 324 tests; 88.08% statements, 79.15% branches, 96.72% functions, 90.04% lines. |
| `corepack pnpm test:architecture` | PARTIAL — Vitest architecture suite passed 6 tests; checker then reported the two pre-existing WU-09-owned `external-contract-no-platform` violations listed above. |
| `corepack pnpm exec biome check --write apps/backend/src/external-garfex-boundary/composition.ts apps/backend/src/external-garfex-boundary/trusted/mutation-operations.ts apps/backend/tests/external-garfex-composition.test.ts` | PASS — formatting/import cleanup applied. |
| `git diff --check` | PASS. |
| `git diff --name-only -- openspec/changes/persistent-resource-catalog` | PASS — empty output. |

Runtime harness: `N/A` — this work unit changes the in-process trusted composition boundary and has no network/runtime harness.

Rollback boundary: revert WU-07 mutation/composition/test changes and the WU-07 task/progress entries without changing `apps/backend/src/resource-master/public.ts`, Resource Master authorization/application/domain/infrastructure, catalog/persistence, Convex, UI, transport, or `persistent-resource-catalog`.

### Strict TDD cycle evidence

| Task | Test layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- | --- | --- |
| WU-07 mutation mappings and authorization handoff | Backend Vitest integration/unit tests | PASS — 3 files, 102 tests before WU-07 edits | PASS — 2 new composition tests failed before handlers/wrappers existed | PASS — 3 files, 103 tests after handlers/wrappers; backend typecheck passed | PASS — exact ten wrapper/mapping evidence, mutation freshness, forged authority, projections, and deny-before-data; 104 focused tests and 324 full tests passed | PASS — Biome cleanup; focused tests and typecheck remained green |

### Deviations and risks

- No design deviation was introduced.
- The existing mutation invoke wrappers remain as stable explicit compatibility wrappers in `trusted/mutation-operations.ts`; new composition-owned wrappers perform validation/authentication before calling named handlers.
- `test:architecture` remains non-green only because of the two acknowledged WU-09-owned architecture checker violations; no WU-09 code was modified.
- No WU-08+ implementation, review, receipt, commit, PR, push, release, or delivery validation was started.

### Remaining implementation and parent-owned tasks

The persisted `tasks.md` artifact was re-read after updates. All four WU-07 implementation rows are visibly `[x]`. The first unchecked implementation row is WU-08 RED; WU-08 through WU-11 and the parent-owned lifecycle rows remain unchecked and deferred.

Next recommended action: `parent-lifecycle`; sdd-apply must not start WU-08, review actors, receipts, or delivery gates.

## WU-08 continuation — exhaustive safe failure normalization

### Phase envelope

- Change: `external-client-contract-resource-master`.
- Apply scope: WU-08 only — safe Resource Master failure normalization and server-diagnostic containment.
- Work-unit boundary: `trusted/errors.ts` and focused normalization/security evidence only; WU-09 and later were not started.
- Delivery: `auto-chain`, `stacked-to-main`; current boundary is WU-08 stacked after WU-07.
- Receipt-driven development: `disabled/unmanaged`; no review actor, receipt, commit, push, PR, release, or delivery gate was started.

### Structured status consumed

```yaml
schemaName: gentle-ai.sdd-status
changeName: external-client-contract-resource-master
authoritative: true
applyState: ready
scope: WU-08 only
actionContext:
  mode: repo-local
  workspaceRoot: /home/garfex/PROGRAMACION/garfex-platform
  allowedEditRoots: [/home/garfex/PROGRAMACION/garfex-platform]
delivery_strategy: auto-chain
chain_strategy: stacked-to-main
receiptDrivenDevelopment: disabled/unmanaged
warnings:
  - known architecture generated-import violations remain assigned to WU-09
```

### Completed implementation tasks and persisted checkbox updates

- [x] WU-08 RED — Added `apps/backend/tests/external-garfex-error-normalization.test.ts` before production changes. The initial focused run failed 4 assertions for field-issue propagation and malformed known failures, while the prior security suite remained green.
- [x] WU-08 GREEN — Reworked `apps/backend/src/external-garfex-boundary/trusted/errors.ts` to normalize every Resource Master public failure code, coarsen catalog availability/uninitialized outcomes, validate only applicable `fieldIssues`/`existingResourceId`/`currentRevision` through the generated-manifest-driven external failure validator, and preserve server-only diagnostic callback behavior.
- [x] WU-08 TRIANGULATE — Added hostile proxy/getter, symbol, malformed metadata, internal diagnostic-content, throwing sink, all ten operation identifiers, and all failure phases evidence. Focused error/security/contract tests passed with no success outcome after known failure.
- [x] WU-08 REFACTOR — Kept the Resource Master internal-code switch exhaustive with a `never` check, isolated generated-validator-backed metadata construction, removed handwritten external membership validation from the normalizer, and ensured diagnostic sink exceptions cannot affect outcomes.

The persisted OpenSpec task checkbox for each WU-08 implementation row is visibly `[x]` in `tasks.md`. WU-09 rows remain unchecked and were not edited.

### Files changed in the WU-08 boundary

- `apps/backend/src/external-garfex-boundary/trusted/errors.ts`
- `apps/backend/tests/external-garfex-error-normalization.test.ts`
- `openspec/changes/external-client-contract-resource-master/tasks.md`
- `openspec/changes/external-client-contract-resource-master/apply-progress.md`

No Resource Master, Convex, UI, transport, `persistent-resource-catalog`, or WU-09+ implementation path was edited.

### Strict TDD cycle evidence

| Task | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- |
| WU-08 safe failure normalization | New focused suite failed 4 assertions before production edits | Focused error/security tests passed; backend typecheck passed | Focused error/security/contract tests passed: 3 files, 70 tests; hostile values, all ten operations, all phases, and sink failure covered | Biome formatting and full suite passed; generated validator remains the external error authority |

### Verification evidence

| Command | Result |
| --- | --- |
| `corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-error-normalization.test.ts tests/external-garfex-security.test.ts tests/external-garfex-contract.test.ts` | PASS — 3 files, 70 tests. |
| `corepack pnpm --filter @garfex/backend typecheck` | PASS. |
| `corepack pnpm test` | PASS — 27 files, 346 tests; 88.13% statements, 79.04% branches, 96.7% functions, 90.06% lines. |
| `corepack pnpm test:architecture` | BLOCKED by the two known generated-import violations assigned to WU-09: `client-facing/contract.ts` and `client-facing/validation.ts` importing `./generated/semantic-contract.generated.js`. No WU-09 fix was made. |
| `corepack pnpm exec biome format --write apps/backend/src/external-garfex-boundary/trusted/errors.ts apps/backend/tests/external-garfex-error-normalization.test.ts` | PASS — 2 files formatted. |
| `git diff --check` | PASS. |
| `git diff --name-only -- openspec/changes/persistent-resource-catalog` | PASS — empty output. |

Runtime harness: `N/A` — WU-08 changes normalization and boundary containment; no new runtime endpoint or harness scenario exists.

Rollback boundary: revert `trusted/errors.ts` and `external-garfex-error-normalization.test.ts`; retain response validation as a required gate and do not expose any internal diagnostic type.

### Deviations and risks

- The design is preserved. The required architecture command cannot pass until the known WU-09 generated-import violations are corrected; those files were intentionally left untouched.
- The normalizer delegates external error membership and metadata shape validation to `validateExternalFailure`, whose generated manifest algebra remains authoritative; the internal Resource Master code switch remains explicit and exhaustive.
- Remaining implementation work starts at WU-09. Parent-owned lifecycle rows remain deferred.

### Remaining implementation tasks

The exact next unchecked implementation rows are the four WU-09 rows beginning:

- [ ] RED — Add failing architecture tests and controlled fixtures for TypeSpec independence, no authority fields, no platform/Convex/persistence leakage, no transport decorator/emitter/framing, no generic executor, no automatic derivation/publication, public-only trusted handlers, exact named mappings, final authorization evidence, stale provenance, and hard-coded/missing/duplicate metadata. <!-- sdd-owner: implementation -->
- [ ] GREEN — Extend `tooling/architecture/check.mjs` to inspect `.tsp`, TypeSpec configuration, manifest/baseline/generated TypeScript/generated Markdown, named mapping evidence, and canonical docs; add named diagnostics for transport, authority, internal derivation, platform leakage, generic execution, automatic publication, stale metadata/provenance, missing final authorization, and missing exact-ten parity. <!-- sdd-owner: implementation -->
- [ ] TRIANGULATE — Run every focused violation individually and assert exactly its intended rule, run the valid external boundary fixture, run the full violation fixture set, and assert architecture inspection never traverses or edits `openspec/changes/persistent-resource-catalog/` or any external counterpart repository. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Centralize path classification and exact rule diagnostics, preserve configuration-error exit `2` versus architecture-violation exit `1`, and ensure generated/docs scans reject drift without treating manifest JSON as a selected transport. <!-- sdd-owner: implementation -->

    Next recommended action: `parent-lifecycle` after this bounded apply slice. No review or receipt was created by sdd-apply.

## WU-09 core continuation — architecture checker RED and GREEN

### Phase envelope

- Change: `external-client-contract-resource-master`.
- Apply scope: WU-09 core only — architecture checker, representative valid/violating fixtures, and focused architecture tests.
- Work-unit boundary: checker core and enough fixture evidence to make architecture green; TRIANGULATE and REFACTOR remain deferred to the next bounded slice.
- Delivery: `auto-chain`, `stacked-to-main`; current boundary is WU-09 core stacked after WU-08.
- Receipt-driven development: `disabled/unmanaged`; no review actor, receipt, commit, push, PR, release, or delivery gate was started.

### Structured status consumed

```yaml
schemaName: gentle-ai.sdd-status
changeName: external-client-contract-resource-master
artifactStore: openspec
authoritative: true
applyState: ready
taskProgress: WU-09 RED and GREEN complete; TRIANGULATE and REFACTOR remain unchecked
dependencies: { apply: ready, verify: blocked, archive: blocked }
actionContext:
  mode: repo-local
  workspaceRoot: /home/garfex/PROGRAMACION/garfex-platform
  allowedEditRoots: [/home/garfex/PROGRAMACION/garfex-platform]
  warnings: []
nextRecommended: parent-lifecycle
reviewWorkload: { decisionNeededBeforeApply: false, chainedPRsRecommended: true, chainStrategy: stacked-to-main, budgetRisk: high }
```

The active native attempt token was authenticated and reused. The parent supplied the resolved `auto-chain` / `stacked-to-main` delivery path. All edits remained under the allowed workspace root, and WU-10 was not started.

### Completed implementation tasks and persisted checkbox updates

- [x] WU-09 RED — Added the architecture test assertions and controlled TypeSpec/config/artifact/generated/trusted/docs fixture set. The pre-support focused run failed as required because the new automatic-publication rule was not implemented. The persisted RED row in `tasks.md` is visibly `[x]`.
- [x] WU-09 GREEN — Extended `tooling/architecture/check.mjs` to inspect `.tsp`, TypeSpec configuration, manifest/generated artifacts, named mappings, and canonical docs; added named checks for exact-ten parity, stale metadata, automatic publication, final authorization evidence, and transport/platform/authority/internal/generic rules. Approved imports of `./generated/semantic-contract.generated.js` are distinguished from forbidden platform/generated imports. Existing dependency-cruiser/backend rules and exit statuses remain unchanged. The persisted GREEN row in `tasks.md` is visibly `[x]`.

### Files changed in this boundary

- `tooling/architecture/check.mjs`
- `tooling/tests/architecture.test.ts`
- `tooling/architecture-fixtures/valid/external-garfex-boundary/`
- `tooling/architecture-fixtures/violations/external-garfex-boundary/`
- `openspec/changes/external-client-contract-resource-master/tasks.md`
- `openspec/changes/external-client-contract-resource-master/apply-progress.md`

### Strict TDD cycle evidence

| Task | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- |
| WU-09 architecture checker core | Focused architecture suite failed before checker support (`automatic-publication.ts` passed unexpectedly) | Focused architecture suite passed: 7 tests; full architecture command passed; approved generated contract imports no longer raise platform violations | Deferred to next bounded slice | Deferred to next bounded slice |

### Verification evidence

| Command | Result |
| --- | --- |
| `corepack pnpm exec vitest run tooling/tests/architecture.test.ts` | PASS — 1 file, 7 tests. |
| `corepack pnpm test:architecture` | PASS — architecture tests 7/7 and checker passed with 66 modules cruised. |
| `corepack pnpm test` | PASS — 27 files, 347 tests; 88.13% statements, 79.04% branches, 96.7% functions, 90.06% lines. |
| `git diff --check` | Not run after final fixture edits. |
| `git diff --name-only -- openspec/changes/persistent-resource-catalog` | Not run after final fixture edits; protected path was not edited by scope. |

Runtime harness: `N/A` — this slice changes repository architecture analysis and fixtures, not an application runtime boundary.

Rollback boundary: revert `tooling/architecture/check.mjs`, `tooling/tests/architecture.test.ts`, and the external-boundary fixtures; retain WU-08 runtime protections and leave Resource Master untouched.

### Deviations and remaining work

- TRIANGULATE and REFACTOR remain intentionally unchecked for the next bounded slice; this executor did not exhaustively run every violation individually or centralize the checker further.
- The exact unchecked implementation rows remain:

- [ ] TRIANGULATE — Run every focused violation individually and assert exactly its intended rule, run the valid external boundary fixture, run the full violation fixture set, and assert architecture inspection never traverses or edits `openspec/changes/persistent-resource-catalog/` or any external counterpart repository. <!-- sdd-owner: implementation -->
- [ ] REFACTOR — Centralize path classification and exact rule diagnostics, preserve configuration-error exit `2` versus architecture-violation exit `1`, and ensure generated/docs scans reject drift without treating manifest JSON as a selected transport. <!-- sdd-owner: implementation -->

Parent-owned lifecycle actions remain deferred. Next recommended action: `parent-lifecycle`. No review or receipt was created by sdd-apply.

## Bounded WU-09 generated-import correction

### Structured status consumed

```yaml
schemaName: gentle-ai.sdd-status
changeName: external-client-contract-resource-master
artifactStore: openspec
authoritative: true
applyState: ready
taskProgress: WU-09 RED and GREEN checked; TRIANGULATE and REFACTOR remain unchecked
dependencies: { apply: ready, verify: blocked, archive: blocked }
actionContext:
  mode: repo-local
  workspaceRoot: /home/garfex/PROGRAMACION/garfex-platform
  allowedEditRoots: [/home/garfex/PROGRAMACION/garfex-platform]
  warnings: [bounded post-GREEN correction; do not start WU-10]
nextRecommended: parent-lifecycle
reviewWorkload: { decisionNeededBeforeApply: false, chainedPRsRecommended: true, chainStrategy: stacked-to-main, budgetRisk: high }
```

### Correction and scope

- Corrected only `tooling/architecture-fixtures/violations/external-garfex-boundary/client-facing/generated-import.ts`: the approved generated contract import now uses five parent traversals, from the fixture's five-level depth to repository root.
- No WU-09 TRIANGULATE or REFACTOR checkbox was changed; WU-10 was not started.
- No commit, push, PR, review, receipt, or delivery gate was created.

### Verification evidence

| Command | Result |
| --- | --- |
| Primary fixture type diagnostic via `tsc --noEmit --module NodeNext --moduleResolution NodeNext --target ES2022 --skipLibCheck .../generated-import.ts` | No TS2307 wrong-depth error; existing TS2305 reports that the generated module has no `GeneratedContract` export. |
| `corepack pnpm exec vitest run tooling/tests/architecture.test.ts` | PASS — 1 file, 7 tests. |
| `node tooling/architecture/check.mjs tooling/architecture-fixtures/violations/external-garfex-boundary` | Expected violation-fixture result — exit 1 with named controlled violations; corrected generated-import fixture is no longer a wrong-depth TS2307 case. |

The persisted tasks artifact was re-read; WU-09 TRIANGULATE and REFACTOR remain visibly unchecked and unchanged. Remaining implementation rows are exactly those two rows. Next recommended action: `parent-lifecycle`.

    ## WU-09 core-fix continuation — generated export correction

    ### Structured status consumed

    ```yaml
    schemaName: gentle-ai.sdd-status
    changeName: external-client-contract-resource-master
    artifactStore: openspec
    authoritative: true
    applyState: ready
    taskProgress: WU-09 RED and GREEN checked; TRIANGULATE and REFACTOR remain unchecked
    dependencies: { apply: ready, verify: blocked, archive: blocked }
    actionContext:
      mode: repo-local
      workspaceRoot: /home/garfex/PROGRAMACION/garfex-platform
      allowedEditRoots: [/home/garfex/PROGRAMACION/garfex-platform]
      warnings: [bounded post-GREEN correction; do not start WU-10]
    nextRecommended: parent-lifecycle
    reviewWorkload: { decisionNeededBeforeApply: false, chainedPRsRecommended: true, chainStrategy: stacked-to-main, budgetRisk: high }
    ```

    The active `wu-09-core-fix` attempt was authenticated with the preserved native token. The parent-provided delivery path remains `auto-chain` / `stacked-to-main`. Only the assigned fixture and this cumulative progress artifact were touched; WU-09 TRIANGULATE/REFACTOR checkboxes remain unchanged and WU-10 was not started.

    ### Correction

    - Updated `tooling/architecture-fixtures/violations/external-garfex-boundary/client-facing/generated-import.ts` to import and alias the exported `GeneratedSemanticManifest` type from the real generated module. The five-level relative path is unchanged.

    ### Verification evidence

    | Command | Result |
    | --- | --- |
    | `corepack pnpm exec tsc --noEmit --module NodeNext --moduleResolution NodeNext --target ES2022 --skipLibCheck tooling/architecture-fixtures/violations/external-garfex-boundary/client-facing/generated-import.ts` | PASS — primary fixture diagnostics are clean; no TS2307 or TS2305 remains. |
    | `corepack pnpm exec vitest run tooling/tests/architecture.test.ts` | PASS — 1 file, 7 tests. |
    | `node tooling/architecture/check.mjs tooling/architecture-fixtures/violations/external-garfex-boundary` | Expected exit 1 — all remaining output is from the independently controlled violating fixtures; corrected generated-import fixture emits no diagnostic. |
    | `git diff --check` | PASS. |
    | `git diff --name-only -- openspec/changes/persistent-resource-catalog` | PASS — empty output. |

    The repository Biome CLI rejects `format --check` in this installed version; the edit operation reported the TypeScript fixture clean. No task checkbox was changed. Runtime harness: `N/A` — this is a fixture type-diagnostic correction. Rollback boundary: revert the one-line generated export correction and this progress entry; retain the WU-09 core checker and fixture set.

    ### Remaining implementation tasks

    - [ ] TRIANGULATE — Run every focused violation individually and assert exactly its intended rule, run the valid external boundary fixture, run the full violation fixture set, and assert architecture inspection never traverses or edits `openspec/changes/persistent-resource-catalog/` or any external counterpart repository. Depends on: WU-09 GREEN. <!-- sdd-owner: implementation -->
    - [ ] REFACTOR — Centralize path classification and exact rule diagnostics, preserve configuration-error exit `2` versus architecture-violation exit `1`, and ensure generated/docs scans reject drift without treating manifest JSON as a selected transport. Depends on: WU-09 TRIANGULATE. <!-- sdd-owner: implementation -->

    Next recommended action: `parent-lifecycle`. No review, receipt, commit, push, PR, or delivery gate was created.


    ## WU-09 TRIANGULATE and REFACTOR completion

    ### Structured status consumed and produced

    ```yaml
    schemaName: gentle-ai.sdd-status
    changeName: external-client-contract-resource-master
    artifactStore: openspec
    authoritative: true
    applyState: ready
    taskProgress: WU-09 TRIANGULATE and REFACTOR checked; WU-10 untouched
    dependencies: { apply: ready, verify: blocked, archive: blocked }
    actionContext:
      mode: repo-local
      workspaceRoot: /home/garfex/PROGRAMACION/garfex-platform
      allowedEditRoots: [/home/garfex/PROGRAMACION/garfex-platform]
      warnings: [bounded wu-09-final; do not start WU-10]
    nextRecommended: parent-lifecycle
    reviewWorkload: { decisionNeededBeforeApply: false, chainedPRsRecommended: true, chainStrategy: stacked-to-main, budgetRisk: high }
    receiptDrivenDevelopment: disabled/unmanaged
    ```

    ### Completed tasks and implementation

    - [x] WU-09 TRIANGULATE — Ran all eleven focused violation fixtures individually. Each returned exit 1 and exactly its named rule after suppressing unrelated generic diagnostics for the classified external-boundary path. Ran the valid fixture (exit 0), full violation fixture set (exit 1), protected persistent-catalog target (exit 0 without traversal), and escaping counterpart symlink test (exit 1 without traversal).
    - [x] WU-09 REFACTOR — Added centralized external path classification and named external-rule constants, excluded the protected catalog path from recursive scans, preserved configuration exit 2 and violation exit 1, and kept JSON manifest content outside source transport scans. Generated and documentation fixture scans remain drift-sensitive through metadata checks.

    ### Files changed

    - `tooling/architecture/check.mjs`
    - `tooling/tests/architecture.test.ts`
    - `openspec/changes/external-client-contract-resource-master/tasks.md`
    - `openspec/changes/external-client-contract-resource-master/apply-progress.md`

    ### Strict TDD cycle evidence

    | Task | RED | GREEN | TRIANGULATE | REFACTOR |
    | --- | --- | --- | --- | --- |
    | WU-09 TRIANGULATE | Strengthened focused assertions to inspect every emitted rule; the pre-refactor run failed on overlapping generic diagnostics. | Existing checker behavior plus valid/full fixture gates remained green after path classification guards. | All focused fixtures produced only their intended unique rule; valid/full sets, protected path, counterpart symlink, and exit-code distinctions passed. | N/A — this row is the triangulation evidence boundary. |
    | WU-09 REFACTOR | Preserved the failing exact-rule evidence from TRIANGULATE. | Centralized path/rule classification and scan exclusions without changing intended diagnostics. | Focused, valid/full, protected-path, manifest-JSON, and exit-code tests passed after refactor. | `corepack pnpm test:architecture` and Biome formatting passed. |

    ### Verification evidence

    | Command | Result |
    | --- | --- |
    | `corepack pnpm exec vitest run tooling/tests/architecture.test.ts` | PASS — 1 file, 9 tests. |
    | `corepack pnpm test:architecture` | PASS — focused suite and default architecture scan; 9 tests, 66 modules cruised. |
    | `node tooling/architecture/check.mjs tooling/architecture-fixtures/valid/external-garfex-boundary` | PASS — exit 0. |
    | `node tooling/architecture/check.mjs tooling/architecture-fixtures/violations/external-garfex-boundary` | PASS as expected violation gate — exit 1, 12 controlled diagnostic lines. |
    | `node tooling/architecture/check.mjs tooling/does-not-exist` | PASS as expected configuration failure — exit 2. |
    | `corepack pnpm exec biome format --write tooling/architecture/check.mjs tooling/tests/architecture.test.ts` | PASS — installed Biome form; both files formatted. |
    | `git diff --check` | PASS. |
    | `git diff --name-only -- openspec/changes/persistent-resource-catalog` | PASS — empty output. |

    Runtime harness: `N/A` — WU-09 is a static architecture checker and controlled-fixture boundary.

    Rollback boundary: revert the WU-09 checker/test refactor and its two task/progress updates; retain prior WU-09 GREEN behavior and all earlier work units.

    ### Remaining implementation tasks

    - [ ] RED — Extend documentation parity tests to require the TypeSpec identity/revision section, exact ten operation/mapping/capability rows, exact eleven error/metadata rows, three-boundary ownership, stale/breaking gate links, Convex encapsulation, and every transport/auth-provider/UI/publication/version-policy non-decision. Depends on: WU-09 REFACTOR. <!-- sdd-owner: implementation -->

    WU-10 was not started. Parent-owned lifecycle actions remain deferred. No review, receipt, commit, push, PR, or delivery gate was created.

## WU-10 continuation — consumer documentation and canonical boundary records

### Completed implementation tasks

- [x] WU-10 RED — Added failing-first parity assertions for canonical record links, TypeSpec source/manifest/baseline/generated-doc evidence, boundary ownership, trusted actor/final authorization/Convex statements, opaque revision guidance, and consumer-safe generated semantics. Added `tooling/typespec-semantic-manifest/tests/documentation-parity.test.ts`.
- [x] WU-10 GREEN — Updated `docs/external-garfex-boundary.md`, `docs/external-client-boundary.md`, `docs/auth-boundary.md`, and `docs/architecture.md` with decision-led TypeSpec ownership, exact operation/mapping/capability and failure metadata references, linked evidence/gates, distinct three-boundary responsibilities, and preserved non-decisions. Updated manifest-derived generated consumer Markdown through `materialize-docs.ts`.
- [x] WU-10 TRIANGULATE — Parity tests parse canonical and generated records, verify exact manifest operation/error counts and generated byte parity, reject internal concepts in consumer semantics, and verify cross-record links and opaque comparison guidance.
- [x] WU-10 REFACTOR — Kept semantic tables manifest-derived, added a concise consumer decision section to the generated materializer, and retained ADR-style decision links without introducing transport, provider, UI, publication, or version-policy choices.

### TDD Cycle Evidence

| Task | Test files / layer | RED | GREEN | TRIANGULATE | REFACTOR | Safety net |
| --- | --- | --- | --- | --- | --- | --- |
| WU-10 consumer documentation and canonical records | `apps/backend/tests/external-garfex-documentation-parity.test.ts`, `tooling/typespec-semantic-manifest/tests/documentation-parity.test.ts` / documentation and manifest parity | Added failing-first assertions for canonical links, TypeSpec/manifest/baseline/generated evidence, boundary ownership, trusted actor and final authorization statements, Convex isolation, opaque revision guidance, and consumer-safe semantics. | PASS — `corepack pnpm exec vitest run apps/backend/tests/external-garfex-documentation-parity.test.ts tooling/typespec-semantic-manifest/tests/documentation-parity.test.ts`; 2 files, 5 tests. | PASS — parity tests parsed canonical and generated records, verified exact manifest operation/error counts and generated-byte parity, rejected internal concepts, and checked cross-record links and opaque comparison guidance. The expanded materializer/parity run passed 3 files and 9 tests. | PASS — semantic tables remained manifest-derived and the generated materializer retained concise decision-led documentation; the focused suites, root tests, backend typecheck, and architecture checks remained green. | PASS — `corepack pnpm test` passed 28 files and 352 tests; backend typecheck and architecture checks also passed. |

Persisted OpenSpec task checkboxes for all four WU-10 implementation rows are visibly `[x]` in `tasks.md`; WU-11 remains unchecked and untouched.

### Files changed for WU-10

- `apps/backend/tests/external-garfex-documentation-parity.test.ts`
- `tooling/typespec-semantic-manifest/tests/documentation-parity.test.ts`
- `tooling/typespec-semantic-manifest/src/materialize-docs.ts`
- `docs/generated/resource-master-external-contract.md`
- `docs/external-garfex-boundary.md`
- `docs/external-client-boundary.md`
- `docs/auth-boundary.md`
- `docs/architecture.md`
- `openspec/changes/external-client-contract-resource-master/tasks.md`
- `openspec/changes/external-client-contract-resource-master/apply-progress.md`

### Verification evidence

| Command | Result |
| --- | --- |
| `corepack pnpm exec vitest run apps/backend/tests/external-garfex-documentation-parity.test.ts tooling/typespec-semantic-manifest/tests/documentation-parity.test.ts` | PASS — 2 files, 5 tests. |
| `corepack pnpm exec vitest run ...materializers.test.ts` with documentation parity suites | PASS — 3 files, 9 tests. |
| `corepack pnpm test` | PASS — 28 files, 352 tests. |
| `corepack pnpm --filter @garfex/backend typecheck` | PASS. |
| `corepack pnpm test:architecture` | PASS — 9 tests and 66 modules cruised. |
| `git diff --check` | PASS. |
| `git diff --name-only -- openspec/changes/persistent-resource-catalog` | PASS — empty; protected change untouched. |

The requested `biome format --check` form is unsupported by the installed Biome CLI; no formatting-only check was claimed. The TypeScript and Markdown edit tools reported clean formatting for edited files.

Runtime harness: `N/A` — WU-10 changes documentation, manifest materialization, and parity tests only; no runtime boundary was added.

Rollback boundary: restore the four canonical records, generated consumer Markdown, and materializer parity change together; do not alter the TypeSpec authority, runtime boundary, Resource Master, Convex, or protected catalog.

### Workload and lifecycle boundary

Delivery remains `auto-chain` / `stacked-to-main`; current PR boundary is WU-10 only. No commit, push, PR, release, review actor, receipt, or delivery gate was started. WU-11 remains deferred to the parent lifecycle.

### Structured status consumed

Consumed native status: change `external-client-contract-resource-master`, state `ready`, scope `WU-10 only`, workspace root `/home/garfex/PROGRAMACION/garfex-platform`, allowed edit root limited to that workspace, delivery `auto-chain` / `stacked-to-main`, receipt-driven development `disabled/unmanaged`. No action-context warning or unsafe edit-root condition was present.

### Remaining tasks

- WU-11 implementation rows remain unchecked and are deferred.
- Parent-owned lifecycle rows remain unchanged and deferred.

### WU-10 verification correction

After the cumulative entry, Biome reported import ordering and line wrapping in the two new parity tests and materializer source. `corepack pnpm exec biome check --write` corrected those three files, followed by `corepack pnpm exec biome check` passing with no diagnostics. The generated Markdown remains byte-identical to `materializeDocs(manifest)` after this formatting-only source cleanup. WU-11 and parent-owned rows remain unchanged.

## WU-11 continuation — root tooling and complete acceptance gates

### Phase envelope

- Change: `external-client-contract-resource-master`.
- Apply scope: WU-11 only — root TypeSpec/tooling wiring and complete acceptance gates.
- Delivery: `auto-chain`, `stacked-to-main`; current boundary is WU-11 stacked on WU-10.
- Receipt-driven development: `disabled/unmanaged`; no review, receipt, commit, push, PR, release, publication, deployment, sync, or archive was run.
- Protected scope: no edits under `openspec/changes/persistent-resource-catalog/`; Resource Master, UI, transport, and client publication remain untouched.

### Structured status consumed

```yaml
schemaName: gentle-ai.sdd-status
changeName: external-client-contract-resource-master
authoritative: true
applyState: ready
scope: WU-11 only
deliveryStrategy: auto-chain
chainStrategy: stacked-to-main
actionContext:
  mode: repo-local
  workspaceRoot: /home/garfex/PROGRAMACION/garfex-platform
  allowedEditRoots: [/home/garfex/PROGRAMACION/garfex-platform]
  warnings: []
nextRecommended: parent-lifecycle
```

The review workload gate was consumed as resolved: `Decision needed before apply: No`, `Chained PRs recommended: Yes`, `Chain strategy: stacked-to-main`, and `400-line budget risk: High`; the parent supplied `auto-chain`.

### Completed WU-11 tasks and persisted checkbox updates

- [x] RED — Added `tooling/tests/contract-tooling.test.ts` first. The initial focused run failed all five assertions because the stable commands and wiring were absent. The final suite covers command exposure, explicit writer versus read-only check behavior, TypeSpec no-emit compilation, ordering, temporary cleanup, diagnostics, and protected-path checks.
- [x] GREEN — Reused the existing pinned root `@typespec/compiler` `1.15.0` and workspace local package rather than adding duplicate packages. Added root commands `contract:typespec:check`, `contract:generate`, and `contract:check`; added local package forwarding scripts; added the checked-in Node/TypeScript source tooling loader and non-writing temporary generation comparator. Root `check` invokes `contract:check` first.
- [x] TRIANGULATE — The complete gates passed in dependency order: TypeSpec no-emit, non-writing contract check, root test, backend test, backend typecheck, architecture tests/check, build, and final root check. Check mode left manifest/runtime/docs bytes unchanged and `git diff --name-only -- openspec/changes/persistent-resource-catalog` was empty. Final root test count was 29 files and 358 tests; backend tests were 19 files and 268 tests; architecture was 9 tests and 66 modules.
- [x] REFACTOR — Made command ordering, temporary cleanup, digest/parity diagnostics deterministic; excluded generated runtime embedding from formatting-only root scans so generated bytes remain canonical; documented focused and full commands in `docs/external-garfex-boundary.md`. No root command publishes, deploys, selects a transport, or changes Resource Master/catalog behavior.

### Files changed in this WU-11 boundary

- `package.json`
- `tooling/typespec-semantic-manifest/package.json`
- `tooling/contract-tooling.mjs`
- `tooling/ts-source-loader.mjs`
- `tooling/tests/contract-tooling.test.ts`
- `tooling/typespec-semantic-manifest/src/compare.ts` (strip-only Node compatibility for the existing comparator import)
- `biome.json`
- `docs/external-garfex-boundary.md`
- `openspec/changes/external-client-contract-resource-master/tasks.md`
- `openspec/changes/external-client-contract-resource-master/apply-progress.md`

No dependency lockfile change was necessary: the pinned TypeSpec compiler already existed at the workspace root and is referenced by the local package peer dependency, avoiding duplicate packages.

### Strict TDD cycle evidence

| Task | RED | GREEN | TRIANGULATE | REFACTOR |
| --- | --- | --- | --- | --- |
| WU-11 root tooling | Focused suite failed 5/5 before scripts/tooling existed | Focused suite passed 5 tests, then 6 tests after writer coverage; no-emit and contract check passed | Full listed gates passed; check-mode artifact snapshot and protected catalog diff were unchanged | Deterministic ordering/cleanup/diagnostics, generated-byte formatting exclusion, and focused/full command documentation passed final check |

### Verification evidence

| Command | Result |
| --- | --- |
| `corepack pnpm exec vitest run tooling/tests/contract-tooling.test.ts` | PASS — 1 file, 6 tests. |
| `corepack pnpm contract:typespec:check` | PASS — TypeSpec compiler v1.15.0, no emitter. |
| `corepack pnpm contract:check` | PASS — non-writing temporary generation, schema/manifest bytes, materializer parity, baseline coupling, stale digest; temporary directory cleaned; digest `sha256:32a4d0ea37e9441763d49971c8075d21fa07cc36b0ea69446613098a12b83f53`. |
| `corepack pnpm test` | PASS — 29 files, 358 tests; 88.13% statements / 79.04% branches / 96.70% functions / 90.06% lines. |
| `corepack pnpm --filter @garfex/backend test` | PASS — 19 files, 268 tests. |
| `corepack pnpm --filter @garfex/backend typecheck` | PASS. |
| `corepack pnpm test:architecture` | PASS — 9 tests and 66 modules. |
| `corepack pnpm build` | PASS. |
| `corepack pnpm check` | PASS — contract check, format, lint, tooling typecheck, tests, architecture, and build. |
| `git diff --name-only -- openspec/changes/persistent-resource-catalog` | PASS — empty output. |

Runtime harness: `N/A` — WU-11 changes repository tooling and acceptance commands, not an application runtime boundary.

Rollback boundary: revert the root/local package scripts, loader/CLI, biome scan exclusion, tooling test, comparator strip-only compatibility edit, and command documentation; retain the accepted TypeSpec source/artifact set only if a prior generation/check command is restored.

### Deviations and risks

- Existing pinned TypeSpec/compiler workspace wiring was reused; `pnpm-lock.yaml`, `apps/backend/package.json`, and project references required no changes, preventing package duplication.
- Node 24 strip-only execution does not support TypeScript parameter properties, so the existing comparator constructor was made equivalent without parameter-property syntax for the tooling CLI loader.
- Biome's repository-wide formatting scan would rewrite generated runtime bytes; generated runtime embedding is excluded from formatting scans while contract parity remains byte-exact and generated by the intentional writer.
- The initial full gate attempt exposed the pre-existing `pnpm` shell lookup in root `check`; it was corrected to `corepack pnpm` and the complete gate sequence passed.

### Remaining implementation and parent-owned tasks

All WU-11 implementation rows are visibly checked in `tasks.md`. The remaining unchecked rows are parent-owned lifecycle actions only:

- [ ] Record ordinary repository-policy evidence for each future work unit: focused test command and exact result, runtime harness command/scenario and exact result or explicit `N/A` reason, additions plus deletions changed-line count, start/finish state, and exact rollback boundary before promoting it to the next chain unit; keep receipt-driven development `disabled/unmanaged` unless the user separately enables it later. <!-- sdd-owner: parent -->
- [ ] Before any future PR, verify the dependency diagram and clean diff for the current unit, run the full final gates, and confirm zero edits under `openspec/changes/persistent-resource-catalog/`. <!-- sdd-owner: parent -->

Next recommendation: `parent-lifecycle`. No review or delivery gate was created or approved by `sdd-apply`.
