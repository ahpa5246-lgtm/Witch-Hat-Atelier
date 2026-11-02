import { CONFIG } from "./config.js";
import { loadDictionary } from "./dictionary/dictionaryLoader.js";
import { DrawingCapture } from "./input/drawingCapture.js";
import { restoreDraft, saveDraft } from "./input/draftStorage.js";
import { createStrokeStore } from "./input/strokeStore.js";
import { classifyDrawing } from "./parser/drawingClassifier.js";
import { compileSpell } from "./compiler/spellBuilder.js";
import { CanvasRenderer } from "./renderer/canvasRenderer.js";
import { setupCanvasSizing as setupResponsiveCanvasSizing } from "./ui/canvasSizing.js";
import { updateDiagnostics, updateDiagnosticsMode } from "./ui/diagnosticsView.js";
import { getElements } from "./ui/elements.js";
import { renderDictionaryReference } from "./ui/dictionaryReferenceView.js";
import { updateStatus, updateSummary } from "./ui/spellSummaryView.js";
import { setupTabs } from "./ui/tabs.js";

const elements = getElements();
const store = createStrokeStore();
let dictionary = null;
let renderer = null;
let capture = null;
let pipeline = null;
let spellIR = null;
let previousRing = null;
let resizeObserver = null;
let draftStorage = null;
let keyboardCursor = null;
let keyboardCursorVisible = false;
let keyboardStrokeActive = false;
let keyboardPoints = [];

function getDraftStorage() {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function persistDraft() {
  if (!draftStorage) {
    return;
  }
  saveDraft(draftStorage, {
    strokes: store.getStrokes(),
    width: elements.glyphCanvas.width,
    height: elements.glyphCanvas.height
  });
}

function announceDrawing(message) {
  if (elements.drawingAssistStatus) {
    elements.drawingAssistStatus.textContent = message;
  }
}

function positionKeyboardCursor() {
  if (!keyboardCursorVisible || !keyboardCursor) {
    elements.keyboardCursor.hidden = true;
    return;
  }

  const canvasRect = elements.glyphCanvas.getBoundingClientRect();
  const shellRect = elements.canvasShell.getBoundingClientRect();
  if (!canvasRect.width || !canvasRect.height || !shellRect.width || !shellRect.height) {
    elements.keyboardCursor.hidden = true;
    return;
  }

  const left = canvasRect.left - shellRect.left
    + keyboardCursor.x * (canvasRect.width / elements.glyphCanvas.width);
  const top = canvasRect.top - shellRect.top
    + keyboardCursor.y * (canvasRect.height / elements.glyphCanvas.height);

  elements.keyboardCursor.hidden = false;
  elements.keyboardCursor.style.left = `${left}px`;
  elements.keyboardCursor.style.top = `${top}px`;
  elements.keyboardCursor.classList.toggle("is-drawing", keyboardStrokeActive);
}

function ensureKeyboardCursor() {
  if (!keyboardCursor) {
    keyboardCursor = {
      x: elements.glyphCanvas.width / 2,
      y: elements.glyphCanvas.height / 2
    };
  }
  keyboardCursorVisible = true;
  elements.canvasHint.classList.remove("hidden");
  positionKeyboardCursor();
}

function hideKeyboardCursor() {
  keyboardCursorVisible = false;
  positionKeyboardCursor();
  elements.canvasHint.classList.toggle("hidden", store.count() > 0 || !elements.guidesToggle.checked);
}

function cancelKeyboardStroke(message) {
  if (!keyboardStrokeActive) {
    return;
  }
  keyboardStrokeActive = false;
  keyboardPoints = [];
  positionKeyboardCursor();
  announceDrawing(message);
}

function moveKeyboardCursor(dx, dy, step) {
  ensureKeyboardCursor();
  keyboardCursor = {
    x: Math.max(0, Math.min(elements.glyphCanvas.width, keyboardCursor.x + dx * step)),
    y: Math.max(0, Math.min(elements.glyphCanvas.height, keyboardCursor.y + dy * step))
  };

  if (keyboardStrokeActive) {
    const last = keyboardPoints[keyboardPoints.length - 1];
    const distance = Math.hypot(keyboardCursor.x - last.x, keyboardCursor.y - last.y);
    if (distance >= CONFIG.input.minPointDistance) {
      keyboardPoints.push({
        ...keyboardCursor,
        pressure: 0.5,
        t: performance.now()
      });
    }
  }

  positionKeyboardCursor();
}

function setupCanvasSizing() {
  resizeObserver = setupResponsiveCanvasSizing({
    elements,
    store,
    onCanvasResized: () => {
      if (keyboardStrokeActive) {
        cancelKeyboardStroke("Keyboard stroke cancelled because the canvas was resized.");
      }
      keyboardCursor = null;
      keyboardCursorVisible = false;
      positionKeyboardCursor();
      previousRing = null;
      recompute();
    }
  });
}

function recompute() {
  persistDraft();
  if (!dictionary) {
    return;
  }

  pipeline = classifyDrawing({
    strokes: store.getStrokes(),
    previousRing,
    dictionary,
    config: CONFIG
  });
  previousRing = pipeline.ring;
  spellIR = compileSpell({ glyphAST: pipeline.glyphAST, dictionary, config: CONFIG });
  updateSummary({ elements, store, capture, pipeline, spellIR });
  if (capture?.locked) {
    if (keyboardStrokeActive) {
      cancelKeyboardStroke("Keyboard stroke cancelled because the spell ring is closed.");
    }
    keyboardCursorVisible = false;
    positionKeyboardCursor();
  } else if (keyboardCursorVisible) {
    elements.canvasHint.classList.remove("hidden");
    positionKeyboardCursor();
  }
  updateDiagnostics({ elements, store, pipeline, spellIR });
}

function animationFrame(timestamp) {
  renderer.renderGlyph({
    strokes: store.getStrokes(),
    currentStroke: keyboardStrokeActive
      ? { id: "keyboard-preview", points: keyboardPoints }
      : capture.getCurrentStroke(),
    pipeline,
    showGuides: elements.guidesToggle.checked,
    showDebug: elements.diagnosticsToggle.checked
  });

  if (spellIR.active) {
    renderer.renderActivatedGlyph({
      activatedAt: spellIR.activatedAt,
      duration: spellIR.duration,
      strokes: store.getStrokes(),
      pipeline,
      timestamp
    });
  }
  
  renderer.renderEffect({
    spellIR,
    ring: pipeline?.ring,
    timestamp,
    showGuides: elements.guidesToggle.checked
  });
  requestAnimationFrame(animationFrame);
}

function setupControls() {
  const studio = document.getElementById("studioButton");
  const reference = document.getElementById("referenceButton");
  function workspace(showReference) {
    document.querySelector(".control-panel").hidden = showReference;
    document.querySelector(".canvas-panel").hidden = showReference;
    document.getElementById("referenceWorkspace").hidden = !showReference;
    document.querySelector(".workspace").classList.toggle("reference-mode", showReference);
    studio.setAttribute("aria-pressed", String(!showReference));
    reference.setAttribute("aria-pressed", String(showReference));
  }
  studio.addEventListener("click", () => workspace(false));
  reference.addEventListener("click", () => workspace(true));
  document.getElementById("redoButton").addEventListener("click", () => {
    store.redo(); previousRing = null; recompute();
  });
  elements.undoButton.addEventListener("click", () => {
    store.undo();
    previousRing = null;
    recompute();
  });

  document.addEventListener("keydown", (event) => {
    if (!(event.ctrlKey || event.metaKey) || event.altKey) {
      return;
    }

    const target = event.target;
    if (
      target instanceof HTMLElement &&
      (target.isContentEditable || target.closest("input, textarea, select, [contenteditable='true']"))
    ) {
      return;
    }

    const key = event.key.toLowerCase();
    const isUndo = key === "z" && !event.shiftKey;
    const isRedo = (key === "z" && event.shiftKey) || (key === "y" && !event.shiftKey);
    if (!isUndo && !isRedo) {
      return;
    }

    event.preventDefault();
    (isUndo ? elements.undoButton : document.getElementById("redoButton")).click();
  });

  const canvas = elements.glyphCanvas;
  const directions = {
    ArrowLeft: [-1, 0],
    ArrowRight: [1, 0],
    ArrowUp: [0, -1],
    ArrowDown: [0, 1]
  };

  canvas.addEventListener("keydown", (event) => {
    if (event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }

    const direction = directions[event.key];
    if (direction) {
      event.preventDefault();
      if (!capture?.enabled) {
        announceDrawing("The drawing surface is still loading.");
        return;
      }
      if (capture.locked) {
        announceDrawing("Drawing is locked while the spell ring is closed. Use Undo or Clear.");
        return;
      }
      moveKeyboardCursor(direction[0], direction[1], event.shiftKey ? 36 : 12);
      return;
    }

    if (event.code === "Space") {
      event.preventDefault();
      if (event.repeat) {
        return;
      }
      if (!capture?.enabled) {
        announceDrawing("The drawing surface is still loading.");
        return;
      }
      if (capture.locked) {
        announceDrawing("Drawing is locked while the spell ring is closed. Use Undo or Clear.");
        return;
      }

      ensureKeyboardCursor();
      if (!keyboardStrokeActive) {
        keyboardStrokeActive = true;
        keyboardPoints = [{
          ...keyboardCursor,
          pressure: 0.5,
          t: performance.now()
        }];
        positionKeyboardCursor();
        announceDrawing("Keyboard stroke started. Use arrow keys to draw; press Space to finish or Escape to cancel.");
        return;
      }

      const points = keyboardPoints;
      keyboardStrokeActive = false;
      keyboardPoints = [];
      positionKeyboardCursor();

      let length = 0;
      for (let index = 1; index < points.length; index += 1) {
        length += Math.hypot(
          points[index].x - points[index - 1].x,
          points[index].y - points[index - 1].y
        );
      }

      if (points.length >= 2 && length >= CONFIG.input.minStrokeLength) {
        store.addStroke(points);
        previousRing = null;
        recompute();
        announceDrawing("Keyboard stroke added.");
      } else {
        announceDrawing("Stroke was too short and was not added.");
      }
      return;
    }

    if (event.key === "Escape" && keyboardStrokeActive) {
      event.preventDefault();
      cancelKeyboardStroke("Keyboard stroke cancelled.");
    }
  });

  canvas.addEventListener("blur", () => {
    if (keyboardStrokeActive) {
      cancelKeyboardStroke("Keyboard stroke cancelled because the drawing surface lost focus.");
    }
    hideKeyboardCursor();
  });

  canvas.addEventListener("pointerdown", () => {
    if (keyboardStrokeActive) {
      cancelKeyboardStroke("Keyboard stroke cancelled; pointer drawing is active.");
    }
    hideKeyboardCursor();
  });

  elements.clearButton.addEventListener("click", () => {
    store.clear();
    previousRing = null;
    recompute();
  });

  elements.guidesToggle.addEventListener("change", () => {
    updateSummary({ elements, store, capture, pipeline, spellIR });
    updateDiagnostics({ elements, store, pipeline, spellIR });
  });

  elements.diagnosticsToggle.addEventListener("change", () => {
    updateDiagnosticsMode(elements);
    updateDiagnostics({ elements, store, pipeline, spellIR });
  });

  updateDiagnosticsMode(elements);
}

async function init() {
  setupTabs(elements);
  setupControls();
  draftStorage = getDraftStorage();
  if (draftStorage) {
    restoreDraft(draftStorage, store, {
      width: elements.glyphCanvas.width,
      height: elements.glyphCanvas.height
    });
  }
  setupCanvasSizing();
  renderer = new CanvasRenderer({
    glyphCanvas: elements.glyphCanvas,
    effectCanvas: elements.effectCanvas,
    config: CONFIG
  });
  capture = new DrawingCapture(elements.glyphCanvas, store, CONFIG, {
    onPreview: () => {},
    onCommit: recompute
  });

  try {
    dictionary = await loadDictionary();
    renderDictionaryReference(elements, dictionary);
    capture.enable();
    recompute();
    requestAnimationFrame(animationFrame);
  } catch (error) {
    console.error(error);
    updateStatus(elements, "Dictionary load failed", "invalid");
  }
}

init();
