# Establish TypeSpec as the External Client Contract authority for Resource Master

## Decision

Adopt TypeSpec as the transport-neutral authority for the External Client Contract covering exactly the ten approved Resource Master operations. Keep that authority separate from both the trusted server-side edge and the Module Public Application Contract.

```text
External Client Contract (TypeSpec authority)
  client-safe operations, business DTOs, public metadata, outcomes, safe failures
                              |
                              | explicit reviewed mapping
                              v
Trusted server-side edge
  validates untrusted values, authenticates, constructs ActorContext,
  invokes one named operation, projects output, allowlists failures
                              |
                              | public application API only
                              v
Module Public Application Contract
  apps/backend/src/resource-master/public.ts
  actor-first in-process API; final deny-by-default authorization
                              |
                              v
Private application/domain ports and Convex infrastructure adapters
```

These are three distinct ownership boundaries. TypeSpec is not derived from the module contract, the trusted edge is not an authorization replacement, and the module public contract is not an external schema. Duplicate-looking models and explicit edge mappings are intentional safeguards.

## Problem

The repository already offers a reviewed external semantic boundary for Resource Master, but its client-facing authority is handwritten TypeScript. That leaves no independent contract language authority, no transport-neutral contract compilation gate, and no deliberate TypeSpec-based drift or breaking-change detection.

Publishing the actor-first module API or Convex validators instead would expose trusted authority concepts, couple clients to internal schemas and platform details, and risk making future module methods public automatically. Treating TypeSpec as an HTTP shortcut would prematurely bind business semantics to an unapproved transport.

## Intent

This change will make the ten approved Resource Master workflows independently understandable and compatibility-controlled without creating network reachability or selecting delivery technology.

The intended outcomes are:

- TypeSpec becomes the sole external semantic authority for operation identifiers, client-safe requests, public success models, public UI-supporting metadata, and safe failures.
- The trusted edge remains the only composition boundary that turns authenticated server state into a fresh `ActorContext` and maps external values to the module API.
- Resource Master remains the final authorization authority and denies unknown or unmapped operations by default before catalog or repository work.
- Convex, persistence, authentication internals, and module schemas remain encapsulated.
- Contract compilation, semantic drift, and breaking changes become detectable before an external artifact can be accepted or published.
- Canonical architecture documentation records the decision and its deliberately deferred choices.

## Scope

### Exact evaluated operation baseline

The TypeSpec authority and trusted named mappings will be evaluated against all ten operations, not a representative subset:

| External operation | Business purpose | Module operation | Final module capability |
| --- | --- | --- | --- |
| `getTaxonomy` | Obtain the public resource classification hierarchy | `getTaxonomy` | `resource:read` |
| `getEffectiveResourceSchema` | Obtain public effective attribute metadata for a selected classification | `getEffectiveResourceSchema` | `resource:read` |
| `getValidOptions` | Obtain public code/label options for an attribute | `getValidOptions` | `resource:read` |
| `getNaturalUnits` | Obtain allowed and suggested natural units | `getNaturalUnits` | `resource:read` |
| `getResource` | Retrieve one public resource view | `getResource` | `resource:read` |
| `searchResources` | Search public resource summaries with bounded pagination | `searchResources` | `resource:read` |
| `describeResource` | Obtain a resource identifier and public description | `describeResource` | `resource:read` |
| `createResource` | Create a resource from reviewed business values | `createResource` | `resource:create` |
| `updateNonIdentityData` | Update permitted non-identity data under revision control | `updateNonIdentityData` | `resource:update-non-identity` |
| `deactivateResource` | Deactivate a resource under revision control | `deactivateResource` | `resource:deactivate` |

The baseline includes each operation's request meaning, success projection, safe failure outcomes, requiredness, closed enums/unions, and approved corrective metadata. A new Resource Master method remains private until the TypeSpec authority and a separate explicit trusted mapping are reviewed and changed.

### TypeSpec external authority

The implementation will establish an independently owned TypeSpec source and transport-neutral compilation configuration. It will define only external business semantics and public metadata needed to understand or support the approved client workflows.

“Public UI metadata” means reviewed external information such as taxonomy labels, effective attribute descriptions/constraints, option code/label pairs, and natural-unit choices that a future client may use. It does not publish internal catalog records, domain entities, persistence documents, Convex validators, application DTOs, authority models, or a UI implementation. Public projections may intentionally differ from internal schemas.

TypeSpec must be upstream of any later generated or parity-checked artifact. It must not import, re-export, mechanically derive from, or structurally expose `resource-master/public.ts`, Resource Master internals, handwritten Convex validators, generated Convex bindings, or persistence schemas.

### Trusted edge and explicit mappings

For every operation, the trusted server-side edge will retain a named, one-to-one adapter that:

1. validates closed untrusted business input;
2. obtains identity only through trusted authentication composition;
3. constructs a fresh `ActorContext` server-side with copied server-authorized capabilities;
4. maps external input explicitly to the matching method on `apps/backend/src/resource-master/public.ts`;
5. lets Resource Master perform final exact deny-by-default authorization;
6. rebuilds the external success value field by field; and
7. normalizes failures through an exhaustive external allowlist while retaining diagnostics only server-side.

Actor IDs, roles, capabilities, claims, tokens, credentials, sessions, provider data, and equivalent authority-bearing values are not TypeSpec business fields and cannot be accepted from client business input. No generic executor, operation registry, arbitrary CRUD surface, or automatic publication mechanism is introduced.

### Safe external failures

The closed external failure set remains:

- `UNAUTHENTICATED`
- `FORBIDDEN`
- `INVALID_ARGUMENT`
- `INVALID_REFERENCE`
- `VALIDATION_FAILED`
- `NOT_FOUND`
- `DUPLICATE`
- `CONFLICT`
- `INVALID_LIFECYCLE`
- `CATALOG_UNAVAILABLE`
- `INTERNAL_FAILURE`

Only reviewed `fieldIssues`, `existingResourceId`, and `currentRevision` metadata may be exposed for their applicable meanings. Module messages, arbitrary details, stacks, provider diagnostics, Convex data, catalog integrity details, malformed metadata, and unknown failures remain private. Catalog unavailable/uninitialized meanings normalize to `CATALOG_UNAVAILABLE`; integrity, internal, invalid-catalog, unknown, malformed, projection, and invalid-response failures normalize to metadata-free `INTERNAL_FAILURE`.

### Compatibility and architecture controls

The change will add independently reviewable controls for:

- transport-neutral TypeSpec compilation without requiring a transport emitter;
- exact parity between the ten TypeSpec operations and ten trusted named mappings;
- parity for requests, successes, error codes, and allowlisted metadata against reviewed compatibility evidence;
- detection of additions, removals, renames, field changes, requiredness changes, enum changes, and type narrowing or widening;
- deliberate baseline/version comparison that reports breaking changes and cannot silently publish them;
- architecture scanning of `.tsp`, TypeSpec configuration, and any committed/generated artifacts for authority, platform, transport, module-internal, persistence, or Convex leakage; and
- proof that module additions remain private until independently added to TypeSpec and explicitly mapped.

The current serialized compatibility fixture remains evidence of semantics, not a selection of JSON or any transport.

### Canonical documentation

The accepted decision and continuing boundary rules will be persisted in the repository's canonical documentation/ADR set, including the relevant external client boundary, external GARFEX boundary, authentication boundary, and architecture records. Those records will cross-link the TypeSpec authority, trusted actor construction, module authorization ownership, Convex encapsulation, compatibility gates, and transport non-decision.

## Non-goals

This change does not:

- choose HTTP or any other transport or protocol;
- define routes, verbs, status codes, headers, wire authentication framing, serialization, or network reachability;
- execute or approve OpenAPI emission, Scalar, Orval, HTTP-derived documentation, or HTTP-derived clients;
- publish an SDK or client package, choose a registry/host, or define artifact distribution;
- choose a productive identity provider, login flow, credentials, tokens, sessions, provisioning, roles, or machine identity;
- implement or design a UI, client workflow, consumer state, or consumer-specific behavior;
- expose internal Resource Master schemas, `ActorContext`, capabilities, catalog administration, persistence records, Convex APIs, generated bindings, or deployment concepts;
- expand beyond the exact ten-operation baseline;
- redesign Resource Master behavior, lifecycle policy, identity rules, capability policy, or final authorization;
- modify `persistent-resource-catalog`.

## Approach

1. Establish an independent TypeSpec contract root and transport-neutral compile configuration.
2. Model all ten operation semantics, public business DTOs/UI-supporting metadata, success outcomes, and closed safe failures in TypeSpec.
3. Use the approved repository-local semantic emitter to produce a deterministic manifest, then materialize the committed runtime TypeScript contract data and transport-neutral consumer documentation from that manifest without creating a second authority.
4. Preserve and verify the ten named trusted adapters, fresh server-created actors, field-by-field projections, and allowlisted error normalization.
5. Extend architecture checks and fixtures to inspect TypeSpec source, configuration, and approved artifacts.
6. Add deterministic compilation, parity, drift, and breaking-change gates using a deliberately reviewed baseline.
7. Update canonical docs/ADRs and compatibility evidence so reviewers can verify all three boundaries without reconstructing them from implementation.

## Business and architectural outcomes

| Area | Expected outcome |
| --- | --- |
| External contract consumers | Receive stable, client-safe Resource Master semantics and public metadata without inheriting backend or platform schemas. |
| Product evolution | The ten approved workflows can evolve through explicit compatibility decisions rather than accidental module drift. |
| Security | Clients cannot supply authority; safe failures disclose only allowlisted meanings and metadata. |
| Resource Master | Its actor-first public application API and final deny-by-default authorization remain unchanged and authoritative. |
| Backend composition | Authentication, actor construction, validation, mapping, projection, and diagnostics remain trusted server concerns. |
| Convex and persistence | Remain private infrastructure and cannot become external contract authorities or universal business APIs. |
| Architecture governance | TypeSpec and downstream artifacts become subject to the same boundary and leakage protections as existing source. |
| Support and operations | Stable external errors are explainable while sensitive diagnostics remain server-only. |

## Compatibility expectations

The existing reviewed ten-operation semantic baseline is preserved unless a later explicit compatibility decision approves a change. Operation identifiers, request fields and constraints, success fields, public metadata, safe error codes, and allowlisted corrective metadata are compatibility surface.

Internal Resource Master, authentication, catalog, persistence, or Convex changes do not automatically alter that surface. Compatible internal changes are absorbed by explicit mappings and projections. An incompatible requirement must be reported by drift/breaking checks and handled through a reviewed contract change with migration intent; it must not be silently emitted or published.

No proposal-level claim is made about semantic version numbering, compatibility duration, deprecation windows, package publication, or consumer rollout.

## Risks and controls

| Risk | Control |
| --- | --- |
| TypeSpec is treated as synonymous with HTTP | Use transport-neutral models and compilation; prohibit HTTP decorators, bindings, and emitters in this change. |
| Handwritten TypeScript and TypeSpec become competing authorities | Make TypeSpec authoritative and require a designed generated-or-parity-checked downstream relationship. |
| Internal or authority schemas leak into external models | Scan TypeSpec and artifacts; reject imports, derivation, pass-through, and authority-like business fields. |
| A trusted adapter bypasses final authorization | Restrict adapters to the module public application contract and verify early deny-by-default behavior. |
| Future module methods become public automatically | Require an exact ten-operation closed set and separately reviewed named mappings. |
| Errors leak diagnostics or protected state | Use exhaustive allowlisted normalization, metadata validation, and metadata-free internal fallback. |
| Convex becomes the external API | Forbid Convex/generated/platform references in contract sources and artifacts; retain it as private infrastructure. |
| Contract changes drift silently | Compile, compare against a reviewed baseline, test exact mapping parity, and fail on unreviewed breaking or semantic changes. |
| Public metadata overexposes internal schema design | Publish only reviewed client-safe projections and verify no catalog/domain/persistence shape pass-through. |

## Rollback and containment

This change creates no transport binding or network reachability, so the TypeSpec authority and its gates can be removed or reverted without changing Resource Master persistence or runtime authorization. If downstream artifact integration proves unsafe, retain the existing trusted runtime boundary while disabling the new generation/parity path and restoring the last reviewed contract baseline.

Rollback must not weaken final Resource Master authorization, accept client-supplied authority, expose Convex or internal schemas, remove safe error normalization, or silently redefine an existing compatibility meaning. Canonical documentation must be reverted or amended with the same decision so source and architecture records do not disagree.

## Success criteria

- [ ] A canonical TypeSpec source compiles transport-neutrally and defines exactly the ten listed operations.
- [ ] The contract includes reviewed public business DTOs and UI-supporting metadata without internal Resource Master, catalog, persistence, authentication, or Convex schemas.
- [ ] The exact three-boundary model is represented in source, architecture enforcement, and canonical documentation.
- [ ] Every external operation has one explicit trusted mapping to its matching module public operation; no generic dispatch or automatic module publication exists.
- [ ] Every actor is constructed freshly server-side from trusted authentication composition, and authority-like business input is rejected or inert.
- [ ] Resource Master remains the final exact deny-by-default authorization authority before catalog or repository work.
- [ ] Successes are explicitly projected and all external failures use the closed eleven-code allowlist with only approved metadata.
- [ ] Convex, persistence, generated platform bindings, and module internals remain encapsulated and absent from contract sources/artifacts.
- [ ] Compilation, operation parity, semantic drift, and deliberate breaking-change detection fail on unreviewed contract changes.
- [ ] Architecture checks inspect `.tsp`, configuration, and approved downstream artifacts for transport, authority, platform, and internal leakage.
- [ ] Canonical docs/ADRs record TypeSpec authority, all three boundaries, compatibility ownership, and explicit non-decisions.
- [ ] No implementation or artifact selects HTTP, routes, verbs, OpenAPI execution, Scalar, Orval, client publication, identity provider, login, UI, or another transport.
- [ ] `persistent-resource-catalog` is unchanged.

## Explicit deferred decisions

The following remain intentionally unresolved and require later, separately approved decisions:

1. HTTP versus any other transport/protocol, including routes, verbs, statuses, headers, authentication framing, serialization, deployment, and reachability.
2. OpenAPI emission or execution, Scalar, Orval, and any other transport-derived documentation or client generation.
3. SDK/client publication, package location, registry/hosting, artifact distribution, and consumer rollout.
4. Productive identity provider, login, credentials, token/session validation, provisioning, role assignment, and machine identity.
5. UI implementation, interaction design, workflows, state management, and consumer-specific use of public metadata.
6. Semantic-version identifier syntax or ordering, compatibility windows, deprecation policy, and migration duration.

The approved implementation decisions for this change are the repository-local TypeSpec root, repository-local transport-neutral semantic emitter, deterministic JSON semantic manifest, committed generated runtime TypeScript and transport-neutral documentation artifacts, and committed JSON accepted baseline. JSON is a repository interchange and evidence format only; it does not select transport serialization.

## Proposal question round

The orchestrator reports that the user supplied exhaustive acceptance criteria and approved the exploration, so this proposal does not reopen bound product decisions. No additional proposal-shaping assumptions are introduced. The unresolved matters above are explicit deferrals for later decisions rather than ambiguities to settle in this proposal; the user may request a further question round if that framing needs correction.
