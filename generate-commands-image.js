const { Jimp, loadFont, rgbaToInt } = require("jimp");
const fs = require("fs");
const path = require("path");

const DOWNLOADS_DIR = path.join(__dirname, "downloads");
const FONT_DIR =
  "/home/runner/workspace/node_modules/.pnpm/@jimp+plugin-print@1.6.1/node_modules/@jimp/plugin-print/dist/fonts/open-sans/";

// The Pinterest Kaneki image used as background for /اوامر
const KANEKI_BG_URL = "https://i.pinimg.com/736x/30/d2/1b/30d21bbc5aeff32ee924329c9847b326.jpg";

// Cache the background locally to avoid repeated downloads
const BG_CACHE_PATH = path.join(__dirname, "downloads", "_kaneki_cmd_bg.jpg");

const hex = (r, g, b, a = 255) => rgbaToInt(r, g, b, a);

const drawRect = (img, x, y, w, h, color) => {
  const x1 = Math.max(0, x), y1 = Math.max(0, y);
  const x2 = Math.min(img.width, x + w), y2 = Math.min(img.height, y + h);
  for (let px = x1; px < x2; px++)
    for (let py = y1; py < y2; py++)
      img.setPixelColor(color, px, py);
};

const loadBg = async () => {
  if (!fs.existsSync(DOWNLOADS_DIR)) fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });
  // Use cached version if fresh (< 1 day old)
  if (fs.existsSync(BG_CACHE_PATH)) {
    const age = Date.now() - fs.statSync(BG_CACHE_PATH).mtimeMs;
    if (age < 86400000) return Jimp.read(BG_CACHE_PATH);
  }
  try {
    const img = await Jimp.read(KANEKI_BG_URL);
    await img.write(BG_CACHE_PATH);
    return img;
  } catch {
    return new Jimp({ width: 736, height: 414, color: hex(5, 5, 15) });
  }
};

// Short labels for each category (ASCII only — jimp limitation)
const CAT_LABELS = [
  "1.  Control",
  "2.  Group Mgmt",
  "3.  Customize",
  "4.  Media",
  "5.  AI Chat",
  "6.  Engine",
  "7.  Info / Stats",
  "8.  Bot Admin",
  "9.  Games",
  "10. Custom Cmds",
];

const ACCENT_COLORS = [
  hex(0, 210, 230),   // 1 cyan
  hex(160, 60, 255),  // 2 violet
  hex(255, 190, 40),  // 3 gold
  hex(50, 220, 120),  // 4 green
  hex(0, 210, 230),   // 5 cyan
  hex(160, 60, 255),  // 6 violet
  hex(255, 190, 40),  // 7 gold
  hex(50, 220, 120),  // 8 green
  hex(0, 210, 230),   // 9 cyan
  hex(160, 60, 255),  // 10 violet
];

/**
 * Generates the /اوامر menu image:
 * Downloads the Kaneki image, overlays a dark panel on the right half,
 * then writes all 10 categories directly on the image.
 */
const generateCommandsMenuImage = async () => {
  try {
    if (!fs.existsSync(DOWNLOADS_DIR)) fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

    const bg = await loadBg();
    const W = bg.width;   // 736
    const H = bg.height;  // 414

    // Right-side dark panel (60% of width) for text
    const PANEL_X = Math.floor(W * 0.38);
    const PANEL_W = W - PANEL_X;

    // Semi-transparent dark overlay over full image
    const fullOverlay = new Jimp({ width: W, height: H, color: hex(0, 0, 0, 130) });
    bg.composite(fullOverlay, 0, 0);

    // Solid dark panel on right
    const panel = new Jimp({ width: PANEL_W, height: H, color: hex(5, 5, 20, 220) });
    bg.composite(panel, PANEL_X, 0);

    // Panel border line (left edge)
    drawRect(bg, PANEL_X, 0, 3, H, hex(0, 200, 220));

    // Header bar
    drawRect(bg, PANEL_X, 0, PANEL_W, 32, hex(0, 0, 0, 240));
    drawRect(bg, PANEL_X, 30, PANEL_W, 2, hex(0, 200, 220));

    // Bottom bar
    drawRect(bg, PANEL_X, H - 28, PANEL_W, 28, hex(0, 0, 0, 240));
    drawRect(bg, PANEL_X, H - 28, PANEL_W, 2, hex(255, 180, 30));

    // Accent line on left side of full image
    drawRect(bg, 0, 0, 4, H, hex(0, 200, 220));
    drawRect(bg, 0, 0, W, 4, hex(0, 200, 220));
    drawRect(bg, 0, H - 4, W, 4, hex(0, 200, 220));

    // Load fonts
    const fontLg = await loadFont(FONT_DIR + "open-sans-16-white/open-sans-16-white.fnt");
    const fontSm = await loadFont(FONT_DIR + "open-sans-12-black/open-sans-12-black.fnt");
    const fontHd = await loadFont(FONT_DIR + "open-sans-16-black/open-sans-16-black.fnt");

    // Header text
    bg.print({ font: fontLg, x: PANEL_X + 12, y: 6, text: "KANEKI BOT | COMMANDS" });

    // Category rows
    const ROW_H = Math.floor((H - 60) / 10);
    for (let i = 0; i < 10; i++) {
      const ry = 34 + i * ROW_H;
      // Colored accent bar per category (4px wide, 2px inset from panel edge)
      drawRect(bg, PANEL_X + 6, ry + 2, 3, ROW_H - 4, ACCENT_COLORS[i]);
      bg.print({ font: fontLg, x: PANEL_X + 16, y: ry + Math.floor((ROW_H - 16) / 2), text: CAT_LABELS[i] });
    }

    // Footer text
    bg.print({ font: fontLg, x: PANEL_X + 12, y: H - 22, text: "Reply with 1-10 to see details" });

    const outPath = path.join(DOWNLOADS_DIR, `cmd_menu_${Date.now()}.png`);
    await bg.write(outPath);
    return outPath;
  } catch (e) {
    return null;
  }
};

/**
 * Generates a category detail image — same Kaneki background,
 * dark panel on the right with commands for the selected category.
 */
const generateCategoryDetailImage = async (cat) => {
  try {
    if (!fs.existsSync(DOWNLOADS_DIR)) fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

    const bg = await loadBg();
    const W = bg.width;
    const H = bg.height;
    const ACCENT = ACCENT_COLORS[(cat.num - 1) % 10];

    const PANEL_X = Math.floor(W * 0.32);
    const PANEL_W = W - PANEL_X;

    const fullOverlay = new Jimp({ width: W, height: H, color: hex(0, 0, 0, 140) });
    bg.composite(fullOverlay, 0, 0);

    const panel = new Jimp({ width: PANEL_W, height: H, color: hex(5, 5, 20, 230) });
    bg.composite(panel, PANEL_X, 0);

    drawRect(bg, PANEL_X, 0, 3, H, ACCENT);
    drawRect(bg, PANEL_X, 0, PANEL_W, 36, hex(0, 0, 0, 245));
    drawRect(bg, PANEL_X, 34, PANEL_W, 2, ACCENT);
    drawRect(bg, PANEL_X, H - 24, PANEL_W, 24, hex(0, 0, 0, 240));
    drawRect(bg, PANEL_X, H - 24, PANEL_W, 2, hex(255, 180, 30));

    drawRect(bg, 0, 0, 4, H, ACCENT);
    drawRect(bg, 0, 0, W, 4, ACCENT);
    drawRect(bg, 0, H - 4, W, 4, ACCENT);

    const fontLg = await loadFont(FONT_DIR + "open-sans-16-white/open-sans-16-white.fnt");

    const catLabel = CAT_LABELS[(cat.num - 1) % 10];
    bg.print({ font: fontLg, x: PANEL_X + 12, y: 9, text: `SEC ${cat.num}  |  ${catLabel}` });

    const cmds = cat.cmds.slice(0, 9);
    const ROW_H = Math.floor((H - 62) / Math.max(cmds.length, 1));
    cmds.forEach((c, i) => {
      const cmdText = c.cmd.replace(/[^\x00-\x7F]/g, "*").slice(0, 28);
      drawRect(bg, PANEL_X + 6, 38 + i * ROW_H + 1, 3, ROW_H - 2, ACCENT);
      bg.print({ font: fontLg, x: PANEL_X + 16, y: 38 + i * ROW_H + Math.floor((ROW_H - 16) / 2), text: `[${i + 1}] ${cmdText}` });
    });

    bg.print({ font: fontLg, x: PANEL_X + 12, y: H - 18, text: `Sec ${cat.num}/10  |  Reply another # for more` });

    const outPath = path.join(DOWNLOADS_DIR, `cmd_cat_${cat.num}_${Date.now()}.png`);
    await bg.write(outPath);
    return outPath;
  } catch (e) {
    return null;
  }
};

module.exports = { generateCommandsMenuImage, generateCategoryDetailImage };
