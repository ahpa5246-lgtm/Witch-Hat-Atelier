# Witch Hat Atelier: engineering review, 2026-10-18

## Scope and intent
Owner requested continued implementation and severe comparison with released products. This is the first bounded repair milestone, not a full completion claim. Local/offline architecture is retained; no new paid service or deployment.

Core journey: Draw → consult field guide → return → correct strokes.

## Decision and implementation
Separate Drawing studio and Field guide. Retain drawing while guide is open. Ignore hidden canvas resize events to prevent scaling all ink into 1px. Add redo with redo-history rescaling and invalidate obsolete redo history after new ink. Fix Node test discovery and project link.

The next bounded continuity milestone adds browser-local draft persistence. Completed strokes are saved after drawing, undo, redo, clear and canvas resizing. A refresh restores them at the current canvas dimensions; corrupt or unsupported data is ignored, storage failures do not stop drawing, and Clear removes the stored draft. This is local continuity only, not an account or cloud-sync feature.

The large-draft acceptance boundary now rejects drafts above 500 strokes, 20,000 points, or 1,000,000 serialized characters before restoration. Oversized or malformed stored drafts are removed so they are not parsed again on every startup; an oversized save fails without replacing storage. The limits are intentionally generous for a single 1200×800 spell diagram while bounding JSON parsing, repeated stroke-store reconstruction, and per-frame cloning. During verification, a newly disclosed high-severity toolchain audit was also cleared by resolving Vite 6.4.4, PostCSS 8.5.30, Nano ID 3.3.20, and source-map-js 1.2.2 in the lockfile.

The current browser-evidence stage adds a Playwright journey at 1280×900 and 760×900. It draws through pointer input, confirms a browser-local draft, opens the Field guide and returns, reloads the real page, checks that the restored canvas differs from the blank canvas, and records full-page Field guide/restored-studio screenshots. CI installs Chromium and uploads those images plus the Playwright report for 14 days. These screenshots are evidence for the named journey only; they do not pass the comparative visual-quality gate by themselves.

Alternative: decorate the existing home page while leaving workflows and state bugs unchanged. Rejected because appearance cannot repair lost results or crowded controls. Existing architecture remains intact.

## Reference research
Official feature/product pages consulted for task hierarchy and separation of primary work from setup/reference. No source, artwork, icon or layout copied:
https://excalidraw.com/
https://www.tldraw.com/
https://www.inklestudios.com/inklewriter/

Web-text inspection is not a visual screenshot comparison. These sources are a starting shortlist, not completed visual evidence. Do not mark the comparative design gate passed. A missing or inaccessible visual reference remains an open item.

## Evidence and harsh self-review
40 Node tests pass, including nine draft-storage cases covering resize-aware restoration, corrupt data, clearing, storage failures, restoration into the real stroke store, point and stroke restoration budgets, and rejection of an oversized save. The two new restoration-budget tests were confirmed red against the prior implementation and green after the guard. Vite production build passes. `npm audit --audit-level=high` reports zero vulnerabilities after the patch-only lockfile update. Browser interaction remains pending: no local Chromium/Firefox executable was available, and the remote browser could not reach the local Vite server. No claim of refresh-level browser verification, final art direction or complete visual QA.

For the browser-evidence stage, local verification again passes all 40 Node tests, the Vite 6.4.4 production build and the high-severity audit. Playwright successfully discovers the desktop and narrow journeys. The local Chromium download was blocked by this environment's network response (the archive arrived as zero bytes), so execution and screenshot evidence remain pending the new GitHub Actions run. Do not claim the browser journey passed until that run and its artifact are inspected.

GitHub Actions run 39144224150 supplied the first real Chromium evidence. The desktop 1280x900 journey passed and its Field guide/restored-studio screenshots were inspected. The 760x900 journey failed twice before creating a stored stroke. Trace frames show the responsive layout stacking the controls above the canvas: the helper began near the bottom of the viewport and finished outside it, so this was a viewport interaction defect in the Playwright journey rather than evidence that draft persistence failed. The bounded repair scrolls the canvas fully into view and asserts viewport intersection before calculating pointer coordinates. A new remote run is required before the narrow journey or browser evidence can be marked green.

GitHub Actions run 39150840570 then passed the complete current-head pipeline on commit `b0df9d1`: dependency installation, all 40 Node tests, production build, Chromium installation, and both Playwright viewport journeys. Artifact `browser-evidence-cc5c6bf2b88d72bd8fc6bad29d185a2f7c6291da` (759,318 bytes; SHA-256 `b378e0277763c855db6e478389c9893da3d1728aefc60c6739e076c9d59cf5b3`) contains Field guide and restored-studio screenshots for desktop and narrow layouts; all four were inspected. This verifies the named draw → guide → return → reload continuity journey only.

The inspected evidence leaves visual-quality gaps: the desktop guide workspace has excessive unused vertical space and sparse information hierarchy, while the restored studio footer wraps awkwardly and crowds the lower edge. At 760x900, the drawing surface starts below a 550px-tall control/state stack and is absent from the initial viewport, making the core action undiscoverable without scrolling; the helper text over the pale canvas is also nearly unreadable. The narrow Field guide fits, but still leaves a large empty region between its sparse cards and the legal footer. These are recorded defects, not accepted polish.

Synthetic Node 24.19 profiling of the prior unrestricted serializer measured 10,000 points at 417,491 characters (3.30 ms save / 2.29 ms load), 50,000 at 2,132,021 (10.43 / 14.89 ms), and 100,000 at 4,275,211 (31.69 / 34.98 ms). Those timings exclude stroke-store reconstruction, classification, rendering and browser storage I/O, so they are lower bounds rather than browser performance claims.

The Senior Skills example visual gate was run and correctly returned BLOCKED_UNVERIFIED_DESIGN; its draft lacks verified asset licenses. That result is framework evidence, not a project-specific visual pass. Actual screenshots, app-commit binding, keyboard/RTL checks, and task observations are required before release readiness.

## Next acceptance boundary
Address the narrow journey's below-the-fold drawing surface and unreadable canvas instructions as a separate product-layout stage, with new desktop/narrow screenshots bound to the resulting commit. Recognition and activation after undo/redo remain separate browser work. Keep persistence browser-local; this stage does not claim cloud sync, final art direction, keyboard coverage, or complete comparative visual QA.

Rollback: revert this milestone branch before merge. Do not merge or deploy automatically. Future runs must inspect open PRs and continue this branch before creating duplicate work.
