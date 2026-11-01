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

test("keyboard shortcuts keep undo and redo synchronized with the drawing draft", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#statusValue")).not.toHaveText("Loading");

  const canvas = page.locator("#glyphCanvas");
  const blankSignature = await canvasSignature(canvas);
  await drawStroke(page, canvas);

  const savedStrokeCount = () => page.evaluate((key) => {
    const draft = JSON.parse(localStorage.getItem(key) || "null");
    return draft?.strokes?.length ?? 0;
  }, DRAFT_KEY);

  await expect.poll(savedStrokeCount).toBe(1);
  await page.keyboard.press("Control+z");
  await expect.poll(savedStrokeCount).toBe(0);
  await expect.poll(() => canvasSignature(canvas)).toBe(blankSignature);

  await page.keyboard.press("Control+Shift+z");
  await expect.poll(savedStrokeCount).toBe(1);
  await expect.poll(() => canvasSignature(canvas)).not.toBe(blankSignature);

  await page.keyboard.press("Control+z");
  await expect.poll(savedStrokeCount).toBe(0);
  await page.keyboard.press("Control+y");
  await expect.poll(savedStrokeCount).toBe(1);
  await expect.poll(() => canvasSignature(canvas)).not.toBe(blankSignature);

  await expect(page.locator("#undoButton")).toHaveAttribute("aria-keyshortcuts", "Control+Z Meta+Z");
  await expect(page.locator("#redoButton")).toHaveAttribute(
    "aria-keyshortcuts",
    "Control+Shift+Z Control+Y Meta+Shift+Z Meta+Y"
  );
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


test("editable fields do not consume drawing history shortcuts", async ({ page }) => {
  await page.goto("/");
  await expect(page.locator("#statusValue")).not.toHaveText("Loading");

  const canvas = page.locator("#glyphCanvas");
  const blankSignature = await canvasSignature(canvas);
  await drawStroke(page, canvas);

  const savedStrokeCount = () => page.evaluate((key) => {
    const draft = JSON.parse(localStorage.getItem(key) || "null");
    return draft?.strokes?.length ?? 0;
  }, DRAFT_KEY);

  await expect.poll(savedStrokeCount).toBe(1);
  await expect.poll(() => canvasSignature(canvas)).not.toBe(blankSignature);

  await page.evaluate(() => {
    window.__historyShortcutClicks = { undo: 0, redo: 0 };
    document.querySelector("#undoButton").addEventListener("click", () => {
      window.__historyShortcutClicks.undo += 1;
    });
    document.querySelector("#redoButton").addEventListener("click", () => {
      window.__historyShortcutClicks.redo += 1;
    });

    const input = document.createElement("input");
    input.id = "history-shortcut-input";
    input.type = "text";

    const textarea = document.createElement("textarea");
    textarea.id = "history-shortcut-textarea";

    const select = document.createElement("select");
    select.id = "history-shortcut-select";
    select.add(new Option("First", "first"));
    select.add(new Option("Second", "second"));

    const editable = document.createElement("div");
    editable.id = "history-shortcut-editable";
    editable.contentEditable = "true";
    editable.textContent = "Editable notes";

    document.body.append(input, textarea, select, editable);
  });

  const editableTargets = [
    "#history-shortcut-input",
    "#history-shortcut-textarea",
    "#history-shortcut-select",
    "#history-shortcut-editable"
  ];

  for (const selector of editableTargets) {
    await page.locator(selector).focus();
    await page.keyboard.press("Control+z");
    await expect.poll(() => page.evaluate(() => window.__historyShortcutClicks.undo)).toBe(0);
    await expect.poll(savedStrokeCount).toBe(1);
    await expect.poll(() => canvasSignature(canvas)).not.toBe(blankSignature);
  }

  await page.locator("#undoButton").click();
  await expect.poll(savedStrokeCount).toBe(0);
  await page.evaluate(() => {
    window.__historyShortcutClicks.undo = 0;
    window.__historyShortcutClicks.redo = 0;
  });

  for (const selector of editableTargets) {
    await page.locator(selector).focus();
    await page.keyboard.press("Control+Shift+z");
    await page.keyboard.press("Control+y");
    await expect.poll(() => page.evaluate(() => window.__historyShortcutClicks.redo)).toBe(0);
    await expect.poll(savedStrokeCount).toBe(0);
    await expect.poll(() => canvasSignature(canvas)).toBe(blankSignature);
  }
});


test("reference tabs support keyboard navigation and announce spell-state changes", async ({ page }, testInfo) => {
  await page.goto("/");
  const status = page.locator("#statusValue");
  await expect(status).not.toHaveText("Loading");
  await expect(status).toHaveAttribute("role", "status");
  await expect(status).toHaveAttribute("aria-live", "polite");
  await expect(status).toHaveAttribute("aria-atomic", "true");

  const fieldGuide = page.getByRole("button", { name: "Field guide" });
  await fieldGuide.focus();
  await page.keyboard.press("Enter");

  const dictionaryTab = page.getByRole("tab", { name: "Dictionary" });
  const diagnosticTab = page.getByRole("tab", { name: "Diagnostic" });
  await expect(page.getByRole("tablist", { name: "Reference workspaces" })).toBeVisible();
  await expect(dictionaryTab).toHaveAttribute("aria-selected", "true");
  await expect(dictionaryTab).toHaveAttribute("tabindex", "0");
  await expect(page.locator("#dictionaryRootPanel")).toBeVisible();

  await dictionaryTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(diagnosticTab).toBeFocused();
  await expect(diagnosticTab).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#diagnosticRootPanel")).toBeVisible();

  await page.keyboard.press("ArrowLeft");
  await expect(dictionaryTab).toBeFocused();
  await expect(dictionaryTab).toHaveAttribute("aria-selected", "true");

  const sampleTab = page.getByRole("tab", { name: "Sample Spells" });
  const sigilsTab = page.getByRole("tab", { name: "Sigils" });
  const signsTab = page.getByRole("tab", { name: "Signs" });
  await sampleTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(sigilsTab).toBeFocused();
  await expect(sigilsTab).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#sigilReferencePanel")).toBeVisible();

  await page.keyboard.press("End");
  await expect(signsTab).toBeFocused();
  await expect(signsTab).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#signReferencePanel")).toBeVisible();

  await page.keyboard.press("Home");
  await expect(sampleTab).toBeFocused();
  await expect(page.locator("#sampleSpellReferencePanel")).toBeVisible();

  await diagnosticTab.focus();
  await page.keyboard.press("Enter");
  const parserTab = page.getByRole("tab", { name: "Parser" });
  const astTab = page.getByRole("tab", { name: "AST" });
  const irTab = page.getByRole("tab", { name: "IR" });
  await parserTab.focus();
  await page.keyboard.press("ArrowRight");
  await expect(astTab).toBeFocused();
  await expect(page.locator("#astPanelShell")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(irTab).toBeFocused();
  await expect(irTab).toHaveAttribute("aria-selected", "true");
  await expect(page.locator("#irPanelShell")).toBeVisible();

  await page.screenshot({
    path: testInfo.outputPath("keyboard-reference-tabs.png"),
    fullPage: true
  });
});
