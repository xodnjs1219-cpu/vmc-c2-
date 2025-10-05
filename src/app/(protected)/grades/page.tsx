"use client";

import { useGrades } from "@/features/grade/hooks/useGrades";
import { CourseGradeCard } from "@/features/grade/components/course-grade-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";

type GradesPageProps = {
  params: Promise<Record<string, never>>;
};

export default function GradesPage({ params }: GradesPageProps) {
  void params;
  const { data, isLoading, error } = useGrades();

  if (isLoading) {
    return (
      <div className="container mx-auto space-y-6 px-4 py-8">
        <h1 className="text-3xl font-bold">내 성적</h1>
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold">내 성적</h1>
        <Alert variant="destructive" className="mt-6">
          <AlertDescription>
            성적을 불러오는 중 오류가 발생했습니다. 잠시 후 다시 시도하세요.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 px-4 py-8">
      <header>
        <h1 className="text-3xl font-bold">내 성적</h1>
        <p className="mt-2 text-slate-500">
          수강 중인 코스의 과제별 성적과 피드백을 확인하세요
        </p>
      </header>

      {data?.courses.length === 0 ? (
        <Alert>
          <AlertDescription>
            수강 중인 코스가 없습니다. 코스를 수강 신청하고 과제를 제출하세요.
          </AlertDescription>
        </Alert>
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
