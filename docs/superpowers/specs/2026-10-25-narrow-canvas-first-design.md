# Narrow Canvas-First Layout Design

**Date:** 2026-10-25  
**Status:** owner-approved bounded milestone  
**PR:** #1 on `codex/studio-and-field-guide`

## Intent

At widths up to 760px, make the drawing surface the first usable product area without scrolling, while keeping the existing drawing, undo/redo, persistence, parser, and Field guide behavior unchanged.

## Goals

- Place the complete drawing canvas before the control/state panel in the initial 760×900 viewport.
- Preserve the current desktop layout above 760px.
- Give the canvas instructions a computed contrast ratio of at least 4.5:1.
- Bind acceptance to real Playwright screenshots at 1280×900 and 760×900.

## Non-goals

No parser, recognition, activation, storage, cloud sync, final art direction, new assets, deployment, or merge work.

## Approaches

1. **Selected — responsive CSS order and sizing.** Reorder the existing grid items visually at ≤760px, constrain the canvas to the available first viewport, and strengthen the existing hint color/surface. This is the smallest change and does not duplicate stateful DOM.
2. Move nodes with JavaScript on resize. Rejected because it adds lifecycle and focus-order risk for a layout-only problem.
3. Replace controls with a new drawer. Rejected because it changes interaction scope and needs separate keyboard/accessibility design.

## Acceptance

- A Playwright test fails on the current head because the full canvas extends below the initial 760×900 viewport.
- A Playwright contrast test fails on the current head because the hint contrast is below 4.5:1.
- Minimal CSS makes both tests pass without changing application JavaScript or storage behavior.
- Full unit tests, build, both viewport journeys, and screenshot artifacts pass in CI.

## Rollback

Revert the bounded responsive-layout commit. Do not merge or deploy automatically.
