# Delta for External GARFEX Boundary

## ADDED Requirements

### Requirement: Native Convex is the first accepted local and development transport

GARFEX MUST accept the existing native Convex Resource Master family as the first transport for GARFEX-owned compatible local and development clients only. The accepted family MUST consist of exactly `api.resourceMaster.getTaxonomy`, `api.resourceMaster.getEffectiveResourceSchema`, `api.resourceMaster.getValidOptions`, `api.resourceMaster.getNaturalUnits`, `api.resourceMaster.getResource`, `api.resourceMaster.searchResources`, `api.resourceMaster.describeResource`, `api.resourceMaster.createResource`, `api.resourceMaster.updateNonIdentityData`, and `api.resourceMaster.deactivateResource`. The system MUST reuse those ten functions and MUST NOT add a duplicate Resource Master family, generic executor, dispatcher, alternate operation registry, or universal payload entry point. This acceptance MUST NOT imply productive readiness, third-party exposure, public Internet exposure, or support for clients outside the stated GARFEX-owned local/development scope.

#### Scenario: Existing family is accepted without duplication

- GIVEN the native Convex callable surface for Resource Master
- WHEN its public functions are enumerated
- THEN the ten named `api.resourceMaster.*` functions are present exactly once
- AND no duplicate family, generic executor, dispatcher, or alternate registry is callable

#### Scenario: Productive or third-party use remains unaccepted

- GIVEN a productive deployment, public Internet consumer, or third-party client
- WHEN transport acceptance is evaluated
- THEN this capability provides no acceptance claim for that use
- AND only GARFEX-owned compatible local/development clients are in scope

#### Scenario: Future adapters reuse semantics without adding HTTP now

- GIVEN a future HTTP or other transport adapter is proposed
- WHEN its contract semantics are defined
- THEN it MUST reuse the same TypeSpec-authoritative ten operations, mappings, projections, failures, and metadata rules
- AND this change creates no HTTP route, verb, status mapping, handler, emitter, or client

### Requirement: Canonical dialect reconciliation precedes native exposure

Before any native Convex Resource Master exposure is accepted, its requests and outcomes MUST exactly implement the canonical TypeSpec dialect. `CreateResourceRequest.attributes` MUST be `ResourceAttribute[]`; every entry MUST carry its explicit `attributeCode`, `value`, `displayValue`, and `identityParticipating`, and any adaptation to an internal representation MUST use the entry's `attributeCode`. Array position MUST NOT be interpreted as an attribute code. Successes MUST use their operation-specific TypeSpec wrapper, including `items`, `attributes`, `options`, `allowed` and `suggested`, `resource`, or `resourceId` and `description`, with search preserving both `items` and nullable opaque `cursor`. The canonical path MUST NOT accept a legacy code-keyed attribute map, a bare success value, or implicit success wrapping.

Legacy code-keyed requests and bare-success handling MUST either be removed or remain behind an explicitly non-canonical compatibility boundary that is demonstrably unreachable from every `api.resourceMaster.*` function. Compatibility helpers, fixtures, or types MUST NOT be imported, invoked, or treated as fallback behavior by the canonical native composition.

#### Scenario: Create maps attributes by explicit code

- GIVEN a canonical create request containing `ResourceAttribute[]` in an arbitrary order
- WHEN the request is mapped for Resource Master
- THEN each internal attribute is associated by its `attributeCode`
- AND changing array order does not change attribute identity
- AND no array index is used as an attribute code

#### Scenario: Legacy create map is not canonical input

- GIVEN a create request whose `attributes` value is a legacy code-keyed object
- WHEN it is submitted to an accepted `api.resourceMaster.createResource` path
- THEN it is rejected and never reaches Resource Master as canonical input
- AND no compatibility helper silently converts it

#### Scenario: Bare success cannot enter the canonical path

- GIVEN an operation produces a legacy bare taxonomy array, option array, resource, or other unwrapped success
- WHEN canonical success validation runs
- THEN the value is rejected or contained as an invalid internal outcome
- AND it is not implicitly wrapped and released to the client

#### Scenario: Quarantined compatibility is unreachable

- GIVEN legacy compatibility behavior remains elsewhere in the repository
- WHEN dependency, architecture, and runtime-path checks inspect all ten native functions
- THEN none can import, invoke, or fall back to that behavior
- AND the compatibility boundary is identified as non-canonical

### Requirement: Exact ten-operation native parity is mandatory

The native Convex family MUST have exact, testable parity with TypeSpec for every operation's accepted request fields and constraints, success wrapper, one-to-one module mapping, safe failure codes, and allowlisted metadata. The required parity matrix is:

| Native Convex function | Canonical request | Canonical success | Module mapping |
| --- | --- | --- | --- |
| `api.resourceMaster.getTaxonomy` | no business fields | `{ items }` | `getTaxonomy` |
| `api.resourceMaster.getEffectiveResourceSchema` | `classCode`, `familyCode`, `typeCode` | `{ attributes }` | `getEffectiveResourceSchema` |
| `api.resourceMaster.getValidOptions` | `attributeCode` | `{ options }` | `getValidOptions` |
| `api.resourceMaster.getNaturalUnits` | `familyCode` | `{ allowed, suggested }` | `getNaturalUnits` |
| `api.resourceMaster.getResource` | `resourceId` | `{ resource }` | `getResource` |
| `api.resourceMaster.searchResources` | `terms`; optional `lifecycle`, `limit`, `cursor` | `{ items, cursor }` | `searchResources` |
| `api.resourceMaster.describeResource` | `resourceId` | `{ resourceId, description }` | `describeResource` |
| `api.resourceMaster.createResource` | `classCode`, `familyCode`, `typeCode`, `naturalUnitCode`, `attributes: ResourceAttribute[]` | `{ resource }` | `createResource` |
| `api.resourceMaster.updateNonIdentityData` | `resourceId`, `expectedRevision`, `naturalUnitCode` | `{ resource }` | `updateNonIdentityData` |
| `api.resourceMaster.deactivateResource` | `resourceId`, `expectedRevision` | `{ resource }` | `deactivateResource` |

All code and identifier strings constrained by TypeSpec MUST be non-empty, search `limit` MUST be an integer from 1 through 50, lifecycle MUST be `ACTIVE`, `INACTIVE`, or `ALL`, request objects MUST be closed, and cursor meaning MUST remain nullable and opaque. Every operation MUST expose only the eleven TypeSpec safe failure codes: `UNAUTHENTICATED`, `FORBIDDEN`, `INVALID_ARGUMENT`, `INVALID_REFERENCE`, `VALIDATION_FAILED`, `NOT_FOUND`, `DUPLICATE`, `CONFLICT`, `INVALID_LIFECYCLE`, `CATALOG_UNAVAILABLE`, and `INTERNAL_FAILURE`. Only reviewed `fieldIssues`, `existingResourceId`, and `currentRevision` metadata MAY appear for their applicable codes.

#### Scenario: Request, success, failure, metadata, and mapping parity passes

- GIVEN the TypeSpec semantic manifest, native validators and bindings, named composition, projections, and failure normalization
- WHEN exact parity is evaluated for all ten rows
- THEN every request field, constraint, success wrapper, operation mapping, safe failure, and metadata rule agrees with TypeSpec
- AND an omission, addition, widening, narrowing, redirection, or wrapper difference fails acceptance

#### Scenario: Search parity preserves bounded opaque pagination

- GIVEN a canonical search request and a successful page
- WHEN it crosses the native Convex boundary
- THEN lifecycle and limit obey their TypeSpec constraints
- AND the success contains exactly `items` and nullable opaque `cursor`
- AND no Convex or persistence cursor meaning is disclosed

### Requirement: Convex validators remain downstream of TypeSpec

Convex argument validators, return validators, registered function types, generated client bindings, and serialization MUST remain transport artifacts downstream of the TypeSpec semantic authority. They MUST enforce or narrow admission only as documented by the JD-S-002 boundary and MUST NOT independently add, remove, rename, widen, narrow, or reinterpret canonical business semantics. A Convex validator or generated type MUST NOT become a second contract authority, and TypeSpec MUST remain free of Convex decorators, APIs, generated types, serialization rules, and deployment concepts.

#### Scenario: Validator drift cannot redefine the contract

- GIVEN a Convex validator or generated binding differs from the current TypeSpec request, success, failure, or metadata semantics
- WHEN contract parity runs
- THEN acceptance fails
- AND TypeSpec remains the deciding semantic source

#### Scenario: TypeSpec remains transport-neutral after acceptance

- GIVEN native Convex is accepted as a downstream adapter
- WHEN TypeSpec sources and compilation are inspected
- THEN they contain no Convex binding, transport emitter, protocol framing, route, verb, status, header, serialization, deployment, or reachability requirement
- AND TypeSpec still compiles independently of the accepted adapter

### Requirement: JD-S-002 validation outcomes are explicit and observable

The accepted native boundary MUST explicitly classify malformed input into two disjoint observable categories. Values rejected by Convex before the named handler runs MUST be documented and proven as transport-level rejection and MUST NOT be claimed as canonical `INVALID_ARGUMENT` outcomes. Values admitted by Convex but invalid under TypeSpec-authoritative runtime validation MUST complete through the canonical outcome model as normalized `INVALID_ARGUMENT` and MUST NOT invoke Resource Master or downstream data work. The classification MUST cover missing fields, unknown fields, wrong primitive and object shapes, out-of-range values, unsupported Convex-serializable values, and forged authority fields. It MUST state the effect on generated client typing and MUST be identical in the in-process harness and a real local/development generated client, except where an explicitly recorded harness limitation is itself shown not to change accepted deployed behavior.

#### Scenario: Pre-handler rejection is not misreported

- GIVEN a value classified for Convex pre-handler rejection
- WHEN it is sent through the native generated client
- THEN the handler and Resource Master are not invoked
- AND the observation is recorded as transport rejection rather than a canonical failure result

#### Scenario: Admitted invalid value is normalized canonically

- GIVEN a Convex-serializable value admitted to the named handler but invalid under TypeSpec semantics
- WHEN canonical runtime validation runs
- THEN the outcome is `INVALID_ARGUMENT` with only applicable reviewed `fieldIssues`
- AND Resource Master, catalog, repository, and persistence work do not occur

#### Scenario: Forged authority behavior is classified and safe

- GIVEN a request attempts to supply an actor, actor identifier, role, capability, claim, token, credential, session, provider value, or Convex authority value
- WHEN the JD-S-002 behavior matrix is applied
- THEN the value is rejected in its documented pre-handler or canonical-invalid category
- AND it cannot influence trusted identity or authorization

#### Scenario: Both proof environments agree

- GIVEN every JD-S-002 matrix case
- WHEN it is exercised through `convex-test` and through a real local/development generated client
- THEN both observations match the documented category and downstream-call behavior
- AND any material mismatch fails native transport acceptance

### Requirement: Native composition preserves trusted authority and safe encapsulation

Every accepted native invocation MUST resolve identity from the configured server-controlled local/development identity mechanism and MUST construct a fresh `ActorContext` server-side from copied server-authorized capabilities. Client business arguments MUST reject authority-bearing data and MUST NOT supplement or replace that context. Resource Master MUST make the final exact per-operation capability decision, MUST deny missing, unknown, or mismatched mappings by default, and MUST complete authorization before catalog, repository, persistence, transaction, or other data work.

Successful and failed native outcomes MUST contain only TypeSpec-reviewed external values. Convex diagnostics, generated/platform values, internal DTOs, module objects, catalog details, persistence records and identifiers, stacks, provider data, and configuration MUST remain server-only. Every failure that reaches canonical normalization MUST use the eleven-code safe model and applicable metadata allowlist; unknown, malformed, thrown, or unsafe failures MUST become metadata-free `INTERNAL_FAILURE`.

#### Scenario: Fresh server-derived actor reaches Resource Master

- GIVEN a valid native business request and trusted local/development identity
- WHEN the invocation is composed
- THEN a fresh `ActorContext` is created from server-controlled identity and copied capabilities
- AND no client authority field contributes to it

#### Scenario: Final authorization denies before data work

- GIVEN a server-created actor lacks the exact capability for the named operation or the mapping is missing or unknown
- WHEN Resource Master authorizes the invocation
- THEN it returns `FORBIDDEN`
- AND no catalog, repository, persistence, transaction, or Convex data work occurs

#### Scenario: Unsafe failure is contained

- GIVEN a module, catalog, persistence, Convex, projection, or thrown failure contains internal diagnostics
- WHEN native failure normalization completes
- THEN the client receives only an applicable safe code and allowlisted metadata or metadata-free `INTERNAL_FAILURE`
- AND no internal diagnostic or implementation value crosses the boundary

### Requirement: Native acceptance requires integrated and real-client evidence

Acceptance MUST include an in-process `convex-test` proof and a distinct smoke proof using generated Convex client bindings against a real local/development Convex deployment. The `convex-test` proof MUST exercise all ten functions, canonical requests and wrappers, named mappings, authorized and denied contexts, malformed input, safe failure normalization, opaque cursors, legacy exclusion, and one-family architecture. The real-client smoke MUST separately prove generated argument serialization, JD-S-002 pre-handler behavior, canonical `INVALID_ARGUMENT`, canonical wrappers and failures, trusted local/development identity, and create, update, deactivate, read, and search flows. Evidence MUST identify which environment proved each case and MUST NOT represent in-process evidence as network or deployment evidence.

The seven read/discovery operations MUST remain usable as one-shot queries and the three mutation operations MUST remain usable with transactional mutation behavior without requiring a realtime subscription. Realtime behavior MAY remain available, but acceptance and the demonstration flow MUST NOT depend on realtime.

#### Scenario: Convex test harness proves integrated semantics

- GIVEN the in-process Convex test environment with representative catalog data and trusted and denied contexts
- WHEN all ten generated `api.resourceMaster.*` references are exercised
- THEN canonical requests, outcomes, mappings, authorization, failures, cursor behavior, and family uniqueness pass
- AND the evidence is labeled as in-process proof

#### Scenario: Generated client proves deployed boundary behavior

- GIVEN a real local/development Convex deployment and its generated client bindings
- WHEN the required read, search, create, update, and deactivate flows and JD-S-002 cases are exercised
- THEN serialization, validation-boundary behavior, trusted identity, canonical outcomes, and safe failures pass end to end
- AND the evidence is distinct from `convex-test`

#### Scenario: One-shot use does not require realtime

- GIVEN a compatible local/development client with no realtime subscription
- WHEN it invokes each read query and performs the mutation flow
- THEN queries return their canonical outcomes
- AND mutations preserve their transactional behavior
- AND no realtime subscription is required for the demonstration to pass

## MODIFIED Requirements

### Requirement: Deterministic transport-neutral outcomes

Every completed boundary invocation MUST yield exactly one transport-neutral normalized outcome: a success containing the operation-specific reviewed value, or a failure containing a stable machine code and only code-allowlisted corrective metadata. Outcome meaning MUST NOT depend on protocol framing, status codes, serialization format, SDK behavior, or thrown exception classes. Native Convex MAY carry these outcomes for accepted GARFEX-owned compatible local/development clients, but MUST NOT alter their TypeSpec-defined meaning. Future transport adapters MUST reuse the same normalized semantics.

(Previously: The requirement stated that the specification selected no transport at all; native Convex is now the first accepted downstream transport while outcome semantics remain transport-neutral.)

#### Scenario: Equivalent successes normalize identically

- GIVEN equivalent Resource Master successes for the same operation
- WHEN they are projected through native Convex or a different future transport adapter
- THEN their normalized external business outcome is the same

#### Scenario: Equivalent failures normalize identically

- GIVEN equivalent internal failure semantics
- WHEN they are projected through native Convex or a different future transport adapter
- THEN their machine code and allowlisted metadata are the same

### Requirement: No internal or Convex leakage

External contract sources, canonical runtime values, semantic artifacts, fixtures, and canonical semantic documentation MUST NOT import, re-export, reference as contract types, structurally pass through, or mechanically derive from Resource Master internal/public TypeScript types, backend auth types, domain types, application types, infrastructure types, Convex SDK or generated types, persistence records, or deployment/catalog administration contracts. Shared business meaning MUST be represented by independently owned external definitions and explicit projections. The accepted native Convex adapter and its generated client binding MAY reference Convex only as downstream transport machinery; they MUST NOT expose Convex, persistence, or backend internals as business fields, semantic authority, canonical metadata, or returned diagnostics.

(Previously: The requirement broadly prohibited Convex references in generated artifacts without distinguishing an accepted downstream transport binding from canonical semantic artifacts.)

#### Scenario: Internal import is rejected

- GIVEN an external semantic contract source imports or re-exports `resource-master/public.ts` or another backend internal type
- WHEN architecture checks run
- THEN the checks fail

#### Scenario: Convex semantic derivation is rejected

- GIVEN an external semantic contract or canonical DTO is derived from Convex validators, generated bindings, document identifiers, or persistence shapes
- WHEN architecture checks run
- THEN the checks fail

#### Scenario: Accepted binding remains transport-only

- GIVEN the generated native Convex client binding for an accepted `api.resourceMaster.*` function
- WHEN its observable business requests and outcomes are inspected
- THEN they match independently owned TypeSpec semantics
- AND no Convex internal, persistence value, or generated platform detail appears as canonical business data

#### Scenario: Extra internal response field cannot drift outward

- GIVEN an internal Resource Master response gains a new field
- WHEN existing external projection and fixtures run unchanged
- THEN the new field is absent externally
- AND compatibility checks detect any attempted unreviewed publication

### Requirement: Architecture fitness enforcement

Repository architecture checks MUST reject semantic or runtime payload dependency on backend internals or trusted auth concepts, authority-bearing DTO fields, Convex/generated/platform leakage, persistence or deployment leakage, generic business executors, arbitrary CRUD or repository publication, and mechanical external derivation from the module contract. They MUST permit only the reviewed native Convex adapter and generated client binding as downstream transport machinery for the ten named functions, while rejecting any use of that machinery as semantic authority or any duplicate family. The checks MUST include controlled valid and violating fixtures so each rule is testable.

(Previously: Architecture checks rejected client-facing Convex dependency without an exception for an accepted downstream native binding.)

#### Scenario: Safe independent contract and accepted adapter pass

- GIVEN an independently defined external contract and the reviewed native adapter with only the ten named bindings
- WHEN architecture checks run
- THEN the semantic contract passes the external-boundary rules
- AND the adapter passes only when its payloads and outcomes remain TypeSpec-parity checked

#### Scenario: Each prohibited pattern has a failing fixture

- GIVEN controlled fixtures for internal imports, authority fields, semantic derivation from Convex/generated types, persistence values, generic forwarding, duplicate families, and automatic publication
- WHEN architecture checks run against each fixture
- THEN each fixture fails for its intended named rule

### Requirement: Canonical boundary documentation

Canonical documentation and the repository ADR set MUST distinguish the TypeSpec External Client Contract, the trusted server-side edge, the Resource Master Module Public Application Contract, and the downstream native Convex adapter. They MUST identify TypeSpec as the transport-neutral external semantic authority and GARFEX as compatibility owner; list exactly the ten approved operations and one-to-one mappings; describe canonical `ResourceAttribute[]`, explicit `attributeCode` mapping, wrapped successes, JD-S-002 behavior, trusted authentication and fresh actor construction, final deny-by-default module authorization, field-by-field projection, safe eleven-code failure normalization, Convex and persistence encapsulation, legacy removal or quarantine, parity gates, and both evidence environments.

The records MUST state that earlier canonical language intentionally left transport selection open and included a contradictory MUST NOT choose transport requirement, and that this amendment supersedes only that non-decision by accepting native Convex for GARFEX-owned compatible local/development clients. They MUST state that TypeSpec itself remains transport-neutral, that productive and third-party exposure remain unaccepted, that no HTTP adapter is included, and that future adapters reuse the same semantics. Stale documentation or acceptance language that still claims every transport decision remains open MUST fail documentation parity. The relevant external client boundary, external GARFEX boundary, authentication boundary, architecture, and native adapter records MUST persist and cross-link these decisions.

(Previously: Canonical documentation was required to preserve the transport non-decision and to state that no transport was selected.)

#### Scenario: Documentation matches executable semantics

- GIVEN the canonical operation and error tables, TypeSpec identifiers, trusted mappings, native adapter behavior, and compatibility evidence
- WHEN documentation parity is checked
- THEN operation identifiers, mappings, wrappers, error codes, allowlisted metadata, scope, and boundary ownership statements agree
- AND the prior transport contradiction is explicitly reported as superseded

#### Scenario: ADRs preserve the amended architecture

- GIVEN the accepted change
- WHEN the canonical external client, external GARFEX, authentication, architecture, and native adapter records are reviewed
- THEN they cross-link TypeSpec authority, native local/development acceptance, trusted actor construction, final module authorization, safe encapsulation, legacy exclusion, and evidence gates

#### Scenario: Remaining non-decisions stay open

- GIVEN the canonical documentation
- WHEN its scope and non-goals are reviewed
- THEN it selects no HTTP or other additional transport
- AND it selects no OpenAPI, Scalar, Orval, SDK publication, hosting, registry, public distribution, or productive rollout approach
- AND it selects no productive identity provider or credential or session mechanism
- AND it assumes no UI or consumer-specific implementation
- AND the approved JSON baseline implies no semantic-version identifier scheme, ordering rule, compatibility window, deprecation policy, or migration duration

### Requirement: Convex and backend internals remain encapsulated

TypeSpec sources, TypeSpec configuration, canonical runtime external values, semantic compatibility evidence, and transport-neutral consumer documentation MUST NOT import, re-export, derive from, structurally expose, or name as contract authority any Convex API, generated Convex binding, validator, persistence schema or record, repository, catalog administration model, deployment concept, backend authentication model, `ActorContext`, capability model, Resource Master internal type, or `resource-master/public.ts` type. Convex MUST remain private infrastructure behind Resource Master application-owned ports. The accepted native adapter and generated binding MAY expose only the ten named function references and TypeSpec-parity-checked business requests and outcomes; they MUST NOT expose internal Convex identifiers, documents, contexts, validators as semantic authority, persistence details, or backend authority.

(Previously: The requirement did not distinguish canonical semantic artifacts from an accepted downstream native Convex adapter and generated binding.)

#### Scenario: Convex-backed implementation remains replaceable to consumers

- GIVEN Resource Master uses the accepted native Convex adapter
- WHEN a consumer understands the business contract
- THEN no Convex internal or persistence concept is required or visible in the business semantics
- AND a future adapter can reuse those semantics without changing TypeSpec

#### Scenario: Internal derivation is rejected

- GIVEN TypeSpec or a canonical semantic artifact imports, re-exports, derives from, or passes through a backend, module, persistence, or Convex shape
- WHEN architecture checks run
- THEN the checks fail with the applicable boundary rule

#### Scenario: Native binding exposes no internal value

- GIVEN a generated client invokes one of the ten accepted functions
- WHEN its request, success, and failure values are inspected
- THEN only TypeSpec-defined business fields and safe metadata are present
- AND Convex identifiers, persistence records, internal DTOs, actor context, and diagnostics are absent

### Requirement: TypeSpec-aware architecture fitness checks

Repository architecture checks MUST inspect `.tsp` sources, TypeSpec configuration, canonical generated semantic artifacts, trusted mappings, the native Convex adapter, generated binding evidence, and relevant documentation. They MUST reject transport decorators or emitters in TypeSpec; authority-bearing business fields; module, authentication, catalog-administration, persistence, deployment, platform, or Convex leakage into canonical semantics; mechanical derivation from the module contract; generic execution; duplicate native families; automatic publication; bypass of the module public application API; omission of final module authorization; and native validator drift from TypeSpec. Each named rule MUST have controlled passing and violating fixtures. The checks MUST permit native Convex only as the reviewed downstream transport for the ten named local/development functions.

(Previously: Architecture checks were required to reject any Convex reference in an approved artifact because no transport adapter had been accepted.)

#### Scenario: Independent transport-neutral contract and downstream adapter pass

- GIVEN TypeSpec defines only the ten reviewed client-safe workflows and public metadata
- AND it has no transport emitter or prohibited dependency
- AND the native adapter remains downstream and parity-checked
- WHEN architecture checks run
- THEN the TypeSpec boundary and reviewed adapter pass

#### Scenario: Prohibited TypeSpec or adapter construct fails

- GIVEN a controlled fixture contains a TypeSpec transport binding, authority field, internal dependency, semantic derivation from Convex, duplicate family, generic executor, or automatic-publication pattern
- WHEN architecture checks run
- THEN the fixture fails for its intended named rule

#### Scenario: Module addition remains private by architecture

- GIVEN a module public method has no approved TypeSpec operation and no trusted named mapping
- WHEN architecture checks run
- THEN the method remains externally unreachable
- AND the exact ten-operation native set still passes

### Requirement: Transport-neutral consumer documentation

TypeSpec-derived consumer semantic documentation MUST describe the ten business operations, requests, public successes and UI-supporting metadata, safe failures, and compatibility expectations without requiring backend source knowledge or embedding a transport. It MUST NOT define routes, verbs, statuses, headers, wire authentication, serialization, SDK behavior, deployment, or network reachability, and it MUST distinguish consumer business input from trusted server authentication and authorization. Separate native adapter guidance MAY explain how GARFEX-owned compatible local/development clients invoke generated Convex bindings, but it MUST refer to TypeSpec-derived semantics, MUST document JD-S-002 transport rejection separately from canonical failures, and MUST NOT redefine the business contract or claim productive, third-party, HTTP, or public readiness.

(Previously: All consumer-facing documentation was required to avoid selecting any transport, with no allowance for separate guidance for an accepted downstream adapter.)

#### Scenario: Semantic documentation stands alone

- GIVEN a consumer has the TypeSpec-derived semantic documentation but no backend implementation access
- WHEN the consumer reviews an approved workflow
- THEN the business request, success, metadata, and failure meanings are understandable
- AND backend module, Convex, persistence, and authentication internals are unnecessary

#### Scenario: Semantic documentation does not imply HTTP

- GIVEN the TypeSpec-derived consumer documentation is scanned for transport commitments
- WHEN its normative content is evaluated
- THEN it contains no route, verb, status, header, HTTP authentication framing, or wire serialization requirement

#### Scenario: Native guidance remains subordinate and scoped

- GIVEN separate native Convex client guidance
- WHEN its claims and examples are reviewed
- THEN it uses the existing ten generated bindings and TypeSpec-defined business semantics
- AND it states GARFEX-owned local/development-only scope and the JD-S-002 rejection distinction
- AND it makes no productive, third-party, or HTTP claim

### Requirement: Scope exclusions and deferred decisions remain explicit

This change MUST choose only the existing native Convex transport for GARFEX-owned compatible local/development clients and MUST retain exactly the ten named `api.resourceMaster.*` functions. It MUST NOT choose or implement HTTP or another additional transport; productive authentication, deployment, readiness, public Internet reachability, or third-party exposure; routes, verbs, statuses, headers, or HTTP authentication framing; OpenAPI emission or execution, Scalar, Orval, transport-derived HTTP documentation or clients; SDK publication, package registry, public hosting, distribution, or rollout; a productive identity provider, login, credential, token, session, provisioning, role assignment, or machine identity; a UI, interaction design, workflow, state model, or consumer-specific behavior; exposure of internal schemas, `ActorContext`, capabilities, catalog administration, persistence, Convex internals, or deployment concepts; operations beyond the exact ten; redesign of Resource Master behavior, lifecycle, identity, capability, or final authorization policy; or any modification to `openspec/changes/persistent-resource-catalog/`.

The approved repository-local TypeSpec root, transport-neutral semantic emitter, deterministic JSON semantic manifest, manifest-driven runtime validation data, generated canonical runtime TypeScript and transport-neutral documentation, and accepted JSON baseline MUST remain semantic authorities or downstream semantic artifacts rather than native transport serialization or publication decisions. Convex validators and generated bindings MUST remain subordinate transport artifacts. Semantic-version identifier syntax or ordering, compatibility windows, deprecation policy, and migration duration MUST remain deferred.

(Previously: The requirement prohibited choosing or implementing any transport and therefore contradicted this amendment's narrow acceptance of native Convex.)

#### Scenario: Unapproved technology or exposure appears

- GIVEN an artifact selects HTTP, another transport, OpenAPI execution, Scalar, Orval, public SDK publication, productive identity, public or third-party exposure, UI behavior, or another deferred technology
- WHEN scope acceptance is evaluated
- THEN acceptance fails as an unapproved scope expansion

#### Scenario: Approved semantic artifacts remain transport-neutral

- GIVEN TypeSpec is authoritative and runtime validation is mandatory
- WHEN the repository artifact strategy and native adapter are reviewed
- THEN canonical runtime schema data and semantic documentation remain deterministically downstream of TypeSpec
- AND native Convex validators and bindings do not redefine serialization-independent business meaning, publication, distribution, or semantic-version policy

#### Scenario: Protected catalog change is absent

- GIVEN the repository changes for this capability
- WHEN changed paths and behavior are reviewed
- THEN `openspec/changes/persistent-resource-catalog/` is byte-for-byte unchanged
- AND Resource Master lifecycle, identity, capability, authorization policy, and persistence design are not redesigned

## Acceptance Criteria

- [ ] Exactly the existing ten `api.resourceMaster.*` functions are accepted for GARFEX-owned compatible local/development clients, with no duplicate family or generic executor.
- [ ] Canonical requests use `ResourceAttribute[]` and explicit `attributeCode` mapping; canonical successes use exact TypeSpec wrappers; legacy map and bare-success behavior is removed or demonstrably unreachable.
- [ ] Exact ten-operation parity covers requests, constraints, success wrappers, one-to-one mappings, eleven safe failure codes, and reviewed metadata.
- [ ] Convex validators and generated bindings remain downstream of transport-neutral TypeSpec and cannot become semantic authority.
- [ ] JD-S-002 distinguishes pre-handler transport rejection from canonical normalized `INVALID_ARGUMENT` and is proven in both `convex-test` and a real generated client.
- [ ] Identity and fresh `ActorContext` are server-derived, client authority is rejected, and final Resource Master authorization denies by default before data work.
- [ ] No Convex, persistence, catalog, module, authentication, or diagnostic detail leaks through canonical requests or outcomes.
- [ ] One-shot queries and transactional mutations work without a realtime subscription.
- [ ] A distinct local/development generated-client smoke proves serialization, validation-boundary behavior, trusted identity, canonical outcomes, and required lifecycle flows.
- [ ] No HTTP or other adapter, productive or third-party exposure, or modification under `openspec/changes/persistent-resource-catalog/` is included.
- [ ] Canonical documentation explicitly reports and supersedes the prior transport non-decision while preserving TypeSpec transport neutrality and every unrelated requirement.
