# Implementation Tasks: external-garfex-boundary

## Review Workload Forecast

| Field | Value |
| ------- | ------- |
| Estimated changed lines | 2,520–3,360 authored additions + deletions across approximately 27–29 files; no generated artifacts |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 → PR 5 → PR 6 → PR 7 → PR 8 → PR 9 → PR 10 → PR 11 → PR 12 → PR 13 → PR 14; each implementation slice remains below 400 authored changed lines |
| Delivery strategy | ask-on-risk (resolved: chained delivery) |
| Chain strategy | feature-branch-chain |

Decision needed before apply: No
Chained PRs recommended: Yes
Chain strategy: feature-branch-chain
400-line budget risk: High

The design forecast is materially above the 400-line review budget. This task plan splits the broad design units into fifteen autonomous, dependency-ordered work units while keeping each unit's tests and documentation with the behavior they verify. The corrective U2b split below replaces the invalid single-unit forecast, and U6 is split into U6a/U6b after its timed-out partial apply exceeded the slice budget; each implementation slice is forecast below 400 authored changed lines. The user resolved the `ask-on-risk` gate by selecting `chain strategy: feature-branch-chain`; no `size:exception` is authorized.

## Scope guardrails

- Implement only the transport-neutral semantic boundary under `apps/backend/src/external-garfex-boundary/` and its tests, fixtures, architecture rules, and documentation.
- Keep the client-facing contract independently authored; it must not import, re-export, derive from, or structurally pass through `apps/backend/src/resource-master/public.ts` or any auth, domain, application, infrastructure, persistence, generated, deployment, catalog-administration, or Convex type.
- Expose exactly the ten approved operations and ten named trusted invocation functions. Do not add a transport, route, SDK, generated artifact, Convex entrypoint, universal executor, operation registry, arbitrary CRUD, repository/table API, or automatic publication path.
- Construct `ActorContext` only from trusted server authentication composition. Never accept actor IDs, roles, capabilities, claims, tokens, credentials, sessions, provider values, or equivalent authority as business DTO input.
- Leave transport/protocol, schema or IDL technology, generation direction, SDK/distribution, productive IdP, credential/session design, versioning policy, and consumer behavior explicitly open.
- Preserve Resource Master's existing exact deny-by-default authorization in `apps/backend/src/resource-master/application/authorization.ts` as the final capability check before catalog/repository work.

## TDD evidence contract

Every implementation work unit follows the same evidence order:

1. **RED:** add the focused failing test or controlled fixture first and record the intended failure before production implementation.
2. **GREEN:** implement the smallest behavior in the named files and record the focused passing result.
3. **TRIANGULATE:** verify the behavior through an independent negative, integration, type, serialization, or architecture check; prove the forbidden shortcut is absent.
4. **REFACTOR:** simplify names and duplication without changing the external meaning, then rerun the focused and impacted checks.

Each unit has a start state, finish state, verification boundary, and rollback boundary so it can be reviewed and reverted independently.

## Ordered work units

| Unit | Depends on | Review slice and concrete paths | Estimated authored lines |
| ------ | ------------ | --------------------------------- | -------------------------- |
| U1 | None | Closed external vocabulary and DTO ownership in `apps/backend/src/external-garfex-boundary/client-facing/contract.ts` with `apps/backend/tests/external-garfex-contract.test.ts` | 210–260 |
| U2a | U1 | Operation recognition and ten closed request validators in `client-facing/validation.ts` with focused adversarial request tests | 150–220 |
| U2b1 | U2a | Discovery, schema, options, and natural-units success validators in `client-facing/validation.ts` with focused containment tests | 180–260 |
| U2b2 | U2b1 | Resource, search, description, and mutation-result success validators in `client-facing/validation.ts` with focused containment tests | 190–280 |
| U2b3 | U2b1, U2b2 | Closed failure validation and metadata containment in `client-facing/validation.ts` with focused failure tests | 160–240 |
| U3 | U1, U2a | Trusted actor resolution in `trusted/identity.ts` with authentication short-circuit tests | 200–250 |
| U4 | U2a, U2b1, U2b2, U2b3, U3 | Safe internal-error normalization and output containment in `trusted/errors.ts` with sanitization tests | 250–310 |
| U5 | U1, U2a, U2b1, U2b2, U2b3, U4 | Field-by-field success projections in `trusted/projections.ts` with projection tests | 220–280 |
| U6a | U2b1, U2b2, U2b3, U3, U4, U5 | Four named taxonomy/schema/options/units discovery invocations in `trusted/read-operations.ts` with direct-mapping tests | 220–300 |
| U6b | U6a | Two named resource/description read invocations in `trusted/read-operations.ts` with direct-mapping tests | 130–190 |
| U7 | U6a, U6b | Named `searchResources` invocation and opaque pagination evidence in `trusted/read-operations.ts` with search tests | 200–250 |
| U8 | U4, U5, U6a, U6b, U7 | Three named mutation invocations in `trusted/mutation-operations.ts` with authorization/security tests | 280–350 |
| U9 | U1–U8 | Serialized compatibility fixture and parity test in `apps/backend/tests/fixtures/external-garfex-boundary/compatibility.json` and `apps/backend/tests/external-garfex-compatibility.test.ts` | 250–310 |
| U10 | U1–U9 | Seven architecture fitness rules, controlled fixtures, and architecture test assertions | 220–280 |
| U11 | U9, U10 | Canonical boundary documentation, linked docs, and executable documentation parity test | 260–330 |
| Final gate | U1–U11 | Repository-wide validation and diff/rollback inspection; no additional authored files | 0 |

## U1 — Close the external vocabulary and DTO ownership

**Start boundary:** No `external-garfex-boundary` source directory exists; existing Resource Master, auth, Convex, and architecture behavior is unchanged.

**Finish boundary:** `contract.ts` contains the exact closed operation/error vocabularies, all independent request/success/error types, and no imports; the foundational contract test proves the closed set.

**Verification boundary:** Only the contract test, backend typecheck, and a source-dependency inspection are required; no trusted invocation or transport exists yet.

**Rollback boundary:** Remove only `client-facing/contract.ts` and the U1-owned assertions in `apps/backend/tests/external-garfex-contract.test.ts`; do not revert Resource Master or auth files.

### RED

- [x] Add failing exact-set and type-shape tests in `apps/backend/tests/external-garfex-contract.test.ts` for the ten operation identifiers, eleven external error codes, uniqueness, and absence of an arbitrary message field. <!-- sdd-owner: implementation -->

### GREEN

- [x] Create `apps/backend/src/external-garfex-boundary/client-facing/contract.ts` with the independent operation/request/success maps, `ExternalAttributeValue`, closed discriminated error metadata, and `ExternalOutcome<K>`; keep the file dependency-free and do not export trusted types. <!-- sdd-owner: implementation -->

### TRIANGULATE

- [x] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-contract.test.ts` and `corepack pnpm --filter @garfex/backend typecheck`, then inspect `contract.ts` imports to prove no backend, Resource Master, auth, Convex, generated, persistence, or third-party dependency exists. <!-- sdd-owner: implementation -->

### REFACTOR

- [x] Refine `apps/backend/src/external-garfex-boundary/client-facing/contract.ts` with literal tuples, inferred unions, discriminated metadata variants, and exact-optional-property-safe definitions without changing the tested field set; rerun the U1 focused test and typecheck. <!-- sdd-owner: implementation -->

**Acceptance evidence:** The contract exposes exactly ten operations and eleven errors, accepts only reviewed business meanings, prevents illegal error-metadata combinations at compile time, and leaves newly added internal Resource Master methods private.

## U2a — Recognize operations and validate closed requests

**Start boundary:** U1's independent `contract.ts` and foundational contract tests pass; no accepted U2a request validator exists.

**Finish boundary:** `client-facing/validation.ts` exports operation recognition and ten named request validators; invalid requests never throw and produce stable invalid-request field issues.

**Verification boundary:** `apps/backend/tests/external-garfex-contract.test.ts` is the focused request-validation boundary; no Resource Master, actor resolver, success projector, or failure normalizer is needed.

**Rollback boundary:** Revert only the U2a request-validation implementation and request-test additions in `client-facing/validation.ts` and `apps/backend/tests/external-garfex-contract.test.ts`; preserve U1's contract types.

### RED

- [x] Extend `apps/backend/tests/external-garfex-contract.test.ts` with failing operation-recognition and request-validator cases for missing/mistyped/unknown fields, arrays and non-plain objects, authority/infrastructure forgery at top level and inside `attributes`, bounded limits/revisions, lifecycle/cursor rules, and nested quantities. <!-- sdd-owner: implementation -->

### GREEN

- [x] Implement `apps/backend/src/external-garfex-boundary/client-facing/validation.ts` with `parseExternalOperationIdentifier` and one named closed request validator for each of the ten operations; rebuild accepted values, preserve omitted search optionals, retain nullable opaque cursors, and return only stable external field paths/reasons. <!-- sdd-owner: implementation -->

### TRIANGULATE

- [x] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-contract.test.ts` against adversarial unknown keys and malformed nested request values, proving request validators fail closed without throwing, resolving identity, or invoking any Resource Master dependency. <!-- sdd-owner: implementation -->

### REFACTOR

- [x] Refactor only boundary-local request predicates in `apps/backend/src/external-garfex-boundary/client-facing/validation.ts` into readable multi-line functions, keep `limit` in 1–50 and revisions non-negative safe integers, and rerun the focused request tests plus backend typecheck without introducing a schema/IDL or generation dependency. <!-- sdd-owner: implementation -->

**Acceptance evidence:** The closed operation set and all ten untrusted request DTOs are runtime-validated, malformed requests stop before business work, accepted values are rebuilt, and validation details never contain rejected values or internal messages.

## U2b1 — Validate discovery/schema/options/units successes

**Depends on:** U2a.

**Start boundary:** U2a request recognition and all ten request validators pass; no accepted success validator exists.

**Finish boundary:** `client-facing/validation.ts` exports named success validators for taxonomy, effective schema, valid options, and natural units; each rebuilds only reviewed fields, rejects extras, and contains malformed output as metadata-free `INTERNAL_FAILURE`. Later resource/search/description/mutation and failure validators remain deferred.

**Verification boundary:** `apps/backend/tests/external-garfex-contract.test.ts` covers the four discovery success shapes, nested schema rules, extra-field rejection, fresh output rebuilding, hostile values, and contained failures; no Resource Master invocation is needed.

**Rollback boundary:** Revert only the U2b1 discovery success-validator implementation and focused test additions in `client-facing/validation.ts` and `apps/backend/tests/external-garfex-contract.test.ts`; preserve U1/U2a and leave U2b2/U2b3 absent.

### RED

- [x] Add failing focused cases for discovery, schema, options, and natural-units success shapes, nested containment, malformed values, and the deferred later-validator boundary. <!-- sdd-owner: implementation -->

### GREEN

- [x] Implement the four named discovery/schema/options/units success validators; rebuild accepted outputs, reject extra fields, and return only valid metadata-free `INTERNAL_FAILURE` for malformed projected successes. <!-- sdd-owner: implementation -->

### TRIANGULATE

- [x] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-contract.test.ts` against malformed, hostile, and null-prototype discovery values, proving output validators do not resolve identity or invoke Resource Master. <!-- sdd-owner: implementation -->

### REFACTOR

- [x] Keep output predicates readable and boundary-local, remove retained U2b2/U2b3 code and tests from this slice, and rerun the focused test, backend typecheck, and non-writing Biome checks without adding schema/IDL or generation dependencies. <!-- sdd-owner: implementation -->

**Acceptance evidence:** The discovery/schema/options/units portion of the original U2b acceptance is runtime-validated, extra fields are rejected, accepted values are rebuilt, and malformed output is contained without internal diagnostics.

## U2b2 — Validate resource/search/description and mutation-result successes

**Depends on:** U2b1.

**Start boundary:** U2b1 passes; no accepted resource, search, description, or mutation-result success validator exists.

**Finish boundary:** `client-facing/validation.ts` exports the six remaining named success validators for `getResource`, `searchResources`, `describeResource`, `createResource`, `updateNonIdentityData`, and `deactivateResource`; each rebuilds only reviewed fields, preserves opaque nullable pagination, rejects extras, and contains malformed output as metadata-free `INTERNAL_FAILURE`.

**Verification boundary:** Focused contract tests cover every remaining resource/search/description/mutation success shape, nested value/reference containment, extra internal/authority/platform fields, fresh rebuilding, and null/opaque cursor behavior; no Resource Master invocation is needed.

**Rollback boundary:** Revert only U2b2 success-validator implementation and tests; preserve U1/U2a/U2b1 and leave U2b3 failure validation absent.

### RED

- [x] Add failing focused cases for resource, search, description, and all three mutation-result success shapes, including nested attribute values, extra fields, fresh references, and opaque/null cursors. <!-- sdd-owner: implementation -->

### GREEN

- [x] Implement the six remaining named success validators; rebuild reviewed resource, summary, description, and mutation-result fields, preserve nullable opaque cursors, reject extras, and contain malformed output as `INTERNAL_FAILURE`. <!-- sdd-owner: implementation -->

### TRIANGULATE

- [x] Run the focused contract test against malformed resource/search/mutation results and serialization, proving no cursor structure, internal field, authority value, or Resource Master dependency crosses validation. <!-- sdd-owner: implementation -->

### REFACTOR

- [x] Consolidate only boundary-local resource/search output predicates, preserve all reviewed fields and fresh references, and rerun the focused test plus backend typecheck without introducing a schema/IDL or generation dependency. <!-- sdd-owner: implementation -->

**Acceptance evidence:** The remaining six projected success shapes complete the original ten-success-validator requirement, reject unsafe extras, rebuild accepted outputs, preserve opaque pagination, and contain malformed output without internal diagnostics.

## U2b3 — Validate closed failures and containment

**Depends on:** U2b1 and U2b2.

**Start boundary:** U2b1 and U2b2 success validators pass; no accepted closed failure validator exists.

**Finish boundary:** `client-facing/validation.ts` exports `validateExternalFailure`, validates all eleven external error codes and their code-specific metadata allowlists, rebuilds accepted failures, and contains malformed failures as metadata-free `INTERNAL_FAILURE`.

**Verification boundary:** Focused contract tests cover every closed failure-metadata variant, unknown codes, extra fields, malformed field issues, invalid duplicate/conflict metadata, thrown accessors, fresh rebuilding, and serialized containment; no Resource Master invocation is needed.

**Rollback boundary:** Revert only U2b3 failure-validator implementation and tests; preserve U1/U2a/U2b1/U2b2 success validation.

### RED

- [x] Add failing focused cases for all eleven failure codes, each allowlisted metadata form, unsafe metadata, unknown codes, malformed failures, and diagnostic containment. <!-- sdd-owner: implementation -->

### GREEN

- [x] Implement `validateExternalFailure` with the closed error metadata model, fresh rebuilding, extra-field rejection, and metadata-free `INTERNAL_FAILURE` fallback for malformed failure values. <!-- sdd-owner: implementation -->

### TRIANGULATE

- [x] Run the focused contract test against malformed failures and `JSON.stringify`, proving no internal messages, stacks, provider data, authority values, or platform details are released. <!-- sdd-owner: implementation -->

### REFACTOR

- [x] Consolidate only boundary-local failure predicates, preserve the eleven-code and allowlisted metadata sets, and rerun focused output/failure tests plus backend typecheck without introducing a schema/IDL or generation dependency. <!-- sdd-owner: implementation -->

**Acceptance evidence:** The closed failure model completes the original U2b acceptance: all normalized errors are runtime-validated, only reviewed metadata survives, accepted failures are rebuilt, and malformed failure/output values contain to `INTERNAL_FAILURE` without internal diagnostics.

## U3 — Build the trusted server actor boundary

**Start boundary:** U1/U2a contract and request-validator tests pass; the existing provider-neutral auth composition in `apps/backend/src/auth/composition.ts` and `apps/backend/src/auth/identity-adapter.ts` remains the only authentication source.

**Finish boundary:** `trusted/identity.ts` exposes a server-only `TrustedActorResolver` and an adapter that resolves identity from trusted composition, clones capabilities, and returns `null` for absent or failing authentication.

**Verification boundary:** Authentication tests cover resolver behavior without any transport and existing `apps/backend/tests/auth-boundary.test.ts` remains green.

**Rollback boundary:** Remove `apps/backend/src/external-garfex-boundary/trusted/identity.ts` and U3-owned security tests; do not alter existing auth composition behavior unless a separately reviewed compatibility-preserving refactor is proven necessary.

### RED

- [x] Add failing authentication cases in `apps/backend/tests/external-garfex-security.test.ts` for null composition, missing identity, provider exception, server-created actor separation, copied capability sets, and proof that no raw business request is accepted by the resolver. <!-- sdd-owner: implementation -->

### GREEN

- [x] Implement `apps/backend/src/external-garfex-boundary/trusted/identity.ts` with `TrustedActorResolver.resolveActor(): Promise<ActorContext | null>` and `createTrustedActorResolver`, importing auth and Resource Master types only at this trusted edge and never reading client-facing DTO fields. <!-- sdd-owner: implementation -->

### TRIANGULATE

- [x] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-security.test.ts tests/auth-boundary.test.ts` and backend typecheck, proving provider failures become `null`, capability mutation of the source composition cannot mutate the actor, and no client-facing file imports identity types. <!-- sdd-owner: implementation -->

### REFACTOR

- [x] Refine `apps/backend/src/external-garfex-boundary/trusted/identity.ts` so the resolver has no operation selector, request parameter, capability pre-check, or transport concern; rerun U3 focused and existing auth tests. <!-- sdd-owner: implementation -->

**Acceptance evidence:** Only trusted server composition can create the actor, authority-like business input cannot supplement it, and authentication failure has a safe short-circuit value for later invocation units.

## U4 — Normalize errors and contain invalid outcomes

**Start boundary:** U2a request validators, U2b1/U2b2 success validators, U2b3 failure validation, and U3 trusted actor resolver pass; no named business operation invokes Resource Master yet.

**Finish boundary:** `trusted/errors.ts` provides exhaustive safe `ResourceError` normalization, diagnostics containment, and generic fallback behavior for unknown/throwing/malformed outcomes.

**Verification boundary:** Security tests exercise all internal error codes, metadata allowlists, thrown exceptions, invalid output, and diagnostics failures; Resource Master authorization behavior is not replaced.

**Rollback boundary:** Remove `apps/backend/src/external-garfex-boundary/trusted/errors.ts` and U4-owned security assertions only; leave contract, validators, and identity intact.

### RED

- [x] Add failing cases in `apps/backend/tests/external-garfex-security.test.ts` for every internal `ResourceErrorCode`, valid/invalid `existingResourceId`, valid/invalid `currentRevision`, unknown runtime codes, thrown provider/application errors, secret-bearing messages/details/stacks, malformed failures, and a diagnostics sink that throws. <!-- sdd-owner: implementation -->

### GREEN

- [x] Implement `apps/backend/src/external-garfex-boundary/trusted/errors.ts` with `ExternalBoundaryDiagnostics`, the exact eleven-code mapping, safe allowlisted metadata, catalog-state coarsening, metadata-free `INTERNAL_FAILURE`, authentication exception handling, and guarded server-only diagnostics; import Resource Master only through `apps/backend/src/resource-master/public.ts`. <!-- sdd-owner: implementation -->

### TRIANGULATE

- [x] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-security.test.ts` and backend typecheck, serialize every normalized failure with `JSON.stringify`, and prove no provider, credential, actor, capability, persistence, Convex, catalog, configuration, message, or stack detail appears. <!-- sdd-owner: implementation -->

### REFACTOR

- [x] Replace any open-ended error branching in `trusted/errors.ts` with an exhaustive switch/`never` check and boundary-local helpers that cannot let diagnostics failure alter the outward result; rerun U4 security tests. <!-- sdd-owner: implementation -->

**Acceptance evidence:** Every internal semantic maps to the specified stable external code, only duplicate IDs/current revisions/field issues can carry metadata, and all unknown or unsafe failures fail closed.

## U5 — Project successes field by field

**Start boundary:** Independent contract, U2a request validators, all U2b1/U2b2 success validators, U2b3 failure validation, and error normalization pass; no operation wrapper depends on a structural pass-through projector.

**Finish boundary:** `trusted/projections.ts` contains named projectors for taxonomy, schema, options, units, resources, search, description, and named mutation result wrappers; every output is freshly allocated and contains only reviewed fields.

**Verification boundary:** Projection tests use internal-shaped stubs with extra fields and shared nested references, then validate the projected values through U2 validators.

**Rollback boundary:** Remove `apps/backend/src/external-garfex-boundary/trusted/projections.ts` and U5-owned projection tests; no application or infrastructure behavior changes.

### RED

- [x] Add failing projection cases in `apps/backend/tests/external-garfex-operations.test.ts` for every reviewed success family, injected internal/authority/platform fields, nested reference identity, resource attribute quantities, operation-specific mutation wrappers, and `undefined` search continuation becoming `null`. <!-- sdd-owner: implementation -->

### GREEN

- [x] Implement `apps/backend/src/external-garfex-boundary/trusted/projections.ts` with explicit field-by-field copying for taxonomy, effective schema/rules, options, natural units, resources, search summaries/cursors, and descriptions, using a private resource copier only behind named create/update/deactivate wrappers. <!-- sdd-owner: implementation -->

### TRIANGULATE

- [x] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-operations.test.ts` and backend typecheck with U2 success validators, proving extra internal fields are absent, nested arrays/objects are new references, and no object spread or source reference is returned. <!-- sdd-owner: implementation -->

### REFACTOR

- [x] Deduplicate only private projection mechanics in `apps/backend/src/external-garfex-boundary/trusted/projections.ts`; preserve named projector evidence and rerun projection tests plus contract validation tests without widening any external field. <!-- sdd-owner: implementation -->

**Acceptance evidence:** Every listed success field survives with reviewed business meaning, every unlisted field is dropped, and projection ownership prevents internal object identity or future fields from leaking.

## U6a — Add four explicit discovery/read invocations

**Depends on:** U2b1, U2b2, U2b3, U3, U4, and U5.

**Start boundary:** The discovery/schema/options/units validators, failure validation, trusted actor resolver, error normalization, and projections pass; no accepted U6a invocation exists. Any retained U6b `getResource`/`describeResource` code or tests from the timed-out apply are unaccepted remediation input and must be removed from this slice.

**Finish boundary:** `trusted/read-operations.ts` exposes only named wrappers for `getTaxonomy`, `getEffectiveResourceSchema`, `getValidOptions`, and `getNaturalUnits`. Each named function validates first, resolves a trusted actor, calls its same-named Resource Master public method exactly once, normalizes or projects the result, validates the outward outcome, and contains exceptions.

**Verification boundary:** Mapping tests use spies/stubs to verify validator-before-auth ordering, actor-first direct calls, field-by-field request mapping, exactly-one same-named method calls, normalized errors, validated projections, and no unrelated method, catalog, repository, Convex, or transport call. `getResource` and `describeResource` remain deferred to U6b.

**Rollback boundary:** Remove only U6a additions from `trusted/read-operations.ts` and the U6a-owned assertions in `external-garfex-operations.test.ts`; retain shared contract, identity, error, and projection units, and leave U6b absent.

### RED

- [x] Add failing table-driven cases in `apps/backend/tests/external-garfex-operations.test.ts` for the four named discovery/read wrappers, including validator-before-auth ordering, actor-first arguments, field-by-field request mapping, exactly-one same-named method call, projection/error validation, exception containment, and no-call malformed requests; do not add U6b `getResource`/`describeResource` cases. <!-- sdd-owner: implementation -->

### GREEN

- [x] Implement the four named functions in `apps/backend/src/external-garfex-boundary/trusted/read-operations.ts` with the fixed per-function sequence of request validation, trusted actor resolution, `UNAUTHENTICATED` short-circuit, direct same-named `ResourceMaster` public call exactly once, normalized error or explicit projection, outward validation, and exception containment; use no exported operation selector, callable map, registry, generic executor, or edge capability check. <!-- sdd-owner: implementation -->

### TRIANGULATE

- [x] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-operations.test.ts` plus the relevant cases in `apps/backend/tests/resource-master-authorization.test.ts`, proving incapable actors reach the real module authorization and forbidden work stops before catalog/repository access for the four U6a operations. <!-- sdd-owner: implementation -->

### REFACTOR

- [x] Refine only private authentication/exception-containment helpers in `trusted/read-operations.ts`; helpers must not accept an operation identifier or choose a method. Rerun U6a read mapping, security/authorization, backend typecheck, and Biome checks without retaining U6b code or tests. <!-- sdd-owner: implementation -->

**Acceptance evidence:** The four U6a read capabilities are explicitly callable, each maps one-to-one to its real application contract with the fixed safety sequence, malformed requests short-circuit, outward results are validated, and Resource Master remains final authorization authority.

## U6b — Add get-resource and describe-resource invocations

**Depends on:** U6a.

**Start boundary:** U6a named discovery/read wrappers and shared projection/error behavior pass; no accepted `getResource` or `describeResource` invocation exists.

**Finish boundary:** `trusted/read-operations.ts` exposes the named wrappers `invokeExternalGetResource` and `invokeExternalDescribeResource`. Each validates first, resolves a trusted actor, calls its same-named Resource Master public method exactly once, normalizes or projects the result, validates the outward outcome, and contains exceptions.

**Verification boundary:** Mapping tests use spies/stubs to verify actor-first direct calls, exact resource-ID field mapping, exactly-one same-named calls, normalized errors, validated resource/description projections, malformed-request no-call behavior, and no unrelated method, catalog, repository, Convex, or transport call.

**Rollback boundary:** Remove only U6b additions from `trusted/read-operations.ts` and the U6b-owned assertions in `external-garfex-operations.test.ts`; retain U6a and all shared units.

### RED

- [x] Add failing table-driven cases in `apps/backend/tests/external-garfex-operations.test.ts` for `getResource` and `describeResource`, including validator-before-auth ordering, actor-first arguments, exact `resourceId` mapping, exactly-one same-named method calls, projection/error validation, exception containment, and no-call malformed requests. <!-- sdd-owner: implementation -->

### GREEN

- [x] Implement `invokeExternalGetResource` and `invokeExternalDescribeResource` in `apps/backend/src/external-garfex-boundary/trusted/read-operations.ts` with the same fixed validation, trusted actor, unauthenticated short-circuit, direct named call, normalization/projection, outward validation, and exception-containment sequence; add no selector, map, registry, generic executor, or edge authorization. <!-- sdd-owner: implementation -->

### TRIANGULATE

- [x] Run the focused operation tests plus the relevant `apps/backend/tests/resource-master-authorization.test.ts` cases, proving incapable actors reach real module authorization and forbidden work stops before catalog/repository access for both U6b operations. <!-- sdd-owner: implementation -->

### REFACTOR

- [x] Refine only boundary-local helpers needed by the two named U6b functions, preserving direct same-named calls and the U6a boundary; rerun U6a/U6b operation tests, security/authorization tests, backend typecheck, and Biome checks. <!-- sdd-owner: implementation -->

**Acceptance evidence:** `getResource` and `describeResource` are explicitly callable, each maps one-to-one to its real application contract with the fixed safety sequence, malformed requests short-circuit, outward results are validated, and Resource Master remains final authorization authority.

## U7 — Add search with opaque bounded pagination

**Start boundary:** U6a and U6b named read wrappers and shared projection/error behavior pass; `searchResources` is the only approved read operation not yet callable.

**Finish boundary:** `trusted/read-operations.ts` contains the seventh named wrapper `invokeExternalSearchResources` with conditional optional mapping and opaque cursor projection.

**Verification boundary:** Search tests cover first page, continuation page, final page, omitted optionals, invalid pagination, and direct-call exclusivity.

**Rollback boundary:** Revert only the search wrapper and U7 search assertions in `trusted/read-operations.ts` and `external-garfex-operations.test.ts`; leave the six discovery reads intact.

### RED

- [x] Add failing search cases in `apps/backend/tests/external-garfex-operations.test.ts` for omitted lifecycle/limit/cursor, explicit nullable cursor, bounded limits, same cursor round-trip, `undefined` continuation to `null`, malformed cursor/limit/lifecycle no-call behavior, and a spy proving only `searchResources` runs once. <!-- sdd-owner: implementation -->

### GREEN

- [x] Implement `invokeExternalSearchResources` in `apps/backend/src/external-garfex-boundary/trusted/read-operations.ts`, rebuilding `terms` and only supplied optionals, preserving cursor opacity, calling `resourceMaster.searchResources(actor, mappedInput)`, projecting the page, and validating the complete outcome. <!-- sdd-owner: implementation -->

### TRIANGULATE

- [x] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-operations.test.ts` and the focused Resource Master pagination tests, proving the boundary never decodes, constructs, or exposes cursor structure and never turns omitted fields into explicit `undefined` properties. <!-- sdd-owner: implementation -->

### REFACTOR

- [x] Keep search-specific option construction explicit in `trusted/read-operations.ts` and rerun U7 search tests, U6a/U6b read tests, and backend typecheck without adding a transport or cursor helper tied to persistence/Convex. <!-- sdd-owner: implementation -->

**Acceptance evidence:** Search remains bounded, cursors are nullable and opaque, optional defaults remain Resource Master-owned, and invalid pagination cannot reach application or persistence work.

## U8 — Add the three explicit mutation invocations

**Start boundary:** All seven read wrappers, projections, identity, and error handling pass; `trusted/mutation-operations.ts` does not expose mutation behavior.

**Finish boundary:** `trusted/mutation-operations.ts` exposes only `invokeExternalCreateResource`, `invokeExternalUpdateNonIdentityData`, and `invokeExternalDeactivateResource` with exact field-by-field mapping and named projections.

**Verification boundary:** Operation and security tests prove server actor separation, rebuilt attributes, exact revision mapping, direct same-named calls, and module-owned capability enforcement.

**Rollback boundary:** Remove `trusted/mutation-operations.ts` and U8-owned test additions; do not modify Resource Master mutation rules or Convex persistence.

### RED

- [x] Add failing mutation cases in `apps/backend/tests/external-garfex-operations.test.ts` and `apps/backend/tests/external-garfex-security.test.ts` for rebuilt create attributes, resource ID/revision/unit mapping, exactly-one direct method calls, forged authority rejection, and each mutation's missing-neighbor-capability forbidden path with downstream spies untouched. <!-- sdd-owner: implementation -->

### GREEN

- [x] Implement the three named functions in `apps/backend/src/external-garfex-boundary/trusted/mutation-operations.ts`, validating before authentication, rebuilding all internal inputs, passing the trusted actor separately, calling only the matching public method, and using named success/error projection paths. <!-- sdd-owner: implementation -->

### TRIANGULATE

- [x] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-operations.test.ts external-garfex-security.test.ts` and the relevant `apps/backend/tests/resource-master-authorization.test.ts` cases, proving no edge capability table duplicates or replaces `resource-master/application/authorization.ts`. <!-- sdd-owner: implementation -->

### REFACTOR

- [x] Remove only accidental duplication between mutation wrappers in `apps/backend/src/external-garfex-boundary/trusted/mutation-operations.ts` through private boundary-local helpers, retain three named direct calls, and rerun operation/security tests plus backend typecheck. <!-- sdd-owner: implementation -->

**Acceptance evidence:** Create, update, and deactivate expose only the approved business inputs, invoke the real corresponding methods once, preserve exact module capabilities, and never publish a universal executor or CRUD surface.

## U9 — Freeze serialized compatibility and operation parity

**Start boundary:** All ten named operations, validators, projections, and error normalization pass; no serialized compatibility fixture exists.

**Finish boundary:** `apps/backend/tests/fixtures/external-garfex-boundary/compatibility.json` contains one valid request/success and applicable failure for every operation, the complete eleven-code metadata matrix, and opaque cursor examples; `external-garfex-compatibility.test.ts` validates and deep-compares serialized outcomes.

**Verification boundary:** The fixture test loads JSON as `unknown`, invokes fixture-backed Resource Master stubs, validates requests/outcomes, serializes with `JSON.stringify`, and detects added/removed/renamed fields or codes.

**Rollback boundary:** Remove only the compatibility JSON and `apps/backend/tests/external-garfex-compatibility.test.ts`; no production boundary or existing tests are reverted.

### RED

- [x] Add the failing fixture-parity harness in `apps/backend/tests/external-garfex-compatibility.test.ts` before the fixture exists, asserting ten operation entries, request/success/failure validation, eleven error metadata forms, and serialized deep equality. <!-- sdd-owner: implementation -->

### GREEN

- [x] Add `apps/backend/tests/fixtures/external-garfex-boundary/compatibility.json` and complete the parity test with representative safe values, applicable failures, null/opaque cursor cases, validator-backed fixture loading, and no internal messages, stacks, provider data, Convex IDs, persistence records, or deployment/catalog-admin values. <!-- sdd-owner: implementation -->

### TRIANGULATE

- [x] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-compatibility.test.ts` and the full backend test suite, proving JSON round-trip identity, one-to-one operation coverage, allowlisted metadata, and drift failure when fixture-visible fields are changed without an intentional fixture update. <!-- sdd-owner: implementation -->

### REFACTOR

- [x] Make traversal deterministic in `apps/backend/tests/external-garfex-compatibility.test.ts` and keep `apps/backend/tests/fixtures/external-garfex-boundary/compatibility.json` as repository test evidence only; rerun compatibility, operation, security, and contract tests without selecting a wire format or generation direction. <!-- sdd-owner: implementation -->

**Acceptance evidence:** Every operation has representative serialized success/failure evidence, all eleven errors and metadata rules are frozen, and compatibility changes become reviewable rather than silently inherited from internal types.

## U10 — Enforce architecture fitness with controlled fixtures

**Start boundary:** External source, trusted operations, fixtures, and tests exist; `tooling/architecture/check.mjs` has no rules specific to this boundary.

**Finish boundary:** The checker enforces `external-contract-independent`, `external-contract-no-authority`, `external-contract-no-platform`, `external-trusted-edge-public-only`, `external-no-generic-business-executor`, `external-no-automatic-derivation`, and `external-no-transport`; tests and fixtures prove every rule.

**Verification boundary:** `tooling/tests/architecture.test.ts` covers valid fixtures and one focused violating fixture per rule, while existing architecture fixtures remain green.

**Rollback boundary:** Revert only the named checker rules, U10 assertions, and `tooling/architecture-fixtures/{valid,violations}/external-garfex-boundary/` files; do not revert application behavior.

### RED

- [x] Extend `tooling/tests/architecture.test.ts` with failing expectations for all seven rule names, a valid independent-contract fixture, a valid trusted-public-edge fixture, and these violations: `internal-import.ts`, `authority-field.ts`, `platform-leak.ts`, `trusted-internal-import.ts`, `generic-executor.ts`, `automatic-derivation.ts`, and `transport-import.ts`. <!-- sdd-owner: implementation -->

### GREEN

- [x] Update `tooling/architecture/check.mjs` with narrowly scoped import/syntax checks and add the valid/violating fixtures under `tooling/architecture-fixtures/valid/external-garfex-boundary/` and `tooling/architecture-fixtures/violations/external-garfex-boundary/`; keep trusted imports limited to public Resource Master/auth composition and reject Convex, persistence, deployment, transport, derivation, and generic business publication. <!-- sdd-owner: implementation -->

### TRIANGULATE

- [x] Run `corepack pnpm test:architecture` and inspect the checker output for every named fixture, proving existing `external-client-boundary` protections remain green and the new rules do not rely on broad repository-wide keyword bans. <!-- sdd-owner: implementation -->

### REFACTOR

- [x] Refine rule diagnostics and fixture names in `tooling/architecture/check.mjs` and `tooling/tests/architecture.test.ts` so each violation fails for its intended rule only; rerun architecture tests and full typecheck. <!-- sdd-owner: implementation -->

**Acceptance evidence:** Architecture governance prevents internal/auth/platform leakage, automatic publication, generic execution, and transport introduction while accepting only the deliberately independent external contract and trusted public edge.

## U11 — Publish canonical boundary documentation and parity

**Start boundary:** Compatibility fixtures and architecture rules pass; no canonical GARFEX boundary document or executable documentation parity test exists.

**Finish boundary:** `docs/external-garfex-boundary.md` is canonical, three linked architecture/auth/client-boundary documents are updated, and `apps/backend/tests/external-garfex-documentation-parity.test.ts` compares machine-readable operation/mapping/error metadata tables with executable constants and fixtures.

**Verification boundary:** Documentation parity, architecture tests, and focused compatibility tests pass; documentation clearly records what remains undecided.

**Rollback boundary:** Revert only `docs/external-garfex-boundary.md`, the three linked documentation edits, and `external-garfex-documentation-parity.test.ts`; retain executable boundary code and fixtures.

### RED

- [x] Add the failing parser/assertions in `apps/backend/tests/external-garfex-documentation-parity.test.ts` for the exact ten operation rows, direct mappings, eleven error codes, allowlisted metadata names, and required non-decision statements before the canonical document is complete. <!-- sdd-owner: implementation -->

### GREEN

- [x] Create `docs/external-garfex-boundary.md` with the lead distinction `External Client Contract != Resource Master Public Application Contract`, exact operation/mapping/request/success/error tables, trusted identity flow, final module authorization, compatibility ownership, fixture/check commands, Convex isolation, and transport/IdP/schema/SDK/consumer non-decisions; update `docs/architecture.md`, `docs/external-client-boundary.md`, and `docs/auth-boundary.md` with links and dependency arrows only. <!-- sdd-owner: implementation -->

### TRIANGULATE

- [x] Run `corepack pnpm --filter @garfex/backend test -- external-garfex-documentation-parity.test.ts external-garfex-compatibility.test.ts` and `corepack pnpm test:architecture`, proving documented identifiers, direct mappings, metadata, and non-decisions agree without presenting JSON fixtures as a selected transport. <!-- sdd-owner: implementation -->

### REFACTOR

- [x] Apply progressive disclosure and review-oriented tables to `docs/external-garfex-boundary.md`, `docs/architecture.md`, `docs/external-client-boundary.md`, and `docs/auth-boundary.md`, remove duplicated contradictory semantics, preserve repository independence and deferred packaging, and rerun documentation parity plus the relevant focused tests. <!-- sdd-owner: implementation -->

**Acceptance evidence:** GARFEX is identified as compatibility owner, the external and module contracts are visibly distinct, all ten mappings/errors agree with executable sources, Convex remains infrastructure, and no open technology decision is silently selected.

## Final repository validation — apply-owned, no new files

Run this gate only after U1–U11 have landed in the approved chain or the parent has recorded `delivery strategy: exception-ok` with explicit `size:exception`.

- [x] Run the strict repository test command `corepack pnpm test` and record the exact Vitest result, including coverage completion. <!-- sdd-owner: implementation -->
- [x] Run `corepack pnpm --filter @garfex/backend test`, `corepack pnpm --filter @garfex/backend typecheck`, `corepack pnpm test:architecture`, and `corepack pnpm build`; record each exact result and any unexecuted check. <!-- sdd-owner: implementation -->
- [x] Run `corepack pnpm check` and inspect `git diff --stat` plus `git diff --numstat` for the selected work unit/PR, confirming authored additions plus deletions stay within 400 lines per slice and no transport, SDK, productive IdP, Convex exposure, universal executor, or internal contract publication slipped in. <!-- sdd-owner: implementation -->
- [x] Verify rollback boundaries against `apps/backend/src/resource-master/`, `apps/backend/src/auth/`, `apps/backend/convex/`, and persistence/infrastructure files, confirming the change can be disabled without weakening Resource Master authorization or changing Convex persistence behavior. <!-- sdd-owner: implementation -->

## Parent-only lifecycle gates

Receipt-driven review lifecycle is not part of this task plan: SDD phases do not start or reuse bounded reviews or mint review receipts. Ordinary repository verification and reviewer workload protection remain in force.

- [x] Record the selected delivery path for the eleven work units: `delivery strategy: ask-on-risk` resolved as chained delivery with `chain strategy: feature-branch-chain`; no `size:exception` is authorized. <!-- sdd-owner: parent -->
- [x] After the final validation gate, confirm deviations and unexecuted checks are recorded for the SDD archive and close the lifecycle only if the forbidden-scope guardrails remain true. <!-- sdd-owner: parent -->
