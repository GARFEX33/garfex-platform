# Establish a safe external GARFEX boundary for Resource Master

## Decision

GARFEX will own a transport-neutral external client contract for exactly ten Resource Master business operations. This contract is distinct from the module's public application contract and will be connected to it only through a trusted backend edge with explicit request, result, and error mappings.

```text
External Client Contract != Module Public Application Contract

untrusted request
  -> external request validation
  -> trusted GARFEX authentication and ActorContext construction
  -> explicit one-operation mapping
  -> Resource Master deny-by-default authorization
  -> explicit safe result/error projection
  -> external response validation
```

The boundary makes Resource Master usable by independent clients without making backend internals, authority inputs, Convex infrastructure, or future module operations public by accident.

## Intent and desired outcome

Independent clients need stable Resource Master capabilities, but the current actor-first TypeScript contract is intended for trusted in-process composition. Publishing it would expose trusted authorization concepts and couple clients to internal implementation evolution.

After this change:

- clients can express the ten approved Resource Master workflows using client-safe business inputs and outcomes;
- authentication and authority remain exclusively server-controlled;
- Resource Master remains the final authorization authority for every operation;
- external compatibility is deliberate, reviewable, and protected against silent drift;
- transport and delivery technology can be selected later without redefining business semantics.

## Scope

The external operation set is closed and contains exactly these semantic operations:

| External capability | Resource Master operation | Final capability check |
| --- | --- | --- |
| Read taxonomy | `getTaxonomy` | `resource:read` |
| Read effective resource schema | `getEffectiveResourceSchema` | `resource:read` |
| Read valid options | `getValidOptions` | `resource:read` |
| Read natural units | `getNaturalUnits` | `resource:read` |
| Get resource | `getResource` | `resource:read` |
| Search resources | `searchResources` | `resource:read` |
| Describe resource | `describeResource` | `resource:read` |
| Create resource | `createResource` | `resource:create` |
| Update non-identity data | `updateNonIdentityData` | `resource:update-non-identity` |
| Deactivate resource | `deactivateResource` | `resource:deactivate` |

The implementation scope includes independently owned external request/result/error meanings, closed external inputs, exhaustive one-to-one operation mappings, explicit result projections, trusted edge composition, drift checks, compatibility fixtures, architecture rules, tests, and boundary documentation.

Semantic correspondence does not require preserving internal TypeScript signatures or exposing every internal field. A newly added Resource Master operation remains unavailable externally until separately reviewed and added to the closed set.

## Trust and authorization rules

- `ActorContext`, `actorId`, roles, capabilities, provider claims, tokens, session authority, and equivalent authority-bearing fields are never external business input.
- A trusted GARFEX edge authenticates the caller and constructs `ActorContext` server-side. Any transport authentication metadata remains separate from business DTOs.
- Forged authority-like payload fields are rejected by closed input validation and can never affect the constructed actor.
- The edge invokes only the real Resource Master public application contract; it does not bypass, duplicate, or replace that contract with repository, catalog, persistence, or Convex calls.
- Resource Master retains the final exact, deny-by-default authorization check before catalog or repository work. Edge authentication is necessary but not sufficient authorization.
- Unknown external operations, unknown internal mappings, and unsupported capability mappings fail closed.

## Contract and mapping rules

1. The External Client Contract is independently defined and must not import, re-export, structurally pass through, or be mechanically generated from `apps/backend/src/resource-master/public.ts`.
2. Every approved external operation has a named, explicit mapper to one Resource Master application operation. No generic `execute(operation, payload)`, operation registry, arbitrary CRUD, or automatic module publication is introduced.
3. External DTOs contain only reviewed business values. Internal domain, application, authentication, infrastructure, generated, persistence, and deployment types do not cross the boundary.
4. Success values are projected field by field rather than returned by reference or structural pass-through.
5. Errors are projected through a closed normalized model; thrown exceptions and provider, persistence, catalog, Convex, stack, and configuration details are never passed through.
6. Request and response semantics remain independent of protocol framing, status codes, serialization format, and client tooling.

## Safe normalized error semantics

The external contract will define stable machine-readable error meanings in these transport-neutral groups:

| External meaning | Internal source semantics | Safe default |
| --- | --- | --- |
| Authentication required | `UNAUTHENTICATED` or trusted-edge authentication failure | Generic message; no provider or credential detail |
| Permission denied | `FORBIDDEN` | Generic message; no required capability, role, or protected-resource detail |
| Invalid request | `INVALID_ARGUMENT`, `INVALID_REFERENCE`, `VALIDATION` | Stable corrective meaning; only reviewed field-level detail |
| Resource not found | `NOT_FOUND` | Generic meaning; concealment policy remains open |
| Duplicate resource | `DUPLICATE` | Stable meaning; identifiers disclosed only by explicit policy |
| Revision conflict | `CONFLICT` | Stable retry/correction meaning; current revision disclosed only by explicit policy |
| Invalid lifecycle transition | `INVALID_LIFECYCLE` | Stable corrective meaning without internal state diagnostics |
| Service unavailable | `RESOURCE_CATALOG_UNAVAILABLE`, `RESOURCE_CATALOG_UNINITIALIZED` | Retry-neutral generic message; no deployment/catalog detail |
| Internal failure | `INTEGRITY`, `INTERNAL`, `RESOURCE_CATALOG_INVALID`, unknown failures | Generic message and fail closed; log diagnostic detail only server-side |

Internal error messages are not compatibility commitments. External responses use the minimum safe information by default. Disclosure of structured validation detail, an existing resource identifier, current revision, catalog distinctions, or protected existence requires an explicit reviewed decision and tests. Transport-specific encodings are deferred.

## Product and architecture impact

| Area | Impact |
| --- | --- |
| External users | Gain ten stable Resource Master workflows without receiving trusted authorization controls. |
| Resource Master | Domain behavior and final authorization remain unchanged; its application contract is invoked as designed. |
| GARFEX backend | Owns authentication composition, actor construction, mapping, projection, sanitization, and compatibility. |
| Convex | Remains an infrastructure/platform adapter and is neither the contract source nor a universal business API. |
| Architecture governance | Existing client-facing restrictions are retained and extended to prevent backend, auth, generated, persistence, and Convex leakage. |
| Operations/support | Server diagnostics remain internal; client-visible errors become stable and explainable without leaking implementation detail. |
| Future consumers | No consumer implementation or workflow is assumed; later integrations depend on the external semantics rather than backend source. |

## Compatibility ownership

GARFEX owns the external contract and all compatibility decisions. Operation identifiers, accepted business inputs, projected success fields, normalized error meanings, and any approved corrective metadata are external compatibility surface. Changes to that surface require explicit review, representative serialized fixtures, mapping parity checks, and documented migration intent.

Internal Resource Master or Convex changes do not automatically change the external contract. Internal additions stay private; incompatible internal changes must be absorbed by the mapper or trigger a separately approved external compatibility change. The version identifier, compatibility window, deprecation policy, artifact location, and distribution process remain open.

## Non-goals

This change does not:

- select HTTP, RPC, Convex-mediated access, or any other transport/protocol;
- select a schema/IDL technology, generation tool or direction, SDK/client generation, artifact packaging, hosting, registry, or distribution mechanism;
- select a productive identity provider, credential/session mechanism, token validation scheme, provisioning model, or machine identity design;
- inspect, model, or modify any consumer implementation;
- publish `catalog:admin`, catalog installers/readers, bootstrap/deployment APIs, repositories, persistence documents, generated Convex APIs, or database identifiers;
- expose arbitrary CRUD, tables, generic repository methods, a generic operation executor, or a universal business API;
- redesign Resource Master domain behavior, capability policy, lifecycle rules, or identity rules;
- make `ActorContext`, actors, roles, capabilities, claims, or authentication material client-supplied business data.

## Risks and controls

| Risk | Control |
| --- | --- |
| Internal application contract becomes an accidental external dependency | Independent DTO ownership plus architecture checks against imports, re-exports, and generated derivation. |
| Client-supplied authority influences behavior | Closed schemas, negative forgery tests, and server-only actor construction. |
| Edge authorization diverges from module authorization | Keep exact Resource Master deny-by-default enforcement as final authority and test that forbidden work stops before data access. |
| New internal operations become public silently | Closed ten-operation allowlist, exhaustive mapping, and unknown-operation rejection. |
| DTO, result, or error mappings drift | Per-operation contract tests, representative compatibility fixtures, response validation, and one canonical mapping table. |
| Sensitive diagnostics or protected existence leaks | Minimum-safe error projection, explicit disclosure policy, and sanitization tests. |
| Convex becomes the public business API | Reject Convex/generated/platform types in contract sources and artifacts; use it only as infrastructure. |
| External fields create unnecessary permanent commitments | Field-by-field response review and no structural pass-through. |

## Rollback and containment

Until a transport is selected and enabled, this boundary creates no external network reachability. During implementation, mappings can remain unexposed behind the trusted backend composition point. If a defect is found after exposure, GARFEX can disable the edge route or operation mapping while leaving Resource Master and Convex persistence behavior intact. Rollback must not weaken Resource Master authorization, accept client authority fields, or silently repurpose an existing compatibility meaning.

## Acceptance criteria

- [ ] A canonical external contract defines exactly the ten listed operation meanings and rejects unknown operations.
- [ ] External contract source and artifacts import or expose no Resource Master internal types, `ActorContext`, actor identifiers, roles, capabilities, claims, auth internals, Convex/generated types, persistence records, or deployment/catalog administration concepts.
- [ ] Each operation has an explicit request mapper, separately supplied server-created actor, exact call to the real Resource Master public application operation, and explicit success/error projection.
- [ ] Trusted-edge authentication failure prevents Resource Master invocation; forged authority-like business fields are rejected or proven inert.
- [ ] Resource Master still performs its existing exact deny-by-default capability check, and forbidden work reaches no catalog or repository access.
- [ ] Normalized errors use closed safe semantics; exceptions and provider, persistence, catalog, Convex, stack, and configuration diagnostics cannot leak.
- [ ] Operation parity, all ten mappers, projections, malformed inputs, unknown operations, authority forgery, authorization preservation, and error sanitization are covered through strict TDD.
- [ ] Representative success and failure compatibility fixtures exist for every operation, and tests detect unreviewed field, mapping, identifier, or error-semantic drift.
- [ ] Architecture fitness tests reject backend/auth/platform leakage and generic or automatic publication patterns.
- [ ] Documentation clearly distinguishes the External Client Contract from the Module Public Application Contract and identifies GARFEX as compatibility owner.
- [ ] Convex remains infrastructure, no universal business API is added, and no consumer implementation is inspected or assumed.
- [ ] Repository-required tests, architecture checks, typecheck, and build pass before delivery.

## Explicit open decisions

The following are intentionally unresolved and must not be inferred from current Convex entrypoints or consumer assumptions:

1. Physical transport or protocol, including HTTP, RPC, or Convex-mediated exposure.
2. External schema/IDL source, representation, runtime validation technology, and generation direction.
3. Whether an SDK or generated client exists and how any artifact is packaged, versioned, hosted, or distributed.
4. Productive IdP, authentication mechanism, credential/session validation, role provisioning, machine identity, and deployment configuration.
5. Exact public success fields, including identity metadata, raw attributes, lifecycle data, and pagination cursor commitments.
6. Disclosure policy for validation details, existing resource identifiers, current revisions, catalog distinctions, and not-found concealment.
7. Contract version identifiers, compatibility windows, deprecation rules, and migration process.

## Proposal question round

Auto mode preserves the approved direction while recording these product questions for review rather than silently deciding them:

1. Which response fields are truly required for each workflow, and which identity, lifecycle, attribute, or pagination fields should remain private to reduce compatibility burden?
2. Should not-found responses conceal protected-resource existence, and should that policy differ between lookup, update, and deactivation workflows?
3. Which corrective metadata, if any, may be disclosed for validation, duplicate, and revision-conflict errors without leaking sensitive resource state?
4. What compatibility promise should GARFEX eventually make for breaking changes and deprecation, independent of the still-open distribution mechanism?

Current proposal assumptions are minimum-safe disclosure, field-by-field publication, fail-closed unknowns, and no transport or consumer-specific behavior. These assumptions may be corrected, or a second question round may be run before specification/design.
