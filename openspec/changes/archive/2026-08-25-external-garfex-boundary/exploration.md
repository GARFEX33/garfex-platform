# External GARFEX boundary exploration

## Executive summary

GARFEX should add a distinct, backend-owned external client contract for the ten existing Resource Master business operations, without publishing or importing `apps/backend/src/resource-master/public.ts`. The external boundary must contain explicit client-safe request, response, and error meanings and map them at a trusted server edge to the internal actor-first application contract.

All ten current operations are meaningful externally because each supports Resource Master discovery, lookup, creation, maintenance, or lifecycle workflows. Their inclusion does not grant access: authentication remains an edge concern, `ActorContext` is created server-side, and Resource Master continues exact deny-by-default capability authorization before catalog or repository work.

No physical transport, protocol, schema/generation mechanism, SDK, productive identity provider, consumer implementation, Agent Platform, Temporal workflow, Harness, or domain redesign should be selected by this change.

## Repository evidence

| Concern | Canonical evidence | Current fact |
| --- | --- | --- |
| External trust decision | `docs/external-client-boundary.md` | External clients are untrusted and independent; `resource-master/public.ts` is not their contract. |
| Module contract | `apps/backend/src/resource-master/public.ts` | Defines `ActorContext`, capabilities, 14 error codes, DTOs, `Result`, and ten actor-first operations for in-process backend use. |
| Application behavior | `apps/backend/src/resource-master/application/resource-master.ts` | Implements all ten operations and authorizes before catalog/repository work. |
| Authorization policy | `apps/backend/src/resource-master/application/authorization.ts` | Maps all ten operation names exactly and denies unknown operations. |
| Trusted auth composition | `apps/backend/src/auth/{identity-adapter,composition,resource-master-edge,roles}.ts` | Resolves provider-neutral `ActorId`, supplies server-configured capabilities, sanitizes authentication failure, and invokes application code with a separate actor. |
| Current platform adapter | `apps/backend/convex/resourceMaster.ts` | Duplicates runtime validators and composes auth plus infrastructure; it is evidence of current behavior, not an external contract or chosen future transport. |
| Architecture policy | `docs/architecture.md`, `tooling/architecture/check.mjs` | Keeps platform/generated types out of core and rejects client-facing imports of backend internals or trusted auth concepts. |
| Boundary fixtures | `tooling/architecture-fixtures/{valid,violations}/external-client-boundary/` | A standalone client-facing DTO is accepted; backend public/internal imports and actor/role/capability leaks are rejected. |
| Architecture tests | `tooling/tests/architecture.test.ts` | Asserts named boundary violations, counterpart independence, and configuration-error behavior. |
| Auth tests | `apps/backend/tests/auth-boundary.test.ts`, `resource-master-authorization.test.ts` | Prove forged client authority is ignored, unauthenticated/forbidden work stops early, mappings are exact, and unknown operations fail closed. |
| Behavior tests | `apps/backend/tests/resource-master.test.ts`, `convex-resource-master.test.ts` | Cover all ten operations, runtime validation, error results, pagination, revisions, lifecycle behavior, and persistence composition. |

The OpenSpec project context (`openspec/config.yaml`) confirms strict TypeScript/NodeNext conventions, strict TDD, Convex as an adapter, and `corepack pnpm test` as the required test command.

## External operation scope

The external contract should expose exactly these ten semantic operations, grouped for review rather than as a generic business API:

| External semantic operation | Internal application operation | Capability still enforced by Resource Master | Why externally meaningful |
| --- | --- | --- | --- |
| Read taxonomy | `getTaxonomy` | `resource:read` | Drives classification discovery. |
| Read effective resource schema | `getEffectiveResourceSchema` | `resource:read` | Describes applicable attributes for a selected taxonomy path. |
| Read valid options | `getValidOptions` | `resource:read` | Supplies controlled choices for applicable attributes. |
| Read natural units | `getNaturalUnits` | `resource:read` | Supplies allowed and suggested units for a family. |
| Get resource | `getResource` | `resource:read` | Retrieves a resource by public resource identifier. |
| Search resources | `searchResources` | `resource:read` | Supports bounded, lifecycle-aware resource discovery. |
| Describe resource | `describeResource` | `resource:read` | Produces the canonical human-facing description. |
| Create resource | `createResource` | `resource:create` | Creates a validated Resource Master resource. |
| Update non-identity data | `updateNonIdentityData` | `resource:update-non-identity` | Changes the currently supported non-identity field with revision control. |
| Deactivate resource | `deactivateResource` | `resource:deactivate` | Performs the supported lifecycle transition with revision control. |

This is a semantic one-to-one scope, not permission inheritance and not a requirement to preserve internal TypeScript signatures. External requests must omit `ActorContext`, `ActorId`, roles, capabilities, provider claims, tokens, and session authority. The edge derives the trusted actor and calls the corresponding actor-first application operation.

### Explicitly not external

- `catalog:admin`, because it is reserved and maps to no behavior.
- Catalog snapshot readers/installers, bootstrap mutations, deployment payloads, fixtures, repositories, persistence documents, indexes, generated Convex APIs, or database identifiers.
- Arbitrary CRUD, table access, generic repository methods, generic `execute(operation, payload)`, or an operation registry that silently publishes future module methods.
- Domain/application/infrastructure types by import or re-export.
- Internal composition roles or the capability set as client authority.

## Contract derivation and mapping strategy

### Recommended direction: curated external contract plus explicit adapter

Create a contract source owned by the external boundary and define only client-safe data semantics. Keep a deliberate mapping layer from each external operation to one internal Resource Master operation.

The critical relationship is:

```text
External Client Contract != Module Public Application Contract

untrusted external input
  -> external request validation
  -> server authentication/composition creates ActorContext
  -> explicit operation mapper calls Resource Master(actor, business input)
  -> explicit client-safe success/error projection
  -> external response validation
```

The external contract may intentionally share business names and value meanings, but it must neither import nor mechanically publish `resource-master/public.ts`. Sharing meaning is not sharing implementation.

### Safe reuse rules

1. **Curate fields, do not re-export types.** Define external DTOs independently. Map ordinary business values explicitly.
2. **Keep authority out of payload schemas.** Authentication material, if a future transport carries it, belongs to transport authentication metadata and is never mapped from a business DTO into `ActorContext`.
3. **Use exhaustive operation mapping.** A closed external operation set should map one-to-one to the ten approved internal operations; an unmapped or new internal operation remains unavailable externally until reviewed.
4. **Project responses explicitly.** Do not return internal objects by reference or structural pass-through. This allows omission or stabilization of internal-only fields without changing domain behavior.
5. **Project errors explicitly.** Preserve stable client-relevant categories while sanitizing server/internal detail. Do not expose thrown exceptions, provider failures, persistence details, or Convex failures.
6. **Keep the source transport-neutral.** Contract semantics can define operation inputs/outcomes without choosing HTTP status codes, RPC framing, Convex function references, serialization tooling, or SDK packaging.

### Error model observations

The internal application result has 14 codes:

- Trust/authorization: `UNAUTHENTICATED`, `FORBIDDEN`.
- Client/business correction: `INVALID_ARGUMENT`, `NOT_FOUND`, `DUPLICATE`, `INVALID_REFERENCE`, `VALIDATION`, `CONFLICT`, `INVALID_LIFECYCLE`.
- Server/catalog state: `INTEGRITY`, `INTERNAL`, `RESOURCE_CATALOG_UNAVAILABLE`, `RESOURCE_CATALOG_UNINITIALIZED`, `RESOURCE_CATALOG_INVALID`.

Current auth errors are deliberately sanitized. `details`, `existingResourceId`, and `currentRevision` support useful corrective workflows but require an explicit disclosure decision in the external contract. Internal messages should not automatically become compatibility commitments. Transport-specific status/error encoding remains open.

## Preventing silent drift

A later implementation should add all of the following checks without deriving the external contract wholesale from internal code:

1. **Operation-set parity test:** assert the external-to-internal map contains exactly the ten approved external operation identifiers and rejects unknown identifiers. Do not assert that every future `ResourceMaster` member is automatically external.
2. **Mapper contract tests:** for every operation, validate external input, verify server-created actor is passed separately, invoke the intended internal operation, and validate the external projection.
3. **Negative authority tests:** reject payloads containing authoritative actor, role, capability, claims, token, or session fields where schemas are closed; prove forged fields cannot influence the actor.
4. **Authorization preservation tests:** prove unauthenticated requests never invoke Resource Master and forbidden actors reach no catalog/repository work, while each operation retains its current capability.
5. **Compatibility fixtures:** keep representative serialized success and failure examples for each external operation and review intentional compatibility changes explicitly.
6. **Architecture fitness rules:** retain the existing `client-facing-no-backend-internals` and `client-facing-no-trusted-auth-internals` checks; extend controlled valid/violation fixtures for any chosen source location and generated outputs.
7. **No platform leakage tests:** reject Convex SDK/generated imports, Convex IDs/documents/validators, persistence records, and deployment/catalog installer concepts in external contract source and artifacts.
8. **Documentation parity:** maintain one canonical operation/error mapping table and test machine-readable identifiers against it where practical; avoid manually duplicated undocumented variants.

Generation, if selected later, should flow from an explicitly external source of truth to external artifacts. Generating a client contract directly from `ResourceMaster`, Convex validators, or generated Convex bindings would collapse the required boundary and make internal additions accidentally public.

## Test and documentation impact map

A future implementation would likely touch more than four non-trivial files and should be task-sliced under SDD with strict TDD. Expected coverage areas are:

- contract shape and closed-schema tests;
- ten explicit operation mappings and projections;
- auth composition/forgery negative tests;
- error sanitization and disclosure tests;
- architecture checker valid/violation fixtures;
- architecture test expectations;
- updates to `docs/external-client-boundary.md`, `docs/auth-boundary.md`, and `docs/architecture.md` only after decisions are accepted;
- verification through at least `corepack pnpm test`, `corepack pnpm test:architecture`, typecheck, and build according to repository policy.

No tests or production code were changed during exploration.

## Open decisions

These must remain explicit in proposal/spec/design rather than being inferred from current Convex entrypoints:

1. **Physical transport/protocol:** HTTP, RPC, Convex-mediated access, or another edge representation is not selected.
2. **External schema source and format:** handwritten schemas, an IDL, JSON Schema, OpenAPI, or another representation is not selected.
3. **Generation direction/tooling:** whether schemas, validators, documentation, or bindings are generated—and from which explicitly external source—is open.
4. **Artifact distribution:** no package registry, hosted schema, repository location, versioning mechanism, or compatibility window is selected.
5. **SDK:** whether any public SDK exists is open; the contract must not assume one.
6. **Productive authentication:** provider, credentials/session mechanism, token validation, role provisioning, machine identity, and deployment configuration remain open.
7. **External error disclosure:** stable messages and exposure of `details`, `existingResourceId`, `currentRevision`, integrity/catalog distinctions, and not-found concealment require explicit policy.
8. **External response minimization:** whether fields such as `canonicalIdentity`, `identityPolicyVersion`, raw attribute values, lifecycle information, and opaque pagination cursors are public compatibility commitments requires field-by-field review.
9. **Contract versioning and compatibility ownership mechanics:** GARFEX owns compatibility, but version identifiers, evolution rules, and deprecation process remain undecided.
10. **Consumer-specific product workflows:** no external consumer implementation was inspected; operation semantics are exposed without redesigning them around a particular UI.

## Risks

| Risk | Consequence | Required control |
| --- | --- | --- |
| Treating `public.ts` as external | Trusted actor and internal evolution become cross-repository commitments. | Independent external contract and architecture rejection of imports/re-exports. |
| Deriving from Convex validators/bindings | Convex becomes the public business API and transport is silently selected. | External source of truth and explicit adapter projection. |
| Generic operation forwarding | New internal operations may become public without review. | Closed allowlist and exhaustive mapping tests. |
| Accepting actor/role/capability payload fields | Client can attempt authority forgery. | Closed business schemas and server-only actor construction. |
| Mapping authorization at the edge only | Module security becomes bypassable by another adapter. | Preserve Resource Master authorization as final enforcement. |
| Passing through internal errors/messages | Provider, persistence, catalog state, or protected existence may leak. | Explicit stable error projection and disclosure policy. |
| Copying DTOs without parity checks | External behavior drifts silently from mapped application behavior. | Compatibility fixtures, mapper tests, and reviewed mapping table. |
| Over-broad field publication | Internal identity/search/catalog decisions become permanent public commitments. | Field minimization and explicit compatibility review. |

## Recommended next phase

Proceed to an SDD proposal that fixes the semantic scope at these ten operations, establishes an independent external contract and trusted mapping boundary as the outcome, and leaves transport, schema technology, generation, SDK, and productive IdP choices open for design decisions or later changes.
