# Proposal: Resource Master Convex Native Transport

## Status and amendment context

This proposal deliberately amends the current transport posture for Resource Master. The canonical TypeSpec contract previously kept transport selection open: native Convex exposure was neither selected nor rejected. This change selects native Convex as the first accepted exposure for GARFEX-owned, compatible local/development clients while keeping TypeSpec itself transport-neutral.

The amendment does not make Convex a semantic authority. TypeSpec remains the sole public authority for operation names, request and response shapes, constraints, safe failures, and metadata. Convex is a transport and infrastructure mechanism implementing those semantics. Future HTTP or other adapters may reuse the same semantics without becoming another authority.

This proposal does not claim productive readiness.

## Problem

Resource Master already has ten native `api.resourceMaster.*` Convex functions, but their current public dialect is not exactly the canonical TypeSpec dialect:

- TypeSpec defines `CreateResourceRequest.attributes` as canonical `ResourceAttribute[]`, while existing runtime compatibility and Convex paths accept a legacy code-keyed attribute map.
- TypeSpec defines wrapped successes such as `items`, `options`, and `resource`, while current Convex results and compatibility handling admit bare success values.
- Legacy request and success acceptance remains mixed into runtime compatibility machinery, so a green module or Convex test does not prove canonical parity.
- Convex argument validation may reject malformed input before a handler can normalize it to canonical `INVALID_ARGUMENT`; this boundary has not yet been deliberately resolved.

Exposing the functions as native contract endpoints before reconciling these differences would establish a second effective contract, create client ambiguity, and risk transport-specific drift from TypeSpec.

## Intent

Accept the existing native Convex Resource Master family as the first local/development exposure only after the canonical TypeSpec/runtime dialect is reconciled and exact parity is proven.

The change will:

1. Reuse and complete the existing ten named `api.resourceMaster.*` functions.
2. Make canonical TypeSpec/runtime dialect reconciliation a prerequisite to native exposure.
3. Expose canonical `ResourceAttribute[]` requests and canonical wrapped successes without implicit legacy conversion on the canonical path.
4. Route each named operation through a trusted composition boundary that preserves server-derived identity, safe projection and error normalization, and Resource Master's final exact deny-by-default authorization.
5. Produce both in-process `convex-test` evidence and separate real local/development generated-client smoke evidence.

## Scope

### Canonical dialect prerequisite

Before native exposure can be accepted:

- `CreateResourceRequest.attributes` must use canonical `ResourceAttribute[]` with the TypeSpec-defined fields and constraints.
- Any adaptation to the module's internal representation must map explicitly by `attributeCode`; array positions must never be interpreted as attribute codes.
- Every success must use its operation-specific canonical wrapper, including `items`, `options`, or `resource`, with search preserving its canonical `items` and `cursor` shape.
- Implicit acceptance or wrapping of bare successes must be removed from the canonical path.
- Legacy code-keyed attribute requests and bare-success behavior must either be removed or isolated behind a clearly non-canonical compatibility boundary. Tests and architecture checks must prove that legacy behavior cannot enter the canonical Convex composition.
- Exact parity must be demonstrated across all ten named operations, including request fields and constraints, success shapes, safe error codes and reviewed metadata, and operation-to-handler mappings.

Dialect reconciliation is an acceptance prerequisite, not follow-up cleanup.

### Native Convex exposure

- Retain exactly one Resource Master Convex family: the existing ten `api.resourceMaster.*` functions.
- Preserve named, operation-specific mappings; do not introduce a generic executor, dispatcher, second function family, or alternate semantic registry.
- Treat Convex validators, registered functions, generated client bindings, and serialization as transport implementation details constrained by TypeSpec semantics.
- Keep persistence adapters and Resource Master internals private; native callers receive only canonical projections and safe failures.

### Identity and authorization

- Resolve trusted identity on the server from the configured local/development identity mechanism.
- Construct a fresh `ActorContext` server-side; business arguments must not accept actor IDs, roles, capabilities, claims, tokens, sessions, provider data, or Convex internals.
- Resource Master remains responsible for the final exact per-operation capability decision and must deny unknown or missing mappings by default.
- Transport or composition code may authenticate and normalize but must not replace, broaden, or bypass Resource Master authorization.
- Only TypeSpec-approved safe failure codes and reviewed metadata may cross the boundary; internal module, catalog, persistence, and Convex diagnostics remain server-side.

### JD-S-002: explicit design decision required

The design phase must explicitly resolve the boundary between Convex pre-handler validation failures and handler-owned normalized `INVALID_ARGUMENT` responses. It must not silently assume that every malformed request can become a canonical failure result.

The decision must specify:

- which malformed values or unknown fields Convex rejects before the handler;
- which admitted values the canonical validator normalizes to `INVALID_ARGUMENT`;
- the validator strategy and its effect on generated client typing and admitted Convex-serializable values;
- forged identity-field behavior;
- parity between `convex-test` observations and a real local/development generated client.

The selected strategy must preserve one named `resourceMaster` family, canonical request and result semantics, and server-derived identity. JD-S-002 remains open for explicit design resolution; this proposal does not choose among strict transport rejection, deliberately permissive handler admission, or a narrowly justified wrapper arrangement.

## Non-goals

This change does not include:

- HTTP endpoints or another transport implementation;
- productive authentication, productive deployment, productive readiness, or public Internet exposure;
- a third-party API;
- UI or client application architecture;
- Agent Platform or Temporal integration;
- new Resource Master business behavior, capabilities, lifecycle rules, or authorization policy;
- persistence or catalog redesign;
- direct persistence, database, adapter, internal DTO, or Convex-internal exposure;
- a generic business executor, operation registry, duplicate Convex family, or second semantic authority;
- changes to the protected `openspec/changes/persistent-resource-catalog/` change.

## Affected areas

Expected implementation impact is limited to the existing Resource Master native Convex boundary and the contract/runtime composition that supports it:

- existing `api.resourceMaster.*` registrations and their Convex validators and return validators;
- generated or runtime TypeSpec contract representations and canonical compatibility boundaries;
- named trusted identity, request mapping, success projection, and safe error normalization;
- tests and fixtures currently encoding legacy attribute maps or bare successes;
- parity checks, architecture checks, and local/development smoke tooling or evidence.

The Resource Master domain behavior and catalog persistence remain unchanged except for any narrowly required explicit adapter between canonical external DTOs and existing internal inputs.

## Business and architecture outcomes

After this change:

- GARFEX-owned compatible local/development clients can call Resource Master through generated native Convex bindings.
- Clients observe one explainable public semantic contract regardless of transport: the TypeSpec contract.
- Existing Convex function names are retained, avoiding duplicate APIs and migration ambiguity.
- Canonical requests and successes no longer depend on undocumented legacy dialect conversion.
- Identity and authorization remain trustworthy and centrally enforced by Resource Master.
- A future HTTP or other adapter can reuse the same named semantics, projections, and safe failures without redefining them.

## Compatibility expectations

- Function-family compatibility is preserved: clients use the existing ten `api.resourceMaster.*` names rather than a replacement family.
- Semantic compatibility is intentionally tightened to the canonical TypeSpec dialect. Legacy code-keyed create attributes and bare success values are not valid canonical native behavior.
- Existing local/development consumers that rely on the legacy dialect must migrate to `ResourceAttribute[]` and wrapped successes before using the accepted canonical exposure.
- If legacy support must temporarily remain for another caller, it must be clearly quarantined as non-canonical and unable to flow into the native canonical path.
- Opaque cursors and TypeSpec-approved failure metadata remain opaque and stable at the boundary.
- No productive-client compatibility promise is made.

## Risks and controls

### Contract drift

**Risk:** Convex types, validators, fixtures, or module DTOs diverge from TypeSpec while tests still pass.

**Controls:** exact ten-operation parity proof; canonical wrapper assertions; semantic manifest and contract checks; named mapping tests; removal or quarantine tests for legacy dialect paths.

### Legacy compatibility re-entry

**Risk:** compatibility request types, permissive success wrapping, or old fixtures silently restore map-shaped attributes or bare successes.

**Controls:** separate canonical and legacy evidence; closed canonical validators; architecture assertions that legacy adapters are unreachable from `api.resourceMaster.*`; explicit negative tests.

### Validation-boundary ambiguity

**Risk:** strict Convex validation causes transport throws where clients expect normalized `INVALID_ARGUMENT`, or permissive validation widens the accepted surface and weakens generated typing.

**Controls:** mandatory JD-S-002 design decision; a documented behavior matrix for unknown fields, malformed types, unsupported Convex values, and admitted invalid values; verification in both `convex-test` and a real local/development client.

### Authorization regression

**Risk:** native exposure trusts caller identity fields or treats edge authentication as sufficient authorization.

**Controls:** prohibit identity and capability business arguments; construct `ActorContext` server-side; assert exact per-operation capability checks, unknown/missing mapping denial, and `FORBIDDEN` before catalog or repository work.

### Internal leakage

**Risk:** direct module results or thrown diagnostics expose internal errors, persistence details, or Convex implementation data.

**Controls:** operation-specific projections; allowlisted safe failure codes and metadata; negative leakage tests; no direct persistence or internals exposure.

### False confidence from in-process tests

**Risk:** `convex-test` does not reproduce deployment-side validation, serialization, or generated-client behavior.

**Controls:** require a separate real local/development deployment smoke using generated native bindings; maintain an evidence ledger that distinguishes what each layer proves.

## Rollback and containment

Because this change is local/development-only and does not claim productive readiness, rollback is containment-oriented:

1. Withdraw acceptance of the native exposure and stop compatible local/development clients from depending on it.
2. Revert native boundary routing and validator/projection changes while preserving Resource Master domain and persistence state.
3. Keep the ten existing function names unexpanded; do not create a fallback family or generic executor during rollback.
4. Retain canonical TypeSpec as authority and do not restore legacy map or bare-success behavior as canonical semantics.
5. If a quarantined legacy adapter exists, keep it isolated and explicitly non-canonical rather than routing native calls through it.
6. Use the parity and smoke evidence ledger to identify whether containment is required at validation, composition, authorization, or client-binding level.

No data migration or persistence rollback is expected because this proposal does not change Resource Master business behavior or persistence design.

## Success criteria

The change is successful only when all of the following are true:

1. The existing ten `api.resourceMaster.*` functions are the sole native Resource Master family; no generic executor or duplicate family exists.
2. Canonical TypeSpec/runtime reconciliation is complete before exposure: create uses `ResourceAttribute[]`, success values use exact operation wrappers, and array indexes are never treated as attribute codes.
3. Legacy code-keyed requests and bare-success behavior are removed from the canonical path or demonstrably quarantined and unreachable from native canonical composition.
4. Exact parity evidence covers all ten operation names and mappings, request fields and constraints, success wrappers, safe failures, and reviewed metadata.
5. TypeSpec remains transport-neutral and the sole semantic authority; Convex remains transport/infrastructure.
6. Trusted identity and `ActorContext` are server-derived, caller-supplied identity data is rejected, and Resource Master performs final exact deny-by-default authorization.
7. No persistence implementation, internal DTO, catalog diagnostic, stack detail, or Convex internal leaks through successful or failed calls.
8. JD-S-002 is explicitly resolved in design with a tested matrix distinguishing Convex pre-handler rejection from normalized canonical `INVALID_ARGUMENT`; no behavior is left as an undocumented assumption.
9. `convex-test` integrated evidence exercises all ten functions with canonical requests and results, seeded catalog behavior, authorized and unauthorized contexts, exact capability denial, malformed input, safe failure normalization, opaque cursor behavior, and absence of a duplicate API family.
10. A separate real local/development deployment smoke uses the generated Convex client against the same ten functions and proves generated argument serialization, selected pre-handler validation behavior, canonical wrappers and failures, trusted local/development identity, and create/update/deactivate/read/search flows.
11. The evidence ledger clearly separates in-process proof from real-client/deployment proof and records the JD-S-002 cases.
12. Contract checks, TypeScript checks, relevant architecture checks, and the canonical Resource Master test suites pass without modifying `openspec/changes/persistent-resource-catalog/`.
13. Documentation and delivery language state that the exposure is accepted only for GARFEX-owned compatible local/development clients and does not imply productive readiness.
