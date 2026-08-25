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

The boundary MUST runtime-validate every untrusted operation identifier and external input before authentication-dependent business mapping or module invocation. It MUST runtime-validate every projected success and normalized error before release to an external caller. Validation MUST use closed shapes and MUST fail closed. The choice of schema, IDL, validator, or generation technology remains unspecified.

#### Scenario: Malformed external input stops before invocation

- GIVEN an approved operation with a missing, mistyped, out-of-range, or unknown input field
- WHEN request validation runs
- THEN it returns an invalid-request error
- AND Resource Master is not invoked

#### Scenario: Invalid projected success is contained

- GIVEN an internal success cannot be projected into the reviewed external success shape
- WHEN response validation runs
- THEN no malformed success is released
- AND the boundary returns `INTERNAL_FAILURE`

#### Scenario: Invalid projected error is contained

- GIVEN an error projection contains an unknown code or non-allowlisted metadata
- WHEN response validation runs
- THEN no malformed error is released
- AND the boundary emits a valid generic `INTERNAL_FAILURE`

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

Canonical documentation MUST distinguish the External Client Contract from the Resource Master Public Application Contract, identify GARFEX as external compatibility owner, list exactly the ten approved operations and their one-to-one mappings, describe trusted identity construction and final module authorization, define the reviewed success and safe error semantics, state that Convex is infrastructure rather than a business API, and record all explicit technological non-decisions. Machine-readable identifiers and compatibility fixtures MUST remain consistent with this canonical documentation.

#### Scenario: Documentation matches executable semantics

- GIVEN the canonical operation and error tables and the external contract identifiers
- WHEN documentation parity is checked
- THEN all operation identifiers, mappings, error codes, and allowlisted metadata agree

#### Scenario: Non-decisions remain open

- GIVEN the canonical documentation
- WHEN its scope and non-goals are reviewed
- THEN it selects no transport or protocol
- AND it selects no schema, IDL, runtime-validation, or generation technology
- AND it selects no SDK, artifact packaging, hosting, registry, or distribution approach
- AND it selects no productive identity provider or credential/session mechanism
- AND it assumes no consumer implementation or behavior

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
