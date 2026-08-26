# Independent external client boundary

- **Status:** Accepted
- **Date:** 2026-08-24
- **Owner:** GARFEX backend

`garfex-platform-ui` is an untrusted external client of GARFEX. It is not a workspace member,
package consumer, source consumer, or deployment unit of this backend repository. The only valid
cross-repository boundary is an explicitly public, external, client-facing contract established and
owned by GARFEX.

## Decision

Shared contractual meaning does not require shared implementation. In particular, the Resource
Master module public application contract at `resource-master/public.ts` is an in-process backend
module boundary; it is **not** an external client-facing contract and cannot be imported by the UI.

The backend and every external client remain independently installable, buildable, testable,
runnable, and deployable. No client may require backend source, internal packages, schemas, generated
bindings, or repository links for any of those activities. The backend likewise never depends on UI
source, state, presentation, navigation, host concepts, or build output.

A future artifact may cross the repository boundary only after a separate decision makes it all of
the following:

- explicitly public and client-facing;
- versioned with compatibility ownership;
- safe for an untrusted client; and
- independent of backend source and internal packages.

The concrete ten-operation semantic contract is canonical in
[`external-garfex-boundary.md`](./external-garfex-boundary.md). Its dependency direction is:

```text
independent external business contract -> trusted server adapter -> Resource Master public contract
                                                         -> final module authorization -> private infrastructure
```

A future public SDK is a separate decision. The phrase “GARFEX client” describes a consumer role and
does not imply an SDK, shared backend package, generated binding, schema package, or source link.

## Trust and ownership consequences

Authentication and authorization remain server-side responsibilities. The server constructs trusted
`ActorContext`; external input cannot supply authoritative identity, provider claims, roles, or
capabilities. Owning application modules continue to perform final authorization.

Convex, persistence adapters, generated bindings, infrastructure, deployment representations, and
module internals stay private to the backend. A future client-facing contract may express public
meaning, but it must not expose or import those implementation details.

The backend owns the public external boundary and its compatibility policy. Native Convex is accepted only
for GARFEX-owned compatible local/development clients; it is not public or third-party exposure. This decision
does not copy or redefine UI architecture; it constrains what the backend may publish or consume.

## Repository topology

Physical coupling is forbidden even when no import resolves. Neither repository may be included by
package or Git dependency, workspace/project/filesystem link, submodule, or escaping symlink. The
physical location of a future Pi implementation remains open, but it cannot be resolved by putting,
copying, linking, or mounting Surface source into `garfex-platform` while this decision holds.

## Open and out of scope

This decision intentionally does not choose or implement:

- HTTP or another additional transport beyond the accepted native local/development adapter;
- a public SDK, package registry, or publication path;
- external schemas or their versioning mechanism;
- consumer-specific workflows or external operations beyond the canonical GARFEX contract;
- productive authentication changes; or
- the physical repository location of Pi.

These require explicit later decisions. None is implied by calling the UI a GARFEX client, and the
canonical semantic boundary creates no network reachability.

## Canonical contract decision

GARFEX owns the external semantic authority in [`contracts/external-garfex/resource-master/`](../contracts/external-garfex/resource-master/).
TypeSpec produces the semantic manifest, which is materialized as [standalone consumer semantics](./generated/resource-master-external-contract.md)
and compared with the accepted [baseline](../contracts/external-garfex/resource-master/baseline/accepted-semantic-manifest.json).
Stale-artifact and breaking-change gates must pass before acceptance or publication; the compatibility fixture is evidence only.

The exact external-to-module mappings are `getTaxonomy`, `getEffectiveResourceSchema`, `getValidOptions`,
`getNaturalUnits`, `getResource`, `searchResources`, `describeResource`, `createResource`,
`updateNonIdentityData`, and `deactivateResource`, each mapping only to the identically named Resource Master
operation. Their final capabilities are respectively `resource:read` for the first seven, `resource:create`,
`resource:update-non-identity`, and `resource:deactivate`. The complete safe error set is
`UNAUTHENTICATED`, `FORBIDDEN`, `INVALID_ARGUMENT`, `INVALID_REFERENCE`, `VALIDATION_FAILED`, `NOT_FOUND`,
`DUPLICATE`, `CONFLICT`, `INVALID_LIFECYCLE`, `CATALOG_UNAVAILABLE`, and `INTERNAL_FAILURE`; only applicable
`fieldIssues`, `existingResourceId`, and `currentRevision` metadata may cross the boundary.

TypeSpec owns external meaning, the trusted edge owns fresh trusted actor construction and explicit mapping,
projection, and normalization, and Resource Master owns final authorization. Convex remains encapsulated behind
Resource Master ports. Revision `1` is opaque and compared only for exact equality; no version-policy mechanics are selected.

Related records: [GARFEX boundary](./external-garfex-boundary.md), [authentication boundary](./auth-boundary.md), and [architecture](./architecture.md).

## Relationship to other decisions

The accepted [Surface/UI and Harness boundary](./surface-ui-harness-boundary.md) remains unchanged:
Surface/UI and Harness are separate roles. This decision clarifies the independent external boundary
between a Surface and this backend; it does not select a transport or Harness.

The completed persistent Resource Catalog history is also unchanged. This decision neither revises
that work nor exposes its installer, payloads, fixtures, persistence representation, or schemas.
