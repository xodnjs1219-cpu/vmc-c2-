import { z } from 'zod';
import { EMAIL_REGEX, PASSWORD_MIN_LENGTH, PHONE_REGEX } from '@/lib/validation';

// User role enum
export const UserRoleSchema = z.enum(['learner', 'instructor']);
export type UserRole = z.infer<typeof UserRoleSchema>;

// Signup request body schema
export const SignupRequestSchema = z.object({
  email: z
    .string()
    .email('올바른 이메일 형식을 입력하세요')
    .regex(EMAIL_REGEX, '올바른 이메일 형식을 입력하세요'),
  password: z
    .string()
    .min(PASSWORD_MIN_LENGTH, `비밀번호는 최소 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다`),
  role: UserRoleSchema,
  name: z.string().min(1, '이름을 입력하세요'),
  phone: z
    .string()
    .regex(PHONE_REGEX, '올바른 휴대폰번호 형식을 입력하세요'),
  termsAgreed: z.boolean().refine((val) => val === true, {
    message: '필수 약관에 동의해야 합니다',
  }),
});

export type SignupRequest = z.infer<typeof SignupRequestSchema>;

// Signup response schema
export const SignupResponseSchema = z.object({
  userId: z.string().uuid(),
  email: z.string().email(),
  role: UserRoleSchema,
  accessToken: z.string(),
  refreshToken: z.string(),
});

export type SignupResponse = z.infer<typeof SignupResponseSchema>;

// Database row schemas
export const ProfileRowSchema = z.object({
  id: z.string().uuid(),
  role: z.string(),
  name: z.string(),
  phone: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ProfileRow = z.infer<typeof ProfileRowSchema>;

export const TermRowSchema = z.object({
  id: z.string().uuid(),
  version: z.string(),
  content: z.string(),
  is_required: z.boolean(),
  created_at: z.string(),
});

export type TermRow = z.infer<typeof TermRowSchema>;
