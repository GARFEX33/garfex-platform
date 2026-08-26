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
