// Database utilities for Hoqouqi Platform
// أدوات قاعدة البيانات لمنصة حقوقي

import type { D1Database } from '@cloudflare/workers-types';

// Helper function to format date for SQLite
export function formatDate(date: Date | string): string {
  if (typeof date === 'string') {
    return date;
  }
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

// Helper function to generate unique case number
export function generateCaseNumber(caseType: string): string {
  const prefix = caseType.toUpperCase().slice(0, 4);
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${year}-${random}`;
}

// Calculate lawyer score based on various metrics
export function calculateLawyerScore(lawyer: {
  success_rate: number;
  avg_rating: number;
  total_reviews: number;
  avg_response_time: number;
  years_of_experience: number;
  bar_level: string;
  is_premium: number;
  total_cases: number;
}): number {
  let score = 0;
  
  // Success rate (30%)
  score += lawyer.success_rate * 0.3;
  
  // Client satisfaction (25%)
  score += (lawyer.avg_rating / 5) * 100 * 0.25;
  
  // Response time (15%) - faster is better, max 100 points if < 15 min
  const responseScore = Math.max(0, 100 - (lawyer.avg_response_time / 2));
  score += responseScore * 0.15;
  
  // Professionalism bonus (15%)
  let profScore = 50;
  if (lawyer.is_premium) profScore += 20;
  if (lawyer.total_reviews > 50) profScore += 15;
  if (lawyer.total_cases > 100) profScore += 15;
  score += profScore * 0.15;
  
  // Experience (10%)
  const expScore = Math.min(100, lawyer.years_of_experience * 6);
  score += expScore * 0.1;
  
  // Bar level bonus (5%)
  const barLevelScores: Record<string, number> = {
    general: 40,
    primary: 60,
    appeal: 80,
    cassation: 100
  };
  score += (barLevelScores[lawyer.bar_level] || 40) * 0.05;
  
  return Math.round(score);
}

// Calculate match score for smart matching
export function calculateMatchScore(
  lawyer: {
    primary_specialization: string;
    secondary_specializations: string | null;
    governorate: string;
    success_rate: number;
    avg_rating: number;
    years_of_experience: number;
    min_consultation_fee: number;
  },
  criteria: {
    case_type: string;
    governorate: string;
    budget_max?: number;
  },
  specializationSuccessRate?: number
): { score: number; reasons: string[] } {
  let score = 0;
  const reasons: string[] = [];
  
  // Specialization match (40%)
  const secondarySpecs = lawyer.secondary_specializations 
    ? JSON.parse(lawyer.secondary_specializations) 
    : [];
  
  if (lawyer.primary_specialization === criteria.case_type) {
    score += 40;
    reasons.push('تخصص رئيسي مطابق');
  } else if (secondarySpecs.includes(criteria.case_type)) {
    score += 25;
    reasons.push('تخصص فرعي مطابق');
  }
  
  // Location match (20%)
  if (lawyer.governorate === criteria.governorate) {
    score += 20;
    reasons.push('نفس المحافظة');
  }
  
  // Success rate in this type (20%)
  if (specializationSuccessRate) {
    const successScore = specializationSuccessRate * 0.2;
    score += successScore;
    if (specializationSuccessRate > 80) {
      reasons.push(`نسبة نجاح عالية (${specializationSuccessRate.toFixed(0)}%)`);
    }
  } else {
    score += lawyer.success_rate * 0.2;
  }
  
  // Rating (10%)
  score += (lawyer.avg_rating / 5) * 10;
  if (lawyer.avg_rating >= 4.5) {
    reasons.push('تقييم ممتاز');
  }
  
  // Experience (10%)
  const expScore = Math.min(10, lawyer.years_of_experience / 2);
  score += expScore;
  if (lawyer.years_of_experience >= 10) {
    reasons.push(`خبرة ${lawyer.years_of_experience} سنة`);
  }
  
  // Budget fit bonus
  if (criteria.budget_max && lawyer.min_consultation_fee <= criteria.budget_max) {
    score += 5;
    reasons.push('ضمن الميزانية');
  }
  
  return { score: Math.min(100, Math.round(score)), reasons };
}

// Pagination helper
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationResult {
  offset: number;
  limit: number;
  page: number;
}

export function paginate(params: PaginationParams): PaginationResult {
  const page = Math.max(1, params.page || 1);
  const limit = Math.min(50, Math.max(1, params.limit || 10));
  const offset = (page - 1) * limit;
  
  return { offset, limit, page };
}

// Build dynamic WHERE clause
export function buildWhereClause(
  conditions: Record<string, any>,
  mappings?: Record<string, string>
): { clause: string; values: any[] } {
  const parts: string[] = [];
  const values: any[] = [];
  
  for (const [key, value] of Object.entries(conditions)) {
    if (value === undefined || value === null || value === '') continue;
    
    const column = mappings?.[key] || key;
    
    if (typeof value === 'string' && value.includes('%')) {
      parts.push(`${column} LIKE ?`);
      values.push(value);
    } else if (Array.isArray(value)) {
      parts.push(`${column} IN (${value.map(() => '?').join(', ')})`);
      values.push(...value);
    } else {
      parts.push(`${column} = ?`);
      values.push(value);
    }
  }
  
  return {
    clause: parts.length > 0 ? `WHERE ${parts.join(' AND ')}` : '',
    values
  };
}

// Build ORDER BY clause
export function buildOrderByClause(
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'desc',
  allowedColumns: string[] = []
): string {
  if (!sortBy) return '';
  
  // Validate column name to prevent SQL injection
  if (allowedColumns.length > 0 && !allowedColumns.includes(sortBy)) {
    return '';
  }
  
  const order = sortOrder.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
  return `ORDER BY ${sortBy} ${order}`;
}

// Platform fee calculation
export function calculatePlatformFee(amount: number, isPremium: boolean): {
  platformFee: number;
  lawyerAmount: number;
  feePercentage: number;
} {
  const feePercentage = isPremium ? 8 : 12;
  const platformFee = Math.round(amount * (feePercentage / 100));
  const lawyerAmount = amount - platformFee;
  
  return { platformFee, lawyerAmount, feePercentage };
}

// Estimate case duration based on type
export function estimateCaseDuration(caseType: string, urgency: string): {
  minDays: number;
  maxDays: number;
  display: string;
} {
  const durations: Record<string, { min: number; max: number }> = {
    criminal: { min: 90, max: 365 },
    civil: { min: 120, max: 540 },
    family: { min: 90, max: 270 },
    commercial: { min: 60, max: 365 },
    administrative: { min: 90, max: 365 },
    labor: { min: 60, max: 180 },
    sharia: { min: 30, max: 180 }
  };
  
  const base = durations[caseType] || { min: 90, max: 365 };
  
  // Adjust for urgency
  const multiplier = urgency === 'urgent' ? 0.8 : urgency === 'medium' ? 0.9 : 1;
  const minDays = Math.round(base.min * multiplier);
  const maxDays = Math.round(base.max * multiplier);
  
  // Format display
  const minMonths = Math.round(minDays / 30);
  const maxMonths = Math.round(maxDays / 30);
  const display = `${minMonths}-${maxMonths} شهر`;
  
  return { minDays, maxDays, display };
}

// Estimate fee range based on case type
export function estimateFeeRange(
  caseType: string,
  caseCategory: string,
  barLevel: string
): { min: number; max: number } {
  // Base fees
  const baseFees: Record<string, Record<string, { min: number; max: number }>> = {
    criminal: {
      assault: { min: 3500, max: 5000 },
      theft: { min: 3500, max: 5000 },
      fraud: { min: 4000, max: 8000 },
      drugs: { min: 12000, max: 20000 },
      murder: { min: 20000, max: 40000 }
    },
    civil: {
      contracts: { min: 5000, max: 15000 },
      property: { min: 10000, max: 30000 },
      compensation: { min: 8000, max: 20000 }
    },
    family: {
      divorce: { min: 3500, max: 7000 },
      khula: { min: 5000, max: 8000 },
      custody: { min: 3000, max: 6000 },
      alimony: { min: 3500, max: 6000 }
    },
    commercial: {
      company_formation: { min: 8000, max: 15000 },
      contracts: { min: 5000, max: 20000 },
      disputes: { min: 15000, max: 40000 }
    },
    administrative: {
      employee_disputes: { min: 5000, max: 12000 },
      compensation: { min: 5000, max: 15000 }
    },
    labor: {
      wages: { min: 3000, max: 8000 },
      unfair_dismissal: { min: 4000, max: 10000 }
    }
  };
  
  const categoryFees = baseFees[caseType]?.[caseCategory] || 
                       baseFees[caseType]?.['default'] ||
                       { min: 5000, max: 15000 };
  
  // Adjust for bar level
  const levelMultipliers: Record<string, number> = {
    general: 0.7,
    primary: 0.85,
    appeal: 1,
    cassation: 1.3
  };
  
  const multiplier = levelMultipliers[barLevel] || 1;
  
  return {
    min: Math.round(categoryFees.min * multiplier),
    max: Math.round(categoryFees.max * multiplier)
  };
}
