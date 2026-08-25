# External Client Contract != Resource Master Public Application Contract

This is the canonical GARFEX boundary record. It defines transport-neutral business meaning for ten
Resource Master workflows without making the in-process application contract, authentication authority,
Convex infrastructure, or any future consumer public.

## Quick path

1. Validate a closed external business request before trusted work.
2. Resolve identity through the server-only `TrustedActorResolver` and create a fresh `ActorContext`.
3. Call one named Resource Master operation, which performs the final deny-by-default capability check.
4. Project and validate one reviewed success or one closed external failure.

This change creates no network reachability. The named functions are a trusted backend seam, not a route,
transport, SDK, or universal API.

## Closed operation contract

GARFEX owns exactly these ten external operations. Each row is a direct, one-to-one mapping; a new
Resource Master method remains private until a separately reviewed compatibility change adds it.

<!-- garfex:operation-parity:start -->
| External operation | Resource Master operation | Capability |
| --- | --- | --- |
| `getTaxonomy` | `getTaxonomy` | `resource:read` |
| `getEffectiveResourceSchema` | `getEffectiveResourceSchema` | `resource:read` |
| `getValidOptions` | `getValidOptions` | `resource:read` |
| `getNaturalUnits` | `getNaturalUnits` | `resource:read` |
| `getResource` | `getResource` | `resource:read` |
| `searchResources` | `searchResources` | `resource:read` |
| `describeResource` | `describeResource` | `resource:read` |
| `createResource` | `createResource` | `resource:create` |
| `updateNonIdentityData` | `updateNonIdentityData` | `resource:update-non-identity` |
| `deactivateResource` | `deactivateResource` | `resource:deactivate` |
<!-- garfex:operation-parity:end -->

There is no generic `execute`, `dispatch`, CRUD, repository, table, operation registry, automatic
publication path, or universal business API. Future edge selection must call these named functions
explicitly; unknown operation identifiers fail closed.

## Reviewed request and success summaries

The request side accepts only reviewed business values. `ActorContext`, actor IDs, roles, capabilities,
claims, tokens, credentials, sessions, provider values, persistence values, Convex values, and deployment
or catalog-administration values are not business DTO fields. Unknown fields fail closed.

| Operation | Request summary | Success summary |
| --- | --- | --- |
| `getTaxonomy` | No business fields. | Taxonomy entries, families, and types with `code` and `name`. |
| `getEffectiveResourceSchema` | `classCode`, `familyCode`, `typeCode`. | Attributes with `code`, `name`, `kind`, `meaning`, `defaultResult`, and conditional `rules`; each result has `mode` and `identity`. |
| `getValidOptions` | `attributeCode`. | Option entries with `code` and `label`. |
| `getNaturalUnits` | `familyCode`. | `allowed` and `suggested` units, each with `code` and `name`. |
| `getResource` | `resourceId`. | Reviewed resource shape. |
| `searchResources` | `terms`; optional `lifecycle`, bounded `limit`, and opaque nullable `cursor`. | `items` with resource summary fields and nullable opaque `cursor`. |
| `describeResource` | `resourceId`. | `resourceId` and `description`. |
| `createResource` | Taxonomy codes, `naturalUnitCode`, and closed business `attributes`. | Reviewed resource shape for the created resource. |
| `updateNonIdentityData` | `resourceId`, non-negative safe `expectedRevision`, `naturalUnitCode`. | Reviewed resource shape for the updated resource. |
| `deactivateResource` | `resourceId`, non-negative safe `expectedRevision`. | Reviewed resource shape for the deactivated resource. |

A reviewed resource shape contains `resourceId`, taxonomy codes, `naturalUnitCode`, projected
`attributes`, `canonicalIdentity`, `identityPolicyVersion`, `active`, and `revision`. Each projected
attribute contains only `attributeCode`, `value`, `displayValue`, and `identityParticipating`.
`value` is a string, boolean, or quantity with only `magnitude` and `unitCode`.

Search optionals remain omitted when omitted, so Resource Master owns its defaults. A supplied cursor is
validated only as a non-empty opaque value, copied unchanged, and never decoded or constructed here.
The final page is represented by `cursor: null`.

## Trusted identity and authorization flow

The server-only identity adapter consumes existing provider-neutral authentication composition; it does
not consume a raw business request. It returns `null` for absent or failing authentication. On success,
`TrustedActorResolver` creates a fresh actor with a copied capability set:

```text
untrusted business request
  -> closed request validator
  -> TrustedActorResolver (trusted server authentication composition)
  -> fresh ActorContext, separate from business input
  -> one named external invocation
  -> matching Resource Master public application method
  -> exact Resource Master deny-by-default capability check
  -> catalog/repository work only after authorization
  -> field-by-field projection or safe error normalization
  -> closed ExternalOutcome validation
```

Authentication is necessary but not sufficient authorization. Resource Master remains the final authority:
its existing exact capability map denies missing, mismatched, unknown, or unmapped operations before
catalog or repository work. The external edge does not copy that policy or perform an edge capability
pre-check. An unauthenticated request returns `UNAUTHENTICATED` before Resource Master or downstream work.

## Closed failures and metadata

Internal messages, stacks, provider details, authority details, persistence details, Convex details,
catalog state, and configuration diagnostics never cross the boundary. The exact external failure set
and its only allowlisted metadata are machine-checked below.

<!-- garfex:error-parity:start -->
| External code | Source semantics | Allowlisted metadata |
| --- | --- | --- |
| `UNAUTHENTICATED` | Missing identity or trusted authentication failure. | `none` |
| `FORBIDDEN` | Resource Master denied the required capability. | `none` |
| `INVALID_ARGUMENT` | Malformed request or internal invalid argument. | `fieldIssues` |
| `INVALID_REFERENCE` | Internal invalid reference. | `fieldIssues` |
| `VALIDATION_FAILED` | Internal validation failure. | `fieldIssues` |
| `NOT_FOUND` | Resource Master not found result. | `none` |
| `DUPLICATE` | Internal duplicate result. | `existingResourceId` when externally valid. |
| `CONFLICT` | Internal revision conflict. | `currentRevision` when a non-negative safe integer. |
| `INVALID_LIFECYCLE` | Invalid lifecycle transition. | `none` |
| `CATALOG_UNAVAILABLE` | Catalog unavailable or uninitialized. | `none` |
| `INTERNAL_FAILURE` | Integrity, invalid catalog, unknown, thrown, or invalid-output failure. | `none` |
<!-- garfex:error-parity:end -->

A field issue contains only an external field path and one of `REQUIRED`, `TYPE`, `UNKNOWN_FIELD`,
`OUT_OF_RANGE`, or `INVALID_VALUE`. Invalid metadata or unknown failures become metadata-free
`INTERNAL_FAILURE`; diagnostics remain server-only.

## Compatibility ownership and evidence

GARFEX owns the external compatibility surface: operation identifiers, direct mappings, accepted request
meanings, projected success fields, failure codes, and allowlisted metadata. Internal Resource Master or
Convex changes do not publish new external behavior automatically. Any observable change needs explicit
review, updated representative evidence, and migration intent.

The repository evidence is:

- `apps/backend/tests/fixtures/external-garfex-boundary/compatibility.json` — serialized test evidence
  for every operation, representative success/failure, all eleven error codes, and opaque cursors;
- `apps/backend/tests/external-garfex-compatibility.test.ts` — validator-backed operation and fixture
  parity; and
- `apps/backend/tests/external-garfex-documentation-parity.test.ts` — machine-readable parity for this
  document's operation, mapping, error-metadata, and non-decision markers.

JSON in the compatibility fixture is test evidence only. It does not select JSON, HTTP, RPC, Convex, or
any other distributed transport or protocol.

Run the focused evidence checks from the repository root:

```text
corepack pnpm --filter @garfex/backend exec vitest run tests/external-garfex-documentation-parity.test.ts tests/external-garfex-compatibility.test.ts
corepack pnpm test:architecture
corepack pnpm --filter @garfex/backend typecheck
corepack pnpm exec biome format docs/external-garfex-boundary.md docs/architecture.md docs/external-client-boundary.md docs/auth-boundary.md
corepack pnpm exec biome lint apps/backend/tests/external-garfex-documentation-parity.test.ts
```

## Convex encapsulation

Convex remains a private infrastructure and platform adapter behind Resource Master application-owned
ports. No external contract source imports Convex or generated bindings; no Convex entrypoint exposes
this boundary; no persistence record, document identifier, catalog installer, or deployment value is an
external field. Resource Master authorization and projections remain the only path to business results.

## Explicit non-decisions

The following markers are intentionally machine-checked and remain open:

<!-- garfex:non-decisions:start -->
```text
transport-protocol-status-framing
network-reachability
schema-idl-generation
sdk-distribution-version-mechanics
productive-idp-session
consumer-behavior
```
<!-- garfex:non-decisions:end -->

- **Transport, protocol, status, and framing:** no HTTP, RPC, Convex-mediated exposure, route, status-code
  mapping, serialization protocol, or framing is selected.
- **Network reachability:** this semantic seam is not a network endpoint and makes no reachability claim.
- **Schema, IDL, and generation:** no schema or IDL source, runtime-validation technology, code-generation
  tool, artifact format, or generation direction is selected.
- **SDK, distribution, and version mechanics:** no SDK, generated client, package, registry, hosting,
  version identifier, compatibility window, deprecation rule, or distribution process is selected.
- **Productive IdP and session:** no productive identity provider, credential, token, claim, session,
  provisioning, machine-identity, or deployment authentication strategy is selected.
- **Consumer behavior:** no consumer repository, UI workflow, client implementation, or consumer-specific
  behavior is assumed or inspected.

These open decisions preserve the distinction between semantic compatibility ownership and a future
transport or product integration.

## Linked boundary records

- [Architecture](./architecture.md) records the dependency direction and Convex isolation.
- [Independent external client boundary](./external-client-boundary.md) records repository independence
  and points to this concrete GARFEX semantic contract.
- [Authentication and authorization boundary](./auth-boundary.md) records provider-neutral composition,
  trusted actor construction, and Resource Master final authorization.
