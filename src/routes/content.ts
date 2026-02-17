// Content API Routes - مسارات API للمحتوى (مقالات + منتدى)
import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import { paginate } from '../lib/db';

type Bindings = {
  DB: D1Database;
};

const content = new Hono<{ Bindings: Bindings }>();

// ==================== المقالات ====================

// الحصول على جميع المقالات
content.get('/articles', async (c) => {
  const db = c.env.DB;
  
  const category = c.req.query('category');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  
  const { offset } = paginate({ page, limit });
  
  let query = `
    SELECT 
      a.*,
      u.email as author_email
    FROM articles a
    LEFT JOIN users u ON a.author_id = u.id
    WHERE a.is_published = 1
  `;
  
  const params: any[] = [];
  
  if (category) {
    query += ` AND a.category = ?`;
    params.push(category);
  }
  
  // Count
  const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await db.prepare(countQuery).bind(...params).first<{ total: number }>();
  
  query += ` ORDER BY a.published_at DESC LIMIT ? OFFSET ?`;
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

// الحصول على مقال واحد
content.get('/articles/:slug', async (c) => {
  const db = c.env.DB;
  const slug = c.req.param('slug');
  
  // Increment views
  await db.prepare(`
    UPDATE articles SET views = views + 1 WHERE slug = ?
  `).bind(slug).run();
  
  const article = await db.prepare(`
    SELECT 
      a.*,
      u.email as author_email
    FROM articles a
    LEFT JOIN users u ON a.author_id = u.id
    WHERE a.slug = ? AND a.is_published = 1
  `).bind(slug).first();
  
  if (!article) {
    return c.json({ success: false, error: 'المقال غير موجود' }, 404);
  }
  
  // Get related articles
  const related = await db.prepare(`
    SELECT id, title, slug, summary, cover_image, published_at
    FROM articles
    WHERE category = ? AND slug != ? AND is_published = 1
    ORDER BY published_at DESC
    LIMIT 3
  `).bind(article.category, slug).all();
  
  return c.json({
    success: true,
    data: {
      ...article,
      related_articles: related.results
    }
  });
});

// المقالات المميزة
content.get('/articles/featured/top', async (c) => {
  const db = c.env.DB;
  const limit = parseInt(c.req.query('limit') || '5');
  
  const results = await db.prepare(`
    SELECT id, title, slug, summary, cover_image, category, views, published_at
    FROM articles
    WHERE is_published = 1
    ORDER BY views DESC
    LIMIT ?
  `).bind(limit).all();
  
  return c.json({
    success: true,
    data: results.results
  });
});

// ==================== المنتدى ====================

// الحصول على أسئلة المنتدى
content.get('/forum/questions', async (c) => {
  const db = c.env.DB;
  
  const category = c.req.query('category');
  const is_resolved = c.req.query('is_resolved');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  
  const { offset } = paginate({ page, limit });
  
  let query = `
    SELECT 
      q.*,
      u.email as user_email,
      (SELECT full_name FROM clients WHERE user_id = q.user_id) as user_name
    FROM forum_questions q
    JOIN users u ON q.user_id = u.id
    WHERE q.is_approved = 1
  `;
  
  const params: any[] = [];
  
  if (category) {
    query += ` AND q.category = ?`;
    params.push(category);
  }
  
  if (is_resolved !== undefined) {
    query += ` AND q.is_resolved = ?`;
    params.push(is_resolved === 'true' ? 1 : 0);
  }
  
  // Count
  const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await db.prepare(countQuery).bind(...params).first<{ total: number }>();
  
  query += ` ORDER BY q.created_at DESC LIMIT ? OFFSET ?`;
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

// إضافة سؤال جديد
content.post('/forum/questions', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  
  const { user_id, title, content: questionContent, category, tags } = body;
  
  if (!user_id || !title || !questionContent || !category) {
    return c.json({
      success: false,
      error: 'يرجى ملء جميع الحقول المطلوبة'
    }, 400);
  }
  
  const result = await db.prepare(`
    INSERT INTO forum_questions (user_id, title, content, category, tags, is_approved, created_at)
    VALUES (?, ?, ?, ?, ?, 0, CURRENT_TIMESTAMP)
  `).bind(user_id, title, questionContent, category, tags || null).run();
  
  const newQuestion = await db.prepare(`
    SELECT * FROM forum_questions WHERE id = ?
  `).bind(result.meta.last_row_id).first();
  
  return c.json({
    success: true,
    data: newQuestion,
    message: 'تم إرسال السؤال وسيتم مراجعته قبل النشر'
  }, 201);
});

// الحصول على سؤال واحد مع الإجابات
content.get('/forum/questions/:id', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  
  // Increment views
  await db.prepare(`
    UPDATE forum_questions SET views = views + 1 WHERE id = ?
  `).bind(id).run();
  
  const question = await db.prepare(`
    SELECT 
      q.*,
      (SELECT full_name FROM clients WHERE user_id = q.user_id) as user_name
    FROM forum_questions q
    WHERE q.id = ? AND q.is_approved = 1
  `).bind(id).first();
  
  if (!question) {
    return c.json({ success: false, error: 'السؤال غير موجود' }, 404);
  }
  
  // Get answers
  const answers = await db.prepare(`
    SELECT 
      a.*,
      l.full_name as lawyer_name,
      l.profile_image as lawyer_image,
      l.primary_specialization,
      l.bar_level,
      l.is_top_lawyer
    FROM forum_answers a
    JOIN lawyers l ON a.lawyer_id = l.id
    WHERE a.question_id = ?
    ORDER BY a.is_best_answer DESC, a.upvotes DESC, a.created_at ASC
  `).bind(id).all();
  
  return c.json({
    success: true,
    data: {
      ...question,
      answers: answers.results
    }
  });
});

// إضافة إجابة على سؤال
content.post('/forum/questions/:id/answers', async (c) => {
  const db = c.env.DB;
  const questionId = parseInt(c.req.param('id'));
  const { lawyer_id, content: answerContent } = await c.req.json();
  
  if (!lawyer_id || !answerContent) {
    return c.json({
      success: false,
      error: 'يرجى كتابة الإجابة'
    }, 400);
  }
  
  // Verify lawyer
  const lawyer = await db.prepare(`
    SELECT id FROM lawyers WHERE id = ? AND is_verified = 1
  `).bind(lawyer_id).first();
  
  if (!lawyer) {
    return c.json({
      success: false,
      error: 'يجب أن تكون محامياً معتمداً للإجابة'
    }, 403);
  }
  
  const result = await db.prepare(`
    INSERT INTO forum_answers (question_id, lawyer_id, content, created_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
  `).bind(questionId, lawyer_id, answerContent).run();
  
  // Update answers count
  await db.prepare(`
    UPDATE forum_questions 
    SET answers_count = answers_count + 1, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(questionId).run();
  
  const newAnswer = await db.prepare(`
    SELECT 
      a.*,
      l.full_name as lawyer_name,
      l.profile_image as lawyer_image
    FROM forum_answers a
    JOIN lawyers l ON a.lawyer_id = l.id
    WHERE a.id = ?
  `).bind(result.meta.last_row_id).first();
  
  return c.json({
    success: true,
    data: newAnswer,
    message: 'تم إضافة الإجابة بنجاح'
  }, 201);
});

// تصويت على إجابة
content.post('/forum/answers/:id/upvote', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  
  await db.prepare(`
    UPDATE forum_answers SET upvotes = upvotes + 1 WHERE id = ?
  `).bind(id).run();
  
  const updated = await db.prepare(`SELECT upvotes FROM forum_answers WHERE id = ?`).bind(id).first();
  
  return c.json({
    success: true,
    data: { upvotes: updated?.upvotes }
  });
});

// اختيار أفضل إجابة
content.post('/forum/answers/:id/best', async (c) => {
  const db = c.env.DB;
  const answerId = parseInt(c.req.param('id'));
  const { user_id } = await c.req.json();
  
  // Get answer and question
  const answer = await db.prepare(`
    SELECT a.*, q.user_id as question_user_id
    FROM forum_answers a
    JOIN forum_questions q ON a.question_id = q.id
    WHERE a.id = ?
  `).bind(answerId).first<any>();
  
  if (!answer) {
    return c.json({ success: false, error: 'الإجابة غير موجودة' }, 404);
  }
  
  if (answer.question_user_id !== user_id) {
    return c.json({
      success: false,
      error: 'فقط صاحب السؤال يمكنه اختيار أفضل إجابة'
    }, 403);
  }
  
  // Reset all answers for this question
  await db.prepare(`
    UPDATE forum_answers SET is_best_answer = 0 WHERE question_id = ?
  `).bind(answer.question_id).run();
  
  // Set this as best
  await db.prepare(`
    UPDATE forum_answers SET is_best_answer = 1 WHERE id = ?
  `).bind(answerId).run();
  
  // Mark question as resolved
  await db.prepare(`
    UPDATE forum_questions SET is_resolved = 1, best_answer_id = ? WHERE id = ?
  `).bind(answerId, answer.question_id).run();
  
  return c.json({
    success: true,
    message: 'تم اختيار أفضل إجابة'
  });
});

// الأسئلة الشائعة
content.get('/forum/popular', async (c) => {
  const db = c.env.DB;
  const limit = parseInt(c.req.query('limit') || '5');
  
  const results = await db.prepare(`
    SELECT id, title, category, views, answers_count, is_resolved
    FROM forum_questions
    WHERE is_approved = 1
    ORDER BY views DESC
    LIMIT ?
  `).bind(limit).all();
  
  return c.json({
    success: true,
    data: results.results
  });
});

// إحصائيات المحتوى
content.get('/stats', async (c) => {
  const db = c.env.DB;
  
  const articlesStats = await db.prepare(`
    SELECT 
      COUNT(*) as total_articles,
      SUM(views) as total_views
    FROM articles
    WHERE is_published = 1
  `).first();
  
  const forumStats = await db.prepare(`
    SELECT 
      COUNT(*) as total_questions,
      SUM(answers_count) as total_answers,
      SUM(CASE WHEN is_resolved = 1 THEN 1 ELSE 0 END) as resolved_questions
    FROM forum_questions
    WHERE is_approved = 1
  `).first();
  
  const topCategories = await db.prepare(`
    SELECT category, COUNT(*) as count
    FROM forum_questions
    WHERE is_approved = 1
    GROUP BY category
    ORDER BY count DESC
    LIMIT 5
  `).all();
  
  return c.json({
    success: true,
    data: {
      articles: articlesStats,
      forum: forumStats,
      top_categories: topCategories.results
    }
  });
});

export default content;
