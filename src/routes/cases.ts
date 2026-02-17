// Cases API Routes - مسارات API للقضايا
import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import { paginate, generateCaseNumber, calculatePlatformFee } from '../lib/db';
import type { Case, CaseTimeline, CaseSearchParams } from '../lib/types';

type Bindings = {
  DB: D1Database;
};

const cases = new Hono<{ Bindings: Bindings }>();

// الحصول على جميع القضايا مع التصفية
cases.get('/', async (c) => {
  const db = c.env.DB;
  
  const params: CaseSearchParams = {
    status: c.req.query('status'),
    case_type: c.req.query('case_type'),
    client_id: c.req.query('client_id') ? parseInt(c.req.query('client_id')!) : undefined,
    lawyer_id: c.req.query('lawyer_id') ? parseInt(c.req.query('lawyer_id')!) : undefined,
    date_from: c.req.query('date_from'),
    date_to: c.req.query('date_to'),
    page: parseInt(c.req.query('page') || '1'),
    limit: parseInt(c.req.query('limit') || '10')
  };
  
  const { offset, limit, page } = paginate({ page: params.page!, limit: params.limit! });
  
  let query = `
    SELECT 
      c.*,
      cl.full_name as client_name,
      l.full_name as lawyer_name,
      l.profile_image as lawyer_image
    FROM cases c
    LEFT JOIN clients cl ON c.client_id = cl.id
    LEFT JOIN lawyers l ON c.lawyer_id = l.id
    WHERE 1=1
  `;
  
  const queryParams: any[] = [];
  
  if (params.status) {
    query += ` AND c.status = ?`;
    queryParams.push(params.status);
  }
  
  if (params.case_type) {
    query += ` AND c.case_type = ?`;
    queryParams.push(params.case_type);
  }
  
  if (params.client_id) {
    query += ` AND c.client_id = ?`;
    queryParams.push(params.client_id);
  }
  
  if (params.lawyer_id) {
    query += ` AND c.lawyer_id = ?`;
    queryParams.push(params.lawyer_id);
  }
  
  if (params.date_from) {
    query += ` AND c.created_at >= ?`;
    queryParams.push(params.date_from);
  }
  
  if (params.date_to) {
    query += ` AND c.created_at <= ?`;
    queryParams.push(params.date_to);
  }
  
  // Count total
  const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await db.prepare(countQuery).bind(...queryParams).first<{ total: number }>();
  
  query += ` ORDER BY c.created_at DESC LIMIT ? OFFSET ?`;
  queryParams.push(limit, offset);
  
  const results = await db.prepare(query).bind(...queryParams).all();
  
  return c.json({
    success: true,
    data: results.results,
    pagination: {
      page,
      limit,
      total: countResult?.total || 0,
      totalPages: Math.ceil((countResult?.total || 0) / limit)
    }
  });
});

// إنشاء قضية جديدة
cases.post('/', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  
  const {
    client_id,
    case_type,
    case_category,
    title,
    description,
    urgency = 'normal',
    governorate,
    city
  } = body;
  
  // Validate required fields
  if (!client_id || !case_type || !title || !description) {
    return c.json({
      success: false,
      error: 'يرجى ملء جميع الحقول المطلوبة'
    }, 400);
  }
  
  // Generate case number
  const caseNumber = generateCaseNumber(case_type);
  
  const result = await db.prepare(`
    INSERT INTO cases (
      client_id, case_number, case_type, case_category, title, description,
      urgency, governorate, city, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
  `).bind(
    client_id, caseNumber, case_type, case_category, title, description,
    urgency, governorate, city
  ).run();
  
  const newCase = await db.prepare(`
    SELECT * FROM cases WHERE id = ?
  `).bind(result.meta.last_row_id).first();
  
  return c.json({
    success: true,
    data: newCase,
    message: 'تم إنشاء القضية بنجاح'
  }, 201);
});

// الحصول على قضية واحدة بالتفصيل
cases.get('/:id', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  
  const caseData = await db.prepare(`
    SELECT 
      c.*,
      cl.full_name as client_name,
      cl.profile_image as client_image,
      l.full_name as lawyer_name,
      l.profile_image as lawyer_image,
      l.bar_level,
      l.primary_specialization,
      l.avg_rating as lawyer_rating
    FROM cases c
    LEFT JOIN clients cl ON c.client_id = cl.id
    LEFT JOIN lawyers l ON c.lawyer_id = l.id
    WHERE c.id = ?
  `).bind(id).first();
  
  if (!caseData) {
    return c.json({ success: false, error: 'القضية غير موجودة' }, 404);
  }
  
  // Get timeline
  const timeline = await db.prepare(`
    SELECT * FROM case_timeline 
    WHERE case_id = ?
    ORDER BY created_at ASC
  `).bind(id).all();
  
  // Get documents
  const documents = await db.prepare(`
    SELECT * FROM documents 
    WHERE case_id = ?
    ORDER BY created_at DESC
  `).bind(id).all();
  
  // Get payments
  const payments = await db.prepare(`
    SELECT * FROM payments 
    WHERE case_id = ?
    ORDER BY created_at DESC
  `).bind(id).all();
  
  return c.json({
    success: true,
    data: {
      ...caseData,
      timeline: timeline.results,
      documents: documents.results,
      payments: payments.results
    }
  });
});

// تحديث قضية
cases.put('/:id', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  
  const updates: string[] = [];
  const values: any[] = [];
  
  const allowedFields = [
    'title', 'description', 'status', 'urgency', 'court_name',
    'expected_end_date', 'outcome', 'outcome_details'
  ];
  
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
    UPDATE cases SET ${updates.join(', ')} WHERE id = ?
  `).bind(...values).run();
  
  const updated = await db.prepare(`SELECT * FROM cases WHERE id = ?`).bind(id).first();
  
  return c.json({
    success: true,
    data: updated,
    message: 'تم تحديث القضية بنجاح'
  });
});

// تعيين محامي للقضية
cases.post('/:id/assign-lawyer', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  const { lawyer_id, agreed_fee } = await c.req.json();
  
  if (!lawyer_id || !agreed_fee) {
    return c.json({
      success: false,
      error: 'يرجى تحديد المحامي والأتعاب المتفق عليها'
    }, 400);
  }
  
  // Check if lawyer exists and is verified
  const lawyer = await db.prepare(`
    SELECT id, is_premium FROM lawyers WHERE id = ? AND is_verified = 1 AND is_active = 1
  `).bind(lawyer_id).first();
  
  if (!lawyer) {
    return c.json({ success: false, error: 'المحامي غير موجود أو غير معتمد' }, 400);
  }
  
  // Update case
  await db.prepare(`
    UPDATE cases 
    SET lawyer_id = ?, agreed_fee = ?, status = 'matched', start_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(lawyer_id, agreed_fee, id).run();
  
  // Add to timeline
  await db.prepare(`
    INSERT INTO case_timeline (case_id, stage, title, description, is_completed, created_at)
    VALUES (?, 'assignment', 'تعيين المحامي', 'تم تعيين المحامي للقضية', 1, CURRENT_TIMESTAMP)
  `).bind(id).run();
  
  const updated = await db.prepare(`
    SELECT c.*, l.full_name as lawyer_name
    FROM cases c
    LEFT JOIN lawyers l ON c.lawyer_id = l.id
    WHERE c.id = ?
  `).bind(id).first();
  
  return c.json({
    success: true,
    data: updated,
    message: 'تم تعيين المحامي بنجاح'
  });
});

// الحصول على الخط الزمني للقضية
cases.get('/:id/timeline', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  
  const results = await db.prepare(`
    SELECT * FROM case_timeline 
    WHERE case_id = ?
    ORDER BY created_at ASC
  `).bind(id).all();
  
  return c.json({
    success: true,
    data: results.results
  });
});

// إضافة مرحلة جديدة للخط الزمني
cases.post('/:id/timeline', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  const body = await c.req.json();
  
  const { stage, title, description, hearing_date, decision } = body;
  
  if (!stage || !title) {
    return c.json({
      success: false,
      error: 'يرجى تحديد المرحلة والعنوان'
    }, 400);
  }
  
  const result = await db.prepare(`
    INSERT INTO case_timeline (case_id, stage, title, description, hearing_date, decision, created_at)
    VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(id, stage, title, description, hearing_date, decision).run();
  
  const newEntry = await db.prepare(`
    SELECT * FROM case_timeline WHERE id = ?
  `).bind(result.meta.last_row_id).first();
  
  return c.json({
    success: true,
    data: newEntry,
    message: 'تم إضافة المرحلة بنجاح'
  });
});

// تحديث مرحلة في الخط الزمني
cases.put('/:caseId/timeline/:timelineId', async (c) => {
  const db = c.env.DB;
  const caseId = parseInt(c.req.param('caseId'));
  const timelineId = parseInt(c.req.param('timelineId'));
  const body = await c.req.json();
  
  const updates: string[] = [];
  const values: any[] = [];
  
  const allowedFields = ['title', 'description', 'hearing_date', 'decision', 'is_completed'];
  
  for (const field of allowedFields) {
    if (body[field] !== undefined) {
      updates.push(`${field} = ?`);
      values.push(body[field]);
    }
  }
  
  if (updates.length === 0) {
    return c.json({ success: false, error: 'لا توجد بيانات للتحديث' }, 400);
  }
  
  values.push(timelineId, caseId);
  
  await db.prepare(`
    UPDATE case_timeline SET ${updates.join(', ')} WHERE id = ? AND case_id = ?
  `).bind(...values).run();
  
  const updated = await db.prepare(`
    SELECT * FROM case_timeline WHERE id = ?
  `).bind(timelineId).first();
  
  return c.json({
    success: true,
    data: updated,
    message: 'تم تحديث المرحلة بنجاح'
  });
});

// الحصول على قضايا العميل
cases.get('/client/:clientId', async (c) => {
  const db = c.env.DB;
  const clientId = parseInt(c.req.param('clientId'));
  const status = c.req.query('status');
  
  let query = `
    SELECT 
      c.*,
      l.full_name as lawyer_name,
      l.profile_image as lawyer_image
    FROM cases c
    LEFT JOIN lawyers l ON c.lawyer_id = l.id
    WHERE c.client_id = ?
  `;
  
  const params: any[] = [clientId];
  
  if (status) {
    query += ` AND c.status = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY c.created_at DESC`;
  
  const results = await db.prepare(query).bind(...params).all();
  
  return c.json({
    success: true,
    data: results.results
  });
});

// الحصول على قضايا المحامي
cases.get('/lawyer/:lawyerId', async (c) => {
  const db = c.env.DB;
  const lawyerId = parseInt(c.req.param('lawyerId'));
  const status = c.req.query('status');
  
  let query = `
    SELECT 
      c.*,
      cl.full_name as client_name
    FROM cases c
    LEFT JOIN clients cl ON c.client_id = cl.id
    WHERE c.lawyer_id = ?
  `;
  
  const params: any[] = [lawyerId];
  
  if (status) {
    query += ` AND c.status = ?`;
    params.push(status);
  }
  
  query += ` ORDER BY c.created_at DESC`;
  
  const results = await db.prepare(query).bind(...params).all();
  
  return c.json({
    success: true,
    data: results.results
  });
});

// الحصول على طلبات القضايا للمحامي (pending/matched)
cases.get('/lawyer/:lawyerId/requests', async (c) => {
  const db = c.env.DB;
  const lawyerId = parseInt(c.req.param('lawyerId'));
  
  const results = await db.prepare(`
    SELECT 
      c.*,
      cl.full_name as client_name,
      cl.user_id as client_user_id
    FROM cases c
    LEFT JOIN clients cl ON c.client_id = cl.id
    WHERE c.lawyer_id = ? AND c.status IN ('pending', 'matched')
    ORDER BY c.created_at DESC
  `).bind(lawyerId).all();
  
  return c.json({
    success: true,
    data: results.results
  });
});

// قبول طلب القضية
cases.post('/:id/accept', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  const { lawyer_id } = await c.req.json();
  
  // Update case status
  await db.prepare(`
    UPDATE cases 
    SET status = 'in_progress', start_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(id).run();
  
  // Add to timeline
  await db.prepare(`
    INSERT INTO case_timeline (case_id, stage, title, description, is_completed, created_at)
    VALUES (?, 'accepted', 'قبول القضية', 'تم قبول القضية من قبل المحامي', 1, CURRENT_TIMESTAMP)
  `).bind(id).run();
  
  return c.json({
    success: true,
    message: 'تم قبول القضية بنجاح'
  });
});

// رفض طلب القضية
cases.post('/:id/reject', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  
  // Remove lawyer assignment
  await db.prepare(`
    UPDATE cases 
    SET lawyer_id = NULL, status = 'pending', updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(id).run();
  
  return c.json({
    success: true,
    message: 'تم رفض الطلب'
  });
});

// إتمام القضية
cases.post('/:id/complete', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  const { outcome, outcome_details } = await c.req.json();
  
  // Update case
  await db.prepare(`
    UPDATE cases 
    SET status = 'completed', outcome = ?, outcome_details = ?, actual_end_date = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(outcome, outcome_details, id).run();
  
  // Add to timeline
  await db.prepare(`
    INSERT INTO case_timeline (case_id, stage, title, description, is_completed, created_at)
    VALUES (?, 'completed', 'إتمام القضية', ?, 1, CURRENT_TIMESTAMP)
  `).bind(id, `تم إتمام القضية - النتيجة: ${outcome === 'won' ? 'فوز' : outcome === 'lost' ? 'خسارة' : 'تسوية'}`).run();
  
  // Update lawyer stats
  const caseData = await db.prepare(`SELECT lawyer_id FROM cases WHERE id = ?`).bind(id).first<{lawyer_id: number}>();
  if (caseData?.lawyer_id) {
    // Update total cases and won cases
    await db.prepare(`
      UPDATE lawyers SET 
        total_cases = total_cases + 1,
        won_cases = CASE WHEN ? = 'won' THEN won_cases + 1 ELSE won_cases END,
        success_rate = CAST(won_cases AS REAL) / CAST(CASE WHEN total_cases > 0 THEN total_cases ELSE 1 END AS REAL) * 100,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).bind(outcome, caseData.lawyer_id).run();
  }
  
  return c.json({
    success: true,
    message: 'تم إتمام القضية بنجاح'
  });
});

// إحصائيات القضايا
cases.get('/stats/overview', async (c) => {
  const db = c.env.DB;
  
  // Overall stats
  const overallStats = await db.prepare(`
    SELECT 
      COUNT(*) as total_cases,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as active_cases,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_cases,
      SUM(CASE WHEN outcome = 'won' THEN 1 ELSE 0 END) as won_cases,
      SUM(CASE WHEN outcome = 'settled' THEN 1 ELSE 0 END) as settled_cases
    FROM cases
  `).first();
  
  // By type
  const byType = await db.prepare(`
    SELECT case_type, COUNT(*) as count
    FROM cases
    GROUP BY case_type
    ORDER BY count DESC
  `).all();
  
  // By status
  const byStatus = await db.prepare(`
    SELECT status, COUNT(*) as count
    FROM cases
    GROUP BY status
  `).all();
  
  // Monthly trend
  const monthlyTrend = await db.prepare(`
    SELECT 
      strftime('%Y-%m', created_at) as month,
      COUNT(*) as cases
    FROM cases
    WHERE created_at >= date('now', '-12 months')
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month DESC
  `).all();
  
  return c.json({
    success: true,
    data: {
      overview: overallStats,
      by_type: byType.results,
      by_status: byStatus.results,
      monthly_trend: monthlyTrend.results
    }
  });
});

export default cases;
