# Resource Master architecture

The repository is a modular backend with one implemented capability:
`apps/backend/src/resource-master/`. Its Resource Master v2 Cable slice keeps business rules
framework-neutral and isolates Convex behind application-owned ports and infrastructure adapters.

The provider-neutral [auth boundary](./auth-boundary.md) is now materialized for Resource Master:
the transport/composition edge creates trusted actor context, the application enforces capabilities
deny-by-default, and the Domain remains auth-free. The included identity adapter is local-development
only; productive identity and authentication strategy remain open.

## Current layout

```text
apps/backend/
├── src/
│   ├── index.ts                         # package-level public type exports
│   ├── auth/                            # identity, composition, roles, and edge enforcement
│   ├── external-garfex-boundary/        # independent external semantics and trusted edge
│   └── resource-master/
│       ├── public.ts                    # stable actor, capability, and DTO contracts
│       ├── index.ts                     # Resource Master public type exports
│       ├── domain/
│       │   ├── canonicalization.ts
│       │   ├── identity.ts
│       │   ├── schema.ts
│       │   └── types.ts
│       ├── application/
│       │   ├── authorization.ts         # operation-to-capability policy
│       │   ├── resource-master.ts       # actor-first use-case implementation
│       │   └── ports/
│       │       ├── resource-repository.ts
│       │       └── resource-catalog-reader.ts
│       ├── deployment/
│       │   └── cable-catalog-v1.ts      # versioned write input only
│       └── infrastructure/
│           ├── convex-resource-catalog.ts
│           ├── convex-resource-master.ts
│           ├── convex-resource-repository.ts
│           └── in-memory-resource-repository.ts
└── convex/
    ├── resourceCatalogBootstrap.ts     # internal deployment installer
    ├── schema.ts                        # Convex tables and indexes
    └── resourceMaster.ts                # validated Convex queries and mutations
```

The checked-in `_generated` Convex bindings are generated integration support, not a domain or
application dependency.

## Direction and ownership

The runtime flow is:

```text
    Untrusted external business input
      -> external GARFEX validation -> trusted ActorContext + business input
                                      |
                                      v
    Resource Master public capability -> Application authorization -> Domain rules + Repository port
                                                                    Repository port <- Infrastructure/Convex adapter
```

Dependency inversion is intentional. Transport/composition authenticates and constructs trusted actor
context; Resource Master application code authorizes before catalog or repository work. `application/`
defines the repository port; infrastructure implements that port and may depend inward on
application/domain types. The core never imports an adapter or platform SDK.

| Area | Owns and may depend on |
| --- | --- |
| `auth/` | Provider-neutral identity adapter contract, local-development adapter, role-to-capability composition, and transport-edge actor construction. |
| `public.ts` | Stable framework-neutral actor, capability, result, input, and view types; no internal imports. |
| `application/` | Deny-by-default authorization, use cases, orchestration, public contract types, domain rules, and application-owned ports. |
| `domain/` | Canonicalization, identity, schema resolution, and domain data types; only its own domain. |
| `application/ports/` | Outbound contracts needed by use cases, including `ResourceRepository` and `ResourceCatalogReader`. |
| `infrastructure/` | Convex catalog/repository and in-memory implementations; may implement ports and compose use cases. |
| `convex/` | Runtime validators, schema, bootstrap, and exported functions; may call the Convex infrastructure composition only. |

Backend consumers outside Resource Master import its `public.ts` surface (or the package-level type
re-export), never `domain/`, `application/`, or `infrastructure/` internals. This is an in-process module
application contract, not an external client-facing contract. Untrusted external clients import no
backend source, package, schema, or generated binding; any future cross-repository artifact requires a
separate explicitly public, versioned, client-safe decision. Public operation signatures receive
trusted `ActorContext` separately and actor-first from business input, and that trusted server-side
context is never exposed as client authority. The concrete ten-operation semantic boundary is recorded
in the [canonical GARFEX boundary](./external-garfex-boundary.md); repository independence remains in
the [independent external client boundary](./external-client-boundary.md).

## Convex isolation

Convex is the current runtime adapter, not the owner of business behavior.

- `convex/resourceMaster.ts` validates arguments and return values and translates runtime failures
  to the public result contract.
- Convex entrypoints import `infrastructure/convex-resource-master.ts`; they must not import Resource
  Master domain or application internals directly.
- `ConvexResourceRepository` implements the application-owned repository port and is the only core
  adapter that reads or writes Convex database values.
- `convex/schema.ts` owns the Resource tables and the bounded `resourceCatalogSnapshots` aggregate/index.
  - Convex SDK and generated types stay out of `public.ts`, `application/`, and `domain/`.
  - The external GARFEX contract does not import or derive from Convex; it reaches business behavior only
      through the trusted Resource Master public application contract.
  - The in-memory repository remains available for behavior tests without a platform runtime.

## Persistent catalog authority and operations

`resourceCatalogSnapshots` is one complete, bounded aggregate keyed by `resource-master`. The
Application `ResourceCatalogReader` returns only a pure immutable snapshot; the complete-snapshot
installer is deployment-only and reachable only as the single Convex `internalMutation`. Public
contracts expose neither port.

Every Resource Master query and mutation constructs a fresh Convex reader and performs one indexed
`take(2)` singleton load at operation start. The snapshot is reused for taxonomy, applicability,
validation, presentation, Search, and Describe. There is no process/global cache and no catalog N+1;
existing per-Resource Search attribute hydration remains unchanged.

The deployment payload and `tests/fixtures/cable-catalog.ts` are independent artifacts. The payload is
only trusted write input, the fixture is test-only, and runtime never imports either. Cutover order is:
validate and rehearse the internal installer on a named non-production deployment, verify `INSTALLED`
and stale replay `UNCHANGED`, switch query and mutation roots together, then remove the old literal.
Any production bootstrap requires fresh explicit human authorization after publication; apply and local
checks never deploy or bootstrap production.

After cutover, application rollback selects a compatible Convex-backed release. Catalog data recovery
uses a previously verified versioned payload through the internal OCC installer. If no safe Convex
snapshot exists, fail closed and fix forward—never restore the fixture or add a fallback.

## Architecture checks

`dependency-cruiser` builds the import graph. `tooling/architecture/check.mjs` adds ownership-aware
rules, repository-local metadata and source checks, and excludes `convex/_generated/` from cruising.
The checker inspects only this repository or an explicitly supplied controlled fixture root; it never
inspects the sibling UI repository. The checks reject:

- circular, unresolved, undeclared, and unknown package dependencies;
- platform dependencies in Resource Master public/domain/application code;
- auth composition or local-development adapters entering Resource Master application or Domain;
- provider claim types entering the Resource Master public surface or Domain;
- domain imports outside Resource Master domain;
- application imports of infrastructure;
- public contracts that expose internals;
- Convex entrypoints that import domain/application internals;
- non-test backend consumers that bypass the Resource Master public surface;
- backend source, package, Git, workspace, project, filesystem, submodule, or symlink coupling to
  `garfex-platform-ui`; and
- future `client-facing` contract source that imports backend internals or leaks trusted actor,
  provider, role, or capability concepts.

Run the focused architecture gate and the complete build graph with:

```bash
pnpm test:architecture
pnpm typecheck
pnpm build
```

A controlled violation graph can be inspected with:

```bash
node tooling/architecture/check.mjs tooling/architecture-fixtures/violations
```

That command must exit `1` with named rules; the default valid/current graph must exit `0`.

## External contract decision

TypeSpec is the GARFEX-owned external semantic authority at [`contracts/external-garfex/resource-master/`](../contracts/external-garfex/resource-master/). The generated [consumer semantics](./generated/resource-master-external-contract.md), semantic manifest, and [accepted baseline](../contracts/external-garfex/resource-master/baseline/accepted-semantic-manifest.json) are downstream evidence checked by documentation parity, stale-artifact, and breaking-change gates.

The external surface is exactly `getTaxonomy`, `getEffectiveResourceSchema`, `getValidOptions`, `getNaturalUnits`, `getResource`, `searchResources`, `describeResource`, `createResource`, `updateNonIdentityData`, and `deactivateResource`. Each maps one-to-one to the identically named Resource Master operation: the first seven require `resource:read`, followed by `resource:create`, `resource:update-non-identity`, and `resource:deactivate`. The safe failure codes are `UNAUTHENTICATED`, `FORBIDDEN`, `INVALID_ARGUMENT`, `INVALID_REFERENCE`, `VALIDATION_FAILED`, `NOT_FOUND`, `DUPLICATE`, `CONFLICT`, `INVALID_LIFECYCLE`, `CATALOG_UNAVAILABLE`, and `INTERNAL_FAILURE`; only applicable `fieldIssues`, `existingResourceId`, and `currentRevision` metadata are public.

The four layers remain separate: TypeSpec owns client-safe semantics; the trusted edge validates, authenticates, constructs a fresh actor, maps named operations, projects fields, and normalizes safe errors; Resource Master owns the actor-first contract and final deny-by-default authorization; native Convex is a downstream adapter for GARFEX-owned local/development clients only. Revision `1` is opaque and compared exactly. HTTP, OpenAPI, Scalar, Orval, SDK/publication, productive identity, UI, and version-policy decisions remain unselected.

Related records: [GARFEX boundary](./external-garfex-boundary.md), [external client boundary](./external-client-boundary.md), and [authentication boundary](./auth-boundary.md).

## Shape for future modules

Add a module only when a real capability exists, and give it the same ownership shape:

```text
src/modules/<module>/
├── public.ts
├── domain/
├── application/
│   └── ports/
└── infrastructure/
```

1. Keep invariants in `domain/` free of database, transport, workflow, filesystem, clock, and SDK
   imports.
2. Put use cases and outbound ports in `application/`; inject implementations.
3. Implement ports and platform translation in `infrastructure/`.
4. Expose the smallest stable contract through `public.ts`; other modules depend only on it.
5. Add the owning app/package to the TypeScript reference graph when it produces build output.
6. Add behavior and architecture coverage, then run `pnpm check`.

Temporal workflows, agent harnesses, HTTP or additional transports, and other persistence technologies are
not implemented. The accepted native adapter remains scoped to local/development clients. When introduced, they remain edge adapters and follow the same backend module
contract and ownership rules rather than becoming dependencies of core code. An external client still
requires a distinct client-facing boundary; “GARFEX client” does not imply a shared package or SDK.
Provider-neutral actor contracts,
transport-edge authentication composition, and Resource Master capability authorization are implemented.
The only identity implementation is an explicit fail-closed local-development adapter; there is no
productive identity provider, login UI, User module, or productive auth strategy. See
[`docs/auth-boundary.md`](./auth-boundary.md).
