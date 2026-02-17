// Shared HTML Components - مكونات HTML المشتركة
export const htmlHead = (title: string) => `
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
    .sidebar-link { transition: all 0.2s; }
    .sidebar-link:hover, .sidebar-link.active { background-color: rgba(212, 175, 55, 0.1); border-right: 3px solid #D4AF37; }
    .status-badge { padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
    .status-pending { background-color: #FEF3C7; color: #92400E; }
    .status-in_progress { background-color: #DBEAFE; color: #1E40AF; }
    .status-completed { background-color: #D1FAE5; color: #065F46; }
    .status-cancelled { background-color: #FEE2E2; color: #991B1B; }
    .message-bubble { max-width: 70%; padding: 0.75rem 1rem; border-radius: 1rem; }
    .message-sent { background-color: #1E3A5F; color: white; margin-left: auto; border-bottom-right-radius: 0.25rem; }
    .message-received { background-color: #F3F4F6; color: #1F2937; margin-right: auto; border-bottom-left-radius: 0.25rem; }
  </style>
</head>
`;

export const navbar = (isLoggedIn = false, userType = 'client', userName = '') => `
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
        <a href="/calculator" class="hover-gold transition-colors">حاسبة المواريث</a>
      </div>
      <div class="flex items-center space-x-4 space-x-reverse">
        ${isLoggedIn ? `
          <a href="${userType === 'lawyer' ? '/lawyer/dashboard' : '/dashboard'}" class="hover-gold transition-colors">
            <i class="fas fa-user-circle ml-1"></i>
            ${userName || 'لوحة التحكم'}
          </a>
          <button onclick="logout()" class="px-4 py-2 rounded-lg border border-white hover:bg-white hover:text-gray-800 transition-all">
            تسجيل خروج
          </button>
        ` : `
          <a href="/login" class="px-4 py-2 rounded-lg border border-white hover:bg-white hover:text-gray-800 transition-all">
            تسجيل الدخول
          </a>
          <a href="/register" class="px-4 py-2 rounded-lg gold-bg text-gray-900 font-semibold hover:opacity-90 transition-all">
            سجل الآن
          </a>
        `}
      </div>
    </div>
  </div>
</nav>
`;

export const footer = `
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

export const dashboardSidebar = (userType: 'client' | 'lawyer' | 'admin', activePage: string) => {
  const clientLinks = [
    { href: '/dashboard', icon: 'fa-home', label: 'الرئيسية', id: 'home' },
    { href: '/dashboard/cases', icon: 'fa-folder-open', label: 'قضاياي', id: 'cases' },
    { href: '/dashboard/new-case', icon: 'fa-plus-circle', label: 'قضية جديدة', id: 'new-case' },
    { href: '/dashboard/messages', icon: 'fa-comments', label: 'الرسائل', id: 'messages' },
    { href: '/dashboard/consultations', icon: 'fa-calendar-check', label: 'الاستشارات', id: 'consultations' },
    { href: '/dashboard/payments', icon: 'fa-credit-card', label: 'المدفوعات', id: 'payments' },
    { href: '/dashboard/settings', icon: 'fa-cog', label: 'الإعدادات', id: 'settings' },
  ];
  
  const lawyerLinks = [
    { href: '/lawyer/dashboard', icon: 'fa-home', label: 'الرئيسية', id: 'home' },
    { href: '/lawyer/cases', icon: 'fa-folder-open', label: 'القضايا', id: 'cases' },
    { href: '/lawyer/requests', icon: 'fa-inbox', label: 'الطلبات الجديدة', id: 'requests' },
    { href: '/lawyer/messages', icon: 'fa-comments', label: 'الرسائل', id: 'messages' },
    { href: '/lawyer/consultations', icon: 'fa-calendar-check', label: 'الاستشارات', id: 'consultations' },
    { href: '/lawyer/earnings', icon: 'fa-money-bill-wave', label: 'الأرباح', id: 'earnings' },
    { href: '/lawyer/reviews', icon: 'fa-star', label: 'التقييمات', id: 'reviews' },
    { href: '/lawyer/profile', icon: 'fa-user', label: 'ملفي الشخصي', id: 'profile' },
    { href: '/lawyer/settings', icon: 'fa-cog', label: 'الإعدادات', id: 'settings' },
  ];
  
  const adminLinks = [
    { href: '/admin', icon: 'fa-home', label: 'الرئيسية', id: 'home' },
    { href: '/admin/lawyers', icon: 'fa-user-tie', label: 'المحامون', id: 'lawyers' },
    { href: '/admin/clients', icon: 'fa-users', label: 'العملاء', id: 'clients' },
    { href: '/admin/cases', icon: 'fa-folder-open', label: 'القضايا', id: 'cases' },
    { href: '/admin/payments', icon: 'fa-credit-card', label: 'المدفوعات', id: 'payments' },
    { href: '/admin/content', icon: 'fa-newspaper', label: 'المحتوى', id: 'content' },
    { href: '/admin/reports', icon: 'fa-chart-bar', label: 'التقارير', id: 'reports' },
    { href: '/admin/settings', icon: 'fa-cog', label: 'الإعدادات', id: 'settings' },
  ];
  
  const links = userType === 'admin' ? adminLinks : userType === 'lawyer' ? lawyerLinks : clientLinks;
  
  return `
  <aside class="w-64 bg-white shadow-lg min-h-screen fixed right-0 top-16">
    <div class="p-4">
      <div class="text-center mb-6 pb-4 border-b">
        <div class="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-3xl font-bold mb-2">
          <i class="fas ${userType === 'lawyer' ? 'fa-user-tie' : userType === 'admin' ? 'fa-user-shield' : 'fa-user'}"></i>
        </div>
        <h3 class="font-bold text-gray-800" id="sidebar-user-name">مستخدم</h3>
        <p class="text-sm text-gray-500">${userType === 'lawyer' ? 'محامي' : userType === 'admin' ? 'مدير' : 'عميل'}</p>
      </div>
      <nav class="space-y-2">
        ${links.map(link => `
          <a href="${link.href}" class="sidebar-link flex items-center px-4 py-3 rounded-lg text-gray-700 hover:text-blue-900 ${activePage === link.id ? 'active bg-blue-50 text-blue-900' : ''}">
            <i class="fas ${link.icon} ml-3 w-5"></i>
            ${link.label}
          </a>
        `).join('')}
      </nav>
    </div>
  </aside>
  `;
};

export const authScript = `
<script>
  // Auth utilities
  function getUser() {
    const userStr = localStorage.getItem('hoqouqi_user');
    return userStr ? JSON.parse(userStr) : null;
  }
  
  function getToken() {
    return localStorage.getItem('hoqouqi_token');
  }
  
  function isLoggedIn() {
    return !!getToken() && !!getUser();
  }
  
  function logout() {
    localStorage.removeItem('hoqouqi_token');
    localStorage.removeItem('hoqouqi_user');
    localStorage.removeItem('hoqouqi_profile');
    window.location.href = '/login';
  }
  
  function requireAuth(requiredType = null) {
    if (!isLoggedIn()) {
      window.location.href = '/login';
      return false;
    }
    const user = getUser();
    if (requiredType && user.user_type !== requiredType) {
      window.location.href = user.user_type === 'lawyer' ? '/lawyer/dashboard' : '/dashboard';
      return false;
    }
    return true;
  }
  
  // Update sidebar name
  document.addEventListener('DOMContentLoaded', () => {
    const profile = localStorage.getItem('hoqouqi_profile');
    if (profile) {
      const p = JSON.parse(profile);
      const nameEl = document.getElementById('sidebar-user-name');
      if (nameEl && p.full_name) {
        nameEl.textContent = p.full_name;
      }
    }
  });
  
  // API helper
  async function apiCall(url, method = 'GET', data = null) {
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + getToken()
      }
    };
    if (data) options.body = JSON.stringify(data);
    const response = await fetch(url, options);
    return response.json();
  }
  
  // Format date
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const date = new Date(dateStr);
    return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
  }
  
  // Format currency
  function formatCurrency(amount) {
    return new Intl.NumberFormat('ar-EG').format(amount) + ' ج.م';
  }
  
  // Status badge
  function getStatusBadge(status) {
    const labels = {
      pending: 'قيد الانتظار',
      matched: 'تم المطابقة',
      in_progress: 'جارية',
      completed: 'مكتملة',
      cancelled: 'ملغاة',
      settled: 'تسوية'
    };
    return '<span class="status-badge status-' + status + '">' + (labels[status] || status) + '</span>';
  }
</script>
`;

export const specNames: Record<string, string> = {
  criminal: 'جنائي',
  civil: 'مدني',
  family: 'أحوال شخصية',
  commercial: 'تجاري',
  administrative: 'إداري',
  labor: 'عمالي',
  sharia: 'شرعي'
};

export const levelNames: Record<string, string> = {
  general: 'عام',
  primary: 'ابتدائي',
  appeal: 'استئناف',
  cassation: 'نقض'
};
