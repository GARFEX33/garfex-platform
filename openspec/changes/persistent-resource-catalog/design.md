<!-- Hybrid OpenSpec mirror of Engram observation 1561; corrected Judgment Day SHA-256: d993849a08e29745891f0bb7739f3114928b86f76fc35853334a729fecb1cd7b. -->

# Technical Design — Persistent Resource Catalog

## Decision summary

Persist exactly one complete Resource Catalog snapshot document in Convex under catalog key `resource-master`. Domain owns pure snapshot parsing and invariants; Application owns an asynchronous reader and a deployment-only installer port; Infrastructure maps Convex documents to pure snapshots. Every Resource Master method loads one validated snapshot at its start. Bootstrap is one exported Convex `internalMutation`, invoked directly by authenticated deployment CLI/admin tooling, with no public/action/http/scheduled wrapper. Cutover changes every Convex composition root together and deletes the productive TypeScript catalog authority.

This design preserves current `ResourceCatalog` semantics and current successful Public contracts. Domain and Public never import Convex; Convex entrypoints compose through Infrastructure, matching existing GARFEX boundaries.

## Pure types and complete validation boundary

Keep `ResourceCatalog` and its nested semantic types in `domain/types.ts`; do not add Convex IDs, validators, contexts, `_id`, or `_creationTime`. Add `domain/catalog-snapshot.ts`:

```ts
export const resourceCatalogKey = "resource-master" as const;
export const resourceCatalogSchemaVersion = 1 as const;

export interface ResourceCatalogPayload {
  readonly catalogKey: typeof resourceCatalogKey;
  readonly schemaVersion: typeof resourceCatalogSchemaVersion;
  readonly sourceVersion: string;
  readonly lifecycle: "ACTIVE";
  readonly catalog: ResourceCatalog;
}

export interface ResourceCatalogSnapshot extends ResourceCatalogPayload {
  readonly revision: number;
}

export class ResourceCatalogValidationError extends Error {
  constructor(
    readonly kind: "EMPTY" | "INVALID",
    readonly issues: readonly string[],
  ) { super("resource catalog validation failed"); }
}

export function parseResourceCatalogPayload(value: unknown): ResourceCatalogPayload;
export function parseResourceCatalogSnapshot(value: unknown): ResourceCatalogSnapshot;
export function validateResourceCatalogReplacement(
  current: ResourceCatalogSnapshot | null,
  candidate: ResourceCatalogPayload,
): void;
export function resourceCatalogPayloadEquals(
  left: ResourceCatalogPayload,
  right: ResourceCatalogPayload,
): boolean;
export function resourceCatalogSnapshotEquals(
  left: ResourceCatalogSnapshot,
  right: ResourceCatalogSnapshot,
): boolean;
```

The parsers construct a fresh deeply frozen object, preserve strings and array order exactly, reject unknown/missing fields, and perform no lossy normalization. Deterministic structural equality uses the parser-created fixed property order and order-sensitive deep comparison; revision is excluded only by `resourceCatalogPayloadEquals`. Convex metadata is never admitted into these types.

Validation is complete at both import and load boundaries:

- strict primitive/record/array shape; finite safe integer revision (`>=1`), schema version `1`, exact key, active envelope lifecycle, nonblank bounded source version;
- nonempty usable taxonomy, attributes, natural units, bindings, and presentation; a wholly empty semantic aggregate is `EMPTY`, while partial/nonempty malformed content is `INVALID`;
- unique taxonomy codes, attribute codes, option-set codes, option codes within sets, natural-unit codes, binding IDs, binding scope/owner/attribute tuples, allowed units, quantity units, presentation entries, display orders, and rule predicates;
- class/family/type parent references; allowed/suggested natural-unit existence and active usability;
- option-set ownership only by a `CONTROLLED_OPTION` attribute; active binding references and ownership; controlled bindings require the owned set, quantity bindings require owned units, and incompatible optional fields are rejected;
- family/type binding owner correctness and current inheritance/replacement semantics via `resolveEffectiveBindings`;
- rule operands reference controlled attributes and options; active rules cannot depend on inactive definitions/options; orphan/missing ownership is rejected;
- ambiguity detection rejects conflicting simultaneously satisfiable rule outcomes (different equality operands can co-occur; different options of one operand cannot), in addition to duplicate predicates and current runtime conflict checks;
- presentation references each effective visible attribute exactly once, agrees with unique positive `displayOrder`, and contains no dangling/inactive reference;
- active lifecycle dependencies cannot point to inactive records; inactive retained records remain legal only where needed for historical interpretation;
- replacement validation retains every existing stable code and binding identity and rejects reuse/ownership changes: taxonomy parentage, attribute kind/meaning identity, option-set attribute ownership, option membership ownership, natural-unit identity, and binding scope/owner/attribute identity cannot change. Human names/labels, active flags, presentation, applicability results/rules, and allowed policies may change when the candidate remains valid. Existing Resources are never rewritten.

`ResourceCatalog` stays the semantic input to existing canonicalization, applicability, presentation, Search, and Describe logic; the envelope adds persistence protocol metadata only.

## Application ports and error flow

Add `application/ports/resource-catalog-reader.ts`:

```ts
export class ResourceCatalogReadError extends Error {
  constructor(
    readonly code:
      | "RESOURCE_CATALOG_UNAVAILABLE"
      | "RESOURCE_CATALOG_UNINITIALIZED"
      | "RESOURCE_CATALOG_INVALID",
    options?: ErrorOptions,
  ) { super(code, options); }
}

export interface ResourceCatalogReader {
  loadSnapshot(): Promise<ResourceCatalogSnapshot>;
}
```

Add deployment-only `application/ports/resource-catalog-installer.ts`:

```ts
export interface InstallResourceCatalogInput {
  readonly expectedRevision: number;
  readonly candidate: ResourceCatalogPayload;
}

export type InstallResourceCatalogResult =
  | { readonly kind: "INSTALLED"; readonly snapshot: ResourceCatalogSnapshot }
  | { readonly kind: "UNCHANGED"; readonly snapshot: ResourceCatalogSnapshot }
  | { readonly kind: "CONFLICT"; readonly currentRevision: number };

export interface ResourceCatalogInstaller {
  install(input: InstallResourceCatalogInput): Promise<InstallResourceCatalogResult>;
}
```

The installer port is capability-specific complete-snapshot installation, not CRUD. It is not exported from `public.ts`, package `index.ts`, Resource Master, client APIs, or UI.

`createResourceMaster` changes dependencies to `{ catalogReader, repository, createResourceId? }`. A private `withCatalog` helper awaits `loadSnapshot()` once at the beginning of each of all ten methods, maps `ResourceCatalogReadError.code` to the existing `Result` failure shape, and passes `snapshot.catalog` to the unchanged operation body. Known catalog failures never reach Convex catch-all handling. Unexpected adapter/storage read failures are wrapped by Infrastructure as `RESOURCE_CATALOG_UNAVAILABLE`; absent or empty becomes `RESOURCE_CATALOG_UNINITIALIZED`; nonempty parse/reference/integrity failure becomes `RESOURCE_CATALOG_INVALID`. Public messages are fixed and nonsensitive; internal causes/issues stay behind the port.

Catalog acquisition intentionally precedes ordinary argument validation for every method, including `getResource` and `deactivateResource`, because the specification requires every composed entrypoint to prove authority readiness consistently. Add the three codes to `resourceErrorCodes` and Convex result validators; successful payloads and method signatures do not change.

## Convex schema and adapter

Add one table to `convex/schema.ts`:

```ts
resourceCatalogSnapshots: defineTable({
  catalogKey: v.literal("resource-master"),
  revision: v.number(),
  sourceVersion: v.string(),
  schemaVersion: v.literal(1),
  lifecycle: v.literal("ACTIVE"),
  catalog: resourceCatalogValidator,
}).index("by_catalog_key", ["catalogKey"])
```

Use `convex/resourceCatalogValidators.ts` as the sole Convex-validator organization for leaf enums, rules, bindings, catalog, payload/document, bootstrap args, and bootstrap result. Registered functions retain object form and explicit args/returns validators. These validators protect Convex transport/storage shape; the pure parser remains the semantic trust boundary and source of Domain invariants.

`infrastructure/convex-resource-catalog.ts` implements both ports without exporting Convex types through Application/Public. `ConvexResourceCatalogReader.loadSnapshot()` performs exactly one bounded indexed query:

```ts
ctx.db.query("resourceCatalogSnapshots")
  .withIndex("by_catalog_key", q => q.eq("catalogKey", "resource-master"))
  .take(2)
```

Zero documents maps to uninitialized; two documents maps to invalid uniqueness; one is stripped of Convex metadata and parsed. `.take(2)` is intentionally sufficient to prove the required singleton and avoids an unbounded collect. The index is a lookup aid, not a uniqueness constraint, so explicit `0/1/>1` checks are mandatory.

Guardrails run before write and after read: UTF-8 `JSON.stringify` size no greater than **768,000 bytes** (750 KiB), maximum nesting **12**, each array no greater than **4,096 elements**, and each object no greater than **512 own fields**. They leave conservative headroom below official Convex limits of 1 MiB/document, nesting 16, array length 8,192, and object fields 1,024. Fixed-shape validation and these generic limits are both enforced. The current Cable aggregate is measured in tests and must pass with substantial headroom.

## Per-request composition and data flow

`createConvexQueryResourceMaster(ctx)` and `createConvexMutationResourceMaster(ctx)` create a new `ConvexResourceCatalogReader(ctx.db)` and existing `ConvexResourceRepository` for that invocation. The Resource Master method loads one snapshot, then reuses `snapshot.catalog` for taxonomy, validation, applicability, options, units, presentation, Search summary, Search projection, or Describe as needed. QueryCtx/MutationCtx keeps catalog and Resource reads/writes transactionally consistent. There is no process/module cache, cross-request singleton snapshot, secondary source, or per-record catalog read.

For mutation operations, catalog load and Resource persistence happen in the same Convex mutation transaction. Search loads the catalog once before paging Resources and reuses it for all results, so catalog reads do not scale with Resource count.

## Internal bootstrap contract and exact algorithm

Add versioned deployment payload `src/resource-master/deployment/cable-catalog-v1.ts` exporting a pure `ResourceCatalogPayload` with `sourceVersion: "cable-catalog-v1"`. Add `convex/resourceCatalogBootstrap.ts` with exactly one registered write:

```ts
export const installCableCatalogV1 = internalMutation({
  args: { expectedRevision: v.number() },
  returns: installResultValidator,
  handler: async (ctx, { expectedRevision }) =>
    new ConvexResourceCatalogInstaller(ctx.db).install({
      expectedRevision,
      candidate: cableCatalogV1,
    }),
});
```

No query, public mutation, action, HTTP route, schedule, public proxy, or client export invokes it. The hardcoded candidate is versioned deployment input, not a runtime fallback and not general arbitrary-payload CRUD.

Installer ordering is exact:

1. Require a nonnegative safe integer `expectedRevision`.
2. Parse and fully validate the candidate and generic size/depth/array/field bounds **before any database write**.
3. Read at most two documents by stable key; reject duplicate authority as invalid.
4. If a current snapshot exists, parse/validate it before comparison.
5. If current `sourceVersion` equals candidate `sourceVersion` **and** full payload equality succeeds, return `UNCHANGED` immediately, preserving revision, even if the replay carries a stale expected revision.
6. Otherwise apply OCC: absent requires expected revision `0`; present requires exact current revision. Return `CONFLICT` without writing on mismatch.
7. Validate replacement compatibility against current stable codes/ownership.
8. Assign revision `1` for initial creation, otherwise `current.revision + 1`; construct and fully validate the expected persisted snapshot.
9. Insert or replace the complete single document atomically.
10. Read the written document back through the same normal reconstruction/parser path in the same mutation transaction.
11. Require full `resourceCatalogSnapshotEquals(expected, reconstructed)`, including assigned revision, source/schema/lifecycle metadata and all catalog names, labels, order, presentation, rules/defaults, lifecycle, options, units, and Search/Describe inputs.
12. Return `INSTALLED` only after equivalence. Any post-write read, validation, singleton, or equivalence failure throws, causing Convex to abort the entire mutation transaction.

Initial expected revision is exactly `0`; initial persisted revision is exactly `1`. Identical replay is checked before OCC; all non-identical installation attempts are OCC-checked before write.

## Trusted invocation proof

Official Convex Internal Functions documentation states internal functions cannot be called directly from a Convex client, recommends `internalMutation` for non-client logic, and permits internal functions from Dashboard and CLI: <https://docs.convex.dev/functions/internal-functions>.

From the backend workspace, authenticated deployment tooling invokes the exported internal function directly:

```sh
pnpm --filter @garfex/backend exec convex run \
  resourceCatalogBootstrap:installCableCatalogV1 \
  '{"expectedRevision":0}' \
  --prod
```

Development is the CLI default; an explicit target may instead use `--deployment <deployment>`. Official CLI reference: `npx convex run [functionName] [args]`; `--prod`/`--deployment` selects target, and `--push` cannot be used for production: <https://docs.convex.dev/cli/reference/run>. Therefore production bootstrap does not use `--push`. Operators authenticate/select the deployment through approved deployment credentials; this design creates no auth provider or admin business role.

The documentation proof obligation is resolved. Rehearsing the exact command against the repository's installed Convex 1.45 deployment remains an implementation/cutover verification gate, not a design blocker.

## Artifact separation and import rules

| Zone | Artifact | Allowed imports |
| --- | --- | --- |
| Production core | pure snapshot/parser, reader port, Resource Master | Domain/Application only; no Convex, fixture, or deployment payload |
| Runtime infrastructure | Convex reader/repository/composition | Application/Domain contracts and Convex adapter types |
| Deployment | `deployment/cable-catalog-v1.ts`, internal bootstrap module | Bootstrap may import payload and installer; runtime composition must not |
| Tests | `tests/fixtures/cable-catalog.ts`, in-memory reader/installer fakes | Tests only; no production source import |

The migration payload and test fixture are deliberate separate copies with different ownership. A test proves both parse and are semantically equivalent at v1; neither imports the other. After installation, runtime reads only the Convex document. Architecture checks reject production imports from tests/fixtures, runtime imports from `deployment`, Application-to-Infrastructure dependencies, core Convex imports, Public deployment exports, and public/action/http/scheduled wrappers around bootstrap.

## Cutover and rollback

1. Add pure contracts/validation and tests without changing serving authority.
2. Refactor Resource Master behind the async reader while a temporary infrastructure static reader wraps the existing productive `cable-catalog.ts`; only this pre-cutover authority serves.
3. Deploy additive table, adapter, installer, internal mutation, and v1 deployment payload; staged Convex data remains unserved.
4. Run bootstrap on development, then the selected production deployment with expected revision `0`; assert `INSTALLED`, adapter reconstruction/equivalence, and a second `UNCHANGED` replay.
5. In one cutover slice, switch both query and mutation composition factories to `ConvexResourceCatalogReader`; no runtime dual read exists before, during, or after the release.
6. In that same slice remove the temporary static reader and delete/move `infrastructure/cable-catalog.ts`: its data moves separately to `deployment/cable-catalog-v1.ts` and `tests/fixtures/cable-catalog.ts`, but neither becomes runtime authority.
7. Run focused and full gates, verify public API enumeration contains no bootstrap wrapper, and monitor catalog failures.

Before step 5, rollback may remove unused additive persistence. After step 5, application rollback must select a prior **Convex-backed** compatible release. Data rollback installs a previously verified versioned payload through the same internal mutation/OCC protocol. Never reactivate a fixture, migration runtime read, dual read, or fallback; if no safe Convex-backed state exists, fail closed and fix forward.

## Existing Resource Search hydration remains untouched

`ConvexResourceRepository.listPage` and its current per-Resource attribute reconstruction do not change. That hydration concerns Resource persistence and pagination, not catalog acquisition. This change loads one catalog snapshot before the existing search loop and reuses it for every summary, satisfying the bounded catalog N+1 requirement. Altering Resource hydration would expand scope, risk search pagination/identity behavior, and is explicitly excluded by the approved specification.

## Security, failures, and observability

Trust boundary: only operators holding deployment authority may call the CLI/Dashboard internal mutation. Convex clients cannot call `internalMutation`; no public proxy exists. Candidate code is reviewed/versioned deployment data, pure validation fails before write, OCC prevents lost updates, and transaction abort protects failed read-back. There is no inferred admin CRUD, UI, business owner, or auth-provider work.

Failure handling:

- storage/query exception -> stable `RESOURCE_CATALOG_UNAVAILABLE`;
- absent or wholly empty authority -> `RESOURCE_CATALOG_UNINITIALIZED`;
- duplicate, oversized, malformed, dangling, lifecycle-invalid, or semantically inconsistent authority -> `RESOURCE_CATALOG_INVALID`;
- bootstrap invalid candidate throws before write; identical replay returns `UNCHANGED`; stale non-replay returns `CONFLICT`; post-write mismatch throws and rolls back;
- no catalog failure is mapped to an existing business validation code or hidden by a public `INTERNAL` result.

The bootstrap result exposes only `kind`, revision, schema/source version, and lifecycle—not payload contents or Convex IDs. Emit one structured deployment log for install/no-op/conflict containing catalog key, expected/current/result revision, source version, and outcome. Validation diagnostics remain server-side and redact document contents. Runtime monitoring counts the three stable codes by entrypoint and alerts on any post-cutover uninitialized/invalid result; no per-success catalog log is added.

## TDD plan

1. Domain tests first: shape/empty classification, all uniqueness/reference/ownership/lifecycle/rule/presentation invariants, stable replacement compatibility, generic limits, deep freeze, deterministic full equality, and exact v1 fixture/payload equivalence.
2. Application tests first: fake reader valid/unavailable/absent/empty/invalid; exact three codes for all ten methods; exactly one reader call per operation; current successful Cable behavior unchanged.
3. Convex tests first with `convex-test`: singleton indexed load, 0/1/2 classification, no unbounded read, initial `0 -> 1`, validation-before-write, identical replay before OCC, stale conflict, valid replacement, stable-code rejection, transactional read-back failure, full equivalence, and internal-only registration/no public wrapper.
4. Architecture tests first: fixture/deployment/runtime/public/Core/Convex import violations each fail; valid composition passes.
5. Regression and release gates: `pnpm --filter @garfex/backend test`, backend typecheck, `pnpm test:architecture`, `pnpm build`, then `pnpm check`; rehearse CLI in dev and selected deployment before cutover.

## File-by-file impact

- `domain/types.ts`: retain semantic catalog types; only shared literal exports if needed.
- new `domain/catalog-snapshot.ts`: envelope, parser, bounds, replacement validation, equality.
- new Application reader/installer port files: exact contracts/errors above.
- `application/resource-master.ts`: async one-load wrapper and unchanged catalog-based operation internals.
- `public.ts`: add only three error codes; no port/bootstrap export.
- new `infrastructure/convex-resource-catalog.ts`: reader/installer, singleton lookup, mapping/read-back.
- `infrastructure/convex-resource-master.ts`: per-context reader composition.
- `infrastructure/cable-catalog.ts`: temporarily wrapped pre-cutover, then deleted; content copied separately into deployment and test artifacts.
- `convex/schema.ts`: one table/index and shared validator.
- new `convex/resourceCatalogValidators.ts`: all Convex storage/args/returns validators.
- new `convex/resourceCatalogBootstrap.ts`: sole internal mutation.
- `convex/resourceMaster.ts`: three error literals; no bootstrap wrapper.
- new `deployment/cable-catalog-v1.ts`: reviewed v1 write input only.
- tests: focused snapshot tests; Resource Master fake-reader/error/load-count updates; Convex adapter/bootstrap tests; moved test fixture.
- `tooling/architecture/check.mjs`, architecture fixtures/tests: forbidden dependency/public exposure rules.
- `infrastructure/convex-resource-repository.ts`: no change.

## Cohesive delivery slices

The refined forecast remains **820–950 changed lines** and exceeds the 400-line budget. Use a Feature Branch Chain at apply time because the final authority switch must integrate as one chain; this design creates no branches or commits.

1. **Pure snapshot contract and validator — ~230 lines.** Add envelope/parser/limits/equality/replacement tests and move a test-only fixture. Starts from current domain; ends with pure, Convex-free trusted data semantics. No runtime change.
2. **Async Application boundary — ~190 lines, depends on 1.** Add reader/installer contracts, stable errors, refactor all methods with one-load tests, and temporarily adapt the existing static authority in Infrastructure. Serving authority remains exactly the current literal.
3. **Convex persistence and trusted bootstrap — ~300 lines, depends on 1–2.** Add table/validators, reader/installer, v1 deployment payload, internal mutation, OCC/replay/read-back tests. Persisted candidate is additive and unserved.
4. **Authority cutover and guards — ~180 lines, depends on 1–3.** Bootstrap/rehearse first, switch query+mutation composition together, delete `cable-catalog.ts` and temporary static reader, add public validator and architecture gates, run full regression. Rollback remains Convex-backed.

Each slice includes its tests, stays below 400 changed lines, and has an explicit authority state. No `size:exception` is required. Cutover slice cannot merge until bootstrap/equivalence/replay gates from slice 3 pass.

## Rejected alternatives

- Normalized catalog tables: adds joins, multi-document consistency, and catalog N+1 risk for a bounded aggregate.
- Immutable history plus head table: extra read/storage and no current audit requirement.
- Public mutation/action/http wrapper or scheduled installer: violates the trusted internal-only boundary.
- Arbitrary payload CRUD installer: invents administration and expands attack surface.
- Global/module cache: crosses Convex transaction boundaries and can serve stale revisions.
- Runtime fixture or deployment fallback, dual reads/writes: creates competing authority and masks incidents.
- Sharing one literal between migration and tests: conflates write input, test data, and production authority.
- Partial write followed by external verification: can report or leave unverified state; same-transaction read-back must gate success.
- Refactoring Resource Search hydration: unrelated to catalog N+1 and explicitly out of scope.

## Proof obligations and blockers

Resolved: exact internal-only Convex primitive and direct authenticated CLI invocation; explicit document/array/depth/object limits with conservative headroom; stable key `resource-master`; schema version `1`; source version `cable-catalog-v1`; initial expected/persisted revisions `0/1`; replay-before-OCC ordering; full deterministic equivalence; three stable failure mappings; no public wrapper.

Implementation verification still must measure the real v1 encoded size, exercise the command against installed Convex 1.45 and the selected deployment, regenerate/check Convex generated types, and prove all repository gates. These are verification gates, not architecture or product blockers. There are no unresolved product blockers.
