# Archive Report: external-client-contract-resource-master

## Status

**PASS — archived.** The completed OpenSpec change passed archive preconditions and was moved without archive-time sync or canonical-spec changes.

## Artifacts read

- `proposal.md`
- `specs/external-garfex-boundary/spec.md`
- `design.md`
- `tasks.md`
- `apply-progress.md`
- `verify-report.md`
- `sync-report.md`
- `exploration.md`
- `parent-lifecycle-evidence.md`
- `openspec/config.yaml`

## Preconditions and status

- Active change: `external-client-contract-resource-master`; selection was unambiguous.
- Authoritative store: OpenSpec.
- Native status: `apply=all_done`, `verify=all_done`, `sync=all_done`, `archive=ready`.
- Action context: `repo-local`.
- Workspace and sole allowed edit root: `/home/garfex/PROGRAMACION/garfex-platform`.
- Warnings: none.
- Receipt-driven development: `disabled/unmanaged`.
- Implementation tasks: 44/44 checked; no unchecked implementation task markers remain.
- One unchecked parent-owned future-PR-only row remains intentionally open and is non-blocking:
  `- [ ] Before any future PR, verify the dependency diagram and clean diff for the current unit, run the full final gates, and confirm zero edits under \`openspec/changes/persistent-resource-catalog/\`.`

## Verification and deviations preserved

- Verification is a final maintainer-authorized **PASS**, evidence `sha256:eb61ca5d62ce6a588a89bdb054bf2c3fdfc3b527ca94e0c9016b63515f662fe8`.
- The failed verification revision `sha256:846261020b2c2c629647ee1f4d2612a986db602f7e0685088787bd90b13660d1` and its remediation remain recorded in `verify-report.md`.
- The final reset authorization and one-final-reset settlement are preserved in `verify-report.md` and `apply-progress.md`.
- The two mechanical remediation corrections were the unused `tmpdir` import removal and replacement of a forbidden non-null assertion; no contract semantics or behavior changed.
- The complete final gate evidence, including focused 16-test safety checks, root 358 tests, backend 268 tests, TypeSpec no-emit, non-writing contract checks, typechecks, architecture, build, lint, root check, generated-byte identity, diff-check, and protected-scope checks, remains preserved in `verify-report.md`.
- Unexecuted future-PR checks remain explicitly recorded; no commit, push, PR, review, receipt, publication, deployment, transport, SDK, UI, or productive identity work occurred.

## Sync and canonical changes

- Sync report was successful before archive.
- Domain synced: `external-garfex-boundary`.
- ADDED requirements (16): `TypeSpec is the transport-neutral external authority`; `Three ownership boundaries remain distinct`; `Exact TypeSpec operation exposure and named mappings`; `Client-safe business semantics and public UI metadata`; `Trusted composition and handler responsibilities are separated`; `Resource Master remains the final authorization authority`; `Explicit per-operation requests and success projections`; `Closed safe failure normalization is exhaustive`; `Convex and backend internals remain encapsulated`; `No universal external business API`; `Cross-layer semantic drift is detected`; `Derived artifacts cannot become stale`; `Stable version baseline and deliberate breaking-change detection`; `TypeSpec-aware architecture fitness checks`; `Transport-neutral consumer documentation`; `Scope exclusions and deferred decisions remain explicit`.
- MODIFIED requirements (2): `Runtime validation on both sides of the boundary`; `Canonical boundary documentation`.
- REMOVED requirements: none.
- RENAMED requirements: none.
- No active same-domain change collision was reported.
- No destructive merge was performed; therefore no destructive-sync approval was required.
- Canonical `openspec/specs/external-garfex-boundary/spec.md` was not modified during archive.
- Protected `openspec/changes/persistent-resource-catalog/` remained untouched.

## Archive target

The complete active change directory, including all phase artifacts and reports, was moved to:

`openspec/changes/archive/2026-08-25-external-client-contract-resource-master/`

No active copy remains at `openspec/changes/external-client-contract-resource-master/`.

## Engram traceability

Referenced artifact observations:

- Proposal: observation `1677`
- Spec: observation `1678`
- Design: observation `1679`
- Tasks: observation `1680`
- Apply progress: observation `1685` (cumulative filesystem artifact was also read)
- Final verification: observation `1699`
- Sync report: observation `1703`
