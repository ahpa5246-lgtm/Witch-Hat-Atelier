export const DRAFT_STORAGE_KEY = "witch-hat-atelier:draft:v1";

const DRAFT_VERSION = 1;

function isFiniteNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function copyPoint(point, scaleX = 1, scaleY = 1) {
  if (!point || !isFiniteNumber(point.x) || !isFiniteNumber(point.y)) {
    return null;
  }

  const copied = {
    x: point.x * scaleX,
    y: point.y * scaleY,
    pressure: isFiniteNumber(point.pressure) ? point.pressure : 0.5,
    t: isFiniteNumber(point.t) ? point.t : 0
  };
  return copied;
}

function copyStrokes(strokes, scaleX = 1, scaleY = 1) {
  if (!Array.isArray(strokes)) {
    return null;
  }

  const copied = [];
  for (const stroke of strokes) {
    if (!stroke || !Array.isArray(stroke.points) || stroke.points.length < 2) {
      return null;
    }
    const points = stroke.points.map((point) => copyPoint(point, scaleX, scaleY));
    if (points.some((point) => point === null)) {
      return null;
    }
    copied.push(points);
  }
  return copied;
}

export function saveDraft(storage, { strokes, width, height }) {
  if (!storage || !isFiniteNumber(width) || width <= 0 || !isFiniteNumber(height) || height <= 0) {
    return false;
  }

  try {
    if (!Array.isArray(strokes) || strokes.length === 0) {
      storage.removeItem(DRAFT_STORAGE_KEY);
      return true;
    }

    const copied = copyStrokes(strokes);
    if (!copied) {
      return false;
    }
    storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({
      version: DRAFT_VERSION,
      width,
      height,
      strokes: copied.map((points) => ({ points }))
    }));
    return true;
  } catch {
    return false;
  }
}

export function loadDraft(storage, { width, height }) {
  if (!storage || !isFiniteNumber(width) || width <= 0 || !isFiniteNumber(height) || height <= 0) {
    return [];
  }

  try {
    const serialized = storage.getItem(DRAFT_STORAGE_KEY);
    if (!serialized) {
      return [];
    }
    const draft = JSON.parse(serialized);
    if (
      draft?.version !== DRAFT_VERSION ||
      !isFiniteNumber(draft.width) || draft.width <= 0 ||
      !isFiniteNumber(draft.height) || draft.height <= 0
    ) {
      return [];
    }

    return copyStrokes(draft.strokes, width / draft.width, height / draft.height) ?? [];
  } catch {
    return [];
  }
}

export function restoreDraft(storage, strokeStore, dimensions) {
  const strokes = loadDraft(storage, dimensions);
  for (const points of strokes) {
    strokeStore.addStroke(points);
  }
  return strokes.length;
}
