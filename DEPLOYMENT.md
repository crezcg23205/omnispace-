# 🚀 OmniSpace — 100% Bepul Serverga Deploy Qilish Bo'yicha Qo'llanma

Ushbu qo'llanma orqali OmniSpace dasturini va uning Telegram botini 100% bepul serverga bir necha daqiqada joylashtirishingiz mumkin.

---

## 🌟 Variant 1: Vercel + Neon.tech (Eng tavsiya etiladigan, 100% bepul va eng tezkor)

Next.js yaratuvchilari (Vercel) tomonidan taqdim etiladigan eng yaxshi hosting. Cheksiz bepul SSL, tezkor CDN va domen beradi.

### 1-qadam: Bepul Cloud Baza yaratish (Neon.tech)
1. [https://neon.tech](https://neon.tech) saytiga kiring va bepul ro'yxatdan o'ting.
2. Yangi loyiha oching (masalan, `omnispace`).
3. Sizga berilgan `DATABASE_URL` (Postgres ulanish satri)ni nusxalab oling.
   *(Misol: `postgresql://user:password@ep-cool-fog-12345.eu-central-1.aws.neon.tech/neondb?sslmode=require`)*

### 2-qadam: Loyihani GitHub'ga yuklash
Terminalda (loyiha papkasida):
```bash
git init
git add .
git commit -m "Deploy OmniSpace production"
git branch -M main
git remote add origin https://github.com/SIZNING_PROFIL/omnispace.git
git push -u origin main
```

### 3-qadam: Vercel'ga yuklash
1. [https://vercel.com](https://vercel.com) saytiga kiring va GitHub profilingiz orqali kiring.
2. **"Add New" ➔ "Project"** tugmasini bosing va `omnispace` repozitoriysini tanlang.
3. **Environment Variables** (Muhit o'zgaruvchilari) bo'limiga quyidagilarni kiriting:
   - `DATABASE_URL` = `Neon.tech'dagi postgresql://... ulanish satri`
   - `JWT_SECRET` = `omnispace-super-secret-key-32chars-long-secure-random`
   - `GEMINI_API_KEY` = `your_gemini_api_key_here`
   - `TELEGRAM_BOT_TOKEN` = `8933811768:AAHUEgMkVwrNaN-Ucy3xm5BuKE-zFdhCjoo`
   - `TELEGRAM_ADMIN_CHAT_ID` = `5725671264`
   - `NEXT_PUBLIC_APP_URL` = `https://sizning-domen.vercel.app`
4. **"Deploy"** tugmasini bosing. 2 daqiqada sayt jonli ishga tushadi!

### 4-qadam: Telegram Bot Webhook'ini ulash (1 ta bosish)
Vercel sizga bepul domen bergach (masalan: `https://omnispace.vercel.app`), brauzeringizda quyidagi manzilni oching:
```text
https://api.telegram.org/bot8933811768:AAHUEgMkVwrNaN-Ucy3xm5BuKE-zFdhCjoo/setWebhook?url=https://omnispace.vercel.app/api/telegram/webhook
```
Natija: `{"ok":true,"result":true,"description":"Webhook was set"}`.
Shu bilan bot 24/7 rejimida hech qanday kompyuter yoki qo'shimcha serverlarsiz avtomatik ishlaydi!

---

## 🛠 Variant 2: Render.com (Hozirgi SQLite bazasi bilan, 100% Bepul)

Agar bazani o'zgartirmasdan, hozirgi SQLite fayli bilan birga joylashtirmoqchi bo'lsangiz:

1. [https://render.com](https://render.com) saytiga kiring (bepul).
2. **"New +" ➔ "Web Service"** tanlang va GitHub repozitoriyangizni bog'lang.
3. Sozlamalar:
   - **Environment:** `Node`
   - **Build Command:** `npm run build && npx prisma db push`
   - **Start Command:** `npm start`
4. **Environment Variables:**
   - `DATABASE_URL` = `file:./dev.db`
   - `JWT_SECRET` = `omnispace-super-secret-key-32chars-long-secure-random`
   - `GEMINI_API_KEY` = `your_gemini_api_key_here`
   - `TELEGRAM_BOT_TOKEN` = `8933811768:AAHUEgMkVwrNaN-Ucy3xm5BuKE-zFdhCjoo`
   - `TELEGRAM_ADMIN_CHAT_ID` = `5725671264`
5. **"Deploy Web Service"** tugmasini bosing. Render sizga `https://omnispace.onrender.com` manzilini beradi.
6. Webhook ulash:
```text
https://api.telegram.org/bot8933811768:AAHUEgMkVwrNaN-Ucy3xm5BuKE-zFdhCjoo/setWebhook?url=https://omnispace.onrender.com/api/telegram/webhook
```

---

## 🔒 Xavfsizlik bo'yicha eslatma:
- `.env` faylini hech qachon ochiq GitHub repozitoriyasiga yuklamang (`.gitignore` da himoyalangan).
- Barcha maxfiy kalitlar faqat hosting provayderining (Vercel yoki Render) **Environment Variables** bo'limida saqlanishi kerak.
