# GARFEX platform

GARFEX currently ships one backend capability: the Resource Master v2 Cable slice in
`apps/backend`. It models cable taxonomy, applicability, canonical identity, creation, lookup,
search, and descriptions behind a framework-neutral application contract, with in-memory and
Convex persistence adapters.

## Quick path

Use Node `24.19.0` and pnpm `11.0.0` (both pinned by the repository).

```bash
corepack prepare pnpm@11.0.0 --activate
pnpm install --frozen-lockfile
pnpm check
```

## Repository map

| Path | Current purpose |
| --- | --- |
| `apps/backend/src/resource-master/` | Cable domain, application capability and ports, public contract, catalog, and adapters. |
| `apps/backend/convex/` | Convex schema and validated query/mutation entrypoints. |
| `apps/backend/tests/` | Resource Master behavior, schema, canonicalization, and Convex adapter tests. |
| `tooling/architecture/` | Executable dependency and ownership checks. |
| `tooling/architecture-fixtures/` | Controlled valid and invalid graphs used to prove the checks. |
| `docs/architecture.md` | Current layer rules and the shape required for future modules. |

## Work with the backend

Run the backend tests and type-check directly:

```bash
pnpm --filter @garfex/backend test
pnpm --filter @garfex/backend typecheck
```

For a local Convex deployment, start the CLI from the backend workspace:

```bash
pnpm --filter @garfex/backend exec convex dev --local
```

The first run performs Convex's local setup and writes local environment state, which is ignored.
Convex functions live in `apps/backend/convex/`; they validate transport values and call only the
Resource Master Convex composition adapter. The core domain and application layers do not import
Convex.

## Commands and build graph

| Command | Result |
| --- | --- |
| `pnpm lint` | Run Biome's error-level lint across configured repository files. |
| `pnpm format:check` | Check Biome formatting without writing. |
| `pnpm format` | Write Biome formatting. |
| `pnpm typecheck` | Type-check tooling, valid architecture fixtures, and root test configuration. |
| `pnpm test` | Run backend and tooling tests with V8 coverage reporting. |
| `pnpm test:architecture` | Prove named violations fail, then check valid fixtures and current workspaces. |
| `pnpm build` | Build the root TypeScript reference graph, currently including `apps/backend`. |
| `pnpm check` | Run formatting, lint, type-check, tests, architecture checks, and the build graph. |

## Boundaries and scope

The supported dependency shape is Public capability -> Application -> Domain + Application Port ->
Infrastructure/Convex adapter. Source dependencies remain inverted: application owns the port, and
infrastructure implements it. Consumers use `resource-master/public.ts`; Convex entrypoints may
import the infrastructure composition adapter but not domain or application internals.

Only the Cable catalog (`MATERIAL / CONDUCTORES / CABLE`) exists today. Other resource families,
additional business modules, UI/API transports beyond Convex functions, authentication,
Temporal workflows, agent integrations, and production deployment automation are explicitly
deferred.
