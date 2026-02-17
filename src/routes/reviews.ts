// Reviews API Routes - مسارات API للتقييمات
import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import { paginate } from '../lib/db';

type Bindings = {
  DB: D1Database;
};

const reviews = new Hono<{ Bindings: Bindings }>();

// الحصول على جميع التقييمات
reviews.get('/', async (c) => {
  const db = c.env.DB;
  
  const lawyer_id = c.req.query('lawyer_id');
  const min_rating = c.req.query('min_rating');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  
  const { offset } = paginate({ page, limit });
  
  let query = `
    SELECT 
      r.*,
      c.full_name as client_name,
      l.full_name as lawyer_name,
      cs.title as case_title,
      cs.case_type
    FROM reviews r
    JOIN clients c ON r.client_id = c.id
    JOIN lawyers l ON r.lawyer_id = l.id
    JOIN cases cs ON r.case_id = cs.id
    WHERE r.is_approved = 1
  `;
  
  const params: any[] = [];
  
  if (lawyer_id) {
    query += ` AND r.lawyer_id = ?`;
    params.push(parseInt(lawyer_id));
  }
  
  if (min_rating) {
    query += ` AND r.overall_rating >= ?`;
    params.push(parseInt(min_rating));
  }
  
  // Count
  const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await db.prepare(countQuery).bind(...params).first<{ total: number }>();
  
  query += ` ORDER BY r.created_at DESC LIMIT ? OFFSET ?`;
  params.push(limit, offset);
  
  const results = await db.prepare(query).bind(...params).all();
  
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

// إضافة تقييم جديد
reviews.post('/', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  
  const {
    case_id,
    client_id,
    lawyer_id,
    overall_rating,
    professionalism_rating,
    communication_rating,
    punctuality_rating,
    transparency_rating,
    value_for_money_rating,
    comment,
    would_recommend = 1
  } = body;
  
  // Validate required fields
  if (!case_id || !client_id || !lawyer_id || !overall_rating) {
    return c.json({
      success: false,
      error: 'يرجى ملء جميع الحقول المطلوبة'
    }, 400);
  }
  
  // Validate rating range
  if (overall_rating < 1 || overall_rating > 5) {
    return c.json({
      success: false,
      error: 'التقييم يجب أن يكون بين 1 و 5'
    }, 400);
  }
  
  // Check if review already exists for this case
  const existing = await db.prepare(`
    SELECT id FROM reviews WHERE case_id = ? AND client_id = ?
  `).bind(case_id, client_id).first();
  
  if (existing) {
    return c.json({
      success: false,
      error: 'تم تقييم هذه القضية مسبقاً'
    }, 400);
  }
  
  // Insert review
  const result = await db.prepare(`
    INSERT INTO reviews (
      case_id, client_id, lawyer_id, overall_rating,
      professionalism_rating, communication_rating, punctuality_rating,
      transparency_rating, value_for_money_rating, comment, would_recommend,
      is_approved, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, CURRENT_TIMESTAMP)
  `).bind(
    case_id, client_id, lawyer_id, overall_rating,
    professionalism_rating, communication_rating, punctuality_rating,
    transparency_rating, value_for_money_rating, comment, would_recommend
  ).run();
  
  // Update lawyer's average rating
  const avgResult = await db.prepare(`
    SELECT AVG(overall_rating) as avg, COUNT(*) as count
    FROM reviews
    WHERE lawyer_id = ? AND is_approved = 1
  `).bind(lawyer_id).first<{ avg: number; count: number }>();
  
  await db.prepare(`
    UPDATE lawyers 
    SET avg_rating = ?, total_reviews = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(
    Math.round(avgResult?.avg * 10) / 10 || 0,
    avgResult?.count || 0,
    lawyer_id
  ).run();
  
  const newReview = await db.prepare(`
    SELECT * FROM reviews WHERE id = ?
  `).bind(result.meta.last_row_id).first();
  
  return c.json({
    success: true,
    data: newReview,
    message: 'تم إضافة التقييم بنجاح'
  }, 201);
});

// الحصول على تقييم واحد
reviews.get('/:id', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  
  const review = await db.prepare(`
    SELECT 
      r.*,
      c.full_name as client_name,
      l.full_name as lawyer_name,
      cs.title as case_title
    FROM reviews r
    JOIN clients c ON r.client_id = c.id
    JOIN lawyers l ON r.lawyer_id = l.id
    JOIN cases cs ON r.case_id = cs.id
    WHERE r.id = ?
  `).bind(id).first();
  
  if (!review) {
    return c.json({ success: false, error: 'التقييم غير موجود' }, 404);
  }
  
  return c.json({
    success: true,
    data: review
  });
});

// رد المحامي على التقييم
reviews.post('/:id/respond', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  const { lawyer_id, response } = await c.req.json();
  
  if (!response || !lawyer_id) {
    return c.json({
      success: false,
      error: 'يرجى كتابة الرد'
    }, 400);
  }
  
  // Verify lawyer owns this review
  const review = await db.prepare(`
    SELECT id FROM reviews WHERE id = ? AND lawyer_id = ?
  `).bind(id, lawyer_id).first();
  
  if (!review) {
    return c.json({
      success: false,
      error: 'لا يمكنك الرد على هذا التقييم'
    }, 403);
  }
  
  await db.prepare(`
    UPDATE reviews 
    SET lawyer_response = ?, lawyer_response_date = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(response, id).run();
  
  const updated = await db.prepare(`SELECT * FROM reviews WHERE id = ?`).bind(id).first();
  
  return c.json({
    success: true,
    data: updated,
    message: 'تم إضافة الرد بنجاح'
  });
});

// الإبلاغ عن تقييم
reviews.post('/:id/flag', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  const { reason } = await c.req.json();
  
  await db.prepare(`
    UPDATE reviews SET is_flagged = 1 WHERE id = ?
  `).bind(id).run();
  
  return c.json({
    success: true,
    message: 'تم الإبلاغ عن التقييم وسيتم مراجعته'
  });
});

// الحصول على تقييمات محامي معين
reviews.get('/lawyer/:lawyerId', async (c) => {
  const db = c.env.DB;
  const lawyerId = parseInt(c.req.param('lawyerId'));
  
  const reviewsList = await db.prepare(`
    SELECT 
      r.*,
      c.full_name as client_name
    FROM reviews r
    JOIN clients c ON r.client_id = c.id
    WHERE r.lawyer_id = ? AND r.is_approved = 1
    ORDER BY r.created_at DESC
  `).bind(lawyerId).all();
  
  const stats = await db.prepare(`
    SELECT 
      COUNT(*) as total_reviews,
      AVG(overall_rating) as avg_rating
    FROM reviews
    WHERE lawyer_id = ? AND is_approved = 1
  `).bind(lawyerId).first();
  
  return c.json({
    success: true,
    data: {
      reviews: reviewsList.results,
      stats: stats
    }
  });
});

// رد المحامي على التقييم (endpoint جديد)
reviews.post('/:id/reply', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  const { response } = await c.req.json();
  
  if (!response) {
    return c.json({
      success: false,
      error: 'يرجى كتابة الرد'
    }, 400);
  }
  
  await db.prepare(`
    UPDATE reviews 
    SET lawyer_response = ?, lawyer_response_date = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(response, id).run();
  
  return c.json({
    success: true,
    message: 'تم إضافة الرد بنجاح'
  });
});

// إحصائيات التقييمات
reviews.get('/stats/overview', async (c) => {
  const db = c.env.DB;
  
  const stats = await db.prepare(`
    SELECT 
      COUNT(*) as total_reviews,
      AVG(overall_rating) as avg_rating,
      SUM(CASE WHEN overall_rating >= 4 THEN 1 ELSE 0 END) as positive_reviews,
      SUM(CASE WHEN would_recommend = 1 THEN 1 ELSE 0 END) as recommendations
    FROM reviews
    WHERE is_approved = 1
  `).first();
  
  const distribution = await db.prepare(`
    SELECT overall_rating, COUNT(*) as count
    FROM reviews
    WHERE is_approved = 1
    GROUP BY overall_rating
    ORDER BY overall_rating DESC
  `).all();
  
  return c.json({
    success: true,
    data: {
      overview: stats,
      distribution: distribution.results
    }
  });
});

export default reviews;
