// Payments API Routes - مسارات API للمدفوعات
import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import { paginate, calculatePlatformFee } from '../lib/db';

type Bindings = {
  DB: D1Database;
};

const payments = new Hono<{ Bindings: Bindings }>();

// الحصول على المدفوعات
payments.get('/', async (c) => {
  const db = c.env.DB;
  
  const case_id = c.req.query('case_id');
  const client_id = c.req.query('client_id');
  const lawyer_id = c.req.query('lawyer_id');
  const status = c.req.query('status');
  const page = parseInt(c.req.query('page') || '1');
  const limit = parseInt(c.req.query('limit') || '10');
  
  const { offset } = paginate({ page, limit });
  
  let query = `
    SELECT 
      p.*,
      cs.title as case_title,
      cs.case_type,
      c.full_name as client_name,
      l.full_name as lawyer_name
    FROM payments p
    JOIN cases cs ON p.case_id = cs.id
    JOIN clients c ON p.client_id = c.id
    JOIN lawyers l ON p.lawyer_id = l.id
    WHERE 1=1
  `;
  
  const params: any[] = [];
  
  if (case_id) {
    query += ` AND p.case_id = ?`;
    params.push(parseInt(case_id));
  }
  
  if (client_id) {
    query += ` AND p.client_id = ?`;
    params.push(parseInt(client_id));
  }
  
  if (lawyer_id) {
    query += ` AND p.lawyer_id = ?`;
    params.push(parseInt(lawyer_id));
  }
  
  if (status) {
    query += ` AND p.status = ?`;
    params.push(status);
  }
  
  // Count
  const countQuery = query.replace(/SELECT[\s\S]*?FROM/, 'SELECT COUNT(*) as total FROM');
  const countResult = await db.prepare(countQuery).bind(...params).first<{ total: number }>();
  
  query += ` ORDER BY p.created_at DESC LIMIT ? OFFSET ?`;
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

// إنشاء عملية دفع جديدة
payments.post('/', async (c) => {
  const db = c.env.DB;
  const body = await c.req.json();
  
  const {
    case_id,
    client_id,
    lawyer_id,
    amount,
    payment_type = 'full',
    installment_number = 1,
    total_installments = 1,
    payment_method
  } = body;
  
  if (!case_id || !client_id || !lawyer_id || !amount) {
    return c.json({
      success: false,
      error: 'يرجى ملء جميع الحقول المطلوبة'
    }, 400);
  }
  
  // Check if lawyer is premium
  const lawyer = await db.prepare(`
    SELECT is_premium FROM lawyers WHERE id = ?
  `).bind(lawyer_id).first<{ is_premium: number }>();
  
  const { platformFee, lawyerAmount } = calculatePlatformFee(
    amount,
    lawyer?.is_premium === 1
  );
  
  const result = await db.prepare(`
    INSERT INTO payments (
      case_id, client_id, lawyer_id, amount, platform_fee, lawyer_amount,
      payment_type, installment_number, total_installments, payment_method,
      status, escrow_status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'held', CURRENT_TIMESTAMP)
  `).bind(
    case_id, client_id, lawyer_id, amount, platformFee, lawyerAmount,
    payment_type, installment_number, total_installments, payment_method
  ).run();
  
  const newPayment = await db.prepare(`
    SELECT * FROM payments WHERE id = ?
  `).bind(result.meta.last_row_id).first();
  
  return c.json({
    success: true,
    data: newPayment,
    message: 'تم إنشاء عملية الدفع بنجاح'
  }, 201);
});

// الحصول على عملية دفع واحدة
payments.get('/:id', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  
  const payment = await db.prepare(`
    SELECT 
      p.*,
      cs.title as case_title,
      c.full_name as client_name,
      l.full_name as lawyer_name
    FROM payments p
    JOIN cases cs ON p.case_id = cs.id
    JOIN clients c ON p.client_id = c.id
    JOIN lawyers l ON p.lawyer_id = l.id
    WHERE p.id = ?
  `).bind(id).first();
  
  if (!payment) {
    return c.json({ success: false, error: 'عملية الدفع غير موجودة' }, 404);
  }
  
  return c.json({
    success: true,
    data: payment
  });
});

// تحديث حالة الدفع (محاكاة بوابة الدفع)
payments.post('/:id/process', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  const { transaction_id, status = 'completed' } = await c.req.json();
  
  const payment = await db.prepare(`
    SELECT * FROM payments WHERE id = ?
  `).bind(id).first();
  
  if (!payment) {
    return c.json({ success: false, error: 'عملية الدفع غير موجودة' }, 404);
  }
  
  await db.prepare(`
    UPDATE payments 
    SET status = ?, transaction_id = ?, completed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(status, transaction_id, id).run();
  
  // Update case payment status
  if (status === 'completed') {
    // Check if all installments are paid
    const casePayments = await db.prepare(`
      SELECT 
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as paid,
        COUNT(*) as total
      FROM payments
      WHERE case_id = (SELECT case_id FROM payments WHERE id = ?)
    `).bind(id).first<{ paid: number; total: number }>();
    
    const paymentStatus = casePayments?.paid === casePayments?.total 
      ? 'completed' 
      : 'partial';
    
    await db.prepare(`
      UPDATE cases 
      SET payment_status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = (SELECT case_id FROM payments WHERE id = ?)
    `).bind(paymentStatus, id).run();
  }
  
  const updated = await db.prepare(`SELECT * FROM payments WHERE id = ?`).bind(id).first();
  
  return c.json({
    success: true,
    data: updated,
    message: status === 'completed' ? 'تم الدفع بنجاح' : 'فشلت عملية الدفع'
  });
});

// تحرير المبلغ من الـ Escrow للمحامي
payments.post('/:id/release', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  
  const payment = await db.prepare(`
    SELECT * FROM payments WHERE id = ? AND status = 'completed' AND escrow_status = 'held'
  `).bind(id).first();
  
  if (!payment) {
    return c.json({
      success: false,
      error: 'لا يمكن تحرير المبلغ - عملية الدفع غير مكتملة أو تم تحريرها مسبقاً'
    }, 400);
  }
  
  await db.prepare(`
    UPDATE payments 
    SET escrow_status = 'released', escrow_released_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).bind(id).run();
  
  const updated = await db.prepare(`SELECT * FROM payments WHERE id = ?`).bind(id).first();
  
  return c.json({
    success: true,
    data: updated,
    message: 'تم تحرير المبلغ للمحامي'
  });
});

// استرداد المبلغ
payments.post('/:id/refund', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  const { reason } = await c.req.json();
  
  const payment = await db.prepare(`
    SELECT * FROM payments WHERE id = ? AND escrow_status = 'held'
  `).bind(id).first();
  
  if (!payment) {
    return c.json({
      success: false,
      error: 'لا يمكن استرداد المبلغ - تم تحريره للمحامي'
    }, 400);
  }
  
  await db.prepare(`
    UPDATE payments 
    SET status = 'refunded', escrow_status = 'refunded'
    WHERE id = ?
  `).bind(id).run();
  
  const updated = await db.prepare(`SELECT * FROM payments WHERE id = ?`).bind(id).first();
  
  return c.json({
    success: true,
    data: updated,
    message: 'تم استرداد المبلغ بنجاح'
  });
});

// حساب الأتعاب المقدرة
payments.post('/calculate-fee', async (c) => {
  const db = c.env.DB;
  const { amount, lawyer_id } = await c.req.json();
  
  if (!amount) {
    return c.json({ success: false, error: 'يرجى تحديد المبلغ' }, 400);
  }
  
  let isPremium = false;
  if (lawyer_id) {
    const lawyer = await db.prepare(`
      SELECT is_premium FROM lawyers WHERE id = ?
    `).bind(lawyer_id).first<{ is_premium: number }>();
    isPremium = lawyer?.is_premium === 1;
  }
  
  const { platformFee, lawyerAmount, feePercentage } = calculatePlatformFee(amount, isPremium);
  
  return c.json({
    success: true,
    data: {
      total_amount: amount,
      platform_fee: platformFee,
      lawyer_amount: lawyerAmount,
      fee_percentage: feePercentage
    }
  });
});

// إحصائيات المدفوعات
payments.get('/stats/overview', async (c) => {
  const db = c.env.DB;
  
  const stats = await db.prepare(`
    SELECT 
      COUNT(*) as total_transactions,
      SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_amount,
      SUM(CASE WHEN status = 'completed' THEN platform_fee ELSE 0 END) as total_platform_fees,
      SUM(CASE WHEN status = 'completed' THEN lawyer_amount ELSE 0 END) as total_lawyer_earnings,
      SUM(CASE WHEN escrow_status = 'held' THEN amount ELSE 0 END) as escrow_balance
    FROM payments
  `).first();
  
  const monthlyRevenue = await db.prepare(`
    SELECT 
      strftime('%Y-%m', completed_at) as month,
      SUM(amount) as total,
      SUM(platform_fee) as platform_revenue
    FROM payments
    WHERE status = 'completed' AND completed_at >= date('now', '-12 months')
    GROUP BY strftime('%Y-%m', completed_at)
    ORDER BY month DESC
  `).all();
  
  return c.json({
    success: true,
    data: {
      overview: stats,
      monthly_revenue: monthlyRevenue.results
    }
  });
});

// أرباح المحامي
payments.get('/lawyer/:lawyerId/earnings', async (c) => {
  const db = c.env.DB;
  const lawyerId = parseInt(c.req.param('lawyerId'));
  
  const earnings = await db.prepare(`
    SELECT 
      SUM(CASE WHEN status = 'completed' THEN lawyer_amount ELSE 0 END) as total_earnings,
      SUM(CASE WHEN status = 'completed' AND escrow_status = 'released' THEN lawyer_amount ELSE 0 END) as released_earnings,
      SUM(CASE WHEN status = 'completed' AND escrow_status = 'held' THEN lawyer_amount ELSE 0 END) as pending_earnings,
      COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_payments
    FROM payments
    WHERE lawyer_id = ?
  `).bind(lawyerId).first();
  
  // Get monthly earnings (current month)
  const monthlyEarnings = await db.prepare(`
    SELECT 
      SUM(lawyer_amount) as monthly_earnings
    FROM payments
    WHERE lawyer_id = ? AND status = 'completed' 
      AND strftime('%Y-%m', completed_at) = strftime('%Y-%m', 'now')
  `).bind(lawyerId).first();

  // Get transactions
  const transactions = await db.prepare(`
    SELECT 
      p.*,
      cs.title as case_title
    FROM payments p
    JOIN cases cs ON p.case_id = cs.id
    WHERE p.lawyer_id = ? AND p.status = 'completed'
    ORDER BY p.created_at DESC
    LIMIT 20
  `).bind(lawyerId).all();
  
  return c.json({
    success: true,
    data: {
      total_earnings: earnings?.total_earnings || 0,
      released_earnings: earnings?.released_earnings || 0,
      pending_earnings: earnings?.pending_earnings || 0,
      monthly_earnings: monthlyEarnings?.monthly_earnings || 0,
      transactions: transactions.results
    }
  });
});

export default payments;
