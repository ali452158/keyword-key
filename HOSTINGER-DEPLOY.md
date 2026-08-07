# 🚀 دليل رفع موقع Keyword Key على Hostinger VPS

هذا الدليل يشرح خطوة بخطوة كيفية رفع الموقع على Hostinger باستخدام VPS hosting.

> **لماذا VPS؟** تطبيقات Next.js تحتاج Node.js server يعمل باستمرار. Hostinger VPS يعطيك تحكماً كاملاً لتشغيل أي تطبيق.

---

## 📋 المتطلبات

| العنصر | التفاصيل |
|--------|----------|
| **خطة Hostinger** | VPS Plan 1 (KVM 1) على الأقل — 4GB RAM |
| **نظام التشغيل** | Ubuntu 22.04 LTS (مُوصى به) |
| **الدومين** | أي دومين (اختياري للبداية، يمكن استخدام IP مؤقتاً) |
| **SSH Access** | ستحتاج للاتصال بالـ VPS عبر SSH |

---

## 🎯 الخطة باختصار

```
GitHub (الكود) → VPS Hostinger → Nginx (Reverse Proxy) → Next.js (PM2)
                       ↓
                 PostgreSQL (نفس السيرفر)
                       ↓
              http://your-server-ip  أو  https://your-domain.com
```

---

## الخطوة 1️⃣: شراء VPS من Hostinger

### 1.1 اختيار الخطة

1. اذهب إلى [hostinger.com/vps-hosting](https://www.hostinger.com/vps-hosting)
2. اختر الخطة:
   - **KVM 1** (الأرخص — يكفي للموقع): ~$4.99/شهر
   - **KVM 2** (أفضل للمستقبل): ~$6.99/شهر
3. اختر مدة الاشتراك (شهر، سنة، إلخ)
4. أكمل الدفع

### 1.2 إعداد VPS

1. من لوحة تحكم Hostinger → **VPS** → اختر السيرفر
2. في صفحة الإعداد، اختر:
   - **Operating System**: Ubuntu 22.04 LTS 64bit
   - **Region**: اختر الأقرب لجمهورك
3. انتظر 5-10 دقائق حتى يكتمل الإعداد
4. ستحصل على:
   - **IP Address**: مثل `82.xxx.xxx.xxx`
   - **Root Password**: (حدّدها أثناء الإعداد)
   - **SSH Port**: 22 (افتراضي)

---

## الخطوة 2️⃣: الاتصال بالـ VPS عبر SSH

### على Windows:
1. افتح **PowerShell** أو **Command Prompt**
2. اكتب:
   ```bash
   ssh root@YOUR_SERVER_IP
   ```
3. اكتب كلمة المرور عند الطلب

### على Mac/Linux:
```bash
ssh root@YOUR_SERVER_IP
```

> ✅ عند أول اتصال، اكتب `yes` لتأكيد fingerprint.

---

## الخطوة 3️⃣: رفع ملف النشر إلى السيرفر

بعد الاتصال بالـ VPS، حمّل ملف النشر من المستودع:

```bash
# إنشاء مجلد المشروع
mkdir -p /var/www/keyword-key
cd /var/www/keyword-key

# تحميل ملف النشر من GitHub
curl -O https://raw.githubusercontent.com/ali452158/keyword-key/main/deploy-hostinger.sh

# إعطاء صلاحية التنفيذ
chmod +x deploy-hostinger.sh
```

---

## الخطوة 4️⃣: تشغيل سكربت النشر التلقائي

### 4.1 التثبيت الكامل (موصى به للبداية)

```bash
sudo ./deploy-hostinger.sh install
```

هذا يثبّت:
- ✅ Node.js 20 LTS
- ✅ Bun (لإدارة الحزم)
- ✅ PM2 (لإدارة العمليات)
- ✅ Nginx (سيرفر الويب)
- ✅ PostgreSQL (قاعدة البيانات)
- ✅ Certbot (شهادة SSL مجانية)
- ✅ UFW Firewall (جدار حماية)

### 4.2 إعداد قاعدة البيانات

```bash
sudo ./deploy-hostinger.sh database
```

سيُنشئ قاعدة بيانات PostgreSQL ويحفظ رابط الاتصال في:
`/tmp/keyword-key-db-url.txt`

**انسخ هذا الرابط** — ستحتاجه.

### 4.3 إعداد التطبيق

قبل تشغيل هذه الخطوة، عدّل المتغير `DOMAIN` في ملف النشر:

```bash
nano deploy-hostinger.sh
# ابحث عن DOMAIN="your-domain.com" وبدّله بدومينك أو اتركه مؤقتاً
# احفظ: Ctrl+X ثم Y ثم Enter
```

ثم شغّل:

```bash
sudo ./deploy-hostinger.sh setup
```

هذا يفعل:
- ✅ تحميل الكود من GitHub
- ✅ إنشاء ملف `.env` بقيم آمنة
- ✅ تثبيت الحزم
- ✅ إنشاء جداول قاعدة البيانات
- ✅ بناء التطبيق (Build)

### 4.4 تشغيل التطبيق

```bash
sudo ./deploy-hostinger.sh pm2
```

هذا يبدأ تشغيل الموقع مع PM2 (إعادة تشغيل تلقائي عند الأعطال).

### 4.5 إعداد Nginx

```bash
sudo ./deploy-hostinger.sh nginx
```

### 4.6 تثبيت شهادة SSL (اختياري — يتطلب دومين)

```bash
# أولاً: وجّه دومينك إلى IP السيرفر (DNS A Record)
# ثم:
sudo ./deploy-hostinger.sh ssl
```

---

## الخطوة 5️⃣: أوامر التشغيل الكامل دفعة واحدة

إذا أردت تشغيل كل شيء دفعة واحدة:

```bash
sudo ./deploy-hostinger.sh all
```

ثم اتبع التعليمات النهائية.

---

## الخطوة 6️⃣: ربط الدومين (اختياري)

### 6.1 إعداد DNS

من مزود الدومين (Namecheap, GoDaddy, Hostinger, إلخ):

| النوع | الاسم | القيمة |
|-------|-------|--------|
| A | `@` | `YOUR_SERVER_IP` |
| A | `www` | `YOUR_SERVER_IP` |

انتظر 30 دقيقة - ساعة حتى ينتشر الـ DNS.

### 6.2 تثبيت SSL

```bash
# عدّل DOMAIN في السكربت أولاً
nano /var/www/keyword-key/deploy-hostinger.sh
# بدّل DOMAIN="your-domain.com" بدومينك الفعلي

sudo ./deploy-hostinger.sh ssl
```

### 6.3 تحديث NEXTAUTH_URL

```bash
nano /var/www/keyword-key/.env
# بدّل NEXTAUTH_URL=https://your-domain.com
# احفظ: Ctrl+X ثم Y

# إعادة تشغيل التطبيق
pm2 restart keyword-key
```

---

## 📊 إدارة الموقع بعد النشر

### أوامر PM2 المفيدة

```bash
# حالة التطبيق
pm2 status

# سجلات الأخطاء (live)
pm2 logs keyword-key

# إعادة التشغيل
pm2 restart keyword-key

# إيقاف التطبيق
pm2 stop keyword-key

# حذف التطبيق من PM2
pm2 delete keyword-key
```

### تحديث الموقع بأحدث كود من GitHub

```bash
cd /var/www/keyword-key
sudo ./deploy-hostinger.sh deploy
```

أو يدوياً:

```bash
cd /var/www/keyword-key
git pull origin main
bun install
bunx prisma generate
bunx prisma db push --accept-data-loss
bun run build
cp -r .next/static .next/standalone/.next/
cp -r public .next/standalone/
pm2 restart keyword-key
```

### فحص حالة الخدمات

```bash
sudo ./deploy-hostinger.sh status
```

---

## 🔧 حل المشاكل الشائعة

### المشكلة: الموقع لا يفتح على المتصفح

**السبب المحتمل:** جدار الحماية يمنع المنفذ 80/443.

**الحل:**
```bash
ufw status
ufw allow 'Nginx Full'
ufw reload
```

---

### المشكلة: "502 Bad Gateway"

**السبب:** تطبيق Next.js لا يعمل على المنفذ 3000.

**الحل:**
```bash
pm2 status          # تأكد أن keyword-key يعمل
pm2 logs keyword-key # شاهد الأخطاء
pm2 restart keyword-key
```

---

### المشكلة: خطأ في الاتصال بقاعدة البيانات

**السبب:** `DATABASE_URL` غير صحيح أو PostgreSQL متوقف.

**الحل:**
```bash
# تحقق من PostgreSQL
systemctl status postgresql
systemctl start postgresql

# تحقق من DATABASE_URL
cat /var/www/keyword-key/.env

# أعد إنشاء الجداول
cd /var/www/keyword-key
bunx prisma db push --accept-data-loss
```

---

### المشكلة: البناء يفشل (Build Error)

**السبب:** نقص في الذاكرة (RAM) على VPS صغير.

**الحل:**
```bash
# إضافة swap memory (ذاكرة افتراضية)
fallocate -l 2G /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

# إعادة البناء
cd /var/www/keyword-key
bun run build
```

---

### المشكلة: شهادة SSL منتهية

**الحل:**
```bash
certbot renew
systemctl reload nginx
```

أو لإعادة التثبيت:
```bash
certbot --nginx -d your-domain.com -d www.your-domain.com
```

---

### المشكلة: "NEXTAUTH_URL" error

**السبب:** `NEXTAUTH_URL` غير مضبوط أو خاطئ.

**الحل:**
```bash
nano /var/www/keyword-key/.env
# تأكد أن NEXTAUTH_URL=https://your-domain.com (بدون / في النهاية)
pm2 restart keyword-key
```

---

## 💰 التكلفة المتوقعة

| العنصر | التكلفة |
|--------|---------|
| Hostinger VPS KVM 1 | ~$4.99/شهر (أو أقل مع العروض) |
| الدومين | ~$10-15/سنة |
| شهادة SSL | **مجاني** (Let's Encrypt) |
| PostgreSQL | **مجاني** (على نفس السيرفر) |
| **المجموع** | **~$70/سنة** |

> 💡 عروض Hostinger: غالباً ما تكون خصومات 50-80% للسنة الأولى.

---

## 📁 بنية الملفات على السيرفر

```
/var/www/keyword-key/
├── .env                    # متغيرات البيئة (سرّي)
├── .next/
│   ├── standalone/         # الخادم الجاهز للتشغيل
│   │   ├── server.js       # ملف التشغيل الرئيسي
│   │   └── .next/static/   # الملفات الثابتة
│   └── static/             # CSS, JS, الصور
├── public/                 # الصور والأصول
├── prisma/                 # schema قاعدة البيانات
├── logs/                   # سجلات PM2
├── ecosystem.config.cjs    # إعدادات PM2
├── nginx-keyword-key.conf  # إعدادات Nginx
└── deploy-hostinger.sh     # سكربت النشر
```

---

## 🔒 الأمان

### تأمين SSH (موصى به)

```bash
# تغيير منفذ SSH (اختياري)
nano /etc/ssh/sshd_config
# Port 2222  (مثلاً)
systemctl restart sshd

# منع تسجيل الدخول بـ root (بعد إنشاء مستخدم آخر)
# PermitRootLogin no
```

### نسخ احتياطي قاعدة البيانات

```bash
# نسخة احتياطية يدوية
sudo -u postgres pg_dump keywordkey > /backup/keywordkey-$(date +%F).sql

# نسخة احتياطية تلقائية (cron)
crontab -e
# أضف: 0 3 * * * sudo -u postgres pg_dump keywordkey > /backup/keywordkey-$(date +\%F).sql
```

---

## ✅ قائمة التحقق النهائية

قبل اعتبار الموقع جاهزاً، تأكد من:

- [ ] VPS يعمل ويمكن الوصول إليه عبر SSH
- [ ] Node.js, Bun, PM2, Nginx, PostgreSQL مثبتة
- [ ] الكود منسوخ من GitHub إلى `/var/www/keyword-key/`
- [ ] ملف `.env` موجود ومحتوي على `DATABASE_URL`, `NEXTAUTH_URL`, `NEXTAUTH_SECRET`
- [ ] قاعدة البيانات منشأة (`prisma db push`)
- [ ] التطبيق مبني (`bun run build`)
- [ ] PM2 يشغل التطبيق (`pm2 status`)
- [ ] Nginx مُعد ويعمل
- [ ] جدار الحماية يسمح بالمنافذ 80 و 443
- [ ] (اختياري) الدومين مربوط بالـ DNS
- [ ] (اختياري) شهادة SSL مثبتة
- [ ] الموقع يفتح على `https://your-domain.com`

---

## 📞 روابط مهمة

| الخدمة | الرابط |
|--------|--------|
| Hostinger VPS | [hostinger.com/vps-hosting](https://www.hostinger.com/vps-hosting) |
| لوحة تحكم Hostinger | [hpanel.hostinger.com](https://hpanel.hostinger.com) |
| مستودع GitHub | [github.com/ali452158/keyword-key](https://github.com/ali452158/keyword-key) |
| فحص DNS | [dnschecker.org](https://dnschecker.org) |

---

## 🎯 ملخص سريع

```bash
# 1. اتصل بالـ VPS
ssh root@YOUR_SERVER_IP

# 2. حمّل سكربت النشر
mkdir -p /var/www/keyword-key && cd /var/www/keyword-key
curl -O https://raw.githubusercontent.com/ali452158/keyword-key/main/deploy-hostinger.sh
chmod +x deploy-hostinger.sh

# 3. عدّل DOMAIN (إذا عندك دومين)
nano deploy-hostinger.sh

# 4. شغّل النشر الكامل
sudo ./deploy-hostinger.sh all

# 5. (اختياري) ثبّت SSL
sudo ./deploy-hostinger.sh ssl

# ✅ الموقع جاهز على http://YOUR_SERVER_IP
```

---

> صُنع بـ ❤️ بواسطة **ali tredr**
