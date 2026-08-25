# Design: transport-neutral external GARFEX boundary

## Decision summary

GARFEX will add an independently owned TypeScript contract under `apps/backend/src/external-garfex-boundary/` and ten named trusted-edge invocation functions. The client-facing contract has no dependency on Resource Master, authentication, Convex, generated code, persistence, or deployment types. Only the trusted composition code imports `apps/backend/src/resource-master/public.ts`, and each named invocation directly calls the matching `ResourceMaster` method.

There will be no transport adapter, public network route, generic `execute`/`dispatch` business function, operation-handler registry, SDK, generated artifact, or Convex entrypoint in this change.

```text
unknown transport input
  -> parseExternalOperationIdentifier (recognition only; no execution)
  -> one named invocation selected explicitly by a future transport
  -> operation-specific closed request validation
  -> TrustedActorResolver.resolveActor() at the trusted server edge
  -> freshly constructed ActorContext
  -> direct matching ResourceMaster public method
  -> field-by-field success projection OR safe error normalization
  -> closed external outcome validation
  -> transport-neutral ExternalOutcome<K>
```

The design is intentionally located in `apps/backend`, not `packages/coding-agent`: the gated scope is the Resource Master backend boundary, and no coding-agent concern participates in this dependency path.

## Repository evidence and constraints

The existing application contract is `apps/backend/src/resource-master/public.ts`. It exposes ten actor-first operations, `ActorContext`, internal application DTOs, and `Result<T>`. The application implementation authorizes every operation before catalog or repository work through `application/authorization.ts`. Existing authentication composition resolves a provider-neutral `ActorId` and constructs capabilities at the server edge. Convex currently composes the application through `src/resource-master/infrastructure/convex-resource-master.ts` and `convex/resourceMaster.ts`; those files are not an external contract source and will not be used by this boundary.

The repository uses NodeNext, `strict`, `exactOptionalPropertyTypes`, and `noUncheckedIndexedAccess`. New relative imports therefore use `.js`, optional properties are added conditionally, and indexed values are narrowed before use.

CodeGraph was unavailable to this executor and no `.codegraph/` index was present. The design therefore used targeted reads of the proposal, specification, Resource Master contract/application/authorization, authentication composition, Convex adapter, tests, architecture checker, and canonical documentation.

## Source layout and responsibilities

```text
apps/backend/src/external-garfex-boundary/
├── client-facing/
│   ├── contract.ts                 # independent DTOs, operation/error identifiers, outcome map
│   └── validation.ts               # closed runtime validators and stable request field issues
└── trusted/
    ├── identity.ts                 # trusted actor resolver interface and existing-auth adapter
    ├── errors.ts                   # internal error/exception normalization and diagnostics port
    ├── projections.ts              # fresh field-by-field success projections
    ├── read-operations.ts          # seven named read invocation functions
    └── mutation-operations.ts      # three named mutation invocation functions
```

No barrel will re-export both client-facing and trusted code. In particular, `client-facing/` will not expose trusted operation functions. A future distribution artifact may consume the independent contract only after a separate packaging/versioning decision.

### `client-facing/contract.ts`

This file owns external meaning and has zero imports from backend modules or third-party packages. It defines:

- `externalOperationIdentifiers` as the exact ten-item tuple and `ExternalOperation` as its inferred union;
- independent request interfaces for all ten operations;
- `ExternalAttributeValue = string | boolean | { magnitude: string; unitCode: string }`;
- independent taxonomy, schema, option, unit, resource, search, and description success DTOs;
- `ExternalRequests` and `ExternalSuccesses` keyed by the closed external operation union;
- `externalErrorCodes` as the exact eleven-item tuple;
- a closed discriminated external error union and `ExternalOutcome<K>`.

The request shapes are:

| Operation | External request |
| --- | --- |
| `getTaxonomy` | `{}` with no accepted own keys |
| `getEffectiveResourceSchema` | `classCode`, `familyCode`, `typeCode` |
| `getValidOptions` | `attributeCode` |
| `getNaturalUnits` | `familyCode` |
| `getResource` | `resourceId` |
| `searchResources` | `terms`; optional `lifecycle`; optional `limit`; optional nullable `cursor` |
| `describeResource` | `resourceId` |
| `createResource` | taxonomy codes, `naturalUnitCode`, and `attributes: Record<string, ExternalAttributeValue>` |
| `updateNonIdentityData` | `resourceId`, non-negative safe `expectedRevision`, `naturalUnitCode` |
| `deactivateResource` | `resourceId`, non-negative safe `expectedRevision` |

The external failure has no arbitrary message field. Its code is the compatibility meaning. Metadata is represented as a discriminated union so illegal combinations cannot compile:

- `INVALID_ARGUMENT`, `INVALID_REFERENCE`, and `VALIDATION_FAILED` may contain only optional `fieldIssues`;
- `DUPLICATE` may contain only optional `existingResourceId`;
- `CONFLICT` may contain only optional `currentRevision`;
- every other code carries no metadata.

A field issue contains only `path` and one reason from `REQUIRED`, `TYPE`, `UNKNOWN_FIELD`, `OUT_OF_RANGE`, or `INVALID_VALUE`. Paths are external field names (including `attributes.<code>`), never internal type/catalog/repository paths. Rejected values and messages are never included.

### `client-facing/validation.ts`

This file exports eleven recognition/validation entrypoints, not a business executor:

- `parseExternalOperationIdentifier(value: unknown)`;
- one named request validator per operation;
- one named success validator per operation;
- `validateExternalFailure(value: unknown)`.

Implementation uses small boundary-owned TypeScript structural predicates. This chooses no schema/IDL library, generation direction, client generator, or distributable representation; those decisions remain open. The named functions are the replaceable semantic seam if a later approved validator technology is introduced.

All object validators require plain non-null objects and compare own keys against operation-specific allowlists. They reject symbols, arrays, unknown properties, and authority/infrastructure-looking properties. Dynamic `attributes` keys remain business attribute codes, but reserved names such as `actorId`, `actor`, `role`, `roles`, `capability`, `capabilities`, `claims`, `token`, `credentials`, `session`, provider/Convex identifiers, repository/persistence/document/deployment/catalog-administration names are rejected before authentication or module work. Attribute values are recursively rebuilt and restricted to the three reviewed forms.

`limit` is a safe integer from 1 through 50, matching the current bounded Resource Master semantics. `expectedRevision` is a non-negative safe integer. Codes, IDs, terms, unit codes, cursor strings, quantity components, and display values must be strings; required request strings must be non-empty. A supplied cursor must be a non-empty string without control characters. The external validator does not decode or document it; Resource Master remains responsible for semantic cursor consistency, and any rejection is normalized without diagnostics. Omitted optional search fields remain omitted so Resource Master supplies its current defaults; null cursor is preserved.

Validators return either a newly built value or a valid `INVALID_ARGUMENT` external failure. They never throw for untrusted input. Request error fixtures freeze the stable field paths and reason codes.

Every projector output and normalized error is validated before release. If success validation fails, the boundary records a server-only diagnostic and returns a preconstructed valid `INTERNAL_FAILURE`. If error validation fails, it does the same without recursively trusting the invalid error.

### `trusted/identity.ts`

The trusted identity input interface is deliberately internal:

```ts
interface TrustedActorResolver {
  resolveActor(): Promise<ActorContext | null>;
}
```

This file is one of the trusted composition-edge files permitted to import `ActorContext` from `resource-master/public.ts`. It also provides `createTrustedActorResolver(composition: AuthenticationComposition | null)`. That adapter:

1. accepts only server-created authentication composition, never business DTO data;
2. calls the configured `IdentityAdapter.resolveActorId()`;
3. catches provider failures and returns `null`;
4. constructs a fresh `{ actorId, capabilities: new Set(composition.capabilities) }` after successful resolution;
5. never reads the validated request while constructing authority.

The copied set prevents later mutation of composition authority during an invocation. A null composition, missing identity, or provider exception yields `null`; callers normalize it to `UNAUTHENTICATED` before Resource Master is created or invoked. Productive identity provider, credentials, sessions, claims, role provisioning, and machine identity remain open.

The existing `invokeAuthenticatedResourceMasterOperation` remains compatible. It may be refactored to delegate to this resolver only if needed to avoid duplicating actor construction, but its public behavior and existing tests must remain unchanged.

### `trusted/errors.ts`

This file imports only the external contract and Resource Master's public `ResourceError` type. It defines:

```ts
interface ExternalBoundaryDiagnostics {
  record(event: {
    operation: ExternalOperation;
    phase: "authentication" | "invocation" | "projection" | "response-validation";
    cause: unknown;
  }): void;
}
```

Diagnostics are server-only and are never part of an outcome. A default no-op implementation avoids selecting logging/telemetry technology.

`normalizeResourceError(error)` uses an exhaustive switch over the current public `ResourceErrorCode` values:

| Internal | External |
| --- | --- |
| `UNAUTHENTICATED` | `UNAUTHENTICATED` |
| `FORBIDDEN` | `FORBIDDEN` |
| `INVALID_ARGUMENT` | `INVALID_ARGUMENT` |
| `INVALID_REFERENCE` | `INVALID_REFERENCE` |
| `VALIDATION` | `VALIDATION_FAILED` |
| `NOT_FOUND` | `NOT_FOUND` |
| `DUPLICATE` | `DUPLICATE`, with `existingResourceId` only when it passes external ID validation |
| `CONFLICT` | `CONFLICT`, with `currentRevision` only when it is a non-negative safe integer |
| `INVALID_LIFECYCLE` | `INVALID_LIFECYCLE` |
| `RESOURCE_CATALOG_UNAVAILABLE`, `RESOURCE_CATALOG_UNINITIALIZED` | `CATALOG_UNAVAILABLE` |
| `INTEGRITY`, `INTERNAL`, `RESOURCE_CATALOG_INVALID` | `INTERNAL_FAILURE` |

Internal `message` and `details` are never copied or parsed. Because current internal field details are free-form strings, they are not safe external field issues. Unknown runtime codes, malformed errors, thrown invocation/projection exceptions, and invalid outcomes become metadata-free `INTERNAL_FAILURE`. Authentication exceptions become metadata-free `UNAUTHENTICATED`. Diagnostic recording itself is wrapped so a failing logger cannot alter or leak the outcome.

### `trusted/projections.ts`

This file contains one named projector per success family, with operation-specific wrappers where fields happen to coincide. Every returned object and nested array/object is newly allocated. It does not use object spread from internal results and never returns source references.

- taxonomy rebuilds class entries, families, and types;
- effective schema rebuilds attributes, default results, conditions, and rule results;
- options and units rebuild named entries;
- resource projection rebuilds every reviewed resource field and each reviewed attribute/value field;
- search rebuilds summaries and maps undefined/no continuation to `cursor: null`;
- description rebuilds only `resourceId` and `description`.

`createResource`, `updateNonIdentityData`, and `deactivateResource` call their own named wrappers around the shared private resource-field copier. This keeps operation evidence explicit while avoiding four divergent copies. Compile-time source typing catches known internal signature drift; runtime output validation contains malformed runtime values. Extra internal fields are ignored by construction.

### Named trusted operation files

The only callable business entrypoints introduced are:

- `invokeExternalGetTaxonomy`
- `invokeExternalGetEffectiveResourceSchema`
- `invokeExternalGetValidOptions`
- `invokeExternalGetNaturalUnits`
- `invokeExternalGetResource`
- `invokeExternalSearchResources`
- `invokeExternalDescribeResource`
- `invokeExternalCreateResource`
- `invokeExternalUpdateNonIdentityData`
- `invokeExternalDeactivateResource`

Each function receives `{ actorResolver, resourceMaster, diagnostics }` plus `rawRequest: unknown`. It performs this fixed sequence:

1. run its own named closed validator;
2. return `INVALID_ARGUMENT` immediately on failure;
3. resolve the actor separately through `TrustedActorResolver`;
4. return `UNAUTHENTICATED` if resolution fails;
5. create a fresh internal input object field by field (or no input for taxonomy);
6. directly call the identically named `ResourceMaster` method once with the actor first;
7. normalize an application failure or explicitly project an application success;
8. validate the complete external outcome before returning it;
9. catch all unexpected exceptions and return validated `INTERNAL_FAILURE`.

A private `withTrustedActor` helper may centralize only authentication short-circuiting and exception containment. It must not accept an operation identifier or select a business method. There is no exported function accepting `(operation, payload)`, no callable map, and no automatic loop over Resource Master methods. A future transport must use an exhaustive switch and call one of the ten named functions explicitly; transport selection is outside this change.

## Exact request mapping

Each mapper creates these internal arguments without structural pass-through:

| External operation | Direct application call |
| --- | --- |
| `getTaxonomy` | `resourceMaster.getTaxonomy(actor)` |
| `getEffectiveResourceSchema` | `resourceMaster.getEffectiveResourceSchema(actor, { classCode, familyCode, typeCode })` |
| `getValidOptions` | `resourceMaster.getValidOptions(actor, { attributeCode })` |
| `getNaturalUnits` | `resourceMaster.getNaturalUnits(actor, { familyCode })` |
| `getResource` | `resourceMaster.getResource(actor, { resourceId })` |
| `searchResources` | `resourceMaster.searchResources(actor, { terms, ...(lifecycle supplied), ...(limit supplied), ...(cursor supplied) })` |
| `describeResource` | `resourceMaster.describeResource(actor, { resourceId })` |
| `createResource` | `resourceMaster.createResource(actor, { classCode, familyCode, typeCode, naturalUnitCode, attributes: rebuiltAttributes })` |
| `updateNonIdentityData` | `resourceMaster.updateNonIdentityData(actor, { resourceId, expectedRevision, naturalUnitCode })` |
| `deactivateResource` | `resourceMaster.deactivateResource(actor, { resourceId, expectedRevision })` |

Resource Master remains the only final authorization authority. The external edge performs authentication but no capability pre-check and contains no copy of `resourceMasterOperationCapabilities`. Existing application tests continue proving exact deny-by-default checks occur before catalog/repository access. New integration tests pass minimally capable and incapable actors through the external edge and assert the application—not the edge—returns sanitized `FORBIDDEN` with downstream dependencies untouched.

## Dependency direction

```text
client-facing/contract.ts <- client-facing/validation.ts
          ^                         ^
          |                         |
trusted projections/errors/operations
          |
          +--> resource-master/public.ts  (trusted edge only)
          +--> auth/composition.ts         (identity adapter only)

resource-master/public.ts <- resource-master/application <- ports <- infrastructure/Convex
```

Forbidden directions:

- client-facing code to any Resource Master/auth/backend/Convex source;
- trusted boundary code to Resource Master domain, application implementation, ports, infrastructure, deployment, Convex, or generated bindings;
- Resource Master core back to the external boundary;
- any Convex entrypoint to the external boundary in this change;
- any consumer/client source into the trusted directory.

## Compatibility, parity, and drift defenses

### Canonical executable identifiers

`externalOperationIdentifiers` and `externalErrorCodes` are the only executable identifier lists. The contract tests assert exact order, uniqueness, and membership. New Resource Master methods do not participate automatically.

A compile-time assertion in trusted operation code constrains each direct method name to the corresponding member of `ResourceMaster`, but deliberately does not compare the external set with every `keyof ResourceMaster`; this allows new internal operations to remain private. Runtime spy tests prove each named wrapper calls only its same-named method once.

### Serialized compatibility fixture

Add one reviewable JSON file:

`apps/backend/tests/fixtures/external-garfex-boundary/compatibility.json`

It contains:

- one valid request and representative success outcome for each of the ten operations;
- one representative applicable failure outcome per operation;
- a complete error-code/allowlisted-metadata matrix covering all eleven external codes;
- opaque cursor examples that assert only round-trip equality and null termination, never cursor structure.

`apps/backend/tests/external-garfex-compatibility.test.ts` loads the JSON as unknown, validates it through the same named validators, invokes fixture-backed Resource Master stubs, serializes the actual outcome with `JSON.stringify`, and compares parsed JSON deeply. Any added, removed, renamed, or changed external field/code/metadata fails until the fixture and migration intent are reviewed together.

The fixture must not contain internal messages, stacks, provider data, Convex IDs, persistence documents, deployment configuration, catalog administration, or internal type names.

### Documentation parity

Add `apps/backend/tests/external-garfex-documentation-parity.test.ts`. It extracts fenced machine-readable operation/error tables from `docs/external-garfex-boundary.md` and compares identifiers, direct mappings, error codes, and metadata names to the canonical constants/fixture. The documentation remains human-first while parity is executable.

## Architecture fitness rules

Extend `tooling/architecture/check.mjs` with named rules scoped to `external-garfex-boundary`:

1. `external-contract-independent`: `client-facing/` has no imports from `apps/backend`, Resource Master, modules, auth, Convex/generated, persistence, infrastructure, application, domain, or deployment sources and no mechanical `Pick`/`Omit`/`Parameters`/`ReturnType` derivation tied to them.
2. `external-contract-no-authority`: client-facing DTO source contains no authority-bearing property declarations or trusted auth/provider types.
3. `external-contract-no-platform`: client-facing source and compatibility fixtures contain no Convex/generated/document/repository/persistence/deployment/catalog-admin contract references.
4. `external-trusted-edge-public-only`: trusted boundary code may import Resource Master only through `src/resource-master/public.ts`; domain/application/infrastructure/deployment/Convex/generated imports fail.
5. `external-no-generic-business-executor`: boundary callable exports and controlled fixtures reject generic execute/dispatch/CRUD/repository/table APIs, callable operation maps, and automatic iteration over Resource Master methods.
6. `external-no-automatic-derivation`: generation or structural derivation of the client contract from Resource Master or Convex is rejected.
7. `external-no-transport`: boundary code imports no HTTP/router/server/RPC/Convex transport package and defines no status-code/protocol framing.

Add valid fixtures under `tooling/architecture-fixtures/valid/external-garfex-boundary/` and one focused violating file for each rule under `tooling/architecture-fixtures/violations/external-garfex-boundary/`. Update `tooling/tests/architecture.test.ts` to require every new rule name, ensuring the checker itself is tested. Rules inspect imports and narrowly scoped syntax; compatibility semantics remain in TypeScript tests rather than fragile repository-wide keyword bans.

## Strict-TDD test plan

Tests are written failing first in the work unit that introduces their behavior.

### Contract and validator tests

`apps/backend/tests/external-garfex-contract.test.ts`

- exact ten operation identifiers and eleven error codes;
- every valid request shape;
- missing, mistyped, unknown, out-of-range, non-safe integer, malformed value, cursor, and nested quantity cases;
- top-level and nested authority/infrastructure forgery attempts rejected before actor resolution;
- optional search fields omitted rather than converted to undefined;
- every success and failure validator rejects extra fields;
- malformed normalized outcomes contain to `INTERNAL_FAILURE`.

### Mapping and projection tests

`apps/backend/tests/external-garfex-operations.test.ts`

- table-driven evidence for all ten named wrappers;
- each invokes only the same-named `ResourceMaster` method once;
- actor is server-created, separate, and passed first;
- request objects and attribute values are rebuilt, not passed by reference;
- all listed success fields survive and injected internal extras do not;
- nested output values are fresh references;
- omitted search defaults remain omitted and cursor is opaque/null;
- malformed request and unknown identifier produce no Resource Master call.

### Trust, authorization, and sanitization tests

`apps/backend/tests/external-garfex-security.test.ts`

- missing identity/provider exception returns `UNAUTHENTICATED` before master/downstream work;
- forged actor/roles/capabilities/claims/token/session cannot alter the actor;
- incapable authenticated actors reach Resource Master's real authorization and return `FORBIDDEN` before catalog/repository work;
- each mutation is checked with the wrong neighboring capability;
- all internal error mappings and metadata allowlists;
- internal messages/details, thrown errors, stacks, provider, persistence, Convex, catalog, and configuration secrets never occur in serialized outcomes;
- malformed internal success/error and a throwing diagnostics sink yield valid `INTERNAL_FAILURE`.

### Compatibility, docs, and architecture tests

- `external-garfex-compatibility.test.ts` freezes serialized request/success/failure examples for every operation and all error meanings.
- `external-garfex-documentation-parity.test.ts` compares executable identifiers and mapping/error metadata tables.
- existing `resource-master-authorization.test.ts` remains the authoritative downstream short-circuit proof; add cases only if an uncovered exact capability path is found.
- `tooling/tests/architecture.test.ts` proves valid and violating fixtures for every new architecture rule.

Final gates: focused red/green tests per unit, then `pnpm --filter @garfex/backend check`, `pnpm test:architecture`, and repository `pnpm check`.

## Documentation changes

Create `docs/external-garfex-boundary.md` as the canonical review document. Lead with the distinction:

```text
External Client Contract != Resource Master Public Application Contract
```

It includes the exact ten-operation mapping, request/success summaries, identity construction flow, final Resource Master authorization, error/metadata table, compatibility owner, fixtures/check commands, Convex isolation, and all non-decisions.

Update:

- `docs/architecture.md` to add the new boundary layers and dependency arrows without presenting a transport;
- `docs/external-client-boundary.md` to link the concrete Resource Master semantic boundary while preserving repository independence and deferred packaging;
- `docs/auth-boundary.md` to identify `TrustedActorResolver` as another server-only adapter over the existing provider-neutral composition, without declaring a productive auth strategy.

## Technology decisions intentionally left open

The implementation establishes TypeScript semantic functions only. It does not decide:

- HTTP, RPC, Convex-mediated exposure, or another transport/protocol;
- status codes, framing, serialization protocol, routing, hosting, or reachability;
- schema/IDL library, externally distributed schema format, code generation, or generation direction;
- SDK/client generation, artifact packaging, registry, version identifier, compatibility window, or deprecation mechanism;
- productive IdP, credential/session validation, provider claims, provisioning, machine identity, or deployment configuration;
- telemetry/logging provider;
- any consumer repository or workflow.

JSON is used only as a repository test fixture serialization, not selected as the transport or distributed contract format.

## Tradeoffs and rejected alternatives

### Re-exporting or publishing `resource-master/public.ts`

Rejected because it exposes `ActorContext`, capability policy, internal result messages, and backend evolution as client compatibility. Independent duplicate-looking DTO definitions are intentional ownership, not accidental redundancy.

### Deriving the external contract from Convex validators or generated bindings

Rejected because Convex validators include platform framing and current adapter constraints. Derivation would make infrastructure the compatibility owner and could leak generated/database meanings. Convex remains private infrastructure.

### Generic `execute(operation, payload)`, universal CRUD, or handler registry

Rejected because it creates an automatic publication mechanism, weakens per-operation review, and makes unknown/new operations easier to expose accidentally. Ten named functions plus explicit future transport switching provide more code but a smaller, auditable capability surface.

### Duplicating authorization at the edge

Rejected because an external capability table would drift from Resource Master's deny-by-default map and could be mistaken for final enforcement. The edge authenticates and constructs an actor; Resource Master authorizes each direct application call before data access.

### Selecting a transport now

Rejected because no consumer, protocol, deployment, productive identity, or artifact distribution decision is gated. The normalized outcomes and named invocation functions are sufficient for a future HTTP, RPC, Convex, or other adapter without changing business semantics.

### Sharing internal view objects because fields currently match

Rejected because structural pass-through silently publishes future internal fields and preserves object identity. Explicit copying is verbose but makes compatibility changes reviewable and testable.

### Parsing internal free-form error details into external field issues

Rejected because current messages/details are not stable or safe. Only boundary request validation emits stable field issues; duplicate ID and conflict revision are the two reviewed internal metadata translations.

## Rollout and rollback

1. Land the independent contract and validators with no invocation or network reachability.
2. Land trusted identity/error/projection code and ten named operations behind tests.
3. Land compatibility fixtures, architecture fitness rules, and canonical docs.
4. Run all focused and repository gates. Do not add a Convex or network entrypoint.
5. A later transport change must separately decide authentication evidence, routing, protocol projection, deployment, and artifact distribution.

Rollback removes the unexposed boundary directory, fixtures, rules, and docs without changing Resource Master, Convex persistence, or authorization. If a later transport exposes it, containment disables that transport/individual named route; Resource Master authorization must never be bypassed or weakened during rollback.

## Changed-line forecast and work-unit boundaries

Forecast is authored additions/edits, not generated output:

| Area | Files | Forecast |
| --- | ---: | ---: |
| Independent contract and validators | 2 | 430–560 lines |
| Trusted identity, errors, projections, ten operations | 5 | 620–820 lines |
| Backend behavior/security tests | 3 | 650–850 lines |
| Serialized compatibility fixture and parity tests | 3 | 320–430 lines |
| Architecture checker, tests, valid/violation fixtures | 10–12 | 240–340 lines |
| Canonical and linked documentation | 4 | 260–360 lines |
| **Total** | **27–29** | **2,520–3,360 lines** |

Likely strict-TDD review units, ordered to keep each unit coherent and independently reviewable:

1. **Contract closure:** failing contract tests, independent DTOs, identifier constants, and request/outcome validators (about 550–750 changed lines).
2. **Safe normalization:** failing security cases, trusted actor resolver, diagnostics seam, and complete error sanitization (about 400–550 lines).
3. **Discovery reads:** failing mapper/projection cases plus taxonomy/schema/options/units/read/describe named operations (about 500–680 lines).
4. **Search and mutations:** failing mapper/projection/authorization cases plus search/create/update/deactivate named operations (about 520–700 lines).
5. **Compatibility defenses:** serialized fixture, all-operation/error parity, and documentation parity test (about 400–540 lines).
6. **Architecture and docs:** controlled architecture fixtures/rules and the three linked documentation updates plus canonical document (about 500–700 lines).

Six units are preferred over per-operation units: the named functions remain independently testable, while grouping shared projection/security mechanics avoids ten repetitive review chains. Tasks should split a unit only if its authored diff exceeds the repository's active review limit; no semantic shortcut or generic executor should be introduced to reduce line count.

## Implementation checklist

- [ ] Client-facing contract has no backend or third-party imports.
- [ ] Exactly ten named operation functions exist and no generic business executor exists.
- [ ] Every request validates before actor resolution and module work.
- [ ] Actor construction reads only trusted server composition.
- [ ] Every operation calls only the real same-named `ResourceMaster` method.
- [ ] Resource Master remains the sole final authorization authority.
- [ ] Every success and error is explicitly projected, validated, and newly allocated.
- [ ] Unknown errors and all exceptions are sanitized and server-only diagnostics cannot fail outward.
- [ ] Every operation has serialized success and failure evidence.
- [ ] Architecture rules have both passing and named failing fixtures.
- [ ] Documentation and executable identifiers remain in parity.
- [ ] Convex and all listed technology decisions remain encapsulated/open.
