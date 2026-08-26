# Design: TypeSpec-authoritative Resource Master external contract

## Decision summary

Create an independently owned, transport-neutral TypeSpec project at `contracts/external-garfex/resource-master/`. TypeSpec is the only authored external semantic authority. It also authors the consumer-visible contract identity `garfex.resource-master.external-client-contract` and initial compatibility revision `1`; both values are opaque strings, not semantic versions. A repository-local custom emitter compiles the TypeSpec program into one canonical, deterministic semantic manifest. Runtime TypeScript contract data, validators, compatibility checks, fixtures, and consumer documentation consume that manifest or a byte-verifiable materialization of it; none may redefine the external contract independently.

The runtime path remains three separate ownership boundaries:

```text
contracts/external-garfex/resource-master/*.tsp
  TypeSpec authority: external identity/revision, operations, requests, successes, public metadata, failures
        |
        | compile + transport-neutral semantic emitter
        v
semantic-manifest.json
  deterministic downstream interchange for repository consumers
        |                         |
        | materialize/check       | generate/check
        v                         v
runtime TS schema data        consumer semantic documentation
        |
        v
trusted composition root -> ten named handlers -> ResourceMaster public application contract
                                                -> final module authorization
                                                -> private ports/adapters
```

This design selects a technical source, emitter, manifest, parity, and baseline mechanism. It does **not** select HTTP, REST, routes, verbs, statuses, headers, serialization, OpenAPI, Scalar, Orval, client publication, a productive identity provider, or UI behavior.

## Goals and invariants

1. TypeSpec owns the external meaning of exactly ten Resource Master workflows.
2. The emitted manifest is deterministic and transport-neutral.
3. Runtime validation is mechanically downstream of the manifest rather than a competing handwritten authority.
4. Trusted composition creates fresh actor state; no client field can provide authority.
5. Each operation has a named request mapper, module call, and field-by-field success projector.
6. Handler code reaches Resource Master only through `apps/backend/src/resource-master/public.ts`.
7. Resource Master remains the final deny-by-default authorization authority before catalog or repository work.
8. Unknown operations, malformed inputs, stale artifacts, unsafe failures, and unapproved semantic changes fail closed.
9. Convex, persistence, catalog administration, authentication internals, deployment concepts, and module internals remain absent from contract sources and downstream public artifacts.
10. A consumer can discover the TypeSpec-authored external identity and compatibility revision from the manifest or generated transport-neutral documentation.
11. The external identity is stable once published, and the compatibility revision changes only through deliberate review for an approved breaking contract evolution; neither value follows compiler, emitter, package, or module versions.
12. `persistent-resource-catalog` is outside the edit surface.

## Component and file layout

Paths are concrete implementation targets. Exact file splitting inside the TypeSpec project may be adjusted mechanically, but ownership and dependency direction must not change.

```text
contracts/external-garfex/resource-master/
├── main.tsp                              # independently owned entrypoint and namespace
├── contract-metadata.tsp                 # transport-neutral identity/revision decorator declaration
├── models.tsp                            # shared external business and public metadata models
├── failures.tsp                          # closed eleven-code safe failure union and metadata
├── operations.tsp                        # exactly ten transport-neutral operations
├── tspconfig.yaml                        # entrypoint plus local semantic emitter configuration
├── generated/
│   └── semantic-manifest.json            # sole deterministic semantic manifest
└── baseline/
    ├── accepted-semantic-manifest.json   # deliberately reviewed compatibility baseline
    └── migration-intent.md               # present/changed only for an approved incompatible update

tooling/typespec-semantic-manifest/
├── package.json                          # private local TypeSpec emitter package
├── src/index.ts                          # $onEmit(context), semantic traversal, emitFile
├── src/manifest-model.ts                 # emitter output schema and canonical ordering rules
├── src/materialize-runtime.ts            # manifest -> generated TypeScript schema data/types
├── src/materialize-docs.ts               # manifest -> transport-neutral consumer Markdown
├── src/compare.ts                        # semantic compatibility classifier
└── tests/                                # emitter, determinism, comparison, and malformed-program tests

apps/backend/src/external-garfex-boundary/
├── client-facing/
│   ├── contract.ts                       # stable façade re-exporting generated public TS types/constants
│   ├── validation.ts                     # closed generic runtime interpreter + named wrappers
│   └── generated/
│       └── semantic-contract.generated.ts # deterministic embedding derived from the manifest
├── composition.ts                        # ten named composed entry functions; validates then resolves actor
└── trusted/
    ├── identity.ts                       # trusted auth composition -> fresh ActorContext
    ├── read-operations.ts                # named handlers; no auth/internal module imports
    ├── mutation-operations.ts            # named handlers; no auth/internal module imports
    ├── projections.ts                    # explicit field-by-field success projections
    └── errors.ts                         # exhaustive safe normalization and server-only diagnostics

apps/backend/tests/
├── external-garfex-typespec.test.ts       # compile/manifest/runtime parity and exact operation set
├── external-garfex-compatibility.test.ts  # baseline comparison and representative evidence
├── external-garfex-contract.test.ts       # runtime closed-shape/security behavior
├── external-garfex-operations.test.ts     # ten named mapping/projection behaviors
├── external-garfex-security.test.ts       # auth, error containment, and final authorization
└── fixtures/external-garfex-boundary/
    └── compatibility.json                 # representative semantic evidence, never transport authority

docs/
├── generated/resource-master-external-contract.md # manifest-derived consumer semantics
├── external-garfex-boundary.md            # canonical three-boundary and governance record
├── external-client-boundary.md
├── auth-boundary.md
└── architecture.md

tooling/
├── architecture/check.mjs
├── tests/architecture.test.ts
└── architecture-fixtures/{valid,violations}/external-garfex-boundary/
```

The root `package.json`, lockfile, and TypeScript project configuration will gain only the dependencies/scripts needed to compile TypeSpec and build/check the local emitter. The TypeSpec project is not a published package and does not create a client distribution decision.

## TypeSpec authority

### Project configuration

`contracts/external-garfex/resource-master/tspconfig.yaml` sets `entrypoint: main.tsp` and configures only the repository-local semantic-manifest emitter for normal artifact generation. It contains no transport emitter. Two separate gates are required:

```text
tsp compile . --no-emit
```

run from the TypeSpec project validates the project without any emitter, while the artifact command runs the same compilation with only the local transport-neutral emitter. The root scripts expose stable commands such as `contract:typespec:check`, `contract:generate`, and `contract:check`; names may follow existing script conventions, but `check` must invoke all three.

### TypeSpec model shape

The TypeSpec namespace defines:

- exactly ten `op` declarations;
- one named request model and one named success model per operation, even where shapes are shared;
- independently owned public business models for taxonomy, effective attribute metadata, options, natural units, resources, resource summaries, descriptions, and pagination;
- closed enums/unions for lifecycle, attribute kind, schema result mode, identity policy version, attribute value, error code, field issue reason, and failure variants;
- constraints already enforced by the reviewed runtime baseline, including non-empty identifiers, safe non-negative revisions, search limit `1..50`, nullable opaque cursor output, and optional search inputs;
- an outcome union whose success is operation-specific and whose failures expose only reviewed safe variants.

Operation declarations remain transport-neutral, for example conceptually `op getResource(request: GetResourceRequest): GetResourceOutcome`; they carry no route, verb, status, header, wire-authentication, serialization, or deployment metadata.

### External contract identity metadata

A repository-local TypeSpec library declares a transport-neutral namespace decorator equivalent to `extern dec externalContract(target: Namespace, identity: valueof string, compatibilityRevision: valueof string)`. `main.tsp` applies it exactly once to the external contract namespace with these initial authored values:

```typespec
@externalContract("garfex.resource-master.external-client-contract", "1")
namespace Garfex.External.ResourceMaster;
```

The decorator carries metadata only; it does not import a transport library or imply package publication. Its JavaScript implementation is exported by the same private local library as the semantic emitter, stores the two strings on the TypeSpec `Program` through a library-owned state symbol, and makes them available to semantic traversal. The emitter requires exactly one application on the expected namespace and reads the values through that library API rather than parsing source text.

`externalContractIdentity` identifies this external contract lineage. It is external and stable once published; internal module names and module versions cannot redefine it. `compatibilityRevision` identifies the accepted consumer compatibility surface within that lineage. The initial value is the opaque string `1`: consumers must compare it for exact equality and must not infer numeric ordering, semantic-version components, ranges, or support duration. It is independent of the manifest schema revision and of TypeSpec compiler, emitter, package, runtime module, or deployment versions.

An approved breaking contract evolution must deliberately author a new `compatibilityRevision` in TypeSpec in the same reviewed change as comparator evidence and migration intent. Leaving the revision unchanged during a breaking semantic change is a silent-break error. Changing the revision without the required reviewed breaking-change evidence is also rejected. `externalContractIdentity` normally remains stable across revisions; changing it is itself breaking and is allowed only when the approved evolution intentionally creates a replacement contract lineage. This preserves deferral of semantic-version syntax, support windows, deprecation policy, publication mechanism, and transport.

TypeSpec does not contain module capabilities, `ActorContext`, Resource Master application types, Convex validators, persistence records, authentication models, or adapter names. Final capability requirements belong to Resource Master and mapping evidence, not to the external semantic authority.

### Emitter contract

The private emitter exposes `$onEmit(context)`. It traverses `context.program` with stable semantic APIs, preferring `navigateProgram` and checker-resolved types over raw AST inspection. It emits with `emitFile`; direct writes from the emitter are prohibited.

The emitter validates these contract-specific invariants before writing:

- one expected namespace and no unrelated public operations;
- exactly one valid `@externalContract` application on that namespace, with non-empty opaque identity and revision strings;
- exactly ten unique operation identifiers;
- every operation resolves to a named request, named success, and closed failure semantics;
- no anonymous or unresolved recursive shape that the runtime interpreter cannot represent;
- no transport decorators, transport libraries, or emitter options;
- no prohibited authority/platform/internal names or imports;
- all records, unions, enums, arrays, optionals, nullability, and scalar constraints are representable without loss.

An emitter diagnostic prevents artifact creation. Compiler diagnostics, unsupported semantic constructs, or duplicate normalized identifiers also fail generation.

## Deterministic semantic manifest

### Manifest contents

`generated/semantic-manifest.json` is the single normalized repository interchange derived from TypeSpec. It contains:

- `externalContractIdentity` and `compatibilityRevision`, copied exactly from the required TypeSpec namespace metadata and exposed as consumer contract metadata;
- an internal manifest schema revision, which versions the emitter data shape and is not an external contract version;
- provenance: normalized TypeSpec source digest, TypeSpec compiler version, emitter package version, and emitter-options digest;
- the ordered operation set;
- per-operation references to request, success, and failure definitions;
- normalized named models, fields, requiredness, arrays, records, discriminators, unions, enums, nullability, scalar categories, and constraints;
- documentation strings needed for transport-neutral consumer documentation;
- the global safe error and metadata matrix.

It excludes timestamps, absolute paths, machine names, package-manager cache paths, source positions, AST node IDs, and object insertion order inherited from compiler traversal.

### Canonicalization

The emitter sorts namespaces, declarations, fields, union variants, enum values, and constraint keys by a documented ordinal rule. The approved operation display order is explicitly represented and verified against the ten-name baseline rather than inferred from filesystem or AST order. JSON is UTF-8, two-space indented, LF-terminated, and serialized by one canonical writer. Provenance hashes are calculated from normalized source bytes and pinned compiler/emitter inputs, never from output paths or wall-clock state.

Running generation twice in clean temporary directories must produce byte-identical output. A determinism test changes traversal/input file ordering without changing semantics and expects the same manifest bytes.

### Materialized consumers

A second deterministic tool reads the manifest; it does not read TypeSpec or backend source. It produces:

1. `semantic-contract.generated.ts`, a typed readonly embedding and generated public type layer used by runtime validation and re-exported by `contract.ts`; and
2. `docs/generated/resource-master-external-contract.md`, containing operation, request, success, metadata, failure, and compatibility semantics without transport details.

Both files carry the manifest digest in a generated header. The generated TypeScript embedding exposes the two strings as readonly contract metadata. The generated Markdown begins with a prominent `Contract identity and compatibility` section showing the exact identity and compatibility revision and explaining exact opaque comparison, so a consumer can discover compatibility information without backend source or a selected transport. Both files are replaceable build products, not authorities. Hand editing is prohibited and detected by regeneration.

`compatibility.json` remains representative test evidence. Tests validate it against manifest-driven validators and compare its operation/error coverage to the manifest. Its JSON encoding does not define a wire format.

## Runtime TypeScript validator relationship

`validation.ts` remains handwritten security-sensitive code but no longer hand-declares contract shapes, fields, enums, requiredness, or bounds. Those data come from `semantic-contract.generated.ts`, which is materialized solely from the manifest.

The runtime layer contains:

- one generic, total interpreter for the generated schema algebra;
- named request and success wrapper exports retained for explicit operation use and stable backend call sites;
- closed-object reconstruction with no spread/cast/pass-through behavior;
- defensive handling for null prototypes, symbols, accessors, sparse/extended arrays, hostile getters, and thrown values;
- boundary hardening for authority-like dynamic attribute keys and prototype-pollution keys;
- normalized validation failures with stable external field paths;
- output validation that converts any malformed projected success/error to metadata-free `INTERNAL_FAILURE`.

The security hardening algorithm is implementation policy, not a second schema authority. Its acceptance behavior is tested against manifest-generated positive/negative cases. Contract semantics such as allowed fields, enum members, optionality, union variants, nullability, and numeric/string constraints cannot be changed in handwritten validator code.

`contract.ts` becomes a small stable façade over generated readonly constants and types. It may add ergonomic aliases but must not declare independent operation/error/model lists. A stale generated TypeScript file fails before typecheck/test acceptance.

## Trusted composition and control flow

### Responsibility split

`composition.ts` owns the server composition sequence and exposes ten named functions. For each invocation it:

1. selects the named request validator statically; there is no dynamic operation/payload executor;
2. validates and rebuilds untrusted business input before authentication-dependent work;
3. asks the trusted authentication composition to resolve identity;
4. constructs a fresh `ActorContext` with a copied server-authorized capability set;
5. calls the matching named handler with validated input, actor, `ResourceMaster`, and optional diagnostics;
6. validates the final projected outcome before release.

`identity.ts` is used by this composition root. Per-operation handler modules do not import `auth/`, `AuthenticationComposition`, a provider, Convex, infrastructure, application internals, or Resource Master domain types.

Handlers depend on external generated contract types plus **only** the Resource Master public application contract for backend behavior. The composition root may wire a concrete `ResourceMaster` implementation and authentication implementation, but handler logic accepts the public `ResourceMaster` interface and `ActorContext` from `resource-master/public.ts`.

### Explicit operation mappings

| External operation | Named handler | Module public method | Final capability owned by Resource Master |
| --- | --- | --- | --- |
| `getTaxonomy` | `handleGetTaxonomy` | `getTaxonomy` | `resource:read` |
| `getEffectiveResourceSchema` | `handleGetEffectiveResourceSchema` | `getEffectiveResourceSchema` | `resource:read` |
| `getValidOptions` | `handleGetValidOptions` | `getValidOptions` | `resource:read` |
| `getNaturalUnits` | `handleGetNaturalUnits` | `getNaturalUnits` | `resource:read` |
| `getResource` | `handleGetResource` | `getResource` | `resource:read` |
| `searchResources` | `handleSearchResources` | `searchResources` | `resource:read` |
| `describeResource` | `handleDescribeResource` | `describeResource` | `resource:read` |
| `createResource` | `handleCreateResource` | `createResource` | `resource:create` |
| `updateNonIdentityData` | `handleUpdateNonIdentityData` | `updateNonIdentityData` | `resource:update-non-identity` |
| `deactivateResource` | `handleDeactivateResource` | `deactivateResource` | `resource:deactivate` |

A compile-time `satisfies` mapping evidence object may enumerate these names for parity, but it must contain references to the ten named functions only. It must not be callable as a generic dispatcher, registry, reflection mechanism, or automatic publication facility.

Each handler rebuilds module input explicitly. Omitted search optionals remain omitted so Resource Master owns defaults. `createResource.attributes` is deep-rebuilt. Every success projector creates a new external value field by field, including nested arrays and quantity values. No handler forwards objects by reference, spreads internal values, or returns module values directly.

Resource Master performs its existing exact capability check. The edge does not duplicate or pre-approve capability policy. Tests must prove unauthorized calls reach Resource Master authorization but perform no catalog/repository/Convex work.

## Safe error normalization

The only external codes remain:

`UNAUTHENTICATED`, `FORBIDDEN`, `INVALID_ARGUMENT`, `INVALID_REFERENCE`, `VALIDATION_FAILED`, `NOT_FOUND`, `DUPLICATE`, `CONFLICT`, `INVALID_LIFECYCLE`, `CATALOG_UNAVAILABLE`, and `INTERNAL_FAILURE`.

The normalizer is an exhaustive switch over the Resource Master public error union:

| Internal meaning | External result |
| --- | --- |
| Missing/failing trusted authentication | `UNAUTHENTICATED`, no metadata |
| `FORBIDDEN` | `FORBIDDEN`, no metadata |
| `INVALID_ARGUMENT` | `INVALID_ARGUMENT`, only validated applicable `fieldIssues` |
| `INVALID_REFERENCE` | `INVALID_REFERENCE`, only validated applicable `fieldIssues` |
| `VALIDATION` | `VALIDATION_FAILED`, only validated applicable `fieldIssues` |
| `NOT_FOUND` | `NOT_FOUND`, no metadata |
| `DUPLICATE` | `DUPLICATE`, optional externally valid `existingResourceId` |
| `CONFLICT` | `CONFLICT`, optional non-negative safe `currentRevision` |
| `INVALID_LIFECYCLE` | `INVALID_LIFECYCLE`, no metadata |
| Catalog unavailable or uninitialized | `CATALOG_UNAVAILABLE`, no metadata |
| Integrity, internal, invalid catalog, malformed, unknown, thrown, projection, or response-validation failure | `INTERNAL_FAILURE`, no metadata |

`fieldIssues`, `existingResourceId`, and `currentRevision` are emitted only when both applicable to the selected error variant and valid under the generated runtime schema. Invalid optional metadata does not pass through; unsafe/malformed known failures conservatively collapse to metadata-free `INTERNAL_FAILURE`. Known failures never become successes.

Diagnostics receive operation, phase, and original cause only through a server-only callback. Diagnostic callback failure cannot alter the external result. No message, detail, stack, provider diagnostic, Convex value, catalog integrity data, or malformed metadata is copied into an external value.

## Ownership and import constraints

Architecture checks enforce these directions:

```text
TypeSpec source -> local TypeSpec compiler/emitter only
TypeSpec metadata decorator state -> emitter manifest identity/revision
manifest -> materializers/tests/comparison
runtime generated data -> client-facing validator
trusted handlers -> client-facing contract + resource-master/public.ts only
composition root -> auth composition + trusted handlers + resource-master/public.ts
resource-master implementation -> private ports/adapters (unchanged)
```

Prohibited directions include:

- TypeSpec or generated artifacts importing/naming backend, Resource Master, auth, Convex, persistence, deployment, catalog administration, or UI sources;
- emitter/materializers reading Resource Master or handwritten validator source to infer semantics;
- client-facing generated/runtime contract importing trusted composition or module types;
- trusted handlers importing Resource Master `application/`, `domain/`, `infrastructure/`, Convex, persistence, or generated Convex bindings;
- generic dispatch, automatic module publication, arbitrary CRUD/repository/table APIs, or transport bindings;
- any source or config reference to OpenAPI, Scalar, Orval, routes, verbs, statuses, headers, or wire authentication as an enabled output of this change.

The checker must inspect `.tsp`, `tspconfig.yaml`, emitter configuration, manifest, generated TypeScript, generated consumer docs, mapping evidence, and canonical docs. It also requires one TypeSpec-authored metadata application, rejects missing/duplicate metadata and hard-coded downstream identity/revision values, and verifies that canonical docs identify TypeSpec as their source. Each named rule receives one valid fixture and focused violating fixtures for transport decoration/emitter, authority field, internal import/name, Convex/platform leakage, generic dispatch, module-internal handler import, missing or silently changed contract metadata, stale provenance, and automatic publication.

## Generation, parity, and stale-artifact checks

The acceptance pipeline is ordered:

1. `tsp compile . --no-emit` proves the authority is valid without emitters.
2. Compile with only the local semantic emitter into a clean temporary directory.
3. Validate the emitted manifest against the emitter's internal manifest schema, including required non-empty opaque `externalContractIdentity` and `compatibilityRevision` strings sourced from the TypeSpec decorator.
4. Compare temporary manifest bytes with the committed manifest.
5. Materialize runtime TypeScript and consumer Markdown from the temporary manifest.
6. Compare temporary materializations byte-for-byte with committed files, verify embedded digest headers, and assert exact identity/revision parity in both outputs.
7. Compare current manifest semantics and external identity/revision with the accepted baseline.
8. Enforce the breaking-change/revision coupling rules and required migration intent.
9. Run operation/mapping/runtime/fixture/documentation parity tests.
10. Run architecture, typecheck, unit, coverage, formatting, and build gates.

Normal `contract:generate` updates generated files intentionally. CI and `check` use a non-writing temporary generation command. Missing, extra, stale, manually modified, or non-reproducible artifacts fail with the affected path and expected/current digest. Missing identity/revision metadata fails emission; stale or manually changed values in the manifest, generated TypeScript, baseline, or consumer documentation fail exact parity with the TypeSpec-authored values. A compiler/emitter version change changes provenance and therefore requires regeneration and baseline review even when semantic content is unchanged; the comparator reports this as tooling provenance, not an external semantic break and never changes either external value automatically.

Documentation parity uses manifest-derived generated documentation for semantic tables and machine-readable identifiers. Handwritten canonical docs describe ownership, trust, rollout, and non-decisions and link to generated semantics; they do not duplicate detailed model tables where generation can prevent drift.

## Compatibility baseline and comparison algorithm

### Baseline strategy

`baseline/accepted-semantic-manifest.json` is a reviewed snapshot of the previously accepted semantic manifest, including the TypeSpec-authored `externalContractIdentity` and `compatibilityRevision`. The file format is the same normalized manifest format so comparisons are semantic and deterministic. The baseline filename is called `accepted`; it does not encode version syntax. The external compatibility revision is the opaque TypeSpec value `1`, not a semantic version and not a baseline filename convention. This design deliberately does not choose semantic-version syntax, a compatibility/support window, deprecation duration, publication mechanism, transport, or rollout policy.

Updating the baseline requires an explicit review that changes TypeSpec first, regenerates all downstream artifacts, includes comparator output, and records migration intent when any breaking category exists. Merely regenerating artifacts cannot update the baseline. CI compares against the committed accepted baseline and blocks differences until the baseline and required intent are deliberately changed in the same reviewed change.

### Comparison algorithm

The comparator removes provenance and documentation text from the structural graph, resolves named references, and compares canonical operation roots and all transitively reachable models. It emits stable paths such as `operations.searchResources.request.limit.required` and one of `breaking`, `additive`, `documentation`, or `tooling-provenance`.

Breaking categories are conservative because requests and outcomes are closed:

- operation removal, rename, mapping redirection, or addition beyond the approved closed set;
- request field removal, required field addition, optional-to-required change, nullability removal, type narrowing, tighter bound, or removed enum/union member;
- success field addition/removal/rename, requiredness/nullability change, scalar/category change, bound change, or any closed enum/union variant addition/removal;
- error code or failure variant addition/removal/rename;
- metadata addition to a previously metadata-free error, metadata applicability change, or metadata type/requiredness change;
- discriminator, record openness, array element, map value, or recursive reference change that alters accepted/released values.

Potentially additive differences are still review-blocking semantic drift, but are reported separately:

- optional request field addition;
- request type widening, relaxed request bound, or request enum/union member addition;
- documentation-only descriptions do not alter shape but regenerate consumer docs;
- compiler/emitter provenance changes do not alter semantics but require reproducibility review.

For closed success and error values, widening is classified as breaking because existing strict consumers may reject new output. For requests, widening is additive for existing callers but still cannot bypass runtime/mapping review. Unknown or unclassifiable differences are breaking by default. Renames are represented as removal plus addition unless a later separately approved versioning policy introduces explicit rename metadata.

The comparator treats contract metadata under explicit rules:

- missing or duplicate TypeSpec metadata is invalid and produces no accepted manifest;
- a breaking structural difference with an unchanged `compatibilityRevision` is rejected as a silent breaking change;
- a changed `compatibilityRevision` is itself review-blocking and is accepted only with approved breaking comparator output and `migration-intent.md` in the same change;
- a changed `externalContractIdentity` is breaking and additionally requires migration intent to state that a replacement lineage is intentional;
- documentation-only, additive, or tooling-provenance differences cannot change either external value automatically; and
- baseline, manifest, generated TypeScript, and generated documentation values must equal the TypeSpec-authored strings exactly.

TypeSpec versioning decorators exist and may be adopted later, but the local metadata decorator does not implement semantic-version ordering, ranges, lifecycle, or availability policy. The accepted-baseline comparator plus the opaque revision is the compatibility gate for this scope.

## Failure behavior

| Failure point | Required behavior |
| --- | --- |
| TypeSpec compiler diagnostic | No manifest or materialized artifact is accepted. |
| Missing, duplicate, empty, or wrongly targeted contract metadata | Emit a precise diagnostic; accept no manifest or materialized artifact. |
| Unsupported emitter semantic construct | Emit a precise diagnostic; write no partial accepted artifact. |
| Nondeterministic generation | Byte comparison fails and reports artifact/digest mismatch. |
| Missing or stale generated TypeScript/docs | Check fails before runtime tests/build acceptance. |
| Unapproved semantic difference | Comparator blocks acceptance; breaking differences require migration intent and a deliberate compatibility-revision change. |
| Stale or silently changed identity/revision | Exact TypeSpec/manifest/baseline/generated-code/generated-doc parity fails before acceptance. |
| Unknown operation or absent named mapping | Fail before authentication/module/catalog/repository work; no generic fallback. |
| Malformed external request | Return validated `INVALID_ARGUMENT`; do not authenticate or invoke Resource Master. |
| Authentication absence/failure | Return metadata-free `UNAUTHENTICATED`; do not invoke Resource Master. |
| Resource Master denial | Normalize to `FORBIDDEN`; Resource Master itself proves no downstream data work. |
| Thrown invocation/projection/validation value | Record server-only diagnostics when possible and return metadata-free `INTERNAL_FAILURE`. |
| Invalid projected success or failure | Release no malformed value; return validated metadata-free `INTERNAL_FAILURE`. |
| Diagnostic sink failure | Ignore sink failure and preserve the normalized external outcome. |

## Test strategy under strict TDD

Every implementation slice starts with a failing test, then the smallest production change, then refactoring while green. No generated artifact is accepted merely because it was manually inspected.

### 1. Compiler and emitter tests

Write failures first for:

- `tsp compile . --no-emit` with the valid project;
- exact ten operations and duplicate/extra/missing operation diagnostics;
- semantic traversal of models, unions, enums, records, optionality, nullability, and constraints;
- transport decorator/emitter rejection;
- prohibited authority/internal/platform concept rejection;
- deterministic bytes across repeated and reordered compilation;
- no output on compiler/emitter diagnostics;
- required single metadata decorator application and rejection of missing, duplicate, empty, or wrongly targeted identity/revision metadata.

### 2. Manifest and materializer tests

Cover canonical key ordering, stable operation order, provenance, manifest schema validation, runtime TypeScript materialization, Markdown materialization, digest headers, stale file detection, manual divergence, and clean temporary regeneration. Assert that manifest, generated TypeScript, baseline, and Markdown carry the exact TypeSpec-authored identity and revision; mutations that omit, stale, or hand-change either value must fail. Golden snapshots are acceptable only for generated output and must be paired with semantic assertions.

### 3. Runtime contract tests

Generate positive and mutation cases from every manifest node. Verify all fields, requiredness, optionals, nullability, bounds, enums, unions, records, arrays, and error metadata. Retain adversarial tests for unknown/symbol keys, prototypes, getters, sparse/extended arrays, authority-like attribute keys, prototype-pollution names, malformed metadata, and thrown values. Prove runtime wrappers rebuild fresh values and cannot independently widen or narrow manifest semantics.

### 4. Ten mapping and projection tests

For every named operation, require at least:

- one request mapping test proving only the identically named Resource Master public method is called;
- one input freshness/omitted-optionals test;
- one projection test with extra internal fields proving all and only external fields survive;
- one invalid projected output containment test;
- one module failure normalization test;
- compile-time parity against the exact operation-name set.

A test-only additional Resource Master method must remain absent from TypeSpec, mapping evidence, and invocation exports.

### 5. Authentication and authorization tests

Prove malformed requests stop before auth, unauthenticated calls stop before Resource Master, fresh actors copy capabilities without accepting client authority, handlers cannot manufacture actor state, and Resource Master denies each capability class before catalog/repository/Convex work. The edge must not perform a duplicate capability pre-check.

### 6. Error tests

Exercise all eleven external codes and all internal Resource Master codes. Verify metadata applicability, valid and malformed metadata, catalog coarsening, unknown codes, malformed outcomes, projection exceptions, response-validation failures, diagnostic exceptions, and the invariant that no known failure becomes success.

### 7. Compatibility and architecture tests

Use table-driven baseline mutations for operation, field, requiredness, enum/union, type narrowing/widening, success, error, metadata, and documentation/provenance categories. Add focused cases for a breaking shape with unchanged revision, a revision change without an approved break/migration intent, a valid approved break with deliberate revision change, an identity change without replacement-lineage intent, and compiler/emitter/module version changes that leave external metadata unchanged. Every architecture rule gets a passing fixture and one focused violation with an exact named diagnostic. Existing fixture/documentation parity tests are migrated to read the manifest rather than handwritten lists.

### 8. Full gates

Run focused tests during red/green cycles, then TypeSpec no-emit compile, stale generation check, compatibility comparison, backend typecheck/tests, architecture tests/checker, root lint/format, coverage, and build. Existing repository coverage thresholds remain authoritative.

## Canonical documentation updates

- `docs/generated/resource-master-external-contract.md`: generated standalone consumer semantics for all ten workflows, public metadata, safe failures, and compatibility expectations; its opening compatibility section exposes `garfex.resource-master.external-client-contract` and revision `1` directly from the manifest and explains exact opaque comparison.
- `docs/external-garfex-boundary.md`: replace handwritten semantic authority language with the three-boundary TypeSpec decision; link the TypeSpec root, manifest, baseline gate, and generated consumer document; retain the exact mapping/capability table and non-decisions.
- `docs/external-client-boundary.md`: record TypeSpec as GARFEX-owned external authority while retaining repository and distribution independence.
- `docs/auth-boundary.md`: move actor creation explicitly to the composition root and state that named handlers receive fresh trusted actor state while Resource Master remains final authorization owner.
- `docs/architecture.md`: add the TypeSpec project, emitter/materializer dependency direction, manifest/stale/compatibility gates, and Convex isolation.

Canonical prose must not imply that a manifest file is a transport serialization. No documentation may claim route, SDK, deployment, authentication provider, or UI availability.

## Rollout

1. Add failing compiler/emitter and architecture fixture tests.
2. Add the TypeSpec project and local emitter; establish byte-deterministic manifest generation.
3. Encode the existing reviewed ten-operation semantics without changing behavior.
4. Add the accepted baseline from the first reviewed manifest with identity `garfex.resource-master.external-client-contract` and compatibility revision `1`, then prove zero semantic differences against current compatibility evidence.
5. Materialize generated TypeScript schema data and consumer docs, including discoverable identity/revision metadata; add stale and silent-change checks.
6. Refactor `contract.ts` and `validation.ts` behind their existing exports so callers remain stable.
7. Refactor composition so it creates actors and named handlers receive validated input plus trusted actor state.
8. Re-run all ten mapping, projection, error, and authorization suites before removing duplicated handwritten schema declarations.
9. Update canonical docs and make root `check` invoke TypeSpec compile, stale, compatibility, architecture, and existing repository gates.

No network exposure or client artifact publication occurs during rollout.

## Rollback and containment

Rollback restores the last reviewed TypeSpec source, TypeSpec-authored external identity/revision, accepted baseline, manifest, generated runtime data, and docs as one atomic set. If the materializer/runtime migration is defective, the runtime may temporarily revert to the previous trusted boundary implementation only together with a gate that compares it against the last accepted manifest; the handwritten contract must not be re-declared authoritative.

Rollback never changes Resource Master authorization, actor construction trust, named mappings, safe error normalization, persistence, Convex schemas, or `persistent-resource-catalog`. A rollback that leaves TypeSpec, manifest, generated files, baseline, and docs inconsistent is invalid. Because this change creates no transport or reachability, rollback is repository-local.

## Alternatives and tradeoffs

### Keep handwritten TypeScript and compare TypeSpec directly

Rejected. It leaves two semantic declarations and makes parity logic reconstruct the full contract from unrelated implementations. The manifest-driven runtime schema data gives one normalized downstream input and clearer stale detection.

### Generate complete operation handlers from TypeSpec

Rejected. Automatic handler generation would blur trust ownership, risk generic dispatch/automatic publication, and hide deliberate module mappings and projections. Only external schema data/types/docs are generated; trusted handlers stay named and reviewed.

### Generate validators directly in the emitter

Rejected in favor of manifest then materialization. A single normalized manifest lets runtime, docs, tests, and compatibility comparison share the same semantics and keeps the emitter transport-neutral and reviewable.

### Use OpenAPI or an HTTP TypeSpec library

Rejected as out of scope. It would select transport concepts and encourage route/client generation before those product decisions exist.

### Use only `tsp compile . --no-emit`

Rejected as insufficient. It validates TypeSpec syntax/semantics but cannot provide deterministic downstream parity, stale-artifact detection, or compatibility comparison.

### Adopt TypeSpec versioning decorators and semantic versions now

Deferred. TypeSpec supports versioning decorators, but semantic-version syntax, ordering/ranges, support windows, and deprecation policy remain open. The local transport-neutral metadata decorator supplies only the required opaque external identity and initial compatibility revision; the reviewed accepted-baseline gate supplies structural change detection.

### Do not commit generated artifacts

Rejected for this repository-local runtime integration. Committing the manifest, generated runtime schema data, and generated consumer document makes review and stale checks deterministic and avoids requiring TypeSpec at runtime. These are not published client artifacts.

## Estimated edit surfaces

| Surface | Estimated files | Nature of change |
| --- | ---: | --- |
| TypeSpec authority and config | 5–7 new | Ten operations, models, failures, identity/revision metadata, entrypoint/config |
| Emitter/materializers/comparator | 6–10 new | Compiler integration, canonical manifest, docs/runtime generation, compatibility |
| Root tooling/config/lockfile | 3–5 modified | TypeSpec dependency and contract scripts/project wiring |
| Runtime external boundary | 7–9 modified/new | Generated schema data, façade, validator interpreter, composition/handler split |
| Backend behavior/parity tests | 5–8 modified/new | TypeSpec, runtime, mapping, compatibility, security |
| Architecture checker/fixtures | 10–16 modified/new | `.tsp`/config/artifact rules with focused fixtures |
| Generated/baseline/evidence artifacts | 4–6 modified/new | Manifest, baseline, runtime embedding, docs, fixture updates |
| Canonical documentation | 5 modified/new | Generated consumer document plus four linked records |
| `persistent-resource-catalog` | 0 | Explicitly untouched |

The implementation should preserve existing public test-facing invocation names where practical, but correctness of the composition/handler responsibility split takes precedence over retaining private file organization.

## Apply readiness checklist

- [ ] TypeSpec compiles with `tsp compile . --no-emit` and no transport library/emitter.
- [ ] TypeSpec applies exactly one transport-neutral metadata decorator with external identity `garfex.resource-master.external-client-contract` and opaque initial compatibility revision `1`.
- [ ] The local emitter uses `$onEmit(context)`, semantic traversal, and `emitFile`.
- [ ] Exactly one deterministic semantic manifest is produced from TypeSpec.
- [ ] Runtime schema data and consumer docs are materialized only from that manifest.
- [ ] Exactly ten named mappings call only matching Resource Master public methods.
- [ ] Composition creates fresh actor state; handlers do not authenticate or import module internals.
- [ ] Resource Master retains final exact deny-by-default authorization.
- [ ] All success values are freshly projected and all failures are safely normalized.
- [ ] Baseline comparison detects structural narrowing, widening, additions, removals, and renames.
- [ ] Breaking semantics cannot retain the currently accepted revision; a deliberate revision change requires approved breaking evidence and migration intent, and any contract identity change additionally declares replacement-lineage intent.
- [ ] Manifest, generated TypeScript, baseline, and generated consumer documentation expose values identical to TypeSpec and reject missing, stale, or silently changed metadata.
- [ ] Compiler, emitter, package, module, and deployment version changes never alter external identity/revision automatically.
- [ ] Stale and manually divergent artifacts fail in non-writing CI checks.
- [ ] Architecture fixtures cover TypeSpec, config, artifacts, handlers, and docs.
- [ ] Consumers can discover the opaque identity/revision in generated transport-neutral documentation without backend source or a selected transport.
- [ ] Canonical docs preserve semantic-version syntax, support-window, deprecation, transport, product, auth-provider, publication-mechanism, and UI non-decisions.
- [ ] `persistent-resource-catalog` is unchanged.
