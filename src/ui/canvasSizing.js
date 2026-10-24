export function setupCanvasSizing({ elements, store, onCanvasResized }) {
  function syncCanvasSize() {
    const rect = elements.canvasShell.getBoundingClientRect();
    // A hidden workspace must not collapse and rescale the drawing to 1px.
    if (rect.width <= 0 || rect.height <= 0) return;
    const width = Math.max(1, Math.round(rect.width));
    const height = Math.max(1, Math.round(rect.height));
    const previousWidth = elements.glyphCanvas.width;
    const previousHeight = elements.glyphCanvas.height;

    if (previousWidth === width && previousHeight === height) {
      return;
    }

    elements.glyphCanvas.width = width;
    elements.glyphCanvas.height = height;
    elements.effectCanvas.width = width;
    elements.effectCanvas.height = height;

    if (store.count() > 0 && previousWidth > 0 && previousHeight > 0) {
      store.scale(width / previousWidth, height / previousHeight);
    }

    onCanvasResized();
  }

  syncCanvasSize();
  const resizeObserver = new ResizeObserver(syncCanvasSize);
  resizeObserver.observe(elements.canvasShell);
  window.addEventListener("orientationchange", syncCanvasSize);
  return resizeObserver;
}
