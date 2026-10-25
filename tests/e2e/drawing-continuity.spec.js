import { expect, test } from "@playwright/test";

const DRAFT_KEY = "witch-hat-atelier:draft:v1";

async function canvasSignature(canvas) {
  return canvas.evaluate((element) => {
    const { data } = element.getContext("2d").getImageData(0, 0, element.width, element.height);
    let hash = 2166136261;
    for (let index = 0; index < data.length; index += 4) {
      hash ^= data[index] ^ data[index + 1] ^ data[index + 2] ^ data[index + 3];
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  });
}

async function drawStroke(page, canvas) {
  await canvas.scrollIntoViewIfNeeded();
  await expect(canvas).toBeInViewport();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Drawing canvas has no visible bounding box");

  await page.mouse.move(box.x + box.width * 0.25, box.y + box.height * 0.35);
  await page.mouse.down();
  for (let step = 1; step <= 12; step += 1) {
    await page.mouse.move(
      box.x + box.width * (0.25 + step * 0.025),
      box.y + box.height * (0.35 + step * 0.012)
    );
  }
  await page.mouse.up();
}

async function seedActiveFireDraft(page) {
  await page.goto("/");
  await expect(page.locator("#statusValue")).not.toHaveText("Loading");

  const strokeCount = await page.evaluate(async (draftKey) => {
    const canvas = document.querySelector("#glyphCanvas");
    const sigils = await fetch("/src/dictionary/sigils.json").then((response) => response.json());
    const fire = sigils.find((entry) => entry.id === "fire");
    if (!canvas || !fire) throw new Error("Fire fixture is unavailable");

    const center = { x: canvas.width / 2, y: canvas.height / 2 };
    const radius = Math.min(canvas.width, canvas.height) * 0.36;
    const sigilScale = radius * 0.4;
    let timestamp = 0;
    const storedStroke = (points) => ({
      points: points.map((point) => ({ ...point, pressure: 0.5, t: timestamp++ }))
    });
    const arc = (startDeg, endDeg, steps) =>
      Array.from({ length: steps + 1 }, (_, index) => {
        const degrees = startDeg + (endDeg - startDeg) * (index / steps);
        const radians = degrees * Math.PI / 180;
        return {
          x: center.x + Math.cos(radians) * radius,
          y: center.y + Math.sin(radians) * radius
        };
      });

    const openRing = storedStroke(arc(25, 335, 160));
    const fireSigil = fire.strokeTemplate.strokes
      .filter((points) => points.length >= 2)
      .map((points) => storedStroke(points.map((point) => ({
        x: center.x + (point.x - 0.5) * sigilScale,
        y: center.y + (point.y - 0.5) * sigilScale
      }))));
    const closingArc = storedStroke(arc(335, 385, 32));
    const strokes = [openRing, ...fireSigil, closingArc];

    localStorage.setItem(draftKey, JSON.stringify({
      version: 1,
      width: canvas.width,
      height: canvas.height,
      strokes
    }));
    return strokes.length;
  }, DRAFT_KEY);

  await page.reload();
  await expect(page.locator("#statusValue")).not.toHaveText("Loading");
  return strokeCount;
}

async function readSpellIR(page) {
  return page.locator("#irPanel").evaluate((panel) => JSON.parse(panel.dataset.rawJson));
}

test("drawing survives guide navigation and a real page reload", async ({ page }, testInfo) => {
  await page.goto("/");
  await expect(page.locator("#statusValue")).not.toHaveText("Loading");

  const canvas = page.locator("#glyphCanvas");
  await expect(canvas).toBeVisible();
  const blankSignature = await canvasSignature(canvas);

  await drawStroke(page, canvas);
  await expect.poll(() => page.evaluate((key) => {
    const draft = JSON.parse(localStorage.getItem(key) || "null");
    return draft?.strokes?.length ?? 0;
  }, DRAFT_KEY)).toBe(1);
  await expect.poll(() => canvasSignature(canvas)).not.toBe(blankSignature);

  await page.getByRole("button", { name: "Field guide" }).click();
  await expect(page.locator("#referenceWorkspace")).toBeVisible();
  await expect(canvas).toBeHidden();
  await page.screenshot({ path: testInfo.outputPath("field-guide.png"), fullPage: true });

  await page.getByRole("button", { name: "Drawing studio" }).click();
  await expect(canvas).toBeVisible();
  await page.reload();
  await expect(page.locator("#statusValue")).not.toHaveText("Loading");
  await expect.poll(() => canvasSignature(canvas)).not.toBe(blankSignature);
  await expect.poll(() => page.evaluate((key) => {
    const draft = JSON.parse(localStorage.getItem(key) || "null");
    return draft?.strokes?.length ?? 0;
  }, DRAFT_KEY)).toBe(1);
  await page.screenshot({ path: testInfo.outputPath("restored-studio.png"), fullPage: true });
});

test("undo and redo keep activation, diagnostics, and the local draft synchronized", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "desktop activation acceptance only");

  const strokeCount = await seedActiveFireDraft(page);
  const status = page.locator("#statusValue");
  const surface = page.locator(".canvas-shell");
  const undo = page.getByRole("button", { name: "Undo" });

  await expect(status).toHaveText("Active spell");
  await expect(surface).toHaveClass(/portal-active/);
  expect(await readSpellIR(page)).toMatchObject({ active: true, prepared: false, element: "fire" });
  await expect(undo).toBeEnabled();

  await undo.click();
  await expect(status).toHaveText("Prepared spell");
  await expect(surface).not.toHaveClass(/portal-active/);
  expect(await readSpellIR(page)).toMatchObject({ active: false, prepared: true, element: "fire" });
  await expect.poll(() => page.evaluate((key) => {
    const draft = JSON.parse(localStorage.getItem(key) || "null");
    return draft?.strokes?.length ?? 0;
  }, DRAFT_KEY)).toBe(strokeCount - 1);

  await page.getByRole("button", { name: "Redo" }).click();
  await expect(status).toHaveText("Active spell");
  await expect(surface).toHaveClass(/portal-active/);
  expect(await readSpellIR(page)).toMatchObject({ active: true, prepared: false, element: "fire" });
  await expect.poll(() => page.evaluate((key) => {
    const draft = JSON.parse(localStorage.getItem(key) || "null");
    return draft?.strokes?.length ?? 0;
  }, DRAFT_KEY)).toBe(strokeCount);

  await page.reload();
  await expect(status).toHaveText("Active spell");
  await expect(surface).toHaveClass(/portal-active/);
  expect(await readSpellIR(page)).toMatchObject({ active: true, prepared: false, element: "fire" });
  await expect.poll(() => page.evaluate((key) => {
    const draft = JSON.parse(localStorage.getItem(key) || "null");
    return draft?.strokes?.length ?? 0;
  }, DRAFT_KEY)).toBe(strokeCount);
  await page.screenshot({ path: testInfo.outputPath("restored-active-spell.png"), fullPage: true });
});

test("narrow studio starts with the complete drawing surface in the first viewport", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "narrow", "narrow acceptance only");

  await page.goto("/");
  await expect(page.locator("#statusValue")).not.toHaveText("Loading");

  const surface = page.locator(".canvas-shell");
  await expect(surface).toBeVisible();
  const box = await surface.boundingBox();
  const viewport = page.viewportSize();

  expect(box).not.toBeNull();
  expect(viewport).not.toBeNull();
  expect(box.y).toBeGreaterThanOrEqual(0);
  expect(box.y + box.height).toBeLessThanOrEqual(viewport.height);
});

test("narrow canvas instructions meet WCAG AA contrast", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "narrow", "narrow acceptance only");

  await page.goto("/");
  const ratio = await page.locator("#canvasHint").evaluate((hint) => {
    const parseColor = (value) => {
      const channels = value.match(/[\d.]+/g)?.map(Number) ?? [];
      return {
        r: channels[0] ?? 0,
        g: channels[1] ?? 0,
        b: channels[2] ?? 0,
        a: channels[3] ?? 1
      };
    };
    const linear = (channel) => {
      const value = channel / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    const luminance = ({ r, g, b }) =>
      0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

    const foreground = parseColor(getComputedStyle(hint).color);
    const background = parseColor(getComputedStyle(hint.closest(".canvas-shell")).backgroundColor);
    const composite = {
      r: foreground.r * foreground.a + background.r * (1 - foreground.a),
      g: foreground.g * foreground.a + background.g * (1 - foreground.a),
      b: foreground.b * foreground.a + background.b * (1 - foreground.a)
    };
    const light = Math.max(luminance(composite), luminance(background));
    const dark = Math.min(luminance(composite), luminance(background));
    return (light + 0.05) / (dark + 0.05);
  });

  expect(ratio).toBeGreaterThanOrEqual(4.5);
});
