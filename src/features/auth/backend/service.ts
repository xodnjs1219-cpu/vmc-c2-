import type { SupabaseClient } from '@supabase/supabase-js';
import { failure, success, type HandlerResult } from '@/backend/http/response';
import { normalizePhone } from '@/lib/validation';
import type { SignupRequest, SignupResponse } from './schema';
import { signupErrorCodes, type SignupServiceError } from './error';

export const signup = async (
  client: SupabaseClient,
  request: SignupRequest,
): Promise<HandlerResult<SignupResponse, SignupServiceError, unknown>> => {
  const normalizedPhone = normalizePhone(request.phone);

  // 1. Check for existing email (explicit check)
  const { data: existingUser } = await client.auth.admin.listUsers();
  const emailExists = existingUser?.users.some((u) => u.email === request.email);

  if (emailExists) {
    return failure(
      409,
      signupErrorCodes.emailAlreadyExists,
      '이미 사용 중인 이메일입니다',
    );
  }

  // 2. Fetch required terms
  const { data: requiredTerms, error: termsError } = await client
    .from('terms')
    .select('id')
    .eq('is_required', true);

  if (termsError || !requiredTerms || requiredTerms.length === 0) {
    return failure(
      500,
      signupErrorCodes.termsNotFound,
      '필수 약관을 찾을 수 없습니다',
    );
  }

  // 3. Create auth account (transaction start point)
  const { data: authData, error: authError } = await client.auth.admin.createUser({
    email: request.email,
    password: request.password,
    email_confirm: true, // Auto-confirm email
  });

  if (authError || !authData.user) {
    return failure(
      500,
      signupErrorCodes.authCreationFailed,
      '회원가입에 실패했습니다',
    );
  }

  const userId = authData.user.id;

  // 4. Create profile
  const { error: profileError } = await client.from('profiles').insert({
    id: userId,
    role: request.role,
    name: request.name,
    phone: normalizedPhone,
  });

  if (profileError) {
    // Rollback: Delete auth account
    await client.auth.admin.deleteUser(userId);
    return failure(
      500,
      signupErrorCodes.profileCreationFailed,
      '프로필 생성에 실패했습니다',
    );
  }

  // 5. Save terms agreement history
  const termsAgreements = requiredTerms.map((term) => ({
    user_id: userId,
    term_id: term.id,
  }));

  const { error: agreementError } = await client
    .from('terms_agreements')
    .insert(termsAgreements);

  if (agreementError) {
    // Rollback: Delete profile and auth account
    await client.from('profiles').delete().eq('id', userId);
    await client.auth.admin.deleteUser(userId);
    return failure(
      500,
      signupErrorCodes.termsAgreementFailed,
      '약관 동의 이력 저장에 실패했습니다',
    );
  }

  // 6. Create session tokens
  const { data: sessionData, error: sessionError } =
    await client.auth.signInWithPassword({
      email: request.email,
      password: request.password,
    });

  if (sessionError || !sessionData.session) {
    // Rollback: Delete all data
    await client.from('terms_agreements').delete().eq('user_id', userId);
    await client.from('profiles').delete().eq('id', userId);
    await client.auth.admin.deleteUser(userId);
    return failure(
      500,
      signupErrorCodes.transactionFailed,
      '토큰 생성에 실패했습니다',
    );
  }

  return success(
    {
      userId,
      email: request.email,
      role: request.role,
      accessToken: sessionData.session.access_token,
      refreshToken: sessionData.session.refresh_token,
    },
    201,
  );
};
