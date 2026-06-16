# Kaneki Bot → APK (Android App)

## الفكرة
البوت يشتغل على السيرفر (Railway / Replit).
الـ APK هو **تطبيق أندرويد للوحة التحكم** — يتصل بالبوت عن بُعد.

---

## الخطوات الكاملة لبناء APK

### 1. تثبيت المتطلبات (مرة واحدة)

```bash
# تثبيت Node.js + Java JDK 17
# ثم:
npm install -g @capacitor/cli
npm install @capacitor/core @capacitor/android
```

### 2. بناء الـ dashboard كـ Web App

```bash
cd artifacts/bot-dashboard

# عدّل vite.config.ts مؤقتاً — base: "./"
npm run build
# المخرجات في: artifacts/bot-dashboard/dist
```

### 3. إضافة Capacitor

```bash
cd artifacts/bot-dashboard

# نسخ capacitor.config.json من apk-setup/
cp ../apk-setup/capacitor.config.json .

npx cap init "Kaneki Bot" "com.kaneki.bot.dashboard"
npx cap add android
npx cap copy android
npx cap sync android
```

### 4. فتح Android Studio وبناء APK

```bash
npx cap open android
```

في Android Studio:
- **Build → Build Bundle(s) / APK(s) → Build APK(s)**
- أو من CLI: `cd android && ./gradlew assembleDebug`
- الملف: `android/app/build/outputs/apk/debug/app-debug.apk`

### 5. للنسخة الرسمية (Release APK)

```bash
# إنشاء keystore
keytool -genkey -v -keystore release.keystore -alias kaneki \
  -keyalg RSA -keysize 2048 -validity 10000

# بناء
cd android
./gradlew assembleRelease
```

---

## نقاط مهمة

| العنصر | القيمة |
|--------|--------|
| App ID | `com.kaneki.bot.dashboard` |
| اسم التطبيق | Kaneki Bot |
| اللون الرئيسي | `#1d6af5` (Electric Blue) |
| السيرفر | Railway / Replit URL |

## تغيير عنوان السيرفر في التطبيق

في `artifacts/bot-dashboard/src/` غيّر `BASE_URL` ليشير لعنوان Railway:

```typescript
// بدل import.meta.env.BASE_URL
const BASE = "https://kaneki-bot.up.railway.app";
```

---

## هيكل الملفات بعد npx cap add android

```
artifacts/bot-dashboard/
├── android/                    ← مجلد Android (يُنشأ تلقائياً)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml
│   │   │   └── res/           ← أيقونات وألوان
│   └── gradle/
├── capacitor.config.json
└── dist/                       ← ملفات الـ web المبنية
```
