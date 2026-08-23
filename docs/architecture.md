# Resource Master architecture

The repository is a modular backend with one implemented capability:
`apps/backend/src/resource-master/`. Its Resource Master v2 Cable slice keeps business rules
framework-neutral and isolates Convex behind application-owned ports and infrastructure adapters.

Authentication and authorization will follow the provider-neutral
[auth boundary](./auth-boundary.md): the transport/composition edge creates a trusted actor context,
the application enforces capabilities deny-by-default, and the Domain remains auth-free. This boundary
is blocking before the internal UI or externally reachable managed mutations are introduced.

## Current layout

```text
apps/backend/
├── src/
│   ├── index.ts                         # package-level public type exports
│   └── resource-master/
│       ├── public.ts                    # stable capability and DTO contracts
│       ├── index.ts                     # Resource Master public type exports
│       ├── domain/
│       │   ├── canonicalization.ts
│       │   ├── identity.ts
│       │   ├── schema.ts
│       │   └── types.ts
│       ├── application/
│       │   ├── resource-master.ts       # use-case implementation
│       │   └── ports/
│       │       └── resource-repository.ts
│       └── infrastructure/
│           ├── cable-catalog.ts
│           ├── convex-resource-master.ts
│           ├── convex-resource-repository.ts
│           └── in-memory-resource-repository.ts
└── convex/
    ├── schema.ts                        # Convex tables and indexes
    └── resourceMaster.ts                # validated Convex queries and mutation
```

The checked-in `_generated` Convex bindings are generated integration support, not a domain or
application dependency.

## Direction and ownership

The runtime flow is:

```text
Public capability -> Application use case -> Domain rules + Repository port
                                             Repository port <- Infrastructure/Convex adapter
```

Dependency inversion is intentional. `application/` defines the repository port; infrastructure
implements that port and may depend inward on application/domain types. The core never imports an
adapter or platform SDK.

| Area | Owns and may depend on |
| --- | --- |
| `public.ts` | Stable framework-neutral capability, result, input, and view types; no internal imports. |
| `application/` | Use cases, orchestration, public contract types, domain rules, and application-owned ports. |
| `domain/` | Canonicalization, identity, schema resolution, and domain data types; only its own domain. |
| `application/ports/` | Outbound contracts needed by use cases, currently `ResourceRepository`. |
| `infrastructure/` | Cable catalog and in-memory/Convex implementations; may implement ports and compose use cases. |
| `convex/` | Runtime validators, schema, and exported functions; may call the Convex infrastructure composition only. |

Consumers outside Resource Master import its `public.ts` surface (or the package-level type
re-export), never `domain/`, `application/`, or `infrastructure/` internals.

## Convex isolation

Convex is the current runtime adapter, not the owner of business behavior.

- `convex/resourceMaster.ts` validates arguments and return values and translates runtime failures
  to the public result contract.
- Convex entrypoints import `infrastructure/convex-resource-master.ts`; they must not import Resource
  Master domain or application internals directly.
- `ConvexResourceRepository` implements the application-owned repository port and is the only core
  adapter that reads or writes Convex database values.
- `convex/schema.ts` owns the `resources` and `resourceAttributes` storage schema and indexes.
- Convex SDK and generated types stay out of `public.ts`, `application/`, and `domain/`.
- The in-memory repository remains available for behavior tests without a platform runtime.

## Architecture checks

`dependency-cruiser` builds the import graph. `tooling/architecture/check.mjs` adds ownership-aware
rules and excludes `convex/_generated/` from cruising. The checks reject:

- circular, unresolved, undeclared, and unknown package dependencies;
- platform dependencies in Resource Master public/domain/application code;
- domain imports outside Resource Master domain;
- application imports of infrastructure;
- public contracts that expose internals;
- Convex entrypoints that import domain/application internals; and
- non-test consumers that bypass the Resource Master public surface.

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

Temporal workflows, agent harnesses, additional transports, and other persistence technologies are
not implemented. When introduced, they remain edge adapters and follow the same public contract and
ownership rules rather than becoming dependencies of core code. Authentication is also not yet
implemented; its approved boundary and staged plan are documented in
[`docs/auth-boundary.md`](./auth-boundary.md).
