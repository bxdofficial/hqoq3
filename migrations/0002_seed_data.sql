-- بيانات تجريبية لمنصة حقوقي
-- Seed data for Hoqouqi Platform

-- إضافة مستخدمين تجريبيين (كلمة السر: password123)
INSERT OR IGNORE INTO users (id, email, password_hash, phone, user_type, is_verified, is_active) VALUES
(1, 'admin@hoqouqi.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsM4V2r0Mz5b0/JY0/1M0qaNqO', '01000000000', 'admin', 1, 1),
(2, 'ahmed.lawyer@email.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsM4V2r0Mz5b0/JY0/1M0qaNqO', '01000000001', 'lawyer', 1, 1),
(3, 'mohamed.lawyer@email.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsM4V2r0Mz5b0/JY0/1M0qaNqO', '01000000002', 'lawyer', 1, 1),
(4, 'sara.lawyer@email.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsM4V2r0Mz5b0/JY0/1M0qaNqO', '01000000003', 'lawyer', 1, 1),
(5, 'khaled.lawyer@email.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsM4V2r0Mz5b0/JY0/1M0qaNqO', '01000000004', 'lawyer', 1, 1),
(6, 'fatma.lawyer@email.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsM4V2r0Mz5b0/JY0/1M0qaNqO', '01000000005', 'lawyer', 1, 1),
(7, 'omar.lawyer@email.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsM4V2r0Mz5b0/JY0/1M0qaNqO', '01000000006', 'lawyer', 1, 1),
(8, 'client1@email.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsM4V2r0Mz5b0/JY0/1M0qaNqO', '01100000001', 'client', 1, 1),
(9, 'client2@email.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsM4V2r0Mz5b0/JY0/1M0qaNqO', '01100000002', 'client', 1, 1),
(10, 'client3@email.com', '$2a$10$XOPbrlUPQdwdJUpSrIF6X.LbE14qsM4V2r0Mz5b0/JY0/1M0qaNqO', '01100000003', 'client', 1, 1);

-- إضافة بيانات العملاء
INSERT OR IGNORE INTO clients (id, user_id, full_name, governorate, city) VALUES
(1, 8, 'عبدالله محمد أحمد', 'القاهرة', 'مدينة نصر'),
(2, 9, 'منى سمير حسن', 'الجيزة', 'الدقي'),
(3, 10, 'طارق إبراهيم علي', 'الإسكندرية', 'سيدي جابر');

-- إضافة بيانات المحامين
INSERT OR IGNORE INTO lawyers (
  id, user_id, full_name, bar_registration_number, bar_level, registration_year, years_of_experience,
  primary_specialization, secondary_specializations, bio, governorate, city, office_address,
  total_cases, won_cases, success_rate, avg_response_time, avg_rating, total_reviews,
  lawyer_score, is_top_lawyer, is_premium, min_consultation_fee, hourly_rate, is_verified, is_active
) VALUES
(1, 2, 'أحمد محمود السيد', 'CAI-2010-12345', 'cassation', 2010, 14,
 'criminal', '["civil", "family"]', 
 'محامي بالنقض والإدارية العليا، خبرة 14 عاماً في القضايا الجنائية والمدنية. حاصل على ماجستير في القانون الجنائي من جامعة القاهرة. عضو اتحاد المحامين العرب.',
 'القاهرة', 'المعادي', 'شارع 9، المعادي، القاهرة',
 156, 134, 85.9, 30, 4.8, 89,
 92, 1, 1, 800, 1500, 1, 1),

(2, 3, 'محمد عبدالرحمن حسين', 'CAI-2012-23456', 'appeal', 2012, 12,
 'family', '["civil", "sharia"]',
 'محامي استئناف متخصص في قضايا الأحوال الشخصية والأسرة. خبرة واسعة في قضايا الطلاق والنفقة والحضانة والمواريث.',
 'القاهرة', 'مصر الجديدة', 'شارع الحجاز، مصر الجديدة',
 203, 178, 87.7, 25, 4.9, 142,
 95, 1, 1, 600, 1200, 1, 1),

(3, 4, 'سارة أحمد الشريف', 'CAI-2015-34567', 'appeal', 2015, 9,
 'civil', '["commercial", "labor"]',
 'محامية استئناف متخصصة في القضايا المدنية والتجارية وقانون العمل. حاصلة على شهادة في التحكيم التجاري الدولي.',
 'الجيزة', 'الدقي', 'شارع التحرير، الدقي',
 98, 81, 82.6, 20, 4.7, 65,
 85, 0, 1, 500, 1000, 1, 1),

(4, 5, 'خالد إبراهيم محمود', 'ALX-2008-45678', 'cassation', 2008, 16,
 'commercial', '["civil", "administrative"]',
 'محامي بالنقض، خبير في القانون التجاري وتأسيس الشركات. مستشار قانوني لعدة شركات كبرى. عضو غرفة التجارة المصرية.',
 'الإسكندرية', 'سموحة', 'شارع أبو قير، سموحة',
 189, 167, 88.4, 35, 4.8, 112,
 90, 1, 0, 1000, 2000, 1, 1),

(5, 6, 'فاطمة علي حسن', 'CAI-2016-56789', 'primary', 2016, 8,
 'labor', '["civil", "administrative"]',
 'محامية ابتدائي متخصصة في قانون العمل والقضايا العمالية. مدافعة عن حقوق العمال. حاصلة على دبلوم في حقوق الإنسان.',
 'القاهرة', 'شبرا', 'شارع شبرا الرئيسي',
 76, 59, 77.6, 15, 4.5, 43,
 78, 0, 0, 400, 700, 1, 1),

(6, 7, 'عمر سعيد عبدالله', 'GIZ-2014-67890', 'appeal', 2014, 10,
 'administrative', '["civil", "criminal"]',
 'محامي استئناف متخصص في القضايا الإدارية والمحاكم الإدارية. خبرة في قضايا الموظفين والتعويضات.',
 'الجيزة', '6 أكتوبر', 'المنطقة المركزية، 6 أكتوبر',
 124, 98, 79.0, 28, 4.6, 78,
 82, 0, 1, 600, 1100, 1, 1);

-- إضافة تخصصات تفصيلية للمحامين
INSERT OR IGNORE INTO lawyer_specializations (lawyer_id, specialization, case_type, cases_handled, success_rate) VALUES
-- أحمد محمود السيد
(1, 'criminal', 'murder', 12, 83.3),
(1, 'criminal', 'theft', 45, 91.1),
(1, 'criminal', 'drugs', 28, 82.1),
(1, 'criminal', 'fraud', 35, 88.6),
(1, 'civil', 'compensation', 20, 85.0),

-- محمد عبدالرحمن حسين
(2, 'family', 'divorce', 78, 89.7),
(2, 'family', 'khula', 45, 93.3),
(2, 'family', 'custody', 38, 84.2),
(2, 'family', 'alimony', 52, 86.5),
(2, 'sharia', 'inheritance', 25, 88.0),

-- سارة أحمد الشريف
(3, 'civil', 'contracts', 35, 82.9),
(3, 'civil', 'property', 28, 85.7),
(3, 'commercial', 'company_disputes', 18, 77.8),
(3, 'labor', 'unfair_dismissal', 22, 86.4),

-- خالد إبراهيم محمود
(4, 'commercial', 'company_formation', 45, 100.0),
(4, 'commercial', 'contracts', 58, 89.7),
(4, 'commercial', 'bankruptcy', 15, 73.3),
(4, 'civil', 'real_estate', 35, 85.7),

-- فاطمة علي حسن
(5, 'labor', 'wages', 28, 82.1),
(5, 'labor', 'unfair_dismissal', 32, 75.0),
(5, 'labor', 'work_injuries', 16, 75.0),

-- عمر سعيد عبدالله
(6, 'administrative', 'employee_disputes', 48, 79.2),
(6, 'administrative', 'compensation', 35, 80.0),
(6, 'administrative', 'pension', 22, 77.3);

-- إضافة بعض القضايا التجريبية
INSERT OR IGNORE INTO cases (
  id, client_id, lawyer_id, case_number, case_type, case_category, title, description,
  status, urgency, governorate, city, court_name, start_date, agreed_fee, payment_status
) VALUES
(1, 1, 1, 'CRIM-2024-001', 'criminal', 'fraud', 'قضية نصب واحتيال',
 'قضية نصب واحتيال من شركة وهمية للاستثمار العقاري. تم الاستيلاء على مبلغ 500,000 جنيه.',
 'in_progress', 'urgent', 'القاهرة', 'المعادي', 'محكمة المعادي الجزئية',
 '2024-10-15', 15000, 'partial'),

(2, 2, 2, 'FAM-2024-002', 'family', 'divorce', 'قضية خلع',
 'طلب خلع مع التنازل عن جميع الحقوق المالية.',
 'in_progress', 'medium', 'الجيزة', 'الدقي', 'محكمة الأسرة بالجيزة',
 '2024-11-01', 5000, 'completed'),

(3, 3, 4, 'COMM-2024-003', 'commercial', 'contracts', 'نزاع عقد شراكة',
 'نزاع حول بنود عقد شراكة تجارية وتوزيع الأرباح.',
 'completed', 'normal', 'الإسكندرية', 'سموحة', 'محكمة الإسكندرية الاقتصادية',
 '2024-08-20', 25000, 'completed');

-- إضافة مراحل للقضايا
INSERT OR IGNORE INTO case_timeline (case_id, stage, title, description, is_completed, created_at) VALUES
(1, 'investigation', 'تقديم البلاغ', 'تم تقديم البلاغ للنيابة العامة', 1, '2024-10-15'),
(1, 'investigation', 'التحقيقات', 'جاري التحقيق مع المتهمين', 1, '2024-10-20'),
(1, 'trial', 'أولى الجلسات', 'تحديد موعد أول جلسة', 0, '2024-11-15'),

(2, 'filing', 'رفع الدعوى', 'تم رفع دعوى الخلع', 1, '2024-11-01'),
(2, 'mediation', 'محاولة الصلح', 'تمت محاولة الصلح ولم تنجح', 1, '2024-11-10'),
(2, 'trial', 'جلسة المرافعة', 'جلسة المرافعة والحكم', 0, '2024-12-01'),

(3, 'filing', 'رفع الدعوى', 'تم رفع دعوى النزاع التجاري', 1, '2024-08-20'),
(3, 'evidence', 'تقديم المستندات', 'تم تقديم جميع المستندات والعقود', 1, '2024-09-05'),
(3, 'judgment', 'صدور الحكم', 'صدر الحكم لصالح الموكل', 1, '2024-11-10');

-- إضافة تقييمات
INSERT OR IGNORE INTO reviews (
  case_id, client_id, lawyer_id, overall_rating, professionalism_rating, 
  communication_rating, punctuality_rating, transparency_rating, value_for_money_rating,
  comment, would_recommend
) VALUES
(3, 3, 4, 5, 5, 5, 5, 5, 5,
 'محامي ممتاز ومحترف جداً. ساعدني في قضية معقدة وكسبناها بفضل الله ثم خبرته الواسعة.',
 1);

-- إضافة مقالات تعليمية
INSERT OR IGNORE INTO articles (
  author_id, title, slug, summary, content, category, tags, views, is_published, published_at
) VALUES
(1, 'حقوقك كمستأجر في القانون المصري 2024', 'tenant-rights-egypt-2024',
 'دليل شامل لحقوق المستأجر في مصر وكيفية حماية نفسك من الطرد التعسفي',
 'محتوى المقال الكامل هنا...',
 'civil', '["إيجار", "عقارات", "حقوق المستأجر"]', 1250, 1, '2024-09-15'),

(1, 'خطوات رفع دعوى الخلع في مصر', 'khula-lawsuit-steps-egypt',
 'دليل خطوة بخطوة لرفع دعوى الخلع والإجراءات المطلوبة',
 'محتوى المقال الكامل هنا...',
 'family', '["خلع", "طلاق", "أحوال شخصية"]', 3420, 1, '2024-10-01'),

(1, 'كيف تحمي نفسك من النصب في العقود', 'protect-from-contract-fraud',
 'نصائح قانونية لتجنب الوقوع ضحية للنصب والاحتيال في التعاملات التجارية',
 'محتوى المقال الكامل هنا...',
 'commercial', '["نصب", "عقود", "احتيال"]', 2180, 1, '2024-10-20');

-- إضافة أسئلة في المنتدى
INSERT OR IGNORE INTO forum_questions (
  user_id, title, content, category, tags, views, answers_count, is_approved
) VALUES
(8, 'هل يحق للمالك طردي بدون إنذار؟',
 'أنا مستأجر منذ 5 سنوات والمالك يريد طردي فجأة بدون أي إنذار مسبق. هل يحق له ذلك قانونياً؟',
 'civil', '["إيجار", "طرد", "مستأجر"]', 450, 3, 1),

(9, 'ما هي مدة قضية الخلع؟',
 'أريد رفع قضية خلع. كم تستغرق المدة من رفع الدعوى حتى صدور الحكم النهائي؟',
 'family', '["خلع", "طلاق", "مدة القضية"]', 680, 2, 1);

-- إضافة إجابات على الأسئلة
INSERT OR IGNORE INTO forum_answers (question_id, lawyer_id, content, is_best_answer, upvotes) VALUES
(1, 2, 'لا يحق للمالك طردك بدون إنذار مسبق. وفقاً لقانون الإيجار المصري، يجب أن يكون هناك سبب قانوني للإخلاء مع إنذار رسمي. أنصحك بالتواصل مع محامي متخصص لحماية حقوقك.', 1, 15),
(1, 3, 'بالإضافة لما ذكره الزميل، إذا كان عقد الإيجار قديم (قبل 1996) فلديك حماية إضافية بموجب القانون.', 0, 8),
(2, 2, 'قضية الخلع عادة تستغرق من 3 إلى 6 أشهر من تاريخ رفع الدعوى. لكن هذا يعتمد على عدة عوامل منها ازدحام المحكمة ومدى تعاون الطرف الآخر.', 1, 22);
