# Surface/UI and Harness boundary

**Status: Accepted**

GARFEX treats a human-facing Surface/UI and an agent Harness as distinct roles. A physical product may provide both mechanisms, but they remain independently replaceable and do not acquire ownership of business behavior.

## ACCEPTED ARCHITECTURE

### Context

In this decision, **Surface/UI** means the human-facing interface role: presentation, navigation, forms, and user-triggered operations. It is not the same as the repository's use of **public surface**, which means a module's stable public application contract.

GARFEX needs a direct path for deterministic user operations and a separate future path for agentic behavior. Combining the Surface and Harness roles would make routine operations depend on agent infrastructure and would blur the ownership boundaries already established for modules.

### Decision

The permanent architectural decision is:

> **Surface/UI != Harness**

A physical product may provide both mechanisms, but they are distinct roles and must remain independently replaceable.

Pi is GARFEX's first planned, replaceable Surface/UI. Pi is **not** selected as the first real Harness. The first real Harness remains an open decision; Pi may later be evaluated alongside alternatives.

Selecting Pi as the first planned Surface does not make Pi GARFEX's architectural identity.

This decision does not claim that Pi Surface integration is implemented.

#### Deterministic route

```text
Surface
  ↓
GARFEX client transport / composition edge
  ↓
Module public application contract
  ↓
Module
```

CRUD, queries, search, navigation, catalog reads, forms, and other deterministic user actions follow this route. Deterministic CRUD must not depend on an Agent Platform, Harness, LLM, model/provider, or agentic execution.

The `GARFEX client transport / composition edge` and the `Module public application contract` are separate boundaries. Framework-neutral module contracts do not permit an external Surface to import module internals or access internal layers. The physical transport remains open: this decision does not select HTTP, RPC, Convex transport, an SDK, JSONL, in-process, out-of-process, or any other mechanism.

#### Future agentic route

```text
Surface
  ↓
Agent Platform
  ↓
Harness
  ↓
GARFEX-controlled agent capability boundary
  ↓
Module public application contract
  ↓
Module
```

This is future high-level architecture only. The internal design of the Agent Platform remains non-canonical and open; it is not defined here.

#### Surface responsibilities and constraints

A Surface:

- owns human interaction, presentation, navigation, and forms;
- initiates deterministic operations through GARFEX boundaries and a GARFEX client; and
- can be replaced by a web, mobile, desktop, or other UI without redefining modules or their contracts.

A Surface does not own business rules or domain authority, import module internals, access module persistence directly, or treat Convex as GARFEX's public contract.

#### Harness responsibilities and constraints

A Harness executes agentic behavior under GARFEX and Agent Platform authority. It is separate from the Surface and must be replaceable without changing the Surface, domain, business modules, or module public application contracts.

Pi remains only a future Harness candidate.

#### Business ownership

Both routes ultimately consume GARFEX capabilities through the owning modules' public application contracts. Modules retain ownership of business rules, invariants, operations, final authorization, public errors, and persistence.

Consuming a capability gives no business ownership to the Surface, Harness, or Agent Platform.

#### Authentication and authorization

This decision neither modifies nor defers the accepted provider-neutral authentication and authorization boundary. Any real Surface that accesses managed data must follow the canonical auth policy:

- the server creates trusted actor context;
- client-supplied identity is never authoritative;
- there is no temporary auth bypass or direct persistence access; and
- the owning module performs final authorization.

Provider-neutral actor contracts, server-side actor construction, and Resource Master capability authorization are implemented. The only identity implementation is an explicit local-development adapter; productive provider selection, login UI, and productive authentication strategy remain open.

#### Forbidden dependency directions

```text
Surface -> module internals
Surface -> module persistence
Surface -> Convex internals

deterministic CRUD -> Agent Platform

Harness -> module internals
Harness -> module persistence
Harness -> Convex

Module -> Pi
Module -> Harness

Domain -> Pi
Domain -> Harness
```

Infrastructure substitution, including placing Convex behind adapters, must not create a Surface or Harness dependency on that infrastructure.

### Consequences

#### Positive

- Surface and Harness implementations can evolve or be replaced independently.
- Deterministic operations avoid agentic complexity, cost, latency, and failure modes.
- Business ownership and final authorization remain stable in the owning modules.
- Module public contracts remain the shared capability boundary for deterministic and agentic consumers.

#### Negative

- GARFEX must define and maintain a client transport/composition edge in addition to module public contracts.
- Future agentic work also requires a GARFEX-controlled agent capability boundary.
- A product that physically combines Surface and Harness mechanisms must still preserve their logical separation.

#### Tradeoffs

- Transport, Harness, model/provider, and Agent Platform details are deliberately deferred, preserving replaceability at the cost of future design and integration decisions.
- Direct deterministic flows duplicate none of the agentic route's flexibility, but they remain simpler, cheaper, and more predictable for ordinary user operations.

#### Open decisions

This decision intentionally leaves the following open:

- the physical Pi ↔ GARFEX transport;
- the physical location or repository of the Pi Surface implementation;
- SDK, RPC, HTTP, Convex transport, or another transport;
- the first real Harness;
- Pi SDK versus RPC if Pi is later selected as a Harness;
- model and provider selection;
- unaccepted internal Agent Platform details;
- concrete GARFEX Tools;
- agentic execution; and
- agentic event transport.

## CURRENT IMPLEMENTATION STATUS

Resource Master is currently the only implemented capability. Its auth boundary is materialized without implementing or selecting a Surface transport. No Pi Surface or Harness integration, Agent Platform, GARFEX Tools, productive identity provider, model/provider integration, or agentic execution is implemented.

Architecture fixtures are dependency-rule fixtures; they are not an Agent Platform implementation.

This decision does not select a transport or first Harness, deploy anything to production, change auth policy, or canonize a full Working Design. The separate auth implementation does not implement Pi, a Harness, or an Agent Platform.

## Related decisions/documentation

- [`docs/architecture.md`](./architecture.md) defines module ownership, stable public application contracts, internal dependency rules, and infrastructure isolation.
- [`docs/auth-boundary.md`](./auth-boundary.md) is the accepted provider-neutral authentication and authorization decision.
- [`README.md`](../README.md) describes current repository scope and provides the repository map.

This decision does not supersede the auth or module-boundary decisions. It replaces no prior decision.
