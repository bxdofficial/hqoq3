// Users & Auth API Routes - مسارات API للمستخدمين والمصادقة
import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import { paginate } from '../lib/db';

type Bindings = {
  DB: D1Database;
};

const users = new Hono<{ Bindings: Bindings }>();

// ==================== المصادقة ====================

// تسجيل مستخدم جديد
users.post('/register', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  
  const { email, password, phone, user_type, full_name, governorate, city } = body;
  
  if (!email || !password || !user_type || !full_name) {
    return c.json({
      success: false,
      error: 'يرجى ملء جميع الحقول المطلوبة'
    }, 400);
  }
  
  // Check if email exists
  const existing = await db.prepare(`
    SELECT id FROM users WHERE email = ?
  `).bind(email).first();
  
  if (existing) {
    return c.json({
      success: false,
      error: 'البريد الإلكتروني مسجل مسبقاً'
    }, 400);
  }
  
  // Simple password hash (in production, use proper hashing)
  const password_hash = btoa(password + '_hoqouqi_salt');
  
  // Create user
  const userResult = await db.prepare(`
    INSERT INTO users (email, password_hash, phone, user_type, is_verified, is_active, created_at)
    VALUES (?, ?, ?, ?, 0, 1, CURRENT_TIMESTAMP)
  `).bind(email, password_hash, phone || null, user_type).run();
  
  const userId = userResult.meta.last_row_id;
  
  // Create profile based on user type
  if (user_type === 'client') {
    await db.prepare(`
      INSERT INTO clients (user_id, full_name, governorate, city, created_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).bind(userId, full_name, governorate || null, city || null).run();
  }
  
  // For lawyers, they need to complete their profile separately
  
  return c.json({
    success: true,
    data: {
      user_id: userId,
      email,
      user_type
    },
    message: 'تم التسجيل بنجاح'
  }, 201);
});

// تسجيل الدخول
users.post('/login', async (c) => {
  const db = c.env.DB;
  const { email, password } = await c.req.json();
  
  if (!email || !password) {
    return c.json({
      success: false,
      error: 'يرجى إدخال البريد الإلكتروني وكلمة المرور'
    }, 400);
  }
  
  const password_hash = btoa(password + '_hoqouqi_salt');
  
  const user = await db.prepare(`
    SELECT id, email, user_type, is_verified, is_active
    FROM users
    WHERE email = ? AND password_hash = ?
  `).bind(email, password_hash).first();
  
  if (!user) {
    return c.json({
      success: false,
      error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة'
    }, 401);
  }
  
  if (!user.is_active) {
    return c.json({
      success: false,
      error: 'الحساب معطل'
    }, 403);
  }
  
  // Get profile
  let profile = null;
  if (user.user_type === 'client') {
    profile = await db.prepare(`
      SELECT * FROM clients WHERE user_id = ?
    `).bind(user.id).first();
  } else if (user.user_type === 'lawyer') {
    profile = await db.prepare(`
      SELECT * FROM lawyers WHERE user_id = ?
    `).bind(user.id).first();
  }
  
  // Generate simple token (in production, use JWT)
  const token = btoa(`${user.id}_${Date.now()}_hoqouqi`);
  
  return c.json({
    success: true,
    data: {
      user: {
        id: user.id,
        email: user.email,
        user_type: user.user_type,
        is_verified: user.is_verified
      },
      profile,
      token
    },
    message: 'تم تسجيل الدخول بنجاح'
  });
});

// ==================== ملف العميل ====================

// الحصول على ملف العميل
users.get('/clients/:id', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  
  const client = await db.prepare(`
    SELECT 
      c.*,
      u.email,
      u.phone,
      u.is_verified
    FROM clients c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).bind(id).first();
  
  if (!client) {
    return c.json({ success: false, error: 'العميل غير موجود' }, 404);
  }
  
  return c.json({
    success: true,
    data: client
  });
});

// تحديث ملف العميل
users.put('/clients/:id', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  
  const updates: string[] = [];
  const values: any[] = [];
  
  const allowedFields = ['full_name', 'national_id', 'governorate', 'city', 'address', 'profile_image'];
  
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(body[field]);
    }
  }
  
  if (updates.length === 0) {
    return c.json({ success: false, error: 'لا توجد بيانات للتحديث' }, 400);
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  await db.prepare(`
    UPDATE clients SET ${updates.join(', ')} WHERE id = ?
  `).bind(...values).run();
  
  const updated = await db.prepare(`SELECT * FROM clients WHERE id = ?`).bind(id).first();
  
  return c.json({
    success: true,
    data: updated,
    message: 'تم تحديث الملف بنجاح'
  });
});

// لوحة تحكم العميل
users.get('/clients/:id/dashboard', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  
  // Get client info
  const client = await db.prepare(`
    SELECT c.*, u.email, u.phone
    FROM clients c
    JOIN users u ON c.user_id = u.id
    WHERE c.id = ?
  `).bind(id).first();
  
  if (!client) {
    return c.json({ success: false, error: 'العميل غير موجود' }, 404);
  }
  
  // Get case stats
  const caseStats = await db.prepare(`
    SELECT 
      COUNT(*) as total_cases,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as active_cases,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_cases,
      SUM(CASE WHEN outcome = 'won' THEN 1 ELSE 0 END) as won_cases
    FROM cases
    WHERE client_id = ?
  `).bind(id).first();
  
  // Get active cases
  const activeCases = await db.prepare(`
    SELECT 
      c.*,
      l.full_name as lawyer_name,
      l.profile_image as lawyer_image
    FROM cases c
    LEFT JOIN lawyers l ON c.lawyer_id = l.id
    WHERE c.client_id = ? AND c.status IN ('pending', 'matched', 'in_progress')
    ORDER BY c.created_at DESC
    LIMIT 5
  `).bind(id).all();
  
  // Get payment stats
  const paymentStats = await db.prepare(`
    SELECT 
      SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_paid,
      SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as pending_payments
    FROM payments
    WHERE client_id = ?
  `).bind(id).first();
  
  // Get recent notifications
  const notifications = await db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = (SELECT user_id FROM clients WHERE id = ?)
    ORDER BY created_at DESC
    LIMIT 10
  `).bind(id).all();
  
  return c.json({
    success: true,
    data: {
      client,
      stats: caseStats,
      active_cases: activeCases.results,
      payments: paymentStats,
      notifications: notifications.results
    }
  });
});

// ==================== ملف المحامي ====================

// تسجيل محامي جديد (إكمال الملف)
users.post('/lawyers/register', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  
  const {
    user_id,
    full_name,
    bar_registration_number,
    bar_level,
    registration_year,
    years_of_experience,
    primary_specialization,
    secondary_specializations,
    bio,
    governorate,
    city,
    office_address,
    min_consultation_fee,
    hourly_rate
  } = body;
  
  if (!user_id || !full_name || !bar_registration_number || !bar_level || !governorate) {
    return c.json({
      success: false,
      error: 'يرجى ملء جميع الحقول المطلوبة'
    }, 400);
  }
  
  // Check if bar number is already registered
  const existingBar = await db.prepare(`
    SELECT id FROM lawyers WHERE bar_registration_number = ?
  `).bind(bar_registration_number).first();
  
  if (existingBar) {
    return c.json({
      success: false,
      error: 'رقم القيد مسجل مسبقاً'
    }, 400);
  }
  
  const result = await db.prepare(`
    INSERT INTO lawyers (
      user_id, full_name, bar_registration_number, bar_level, registration_year,
      years_of_experience, primary_specialization, secondary_specializations,
      bio, governorate, city, office_address, min_consultation_fee, hourly_rate,
      is_verified, is_active, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 1, CURRENT_TIMESTAMP)
  `).bind(
    user_id, full_name, bar_registration_number, bar_level, registration_year,
    years_of_experience, primary_specialization, JSON.stringify(secondary_specializations || []),
    bio, governorate, city, office_address,
    min_consultation_fee || 400, hourly_rate || 500
  ).run();
  
  const newLawyer = await db.prepare(`
    SELECT * FROM lawyers WHERE id = ?
  `).bind(result.meta.last_row_id).first();
  
  return c.json({
    success: true,
    data: newLawyer,
    message: 'تم إنشاء ملف المحامي. سيتم مراجعته والتحقق منه قريباً'
  }, 201);
});

// تحديث ملف المحامي
users.put('/lawyers/:id', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  
  const updates: string[] = [];
  const values: any[] = [];
  
  const allowedFields = [
    'full_name', 'bio', 'profile_image', 'intro_video', 'office_address',
    'min_consultation_fee', 'hourly_rate', 'secondary_specializations'
  ];
  
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      const value = field === 'secondary_specializations' 
        ? JSON.stringify(body[field]) 
        : body[field];
      updates.push(`${field} = ?`);
      values.push(value);
    }
  }
  
  if (updates.length === 0) {
    return c.json({ success: false, error: 'لا توجد بيانات للتحديث' }, 400);
  }
  
  updates.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);
  
  await db.prepare(`
    UPDATE lawyers SET ${updates.join(', ')} WHERE id = ?
  `).bind(...values).run();
  
  const updated = await db.prepare(`SELECT * FROM lawyers WHERE id = ?`).bind(id).first();
  
  return c.json({
    success: true,
    data: updated,
    message: 'تم تحديث الملف بنجاح'
  });
});

// لوحة تحكم المحامي
users.get('/lawyers/:id/dashboard', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  
  // Get lawyer info
  const lawyer = await db.prepare(`
    SELECT l.*, u.email, u.phone
    FROM lawyers l
    JOIN users u ON l.user_id = u.id
    WHERE l.id = ?
  `).bind(id).first();
  
  if (!lawyer) {
    return c.json({ success: false, error: 'المحامي غير موجود' }, 404);
  }
  
  // Get case stats
  const caseStats = await db.prepare(`
    SELECT 
      COUNT(*) as total_cases,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as active_cases,
      SUM(CASE WHEN status = 'pending' OR status = 'matched' THEN 1 ELSE 0 END) as pending_cases,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_cases,
      SUM(CASE WHEN outcome = 'won' THEN 1 ELSE 0 END) as won_cases
    FROM cases
    WHERE lawyer_id = ?
  `).bind(id).first();
  
  // Get active cases
  const activeCases = await db.prepare(`
    SELECT 
      c.*,
      cl.full_name as client_name
    FROM cases c
    JOIN clients cl ON c.client_id = cl.id
    WHERE c.lawyer_id = ? AND c.status = 'in_progress'
    ORDER BY c.created_at DESC
    LIMIT 5
  `).bind(id).all();
  
  // Get pending requests
  const pendingRequests = await db.prepare(`
    SELECT 
      c.*,
      cl.full_name as client_name
    FROM cases c
    JOIN clients cl ON c.client_id = cl.id
    WHERE c.lawyer_id = ? AND c.status IN ('pending', 'matched')
    ORDER BY c.created_at DESC
    LIMIT 5
  `).bind(id).all();
  
  // Get earnings
  const earnings = await db.prepare(`
    SELECT 
      SUM(CASE WHEN status = 'completed' THEN lawyer_amount ELSE 0 END) as total_earnings,
      SUM(CASE WHEN status = 'completed' AND escrow_status = 'released' THEN lawyer_amount ELSE 0 END) as released_earnings,
      SUM(CASE WHEN status = 'completed' AND escrow_status = 'held' THEN lawyer_amount ELSE 0 END) as pending_earnings
    FROM payments
    WHERE lawyer_id = ?
  `).bind(id).first();
  
  // Get recent reviews
  const recentReviews = await db.prepare(`
    SELECT 
      r.*,
      c.full_name as client_name
    FROM reviews r
    JOIN clients c ON r.client_id = c.id
    WHERE r.lawyer_id = ? AND r.is_approved = 1
    ORDER BY r.created_at DESC
    LIMIT 5
  `).bind(id).all();
  
  // Get upcoming hearings
  const upcomingHearings = await db.prepare(`
    SELECT 
      ct.*,
      c.title as case_title,
      c.case_type
    FROM case_timeline ct
    JOIN cases c ON ct.case_id = c.id
    WHERE c.lawyer_id = ? 
      AND ct.hearing_date >= date('now')
      AND ct.is_completed = 0
    ORDER BY ct.hearing_date ASC
    LIMIT 5
  `).bind(id).all();
  
  return c.json({
    success: true,
    data: {
      lawyer,
      stats: caseStats,
      active_cases: activeCases.results,
      pending_requests: pendingRequests.results,
      earnings,
      recent_reviews: recentReviews.results,
      upcoming_hearings: upcomingHearings.results
    }
  });
});

// ==================== الإشعارات ====================

// الحصول على إشعارات المستخدم
users.get('/:userId/notifications', async (c) => {
  const db = c.env.DB;
  const userId = parseInt(c.req.param('userId'));
  const unread_only = c.req.query('unread_only') === 'true';
  
  let query = `SELECT * FROM notifications WHERE user_id = ?`;
  
  if (unread_only) {
    query += ` AND is_read = 0`;
  }
  
  query += ` ORDER BY created_at DESC LIMIT 50`;
  
  const results = await db.prepare(query).bind(userId).all();
  
  return c.json({
    success: true,
    data: results.results
  });
});

// تحديد الإشعارات كمقروءة
users.post('/:userId/notifications/read', async (c) => {
  const db = c.env.DB;
  const userId = parseInt(c.req.param('userId'));
  const { notification_ids } = await c.req.json();
  
  if (notification_ids && notification_ids.length > 0) {
    const placeholders = notification_ids.map(() => '?').join(', ');
    await db.prepare(`
      UPDATE notifications 
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND id IN (${placeholders})
    `).bind(userId, ...notification_ids).run();
  } else {
    await db.prepare(`
      UPDATE notifications 
      SET is_read = 1, read_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND is_read = 0
    `).bind(userId).run();
  }
  
  return c.json({
    success: true,
    message: 'تم تحديث الإشعارات'
  });
});

export default users;
