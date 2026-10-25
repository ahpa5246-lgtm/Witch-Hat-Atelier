# Undo/redo activation continuity implementation plan

**Spec:** `docs/superpowers/specs/2026-10-25-undo-redo-activation-design.md`

**Goal:** Let a user undo a sealed recognized spell back to a prepared drawing and redo it to the same active spell, with diagnostics, effects, and browser-local draft staying synchronized.

**Global constraints:** Continue PR #1 on `codex/studio-and-field-guide`; do not merge, deploy, add dependencies, or alter recognition semantics. Use strict RED → GREEN evidence from GitHub Actions.

## Task 1: Browser contract (RED)

**Files**

- Modify: `tests/e2e/drawing-continuity.spec.js`

**Steps**

1. Add a helper that seeds local storage with a deterministic open ring, the real Fire template, and a final closing arc.
2. Add a desktop-only test that asserts the initial active state, Undo availability, prepared state after Undo, active state after Redo, exact draft counts, and active persistence after reload.
3. Run `npm test` locally to ensure unit coverage remains green.
4. Commit only the test and observe the GitHub Actions browser test fail because Undo is disabled on an active spell.

**Expected:** Unit tests pass. CI fails at the explicit `Undo` enabled assertion, establishing the regression.

## Task 2: Minimal history unlock (GREEN)

**Files**

- Modify: `src/ui/spellSummaryView.js`

**Steps**

1. Remove the ring-closed condition from Undo button disabling; keep the empty-store guard.
2. Keep drawing capture locked while a ring is closed.
3. Run the targeted Playwright test, the full Playwright suite, `npm test`, and `npm run build`.
4. Commit the minimal production change and observe the full GitHub Actions workflow pass.

**Expected:** Undo is enabled for any non-empty closed drawing; the new browser journey and all existing checks pass.

## Task 3: Evidence and review ledger

**Files**

- Modify: `docs/DEVELOPMENT_REVIEW.md`
- Update: PR #1 body if needed

**Steps**

1. Record the RED and GREEN run IDs, exact commands/results, browser project, screenshots, and any remaining gaps.
2. Confirm the PR remains open, draft, and unmerged.
3. Run a whole-stage review against this spec and record any rulings or deferred minor findings.

**Expected:** The review document distinguishes verified behavior from remaining work and links the reproducible CI evidence.

## Review focus

- Undo must remain available on both valid and invalid closed rings when strokes exist.
- New drawing input must remain locked while a ring is closed.
- Undo/redo must update SpellIR, visual activation, and local storage through the same recomputation path.
- The test fixture must exercise the real dictionary/parser/compiler rather than a production debug hook or mock.
