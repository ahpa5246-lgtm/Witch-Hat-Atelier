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

### Narrow canvas-first acceptance, 2026-10-25

The bounded product-layout stage is CSS-only: at widths up to 760px the Drawing studio places the canvas before the control/state panel, and the canvas helper uses an opaque paper card with the normal ink color. Drawing, recognition, storage, guide navigation and desktop ordering are unchanged.

The acceptance tests were added before the layout repair. GitHub Actions run 40134945350 failed only the two new assertions: the complete narrow canvas shell ended at 1212.125px in a 900px viewport, and the helper contrast measured 4.246183813284835:1 against the canvas. The existing desktop/narrow continuity journeys, all 40 Node tests and the production build still passed in that red run. This confirms that the tests exercised the intended defects rather than an unrelated regression.

After the responsive CSS repair, GitHub Actions run 40139212683 passed on head commit `68be74c10863e7135f50439ac1570dd9708f9ea2`: dependency installation, all 40 Node tests, Vite 6.4.4 production build, Chromium installation and browser journeys. Playwright reported four passes and two intentional desktop-project skips: both desktop/narrow continuity journeys passed, while the narrow project additionally proved the complete canvas shell is inside the initial 760x900 viewport and the computed helper contrast meets WCAG AA (at least 4.5:1).

Artifact `browser-evidence-f8bc0b5826e7e3833c800d86751fc50695129118` (ID 12578200334; 760,513 bytes; SHA-256 `5e4f2fd81345897cd0c277961483b5de31ef2abc16ae29e2315e86e5658c01a8`) is bound by workflow metadata to head `68be74c10863e7135f50439ac1570dd9708f9ea2`. Its four desktop/narrow Field guide and restored-studio screenshots were inspected. The 760x900 restored-studio image now shows the full drawing surface before the controls; the desktop layout remains side-by-side. The narrow Field guide is unchanged and its large empty lower region remains an explicit visual-quality gap. The screenshots show the post-draw state, so helper readability is supported by the live Chromium computed-style assertion rather than by that static frame.

This stage does not establish final art direction, complete comparative visual QA, keyboard coverage, recognition correctness after history operations, or release readiness.

Synthetic Node 24.19 profiling of the prior unrestricted serializer measured 10,000 points at 417,491 characters (3.30 ms save / 2.29 ms load), 50,000 at 2,132,021 (10.43 / 14.89 ms), and 100,000 at 4,275,211 (31.69 / 34.98 ms). Those timings exclude stroke-store reconstruction, classification, rendering and browser storage I/O, so they are lower bounds rather than browser performance claims.

The Senior Skills example visual gate was run and correctly returned BLOCKED_UNVERIFIED_DESIGN; its draft lacks verified asset licenses. That result is framework evidence, not a project-specific visual pass. Actual screenshots, app-commit binding, keyboard/RTL checks, and task observations are required before release readiness.

## Next acceptance boundary
The canvas-first narrow-layout defect and helper-contrast defect are verified at the code commit above. The next separate browser stage is recognition and activation after undo/redo, including evidence that history changes update diagnostics/effects without corrupting the browser-local draft. Keyboard coverage, the sparse Field guide hierarchy, final art direction and complete comparative visual QA remain open and must not be inferred from this milestone.

### Undo/redo activation continuity: RED evidence, 2026-10-25

The bounded design and implementation plan are recorded in `docs/superpowers/specs/2026-10-25-undo-redo-activation-design.md` and `docs/superpowers/plans/2026-10-25-undo-redo-activation.md`. The browser contract seeds a deterministic seal from a hand-defined open ring, the repository's real Fire sigil template, and a final closing arc. It then observes the real status, portal-active treatment, diagnostic SpellIR, browser-local stroke count, Undo, Redo and reload behavior. No parser/compiler mock or production test hook is used.

Local preflight on the test-only change passed all 40 Node tests and the Vite 6.4.4 production build; Playwright discovered eight project cases. Local Chromium execution remained unavailable because this environment received a zero-byte browser archive, so the remote browser run is the execution authority.

GitHub Actions run 40220306603 established the intended RED result on test commit `1d62b12a4b8072719b44f10ec42452314ff8bd13`. Dependency installation, all 40 Node tests, production build and Chromium installation passed. The seeded seal reached `Active spell`, applied `portal-active`, and exposed an active Fire SpellIR before the new assertion. The browser journey then failed twice at `expect(undo).toBeEnabled()` because the real button remained disabled. The remaining existing browser coverage passed: four passes and three intentional project skips. Artifact 12608732304 (`browser-evidence-b69c2bca1b7736736945353cb40db008dcb06d89`, 8,061,530 bytes, SHA-256 `dd51f088a3491e726a2f679470b833a45c3957361fe301eca6a62a204a59452c`) retains the failure report and traces.

No production fix is included in this RED checkpoint. The next sequential step is the minimal history unlock described in the plan: keep closed-ring drawing input locked, but disable Undo only when the stroke store is empty. GREEN browser evidence is still required before this stage can be called complete.

### Undo/redo activation continuity: GREEN evidence, 2026-10-25

The minimal production repair is commit `38a6f12ec20417be8d5e9877eb81024d0ab3444f`: closed-ring drawing and pointer capture remain locked, while Undo is disabled only when the stroke store is empty. No parser, compiler, storage schema, recognition threshold, or visual styling changed. Local preflight passed all 40 Node tests, the Vite 6.4.4 production build, and `git diff --check`.

GitHub Actions run 40224872367 passed on that commit: dependency installation, all 40 Node tests, production build, Chromium installation, and the browser journeys were green. Playwright reported five passes and three intentional project skips. The new real-browser journey proved the deterministic Fire seal was `Active spell`, exposed an active Fire SpellIR, and applied `portal-active`; Undo returned it to `Prepared`, removed the activation treatment, and reduced the persisted stroke count by one; Redo restored the active Fire state and original count; a real page reload preserved the restored active state and browser-local count.

Artifact `browser-evidence-356753f6fa363354d68a961872d1fd404918b31c` (ID 12611096173; 1,060,996 bytes; SHA-256 `930709b36281961225e54cb74827d6773e1f928a1a30d1a51cb26b7b0873969d`) contains the Playwright report and screenshots. The `restored-active-spell.png` frame was inspected and shows the Fire manifestation, active-state diagnostics, and an enabled Undo control after reload. This closes only the named pointer-driven activation/history/persistence boundary.

Remaining gaps are explicit: keyboard-operated history coverage is absent; classifier accuracy beyond the deterministic Fire fixture is not established; invalid closed seals do not yet have their own browser history journey; and the sparse Field guide hierarchy, final art direction, and complete comparative visual-quality gate remain open. None of those gaps is release-approved by this result.

Rollback: revert this milestone branch before merge. Do not merge or deploy automatically. Future runs must inspect open PRs and continue this branch before creating duplicate work.

## 2026-10-31 — keyboard drawing history and comparative inspection

### Implementation
Added editor-level history shortcuts through the existing Undo/Redo controls: `Ctrl+Z` / `Cmd+Z` for Undo, `Ctrl+Shift+Z` / `Cmd+Shift+Z` and `Ctrl+Y` / `Cmd+Y` for Redo. Shortcuts are ignored when focus is in an input, textarea, select, or editable content. The buttons now expose matching `aria-keyshortcuts`. Recognition, stroke storage format, drawing capture, and spell compilation were not changed.

### Verification
- Implementation commit: `1b143dd77d6eb1eef976092734e5ad6214494345`.
- GitHub Actions run [41225537152](https://github.com/ahpa5246-lgtm/Witch-Hat-Atelier/actions/runs/41225537152): success.
- `npm test`: 40 passed, 0 failed, 0 skipped.
- `npm run build`: success; 54 modules transformed.
- Playwright: 7 passed, 3 intentionally skipped across desktop 1280×900 and narrow 760×900. The new keyboard-history journey passed in both projects and verified that Undo/Redo changes both the rendered canvas and the saved local draft.
- Browser artifact: [13051980958](https://github.com/ahpa5246-lgtm/Witch-Hat-Atelier/actions/runs/41225537152/artifacts/13051980958), SHA-256 `615ce86d3e69b91dbc440590af69db380e96dd5417fcd8d85a7b119013a62676`. The artifact is bound to implementation commit `1b143dd`; desktop/narrow studio and field-guide screenshots plus the active-spell screenshot were inspected.

### Comparative product review — 2026-10-31
- [Excalidraw](https://plus.excalidraw.com/) — released direct canvas product. Its official editor image shows a dominant canvas, a compact top tool strip, and contextual properties. The Atelier's canvas-first narrow layout follows the right hierarchy, while its desktop fixed control rail is more persistent than Excalidraw's contextual panels.
- [tldraw](https://tldraw.dev/) — released direct canvas product/SDK. Its official product page documents built-in undo/redo, keyboard navigation, adaptive interfaces, and a compact drawing toolbar. The new keyboard history closes a concrete parity gap; selection, pan/zoom, and richer canvas affordances remain outside this milestone.
- [Witch Hat Atelier official anime site](https://tongari-anime.com/en/) — visual reference only. Its gold ornamental marks and hand-engraved book illustration support a restrained paper-and-ink direction. No official artwork, marks, or layouts were copied.

### Remaining gaps and limits
The inspected narrow Field Guide still leaves a large unused area below two sample-spell entries; this is a content/hierarchy gap, not a color problem. The reference workspace needs a fuller, task-oriented guide before the visual gate can pass. The current browser suite tests Control-based shortcuts on Linux; Meta-key behavior is implemented and declared but has not been exercised on macOS. Editable-target exclusion is implemented but has no dedicated browser test. Keyboard tab order, screen-reader announcement, invalid closed-seal history, and broader classifier accuracy remain unverified. This milestone does not pass the full competitive visual gate or authorize release.

The CI run also reports GitHub's Node 20 action-runtime deprecation warning for checkout/setup-node/upload-artifact; it does not fail the product checks and remains a workflow-maintenance item.


## 2026-10-31 — editable-target keyboard-history regression

### Implementation and verification
- Test commit: `36f1ab21b990f38ef5703d406f30341b054a14d6`.
- Added a real-browser regression for the document-level history shortcuts while focus is in an `input`, `textarea`, `select`, or `contenteditable` target.
- The test begins with a real drawn stroke, checks that Ctrl+Z does not invoke application Undo from any editable target, then creates a redoable state and checks that Ctrl+Shift+Z and Ctrl+Y do not invoke application Redo. It verifies both the persisted stroke count and rendered canvas remain unchanged.
- GitHub Actions run [41230849629](https://github.com/ahpa5246-lgtm/Witch-Hat-Atelier/actions/runs/41230849629) passed on the test commit: all 40 Node tests passed, the Vite production build transformed 54 modules, and Playwright reported 9 passed / 3 intentional project skips across desktop 1280×900 and narrow 760×900. The new editable-target test passed in both projects.
- Browser artifact [13053512602](https://github.com/ahpa5246-lgtm/Witch-Hat-Atelier/actions/runs/41230849629/artifacts/13053512602), SHA-256 `f4a029f3c18883ed55aaf2923e5ad06a3c09e9fdaf378391a738841af1c1f577`. The desktop/narrow Field guide and restored-studio screenshots were inspected. The narrow studio keeps the drawing surface in the first viewport; the Field guide still has substantial unused vertical space below its two sample-spell entries.

### Remaining acceptance gaps
The shortcut exclusion is now covered for the four editable target classes on Chromium/Linux. Meta-key behavior remains unverified on macOS. Keyboard tab order and screen-reader announcements, invalid closed-seal history, broader classifier accuracy, and the sparse Field guide hierarchy remain open. This is a focused keyboard regression milestone, not a full accessibility or visual-quality pass.


## 2026-11-01 — accessible reference and diagnostic tabs

### Implementation
- Code commit: 5baba384918d699bf652477a925d47eec090c234.
- Replaced click-only panel switching with three named ARIA tablists: Reference workspaces, Dictionary entries, and Diagnostic views.
- Each tab now exposes aria-selected, aria-controls, and a roving tabindex; each panel exposes role=tabpanel, aria-labelledby, and a focusable entry point.
- Arrow keys move between tabs, Home/End select the first/last tab, and horizontal direction reverses when the tablist is inside an RTL subtree. Pointer activation remains available.
- Spell state now uses a polite, atomic role=status live region so state changes have an announcement target.

### Verification
- GitHub Actions run [41282866465](https://github.com/ahpa5246-lgtm/Witch-Hat-Atelier/actions/runs/41282866465) passed on the implementation commit.
- npm test: 40 passed, 0 failed, 0 skipped.
- npm run build: success; Vite transformed 54 modules.
- Playwright: 11 passed and 3 intentional project skips across desktop 1280×900 and narrow 760px layouts. The new real-Chromium journey opened Field guide with Enter, switched the root panel with ArrowRight/ArrowLeft, navigated Sample Spells/Sigils/Signs with ArrowRight and Home/End, then navigated Parser/AST/IR. It checked focus, selected state, panel visibility, and live-region attributes.
- Browser artifact [13074421299](https://github.com/ahpa5246-lgtm/Witch-Hat-Atelier/actions/runs/41282866465/artifacts/13074421299), 1,284,148 bytes, SHA-256 6dea3231462258e4b731260a838d304eecaea5c0844bcb35784e65718be14acb. Desktop 1280×900 and narrow 760×1041 full-page keyboard-navigation screenshots were inspected; the focused IR tab has a visible focus indicator and the selected diagnostic panel is exposed.

### Comparative review — direct products and official visual reference
- [Excalidraw](https://plus.excalidraw.com/) and its [live editor](https://excalidraw.com/) remain the direct canvas benchmark: the official product emphasizes a dominant infinite canvas, simple tool access, reusable libraries, and quick start. The Atelier remains a specialized spell-construction tool rather than a general whiteboard; the present change improves access to its reference/diagnostic workflow but does not add pan/zoom, selection, or export parity.
- [tldraw Editor](https://tldraw.dev/sdk-features/editor) and its [accessibility guidance](https://tldraw.dev/sdk-features/accessibility) document history, focus, keyboard navigation, live-region announcements, and shape reading order. This milestone adopts correct tab semantics and a status live region for the existing interface; the drawing canvas itself is still pointer-first and does not yet expose keyboard navigation across strokes.
- The live Excalidraw editor capture and the official [tldraw showcase](https://tldraw.dev/showcase) were also inspected: both keep the drawing surface dominant and place tools in compact or contextual rails. The Atelier's fixed control rail and separate Field guide are defensible for a domain-specific spell compiler, but the current two-entry guide does not use its available space effectively; expanding task-oriented guide content is the next visual priority, not changing the palette.
- [Witch Hat Atelier official anime site](https://tongari-anime.com/en/) is used only as an official franchise visual reference for editorial hierarchy and restrained paper/ink presentation. No official artwork, marks, or layout assets were copied.

### Remaining acceptance gaps
The browser test proves keyboard operation of the three tab groups and verifies the live-region markup; it does not prove actual NVDA or VoiceOver speech output. RTL arrow behavior is implemented but not exercised by this English-only app test, and Meta-key history shortcuts remain unverified on macOS. The Field guide still contains only two sample-spell entries and leaves substantial unused vertical space; this is a content/hierarchy defect, not a color defect. Keyboard drawing, invalid closed-seal history, broader classifier accuracy, and final art direction remain open. The complete comparative visual gate remains blocked; this milestone is not release approval.

## 2026-11-01 — keyboard-operated drawing path (validation pending)

### Implementation on the existing PR branch
- Added a focusable, named drawing surface with a local keyboard interaction contract: Arrow keys move a visible crosshair, Shift+Arrow moves in larger increments, Space starts/finishes a stroke, and Escape cancels the active stroke.
- Keyboard strokes use the existing stroke store and draft persistence path. The preview is rendered on the same canvas; committed strokes flow through the existing parser/compiler recomputation. Too-short strokes are rejected by the same configured minimum-length threshold.
- Added a polite live status region for start/finish/cancel feedback and a visible focus indicator. Pointer drawing remains unchanged; switching to pointer input or leaving the canvas cancels an unfinished keyboard stroke.
- Existing undo/redo remains available after keyboard commits. No parser, recognition threshold, stored draft schema, or compiler behavior changed.
- Commits on this branch: `b6ac924` (canvas semantics/instructions), `619e3f9` (element references), `2abdcf1` (focus/cursor styles), `94aad38` (keyboard cursor and stroke handling), and `2da37ef` (real-browser journey test).

### Acceptance test added — not yet executed
- Added a Playwright journey that focuses the actual canvas, moves the cursor, starts a stroke, draws with normal and accelerated arrow movement, commits it, verifies local-draft stroke count and rendered-canvas change, then checks Undo/Redo and Escape cancellation.
- The test is configured to run in both existing desktop 1280×900 and narrow 760×900 browser projects.
- **Validation blocker:** the current PR head is `2da37ef11fe518314bd77ffd630ee347f12977c1`. At 2026-11-01 17:31 Asia/Baghdad, `fetch_commit_workflow_runs` returned no run for this head and the combined commit status contained no checks. The GitHub connector available in this runtime has no workflow-dispatch action. The container cannot resolve GitHub and has no checkout, so neither `npm test`, `npm run build`, nor Playwright was run locally. This change is therefore **not validated and not ready for human review**. Do not infer a pass from the test file being committed.
- The repository's existing CI workflow supports manual `workflow_dispatch`; the next action is to run the existing CI workflow against `codex/studio-and-field-guide` through GitHub Actions, then inspect the full job result and browser artifact. Repair only a concrete failure.

### Comparative design decision — 2026-11-01
- [Excalidraw official product page](https://plus.excalidraw.com/) and [live editor](https://excalidraw.com/) keep a large, dominant drawing canvas with compact tool access. The Atelier should retain its specialist canvas-first layout rather than add a second keyboard toolbar that competes with the drawing surface.
- [tldraw official SDK product page](https://tldraw.dev/) documents a production canvas with undo/redo, keyboard navigation and adaptive accessibility; its [accessibility guide](https://tldraw.dev/sdk-features/accessibility) describes keyboard navigation and screen-reader announcements. The Atelier now provides a minimal keyboard path for creating strokes, but does not claim tldraw-level object navigation, selection or screen-reader support.
- [Official Witch Hat Atelier anime site](https://tongari-anime.com/en/) remains a visual reference for its paper/ink editorial hierarchy only. No official artwork, marks or assets were copied.
- Decision: preserve the existing canvas hierarchy and add only the affordances required to operate that canvas without a pointer: a visible crosshair, concise instructions and state announcements. This is a functional accessibility addition, not a palette redesign.

### Remaining gaps
- CI, build and real Chromium execution for the new head are pending; no current-commit screenshot has been inspected.
- Manual NVDA/VoiceOver testing, RTL arrow behavior, Meta-key history behavior on macOS, and keyboard-only construction of a complete valid spell remain unverified.
- The Field guide still has only two sample-spell entries and unused vertical space. Invalid closed-seal history, broader classifier accuracy, and the complete visual-quality gate remain open.
- Keep PR #1 Draft. Do not mark this milestone `AWAITING_HUMAN_REVIEW` until current-head CI, actual browser evidence and the applicable accessibility review pass.

Rollback: revert commits `b6ac924`, `619e3f9`, `2abdcf1`, `94aad38` and `2da37ef` on the existing branch. No merge or deployment.


## 2026-11-01 — keyboard drawing path verified on the current PR head

### Current-head CI
- Reviewed the existing Draft PR #1 at branch head `e6014c84976c54205af755f2c7983968fbad3b73`; no new branch or PR was created.
- GitHub Actions PR run [41317539704](https://github.com/ahpa5246-lgtm/Witch-Hat-Atelier/actions/runs/41317539704) completed successfully on that head. The `verify` job completed dependency installation, Node tests, production build, Chromium installation, browser journeys, and evidence upload.
- `npm ci` installed 17 packages. The install output reported **one moderate-severity dependency advisory**; this workflow did not run a full `npm audit` report, so the affected package and remediation are not established here. Keep this as an unresolved dependency-maintenance item rather than silently treating it as cleared.
- `npm test`: 40 passed, 0 failed, 0 skipped.
- `npm run build`: passed; Vite transformed 54 modules.
- Playwright: 13 passed and 3 intentional project skips. The new keyboard-drawing journey ran in the existing desktop 1280×900 and narrow 760×900 projects.
- Browser artifact [13088430104](https://github.com/ahpa5246-lgtm/Witch-Hat-Atelier/actions/runs/41317539704/artifacts/13088430104), 1,705,885 bytes, SHA-256 `87dac5ec26978be18360fd9cfc710abd329b59d4d48e91368cb1e91ac375cc98`, is bound by workflow metadata to branch head `e6014c84976c54205af755f2c7983968fbad3b73`.

### Actual keyboard-drawing journey
- The real Chromium test focused the named canvas, moved the visible crosshair with arrow keys, used Shift+Arrow for larger movement, started and completed a stroke with Space, and cancelled an unfinished stroke with Escape.
- The test verified that a completed keyboard stroke entered the existing stroke store and browser-local draft, changed the rendered canvas, and remained compatible with the existing Undo/Redo controls. It also verified cancellation without committing the unfinished stroke.
- The desktop keyboard-drawing screenshot (1280×900) and narrow full-page screenshot (760×1322 from a 760×900 viewport) were downloaded from the artifact and inspected. The visible crosshair, focused canvas boundary, instructions, and drawing controls are present. The narrow layout keeps the canvas before the control panel.
- The same artifact contains the desktop/narrow reference-tab and drawing-continuity screenshots. The narrow Field guide screenshot remains 760×900 and still shows only two sample-spell entries with substantial unused space below them.

### Comparative review and decision
- [Excalidraw live editor](https://excalidraw.com/) and its [official product page](https://plus.excalidraw.com/) remain the direct canvas references: the primary surface dominates, with compact tools and contextual controls. The Atelier retains its specialist canvas-first composition; this milestone adds an alternate input method rather than another competing toolbar.
- [tldraw editor features](https://tldraw.dev/sdk-features/editor) and its [accessibility guidance](https://tldraw.dev/sdk-features/accessibility) remain the direct reference for keyboard-operable canvas workflows, history, focus and announcements. The new path covers stroke creation and history integration, not object selection, pan/zoom, stroke-by-stroke navigation, or full tldraw parity.
- [Official Witch Hat Atelier anime site](https://tongari-anime.com/en/) remains a visual reference only for its editorial paper/ink treatment. No official artwork, logo, marks, or layout was copied.
- Decision: preserve the current canvas-first layout and provide a minimal keyboard drawing path using the existing stroke and persistence model. Do not treat the feature as complete screen-reader support or as a visual redesign.

### Remaining gaps and gate status
- **Keyboard drawing CI is now green on the current PR head**; the earlier “validation pending” note above is superseded by this entry.
- Actual NVDA/VoiceOver speech output, macOS Meta-key behavior, RTL arrow behavior, keyboard-only construction of a complete valid spell, and a broader classifier-accuracy set remain unverified.
- The Field guide still has two sample spells and unused vertical space. This is a content/hierarchy gap; the next visual milestone should add validated task-oriented reference material or a deliberate empty-state explanation, not change colors.
- The moderate dependency advisory reported by `npm ci` remains unidentified and unresolved pending a full audit report.
- The full comparative visual-quality gate remains open. This milestone verifies one input journey and current-head CI; it does not authorize release, merge, or deployment.

Rollback: revert the keyboard-drawing commits on this existing branch; no merge or deployment.


## 2026-11-01 — RTL keyboard tab-navigation acceptance

### Bounded test-only milestone
- Starting PR #1 head: `68e519902212a18e66bdd62a797bee6fedabf1ff`.
- Added a real Chromium journey that switches the document to RTL, opens the Field guide, and exercises the actual outer Reference workspaces and nested Dictionary entries tablists.
- The journey verifies reversed horizontal-arrow semantics (ArrowLeft advances and ArrowRight returns), Home/End behavior, focus movement, `aria-selected`, and the visible panel associated with each tab. It records desktop and narrow screenshots and checks that the RTL reference workspace does not create horizontal document overflow.
- No production JavaScript, recognition, storage, or styling changed. This is an acceptance test for the RTL direction logic already implemented in `src/ui/tabs.js`.

### Current-head verification
- Test commit: `44bbe82d928041d79c9fde9257b6167ab2ad09d5`.
- GitHub Actions run [41328005998](https://github.com/ahpa5246-lgtm/Witch-Hat-Atelier/actions/runs/41328005998) passed on the exact PR #1 head. Dependency installation, Node tests, Vite production build, Chromium installation, browser journeys and evidence upload all completed.
- Node suite: 40 passed, 0 failed, 0 skipped. Vite 6.4.4 production build succeeded.
- Playwright: 15 passed, 3 intentional project skips across desktop 1280×900 and narrow 760×900. The new RTL journey passed in both projects.
- Browser artifact [13092565451](https://github.com/ahpa5246-lgtm/Witch-Hat-Atelier/actions/runs/41328005998/artifacts/13092565451), 1,892,050 bytes; archive SHA-256 `b07ed5908409a64e4960304dda2f4bfb5608b53b259fafe773ada3c46d47c6f2`. I downloaded and inspected both `rtl-reference-tabs.png` captures. They show the selected tab and visible focus indicator in desktop and narrow layouts; the test also measured no horizontal overflow. The screenshots remain English-language content with document direction RTL; this is not Arabic-localization evidence.
- `npm ci` still reports one moderate-severity dependency advisory. The workflow does not run a full `npm audit` report, so the affected package and remediation remain unidentified.

### Comparative review and remaining limits
- The existing direct-product comparison remains Excalidraw and tldraw, with the official Witch Hat Atelier anime site as an editorial visual reference. This test-only milestone does not change the design direction or pass the comparative visual-quality gate.
- Automated RTL arrow direction and tab semantics are covered in Chromium. Arabic translation quality, mixed-direction identifiers, manual NVDA/VoiceOver speech output, and macOS behavior remain unverified.
- The Field guide still has two sample-spell entries and substantial unused vertical space. This is a content/hierarchy gap, not a palette issue.
- Keep PR #1 Draft. No merge or deployment.

Rollback: revert the RTL browser test and this review entry on the existing branch.


## 2026-11-01 — identify the remaining moderate npm advisory

### Observed blocker
- The current PR #1 head `29a6fe804fbd7df8de64421a3ca7736bfb6b4227` passes its CI job, but the `npm ci` log reports one moderate-severity vulnerability.
- The workflow log exposes only the count and generic `npm audit fix` suggestion; it does not identify the affected package, advisory range, or whether a non-breaking patched version exists.
- The current execution container cannot resolve the npm registry, so a local `npm audit` cannot be completed reliably. No automatic dependency update is justified from the summary alone.

### Bounded diagnostic change
- Added a CI step that stores the full `npm audit --json` response as `artifacts/npm-audit.json`.
- The audit step is non-blocking for the existing test/build/browser job; it does not run `npm audit fix`, change the lockfile, or suppress the existing npm install warning.
- The browser-evidence artifact now also retains the machine-readable audit report for inspection.

### Validation state
- This commit is the diagnostic change only. The new current-head CI run and audit artifact must complete before the advisory can be identified.
- Do not mark the advisory resolved, do not upgrade packages speculatively, and do not treat a green product test job as a clean dependency audit.

Next step: inspect the exact advisory name, vulnerable range, dependency path, and fixed version from the uploaded JSON; apply only the smallest compatible lockfile update if the advisory is confirmed and a patched version is available.


## 2026-11-01 — npm advisory identified; high/critical audit gate enforced

### Exact audit result
- CI run [41333476430](https://github.com/ahpa5246-lgtm/Witch-Hat-Atelier/actions/runs/41333476430) completed successfully on PR #1 head `eb8108bae15fb2c678b66680d00b77a5aa8b7cb9`. Node tests, Vite build, Chromium journeys, and evidence upload all passed.
- Audit artifact [13094356077](https://github.com/ahpa5246-lgtm/Witch-Hat-Atelier/actions/runs/41333476430/artifacts/13094356077) contains `artifacts/npm-audit.json` (1,083 bytes; SHA-256 `40097825c7df5e0d0f1438d0b2687dc934b770d0af549637746044315ded1d81`). The archive SHA-256 is `6acc8adde84760051f82164b127b68d60b9ae8d6b50442c810a1fd6381b72cef`.
- The report identifies one direct moderate advisory: `vite@6.4.4`, GHSA-8g5g-mxqh-grgj / CVE-2026-118662, affected range `=6.4.4`; the advisory lists `6.4.5` as the patched version. No low, high, or critical advisories were reported.
- The advisory concerns Vite dev-server `server.fs.deny` checks bypassed by query parameters. Its documented exposure requires a network-exposed Vite dev server plus a file that is both within the allowed directory and denied by configuration. The project dev script binds to `127.0.0.1`; that limits the default exposure but does not remove the dependency advisory. See [GitHub Advisory GHSA-8g5g-mxqh-grgj](https://github.com/advisories/GHSA-8g5g-mxqh-grgj).

### CI policy adjustment
- The audit step now retains the JSON report on every run and fails CI when the report is unavailable or contains high/critical advisories. Moderate findings remain visible and non-blocking while the patch is prepared; the step does not run an automatic fix.
- No package or lockfile was changed in this diagnostic milestone. The next bounded implementation is to update the direct Vite dependency to patched `6.4.5`, regenerate the lockfile with npm, then verify a zero-advisory audit plus all existing tests/build/Playwright journeys.

### Current status
- The moderate Vite advisory is identified and has a documented patched release, but is **not yet remediated**.
- The Field guide still has two sample-spell entries and substantial unused vertical space; this remains a separate content/hierarchy task.
- PR #1 remains Draft; no merge or deployment.


## 2026-11-01 — patch the Vite 6.4.4 moderate advisory (validation pending)

### Bounded dependency remediation
- Updated the direct Vite development dependency from `^6.4.0` to `^6.4.5`, and aligned the committed npm lockfile to the exact Vite 6.4.5 registry tarball and SHA-512 integrity value. The transitive dependency graph is unchanged because the 6.4.5 package metadata retains the same runtime dependency ranges as 6.4.4.
- Tightened the retained `npm audit --json` gate from high/critical to moderate-or-higher. The JSON report remains an uploaded CI artifact; a missing vulnerability summary or any moderate/high/critical finding now fails the job.
- The advisory is [GHSA-8g5g-mxqh-grgj / CVE-2026-118662](https://github.com/advisories/GHSA-8g5g-mxqh-grgj), affecting Vite 6.4.4 and patched in 6.4.5. The current dev script binds to `127.0.0.1`, which limits network exposure; the dependency finding is still remediated rather than waived.

### Current-head verification
- Implementation commit: `cdb0a366213b9d1674c088a0d19ebe38c5b56a99`.
- GitHub Actions run [41342436135](https://github.com/ahpa5246-lgtm/Witch-Hat-Atelier/actions/runs/41342436135) passed on that exact PR #1 head.
- `npm ci`: passed and reported 0 vulnerabilities. The retained `npm audit --json --audit-level=moderate` report records `info=0, low=0, moderate=0, high=0, critical=0, total=0`; the workflow now fails on any moderate-or-higher finding.
- Node suite: 40 passed. Vite 6.4.5 production build: passed (54 modules transformed).
- Playwright: 15 passed and 3 intentional project skips across desktop 1280×900 and narrow 760×900; all executed browser journeys passed.
- Artifact [13098121606](https://github.com/ahpa5246-lgtm/Witch-Hat-Atelier/actions/runs/41342436135/artifacts/13098121606), 1,859,105 bytes, archive SHA-256 `53077a13fcc6b75cec7724a4c0ccdc34814b31ec8c1e4235e8ef6487a8023bdf`, contains the browser screenshots and machine-readable audit report. I downloaded the archive, parsed the report, and inspected the desktop/narrow keyboard-drawing captures and the narrow Field guide capture. The keyboard-drawing surface and focused cursor remain visible; the Field guide still contains only two sample spells with substantial unused space. The browser suite also checks the no-horizontal-overflow condition at the narrow viewport.
- GitHub Actions emitted the existing Node 20 action-runtime deprecation warning for checkout/setup-node/upload-artifact; the job passed and this is separate maintenance work.

### Remaining gaps
- The Vite 6.4.4 moderate advisory is remediated in the committed lockfile; the current-head audit is clean. The default dev script remains loopback-bound at `127.0.0.1`.
- The Field guide's two-entry content hierarchy and unused vertical space remain a product/content gap, not a color issue.
- Manual NVDA/VoiceOver output, broader Arabic localization/mixed-direction behavior, and the complete comparative visual-quality gate remain unverified. The successful dependency/functional CI is not a visual-quality approval.

Rollback: revert the dependency, lockfile and audit-gate changes on this existing draft branch; no merge or deployment.

## 2026-11-01 — Task-oriented Field guide workflow

### Observed defect and journey split
- The existing Field guide exposed two validated sample layouts but gave no task-oriented explanation of how to assemble a supported seal. The two cards occupied only a small part of the desktop reference surface; the remaining space did not help the user complete a task.
- Keep the Drawing studio as the canvas-first creation and inspection destination. Keep the Field guide as a separate reference destination. The guide now teaches the supported sequence and lets the user return to the studio through the existing workspace navigation.

### Comparator review (official sources checked 2026-11-01)
- [Excalidraw](https://plus.excalidraw.com/) presents a deliberately simple canvas-first whiteboard, ready-to-use libraries, and shortcut-led creation. Transferable decision: preserve an obvious drawing surface and keep reference material out of the primary canvas. Trade-off: Excalidraw's general-purpose infinite canvas and collaboration breadth are outside this prototype's scope.
- [tldraw](https://tldraw.com/) and its [official editor documentation](https://tldraw.dev/sdk-features/editor) treat tools, history, selection, camera and input as explicit editor systems. Transferable decision: keep creation controls and reference browsing as distinct user tasks. Trade-off: its extensible editor architecture would be unnecessary weight for this bounded seal compiler.
- The [official Witch Hat Atelier anime site](https://tongari-anime.com/en/) is the aspirational visual reference for the story's editorial/high-fantasy tone only. No official illustrations, logos, screenshots, or other copyrighted assets were copied into the application.

### Implementation
- Commits: `b2f3c5d8d998c72d9c345cdd2881a79bc93aab7d` (semantic guide structure), `060c0c01b57a16118cb477fd2c21e0270efd661a` (responsive composition), `d8edc6c270e1f7db8e46055aa4754b23462e54d2` (journey test), and `a38b20c4b9cc32260f18b06bbcd514fb06eb6ee4` (case-correct test assertion).
- The Field guide now pairs a four-step construction sequence with the two real sample layouts at desktop width; it stacks the sequence above the examples at 760px. The sequence is derived from the current parser/compiler and dictionary: one ring, one recognized primary sigil, optional supported signs, then close and inspect. It states the prototype limits rather than inventing additional spell canon.
- No new external assets, fonts, packages, parser rules, or spell definitions were added.

### Current-head verification
- Exact implementation/test head: `a38b20c4b9cc32260f18b06bbcd514fb06eb6ee4`.
- GitHub Actions run [41348345540](https://github.com/ahpa5246-lgtm/Witch-Hat-Atelier/actions/runs/41348345540) passed on that exact head.
- `npm ci`: passed; 0 vulnerabilities. The uploaded audit report records info=0, low=0, moderate=0, high=0, critical=0, total=0.
- Node suite: 40 passed. Vite production build: passed (54 modules transformed).
- Playwright: 17 passed, 3 intentional project skips, across desktop 1280×900 and narrow 760×900.
- The new browser journey opens the Field guide, verifies the four ordered steps and all supported dictionary groups (2 sample layouts, 5 sigils, 3 signs), checks the two-column/stacked layouts and horizontal overflow, then returns to the Drawing studio. The actual desktop and narrow screenshots were downloaded and inspected.
- Evidence artifact [13099973462](https://github.com/ahpa5246-lgtm/Witch-Hat-Atelier/actions/runs/41348345540/artifacts/13099973462), 2,224,218 bytes, archive SHA-256 `033d26f88718d93069e579501d86461be779957c7903c8b0cfec034c576c8e20`. The archive contains `field-guide-workflow.png` for both tested surfaces and the machine-readable npm audit report.
- The first browser run [41348179240](https://github.com/ahpa5246-lgtm/Witch-Hat-Atelier/actions/runs/41348179240) caught a case-sensitive assertion mismatch in the test text; the assertion was corrected in `a38b20c`, and the exact-head rerun above passed.
- The workflow still emits a Node 20 `url.parse()` deprecation warning from its existing toolchain; it is not an npm advisory and did not fail this run.

### Remaining gaps
- The sample-spell library still contains only two validated examples. No additional examples were invented; expanding that content needs verified spell definitions.
- Manual NVDA/VoiceOver output, real Arabic UI content and mixed-direction copy, 320px width, 200% zoom, and moderated usability testing remain unverified.
- The formal `visual_quality_gate.py` implementation audit was not run in this environment. The screenshots and official comparator review are evidence for this bounded change, not a full visual-quality approval. The PR remains a draft.

Rollback: revert the four commits listed above on the existing draft branch; no merge or deployment.
