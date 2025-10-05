import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import type { TermsListResponse } from './terms-schema';
import { signupErrorCodes, type SignupServiceError } from './error';

export const getRequiredTerms = async (
  client: SupabaseClient,
): Promise<HandlerResult<TermsListResponse, SignupServiceError, unknown>> => {
  const { data, error } = await client
    .from('terms')
    .select('id, version, content, is_required, created_at')
    .eq('is_required', true)
    .order('created_at', { ascending: true });

  if (error) {
    return failure(500, signupErrorCodes.termsNotFound, '약관을 불러오는데 실패했습니다');
  }

  if (!data || data.length === 0) {
    return failure(404, signupErrorCodes.termsNotFound, '필수 약관을 찾을 수 없습니다');
  }

  const terms = data.map((term) => ({
    id: term.id,
    version: term.version,
    content: term.content,
    isRequired: term.is_required,
  }));

  return success(terms);
};
