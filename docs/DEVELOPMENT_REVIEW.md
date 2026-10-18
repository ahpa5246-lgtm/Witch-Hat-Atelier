# Witch Hat Atelier: engineering review, 2026-10-18

## Scope and intent
Owner requested continued implementation and severe comparison with released products. This is the first bounded repair milestone, not a full completion claim. Local/offline architecture is retained; no new paid service or deployment.

Core journey: Draw → consult field guide → return → correct strokes.

## Decision and implementation
Separate Drawing studio and Field guide. Retain drawing while guide is open. Ignore hidden canvas resize events to prevent scaling all ink into 1px. Add redo with redo-history rescaling and invalidate obsolete redo history after new ink. Fix Node test discovery and project link.

The next bounded continuity milestone adds browser-local draft persistence. Completed strokes are saved after drawing, undo, redo, clear and canvas resizing. A refresh restores them at the current canvas dimensions; corrupt or unsupported data is ignored, storage failures do not stop drawing, and Clear removes the stored draft. This is local continuity only, not an account or cloud-sync feature.

The large-draft acceptance boundary now rejects drafts above 500 strokes, 20,000 points, or 1,000,000 serialized characters before restoration. Oversized or malformed stored drafts are removed so they are not parsed again on every startup; an oversized save fails without replacing storage. The limits are intentionally generous for a single 1200×800 spell diagram while bounding JSON parsing, repeated stroke-store reconstruction, and per-frame cloning. During verification, a newly disclosed high-severity toolchain audit was also cleared by resolving Vite 6.4.4, PostCSS 8.5.30, Nano ID 3.3.20, and source-map-js 1.2.2 in the lockfile.

Alternative: decorate the existing home page while leaving workflows and state bugs unchanged. Rejected because appearance cannot repair lost results or crowded controls. Existing architecture remains intact.

## Reference research
Official feature/product pages consulted for task hierarchy and separation of primary work from setup/reference. No source, artwork, icon or layout copied:
https://excalidraw.com/
https://www.tldraw.com/
https://www.inklestudios.com/inklewriter/

Web-text inspection is not a visual screenshot comparison. These sources are a starting shortlist, not completed visual evidence. Do not mark the comparative design gate passed. A missing or inaccessible visual reference remains an open item.

## Evidence and harsh self-review
40 Node tests pass, including nine draft-storage cases covering resize-aware restoration, corrupt data, clearing, storage failures, restoration into the real stroke store, point and stroke restoration budgets, and rejection of an oversized save. The two new restoration-budget tests were confirmed red against the prior implementation and green after the guard. Vite production build passes. `npm audit --audit-level=high` reports zero vulnerabilities after the patch-only lockfile update. Browser interaction remains pending: no local Chromium/Firefox executable was available, and the remote browser could not reach the local Vite server. No claim of refresh-level browser verification, final art direction or complete visual QA.

Synthetic Node 24.19 profiling of the prior unrestricted serializer measured 10,000 points at 417,491 characters (3.30 ms save / 2.29 ms load), 50,000 at 2,132,021 (10.43 / 14.89 ms), and 100,000 at 4,275,211 (31.69 / 34.98 ms). Those timings exclude stroke-store reconstruction, classification, rendering and browser storage I/O, so they are lower bounds rather than browser performance claims.

The Senior Skills example visual gate was run and correctly returned BLOCKED_UNVERIFIED_DESIGN; its draft lacks verified asset licenses. That result is framework evidence, not a project-specific visual pass. Actual screenshots, app-commit binding, keyboard/RTL checks, and task observations are required before release readiness.

## Next acceptance boundary
Verify drawing→refresh→restored drawing and drawing→guide→return at desktop/narrow widths in a real browser; test recognition and activation after undo/redo. Keep persistence browser-local until those journeys and the draft-limit fallback are exercised in a real browser.

Rollback: revert this milestone branch before merge. Do not merge or deploy automatically. Future runs must inspect open PRs and continue this branch before creating duplicate work.
