"use strict";
/**
 * Kaneki Bot — مولّد GIF قوائم الأوامر
 * sharp (SVG → RGBA frames) + gif-encoder-2 (GIF encoding)
 */

const sharp = require("sharp");
const GifEncoder = require("gif-encoder-2");
const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "downloads");
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const W = 560;
const H = 400;
const FRAMES = 20;
const DELAY  = 90;   // ms per frame

// ====== بيانات الصفحات ======
const PAGES = {
  1: {
    title: "قائمة الأوامر 1",
    subtitle: "التحكم الأساسي",
    c1: "#CC1133", c2: "#5A0010", accent: "#FF6680",
    cmds: [
      "/تشغيل — تفعيل البوت",
      "/ايقاف — تعطيل البوت",
      "/قفل — للمالك والمشرفين فقط",
      "/فتح — إتاحة البوت للجميع",
      "/قفل_كامل — المالك فقط",
      "/مراقبة تشغيل — رصد المجموعة",
      "/مراقبة ايقاف — إيقاف الرصد",
      "/اعطني الايدي — ايدي شخص بالرد",
      "/ابتيم — مدة تشغيل البوت",
    ],
    hint: "💡 /الاوامر 2 للصفحة التالية",
  },
  2: {
    title: "قائمة الأوامر 2",
    subtitle: "الحماية وإدارة المجموعة",
    c1: "#7B2FBE", c2: "#35006A", accent: "#C39BD3",
    cmds: [
      "هات ادمن — ترقيتك لـ Admin",
      "!كانيكي ادمن [رابط] — إضافة مشرف",
      "!كانيكي نزع الادمن — نزع مشرف",
      "/تدمير طرد — طرد كل المشرفين",
      "/تدمير رتبة — نزع رتب الجميع",
      "/حماية تشغيل — حماية المالك",
      "/طرد — طرد بالرد على رسالته",
      "/اصلاح — تنظيف الكنيات",
      "/مسح • /مسح_الكل • /غادر",
    ],
    hint: "💡 /الاوامر 3 للصفحة التالية",
  },
  3: {
    title: "قائمة الأوامر 3",
    subtitle: "الذكاء الاصطناعي والميديا",
    c1: "#0D6EFD", c2: "#00215A", accent: "#66B2FF",
    cmds: [
      "اذكر كانيكي — رد بشخصية حقيقية",
      "امي كانيكي [سؤال] — سؤال مباشر",
      "/سؤال [سؤالك] — إجابة مفصّلة",
      "بنترست [كلمة] — 5 صور بنترست",
      "/افتار [اسم] — صور أنمي بجودة 2K",
      "/تحميل_صوت [اسم] — تحميل أغنية",
      "/صوت [نص] — نص إلى صوت",
      "/سيطرة_الاسم — قفل اسم المجموعة",
      "/شارنغان • /مانغا • /فيديو",
    ],
    hint: "💡 /الاوامر 4 للصفحة التالية",
  },
  4: {
    title: "قائمة الأوامر 4",
    subtitle: "الألعاب والأداء",
    c1: "#D4A017", c2: "#5A3200", accent: "#FFD966",
    cmds: [
      "/اسرع — لعبة الكلمات المقلوبة",
      "/نيزك [نص] — رسالة تكرارية",
      "/ايقاف_نيزك — إيقاف النيزك",
      "/برق • /برق_صامت — سبام سريع",
      "/ايقاف_البرق — إيقاف البرق",
      "/رعد — رسالة مجدولة ثابتة",
      "/تشغيل_المحرك — أداء أقصى",
      "/ايقاف_المحرك — وضع طبيعي",
      "/معلومات_المجموعة — إحصاءات",
    ],
    hint: "✨ Kaneki Bot — نظام متكامل ✨",
  },
};

// ====== بناء SVG لإطار واحد ======
function frameSvg(pageNum, f) {
  const p = PAGES[pageNum];
  const pulse  = 0.5 + 0.5 * Math.sin((f / FRAMES) * Math.PI * 2);
  const scanY  = (f * 21) % H;
  const glow   = (0.25 + 0.3 * pulse).toFixed(3);
  const border = (0.55 + 0.45 * pulse).toFixed(3);
  const pOff   = f * 4;

  // جسيمات
  let dots = "";
  for (let i = 0; i < 22; i++) {
    const dx = ((i * 131 + pOff * (i % 2 ? 1 : -1)) % W + W) % W;
    const dy = ((i * 79  + pOff * (i % 3 ? 1 : -1)) % H + H) % H;
    const r  = 1 + (i % 3);
    const op = (0.15 + 0.25 * ((i + f) % 4) / 4).toFixed(2);
    dots += `<circle cx="${dx}" cy="${dy}" r="${r}" fill="${p.accent}" opacity="${op}"/>`;
  }

  // خطوط شبكة
  let grid = "";
  for (let x = 0; x < W; x += 45)
    grid += `<line x1="${x}" y1="0" x2="${x}" y2="${H}" stroke="${p.c1}" stroke-width="0.4" opacity="0.07"/>`;
  for (let y = 0; y < H; y += 45)
    grid += `<line x1="0" y1="${y}" x2="${W}" y2="${y}" stroke="${p.c1}" stroke-width="0.4" opacity="0.07"/>`;

  // سطور الأوامر
  const cmdLines = p.cmds.map((cmd, i) => {
    const cy = 182 + i * 22;
    if (cy > H - 42) return "";
    const fill = i % 2 === 0 ? "#FFFFFF" : p.accent;
    return `<text x="${W / 2}" y="${cy}" text-anchor="middle"
      font-family="Arial,Tahoma,sans-serif" font-size="13" fill="${fill}" opacity="0.92"
      style="direction:rtl;unicode-bidi:bidi-override">◈ ${cmd}</text>`;
  }).join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
<defs>
  <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%"  stop-color="#04040F"/>
    <stop offset="55%" stop-color="${p.c2}" stop-opacity="0.4"/>
    <stop offset="100%" stop-color="#04040F"/>
  </linearGradient>
  <linearGradient id="hdr" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0%"   stop-color="${p.c2}" stop-opacity="0.95"/>
    <stop offset="50%"  stop-color="${p.c1}" stop-opacity="0.95"/>
    <stop offset="100%" stop-color="${p.c2}" stop-opacity="0.95"/>
  </linearGradient>
  <filter id="gl"><feGaussianBlur stdDeviation="3" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
</defs>

<!-- خلفية -->
<rect width="${W}" height="${H}" fill="url(#bg)"/>
${grid}
${dots}

<!-- خط مسح -->
<rect x="0" y="${scanY}" width="${W}" height="2" fill="${p.accent}" opacity="0.05"/>

<!-- إطار خارجي -->
<rect x="3" y="3" width="${W-6}" height="${H-6}" rx="10" fill="none"
  stroke="${p.c1}" stroke-width="1.8" opacity="${border}"/>
<rect x="7" y="7" width="${W-14}" height="${H-14}" rx="8" fill="none"
  stroke="${p.accent}" stroke-width="0.6" opacity="${glow}"/>

<!-- هيدر -->
<rect x="3" y="3" width="${W-6}" height="60" rx="10" fill="url(#hdr)"/>
<rect x="3" y="50" width="${W-6}" height="13" fill="url(#hdr)"/>

<!-- العنوان -->
<text x="${W/2}" y="30" text-anchor="middle"
  font-family="Arial,Tahoma,sans-serif" font-size="17" font-weight="bold"
  fill="#FFFFFF" filter="url(#gl)"
  style="direction:rtl">✦ ${p.title} ✦</text>
<text x="${W/2}" y="52" text-anchor="middle"
  font-family="Arial,Tahoma,sans-serif" font-size="11.5" fill="${p.accent}"
  style="direction:rtl">── ${p.subtitle} ──</text>

<!-- فاصل -->
<line x1="18" y1="69" x2="${W-18}" y2="69" stroke="${p.c1}" stroke-width="1" opacity="0.6"/>

<!-- رأس القائمة -->
<text x="${W/2}" y="92" text-anchor="middle"
  font-family="Arial,Tahoma,sans-serif" font-size="12.5" fill="${p.accent}" font-weight="bold"
  style="direction:rtl">╔══[ الأوامر المتاحة ]══╗</text>

<!-- الأوامر -->
${cmdLines}

<!-- تذييل -->
<rect x="3" y="${H-36}" width="${W-6}" height="33" fill="${p.c2}" opacity="0.72"/>
<rect x="3" y="${H-36}" width="${W-6}" height="2" fill="${p.c1}" opacity="0.8"/>
<text x="${W/2}" y="${H-13}" text-anchor="middle"
  font-family="Arial,Tahoma,sans-serif" font-size="11.5" fill="${p.accent}"
  style="direction:rtl">${p.hint}</text>

<!-- نبضة مركزية -->
<circle cx="${W/2}" cy="${H/2}" r="${70 + 18*pulse}"
  fill="none" stroke="${p.c1}" stroke-width="0.5" opacity="${(0.025+0.025*pulse).toFixed(3)}"/>
</svg>`;
}

// ====== توليد GIF لصفحة ======
async function generatePageGif(pageNum) {
  const outPath = path.join(OUTPUT_DIR, `_menu_${pageNum}.gif`);

  const encoder = new GifEncoder(W, H, "neuquant", true);
  encoder.setDelay(DELAY);
  encoder.setRepeat(0);
  encoder.setQuality(12);
  encoder.start();

  for (let f = 0; f < FRAMES; f++) {
    const svg = frameSvg(pageNum, f);
    const raw = await sharp(Buffer.from(svg))
      .resize(W, H, { fit: "fill" })
      .ensureAlpha()
      .raw()
      .toBuffer();

    // RGBA → RGB (gif-encoder-2 needs RGBA Uint8ClampedArray)
    const rgba = new Uint8ClampedArray(W * H * 4);
    raw.copy(Buffer.from(rgba.buffer));
    encoder.addFrame(rgba);
  }

  encoder.finish();
  const gifBuf = encoder.out.getData();
  fs.writeFileSync(outPath, gifBuf);

  const kb = (gifBuf.length / 1024).toFixed(1);
  console.log(`✅ GIF ${pageNum}: ${outPath} (${kb} KB)`);
  return outPath;
}

// ====== توليد جميع الصفحات ======
async function generateAllMenuGifs(force = false) {
  const results = {};
  for (const pg of [1, 2, 3, 4]) {
    const outPath = path.join(OUTPUT_DIR, `_menu_${pg}.gif`);
    if (!force && fs.existsSync(outPath) && fs.statSync(outPath).size > 30000) {
      results[pg] = outPath;
      continue;
    }
    try {
      results[pg] = await generatePageGif(pg);
    } catch (e) {
      console.error(`❌ صفحة ${pg}: ${e.message}`);
      results[pg] = null;
    }
  }
  return results;
}

module.exports = { generateAllMenuGifs, generatePageGif, PAGES };

if (require.main === module) {
  generateAllMenuGifs(true).then(r => console.log("اكتمل:", r)).catch(console.error);
}
