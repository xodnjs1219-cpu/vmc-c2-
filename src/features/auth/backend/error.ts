export const signupErrorCodes = {
  invalidRequest: 'SIGNUP_INVALID_REQUEST',
  emailAlreadyExists: 'SIGNUP_EMAIL_ALREADY_EXISTS',
  authCreationFailed: 'SIGNUP_AUTH_CREATION_FAILED',
  profileCreationFailed: 'SIGNUP_PROFILE_CREATION_FAILED',
  termsNotFound: 'SIGNUP_TERMS_NOT_FOUND',
  termsAgreementFailed: 'SIGNUP_TERMS_AGREEMENT_FAILED',
  transactionFailed: 'SIGNUP_TRANSACTION_FAILED',
} as const;

type SignupErrorValue =
  (typeof signupErrorCodes)[keyof typeof signupErrorCodes];

export type SignupServiceError = SignupErrorValue;
