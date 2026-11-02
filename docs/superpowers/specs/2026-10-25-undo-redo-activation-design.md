# Undo/redo activation continuity design

## Context

The studio already recomputes the parser, compiler, diagnostics, effects, and browser-local draft after every undo and redo. However, the summary view disables **Undo** whenever a ring is closed. That makes an active spell, and several invalid closed-ring states that explicitly tell the user to undo, impossible to correct.

This stage proves one complete user journey: a recognized prepared spell is sealed, undone back to a prepared state, and redone back to the same active state without losing or duplicating draft strokes.

## Decision

Keep the existing stroke history and recomputation pipeline as the single source of truth. Closed rings continue to lock new drawing input, but they must not lock history navigation. Undo removes the latest stroke, recomputation reopens the ring and deactivates the effect, and redo restores that exact stroke and recomputes the active spell.

The browser contract uses a deterministic drawing made from:

- a hand-defined open ring;
- the repository's real `fire` sigil template, scaled into the ring;
- a hand-defined closing arc stored last.

The test observes the real UI and persisted draft: status, portal-active styling, diagnostic SpellIR, and local-storage stroke count. It does not mock parser or compiler behavior.

## Alternatives considered

1. **Add only a browser test.** Rejected because the current UI intentionally disables Undo for the failing state; production behavior must change.
2. **Unlock Undo and reuse the current recompute pipeline.** Selected because every required downstream update already occurs in `recompute()` and the stroke store already preserves redo history.
3. **Add a separate activation-history state machine.** Rejected because it would duplicate derivable parser/compiler state and create two sources of truth.

## Acceptance criteria

On the desktop browser project:

1. A persisted, recognized fire seal loads as `Active spell`, has an active SpellIR, and applies the active canvas treatment.
2. Undo is available even though the sealed canvas remains locked against new ink.
3. One Undo removes exactly the closing stroke, persists the lower stroke count, changes status to `Prepared spell`, deactivates SpellIR, and removes the active canvas treatment.
4. One Redo restores exactly that stroke, persists the original count, returns status and SpellIR to active, and restores the active canvas treatment.
5. Reloading after Redo preserves the active state and the original stroke count.

## Non-goals

- No recognition threshold or dictionary changes.
- No new symbols, gestures, keyboard shortcuts, or visual redesign.
- No cross-device persistence.
- No change to the rule that a closed ring blocks additional drawing.

## Risks and controls

- **Fixture accidentally tests an invalid seal:** assert the active status and diagnostic SpellIR before attempting Undo.
- **Undo changes UI but not storage:** assert the exact persisted stroke count after both history actions and reload.
- **Redo creates a new stroke rather than restoring history:** require the original count and active state after Redo.
- **Responsive scaling changes recognition:** limit this acceptance test to the desktop Playwright project; narrow layout remains covered by its existing viewport tests.
