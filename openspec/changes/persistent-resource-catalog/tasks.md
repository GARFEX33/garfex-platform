<!-- Hybrid OpenSpec mirror of Engram observation 1564; corrected Judgment Day SHA-256: d993849a08e29745891f0bb7739f3114928b86f76fc35853334a729fecb1cd7b. -->

# Executable SDD Tasks — `persistent-resource-catalog`

Artifact store: both (OpenSpec and Engram). This plan authorizes no product-code changes, branches, commits, pushes, issues, PRs, or deployments by itself. Inputs are approved observations 1555–1562, especially spec `1559` and design `1561`.

## Review Workload Forecast

| Field | Value |
| ------- | ------- |
| Estimated changed lines | ~900 total: A ~230 + B ~190 + C ~300 + D ~180 |
| 400-line budget risk | High for one combined change; Low for each chained slice |
| Chained PRs recommended | Yes |
| Suggested split | Feature Branch Chain: PR 1 A → PR 2 B → PR 3 C → PR 4 D |
| Delivery strategy | auto-chain |
| Chain strategy | feature-branch-chain |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

The four slices are deliberately autonomous review units and each is forecast below the 400 changed-line budget. The combined estimate is high because the work crosses Domain, Application, Convex schema/adapter/bootstrap, architecture guards, migration evidence, tests, and documentation. No `size:exception` is planned. The apply-time maintainer decision covers chain/release authorization and the operational production gate; it does not weaken any approved requirement.

## Baseline, scope, and invariants

- Current workspace convention is strict TypeScript NodeNext ESM, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `verbatimModuleSyntax`, isolated/composite builds, Vitest, `convex-test` with edge-runtime, Convex `1.45.0`, Node `>=24.19.0 <25`, and pnpm `>=11 <12` through `corepack pnpm`.
- Existing serving authority is `apps/backend/src/resource-master/infrastructure/cable-catalog.ts`. Before D, it may be wrapped only as the temporary pre-cutover static authority; it is never a fallback or a dual read. It is deleted in D after its data exists independently in deployment and test zones.
- `apps/backend/src/resource-master/infrastructure/convex-resource-repository.ts` and its existing per-Resource attribute reconstruction are not changed. Resource Search hydration is explicitly out of scope; only catalog acquisition must be one bounded snapshot load per operation.
- Pure snapshot envelope is `{ catalogKey: "resource-master", schemaVersion: 1, sourceVersion: "cable-catalog-v1", lifecycle: "ACTIVE", catalog }`, with persisted `revision` added to `ResourceCatalogSnapshot`. `sourceVersion` is the bootstrap identity/version; do not invent a second runtime authority or a general CRUD shape.
- The single Convex aggregate is `resourceCatalogSnapshots`, indexed by `by_catalog_key`, with one complete document for `resource-master`. Runtime reads use one indexed `.take(2)`, classify 0/1/>1 documents, strip Convex metadata, parse, and validate.
- Enforce before write and after read: UTF-8 JSON encoded size `<= 768,000` bytes, maximum nesting `12`, maximum array length `4,096`, and maximum object own-field count `512`. These are conservative bounds below the Convex limits of 1 MiB, nesting 16, array length 8,192, and object fields 1,024. Measure the actual Cable v1 payload and record encoded bytes, depth, largest array, largest object, and remaining headroom.
- Domain validation is complete and deterministic: strict shape/unknown-field rejection, required usable content, unique stable codes/keys, parent/reference integrity, option and unit ownership, lifecycle dependencies, applicability binding ownership/inheritance/replacement, rule operands/defaults/ambiguity, presentation references/order, bounds, deep immutability, and stable-code/identity compatibility on replacement.
- Post-cutover Convex is the only production authority. There is no public wrapper, fixture fallback, runtime migration-payload import, cache authority, dual read, dual write, Resource Search hydration refactor, admin CRUD, auth provider, UI, Temporal/workflow, other Resource type, legacy port, or durable revision history.

## Stable catalog failure contract and all ten entrypoints

Every entrypoint below loads the authoritative snapshot once at operation start, including `getResource` and `deactivateResource` even when their current business body does not directly inspect catalog fields. Each has the same exact additive public catalog failures:

| Current entrypoint | `RESOURCE_CATALOG_UNAVAILABLE` | `RESOURCE_CATALOG_UNINITIALIZED` | `RESOURCE_CATALOG_INVALID` |
| --- | --- | --- | --- |
| `getTaxonomy` | storage/adapter/read failure | absent or structurally empty | non-empty malformed/integrity failure |
| `getEffectiveResourceSchema` | storage/adapter/read failure | absent or structurally empty | non-empty malformed/integrity failure |
| `getValidOptions` | storage/adapter/read failure | absent or structurally empty | non-empty malformed/integrity failure |
| `getNaturalUnits` | storage/adapter/read failure | absent or structurally empty | non-empty malformed/integrity failure |
| `createResource` | storage/adapter/read failure | absent or structurally empty | non-empty malformed/integrity failure |
| `updateNonIdentityData` | storage/adapter/read failure | absent or structurally empty | non-empty malformed/integrity failure |
| `getResource` | storage/adapter/read failure | absent or structurally empty | non-empty malformed/integrity failure |
| `deactivateResource` | storage/adapter/read failure | absent or structurally empty | non-empty malformed/integrity failure |
| `searchResources` | storage/adapter/read failure | absent or structurally empty | non-empty malformed/integrity failure |
| `describeResource` | storage/adapter/read failure | absent or structurally empty | non-empty malformed/integrity failure |

Public callers receive only the stable code and fixed nonsensitive message; Convex exceptions, IDs, storage shapes, and validator details stay behind the Application/Infrastructure boundary. Existing non-catalog codes, method names, successful payloads, Resource IDs, canonical identities, and repository semantics remain unchanged.

## Dependency graph and work-unit rule

```text
A Pure snapshot contract/validation
└── B Async Application boundary and stable errors
    └── C Convex aggregate, adapter, installer, and internal bootstrap
        └── D Production authority cutover, separation, guards, docs, regression
```

C also depends directly on A for parsing/equality and D cannot start its authority switch until C has passed bootstrap, adapter round-trip, idempotency, and non-production CLI rehearsal. Every checkbox below is one cohesive work-unit/commit intent with a clear start, finish, verification, and rollback boundary; no actual commit is made by the executor.

## Slice A — Pure snapshot contract and validation (~230 changed lines)

**Start:** current pure `ResourceCatalog` types and schema rules; current production literal remains untouched.
**Finish:** a Convex-free, deeply immutable, strictly parsed snapshot/payload contract with deterministic validation, equality, replacement compatibility, bounds, and independent test data.
**Rollback boundary:** remove only the new Domain module, tests, and test fixture; serving behavior remains the current literal.

### A1 — RED: specify the pure trust-boundary failures

- [x] Add failing Domain tests in `apps/backend/tests/catalog-snapshot.test.ts` and extend `apps/backend/tests/schema-resolution.test.ts` for the planned payload/snapshot envelope, exact key/schema/lifecycle/source fields, revision rules, empty-versus-invalid classification, strict unknown/missing-field rejection, order-preserving equality, deep immutability, and stable replacement compatibility; keep the tests independent of Convex and expect failure because `domain/catalog-snapshot.ts` does not exist yet. <!-- sdd-owner: implementation -->
  - Expected RED evidence: focused Vitest fails for the missing contract/validator and records the intended error classifications rather than accepting the current raw fixture.
  - Work-unit intent: establish the executable pure contract before implementation; rollback is deleting only the new test assertions.

### A2 — GREEN: implement the minimal pure snapshot/parser contract

- [x] Add `apps/backend/src/resource-master/domain/catalog-snapshot.ts` and the independent test-only copy `apps/backend/tests/fixtures/cable-catalog.ts`; implement `resourceCatalogKey`, schema version `1`, `ResourceCatalogPayload`, `ResourceCatalogSnapshot`, `ResourceCatalogValidationError`, strict parsers, complete validator, deterministic payload/snapshot equality, replacement checks, deep freeze, and the four conservative shape bounds without importing Convex or changing `apps/backend/src/resource-master/domain/types.ts` semantics. <!-- sdd-owner: implementation -->
  - GREEN must preserve every current Cable code, name, label, active flag, array order, presentation field, rule/default, option relation, unit/policy, and Search/Describe input; no lossy normalization is allowed.
  - The test fixture must be a separate copy/type-only Domain consumer, not an import or re-export of `infrastructure/cable-catalog.ts`.
  - Work-unit intent: make pure candidate and persisted-snapshot data trustworthy; rollback removes the new module and test-only copy without changing runtime authority.

### A3 — TRIANGULATE: cover negative, boundary, lifecycle, and measurement cases

- [x] Extend `apps/backend/tests/catalog-snapshot.test.ts` and `apps/backend/tests/schema-resolution.test.ts` with deterministic negative and boundary cases for duplicate taxonomy/attribute/option-set/option/unit/binding/rule/presentation identifiers, dangling parents/references, ownership mismatches, inactive dependencies, duplicate same-scope bindings, conflicting simultaneously satisfiable rules, invalid defaults, replacement code/identity reuse, missing historical definitions, ordering/display-order disagreement, empty content, exactly-at-bound and over-bound JSON/depth/array/object shapes, and measurement of the independent Cable fixture using `TextEncoder`/deterministic JSON; assert the observed bytes/depth/collection maxima and substantial headroom under `768000/12/4096/512`. <!-- sdd-owner: implementation -->
  - TRIANGULATE must prove the existing `resolveEffectiveBindings` inheritance/replacement/inactive-override behavior is preserved, not reimplemented in a second semantic authority.
  - Expected evidence includes stable issue ordering/classification for the same malformed semantic input and byte-for-byte preservation of meaningful array order.
  - Work-unit intent: expose validator blind spots before adapter work; rollback is limited to the added cases.

### A4 — REFACTOR after green: keep Domain semantics small and auditable

- [x] After all A tests are green, refactor only `apps/backend/src/resource-master/domain/catalog-snapshot.ts`, `apps/backend/tests/catalog-snapshot.test.ts`, and `apps/backend/tests/schema-resolution.test.ts` into focused shape/reference/bounds/equality helpers while retaining pure imports, deep immutability, exact ordering, stable error classification, and no normalization that discards meaning; run TypeScript LSP diagnostics and the focused Domain type/test commands. <!-- sdd-owner: implementation -->
  - Do not refactor Resource Search, `convex-resource-repository.ts`, or the production Cable literal in A.
  - Work-unit intent: leave a reviewable pure foundation; rollback is a mechanical revert of this refactor only.

### Slice A applied evidence

- A1 RED evidence is preserved in the focused tests: the initial run failed because `domain/catalog-snapshot.ts` was missing; current GREEN rerun passes 12 tests.
- A2 GREEN: pure snapshot/parser, independent fixture, equality, replacement, deep-freeze, and bounds implementation are present; focused tests and backend typecheck pass.
- A3 TRIANGULATE: focused Vitest passes 12 tests covering shape, references, ownership, lifecycle, rules, replacement, ordering, and bounds.
- A4 REFACTOR: TypeScript diagnostics (`tsc --noEmit --pretty false`) are clean; focused tests, backend typecheck, and whitespace checks pass.
- Cable fixture payload measurement: 3,317 UTF-8 bytes, depth 8, largest array 5, largest object 9; headroom is 764,683/4/4,091/503 respectively.
- Full repository `corepack pnpm test`: 42 tests passed; production `infrastructure/cable-catalog.ts` remained unchanged and serving tests passed.

### Slice A checkpoint / acceptance evidence

- `catalog-snapshot.test.ts` and `schema-resolution.test.ts` pass with RED/GREEN/TRIANGULATE evidence recorded.
- TypeScript diagnostics report no issues in the changed Domain/tests files; `corepack pnpm --filter @garfex/backend exec vitest run tests/catalog-snapshot.test.ts tests/schema-resolution.test.ts` and backend typecheck pass.
- The fixture measurement records bytes/depth/array/object maxima below `768000/12/4096/512`; no Domain file imports Convex, generated APIs, IDs, validators, or infrastructure.
- The production literal is still the only serving authority and no runtime behavior has changed. Only then may B begin.

## Slice B — Async Application boundary and stable errors (~190 changed lines; depends on A)

**Start:** A is green; Application currently receives a synchronous `catalog`.
**Finish:** all ten methods use an Application-owned async reader exactly once, map only the three stable catalog errors, and preserve current success behavior while a temporary static adapter remains the sole pre-cutover authority.
**Rollback boundary:** revert Application/port/static-reader changes; current literal serving resumes exactly as before. The temporary static reader is explicitly staging-only and is deleted in D, never retained as fallback.

### B1 — RED: drive the reader boundary through an Application fake

- [ ] Add failing Application tests in `apps/backend/tests/resource-master-catalog-boundary.test.ts`, refactor setup expectations in `apps/backend/tests/resource-master.test.ts`, and add `apps/backend/tests/support/in-memory-resource-catalog.ts` as a test-only fake reader; exercise all ten entrypoints with valid, unavailable, uninitialized, empty, invalid, and thrown-reader cases, assert the exact three catalog codes and fixed public messages, count exactly one `loadSnapshot()` per operation including multi-result search, and expect failure against the current synchronous `createResourceMaster` dependency. <!-- sdd-owner: implementation -->
  - The RED matrix must include `getTaxonomy`, `getEffectiveResourceSchema`, `getValidOptions`, `getNaturalUnits`, `createResource`, `updateNonIdentityData`, `getResource`, `deactivateResource`, `searchResources`, and `describeResource`.
  - Work-unit intent: make Application behavior and one-load guarantees executable before changing production code; rollback removes only the new fake/tests.

### B2 — GREEN: add ports, stable codes, one-load composition, and pre-cutover adapter

- [ ] Add `apps/backend/src/resource-master/application/ports/resource-catalog-reader.ts` with `ResourceCatalogReadError` and `loadSnapshot(): Promise<ResourceCatalogSnapshot>`, add deployment-only `apps/backend/src/resource-master/application/ports/resource-catalog-installer.ts` with complete-snapshot install input/result (not CRUD), add the three codes to `apps/backend/src/resource-master/public.ts`, refactor `apps/backend/src/resource-master/application/resource-master.ts` to a private one-load `withCatalog` boundary before ordinary argument validation, add temporary `apps/backend/src/resource-master/infrastructure/static-resource-catalog-reader.ts`, and change `apps/backend/src/resource-master/infrastructure/convex-resource-master.ts` to inject that reader around `cable-catalog.ts`. <!-- sdd-owner: implementation -->
  - `withCatalog` must pass only `snapshot.catalog` to existing operation bodies, map `RESOURCE_CATALOG_UNAVAILABLE`, `RESOURCE_CATALOG_UNINITIALIZED`, and `RESOURCE_CATALOG_INVALID` without exposing causes, and never map a known catalog failure to `INTERNAL`.
  - The temporary static reader is the one pre-cutover authority, not a fallback: it performs no Convex read and is scheduled for deletion in D.
  - Work-unit intent: introduce the Application capability boundary without changing the authority; rollback restores the old constructor/composition.

### B3 — TRIANGULATE: test every failure order and search load boundary

- [ ] Extend `apps/backend/tests/resource-master-catalog-boundary.test.ts` and `apps/backend/tests/resource-master.test.ts` with per-entrypoint unavailable/absent/empty/malformed cases, invalid argument cases proving catalog acquisition still occurs first, adapter exception redaction, valid-result regression, one reader call for a search page containing many Resources, and no second load for schema/options/units/description/search projection decisions; assert the current non-catalog error codes and successful payloads remain unchanged. <!-- sdd-owner: implementation -->
  - TRIANGULATE must verify inactive historical reads, canonicalization, equality-rule behavior, and existing Resource repository semantics through the fake snapshot.
  - Work-unit intent: close Application boundary gaps before Convex integration; rollback is test-only.

### B4 — REFACTOR after green: preserve public surface and isolate ports

- [ ] After B tests are green, refactor only `apps/backend/src/resource-master/application/resource-master.ts`, the two port files, `apps/backend/src/resource-master/infrastructure/static-resource-catalog-reader.ts`, `apps/backend/src/resource-master/infrastructure/convex-resource-master.ts`, `apps/backend/src/resource-master/public.ts`, and the B tests; keep `apps/backend/src/resource-master/index.ts` limited to public types, run LSP diagnostics, focused backend tests, and backend typecheck, and confirm Application has no Infrastructure import. <!-- sdd-owner: implementation -->
  - Work-unit intent: make the async seam reviewable and reversible before persistence; rollback removes only boundary refactoring while the static pre-cutover authority remains available.

### Slice B checkpoint / acceptance evidence

- The fake-reader test matrix covers all ten entrypoints, all three exact stable errors, redacted messages, and exactly one load per operation.
- Existing Cable success/regression tests pass with the temporary static authority; no Convex catalog table is read and no dual read exists.
- `ResourceCatalogInstaller` is absent from `public.ts`, `index.ts`, `ResourceMaster`, client/UI contracts, and all public transport results.
- LSP, focused Vitest, and `corepack pnpm --filter @garfex/backend typecheck` pass. Only then may C add additive Convex persistence.

## Slice C — Convex persistence and internal bootstrap (~300 changed lines)

**Start:** A/B are green; static reader still serves runtime.
**Finish:** one bounded Convex aggregate, pure adapter, separate v1 deployment payload, internal-only installer, OCC/replay/read-back/full-equivalence proof, generated types, and a non-production CLI rehearsal; the persisted candidate remains unserved.
**Rollback boundary:** before D, remove the additive table/functions/payload/adapter and staged data without changing serving behavior. A failed bootstrap must leave the current document and revision unchanged.

### C1 — RED: specify Convex singleton and bootstrap protocol failures

- [ ] Add failing `convex-test` coverage in new `apps/backend/tests/convex-resource-catalog.test.ts` and add planned integration cases to `apps/backend/tests/convex-resource-master.test.ts` for 0/1/>1 catalog documents, indexed bounded lookup, transport/storage shape rejection, size/depth/array/field bounds, internal-only reachability, initial `0→1`, invalid-before-write, identical replay, stale conflict, valid replacement, read-back, rollback, and full semantic equivalence; reference the planned `apps/backend/convex/resourceCatalogValidators.ts`, `apps/backend/convex/resourceCatalogBootstrap.ts`, and `apps/backend/src/resource-master/infrastructure/convex-resource-catalog.ts` so the tests are expected to fail before implementation. <!-- sdd-owner: implementation -->
  - Use `convexTest(schema, modules)` and generated `internal`/`api` surfaces; the public API must not contain a bootstrap function.
  - Work-unit intent: fix the persistence protocol in executable tests before adding a table or mutation; rollback deletes only the new failing cases.

### C2 — GREEN: implement aggregate storage, adapter, payload, and internal mutation

- [ ] Add `apps/backend/convex/resourceCatalogValidators.ts`, change `apps/backend/convex/schema.ts` with `resourceCatalogSnapshots` and `by_catalog_key`, add `apps/backend/src/resource-master/infrastructure/convex-resource-catalog.ts`, add independent deployment input `apps/backend/src/resource-master/deployment/cable-catalog-v1.ts` with `sourceVersion: "cable-catalog-v1"`, add `apps/backend/convex/resourceCatalogBootstrap.ts` with the sole registered `internalMutation` `resourceCatalogBootstrap:installCableCatalogV1`, and regenerate `apps/backend/convex/_generated/api.d.ts`, `dataModel.d.ts`, and `server.d.ts` through Convex codegen. <!-- sdd-owner: implementation -->
  - The adapter must use exactly one indexed `.take(2)` per load, map zero to `RESOURCE_CATALOG_UNINITIALIZED`, duplicate documents/non-empty parse or Domain failures to `RESOURCE_CATALOG_INVALID`, and storage/query exceptions to `RESOURCE_CATALOG_UNAVAILABLE`.
  - The installer algorithm is fixed: validate expected revision and candidate/bounds before write; reject duplicate authority; validate current; check same-source/full-payload replay before OCC; require absent `0` or exact current revision for non-replay; validate stable-code compatibility; assign persisted revision `1` initially or `current+1`; atomically replace the complete document; read it back through the normal parser in the same transaction; require full snapshot equality before returning `INSTALLED`.
  - The only registered write is an object-form `internalMutation` with explicit args/returns validators. No query, public mutation, action, HTTP route, schedule, public proxy, client export, or arbitrary CRUD is added.
  - Work-unit intent: add unserved persistence and trusted installation as one reversible Convex unit; rollback drops additive infrastructure before cutover.

### C3 — TRIANGULATE: prove migration, idempotency, bounds, and complete round trip

- [ ] Extend `apps/backend/tests/convex-resource-catalog.test.ts` to prove initial install returns `INSTALLED` at revision `1`, invalid candidates write nothing, duplicate authority is invalid, same source plus full semantic replay returns `UNCHANGED` before stale OCC and preserves revision, non-replay stale revisions return `CONFLICT` without writes, valid replacements advance revision atomically, stable code/ownership changes are rejected, inactive historical definitions remain interpretable, post-write read/validation/equivalence failure aborts the transaction, and equality includes every code/name/label/active flag/order/presentation/binding/rule/default/option relation/unit/policy/Search/Describe input while excluding only Convex metadata. Measure the actual v1 encoded payload/document with `TextEncoder` and assert `<=768000` bytes, depth `<=12`, arrays `<=4096`, objects `<=512`, with recorded headroom; assert the normal reader never performs catalog N+1 or an unbounded collect. <!-- sdd-owner: implementation -->
  - This is the migration/idempotency/full-equivalence layer: compare `tests/fixtures/cable-catalog.ts` and `deployment/cable-catalog-v1.ts` as independent semantically equivalent v1 inputs without importing either into runtime.
  - Re-run existing `apps/backend/tests/convex-resource-master.test.ts` against the still-static composition to prove staged data is unserved before D; do not refactor Resource Search hydration.
  - Rehearse the direct internal mutation against a non-production deployment first, for example:
    `corepack pnpm --filter @garfex/backend exec convex run resourceCatalogBootstrap:installCableCatalogV1 '{"expectedRevision":0}' --deployment <non-production-deployment>`
    followed by a replay with a deliberately stale nonnegative expected revision and expected `UNCHANGED`. Record command output, deployment, revision, and measured bounds; never run `--prod` in this implementation task.
  - Work-unit intent: establish operationally reproducible persistence evidence before authority cutover; rollback is additive-data cleanup only.

### C4 — REFACTOR after green: align Convex types and keep the adapter bounded

- [ ] After C tests and the non-production rehearsal are green, refactor `apps/backend/convex/resourceCatalogValidators.ts`, `apps/backend/convex/schema.ts`, `apps/backend/convex/resourceCatalogBootstrap.ts`, `apps/backend/src/resource-master/infrastructure/convex-resource-catalog.ts`, `apps/backend/src/resource-master/deployment/cable-catalog-v1.ts`, `apps/backend/tests/convex-resource-catalog.test.ts`, and generated `apps/backend/convex/_generated/*.d.ts` only as needed for explicit validators, deterministic mapping, and readable OCC flow; run LSP diagnostics, `corepack pnpm --filter @garfex/backend exec convex codegen`, backend typecheck, and local Convex validation. <!-- sdd-owner: implementation -->
  - Keep the v1 payload deployment-only and the staged document unserved; do not touch composition roots or delete the static authority in C.
  - Work-unit intent: leave a generated/type-safe additive Convex slice; rollback remains safe because D has not switched authority.

### Slice C checkpoint / acceptance evidence

- `convex-test` proves 0/1/>1 singleton behavior, bounded indexed reads, all bootstrap/OCC/replay/read-back cases, internal-only reachability, atomicity, and complete semantic equivalence.
- The exact non-production CLI rehearsal shows first `INSTALLED`, second semantically identical replay `UNCHANGED`, and no public `api` bootstrap route; generated Convex types are regenerated and typecheck passes.
- The measured Cable v1 aggregate satisfies all four conservative bounds with recorded headroom; no production composition imports the deployment payload or Convex reader yet.
- Cutover cannot begin without this evidence and a human-approved release checkpoint.

## Slice D — Production authority cutover, fixture separation/deletion, guards/docs (~180 changed lines; depends on A–C)

**Start:** C’s non-production and full-equivalence evidence is complete; staged Convex data is verified but unserved.
**Finish:** query and mutation roots switch together to Convex, production literal and temporary static reader are deleted, public validators and architecture checks enforce the boundary, docs describe authorized operations, and regression/full gates pass.
**Rollback boundary:** before the atomic switch, revert to the static pre-cutover release if necessary; after the switch, application rollback is only to a compatible Convex-backed release and catalog-data recovery is a verified Convex snapshot replacement through the internal OCC installer. Never restore the fixture, add a dual read, or fall back.

### D1 — RED: make authority and public-surface violations observable

- [ ] Add failing cutover/regression expectations to `apps/backend/tests/convex-resource-master.test.ts` and `apps/backend/tests/resource-master.test.ts`, and add architecture-failure fixtures at `tooling/architecture-fixtures/violations/resource-master/fixture-import.ts`, `runtime-deployment-import.ts`, `public-catalog-port.ts`, and `tooling/architecture-fixtures/violations/convex/public-bootstrap-wrapper.ts`; extend `tooling/tests/architecture.test.ts` to expect production fixture/deployment imports, public installer/bootstrap exposure, and missing stable Convex error literals to fail before D’s wiring changes. <!-- sdd-owner: implementation -->
  - RED evidence must include all ten post-cutover public entrypoints failing closed when the aggregate is absent/invalid/unavailable, and valid seeded calls preserving existing success payloads.
  - Work-unit intent: state the authority/architecture acceptance contract before deleting the old authority; rollback removes only new failing fixtures/assertions.

### D2 — GREEN: cut over both roots and remove the production authority

- [ ] Change `apps/backend/src/resource-master/infrastructure/convex-resource-master.ts` so each query and mutation invocation constructs a fresh `ConvexResourceCatalogReader(ctx.db)` beside the existing repository, change `apps/backend/convex/resourceMaster.ts` to add the three exact stable error literals to its return validator without swallowing them as `INTERNAL`, update `apps/backend/tests/convex-resource-master.test.ts` to seed through generated `internal.resourceCatalogBootstrap.installCableCatalogV1` before valid public operations, then delete `apps/backend/src/resource-master/infrastructure/static-resource-catalog-reader.ts` and `apps/backend/src/resource-master/infrastructure/cable-catalog.ts`; retain independent `apps/backend/src/resource-master/deployment/cable-catalog-v1.ts` and `apps/backend/tests/fixtures/cable-catalog.ts` with no runtime import. <!-- sdd-owner: implementation -->
  - The query and mutation composition switch is one release/work unit: no phase may wire only one root, perform a dual read, or leave a fixture fallback.
  - Verify `apps/backend/src/resource-master/index.ts` still exports public types only; it must not export reader/installer/bootstrap capabilities.
  - Work-unit intent: make Convex the sole production authority and remove the old literal; rollback after this boundary can only select a Convex-backed compatible release.

### D3 — TRIANGULATE: enforce separation, fail-closed behavior, and rollback rules

- [ ] Change `tooling/architecture/check.mjs` and `tooling/tests/architecture.test.ts` to reject production imports from `apps/backend/tests/fixtures`, runtime imports from `apps/backend/src/resource-master/deployment`, Application-to-Infrastructure imports, core Convex imports, public writer/installer/bootstrap exports, and public/action/http/scheduled bootstrap wrappers while accepting only the direct internal bootstrap-to-payload dependency; complete `apps/backend/tests/convex-resource-master.test.ts` regression coverage for absent/empty/invalid/unavailable catalog codes on all ten entrypoints, stable IDs/canonical identities across catalog replacement, search one-load behavior with unchanged Resource attribute hydration, and no public bootstrap in generated `api` types. <!-- sdd-owner: implementation -->
  - TRIANGULATE architecture fixtures must fail by rule name and the valid fixture graph must still pass; no blanket exemption is allowed.
  - Verify post-cutover data recovery is only a previously verified payload through `installCableCatalogV1` with OCC, and that an unsafe/no-snapshot condition remains fail-closed rather than restoring TypeScript authority.
  - Work-unit intent: prove negative dependency/rollback boundaries and existing Resource regression behavior; rollback is limited to guard/test changes.

### D4 — REFACTOR after green: document the operational boundary and run release gates

- [ ] After all D tests are green, update `docs/architecture.md` and `README.md` with the aggregate/port boundary, one-load/no-cache rule, artifact separation, cutover order, non-production CLI rehearsal, explicit production authorization, and Convex-only rollback/fix-forward rule; then run the final focused tests, LSP diagnostics, Convex codegen/type validation, architecture checks, build, and `corepack pnpm check` without changing the excluded Resource Search hydration or adding new product surfaces. <!-- sdd-owner: implementation -->
  - Work-unit intent: make the final authority and operator constraints durable and verify the finished chain; rollback is documentation/mechanical cleanup only.

### Slice D checkpoint / acceptance evidence

- Both query and mutation composition roots use a fresh Convex reader per invocation, and no production source imports `cable-catalog.ts`, the test fixture, or deployment payload.
- `cable-catalog.ts` and the temporary static reader are deleted; the deployment payload and test fixture are separate copies, and architecture checks prove their zones.
- All ten public entrypoints return the exact catalog codes for unavailable/uninitialized/invalid authority and preserve successful behavior after internal seeding; no bootstrap function appears in public generated API/client surfaces.
- C’s non-production `INSTALLED`/`UNCHANGED` and full-equivalence evidence is attached before any production deployment/bootstrap; post-cutover rollback instructions are Convex-backed only.
- Focused tests, LSP, Convex codegen/type validation, backend typecheck, `corepack pnpm test:architecture`, `corepack pnpm build`, and `corepack pnpm check` pass.

## Verification command matrix

Run commands from the repository root with Corepack-selected pnpm; adapt only the test path list as files are added.

- Domain RED/GREEN/TRIANGULATE: `corepack pnpm --filter @garfex/backend exec vitest run tests/catalog-snapshot.test.ts tests/schema-resolution.test.ts`.
- Application fake/regression: `corepack pnpm --filter @garfex/backend exec vitest run tests/resource-master-catalog-boundary.test.ts tests/resource-master.test.ts`.
- Convex integration/bootstrap/full equivalence: `corepack pnpm --filter @garfex/backend exec vitest run tests/convex-resource-catalog.test.ts tests/convex-resource-master.test.ts`.
- Backend aggregate: `corepack pnpm --filter @garfex/backend test` and `corepack pnpm --filter @garfex/backend typecheck`.
- Convex generated/type validation: `corepack pnpm --filter @garfex/backend exec convex codegen`; validate the local deployment with `corepack pnpm --filter @garfex/backend exec convex dev --local` according to the installed CLI workflow.
- Architecture: `corepack pnpm test:architecture` (Vitest architecture fixtures plus `node tooling/architecture/check.mjs`).
- Repository build: `corepack pnpm build`.
- Full gate: `corepack pnpm check` (format, lint, TypeScript, coverage tests, architecture, and build).
- LSP: request clean TypeScript LSP diagnostics for every changed `.ts`, `.d.ts`, `.mjs`, and config-adjacent source file at A/B/C/D checkpoints; zero diagnostics is required in addition to CLI typecheck.
- Non-production direct internal rehearsal, only after C codegen/deployment is ready: `corepack pnpm --filter @garfex/backend exec convex run resourceCatalogBootstrap:installCableCatalogV1 '{"expectedRevision":0}' --deployment <non-production-deployment>`; repeat with a deliberately stale nonnegative revision to prove `UNCHANGED`. This is not a production apply command.

## Delivery checkpoints and chain context

- **PR 1 / A → PR 2:** attach Domain test output, deterministic issue/equality evidence, pure-import/LSP/typecheck output, and measured bounds for the independent fixture. Start B only after the current literal still serves unchanged.
- **PR 2 / B → PR 3:** attach all-ten-entrypoint fake-reader matrix, exact three error-code output, one-load counts, successful regression output, and proof that the temporary static reader is the sole authority. Start C only after no public port/writer is exposed.
- **PR 3 / C → PR 4:** attach Convex schema/codegen/type output, 0/1/>1 and OCC/replay/read-back/full-equivalence test output, measured v1 aggregate headroom, public-surface enumeration, and non-production CLI `INSTALLED` then `UNCHANGED`. D cannot merge without this checkpoint.
- **PR 4 / final:** attach atomic query+mutation cutover diff, deletion/separation proof, architecture negative/valid fixture output, all-ten-entrypoint post-cutover regression, LSP, focused tests, build, and `corepack pnpm check`. Production deployment/bootstrap remains a separate authorized operation after this evidence.
- Feature Branch Chain context: PR 1 targets the tracker branch; PR 2 targets PR 1; PR 3 targets PR 2; PR 4 targets PR 3; the tracker remains draft/no-merge until all checkpoints pass. No branches or PRs are created by this task-plan phase.

## Required human authorization and parent-owned lifecycle gates

The following are deliberately not automatic implementation actions:

- [ ] Confirm the `feature-branch-chain` strategy, tracker/child ordering, and the `Decision needed before apply` release decision before applying any slice. <!-- sdd-owner: parent -->
- [ ] Run or reuse a bounded review at each A→B, B→C, C→D, and final checkpoint, recording the exact acceptance evidence above before advancing. <!-- sdd-owner: parent -->
- [ ] Authorize creation of commits and any commit-message/work-unit history; the executor must not commit automatically. <!-- sdd-owner: parent -->
- [ ] Authorize branch pushes to any remote; the executor must not push automatically. <!-- sdd-owner: parent -->
- [ ] Authorize issue creation or updates, including any tracker issue; the executor must not open or modify issues automatically. <!-- sdd-owner: parent -->
- [ ] Authorize PR creation, draft tracker/child PR publication, review requests, and merge; no PR or merge is automatic. <!-- sdd-owner: parent -->
- [ ] After non-production rehearsal and checkpoint approval, explicitly authorize the selected production deployment and direct `convex run resourceCatalogBootstrap:installCableCatalogV1 '{"expectedRevision":0}' --prod` invocation; production bootstrap must never be an automatic apply step and must use approved deployment credentials. <!-- sdd-owner: parent -->
- [ ] Approve any post-cutover application rollback as Convex-backed compatible only, or authorize a verified Convex snapshot fix-forward through internal OCC tooling; never approve fixture restoration or a dual authority. <!-- sdd-owner: parent -->

## Risks and blockers

- Product blocker: none. The approved spec/design resolve the catalog key (`resource-master`), schema/source versions, stable error mapping, bounds, internal primitive, OCC order, and rollback policy.
- Operational gates still require evidence: installed Convex 1.45 codegen, a reachable non-production deployment for direct internal CLI rehearsal, approved deployment credentials, and explicit production authorization. These are deliberate gates, not reasons to add a public wrapper.
- Main implementation risks are incomplete semantic validation/equality, accidental deployment/test imports, swallowing stable catalog failures as `INTERNAL`, switching only one composition root, stale/global caching, and accidental Resource Search hydration scope creep. The task boundaries and architecture tests address each.

## Readiness

Ready for workload forecast and chained-slice planning. Not ready for automatic apply: parent must approve the chain/lifecycle gates, review each checkpoint, and separately authorize production deployment/bootstrap, commits, pushes, issues, PRs, and merge.
