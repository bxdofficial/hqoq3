// Client Dashboard Pages - صفحات لوحة تحكم العميل
import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import { htmlHead, navbar, footer, dashboardSidebar, authScript, specNames } from '../components/shared';

type Bindings = {
  DB: D1Database;
};

const clientPages = new Hono<{ Bindings: Bindings }>();

// لوحة التحكم الرئيسية للعميل
clientPages.get('/dashboard', async (c) => {
  const html = `
${htmlHead('لوحة التحكم')}
<body class="bg-gray-100">
  ${navbar(true, 'client')}
  
  <div class="flex">
    ${dashboardSidebar('client', 'home')}
    
    <main class="flex-1 mr-64 p-8">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">مرحباً بك في لوحة التحكم</h1>
      
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8" id="stats-cards">
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">القضايا النشطة</p>
              <p class="text-3xl font-bold text-blue-900" id="active-cases">0</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <i class="fas fa-folder-open text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">القضايا المكتملة</p>
              <p class="text-3xl font-bold text-green-600" id="completed-cases">0</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <i class="fas fa-check-circle text-green-600 text-xl"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">المدفوعات</p>
              <p class="text-3xl font-bold text-purple-600" id="total-paid">0</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <i class="fas fa-credit-card text-purple-600 text-xl"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">رسائل جديدة</p>
              <p class="text-3xl font-bold text-orange-500" id="new-messages">0</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <i class="fas fa-envelope text-orange-500 text-xl"></i>
            </div>
          </div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <!-- Active Cases -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-800">
              <i class="fas fa-folder-open ml-2 gold-accent"></i>
              قضاياي النشطة
            </h2>
            <a href="/dashboard/cases" class="text-blue-600 text-sm hover:underline">عرض الكل</a>
          </div>
          <div id="active-cases-list" class="space-y-4">
            <div class="text-center py-8 text-gray-400">
              <i class="fas fa-spinner fa-spin text-2xl"></i>
            </div>
          </div>
        </div>
        
        <!-- Recent Notifications -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-800">
              <i class="fas fa-bell ml-2 gold-accent"></i>
              آخر الإشعارات
            </h2>
          </div>
          <div id="notifications-list" class="space-y-3">
            <div class="text-center py-8 text-gray-400">
              <i class="fas fa-spinner fa-spin text-2xl"></i>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Quick Actions -->
      <div class="mt-8 bg-white rounded-xl shadow-lg p-6">
        <h2 class="text-lg font-bold text-gray-800 mb-4">
          <i class="fas fa-bolt ml-2 gold-accent"></i>
          إجراءات سريعة
        </h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/dashboard/new-case" class="p-4 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-blue-500 hover:bg-blue-50 transition-all">
            <i class="fas fa-plus-circle text-3xl text-blue-600 mb-2"></i>
            <p class="font-semibold">قضية جديدة</p>
          </a>
          <a href="/search" class="p-4 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-green-500 hover:bg-green-50 transition-all">
            <i class="fas fa-search text-3xl text-green-600 mb-2"></i>
            <p class="font-semibold">ابحث عن محامي</p>
          </a>
          <a href="/dashboard/consultations" class="p-4 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-purple-500 hover:bg-purple-50 transition-all">
            <i class="fas fa-calendar-plus text-3xl text-purple-600 mb-2"></i>
            <p class="font-semibold">حجز استشارة</p>
          </a>
          <a href="/calculator" class="p-4 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-orange-500 hover:bg-orange-50 transition-all">
            <i class="fas fa-calculator text-3xl text-orange-500 mb-2"></i>
            <p class="font-semibold">حاسبة المواريث</p>
          </a>
        </div>
      </div>
    </main>
  </div>
  
  ${footer}
  ${authScript}
  
  <script>
    // Check auth
    if (!requireAuth('client')) {
      // Redirect handled by requireAuth
    }
    
    // Load dashboard data
    async function loadDashboard() {
      const profile = JSON.parse(localStorage.getItem('hoqouqi_profile') || '{}');
      if (!profile.id) {
        document.getElementById('active-cases-list').innerHTML = '<p class="text-center text-gray-500 py-4">لا توجد بيانات</p>';
        return;
      }
      
      try {
        const response = await apiCall('/api/users/clients/' + profile.id + '/dashboard');
        if (response.success) {
          const data = response.data;
          
          // Update stats
          document.getElementById('active-cases').textContent = data.stats?.active_cases || 0;
          document.getElementById('completed-cases').textContent = data.stats?.completed_cases || 0;
          document.getElementById('total-paid').textContent = formatCurrency(data.payments?.total_paid || 0);
          document.getElementById('new-messages').textContent = data.notifications?.filter(n => !n.is_read).length || 0;
          
          // Update name
          if (data.client?.full_name) {
            document.getElementById('sidebar-user-name').textContent = data.client.full_name;
          }
          
          // Active cases list
          const casesList = document.getElementById('active-cases-list');
          if (data.active_cases && data.active_cases.length > 0) {
            casesList.innerHTML = data.active_cases.map(c => \`
              <a href="/dashboard/cases/\${c.id}" class="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-semibold text-gray-800">\${c.title}</h3>
                  \${getStatusBadge(c.status)}
                </div>
                <div class="flex items-center text-sm text-gray-500">
                  <span class="ml-4"><i class="fas fa-user-tie ml-1"></i> \${c.lawyer_name || 'بانتظار التعيين'}</span>
                  <span><i class="fas fa-calendar ml-1"></i> \${formatDate(c.created_at)}</span>
                </div>
              </a>
            \`).join('');
          } else {
            casesList.innerHTML = '<p class="text-center text-gray-500 py-4">لا توجد قضايا نشطة</p>';
          }
          
          // Notifications
          const notifList = document.getElementById('notifications-list');
          if (data.notifications && data.notifications.length > 0) {
            notifList.innerHTML = data.notifications.slice(0, 5).map(n => \`
              <div class="flex items-start p-3 rounded-lg \${n.is_read ? 'bg-gray-50' : 'bg-blue-50'}">
                <i class="fas fa-bell text-blue-600 mt-1 ml-3"></i>
                <div>
                  <p class="text-sm font-semibold">\${n.title}</p>
                  <p class="text-xs text-gray-500">\${n.message}</p>
                </div>
              </div>
            \`).join('');
          } else {
            notifList.innerHTML = '<p class="text-center text-gray-500 py-4">لا توجد إشعارات</p>';
          }
        }
      } catch (error) {
        console.error('Error loading dashboard:', error);
      }
    }
    
    loadDashboard();
  </script>
</body>
</html>
`;
  return c.html(html);
});

// صفحة قضايا العميل
clientPages.get('/dashboard/cases', async (c) => {
  const html = `
${htmlHead('قضاياي')}
<body class="bg-gray-100">
  ${navbar(true, 'client')}
  
  <div class="flex">
    ${dashboardSidebar('client', 'cases')}
    
    <main class="flex-1 mr-64 p-8">
      <div class="flex items-center justify-between mb-6">
        <h1 class="text-2xl font-bold text-gray-800">قضاياي</h1>
        <a href="/dashboard/new-case" class="px-6 py-2 gold-bg text-gray-900 font-semibold rounded-lg hover:opacity-90 transition-all">
          <i class="fas fa-plus ml-2"></i>
          قضية جديدة
        </a>
      </div>
      
      <!-- Filters -->
      <div class="bg-white rounded-xl shadow-lg p-4 mb-6">
        <div class="flex flex-wrap gap-4">
          <select id="status-filter" class="px-4 py-2 border rounded-lg" onchange="filterCases()">
            <option value="">كل الحالات</option>
            <option value="pending">قيد الانتظار</option>
            <option value="in_progress">جارية</option>
            <option value="completed">مكتملة</option>
          </select>
          <select id="type-filter" class="px-4 py-2 border rounded-lg" onchange="filterCases()">
            <option value="">كل الأنواع</option>
            <option value="criminal">جنائي</option>
            <option value="civil">مدني</option>
            <option value="family">أحوال شخصية</option>
            <option value="commercial">تجاري</option>
          </select>
        </div>
      </div>
      
      <!-- Cases List -->
      <div id="cases-list" class="space-y-4">
        <div class="text-center py-12 text-gray-400">
          <i class="fas fa-spinner fa-spin text-3xl"></i>
        </div>
      </div>
    </main>
  </div>
  
  ${footer}
  ${authScript}
  
  <script>
    if (!requireAuth('client')) {}
    
    const caseTypes = ${JSON.stringify(specNames)};
    let allCases = [];
    
    async function loadCases() {
      const profile = JSON.parse(localStorage.getItem('hoqouqi_profile') || '{}');
      if (!profile.id) return;
      
      try {
        const response = await apiCall('/api/cases/client/' + profile.id);
        if (response.success) {
          allCases = response.data;
          renderCases(allCases);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
    
    function renderCases(cases) {
      const container = document.getElementById('cases-list');
      if (cases.length === 0) {
        container.innerHTML = \`
          <div class="text-center py-12">
            <i class="fas fa-folder-open text-6xl text-gray-300 mb-4"></i>
            <p class="text-gray-500 text-xl">لا توجد قضايا</p>
            <a href="/dashboard/new-case" class="mt-4 inline-block px-6 py-2 gold-bg text-gray-900 font-semibold rounded-lg">
              إنشاء قضية جديدة
            </a>
          </div>
        \`;
        return;
      }
      
      container.innerHTML = cases.map(c => \`
        <div class="bg-white rounded-xl shadow-lg p-6 card-hover">
          <div class="flex items-start justify-between mb-4">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <h3 class="text-lg font-bold text-gray-800">\${c.title}</h3>
                \${getStatusBadge(c.status)}
              </div>
              <p class="text-gray-600 text-sm">\${c.description?.substring(0, 100) || ''}...</p>
            </div>
            <span class="text-sm text-gray-400">#\${c.case_number || c.id}</span>
          </div>
          
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t pt-4">
            <div>
              <span class="text-gray-500">النوع:</span>
              <span class="font-semibold mr-1">\${caseTypes[c.case_type] || c.case_type}</span>
            </div>
            <div>
              <span class="text-gray-500">المحامي:</span>
              <span class="font-semibold mr-1">\${c.lawyer_name || 'بانتظار التعيين'}</span>
            </div>
            <div>
              <span class="text-gray-500">تاريخ الإنشاء:</span>
              <span class="font-semibold mr-1">\${formatDate(c.created_at)}</span>
            </div>
            <div>
              <span class="text-gray-500">الأتعاب:</span>
              <span class="font-semibold mr-1">\${c.agreed_fee ? formatCurrency(c.agreed_fee) : 'غير محدد'}</span>
            </div>
          </div>
          
          <div class="flex gap-3 mt-4 pt-4 border-t">
            <a href="/dashboard/cases/\${c.id}" class="flex-1 text-center py-2 border-2 border-blue-900 text-blue-900 rounded-lg font-semibold hover:bg-blue-900 hover:text-white transition-all">
              <i class="fas fa-eye ml-1"></i>
              عرض التفاصيل
            </a>
            \${c.lawyer_id ? \`
              <a href="/dashboard/messages?case=\${c.id}" class="flex-1 text-center py-2 gold-bg text-gray-900 rounded-lg font-semibold hover:opacity-90 transition-all">
                <i class="fas fa-comment ml-1"></i>
                مراسلة المحامي
              </a>
            \` : ''}
          </div>
        </div>
      \`).join('');
    }
    
    function filterCases() {
      const status = document.getElementById('status-filter').value;
      const type = document.getElementById('type-filter').value;
      
      let filtered = allCases;
      if (status) filtered = filtered.filter(c => c.status === status);
      if (type) filtered = filtered.filter(c => c.case_type === type);
      
      renderCases(filtered);
    }
    
    loadCases();
  </script>
</body>
</html>
`;
  return c.html(html);
});

// صفحة إنشاء قضية جديدة
clientPages.get('/dashboard/new-case', async (c) => {
  const html = `
${htmlHead('قضية جديدة')}
<body class="bg-gray-100">
  ${navbar(true, 'client')}
  
  <div class="flex">
    ${dashboardSidebar('client', 'new-case')}
    
    <main class="flex-1 mr-64 p-8">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">إنشاء قضية جديدة</h1>
      
      <div class="bg-white rounded-xl shadow-lg p-8">
        <form id="new-case-form" class="space-y-6">
          <!-- Step indicator -->
          <div class="flex items-center justify-center mb-8">
            <div class="flex items-center">
              <div class="w-10 h-10 rounded-full gradient-bg text-white flex items-center justify-center font-bold" id="step1-indicator">1</div>
              <div class="w-24 h-1 bg-gray-300" id="step1-line"></div>
              <div class="w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold" id="step2-indicator">2</div>
              <div class="w-24 h-1 bg-gray-300" id="step2-line"></div>
              <div class="w-10 h-10 rounded-full bg-gray-300 text-gray-600 flex items-center justify-center font-bold" id="step3-indicator">3</div>
            </div>
          </div>
          
          <!-- Step 1: Case Info -->
          <div id="step1" class="space-y-4">
            <h2 class="text-xl font-bold text-gray-800 mb-4">معلومات القضية</h2>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">نوع القضية *</label>
              <select name="case_type" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="">اختر نوع القضية</option>
                <option value="criminal">جنائي</option>
                <option value="civil">مدني</option>
                <option value="family">أحوال شخصية</option>
                <option value="commercial">تجاري</option>
                <option value="administrative">إداري</option>
                <option value="labor">عمالي</option>
                <option value="sharia">شرعي</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">تصنيف القضية</label>
              <select name="case_category" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" id="case-category">
                <option value="">اختر التصنيف</option>
              </select>
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">عنوان القضية *</label>
              <input type="text" name="title" required class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="مثال: قضية نصب واحتيال">
            </div>
            
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">وصف تفصيلي للقضية *</label>
              <textarea name="description" required rows="5" class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" placeholder="اشرح تفاصيل القضية بشكل واضح..."></textarea>
            </div>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">المحافظة *</label>
                <select name="governorate" required class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                  <option value="">اختر المحافظة</option>
                  <option value="القاهرة">القاهرة</option>
                  <option value="الجيزة">الجيزة</option>
                  <option value="الإسكندرية">الإسكندرية</option>
                  <option value="الدقهلية">الدقهلية</option>
                  <option value="الشرقية">الشرقية</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">درجة الاستعجال</label>
                <select name="urgency" class="w-full px-4 py-3 border border-gray-300 rounded-lg">
                  <option value="normal">عادي</option>
                  <option value="medium">متوسط</option>
                  <option value="urgent">عاجل</option>
                </select>
              </div>
            </div>
            
            <button type="button" onclick="nextStep(2)" class="w-full py-3 gold-bg text-gray-900 font-bold rounded-lg hover:opacity-90 transition-all">
              التالي <i class="fas fa-arrow-left mr-2"></i>
            </button>
          </div>
          
          <!-- Step 2: Choose Lawyer -->
          <div id="step2" class="space-y-4 hidden">
            <h2 class="text-xl font-bold text-gray-800 mb-4">اختر محامي</h2>
            
            <div class="bg-blue-50 p-4 rounded-lg mb-4">
              <p class="text-blue-800">
                <i class="fas fa-info-circle ml-2"></i>
                بناءً على معلومات قضيتك، إليك أفضل المحامين المتخصصين:
              </p>
            </div>
            
            <div id="matched-lawyers" class="space-y-4">
              <div class="text-center py-8 text-gray-400">
                <i class="fas fa-spinner fa-spin text-2xl"></i>
              </div>
            </div>
            
            <input type="hidden" name="lawyer_id" id="selected-lawyer">
            
            <div class="flex gap-4">
              <button type="button" onclick="prevStep(1)" class="flex-1 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition-all">
                <i class="fas fa-arrow-right ml-2"></i> السابق
              </button>
              <button type="button" onclick="nextStep(3)" class="flex-1 py-3 gold-bg text-gray-900 font-bold rounded-lg hover:opacity-90 transition-all">
                التالي <i class="fas fa-arrow-left mr-2"></i>
              </button>
            </div>
          </div>
          
          <!-- Step 3: Confirm -->
          <div id="step3" class="space-y-4 hidden">
            <h2 class="text-xl font-bold text-gray-800 mb-4">تأكيد البيانات</h2>
            
            <div class="bg-gray-50 rounded-lg p-6" id="case-summary">
              <!-- Summary will be inserted here -->
            </div>
            
            <div class="bg-yellow-50 p-4 rounded-lg">
              <p class="text-yellow-800 text-sm">
                <i class="fas fa-exclamation-triangle ml-2"></i>
                بالضغط على "إنشاء القضية"، أنت توافق على شروط الخدمة وسيتم إرسال طلبك للمحامي المختار.
              </p>
            </div>
            
            <div class="flex gap-4">
              <button type="button" onclick="prevStep(2)" class="flex-1 py-3 border-2 border-gray-300 text-gray-700 font-bold rounded-lg hover:bg-gray-100 transition-all">
                <i class="fas fa-arrow-right ml-2"></i> السابق
              </button>
              <button type="submit" class="flex-1 py-3 gradient-bg text-white font-bold rounded-lg hover:opacity-90 transition-all">
                <i class="fas fa-check ml-2"></i> إنشاء القضية
              </button>
            </div>
          </div>
          
          <div id="form-error" class="hidden p-4 bg-red-100 text-red-700 rounded-lg"></div>
          <div id="form-success" class="hidden p-4 bg-green-100 text-green-700 rounded-lg"></div>
        </form>
      </div>
    </main>
  </div>
  
  ${footer}
  ${authScript}
  
  <script>
    if (!requireAuth('client')) {}
    
    const caseCategories = {
      criminal: [
        { value: 'murder', label: 'قتل' },
        { value: 'theft', label: 'سرقة' },
        { value: 'fraud', label: 'نصب واحتيال' },
        { value: 'drugs', label: 'مخدرات' },
        { value: 'assault', label: 'ضرب وإيذاء' }
      ],
      civil: [
        { value: 'contracts', label: 'عقود' },
        { value: 'property', label: 'عقارات' },
        { value: 'compensation', label: 'تعويضات' }
      ],
      family: [
        { value: 'divorce', label: 'طلاق' },
        { value: 'khula', label: 'خلع' },
        { value: 'custody', label: 'حضانة' },
        { value: 'alimony', label: 'نفقة' }
      ],
      commercial: [
        { value: 'company_formation', label: 'تأسيس شركات' },
        { value: 'contracts', label: 'عقود تجارية' },
        { value: 'disputes', label: 'نزاعات تجارية' }
      ],
      administrative: [
        { value: 'employee_disputes', label: 'نزاعات موظفين' },
        { value: 'compensation', label: 'تعويضات' }
      ],
      labor: [
        { value: 'wages', label: 'أجور' },
        { value: 'unfair_dismissal', label: 'فصل تعسفي' }
      ],
      sharia: [
        { value: 'inheritance', label: 'مواريث' },
        { value: 'waqf', label: 'أوقاف' }
      ]
    };
    
    // Update categories on type change
    document.querySelector('select[name="case_type"]').addEventListener('change', function() {
      const categories = caseCategories[this.value] || [];
      const categorySelect = document.getElementById('case-category');
      categorySelect.innerHTML = '<option value="">اختر التصنيف</option>' + 
        categories.map(c => '<option value="' + c.value + '">' + c.label + '</option>').join('');
    });
    
    let currentStep = 1;
    let selectedLawyer = null;
    
    function nextStep(step) {
      // Validate current step
      if (currentStep === 1) {
        const form = document.getElementById('new-case-form');
        const type = form.case_type.value;
        const title = form.title.value;
        const desc = form.description.value;
        const gov = form.governorate.value;
        
        if (!type || !title || !desc || !gov) {
          alert('يرجى ملء جميع الحقول المطلوبة');
          return;
        }
        
        // Load matched lawyers
        loadMatchedLawyers();
      }
      
      if (currentStep === 2) {
        if (!selectedLawyer) {
          alert('يرجى اختيار محامي');
          return;
        }
        updateSummary();
      }
      
      document.getElementById('step' + currentStep).classList.add('hidden');
      document.getElementById('step' + step).classList.remove('hidden');
      
      // Update indicators
      for (let i = 1; i <= 3; i++) {
        const indicator = document.getElementById('step' + i + '-indicator');
        if (i <= step) {
          indicator.classList.remove('bg-gray-300', 'text-gray-600');
          indicator.classList.add('gradient-bg', 'text-white');
        } else {
          indicator.classList.add('bg-gray-300', 'text-gray-600');
          indicator.classList.remove('gradient-bg', 'text-white');
        }
      }
      
      currentStep = step;
    }
    
    function prevStep(step) {
      document.getElementById('step' + currentStep).classList.add('hidden');
      document.getElementById('step' + step).classList.remove('hidden');
      currentStep = step;
    }
    
    async function loadMatchedLawyers() {
      const form = document.getElementById('new-case-form');
      const criteria = {
        case_type: form.case_type.value,
        case_category: form.case_category.value,
        governorate: form.governorate.value,
        urgency: form.urgency.value
      };
      
      try {
        const response = await apiCall('/api/lawyers/match', 'POST', criteria);
        const container = document.getElementById('matched-lawyers');
        
        if (response.success && response.data.length > 0) {
          container.innerHTML = response.data.map(lawyer => \`
            <div class="border-2 rounded-xl p-4 cursor-pointer transition-all \${selectedLawyer?.id === lawyer.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}" onclick="selectLawyer(\${JSON.stringify(lawyer).replace(/"/g, '&quot;')})">
              <div class="flex items-start gap-4">
                <div class="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xl font-bold">
                  \${lawyer.full_name.charAt(0)}
                </div>
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <h3 class="font-bold text-gray-800">\${lawyer.full_name}</h3>
                    <span class="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                      \${lawyer.match_score}% تطابق
                    </span>
                  </div>
                  <p class="text-sm text-gray-500">\${lawyer.bar_level === 'cassation' ? 'نقض' : lawyer.bar_level === 'appeal' ? 'استئناف' : 'ابتدائي'} • \${lawyer.governorate}</p>
                  <div class="flex items-center gap-4 mt-2 text-sm">
                    <span class="text-yellow-500">⭐ \${lawyer.avg_rating}</span>
                    <span class="text-green-600">\${lawyer.success_rate?.toFixed(0)}% نجاح</span>
                    <span class="text-gray-500">\${lawyer.years_of_experience} سنة خبرة</span>
                  </div>
                  <p class="text-sm text-blue-600 mt-1">
                    الأتعاب المتوقعة: \${formatCurrency(lawyer.estimated_fee_range?.min || 3000)} - \${formatCurrency(lawyer.estimated_fee_range?.max || 10000)}
                  </p>
                </div>
              </div>
            </div>
          \`).join('');
        } else {
          container.innerHTML = '<p class="text-center text-gray-500 py-4">لا يوجد محامين متاحين حالياً</p>';
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
    
    function selectLawyer(lawyer) {
      selectedLawyer = lawyer;
      document.getElementById('selected-lawyer').value = lawyer.id;
      loadMatchedLawyers(); // Re-render to show selection
    }
    
    function updateSummary() {
      const form = document.getElementById('new-case-form');
      const caseTypes = ${JSON.stringify(specNames)};
      
      document.getElementById('case-summary').innerHTML = \`
        <div class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <span class="text-gray-500">نوع القضية:</span>
              <p class="font-semibold">\${caseTypes[form.case_type.value] || form.case_type.value}</p>
            </div>
            <div>
              <span class="text-gray-500">المحافظة:</span>
              <p class="font-semibold">\${form.governorate.value}</p>
            </div>
          </div>
          <div>
            <span class="text-gray-500">العنوان:</span>
            <p class="font-semibold">\${form.title.value}</p>
          </div>
          <div>
            <span class="text-gray-500">الوصف:</span>
            <p class="font-semibold text-sm">\${form.description.value}</p>
          </div>
          \${selectedLawyer ? \`
            <div class="border-t pt-4">
              <span class="text-gray-500">المحامي المختار:</span>
              <p class="font-semibold">\${selectedLawyer.full_name}</p>
              <p class="text-sm text-gray-500">\${selectedLawyer.governorate} • \${selectedLawyer.years_of_experience} سنة خبرة</p>
            </div>
          \` : ''}
        </div>
      \`;
    }
    
    // Form submission
    document.getElementById('new-case-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const profile = JSON.parse(localStorage.getItem('hoqouqi_profile') || '{}');
      if (!profile.id) {
        alert('يرجى تسجيل الدخول أولاً');
        return;
      }
      
      const formData = new FormData(e.target);
      const data = {
        client_id: profile.id,
        case_type: formData.get('case_type'),
        case_category: formData.get('case_category'),
        title: formData.get('title'),
        description: formData.get('description'),
        governorate: formData.get('governorate'),
        urgency: formData.get('urgency')
      };
      
      try {
        // Create case
        const caseResponse = await apiCall('/api/cases', 'POST', data);
        
        if (caseResponse.success) {
          // If lawyer selected, assign
          if (selectedLawyer) {
            await apiCall('/api/cases/' + caseResponse.data.id + '/assign-lawyer', 'POST', {
              lawyer_id: selectedLawyer.id,
              agreed_fee: selectedLawyer.estimated_fee_range?.min || 5000
            });
          }
          
          document.getElementById('form-success').textContent = 'تم إنشاء القضية بنجاح!';
          document.getElementById('form-success').classList.remove('hidden');
          
          setTimeout(() => {
            window.location.href = '/dashboard/cases/' + caseResponse.data.id;
          }, 2000);
        } else {
          document.getElementById('form-error').textContent = caseResponse.error;
          document.getElementById('form-error').classList.remove('hidden');
        }
      } catch (error) {
        document.getElementById('form-error').textContent = 'حدث خطأ. حاول مرة أخرى.';
        document.getElementById('form-error').classList.remove('hidden');
      }
    });
  </script>
</body>
</html>
`;
  return c.html(html);
});

// صفحة تفاصيل القضية
clientPages.get('/dashboard/cases/:id', async (c) => {
  const caseId = c.req.param('id');
  
  const html = `
${htmlHead('تفاصيل القضية')}
<body class="bg-gray-100">
  ${navbar(true, 'client')}
  
  <div class="flex">
    ${dashboardSidebar('client', 'cases')}
    
    <main class="flex-1 mr-64 p-8">
      <div class="mb-6">
        <a href="/dashboard/cases" class="text-blue-600 hover:underline">
          <i class="fas fa-arrow-right ml-2"></i>
          العودة للقضايا
        </a>
      </div>
      
      <div id="case-details" class="space-y-6">
        <div class="text-center py-12 text-gray-400">
          <i class="fas fa-spinner fa-spin text-3xl"></i>
        </div>
      </div>
    </main>
  </div>
  
  ${footer}
  ${authScript}
  
  <script>
    if (!requireAuth('client')) {}
    
    const caseId = ${caseId};
    const caseTypes = ${JSON.stringify(specNames)};
    
    async function loadCaseDetails() {
      try {
        const response = await apiCall('/api/cases/' + caseId);
        
        if (response.success) {
          renderCaseDetails(response.data);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
    
    function renderCaseDetails(data) {
      const container = document.getElementById('case-details');
      
      container.innerHTML = \`
        <!-- Header -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-start justify-between">
            <div>
              <div class="flex items-center gap-3 mb-2">
                <h1 class="text-2xl font-bold text-gray-800">\${data.title}</h1>
                \${getStatusBadge(data.status)}
              </div>
              <p class="text-gray-500">رقم القضية: #\${data.case_number || data.id}</p>
            </div>
            <div class="text-left">
              <p class="text-sm text-gray-500">تاريخ الإنشاء</p>
              <p class="font-semibold">\${formatDate(data.created_at)}</p>
            </div>
          </div>
        </div>
        
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main Info -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Description -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h2 class="text-lg font-bold text-gray-800 mb-4">
                <i class="fas fa-file-alt ml-2 gold-accent"></i>
                تفاصيل القضية
              </h2>
              <div class="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <span class="text-gray-500">النوع:</span>
                  <p class="font-semibold">\${caseTypes[data.case_type] || data.case_type}</p>
                </div>
                <div>
                  <span class="text-gray-500">المحافظة:</span>
                  <p class="font-semibold">\${data.governorate || '-'}</p>
                </div>
                <div>
                  <span class="text-gray-500">المحكمة:</span>
                  <p class="font-semibold">\${data.court_name || 'غير محدد'}</p>
                </div>
                <div>
                  <span class="text-gray-500">الاستعجال:</span>
                  <p class="font-semibold">\${data.urgency === 'urgent' ? 'عاجل' : data.urgency === 'medium' ? 'متوسط' : 'عادي'}</p>
                </div>
              </div>
              <div>
                <span class="text-gray-500">الوصف:</span>
                <p class="mt-2 text-gray-700">\${data.description}</p>
              </div>
            </div>
            
            <!-- Timeline -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h2 class="text-lg font-bold text-gray-800 mb-4">
                <i class="fas fa-history ml-2 gold-accent"></i>
                الخط الزمني للقضية
              </h2>
              <div class="space-y-4">
                \${data.timeline && data.timeline.length > 0 ? data.timeline.map((item, index) => \`
                  <div class="flex items-start">
                    <div class="w-10 h-10 rounded-full \${item.is_completed ? 'bg-green-500' : 'bg-gray-300'} flex items-center justify-center text-white ml-4">
                      <i class="fas \${item.is_completed ? 'fa-check' : 'fa-clock'}"></i>
                    </div>
                    <div class="flex-1 pb-4 \${index < data.timeline.length - 1 ? 'border-r-2 border-gray-200 pr-4 mr-5' : ''}">
                      <h3 class="font-semibold text-gray-800">\${item.title}</h3>
                      <p class="text-sm text-gray-500">\${item.description || ''}</p>
                      <p class="text-xs text-gray-400 mt-1">\${formatDate(item.created_at)}</p>
                      \${item.hearing_date ? '<p class="text-xs text-blue-600 mt-1"><i class="fas fa-calendar ml-1"></i>جلسة: ' + formatDate(item.hearing_date) + '</p>' : ''}
                    </div>
                  </div>
                \`).join('') : '<p class="text-center text-gray-500">لا توجد تحديثات بعد</p>'}
              </div>
            </div>
            
            <!-- Documents -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h2 class="text-lg font-bold text-gray-800 mb-4">
                <i class="fas fa-folder ml-2 gold-accent"></i>
                المستندات
              </h2>
              \${data.documents && data.documents.length > 0 ? \`
                <div class="space-y-2">
                  \${data.documents.map(doc => \`
                    <a href="\${doc.file_url}" target="_blank" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100">
                      <div class="flex items-center">
                        <i class="fas fa-file-pdf text-red-500 ml-3 text-xl"></i>
                        <span>\${doc.file_name}</span>
                      </div>
                      <i class="fas fa-download text-blue-600"></i>
                    </a>
                  \`).join('')}
                </div>
              \` : '<p class="text-center text-gray-500">لا توجد مستندات</p>'}
            </div>
          </div>
          
          <!-- Sidebar -->
          <div class="space-y-6">
            <!-- Lawyer Info -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h2 class="text-lg font-bold text-gray-800 mb-4">
                <i class="fas fa-user-tie ml-2 gold-accent"></i>
                المحامي
              </h2>
              \${data.lawyer_name ? \`
                <div class="text-center">
                  <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl font-bold mb-3">
                    \${data.lawyer_name.charAt(0)}
                  </div>
                  <h3 class="font-bold text-gray-800">\${data.lawyer_name}</h3>
                  <p class="text-sm text-gray-500 mb-4">\${data.bar_level === 'cassation' ? 'محامي نقض' : 'محامي استئناف'}</p>
                  <a href="/dashboard/messages?case=\${data.id}" class="block w-full py-2 gold-bg text-gray-900 rounded-lg font-semibold hover:opacity-90">
                    <i class="fas fa-comment ml-1"></i>
                    مراسلة
                  </a>
                </div>
              \` : \`
                <div class="text-center py-4">
                  <i class="fas fa-user-slash text-4xl text-gray-300 mb-2"></i>
                  <p class="text-gray-500">لم يتم تعيين محامي بعد</p>
                  <a href="/search" class="mt-3 inline-block text-blue-600 hover:underline">ابحث عن محامي</a>
                </div>
              \`}
            </div>
            
            <!-- Payment Info -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h2 class="text-lg font-bold text-gray-800 mb-4">
                <i class="fas fa-credit-card ml-2 gold-accent"></i>
                المدفوعات
              </h2>
              <div class="space-y-3">
                <div class="flex justify-between">
                  <span class="text-gray-500">الأتعاب المتفق عليها:</span>
                  <span class="font-bold">\${data.agreed_fee ? formatCurrency(data.agreed_fee) : 'غير محدد'}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-500">حالة الدفع:</span>
                  <span class="font-semibold \${data.payment_status === 'completed' ? 'text-green-600' : 'text-yellow-600'}">
                    \${data.payment_status === 'completed' ? 'مكتمل' : data.payment_status === 'partial' ? 'جزئي' : 'معلق'}
                  </span>
                </div>
              </div>
              \${data.payment_status !== 'completed' && data.agreed_fee ? \`
                <button onclick="makePayment()" class="mt-4 w-full py-2 gradient-bg text-white rounded-lg font-semibold hover:opacity-90">
                  <i class="fas fa-money-bill ml-1"></i>
                  دفع الآن
                </button>
              \` : ''}
            </div>
          </div>
        </div>
      \`;
    }
    
    loadCaseDetails();
  </script>
</body>
</html>
`;
  return c.html(html);
});

// صفحة الرسائل
clientPages.get('/dashboard/messages', async (c) => {
  const caseIdParam = c.req.query('case');
  
  const html = `
${htmlHead('الرسائل')}
<body class="bg-gray-100">
  ${navbar(true, 'client')}
  
  <div class="flex">
    ${dashboardSidebar('client', 'messages')}
    
    <main class="flex-1 mr-64 p-8">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">الرسائل</h1>
      
      <div class="bg-white rounded-xl shadow-lg overflow-hidden" style="height: calc(100vh - 200px);">
        <div class="flex h-full">
          <!-- Conversations List -->
          <div class="w-1/3 border-l overflow-y-auto">
            <div class="p-4 border-b">
              <input type="text" placeholder="بحث..." class="w-full px-4 py-2 border rounded-lg">
            </div>
            <div id="conversations-list" class="divide-y">
              <div class="text-center py-8 text-gray-400">
                <i class="fas fa-spinner fa-spin text-2xl"></i>
              </div>
            </div>
          </div>
          
          <!-- Chat Area -->
          <div class="flex-1 flex flex-col">
            <div id="chat-header" class="p-4 border-b bg-gray-50">
              <p class="text-gray-500 text-center">اختر محادثة للبدء</p>
            </div>
            
            <div id="messages-container" class="flex-1 overflow-y-auto p-4 space-y-4">
              <!-- Messages will be loaded here -->
            </div>
            
            <div id="message-input-area" class="p-4 border-t hidden">
              <form id="send-message-form" class="flex gap-3">
                <input type="text" name="message" placeholder="اكتب رسالتك..." class="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                <button type="submit" class="px-6 py-2 gold-bg text-gray-900 font-semibold rounded-lg hover:opacity-90">
                  <i class="fas fa-paper-plane"></i>
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
  
  ${footer}
  ${authScript}
  
  <script>
    if (!requireAuth('client')) {}
    
    let currentCaseId = ${caseIdParam ? caseIdParam : 'null'};
    let currentLawyerId = null;
    const profile = JSON.parse(localStorage.getItem('hoqouqi_profile') || '{}');
    const user = JSON.parse(localStorage.getItem('hoqouqi_user') || '{}');
    
    async function loadConversations() {
      if (!profile.id) return;
      
      try {
        const response = await apiCall('/api/cases/client/' + profile.id);
        const container = document.getElementById('conversations-list');
        
        if (response.success && response.data.length > 0) {
          const casesWithLawyers = response.data.filter(c => c.lawyer_id);
          
          if (casesWithLawyers.length > 0) {
            container.innerHTML = casesWithLawyers.map(c => \`
              <div class="p-4 cursor-pointer hover:bg-gray-50 \${currentCaseId == c.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''}" onclick="selectConversation(\${c.id}, \${c.lawyer_id}, '\${c.lawyer_name}', '\${c.title}')">
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
                    \${c.lawyer_name?.charAt(0) || 'م'}
                  </div>
                  <div class="flex-1 min-w-0">
                    <h3 class="font-semibold text-gray-800 truncate">\${c.lawyer_name}</h3>
                    <p class="text-sm text-gray-500 truncate">\${c.title}</p>
                  </div>
                </div>
              </div>
            \`).join('');
            
            // Auto-select if case ID provided
            if (currentCaseId) {
              const selectedCase = casesWithLawyers.find(c => c.id == currentCaseId);
              if (selectedCase) {
                selectConversation(selectedCase.id, selectedCase.lawyer_id, selectedCase.lawyer_name, selectedCase.title);
              }
            }
          } else {
            container.innerHTML = '<p class="text-center text-gray-500 p-4">لا توجد محادثات</p>';
          }
        } else {
          container.innerHTML = '<p class="text-center text-gray-500 p-4">لا توجد محادثات</p>';
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
    
    async function selectConversation(caseId, lawyerId, lawyerName, caseTitle) {
      currentCaseId = caseId;
      currentLawyerId = lawyerId;
      
      // Update header
      document.getElementById('chat-header').innerHTML = \`
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold">
            \${lawyerName.charAt(0)}
          </div>
          <div>
            <h3 class="font-semibold text-gray-800">\${lawyerName}</h3>
            <p class="text-xs text-gray-500">\${caseTitle}</p>
          </div>
        </div>
      \`;
      
      // Show input area
      document.getElementById('message-input-area').classList.remove('hidden');
      
      // Load messages
      await loadMessages();
      
      // Update conversation list styling
      loadConversations();
    }
    
    async function loadMessages() {
      if (!currentCaseId) return;
      
      try {
        const response = await apiCall('/api/messages?case_id=' + currentCaseId);
        const container = document.getElementById('messages-container');
        
        if (response.success && response.data && response.data.length > 0) {
          container.innerHTML = response.data.map(msg => \`
            <div class="message-bubble \${msg.sender_id === user.id ? 'message-sent' : 'message-received'}">
              <p>\${msg.content}</p>
              <span class="text-xs opacity-70 mt-1 block">\${new Date(msg.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          \`).join('');
          
          container.scrollTop = container.scrollHeight;
        } else {
          container.innerHTML = '<p class="text-center text-gray-400 py-8">لا توجد رسائل. ابدأ المحادثة!</p>';
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
    
    // Send message
    document.getElementById('send-message-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const input = e.target.message;
      const content = input.value.trim();
      if (!content || !currentCaseId || !currentLawyerId) return;
      
      try {
        const response = await apiCall('/api/messages', 'POST', {
          case_id: currentCaseId,
          sender_id: user.id,
          receiver_id: currentLawyerId,
          content: content
        });
        
        if (response.success) {
          input.value = '';
          loadMessages();
        }
      } catch (error) {
        console.error('Error:', error);
      }
    });
    
    loadConversations();
  </script>
</body>
</html>
`;
  return c.html(html);
});

export default clientPages;
