// Database types for Hoqouqi Platform
// أنواع قاعدة البيانات لمنصة حقوقي

export interface User {
  id: number;
  email: string;
  password_hash: string;
  phone: string | null;
  user_type: 'client' | 'lawyer' | 'admin';
  is_verified: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface Client {
  id: number;
  user_id: number;
  full_name: string;
  national_id: string | null;
  governorate: string | null;
  city: string | null;
  address: string | null;
  profile_image: string | null;
  created_at: string;
  updated_at: string;
}

export interface Lawyer {
  id: number;
  user_id: number;
  full_name: string;
  bar_registration_number: string;
  bar_level: 'general' | 'primary' | 'appeal' | 'cassation';
  registration_year: number;
  years_of_experience: number;
  primary_specialization: string;
  secondary_specializations: string | null;
  profile_image: string | null;
  intro_video: string | null;
  bio: string | null;
  governorate: string;
  city: string;
  office_address: string | null;
  total_cases: number;
  won_cases: number;
  success_rate: number;
  avg_case_duration: number;
  avg_response_time: number;
  avg_rating: number;
  total_reviews: number;
  lawyer_score: number;
  is_top_lawyer: number;
  is_rising_star: number;
  is_premium: number;
  min_consultation_fee: number;
  hourly_rate: number;
  is_verified: number;
  is_active: number;
  created_at: string;
  updated_at: string;
}

export interface LawyerSpecialization {
  id: number;
  lawyer_id: number;
  specialization: string;
  case_type: string;
  cases_handled: number;
  success_rate: number;
}

export interface Case {
  id: number;
  client_id: number;
  lawyer_id: number | null;
  case_number: string | null;
  case_type: string;
  case_category: string;
  title: string;
  description: string;
  status: 'pending' | 'matched' | 'in_progress' | 'completed' | 'cancelled' | 'settled';
  urgency: 'normal' | 'medium' | 'urgent';
  governorate: string | null;
  city: string | null;
  court_name: string | null;
  start_date: string | null;
  expected_end_date: string | null;
  actual_end_date: string | null;
  outcome: 'won' | 'lost' | 'settled' | 'ongoing' | null;
  outcome_details: string | null;
  agreed_fee: number | null;
  payment_status: 'pending' | 'partial' | 'completed' | 'refunded';
  created_at: string;
  updated_at: string;
}

export interface CaseTimeline {
  id: number;
  case_id: number;
  stage: string;
  title: string;
  description: string | null;
  documents: string | null;
  hearing_date: string | null;
  decision: string | null;
  is_completed: number;
  created_at: string;
}

export interface Review {
  id: number;
  case_id: number;
  client_id: number;
  lawyer_id: number;
  overall_rating: number;
  professionalism_rating: number | null;
  communication_rating: number | null;
  punctuality_rating: number | null;
  transparency_rating: number | null;
  value_for_money_rating: number | null;
  comment: string | null;
  would_recommend: number;
  lawyer_response: string | null;
  lawyer_response_date: string | null;
  is_approved: number;
  is_flagged: number;
  created_at: string;
}

export interface Payment {
  id: number;
  case_id: number;
  client_id: number;
  lawyer_id: number;
  amount: number;
  platform_fee: number;
  lawyer_amount: number;
  payment_type: 'full' | 'installment' | 'hourly';
  installment_number: number;
  total_installments: number;
  payment_method: string | null;
  transaction_id: string | null;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  escrow_status: 'held' | 'released' | 'refunded';
  escrow_released_at: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface Message {
  id: number;
  case_id: number;
  sender_id: number;
  receiver_id: number;
  message_type: 'text' | 'file' | 'audio' | 'video' | 'system';
  content: string;
  file_url: string | null;
  is_read: number;
  read_at: string | null;
  created_at: string;
}

export interface Consultation {
  id: number;
  client_id: number;
  lawyer_id: number;
  consultation_type: 'text' | 'voice' | 'video';
  duration_minutes: number;
  scheduled_at: string | null;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  fee: number;
  payment_id: number | null;
  notes: string | null;
  recording_url: string | null;
  created_at: string;
}

export interface Article {
  id: number;
  author_id: number | null;
  title: string;
  slug: string;
  summary: string | null;
  content: string;
  category: string;
  tags: string | null;
  cover_image: string | null;
  views: number;
  is_published: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ForumQuestion {
  id: number;
  user_id: number;
  title: string;
  content: string;
  category: string;
  tags: string | null;
  views: number;
  answers_count: number;
  is_resolved: number;
  best_answer_id: number | null;
  is_approved: number;
  created_at: string;
  updated_at: string;
}

export interface ForumAnswer {
  id: number;
  question_id: number;
  lawyer_id: number;
  content: string;
  is_best_answer: number;
  upvotes: number;
  created_at: string;
  updated_at: string;
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Search & Filter Types
export interface LawyerSearchParams {
  query?: string;
  specialization?: string;
  case_type?: string;
  governorate?: string;
  city?: string;
  bar_level?: string;
  min_rating?: number;
  max_fee?: number;
  urgency?: string;
  sort_by?: 'rating' | 'experience' | 'success_rate' | 'price' | 'distance';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export interface CaseSearchParams {
  status?: string;
  case_type?: string;
  client_id?: number;
  lawyer_id?: number;
  date_from?: string;
  date_to?: string;
  page?: number;
  limit?: number;
}

// Smart Matching Types
export interface MatchingCriteria {
  case_type: string;
  case_category: string;
  description: string;
  budget_min?: number;
  budget_max?: number;
  governorate: string;
  city?: string;
  urgency: 'normal' | 'medium' | 'urgent';
}

export interface MatchedLawyer extends Lawyer {
  match_score: number;
  match_reasons: string[];
  estimated_fee_range: {
    min: number;
    max: number;
  };
  estimated_duration: string;
  specialization_success_rate: number;
}

// Dashboard Types
export interface LawyerDashboard {
  active_cases: number;
  pending_requests: number;
  total_earnings: number;
  avg_rating: number;
  recent_cases: Case[];
  recent_reviews: Review[];
  upcoming_hearings: CaseTimeline[];
}

export interface ClientDashboard {
  active_cases: number;
  completed_cases: number;
  total_spent: number;
  current_case?: Case;
  case_timeline?: CaseTimeline[];
}

// Constants
export const CASE_TYPES = {
  criminal: 'جنائي',
  civil: 'مدني',
  family: 'أحوال شخصية',
  commercial: 'تجاري',
  administrative: 'إداري',
  labor: 'عمالي',
  sharia: 'شرعي'
} as const;

export const CASE_CATEGORIES = {
  criminal: {
    murder: 'قتل',
    theft: 'سرقة',
    fraud: 'نصب واحتيال',
    drugs: 'مخدرات',
    assault: 'ضرب وإيذاء',
    weapons: 'أسلحة'
  },
  civil: {
    contracts: 'عقود',
    property: 'عقارات',
    compensation: 'تعويضات',
    inheritance: 'ميراث'
  },
  family: {
    divorce: 'طلاق',
    khula: 'خلع',
    custody: 'حضانة',
    alimony: 'نفقة',
    visitation: 'رؤية'
  },
  commercial: {
    company_formation: 'تأسيس شركات',
    contracts: 'عقود تجارية',
    bankruptcy: 'إفلاس',
    company_disputes: 'نزاعات شركات'
  },
  administrative: {
    employee_disputes: 'نزاعات موظفين',
    compensation: 'تعويضات',
    pension: 'معاشات'
  },
  labor: {
    wages: 'أجور',
    unfair_dismissal: 'فصل تعسفي',
    work_injuries: 'إصابات عمل'
  },
  sharia: {
    inheritance: 'مواريث',
    waqf: 'أوقاف',
    marriage: 'زواج'
  }
} as const;

export const BAR_LEVELS = {
  general: 'عام',
  primary: 'ابتدائي',
  appeal: 'استئناف',
  cassation: 'نقض'
} as const;

export const GOVERNORATES = [
  'القاهرة', 'الجيزة', 'الإسكندرية', 'الدقهلية', 'الشرقية',
  'القليوبية', 'الغربية', 'المنوفية', 'البحيرة', 'كفر الشيخ',
  'الفيوم', 'بني سويف', 'المنيا', 'أسيوط', 'سوهاج',
  'قنا', 'الأقصر', 'أسوان', 'البحر الأحمر', 'الوادي الجديد',
  'مطروح', 'شمال سيناء', 'جنوب سيناء', 'بورسعيد', 'السويس',
  'الإسماعيلية', 'دمياط'
] as const;

// Fee Guidelines (from Bar Association)
export const FEE_GUIDELINES = {
  consultation: {
    general: { min: 400, max: 600 },
    primary: { min: 500, max: 800 },
    appeal: { min: 700, max: 1200 },
    cassation: { min: 1000, max: 2000 }
  },
  criminal: {
    assault: { first: 3500, appeal: 4000 },
    theft: { first: 3500, appeal: 4000 },
    fraud: { first: 4000, appeal: 5000 },
    drugs_possession: { first: 12000 },
    drugs_trafficking: { first: 18000 },
    murder: { first: 30000 }
  },
  family: {
    alimony: { first: 3500, appeal: 4000 },
    khula: { first: 5000 },
    divorce: { first: 3500, appeal: 5000 },
    custody: { first: 3000, appeal: 3500 }
  },
  civil: {
    signature_validation: { fee: 3000 },
    eviction: { fee: 10000 },
    contract_termination: { fee: 10000 }
  },
  commercial: {
    company_formation_partnership: { fee: 12000 },
    company_formation_sole: { fee: 8000 },
    contract_review: { fee: 4000 }
  }
} as const;
