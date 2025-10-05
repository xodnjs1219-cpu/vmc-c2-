"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { GraduationCap, ArrowLeft } from "lucide-react";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { SignupForm } from "@/features/auth/components/signup-form";

type SignupPageProps = {
  params: Promise<Record<string, never>>;
};

export default function SignupPage({ params }: SignupPageProps) {
  void params;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated } = useCurrentUser();

  useEffect(() => {
    if (isAuthenticated) {
      const redirectedFrom = searchParams.get("redirectedFrom") ?? "/dashboard";
      router.replace(redirectedFrom);
    }
  }, [isAuthenticated, router, searchParams]);

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
                  학습 여정을 시작하세요
                </h1>
                <p className="text-slate-400">
                  역할을 선택하고 전문적인 학습 경험을 시작하세요
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-8 backdrop-blur-sm">
                <SignupForm />
                <div className="mt-6 text-center text-sm text-slate-400">
                  이미 계정이 있으신가요?{" "}
                  <Link
                    href="/login"
                    className="font-medium text-blue-400 hover:text-blue-300"
                  >
                    로그인
                  </Link>
                </div>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="relative h-full min-h-[600px] overflow-hidden rounded-xl border border-slate-800">
                <Image
                  src="https://picsum.photos/seed/signup-learning/800/900"
                  alt="회원가입"
                  fill
                  className="object-cover"
                  priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent" />
                <div className="absolute bottom-8 left-8 right-8">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    당신의 성장을 응원합니다
                  </h3>
                  <p className="text-slate-300">
                    수천 명의 학습자와 전문 강사가 함께하는 커뮤니티
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
