# Delta for External GARFEX Boundary

## ADDED Requirements

### Requirement: TypeSpec is the transport-neutral external authority

The system MUST treat the independently owned TypeSpec source as the sole authority for the External Client Contract's operation identifiers, client-safe requests, public success models, public UI-supporting metadata, normalized outcomes, and safe failures. TypeSpec MUST compile without a transport emitter and MUST NOT contain or require transport bindings, protocol framing, routes, verbs, status codes, headers, serialization choices, deployment, or network reachability. Runtime validators, TypeScript artifacts, compatibility fixtures, documentation, and any other derived or parity-checked representation MUST remain downstream of TypeSpec and MUST NOT become a competing authority.

#### Scenario: Contract compiles without choosing a transport

- GIVEN the canonical TypeSpec source and its compilation configuration
- WHEN the contract compilation gate runs without a transport emitter
- THEN compilation succeeds
- AND the resulting semantics contain no transport or protocol decision

#### Scenario: A downstream artifact cannot become authoritative

- GIVEN a runtime validator, TypeScript representation, fixture, or generated artifact differs from TypeSpec
- WHEN contract authority is evaluated
- THEN TypeSpec remains the deciding external semantic source
- AND the difference fails the applicable drift or stale-artifact check

#### Scenario: Module contract is not the TypeSpec authority

- GIVEN `apps/backend/src/resource-master/public.ts` and the TypeSpec contract contain intentionally similar business concepts
- WHEN their ownership is reviewed
- THEN TypeSpec is the external semantic authority
- AND the module public contract remains the actor-first in-process application authority
- AND neither contract is mechanically treated as the other

### Requirement: Three ownership boundaries remain distinct

The system MUST preserve three distinct boundaries: the TypeSpec External Client Contract, the trusted server-side edge, and the Resource Master Module Public Application Contract. TypeSpec MUST own client-safe semantics but MUST NOT authenticate, construct actors, authorize module work, or expose the module schema. The trusted edge MUST validate and compose external invocations but MUST NOT replace module authorization or become the external semantic authority. The Module Public Application Contract MUST remain an actor-first in-process API and MUST NOT become an external schema.

#### Scenario: Boundary responsibilities are independently verifiable

- GIVEN the contract source, trusted edge, and module public application API
- WHEN architecture checks classify their responsibilities
- THEN TypeSpec contains only reviewed external semantics
- AND trusted composition owns authentication, actor construction, mapping, projection, and normalization
- AND Resource Master owns final module authorization and application invocation

#### Scenario: Duplicate-looking models preserve ownership

- GIVEN an external TypeSpec model resembles a module or internal model
- WHEN the boundary is reviewed
- THEN the external model remains independently owned and client-safe
- AND explicit mapping and projection remain required
- AND structural similarity does not authorize pass-through or derivation

### Requirement: Exact TypeSpec operation exposure and named mappings

The TypeSpec authority MUST expose exactly the ten operations in the following table, and the trusted edge MUST provide exactly one separately reviewed named mapping from each external operation to the corresponding Module Public Application Contract operation. The listed module capability MUST remain the final module authorization requirement. Any difference between the module's callable surface and the external surface MUST be explicit: module operations not listed here remain externally private, and a newly added, removed, renamed, or differently exposed operation MUST NOT alter external exposure until TypeSpec and its named mapping receive an approved contract change.

| External TypeSpec operation | Module public operation | Final module capability |
| --- | --- | --- |
| `getTaxonomy` | `getTaxonomy` | `resource:read` |
| `getEffectiveResourceSchema` | `getEffectiveResourceSchema` | `resource:read` |
| `getValidOptions` | `getValidOptions` | `resource:read` |
| `getNaturalUnits` | `getNaturalUnits` | `resource:read` |
| `getResource` | `getResource` | `resource:read` |
| `searchResources` | `searchResources` | `resource:read` |
| `describeResource` | `describeResource` | `resource:read` |
| `createResource` | `createResource` | `resource:create` |
| `updateNonIdentityData` | `updateNonIdentityData` | `resource:update-non-identity` |
| `deactivateResource` | `deactivateResource` | `resource:deactivate` |

#### Scenario: TypeSpec and trusted mappings have exact parity

- GIVEN the TypeSpec operation set and the trusted named mapping set
- WHEN parity is checked
- THEN each contains the ten listed operation identifiers exactly once
- AND every identifier maps only to its identically named module operation
- AND no additional operation is externally exposed

#### Scenario: Module exposure difference remains private

- GIVEN the Module Public Application Contract gains or contains an operation outside the listed ten
- WHEN external exposure and parity checks run
- THEN that operation remains absent from TypeSpec and the trusted mappings
- AND it cannot be invoked through the external boundary

#### Scenario: Unmapped or unknown operation fails closed

- GIVEN an operation is unknown, unsupported, or lacks an exact named mapping
- WHEN the trusted edge evaluates it
- THEN the operation is denied before Resource Master, catalog, repository, persistence, or Convex work
- AND no generic fallback dispatches it

### Requirement: Client-safe business semantics and public UI metadata

The TypeSpec contract MUST define the reviewed request meaning, requiredness, closed enums and unions, constraints, success projection, and applicable failure outcomes for every approved operation. It MUST expose only public business information needed to understand or support those workflows, including taxonomy codes and labels, effective attribute descriptions and constraints, option code/label pairs, and allowed or suggested natural-unit choices. These public projections MAY intentionally differ from internal catalog, domain, application, or persistence shapes, but every difference MUST be represented by an explicit mapping or projection rather than pass-through.

#### Scenario: A future client can build selection UI from public metadata

- GIVEN a consumer uses taxonomy, effective schema, valid-option, and natural-unit operations
- WHEN it reads the TypeSpec-defined successes
- THEN it can obtain reviewed labels, descriptions, constraints, option pairs, and unit choices
- AND it receives no internal catalog record, domain entity, persistence document, validator, or UI implementation

#### Scenario: Consumer understanding is independent of backend internals

- GIVEN only the TypeSpec contract and transport-neutral consumer documentation
- WHEN a consumer reviews any of the ten workflows
- THEN the request, success, public metadata, and safe failure meanings are independently understandable
- AND knowledge of Convex, persistence, authentication internals, module DTOs, or `ActorContext` is unnecessary

#### Scenario: Internal shape growth does not expand public metadata

- GIVEN an internal schema, catalog record, or module response gains a field
- WHEN existing explicit projections run
- THEN the field remains absent from the external result
- AND any attempted unreviewed exposure fails compatibility checks

### Requirement: Trusted composition and handler responsibilities are separated

The trusted server-side composition root MUST obtain identity only through trusted authentication composition and MUST construct a fresh `ActorContext` for each invocation using copied server-authorized capabilities. Client business input MUST NOT supply or modify actor identifiers, roles, capabilities, claims, tokens, credentials, sessions, provider data, or equivalent authority-bearing values. Per-operation handlers MUST be limited to their named validation, mapping, invocation, projection, and failure-normalization responsibilities and MUST receive trusted actor state from composition rather than authenticate or manufacture authority themselves.

#### Scenario: Composition creates fresh trusted authority

- GIVEN trusted authentication resolves an identity and server-authorized capabilities
- WHEN an approved invocation is composed
- THEN the composition root constructs a fresh `ActorContext`
- AND copied server-authorized capabilities are supplied separately from business input
- AND the named handler does not accept client-supplied authority

#### Scenario: Handler cannot replace composition

- GIVEN a per-operation handler receives valid business input without trusted composed actor state
- WHEN invocation is attempted
- THEN it does not construct authority from that input
- AND Resource Master is not invoked as an authenticated actor

#### Scenario: Forged authority is rejected or inert

- GIVEN client business input contains an actor, role, capability, claim, token, credential, session, or provider value
- WHEN runtime validation and composition run
- THEN the value is rejected or has no effect on trusted authority
- AND it cannot alter module authorization

### Requirement: Resource Master remains the final authorization authority

For every mapped operation, Resource Master MUST perform the exact capability check listed for that operation, deny missing, unknown, or mismatched capability mappings by default, and complete that decision before catalog, repository, persistence, or Convex work. Trusted-edge authentication or validation MUST NOT be treated as sufficient authorization and MUST NOT duplicate, weaken, replace, or broaden Resource Master authorization.

#### Scenario: Read operation lacks final capability

- GIVEN a fresh server-created actor lacks `resource:read`
- WHEN any of the seven approved read operations reaches Resource Master
- THEN Resource Master returns `FORBIDDEN`
- AND no catalog, repository, persistence, or Convex work occurs

#### Scenario: Mutation lacks its exact capability

- GIVEN a fresh server-created actor lacks the listed capability for `createResource`, `updateNonIdentityData`, or `deactivateResource`
- WHEN that mutation reaches Resource Master
- THEN Resource Master returns `FORBIDDEN`
- AND no downstream data work occurs

#### Scenario: Authorization mapping is unknown

- GIVEN Resource Master cannot resolve an exact capability rule for an invocation
- WHEN authorization is evaluated
- THEN it denies by default before business work

### Requirement: Explicit per-operation requests and success projections

Each named trusted mapping MUST runtime-validate and map only the TypeSpec-defined request for its operation, invoke only the corresponding module public operation, and rebuild the TypeSpec-defined success field by field into a newly owned external value. The operation-specific request and success meanings MUST match the reviewed canonical ten-operation compatibility baseline. No mapper MAY spread, cast, return by reference, or automatically forward internal request or response objects, and an intentional external-versus-internal field difference MUST be covered by mapping and projection evidence.

#### Scenario: Every operation has explicit mapping and projection evidence

- GIVEN the ten approved operations
- WHEN mapping and projection coverage is enumerated
- THEN each operation has one request-mapping test and one success-projection test
- AND each test proves only reviewed fields cross the boundary

#### Scenario: Read and discovery operation projects only its contract

- GIVEN any successful `getTaxonomy`, `getEffectiveResourceSchema`, `getValidOptions`, `getNaturalUnits`, `getResource`, `searchResources`, or `describeResource` module result containing extra internal data
- WHEN its named projector runs
- THEN the external success contains all and only the TypeSpec-defined fields for that operation
- AND it is not the internal value by reference

#### Scenario: Mutation projects only its contract

- GIVEN a successful `createResource`, `updateNonIdentityData`, or `deactivateResource` module result containing extra internal data
- WHEN its named projector runs
- THEN the external success contains all and only the TypeSpec-defined resource fields
- AND it is not the internal value by reference

### Requirement: Closed safe failure normalization is exhaustive

The External Client Contract MUST expose exactly these failure codes: `UNAUTHENTICATED`, `FORBIDDEN`, `INVALID_ARGUMENT`, `INVALID_REFERENCE`, `VALIDATION_FAILED`, `NOT_FOUND`, `DUPLICATE`, `CONFLICT`, `INVALID_LIFECYCLE`, `CATALOG_UNAVAILABLE`, and `INTERNAL_FAILURE`. Only reviewed `fieldIssues`, `existingResourceId`, and `currentRevision` metadata MAY be exposed for their applicable meanings. The trusted edge MUST exhaustively normalize every module failure, authentication failure, thrown value, malformed failure, invalid success projection, and unknown outcome into either its reviewed external failure or metadata-free `INTERNAL_FAILURE`; it MUST NOT normalize any known failure into success. Internal messages, arbitrary details, stacks, provider diagnostics, Convex data, catalog integrity details, malformed metadata, and unknown diagnostics MUST remain server-only.

#### Scenario: Reviewed corrective metadata is narrowly exposed

- GIVEN an applicable invalid-argument, invalid-reference, validation, duplicate, or conflict failure contains valid reviewed corrective metadata
- WHEN normalization runs
- THEN only applicable `fieldIssues`, `existingResourceId`, or `currentRevision` is exposed
- AND all non-allowlisted detail is absent

#### Scenario: Catalog availability is safely coarsened

- GIVEN Resource Master reports catalog unavailable or uninitialized semantics
- WHEN normalization runs
- THEN the external code is `CATALOG_UNAVAILABLE`
- AND no deployment, initialization, provider, or catalog configuration detail is exposed

#### Scenario: Unsafe and unknown failures become internal failure

- GIVEN an integrity, internal, invalid-catalog, unknown, malformed, projection, invalid-response, or thrown failure
- WHEN normalization runs
- THEN the external result is metadata-free `INTERNAL_FAILURE`
- AND diagnostics remain available only server-side

#### Scenario: Known failure cannot become success

- GIVEN authentication, validation, authorization, module invocation, projection, or output validation yields a known failure
- WHEN the complete boundary pipeline finishes
- THEN no success outcome is released
- AND exactly one allowlisted external failure is released

### Requirement: Convex and backend internals remain encapsulated

TypeSpec sources, TypeSpec configuration, approved downstream artifacts, runtime external values, compatibility evidence, and consumer documentation MUST NOT import, re-export, derive from, structurally expose, or name as contract authority any Convex API, generated Convex binding, validator, persistence schema or record, repository, catalog administration model, deployment concept, backend authentication model, `ActorContext`, capability model, Resource Master internal type, or `resource-master/public.ts` type. Convex MUST remain private infrastructure behind Resource Master application-owned ports.

#### Scenario: Convex-backed implementation remains replaceable to consumers

- GIVEN Resource Master uses Convex infrastructure internally
- WHEN a consumer compiles or reads the external contract
- THEN no Convex concept is required or visible
- AND an internal adapter change does not alter external semantics

#### Scenario: Internal derivation is rejected

- GIVEN TypeSpec or an approved artifact imports, re-exports, derives from, or passes through a backend, module, persistence, or Convex shape
- WHEN architecture checks run
- THEN the checks fail with the applicable boundary rule

### Requirement: No universal external business API

The system MUST NOT provide a generic executor, operation registry, dynamic module forwarder, arbitrary CRUD surface, table API, repository API, universal business API, or automatic publication mechanism for Resource Master. External invocation MUST remain limited to the ten named TypeSpec operations and ten explicit trusted mappings.

#### Scenario: Generic dispatch is absent

- GIVEN the contract, trusted edge, and approved artifacts
- WHEN architecture and surface checks run
- THEN no generic operation name plus arbitrary payload entry point exists
- AND no module method becomes externally callable by registration or reflection

### Requirement: Cross-layer semantic drift is detected

Automated acceptance gates MUST compare the TypeSpec authority, runtime validation and success projections, named request and error mappings, the Module Public Application Contract relationship, and reviewed compatibility evidence. The gates MUST detect additions, removals, renames, mapping redirection, field changes, requiredness changes, closed enum or union changes, type narrowing or widening, success-shape changes, error-code changes, metadata-allowlist changes, missing validation, and missing projection coverage. A difference MUST fail unless it is an explicitly reviewed external contract change; intentional external-versus-module differences MUST remain explicit rather than being forced into structural equality.

#### Scenario: Contract and runtime semantics drift

- GIVEN TypeSpec and runtime validation, request mapping, success projection, or failure normalization disagree
- WHEN semantic parity checks run
- THEN the checks fail and identify the affected operation and semantic category

#### Scenario: Module change does not silently redefine the contract

- GIVEN a module method, request, result, or failure changes while TypeSpec remains unchanged
- WHEN module-relationship and mapping checks run
- THEN compatible differences must be absorbed explicitly by mapping or projection
- AND incompatible or unmapped differences fail without changing external semantics

#### Scenario: TypeSpec-only change cannot bypass the edge

- GIVEN TypeSpec adds or changes an operation, field, enum member, union variant, requiredness rule, type, error, or metadata item without corresponding reviewed runtime evidence
- WHEN acceptance gates run
- THEN the change fails before an external artifact can be accepted or published

### Requirement: Derived artifacts cannot become stale

The approved repository-local deterministic JSON semantic manifest, committed generated runtime TypeScript and transport-neutral documentation, committed JSON accepted baseline, compatibility fixture, and any other derived or parity-checked artifact MUST carry deterministically verifiable provenance from the current TypeSpec authority or MUST be reproducibly compared with it. Acceptance and publication gates MUST reject missing, extra, outdated, manually divergent, or non-reproducible derived artifacts. The existing serialized compatibility fixture MUST remain evidence of transport-neutral semantics and MUST NOT select JSON or another serialization as the contract transport.

#### Scenario: Committed artifact is stale

- GIVEN TypeSpec changes and a committed downstream artifact is not refreshed or no longer matches
- WHEN stale-artifact detection runs
- THEN the gate fails before acceptance or publication

#### Scenario: Compatibility fixture is mistaken for transport authority

- GIVEN serialized compatibility evidence exists
- WHEN architecture and documentation checks evaluate it
- THEN it is treated only as semantic evidence
- AND it does not establish a wire format or transport

### Requirement: Stable version baseline and deliberate breaking-change detection

The external operation identifiers, request fields and constraints, requiredness, closed enums and unions, success fields, public metadata, safe failure codes, and allowlisted corrective metadata MUST form a stable versioned compatibility surface. Automated comparison against a deliberately reviewed baseline MUST report additions, removals, renames, field and requiredness changes, enum or union changes, and type narrowing or widening. A breaking change MUST fail acceptance and MUST NOT be silently emitted or published without a separately approved compatibility decision and documented migration intent. The accepted baseline MUST use the approved committed deterministic JSON semantic-manifest format. Semantic-version identifier syntax or ordering, compatibility windows, deprecation policy, and migration duration MUST remain deferred.

#### Scenario: Breaking change is unapproved

- GIVEN the current TypeSpec differs incompatibly from the reviewed baseline
- WHEN breaking-change detection runs without an approved compatibility decision
- THEN the gate fails with the detected breaking differences
- AND no changed artifact is accepted or published

#### Scenario: Internal compatible change preserves external version meaning

- GIVEN an internal implementation changes without changing TypeSpec semantics
- WHEN compatibility comparison runs
- THEN the external baseline remains stable
- AND explicit mappings and projections absorb the internal change

#### Scenario: Version-policy details remain undecided

- GIVEN the compatibility baseline and breaking-change gate
- WHEN their governance is reviewed
- THEN they detect deliberate version differences
- AND they do not claim an unapproved semantic-version syntax, support duration, deprecation window, or migration duration

### Requirement: TypeSpec-aware architecture fitness checks

Repository architecture checks MUST inspect `.tsp` sources, TypeSpec configuration, any approved committed or generated artifacts, trusted mappings, and relevant documentation. They MUST reject transport decorators or emitters selected by this change; authority-bearing business fields; module, authentication, catalog-administration, persistence, deployment, platform, or Convex leakage; mechanical derivation from the module contract; generic execution; automatic publication; bypass of the module public application API; and omission of final module authorization. Each named rule MUST have controlled passing and violating fixtures.

#### Scenario: Independent transport-neutral contract passes

- GIVEN TypeSpec defines only the ten reviewed client-safe workflows and public metadata
- AND it has no transport emitter or prohibited dependency
- WHEN architecture checks run
- THEN the TypeSpec boundary passes

#### Scenario: Prohibited TypeSpec construct fails

- GIVEN a controlled `.tsp`, configuration, or artifact fixture contains a transport binding, authority field, internal dependency, Convex reference, or automatic-publication pattern
- WHEN architecture checks run
- THEN the fixture fails for its intended named rule

#### Scenario: Module addition remains private by architecture

- GIVEN a module public method has no approved TypeSpec operation and no trusted named mapping
- WHEN architecture checks run
- THEN the method remains externally unreachable
- AND the exact ten-operation external set still passes

### Requirement: Transport-neutral consumer documentation

Consumer-facing contract documentation MUST describe the ten business operations, requests, public successes and UI-supporting metadata, safe failures, and compatibility expectations without requiring backend source knowledge or selecting a transport. It MUST NOT define routes, verbs, statuses, headers, wire authentication, serialization, SDK behavior, deployment, or network reachability, and it MUST distinguish consumer business input from trusted server authentication and authorization.

#### Scenario: Consumer documentation stands alone

- GIVEN a consumer has the TypeSpec-derived semantic documentation but no backend implementation access
- WHEN the consumer reviews an approved workflow
- THEN the business request, success, metadata, and failure meanings are understandable
- AND backend module, Convex, persistence, and authentication internals are unnecessary

#### Scenario: Documentation does not imply HTTP

- GIVEN the consumer documentation is scanned for transport commitments
- WHEN its normative content is evaluated
- THEN it contains no route, verb, status, header, HTTP authentication framing, or wire serialization requirement

### Requirement: Scope exclusions and deferred decisions remain explicit

This change MUST NOT choose or implement a transport or protocol; routes, verbs, statuses, headers, authentication framing, serialization, deployment, or reachability; OpenAPI emission or execution, Scalar, Orval, or transport-derived documentation or clients; SDK or client publication, package location, registry, hosting, distribution, or rollout; a productive identity provider, login, credential, token, session, provisioning, role assignment, or machine identity; a UI, interaction design, workflow, state model, or consumer-specific behavior; exposure of internal schemas, `ActorContext`, capabilities, catalog administration, persistence, Convex, generated bindings, or deployment concepts; operations beyond the exact ten; redesign of Resource Master behavior, lifecycle, identity, capability, or final authorization policy; or any modification to `persistent-resource-catalog`.

The approved implementation strategy MUST use the repository-local TypeSpec root at `contracts/external-garfex/resource-master/`, the repository-local transport-neutral semantic emitter, a deterministic JSON semantic manifest, manifest-driven runtime validation data, committed generated runtime TypeScript and transport-neutral documentation, and a committed JSON accepted baseline. These repository artifacts MUST NOT be treated as a transport serialization, SDK/package publication, distribution, or version-policy decision. Semantic-version identifier syntax or ordering, compatibility windows, deprecation policy, and migration duration MUST remain deferred.

#### Scenario: Non-goal technology appears

- GIVEN an artifact created for this change selects HTTP, OpenAPI execution, Scalar, Orval, an SDK publication path, an identity provider, login, UI behavior, or another deferred technology
- WHEN scope acceptance is evaluated
- THEN acceptance fails as an unapproved scope expansion

#### Scenario: Approved repository artifact strategy remains transport-neutral

- GIVEN TypeSpec is authoritative and runtime validation is mandatory
- WHEN the approved repository artifact strategy is reviewed
- THEN runtime schema data and transport-neutral documentation are deterministically materialized from the repository-local semantic manifest
- AND committed JSON evidence and generated artifacts do not select wire serialization, publication, distribution, or semantic-version policy

#### Scenario: Protected catalog change is absent

- GIVEN the repository changes for this capability
- WHEN the changed paths and behavior are reviewed
- THEN `persistent-resource-catalog` is unchanged
- AND Resource Master lifecycle, identity, capability, and authorization policy are not redesigned

## MODIFIED Requirements

### Requirement: Runtime validation on both sides of the boundary

The boundary MUST runtime-validate every untrusted operation identifier and TypeSpec-defined external input before authentication-dependent business mapping or module invocation. It MUST runtime-validate every projected success and normalized error against the TypeSpec-authoritative semantics before release to an external caller. Validation MUST use closed shapes and MUST fail closed. TypeSpec MUST remain upstream of the runtime validation representation. The runtime validator MUST interpret the generated TypeScript schema data deterministically materialized from the repository-local semantic manifest rather than independently declare contract shapes.

(Previously: Runtime validation was mandatory and technology-neutral, but no schema or IDL authority was selected.)

#### Scenario: Malformed external input stops before invocation

- GIVEN an approved operation with a missing, mistyped, out-of-range, or unknown input field
- WHEN request validation runs
- THEN it returns an invalid-request error
- AND Resource Master is not invoked

#### Scenario: Runtime validator drifts from TypeSpec

- GIVEN a runtime validator accepts or rejects values differently from the TypeSpec-defined semantics
- WHEN validator parity or generated-artifact checks run
- THEN the checks fail before the artifact is accepted

#### Scenario: Invalid projected success is contained

- GIVEN an internal success cannot be projected into the reviewed TypeSpec success shape
- WHEN response validation runs
- THEN no malformed success is released
- AND the boundary returns `INTERNAL_FAILURE`

#### Scenario: Invalid projected error is contained

- GIVEN an error projection contains an unknown code or non-allowlisted metadata
- WHEN response validation runs
- THEN no malformed error is released
- AND the boundary emits a valid metadata-free `INTERNAL_FAILURE`

### Requirement: Canonical boundary documentation

Canonical documentation and the repository ADR set MUST distinguish the TypeSpec External Client Contract, the trusted server-side edge, and the Resource Master Module Public Application Contract. They MUST identify TypeSpec as the external semantic authority and GARFEX as external compatibility owner; list exactly the ten approved operations and their one-to-one mappings; describe trusted authentication and fresh actor construction, final deny-by-default module authorization, field-by-field projection, safe failure normalization, Convex encapsulation, compatibility and stale-artifact gates, and the transport non-decision. The relevant external client boundary, external GARFEX boundary, authentication boundary, and architecture records MUST persist and cross-link these decisions. Machine-readable identifiers, TypeSpec, runtime evidence, compatibility fixtures, and canonical documentation MUST remain consistent.

(Previously: Canonical documentation distinguished the external client semantics from the module contract but did not select TypeSpec or require the explicit three-boundary and TypeSpec governance records.)

#### Scenario: Documentation matches executable semantics

- GIVEN the canonical operation and error tables, TypeSpec identifiers, trusted mappings, and compatibility evidence
- WHEN documentation parity is checked
- THEN all operation identifiers, mappings, error codes, allowlisted metadata, and boundary ownership statements agree

#### Scenario: ADRs preserve the accepted architecture

- GIVEN the accepted change
- WHEN the canonical external client, external GARFEX, authentication, and architecture records are reviewed
- THEN they cross-link TypeSpec authority, trusted actor construction, module authorization ownership, Convex encapsulation, compatibility gates, and transport neutrality

#### Scenario: Non-decisions remain open

- GIVEN the canonical documentation
- WHEN its scope and non-goals are reviewed
- THEN it selects no transport or protocol
- AND it selects no OpenAPI, Scalar, Orval, SDK/client packaging, hosting, registry, publication, or distribution approach
- AND it selects no productive identity provider or credential or session mechanism
- AND it assumes no UI or consumer-specific implementation
- AND the approved JSON accepted baseline does not imply a semantic-version identifier scheme, ordering rule, compatibility window, deprecation policy, or migration duration

## Acceptance Criteria

- [ ] TypeSpec compiles transport-neutrally and is the sole external semantic authority rather than the trusted edge or Module Public Application Contract.
- [ ] The three boundaries have distinct enforceable ownership, and external and module contracts are not mechanically equated.
- [ ] Exactly ten TypeSpec operations have exactly ten named one-to-one trusted mappings; any additional module method remains private.
- [ ] Public taxonomy, effective-schema, option, and natural-unit metadata supports future clients without exposing backend internals or implementing a UI.
- [ ] Trusted composition constructs a fresh server-side `ActorContext`; handlers cannot accept client authority or replace composition.
- [ ] Resource Master performs exact final deny-by-default capability authorization before downstream work.
- [ ] Every operation has closed runtime request validation, explicit request mapping, field-by-field success projection, and validated normalized outcomes.
- [ ] The closed eleven-code failure set and only `fieldIssues`, `existingResourceId`, and `currentRevision` metadata are externally possible, and no known failure can become success.
- [ ] Convex, persistence, catalog administration, authentication internals, module types, and generated platform bindings remain encapsulated.
- [ ] No generic executor, registry, arbitrary CRUD surface, repository API, universal API, or automatic publication exists.
- [ ] Drift checks cover TypeSpec, validators, projections, mappings, module-contract relationships, errors, metadata, and reviewed fixtures.
- [ ] Stale derived artifacts and unreviewed breaking changes fail before acceptance or publication.
- [ ] Architecture checks inspect TypeSpec source, configuration, mappings, artifacts, and documentation with passing and violating fixtures.
- [ ] Consumer documentation is transport-neutral and independently understandable without backend knowledge.
- [ ] Canonical docs and ADRs persist and cross-link TypeSpec authority, trusted composition, final module authorization, Convex encapsulation, compatibility controls, and non-decisions.
- [ ] Every listed non-goal and genuinely deferred decision remains outside this change, the approved repository-local artifact strategy remains transport-neutral and unpublished, and `persistent-resource-catalog` remains unchanged.
