<!-- Hybrid OpenSpec mirror of Engram observation 1559; corrected Judgment Day SHA-256: d993849a08e29745891f0bb7739f3114928b86f76fc35853334a729fecb1cd7b. -->

# Persistent Resource Catalog Specification

## Purpose

This specification defines the required production authority, application boundary, snapshot semantics, validation, failure behavior, bootstrap protocol, cutover, lifecycle guarantees, and verification for the persistent Resource Catalog. After cutover, Convex is the sole production catalog authority and every Resource Master operation uses one pure, complete, validated snapshot without fallback or dual reads.

## Public error contract

Catalog-dependent application entrypoints MUST expose exactly these stable catalog failure codes in the existing public error result contract:

| Code | Meaning |
| --- | --- |
| `RESOURCE_CATALOG_UNAVAILABLE` | The authoritative Convex catalog cannot be read because storage or the adapter is unavailable or the read fails. |
| `RESOURCE_CATALOG_UNINITIALIZED` | No authoritative snapshot exists, or the stored snapshot is structurally empty and cannot represent a usable catalog. |
| `RESOURCE_CATALOG_INVALID` | A snapshot exists but fails complete Domain validation or reconstruction integrity checks. |

These are additive error variants; existing non-catalog error codes and successful payloads MUST remain unchanged. Internal diagnostics MAY contain more detail, but public callers MUST receive the stable code and MUST NOT receive Convex exceptions, document identifiers, storage shapes, or implementation details.

## Requirements

### Requirement 1: Convex-only production authority

After authority cutover, Convex MUST be the sole source of production Resource Catalog behavior. Production runtime code MUST NOT read a TypeScript catalog literal, test fixture, deployment payload, process-global cache, legacy source, or other fallback, and MUST NOT perform dual catalog reads or dual catalog writes.

#### Scenario: Production operation uses persisted authority

- GIVEN authority cutover is complete and a valid catalog snapshot exists in Convex
- WHEN any production Resource Master entrypoint needs catalog behavior
- THEN the operation MUST derive that behavior only from the Convex-backed snapshot

#### Scenario: Authoritative read fails

- GIVEN authority cutover is complete and Convex catalog acquisition fails
- WHEN a catalog-dependent entrypoint executes
- THEN the operation MUST fail closed with `RESOURCE_CATALOG_UNAVAILABLE`
- AND it MUST NOT consult a literal, fixture, migration payload, cache, or secondary source

#### Scenario: No dual authority during migration

- GIVEN a persisted candidate has been staged before authority cutover
- WHEN production runtime serves Resource behavior
- THEN exactly the pre-cutover authority SHALL serve that behavior
- AND the staged candidate MUST remain unserved until all composition roots cut over together

### Requirement 2: Application-owned Catalog Reader boundary

Application MUST own a capability-specific Catalog Reader contract that returns a pure immutable snapshot. Domain and Public modules MUST remain framework-neutral and MUST NOT expose or depend on Convex contexts, identifiers, document types, generated APIs, validators, errors, or storage metadata.

#### Scenario: Runtime adapter returns a snapshot

- GIVEN the Convex adapter reconstructs persisted catalog data
- WHEN Application invokes the Catalog Reader
- THEN it MUST receive only the pure snapshot contract
- AND all Convex-specific values MUST have been removed or translated at the adapter boundary

#### Scenario: Public surface is inspected

- GIVEN public Resource Master exports and transport results
- WHEN their types and values are inspected
- THEN they MUST NOT expose the Catalog Reader, catalog writer, bootstrap capability, Convex types, or Convex metadata

### Requirement 3: Complete Cable snapshot

A usable snapshot MUST contain a stable catalog key, revision, bootstrap identity/version, and the complete Cable catalog semantics: taxonomy; class, family, and type definitions; attribute definitions; applicable option sets and options; option ownership and relations where relevant; natural units and unit policies; applicability bindings together with their rules and defaults; presentation metadata and ordering; lifecycle state for every catalog record; and all names, codes, labels, and values consumed by Resource behavior.

#### Scenario: Complete Cable data is reconstructed

- GIVEN a persisted Cable snapshot contains all required records
- WHEN the Catalog Reader reconstructs it
- THEN the resulting snapshot MUST preserve every required field and relationship without omission, substitution, or reordering

#### Scenario: Required semantic section is absent

- GIVEN a persisted snapshot omits a required taxonomy, definition, option, unit/policy, applicability/rule, presentation, lifecycle, revision, or bootstrap field
- WHEN the loaded snapshot is validated
- THEN validation MUST reject it as `RESOURCE_CATALOG_INVALID`

### Requirement 4: Complete Domain validation at both trust boundaries

Pure Domain validation MUST validate every bootstrap/import candidate before any write and every reconstructed snapshot before any application use. Validation MUST cover shape and boundedness, required content, unique stable codes and keys, deterministic ordering constraints, reference integrity, option-set and unit ownership, applicability ownership, lifecycle consistency, presentation references, rule operands/defaults, duplicate bindings, and ambiguous or conflicting rule outcomes.

#### Scenario: Invalid candidate is submitted

- GIVEN a bootstrap candidate fails any Domain invariant
- WHEN trusted tooling requests an import
- THEN the candidate MUST be rejected before storage mutation
- AND the current persisted snapshot and revision MUST remain unchanged

#### Scenario: Invalid persisted snapshot is loaded

- GIVEN a snapshot exists but fails Domain validation after reconstruction
- WHEN any catalog-dependent entrypoint loads it
- THEN the operation MUST fail with `RESOURCE_CATALOG_INVALID`
- AND no partial catalog behavior MUST be returned

#### Scenario: Duplicate or ambiguous definitions exist

- GIVEN a candidate or loaded snapshot contains duplicate same-scope bindings, duplicate stable identifiers, ambiguous rule matches, or conflicting rule outcomes
- WHEN Domain validation runs
- THEN validation MUST fail deterministically with the same classified invariant failure for the same semantic input

#### Scenario: References or lifecycle use is invalid

- GIVEN a candidate or loaded snapshot contains a dangling reference, ownership mismatch, invalid presentation reference, or an active rule that depends on an inactive or inapplicable target
- WHEN Domain validation runs
- THEN validation MUST reject the whole snapshot deterministically

### Requirement 5: Stable fail-closed outcomes at every entrypoint

Every production Resource Master entrypoint composed with the catalog capability—including taxonomy, effective schema, valid options, natural units, create, update non-identity data, get, deactivate, search, and describe—MUST acquire and validate the authoritative snapshot and MUST use the exact public catalog error codes defined by this specification.

#### Scenario: Catalog service is unavailable

- GIVEN authoritative catalog storage cannot be read
- WHEN any listed entrypoint executes
- THEN it MUST return `RESOURCE_CATALOG_UNAVAILABLE`

#### Scenario: Catalog is absent

- GIVEN no authoritative snapshot exists
- WHEN any listed entrypoint executes
- THEN it MUST return `RESOURCE_CATALOG_UNINITIALIZED`

#### Scenario: Catalog is structurally empty

- GIVEN a stored value exists but contains no usable catalog content
- WHEN any listed entrypoint executes
- THEN it MUST return `RESOURCE_CATALOG_UNINITIALIZED`

#### Scenario: Catalog is malformed or inconsistent

- GIVEN a non-empty snapshot exists but reconstruction or Domain validation fails
- WHEN any listed entrypoint executes
- THEN it MUST return `RESOURCE_CATALOG_INVALID`

#### Scenario: Internal failure detail is sensitive

- GIVEN the adapter receives a Convex or storage-specific failure
- WHEN it maps the failure to the public contract
- THEN the stable code MUST be preserved
- AND implementation-specific details MUST NOT cross the Public boundary

### Requirement 6: One bounded consistent snapshot per operation

Each Resource Master operation MUST perform at most one logical catalog snapshot load, and that load MUST return one complete, bounded, transactionally consistent revision. Catalog access MUST NOT issue per-record, per-attribute, per-option, per-component, or per-Resource catalog reads, and MUST NOT use a process-global snapshot across operation or transaction boundaries.

#### Scenario: One operation needs multiple catalog views

- GIVEN one operation needs taxonomy, applicability, options, units, presentation, or search inputs
- WHEN it executes
- THEN all catalog decisions MUST use the same loaded snapshot revision
- AND the Catalog Reader MUST be invoked no more than once

#### Scenario: Search returns multiple Resources

- GIVEN Resource Search returns multiple Resource records
- WHEN catalog-derived summaries or projections are produced
- THEN a single catalog snapshot MUST serve the complete operation
- AND catalog reads MUST NOT scale with Resource, attribute, option, or component count

#### Scenario: Snapshot exceeds an enforced bound

- GIVEN persisted catalog data exceeds the accepted aggregate/document or array bound
- WHEN it is imported or loaded
- THEN it MUST be rejected rather than read unboundedly or partially

### Requirement 7: Atomic ownership of Applicability and Rules

Applicability bindings and all rules, operands, defaults, priorities/order, and lifecycle state that determine each binding MUST belong to one atomic catalog aggregate. The system MUST validate, persist, replace, and read them as one consistent revision and MUST NOT expose a binding from one revision with rules from another.

#### Scenario: Applicability revision changes

- GIVEN a valid replacement changes an applicability binding or any owned rule
- WHEN the replacement commits
- THEN the binding and its complete rule set MUST become visible atomically at one new revision

#### Scenario: Rule ownership is incomplete

- GIVEN a candidate contains an orphan rule, a binding with missing owned rules, or a rule referring outside its valid definition scope
- WHEN Domain validation runs
- THEN the whole candidate MUST be rejected before write

### Requirement 8: Internal deployment-only bootstrap and cutover

Bootstrap, import, replacement, and cutover write capabilities MUST be internal and deployment-only. They SHALL be callable only by trusted tooling using deployment credentials and MUST NOT be reachable through public queries, mutations, actions, application APIs, clients, UI routes, generated public exports, or public wrappers.

#### Scenario: Trusted deployment imports a candidate

- GIVEN trusted deployment tooling invokes the internal capability with valid deployment authority
- WHEN a valid candidate and revision expectation are supplied
- THEN the internal capability MAY perform the controlled import protocol

#### Scenario: Client inspects reachable APIs

- GIVEN a client, browser, UI, or public API consumer inspects callable surfaces
- WHEN catalog functions are enumerated
- THEN no bootstrap, import, replacement, cutover, writer, or wrapper MUST be reachable

#### Scenario: Public wrapper is proposed

- GIVEN an internal bootstrap function exists
- WHEN a public function attempts to invoke or proxy it
- THEN architecture enforcement and tests MUST reject that exposure

### Requirement 9: Versioned idempotent bootstrap with OCC

Every import candidate MUST carry a bootstrap identity/version and expected revision. Initial creation MUST expect revision `0`; every differing replacement MUST match the current revision; a successful semantic change MUST atomically advance the revision; and mismatches MUST fail without a write. Replay of the same bootstrap identity and semantically equivalent content MUST be an idempotent no-op that preserves the current revision. The capability MUST NOT provide general catalog CRUD.

#### Scenario: Initial bootstrap succeeds

- GIVEN no snapshot exists, expected revision is `0`, and the candidate is valid
- WHEN trusted tooling imports it
- THEN the complete snapshot MUST be created atomically at the defined initial persisted revision

#### Scenario: Identical bootstrap is replayed

- GIVEN the same bootstrap identity and semantically equivalent content is already persisted
- WHEN trusted tooling replays the import
- THEN the operation MUST succeed as a no-op
- AND it MUST NOT advance revision or rewrite semantic state

#### Scenario: Stale replacement is attempted

- GIVEN the persisted revision differs from expected revision and the request is not an identical semantic replay
- WHEN replacement is attempted
- THEN the operation MUST report a revision conflict
- AND it MUST write nothing

#### Scenario: Valid replacement succeeds

- GIVEN a different valid candidate supplies the current expected revision
- WHEN trusted tooling replaces the aggregate
- THEN replacement and revision advancement MUST commit atomically
- AND no concurrent update MAY be lost

#### Scenario: Partial administration is attempted

- GIVEN a caller attempts record-level create, update, delete, activate, or reorder operations
- WHEN it uses the capability delivered by this change
- THEN no general admin CRUD contract SHALL exist
- AND only complete validated snapshot import or replacement MAY mutate catalog authority

### Requirement 10: Full semantic round-trip equivalence

Bootstrap verification MUST compare the submitted pure snapshot with the snapshot reconstructed through the normal runtime reader. Semantic equivalence MUST include every code, name, label, ordered sequence, presentation field, applicability binding, rule, default, lifecycle state, option relationship, natural unit, unit policy, revision-independent catalog value, and every input consumed by Search or Describe. Only Convex storage metadata and protocol metadata explicitly excluded from business semantics MAY be ignored.

#### Scenario: Complete round trip matches

- GIVEN a valid candidate is persisted
- WHEN it is reconstructed through the normal Catalog Reader
- THEN complete semantic comparison MUST succeed without normalization that discards meaningful values or order

#### Scenario: A display or search value differs

- GIVEN reconstruction changes or omits a name, label, order, presentation field, rule, lifecycle state, unit/policy, or Search/Describe input
- WHEN round-trip verification runs
- THEN verification MUST fail and MUST NOT report successful cutover readiness

### Requirement 11: Lifecycle, stable codes, and historical interpretability

Catalog stable codes and canonical identity inputs MUST remain immutable in this change. Lifecycle transitions MUST preserve inactive definitions required to interpret existing Resources; inactive records MUST NOT be selected for new behavior where current Domain rules prohibit them. Loading a new catalog revision MUST NOT recompute or mutate existing Resource IDs, canonical identities, or stored identity attributes.

#### Scenario: Existing Resource is read after catalog replacement

- GIVEN an existing Resource references catalog codes retained as inactive
- WHEN the Resource is retrieved, searched, or described
- THEN the snapshot MUST retain sufficient definitions, labels, units, policies, presentation, and rules to interpret it consistently

#### Scenario: New Resource uses inactive catalog data

- GIVEN a catalog definition, option, unit, binding, or rule is inactive for new use
- WHEN creation or non-identity update attempts to select it
- THEN existing Domain lifecycle and applicability rules MUST reject that selection deterministically

#### Scenario: Stable code is changed or reused

- GIVEN a replacement changes the meaning of an existing stable code, removes a code still required for historical interpretation, or reuses a code for another identity
- WHEN Domain validation compares the candidate with current authority
- THEN replacement MUST be rejected

#### Scenario: Catalog revision advances

- GIVEN existing Resources predate a valid catalog replacement
- WHEN the replacement commits
- THEN their Resource IDs and canonical identities MUST remain byte-for-byte unchanged
- AND no identity recomputation or bulk Resource rewrite SHALL occur

### Requirement 12: Production, test, and migration artifact separation

Production runtime artifacts, test artifacts, and migration/deployment artifacts MUST be separate authorities and dependency zones. Production MUST use ports and persisted snapshots; behavior tests MUST use an in-memory fake and test-only fixture; deployment tooling MAY use a versioned import payload only as write input. Architecture enforcement MUST prevent production imports from test/fixture paths, runtime imports from migration payloads, Application imports from Infrastructure, core imports of Convex, and public exports of deployment capabilities.

#### Scenario: Behavior test runs without Convex

- GIVEN a Domain or Application behavior test
- WHEN catalog behavior is required
- THEN the test MUST inject an in-memory fake with test-only data
- AND that fixture MUST NOT become production authority

#### Scenario: Runtime dependency graph is checked

- GIVEN architecture checks inspect production composition and public exports
- WHEN a runtime migration-payload import, test-fixture import, core Convex dependency, or public writer/bootstrap export exists
- THEN the checks MUST fail

#### Scenario: Deployment payload is imported

- GIVEN trusted tooling uses the versioned Cable deployment payload
- WHEN bootstrap completes
- THEN normal runtime operations MUST read only the persisted reconstructed snapshot
- AND MUST NOT read the payload again

### Requirement 13: Cutover and Convex-backed rollback

Cutover MUST proceed in this order: deploy additive persistence, validation, adapter, and internal tooling; validate the versioned candidate; bootstrap internally; prove loaded validation, full round-trip equivalence, and replay idempotency; switch every production query and mutation composition root together; then remove the production literal from runtime authority. Post-cutover rollback MUST remain Convex-backed.

#### Scenario: Candidate is staged before cutover

- GIVEN additive infrastructure and a verified snapshot are deployed
- WHEN runtime authority has not yet switched
- THEN the existing pre-cutover authority MAY continue serving alone
- AND the staged Convex candidate MUST not create dual runtime authority

#### Scenario: Authority switches

- GIVEN candidate validation, reconstruction, equivalence, and replay checks pass
- WHEN cutover is released
- THEN all production composition roots MUST switch together to the Convex reader
- AND no runtime literal or migration fallback MAY remain

#### Scenario: Application rollback is needed after cutover

- GIVEN a post-cutover release must be rolled back
- WHEN a prior application version is selected
- THEN it MUST be a Convex-backed compatible version
- AND rollback MUST NOT restore fixture authority or dual reads

#### Scenario: Catalog data rollback is needed

- GIVEN a catalog-data incident occurs after cutover
- WHEN operators recover catalog state
- THEN trusted internal tooling MUST replace it with a previously verified snapshot using OCC
- AND if no safe Convex-backed recovery exists, the system MUST halt or fail closed rather than use a fixture fallback

### Requirement 14: Required verification layers

The change MUST include Domain validation tests, Application behavior and one-load tests, Convex adapter/integration tests, internal bootstrap/OCC/replay tests, exact full round-trip tests, architecture enforcement tests, cutover/rollback checks, and regression tests for existing Resource Master behavior. Repository typecheck, backend tests, architecture tests, build, and the full repository check MUST pass before cutover.

#### Scenario: Domain invariant is violated

- GIVEN a focused invalid snapshot fixture for duplicates, ambiguity, references, lifecycle, ownership, ordering, applicability, rules, options, units, or presentation
- WHEN Domain tests run
- THEN the expected deterministic rejection MUST be asserted

#### Scenario: Application entrypoints are exercised

- GIVEN unavailable, absent, empty, invalid, and valid fake readers
- WHEN every Resource Master entrypoint is tested
- THEN exact error codes and at-most-one snapshot load per operation MUST be asserted

#### Scenario: Persistence protocol is exercised

- GIVEN Convex-backed tests for bootstrap and runtime reading
- WHEN initial import, identical replay, stale OCC, valid replacement, reconstruction, and failed validation execute
- THEN atomicity, revision behavior, internal-only reachability, bounded reading, and semantic equivalence MUST be asserted

#### Scenario: Architecture and repository gates run

- GIVEN the completed change
- WHEN architecture, type, backend, build, and full repository checks run
- THEN all gates MUST pass without exempting forbidden dependency or public-surface violations

### Requirement 15: Existing Resource behavior remains stable

Except for the additive catalog failure codes and replacement of catalog authority, current Resource behavior MUST remain unchanged, including taxonomy results, effective-schema inheritance and replacement, inactive-binding semantics, equality-rule defaults and conflict detection, option and unit results, validation, canonicalization, create, non-identity update, get, deactivate, search summaries/projections, descriptions, persistence semantics, public method names, and successful payload shapes.

#### Scenario: Current Cable behavior is compared

- GIVEN an equivalent persisted Cable snapshot and existing regression inputs
- WHEN pre-change expected behavior is compared with post-change behavior
- THEN all successful outputs and Domain decisions MUST be semantically equivalent

#### Scenario: Resource persistence is exercised

- GIVEN existing create, update, get, deactivate, search, and describe tests
- WHEN they run against the new catalog boundary
- THEN Resource repository semantics, stored identities, and existing success/error behavior unrelated to catalog availability MUST not regress

### Requirement 16: Explicit non-goals and bounded scope

This change SHALL NOT introduce an auth provider, product-facing catalog administration, catalog UI, general CRUD, workflow/orchestration platform, generic repository abstraction, additional Resource types, durable revision-history/audit storage, legacy schema or implementation ports, or redesign of Resource Search hydration. Existing per-Resource attribute reconstruction in Resource Search is explicitly out of scope; only catalog loading and catalog use during search MUST avoid N+1 behavior.

#### Scenario: Existing Resource Search hydration is observed

- GIVEN Resource Search reconstructs attributes per Resource under the current repository behavior
- WHEN this change is implemented
- THEN that existing Resource hydration behavior MAY remain unchanged
- AND the catalog itself MUST still be loaded once for the whole search operation

#### Scenario: Product administration is requested

- GIVEN a request for UI, client, public API, record-level CRUD, auth-provider selection, audit history, or another Resource type
- WHEN scope is evaluated for this change
- THEN it SHALL be treated as separate future work rather than inferred as business or administrative ownership here

### Requirement 17: Design acceptance proof obligations

Design acceptance MUST demonstrate, without weakening any product requirement, (a) the exact trusted Convex 1.45 tooling command or API that can invoke the internal deployment function without public exposure and (b) an explicit maximum encoded document and nested-array bound that fits Convex limits and is enforced before write and after read. These are design acceptance obligations, not product blockers.

#### Scenario: Internal invocation is reviewed

- GIVEN the installed/deployed Convex 1.45 toolchain
- WHEN design acceptance is performed
- THEN a reproducible trusted-tooling invocation of the internal function MUST be demonstrated
- AND no public wrapper MAY be introduced to satisfy the demonstration

#### Scenario: Aggregate bounds are reviewed

- GIVEN the complete Cable candidate and the chosen Convex storage representation
- WHEN design acceptance is performed
- THEN encoded document size and every bounded collection MUST be measured against explicit enforced limits with safe headroom
- AND unbounded reads or writes MUST be rejected

## Non-goals

The non-goals in Requirement 16 are normative. In particular, this specification assigns no new admin or business ownership, does not require general catalog management, and does not include remediation of the existing Resource Search attribute-hydration N+1.

## Design acceptance notes

The stable catalog key, bootstrap-version field naming, initial persisted revision representation, internal revision-conflict representation, and semantic-comparison mechanism MAY be selected during design provided they satisfy this specification and do not leak into or alter successful Public Resource payloads. The only unresolved proof obligations are the exact internal invocation and the enforced document/array size bound described in Requirement 17.
