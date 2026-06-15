const { Jimp, loadFont, rgbaToInt } = require("jimp");
const fs = require("fs");
const path = require("path");
const axios = require("axios");

const DOWNLOADS_DIR = path.join(__dirname, "downloads");
const FONT_DIR =
  "/home/runner/workspace/node_modules/.pnpm/@jimp+plugin-print@1.6.1/node_modules/@jimp/plugin-print/dist/fonts/open-sans/";

const BG_URL = "https://i.pinimg.com/736x/f4/a8/10/f4a810f4c4e3f7a51f79cd324f27b82f.jpg";

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

const drawBar = (img, x, y, w, h, progress, colorFg, colorBg) => {
  drawRect(img, x, y, w, h, colorBg);
  drawRect(img, x, y, Math.max(1, Math.floor(w * progress)), h, colorFg);
};

const generateUptimeImage = async ({ uptimeSecs, admins, cookieSavedAt }) => {
  try {
    if (!fs.existsSync(DOWNLOADS_DIR)) fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

    const W = 900, H = 540;
    const cyan    = hex(0, 230, 255);
    const violet  = hex(160, 60, 255);
    const gold    = hex(255, 190, 40);
    const white   = hex(255, 255, 255);
    const darkOv  = hex(5, 5, 20, 200);
    const darkCard = hex(10, 10, 35, 210);
    const border  = hex(40, 40, 90, 255);
    const teal    = hex(0, 200, 180);

    let bg;
    try {
      bg = await Jimp.read(BG_URL);
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

    // Header card
    drawRect(img, 15, 15, W - 30, 75, darkCard);
    drawRect(img, 15, 15, W - 30, 4, violet);
    drawRect(img, 15, 86, W - 30, 4, cyan);

    // Uptime card
    drawRect(img, 15, 105, W - 30, 160, darkCard);
    drawRect(img, 15, 105, 4, 160, gold);

    // Admins card
    drawRect(img, 15, 280, W - 30, 175, darkCard);
    drawRect(img, 15, 280, 4, 175, violet);

    // Cookie bar
    const cookieAgeMs = cookieSavedAt ? Date.now() - new Date(cookieSavedAt).getTime() : 0;
    const cookieMaxMs = 7 * 24 * 60 * 60 * 1000;
    const cookieProgress = Math.max(0, 1 - cookieAgeMs / cookieMaxMs);
    drawBar(img, 35, 230, W - 70, 12, cookieProgress, teal, border);

    // Uptime bar (24h cycle)
    const totalMax = 24 * 60 * 60;
    const progress = Math.min(uptimeSecs / totalMax, 1);
    drawBar(img, 35, 200, W - 70, 16, progress, cyan, border);

    // Corner decorations
    drawRect(img, 15, H - 50, W - 30, 35, darkCard);
    drawRect(img, 15, H - 50, W - 30, 3, teal);

    // Load fonts
    const fontLg  = await loadFont(FONT_DIR + "open-sans-32-white/open-sans-32-white.fnt");
    const fontMd  = await loadFont(FONT_DIR + "open-sans-16-white/open-sans-16-white.fnt");
    const fontSm  = await loadFont(FONT_DIR + "open-sans-12-black/open-sans-12-black.fnt");

    const h = Math.floor(uptimeSecs / 3600);
    const m = Math.floor((uptimeSecs % 3600) / 60);
    const s = uptimeSecs % 60;

    // Header
    img.print({ font: fontLg, x: 30, y: 25, text: `KANEKI BOT  |  UPTIME MONITOR` });

    // Uptime section
    img.print({ font: fontLg, x: 30, y: 112, text: `${String(h).padStart(2,"0")}h  ${String(m).padStart(2,"0")}m  ${String(s).padStart(2,"0")}s` });
    img.print({ font: fontMd, x: 30, y: 155, text: `Runtime since last restart` });
    img.print({ font: fontMd, x: 30, y: 175, text: `Uptime cycle (24h):` });
    img.print({ font: fontMd, x: 30, y: 220, text: `Cookie health:` });

    // Admins section
    img.print({ font: fontMd, x: 30, y: 288, text: `BOT ADMINS  (${admins.length})` });

    if (admins.length === 0) {
      img.print({ font: fontMd, x: 45, y: 318, text: `No admins configured` });
    } else {
      const maxShow = Math.min(admins.length, 6);
      for (let i = 0; i < maxShow; i++) {
        const name = (admins[i].name || admins[i].id || "Unknown").replace(/[^\x00-\x7F]/g, "?");
        img.print({ font: fontMd, x: 45, y: 318 + i * 28, text: `[${i + 1}]  ${name}` });
      }
      if (admins.length > 6) {
        img.print({ font: fontMd, x: 45, y: 318 + 6 * 28, text: `... and ${admins.length - 6} more` });
      }
    }

    // Footer
    img.print({ font: fontMd, x: 30, y: H - 43, text: `Generated: ${new Date().toUTCString()}` });

    const outPath = path.join(DOWNLOADS_DIR, `uptime_${Date.now()}.png`);
    await img.write(outPath);
    return outPath;
  } catch (e) {
    return null;
  }
};

module.exports = { generateUptimeImage };
