"use client";

import { useCallback, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BookOpen,
  GraduationCap,
  Users,
  TrendingUp,
  ArrowRight,
  CheckCircle,
  LogOut,
} from "lucide-react";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser-client";
import { useCurrentUser } from "@/features/auth/hooks/useCurrentUser";
import { useUserProfile } from "@/features/auth/hooks/useUserProfile";
import { Button } from "@/components/ui/button";
import { InstructorDashboardView } from "@/features/dashboard/components/instructor-dashboard-view";
import { LearnerDashboardView } from "@/features/dashboard/components/learner-dashboard-view";
import { Skeleton } from "@/components/ui/skeleton";

const features = [
  {
    icon: <BookOpen className="h-6 w-6" />,
    title: "다양한 코스",
    description: "전문가가 준비한 체계적인 학습 코스를 만나보세요",
  },
  {
    icon: <GraduationCap className="h-6 w-6" />,
    title: "과제 관리",
    description: "실시간 피드백과 함께하는 효과적인 과제 관리 시스템",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "강사와 학습자",
    description: "강사는 코스를 개설하고, 학습자는 자유롭게 수강 신청",
  },
  {
    icon: <TrendingUp className="h-6 w-6" />,
    title: "학습 진행률",
    description: "나만의 대시보드에서 학습 현황을 한눈에 확인",
  },
];

const stats = [
  { label: "활성 코스", value: "100+" },
  { label: "등록 학습자", value: "5,000+" },
  { label: "전문 강사", value: "50+" },
  { label: "완료된 과제", value: "10,000+" },
];

export default function Home() {
  const { user, isAuthenticated, isLoading, refresh } = useCurrentUser();
  const { data: profile, isLoading: profileLoading } = useUserProfile();
  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    await refresh();
    router.replace("/");
  }, [refresh, router]);

  const navigationActions = useMemo(() => {
    if (isLoading) {
      return (
        <div className="flex items-center gap-3">
          <div className="h-10 w-24 animate-pulse rounded-md bg-slate-700" />
          <div className="h-10 w-24 animate-pulse rounded-md bg-slate-700" />
        </div>
      );
    }

    if (isAuthenticated && user) {
      return (
        <div className="flex items-center gap-3">
          <Button asChild variant="outline" className="border-slate-600 text-slate-200 hover:border-slate-400 hover:bg-slate-800">
            <Link href="/dashboard">대시보드</Link>
          </Button>
          <Button
            onClick={handleSignOut}
            variant="secondary"
            className="bg-slate-100 text-slate-900 hover:bg-white"
          >
            <LogOut className="mr-2 h-4 w-4" />
            로그아웃
          </Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-3">
        <Button asChild variant="outline" className="border-slate-600 text-slate-200 hover:border-slate-400 hover:bg-slate-800">
          <Link href="/login">로그인</Link>
        </Button>
        <Button asChild className="bg-white text-slate-900 hover:bg-slate-100">
          <Link href="/signup">회원가입</Link>
        </Button>
      </div>
    );
  }, [handleSignOut, isAuthenticated, isLoading, user]);

  // 로그인한 사용자는 역할별 대시보드 표시
  if (isAuthenticated && !profileLoading && profile) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <GraduationCap className="h-8 w-8 text-blue-600" />
                <span className="text-xl font-bold text-slate-900">VMC Learning</span>
              </Link>
              <div className="flex items-center gap-3">
                <Button asChild variant="ghost">
                  <Link href="/dashboard">대시보드</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/courses">코스</Link>
                </Button>
                <Button asChild variant="ghost">
                  <Link href="/grades">성적</Link>
                </Button>
                <Button
                  onClick={handleSignOut}
                  variant="ghost"
                  className="text-slate-600 hover:text-slate-900"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  로그아웃
                </Button>
              </div>
            </div>
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {profile.role === "instructor" ? (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">
                  안녕하세요, {profile.name}님 👋
                </h1>
                <p className="mt-2 text-lg text-slate-600">
                  강사 대시보드에 오신 것을 환영합니다
                </p>
              </div>
              <InstructorDashboardView />
            </>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900">
                  안녕하세요, {profile.name}님 👋
                </h1>
                <p className="mt-2 text-lg text-slate-600">
                  학습 대시보드에 오신 것을 환영합니다
                </p>
              </div>
              <LearnerDashboardView />
            </>
          )}
        </main>
      </div>
    );
  }

  // 로딩 중 표시
  if (isAuthenticated && profileLoading) {
    return (
      <div className="min-h-screen bg-slate-50">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-4">
            <Skeleton className="h-10 w-48" />
          </div>
        </header>
        <main className="mx-auto max-w-7xl px-4 py-8">
          <Skeleton className="h-8 w-64 mb-4" />
          <Skeleton className="h-6 w-96 mb-8" />
          <Skeleton className="h-64 w-full mb-4" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  // 로그인하지 않은 사용자는 랜딩 페이지 표시
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white">
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-blue-400" />
              <span className="text-xl font-bold">VMC Learning</span>
            </Link>
            {navigationActions}
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-7xl px-6 py-20 text-center md:py-32">
          <div className="mx-auto max-w-3xl space-y-8">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
              배움의 즐거움을
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                함께 나누는 공간
              </span>
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-300 md:text-xl">
              전문 강사진의 체계적인 코스와 실시간 피드백으로
              <br />
              당신의 학습 목표를 달성하세요
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              {isAuthenticated ? (
                <>
                  <Button asChild size="lg" className="bg-blue-500 hover:bg-blue-600">
                    <Link href="/courses">
                      코스 둘러보기
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800">
                    <Link href="/dashboard">내 대시보드</Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild size="lg" className="bg-blue-500 hover:bg-blue-600">
                    <Link href="/signup">
                      지금 시작하기
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800">
                    <Link href="/courses">코스 둘러보기</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>

        <section className="border-t border-slate-800 bg-slate-900/30 py-12">
          <div className="mx-auto max-w-7xl px-6">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl font-bold text-blue-400 md:text-4xl">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-sm text-slate-400">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              왜 VMC Learning을 선택해야 할까요?
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              효과적인 학습을 위한 모든 기능을 제공합니다
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-slate-700 hover:bg-slate-900"
              >
                <div className="mb-4 inline-flex rounded-lg bg-blue-500/10 p-3 text-blue-400 transition group-hover:bg-blue-500/20">
                  {feature.icon}
                </div>
                <h3 className="mb-2 text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-t border-slate-800 bg-slate-900/30 py-20">
          <div className="mx-auto max-w-4xl px-6 text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              지금 바로 시작하세요
            </h2>
            <p className="mt-4 text-lg text-slate-400">
              {isAuthenticated
                ? "새로운 코스를 탐색하고 학습을 시작해보세요"
                : "회원가입하고 무료로 다양한 코스를 경험해보세요"}
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              {isAuthenticated ? (
                <Button asChild size="lg" className="bg-blue-500 hover:bg-blue-600">
                  <Link href="/courses">
                    코스 탐색하기
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button asChild size="lg" className="bg-blue-500 hover:bg-blue-600">
                    <Link href="/signup">
                      무료로 시작하기
                      <CheckCircle className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-slate-600 text-slate-200 hover:bg-slate-800">
                    <Link href="/login">이미 계정이 있으신가요?</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/50 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-6 w-6 text-blue-400" />
              <span className="font-semibold">VMC Learning</span>
            </div>
            <p className="text-sm text-slate-400">
              © 2025 VMC Learning. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
