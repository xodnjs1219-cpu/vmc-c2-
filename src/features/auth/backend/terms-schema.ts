import { z } from 'zod';

// Terms response schema
export const TermsResponseSchema = z.object({
  id: z.string().uuid(),
  version: z.string(),
  content: z.string(),
  isRequired: z.boolean(),
});

export type TermsResponse = z.infer<typeof TermsResponseSchema>;

// Terms list response
export const TermsListResponseSchema = z.array(TermsResponseSchema);

export type TermsListResponse = z.infer<typeof TermsListResponseSchema>;

// Database terms row schema
export const TermsRowSchema = z.object({
  id: z.string().uuid(),
  version: z.string(),
  content: z.string(),
  is_required: z.boolean(),
  created_at: z.string(),
});

export type TermsRow = z.infer<typeof TermsRowSchema>;
