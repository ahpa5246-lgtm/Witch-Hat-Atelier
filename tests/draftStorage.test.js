import test from "node:test";
import assert from "node:assert/strict";
import { loadDraft, restoreDraft, saveDraft } from "../src/input/draftStorage.js";
import { createStrokeStore } from "../src/input/strokeStore.js";

class MemoryStorage {
  constructor() {
    this.values = new Map();
  }

  getItem(key) {
    return this.values.get(key) ?? null;
  }

  setItem(key, value) {
    this.values.set(key, String(value));
  }

  removeItem(key) {
    this.values.delete(key);
  }
}

class ThrowingStorage {
  getItem() {
    throw new Error("storage unavailable");
  }

  setItem() {
    throw new Error("storage unavailable");
  }

  removeItem() {
    throw new Error("storage unavailable");
  }
}

test("restores a saved draft at the current canvas size", () => {
  const storage = new MemoryStorage();
  const strokes = [{
    id: "s1",
    points: [
      { x: 10, y: 20, pressure: 0.4, t: 1 },
      { x: 30, y: 40, pressure: 0.6, t: 2 }
    ]
  }];

  assert.equal(saveDraft(storage, { strokes, width: 100, height: 100 }), true);
  const restored = loadDraft(storage, { width: 200, height: 50 });

  assert.deepEqual(restored, [[
    { x: 20, y: 10, pressure: 0.4, t: 1 },
    { x: 60, y: 20, pressure: 0.6, t: 2 }
  ]]);
});

test("ignores corrupt or unsafe draft data", () => {
  const storage = new MemoryStorage();
  storage.setItem("witch-hat-atelier:draft:v1", JSON.stringify({
    version: 1,
    width: 100,
    height: 100,
    strokes: [{ points: [{ x: "ten", y: 20, t: 1 }] }]
  }));

  assert.deepEqual(loadDraft(storage, { width: 200, height: 200 }), []);
  storage.setItem("witch-hat-atelier:draft:v1", "not-json");
  assert.deepEqual(loadDraft(storage, { width: 200, height: 200 }), []);
});

test("clearing the drawing removes the stored draft", () => {
  const storage = new MemoryStorage();
  saveDraft(storage, {
    strokes: [{ points: [{ x: 1, y: 1, pressure: 0.5, t: 1 }, { x: 2, y: 2, pressure: 0.5, t: 2 }] }],
    width: 10,
    height: 10
  });
  assert.equal(saveDraft(storage, { strokes: [], width: 10, height: 10 }), true);

  assert.deepEqual(loadDraft(storage, { width: 10, height: 10 }), []);
});

test("restores saved points into the stroke store", () => {
  const storage = new MemoryStorage();
  const source = createStrokeStore();
  source.addStroke([{ x: 4, y: 6, t: 1 }, { x: 8, y: 10, t: 2 }]);
  saveDraft(storage, { strokes: source.getStrokes(), width: 20, height: 20 });

  const restored = createStrokeStore();
  const count = restoreDraft(storage, restored, { width: 40, height: 10 });

  assert.equal(count, 1);
  assert.deepEqual(restored.getStrokes()[0].points, [
    { x: 8, y: 3, pressure: 0.5, t: 1 },
    { x: 16, y: 5, pressure: 0.5, t: 2 }
  ]);
});

test("reports a failed draft write without throwing", () => {
  const stored = saveDraft(new ThrowingStorage(), {
    strokes: [{ points: [{ x: 1, y: 1, t: 1 }, { x: 2, y: 2, t: 2 }] }],
    width: 10,
    height: 10
  });

  assert.equal(stored, false);
});

test("treats an unavailable draft store as an empty draft", () => {
  assert.deepEqual(loadDraft(new ThrowingStorage(), { width: 10, height: 10 }), []);
});
