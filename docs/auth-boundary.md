# Authentication and authorization boundary

**Status: Accepted and implemented for the Resource Master transport/application path**

Authentication is a transport/composition concern. Resource Master application code owns deny-by-default capability authorization, and the Domain remains auth-free. The current implementation is provider-neutral and single-organization; it does not provide productive authentication or a tenant model.

## Decision

| Concern | Decision |
| --- | --- |
| Authentication | The transport/composition edge resolves trusted identity and constructs `ActorContext` server-side. |
| Invocation | Application operations receive trusted actor context separately and actor-first from business input. Request input never supplies authoritative actor data. |
| Authorization | Resource Master application code maps every public operation to a capability and denies missing or unknown mappings by default. |
| Domain | Domain types and rules know nothing about identity providers, sessions, roles, or capabilities. |
| Roles | Roles are composition-only mappings to capabilities. Modules authorize capabilities, never role names. |
| Organization | All actors are GARFEX personnel in one organization. Tenant IDs and tenant routing do not exist. |
| Audit readiness | `ActorId` is stable and provider-neutral so future audit records can identify an actor. Audit persistence remains deferred. |

## Trust boundary

```text
UNTRUSTED                                      TRUSTED SERVER

Future Surface or other caller
  | business input (no authoritative actor data)
  v
Transport / composition edge
  |-- resolve trusted identity through an adapter
  |-- translate identity -> provider-neutral ActorId
  |-- map composition role/configuration -> capabilities
  |-- reject missing or invalid identity
  v
Resource Master application operation
  |-- receive ActorContext separately, actor-first
  |-- require mapped capability (deny by default)
  v
Domain rules ---------------> Application-owned ports
  (auth-free)                       |
                                    v
                           Infrastructure / Convex adapters
```

Convex is infrastructure, not an identity authority or public business contract. Convex/provider claim types do not reach the Domain.

The concrete GARFEX external path is recorded in the [canonical boundary](./external-garfex-boundary.md).
Its dependency arrow is:

```text
external business input -> TrustedActorResolver -> fresh ActorContext
                         -> Resource Master public operation -> final capability authorization
```

`TrustedActorResolver` is a server-only adapter over the existing provider-neutral composition; it does
not select a productive IdP or accept actor authority from business input.

## Materialized actor contract

```ts
type ActorId = string & { readonly __brand: "ActorId" };

type Capability =
  | "resource:read"
  | "resource:create"
  | "resource:update-non-identity"
  | "resource:deactivate"
  | "catalog:admin";

type ActorContext = Readonly<{
  actorId: ActorId;
  capabilities: ReadonlySet<Capability>;
}>;
```

The edge constructs `ActorContext` from trusted server-side identity. Business DTOs contain no `actorId`, provider claims, roles, or capabilities. `catalog:admin` is reserved and behaviorless: no current Resource Master operation maps to it.

## Resource Master capability map

All ten public operations are mapped explicitly:

| Capability | Operations |
| --- | --- |
| `resource:read` | `getTaxonomy`, `getEffectiveResourceSchema`, `getValidOptions`, `getNaturalUnits`, `getResource`, `searchResources`, `describeResource` |
| `resource:create` | `createResource` |
| `resource:update-non-identity` | `updateNonIdentityData` |
| `resource:deactivate` | `deactivateResource` |
| `catalog:admin` | None; reserved for future catalog administration. |

Unknown or unmapped operation names fail closed. Adding an operation requires a deliberate capability mapping.

## Roles remain composition-only

The implemented composition mappings are:

| Composition role | Capabilities |
| --- | --- |
| Viewer | `resource:read` |
| Editor | Viewer capabilities plus `resource:create` and `resource:update-non-identity` |
| Admin | Editor capabilities plus `resource:deactivate` |

These mappings are not an inheritance model in the application or Domain. Resource Master authorizes only capabilities.

## Request and denial flow

1. The caller supplies business input without authoritative identity or authorization fields.
2. The transport/composition edge resolves identity through its configured adapter.
3. Missing, invalid, rejected, or unavailable identity returns sanitized `UNAUTHENTICATED` before application invocation.
4. The edge constructs trusted `ActorContext` and passes it separately, actor-first, to the operation.
5. Resource Master checks the operation's required capability before catalog, repository, or persistence access.
6. A missing capability or unknown operation returns sanitized `FORBIDDEN` before that work begins.
7. Only an authorized request proceeds through business validation, Domain rules, and application-owned ports.

Public auth errors expose no provider names, claim failures, token details, role internals, or protected-resource existence. Business validation and not-found results remain separate application errors after authorization succeeds.

## Local development identity adapter

An explicit Local Development Identity Adapter resolves one fixed provider-neutral development `ActorId`. It grants:

- `resource:read`;
- `resource:create`;
- `resource:update-non-identity`; and
- `resource:deactivate`.

It does not grant `catalog:admin`.

The adapter activates only when both server-side values match exactly:

```text
GARFEX_RUNTIME_ENV=local-development
GARFEX_AUTH_MODE=local-development
```

Missing, partial, mismatched, unknown, preview, staging, or production values fail closed with `UNAUTHENTICATED`. The adapter is never a fallback and is not a productive identity strategy. This documents code behavior, not a production deployment configuration.

## Security invariants

The implementation and its tests enforce that:

- trusted actor context is server-created and separate from business input;
- every current Resource Master operation has an explicit required capability;
- unknown operations are denied;
- unauthenticated requests stop before application invocation;
- forbidden requests stop before catalog, repository, or persistence work;
- roles stay at composition and provider/Convex identity types stay out of Domain; and
- auth errors are sanitized.

Client-side route guards or hidden controls may improve usability but never satisfy enforcement.

## Open and deferred work

There is no User domain, module, or persistence; user management; login UI; productive identity provider; or productive authentication strategy. Pi remains only a future replaceable Surface/UI, and its physical transport remains open. Before any productive or externally reachable use, GARFEX still needs an explicitly selected productive identity adapter, deployment configuration, and integration validation.

This decision does not introduce multi-tenancy, machine-to-machine authentication, audit persistence, or catalog administration. It does not move authorization into Domain or make roles part of business modeling.
