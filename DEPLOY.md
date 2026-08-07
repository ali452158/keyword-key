# 🚀 دليل رفع موقع Keyword Key على استضافة مجانية

هذا الدليل يشرح خطوة بخطوة كيفية رفع الموقع على الإنترنت مجاناً باستخدام:

| الخدمة | الاستخدام | السعر |
|--------|-----------|-------|
| **GitHub** | استضافة الكود | مجاني للأبد |
| **Vercel** | استضافة الموقع (Hosting) | مجاني للأبد |
| **Neon** | قاعدة بيانات PostgreSQL | مجاني (0.5 GB) |

النتيجة: موقعك سيعمل على رابط مثل `https://keyword-key.vercel.app` 🎉

---

## 📋 المتطلبات قبل البدء

- حساب **GitHub** (إن لم يكن لديك، أنشئ واحداً من [github.com](https://github.com))
- المتصفح فقط — لا حاجة لتثبيت أي برامج

---

## الخطوة 1️⃣: رفع الكود على GitHub

### 1.1 إنشاء مستودع جديد على GitHub

1. اذهب إلى [github.com/new](https://github.com/new)
2. اسم المستودع: `keyword-key`
3. اختر **Private** (خاص) أو **Public** (عام)
4. **لا** تختر "Add a README file"
5. اضغط **Create repository**

### 1.2 رفع الكود من المشروع

في terminal / command prompt داخل مجلد المشروع، نفّذ:

```bash
# إضافة جميع الملفات
git add -A

# حفظ التغييرات
git commit -m "Prepare for Vercel deployment: PostgreSQL + AI fallback"

# ربط المستودع (بدّل USERNAME باسم حسابك على GitHub)
git remote add origin https://github.com/USERNAME/keyword-key.git

# رفع الكود
git branch -M main
git push -u origin main
```

> ✅ بعد هذه الخطوة، الكود سيكون على GitHub.

---

## الخطوة 2️⃣: إنشاء قاعدة بيانات PostgreSQL مجانية على Neon

Neon تقدم قاعدة بيانات PostgreSQL سحابية مجانية (0.5 GB) تعمل بشكل مثالي مع Vercel.

### 2.1 إنشاء حساب

1. اذهب إلى [neon.tech](https://neon.tech)
2. اضغط **Sign Up** وسجّل بحساب GitHub أو البريد
3. أنشئ مشروع جديد:
   - **Project name**: `keyword-key`
   - **Database name**: `keywordkey`
   - **Region**: اختر الأقرب (مثلاً `EU West` أو `US East`)

### 2.2 نسخ رابط الاتصال

1. بعد إنشاء المشروع، اذهب إلى **Dashboard**
2. ستجد **Connection String** بهذا الشكل:
   ```
   postgresql://keywordkey:AbCdEf123456@ep-xxx-xxx.us-east-2.aws.neon.tech/keywordkey?sslmode=require
   ```
3. **انسخ هذا الرابط** — ستحتاجه في الخطوة التالية

> ⚠️ احتفظ بهذا الرابط سرّياً — هو بمثابة مفتاح قاعدة البيانات.

---

## الخطوة 3️⃣: إنشاء حساب Vercel ورفع الموقع

### 3.1 التسجيل في Vercel

1. اذهب إلى [vercel.com](https://vercel.com)
2. اضغط **Sign Up**
3. اختر **Continue with GitHub** (أسهل خيار)
4. اسمح لـ Vercel بالوصول إلى حساب GitHub

### 3.2 استيراد المشروع

1. في لوحة تحكم Vercel، اضغط **Add New...** → **Project**
2. ستجد مستودع `keyword-key` في القائمة — اضغط **Import**
3. في صفحة الإعدادات:
   - **Framework Preset**: Next.js (سيُكتشف تلقائياً)
   - **Build Command**: `next build` (افتراضي)
   - **Install Command**: `bun install` (افتراضي)

### 3.3 إضافة متغيرات البيئة (Environment Variables)

**مهم جداً:** قبل الضغط على Deploy، أضف المتغيرات التالية:

اضغط على **Environment Variables** وأضف:

| الاسم (Key) | القيمة (Value) |
|-------------|----------------|
| `DATABASE_URL` | (الرابط الذي نسخته من Neon في الخطوة 2.2) |
| `NEXTAUTH_SECRET` | (انظر الخطوة 3.4 لتوليده) |
| `NEXTAUTH_URL` | (اتركه فارغاً الآن، سنعود إليه بعد الرفع) |

> ⚠️ تأكد من ضبط **DATABASE_URL** بشكل صحيح — بدون مسافات في البداية أو النهاية.

### 3.4 توليد NEXTAUTH_SECRET

افتح terminal على جهازك أو استخدم أي أداة online، ونفّذ:

```bash
openssl rand -base64 32
```

انسخ الناتج (مثل `gcoRyRsn+42j2LvwDYQsrophdAI0FMjASzeDcV9mwnI=`) وضعه في `NEXTAUTH_SECRET`.

أو استخدم [generate-secret.vercel.app](https://generate-secret.vercel.app) لتوليده أونلاين.

### 3.5 الرفع (Deploy)

1. اضغط **Deploy** 🚀
2. انتظر 2-4 دقائق حتى يكتمل البناء (Build)
3. عند الانتهاء ستحصل على رابط مثل:
   ```
   https://keyword-key-abc123.vercel.app
   ```

> ✅ الموقع أصبح أونلاين! لكن نحتاج خطوة أخيرة.

---

## الخطوة 4️⃣: تحديث NEXTAUTH_URL وإعداد قاعدة البيانات

### 4.1 تحديث NEXTAUTH_URL

1. اذهب إلى لوحة تحكم Vercel → مشروعك → **Settings** → **Environment Variables**
2. عدّل `NEXTAUTH_URL` وضعه على رابط موقعك:
   ```
   https://keyword-key-abc123.vercel.app
   ```
   (بدّل الرابط برابط موقعك الفعلي)
3. اضغط **Save**

### 4.2 إنشاء جداول قاعدة البيانات

قاعدة البيانات على Neon فارغة الآن — نحتاج لإنشاء جداول المستخدمين.

**الطريقة الأسهل — عبر Vercel:**

1. في لوحة تحكم Vercel → مشروعك → **Storage** (أو **Logs** → **Terminal**)
2. أو استخدم Vercel CLI:
   ```bash
   npm i -g vercel
   vercel login
   vercel link  # اربط المشروع المحلي بـ Vercel
   vercel env pull .env.production.local  # نزّل متغيرات البيئة
   npx prisma db push  # أنشئ الجداول
   ```

**طريقة بديلة — من جهازك المحلي:**

```bash
# 1. نزّل المشروع من GitHub
git clone https://github.com/USERNAME/keyword-key.git
cd keyword-key

# 2. ثبّت الحزم
bun install

# 3. أنشئ ملف .env محلياً وضعه فيه DATABASE_URL من Neon
# (نفس الرابط الذي وضعته في Vercel)

# 4. أنشئ الجداول
bun run db:push
```

### 4.3 إعادة النشر (Redeploy)

1. اذهب إلى Vercel → **Deployments**
2. اضغط على آخر deployment → **⋮** → **Redeploy**
3. هذا يطبّق تغيير `NEXTAUTH_URL` الجديد

---

## الخطوة 5️⃣: اختبار الموقع ✅

1. افتح رابط موقعك: `https://keyword-key-abc123.vercel.app`
2. تأكد من:
   - ✅ الصفحة الرئيسية تفتح وتعرض لوحة التحكم
   - ✅ الترندات والكلمات المفتاحية تظهر
   - ✅ عند الضغط على خدمة، يظهر سجل الدخول
   - ✅ إنشاء حساب جديد يعمل
   - ✅ تسجيل الدخول يعمل

---

## 🧠 ملاحظات حول ميزات الذكاء الاصطناعي

الموقع يستخدم `z-ai-web-dev-sdk` لتوليد المحتوى وتحليل المنافسين. هذا الـ SDK يعمل في بيئة التطوير لكن **يتطلب إعداداً إضافياً** على الاستضافة الخارجية.

### ماذا يحدث على Vercel؟

- ✅ **الموقع يعمل بالكامل** — جميع الصفحات والميزات
- ✅ **التسجيل وتسجيل الدخول يعملان** — قاعدة البيانات على Neon
- ⚠️ **ميزات الذكاء الاصطناعي تستخدم بيانات تجريبية (Mock Data)** بدلاً من توليد حقيقي
  - توليد أفكار المحتوى
  - تحليل المنافسين
  - توليد الهاشتاجات
  - تحليل العناوين
  - توليد السكربتات

### هل تريد تفعيل الذكاء الاصطناعي الحقيقي؟

إذا كان لديك مفتاح API من Z.AI:
1. أنشئ ملف `.z-ai-config` في جذر المشروع:
   ```json
   {
     "baseUrl": "https://api.z.ai/api/v1",
     "apiKey": "YOUR_API_KEY"
   }
   ```
2. أضفه كـ **Secret File** في Vercel:
   - Settings → **Files** → Upload `.z-ai-config`
   - أو استخدم Vercel CLI: `vercel env add` (للملفات)

> 💡 بدون هذا الملف، الموقع يعمل بشكل كامل ولكن ميزات AI تستخدم بيانات تجريبية واقعية.

---

## 🔧 حل المشاكل الشائعة

### المشكلة: "Database connection error"

**السبب:** `DATABASE_URL` غير صحيح أو Neon نائم (Sleep mode).

**الحل:**
1. تأكد من نسخ رابط Neon كاملاً بدون مسافات
2. Neon Free tier ينام بعد 5 دقائق من عدم النشاط — الطلب الأول قد يستغرق 3-5 ثوانٍ لإيقاظه
3. تأكد أن الرابط يحتوي على `?sslmode=require` في النهاية

---

### المشكلة: "NEXTAUTH_URL" error

**السبب:** `NEXTAUTH_URL` غير مضبوط أو خاطئ.

**الحل:**
1. في Vercel → Settings → Environment Variables
2. `NEXTAUTH_URL` = رابط موقعك الكامل (مثلاً `https://keyword-key.vercel.app`)
3. Redeploy

---

### المشكلة: البناء يفشل (Build Error)

**السبب المحتمل:** مشكلة في `prisma generate`.

**الحل:**
- تأكد أن `postinstall` script موجود في `package.json`:
  ```json
  "postinstall": "prisma generate"
  ```
- هذا يولّد Prisma Client تلقائياً أثناء البناء

---

### المشكلة: "Application error" بعد الرفع

**الحل:**
1. اذهب إلى Vercel → **Logs** لرؤية الخطأ
2. تحقق من متغيرات البيئة
3. تأكد أن قاعدة البيانات منشأة (`prisma db push`)

---

## 📞 روابط مهمة

| الخدمة | الرابط |
|--------|--------|
| GitHub | [github.com](https://github.com) |
| Vercel | [vercel.com](https://vercel.com) |
| Neon (Database) | [neon.tech](https://neon.tech) |
| توليد NEXTAUTH_SECRET | [generate-secret.vercel.app](https://generate-secret.vercel.app) |

---

## 🎯 ملخص سريع (Quick Summary)

```
GitHub (الكود) → Vercel (الاستضافة) → Neon (قاعدة البيانات)
                              ↓
                    https://keyword-key.vercel.app
```

1. ارفع الكود على GitHub
2. أنشئ قاعدة بيانات على Neon وانسخ الـ Connection String
3. اربط Vercel بمستودع GitHub
4. أضف متغيرات البيئة: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`
5. Deploy!
6. حدّث `NEXTAUTH_URL` برابط الموقع
7. شغّل `prisma db push` لإنشاء الجداول
8. الموقع جاهز! 🎉

---

> صُنع بـ ❤️ بواسطة **ali tredr**
