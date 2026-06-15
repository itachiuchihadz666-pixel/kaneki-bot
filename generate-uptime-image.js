const Jimp = require("jimp");
const fs = require("fs");
const path = require("path");

const DOWNLOADS_DIR = path.join(__dirname, "downloads");

const hex = (r, g, b, a = 255) => Jimp.rgbaToInt(r, g, b, a);

const drawRect = (img, x, y, w, h, color) => {
  for (let px = x; px < x + w; px++) {
    for (let py = y; py < y + h; py++) {
      img.setPixelColor(color, px, py);
    }
  }
};

const drawBar = (img, x, y, w, h, progress, colorFg, colorBg) => {
  drawRect(img, x, y, w, h, colorBg);
  drawRect(img, x, y, Math.floor(w * progress), h, colorFg);
};

const generateUptimeImage = async ({ uptimeSecs, admins, cookieSavedAt }) => {
  try {
    if (!fs.existsSync(DOWNLOADS_DIR)) fs.mkdirSync(DOWNLOADS_DIR, { recursive: true });

    const W = 900, H = 520;
    const img = new Jimp(W, H, hex(8, 8, 20));

    const cyan = hex(0, 210, 220);
    const violet = hex(140, 60, 220);
    const gold = hex(255, 200, 50);
    const white = hex(255, 255, 255);
    const gray = hex(100, 100, 130);
    const darkCard = hex(18, 18, 40);
    const border = hex(50, 50, 90);

    // outer glow border
    drawRect(img, 0, 0, W, 4, cyan);
    drawRect(img, 0, H - 4, W, 4, cyan);
    drawRect(img, 0, 0, 4, H, cyan);
    drawRect(img, W - 4, 0, 4, H, cyan);

    // header card
    drawRect(img, 20, 20, W - 40, 80, darkCard);
    drawRect(img, 20, 20, W - 40, 4, violet);

    // main card
    drawRect(img, 20, 120, W - 40, 180, darkCard);
    drawRect(img, 20, 120, 4, 180, gold);

    // admins card
    drawRect(img, 20, 320, W - 40, 180, darkCard);
    drawRect(img, 20, 320, 4, 180, violet);

    // uptime bar
    const totalMax = 24 * 60 * 60;
    const progress = Math.min(uptimeSecs / totalMax, 1);
    drawBar(img, 40, 260, W - 80, 18, progress, cyan, border);
    drawRect(img, 40, 258, W - 80, 2, gray);

    // cookie bar
    const cookieAgeMs = cookieSavedAt ? Date.now() - new Date(cookieSavedAt).getTime() : 0;
    const cookieMaxMs = 7 * 24 * 60 * 60 * 1000;
    const cookieProgress = Math.max(0, 1 - cookieAgeMs / cookieMaxMs);
    drawBar(img, 40, 290, W - 80, 14, cookieProgress, gold, border);

    const fontLg = await Jimp.loadFont(Jimp.FONT_SANS_32_WHITE);
    const fontMd = await Jimp.loadFont(Jimp.FONT_SANS_16_WHITE);

    const h = Math.floor(uptimeSecs / 3600);
    const m = Math.floor((uptimeSecs % 3600) / 60);
    const s = uptimeSecs % 60;

    img.print(fontLg, 40, 35, `KANEKI BOT — UPTIME: ${String(h).padStart(2,"0")}h ${String(m).padStart(2,"0")}m ${String(s).padStart(2,"0")}s`);
    img.print(fontMd, 40, 130, `[SYSTEM] Runtime Performance`);
    img.print(fontMd, 40, 158, `Uptime Progress (24h cycle):`);
    img.print(fontMd, 40, 218, `Cookie Health:`);
    img.print(fontMd, 40, 240, `Next auto-refresh in: ${Math.max(0, Math.floor(60 - (cookieAgeMs / 60000) % 60))} min`);

    img.print(fontMd, 40, 330, `[ADMINS] Bot Moderators (${admins.length})`);
    admins.slice(0, 5).forEach((a, i) => {
      img.print(fontMd, 55, 360 + i * 26, `• ${a.name || a.id}`);
    });
    if (admins.length === 0) {
      img.print(fontMd, 55, 360, "No admins configured");
    }

    img.print(fontMd, 40, H - 30, `Generated: ${new Date().toISOString()}`);

    const outPath = path.join(DOWNLOADS_DIR, `uptime_${Date.now()}.png`);
    await img.writeAsync(outPath);
    return outPath;
  } catch (e) {
    return null;
  }
};

module.exports = { generateUptimeImage };
