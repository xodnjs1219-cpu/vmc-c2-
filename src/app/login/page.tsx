"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, Mail, Lock, ArrowLeft } from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";

type LoginPageProps = {
  params: Promise<Record<string, never>>;
};

export default function LoginPage({ params }: LoginPageProps) {
  void params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh, isAuthenticated } = useCurrentUser();
  const [formState, setFormState] = useState({ email: "", password: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      const redirectedFrom = searchParams.get("redirectedFrom") ?? "/dashboard";
      router.replace(redirectedFrom);
    }
  }, [isAuthenticated, router, searchParams]);

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = event.target;
      setFormState((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  const handleSubmit = useCallback(
    async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setIsSubmitting(true);
      setErrorMessage(null);
      const supabase = getSupabaseBrowserClient();

      try {
        const result = await supabase.auth.signInWithPassword({
          email: formState.email,
          password: formState.password,
        });

        const nextAction = result.error
          ? result.error.message ?? "로그인에 실패했습니다."
          : ("success" as const);

        if (nextAction === "success") {
          await refresh();
          const redirectedFrom = searchParams.get("redirectedFrom") ?? "/dashboard";
          router.replace(redirectedFrom);
        } else {
          setErrorMessage(nextAction);
        }
      } catch (error) {
        setErrorMessage("로그인 처리 중 오류가 발생했습니다.");
      } finally {
        setIsSubmitting(false);
      }
    },
    [formState.email, formState.password, refresh, router, searchParams]
  );

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800">
      <div className="container mx-auto flex min-h-screen max-w-6xl items-center justify-center px-6 py-12">
        <div className="w-full max-w-5xl">
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-sm text-slate-400 transition hover:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" />
              홈으로 돌아가기
            </Link>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex flex-col justify-center">
              <div className="mb-8">
                <Link href="/" className="inline-flex items-center gap-2 mb-6">
                  <GraduationCap className="h-8 w-8 text-blue-400" />
                  <span className="text-xl font-bold text-white">VMC Learning</span>
                </Link>
                <h1 className="text-3xl font-bold text-white mb-2">
                  다시 오신 것을 환영합니다
                </h1>
                <p className="text-slate-400">
                  계정에 로그인하여 학습을 계속하세요
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm"
              >
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-200">
                      이메일
                    </Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        name="email"
                        autoComplete="email"
                        required
                        value={formState.email}
                        onChange={handleChange}
                        placeholder="your@email.com"
                        className="border-slate-700 bg-slate-800/50 pl-10 text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-200">
                      비밀번호
                    </Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <Input
                        id="password"
                        type="password"
                        name="password"
                        autoComplete="current-password"
                        required
                        value={formState.password}
                        onChange={handleChange}
                        placeholder="••••••••"
                        className="border-slate-700 bg-slate-800/50 pl-10 text-white placeholder:text-slate-500"
                      />
                    </div>
                  </div>

                  {errorMessage ? (
                    <Alert variant="destructive" className="bg-red-950/50 border-red-900 text-red-300">
                      {errorMessage}
                    </Alert>
                  ) : null}

                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-blue-500 hover:bg-blue-600"
                    size="lg"
                  >
                    {isSubmitting ? "로그인 중..." : "로그인"}
                  </Button>

                  <div className="text-center text-sm text-slate-400">
                    계정이 없으신가요?{" "}
                    <Link
                      href="/signup"
                      className="font-medium text-blue-400 hover:text-blue-300"
                    >
                      회원가입
                    </Link>
                  </div>
                </div>
              </form>
            </div>

            <div className="hidden md:block">
              <div className="relative h-full min-h-[600px] overflow-hidden rounded-xl border border-slate-800">
                <Image
                  src="https://picsum.photos/seed/login-learning/800/900"
                  alt="로그인"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    학습의 모든 순간을 함께
                  </h3>
                  <p className="text-slate-300">
                    전문 강사진과 함께하는 체계적인 학습 경험
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
