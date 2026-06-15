const { Jimp, loadFont, rgbaToInt } = require("jimp");
const fs = require("fs");
const path = require("path");

const DOWNLOADS_DIR = path.join(__dirname, "downloads");
const FONT_DIR =
  "/home/runner/workspace/node_modules/.pnpm/@jimp+plugin-print@1.6.1/node_modules/@jimp/plugin-print/dist/fonts/open-sans/";

const BG_COMMANDS_URL = "https://i.pinimg.com/736x/30/d2/1b/30d21bbc5aeff32ee924329c9847b326.jpg";

const hex = (r, g, b, a = 255) => rgbaToInt(r, g, b, a);

const drawRect = (img, x, y, w, h, color) => {
  const xEnd = Math.min(x + w, img.width);
  const yEnd = Math.min(y + h, img.height);
  for (let px = Math.max(x, 0); px < xEnd; px++) {
    for (let py = Math.max(y, 0); py < yEnd; py++) {
      img.setPixelColor(color, px, py);
    }
  }
};

// Category short English labels for the image (jimp only supports ASCII)
const CAT_LABELS = [
  "1. Control",
  "2. Group Mgmt",
  "3. Customize",
  "4. Media",
  "5. AI Chat",
  "6. Engine",
  "7. Info/Stats",
  "8. Bot Admin",
  "9. Games",
  "10. Custom Cmds",
];

/**
 * Generates the main commands menu image with all categories listed.
 */
const generateCommandsMenuImage = async () => {
  try {
    if (!fs.existsSync(DOWNLOADS_DIR)) fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

    const W = 900, H = 560;
    const cyan   = hex(0, 230, 255);
    const violet = hex(160, 60, 255);
    const gold   = hex(255, 190, 40);
    const darkOv = hex(5, 5, 20, 195);
    const darkCard = hex(10, 10, 35, 210);
    const border = hex(40, 40, 100, 255);
    const green  = hex(50, 220, 120);

    let bg;
    try {
      bg = await Jimp.read(BG_COMMANDS_URL);
      bg.resize({ w: W, h: H });
    } catch {
      bg = new Jimp({ width: W, height: H, color: hex(8, 8, 22) });
    }

    const overlay = new Jimp({ width: W, height: H, color: darkOv });
    bg.composite(overlay, 0, 0);
    const img = bg;

    // Outer border
    drawRect(img, 0, 0, W, 5, cyan);
    drawRect(img, 0, H - 5, W, 5, cyan);
    drawRect(img, 0, 0, 5, H, cyan);
    drawRect(img, W - 5, 0, 5, H, cyan);

    // Header
    drawRect(img, 15, 15, W - 30, 68, darkCard);
    drawRect(img, 15, 15, W - 30, 4, violet);
    drawRect(img, 15, 79, W - 30, 4, cyan);

    // Two-column grid for categories
    const COL_W = (W - 30) / 2 - 15;
    const ROW_H = 42;
    const GRID_Y = 95;
    const GRID_X1 = 15;
    const GRID_X2 = 15 + COL_W + 15;

    const COLORS = [violet, cyan, gold, green, violet, cyan, gold, green, violet, cyan];

    for (let i = 0; i < 10; i++) {
      const col = i < 5 ? 0 : 1;
      const row = i < 5 ? i : i - 5;
      const gx = col === 0 ? GRID_X1 : GRID_X2;
      const gy = GRID_Y + row * (ROW_H + 6);
      drawRect(img, gx, gy, COL_W, ROW_H, darkCard);
      drawRect(img, gx, gy, 4, ROW_H, COLORS[i]);
    }

    // Footer
    drawRect(img, 15, H - 48, W - 30, 33, darkCard);
    drawRect(img, 15, H - 48, W - 30, 3, gold);

    // Fonts
    const fontLg = await loadFont(FONT_DIR + "open-sans-32-white/open-sans-32-white.fnt");
    const fontMd = await loadFont(FONT_DIR + "open-sans-16-white/open-sans-16-white.fnt");

    // Header text
    img.print({ font: fontLg, x: 30, y: 22, text: "KANEKI BOT  |  COMMANDS MENU" });

    // Category labels
    for (let i = 0; i < 10; i++) {
      const col = i < 5 ? 0 : 1;
      const row = i < 5 ? i : i - 5;
      const gx = col === 0 ? GRID_X1 : GRID_X2;
      const gy = GRID_Y + row * (ROW_H + 6);
      img.print({ font: fontMd, x: gx + 12, y: gy + 12, text: CAT_LABELS[i] });
    }

    // Footer text
    img.print({ font: fontMd, x: 30, y: H - 40, text: "Reply with a number (1-10) to see the full command list for that section" });

    const outPath = path.join(DOWNLOADS_DIR, `cmd_menu_${Date.now()}.png`);
    await img.write(outPath);
    return outPath;
  } catch (e) {
    return null;
  }
};

/**
 * Generates a category detail image for a specific category.
 * @param {object} cat - The category object from COMMANDS_CATEGORIES
 */
const generateCategoryDetailImage = async (cat) => {
  try {
    if (!fs.existsSync(DOWNLOADS_DIR)) fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

    const W = 900, H = 560;
    const cyan   = hex(0, 230, 255);
    const violet = hex(160, 60, 255);
    const gold   = hex(255, 190, 40);
    const green  = hex(50, 220, 120);
    const darkOv = hex(5, 5, 20, 205);
    const darkCard = hex(10, 10, 35, 215);
    const ACCENT = [violet, cyan, gold, green, violet, cyan, gold, green, violet, cyan][(cat.num - 1) % 10];

    let bg;
    try {
      bg = await Jimp.read(BG_COMMANDS_URL);
      bg.resize({ w: W, h: H });
    } catch {
      bg = new Jimp({ width: W, height: H, color: hex(8, 8, 22) });
    }

    const overlay = new Jimp({ width: W, height: H, color: darkOv });
    bg.composite(overlay, 0, 0);
    const img = bg;

    // Border
    drawRect(img, 0, 0, W, 5, ACCENT);
    drawRect(img, 0, H - 5, W, 5, ACCENT);
    drawRect(img, 0, 0, 5, H, ACCENT);
    drawRect(img, W - 5, 0, 5, H, ACCENT);

    // Header card
    drawRect(img, 15, 15, W - 30, 68, darkCard);
    drawRect(img, 15, 15, W - 30, 4, ACCENT);
    drawRect(img, 15, 79, W - 30, 4, cyan);

    // Commands area
    const CMD_Y = 98;
    const CMD_H = 390;
    drawRect(img, 15, CMD_Y, W - 30, CMD_H, darkCard);
    drawRect(img, 15, CMD_Y, 4, CMD_H, ACCENT);

    // Footer
    drawRect(img, 15, H - 50, W - 30, 35, darkCard);
    drawRect(img, 15, H - 50, W - 30, 3, gold);

    // Fonts
    const fontLg = await loadFont(FONT_DIR + "open-sans-32-white/open-sans-32-white.fnt");
    const fontMd = await loadFont(FONT_DIR + "open-sans-16-white/open-sans-16-white.fnt");

    // Header: category name (ASCII label)
    const catLabel = CAT_LABELS[(cat.num - 1) % 10];
    img.print({ font: fontLg, x: 30, y: 22, text: `KANEKI BOT  |  ${catLabel}` });

    // Commands list (ASCII only — Arabic in text reply)
    const cmdsToShow = cat.cmds.slice(0, 9);
    cmdsToShow.forEach((c, i) => {
      const cmdAscii = c.cmd.replace(/[^\x00-\x7F]/g, "*");
      const descAscii = c.desc.replace(/[^\x00-\x7F]/g, "?").slice(0, 52);
      const y = CMD_Y + 14 + i * 40;
      img.print({ font: fontMd, x: 30, y, text: `[${i + 1}]  ${cmdAscii}` });
      img.print({ font: fontMd, x: 50, y: y + 18, text: `   ${descAscii}` });
    });

    // Footer
    img.print({ font: fontMd, x: 30, y: H - 42, text: `Section ${cat.num} of 10  —  Reply with another number to browse more` });

    const outPath = path.join(DOWNLOADS_DIR, `cmd_cat_${cat.num}_${Date.now()}.png`);
    await img.write(outPath);
    return outPath;
  } catch (e) {
    return null;
  }
};

module.exports = { generateCommandsMenuImage, generateCategoryDetailImage };
