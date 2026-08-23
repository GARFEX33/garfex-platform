# Authentication and authorization boundary

Authentication is a transport/composition-edge concern. Before GARFEX exposes the internal UI or any managed mutation externally, every UI read and write must require a trusted server-created actor context and pass deny-by-default capability authorization.

This decision is provider-neutral. It applies to GARFEX personnel in one organization; there is no tenant model.

## Decision

| Concern | Decision |
| --- | --- |
| Timing | Auth is blocking before the internal UI launches or an externally reachable managed mutation is enabled, whichever comes first. |
| Authentication | The transport/composition edge verifies identity and creates the actor context. |
| Application | Use cases receive a trusted `ActorContext`; they never accept an actor ID supplied in request arguments. |
| Domain | Domain types and rules know nothing about identity providers, sessions, roles, or capabilities. |
| Authorization | Access is denied unless the actor has the capability required by the operation. |
| Organization | All actors are GARFEX personnel in one organization. Tenant IDs and tenant routing do not exist. |
| Audit readiness | Keep a stable provider-neutral actor ID so later audit records can identify the actor. Audit persistence is deferred. |

## Trust boundary

```text
UNTRUSTED                                      TRUSTED SERVER

Internal UI
  | request arguments (no actor ID)
  v
Transport / composition edge
  |-- authenticate with provider adapter
  |-- translate provider identity -> stable ActorId
  |-- map composition role(s) -> capabilities
  |-- reject missing/invalid identity
  v
Application use case + authorization policy
  |-- require capability (deny by default)
  |-- receive trusted ActorContext separately from input
  v
Domain rules ---------------> Application-owned ports
  (auth-free)                       |
                                    v
                           Infrastructure / Convex adapters
```

The UI must not call Convex internals directly. Exported transport functions are the enforcement point and may call only the composed application capability. Provider and Convex identity types remain behind their adapters.

## Actor contract

The conceptual application-facing artifact is intentionally small and in English:

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

The server constructs this context after successful authentication. Request DTOs do not contain `actorId`, provider claims, roles, or capabilities. `ActorId` is stable across requests and provider-neutral; provider subject IDs and session/token objects do not cross the adapter boundary.

## Capabilities and suggested roles

Capabilities describe allowed actions. Roles are only composition configuration that expands to capabilities; they are not Domain concepts.

| Capability | Allows |
| --- | --- |
| `resource:read` | Read and search managed resources. |
| `resource:create` | Create a resource through the application contract. |
| `resource:update-non-identity` | Update mutable descriptive fields, never canonical identity fields. |
| `resource:deactivate` | Deactivate a resource through an explicit use case. |
| `catalog:admin` | Reserved for future catalog administration; it grants nothing until that capability is implemented. |

Suggested initial mapping:

| Composition role | Capabilities |
| --- | --- |
| Viewer | `resource:read` |
| Editor | Viewer capabilities plus `resource:create` and `resource:update-non-identity` |
| Admin | Editor capabilities plus `resource:deactivate`; reserve `catalog:admin` for explicit future assignment |

Mappings are configuration, not an inheritance model in the application or Domain. Adding a use case requires naming its required capability and updating mappings deliberately; unknown operations remain denied.

## Request and denial flow

1. The UI sends operation input without identity or authorization fields.
2. The edge asks the provider adapter to authenticate the request.
3. Missing, invalid, or expired authentication stops at the edge with `UNAUTHENTICATED`.
4. The composition layer resolves a stable `ActorId`, maps roles to capabilities, and creates `ActorContext`.
5. The authorization policy checks the capability required by the application operation.
6. An authenticated actor lacking that capability receives `FORBIDDEN`; the use case and repository are not invoked.
7. An allowed request invokes the application contract with actor context separate from operation input, then proceeds through existing ports and adapters.

Transport status codes may vary, but the public error contract exposes only `UNAUTHENTICATED` or `FORBIDDEN`, not provider names, claim failures, token details, role internals, or whether a protected resource exists. Business validation and not-found results remain separate application errors after authorization succeeds.

## Adapter responsibilities

- **Identity provider adapter:** validate provider credentials/session state and translate the provider subject to a stable provider-neutral `ActorId`.
- **Composition adapter:** map trusted personnel roles to capabilities and create immutable `ActorContext`.
- **Transport adapter:** require authentication for every UI read/write, select the required capability, normalize auth errors, and keep actor data out of request arguments.
- **Application policy:** centralize operation-to-capability checks and deny missing or unknown grants by default.
- **Convex adapter:** translate persistence values only; do not expose Convex identity types or generated internals to the UI, application, or Domain.

## Required tests and threat invariants

Contract and policy tests must prove:

- every UI operation declares a required capability and unknown operations are denied;
- no actor ID, role, capability, provider claim, or token is accepted from request arguments;
- absent or invalid authentication returns `UNAUTHENTICATED` before application work;
- an authenticated actor without the required capability returns `FORBIDDEN` without repository work;
- each minimal capability allows only its named operation, including the non-identity update restriction;
- role mappings are tested at composition level and do not enter Domain tests;
- provider and Convex identities are translated at adapters and never leak into public errors or core contracts; and
- the UI can reach managed data only through authenticated transport entrypoints, never Convex internals.

These are security invariants, not UI conventions. Client-side route guards or hidden controls may improve usability but never satisfy enforcement.

## Staged implementation plan

1. **Contract and policy tests:** introduce `ActorContext`, capability vocabulary, operation requirements, deny-by-default behavior, and negative tests first.
2. **Provider adapter selection:** evaluate and select a provider, then implement identity-to-`ActorId` translation without changing core contracts.
3. **Edge enforcement:** authenticate every UI read/write, construct actor context server-side, and enforce capabilities before use-case execution.
4. **Integration tests:** exercise authenticated, unauthenticated, forbidden, adapter-leakage, and direct-access denial paths across the transport boundary.
5. **Deployment safeguards:** keep externally reachable managed mutations and the internal UI disabled until auth configuration and integration checks pass; fail closed when configuration is absent.

## Non-goals

This decision does not select or install an identity provider, build a login UI, introduce multi-tenancy, support machine-to-machine authentication, persist audit events, or implement catalog administration. It also does not move authorization into the Domain or make roles part of business modeling.
