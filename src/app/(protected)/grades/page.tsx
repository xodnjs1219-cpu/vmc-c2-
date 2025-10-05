"use client";

import Link from "next/link";
import { BookOpen } from "lucide-react";
import { useGrades } from "@/features/grade/hooks/useGrades";
import { CourseGradeCard } from "@/features/grade/components/course-grade-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

type GradesPageProps = {
  params: Promise<Record<string, never>>;
};

export default function GradesPage({ params }: GradesPageProps) {
  void params;
  const { data, isLoading, error } = useGrades();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="space-y-4">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <header>
          <h1 className="text-3xl font-bold text-slate-900">내 성적</h1>
          <p className="mt-2 text-slate-600">
            수강 중인 코스의 과제별 성적과 피드백을 확인하세요
          </p>
        </header>
        <Alert variant="destructive">
          <AlertDescription>
            성적을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도하세요.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold text-slate-900">내 성적</h1>
        <p className="mt-2 text-slate-600">
          수강 중인 코스의 과제별 성적과 피드백을 확인하세요
        </p>
      </header>

      {data?.courses.length === 0 ? (
        <div className="flex min-h-[400px] flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center">
          <BookOpen className="h-12 w-12 text-slate-400 mb-4" />
          <h3 className="text-lg font-semibold text-slate-900 mb-2">
            수강 중인 코스가 없습니다
          </h3>
          <p className="text-slate-600 mb-6 max-w-md">
            코스를 수강 신청하고 과제를 제출하여 성적을 확인하세요
          </p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/courses">
              코스 둘러보기
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {data?.courses.map((courseGrade) => (
            <CourseGradeCard key={courseGrade.courseId} courseGrade={courseGrade} />
          ))}
        </div>
      )}
    </div>
  );
}
