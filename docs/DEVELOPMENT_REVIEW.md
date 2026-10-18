# Witch Hat Atelier: engineering review, 2026-10-18

## Scope and intent
Owner requested continued implementation and severe comparison with released products. This is the first bounded repair milestone, not a full completion claim. Local/offline architecture is retained; no new paid service or deployment.

Core journey: Draw → consult field guide → return → correct strokes.

## Decision and implementation
Separate Drawing studio and Field guide. Retain drawing while guide is open. Ignore hidden canvas resize events to prevent scaling all ink into 1px. Add redo with redo-history rescaling and invalidate obsolete redo history after new ink. Fix Node test discovery and project link.

The next bounded continuity milestone adds browser-local draft persistence. Completed strokes are saved after drawing, undo, redo, clear and canvas resizing. A refresh restores them at the current canvas dimensions; corrupt or unsupported data is ignored, storage failures do not stop drawing, and Clear removes the stored draft. This is local continuity only, not an account or cloud-sync feature.

Alternative: decorate the existing home page while leaving workflows and state bugs unchanged. Rejected because appearance cannot repair lost results or crowded controls. Existing architecture remains intact.

## Reference research
Official feature/product pages consulted for task hierarchy and separation of primary work from setup/reference. No source, artwork, icon or layout copied:
https://excalidraw.com/
https://www.tldraw.com/
https://www.inklestudios.com/inklewriter/

Web-text inspection is not a visual screenshot comparison. These sources are a starting shortlist, not completed visual evidence. Do not mark the comparative design gate passed. A missing or inaccessible visual reference remains an open item.

## Evidence and harsh self-review
37 Node tests pass, including six draft-storage cases covering resize-aware restoration, corrupt data, clearing, storage failures and restoration into the real stroke store. The two storage-failure regression tests were also confirmed to fail when exception containment was temporarily removed, then pass after restoration. Vite production build passes. Browser interaction remains pending: no local Chromium/Firefox executable was available, and the remote browser could not reach the local Vite server. No claim of refresh-level browser verification, final art direction or complete visual QA.

The Senior Skills example visual gate was run and correctly returned BLOCKED_UNVERIFIED_DESIGN; its draft lacks verified asset licenses. That result is framework evidence, not a project-specific visual pass. Actual screenshots, app-commit binding, keyboard/RTL checks, and task observations are required before release readiness.

## Next acceptance boundary
Verify drawing→refresh→restored drawing and drawing→guide→return at desktop/narrow widths in a real browser; test recognition and activation after undo/redo. Profile unusually large drafts before expanding persistence beyond browser-local storage.

Rollback: revert this milestone branch before merge. Do not merge or deploy automatically. Future runs must inspect open PRs and continue this branch before creating duplicate work.
