-- منصة حقوقي - قاعدة البيانات الأساسية
-- Hoqouqi Platform - Initial Database Schema

-- جدول المستخدمين (العملاء والمحامين)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  phone TEXT UNIQUE,
  user_type TEXT NOT NULL CHECK (user_type IN ('client', 'lawyer', 'admin')),
  is_verified INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- جدول ملفات العملاء
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  national_id TEXT,
  governorate TEXT,
  city TEXT,
  address TEXT,
  profile_image TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- جدول المحامين
CREATE TABLE IF NOT EXISTS lawyers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  bar_registration_number TEXT UNIQUE NOT NULL,
  bar_level TEXT NOT NULL CHECK (bar_level IN ('general', 'primary', 'appeal', 'cassation')),
  registration_year INTEGER NOT NULL,
  years_of_experience INTEGER NOT NULL,
  primary_specialization TEXT NOT NULL,
  secondary_specializations TEXT, -- JSON array
  profile_image TEXT,
  intro_video TEXT,
  bio TEXT,
  governorate TEXT NOT NULL,
  city TEXT NOT NULL,
  office_address TEXT,
  
  -- الإحصائيات
  total_cases INTEGER DEFAULT 0,
  won_cases INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 0,
  avg_case_duration INTEGER DEFAULT 0, -- بالأيام
  avg_response_time INTEGER DEFAULT 0, -- بالدقائق
  
  -- التقييمات
  avg_rating REAL DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  
  -- نقاط وشارات
  lawyer_score INTEGER DEFAULT 0,
  is_top_lawyer INTEGER DEFAULT 0,
  is_rising_star INTEGER DEFAULT 0,
  is_premium INTEGER DEFAULT 0,
  
  -- الأتعاب
  min_consultation_fee INTEGER DEFAULT 400,
  hourly_rate INTEGER DEFAULT 500,
  
  -- حالة الحساب
  is_verified INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- جدول تخصصات المحامين التفصيلية
CREATE TABLE IF NOT EXISTS lawyer_specializations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lawyer_id INTEGER NOT NULL,
  specialization TEXT NOT NULL,
  case_type TEXT NOT NULL,
  cases_handled INTEGER DEFAULT 0,
  success_rate REAL DEFAULT 0,
  FOREIGN KEY (lawyer_id) REFERENCES lawyers(id) ON DELETE CASCADE
);

-- جدول القضايا
CREATE TABLE IF NOT EXISTS cases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  lawyer_id INTEGER,
  
  -- معلومات القضية
  case_number TEXT UNIQUE,
  case_type TEXT NOT NULL,
  case_category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- حالة القضية
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'in_progress', 'completed', 'cancelled', 'settled')),
  urgency TEXT DEFAULT 'normal' CHECK (urgency IN ('normal', 'medium', 'urgent')),
  
  -- الموقع والمحكمة
  governorate TEXT,
  city TEXT,
  court_name TEXT,
  
  -- التواريخ
  start_date DATETIME,
  expected_end_date DATETIME,
  actual_end_date DATETIME,
  
  -- النتيجة
  outcome TEXT CHECK (outcome IN ('won', 'lost', 'settled', 'ongoing', NULL)),
  outcome_details TEXT,
  
  -- المالية
  agreed_fee INTEGER,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'completed', 'refunded')),
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (lawyer_id) REFERENCES lawyers(id)
);

-- جدول مراحل القضية (Timeline)
CREATE TABLE IF NOT EXISTS case_timeline (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  stage TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  documents TEXT, -- JSON array of document URLs
  hearing_date DATETIME,
  decision TEXT,
  is_completed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE
);

-- جدول المستندات
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  uploaded_by INTEGER NOT NULL, -- user_id
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  ocr_text TEXT,
  notes TEXT,
  is_private INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY (uploaded_by) REFERENCES users(id)
);

-- جدول التقييمات
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  client_id INTEGER NOT NULL,
  lawyer_id INTEGER NOT NULL,
  
  -- التقييم العام
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  
  -- التقييمات التفصيلية
  professionalism_rating INTEGER CHECK (professionalism_rating BETWEEN 1 AND 5),
  communication_rating INTEGER CHECK (communication_rating BETWEEN 1 AND 5),
  punctuality_rating INTEGER CHECK (punctuality_rating BETWEEN 1 AND 5),
  transparency_rating INTEGER CHECK (transparency_rating BETWEEN 1 AND 5),
  value_for_money_rating INTEGER CHECK (value_for_money_rating BETWEEN 1 AND 5),
  
  comment TEXT,
  would_recommend INTEGER DEFAULT 1,
  
  -- رد المحامي
  lawyer_response TEXT,
  lawyer_response_date DATETIME,
  
  -- حالة المراجعة
  is_approved INTEGER DEFAULT 1,
  is_flagged INTEGER DEFAULT 0,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (lawyer_id) REFERENCES lawyers(id)
);

-- جدول المدفوعات
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  client_id INTEGER NOT NULL,
  lawyer_id INTEGER NOT NULL,
  
  -- تفاصيل الدفع
  amount INTEGER NOT NULL,
  platform_fee INTEGER NOT NULL,
  lawyer_amount INTEGER NOT NULL,
  
  payment_type TEXT NOT NULL CHECK (payment_type IN ('full', 'installment', 'hourly')),
  installment_number INTEGER DEFAULT 1,
  total_installments INTEGER DEFAULT 1,
  
  payment_method TEXT,
  transaction_id TEXT,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'refunded')),
  
  -- Escrow
  escrow_status TEXT DEFAULT 'held' CHECK (escrow_status IN ('held', 'released', 'refunded')),
  escrow_released_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (case_id) REFERENCES cases(id),
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (lawyer_id) REFERENCES lawyers(id)
);

-- جدول الرسائل
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  case_id INTEGER NOT NULL,
  sender_id INTEGER NOT NULL,
  receiver_id INTEGER NOT NULL,
  
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'audio', 'video', 'system')),
  content TEXT NOT NULL,
  file_url TEXT,
  
  is_read INTEGER DEFAULT 0,
  read_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id),
  FOREIGN KEY (receiver_id) REFERENCES users(id)
);

-- جدول طلبات الاستشارات
CREATE TABLE IF NOT EXISTS consultations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  lawyer_id INTEGER NOT NULL,
  
  consultation_type TEXT NOT NULL CHECK (consultation_type IN ('text', 'voice', 'video')),
  duration_minutes INTEGER DEFAULT 30,
  scheduled_at DATETIME,
  
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  
  fee INTEGER NOT NULL,
  payment_id INTEGER,
  
  notes TEXT,
  recording_url TEXT,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (lawyer_id) REFERENCES lawyers(id),
  FOREIGN KEY (payment_id) REFERENCES payments(id)
);

-- جدول الإشعارات
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  
  notification_type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  
  is_read INTEGER DEFAULT 0,
  read_at DATETIME,
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- جدول شهادات المحامي
CREATE TABLE IF NOT EXISTS lawyer_certificates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lawyer_id INTEGER NOT NULL,
  certificate_name TEXT NOT NULL,
  issuing_authority TEXT,
  issue_date DATE,
  certificate_url TEXT,
  is_verified INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lawyer_id) REFERENCES lawyers(id) ON DELETE CASCADE
);

-- جدول المقالات (أكاديمية حقوقي)
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  author_id INTEGER,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  summary TEXT,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT, -- JSON array
  cover_image TEXT,
  views INTEGER DEFAULT 0,
  is_published INTEGER DEFAULT 1,
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

-- جدول أسئلة المنتدى
CREATE TABLE IF NOT EXISTS forum_questions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL,
  tags TEXT, -- JSON array
  views INTEGER DEFAULT 0,
  answers_count INTEGER DEFAULT 0,
  is_resolved INTEGER DEFAULT 0,
  best_answer_id INTEGER,
  is_approved INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- جدول إجابات المنتدى
CREATE TABLE IF NOT EXISTS forum_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  question_id INTEGER NOT NULL,
  lawyer_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  is_best_answer INTEGER DEFAULT 0,
  upvotes INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES forum_questions(id) ON DELETE CASCADE,
  FOREIGN KEY (lawyer_id) REFERENCES lawyers(id)
);

-- جدول اشتراكات الشركات B2B
CREATE TABLE IF NOT EXISTS company_subscriptions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  
  plan_type TEXT NOT NULL CHECK (plan_type IN ('basic', 'advanced', 'enterprise')),
  monthly_fee INTEGER NOT NULL,
  consultation_hours INTEGER NOT NULL,
  contract_reviews INTEGER,
  
  assigned_lawyers TEXT, -- JSON array of lawyer IDs
  
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'cancelled', 'expired')),
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- إنشاء الفهارس للتحسين
CREATE INDEX IF NOT EXISTS idx_lawyers_governorate ON lawyers(governorate);
CREATE INDEX IF NOT EXISTS idx_lawyers_specialization ON lawyers(primary_specialization);
CREATE INDEX IF NOT EXISTS idx_lawyers_bar_level ON lawyers(bar_level);
CREATE INDEX IF NOT EXISTS idx_lawyers_is_verified ON lawyers(is_verified);
CREATE INDEX IF NOT EXISTS idx_lawyers_avg_rating ON lawyers(avg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_lawyers_lawyer_score ON lawyers(lawyer_score DESC);

CREATE INDEX IF NOT EXISTS idx_cases_client_id ON cases(client_id);
CREATE INDEX IF NOT EXISTS idx_cases_lawyer_id ON cases(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_case_type ON cases(case_type);

CREATE INDEX IF NOT EXISTS idx_reviews_lawyer_id ON reviews(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_overall_rating ON reviews(overall_rating);

CREATE INDEX IF NOT EXISTS idx_messages_case_id ON messages(case_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_case_id ON payments(case_id);

CREATE INDEX IF NOT EXISTS idx_articles_slug ON articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_user_type ON users(user_type);
