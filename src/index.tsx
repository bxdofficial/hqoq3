// Hoqouqi - منصة حقوقي القانونية الذكية
// Main Application Entry Point

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import type { D1Database } from '@cloudflare/workers-types';

// Import routes
import lawyers from './routes/lawyers';
import cases from './routes/cases';
import reviews from './routes/reviews';
import payments from './routes/payments';
import content from './routes/content';
import users from './routes/users';
import clientPages from './routes/clientPages';
import lawyerPages from './routes/lawyerPages';

// Import types and constants
import { CASE_TYPES, BAR_LEVELS, GOVERNORATES } from './lib/types';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('*', logger());
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Mount API routes
app.route('/api/lawyers', lawyers);
app.route('/api/cases', cases);
app.route('/api/reviews', reviews);
app.route('/api/payments', payments);
app.route('/api/content', content);
app.route('/api/users', users);

// Mount Page routes (Dashboard pages)
app.route('/', clientPages);
app.route('/', lawyerPages);

// Messages API endpoint
app.get('/api/messages', async (c) => {
  const db = c.env.DB;
  const case_id = c.req.query('case_id');
  
  if (!case_id) {
    return c.json({ success: false, error: 'case_id is required' }, 400);
  }
  
  try {
    const messages = await db.prepare(`
      SELECT * FROM messages
      WHERE case_id = ?
      ORDER BY created_at ASC
    `).bind(case_id).all();
    
    return c.json({
      success: true,
      data: messages.results
    });
  } catch (error) {
    return c.json({ success: true, data: [] });
  }
});

app.post('/api/messages', async (c) => {
  const db = c.env.DB;
  const { case_id, sender_id, receiver_id, content, message_type } = await c.req.json();
  
  if (!case_id || !sender_id || !receiver_id || !content) {
    return c.json({ success: false, error: 'Missing required fields' }, 400);
  }
  
  try {
    const result = await db.prepare(`
      INSERT INTO messages (case_id, sender_id, receiver_id, content, message_type, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(case_id, sender_id, receiver_id, content, message_type || 'text').run();
    
    return c.json({
      success: true,
      data: {
        id: result.meta.last_row_id,
        case_id,
        sender_id,
        receiver_id,
        content
      }
    }, 201);
  } catch (error) {
    return c.json({ success: false, error: 'Failed to send message' }, 500);
  }
});

// API Constants endpoint
app.get('/api/constants', (c) => {
  return c.json({
    success: true,
    data: {
      case_types: CASE_TYPES,
      bar_levels: BAR_LEVELS,
      governorates: GOVERNORATES
    }
  });
});

// API Health check
app.get('/api/health', (c) => {
  return c.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'Hoqouqi API'
  });
});

// Platform statistics
app.get('/api/stats', async (c) => {
  const db = c.env.DB;
  
  try {
    const lawyersCount = await db.prepare(`
      SELECT COUNT(*) as count FROM lawyers WHERE is_verified = 1 AND is_active = 1
    `).first<{ count: number }>();
    
    const casesCount = await db.prepare(`
      SELECT COUNT(*) as count FROM cases
    `).first<{ count: number }>();
    
    const completedCases = await db.prepare(`
      SELECT COUNT(*) as count FROM cases WHERE status = 'completed'
    `).first<{ count: number }>();
    
    const avgRating = await db.prepare(`
      SELECT AVG(overall_rating) as avg FROM reviews WHERE is_approved = 1
    `).first<{ avg: number }>();
    
    return c.json({
      success: true,
      data: {
        total_lawyers: lawyersCount?.count || 0,
        total_cases: casesCount?.count || 0,
        completed_cases: completedCases?.count || 0,
        avg_rating: Math.round((avgRating?.avg || 4.5) * 10) / 10
      }
    });
  } catch (error) {
    return c.json({
      success: true,
      data: {
        total_lawyers: 150,
        total_cases: 500,
        completed_cases: 350,
        avg_rating: 4.7
      }
    });
  }
});

// ==================== HTML Pages ====================

// Shared HTML components
const htmlHead = (title: string) => `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title} - حقوقي</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { font-family: 'Cairo', sans-serif; }
    .gradient-bg { background: linear-gradient(135deg, #1E3A5F 0%, #2C5282 100%); }
    .gold-accent { color: #D4AF37; }
    .gold-bg { background-color: #D4AF37; }
    .hover-gold:hover { color: #D4AF37; }
    .card-hover { transition: all 0.3s ease; }
    .card-hover:hover { transform: translateY(-5px); box-shadow: 0 10px 40px rgba(0,0,0,0.15); }
    .star-rating { color: #F59E0B; }
    .badge-top { background: linear-gradient(135deg, #D4AF37 0%, #B8860B 100%); }
    .animate-fade-in { animation: fadeIn 0.5s ease-in; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  </style>
</head>
`;

const navbar = `
<nav class="gradient-bg text-white shadow-lg sticky top-0 z-50">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex items-center justify-between h-16">
      <a href="/" class="flex items-center space-x-3 space-x-reverse">
        <i class="fas fa-balance-scale text-2xl gold-accent"></i>
        <span class="text-xl font-bold">حقوقي</span>
      </a>
      <div class="hidden md:flex items-center space-x-6 space-x-reverse">
        <a href="/" class="hover-gold transition-colors">الرئيسية</a>
        <a href="/search" class="hover-gold transition-colors">ابحث عن محامي</a>
        <a href="/articles" class="hover-gold transition-colors">المقالات</a>
        <a href="/forum" class="hover-gold transition-colors">المنتدى</a>
        <a href="/about" class="hover-gold transition-colors">من نحن</a>
      </div>
      <div class="flex items-center space-x-4 space-x-reverse">
        <a href="/login" class="px-4 py-2 rounded-lg border border-white hover:bg-white hover:text-gray-800 transition-all">
          تسجيل الدخول
        </a>
        <a href="/register" class="px-4 py-2 rounded-lg gold-bg text-gray-900 font-semibold hover:opacity-90 transition-all">
          سجل الآن
        </a>
      </div>
    </div>
  </div>
</nav>
`;

const footer = `
<footer class="gradient-bg text-white py-12 mt-16">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
      <div>
        <div class="flex items-center space-x-3 space-x-reverse mb-4">
          <i class="fas fa-balance-scale text-2xl gold-accent"></i>
          <span class="text-xl font-bold">حقوقي</span>
        </div>
        <p class="text-gray-300 text-sm">
          البوابة القانونية الأولى في مصر. نوصل الحق لصاحبه بأسرع وأسهل طريقة.
        </p>
      </div>
      <div>
        <h4 class="font-bold mb-4 gold-accent">روابط سريعة</h4>
        <ul class="space-y-2 text-sm text-gray-300">
          <li><a href="/search" class="hover:text-white">ابحث عن محامي</a></li>
          <li><a href="/articles" class="hover:text-white">المقالات القانونية</a></li>
          <li><a href="/forum" class="hover:text-white">المنتدى</a></li>
          <li><a href="/calculator" class="hover:text-white">حاسبة المواريث</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-bold mb-4 gold-accent">للمحامين</h4>
        <ul class="space-y-2 text-sm text-gray-300">
          <li><a href="/lawyer/register" class="hover:text-white">انضم كمحامي</a></li>
          <li><a href="/lawyer/dashboard" class="hover:text-white">لوحة التحكم</a></li>
          <li><a href="/premium" class="hover:text-white">الاشتراك المميز</a></li>
        </ul>
      </div>
      <div>
        <h4 class="font-bold mb-4 gold-accent">تواصل معنا</h4>
        <div class="flex space-x-4 space-x-reverse mb-4">
          <a href="#" class="text-2xl hover:text-yellow-400"><i class="fab fa-facebook"></i></a>
          <a href="#" class="text-2xl hover:text-yellow-400"><i class="fab fa-twitter"></i></a>
          <a href="#" class="text-2xl hover:text-yellow-400"><i class="fab fa-instagram"></i></a>
          <a href="#" class="text-2xl hover:text-yellow-400"><i class="fab fa-linkedin"></i></a>
        </div>
        <p class="text-sm text-gray-300">
          <i class="fas fa-envelope ml-2"></i> support@hoqouqi.com
        </p>
        <p class="text-sm text-gray-300 mt-1">
          <i class="fas fa-phone ml-2"></i> 01000000000
        </p>
      </div>
    </div>
    <div class="border-t border-gray-600 mt-8 pt-8 text-center text-sm text-gray-400">
      <p>© 2024 حقوقي. جميع الحقوق محفوظة.</p>
    </div>
  </div>
</footer>
`;

// Homepage
app.get('/', async (c) => {
  const db = c.env.DB;
  
  // Get featured lawyers
  let featuredLawyers = [];
  let stats = { total_lawyers: 150, total_cases: 500, completed_cases: 350, avg_rating: 4.7 };
  
  try {
    const lawyersResult = await db.prepare(`
      SELECT * FROM lawyers 
      WHERE is_verified = 1 AND is_active = 1 AND is_top_lawyer = 1
      ORDER BY lawyer_score DESC
      LIMIT 6
    `).all();
    featuredLawyers = lawyersResult.results || [];
    
    const lawyersCount = await db.prepare(`SELECT COUNT(*) as count FROM lawyers WHERE is_verified = 1`).first<{count: number}>();
    const casesCount = await db.prepare(`SELECT COUNT(*) as count FROM cases`).first<{count: number}>();
    stats = {
      total_lawyers: lawyersCount?.count || 150,
      total_cases: casesCount?.count || 500,
      completed_cases: 350,
      avg_rating: 4.7
    };
  } catch (e) {
    // Use default data
  }
  
  const html = `
${htmlHead('الرئيسية')}
<body class="bg-gray-50">
  ${navbar}
  
  <!-- Hero Section -->
  <section class="gradient-bg text-white py-20">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="text-center animate-fade-in">
        <h1 class="text-4xl md:text-5xl font-bold mb-6">
          الحق يوصل لصاحبه
        </h1>
        <p class="text-xl text-gray-200 mb-8 max-w-2xl mx-auto">
          أول منصة قانونية ذكية في مصر تربطك بأفضل المحامين المتخصصين في كل المجالات
        </p>
        
        <!-- Search Box -->
        <div class="bg-white rounded-2xl p-6 max-w-4xl mx-auto shadow-2xl">
          <form action="/search" method="GET" class="flex flex-col md:flex-row gap-4">
            <select name="specialization" class="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">نوع القضية</option>
              <option value="criminal">جنائي</option>
              <option value="civil">مدني</option>
              <option value="family">أحوال شخصية</option>
              <option value="commercial">تجاري</option>
              <option value="administrative">إداري</option>
              <option value="labor">عمالي</option>
            </select>
            <select name="governorate" class="flex-1 px-4 py-3 border border-gray-300 rounded-xl text-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
              <option value="">المحافظة</option>
              <option value="القاهرة">القاهرة</option>
              <option value="الجيزة">الجيزة</option>
              <option value="الإسكندرية">الإسكندرية</option>
              <option value="الدقهلية">الدقهلية</option>
              <option value="الشرقية">الشرقية</option>
            </select>
            <button type="submit" class="px-8 py-3 gold-bg text-gray-900 font-bold rounded-xl hover:opacity-90 transition-all">
              <i class="fas fa-search ml-2"></i>
              ابحث الآن
            </button>
          </form>
        </div>
      </div>
    </div>
  </section>
  
  <!-- Stats Section -->
  <section class="py-12 -mt-8">
    <div class="max-w-5xl mx-auto px-4">
      <div class="bg-white rounded-2xl shadow-xl p-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        <div class="animate-fade-in">
          <div class="text-3xl font-bold text-blue-900">${stats.total_lawyers}+</div>
          <div class="text-gray-500">محامي معتمد</div>
        </div>
        <div class="animate-fade-in" style="animation-delay: 0.1s">
          <div class="text-3xl font-bold text-blue-900">${stats.total_cases}+</div>
          <div class="text-gray-500">قضية</div>
        </div>
        <div class="animate-fade-in" style="animation-delay: 0.2s">
          <div class="text-3xl font-bold text-green-600">${stats.completed_cases}+</div>
          <div class="text-gray-500">قضية ناجحة</div>
        </div>
        <div class="animate-fade-in" style="animation-delay: 0.3s">
          <div class="text-3xl font-bold text-yellow-500">⭐ ${stats.avg_rating}</div>
          <div class="text-gray-500">متوسط التقييم</div>
        </div>
      </div>
    </div>
  </section>
  
  <!-- How it Works -->
  <section class="py-16 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="text-3xl font-bold text-center text-gray-800 mb-12">كيف يعمل حقوقي؟</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div class="text-center p-6 card-hover rounded-xl">
          <div class="w-20 h-20 mx-auto mb-4 gradient-bg rounded-full flex items-center justify-center">
            <i class="fas fa-search text-3xl text-white"></i>
          </div>
          <h3 class="text-xl font-bold mb-2">1. اوصف قضيتك</h3>
          <p class="text-gray-600">حدد نوع القضية والتفاصيل الأساسية ونظامنا الذكي يحللها</p>
        </div>
        <div class="text-center p-6 card-hover rounded-xl">
          <div class="w-20 h-20 mx-auto mb-4 gradient-bg rounded-full flex items-center justify-center">
            <i class="fas fa-users text-3xl text-white"></i>
          </div>
          <h3 class="text-xl font-bold mb-2">2. اختر المحامي</h3>
          <p class="text-gray-600">نقترح عليك أفضل المحامين المتخصصين مع نسبة التطابق</p>
        </div>
        <div class="text-center p-6 card-hover rounded-xl">
          <div class="w-20 h-20 mx-auto mb-4 gradient-bg rounded-full flex items-center justify-center">
            <i class="fas fa-handshake text-3xl text-white"></i>
          </div>
          <h3 class="text-xl font-bold mb-2">3. تابع قضيتك</h3>
          <p class="text-gray-600">تواصل مع محاميك وتابع كل خطوة في قضيتك بشفافية</p>
        </div>
      </div>
    </div>
  </section>
  
  <!-- Featured Lawyers -->
  <section class="py-16 bg-gray-50">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center mb-8">
        <h2 class="text-3xl font-bold text-gray-800">محامون مميزون</h2>
        <a href="/search" class="text-blue-600 hover:text-blue-800 font-semibold">
          عرض الكل <i class="fas fa-arrow-left mr-1"></i>
        </a>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${featuredLawyers.length > 0 ? featuredLawyers.map((lawyer: any) => `
          <div class="bg-white rounded-xl shadow-lg overflow-hidden card-hover">
            <div class="p-6">
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center">
                  <div class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold">
                    ${lawyer.full_name?.charAt(0) || 'م'}
                  </div>
                  <div class="mr-4">
                    <h3 class="font-bold text-lg">${lawyer.full_name}</h3>
                    <p class="text-sm text-gray-500">${lawyer.bar_level === 'cassation' ? 'محامي نقض' : lawyer.bar_level === 'appeal' ? 'محامي استئناف' : 'محامي'}</p>
                  </div>
                </div>
                ${lawyer.is_top_lawyer ? '<span class="badge-top text-white text-xs px-2 py-1 rounded-full">⭐ TOP</span>' : ''}
              </div>
              <div class="space-y-2 text-sm">
                <p class="text-gray-600">
                  <i class="fas fa-briefcase ml-2 gold-accent"></i>
                  ${lawyer.primary_specialization === 'criminal' ? 'جنائي' : lawyer.primary_specialization === 'family' ? 'أحوال شخصية' : lawyer.primary_specialization === 'civil' ? 'مدني' : lawyer.primary_specialization}
                </p>
                <p class="text-gray-600">
                  <i class="fas fa-map-marker-alt ml-2 gold-accent"></i>
                  ${lawyer.governorate}
                </p>
                <p class="text-gray-600">
                  <i class="fas fa-history ml-2 gold-accent"></i>
                  ${lawyer.years_of_experience} سنة خبرة
                </p>
                <div class="flex items-center justify-between pt-2">
                  <div class="star-rating">
                    ${'⭐'.repeat(Math.floor(lawyer.avg_rating || 4))} ${lawyer.avg_rating || 4.5}
                  </div>
                  <span class="text-green-600 font-semibold">${lawyer.success_rate || 85}% نجاح</span>
                </div>
              </div>
              <a href="/lawyer/${lawyer.id}" class="mt-4 block w-full text-center py-2 border-2 border-blue-900 text-blue-900 rounded-lg font-semibold hover:bg-blue-900 hover:text-white transition-all">
                عرض الملف
              </a>
            </div>
          </div>
        `).join('') : `
          <div class="col-span-3 text-center py-12 text-gray-500">
            <i class="fas fa-users text-5xl mb-4"></i>
            <p>سيتم إضافة المحامين قريباً</p>
          </div>
        `}
      </div>
    </div>
  </section>
  
  <!-- Specializations -->
  <section class="py-16 bg-white">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h2 class="text-3xl font-bold text-center text-gray-800 mb-12">التخصصات القانونية</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        ${[
          { icon: 'fa-gavel', name: 'جنائي', value: 'criminal' },
          { icon: 'fa-file-contract', name: 'مدني', value: 'civil' },
          { icon: 'fa-users', name: 'أحوال شخصية', value: 'family' },
          { icon: 'fa-building', name: 'تجاري', value: 'commercial' },
          { icon: 'fa-landmark', name: 'إداري', value: 'administrative' },
          { icon: 'fa-hard-hat', name: 'عمالي', value: 'labor' },
          { icon: 'fa-mosque', name: 'شرعي', value: 'sharia' }
        ].map(spec => `
          <a href="/search?specialization=${spec.value}" class="p-6 text-center rounded-xl border border-gray-200 card-hover hover:border-blue-500">
            <i class="fas ${spec.icon} text-3xl text-blue-900 mb-3"></i>
            <p class="font-semibold text-gray-700">${spec.name}</p>
          </a>
        `).join('')}
      </div>
    </div>
  </section>
  
  <!-- CTA Section -->
  <section class="gradient-bg py-16">
    <div class="max-w-4xl mx-auto px-4 text-center text-white">
      <h2 class="text-3xl font-bold mb-4">هل أنت محامي؟</h2>
      <p class="text-xl text-gray-200 mb-8">انضم إلى شبكة محامي حقوقي واحصل على عملاء جدد وأدوات ذكية لإدارة قضاياك</p>
      <div class="flex flex-col md:flex-row justify-center gap-4">
        <a href="/lawyer/register" class="px-8 py-3 gold-bg text-gray-900 font-bold rounded-xl hover:opacity-90 transition-all">
          <i class="fas fa-user-tie ml-2"></i>
          سجل كمحامي
        </a>
        <a href="/premium" class="px-8 py-3 bg-white text-blue-900 font-bold rounded-xl hover:bg-gray-100 transition-all">
          <i class="fas fa-crown ml-2"></i>
          الاشتراك المميز
        </a>
      </div>
    </div>
  </section>
  
  ${footer}
  
  <script>
    // Add any interactive JS here
  </script>
</body>
</html>
`;

  return c.html(html);
});

// Search page
app.get('/search', async (c) => {
  const db = c.env.DB;
  
  const specialization = c.req.query('specialization') || '';
  const governorate = c.req.query('governorate') || '';
  const bar_level = c.req.query('bar_level') || '';
  
  let lawyers: any[] = [];
  
  try {
    let query = `
      SELECT * FROM lawyers 
      WHERE is_verified = 1 AND is_active = 1
    `;
    const params: any[] = [];
    
    if (specialization) {
      query += ` AND (primary_specialization = ? OR secondary_specializations LIKE ?)`;
      params.push(specialization, `%"${specialization}"%`);
    }
    
    if (governorate) {
      query += ` AND governorate = ?`;
      params.push(governorate);
    }
    
    if (bar_level) {
      query += ` AND bar_level = ?`;
      params.push(bar_level);
    }
    
    query += ` ORDER BY is_top_lawyer DESC, lawyer_score DESC LIMIT 20`;
    
    const result = await db.prepare(query).bind(...params).all();
    lawyers = result.results || [];
  } catch (e) {
    // Continue with empty results
  }
  
  const specNames: Record<string, string> = {
    criminal: 'جنائي',
    civil: 'مدني',
    family: 'أحوال شخصية',
    commercial: 'تجاري',
    administrative: 'إداري',
    labor: 'عمالي',
    sharia: 'شرعي'
  };
  
  const levelNames: Record<string, string> = {
    general: 'عام',
    primary: 'ابتدائي',
    appeal: 'استئناف',
    cassation: 'نقض'
  };
  
  const html = `
${htmlHead('البحث عن محامي')}
<body class="bg-gray-50">
  ${navbar}
  
  <!-- Search Header -->
  <section class="gradient-bg py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <h1 class="text-3xl font-bold text-white text-center mb-8">ابحث عن محامي</h1>
      
      <form class="bg-white rounded-xl p-6 shadow-lg">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select name="specialization" class="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500">
            <option value="">كل التخصصات</option>
            <option value="criminal" ${specialization === 'criminal' ? 'selected' : ''}>جنائي</option>
            <option value="civil" ${specialization === 'civil' ? 'selected' : ''}>مدني</option>
            <option value="family" ${specialization === 'family' ? 'selected' : ''}>أحوال شخصية</option>
            <option value="commercial" ${specialization === 'commercial' ? 'selected' : ''}>تجاري</option>
            <option value="administrative" ${specialization === 'administrative' ? 'selected' : ''}>إداري</option>
            <option value="labor" ${specialization === 'labor' ? 'selected' : ''}>عمالي</option>
          </select>
          
          <select name="governorate" class="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500">
            <option value="">كل المحافظات</option>
            <option value="القاهرة" ${governorate === 'القاهرة' ? 'selected' : ''}>القاهرة</option>
            <option value="الجيزة" ${governorate === 'الجيزة' ? 'selected' : ''}>الجيزة</option>
            <option value="الإسكندرية" ${governorate === 'الإسكندرية' ? 'selected' : ''}>الإسكندرية</option>
          </select>
          
          <select name="bar_level" class="px-4 py-3 border border-gray-300 rounded-lg text-gray-700 focus:ring-2 focus:ring-blue-500">
            <option value="">كل الدرجات</option>
            <option value="cassation" ${bar_level === 'cassation' ? 'selected' : ''}>نقض</option>
            <option value="appeal" ${bar_level === 'appeal' ? 'selected' : ''}>استئناف</option>
            <option value="primary" ${bar_level === 'primary' ? 'selected' : ''}>ابتدائي</option>
          </select>
          
          <button type="submit" class="px-6 py-3 gold-bg text-gray-900 font-bold rounded-lg hover:opacity-90 transition-all">
            <i class="fas fa-search ml-2"></i>
            بحث
          </button>
        </div>
      </form>
    </div>
  </section>
  
  <!-- Results -->
  <section class="py-12">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-xl font-bold text-gray-800">
          ${lawyers.length > 0 ? `تم العثور على ${lawyers.length} محامي` : 'لا توجد نتائج'}
        </h2>
        <select class="px-4 py-2 border rounded-lg text-sm">
          <option>ترتيب حسب: الأفضل تقييماً</option>
          <option>الأكثر خبرة</option>
          <option>الأقل سعراً</option>
        </select>
      </div>
      
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        ${lawyers.map((lawyer: any) => `
          <div class="bg-white rounded-xl shadow-lg overflow-hidden card-hover">
            <div class="p-6">
              <div class="flex items-start justify-between mb-4">
                <div class="flex items-center">
                  <div class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-2xl font-bold">
                    ${lawyer.full_name?.charAt(0) || 'م'}
                  </div>
                  <div class="mr-4">
                    <h3 class="font-bold text-lg">${lawyer.full_name}</h3>
                    <p class="text-sm text-gray-500">${levelNames[lawyer.bar_level] || lawyer.bar_level}</p>
                  </div>
                </div>
                ${lawyer.is_top_lawyer ? '<span class="badge-top text-white text-xs px-2 py-1 rounded-full">⭐ TOP</span>' : ''}
              </div>
              
              <div class="space-y-2 text-sm">
                <p class="text-gray-600">
                  <i class="fas fa-briefcase ml-2 gold-accent"></i>
                  ${specNames[lawyer.primary_specialization] || lawyer.primary_specialization}
                </p>
                <p class="text-gray-600">
                  <i class="fas fa-map-marker-alt ml-2 gold-accent"></i>
                  ${lawyer.governorate}، ${lawyer.city}
                </p>
                <p class="text-gray-600">
                  <i class="fas fa-history ml-2 gold-accent"></i>
                  ${lawyer.years_of_experience} سنة خبرة • ${lawyer.total_cases || 0} قضية
                </p>
                <div class="flex items-center justify-between pt-2 border-t mt-3">
                  <div class="star-rating">
                    ${'⭐'.repeat(Math.floor(lawyer.avg_rating || 4))} ${(lawyer.avg_rating || 4.5).toFixed(1)}
                    <span class="text-gray-400 text-xs">(${lawyer.total_reviews || 0})</span>
                  </div>
                  <span class="text-green-600 font-semibold">${(lawyer.success_rate || 80).toFixed(0)}%</span>
                </div>
                <div class="flex items-center justify-between text-gray-500 text-xs">
                  <span>استشارة من ${lawyer.min_consultation_fee || 400} ج.م</span>
                  <span><i class="fas fa-clock ml-1"></i> رد خلال ${lawyer.avg_response_time || 30} دقيقة</span>
                </div>
              </div>
              
              <div class="mt-4 flex gap-2">
                <a href="/lawyer/${lawyer.id}" class="flex-1 text-center py-2 border-2 border-blue-900 text-blue-900 rounded-lg font-semibold hover:bg-blue-900 hover:text-white transition-all">
                  عرض الملف
                </a>
                <a href="/book/${lawyer.id}" class="flex-1 text-center py-2 gold-bg text-gray-900 rounded-lg font-semibold hover:opacity-90 transition-all">
                  احجز الآن
                </a>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
      
      ${lawyers.length === 0 ? `
        <div class="text-center py-16">
          <i class="fas fa-search text-6xl text-gray-300 mb-4"></i>
          <p class="text-gray-500 text-xl">لم نجد محامين يطابقون البحث</p>
          <p class="text-gray-400">جرب تغيير معايير البحث</p>
        </div>
      ` : ''}
    </div>
  </section>
  
  ${footer}
</body>
</html>
`;

  return c.html(html);
});

// Lawyer profile page
app.get('/lawyer/:id', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  
  let lawyer: any = null;
  let reviews: any[] = [];
  let specializations: any[] = [];
  
  try {
    lawyer = await db.prepare(`
      SELECT l.*, u.email, u.phone
      FROM lawyers l
      JOIN users u ON l.user_id = u.id
      WHERE l.id = ?
    `).bind(id).first();
    
    if (lawyer) {
      const reviewsResult = await db.prepare(`
        SELECT r.*, c.full_name as client_name
        FROM reviews r
        JOIN clients c ON r.client_id = c.id
        WHERE r.lawyer_id = ? AND r.is_approved = 1
        ORDER BY r.created_at DESC
        LIMIT 10
      `).bind(id).all();
      reviews = reviewsResult.results || [];
      
      const specsResult = await db.prepare(`
        SELECT * FROM lawyer_specializations WHERE lawyer_id = ?
      `).bind(id).all();
      specializations = specsResult.results || [];
    }
  } catch (e) {
    // Handle error
  }
  
  if (!lawyer) {
    return c.html(`
      ${htmlHead('محامي غير موجود')}
      <body class="bg-gray-50">
        ${navbar}
        <div class="max-w-4xl mx-auto py-20 text-center">
          <i class="fas fa-user-slash text-6xl text-gray-300 mb-4"></i>
          <h1 class="text-2xl font-bold text-gray-800">المحامي غير موجود</h1>
          <a href="/search" class="mt-4 inline-block text-blue-600">العودة للبحث</a>
        </div>
        ${footer}
      </body>
      </html>
    `);
  }
  
  const specNames: Record<string, string> = {
    criminal: 'جنائي', civil: 'مدني', family: 'أحوال شخصية',
    commercial: 'تجاري', administrative: 'إداري', labor: 'عمالي', sharia: 'شرعي'
  };
  
  const levelNames: Record<string, string> = {
    general: 'عام', primary: 'ابتدائي', appeal: 'استئناف', cassation: 'نقض'
  };
  
  const html = `
${htmlHead(lawyer.full_name)}
<body class="bg-gray-50">
  ${navbar}
  
  <!-- Profile Header -->
  <section class="gradient-bg py-12">
    <div class="max-w-5xl mx-auto px-4">
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <div class="flex flex-col md:flex-row items-start gap-6">
          <div class="w-32 h-32 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-5xl font-bold">
            ${lawyer.full_name.charAt(0)}
          </div>
          
          <div class="flex-1">
            <div class="flex items-center gap-3 mb-2">
              <h1 class="text-3xl font-bold text-gray-800">${lawyer.full_name}</h1>
              ${lawyer.is_top_lawyer ? '<span class="badge-top text-white text-sm px-3 py-1 rounded-full">⭐ محامي مميز</span>' : ''}
              ${lawyer.is_verified ? '<span class="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full"><i class="fas fa-check-circle ml-1"></i>موثق</span>' : ''}
            </div>
            
            <p class="text-gray-600 text-lg mb-4">
              محامي ${levelNames[lawyer.bar_level]} • ${specNames[lawyer.primary_specialization] || lawyer.primary_specialization}
            </p>
            
            <div class="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
              <span><i class="fas fa-map-marker-alt ml-1 gold-accent"></i> ${lawyer.governorate}، ${lawyer.city}</span>
              <span><i class="fas fa-calendar ml-1 gold-accent"></i> ${lawyer.years_of_experience} سنة خبرة</span>
              <span><i class="fas fa-id-card ml-1 gold-accent"></i> قيد ${lawyer.registration_year}</span>
            </div>
            
            <div class="flex flex-wrap gap-6">
              <div class="text-center">
                <div class="text-2xl font-bold text-blue-900">${lawyer.total_cases || 0}</div>
                <div class="text-xs text-gray-500">قضية</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-green-600">${(lawyer.success_rate || 0).toFixed(0)}%</div>
                <div class="text-xs text-gray-500">نسبة النجاح</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold star-rating">⭐ ${(lawyer.avg_rating || 0).toFixed(1)}</div>
                <div class="text-xs text-gray-500">${lawyer.total_reviews || 0} تقييم</div>
              </div>
              <div class="text-center">
                <div class="text-2xl font-bold text-purple-600">${lawyer.avg_response_time || 30}</div>
                <div class="text-xs text-gray-500">دقيقة للرد</div>
              </div>
            </div>
          </div>
          
          <div class="w-full md:w-auto">
            <div class="bg-gray-50 rounded-xl p-6 text-center">
              <div class="text-sm text-gray-500 mb-1">استشارة تبدأ من</div>
              <div class="text-3xl font-bold text-blue-900 mb-4">${lawyer.min_consultation_fee || 400} ج.م</div>
              <a href="/book/${lawyer.id}" class="block w-full px-8 py-3 gold-bg text-gray-900 font-bold rounded-lg hover:opacity-90 transition-all">
                <i class="fas fa-calendar-plus ml-2"></i>
                احجز استشارة
              </a>
              <button class="mt-3 w-full px-8 py-3 border-2 border-blue-900 text-blue-900 rounded-lg font-semibold hover:bg-blue-50 transition-all">
                <i class="fas fa-comment-dots ml-2"></i>
                أرسل رسالة
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  
  <!-- Profile Content -->
  <section class="py-12">
    <div class="max-w-5xl mx-auto px-4">
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- Main Content -->
        <div class="lg:col-span-2 space-y-6">
          
          <!-- Bio -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">
              <i class="fas fa-user ml-2 gold-accent"></i>
              نبذة عن المحامي
            </h2>
            <p class="text-gray-600 leading-relaxed">${lawyer.bio || 'لم يتم إضافة نبذة بعد.'}</p>
          </div>
          
          <!-- Specializations -->
          ${specializations.length > 0 ? `
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">
              <i class="fas fa-briefcase ml-2 gold-accent"></i>
              التخصصات والإحصائيات
            </h2>
            <div class="space-y-4">
              ${specializations.map((spec: any) => `
                <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <span class="font-semibold">${spec.case_type}</span>
                    <span class="text-gray-500 text-sm mr-2">(${spec.cases_handled} قضية)</span>
                  </div>
                  <div class="text-green-600 font-bold">${(spec.success_rate || 0).toFixed(0)}% نجاح</div>
                </div>
              `).join('')}
            </div>
          </div>
          ` : ''}
          
          <!-- Reviews -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h2 class="text-xl font-bold text-gray-800 mb-4">
              <i class="fas fa-star ml-2 gold-accent"></i>
              التقييمات (${lawyer.total_reviews || 0})
            </h2>
            
            ${reviews.length > 0 ? reviews.map((review: any) => `
              <div class="border-b border-gray-100 pb-4 mb-4">
                <div class="flex items-center justify-between mb-2">
                  <div class="font-semibold">${review.client_name}</div>
                  <div class="star-rating">${'⭐'.repeat(review.overall_rating)}</div>
                </div>
                <p class="text-gray-600 text-sm">${review.comment || 'لا يوجد تعليق'}</p>
                ${review.lawyer_response ? `
                  <div class="mt-3 p-3 bg-blue-50 rounded-lg text-sm">
                    <span class="font-semibold text-blue-900">رد المحامي:</span>
                    <p class="text-gray-600 mt-1">${review.lawyer_response}</p>
                  </div>
                ` : ''}
              </div>
            `).join('') : '<p class="text-gray-500 text-center py-4">لا توجد تقييمات بعد</p>'}
          </div>
        </div>
        
        <!-- Sidebar -->
        <div class="space-y-6">
          
          <!-- Contact Info -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="font-bold text-gray-800 mb-4">معلومات التواصل</h3>
            <div class="space-y-3 text-sm">
              <p class="flex items-center text-gray-600">
                <i class="fas fa-map-marker-alt ml-3 gold-accent w-5"></i>
                ${lawyer.office_address || `${lawyer.city}، ${lawyer.governorate}`}
              </p>
              <p class="flex items-center text-gray-600">
                <i class="fas fa-envelope ml-3 gold-accent w-5"></i>
                ${lawyer.email}
              </p>
            </div>
          </div>
          
          <!-- Fees -->
          <div class="bg-white rounded-xl shadow-lg p-6">
            <h3 class="font-bold text-gray-800 mb-4">الأتعاب</h3>
            <div class="space-y-3 text-sm">
              <div class="flex justify-between">
                <span class="text-gray-600">استشارة</span>
                <span class="font-bold">${lawyer.min_consultation_fee || 400} ج.م</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">بالساعة</span>
                <span class="font-bold">${lawyer.hourly_rate || 500} ج.م</span>
              </div>
            </div>
            <p class="text-xs text-gray-400 mt-4">* الأتعاب النهائية تحدد بعد دراسة القضية</p>
          </div>
          
          <!-- Quick Stats -->
          <div class="bg-gradient-to-br from-blue-900 to-blue-700 rounded-xl shadow-lg p-6 text-white">
            <h3 class="font-bold mb-4">نقاط المحامي</h3>
            <div class="text-4xl font-bold mb-2">${lawyer.lawyer_score || 0}</div>
            <p class="text-blue-200 text-sm">من 100 نقطة</p>
          </div>
          
        </div>
      </div>
    </div>
  </section>
  
  ${footer}
</body>
</html>
`;

  return c.html(html);
});

// Login page
app.get('/login', (c) => {
  const html = `
${htmlHead('تسجيل الدخول')}
<body class="bg-gray-50">
  ${navbar}
  
  <section class="py-20">
    <div class="max-w-md mx-auto px-4">
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <div class="text-center mb-8">
          <i class="fas fa-balance-scale text-4xl text-blue-900 mb-4"></i>
          <h1 class="text-2xl font-bold text-gray-800">تسجيل الدخول</h1>
          <p class="text-gray-500">أدخل بياناتك للمتابعة</p>
        </div>
        
        <form id="loginForm" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
            <input type="email" name="email" required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="example@email.com">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
            <input type="password" name="password" required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="••••••••">
          </div>
          
          <div class="flex items-center justify-between">
            <label class="flex items-center">
              <input type="checkbox" class="rounded border-gray-300 text-blue-600">
              <span class="mr-2 text-sm text-gray-600">تذكرني</span>
            </label>
            <a href="/forgot-password" class="text-sm text-blue-600 hover:text-blue-800">نسيت كلمة المرور؟</a>
          </div>
          
          <button type="submit" class="w-full py-3 gold-bg text-gray-900 font-bold rounded-lg hover:opacity-90 transition-all">
            تسجيل الدخول
          </button>
          
          <div id="loginError" class="hidden p-3 bg-red-100 text-red-700 rounded-lg text-sm"></div>
        </form>
        
        <div class="mt-6 text-center">
          <p class="text-gray-600">ليس لديك حساب؟ <a href="/register" class="text-blue-600 font-semibold">سجل الآن</a></p>
        </div>
      </div>
    </div>
  </section>
  
  ${footer}
  
  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      
      try {
        const response = await fetch('/api/users/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
          localStorage.setItem('hoqouqi_token', result.data.token);
          localStorage.setItem('hoqouqi_user', JSON.stringify(result.data.user));
          
          if (result.data.user.user_type === 'lawyer') {
            window.location.href = '/lawyer/dashboard';
          } else {
            window.location.href = '/dashboard';
          }
        } else {
          document.getElementById('loginError').textContent = result.error;
          document.getElementById('loginError').classList.remove('hidden');
        }
      } catch (error) {
        document.getElementById('loginError').textContent = 'حدث خطأ. حاول مرة أخرى.';
        document.getElementById('loginError').classList.remove('hidden');
      }
    });
  </script>
</body>
</html>
`;
  return c.html(html);
});

// Register page
app.get('/register', (c) => {
  const html = `
${htmlHead('إنشاء حساب')}
<body class="bg-gray-50">
  ${navbar}
  
  <section class="py-12">
    <div class="max-w-lg mx-auto px-4">
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <div class="text-center mb-8">
          <i class="fas fa-user-plus text-4xl text-blue-900 mb-4"></i>
          <h1 class="text-2xl font-bold text-gray-800">إنشاء حساب جديد</h1>
        </div>
        
        <!-- Account Type Selection -->
        <div class="flex gap-4 mb-8">
          <button type="button" onclick="setUserType('client')" id="clientBtn"
            class="flex-1 py-4 px-6 rounded-xl border-2 border-blue-900 bg-blue-900 text-white font-semibold transition-all">
            <i class="fas fa-user text-2xl mb-2"></i>
            <div>عميل</div>
          </button>
          <button type="button" onclick="setUserType('lawyer')" id="lawyerBtn"
            class="flex-1 py-4 px-6 rounded-xl border-2 border-gray-300 text-gray-600 font-semibold transition-all hover:border-blue-900">
            <i class="fas fa-user-tie text-2xl mb-2"></i>
            <div>محامي</div>
          </button>
        </div>
        
        <form id="registerForm" class="space-y-4">
          <input type="hidden" name="user_type" id="userType" value="client">
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل</label>
            <input type="text" name="full_name" required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني</label>
            <input type="email" name="email" required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">رقم الهاتف</label>
            <input type="tel" name="phone" required
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="01xxxxxxxxx">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">كلمة المرور</label>
            <input type="password" name="password" required minlength="6"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">المحافظة</label>
            <select name="governorate" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">اختر المحافظة</option>
              <option value="القاهرة">القاهرة</option>
              <option value="الجيزة">الجيزة</option>
              <option value="الإسكندرية">الإسكندرية</option>
            </select>
          </div>
          
          <div class="flex items-start">
            <input type="checkbox" required class="mt-1 rounded border-gray-300 text-blue-600">
            <span class="mr-2 text-sm text-gray-600">
              أوافق على <a href="/terms" class="text-blue-600">الشروط والأحكام</a> و<a href="/privacy" class="text-blue-600">سياسة الخصوصية</a>
            </span>
          </div>
          
          <button type="submit" class="w-full py-3 gold-bg text-gray-900 font-bold rounded-lg hover:opacity-90 transition-all">
            إنشاء الحساب
          </button>
          
          <div id="registerError" class="hidden p-3 bg-red-100 text-red-700 rounded-lg text-sm"></div>
          <div id="registerSuccess" class="hidden p-3 bg-green-100 text-green-700 rounded-lg text-sm"></div>
        </form>
        
        <div class="mt-6 text-center">
          <p class="text-gray-600">لديك حساب؟ <a href="/login" class="text-blue-600 font-semibold">سجل دخول</a></p>
        </div>
      </div>
    </div>
  </section>
  
  ${footer}
  
  <script>
    function setUserType(type) {
      document.getElementById('userType').value = type;
      
      if (type === 'client') {
        document.getElementById('clientBtn').classList.add('bg-blue-900', 'text-white', 'border-blue-900');
        document.getElementById('clientBtn').classList.remove('text-gray-600', 'border-gray-300');
        document.getElementById('lawyerBtn').classList.remove('bg-blue-900', 'text-white', 'border-blue-900');
        document.getElementById('lawyerBtn').classList.add('text-gray-600', 'border-gray-300');
      } else {
        document.getElementById('lawyerBtn').classList.add('bg-blue-900', 'text-white', 'border-blue-900');
        document.getElementById('lawyerBtn').classList.remove('text-gray-600', 'border-gray-300');
        document.getElementById('clientBtn').classList.remove('bg-blue-900', 'text-white', 'border-blue-900');
        document.getElementById('clientBtn').classList.add('text-gray-600', 'border-gray-300');
      }
    }
    
    document.getElementById('registerForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const data = Object.fromEntries(formData);
      
      try {
        const response = await fetch('/api/users/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (result.success) {
          document.getElementById('registerSuccess').textContent = 'تم إنشاء الحساب بنجاح! جاري التحويل...';
          document.getElementById('registerSuccess').classList.remove('hidden');
          document.getElementById('registerError').classList.add('hidden');
          
          setTimeout(() => {
            if (data.user_type === 'lawyer') {
              window.location.href = '/lawyer/complete-profile?user_id=' + result.data.user_id;
            } else {
              window.location.href = '/login';
            }
          }, 2000);
        } else {
          document.getElementById('registerError').textContent = result.error;
          document.getElementById('registerError').classList.remove('hidden');
        }
      } catch (error) {
        document.getElementById('registerError').textContent = 'حدث خطأ. حاول مرة أخرى.';
        document.getElementById('registerError').classList.remove('hidden');
      }
    });
  </script>
</body>
</html>
`;
  return c.html(html);
});

// About page
app.get('/about', (c) => {
  const html = `
${htmlHead('من نحن')}
<body class="bg-gray-50">
  ${navbar}
  
  <section class="gradient-bg py-20 text-white text-center">
    <div class="max-w-4xl mx-auto px-4">
      <h1 class="text-4xl font-bold mb-4">من نحن</h1>
      <p class="text-xl text-gray-200">البوابة القانونية الأولى في مصر</p>
    </div>
  </section>
  
  <section class="py-16">
    <div class="max-w-4xl mx-auto px-4">
      <div class="bg-white rounded-2xl shadow-xl p-8 mb-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-eye ml-2 gold-accent"></i>
          رؤيتنا
        </h2>
        <p class="text-gray-600 leading-relaxed text-lg">
          أن نصبح البوابة القانونية الأولى لكل مواطن ومؤسسة في مصر، نوصل الحق لصاحبه بأسرع وأسهل وأوضح طريقة.
        </p>
      </div>
      
      <div class="bg-white rounded-2xl shadow-xl p-8 mb-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-4">
          <i class="fas fa-bullseye ml-2 gold-accent"></i>
          مهمتنا
        </h2>
        <p class="text-gray-600 leading-relaxed text-lg">
          نسعى لتقديم خدمات قانونية عالية الجودة من خلال ربط العملاء بأفضل المحامين المتخصصين، مع توفير أدوات ذكية تسهل العملية القانونية وتجعلها أكثر شفافية.
        </p>
      </div>
      
      <div class="bg-white rounded-2xl shadow-xl p-8">
        <h2 class="text-2xl font-bold text-gray-800 mb-6">
          <i class="fas fa-star ml-2 gold-accent"></i>
          لماذا حقوقي؟
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="flex items-start">
            <div class="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-white ml-4">
              <i class="fas fa-check"></i>
            </div>
            <div>
              <h3 class="font-bold mb-1">محامون معتمدون</h3>
              <p class="text-gray-600 text-sm">نتحقق من جميع المحامين المسجلين</p>
            </div>
          </div>
          <div class="flex items-start">
            <div class="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-white ml-4">
              <i class="fas fa-brain"></i>
            </div>
            <div>
              <h3 class="font-bold mb-1">مطابقة ذكية</h3>
              <p class="text-gray-600 text-sm">نظام AI يجد لك المحامي المناسب</p>
            </div>
          </div>
          <div class="flex items-start">
            <div class="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-white ml-4">
              <i class="fas fa-shield-alt"></i>
            </div>
            <div>
              <h3 class="font-bold mb-1">دفع آمن</h3>
              <p class="text-gray-600 text-sm">نظام Escrow يحمي أموالك</p>
            </div>
          </div>
          <div class="flex items-start">
            <div class="w-12 h-12 rounded-full gradient-bg flex items-center justify-center text-white ml-4">
              <i class="fas fa-chart-line"></i>
            </div>
            <div>
              <h3 class="font-bold mb-1">شفافية كاملة</h3>
              <p class="text-gray-600 text-sm">تابع قضيتك خطوة بخطوة</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  
  ${footer}
</body>
</html>
`;
  return c.html(html);
});

// Articles page placeholder
app.get('/articles', (c) => {
  const html = `
${htmlHead('المقالات القانونية')}
<body class="bg-gray-50">
  ${navbar}
  
  <section class="gradient-bg py-12">
    <div class="max-w-7xl mx-auto px-4 text-center text-white">
      <h1 class="text-3xl font-bold mb-4">أكاديمية حقوقي</h1>
      <p class="text-gray-200">مقالات قانونية تثقيفية لمساعدتك على فهم حقوقك</p>
    </div>
  </section>
  
  <section class="py-12">
    <div class="max-w-7xl mx-auto px-4">
      <div class="text-center py-20">
        <i class="fas fa-newspaper text-6xl text-gray-300 mb-4"></i>
        <h2 class="text-2xl font-bold text-gray-600">قريباً</h2>
        <p class="text-gray-400">سيتم إضافة المقالات القانونية قريباً</p>
      </div>
    </div>
  </section>
  
  ${footer}
</body>
</html>
`;
  return c.html(html);
});

// Forum page placeholder
app.get('/forum', (c) => {
  const html = `
${htmlHead('المنتدى القانوني')}
<body class="bg-gray-50">
  ${navbar}
  
  <section class="gradient-bg py-12">
    <div class="max-w-7xl mx-auto px-4 text-center text-white">
      <h1 class="text-3xl font-bold mb-4">المنتدى القانوني</h1>
      <p class="text-gray-200">اسأل واحصل على إجابات من محامين متخصصين</p>
    </div>
  </section>
  
  <section class="py-12">
    <div class="max-w-7xl mx-auto px-4">
      <div class="text-center py-20">
        <i class="fas fa-comments text-6xl text-gray-300 mb-4"></i>
        <h2 class="text-2xl font-bold text-gray-600">قريباً</h2>
        <p class="text-gray-400">سيتم تفعيل المنتدى قريباً</p>
      </div>
    </div>
  </section>
  
  ${footer}
</body>
</html>
`;
  return c.html(html);
});

// 404 handler
app.notFound((c) => {
  const html = `
${htmlHead('الصفحة غير موجودة')}
<body class="bg-gray-50">
  ${navbar}
  
  <section class="py-20">
    <div class="max-w-4xl mx-auto px-4 text-center">
      <i class="fas fa-exclamation-triangle text-8xl text-yellow-500 mb-6"></i>
      <h1 class="text-4xl font-bold text-gray-800 mb-4">404</h1>
      <p class="text-xl text-gray-600 mb-8">الصفحة التي تبحث عنها غير موجودة</p>
      <a href="/" class="px-8 py-3 gold-bg text-gray-900 font-bold rounded-lg hover:opacity-90 transition-all inline-block">
        <i class="fas fa-home ml-2"></i>
        العودة للرئيسية
      </a>
    </div>
  </section>
  
  ${footer}
</body>
</html>
`;
  return c.html(html, 404);
});

export default app;
