# External GARFEX Boundary Specification

## Purpose

Define GARFEX-owned, transport-neutral external semantics for exactly ten Resource Master workflows while keeping authentication authority, module internals, infrastructure, and compatibility decisions under trusted server control.

## Requirements

### Requirement: Closed external operation set

The external boundary MUST recognize exactly these operation identifiers: `getTaxonomy`, `getEffectiveResourceSchema`, `getValidOptions`, `getNaturalUnits`, `getResource`, `searchResources`, `describeResource`, `createResource`, `updateNonIdentityData`, and `deactivateResource`. It MUST NOT publish a newly added Resource Master operation without a separately reviewed compatibility change. Unknown, unsupported, or unmapped operation identifiers MUST fail closed and MUST NOT invoke Resource Master, catalog, repository, persistence, or Convex work.

#### Scenario: All approved operations are recognized

- GIVEN the canonical external operation set
- WHEN its identifiers are enumerated
- THEN it contains each of the ten approved identifiers exactly once
- AND it contains no other identifier

#### Scenario: Unknown operation fails closed

- GIVEN an authenticated request naming an operation outside the approved set
- WHEN the boundary evaluates the request
- THEN it returns a normalized invalid-request failure
- AND it performs no Resource Master or downstream data access

#### Scenario: New internal operation remains private

- GIVEN Resource Master gains an additional public application operation
- WHEN external operation parity is checked without an approved external contract change
- THEN the additional operation is not externally callable
- AND the ten-operation external set remains unchanged

### Requirement: Independently owned external DTOs

External request, success, and error DTOs MUST be defined independently of Resource Master domain and application types. Business DTOs MUST NOT contain or accept `ActorContext`, `actorId`, actors, roles, capabilities, claims, tokens, credentials, sessions, authentication authority, provider data, or equivalent authority-bearing values. They MUST NOT contain backend framework values, Convex or generated values, database identifiers, persistence records, repository values, deployment configuration, catalog administration values, or other infrastructure authority. Authentication metadata MAY exist outside business DTOs at a future transport edge, but MUST NOT become business input.

#### Scenario: Ordinary business input is accepted

- GIVEN a request containing exactly the reviewed business fields for an approved operation
- WHEN external input validation runs
- THEN the request is eligible for trusted identity resolution and operation mapping

#### Scenario: Forged authority is rejected

- GIVEN a request that adds an actor identifier, role, capability, claim, token, session, or equivalent authority-like business field
- WHEN external input validation runs
- THEN validation rejects the request as invalid
- AND the supplied value cannot influence identity, authorization, or downstream work

#### Scenario: Infrastructure value is excluded

- GIVEN an external contract source or artifact containing a Convex identifier, generated binding, persistence document, repository type, deployment value, or catalog administration value
- WHEN architecture checks run
- THEN the checks fail

### Requirement: Trusted identity resolution and actor construction

Before any approved operation is mapped, a trusted GARFEX server boundary MUST resolve the caller identity through server-controlled authentication and MUST construct the complete Resource Master actor server-side. The actor MUST be supplied separately from the validated business input. No business DTO field MAY supplement, replace, or modify the resolved identity or authority.

#### Scenario: Authenticated caller receives a server-created actor

- GIVEN valid authentication evidence available to the trusted server boundary
- AND a valid external business request
- WHEN the boundary prepares the Resource Master invocation
- THEN it resolves identity using trusted server data
- AND it constructs the actor without reading authority from the business DTO
- AND it passes the actor separately from the mapped business input

#### Scenario: Forged authority cannot change the actor

- GIVEN trusted authentication resolves one server-side actor
- AND untrusted input attempts to assert a different actor or authority
- WHEN the request is processed
- THEN the authority-like input is rejected
- AND no actor other than the trusted server-created actor can reach Resource Master

### Requirement: Unauthenticated requests short-circuit

A trusted authentication failure or missing authenticated identity MUST produce the normalized `UNAUTHENTICATED` error and MUST stop before actor construction, Resource Master invocation, authorization evaluation, catalog access, repository access, persistence access, or Convex work. The failure MUST NOT disclose provider, credential, token, session, or configuration diagnostics.

#### Scenario: Missing identity stops all business work

- GIVEN a valid business payload without a trusted authenticated identity
- WHEN the boundary processes the request
- THEN it returns `UNAUTHENTICATED`
- AND Resource Master and all downstream data dependencies remain uncalled
- AND the error contains no authentication-provider diagnostics

#### Scenario: Authentication provider failure is sanitized

- GIVEN trusted authentication fails with provider-specific diagnostic information
- WHEN the failure is normalized
- THEN the external result is `UNAUTHENTICATED`
- AND provider messages, credential details, stacks, and configuration values remain server-only

### Requirement: Explicit one-to-one application mapping

Each approved external operation MUST have one named, explicit request mapper and MUST invoke only the corresponding real Resource Master public application operation shown below. The boundary MUST NOT bypass that application contract through domain services, catalogs, repositories, persistence, generated bindings, or Convex calls. It MUST NOT introduce generic execution, arbitrary CRUD, operation forwarding, table access, repository exposure, or automatic publication.

| External operation | Resource Master public application operation | Required module capability |
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

#### Scenario: Read mappings target only their matching operations

- GIVEN a valid authenticated request for any approved read operation
- WHEN its explicit mapper runs
- THEN it invokes exactly the identically named Resource Master public application operation once
- AND it invokes no other module or infrastructure entry point directly

#### Scenario: Mutation mappings target only their matching operations

- GIVEN a valid authenticated request for `createResource`, `updateNonIdentityData`, or `deactivateResource`
- WHEN its explicit mapper runs
- THEN it invokes exactly the corresponding Resource Master public application operation once
- AND it invokes no other module or infrastructure entry point directly

#### Scenario: Generic business execution is absent

- GIVEN the external boundary and its published artifacts
- WHEN architecture checks inspect their callable surface
- THEN no generic operation executor, arbitrary CRUD API, repository API, table API, operation registry, or universal business API is present

### Requirement: Reviewed request semantics

The boundary MUST accept only the following client-controlled business meanings for each operation and MUST reject unknown fields. Codes and identifiers are external business strings; revisions and limits are bounded integers; attribute values are closed to the reviewed Resource Master business value forms. Omitted optional search lifecycle means the current Resource Master default; omitted optional limit means the current bounded default; omitted or null cursor means the first page. No request meaning MAY carry authority or infrastructure data.

| Operation | Accepted business input |
| --- | --- |
| `getTaxonomy` | no business fields |
| `getEffectiveResourceSchema` | `classCode`, `familyCode`, `typeCode` |
| `getValidOptions` | `attributeCode` |
| `getNaturalUnits` | `familyCode` |
| `getResource` | `resourceId` |
| `searchResources` | `terms`; optional `lifecycle` in `ACTIVE`, `INACTIVE`, `ALL`; optional bounded `limit`; optional opaque `cursor` or null |
| `describeResource` | `resourceId` |
| `createResource` | `classCode`, `familyCode`, `typeCode`, `naturalUnitCode`, and business `attributes` |
| `updateNonIdentityData` | `resourceId`, `expectedRevision`, `naturalUnitCode` |
| `deactivateResource` | `resourceId`, `expectedRevision` |

#### Scenario: Each approved input maps field by field

- GIVEN a valid request for any approved operation
- WHEN its request mapper runs
- THEN only the fields listed for that operation are supplied as Resource Master business input
- AND no unlisted field is passed through

#### Scenario: Malformed pagination is rejected

- GIVEN a search request with an invalid lifecycle value, non-bounded limit, or malformed cursor value
- WHEN external input validation runs
- THEN it returns an invalid-request error
- AND search is not invoked

### Requirement: Reviewed success semantics

A successful external result MUST project only the reviewed business fields below, field by field, into a newly owned external value. These fields preserve the current public Resource Master operation outcomes but do not publish internal object identity or types. No additional source field MAY appear automatically.

| Operation | Reviewed success fields |
| --- | --- |
| `getTaxonomy` | taxonomy entries: `code`, `name`; families: `code`, `name`; types: `code`, `name` |
| `getEffectiveResourceSchema` | `attributes`; each attribute: `code`, `name`, `kind`, `meaning`, `defaultResult` (`mode`, `identity`), and `rules` with `when` (`attributeCode`, `optionCode`) and `result` (`mode`, `identity`) |
| `getValidOptions` | option entries: `code`, `label` |
| `getNaturalUnits` | `allowed` unit entries (`code`, `name`) and `suggested` unit (`code`, `name`) |
| `getResource` | resource: `resourceId`, `classCode`, `familyCode`, `typeCode`, `naturalUnitCode`, projected `attributes`, `canonicalIdentity`, `identityPolicyVersion`, `active`, `revision` |
| `searchResources` | `items` and opaque nullable `cursor`; each item: `resourceId`, class/family/type codes and names, `naturalUnitCode`, `description`, `optionCodes`, `optionLabels`, `values` |
| `describeResource` | `resourceId`, `description` |
| `createResource` | the same reviewed resource fields as `getResource` |
| `updateNonIdentityData` | the same reviewed resource fields as `getResource` |
| `deactivateResource` | the same reviewed resource fields as `getResource` |

Projected resource attributes MUST contain only `attributeCode`, the business `value`, `displayValue`, and `identityParticipating`. A business `value` MUST be a string, boolean, or quantity containing only `magnitude` and `unitCode`.

#### Scenario: Resource success is projected explicitly

- GIVEN Resource Master returns a successful resource containing reviewed fields and extra internal fields
- WHEN the result is projected for `getResource`, `createResource`, `updateNonIdentityData`, or `deactivateResource`
- THEN the external value contains every reviewed resource and attribute field
- AND it contains none of the extra internal fields
- AND it is not the internal object by reference

#### Scenario: Discovery success preserves reviewed business outcomes

- GIVEN Resource Master successfully returns taxonomy, schema, options, natural units, search, or description data
- WHEN the corresponding success projector runs
- THEN all fields listed for that operation are preserved with their business meaning
- AND no authority or infrastructure field is added

### Requirement: Opaque bounded pagination

Search pagination MUST preserve bounded page-size behavior and continuation semantics. The external cursor MUST be nullable and opaque: clients MAY return it unchanged to request the next page but MUST NOT be required or enabled to interpret, construct, modify, or derive infrastructure meaning from it. The boundary MUST validate a received cursor and MUST project a continuation cursor without exposing database, Convex, persistence, or provider details.

#### Scenario: Client continues a search

- GIVEN a successful search page with a non-null opaque cursor
- WHEN the client submits that cursor unchanged with the same search semantics
- THEN the boundary requests the next bounded page
- AND the cursor reveals no defined internal structure

#### Scenario: Search reaches its final page

- GIVEN Resource Master returns a search page with no continuation
- WHEN the result is projected
- THEN the external cursor is null

#### Scenario: Cursor tampering fails safely

- GIVEN a cursor that fails external validation
- WHEN a search request is evaluated
- THEN it returns an invalid-request error
- AND no persistence or cursor-decoding diagnostic is disclosed

### Requirement: Module-owned deny-by-default authorization remains final

For every mapped invocation, Resource Master MUST retain and execute its existing exact capability check before catalog or repository work. Edge authentication MUST NOT be treated as sufficient authorization, and the external boundary MUST NOT duplicate, weaken, replace, or broaden module authorization. A missing, unknown, or mismatched module capability mapping MUST deny access.

#### Scenario: Read requires module read capability

- GIVEN an authenticated server-created actor without `resource:read`
- WHEN any approved read operation reaches Resource Master
- THEN Resource Master returns `FORBIDDEN`
- AND no catalog or repository access occurs

#### Scenario: Each mutation requires its exact capability

- GIVEN an authenticated server-created actor missing the exact capability for an approved mutation
- WHEN that mutation reaches Resource Master
- THEN Resource Master returns `FORBIDDEN`
- AND no catalog or repository access occurs

#### Scenario: Unknown authorization mapping denies

- GIVEN an operation has no exact Resource Master authorization mapping
- WHEN authorization is evaluated
- THEN access is denied by default
- AND no business work occurs

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

### Requirement: Deterministic transport-neutral outcomes

Every completed boundary invocation MUST yield exactly one transport-neutral normalized outcome: a success containing the operation-specific reviewed value, or a failure containing a stable machine code and only code-allowlisted corrective metadata. Outcome meaning MUST NOT depend on protocol framing, status codes, serialization format, SDK behavior, or thrown exception classes. The specification does not select any transport.

#### Scenario: Equivalent successes normalize identically

- GIVEN equivalent Resource Master successes for the same operation
- WHEN they are projected through different future transport adapters
- THEN their normalized external business outcome is the same

#### Scenario: Equivalent failures normalize identically

- GIVEN equivalent internal failure semantics
- WHEN they are projected through different future transport adapters
- THEN their machine code and allowlisted metadata are the same

### Requirement: Closed safe error model

The external failure model MUST use only the following stable machine codes and mappings. Internal messages are not compatibility surface and MUST NOT be passed through.

| External machine code | Source semantics | Allowlisted corrective metadata |
| --- | --- | --- |
| `UNAUTHENTICATED` | missing identity, trusted authentication failure, internal `UNAUTHENTICATED` | none |
| `FORBIDDEN` | internal `FORBIDDEN` | none |
| `INVALID_ARGUMENT` | malformed request or internal `INVALID_ARGUMENT` | reviewed field issues only |
| `INVALID_REFERENCE` | internal `INVALID_REFERENCE` | reviewed field issues only |
| `VALIDATION_FAILED` | internal `VALIDATION` | reviewed field issues only |
| `NOT_FOUND` | internal `NOT_FOUND` | none |
| `DUPLICATE` | internal `DUPLICATE` | `existingResourceId` only when present and externally valid |
| `CONFLICT` | internal `CONFLICT` | `currentRevision` only when present and externally valid |
| `INVALID_LIFECYCLE` | internal `INVALID_LIFECYCLE` | none |
| `CATALOG_UNAVAILABLE` | internal `RESOURCE_CATALOG_UNAVAILABLE` or `RESOURCE_CATALOG_UNINITIALIZED` | none |
| `INTERNAL_FAILURE` | internal `INTEGRITY`, `INTERNAL`, `RESOURCE_CATALOG_INVALID`, unknown errors, thrown exceptions, or invalid output projection | none |

A reviewed field issue MUST contain only a stable external field path and stable corrective reason code; it MUST NOT contain rejected secret values, internal type names, catalog paths, persistence details, or arbitrary internal messages. `existingResourceId` supports deterministic duplicate recovery and `currentRevision` supports deterministic conflict recovery; no other corrective metadata is allowed. Unknown codes and exceptions MUST map to `INTERNAL_FAILURE`.

#### Scenario: Validation and invalid-reference failures are corrective but safe

- GIVEN Resource Master returns `VALIDATION`, `INVALID_REFERENCE`, or `INVALID_ARGUMENT` with internal diagnostics
- WHEN the error is normalized
- THEN it returns `VALIDATION_FAILED`, `INVALID_REFERENCE`, or `INVALID_ARGUMENT` respectively
- AND it includes only reviewed field issue paths and reason codes
- AND internal messages and rejected sensitive values are absent

#### Scenario: Not-found and lifecycle failures disclose no state diagnostics

- GIVEN Resource Master returns `NOT_FOUND` or `INVALID_LIFECYCLE`
- WHEN the error is normalized
- THEN it returns the corresponding stable external code
- AND it includes no protected-resource, lifecycle-state, catalog, or persistence metadata

#### Scenario: Duplicate supports deterministic recovery

- GIVEN Resource Master returns `DUPLICATE` with a valid existing resource identifier
- WHEN the error is normalized
- THEN it returns `DUPLICATE` with only `existingResourceId`
- AND any other internal detail is absent

#### Scenario: Conflict supports deterministic retry

- GIVEN Resource Master returns `CONFLICT` with a valid current revision
- WHEN the error is normalized
- THEN it returns `CONFLICT` with only `currentRevision`
- AND any other internal detail is absent

#### Scenario: Forbidden result reveals no authority policy

- GIVEN Resource Master returns `FORBIDDEN`
- WHEN the error is normalized
- THEN it returns `FORBIDDEN`
- AND it reveals no required capability, role, actor, or protected-resource detail

#### Scenario: Catalog state is coarsened

- GIVEN Resource Master reports an unavailable or uninitialized catalog
- WHEN the error is normalized
- THEN it returns `CATALOG_UNAVAILABLE`
- AND it does not distinguish deployment, initialization, provider, or catalog configuration state

#### Scenario: Integrity and unsafe catalog failures are internal

- GIVEN Resource Master reports `INTEGRITY` or `RESOURCE_CATALOG_INVALID`
- WHEN the error is normalized
- THEN it returns `INTERNAL_FAILURE`
- AND all integrity, catalog, persistence, and configuration diagnostics remain server-only

#### Scenario: Unknown or thrown failure is safe

- GIVEN the mapping layer receives an unknown code or catches an unexpected exception
- WHEN it creates the external outcome
- THEN it returns `INTERNAL_FAILURE`
- AND no exception message, stack, provider data, persistence data, Convex data, or configuration value is released

### Requirement: No internal or Convex leakage

External contract sources, runtime values, generated artifacts if any are later approved, fixtures, and canonical documentation MUST NOT import, re-export, reference as contract types, structurally pass through, or mechanically derive from Resource Master internal/public TypeScript types, backend auth types, domain types, application types, infrastructure types, Convex SDK or generated types, persistence records, or deployment/catalog administration contracts. Shared business meaning MUST be represented by independently owned external definitions and explicit projections.

#### Scenario: Internal import is rejected

- GIVEN an external contract source imports or re-exports `resource-master/public.ts` or another backend internal type
- WHEN architecture checks run
- THEN the checks fail

#### Scenario: Convex derivation is rejected

- GIVEN an external contract or artifact is derived from Convex validators, generated bindings, document identifiers, or persistence shapes
- WHEN architecture checks run
- THEN the checks fail

#### Scenario: Extra internal response field cannot drift outward

- GIVEN an internal Resource Master response gains a new field
- WHEN existing external projection and fixtures run unchanged
- THEN the new field is absent externally
- AND compatibility checks detect any attempted unreviewed publication

### Requirement: Compatibility and drift detection

GARFEX MUST own compatibility for operation identifiers, request meanings, projected success fields, external error codes, and allowlisted metadata. Automated checks MUST cover all ten operation mappings, closed input shapes, output projections, normalized failures, unknown operations, forged authority, authorization preservation, and architecture rules. Representative success and applicable failure fixtures MUST exist for every operation. Changes to externally observable semantics MUST require explicit review and documented migration intent; internal changes MUST NOT alter the external surface silently.

#### Scenario: Mapping parity detects omission or redirection

- GIVEN an approved operation is missing, duplicated, or mapped to the wrong Resource Master operation
- WHEN parity and mapper checks run
- THEN the checks fail

#### Scenario: Fixture detects compatibility drift

- GIVEN an operation adds, removes, renames, or changes an external field, error code, or allowlisted metadata item
- WHEN representative compatibility fixtures run
- THEN the unreviewed change fails

#### Scenario: Every operation has success and failure evidence

- GIVEN the compatibility suite
- WHEN its operation coverage is enumerated
- THEN every approved operation has at least one representative success fixture
- AND every applicable normalized failure meaning has representative coverage

### Requirement: Architecture fitness enforcement

Repository architecture checks MUST reject client-facing dependency on backend internals or trusted auth concepts, authority-bearing DTO fields, Convex/generated/platform leakage, persistence or deployment leakage, generic business executors, arbitrary CRUD or repository publication, and mechanical external derivation from the module contract. The checks MUST include controlled valid and violating fixtures so the rule itself is testable.

#### Scenario: Safe independent contract passes

- GIVEN an independently defined external contract with only reviewed business DTOs
- WHEN architecture checks run
- THEN the contract passes the external-boundary rules

#### Scenario: Each prohibited pattern has a failing fixture

- GIVEN controlled fixtures for internal imports, authority fields, Convex/generated types, persistence values, generic forwarding, and automatic publication
- WHEN architecture checks run against each fixture
- THEN each fixture fails for its intended named rule

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
## Acceptance Criteria

- [ ] The external contract recognizes exactly the ten approved operation identifiers and fails closed for every unknown or unmapped identifier.
- [ ] Closed request DTOs contain only reviewed business input and reject authority-bearing, internal, persistence, deployment, catalog-administration, and Convex fields.
- [ ] Trusted server authentication constructs the actor separately, while unauthenticated requests stop before all Resource Master and downstream work.
- [ ] Each operation explicitly maps to only its corresponding real Resource Master public application operation.
- [ ] Existing exact deny-by-default Resource Master authorization remains the final capability enforcement before data access.
- [ ] Every external input and every projected success or failure receives closed runtime validation.
- [ ] Success values preserve the listed public business outcomes through field-by-field projection, including bounded opaque pagination.
- [ ] Stable machine error codes and only allowlisted corrective metadata cover unauthenticated, forbidden, invalid argument, invalid reference, validation, not found, duplicate, conflict, lifecycle, catalog-state, integrity, and unexpected failures.
- [ ] Internal messages, stacks, provider, authentication, persistence, Convex, catalog-configuration, and deployment details cannot leak.
- [ ] Compatibility fixtures, operation parity, mapper tests, projection tests, sanitization tests, forgery tests, and architecture fixtures detect unreviewed drift.
- [ ] No generic business API, automatic module publication, arbitrary CRUD, repository API, or Convex business API exists.
- [ ] Canonical documentation identifies GARFEX ownership, distinguishes both contracts, agrees with executable identifiers, and preserves every explicit technological non-decision.
