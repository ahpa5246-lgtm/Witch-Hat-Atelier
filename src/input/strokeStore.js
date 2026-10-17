export function createStrokeStore() {
  let strokes = [];
  let nextId = 1;
  let undone = [];

  return {
    addStroke(points) {
      const now = performance.now();
      const stroke = {
        id: `s${nextId++}`,
        points: points.map((point) => ({ ...point })),
        startedAt: points[0]?.t ?? now,
        endedAt: points[points.length - 1]?.t ?? now
      };
      undone = [];
      strokes = [...strokes, stroke];
      return stroke;
    },

    undo() {
      const removed = strokes[strokes.length - 1] ?? null;
      if (removed) undone.push(removed);
      strokes = strokes.slice(0, -1);
      return removed;
    },

    redo() {
      const stroke = undone.pop() ?? null;
      if (stroke) strokes = [...strokes, stroke];
      return stroke;
    },

    clear() {
      strokes = [];
      nextId = 1;
      undone = [];
    },

    scale(scaleX, scaleY) {
      const scaleStroke = (stroke) => ({
        ...stroke,
        points: stroke.points.map((point) => ({ ...point, x: point.x * scaleX, y: point.y * scaleY }))
      });
      strokes = strokes.map(scaleStroke);
      undone = undone.map(scaleStroke);
    },

    getStrokes() {
      return strokes.map((stroke) => ({
        ...stroke,
        points: stroke.points.map((point) => ({ ...point }))
      }));
    },

    count() {
      return strokes.length;
    }
  };
}
