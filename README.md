# GARFEX platform

GARFEX currently ships one backend capability: the Resource Master v2 Cable slice in
`apps/backend`. It models cable taxonomy, applicability, canonical identity, creation, lookup,
search, and descriptions behind a framework-neutral, actor-first application contract, with
in-memory and Convex persistence adapters. Provider-neutral actor context and deny-by-default
capability authorization are implemented for its ten public operations.

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
| `apps/backend/src/resource-master/` | Cable domain, authorized application capability and ports, public contract, catalog, and adapters. |
| `apps/backend/src/auth/` | Identity adapter boundary, local-development identity, composition roles, and transport-edge actor construction. |
| `apps/backend/convex/` | Convex schema and authenticated, validated query/mutation entrypoints. |
| `apps/backend/tests/` | Resource Master behavior, schema, canonicalization, and Convex adapter tests. |
| `tooling/architecture/` | Executable dependency and ownership checks. |
| `tooling/architecture-fixtures/` | Controlled valid and invalid graphs used to prove the checks. |
| `docs/architecture.md` | Current layer rules and the shape required for future modules. |
| `docs/auth-boundary.md` | Accepted auth boundary, implemented Resource Master capability map, local-development identity limits, and deferred productive auth work. |
| `docs/surface-ui-harness-boundary.md` | Accepted separation of human-facing Surface/UI and agent Harness roles. |
| `docs/external-client-boundary.md` | Accepted independent boundary between this backend and untrusted external clients. |

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

Resource Master calls also require this exact pair in the **server-side local Convex environment**:

```text
GARFEX_RUNTIME_ENV=local-development
GARFEX_AUTH_MODE=local-development
```

Use this pair only for local development; do not commit environment files or configure it in preview,
staging, or production. If either value is absent, partial, mismatched, or non-local, calls fail closed
with `UNAUTHENTICATED`. This is not a production fallback: productive identity-provider integration and
deployment remain unimplemented. See [`docs/auth-boundary.md`](docs/auth-boundary.md) for the canonical
detailed explanation.

The first run performs Convex's local setup and writes local environment state, which is ignored.
Convex functions live in `apps/backend/convex/`; they validate transport values and call only the
Resource Master Convex composition adapter. The core Domain and application layers do not import Convex.

## Authentication status

The Resource Master path constructs trusted `ActorContext` server-side and authorizes capabilities in
application code before catalog or repository work. See [`docs/auth-boundary.md`](docs/auth-boundary.md)
for boundary ownership, the operation map, and deferred productive auth work.

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

The supported backend dependency shape is Public capability -> Application -> Domain + Application
Port -> Infrastructure/Convex adapter. Source dependencies remain inverted: application owns the
port, and infrastructure implements it. In-repository backend consumers use
`resource-master/public.ts`; Convex entrypoints may import the infrastructure composition adapter but
not domain or application internals. External clients do not import that module contract or any
backend source. They may cross repositories only through a separately decided, explicitly public,
versioned, client-safe external contract; no such transport, schema, or SDK is selected here.

Only the Cable catalog (`MATERIAL / CONDUCTORES / CABLE`) exists today. Other resource families,
additional business modules, UI/API transports beyond Convex functions, Temporal workflows, agent
integrations, and production deployment automation are explicitly deferred. There is no User module or
persistence, user management, login UI, productive identity provider, or productive auth strategy. Pi
remains a future replaceable Surface/UI, and its final transport and physical implementation location
remain open. Its source cannot be placed or linked into this backend as a way to resolve that choice.
See [`docs/external-client-boundary.md`](docs/external-client-boundary.md).

## Persistent Resource Catalog authority

The production catalog is one `resourceCatalogSnapshots` Convex aggregate under `resource-master`.
Application owns the pure `ResourceCatalogReader` port; the deployment-only complete-snapshot installer
is internal and is not exported through `public.ts`, clients, or UI. Each query and mutation creates a
fresh Convex reader, loads one indexed bounded snapshot (`take(2)`), and reuses it for the operation.
There is no process cache, catalog fallback, dual read/write, or Resource Search hydration refactor.

Deployment payloads and test fixtures are independent copies: the payload is write input only, the
fixture is test-only, and runtime reads only the persisted Convex document. Cutover is staged, rehearsed
on a named non-production deployment with `convex run ... --deployment <target>`, then released only
with explicit human authorization for any production target. After cutover, application rollback is
to a compatible Convex-backed release; catalog recovery uses a previously verified payload through the
internal OCC installer. Fixture restoration and fallback are never rollback options.
