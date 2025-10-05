import { useMutation } from '@tanstack/react-query';
import { apiClient, extractApiErrorMessage } from '@/lib/remote/api-client';
import type { SignupRequest, SignupResponse } from '@/features/auth/lib/dto';

export const useSignup = () => {
  return useMutation({
    mutationFn: async (request: SignupRequest): Promise<SignupResponse> => {
      const response = await apiClient.post<SignupResponse>(
        '/auth/signup',
        request,
      );
      return response.data;
    },
    onError: (error) => {
      const message = extractApiErrorMessage(error, '회원가입에 실패했습니다');
      console.error('Signup error:', message);
    },
  });
};
