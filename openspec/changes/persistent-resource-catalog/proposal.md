<!-- Hybrid OpenSpec mirror of Engram observation 1557; corrected Judgment Day SHA-256: d993849a08e29745891f0bb7739f3114928b86f76fc35853334a729fecb1cd7b. -->

# Proposal — Persistent Resource Catalog

## Decision summary

Replace the hardcoded production TypeScript `ResourceCatalog` authority with a pure, fully validated catalog snapshot persisted in Convex. Runtime access will cross Application-owned reader/writer Catalog Ports; Convex will be the sole production authority after cutover. Existing Resource behavior, IDs, canonical identities, public method names, and payload semantics remain unchanged.

**Provenance:** corrected Judgment Day decision register, SHA-256 `d993849a08e29745891f0bb7739f3114928b86f76fc35853334a729fecb1cd7b`.

## Intent and problem

Production currently injects `infrastructure/cable-catalog.ts` directly into `createResourceMaster`. That hardcoded TypeScript fixture is the runtime authority for taxonomy, validation, schema applicability, options, units, presentation, descriptions, and search projection. It cannot be managed as durable application data, makes deployment code and production data authority indistinguishable, and leaves no transactional persistence or controlled cutover protocol.

The change makes Convex the only production catalog authority while preserving the domain as framework-neutral pure code. Every snapshot reconstructed from storage is validated at the trust boundary before use, and missing or invalid catalog state fails closed rather than falling back to TypeScript data.

## Product outcome

After cutover:

- Convex stores one bounded aggregate snapshot for the Resource Catalog and is the sole runtime authority.
- Application owns capability-specific reader and deployment writer contracts; infrastructure implements them without leaking Convex types into core code.
- Each Resource Master operation loads one transactionally consistent, pure, validated snapshot.
- Existing Cable behavior, stable IDs/codes, canonical identities, labels, order, presentation, lifecycle, rules, units, and search inputs survive a complete semantic round trip.
- Empty, unavailable, malformed, or inconsistent catalog state produces an explicit stable failure and never silently uses a fixture or migration payload.
- Bootstrap/import/cutover is reachable only through trusted deployment tooling and a Convex internal function.

## Scope

### Included

1. **Aggregate persistence:** add a bounded Convex catalog-snapshot aggregate keyed by a stable catalog key, with revision and bootstrap identity/version metadata and indexed unique lookup.
2. **Application contracts:** add a runtime `ResourceCatalogReader` and a separate deployment-oriented `ResourceCatalogSnapshotWriter`; do not expose the writer through `ResourceMaster` or public capability surfaces.
3. **Pure snapshot and validation:** define the framework-neutral snapshot and complete validation for uniqueness, references, ordering, ownership, lifecycle, applicability, rules, units, and presentation.
4. **Convex adapter:** reconstruct the full snapshot in one bounded indexed aggregate read, validate it, and avoid catalog N+1 reads or global cross-transaction caching.
5. **Internal deployment bootstrap:** provide an `internalMutation`-only import/bootstrap path and a versioned deployment payload separate from runtime and test artifacts.
6. **Idempotency and OCC:** reject stale expected revisions; replay of the same bootstrap identity and semantically identical payload is a no-op; different content requires a matching expected revision.
7. **Lifecycle:** persist and round-trip active/inactive state and current lifecycle semantics for every catalog record. Stable codes/identities remain unchanged in this slice.
8. **Full semantic round trip:** compare codes, names, labels, active flags, ordered arrays, presentation, applicability bindings/rules/defaults, option/unit ownership and policies, and all display/search inputs; exclude only Convex storage metadata.
9. **Fail-closed behavior:** define stable catalog unavailable/uninitialized and integrity failures; no runtime fixture, migration payload, public wrapper, dual read, or fallback.
10. **Artifact separation:** production runtime code uses only ports and persisted snapshots; behavior tests use an in-memory fake and test-only fixture; migration payload is deployment-only.
11. **Production cutover:** seed and verify the persisted candidate, switch all query and mutation composition roots together, and remove the production literal as an authority.
12. **Architecture guards and tests:** enforce no production import from test fixtures, no runtime import from deployment payloads, no public catalog writer/bootstrap surface, and proper Convex/platform isolation; add domain, application, adapter, bootstrap, architecture, and regression coverage.

### Explicit security constraint

Bootstrap, import, and cutover are **non-client-reachable** and **deployment-only**. They may be invoked only by trusted tooling using deployment credentials through a Convex internal function. There will be no public mutation/action/query wrapper, client/UI route, convention-based exposure, or fallback path. Auth-provider work is deferred and cannot be substituted by an unauthenticated public bootstrap endpoint.

## Non-goals

- Selecting or integrating an auth provider.
- Admin CRUD APIs, admin workflows, or catalog UI.
- Temporal or another workflow/orchestration system.
- Resource types beyond the current Cable catalog.
- Redesigning Resource Search hydration or its existing per-resource attribute reconstruction.
- A generic repository abstraction.
- Porting legacy schemas, tables, services, APIs, folder structures, IDs, or implementation patterns.
- Durable revision history/audit storage beyond the current aggregate revision required for OCC.

## Business and domain rules preserved

- Current Resource behavior and all existing Resource IDs/canonical identities remain stable.
- Family/type applicability inheritance, replacement, inactive-binding behavior, equality-rule defaults, and conflict detection remain unchanged.
- Existing catalog codes and canonical identities are immutable for this slice.
- Public Resource Master methods and transport payload behavior remain stable except for an explicit fail-closed catalog-unavailable/integrity error contract.
- N+1 remediation is limited to catalog loading/search use of the catalog. Existing Resource Search attribute hydration is intentionally unchanged.

## Migration and cutover — no dual authority

1. **Deploy additive infrastructure:** add the optional catalog table/index, pure snapshot validation, Application ports, Convex adapter, and internal bootstrap function without changing the active runtime authority.
2. **Prepare and validate:** construct the versioned Cable migration candidate, validate it in pure code before writing, and preserve all current IDs/codes and semantics.
3. **Bootstrap internally:** trusted deployment tooling invokes only the Convex internal mutation with expected revision `0` for an absent aggregate. Invalid input or OCC mismatch writes nothing.
4. **Prove persistence:** read through the normal adapter, validate again, compare the complete semantic round trip, and replay bootstrap to prove the idempotent no-op behavior.
5. **Atomic authority cutover:** in one release, wire every production Resource Master query and mutation composition root to the Convex reader and remove the production literal from runtime composition. Before this point TypeScript remains the serving authority and the staged Convex candidate is not runtime authority; after it, Convex alone is authority.
6. **Verify and clean:** run focused backend, architecture, type, build, and full repository gates; confirm there is no runtime fixture/migration import, public bootstrap wrapper, dual read/write, or fallback.

At no stage do two sources serve runtime behavior. The migration payload is write input, not an alternate runtime authority.

## Affected capabilities

All production operations composed through Resource Master are affected by snapshot acquisition, including:

- taxonomy;
- effective Resource schema;
- valid options;
- natural units;
- Resource creation validation and canonicalization;
- non-identity update validation and search projection;
- Resource search summary/projection;
- Resource description;
- shared construction used by get and deactivate operations.

Resource persistence (`resources` and `resourceAttributes`) and its repository contract remain behaviorally unchanged.

## Likely file areas

| Area | Likely changes |
| --- | --- |
| Domain | `apps/backend/src/resource-master/domain/types.ts`; new pure catalog snapshot/validator module; focused schema/snapshot tests |
| Application | `application/resource-master.ts`; new reader and deployment-writer port modules; stable catalog failure contract |
| Infrastructure | `infrastructure/convex-resource-master.ts`; new Convex catalog adapter; test-only in-memory fake; removal of production `cable-catalog.ts` after cutover |
| Convex | `apps/backend/convex/schema.ts`; `convex/resourceMaster.ts`; new internal-only catalog bootstrap module; generated API updates as required |
| Deployment data | versioned Cable bootstrap payload isolated from runtime composition and test fixtures |
| Public surface | `public.ts` and transport validators only as needed for stable catalog failures; no catalog writer/bootstrap export |
| Tests and guards | Resource Master, schema resolution, Convex integration/bootstrap, full round-trip, architecture checker fixtures, and architecture tests |

`infrastructure/convex-resource-repository.ts` and Resource Search hydration are not expected to change.

## Acceptance outcomes

- [ ] No production runtime path imports or reads the hardcoded Cable fixture or deployment payload.
- [ ] Convex is the sole production catalog authority after cutover, accessed through Application-owned Catalog Ports.
- [ ] One bounded indexed aggregate read supplies one validated snapshot per operation, without catalog N+1 behavior or global caching.
- [ ] Missing, empty, unavailable, malformed, or referentially inconsistent snapshots fail closed with stable explicit errors.
- [ ] Bootstrap is an internal Convex function with no client/public/UI wrapper and is callable only by trusted deployment tooling.
- [ ] Initial import rejects invalid data before write, uses expected-revision OCC, and is idempotent for identical semantic replay.
- [ ] Full semantic round-trip equivalence covers names, labels, order, presentation, lifecycle, applicability/rules, options, units, and search/display inputs.
- [ ] Existing IDs, canonical identities, public Resource behavior, and Resource persistence semantics remain unchanged.
- [ ] Test fixtures/fakes, deployment payloads, and production runtime artifacts are separate and architecture-enforced.
- [ ] Focused backend tests, typecheck, architecture tests, build, and `pnpm check` pass.
- [ ] The exact trusted-tooling invocation of the Convex internal function is demonstrated against the installed/deployed Convex 1.45 toolchain during design/verification.

## Risks and mitigations

| Risk | Mitigation |
| --- | --- |
| Incomplete reconstruction silently changes behavior | Validate every snapshot and assert complete semantic equality, including ordering, labels, presentation, lifecycle, and search inputs. |
| Accidental runtime fixture or migration fallback | Separate artifacts and add architecture guards against forbidden imports and public exports. |
| Public exposure of bootstrap before auth exists | Use `internalMutation` only; forbid wrappers and verify generated/client surfaces. |
| Lost update or repeated deployment corrupts state | Expected-revision OCC, pre-write validation, semantic idempotency, and atomic aggregate replacement. |
| Catalog unavailable during cutover | Seed and prove adapter round trip before switching composition; fail closed after switch. |
| Snapshot exceeds Convex limits over time | Bound and verify aggregate/document/array size in design; this slice contains only the current small Cable catalog. |
| Transaction inconsistency or stale process cache | Load through the operation context once per operation; do not cache globally. |
| Scope creep into Resource Search hydration | Limit N+1 work to catalog loading and assert Resource repository behavior remains unchanged. |

## Rollback boundary

Before authority cutover, additive schema/functions and an unused staged snapshot can be removed or redeployed without affecting runtime behavior. After cutover, rollback must not restore the TypeScript fixture as runtime authority: application/function releases may roll back only to a Convex-backed compatible version, while catalog-data incidents are corrected by replacing with a previously verified snapshot through the trusted internal writer using OCC. If a safe Convex-backed rollback is unavailable, halt/fail closed rather than introduce dual authority or fallback. Destructive schema cleanup should wait until cutover verification is complete.

## Workload and delivery flag

Forecast: **15–20 files and approximately 650–950 changed/added lines**, including tests, architecture guards, migration rehearsal, and cutover verification. This exceeds the configured **400-line review budget**. The later **auto-forecast delivery decision must be made before apply**; this proposal does not itself choose or execute the delivery split.

## Blockers and design proof obligations

There is **no unresolved product blocker**. Design and verification must still prove:

- the exact Convex 1.45 trusted-tooling command/API used to invoke the internal function;
- aggregate bounds against Convex document/array limits;
- stable catalog key and bootstrap-version naming;
- deterministic semantic equality and explicit error mapping.

These are implementation/design proof obligations, not requests to weaken the approved product constraints.

## Proposal question round

The delegated brief and approved Judgment Day decisions already answer the material product questions, so work is not blocked on another round. For optional stakeholder correction before spec/design, the smallest useful questions are:

1. Should operational ownership of the trusted cutover command remain with deployment operators only, with no product-facing recovery workflow in this slice?
2. Is fail-closed unavailability preferable to serving stale catalog data in every production incident, including immediately after cutover?
3. Is restoring a previously verified Convex snapshot through OCC the only acceptable data rollback, never restoring the TypeScript fixture?
4. Are immutable current catalog codes/identities and Cable-only scope sufficient, with revision history and additional resource types deferred?

Current assumptions answer **yes** to all four based on the binding decisions. Stakeholders may correct that framing or request a second product question round; absent correction, these assumptions are treated as approved.
