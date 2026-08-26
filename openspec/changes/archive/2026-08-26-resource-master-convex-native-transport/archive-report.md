# SDD Archive Report — resource-master-convex-native-transport

## Status

**PASS — archived.** The completed change passed verification and synchronization preconditions and was moved atomically to:

`openspec/changes/archive/2026-08-26-resource-master-convex-native-transport/`

The active path is absent and the archived change contains the complete pre-archive artifact history plus this report.

## Structured status and action context

- Change: `resource-master-convex-native-transport`, explicitly selected and unambiguous.
- Artifact store: repo-local OpenSpec; Engram archive-topic persistence was also requested and performed separately.
- Native status: `applyState=all_done`, tasks `43/43`, verify `all_done`, archive `ready`, blocked reasons none.
- `actionContext.mode`: `repo-local`.
- Workspace and sole allowed edit root: `/home/garfex/PROGRAMACION/garfex-platform`.
- Action-context warnings: none.
- Receipt review: `disabled/unmanaged`; no review, receipt, or approval was fabricated.
- Delivery: `exception-ok`, one future PR with approved `size:exception`; no commit, push, PR, or review action was performed.

## Artifacts read

- `proposal.md`
- `specs/external-garfex-boundary/spec.md`
- `design.md`
- `tasks.md`
- `apply-progress.md`
- `verify-report.md`
- `sync-report.md`
- `strict-tdd-task-test-ledger.json`
- `openspec/config.yaml`

Persisted tasks were re-read immediately before report write and move. No unchecked implementation task markers remain (`43/43` task rows complete).

## Verification and sync result

- Final verification: **PASS**, `15/15` requirements, `44/44` scenarios, `0` blockers.
- Final verification evidence: `sha256:6d3bf7125d895df65863c3ee91d80ed4907092c59db6a989c08af391ad6f1b5d`.
- Verify report artifact hash: `sha256:2ecea63d042fad6ee48ff99290c56851e5ac591a5df094b599e959b41b5ba5b6`.
- Full final gate: `corepack pnpm check` exit `0`; 36 files / 421 tests. Backend: 25 files / 329 tests. Focused: 15 files / 246 tests. Architecture: 10 tests / 67 modules. Build, typecheck, contract, diff, formatting, and protected-path checks passed.
- Sync: successful; canonical spec was already synchronized and was not changed during archive.
- Canonical spec SHA-256 immediately before archive: `301ca87238953483ddd8b15ad9693d984743a0605ead1bd798c870e866272b05`.
- Canonical spec SHA-256 after archive: unchanged at `301ca87238953483ddd8b15ad9693d984743a0605ead1bd798c870e866272b05`.

### Synced domain and requirements

Domain: `external-garfex-boundary`.

ADDED (7):

1. `Native Convex is the first accepted local and development transport`
2. `Canonical dialect reconciliation precedes native exposure`
3. `Exact ten-operation native parity is mandatory`
4. `Convex validators remain downstream of TypeSpec`
5. `JD-S-002 validation outcomes are explicit and observable`
6. `Native composition preserves trusted authority and safe encapsulation`
7. `Native acceptance requires integrated and real-client evidence`

MODIFIED (8):

1. `Deterministic transport-neutral outcomes`
2. `No internal or Convex leakage`
3. `Architecture fitness enforcement`
4. `Canonical boundary documentation`
5. `Convex and backend internals remain encapsulated`
6. `TypeSpec-aware architecture fitness checks`
7. `Transport-neutral consumer documentation`
8. `Scope exclusions and deferred decisions remain explicit`

REMOVED: none. Renamed: none. Active same-domain collision: none. Destructive merge approval and full-block replacement approval were recorded in `sync-report.md`; no destructive sync was performed during archive.

## Evidence history and deviations

The archive preserves the historical failures, timeouts, maintainer-controlled resets/rescope decisions, and bounded corrections rather than rewriting them. In particular:

- Original timeout output was unavailable; strict-TDD records use explicit `RECONSTRUCTED CONTROLLED-RED` provenance and do not claim historical execution.
- The first verification failed with evidence `sha256:d3857acc014b96e98e1a463e89560e4288f13b116b95d4a8b3d05a1d88a7f5c9`. Bounded corrections resolved the JD-S-002 matrix, strict-TDD ledger provenance, and non-tautological smoke entry behavior.
- Maintainer orchestration performed the recorded continuation/reset/rescope handling for failed or interrupted bounded attempts; this archive phase performed no reset, retry, rescope, runtime attempt, or deployment action.
- Formatting/parity, repeatability, returned-outcome observation, and repository-evidence corrections remain fully recorded in `apply-progress.md`.
- The final real local-anonymous generated-client smoke passed against `JD-S-002/closed-v2`: 34/34 cases, 19 transport rejection, 10 canonical invalid, 5 accepted. Source evidence: `sha256:ade45091eea99ab7546823cf0bed7242a1cab76b96b90f817eb881c7aaf5c786`. Repository evidence: `sha256:cf84bcf7801bbfdf3051633f2938f76a2f16a1cbdc12b3fe7231bacb8b1facbd`.
- The smoke target was `local-anonymous` only; the temporary backend was stopped, with no production target or secret use. The exact internal bootstrap and guarded command sequence remain in the verification/apply artifacts.
- Strict-TDD ledger: 39/39 rows, with reconstructed controlled-RED provenance honestly retained.

## Scope, non-goals, and protected paths

No implementation, tests, deployments, or generated-client network actions were performed by archive. No commit, push, PR, receipt review, or review actor was started. The change does not claim or implement HTTP, productive authentication/deployment/readiness, public Internet exposure, third-party clients, UI behavior, SDK/publication, or another transport. Resource Master domain behavior, authorization policy, persistence design, and catalog design were not redesigned.

`openspec/changes/persistent-resource-catalog/` remained clean and untouched. No archive-time sync fallback was needed.

## Rollback and containment

If acceptance is withdrawn, stop dependent GARFEX-owned local/development clients and revert the native routing, TypeSpec-derived Convex validator generator/artifact, and external projection/normalization adapter as one transport boundary. Preserve TypeSpec semantic authority and Resource Master domain/persistence state. Do not add a fallback family or generic executor, and do not restore legacy map or bare-success behavior as canonical. No production schema or data rollback is applicable; the accepted smoke target was disposable local-anonymous and was stopped.

## Archive integrity

- Active path: absent after move.
- Archived path: complete, including proposal, spec, design, tasks, apply progress, strict-TDD ledger, sync report, verify report, exploration, and this archive report.
- Canonical spec: unchanged during archive.
- Protected change path: clean.
- Engram archive topic: saved as `sdd/resource-master-convex-native-transport/archive-report`; observation ID is reported in the phase envelope.
