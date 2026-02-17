# منصة حقوقي - Hoqouqi Legal Platform

## نظرة عامة على المشروع / Project Overview
- **الاسم**: حقوقي (Hoqouqi)
- **الهدف**: البوابة القانونية الأولى في مصر - منصة تربط العملاء بأفضل المحامين المتخصصين
- **الشعار**: "الحق يوصل لصاحبه"

## روابط المشروع / URLs
- **Development (Sandbox)**: https://3000-iawpypk988wtz034ct1bp-82b888ba.sandbox.novita.ai
- **Production**: (يتطلب إعداد Cloudflare API Key)

## الميزات المكتملة / Completed Features

### ✅ الواجهة الأمامية (Frontend)
1. **الصفحة الرئيسية** - صفحة هبوط احترافية مع:
   - شريط بحث ذكي للمحامين
   - إحصائيات المنصة
   - قسم "كيف يعمل حقوقي"
   - عرض المحامين المميزين
   - التخصصات القانونية

2. **صفحة البحث** - بحث متقدم مع فلاتر:
   - التخصص (جنائي، مدني، أحوال شخصية، تجاري، إداري، عمالي)
   - المحافظة
   - درجة القيد

3. **صفحة ملف المحامي** - ملف تفصيلي يشمل:
   - المعلومات الشخصية والمهنية
   - الإحصائيات والتقييمات
   - التخصصات
   - الأتعاب

4. **صفحات التسجيل والدخول**
5. **صفحة من نحن**

### ✅ لوحة تحكم العميل (Client Dashboard)
- **الرئيسية**: إحصائيات القضايا، الرسائل، المدفوعات
- **قضاياي**: عرض وإدارة القضايا
- **قضية جديدة**: إنشاء قضية مع اختيار محامي
- **الرسائل**: نظام مراسلة مع المحامين
- **تفاصيل القضية**: الخط الزمني، المستندات، المدفوعات

### ✅ لوحة تحكم المحامي (Lawyer Dashboard)
- **الرئيسية**: إحصائيات شاملة (قضايا نشطة، طلبات جديدة، أرباح، تقييم)
- **القضايا**: إدارة القضايا النشطة والمكتملة
- **الطلبات الجديدة**: قبول/رفض طلبات القضايا
- **الرسائل**: التواصل مع العملاء
- **الأرباح**: تتبع الأرباح والمعاملات
- **التقييمات**: عرض التقييمات والرد عليها
- **الملف الشخصي**: إدارة بيانات المحامي

### ✅ الواجهة الخلفية (Backend API)
- **API المحامين**: CRUD، بحث، مطابقة ذكية
- **API القضايا**: إنشاء، تتبع، تحديث، قبول/رفض، إتمام
- **API الرسائل**: إرسال واستقبال الرسائل
- **API التقييمات**: إضافة، عرض، الرد
- **API المدفوعات**: معالجة، Escrow، أرباح
- **API المحتوى**: المقالات والمنتدى

### ✅ قاعدة البيانات (Database)
- **16 جدول** تشمل:
  - users, clients, lawyers
  - cases, case_timeline, documents
  - reviews, payments, messages
  - consultations, notifications
  - lawyer_specializations, lawyer_certificates
  - articles, forum_questions, forum_answers
  - company_subscriptions

- **بيانات تجريبية**:
  - 6 محامين معتمدين
  - 3 عملاء
  - 3 قضايا نموذجية
  - تقييمات

## المسارات (API Endpoints)

### المحامون
- `GET /api/lawyers` - قائمة المحامين
- `GET /api/lawyers/:id` - ملف محامي
- `POST /api/lawyers/match` - مطابقة ذكية

### القضايا
- `GET /api/cases` - قائمة القضايا
- `POST /api/cases` - إنشاء قضية
- `GET /api/cases/:id` - تفاصيل قضية
- `POST /api/cases/:id/accept` - قبول قضية
- `POST /api/cases/:id/reject` - رفض قضية
- `POST /api/cases/:id/complete` - إتمام قضية
- `POST /api/cases/:id/timeline` - إضافة تحديث

### الرسائل
- `GET /api/messages?case_id=X` - رسائل قضية
- `POST /api/messages` - إرسال رسالة

### المدفوعات
- `POST /api/payments` - إنشاء دفعة
- `GET /api/payments/lawyer/:id/earnings` - أرباح المحامي

### المستخدمين
- `POST /api/users/register` - تسجيل
- `POST /api/users/login` - دخول
- `GET /api/users/clients/:id/dashboard` - لوحة تحكم العميل
- `GET /api/users/lawyers/:id/dashboard` - لوحة تحكم المحامي

## هيكل المشروع / Project Structure
```
webapp/
├── src/
│   ├── index.tsx              # نقطة الدخول الرئيسية
│   ├── routes/
│   │   ├── lawyers.ts         # API المحامين
│   │   ├── cases.ts           # API القضايا
│   │   ├── reviews.ts         # API التقييمات
│   │   ├── payments.ts        # API المدفوعات
│   │   ├── users.ts           # API المستخدمين
│   │   ├── content.ts         # API المحتوى
│   │   ├── clientPages.ts     # صفحات العميل
│   │   └── lawyerPages.ts     # صفحات المحامي
│   ├── components/
│   │   └── shared.ts          # المكونات المشتركة
│   └── lib/
│       ├── db.ts              # أدوات قاعدة البيانات
│       └── types.ts           # الأنواع والثوابت
├── migrations/
│   ├── 0001_initial_schema.sql
│   └── 0002_seed_data.sql
├── dist/                      # ملفات البناء
├── wrangler.jsonc             # إعدادات Cloudflare
├── package.json
└── ecosystem.config.cjs       # إعدادات PM2
```

## التقنيات المستخدمة / Tech Stack
- **Backend**: Hono Framework
- **Frontend**: HTML + TailwindCSS + Vanilla JS
- **Database**: Cloudflare D1 (SQLite)
- **Hosting**: Cloudflare Pages/Workers
- **Icons**: Font Awesome
- **Font**: Cairo (Arabic)

## التشغيل المحلي / Local Development
```bash
# تثبيت المتطلبات
npm install

# تطبيق migrations
npm run db:migrate:local

# بناء المشروع
npm run build

# تشغيل السيرفر
pm2 start ecosystem.config.cjs
```

## النشر على Cloudflare / Deployment
```bash
# (يتطلب إعداد CLOUDFLARE_API_TOKEN)
npm run build
npx wrangler pages deploy dist --project-name hoqouqi
```

## ما يلزم تنفيذها لاحقاً / Future Features

### أولوية عالية
- [ ] تكامل بوابة الدفع (PayMob/Fawry)
- [ ] نظام الإشعارات الفورية (Push Notifications)
- [ ] حجز استشارة مع اختيار موعد

### أولوية متوسطة
- [ ] حاسبة المواريث الذكية
- [ ] محرك توقع نتائج القضايا (AI)
- [ ] نظام AI Copilot للمحامين
- [ ] مكتبة القوانين المصرية
- [ ] مولد المستندات القانونية

### أولوية منخفضة
- [ ] تطبيق الموبايل (React Native)
- [ ] باقات B2B للشركات
- [ ] لوحة Admin للإدارة
- [ ] نظام التقارير المتقدم

## المطور / Developer
تم تطوير هذا المشروع كمنصة قانونية ذكية للسوق المصري.

---
**آخر تحديث**: 2026-02-17
