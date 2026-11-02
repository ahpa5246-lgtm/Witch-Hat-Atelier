import test from "node:test";
import assert from "node:assert/strict";
import { createStrokeStore } from "../src/input/strokeStore.js";
const points = [{x:10,y:20,t:0},{x:20,y:40,t:1}];
test("redo survives canvas resize and new ink discards obsolete future", () => {
  const store = createStrokeStore();
  store.addStroke(points); store.undo(); store.scale(2,3); store.redo();
  assert.equal(store.getStrokes()[0].points[0].x,20);
  assert.equal(store.getStrokes()[0].points[0].y,60);
  store.undo(); store.addStroke(points);
  assert.equal(store.redo(),null);
  assert.equal(store.count(),1);
  store.clear(); assert.equal(store.redo(),null);
});
