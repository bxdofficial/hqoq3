// Lawyers API Routes - مسارات API للمحامين
import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import { 
  paginate, 
  buildWhereClause, 
  calculateMatchScore,
  calculateLawyerScore,
  estimateFeeRange,
  estimateCaseDuration
} from '../lib/db';
import type { Lawyer, LawyerSearchParams, MatchingCriteria, MatchedLawyer } from '../lib/types';

type Bindings = {
  DB: D1Database;
};

const lawyers = new Hono<{ Bindings: Bindings }>();

// الحصول على جميع المحامين مع التصفية والترتيب
lawyers.get('/', async (c) => {
  const db = c.env.DB;
  
  const params: LawyerSearchParams = {
    query: c.req.query('query'),
    specialization: c.req.query('specialization'),
    governorate: c.req.query('governorate'),
    city: c.req.query('city'),
    bar_level: c.req.query('bar_level'),
    min_rating: c.req.query('min_rating') ? parseFloat(c.req.query('min_rating')!) : undefined,
    max_fee: c.req.query('max_fee') ? parseInt(c.req.query('max_fee')!) : undefined,
    sort_by: c.req.query('sort_by') as any,
    sort_order: (c.req.query('sort_order') as 'asc' | 'desc') || 'desc',
    page: parseInt(c.req.query('page') || '1'),
    limit: parseInt(c.req.query('limit') || '10')
  };
  
  const { offset, limit, page } = paginate({ page: params.page!, limit: params.limit! });
  
  // Build dynamic query
  let query = `
    SELECT 
      l.*,
      u.email,
      u.phone
    FROM lawyers l
    JOIN users u ON l.user_id = u.id
    WHERE l.is_verified = 1 AND l.is_active = 1
  `;
  
  const queryParams: any[] = [];
  
  if (params.query) {
    query += ` AND (l.full_name LIKE ? OR l.bio LIKE ?)`;
    queryParams.push(`%${params.query}%`, `%${params.query}%`);
  }
  
  if (params.specialization) {
    query += ` AND (l.primary_specialization = ? OR l.secondary_specializations LIKE ?)`;
    queryParams.push(params.specialization, `%"${params.specialization}"%`);
  }
  
  if (params.governorate) {
    query += ` AND l.governorate = ?`;
    queryParams.push(params.governorate);
  }
  
  if (params.city) {
    query += ` AND l.city = ?`;
    queryParams.push(params.city);
  }
  
  if (params.bar_level) {
    query += ` AND l.bar_level = ?`;
    queryParams.push(params.bar_level);
  }
  
  if (params.min_rating) {
    query += ` AND l.avg_rating >= ?`;
    queryParams.push(params.min_rating);
  }
  
  if (params.max_fee) {
    query += ` AND l.min_consultation_fee <= ?`;
    queryParams.push(params.max_fee);
  }
  
  // Count total
  const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await db.prepare(countQuery).bind(...queryParams).first<{ total: number }>();
  const total = countResult?.total || 0;
  
  // Add sorting
  const sortColumn = {
    rating: 'l.avg_rating',
    experience: 'l.years_of_experience',
    success_rate: 'l.success_rate',
    price: 'l.min_consultation_fee',
    score: 'l.lawyer_score'
  }[params.sort_by || 'score'] || 'l.lawyer_score';
  
  query += ` ORDER BY l.is_top_lawyer DESC, ${sortColumn} ${params.sort_order?.toUpperCase() || 'DESC'}`;
  query += ` LIMIT ? OFFSET ?`;
  queryParams.push(limit, offset);
  
  const results = await db.prepare(query).bind(...queryParams).all();
  
  return c.json({
    success: true,
    data: results.results,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// الحصول على محامي واحد بالتفصيل
lawyers.get('/:id', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  
  // Get lawyer details
  const lawyer = await db.prepare(`
    SELECT 
      l.*,
      u.email,
      u.phone
    FROM lawyers l
    JOIN users u ON l.user_id = u.id
    WHERE l.id = ? AND l.is_active = 1
  `).bind(id).first();
  
  if (!lawyer) {
    return c.json({ success: false, error: 'المحامي غير موجود' }, 404);
  }
  
  // Get specializations
  const specializations = await db.prepare(`
    SELECT * FROM lawyer_specializations WHERE lawyer_id = ?
  `).bind(id).all();
  
  // Get certificates
  const certificates = await db.prepare(`
    SELECT * FROM lawyer_certificates WHERE lawyer_id = ?
  `).bind(id).all();
  
  // Get recent reviews
  const reviews = await db.prepare(`
    SELECT 
      r.*,
      c.full_name as client_name
    FROM reviews r
    JOIN clients c ON r.client_id = c.id
    WHERE r.lawyer_id = ? AND r.is_approved = 1
    ORDER BY r.created_at DESC
    LIMIT 10
  `).bind(id).all();
  
  // Calculate rating distribution
  const ratingDist = await db.prepare(`
    SELECT 
      overall_rating,
      COUNT(*) as count
    FROM reviews
    WHERE lawyer_id = ? AND is_approved = 1
    GROUP BY overall_rating
  `).bind(id).all();
  
  return c.json({
    success: true,
    data: {
      ...lawyer,
      specializations: specializations.results,
      certificates: certificates.results,
      reviews: reviews.results,
      rating_distribution: ratingDist.results
    }
  });
});

// المطابقة الذكية - البحث عن أفضل محامي للقضية
lawyers.post('/match', async (c) => {
  const db = c.env.DB;
  const criteria: MatchingCriteria = await c.req.json();
  
  // Validate required fields
  if (!criteria.case_type || !criteria.governorate) {
    return c.json({ 
      success: false, 
      error: 'يرجى تحديد نوع القضية والمحافظة' 
    }, 400);
  }
  
  // Get all verified lawyers
  const lawyersResult = await db.prepare(`
    SELECT 
      l.*,
      u.email,
      u.phone
    FROM lawyers l
    JOIN users u ON l.user_id = u.id
    WHERE l.is_verified = 1 AND l.is_active = 1
  `).all();
  
  const matchedLawyers: MatchedLawyer[] = [];
  
  for (const lawyer of lawyersResult.results as Lawyer[]) {
    // Get specialization success rate for this case type
    const specStats = await db.prepare(`
      SELECT success_rate, cases_handled
      FROM lawyer_specializations
      WHERE lawyer_id = ? AND specialization = ?
    `).bind(lawyer.id, criteria.case_type).first<{ success_rate: number; cases_handled: number }>();
    
    const { score, reasons } = calculateMatchScore(
      lawyer,
      criteria,
      specStats?.success_rate
    );
    
    // Only include lawyers with score > 30
    if (score > 30) {
      const feeRange = estimateFeeRange(
        criteria.case_type,
        criteria.case_category,
        lawyer.bar_level
      );
      
      const duration = estimateCaseDuration(criteria.case_type, criteria.urgency);
      
      matchedLawyers.push({
        ...lawyer,
        match_score: score,
        match_reasons: reasons,
        estimated_fee_range: feeRange,
        estimated_duration: duration.display,
        specialization_success_rate: specStats?.success_rate || lawyer.success_rate
      });
    }
  }
  
  // Sort by match score
  matchedLawyers.sort((a, b) => {
    // Top lawyers first
    if (a.is_top_lawyer !== b.is_top_lawyer) {
      return b.is_top_lawyer - a.is_top_lawyer;
    }
    return b.match_score - a.match_score;
  });
  
  // Limit results
  const limit = 10;
  const topMatches = matchedLawyers.slice(0, limit);
  
  return c.json({
    success: true,
    data: topMatches,
    criteria: criteria,
    total_matches: matchedLawyers.length
  });
});

// الحصول على تخصصات محامي معين
lawyers.get('/:id/specializations', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  
  const results = await db.prepare(`
    SELECT * FROM lawyer_specializations 
    WHERE lawyer_id = ?
    ORDER BY cases_handled DESC
  `).bind(id).all();
  
  return c.json({
    success: true,
    data: results.results
  });
});

// الحصول على تقييمات محامي
lawyers.get('/:id/reviews', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  
  const { offset } = paginate({ page, limit });
  
  // Count total
  const countResult = await db.prepare(`
    SELECT COUNT(*) as total FROM reviews 
    WHERE lawyer_id = ? AND is_approved = 1
  `).bind(id).first<{ total: number }>();
  
  const results = await db.prepare(`
    SELECT 
      r.*,
      c.full_name as client_name
    FROM reviews r
    JOIN clients c ON r.client_id = c.id
    WHERE r.lawyer_id = ? AND r.is_approved = 1
    ORDER BY r.created_at DESC
    LIMIT ? OFFSET ?
  `).bind(id, limit, offset).all();
  
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

// الحصول على إحصائيات المحامي
lawyers.get('/:id/stats', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  
  // Get case stats by type
  const caseStats = await db.prepare(`
    SELECT 
      case_type,
      COUNT(*) as total,
      SUM(CASE WHEN outcome = 'won' THEN 1 ELSE 0 END) as won,
      SUM(CASE WHEN outcome = 'settled' THEN 1 ELSE 0 END) as settled
    FROM cases
    WHERE lawyer_id = ?
    GROUP BY case_type
  `).bind(id).all();
  
  // Get monthly stats for last 12 months
  const monthlyStats = await db.prepare(`
    SELECT 
      strftime('%Y-%m', created_at) as month,
      COUNT(*) as cases,
      SUM(agreed_fee) as earnings
    FROM cases
    WHERE lawyer_id = ? 
      AND created_at >= date('now', '-12 months')
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month DESC
  `).bind(id).all();
  
  // Get rating trend
  const ratingTrend = await db.prepare(`
    SELECT 
      strftime('%Y-%m', created_at) as month,
      AVG(overall_rating) as avg_rating,
      COUNT(*) as review_count
    FROM reviews
    WHERE lawyer_id = ?
      AND created_at >= date('now', '-12 months')
    GROUP BY strftime('%Y-%m', created_at)
    ORDER BY month DESC
  `).bind(id).all();
  
  return c.json({
    success: true,
    data: {
      case_stats: caseStats.results,
      monthly_stats: monthlyStats.results,
      rating_trend: ratingTrend.results
    }
  });
});

// تحديث نقاط المحامي (للاستخدام الداخلي)
lawyers.post('/:id/update-score', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  
  // Get lawyer data
  const lawyer = await db.prepare(`
    SELECT * FROM lawyers WHERE id = ?
  `).bind(id).first<Lawyer>();
  
  if (!lawyer) {
    return c.json({ success: false, error: 'المحامي غير موجود' }, 404);
  }
  
  const newScore = calculateLawyerScore(lawyer);
  
  // Check if top lawyer (top 10%)
  const rankResult = await db.prepare(`
    SELECT COUNT(*) as total,
           SUM(CASE WHEN lawyer_score > ? THEN 1 ELSE 0 END) as above
    FROM lawyers
    WHERE is_verified = 1 AND is_active = 1
  `).bind(newScore).first<{ total: number; above: number }>();
  
  const isTopLawyer = rankResult && (rankResult.above / rankResult.total) < 0.1 ? 1 : 0;
  
  // Update
  await db.prepare(`
    UPDATE lawyers 
    SET lawyer_score = ?, is_top_lawyer = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(newScore, isTopLawyer, id).run();
  
  return c.json({
    success: true,
    data: {
      lawyer_score: newScore,
      is_top_lawyer: isTopLawyer
    }
  });
});

// البحث السريع (للـ autocomplete)
lawyers.get('/search/quick', async (c) => {
  const db = c.env.DB;
  const query = c.req.query('q');
  
  if (!query || query.length < 2) {
    return c.json({ success: true, data: [] });
  }
  
  const results = await db.prepare(`
    SELECT id, full_name, primary_specialization, governorate, avg_rating
    FROM lawyers
    WHERE is_verified = 1 
      AND is_active = 1
      AND (full_name LIKE ? OR governorate LIKE ?)
    ORDER BY lawyer_score DESC
    LIMIT 5
  `).bind(`%${query}%`, `%${query}%`).all();
  
  return c.json({
    success: true,
    data: results.results
  });
});

// الحصول على المحامين المميزين
lawyers.get('/featured/top', async (c) => {
  const db = c.env.DB;
  const limit = parseInt(c.req.query('limit') || '6');
  
  const results = await db.prepare(`
    SELECT 
      l.*,
      u.email
    FROM lawyers l
    JOIN users u ON l.user_id = u.id
    WHERE l.is_verified = 1 
      AND l.is_active = 1 
      AND l.is_top_lawyer = 1
    ORDER BY l.lawyer_score DESC
    LIMIT ?
  `).bind(limit).all();
  
  return c.json({
    success: true,
    data: results.results
  });
});

export default lawyers;
