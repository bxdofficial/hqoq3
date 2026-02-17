// Lawyer Dashboard Pages - صفحات لوحة تحكم المحامي
import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import { htmlHead, navbar, footer, dashboardSidebar, authScript, specNames, levelNames } from '../components/shared';

type Bindings = {
  DB: D1Database;
};

const lawyerPages = new Hono<{ Bindings: Bindings }>();

// لوحة التحكم الرئيسية للمحامي
lawyerPages.get('/lawyer/dashboard', async (c) => {
  const html = `
${htmlHead('لوحة تحكم المحامي')}
<body class="bg-gray-100">
  ${navbar(true, 'lawyer')}
  
  <div class="flex">
    ${dashboardSidebar('lawyer', 'home')}
    
    <main class="flex-1 mr-64 p-8">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">مرحباً بك في لوحة التحكم</h1>
      
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">القضايا النشطة</p>
              <p class="text-3xl font-bold text-blue-900" id="active-cases">0</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <i class="fas fa-briefcase text-blue-600 text-xl"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">طلبات جديدة</p>
              <p class="text-3xl font-bold text-orange-500" id="pending-requests">0</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <i class="fas fa-inbox text-orange-500 text-xl"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">الأرباح الكلية</p>
              <p class="text-3xl font-bold text-green-600" id="total-earnings">0</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <i class="fas fa-money-bill-wave text-green-600 text-xl"></i>
            </div>
          </div>
        </div>
        
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-gray-500 text-sm">متوسط التقييم</p>
              <p class="text-3xl font-bold text-yellow-500" id="avg-rating">0</p>
            </div>
            <div class="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <i class="fas fa-star text-yellow-500 text-xl"></i>
            </div>
          </div>
        </div>
      </div>
      
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- New Requests -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-800">
              <i class="fas fa-inbox ml-2 gold-accent"></i>
              طلبات جديدة
            </h2>
            <a href="/lawyer/requests" class="text-blue-600 text-sm hover:underline">عرض الكل</a>
          </div>
          <div id="requests-list" class="space-y-4">
            <div class="text-center py-8 text-gray-400">
              <i class="fas fa-spinner fa-spin text-2xl"></i>
            </div>
          </div>
        </div>
        
        <!-- Active Cases -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-800">
              <i class="fas fa-folder-open ml-2 gold-accent"></i>
              القضايا النشطة
            </h2>
            <a href="/lawyer/cases" class="text-blue-600 text-sm hover:underline">عرض الكل</a>
          </div>
          <div id="active-cases-list" class="space-y-4">
            <div class="text-center py-8 text-gray-400">
              <i class="fas fa-spinner fa-spin text-2xl"></i>
            </div>
          </div>
        </div>
        
        <!-- Upcoming Hearings -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-bold text-gray-800">
              <i class="fas fa-calendar ml-2 gold-accent"></i>
              الجلسات القادمة
            </h2>
          </div>
          <div id="hearings-list" class="space-y-4">
            <div class="text-center py-8 text-gray-400">
              <i class="fas fa-spinner fa-spin text-2xl"></i>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Recent Reviews -->
      <div class="mt-8 bg-white rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-bold text-gray-800">
            <i class="fas fa-star ml-2 gold-accent"></i>
            آخر التقييمات
          </h2>
          <a href="/lawyer/reviews" class="text-blue-600 text-sm hover:underline">عرض الكل</a>
        </div>
        <div id="reviews-list" class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="text-center py-8 text-gray-400 col-span-2">
            <i class="fas fa-spinner fa-spin text-2xl"></i>
          </div>
        </div>
      </div>
    </main>
  </div>
  
  ${footer}
  ${authScript}
  
  <script>
    if (!requireAuth('lawyer')) {}
    
    const caseTypes = ${JSON.stringify(specNames)};
    
    async function loadDashboard() {
      const profile = JSON.parse(localStorage.getItem('hoqouqi_profile') || '{}');
      if (!profile.id) {
        return;
      }
      
      try {
        const response = await apiCall('/api/users/lawyers/' + profile.id + '/dashboard');
        if (response.success) {
          const data = response.data;
          
          // Update stats
          document.getElementById('active-cases').textContent = data.stats?.active_cases || 0;
          document.getElementById('pending-requests').textContent = data.stats?.pending_cases || 0;
          document.getElementById('total-earnings').textContent = formatCurrency(data.earnings?.total_earnings || 0);
          document.getElementById('avg-rating').textContent = '⭐ ' + (data.lawyer?.avg_rating?.toFixed(1) || '0');
          
          // Update name
          if (data.lawyer?.full_name) {
            document.getElementById('sidebar-user-name').textContent = data.lawyer.full_name;
          }
          
          // Pending requests
          const requestsList = document.getElementById('requests-list');
          if (data.pending_requests && data.pending_requests.length > 0) {
            requestsList.innerHTML = data.pending_requests.map(r => \`
              <a href="/lawyer/requests/\${r.id}" class="block p-4 bg-orange-50 rounded-lg border border-orange-200 hover:bg-orange-100 transition-all">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-semibold text-gray-800">\${r.title}</h3>
                  <span class="text-xs bg-orange-500 text-white px-2 py-1 rounded-full">جديد</span>
                </div>
                <p class="text-sm text-gray-600">\${caseTypes[r.case_type] || r.case_type}</p>
                <p class="text-xs text-gray-500 mt-1"><i class="fas fa-user ml-1"></i> \${r.client_name}</p>
              </a>
            \`).join('');
          } else {
            requestsList.innerHTML = '<p class="text-center text-gray-500 py-4">لا توجد طلبات جديدة</p>';
          }
          
          // Active cases
          const casesList = document.getElementById('active-cases-list');
          if (data.active_cases && data.active_cases.length > 0) {
            casesList.innerHTML = data.active_cases.map(c => \`
              <a href="/lawyer/cases/\${c.id}" class="block p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-semibold text-gray-800">\${c.title}</h3>
                  \${getStatusBadge(c.status)}
                </div>
                <p class="text-sm text-gray-600">\${caseTypes[c.case_type] || c.case_type}</p>
                <p class="text-xs text-gray-500 mt-1"><i class="fas fa-user ml-1"></i> \${c.client_name}</p>
              </a>
            \`).join('');
          } else {
            casesList.innerHTML = '<p class="text-center text-gray-500 py-4">لا توجد قضايا نشطة</p>';
          }
          
          // Upcoming hearings
          const hearingsList = document.getElementById('hearings-list');
          if (data.upcoming_hearings && data.upcoming_hearings.length > 0) {
            hearingsList.innerHTML = data.upcoming_hearings.map(h => \`
              <div class="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div class="flex items-center justify-between mb-2">
                  <h3 class="font-semibold text-gray-800">\${h.case_title}</h3>
                </div>
                <p class="text-sm text-blue-600">
                  <i class="fas fa-calendar ml-1"></i>
                  \${formatDate(h.hearing_date)}
                </p>
                <p class="text-xs text-gray-500 mt-1">\${h.title}</p>
              </div>
            \`).join('');
          } else {
            hearingsList.innerHTML = '<p class="text-center text-gray-500 py-4">لا توجد جلسات قادمة</p>';
          }
          
          // Recent reviews
          const reviewsList = document.getElementById('reviews-list');
          if (data.recent_reviews && data.recent_reviews.length > 0) {
            reviewsList.innerHTML = data.recent_reviews.map(r => \`
              <div class="p-4 bg-gray-50 rounded-lg">
                <div class="flex items-center justify-between mb-2">
                  <span class="font-semibold">\${r.client_name}</span>
                  <span class="star-rating">\${'⭐'.repeat(r.overall_rating)}</span>
                </div>
                <p class="text-sm text-gray-600">\${r.comment || 'لا يوجد تعليق'}</p>
                <p class="text-xs text-gray-400 mt-2">\${formatDate(r.created_at)}</p>
              </div>
            \`).join('');
          } else {
            reviewsList.innerHTML = '<p class="text-center text-gray-500 py-4 col-span-2">لا توجد تقييمات بعد</p>';
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

// صفحة قضايا المحامي
lawyerPages.get('/lawyer/cases', async (c) => {
  const html = `
${htmlHead('قضاياي')}
<body class="bg-gray-100">
  ${navbar(true, 'lawyer')}
  
  <div class="flex">
    ${dashboardSidebar('lawyer', 'cases')}
    
    <main class="flex-1 mr-64 p-8">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">القضايا</h1>
      
      <!-- Filters -->
      <div class="bg-white rounded-xl shadow-lg p-4 mb-6">
        <div class="flex flex-wrap gap-4">
          <select id="status-filter" class="px-4 py-2 border rounded-lg" onchange="filterCases()">
            <option value="">كل الحالات</option>
            <option value="in_progress">جارية</option>
            <option value="completed">مكتملة</option>
          </select>
          <select id="type-filter" class="px-4 py-2 border rounded-lg" onchange="filterCases()">
            <option value="">كل الأنواع</option>
            <option value="criminal">جنائي</option>
            <option value="civil">مدني</option>
            <option value="family">أحوال شخصية</option>
            <option value="commercial">تجاري</option>
            <option value="administrative">إداري</option>
            <option value="labor">عمالي</option>
          </select>
          <div class="flex-1"></div>
          <div class="text-gray-500 text-sm flex items-center">
            <span id="cases-count">0</span> قضية
          </div>
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
    if (!requireAuth('lawyer')) {}
    
    const caseTypes = ${JSON.stringify(specNames)};
    let allCases = [];
    
    async function loadCases() {
      const profile = JSON.parse(localStorage.getItem('hoqouqi_profile') || '{}');
      if (!profile.id) return;
      
      try {
        const response = await apiCall('/api/cases/lawyer/' + profile.id);
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
      document.getElementById('cases-count').textContent = cases.length;
      
      if (cases.length === 0) {
        container.innerHTML = \`
          <div class="text-center py-12">
            <i class="fas fa-folder-open text-6xl text-gray-300 mb-4"></i>
            <p class="text-gray-500 text-xl">لا توجد قضايا</p>
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
                \${c.urgency === 'urgent' ? '<span class="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">عاجل</span>' : ''}
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
              <span class="text-gray-500">العميل:</span>
              <span class="font-semibold mr-1">\${c.client_name || '-'}</span>
            </div>
            <div>
              <span class="text-gray-500">تاريخ البدء:</span>
              <span class="font-semibold mr-1">\${formatDate(c.start_date || c.created_at)}</span>
            </div>
            <div>
              <span class="text-gray-500">الأتعاب:</span>
              <span class="font-semibold mr-1">\${c.agreed_fee ? formatCurrency(c.agreed_fee) : 'غير محدد'}</span>
            </div>
          </div>
          
          <div class="flex gap-3 mt-4 pt-4 border-t">
            <a href="/lawyer/cases/\${c.id}" class="flex-1 text-center py-2 border-2 border-blue-900 text-blue-900 rounded-lg font-semibold hover:bg-blue-900 hover:text-white transition-all">
              <i class="fas fa-eye ml-1"></i>
              عرض التفاصيل
            </a>
            <a href="/lawyer/messages?case=\${c.id}" class="flex-1 text-center py-2 gold-bg text-gray-900 rounded-lg font-semibold hover:opacity-90 transition-all">
              <i class="fas fa-comment ml-1"></i>
              مراسلة العميل
            </a>
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

// صفحة الطلبات الجديدة
lawyerPages.get('/lawyer/requests', async (c) => {
  const html = `
${htmlHead('الطلبات الجديدة')}
<body class="bg-gray-100">
  ${navbar(true, 'lawyer')}
  
  <div class="flex">
    ${dashboardSidebar('lawyer', 'requests')}
    
    <main class="flex-1 mr-64 p-8">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">الطلبات الجديدة</h1>
      
      <div class="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
        <p class="text-blue-800">
          <i class="fas fa-info-circle ml-2"></i>
          هذه قضايا تم ترشيحك لها بناءً على تخصصك وخبرتك. راجع التفاصيل وقم بالرد خلال 48 ساعة.
        </p>
      </div>
      
      <div id="requests-list" class="space-y-4">
        <div class="text-center py-12 text-gray-400">
          <i class="fas fa-spinner fa-spin text-3xl"></i>
        </div>
      </div>
    </main>
  </div>
  
  ${footer}
  ${authScript}
  
  <script>
    if (!requireAuth('lawyer')) {}
    
    const caseTypes = ${JSON.stringify(specNames)};
    
    async function loadRequests() {
      const profile = JSON.parse(localStorage.getItem('hoqouqi_profile') || '{}');
      if (!profile.id) return;
      
      try {
        const response = await apiCall('/api/cases/lawyer/' + profile.id + '/requests');
        const container = document.getElementById('requests-list');
        
        if (response.success && response.data.length > 0) {
          container.innerHTML = response.data.map(r => \`
            <div class="bg-white rounded-xl shadow-lg p-6 border-r-4 border-orange-500">
              <div class="flex items-start justify-between mb-4">
                <div>
                  <div class="flex items-center gap-3 mb-2">
                    <h3 class="text-lg font-bold text-gray-800">\${r.title}</h3>
                    <span class="bg-orange-500 text-white text-xs px-3 py-1 rounded-full">طلب جديد</span>
                    \${r.urgency === 'urgent' ? '<span class="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full">عاجل</span>' : ''}
                  </div>
                  <p class="text-gray-600">\${r.description}</p>
                </div>
              </div>
              
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t pt-4 mb-4">
                <div>
                  <span class="text-gray-500">النوع:</span>
                  <span class="font-semibold mr-1">\${caseTypes[r.case_type] || r.case_type}</span>
                </div>
                <div>
                  <span class="text-gray-500">العميل:</span>
                  <span class="font-semibold mr-1">\${r.client_name}</span>
                </div>
                <div>
                  <span class="text-gray-500">المحافظة:</span>
                  <span class="font-semibold mr-1">\${r.governorate}</span>
                </div>
                <div>
                  <span class="text-gray-500">تاريخ الطلب:</span>
                  <span class="font-semibold mr-1">\${formatDate(r.created_at)}</span>
                </div>
              </div>
              
              <div class="flex gap-3 pt-4 border-t">
                <button onclick="acceptRequest(\${r.id})" class="flex-1 py-3 gradient-bg text-white rounded-lg font-semibold hover:opacity-90 transition-all">
                  <i class="fas fa-check ml-2"></i>
                  قبول الطلب
                </button>
                <button onclick="rejectRequest(\${r.id})" class="flex-1 py-3 border-2 border-red-500 text-red-500 rounded-lg font-semibold hover:bg-red-500 hover:text-white transition-all">
                  <i class="fas fa-times ml-2"></i>
                  رفض
                </button>
                <button onclick="requestMoreInfo(\${r.id})" class="py-3 px-6 border-2 border-gray-300 text-gray-700 rounded-lg font-semibold hover:bg-gray-100 transition-all">
                  <i class="fas fa-question-circle ml-2"></i>
                  استفسار
                </button>
              </div>
            </div>
          \`).join('');
        } else {
          container.innerHTML = \`
            <div class="text-center py-12">
              <i class="fas fa-inbox text-6xl text-gray-300 mb-4"></i>
              <p class="text-gray-500 text-xl">لا توجد طلبات جديدة</p>
              <p class="text-gray-400 mt-2">ستظهر هنا القضايا الجديدة المرشحة لك</p>
            </div>
          \`;
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
    
    async function acceptRequest(caseId) {
      const profile = JSON.parse(localStorage.getItem('hoqouqi_profile') || '{}');
      
      try {
        const response = await apiCall('/api/cases/' + caseId + '/accept', 'POST', {
          lawyer_id: profile.id
        });
        
        if (response.success) {
          alert('تم قبول الطلب بنجاح!');
          loadRequests();
        } else {
          alert(response.error || 'حدث خطأ');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('حدث خطأ');
      }
    }
    
    async function rejectRequest(caseId) {
      if (!confirm('هل أنت متأكد من رفض هذا الطلب؟')) return;
      
      try {
        const response = await apiCall('/api/cases/' + caseId + '/reject', 'POST');
        
        if (response.success) {
          alert('تم رفض الطلب');
          loadRequests();
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
    
    function requestMoreInfo(caseId) {
      window.location.href = '/lawyer/messages?case=' + caseId;
    }
    
    loadRequests();
  </script>
</body>
</html>
`;
  return c.html(html);
});

// صفحة تفاصيل القضية للمحامي
lawyerPages.get('/lawyer/cases/:id', async (c) => {
  const caseId = c.req.param('id');
  
  const html = `
${htmlHead('تفاصيل القضية')}
<body class="bg-gray-100">
  ${navbar(true, 'lawyer')}
  
  <div class="flex">
    ${dashboardSidebar('lawyer', 'cases')}
    
    <main class="flex-1 mr-64 p-8">
      <div class="mb-6">
        <a href="/lawyer/cases" class="text-blue-600 hover:underline">
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
    if (!requireAuth('lawyer')) {}
    
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
            <div class="flex gap-2">
              <button onclick="updateCaseStatus()" class="px-4 py-2 gold-bg text-gray-900 rounded-lg font-semibold hover:opacity-90">
                <i class="fas fa-edit ml-1"></i>
                تحديث الحالة
              </button>
              <a href="/lawyer/messages?case=\${data.id}" class="px-4 py-2 gradient-bg text-white rounded-lg font-semibold hover:opacity-90">
                <i class="fas fa-comment ml-1"></i>
                مراسلة العميل
              </a>
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
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-gray-800">
                  <i class="fas fa-history ml-2 gold-accent"></i>
                  الخط الزمني للقضية
                </h2>
                <button onclick="showAddTimelineModal()" class="px-4 py-2 border border-blue-500 text-blue-500 rounded-lg text-sm hover:bg-blue-50">
                  <i class="fas fa-plus ml-1"></i>
                  إضافة تحديث
                </button>
              </div>
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
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-gray-800">
                  <i class="fas fa-folder ml-2 gold-accent"></i>
                  المستندات
                </h2>
                <button onclick="showUploadModal()" class="px-4 py-2 border border-blue-500 text-blue-500 rounded-lg text-sm hover:bg-blue-50">
                  <i class="fas fa-upload ml-1"></i>
                  رفع مستند
                </button>
              </div>
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
            <!-- Client Info -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h2 class="text-lg font-bold text-gray-800 mb-4">
                <i class="fas fa-user ml-2 gold-accent"></i>
                معلومات العميل
              </h2>
              <div class="text-center">
                <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-white text-3xl font-bold mb-3">
                  \${data.client_name?.charAt(0) || 'ع'}
                </div>
                <h3 class="font-bold text-gray-800">\${data.client_name || 'العميل'}</h3>
                <p class="text-sm text-gray-500 mb-4">\${data.governorate || ''}</p>
                <a href="/lawyer/messages?case=\${data.id}" class="block w-full py-2 gold-bg text-gray-900 rounded-lg font-semibold hover:opacity-90">
                  <i class="fas fa-comment ml-1"></i>
                  مراسلة
                </a>
              </div>
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
            </div>
            
            <!-- Quick Actions -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h3 class="font-bold text-gray-800 mb-4">إجراءات سريعة</h3>
              <div class="space-y-2">
                <button onclick="markCompleted()" class="w-full py-2 bg-green-500 text-white rounded-lg font-semibold hover:bg-green-600">
                  <i class="fas fa-check ml-1"></i>
                  إتمام القضية
                </button>
                <button onclick="addHearing()" class="w-full py-2 border border-blue-500 text-blue-500 rounded-lg font-semibold hover:bg-blue-50">
                  <i class="fas fa-calendar-plus ml-1"></i>
                  إضافة جلسة
                </button>
              </div>
            </div>
          </div>
        </div>
      \`;
    }
    
    function showAddTimelineModal() {
      const title = prompt('عنوان التحديث:');
      if (!title) return;
      
      const description = prompt('وصف التحديث:');
      
      addTimelineEntry(title, description);
    }
    
    async function addTimelineEntry(title, description) {
      try {
        const response = await apiCall('/api/cases/' + caseId + '/timeline', 'POST', {
          title,
          description,
          stage: 'update'
        });
        
        if (response.success) {
          loadCaseDetails();
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
    
    async function markCompleted() {
      if (!confirm('هل أنت متأكد من إتمام هذه القضية؟')) return;
      
      try {
        const outcome = prompt('نتيجة القضية (won/lost/settled):', 'won');
        
        const response = await apiCall('/api/cases/' + caseId + '/complete', 'POST', {
          outcome,
          outcome_details: 'تم إتمام القضية بنجاح'
        });
        
        if (response.success) {
          alert('تم إتمام القضية بنجاح!');
          loadCaseDetails();
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
    
    function addHearing() {
      const date = prompt('تاريخ الجلسة (YYYY-MM-DD):');
      if (!date) return;
      
      const title = prompt('عنوان الجلسة:');
      
      addTimelineEntry(title || 'جلسة محكمة', 'جلسة بتاريخ ' + date);
    }
    
    loadCaseDetails();
  </script>
</body>
</html>
`;
  return c.html(html);
});

// صفحة الرسائل للمحامي
lawyerPages.get('/lawyer/messages', async (c) => {
  const caseIdParam = c.req.query('case');
  
  const html = `
${htmlHead('الرسائل')}
<body class="bg-gray-100">
  ${navbar(true, 'lawyer')}
  
  <div class="flex">
    ${dashboardSidebar('lawyer', 'messages')}
    
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
    if (!requireAuth('lawyer')) {}
    
    let currentCaseId = ${caseIdParam ? caseIdParam : 'null'};
    let currentClientUserId = null;
    const profile = JSON.parse(localStorage.getItem('hoqouqi_profile') || '{}');
    const user = JSON.parse(localStorage.getItem('hoqouqi_user') || '{}');
    
    async function loadConversations() {
      if (!profile.id) return;
      
      try {
        const response = await apiCall('/api/cases/lawyer/' + profile.id);
        const container = document.getElementById('conversations-list');
        
        if (response.success && response.data.length > 0) {
          container.innerHTML = response.data.map(c => \`
            <div class="p-4 cursor-pointer hover:bg-gray-50 \${currentCaseId == c.id ? 'bg-blue-50 border-r-4 border-blue-500' : ''}" onclick="selectConversation(\${c.id}, \${c.client_user_id}, '\${c.client_name}', '\${c.title}')">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-white font-bold">
                  \${c.client_name?.charAt(0) || 'ع'}
                </div>
                <div class="flex-1 min-w-0">
                  <h3 class="font-semibold text-gray-800 truncate">\${c.client_name}</h3>
                  <p class="text-sm text-gray-500 truncate">\${c.title}</p>
                </div>
              </div>
            </div>
          \`).join('');
          
          // Auto-select if case ID provided
          if (currentCaseId) {
            const selectedCase = response.data.find(c => c.id == currentCaseId);
            if (selectedCase) {
              selectConversation(selectedCase.id, selectedCase.client_user_id, selectedCase.client_name, selectedCase.title);
            }
          }
        } else {
          container.innerHTML = '<p class="text-center text-gray-500 p-4">لا توجد محادثات</p>';
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
    
    async function selectConversation(caseId, clientUserId, clientName, caseTitle) {
      currentCaseId = caseId;
      currentClientUserId = clientUserId;
      
      // Update header
      document.getElementById('chat-header').innerHTML = \`
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-br from-gray-500 to-gray-700 flex items-center justify-center text-white font-bold">
            \${clientName.charAt(0)}
          </div>
          <div>
            <h3 class="font-semibold text-gray-800">\${clientName}</h3>
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
      if (!content || !currentCaseId || !currentClientUserId) return;
      
      try {
        const response = await apiCall('/api/messages', 'POST', {
          case_id: currentCaseId,
          sender_id: user.id,
          receiver_id: currentClientUserId,
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
    
    // Auto-refresh messages every 10 seconds
    setInterval(() => {
      if (currentCaseId) loadMessages();
    }, 10000);
  </script>
</body>
</html>
`;
  return c.html(html);
});

// صفحة الأرباح
lawyerPages.get('/lawyer/earnings', async (c) => {
  const html = `
${htmlHead('الأرباح')}
<body class="bg-gray-100">
  ${navbar(true, 'lawyer')}
  
  <div class="flex">
    ${dashboardSidebar('lawyer', 'earnings')}
    
    <main class="flex-1 mr-64 p-8">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">الأرباح</h1>
      
      <!-- Earnings Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="text-center">
            <p class="text-gray-500 text-sm mb-2">إجمالي الأرباح</p>
            <p class="text-3xl font-bold text-green-600" id="total-earnings">0 ج.م</p>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="text-center">
            <p class="text-gray-500 text-sm mb-2">أرباح الشهر</p>
            <p class="text-3xl font-bold text-blue-600" id="monthly-earnings">0 ج.م</p>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="text-center">
            <p class="text-gray-500 text-sm mb-2">معلقة (Escrow)</p>
            <p class="text-3xl font-bold text-orange-500" id="pending-earnings">0 ج.م</p>
          </div>
        </div>
        <div class="bg-white rounded-xl shadow-lg p-6">
          <div class="text-center">
            <p class="text-gray-500 text-sm mb-2">متاح للسحب</p>
            <p class="text-3xl font-bold text-purple-600" id="available-earnings">0 ج.م</p>
          </div>
        </div>
      </div>
      
      <!-- Withdraw Button -->
      <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 mb-8 text-white">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="text-xl font-bold mb-2">طلب سحب الأرباح</h2>
            <p class="text-green-100">يمكنك سحب أرباحك المتاحة إلى حسابك البنكي</p>
          </div>
          <button onclick="requestWithdrawal()" class="px-8 py-3 bg-white text-green-600 font-bold rounded-lg hover:bg-green-50 transition-all">
            <i class="fas fa-money-bill-wave ml-2"></i>
            طلب سحب
          </button>
        </div>
      </div>
      
      <!-- Transactions List -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h2 class="text-lg font-bold text-gray-800 mb-4">
          <i class="fas fa-history ml-2 gold-accent"></i>
          سجل المعاملات
        </h2>
        <div id="transactions-list" class="space-y-4">
          <div class="text-center py-8 text-gray-400">
            <i class="fas fa-spinner fa-spin text-2xl"></i>
          </div>
        </div>
      </div>
    </main>
  </div>
  
  ${footer}
  ${authScript}
  
  <script>
    if (!requireAuth('lawyer')) {}
    
    async function loadEarnings() {
      const profile = JSON.parse(localStorage.getItem('hoqouqi_profile') || '{}');
      if (!profile.id) return;
      
      try {
        const response = await apiCall('/api/payments/lawyer/' + profile.id + '/earnings');
        
        if (response.success) {
          const data = response.data;
          
          document.getElementById('total-earnings').textContent = formatCurrency(data.total_earnings || 0);
          document.getElementById('monthly-earnings').textContent = formatCurrency(data.monthly_earnings || 0);
          document.getElementById('pending-earnings').textContent = formatCurrency(data.pending_earnings || 0);
          document.getElementById('available-earnings').textContent = formatCurrency(data.released_earnings || 0);
          
          // Render transactions
          const container = document.getElementById('transactions-list');
          if (data.transactions && data.transactions.length > 0) {
            container.innerHTML = data.transactions.map(t => \`
              <div class="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-full \${t.status === 'completed' ? 'bg-green-100' : 'bg-yellow-100'} flex items-center justify-center">
                    <i class="fas \${t.status === 'completed' ? 'fa-check text-green-600' : 'fa-clock text-yellow-600'}"></i>
                  </div>
                  <div>
                    <h3 class="font-semibold text-gray-800">قضية #\${t.case_id}</h3>
                    <p class="text-sm text-gray-500">\${formatDate(t.created_at)}</p>
                  </div>
                </div>
                <div class="text-left">
                  <p class="font-bold text-green-600">+\${formatCurrency(t.lawyer_amount)}</p>
                  <p class="text-xs text-gray-400">\${t.escrow_status === 'released' ? 'تم الإفراج' : 'معلق'}</p>
                </div>
              </div>
            \`).join('');
          } else {
            container.innerHTML = '<p class="text-center text-gray-500 py-4">لا توجد معاملات</p>';
          }
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
    
    function requestWithdrawal() {
      alert('سيتم تفعيل خدمة السحب قريباً');
    }
    
    loadEarnings();
  </script>
</body>
</html>
`;
  return c.html(html);
});

// صفحة التقييمات
lawyerPages.get('/lawyer/reviews', async (c) => {
  const html = `
${htmlHead('التقييمات')}
<body class="bg-gray-100">
  ${navbar(true, 'lawyer')}
  
  <div class="flex">
    ${dashboardSidebar('lawyer', 'reviews')}
    
    <main class="flex-1 mr-64 p-8">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">التقييمات</h1>
      
      <!-- Rating Overview -->
      <div class="bg-white rounded-xl shadow-lg p-8 mb-8">
        <div class="flex items-center gap-8">
          <div class="text-center">
            <p class="text-6xl font-bold text-blue-900" id="avg-rating">0</p>
            <div class="star-rating text-2xl mt-2" id="stars">⭐⭐⭐⭐⭐</div>
            <p class="text-gray-500 mt-2"><span id="total-reviews">0</span> تقييم</p>
          </div>
          <div class="flex-1">
            <div class="space-y-3">
              ${[5, 4, 3, 2, 1].map(rating => `
                <div class="flex items-center gap-3">
                  <span class="w-8 text-sm">${rating} ⭐</span>
                  <div class="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                    <div class="h-full bg-yellow-400 rounded-full" id="rating-${rating}-bar" style="width: 0%"></div>
                  </div>
                  <span class="w-8 text-sm text-gray-500" id="rating-${rating}-count">0</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Reviews List -->
      <div class="bg-white rounded-xl shadow-lg p-6">
        <h2 class="text-lg font-bold text-gray-800 mb-4">جميع التقييمات</h2>
        <div id="reviews-list" class="space-y-4">
          <div class="text-center py-8 text-gray-400">
            <i class="fas fa-spinner fa-spin text-2xl"></i>
          </div>
        </div>
      </div>
    </main>
  </div>
  
  ${footer}
  ${authScript}
  
  <script>
    if (!requireAuth('lawyer')) {}
    
    async function loadReviews() {
      const profile = JSON.parse(localStorage.getItem('hoqouqi_profile') || '{}');
      if (!profile.id) return;
      
      try {
        const response = await apiCall('/api/reviews/lawyer/' + profile.id);
        
        if (response.success) {
          const reviews = response.data.reviews || [];
          const stats = response.data.stats || {};
          
          // Update overview
          document.getElementById('avg-rating').textContent = (stats.avg_rating || 0).toFixed(1);
          document.getElementById('total-reviews').textContent = stats.total_reviews || 0;
          
          // Update rating bars
          const total = reviews.length || 1;
          for (let i = 1; i <= 5; i++) {
            const count = reviews.filter(r => r.overall_rating === i).length;
            document.getElementById('rating-' + i + '-count').textContent = count;
            document.getElementById('rating-' + i + '-bar').style.width = ((count / total) * 100) + '%';
          }
          
          // Render reviews
          const container = document.getElementById('reviews-list');
          if (reviews.length > 0) {
            container.innerHTML = reviews.map(r => \`
              <div class="p-6 bg-gray-50 rounded-xl">
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 font-bold">
                      \${r.client_name?.charAt(0) || 'ع'}
                    </div>
                    <div>
                      <h3 class="font-semibold text-gray-800">\${r.client_name}</h3>
                      <p class="text-xs text-gray-500">\${formatDate(r.created_at)}</p>
                    </div>
                  </div>
                  <div class="star-rating">\${'⭐'.repeat(r.overall_rating)}</div>
                </div>
                <p class="text-gray-600">\${r.comment || 'لا يوجد تعليق'}</p>
                \${r.lawyer_response ? \`
                  <div class="mt-4 p-4 bg-blue-50 rounded-lg">
                    <p class="text-sm text-blue-800">
                      <i class="fas fa-reply ml-2"></i>
                      <strong>ردك:</strong> \${r.lawyer_response}
                    </p>
                  </div>
                \` : \`
                  <button onclick="replyToReview(\${r.id})" class="mt-4 text-blue-600 text-sm hover:underline">
                    <i class="fas fa-reply ml-1"></i>
                    الرد على التقييم
                  </button>
                \`}
              </div>
            \`).join('');
          } else {
            container.innerHTML = '<p class="text-center text-gray-500 py-4">لا توجد تقييمات بعد</p>';
          }
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
    
    async function replyToReview(reviewId) {
      const response = prompt('اكتب ردك على التقييم:');
      if (!response) return;
      
      try {
        const result = await apiCall('/api/reviews/' + reviewId + '/reply', 'POST', {
          response: response
        });
        
        if (result.success) {
          loadReviews();
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
    
    loadReviews();
  </script>
</body>
</html>
`;
  return c.html(html);
});

// صفحة الملف الشخصي للمحامي
lawyerPages.get('/lawyer/profile', async (c) => {
  const html = `
${htmlHead('ملفي الشخصي')}
<body class="bg-gray-100">
  ${navbar(true, 'lawyer')}
  
  <div class="flex">
    ${dashboardSidebar('lawyer', 'profile')}
    
    <main class="flex-1 mr-64 p-8">
      <h1 class="text-2xl font-bold text-gray-800 mb-6">ملفي الشخصي</h1>
      
      <div id="profile-container">
        <div class="text-center py-12 text-gray-400">
          <i class="fas fa-spinner fa-spin text-3xl"></i>
        </div>
      </div>
    </main>
  </div>
  
  ${footer}
  ${authScript}
  
  <script>
    if (!requireAuth('lawyer')) {}
    
    const caseTypes = ${JSON.stringify(specNames)};
    const barLevels = ${JSON.stringify(levelNames)};
    
    async function loadProfile() {
      const profile = JSON.parse(localStorage.getItem('hoqouqi_profile') || '{}');
      if (!profile.id) return;
      
      try {
        const response = await apiCall('/api/lawyers/' + profile.id);
        
        if (response.success) {
          renderProfile(response.data);
        }
      } catch (error) {
        console.error('Error:', error);
      }
    }
    
    function renderProfile(data) {
      const container = document.getElementById('profile-container');
      
      container.innerHTML = \`
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <!-- Profile Card -->
          <div class="bg-white rounded-xl shadow-lg p-8">
            <div class="text-center">
              <div class="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-5xl font-bold mb-4">
                \${data.full_name.charAt(0)}
              </div>
              <h2 class="text-2xl font-bold text-gray-800">\${data.full_name}</h2>
              <p class="text-gray-500">محامي \${barLevels[data.bar_level] || data.bar_level}</p>
              
              <div class="mt-4 flex justify-center gap-2">
                \${data.is_verified ? '<span class="bg-green-100 text-green-700 text-sm px-3 py-1 rounded-full"><i class="fas fa-check-circle ml-1"></i>موثق</span>' : ''}
                \${data.is_top_lawyer ? '<span class="bg-yellow-100 text-yellow-700 text-sm px-3 py-1 rounded-full"><i class="fas fa-star ml-1"></i>مميز</span>' : ''}
                \${data.is_premium ? '<span class="bg-purple-100 text-purple-700 text-sm px-3 py-1 rounded-full"><i class="fas fa-crown ml-1"></i>Premium</span>' : ''}
              </div>
            </div>
            
            <div class="mt-6 pt-6 border-t space-y-3">
              <div class="flex items-center text-gray-600">
                <i class="fas fa-id-card ml-3 w-5 gold-accent"></i>
                <span>رقم القيد: \${data.bar_registration_number}</span>
              </div>
              <div class="flex items-center text-gray-600">
                <i class="fas fa-calendar ml-3 w-5 gold-accent"></i>
                <span>سنة التسجيل: \${data.registration_year}</span>
              </div>
              <div class="flex items-center text-gray-600">
                <i class="fas fa-map-marker-alt ml-3 w-5 gold-accent"></i>
                <span>\${data.governorate}، \${data.city}</span>
              </div>
            </div>
            
            <button onclick="showEditModal()" class="mt-6 w-full py-3 gold-bg text-gray-900 font-bold rounded-lg hover:opacity-90">
              <i class="fas fa-edit ml-2"></i>
              تعديل الملف
            </button>
          </div>
          
          <!-- Stats & Details -->
          <div class="lg:col-span-2 space-y-6">
            <!-- Stats -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="bg-white rounded-xl shadow-lg p-4 text-center">
                <p class="text-3xl font-bold text-blue-900">\${data.total_cases || 0}</p>
                <p class="text-sm text-gray-500">قضية</p>
              </div>
              <div class="bg-white rounded-xl shadow-lg p-4 text-center">
                <p class="text-3xl font-bold text-green-600">\${(data.success_rate || 0).toFixed(0)}%</p>
                <p class="text-sm text-gray-500">نسبة النجاح</p>
              </div>
              <div class="bg-white rounded-xl shadow-lg p-4 text-center">
                <p class="text-3xl font-bold text-yellow-500">⭐ \${(data.avg_rating || 0).toFixed(1)}</p>
                <p class="text-sm text-gray-500">التقييم</p>
              </div>
              <div class="bg-white rounded-xl shadow-lg p-4 text-center">
                <p class="text-3xl font-bold text-purple-600">\${data.lawyer_score || 0}</p>
                <p class="text-sm text-gray-500">النقاط</p>
              </div>
            </div>
            
            <!-- Bio -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h3 class="font-bold text-gray-800 mb-4">
                <i class="fas fa-user ml-2 gold-accent"></i>
                نبذة عني
              </h3>
              <p class="text-gray-600">\${data.bio || 'لم يتم إضافة نبذة بعد. قم بتعديل ملفك لإضافة نبذة.'}</p>
            </div>
            
            <!-- Specializations -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h3 class="font-bold text-gray-800 mb-4">
                <i class="fas fa-briefcase ml-2 gold-accent"></i>
                التخصصات
              </h3>
              <div class="flex flex-wrap gap-2">
                <span class="bg-blue-100 text-blue-800 px-4 py-2 rounded-full">\${caseTypes[data.primary_specialization] || data.primary_specialization} (رئيسي)</span>
                \${data.secondary_specializations ? JSON.parse(data.secondary_specializations).map(s => 
                  '<span class="bg-gray-100 text-gray-700 px-4 py-2 rounded-full">' + (caseTypes[s] || s) + '</span>'
                ).join('') : ''}
              </div>
            </div>
            
            <!-- Fees -->
            <div class="bg-white rounded-xl shadow-lg p-6">
              <h3 class="font-bold text-gray-800 mb-4">
                <i class="fas fa-money-bill-wave ml-2 gold-accent"></i>
                الأتعاب
              </h3>
              <div class="grid grid-cols-2 gap-4">
                <div class="p-4 bg-gray-50 rounded-lg">
                  <p class="text-gray-500 text-sm">الحد الأدنى للاستشارة</p>
                  <p class="text-2xl font-bold text-gray-800">\${formatCurrency(data.min_consultation_fee || 400)}</p>
                </div>
                <div class="p-4 bg-gray-50 rounded-lg">
                  <p class="text-gray-500 text-sm">السعر بالساعة</p>
                  <p class="text-2xl font-bold text-gray-800">\${formatCurrency(data.hourly_rate || 500)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      \`;
    }
    
    function showEditModal() {
      // For now, show alert
      alert('ميزة تعديل الملف ستتوفر قريباً');
    }
    
    loadProfile();
  </script>
</body>
</html>
`;
  return c.html(html);
});

export default lawyerPages;
