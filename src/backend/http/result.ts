import type { ContentfulStatusCode } from 'hono/utils/http-status';

// Success result type
export type SuccessResult<TData> = {
  success: true;
  data: TData;
};

// Failure result type
export type FailureResult<TCode extends string = string> = {
  success: false;
  error: TCode;
  message: string;
};

// Result type (union of success and failure)
export type Result<TData, TCode extends string = string> =
  | SuccessResult<TData>
  | FailureResult<TCode>;

// Helper to create a success result
export const success = <TData>(data: TData): SuccessResult<TData> => ({
  success: true,
  data,
});

// Helper to create a failure result
export const failure = <TCode extends string>(
  error: TCode,
  message: string
): FailureResult<TCode> => ({
  success: false,
  error,
  message,
});

// Type guard to check if result is failure
export const isFailure = <TData, TCode extends string>(
  result: Result<TData, TCode>
): result is FailureResult<TCode> => {
  return !result.success;
};
