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
