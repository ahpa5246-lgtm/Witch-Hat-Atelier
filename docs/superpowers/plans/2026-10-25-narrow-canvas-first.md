# Narrow Canvas-First Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep the complete spell canvas and readable instructions in the first 760×900 viewport without regressing desktop or drawing continuity.

**Architecture:** Retain the existing HTML and JavaScript. Add acceptance coverage to the existing Playwright journey, then make a narrow-only CSS change that reorders and sizes the existing panels and raises hint contrast.

**Tech Stack:** HTML, CSS Grid, Vite, Playwright

**Spec:** `docs/superpowers/specs/2026-10-25-narrow-canvas-first-design.md`

## Global Constraints

- Continue PR #1 branch `codex/studio-and-field-guide`; create no new branch or PR.
- No parser, drawing-state, storage, dependency, deployment, merge, or paid-service changes.
- Desktop behavior above 760px remains unchanged.
- Evidence must include CI, 1280×900 and 760×900 screenshots, and an updated `docs/DEVELOPMENT_REVIEW.md`.

## Review Focus

- 760×900 initial load: the entire canvas fits before any scroll.
- 760px breakpoint boundary: the narrow rule applies without horizontal overflow.
- 761px desktop boundary: existing two-column studio remains intact.
- Canvas hint: computed foreground/background contrast is at least 4.5:1.
- Drawing continuity: draw → guide → return → reload remains green.

---

### Task 1: Narrow viewport acceptance and minimal layout repair

**Files:**
- Modify: `tests/e2e/drawing-continuity.spec.js`
- Modify: `assets/css/styles.css`
- Modify: `docs/DEVELOPMENT_REVIEW.md`

**Interfaces:**
- Consumes: existing `#glyphCanvas`, `#canvasHint`, `.canvas-shell`, `.canvas-panel`, and `.control-panel`.
- Produces: responsive layout behavior only; no JavaScript API changes.

- [ ] **Step 1: Write failing Playwright tests**

Add a narrow-project test asserting the complete canvas bounding box fits within the initial viewport without scrolling, and a computed-color test asserting hint contrast ≥4.5:1.

- [ ] **Step 2: Run CI to verify RED**

Expected: the narrow layout test fails because the canvas bottom exceeds 900px; the contrast test fails near 4.25:1.

- [ ] **Step 3: Implement the minimal CSS**

At `max-width: 760px`, order the canvas before controls, size it to fit the remaining first viewport, and strengthen the hint color/background enough to satisfy 4.5:1. Do not change JavaScript.

- [ ] **Step 4: Verify GREEN**

Run `npm test`, `npm run build`, and `npm run test:e2e`. Expected: all pass for desktop and narrow projects.

- [ ] **Step 5: Record evidence**

Update `docs/DEVELOPMENT_REVIEW.md` with commit SHA, CI run, screenshots inspected, limitations, and rollback. Keep PR #1 draft.
